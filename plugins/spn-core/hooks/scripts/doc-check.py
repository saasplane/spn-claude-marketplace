#!/usr/bin/env python3
"""Check SaaS Plane documents against the bars the book states mechanically.

Source of truth: the foundation book — 02-document.md rule 9 (RD.GOV.008), rules 11-12
(RD.DOCS.031, the one voice; RD.DOCS.043, its reach and its measure; RD.DOCS.044, the three
moves that reach the reader), 04-discipline.md § Voice discipline, 05-artifacts.md (the
approach document) and 06-registers.md § Writing a row. This script checks only what a script
CAN check; the register itself is judgement.

Calibrated to the rule, never to the corpus (decision RD.DOCS.043: the check reads the row's
numbers, never the corpus's own average). Over prose only — records are exempt, headings and
derived chrome are not prose — the numbers are:

  around fifteen words a sentence   an average past 18 is SOFT; past 24 is RULE
  none past thirty                  any sentence past 30 words is RULE
  *you* present                     8+ sentences with no second person is RULE;
                                    fewer than one *you* in twelve sentences is SOFT
  a register row stays a record     a cell sentence past 25 words is RULE, and so is a bare
                                    *you* inside a row — a record is never warmed
  the seat's share of reach         a share under the bar is SOFT: 30 % on an overview, an
                                    approach or a report, 25 % on a README face, 15 % on a
                                    chapter or a concept — where normative sentences sit
                                    outside the count (RD.DOCS.044). A row carries no bar

Reach is the share of prose sentences that reach the reader by any of the three moves, and a
share is what you measure — an occurrence count falls every time a long sentence is split.
Every reach finding is SOFT for now: the corpus is swept for length, not yet for reach.

A finding is a finding whatever the file's age. The fix is one of four moves — split it,
say *you*, define the term, land it on your reader — never a shorter sentence.

  hook   :  doc-check.py --stdin               (one file, from PreToolUse JSON on stdin; the
                                             finding goes out as additionalContext + systemMessage)
  sweep  :  doc-check.py <path> [...]          (findings per file, then the rates per root)
  rates  :  doc-check.py --summary <path> ...  (the rates only — the number a tranche moves)
"""
import html as _html
import json, os, re, shlex, sys

# Only sets that GROW. RD.GOV.008 keeps the count where it carries a ruling: "if adding a
# member would be an ordinary decision entry, drop the count; if it would be a redesign, keep
# it." Scopes, kinds, nouns, flows, seats and lenses are closed by a decision — a count there
# is load-bearing and must not be flagged. Decisions, findings and open items are not.
CARD = (r'\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|'
        r'fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+'
        r'(decisions|items|questions|findings|blockers|gaps|defects|open items|todos|tasks)\b')
ABOUT = r'\b(the reader|one must|one should|the user is expected|it is recommended that)\b'

# RD.DOCS.043 — the measure. Second person is whole-word and case-insensitive. Longest form
# first, or `your` claims the front of `yours` and the rest never matches. `yours` and
# `yourselves` were missed until D60-A, where a swept sentence read as reaching nobody.
YOU = re.compile(r"\b(?:you['’](?:re|ll|ve)|yourselves|yourself|yours|your|you)\b", re.I)
# A row may MENTION the word as a term — *you* in italics, or in backticks — and that is not
# warming. RD.DOCS.031 and RD.DOCS.043 both do.
YOU_AS_TERM = re.compile(r"\*(?:you['’](?:re|ll|ve)|yourself|your|you)\*|`[^`]*`", re.I)
AVG_SOFT, AVG_RULE, LONG, ROW_LONG, YOU_MIN_N, YOU_PER = 18, 24, 30, 25, 8, 12

# RD.DOCS.044 — reaching the reader has three moves, and a script sees two of them: the
# reader as subject, which YOU already finds, and the imperative, which opens the sentence
# with its verb. The beneficiary clause is judgement, so the number a script produces is a
# FLOOR. The verb list is closed and deliberately short — every member is a word this corpus
# almost never opens a sentence with as a noun, which is why `state`, `name`, `report` and
# `list` are absent. A negative imperative (*never write a live count*) opens with an adverb
# rather than a verb and is not counted, which lowers the floor again.
IMPERATIVE_VERBS = ('add|apply|ask|avoid|choose|cite|configure|convene|copy|create|declare|'
                    'define|delete|edit|find|fix|follow|generate|give|install|keep|leave|load|'
                    'look|make|open|pass|prefer|prove|put|read|regenerate|remove|resolve|run|'
                    'say|scaffold|see|send|set|skip|split|start|stop|take|treat|use|verify|'
                    'wear|write')
