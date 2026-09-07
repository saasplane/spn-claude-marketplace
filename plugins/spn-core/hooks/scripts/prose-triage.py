#!/usr/bin/env python3
"""Find the paragraphs worth rewriting, so a prose pass reads candidates rather than a corpus.

Workstream 008 covers every prose sentence in the workspace — 33,166 of them at the time this was
written. Handing that to agents whole is the expensive way to do it, and most of it needs no change.
Six of the nine faults that workstream names are detectable by pattern, so this reports where they
are and a rewriting pass reads only those paragraphs and their headings.

  prose-triage.py [path ...]            report per file, most candidates first
  prose-triage.py --comments            include prose in code comments, not markdown alone
  prose-triage.py --paragraphs <path>   print the flagged paragraphs of one file, ready to hand over
  prose-triage.py --ledger <file>       skip files whose content hash is already recorded there
  prose-triage.py --record <file>       append the hashes of every file reported, after a pass lands

What it never reads is what must never change: a code block, a table row, a heading, front matter
and the reading strip are all removed before anything is scored, because `prose_of()` removes them.
A record keeps its form (RD.DOCS.031 rule 7), and generated files are skipped by name.

Three of the nine faults are left to a reader on purpose. A compressed claim, a rule with no action,
and an abstraction that is merely dull cannot be told from good prose by a pattern. The report says
so rather than implying the flagged set is the whole job.
"""
import hashlib, importlib.util, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('dc', os.path.join(HERE, 'doc-check.py'))
dc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dc)

SKIP_DIR = {'node_modules', '.git', 'dist', 'build', '.nx', 'coverage', '.output', '__pycache__',
            '.venv', 'tool-results', '.pnpm-store'}
# Regenerated from something else, so an edit here is overwritten by the next build.
SKIP_FILE = re.compile(r'^(CHANGELOG|LICENSE|spn-symbols|.*\.generated)\.md$', re.I)

# A comment is prose a developer and an agent both read, so RD.DOCS.052 reaches it exactly as it
# reaches a chapter. What is never touched is the code around it.
CODE_EXT = {'.ts': 'c', '.tsx': 'c', '.js': 'c', '.jsx': 'c', '.py': 'py', '.sh': 'sh'}
# An instruction to a tool rather than a sentence to a reader. Rewriting one breaks the tool.
DIRECTIVE = re.compile(r'^\s*(?:eslint|prettier|@ts-|ts-|type:|noqa|pylint|pragma|istanbul|'
                       r'biome-ignore|v8 ignore|c8 ignore|TODO\b|FIXME\b|HACK\b|XXX\b|'
                       r'https?://|#!|-\*-|coding[:=])', re.I)
GENERATED = re.compile(r'(generated|do not edit|auto-?generated)', re.I)


def comment_blocks(src, style):
    """Every comment body in one source file, with the code removed.

    A run of consecutive line comments is one block, because that is how it reads. A generated
    file is skipped whole — an edit there is overwritten by the next build."""
    if GENERATED.search(src[:400]):
        return []
    out, run = [], []
    if style == 'c':
        for m in re.finditer(r'/\*\*?(.*?)\*/', src, re.S):
            out.append(re.sub(r'^\s*\*+', '', m.group(1), flags=re.M))
        line_pattern = re.compile(r'\s*//+(.*)$')
    else:
        for m in re.finditer(r'"""(.*?)"""|\'\'\'(.*?)\'\'\'', src, re.S):
            out.append(m.group(1) or m.group(2) or '')
        line_pattern = re.compile(r'\s*#+(.*)$')
    for line in src.split('\n'):
        m = line_pattern.match(line)
        if m:
            run.append(m.group(1))
        elif run:
            out.append('\n'.join(run)); run = []
    if run:
        out.append('\n'.join(run))
    return out


def prose_comments(path, style):
    """Comment blocks carrying a real sentence, as (text, sentences) pairs.

    Eight words and a sentence end is the floor. Below that a comment is a label rather than
    prose, and holding a label to a writing standard produces noise a reader has to clear."""
    try:
        src = open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        return []
    out = []
    for body in comment_blocks(src, style):
        text = ' '.join(body.split())
        if not text or DIRECTIVE.match(text):
            continue
        sents = dc.sentences(text)
        if len(text.split()) >= 8 and sents:
            out.append((text, sents))
    return out

# Two rules were built here and cut after sampling, because every hit was good prose. A count
# opener flagged "Five tiers, each buying you something the others cannot", where the count is the
# ruling and `coherence.py` already checks cardinality properly. A negation opener flagged
# "A percentage is not the answer", which is a strong opening line. Both cost more to clear than
# they saved. What survives fires on a real fault or not at all — a triage a reader learns to
# distrust is worse than none, because the reading it was meant to narrow happens anyway.
OPENERS = {
    'pronoun':  re.compile(r'^(?:it|they|this|these|those)\s+(?:is|are|was|were|arrives|'
                           r'carries|holds|has|have|makes|does|comes|goes|means|sits|lives)\b', re.I),
    'defines':  re.compile(r'^\w[\w\s`\'-]{0,40}?\s+is\s+(?:what\s+happens|the\s+\w+\s+that\s+\w+s\b)',
                           re.I),
}
ABSTRACT = re.compile(r'\bthe (?:property|thing|point|reason|part) (?:that|which)\b|'
                      r'\bcomes down to\b|\bis always the\b', re.I)
