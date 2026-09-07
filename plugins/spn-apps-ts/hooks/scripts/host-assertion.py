#!/usr/bin/env python3
"""Refuse an unanchored host pattern in a navigation assertion, at the moment it is written.

**The defect this exists for, diagnosed 2026-09-06.** A journey asked *are we back on our own
hosts* with `/lc-spndemo\\.app/` and the answer was always yes. A provider's authorize URL carries
our `redirect_uri` in its query string, so the loose pattern matched while the browser sat on the
vendor's consent screen. The wait returned instantly, `toHaveURL(OUR_HOSTS)` agreed, and the
journey then hunted for our signup form on the vendor's page. **Every such check silently could
not fail** — which is worse than no check, because a green run was reporting a page nobody had
reached.

**The rule.** A host assertion anchors. Compare `new URL(...).hostname` for equality, or use a
pattern anchored at the front or the end. A pattern that can match inside a query string cannot
answer a question about where the browser IS.

  bad   /lc-spndemo\\.app/                                     matches inside a redirect_uri
  good  /^https:\\/\\/[a-z0-9-]+(\\.[a-z0-9-]+)*\\.example\\.app(\\/|$)/
  good  expect(new URL(page.url()).hostname).toBe('example.app')

**Two conditions, both required, so the check stays precise.** The literal must look like a host
— a label, an escaped dot, a TLD — and be unanchored at both ends. And its statement must be
about navigation: a `url`, a `hostname`, a `waitForURL`, a `toHaveURL`, a redirect.

Source is tokenized rather than pattern-matched, because a regex literal, a string and a comment
all carry slashes and dots. The file that documents this defect quotes the bad pattern in a
comment, and a scanner that flagged it would refuse the very page explaining the rule.

  hook :  host-assertion.py --stdin        (PreToolUse JSON on stdin; denies with the fix named)
  scan :  host-assertion.py <path> …       (any file or tree; prints every finding it can see)
"""
import importlib.util, json, os, re, sys

CODE = ('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs')
SKIP = {'node_modules', 'dist', 'build', '.git', '.nx', 'coverage', '.output', '__pycache__'}
# The statement is about where the browser is. Kept short and specific: each member is a word a
# navigation assertion actually uses, and none of them is ordinary prose.
# The boundary is letters rather than \b: the constant a journey assigns the pattern to is
# usually the context — `OUR_HOSTS` is the real 2026-09-06 name — and `_` is a word character,
# so \b never fires inside it.
CONTEXT = re.compile(r'(?<![A-Za-z])(url|urls|href|hostname|host|hosts|origin|origins|location|'
                     r'baseURL|waitForURL|toHaveURL|navigat\w*|redirect\w*|page\.url)'
                     r'(?![A-Za-z])', re.I)
# A label, an escaped dot, a TLD — the shape of a domain written into a regex.
HOSTISH = re.compile(r'[A-Za-z0-9][A-Za-z0-9-]*\\\.[A-Za-z]{2,24}')
REF = ('Anchor it: `/^https:\\/\\/…(\\/|$)/`, or assert on `new URL(u).hostname` equality. '
       'An unanchored pattern also matches `evil-yourdomain.app.attacker.com`, so anchoring is '
       'the fix in both directions.')


def literals(source):
    """Every regex literal in a JS or TS source, with the offset it starts at.

    A hand-rolled scan, because a slash means four things. `/` opens a comment, divides, opens a
    regex, or sits inside a string — and the only way to tell is to walk the text carrying state.
    A regex may open where a value may not follow: after an operator, a comma, a bracket or the
    start of a statement, never after an identifier, a number or a closing paren.
    """
    out, index, previous = [], 0, ''
    size = len(source)
    while index < size:
        char = source[index]
        if char in '\'"`':
            quote, index = char, index + 1
            while index < size:
                if source[index] == '\\':
                    index += 2
                    continue
                if source[index] == quote:
                    break
                index += 1
            index += 1
            previous = 'value'
            continue
        if char == '/' and index + 1 < size and source[index + 1] == '/':
            index = source.find('\n', index)
            if index == -1:
                break
            continue
        if char == '/' and index + 1 < size and source[index + 1] == '*':
            end = source.find('*/', index + 2)
            index = size if end == -1 else end + 2
            continue
        if char == '/' and previous != 'value':
            start, index, klass = index, index + 1, False
            while index < size:
                here = source[index]
                if here == '\\':
                    index += 2
                    continue
                if here == '[':
                    klass = True
                elif here == ']':
                    klass = False
                elif here == '/' and not klass:
                    break
                elif here == '\n':
                    break
                index += 1
            if index < size and source[index] == '/':
                out.append((start, source[start + 1:index]))
                index += 1
                while index < size and source[index].isalpha():
                    index += 1
                previous = 'value'
                continue
            index = start + 1
            continue
        if char.isalnum() or char in '_$)]':
            previous = 'value'
        elif not char.isspace():
            previous = 'op'
        index += 1
    return out