IMPERATIVE = re.compile(r'^[^A-Za-z]*(?:' + IMPERATIVE_VERBS + r')\b', re.I)
# MUST-grammar is uppercase by rule, so the match is case-sensitive: a lowercase *may* is
# ordinary prose and excluding it would empty the denominator.
NORMATIVE = re.compile(r'\b(?:MUST NOT|MUST|SHOULD NOT|SHOULD|MAY)\b')
# The bar per seat, as a percentage. A register row has none — it is a record (RD.DOCS.043).
REACH_BAR = {'artifact-html': 30, 'readme': 25, 'chapter': 15, 'concept': 15}
REACH_MIN_N = 8

# RD.DOCS.040 — the suffix names the kind, and the set is closed.
POCKET_KIND = {'approaches': '-approach.html', 'overviews': '-overview.html'}
NODE_MANIFESTS = ('spkind.json', 'spinfrapkg.json')
SKIP = {'node_modules', '.git', 'dist', 'build', '.nx', 'coverage', 'tool-results', '.output'}

MD_LINK = re.compile(r'!?\[([^\]]*)\]\([^)]*\)')
MD_BLOCK_START = re.compile(r'#{1,6}\s|[-*+]\s|\d+[.)]\s')
MD_HEADING = re.compile(r'#{1,6}\s')
HTML_BLOCK_END = re.compile(r'</(?:p|h[1-6]|li|dt|dd|blockquote|figcaption|div|section|article|'
                            r'header|footer|nav|aside|summary|details)\s*>|<(?:br|hr)\b[^>]*>', re.I)
SENT_END = re.compile(r'(?<=[.!?])[)"\'”’\]]*\s+')
BLOCK_BREAK = re.compile(r'\n\s*\n')
TABLE_SEP = re.compile(r'^\|?\s*:?-{3,}')


def structural(path):
    """Placement errors a script CAN settle. Both are the wrong turn a partner takes first."""
    out = []
    d = os.path.dirname(os.path.abspath(path))
    base = os.path.basename(path)

    # RD.DOCS.012 — a concept belongs to a repo root, never to a node.
    if base == 'CONCEPT.md':
        has_node = any(os.path.exists(os.path.join(d, m)) for m in NODE_MANIFESTS)
        if has_node and not os.path.exists(os.path.join(d, 'sprepo.json')):
            out.append(('BLOCK', 'CONCEPT.md sits beside a node manifest — RD.DOCS.012: a concept '
                                 'belongs to a repo root. Ideating a node lands as sections of its '
                                 "repo's concept, never as a file at the node"))

    # RD.DOCS.040 — folder and suffix must agree.
    parts = os.path.abspath(path).replace(os.sep, '/').split('/')
    if 'artifacts' in parts and base.endswith('.html'):
        folder = parts[-2]
        want = POCKET_KIND.get(folder)
        if want and not base.endswith(want):
            other = next((s for f, s in POCKET_KIND.items() if f != folder), '')
            hint = (' — an overview explains, an approach argues; the test is whether options '
                    'were weighed and one chosen') if base.endswith(other) else ''
            out.append(('BLOCK', f'{base} sits in {folder}/ but does not end {want} — RD.DOCS.040: '
                                 f'the suffix names the kind{hint}'))
    return out


def approach_shape(text):
    """Why -> What -> How -> Open -> Deferred, Terms optional first (05-artifacts)."""
    heads = [re.sub(r'<[^>]+>', '', h).strip().split()[0].rstrip(':—-').lower()
             for h in re.findall(r'<h2\b[^>]*>(.*?)</h2>', text, re.S | re.I)
             if re.sub(r'<[^>]+>', '', h).strip()]
    if not heads:
        return []
    # The SKELETON decides the kind. A settled approach legitimately lacks Open, and a
    # closed one lacks Deferred — neither is a routing signal. Why + What + How is.
    missing = [s for s in ('why', 'what', 'how') if s not in heads]
    if missing:
        return [('RULE', 'carries no ' + ' + '.join(missing) + ' — this explains rather than '
                 'argues, so it is an overview: artifacts/overviews/<name>-overview.html '
                 '(RD.DOCS.039 / 040). An approach is Why > What > How > Open > Deferred')]
    return []


def _section(text, name):
    """The body of one <h2> section, to the next <h2>."""
    m = re.search(r'<h2\b[^>]*>\s*(?:<[^>]+>\s*)*' + name + r'\b.*?</h2>(.*?)(?=<h2\b|\Z)',
                  text, re.S | re.I)
    return m.group(1) if m else None


