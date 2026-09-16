#!/usr/bin/env python3
"""Refuse a read verb that returns an XList under a plural name, at the moment it is written.

A method returning an `XList` is named for that type. The rule governs read verbs, which is every
method whose name starts with `get`. These are the shapes it allows:

  getAll<Plural>         returning <X>List   is named   getAll<X>List
  get<Plural>            returning <X>List   is named   get<X>List
  get<Plural>By<Scope>   returning <X>List   is named   get<X>ListBy<Scope>

So a `get…` method returning `Promise<…List>` matches `get…List` or `get…ListBy…`, and nothing
else. The book taught the plural form and the code copied it, until the stack repos renamed every
read on 2026-09-16. This script keeps the plural from coming back: a chapter is where the next
method gets copied from, and a chapter cannot fire when you write the file.

What it leaves alone matters as much. A read returning a keyed map (`Promise<OrgMetas>`,
`Promise<GroupInfos>`) keeps its plural name, because a plural promising a map is the rule
working. A write verb is not judged, whatever it returns. `search…` returns a `SearchResult` and
is not judged either.

Where it reads. The name is declared once, in a contract interface under `src/contract/services/`
in a stack repo. The service and the controller repeat it, and the typecheck makes them follow the
interface, so judging the interface is enough. A signature may span lines, so the parameter list
is matched across them.

It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
replacement, and a half-signature scored on its own is how a hook reports green having checked
nothing. It then denies only for a method the write itself names, so a finding elsewhere in the
file does not block an unrelated edit. Comment and string bodies are masked first, so a signature
quoted in a doc comment is never judged.

It denies rather than warns. The rule is settled, ruled by the developer on 2026-09-16, and both
stack trees are clean, so a refusal never blocks a legitimate write.

  hook :  read-verb-naming.py --stdin        (PreToolUse JSON on stdin; denies with the fix named)
  scan :  read-verb-naming.py <path> …       (any file or tree; prints every finding it can see)
"""
import importlib.util, json, os, re, sys

SKIP = {'node_modules', 'dist', 'build', '.git', '.nx', 'coverage', '.output', '__pycache__'}
WATCHED = '/src/contract/services/'
# A declaration: a read verb, its parameter list, and a return type promising an XList. The
# parameter list may span lines and may not hold a semicolon or a brace, so the match never runs
# on into the next method.
READ_LIST_DECLARATION = re.compile(
    r'\b(get[A-Z][A-Za-z0-9_]*)\s*(?:<[^()>]*>)?\s*\(([^;{}]*?)\)\s*:\s*'
    r'Promise\s*<\s*([A-Z][A-Za-z0-9_]*List)\s*>', re.S)
# The shapes the rule allows.
NAMED_FOR_ITS_LIST = re.compile(r'get[A-Za-z0-9_]*List(?:By[A-Z][A-Za-z0-9_]*)?')
REMEDY = ('A method whose name starts with get and returns an XList is named for that list. It '
          'takes one of these shapes: getAll<X>List, get<X>List, or get<X>ListBy<Scope>. Rename '
          'the method in this interface; the typecheck carries the rename to the service and the '
          'controller. A read that returns a keyed map, such as Promise<OrgMetas>, keeps its '
          'plural name. Write verbs and search… are not judged.')

_SIBLING = None


def sibling():
    """`resulting_text` and `mask` live once, in the sibling hook. An Edit carries only its
    replacement, so it is applied to what is on disk before anything is measured, and comment and
    string bodies are blanked at the same offsets before anything is matched."""
    global _SIBLING
    if _SIBLING is None:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enablement-grammar.py')
        spec = importlib.util.spec_from_file_location('enablement_grammar', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _SIBLING = module
    return _SIBLING


def watched(path):
    normalized = os.path.abspath(path).replace(os.sep, '/')
    return normalized.endswith('.ts') and WATCHED in normalized


def suggested_name(name, list_type):
    """The name the rule asks for, built from the type the method already promises."""
    prefix = 'getAll' if re.match(r'getAll[A-Z]', name) else 'get'
    scope = re.search(r'By[A-Z][A-Za-z0-9_]*$', name[len(prefix):])
    return prefix + list_type[:-len('List')] + 'List' + (scope.group(0) if scope else '')


def findings(source, added):
    """Every read verb in this text that promises an XList under a name the rule does not allow.

    `added` is the text the write introduces, or None for a scan. A method is judged only when the
    write names it, so a finding elsewhere in the file does not block an unrelated edit.
    """
    masked = sibling().mask(source)
    found = []
    for match in READ_LIST_DECLARATION.finditer(masked):
        name, list_type = match.group(1), match.group(3)
        if NAMED_FOR_ITS_LIST.fullmatch(name):
            continue
        if added is not None and re.search(r'\b' + re.escape(name) + r'\s*[<(]', added) is None:
            continue
        line = source.count('\n', 0, match.start()) + 1
        found.append(f'line {line}: {name} returns Promise<{list_type}> — '
                     f'name it {suggested_name(name, list_type)}')
    return found


def deny(reason):
    json.dump({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}, sys.stdout)
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
    lines = [f'Denied — a read verb is named for the list it returns. In {os.path.basename(path)}:']
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
    print(f'\n{total} finding(s) — a read verb returning an XList under a plural name')
    return 1 if total else 0


if __name__ == '__main__':
    paths = [argument for argument in sys.argv[1:] if argument != '--stdin']
    sys.exit(run_stdin() if '--stdin' in sys.argv else run_scan(paths or ['.']))
