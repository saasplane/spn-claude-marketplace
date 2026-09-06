#!/usr/bin/env python3
"""The orientation a session opens with — read from the ground, never from a typed list.

Source of truth: the foundation's `CONCEPT.md` (`#### DevEx Workspace`) and RD.DEVEX.020, and
the workspace-level argument that decided this shape. A workspace file naming its members in
prose goes stale the first time somebody clones an eighth repo, so nothing here is typed: the
script walks the root, reads each `sprepo.json` for the world and the stack claim, checks each
repo's wiring against what that claim implies, and lists the workstreams in all three states.

  SessionStart :  orientation.py --stdin      (the hook, from the event JSON on stdin; the
                                               text goes out as systemMessage + additionalContext)
  by hand      :  orientation.py [path]       (the same text on stdout, so you can read it)

Three parts, in this order — a session that opens with a status dump reads like a build log:

  1. a welcome
  2. the ground — the members, the law each carries, the wiring, and every workstream
  3. ONE question, and never a typed list of options. You arrive with something in mind, and
     a leading question picks your subject for you.

A workstream carries its state in its parent folder, so the three are read and shown together:
`open/` is available now, `backlog/` is parked, and `closed/` is the receipt. The number in the
folder name is assigned once in creation order and never reused, so it is an identity rather
than a priority — a workstream keeps it when it moves state.

Day zero is the special case. No `sprepo.json` anywhere means there is no code to read, so the
agent asks instead of reading and the rung points at the `day-zero` skill.

Exit code is always 0 and every read is wrapped: a broken orientation must never cost a window.
"""
import json, os, re, sys, textwrap, time

MARKETPLACE = 'saasplane'
CORE = 'spn-core'
# The derivation `repo agent-init` already performs, from the manifest and nothing else. A repo
# with no claim at all — the marketplace itself is one — falls back to the core plugin alone.
WORLD_PLUGINS = {'FOUNDATION': (CORE,), 'INFRA': (CORE, 'spn-infra')}
SKIP = {'node_modules', '.git', 'dist', 'build', '.nx', 'coverage', '.output', 'tool-results',
        '__pycache__', '.venv'}
NODE_MANIFEST = {'APPS': 'spkind.json', 'INFRA': 'spinfrapkg.json'}
# The lifecycle, in the order a window reads it: what you can pick up, what is parked, what is
# done. A workstream's state is its parent folder and nothing else.
STATES = ('open', 'backlog', 'closed')
NUMBERED = re.compile(r'^(\d{1,4})-(.+)$')


def read_json(path):
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:
        return None


def workspace_root(start):
    """The folder the sibling checkouts sit in. A child session is rooted in one member, so the
    walk goes up: the first ancestor carrying `.spndevex/`, else the first with a member under
    it, else where you started."""
    path = os.path.abspath(start)
    seen = []
    while True:
        seen.append(path)
        if os.path.isdir(os.path.join(path, '.spndevex')):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            break
        path = parent
    for path in seen:
        if any(has_law(os.path.join(path, d)) for d in listdir(path)):
            return path
    return os.path.abspath(start)


def listdir(path):
    try:
        return sorted(d for d in os.listdir(path) if not d.startswith('.'))
    except Exception:
        return []


def has_law(path):
    return os.path.isfile(os.path.join(path, 'sprepo.json'))


def members(root):
    """A member is a checkout sitting beside the others. Its law is `sprepo.json`; a member
    without one is an artifact surface rather than a governed repo, and says so."""
    out = []
    for name in listdir(root):
        path = os.path.join(root, name)
        if not os.path.isdir(path):
            continue
        if has_law(path) or os.path.isdir(os.path.join(path, '.git')):
            out.append((name, path))
    return out


def law_of(path):
    """World, stack claim and infra pins — from the manifest, never from the folder name."""
    manifest = read_json(os.path.join(path, 'sprepo.json')) or {}
    config = manifest.get('config') or {}
    world = manifest.get('type')
    stack = config.get('stack')
    pins = []
    for role, key in (('org', 'organization'), ('plt', 'platform')):
        entry = (config.get('infra') or {}).get(key) or {}
        package = entry.get('package')
        if not package:
            continue
        version = entry.get('version')
        pins.append(f"{role} {os.path.basename(package)}@{version or 'path'}")
    return world, stack, pins