def _cards(body):
    """Cards are h3 OR h4 — the corpus uses h4, and both read as a card to a person."""
    out = []
    for chunk in re.split(r'(?=<h[34]\b)', body):
        t = re.search(r'<h[34]\b[^>]*>(.*?)</h[34]>', chunk, re.S | re.I)
        if t:
            out.append((re.sub(r'<[^>]+>', '', t.group(1)).strip()[:60], chunk[t.end():]))
    return out


def open_cards(text):
    """Open and Deferred carry cards in the agreed shape (refs/decision-cards.md).

    A card with no options is a status update; one with no recommendation makes the reader do
    the analysis twice; a deferred one with no trigger is a question nobody will bring back.
    All three read as progress, which is why they need a checker rather than a convention —
    the failure is invisible to whoever wrote it.

    The card TITLE is excluded from every scan: a card called "options but no recommendation"
    otherwise satisfies the recommendation check by naming it.
    """
    out = []
    body = _section(text, 'Open')
    if body:
        for name, rest in _cards(body):
            if '<table' not in rest:
                out.append(('RULE', f'Open card "{name}" carries no options table — a card with '
                                    f'no options is a status update (refs/decision-cards.md)'))
            elif not re.search(r'recommend|(?:→|&rarr;|&#8594;)\s*(?:<[^>]+>)*\s*\**[A-D]\b',
                               rest, re.I):
                out.append(('RULE', f'Open card "{name}" carries no recommendation — the reader '
                                    f'does the analysis twice (refs/decision-cards.md)'))
    body = _section(text, 'Deferred')
    if body:
        for name, rest in _cards(body):
            # A deferred card keeps its parts AND names what brings it back. "Later" is not a
            # trigger; an event somebody will notice happening is.
            if not re.search(r'\btrigger|\buntil\b|\bonce\b|\bwhen\b|\bbrings? it back\b',
                             rest, re.I):
                out.append(('RULE', f'Deferred card "{name}" names no trigger — what would bring '
                                    f'it back (refs/decision-cards.md)'))
    return out


def overview_shape(text):
    """An overview borrows its outline and carries no argument organs (05-artifacts)."""
    heads = [re.sub(r'<[^>]+>', '', h).strip().split()[0].rstrip(':—-').lower()
             for h in re.findall(r'<h2\b[^>]*>(.*?)</h2>', text, re.S | re.I)
             if re.sub(r'<[^>]+>', '', h).strip()]
    organs = [h for h in heads if h in ('open', 'deferred')]
    if organs:
        return [('RULE', 'overview carries ' + ' + '.join(organs) + ' — those are an argument\'s '
                 'organs. A question found while writing an overview is an approach document '
                 'waiting to be offered, or a register row')]
    return []


def prose_of(text, is_html):
    """Records are exempt — RD.DOCS.031: a warmed record is a defect.

    What comes back is prose with a blank line at every block boundary, so a heading or a list
    item never runs into the paragraph below it and reads as one long sentence. Headings, an
    outline rail, the tag line and the 📖 strip are not prose either — a reader learns from
    none of them.
    """
    if is_html:
        t = re.sub(r'<!--.*?-->', ' ', text, flags=re.S)
        t = re.sub(r'<(table|svg|pre|script|style|nav|h[1-6])\b.*?</\1>', ' ', t, flags=re.S | re.I)
        t = HTML_BLOCK_END.sub('\n\n', t)
        return _html.unescape(re.sub(r'<[^>]+>', ' ', t))
    t = re.sub(r'<!--.*?-->', ' ', text, flags=re.S)
    t = re.sub(r'```.*?```', ' ', t, flags=re.S)
    lines = []
    for l in t.split('\n'):
        # A record inside a blockquote is still a record: strip any '>' quote prefix before
        # deciding. A table row written as "> | a | b |" is a table, not a 60-word sentence.
        s = re.sub(r'^(?:\s*>)+\s*', '', l).strip()
        if s.startswith('|') or s.startswith('📖') or s.startswith('`Lenses:') or MD_HEADING.match(s):
            lines.append('')
            continue
        if MD_BLOCK_START.match(s):
            lines.append('')
        lines.append(l)
    t = MD_LINK.sub(r'\1', '\n'.join(lines))
    t = re.sub(r'\[!(?:NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]', ' ', t)
    return re.sub(r'[*`#>\[\]]', ' ', t)