# Metaphor doing real work. Kept short and literal — a long guess list produces noise a reader
# then has to clear, which costs more than it saves.
METAPHOR = re.compile(r'\b(?:fates?|degrade[sd]? into|centre of gravity|center of gravity|'
                      r'lifeblood|heartbeat|marriage of|wedded to|a home for|breathes?)\b', re.I)

FAULTS = ('idiom', 'opener', 'abstract', 'metaphor')


def paragraphs(raw):
    """Prose blocks, each with its sentences. `prose_of` has already removed every code block,
    table row, heading and rail, so what is left is what a reader actually reads."""
    out = []
    for block in dc.BLOCK_BREAK.split(dc.prose_of(raw, False)):
        sents = dc.sentences(block)
        if sents:
            out.append((' '.join(block.split()), sents))
    return out


def score(block, sents):
    """Which of the detectable faults this paragraph carries, and why — the reason is what a
    rewriting agent is given, so it never has to re-derive the finding."""
    found = {}
    clean = dc.MARKED.sub(' ', block)
    idioms = sorted(set(i.lower() for i in dc.IDIOM.findall(clean)))
    if idioms:
        found['idiom'] = ' · '.join(idioms)
    first = sents[0][0]
    hits = [name for name, pattern in OPENERS.items() if pattern.match(first)]
    if hits:
        found['opener'] = ' + '.join(hits) + f' — "{dc.opening(first, 8)}"'
    if ABSTRACT.search(clean):
        found['abstract'] = ' · '.join(sorted(set(m.strip().lower()
                                                  for m in ABSTRACT.findall(clean) or [])) or
                                       [ABSTRACT.search(clean).group(0).lower()])
    if METAPHOR.search(clean):
        found['metaphor'] = METAPHOR.search(clean).group(0).lower()
    return found


def files_under(roots, comments=False):
    """Markdown always; source files too when comments are in scope."""
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, names in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIR and not d.startswith('.')]
            for name in sorted(names):
                if name.endswith('.md') and not SKIP_FILE.match(name):
                    yield os.path.join(dirpath, name)
                elif comments and os.path.splitext(name)[1] in CODE_EXT:
                    yield os.path.join(dirpath, name)


def digest(path):
    with open(path, 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()[:16]


def survey(roots, done, comments=False):
    rows, skipped = [], 0
    for path in files_under(roots, comments):
        try:
            raw = open(path, encoding='utf-8').read()
        except Exception:
            continue
        if digest(path) in done:
            skipped += 1
            continue
        style = CODE_EXT.get(os.path.splitext(path)[1])
        blocks = prose_comments(path, style) if style else paragraphs(raw)
        flagged = [(b, s, f) for b, s in blocks if (f := score(b, s))]
        if blocks:
            rows.append((path, len(blocks), sum(len(s) for _, s in blocks), flagged))
    return rows, skipped


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]
    opt = {f.split('=')[0]: (f.split('=', 1)[1] if '=' in f else True) for f in flags}
    roots = args or ['.']
    done = set()
    ledger = opt.get('--ledger')
    if isinstance(ledger, str) and os.path.isfile(ledger):
        done = {line.split()[0] for line in open(ledger) if line.strip()}

    comments = bool(opt.get('--comments'))
    if opt.get('--paragraphs'):
        for path in files_under(roots, comments):
            style = CODE_EXT.get(os.path.splitext(path)[1])
            blocks = (prose_comments(path, style) if style
                      else paragraphs(open(path, encoding='utf-8').read()))
            for block, sents, found in [(b, s, f) for b, s in blocks if (f := score(b, s))]:
                print(f'\n--- {path}  [{" · ".join(f"{k}: {v}" for k, v in found.items())}]')
                print(block)
        return 0

    rows, skipped = survey(roots, done, comments)
    rows.sort(key=lambda r: -len(r[3]))
    total_p = sum(r[1] for r in rows)
    total_s = sum(r[2] for r in rows)
    flagged_p = sum(len(r[3]) for r in rows)
    with_any = [r for r in rows if r[3]]
    tally = {f: 0 for f in FAULTS}
    for _, _, _, flagged in rows:
        for _, _, found in flagged:
            for k in found:
                tally[k] += 1

    print(f'{"file":<64}{"paras":>7}{"flagged":>9}')
    for path, n_blocks, _, flagged in with_any[:25]:
        print(f'{path[-63:]:<64}{n_blocks:>7}{len(flagged):>9}')
    if len(with_any) > 25:
        print(f'... and {len(with_any) - 25} more files with candidates')
    print()
    print(f'  scanned        {len(rows)} files · {total_p} paragraphs · {total_s} sentences')
    if skipped:
        print(f'  skipped        {skipped} files already recorded in the ledger')
    print(f'  candidates     {flagged_p} paragraphs in {len(with_any)} files '
          f'— {100 * flagged_p // max(total_p, 1)} % of paragraphs')
    print(f'  by fault       ' + ' · '.join(f'{k} {v}' for k, v in tally.items()))
    print()
    print('  A reader still owns the three faults no pattern can see: a claim compressed past')
    print('  reading, a rule that never says what to do, and an abstraction that is merely dull.')
    print('  So this narrows the reading. It does not replace it.')

    record = opt.get('--record')
    if isinstance(record, str):
        with open(record, 'a') as fh:
            for path, _, _, _ in rows:
                fh.write(f'{digest(path)}  {path}\n')
        print(f'\n  recorded {len(rows)} file hashes to {record}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