def expected_plugins(world, stack):
    if world == 'APPS' and stack:
        return (CORE, f'spn-apps-{stack.lower()}')
    return WORLD_PLUGINS.get(world, (CORE,))


def enabled_plugins(path):
    settings = read_json(os.path.join(path, '.claude', 'settings.json')) or {}
    return {key.split('@')[0] for key, on in (settings.get('enabledPlugins') or {}).items() if on}


def count_nodes(path, world):
    """A node declares itself. `spkind.json` for an apps node, `spinfrapkg.json` for an estate
    one — a per-world question, never a per-stack one."""
    manifest = NODE_MANIFEST.get(world)
    if not manifest:
        return None
    found, base = 0, os.path.abspath(path)
    for dirpath, dirnames, files in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP and not d.startswith('.')]
        if dirpath.count(os.sep) - base.count(os.sep) > 3:
            dirnames[:] = []
            continue
        found += manifest in files
    return found


def age(seconds):
    days = int((time.time() - seconds) // 86400)
    if days <= 0:
        return 'touched today'
    if days == 1:
        return 'touched yesterday'
    return f'untouched {days} days'


def newest(paths):
    stamps = []
    for path in paths:
        try:
            stamps.append(os.path.getmtime(path))
        except Exception:
            continue
    return max(stamps) if stamps else 0


def tree_files(path):
    out = []
    for dirpath, dirnames, files in os.walk(path):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        out += [os.path.join(dirpath, f) for f in files]
    return out


def numbered(folder):
    """`007-release-confidence` reads as number `007`, subject `release-confidence`. A folder
    carrying no number is still a workstream — the older shapes have none."""
    match = NUMBERED.match(folder)
    return (match.group(1), match.group(2)) if match else ('', folder)


def workstreams(root):
    """Every workstream and the state it sits in — the shape, and the two it replaces.

    `workstreams/{open,backlog,closed}/{NNN}-{subject}/` is the shape. One window restructures
    `.spndevex/` and another may open before it lands, so `sessions/{state}/{subject}/` and a
    bare `arcs/arc-{subject}.md` are read the same way and marked as legacy.
    """
    devex = os.path.join(root, '.spndevex')
    found = {}
    for state in STATES:
        for base, legacy in ((os.path.join(devex, 'workstreams', state), ''),
                             (os.path.join(devex, 'sessions', state), 'sessions/')):
            for folder in listdir(base):
                path = os.path.join(base, folder)
                if not os.path.isdir(path) or folder in found:
                    continue
                files = tree_files(path)
                number, subject = numbered(folder)
                found[folder] = {
                    'folder': folder, 'number': number, 'subject': subject, 'state': state,
                    'page': any(f.endswith('-approach.html') for f in files),
                    'arcs': len([f for f in files if os.path.basename(f).startswith('arc-')]),
                    'when': newest(files) or newest([path]),
                    'legacy': legacy,
                }
    for name in listdir(os.path.join(devex, 'arcs')):
        if not (name.startswith('arc-') and name.endswith('.md')):
            continue
        subject = name[len('arc-'):-len('.md')]
        if subject in found:
            continue
        arc = os.path.join(devex, 'arcs', name)
        page = os.path.join(devex, 'notes', f'{subject}-approach.html')
        found[subject] = {'folder': subject, 'number': '', 'subject': subject, 'state': 'open',
                          'page': os.path.isfile(page), 'arcs': 1,
                          'when': newest([arc, page]), 'legacy': 'arcs/'}
    return sorted(found.values(), key=lambda w: (w['number'] or 'zzz', w['subject']))


def cache_state(root, plugin_names):
    """Whether the cache a live window is judged by matches the source it was built from.

    The install directory is shared across the machine and the version moves, so the version is
    globbed rather than named, and a directory carrying `.orphaned_at` is skipped — it is a
    previous install nothing loads. Any surprise reads as unknown rather than as current.
    """
    settings = read_json(os.path.join(root, '.claude', 'settings.json')) or {}
    sources = settings.get('extraKnownMarketplaces') or {}
    stale = []
    for market, entry in sources.items():
        source = ((entry or {}).get('source') or {}).get('path')
        if not source or not os.path.isdir(source):
            return 'cache unknown'
        for plugin in plugin_names:
            live = os.path.join(source, 'plugins', plugin)
            cached = os.path.join(os.path.expanduser('~'), '.claude', 'plugins', 'cache',
                                  market, plugin)
            versions = [v for v in listdir(cached)
                        if not os.path.exists(os.path.join(cached, v, '.orphaned_at'))]
            if not os.path.isdir(live) or not versions:
                return 'cache unknown'
            if any(digest(os.path.join(cached, v)) != digest(live) for v in versions):
                stale.append(plugin)
    if stale:
        return 'cache stale — ' + ' '.join(sorted(set(stale)))
    return 'cache current'


def digest(path):
    """A tree's content, ignoring what a copy legitimately changes: byte-compiled caches, and
    the timestamps a copy rewrites. Sizes and names are enough to catch an edit that has not
    been installed yet, which is the whole question."""
    out = []
    base = os.path.abspath(path)
    for dirpath, dirnames, files in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for name in sorted(files):
            full = os.path.join(dirpath, name)
            try:
                out.append((os.path.relpath(full, base), os.path.getsize(full)))
            except Exception:
                continue
    return sorted(out)


def rung(root, repos):
    """Which rung of the ladder the ground says you are on. The offer depends on it, so a
    partner in week one and a partner in month six get different sessions. Rungs past building
    need the machine store and the network, so this stops where the workspace can answer."""
    if not repos:
        return 0, 'empty — no sprepo.json anywhere'
    apps = [r for r in repos if r['world'] == 'APPS']
    if not apps:
        return 1, 'estate only — no APPS repo yet'
    without_concept = [r for r in apps if not os.path.isfile(os.path.join(r['path'], 'CONCEPT.md'))]
    if without_concept:
        return 2, 'an APPS repo carries no CONCEPT.md — ' + ' '.join(r['name'] for r in without_concept)
    if all((r['nodes'] or 0) < 3 for r in apps):
        return 3, 'concept present, very few nodes below it'
    return 4, 'building — apps and packages present'


def orient(root, cwd):
    repos = []
    for name, path in members(root):
        world, stack, pins = law_of(path)
        want = expected_plugins(world, stack)
        have = enabled_plugins(path)
        repos.append({'name': name, 'path': path, 'world': world, 'stack': stack, 'pins': pins,
                      'want': want, 'have': have, 'wired': set(want) <= have,
                      'nodes': count_nodes(path, world)})
    governed = [r for r in repos if r['world']]
    streams = workstreams(root)
    level, why = rung(root, governed)

    if not governed:
        text = ('Welcome to SaaS Plane — this folder is minted and completely empty. A clean '
                'start.\n\n'
                'Nothing to read yet, so the shape comes first. When you are ready there are '
                'five\nquestions, and your answers name every account, package and prefix that '
                'follows.\n\nHow can I help?\n')
        note = ('\n---\nDay-0 mode: no sprepo.json under ' + root + '. You have no code to read, '
                'so do not orient — load the `day-zero` skill and walk it. Ask the five estate '
                'questions first, in order, and let the developer answer before any act.\n')
        return text, note

    lines = ['Good to see you.', '']
    settings = read_json(os.path.join(root, '.claude', 'settings.json')) or {}
    floor = [k for k, on in (settings.get('enabledPlugins') or {}).items() if on]
    plugins = sorted({k.split('@')[0] for k in floor})
    head = (f'floor {len(plugins)} plugins · {cache_state(root, plugins)}' if plugins
            else 'floor not minted — no plugins enabled here')
    lines.append(f'workspace  {root}   {head}')
    if os.path.abspath(cwd) != root:
        lines.append(f'rooted in  {os.path.relpath(os.path.abspath(cwd), root)}')
    lines.append('')

    def column(key, pad=2):
        return max(len(key(r)) for r in repos) + pad
    name_w = column(lambda r: r['name'])
    claim_w = column(lambda r: claim(r))
    plugin_w = column(lambda r: ' '.join(r['want']))
    for r in repos:
        facts = []
        if not r['world']:
            facts.append('no claim')
        if r['nodes']:
            facts.append(f"{r['nodes']} node" + ('s' if r['nodes'] != 1 else ''))
        facts += r['pins']
        lines.append(f"{r['name']:<{name_w}}{claim(r):<{claim_w}}"
                     f"{' '.join(r['want']):<{plugin_w}}"
                     f"{'wired' if r['wired'] else 'UNWIRED':<9}" + ' · '.join(facts))
    lines.append('')

    lines += workstream_lines(streams)
    lines += ['', 'How can I help?', '']
    note = (f'\n---\nGround, read at load — the members, their law, and every workstream in all '
            f'three states. `open/` is available now, `backlog/` is parked behind a named '
            f'blocker, and `closed/` is the receipt. The number is an identity, never a '
            f'priority. Rung {level}: {why}. Say hello with the welcome above, then this ground, '
            f'then one open question. Never turn the rung into a menu.\n')
    return '\n'.join(line.rstrip() for line in lines), note


def workstream_lines(streams):
    """What is available now, above what is parked, above the receipt. State is printed on every
    row rather than as a heading, so a window skimming one line still knows what it is looking
    at. Closed collapses to one wrapped line — its number is what a later sitting cites."""
    if not streams:
        return ['workstreams   none yet — a subject becomes one by mkdir under backlog/ or open/']
    by_state = {state: [w for w in streams if w['state'] == state] for state in STATES}
    tally = ' · '.join(f'{len(by_state[state])} {state}' for state in STATES if by_state[state])
    out = [f'workstreams   {tally}']
    live = by_state['open'] + by_state['backlog']
    width = max([len(w['subject']) for w in live] or [0]) + 4
    for state in ('open', 'backlog'):
        for w in by_state[state]:
            marks = ['approach page' if w['page'] else 'no approach page yet',
                     f"{w['arcs']} arc" + ('s' if w['arcs'] != 1 else ''),
                     age(w['when'])]
            if w['legacy']:
                marks.append('still in ' + w['legacy'])
            out.append(f"  {state:<9}{w['number'] or '—':<5}{w['subject']:<{width}}"
                       + ' · '.join(marks))
    if by_state['closed']:
        done = ' · '.join(w['folder'] for w in by_state['closed'])
        wrapped = textwrap.wrap(done, 84) or ['']
        out.append(f"  {'closed':<9}{wrapped[0]}")
        out += [' ' * 11 + line for line in wrapped[1:]]
    return out


def claim(repo):
    if not repo['world']:
        return '—'
    return repo['world'] + (f" · {repo['stack']}" if repo['stack'] else '')


def main():
    stdin_mode = '--stdin' in sys.argv
    cwd = os.getcwd()
    if stdin_mode:
        try:
            cwd = (json.load(sys.stdin) or {}).get('cwd') or cwd
        except Exception:
            pass
    else:
        args = [a for a in sys.argv[1:] if not a.startswith('-')]
        cwd = args[0] if args else cwd
    try:
        text, note = orient(workspace_root(cwd), cwd)
    except Exception as err:                            # never cost a window
        if not stdin_mode:
            print(f'orientation unavailable: {err}', file=sys.stderr)
        return 0
    if stdin_mode:
        # The same ground twice, and the agent's copy carries one line more: `systemMessage` is
        # the developer's pane, `additionalContext` is what the agent reads and acts on.
        print(json.dumps({'systemMessage': text,
                          'hookSpecificOutput': {'hookEventName': 'SessionStart',
                                                 'additionalContext': text + note}}))
    else:
        print(text + note)
    return 0


if __name__ == '__main__':
    sys.exit(main())