def words(s):
    """A token is a word when it carries a letter or a digit — an em dash is not one."""
    return [t for t in s.split() if re.search(r'\w', t)]


def sentences(prose):
    """A prose sentence: split on . ! ? plus whitespace and on block boundaries; more than
    three words. Returns (text, word count) pairs."""
    out = []
    for block in BLOCK_BREAK.split(prose):
        for s in SENT_END.split(block):
            n = len(words(s))
            if n > 3:
                out.append((' '.join(s.split()), n))
    return out


def reach(sents, kind):
    """RD.DOCS.044 — how many prose sentences reach the reader, and how many were counted.

    A chapter and a concept keep their normative sentences out of the denominator: a rule
    binds a party and its subject may not move, so the reader is reached in the sentence
    beside it. Every other seat counts every sentence. Returns (reaching, counted).
    """
    counted = [s for s, _ in sents]
    if kind in ('chapter', 'concept'):
        counted = [s for s in counted if not NORMATIVE.search(s)]
    return sum(1 for s in counted if YOU.search(s) or IMPERATIVE.match(s)), len(counted)


def measure(sents, kind='chapter'):
    """The rates a tranche moves (arc finding F12): counts, never a verdict."""
    hit, counted = reach(sents, kind)
    return {'sentences': len(sents),
            'words': sum(n for _, n in sents),
            'past25': sum(1 for _, n in sents if n > 25),
            'past30': sum(1 for _, n in sents if n > LONG),
            'you': sum(len(YOU.findall(s)) for s, _ in sents),
            'reach': hit,
            'counted': counted}


def opening(s, n=6):
    return ' '.join(s.split()[:n]) + '…'


def voice(prose, sents, kind='chapter'):
    """RD.DOCS.043 § Measure, over prose only. Every check here holds on every file."""
    out = []
    hits = re.findall(CARD, prose, re.I)
    if hits:
        eg = ', '.join(f'{a} {b}' for a, b in hits[:4])
        out.append(('RULE', f'{len(hits)} cardinality-in-prose ({eg}) — RD.GOV.008: name a set '
                            f'by its rule, not its count'))
    n_about = len(re.findall(ABOUT, prose, re.I))
    if n_about:
        out.append(('RULE', f'{n_about} construction(s) written about the reader, not to them '
                            f'— RD.DOCS.031 talks to the reader · say *you*'))
    if not sents:
        return out
    n = len(sents)
    avg = sum(w for _, w in sents) / n
    if avg > AVG_RULE:
        out.append(('RULE', f'average sentence {avg:.0f} words over {n} sentences — the rule is '
                            f'around fifteen, and an average past {AVG_RULE} is a finding '
                            f'(RD.DOCS.043) · split it'))
    elif avg > AVG_SOFT:
        out.append(('SOFT', f'average sentence {avg:.0f} words over {n} sentences — the rule is '
                            f'around fifteen (RD.DOCS.043) · split it'))
    long = [(s, w) for s, w in sents if w > LONG]
    if long:
        eg = ' · '.join(f'"{opening(s)}" ({w})' for s, w in long[:3])
        out.append(('RULE', f'{len(long)} sentence(s) past thirty words — none may be '
                            f'(RD.DOCS.043): {eg} · split it, never shorten it'))
    you = sum(len(YOU.findall(s)) for s, _ in sents)
    if n >= YOU_MIN_N and you == 0:
        out.append(('RULE', f'prose that never says *you* — {n} sentences with no second person '
                            f'(RD.DOCS.043; RD.DOCS.031 talks to the reader) · say *you*'))
    elif n >= 5 and you * YOU_PER < n:
        out.append(('SOFT', f'*you* appears {you} time(s) in {n} sentences — fewer than one in '
                            f'twelve (RD.DOCS.043) · say *you*'))
    bar = REACH_BAR.get(kind)
    if bar:
        hit, counted = reach(sents, kind)
        share = 100 * hit / counted if counted else 0
        if counted >= REACH_MIN_N and share < bar:
            skipped = (' — normative sentences sit outside the count' if kind in
                       ('chapter', 'concept') else '')
            out.append(('SOFT', f'{share:.0f} % of prose sentences reach the reader — {hit} of '
                                f'{counted} counted{skipped}, and the {kind} bar is {bar} % '
                                f'(RD.DOCS.044) · land it on your reader. The corpus is swept '
                                f'for length, not yet for reach'))
    return out