def anchored(body):
    """Anchored at the front or the back. A group closing on `(\\/|$)` ends the match at a
    boundary, which is the same guarantee as a bare `$`."""
    body = body.strip()
    return body.startswith('^') or body.endswith('$') or body.endswith('$)')


def statement(source, offset):
    """The text a reader would call this literal's statement — back to the previous line break
    that ends a statement, forward to the end of its own line."""
    start = max(0, offset - 240)
    head = source[start:offset]
    for mark in (';', '{', '}'):
        cut = head.rfind(mark)
        if cut != -1:
            head = head[cut + 1:]
    tail = source[offset:source.find('\n', offset) if source.find('\n', offset) != -1 else len(source)]
    return head + tail


def check(source):
    found = []
    for offset, body in literals(source):
        if anchored(body) or not HOSTISH.search(body):
            continue
        context = statement(source, offset)
        if not CONTEXT.search(context):
            continue
        line = source.count('\n', 0, offset) + 1
        found.append({'line': line, 'literal': '/' + body + '/',
                      'text': ' '.join(context.split())[:120]})
    return found


def shared():
    """`resulting_text` and `introduced` live once, in the sibling hook. An Edit carries only its
    replacement, so the replacement is applied to what is on disk — scoring the fragment alone is
    how a hook reports green having checked nothing."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enablement-grammar.py')
    spec = importlib.util.spec_from_file_location('enablement_grammar', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.resulting_text, module.introduced


def run_stdin():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0                                  # unparsable input allows, as the sibling hooks do
    tool_input = event.get('tool_input') or {}
    path = tool_input.get('file_path') or ''
    if not path.endswith(CODE):
        return 0
    if '/hooks/scripts/' in os.path.abspath(path).replace(os.sep, '/'):
        return 0                                  # a hook's own source quotes the pattern it bans
    try:
        resulting_text, _ = shared()
        source, added = resulting_text(tool_input, path)
    except Exception:
        source = tool_input.get('content') or tool_input.get('new_string')
        added = source
    if source is None:
        return 0
    try:
        found = [f for f in check(source) if added is None or f['literal'] in added]
    except Exception:
        return 0                                  # a parse this script cannot do allows, never blocks
    if not found:
        return 0
    lines = [f'Denied — an unanchored host pattern in a navigation assertion, in '
             f'{os.path.basename(path)}:']
    for item in found:
        lines.append(f"  line {item['line']}: {item['literal']} — {item['text']}")
    lines.append('  A pattern with no anchor matches inside a query string, so a provider page '
                 'carrying your redirect_uri passes the check. ' + REF)
    json.dump({'systemMessage': lines[0],
               'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                      'permissionDecision': 'deny',
                                      'permissionDecisionReason': '\n'.join(lines)}}, sys.stdout)
    return 0


def run_scan(paths):
    total = 0
    for root in paths:
        targets = [root] if os.path.isfile(root) else []
        for base, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in SKIP]
            targets += [os.path.join(base, f) for f in files]
        for target in sorted(set(targets)):
            if not target.endswith(CODE):
                continue
            try:
                with open(target, encoding='utf8', errors='replace') as handle:
                    source = handle.read()
            except OSError:
                continue
            for item in check(source):
                total += 1
                print(f"{target}:{item['line']}: {item['literal']} — {item['text']}")
    print(f'\n{total} unanchored host assertion(s)')
    return 1 if total else 0


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    sys.exit(run_stdin() if '--stdin' in sys.argv else run_scan(args or ['.']))
