#!/usr/bin/env python3
"""The two gates a workstream's split plan carries, and the parser both read it with.

Source of truth: the foundation book's artifacts standard (`05-docs/05-artifacts.md` — the
approach document, and the scope column a workspace-level page adds) and the devex chapter
(`04-devex/11-workspace.md` — the workstream, the documents-first gate and the close gate).
This script checks only what a script CAN check; whether a row was the right row is judgement.

A workstream lives at `.spndevex/workstreams/{open,backlog,closed}/{NNN}-{subject}/`, and its
state is the folder it sits in. Only the move into `closed/` is a close. Moving `backlog/` into
`open/` is how work starts, so neither gate fires on it.

**The split plan** is not a section somebody writes. It is the `How` tables of an approach page
read by their **scope** column — one row per piece or per document, each naming the node that
owns it and the state it has reached. Filter by scope and each repo's rows are what that repo's
documents must say. A seat's page leaves the column out, so it carries no split plan and neither
gate has anything to hold it to.

  documents-first :  split-plan.py --gate documents-first --stdin   (PreToolUse — a WARNING)
  close           :  split-plan.py --gate close --stdin             (PreToolUse — a REFUSAL)
  sweep           :  split-plan.py [path ...]                       (every open workstream's rows)

Pass the gate. Without `--gate` the script reads the event and decides nothing, which looks
exactly like a pass.

**The two gates read the same column and ask different questions of it.**

  documents-first   You are writing an approach page into a repo's own pocket while the open
                    workstream that argues it still has rows that have not landed. That is how
                    a design ends up committed into a seat while it is still being corrected.
                    It warns and names the workstream, because getting ahead of the plan is
                    sometimes right. A parked workstream never fires it.

  close             You are moving a subject into `closed/`. Every row must be ACCOUNTED FOR,
                    which is not the same as finished: **landed, carried and deferred all pass**,
                    and only a row nobody decided refuses. Closing a scope with work pending is
                    a normal act — you defer it, with its trigger, and the record is what a
                    later scope needs to find. There is no override, and none is needed:
                    recording the deferral is the way through.

Exit code is always 0. A refusal is the documented PreToolUse decision on stdout, never a
non-zero exit, and anything unexpected — no path, no page, an unparsable event — allows.
"""
import html as _html
import json, os, re, shlex, sys

DEVEX = '.spndevex'
# The state a row reaches. `landed` is the only one that satisfies the documents pass; all three
# named states satisfy the close. A mark nobody wrote is what the close refuses.
UNDECIDED = {'', '-', '--', '?', '⬜', '☐', '[ ]', 'tbd', 'todo', 'open', 'unknown'}
LANDED = ('landed', '✅', 'done', 'shipped')
ACCOUNTED = ('landed', 'carried', 'deferred')
# `stopped` is the row somebody began and then put down — a question arrived, a plugin needed
# a reload, the window ran out. It is NOT accounted for: half an edit sits in the tree, and
# the one reader who knew where has closed their window. The glyph is read as well as the
# word, for the same reason `✅` is: a cell reading `◐ 2026-09-08 …` strips to a date and
# would otherwise classify as pending, which closes clean.
STOPPED = ('stopped', '◐')
# A cell opens with a mark glyph before its word:  carried,  deferred. The word is what
# carries the meaning, so the reader skips anything that is not a letter to find it.
LEAD = re.compile(r'^[^0-9a-z]+', re.I)
SEGMENT = re.compile(r'\|\||&&|\||;|\n')
MOVERS = ('mv', 'cp', 'rsync', 'install')
SKIP = {'node_modules', '.git', 'dist', 'build', '.nx', 'coverage', '__pycache__'}
# The lifecycle. `open` is being worked, `backlog` is parked behind a named blocker, `closed` is
# accounted for. The container is `workstreams/`; `sessions/` is the name it replaces, and a bare
# `arcs/` is the shape before that. All three are read so a half-migrated workspace still parses.
STATES = ('open', 'backlog', 'closed')
CONTAINERS = ('workstreams', 'sessions', 'arcs')
# What a close looks like as a path: a closed folder of one of those containers, under the
# workspace's own state. `backlog/` moving to `open/` matches nothing here, which is the point.
CLOSED = re.compile(r'/' + re.escape(DEVEX) + r'/(?:' + '|'.join(CONTAINERS) + r')/closed(?:/|$)')
# Every path part that is a container or a state rather than a subject — so a destination alone
# still yields the subject when no source names it.
STRUCTURE = set(CONTAINERS) | set(STATES) | {''}