def is_register(path):
    """Resolve the path first, exactly as `watched()` does. Testing the string as given made a
    register's classification depend on where the checker was invoked from: `doc-check.py
    glossary.md`, run inside `registers/`, saw no `/registers/` segment, so every row check was
    silently skipped and the file was measured as a chapter. Found while filing RD.SAAS.033,
    when a clean single-file run and a dirty run over the same file disagreed."""
    p = os.path.abspath(path).replace(os.sep, '/')
    return p.endswith('.md') and '/registers/' in p and os.path.basename(p) != 'README.md'


def rows(text):
    """RD.DOCS.043 § Rows — a register row takes the plain substrate and stays a record.

    Every table body line is a row: the first cell is its id and is skipped; links collapse to
    their text; * and ` markup is stripped for the count. A cell sentence past twenty-five words
    is a finding. A bare *you* is a finding — a record is never warmed (04-discipline § Voice
    discipline) — unless the row mentions the word as a term, in italics or in backticks.
    Returns (findings, metrics over the row sentences).
    """
    out, sents = [], []
    lines = text.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        if not s.startswith('|') or TABLE_SEP.match(s):
            continue
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ''
        if TABLE_SEP.match(nxt):
            continue                         # the header row
        cells = [c.strip() for c in re.split(r'(?<!\\)\|', s)]
        if cells and cells[0] == '':
            cells = cells[1:]
        if cells and cells[-1] == '':
            cells = cells[:-1]
        if len(cells) < 2:
            continue
        rid = re.sub(r'[*`]', '', MD_LINK.sub(r'\1', cells[0])).strip() or f'line {i + 1}'
        body = [MD_LINK.sub(r'\1', c) for c in cells[1:]]
        if YOU.search(YOU_AS_TERM.sub(' ', ' '.join(body))):
            out.append(('RULE', f'row {rid} says *you* — a record is never warmed '
                                f'(RD.DOCS.043 § Rows; 04-discipline § Voice discipline)'))
        for c in body:
            for sent, n in sentences(re.sub(r'[*`]', '', c)):
                sents.append((sent, n))
                if n > ROW_LONG:
                    out.append(('RULE', f'row {rid}: a sentence of {n} words, "{opening(sent)}" '
                                        f'— a row states one clause a sentence, none past '
                                        f'twenty-five (RD.DOCS.043 § Rows) · split it'))
    return out, measure(sents, 'register')


def check(path, text, fragment=False):
    """All findings for one file. A fragment is an Edit's new_string: path-based structure
    still applies, the whole-document shape checks do not, and the prose measure runs only
    once the fragment carries five prose sentences."""
    is_html = path.endswith('.html')
    is_approach = path.endswith('-approach.html')
    is_overview = path.endswith('-overview.html')
    prose = prose_of(text, is_html)
    out = structural(path)

    if (is_approach or is_overview) and not fragment:
        if not re.search(r'who this is for|audience', text, re.I):
            out.append(('BLOCK', 'masthead names no audience — an artifact has no seat, so its '
                                 'content is decided by its audience (05-artifacts)'))
        m = re.search(r'<section id="s0".*?</section>', text, re.S)
        if m:
            n = len(re.findall(r'<tr>', m.group(0))) - 1
            if n > 8:
                out.append(('BLOCK', f'Terms carries {n} rows; the bar is five to eight'))
    if is_approach:
        if not fragment:
            out += approach_shape(text)
        out += open_cards(text)
    elif is_overview:
        out += overview_shape(text)

    sents = sentences(prose)
    if not fragment or len(sents) >= 5:
        out += voice(prose, sents, kind_of(path))
    if is_register(path):
        out += rows(text)[0]
    return out


# How a stack spells a scaffold template. A stack DERIVES from the repo's own claim —
# `sprepo.json` `config.stack` — which is the derivation every estate-aware verb already uses,
# so adding a stack here is adding a row rather than a branch in shared code. Nothing in this
# file may assume one stack: `.tmpl` and `dot-` are TypeScript's, and the `dot-` reason is
# npm's alone (npm strips a literal `.gitignore` from a published tarball). A stack publishing
# to PyPI has no such problem (the arc docs-voice, finding 42).
STACK_TEMPLATES = {
    'TS': {'suffixes': ('.tmpl',), 'dot_prefix': 'dot-'},
}
# The fallback for a stack with no row yet. It fails OPEN — checking a little more than it
# must — because every defect this checker has had was a gate that measured nothing and read
# as a pass. A new stack's templates are watched imprecisely rather than not at all.
GENERIC_TEMPLATE = {'suffixes': ('.tmpl', '.template', '.j2', '.jinja', '.mustache', '.erb'),
                    'dot_prefix': None}
