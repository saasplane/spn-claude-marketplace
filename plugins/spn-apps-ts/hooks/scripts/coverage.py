#!/usr/bin/env python3
"""Two write-time warnings about proof: a route nothing exercises, and a mutation nothing undoes.

**These are the conservative core of two rules whose full model is not settled yet.** The
coverage model belongs to its own arc; what is here is the part a script can check today without
inventing one, and each check is written so it tightens rather than gets replaced.

  route-e2e      A route added with no case naming it. A route reaches production through the
                 entry layer, and the only proof that its wiring works is a case that calls it.
                 **Covered, for now, means the route's own path literal appears somewhere under a
                 test tree in the same repo.** That is a proxy for a real coverage model: it does
                 not know a tier, it cannot tell an e2e case from a unit test, and it counts a
                 mention in a comment. It under-reports on purpose. When the coverage model lands,
                 this is the function to replace — the trigger and the message stay.

  spec-restore   A spec that mutates shared state and carries no interrupt-safe restore. An
                 un-restored mutation makes every later red lie, because the baseline moved and
                 the next run is measuring a different world. **A trailing statement at the end of
                 a test body is not a restore** — a failure above it skips it, and a failure above
                 it is exactly when the mutation most needs undoing. So the check asks for an
                 `afterEach`, an `afterAll` or a `finally`, which survive the throw.
                 **What counts as a mutation is a named list**, grounded in what this estate's own
                 suites do. It grows; it never becomes a guess.

Both warn and neither refuses. The rules behind them are still being written, and a gate that
refuses on a definition nobody has agreed teaches people to work around it.

  hook :  coverage.py --check route-e2e --stdin
          coverage.py --check spec-restore --stdin
  scan :  coverage.py --check <name> <path> …      (any file or tree; prints what it can see)
"""
import importlib.util, json, os, re, sys

CODE = ('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs')
SKIP = {'node_modules', 'dist', 'build', '.git', '.nx', 'coverage', '.output', '__pycache__'}
TEST_DIRS = ('tests', 'test', 'e2e', '__tests__', 'spec')
# The entry layer declares a route with this decorator, and the path literal is its second
# argument. One shape, because one support package owns every controller in the stack.
ROUTE = re.compile(r'@SPAPIRouteCommand\s*\(\s*["\']([A-Z]+)["\']\s*,\s*["\']([^"\']+)["\']')
# A mutation, as this estate's own suites write one. Every member was read off a real spec.
MUTATION = (
    (re.compile(r'\bsetBooleanEnablement\s*\('), 'flips a shared enablement'),
    (re.compile(r'\bwriteOrgTypeEnablement\s*\('), 'writes org-type enablement'),
    (re.compile(r'\brequest\.(?:post|put|patch|delete)\b', re.I), 'a mutating API call'),
    (re.compile(r'\.(?:post|put|patch|delete)\s*\(', re.I), 'a mutating API call'),
    (re.compile(r'''method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]''', re.I), 'a mutating request'),
    (re.compile(r'\b(?:INSERT\s+INTO|DELETE\s+FROM|TRUNCATE|DROP\s+TABLE)\b', re.I), 'a write to the database'),
    (re.compile(r'\bUPDATE\s+\w+\s+SET\b', re.I), 'a write to the database'),
)
# Constructs that run whatever happened above them. A trailing call at the end of a test body is
# not here, and that absence is the rule.
RESTORE = re.compile(r'\b(?:afterEach|afterAll|onTestFinished|addCleanup)\s*\(|\bfinally\s*\{')


def repo_root(path):
    path = os.path.dirname(os.path.abspath(path))
    while True:
        if os.path.isfile(os.path.join(path, 'sprepo.json')):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            return None
        path = parent


def test_trees(root):
    out = []
    for base, dirs, _ in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for name in list(dirs):
            if name in TEST_DIRS:
                out.append(os.path.join(base, name))
                dirs.remove(name)
    return out


_TEST_TEXT = {}


def test_text(root):
    """Every test file in the repo, read once. A controller declares many routes and a scan
    reads many controllers, so re-walking the suite per route is the difference between a hook
    you notice and one you do not."""
    if root in _TEST_TEXT:
        return _TEST_TEXT[root]
    chunks = []
    for tree in test_trees(root):
        for base, dirs, files in os.walk(tree):
            dirs[:] = [d for d in dirs if d not in SKIP]
            for name in files:
                if not name.endswith(CODE):
                    continue
                try:
                    with open(os.path.join(base, name), encoding='utf8', errors='replace') as fh:
                        chunks.append(fh.read())
                except OSError:
                    continue
    _TEST_TEXT[root] = '\n'.join(chunks)
    return _TEST_TEXT[root]