def flat(cell):
    """A cell as a person reads it — tags gone, entities resolved, whitespace collapsed."""
    return re.sub(r'\s+', ' ', _html.unescape(re.sub(r'<[^>]+>', ' ', cell))).strip()


def html_tables(text):
    for table in re.findall(r'<table\b.*?</table>', text, re.S | re.I):
        rows = re.findall(r'<tr\b[^>]*>(.*?)</tr>', table, re.S | re.I)
        parsed = []
        for row in rows:
            cells = re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.S | re.I)
            parsed.append([flat(c) for c in cells])
        if parsed:
            yield parsed


def md_tables(text):
    """A pipe table, for a plan written in markdown. The separator row decides where one
    starts, so a line of pipes inside prose is never mistaken for a header."""
    lines = text.split('\n')
    table, header = [], None
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped.startswith('|'):
            if table:
                yield table
                table, header = [], None
            continue
        cells = [c.strip() for c in stripped.strip('|').split('|')]
        if re.match(r'^:?-{3,}', cells[0]) and header:
            table = [header]
            header = None
            continue
        if table:
            table.append(cells)
        else:
            header = cells
    if table:
        yield table


def rows_of(text, markdown):
    """Every split-plan row in one document.

    A split-plan table is one carrying BOTH a `scope` header and a `state` header. Requiring
    both is what keeps an arc's own step table — which has a state and no scope — out of a
    check it was never written for.
    """
    out = []
    for table in (md_tables(text) if markdown else html_tables(text)):
        head = [c.lower() for c in table[0]]
        if 'scope' not in head or 'state' not in head:
            continue
        scope_at, state_at = head.index('scope'), head.index('state')
        for cells in table[1:]:
            if len(cells) <= max(scope_at, state_at):
                continue
            out.append({'label': cells[0], 'scope': cells[scope_at], 'state': cells[state_at]})
    return out


def state_of(row):
    """`empty` · `landed` · `carried` · `deferred` · `pending`.

    **The close accepts three of the five, so it has to tell them apart.** `ACCOUNTED` named
    all three from the first version and nothing read it. A row saying `carried` and a row
    saying `agreed` were one value, so the gate warned about rows that had named their
    successor. That teaches a reader that marking a row changes nothing.

    `pending` is what is left over: somebody decided to do it and never said what became of
    it. It still passes the close, by the same rule as before, and the warning names it.
    """
    raw = row['state'].strip().lower()
    state = LEAD.sub("", raw)
    if raw in UNDECIDED or not state:
        return 'empty'
    # `✅` IS ITSELF A LANDED MARK, so the raw cell is read before the glyph is stripped.
    # Stripping first turned every `✅ 2026-09-07` into `2026-09-07` and lost eleven landings.
    if raw.startswith(LANDED) or state.startswith(LANDED):
        return 'landed'
    if state.startswith('carried'):
        return 'carried'
    if state.startswith('deferred'):
        return 'deferred'
    # Read before `pending`, and by the glyph as well as the word, so a stop carrying a date
    # rather than the word is still a stop rather than a row that closes clean.
    if raw.startswith(STOPPED) or state.startswith(STOPPED):
        return 'stopped'
    return 'pending'