_stack_cache = {}


def stack_of(path):
    """The stack a file's repository claims, or None. Walks up to the nearest `sprepo.json`,
    the same two-step every estate verb uses to resolve a node."""
    d = os.path.dirname(os.path.abspath(path))
    while True:
        if d in _stack_cache:
            return _stack_cache[d]
        manifest = os.path.join(d, 'sprepo.json')
        if os.path.exists(manifest):
            try:
                claim = (json.load(open(manifest, encoding='utf-8'))
                         .get('config', {}) or {}).get('stack')
            except Exception:
                claim = None
            _stack_cache[d] = claim
            return claim
        parent = os.path.dirname(d)
        if parent == d:
            return None
        d = parent


def as_written(path):
    """The file a scaffold template becomes. `README.md.tmpl` is a README and is held to a
    README's bars, so a new node is BORN in the one voice instead of being swept into it later
    (D60-A). Both spellings come from the scaffolder's own contract, `scaffold/templates.ts`:
    a `.tmpl` suffix, and a `dot-` prefix for names npm strips from a published tarball.

    Checking the template by what it writes is what keeps the generators and the corpus under
    one rule. A template left in the old voice regenerates the drift with every new node, and
    no amount of sweeping the corpus catches it.
    """
    d, base = os.path.split(path)
    conv = STACK_TEMPLATES.get(stack_of(path) or '', GENERIC_TEMPLATE)
    for suffix in conv['suffixes']:
        if base.endswith(suffix):
            base = base[:-len(suffix)]
            break
    prefix = conv['dot_prefix']
    if prefix and base.startswith(prefix):
        base = '.' + base[len(prefix):]
    return os.path.join(d, base)


def watched(path):
    """What the hook and the sweep read (RD.DOCS.043 § Reach): every .md under docs/, every
    README.md, CONCEPT.md, every .html under artifacts/, an approach or overview page anywhere,
    and .html under .spndevex/notes/. A scaffold template counts as the file it writes. Not .md
    under .spndevex/ — arcs, orders and notes are state, not corpus — and nothing under a build
    or dependency directory, which keeps the build's copy of the templates out."""
    p = os.path.abspath(as_written(path)).replace(os.sep, '/')
    parts = p.split('/')
    if any(d in SKIP for d in parts[:-1]):
        return False
    base = parts[-1]
    if base.endswith('.md') and '/.spndevex/' in p:
        return False
    if base.endswith('.html'):
        return (base.endswith('-approach.html') or base.endswith('-overview.html')
                or '/artifacts/' in p or '/.spndevex/notes/' in p)
    if base in ('README.md', 'CONCEPT.md'):
        return True
    return base.endswith('.md') and '/docs/' in p


def walk(roots):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, files in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP]
            for f in files:
                p = os.path.join(dirpath, f)
                if watched(p):
                    yield p


KINDS = ('chapter', 'readme', 'concept', 'artifact-html', 'register')


def kind_of(path):
    path = as_written(path)                             # a template takes its written file's bars
    base = os.path.basename(path)
    if base == 'CONCEPT.md':
        return 'concept'
    if base == 'README.md':
        return 'readme'
    if path.endswith('.html'):
        return 'artifact-html'
    if is_register(path):
        return 'register'
    return 'chapter'