def node_root(path, root):
    """The node that owns this file — the nearest `spkind.json` above it, inside the repo."""
    here = os.path.dirname(os.path.abspath(path))
    while here.startswith(root):
        if os.path.isfile(os.path.join(here, 'spkind.json')):
            return here
        parent = os.path.dirname(here)
        if parent == here:
            break
        here = parent
    return None


def owning_app(path, root):
    """The application this file is deployed inside, or `None` for a published package.

    An app-owned module sits under its host, so the host is found by continuing up past the
    module's own `spkind.json` to the outermost `APP_*` node still inside the repo.
    """
    here, found = os.path.dirname(os.path.abspath(path)), None
    while here.startswith(root):
        manifest = os.path.join(here, 'spkind.json')
        if os.path.isfile(manifest):
            try:
                with open(manifest, encoding='utf8') as fh:
                    if ((json.load(fh) or {}).get('kind') or '').startswith('APP_'):
                        found = here
            except Exception:
                pass
        parent = os.path.dirname(here)
        if parent == here:
            break
        here = parent
    return found


def covered(root, route, path=None):
    """Where this route is proven, under the rule the coverage model settled.

    **An application owns the journeys of the surfaces it deploys** (RD.APPS.087, RD.APPS.088), so
    a route is covered by a case in its OWN node's test tree. A case at the workspace root used to
    count and no longer does: the workspace owns only what no single application can resolve, and
    one route resolving is not that.

    Returns `None` when covered correctly, otherwise a phrase naming what is wrong. Covered
    elsewhere in the repo is reported differently from covered nowhere, because the two need
    different fixes — a move, or a new case.
    """
    # Only an application owns the proof of a route it deploys, so the question is which
    # application. An app-owned module ships inside its host and has no delivery of its own, so
    # its host is the answer and `owning_app` walks up to it. A published module has no host to
    # find, and cannot know which application composes it — there the repo is the honest scope.
    # Judging a published module against its own tree reported 399 findings that were all correct
    # behaviour, which is a check nobody reads twice.
    app = owning_app(path, root) if path else None
    scope = app or root
    if route in test_text(scope):
        return None
    if app and route in test_text(root):
        return ('is named only outside its own node — the application owns the journeys of the '
                'surfaces it deploys, so move the case under this project\'s test tree')
    return 'is named by no file under a test tree'


# Anchored to the start of a line, because prose says `it (` too: the second live scan read
# a helper's own comment — "it (the seeded default)" — as a test declaration.
DECLARES_TESTS = re.compile(r'^\s*(?:export\s+)?(?:test|it|describe)\s*[.(]', re.M)


def is_spec(path, source):
    """A spec, and not a helper the specs call.

    The first live scan flagged `tests/helpers/enablement.ts` and `tests/helpers/sso.ts` — both
    mutate, and neither is the thing that must restore. **The spec that calls a helper owns the
    restore**, because it is the one that knows when the mutation ends. So a file under a test
    tree qualifies only when it declares cases of its own.
    """
    base = os.path.basename(os.path.abspath(path))
    if '.spec.' in base or '.test.' in base:
        return True
    normalized = os.path.abspath(path).replace(os.sep, '/')
    return (any(f'/{d}/' in normalized for d in TEST_DIRS)
            and DECLARES_TESTS.search(source) is not None)


def check_route_e2e(path, source, added):
    root = repo_root(path)
    if not root:
        return []
    on_disk = ''
    if added is not None:                          # a write — judge only what it adds
        try:
            with open(path, encoding='utf8', errors='replace') as fh:
                on_disk = fh.read()
        except OSError:
            pass
    existing = {route for _, route in ROUTE.findall(on_disk)}
    found = []
    for method, route in ROUTE.findall(source):
        if route in existing:
            continue                               # already there — this write did not add it
        if added is not None and route not in added:
            continue
        why = covered(root, route, path)
        if why:
            found.append(f'{method} {route} — {why}')
    return found


def kind_of(path, root):
    """The declared kind of the node holding this file, from its own `spkind.json`."""
    node = node_root(path, root) if root else None
    if not node:
        return None
    try:
        with open(os.path.join(node, 'spkind.json'), encoding='utf8') as fh:
            return (json.load(fh) or {}).get('kind')
    except Exception:
        return None


def check_spec_restore(path, source, added):
    if not is_spec(path, source):
        return []
    # Shared state is an application's problem and the workspace's. A module ships no shell, so it
    # stands nothing up and doubles only a seam it owns (RD.APPS.088) — there is no shared baseline
    # beneath it to leave moved. Asking a module spec for a restore reports a mutation that cannot
    # exist, and a finding that cannot be true is one a reader learns to ignore.
    root = repo_root(path)
    if (kind_of(path, root) or '').startswith('MODULE_'):
        return []
    if RESTORE.search(source):
        return []
    found, seen = [], set()
    for pattern, why in MUTATION:
        match = pattern.search(source)
        if not match:
            continue
        if added is not None and match.group(0) not in added:
            continue
        line = source.count('\n', 0, match.start()) + 1
        if line in seen:
            continue                               # one line, one finding: `request.post` is also `.post(`
        seen.add(line)
        found.append(f'line {line}: {match.group(0).strip()} — {why}')
    return found