def accounted(row):
    """Whether a row said what became of it. Three states do; `stopped`, `pending` and `empty`
    do not. `ACCOUNTED` is that set, and this is the one reader it has."""
    return state_of(row) in ACCOUNTED


def read(path):
    try:
        with open(path, encoding='utf-8', errors='replace') as fh:
            return fh.read()
    except Exception:
        return ''


def plan_of(page):
    return rows_of(read(page), page.endswith('.md'))


def workspace_root(start):
    path = os.path.abspath(start)
    while True:
        if os.path.isdir(os.path.join(path, DEVEX)):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            return None
        path = parent


def listdir(path):
    try:
        return sorted(d for d in os.listdir(path) if not d.startswith('.'))
    except Exception:
        return []


def pages_in(folder):
    out = []
    for dirpath, dirnames, files in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        out += [os.path.join(dirpath, f) for f in sorted(files) if f.endswith('-approach.html')]
    return out


def state_folders(root, state):
    """Where one state's workstreams sit, in every shape the workspace may be in."""
    devex = os.path.join(root, DEVEX)
    return [os.path.join(devex, 'workstreams', state), os.path.join(devex, 'sessions', state)]


def open_workstreams(root):
    """Every OPEN subject and the pages that argue it — the shape, and the shapes it replaces.

    `workstreams/open/{NNN}-{subject}/` is where a workstream being worked lives. A workspace
    whose state has not been restructured yet keeps `sessions/open/{subject}/`, or its arcs in
    `arcs/` with its pages in `notes/`, and all of them read the same way. Only `open/` is read
    here: `backlog/` is parked, and warning about parked work teaches nobody anything.
    """
    devex = os.path.join(root, DEVEX)
    found = {}
    for open_dir in state_folders(root, 'open'):
        for subject in listdir(open_dir):
            folder = os.path.join(open_dir, subject)
            if os.path.isdir(folder) and subject not in found:
                found[subject] = pages_in(folder)
    for name in listdir(os.path.join(devex, 'arcs')):
        if name.startswith('arc-') and name.endswith('.md'):
            subject = name[len('arc-'):-len('.md')]
            found.setdefault(subject, [])
            page = os.path.join(devex, 'notes', f'{subject}-approach.html')
            if os.path.isfile(page) and page not in found[subject]:
                found[subject].append(page)
    return found


def subject_pages(root, subject, source):
    """The pages that argue one subject, in any state and whichever shape the workspace is in.

    All three states are searched, because a subject reaches `closed/` from `open/` and may be
    closed straight out of `backlog/` when it turns out never to have been needed.
    """
    devex = os.path.join(root, DEVEX)
    out = []
    if source and os.path.isdir(source):
        out += pages_in(source)
    for state in STATES:
        for base in state_folders(root, state):
            candidate = os.path.join(base, subject)
            if os.path.isdir(candidate):
                out += [p for p in pages_in(candidate) if p not in out]
    legacy = os.path.join(devex, 'notes', f'{subject}-approach.html')
    if os.path.isfile(legacy) and legacy not in out:
        out.append(legacy)
    return out


def home(root, subject):
    """Where this subject's workstream actually sits, so the warning names a folder you can
    open. The shape is `workstreams/open/{NNN}-{subject}/`; a workspace whose state has not
    moved yet keeps `sessions/open/` or a bare arc in `arcs/`, and naming the shape it does not
    have yet helps nobody."""
    for container in ('workstreams', 'sessions'):
        folder = os.path.join(DEVEX, container, 'open', subject)
        if os.path.isdir(os.path.join(root, folder)):
            return folder + '/'
    legacy = os.path.join(DEVEX, 'arcs', f'arc-{subject}.md')
    if os.path.isfile(os.path.join(root, legacy)):
        return legacy
    return os.path.join(DEVEX, 'workstreams', 'open', subject) + '/'