def rates(root, stats):
    """One markdown table per root. The register line measures the ROW sentences — the text
    the rows tranche moves — so it is never summed into the prose line."""
    def line(name, s, bar=None):
        n = s['sentences'] or 1
        c = s['counted'] or 1
        return (f"| {name} | {s['files']} | {s['sentences']} | {s['words'] / n:.1f} | "
                f"{100 * s['past25'] / n:.0f} % | {100 * s['past30'] / n:.1f} | "
                f"{100 * s['you'] / n:.1f} | {100 * s['reach'] / c:.0f} % | "
                f"{bar if bar else '—'} | {s['rule']} | {s['soft']} |")
    print(f'\n### rates · {root}\n')
    print('| kind | files | sentences | words/sentence | % past 25 | past 30 per 100 | '
          '*you* per 100 | reach % | reach bar | files with RULE | files with SOFT |')
    print('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    prose = {k: 0 for k in stats['chapter']}
    for k in KINDS[:-1]:
        if stats[k]['files']:
            print(line(k, stats[k], f'{REACH_BAR[k]} %'))
        for key in prose:
            prose[key] += stats[k][key]
    print(line('prose (all four)', prose))
    if stats['register']['files']:
        print(line('register (rows)', stats['register']))


HEREDOC = re.compile(r'<<-?\s*([\'"]?)([A-Za-z_][A-Za-z0-9_]*)\1')
REDIRECT = re.compile(r'(?:^|\s)(>>?)\s*([^\s;|&<>]+)')
TEE = re.compile(r'\btee\b\s+(?:-a\s+)?([^\s;|&<>]+)')
SEGMENT = re.compile(r'[;|&\n]+')


def _sed_files(args):
    """The files a `sed -i` invocation rewrites, or none if it is not editing in place.

    Tokens decide this, never a pattern: sed's file operands sit AFTER its script, and a regex
    that simply took the next token captured `s/a/b/` and let the real file through. BSD's `-i`
    takes a backup suffix, often the empty string, and `-e`/`-f` each consume the token after
    them — so the script is skipped only when neither flag supplied one.
    """
    if not any(t == '-i' or t.startswith('-i') for t in args):
        return []
    scripted = any(t in ('-e', '-f') for t in args)
    files, skip_next, seen_script = [], False, False
    for t in args:
        if skip_next:
            skip_next = False
            continue
        if t in ('-e', '-f'):
            skip_next = True
            continue
        if not t or t.startswith('-'):
            continue
        if not scripted and not seen_script:
            seen_script = True                          # the bare script expression
            continue
        files.append(t)
    return files


def _argv_writes(head):
    """Writers that name their target as an argument — `sed -i`, and a copy or a move whose
    destination is its last operand. Their bytes are on disk rather than in the command, so a
    path-based guard decides on these and a content measure cannot."""
    out = []
    for seg in SEGMENT.split(head):
        try:
            toks = shlex.split(seg)
        except ValueError:
            continue                                    # an unbalanced quote — allow, never guess
        while toks and (toks[0] in ('sudo', 'env', 'command', 'nohup')
                        or re.match(r'^\w+=', toks[0])):
            toks = toks[1:]
        if not toks:
            continue
        cmd, args = os.path.basename(toks[0]), toks[1:]
        if cmd == 'sed':
            out += [(f, 'inplace') for f in _sed_files(args)]
        elif cmd in ('cp', 'mv', 'install', 'rsync'):
            operands = [a for a in args if not a.startswith('-')]
            if len(operands) >= 2:
                out.append((operands[-1], 'copy'))      # the destination is last
    return out


def bash_writes(command):
    """Every path a shell command writes, as (path, text, append, how).

    `how` is why the path was found, and it decides what a caller may conclude:

      redirect · tee   the target of `>` `>>` or `tee`. A heredoc body comes back as `text`,
                       which the checker reads exactly as it reads a Write's content. Without
                       one `text` is None — a write the gate cannot measure, and it owes you
                       that fact rather than a pass.
      inplace · copy   `sed -i`, `cp`, `mv`, `install`, `rsync`. The bytes are on disk, never
                       in the command, so `text` is always None. A path-based guard still
                       decides on these; a content measure cannot.

    The hook's matcher covers Bash, so a file written through the shell is seen like any other
    — before this the matcher fired and the handler read nothing (the arc docs-voice, F34), and
    `deny-generated-edits.sh` had the same gap one file away (F35).
    """
    bare = lambda s: s.strip().strip('\'"')
    out, lines, i = [], command.split('\n'), 0
    while i < len(lines):
        line = lines[i]
        i += 1
        delims = [d for _, d in HEREDOC.findall(line)]
        head = HEREDOC.sub(' ', line)
        targets = [(bare(t), op == '>>', 'redirect') for op, t in REDIRECT.findall(head)]
        targets += [(bare(t), ' -a ' in head, 'tee') for t in TEE.findall(head)]
        bodies = []
        for d in delims:
            body = []
            while i < len(lines) and lines[i].strip() != d:
                body.append(lines[i])
                i += 1
            i += 1                                      # step over the delimiter's own line
            bodies.append('\n'.join(body))
        for n, (target, append, how) in enumerate(targets):
            out.append((target, bodies[n] if n < len(bodies) else None, append, how))
        # Content is never recoverable for these, so they carry no body and take no heredoc.
        for target, how in _argv_writes(head):
            out.append((bare(target), None, how == 'inplace', how))
    return out


def main():
    if '--bash-writes' in sys.argv:
        """Every path a Bash command may write, one per line, for a guard that decides on the
        path alone — `deny-generated-edits.sh` (F35). One parser serves both hooks, so a new
        shell-write route is learned once. Content is not the question here, so every route is
        printed whether or not its bytes were recoverable."""
        try:
            p = json.load(sys.stdin)
        except Exception:
            return 0
        cmd = (p.get('tool_input', {}) or {}).get('command') or ''
        for path, _, _, _ in bash_writes(cmd):
            print(path)
        return 0

    if '--stdin' in sys.argv:
        try:
            p = json.load(sys.stdin)
        except Exception:
            return 0
        ti = p.get('tool_input', {}) or {}
        path = ti.get('file_path') or ''
        plural = False
        if path:
            if not watched(path):
                return 0
            fragment = 'content' not in ti and 'new_string' in ti
            text = ti.get('content') or ti.get('new_string') or ''
            if not text and not structural(path):
                return 0
            found = check(path, text, fragment=fragment)
        else:
            writes = [w for w in bash_writes(ti.get('command') or '') if watched(w[0])]
            if not writes:
                return 0
            found, plural = [], len(writes) > 1
            unread = {'redirect': 'written by a shell redirect carrying no readable body',
                      'tee': 'written through `tee` carrying no readable body',
                      'inplace': 'edited in place, so the new text never appears in the command',
                      'copy': 'put here by a copy or a move, so its bytes are only on disk'}
            for target, text, append, how in writes:
                tag = os.path.basename(target) + ': '
                if text is None:
                    found.append(('SOFT', tag + unread[how] + ' — the gate cannot measure this '
                                        'write. Write the document with Write or Edit, or sweep '
                                        'the file afterwards, and it is checked'))
                    continue
                found += [(sev, tag + msg) for sev, msg in check(target, text, fragment=append)]
        if not found:
            return 0
        body = '\n'.join(f'  - [{sev}] {msg}' for sev, msg in found)
        moves = ('\n  The four moves: split it · say *you* · define the term · land it on '
                 'your reader — never shorten (`refs/doc-sets.md` § One voice; decisions '
                 'RD.DOCS.043 · RD.DOCS.044).'
                 if any('RD.DOCS.04' in m or 'RD.DOCS.031' in m for _, m in found) else '')
        subject = 'these files miss' if plural else 'this file misses'
        message = (f'Doc standard — {subject} bars the book states:\n' + body + moves +
                   "\n  Load `refs/doc-sets.md` (One voice / Every surface / The artifacts pocket) and "
                   "the `plan` skill's approach-document section.")
        # The same text twice: `additionalContext` is what the agent reads; `systemMessage` is
        # the developer's pane. A PreToolUse hook that emits only the latter is silent to the
        # agent — the arc docs-voice, finding 18.
        print(json.dumps({'systemMessage': message,
                          'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                                 'additionalContext': message}}))
        return 0

    summary_only = '--summary' in sys.argv
    roots = [a for a in sys.argv[1:] if not a.startswith('-')] or ['.']
    tot = {'BLOCK': 0, 'RULE': 0, 'SOFT': 0}
    files = dirty = 0
    empty = lambda: {'files': 0, 'sentences': 0, 'words': 0, 'past25': 0, 'past30': 0,
                     'you': 0, 'reach': 0, 'counted': 0, 'rule': 0, 'soft': 0}
    per_root = []
    for root in roots:
        stats = {k: empty() for k in KINDS}
        for path in sorted(walk([root])):
            try:
                text = open(path, encoding='utf-8', errors='replace').read()
            except Exception:
                continue
            files += 1
            found = check(path, text)
            kind = kind_of(path)
            s = stats[kind]
            s['files'] += 1
            m = (rows(text)[1] if kind == 'register'
                 else measure(sentences(prose_of(text, path.endswith('.html'))), kind))
            for key, v in m.items():
                s[key] += v
            sevs = {sev for sev, _ in found}
            s['rule'] += 'RULE' in sevs or 'BLOCK' in sevs
            s['soft'] += 'SOFT' in sevs
            if not found:
                continue
            dirty += 1
            for sev, _ in found:
                tot[sev] += 1
            if summary_only:
                continue
            print(os.path.relpath(path))
            for sev, msg in found:
                print(f'   [{sev}] {msg}')
        per_root.append((root, stats))
    if not summary_only:
        print(f'\n{files} documents scanned · {dirty} with findings · '
              f"BLOCK {tot['BLOCK']} · RULE {tot['RULE']} · SOFT {tot['SOFT']}")
    for root, stats in per_root:
        rates(root, stats)
    return 1 if tot['BLOCK'] else 0


if __name__ == '__main__':
    sys.exit(main())
