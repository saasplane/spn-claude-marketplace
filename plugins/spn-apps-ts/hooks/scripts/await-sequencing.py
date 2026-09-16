#!/usr/bin/env python3
"""Refuse a `.then()` chain in a server node's source, at the moment it is written.

**The rule.** On the server, `await` is how one thing is sequenced after another. A chain says the
same thing at more length, and it is a second style in a file whose every other function awaits
(RD.APPS.106, stated in `providers/apps/ts/03-code-patterns.md`). A chapter is where the next
function gets copied from, and a chapter cannot fire when somebody writes the file.

**The exception is a synchronous callback contract the code does not own.** A library that takes a
callback and expects nothing back cannot be handed an async function: the promise it returns is one
nobody awaits, so a rejection goes unhandled. The outer function stays synchronous and the work
sits in a deliberately unawaited immediate async function:

    void (async () => {
      try {
        const allowed = await resolveOrigin(safeOrigin);
        callback(allowed ? null : new Error(CORS_REFUSAL), allowed);
      } catch (error) {
        callback(error instanceof Error ? error : new Error(CORS_REFUSAL), false);
      }
    })();
    return;

**What it never reads, and that is most of what it would have hit.** An awaited `.catch()` supplying
a fallback value — `await response.json().catch(() => null)` — is an expression with a default
rather than control flow, and a `try` block around it is longer and says less. So this script reads
`.then(` and nothing else.

**Where it reads.** A node's own `src/`, in a node whose kind names the server runtime:
`APP_SERVER`, `APP_UTILITY`, `MODULE_SERVER`, `SUPPORT_SERVER`. The side comes from the node's own
`spkind.json`, the way the sibling checks read a kind. A web node is not this rule's subject. Nor is
a universal one, whose code runs in a browser as well. A node's `tests/` tree is left alone too: a
suite races a promise against a deadline and chains to do it, which is the tier's own idiom.

It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
replacement, and a half-statement scored on its own is how a hook reports green having checked
nothing. It then denies only for a chain the write itself introduces, so a finding elsewhere in the
file does not block an unrelated edit. Comment and string bodies are blanked first, so a chain
quoted in a doc comment is never judged.

It denies rather than warns. The rule is settled, ruled by the developer on 2026-09-16, and both
stack trees' server source is clean, so a refusal never blocks a legitimate write.

  hook :  await-sequencing.py --stdin        (PreToolUse JSON on stdin; denies with the fix named)
  scan :  await-sequencing.py <path> …       (any file or tree; prints every finding it can see)
"""
import importlib.util, json, os, re, sys

SKIP = {'node_modules', 'dist', 'build', '.git', '.nx', 'coverage', '.output', '__pycache__'}
# The runtime is implied by the kind (the TypeScript kinds registry). These four name the server.
SERVER_KINDS = {'APP_SERVER', 'APP_UTILITY', 'MODULE_SERVER', 'SUPPORT_SERVER'}
CHAIN = re.compile(r'\.then\s*\(')
REMEDY = ('Sequence it with await inside the function, so a rejection reaches the surrounding try. '
          'Where a library owns a synchronous callback and expects nothing back, keep the outer '
          'function synchronous and put the work in a deliberately unawaited immediate async '
          'function: void (async () => { try { … } catch (error) { … } })(); return;. An awaited '
          '.catch() supplying a fallback value, such as await response.json().catch(() => null), '
          'is an expression default rather than control flow, and this check never reads it.')

_SIBLING = None


def sibling():
    """`resulting_text`, `mask` and `introduced` live once, in the sibling hook. An Edit carries
    only its replacement, so it is applied to what is on disk before anything is measured, and
    comment and string bodies are blanked at the same offsets before anything is matched."""
    global _SIBLING
    if _SIBLING is None:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enablement-grammar.py')
        spec = importlib.util.spec_from_file_location('enablement_grammar', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _SIBLING = module
    return _SIBLING


def node_kind(path):
    """The declared kind of the node holding this file, from the nearest `spkind.json` above it.

    The walk stops at the repository root, so a file outside every node answers None rather than
    borrowing a kind from somewhere further up the machine.
    """
    here = os.path.dirname(os.path.abspath(path))
    while True:
        manifest = os.path.join(here, 'spkind.json')
        if os.path.isfile(manifest):
            try:
                with open(manifest, encoding='utf8') as handle:
                    return (json.load(handle) or {}).get('kind')
            except Exception:
                return None
        if os.path.isfile(os.path.join(here, 'sprepo.json')) or os.path.isdir(os.path.join(here, '.git')):
            return None
        parent = os.path.dirname(here)
        if parent == here:
            return None
        here = parent


def watched(path):
    """A server node's own source: a `.ts` file under its `src/`, and never a spec."""
    normalized = os.path.abspath(path).replace(os.sep, '/')
    if not normalized.endswith('.ts') or '/src/' not in normalized:
        return False
    base = os.path.basename(normalized)
    if '.spec.' in base or '.test.' in base:
        return False
    return node_kind(path) in SERVER_KINDS


def findings(source, added):
    """Every `.then(` this text carries, outside a comment and outside a string.

    `added` is the text the write introduces, or None for a scan. A chain is judged only when the
    write carries its line, so a chain elsewhere in the file does not block an unrelated edit.
    """
    masked = sibling().mask(source)
    found = []
    for match in CHAIN.finditer(masked):
        start = source.rfind('\n', 0, match.start()) + 1
        end = source.find('\n', match.end())
        if end == -1:
            end = len(source)
        if not sibling().introduced(source, (start, end), added):
            continue
        line = source.count('\n', 0, match.start()) + 1
        found.append(f'line {line}: {source[start:end].strip()[:110]}')
    return found


def deny(reason):
    json.dump({'systemMessage': reason.splitlines()[0],
               'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                      'permissionDecision': 'deny',
                                      'permissionDecisionReason': reason}}, sys.stdout)
    sys.exit(0)


def run_stdin():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0                                  # unparsable input allows, as the sibling hooks do
    tool_input = event.get('tool_input') or {}
    path = tool_input.get('file_path') or ''
    if not watched(path):
        return 0
    try:
        source, added = sibling().resulting_text(tool_input, path)
    except Exception:
        source = added = tool_input.get('content') or tool_input.get('new_string')
    if source is None:
        return 0
    try:
        found = findings(source, added)
    except Exception:
        return 0                                  # a parse this script cannot do allows, never blocks
    if not found:
        return 0
    lines = [f'Denied — on the server, await is how you sequence work. In {os.path.basename(path)}:']
    lines += [f'  - {item}' for item in found]
    lines.append(f'  {REMEDY}')
    deny('\n'.join(lines))
    return 0


def run_scan(paths):
    total = 0
    for root in paths:
        targets = [root] if os.path.isfile(root) else []
        for base, folders, files in os.walk(root):
            folders[:] = [folder for folder in folders if folder not in SKIP]
            targets += [os.path.join(base, filename) for filename in files]
        for target in sorted(set(targets)):
            if not watched(target):
                continue
            try:
                with open(target, encoding='utf8', errors='replace') as handle:
                    source = handle.read()
            except OSError:
                continue
            for item in findings(source, None):
                total += 1
                print(f'{target}: {item}')
    print(f'\n{total} finding(s) — a .then() chain in a server node\'s source')
    return 1 if total else 0


if __name__ == '__main__':
    paths = [argument for argument in sys.argv[1:] if argument != '--stdin']
    sys.exit(run_stdin() if '--stdin' in sys.argv else run_scan(paths or ['.']))
