#!/usr/bin/env python3
"""Check SaaS Plane documents against the bars the book states mechanically.

Source of truth: the foundation book — 02-document.md rule 9 (RD.GOV.008), rule 12
(RD.DOCS.031, the one voice), and 05-artifacts.md (the approach document). This script
checks only what a script CAN check; the register itself is judgement.

Calibrated against the corpus, never against the rule text. The book runs 2.4 you/1k and
a 23.5-word average, so a pronoun-density or plain sentence-length gate would fire on the
standard it claims to enforce. Anything added here must stay silent on a healthy chapter.

  hook  :  doc-check.py --stdin          (one file, from PreToolUse JSON on stdin)
  sweep :  doc-check.py <path> [...]     (walk .md seats and *-approach.html artifacts)
"""
import json, os, re, sys

# Only sets that GROW. RD.GOV.008 keeps the count where it carries a ruling: "if adding a
# member would be an ordinary decision entry, drop the count; if it would be a redesign, keep
# it." Scopes, kinds, nouns, flows, seats and lenses are closed by a decision — a count there
# is load-bearing and must not be flagged. Decisions, findings and open items are not.
CARD = (r'\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|'
        r'fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+'
        r'(decisions|items|questions|findings|blockers|gaps|defects|open items|todos|tasks)\b')
ABOUT = r'\b(the reader|one must|one should|the user is expected|it is recommended that)\b'


def prose_of(text, is_html):
    """Records are exempt — RD.DOCS.031: a warmed record is a defect."""
    if is_html:
        t = re.sub(r'<(table|svg|pre|script|style)\b.*?</\1>', ' ', text, flags=re.S | re.I)
        return re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'<!--.*?-->', ' ', text, flags=re.S)
    t = re.sub(r'```.*?```', ' ', t, flags=re.S)
    t = '\n'.join(l for l in t.split('\n') if not l.strip().startswith('|'))
    return re.sub(r'[*`#>\[\]]', ' ', t)


def check(path, text):
    is_html = path.endswith('.html')
    is_approach = path.endswith('-approach.html')
    prose = prose_of(text, is_html)
    out = []

    if is_approach:
        if not re.search(r'who this is for|audience', text, re.I):
            out.append(('BLOCK', 'masthead names no audience — an artifact has no seat, so its '
                                 'content is decided by its audience (05-artifacts)'))
        m = re.search(r'<section id="s0".*?</section>', text, re.S)
        if m:
            n = len(re.findall(r'<tr>', m.group(0))) - 1
            if n > 8:
                out.append(('BLOCK', f'Terms carries {n} rows; the bar is five to eight'))

    hits = re.findall(CARD, prose, re.I)
    if hits:
        eg = ', '.join(f'{a} {b}' for a, b in hits[:4])
        out.append(('RULE', f'{len(hits)} cardinality-in-prose ({eg}) — RD.GOV.008: name a set '
                            f'by its rule, not its count'))
    n_about = len(re.findall(ABOUT, prose, re.I))
    if n_about:
        out.append(('RULE', f'{n_about} construction(s) written about the reader, not to them '
                            f'— RD.DOCS.031 talks to the reader'))

    sents = [s for s in re.split(r'(?<=[.!?])\s+', prose) if len(s.split()) > 3]
    if sents:
        avg = sum(len(s.split()) for s in sents) / len(sents)
        if avg > 30:
            out.append(('SOFT', f'average sentence {avg:.0f} words, well past the corpus norm of ~23'))
    return out


def walk(roots):
    skip = {'node_modules', '.git', 'dist', 'build', '.nx', 'coverage', 'tool-results'}
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, files in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in skip]
            for f in files:
                if f.endswith('-approach.html') or (f.endswith('.md') and '/docs/' in dirpath + '/'):
                    yield os.path.join(dirpath, f)


def main():
    if '--stdin' in sys.argv:
        try:
            p = json.load(sys.stdin)
        except Exception:
            return 0
        ti = p.get('tool_input', {}) or {}
        path = ti.get('file_path') or ''
        if not path.endswith('-approach.html'):
            return 0
        text = ti.get('content') or ti.get('new_string') or ''
        if not text:
            return 0
        found = check(path, text)
        if not found:
            return 0
        body = '\n'.join(f'  - [{sev}] {msg}' for sev, msg in found)
        print(json.dumps({'systemMessage':
            'Approach-doc standard — this file misses bars the book states:\n' + body +
            "\n  Load `refs/doc-sets.md` (One voice) and the `plan` skill's approach-document section."}))
        return 0

    roots = [a for a in sys.argv[1:] if not a.startswith('-')] or ['.']
    tot = {'BLOCK': 0, 'RULE': 0, 'SOFT': 0}
    files = 0
    dirty = 0
    for path in sorted(walk(roots)):
        try:
            text = open(path, encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        files += 1
        found = check(path, text)
        if not found:
            continue
        dirty += 1
        print(os.path.relpath(path))
        for sev, msg in found:
            tot[sev] += 1
            print(f'   [{sev}] {msg}')
    print(f'\n{files} documents scanned · {dirty} with findings · '
          f"BLOCK {tot['BLOCK']} · RULE {tot['RULE']} · SOFT {tot['SOFT']}")
    return 1 if tot['BLOCK'] else 0


if __name__ == '__main__':
    sys.exit(main())