def is_repo_seat(path):
    """An approach page in a repository's own artifacts pocket — the seat a design lands in
    once it is settled. A workstream's own page is not a seat: arguing it there is the point."""
    normalized = os.path.abspath(path).replace(os.sep, '/')
    if f'/{DEVEX}/' in normalized:
        return False
    return '/artifacts/' in normalized and normalized.endswith('-approach.html')


def repo_of(root, path):
    """The member repo a path sits in — the first segment under the workspace root."""
    relative = os.path.relpath(os.path.abspath(path), root)
    if relative.startswith('..'):
        return None
    return relative.split(os.sep)[0]


def names_repo(scope, repo):
    return re.search(r'(?<![\w-])' + re.escape(repo) + r'(?![\w-])', scope) is not None


def emit(message, deny=None):
    """One shape for both gates. `additionalContext` is what the agent reads; `systemMessage`
    is the developer's pane — a PreToolUse hook that emits only the latter is silent to the
    agent. A refusal adds the documented decision, and the exit code stays 0 either way."""
    out = {'systemMessage': message,
           'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'additionalContext': message}}
    if deny:
        out['hookSpecificOutput']['permissionDecision'] = 'deny'
        out['hookSpecificOutput']['permissionDecisionReason'] = deny
    print(json.dumps(out))


def moves(command):
    """Every (source, destination) a shell command moves or copies. Tokens decide it, never a
    pattern: `git mv` hides the verb behind `git`, and a flag is never an operand."""
    out = []
    for segment in SEGMENT.split(command):
        try:
            tokens = shlex.split(segment)
        except ValueError:
            continue                                    # an unbalanced quote — allow, never guess
        while tokens and (tokens[0] in ('sudo', 'env', 'command', 'nohup', 'time')
                          or re.match(r'^\w+=', tokens[0])):
            tokens = tokens[1:]
        if not tokens:
            continue
        verb = os.path.basename(tokens[0])
        args = tokens[1:]
        if verb == 'git' and args and args[0] == 'mv':
            args = args[1:]
        elif verb not in MOVERS:
            continue
        operands = [a for a in args if not a.startswith('-')]
        if len(operands) >= 2:
            for source in operands[:-1]:
                out.append((source.rstrip('/'), operands[-1]))
    return out


def closing(destination):
    """A path landing inside a closed folder of the workspace's own state.

    Named containers rather than a bare `/closed/`, so the gate says which act it is watching.
    A move from `backlog/` into `open/` is how work starts and matches nothing here — it is not
    a close, and no gate fires on it.
    """
    normalized = os.path.abspath(destination).replace(os.sep, '/')
    return CLOSED.search(normalized) is not None



# 05-artifacts.md § The approach document → Open — an answered question is not an `Open` entry
# with an answer written beside it: it folds into the section that then states it, and leaves.
# THE PAGE ALONE CANNOT TELL whether a card is answered, so this reads the arc beside it. An arc
# logs an answer by naming the number — `Q3 to Q7 answered`, `Q13 answered C`, `Q10 answered
# against both options`. A card still sitting in `Open` under a number the log calls answered is
# the defect, and it is the one that gets missed: the answer landed, the work moved on, and the
# page kept asking a question nobody was holding.
#
# Reported as a WARNING rather than a refusal. The page is mid-edit for exactly as long as it
# takes to fold a card, and refusing a write during that would refuse the fix itself.
CARD = re.compile(r'<div\b[^>]*class="[^"]*\bopen\b[^"]*"[^>]*>(.*?)</div>', re.S | re.I)
CARD_NUMBER = re.compile(r'<h4[^>]*>\s*(Q\d+)\b', re.I)
# `answered` may sit either side of the number, because a log writes both ways.
ANSWERED = re.compile(r'\b(Q\d+)\b[^.\n]{0,80}?\banswered\b|\banswered\b[^.\n]{0,80}?\b(Q\d+)\b',
                      re.I)
# `Q3 to Q7 answered` names a run rather than one card.
ANSWERED_RUN = re.compile(r'\bQ(\d+)\s*(?:to|through|–|—|-)\s*Q(\d+)\b[^.\n]{0,60}?\banswered\b',
                          re.I)


# A card number inside a code span or a fenced block is an EXAMPLE, not a record. An arc that
# explains the convention — "a log saying `Q7 answered` names one card" — was read as a log entry
# answering Q7, and the gate then demanded a card be folded that nobody had answered. Three false
# alarms in one session, and a gate that cries wolf is one people learn to work around.
CODE_SPAN = re.compile(r'```.*?```|`[^`\n]*`', re.S)


def answered_numbers(folder):
    """Every `Q<n>` an arc in this workstream records as answered.

    Examples are stripped first: what a document says ABOUT the convention is not an instance of it.
    """
    out = set()
    arcs = os.path.join(folder, 'arcs')
    if not os.path.isdir(arcs):
        return out
    for name in sorted(os.listdir(arcs)):
        if not name.endswith('.md'):
            continue
        text = CODE_SPAN.sub(' ', read(os.path.join(arcs, name)))
        for match in ANSWERED.finditer(text):
            out.add((match.group(1) or match.group(2)).upper())
        for match in ANSWERED_RUN.finditer(text):
            first, last = int(match.group(1)), int(match.group(2))
            if 0 < last - first < 40:
                out.update(f'Q{n}' for n in range(first, last + 1))
    return out


def stale_cards(folder, pages):
    """Cards still in `Open` whose number an arc already records as answered."""
    answered = answered_numbers(folder)
    if not answered:
        return []
    out = []
    for page in pages:
        for body in CARD.findall(read(page)):
            found = CARD_NUMBER.search(body)
            if found and found.group(1).upper() in answered:
                out.append((os.path.basename(page), found.group(1).upper()))
    return out


# THE OTHER HALF OF THE SAME RULE, and it is the one nothing tested. A card can leave `Open`
# and carry nothing with it — deleted rather than folded. The page then reads as settled while
# the reasoning that settled it lives only in a closed window.
#
# 05-artifacts.md § The approach document rules that what replaces the card is what execution
# reads. So the test is not whether the number left `Open`; it is whether the page still says
# anything about it. A number an arc calls answered, absent from the whole page, is an answer
# nobody can act on.
#
# Deliberately weak. It asks only that the number appears somewhere outside `Open`, because no
# check can judge whether a fold carries enough. A gate that fires on real deletions and stays
# quiet on thin folds is worth more than one nobody trusts.
def unfolded_cards(folder, pages):
    """Numbers an arc records as answered that the page no longer mentions at all."""
    answered = answered_numbers(folder)
    if not answered:
        return []
    out = []
    for page in pages:
        text = read(page)
        still_open = {found.group(1).upper()
                      for body in CARD.findall(text)
                      for found in [CARD_NUMBER.search(body)] if found}
        mentioned = {match.group(0).upper() for match in re.finditer(r'\bQ\d+\b', text)}
        for number in sorted(answered, key=lambda n: int(n[1:])):
            if number not in still_open and number not in mentioned:
                out.append((os.path.basename(page), number))
    return out


def gate_documents_first(payload):
    tool_input = payload.get('tool_input') or {}
    cwd = payload.get('cwd') or os.getcwd()
    root = workspace_root(cwd)
    if root:
        # THE ANSWERED CARD, checked on every write. It is the rule most often broken by the
        # agent that just obeyed it: the answer lands, the work moves on, and the page keeps
        # asking. Checked here rather than at close because by then it has misled every reader.
        for subject, pages in sorted(open_workstreams(root).items()):
            if not pages:
                continue
            # The arcs sit beside the page, so the page's own folder is the workstream.
            stale = stale_cards(os.path.dirname(pages[0]), pages)
            gone = unfolded_cards(os.path.dirname(pages[0]), pages)
            if gone:
                named = ' · '.join(f'{number} in {page}' for page, number in gone[:6])
                emit(f'An answered card left `Open` and took its answer with it — {named}. '
                     f'The arc records it as answered, and the page now says nothing about it '
                     f'at all. A fold moves the card into the section that states what it '
                     f'settled; what replaces it is what execution reads, because the window '
                     f'holding the answer is gone (05-artifacts.md, The approach document).')
                break
            if stale:
                named = ' · '.join(f'{number} in {page}' for page, number in stale[:6])
                emit(f'An answered card is still in `Open` — {named}. The arc records it as '
                     f'answered, and the page still asks it. Fold each one into the section '
                     f'that now states it, and take it out of `Open`: an answered question is '
                     f'never an entry with the answer written beside it '
                     f'(05-artifacts.md, The approach document).')
                break
    targets = [tool_input['file_path']] if tool_input.get('file_path') else \
              [destination for _, destination in moves(tool_input.get('command') or '')]
    for target in targets:
        target = os.path.join(cwd, target)
        if not is_repo_seat(target):
            continue
        root = workspace_root(target) or workspace_root(cwd)
        if not root:
            continue
        repo = repo_of(root, target)
        if not repo:
            continue
        for subject, pages in sorted(open_workstreams(root).items()):
            rows = [row for page in pages for row in plan_of(page)]
            if not any(names_repo(row['scope'], repo) for row in rows):
                continue
            pending = [row for row in rows if state_of(row) != 'landed']
            if not pending:
                continue
            # This repo's own rows first — they are why the gate fired, and a plan this wide
            # otherwise shows you six rows belonging to somebody else.
            pending.sort(key=lambda r: not names_repo(r['scope'], repo))
            listed = '\n'.join(f"  - [{state_of(r).upper():<7}] {r['scope']} — {r['label'][:90]}"
                               for r in pending[:6])
            more = f'\n  … and {len(pending) - 6} more' if len(pending) > 6 else ''
            emit(f'Documents-first — workstream `{subject}` still has rows that have not '
                 f'landed, and its split plan names {repo}:\n' + listed + more +
                 f'\n  You are writing {os.path.basename(target)} into that repo\'s own pocket. '
                 f'While a subject is open the argument lives in the workstream — '
                 f'`{home(root, subject)}` — and lands in a seat once it is settled. '
                 f'Write the documents in scope order, highest scope first: the foundation '
                 f'before the repo, the repo before the seat, all of it before the code. If this '
                 f'page IS the landing, say so and land the row.')
            return 0
    return 0


# The masthead line a reader meets first. A folder in `closed/` whose page still says it is running
# tells everyone who opens the page — rather than the folder — that the work is live. `010` sat that
# way until the developer noticed it, and this gate passed it: it read rows, and nobody reads rows
# first.
EYEBROW = re.compile(r'class="eyebrow"[^>]*>(.*?)</div>', re.S | re.I)
CLOSED_WORDS = ('closed', 'landed', 'complete')


def says_it_is_closed(page):
    """Whether the page's own masthead says the work is finished."""
    found = EYEBROW.search(read(page))
    if found is None:
        return True                                 # no masthead to read is not a finding
    return any(word in flat(found.group(1)).lower() for word in CLOSED_WORDS)


def gate_close(payload):
    tool_input = payload.get('tool_input') or {}
    cwd = payload.get('cwd') or os.getcwd()
    candidates = []
    for source, destination in moves(tool_input.get('command') or ''):
        destination = os.path.join(cwd, destination)
        if closing(destination):
            candidates.append((os.path.join(cwd, source), destination))
    written = tool_input.get('file_path')
    if written:
        written = os.path.join(cwd, written)
        # A move is the act the gate is written for. A write straight into `closed/` is the same
        # act by another route — except on the page itself, which must stay editable so a row
        # nobody decided can be decided.
        if closing(written) and not written.endswith('-approach.html'):
            candidates.append((None, written))
    for source, destination in candidates:
        root = workspace_root(destination) or workspace_root(cwd)
        if not root:
            continue
        subject = os.path.basename(source.rstrip('/')) if source else ''
        if subject.startswith('arc-') and subject.endswith('.md'):
            subject = subject[len('arc-'):-len('.md')]   # the shape `workstreams/` replaces
        if not subject or subject in STRUCTURE:
            after = os.path.relpath(destination, os.path.join(root, DEVEX)).split(os.sep)
            subject = next((part for part in after if part not in STRUCTURE), '')
        if not subject:
            continue
        pages = subject_pages(root, subject, source if source and os.path.isdir(source) else None)
        # **The stamp, before the rows.** Closing moves a folder; a page that still says it is
        # running keeps telling every reader the work is live. It is one line to fix and invisible
        # to a gate that only counts rows.
        unstamped = [page for page in pages if not says_it_is_closed(page)]
        if unstamped:
            emit(
                f"`{subject}` is closing while its page still says it is running. Stamp the masthead "
                f"first — {' · '.join(os.path.basename(page) for page in unstamped)} — because a "
                f"reader opens the page, not the folder, and the folder is the only thing this move "
                f"changes (05-artifacts.md, The approach document).",
                deny=f"Denied: {subject}'s page does not say it is closed. The masthead is what a "
                     f"reader meets first, and closing must change it as well as the folder.",
            )
            return 0
        rows = [row for page in pages for row in plan_of(page)]
        empty = [row for row in rows if state_of(row) == 'empty']
        # A GATE MUST SAY WHAT IT DID NOT CHECK. These two states used to leave here together, and
        # a page that planned NOTHING closed exactly as green as a page accounting for everything.
        # `plan_of` reads a `How` table by its `Scope` column, so a table without that header is
        # not a split plan and the gate has nothing to hold the page to. Four pages were measured
        # in that state on 2026-09-07 and every one of them would have closed clean.
        if not rows:
            emit(f'Close gate — `{subject}` carries no split plan, so nothing was checked.',
                 deny=(f'Denied: `{subject}` has no split plan, so this gate checked NOTHING — '
                       f'that is not the same as everything being accounted for, and it must not '
                       f'read the same.\n'
                       f'A split plan is a `How` table with a **Scope** column and a **State** '
                       f'column, one row per construct. The gate reads those two and nothing '
                       f'else.\n\n'
                       f'Add the columns to the approach page\'s constructs table, then give each '
                       f'row one of three states:\n'
                       f'  landed <path>   the node that now holds the content\n'
                       f'  carried         the successor scope that takes it on\n'
                       f'  deferred        the event that brings it back\n\n'
                       f'If this scope genuinely planned nothing, say so on the page in a one-row '
                       f'table rather than by leaving the column out — an absent plan and a '
                       f'finished one are indistinguishable to any reader, not just to this hook.'))
            continue
        pending = [row for row in rows if not accounted(row)]
        stopped = [row for row in rows if state_of(row) == 'stopped']
        if not empty and not stopped:
            # ACCOUNTED FOR IS THREE STATES, AND `accounted()` READS ALL THREE. It did not
            # once: `ACCOUNTED` was declared and never used, so a row naming its successor
            # counted the same as one saying `🚧 agreed`, and closing `007` warned about
            # sixteen rows that had each been decided. What is left here is the real case —
            # designed, not done, and silent about where it went. It still closes, because
            # whether that should refuse is the developer's rule to set. This says what it
            # did not check rather than deciding for them.
            if pending:
                listed = '\n'.join(f'  - {r["scope"]} — {r["label"][:90]}' for r in pending[:10])
                more = f'\n  … and {len(pending) - 10} more' if len(pending) > 10 else ''
                emit(f'Close gate — `{subject}` closes with {len(pending)} row(s) that never say '
                     f'what became of them. The gate did NOT check these:\n' + listed + more +
                     f'\n\nEach one says somebody decided something and not what happened to it. '
                     f'If the work moves on, mark it carried and name the scope; if it waits, mark '
                     f'it deferred and name the trigger. Closing with work pending is ordinary — '
                     f'closing without saying where it went is what nobody can follow.')
            continue
        listed = '\n'.join(f"  - {r['scope']} — {r['label'][:90]}" for r in empty[:10])
        more = f'\n  … and {len(empty) - 10} more' if len(empty) > 10 else ''
        stopped_listed = '\n'.join(f"  - {r['scope']} — {r['label'][:90]}"
                                   for r in stopped[:10])
        # ONE REFUSAL CARRYING BOTH LISTS. Undecided and stopped are different defects
        # wanting different repairs, and a gate that names one, gets fixed, then names the
        # other has spent a round trip teaching nothing.
        counts = ([f'{len(empty)} row(s) nobody decided'] if empty else []) + \
                 ([f'{len(stopped)} row(s) you started and stopped'] if stopped else [])
        stopped_block = ('\n\nRows started and stopped:\n' + stopped_listed +
                         '\n\nA stopped row is half an edit sitting in the tree, and only the '
                         'agent that stopped it knows where. Finish the work and mark the row '
                         'landed, or split it honestly: the half that reached its node becomes '
                         'a landed row, and the half that did not becomes a second row marked '
                         'carried or deferred. Never retype the mark to deferred and leave the '
                         'done half unrecorded — the next reader then edits over your work.'
                         ) if stopped else ''
        emit(f'Close gate — `{subject}` cannot close yet: ' + ' and '.join(counts) + '.',
             deny=(f'Denied: `{subject}` cannot close while its split plan holds a row nobody '
                   f'decided, or a row somebody started and put down. The check is ACCOUNTED FOR, '
                   f'never finished — landed, carried and deferred all pass, and closing a '
                   f'scope with work pending is a normal act.\n'
                   + ('Undecided rows:\n' + listed + more if empty else '')
                   + stopped_block
                   + ('\n\nGive each undecided row one of three states, in the plan\'s State '
                      'column:\n'
                      '  landed   → the node that now holds the content, as a path\n'
                      '  carried  → the successor scope, which is now open\n'
                      '  deferred → the event that brings it back\n' if empty else '\n\n')
                   + 'There is no override. Recording what happened is the way through, and it '
                     'is exactly what a later scope needs to find.'))
        return 0
    return 0


def sweep(roots):
    for start in roots:
        root = workspace_root(start) or os.path.abspath(start)
        streams = open_workstreams(root)
        print(f'{root}   {len(streams)} open')
        for subject, pages in sorted(streams.items()):
            rows = [row for page in pages for row in plan_of(page)]
            if not pages:
                print(f'  {subject}: no approach page — no split plan, and that is a valid shape')
                continue
            tally = {'landed': 0, 'carried': 0, 'deferred': 0, 'stopped': 0, 'pending': 0, 'empty': 0}
            for row in rows:
                tally[state_of(row)] += 1
            print(f"  {subject}: {len(rows)} rows · landed {tally['landed']} · "
                  f"carried {tally['carried']} · deferred {tally['deferred']} · "
                  f"stopped {tally['stopped']} · "
                  f"pending {tally['pending']} · undecided {tally['empty']} "
                  f"· {len(pages)} page(s)")
            for row in rows:
                if state_of(row) == 'empty':
                    print(f"      undecided  {row['scope']} — {row['label'][:70]}")
    return 0


def main():
    if '--stdin' in sys.argv:
        try:
            payload = json.load(sys.stdin)
        except Exception:
            return 0
        gate = sys.argv[sys.argv.index('--gate') + 1] if '--gate' in sys.argv else ''
        try:
            if gate == 'documents-first':
                return gate_documents_first(payload)
            if gate == 'close':
                return gate_close(payload)
        except Exception:
            return 0                                    # when unsure, allow
        return 0
    return sweep([a for a in sys.argv[1:] if not a.startswith('-')] or ['.'])


if __name__ == '__main__':
    sys.exit(main())