# A double, as this stack writes one. The target is the first string argument.
DOUBLE = re.compile(r'\b(?:vi|jest)\s*\.\s*(?:mock|doMock)\s*\(\s*["\']([^"\']+)["\']')


def check_foreign_double(path, source, added):
    """A module test doubling a seam its node does not own.

    **A node may double a seam it owns, and nothing else** (RD.APPS.088). A module ships no shell,
    so faking the generated client, the design system or a sibling module is faking the application
    around it — and the case then proves the fake rather than the product. The fix is a move, not a
    better fake: the composing application owns that proof.

    Only `@saasplane/*` targets are judged. A third-party module and a relative path are the node's
    own business, and a relative path cannot reach outside the node anyway.
    """
    root = repo_root(path)
    if not root or not is_spec(path, source):
        return []
    kind = kind_of(path, root) or ''
    if not kind.startswith('MODULE_'):
        return []
    node = node_root(path, root)
    own = os.path.basename(node) if node else ''
    found = []
    for target in DOUBLE.findall(source):
        if added is not None and target not in added:
            continue
        if not target.startswith('@saasplane/'):
            continue
        if target.split('/')[-1] == own:
            continue                               # its own package — a seam it owns
        found.append(f'{target} — a {kind} node does not own this seam')
    return found


CHECKS = {
    'route-e2e': (check_route_e2e,
                  'A route with no case naming it',
                  'Add a case that calls it before the route ships. A route nothing exercises is '
                  'wiring nobody has proven, and the first person to find out is a user. This '
                  'check reads the route path literally, so a journey that reaches the route '
                  'through the UI does not count yet — if that is what proves it, name the route '
                  'in the case or in the behaviour row, and the proof becomes findable.'),
    'spec-restore': (check_spec_restore,
                     'A spec that mutates shared state with no interrupt-safe restore',
                     'Put the restore in an `afterEach`, an `afterAll` or a `finally`, so it runs '
                     'when the test above it throws. A trailing statement at the end of the body '
                     'is skipped by exactly the failure that makes the mutation matter — and an '
                     'un-restored mutation makes every later red lie, because the baseline moved.'),
    'foreign-double': (check_foreign_double,
                       'A module test doubling a seam its node does not own',
                       'Move the case to the application that composes this module. A module ships '
                       'no shell, so a case that fakes the client, the design system or a sibling '
                       'module is standing up an application this node does not own — and it then '
                       'proves the fake rather than the product. A better fake does not fix it.'),
}


def shared():
    """`resulting_text` and `introduced` live once, in the sibling hook. An Edit carries only its
    replacement, so it is applied to what is on disk before anything is measured."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enablement-grammar.py')
    spec = importlib.util.spec_from_file_location('enablement_grammar', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.resulting_text


def run_stdin(name):
    check, title, remedy = CHECKS[name]
    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0                                  # unparsable input allows, as the sibling hooks do
    tool_input = event.get('tool_input') or {}
    path = tool_input.get('file_path') or ''
    if not path.endswith(CODE):
        return 0
    if '/hooks/scripts/' in os.path.abspath(path).replace(os.sep, '/'):
        return 0
    try:
        source, added = shared()(tool_input, path)
    except Exception:
        source = added = tool_input.get('content') or tool_input.get('new_string')
    if source is None:
        return 0
    try:
        found = check(path, source, added)
    except Exception:
        return 0                                  # a read this script cannot do allows
    if not found:
        return 0
    message = (f'{title} — {os.path.basename(path)}:\n' +
               '\n'.join(f'  - {item}' for item in found) + '\n  ' + remedy)
    print(json.dumps({'systemMessage': message,
                      'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                             'additionalContext': message}}))
    return 0


def run_scan(name, paths):
    check, title, _ = CHECKS[name]
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
            for item in check(target, source, None):
                total += 1
                print(f'{target}: {item}')
    print(f'\n{total} finding(s) — {title}')
    return 1 if total else 0


if __name__ == '__main__':
    name = sys.argv[sys.argv.index('--check') + 1] if '--check' in sys.argv else ''
    if name not in CHECKS:
        print(f'usage: coverage.py --check [{" | ".join(CHECKS)}] [--stdin | <path> …]',
              file=sys.stderr)
        sys.exit(2)
    rest = [a for a in sys.argv[1:] if not a.startswith('-') and a != name]
    sys.exit(run_stdin(name) if '--stdin' in sys.argv else run_scan(name, rest or ['.']))
