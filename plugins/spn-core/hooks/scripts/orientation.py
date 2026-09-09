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
  3. ONE open question, and never a typed list of options — you arrive with something in mind,
     and a leading question picks your subject for you. Beside it, and only when exactly one
     workstream is open and no second session is live under this root, a standing offer to
     carry that one on. Two offers is not a menu; three would be.

A workstream carries its state in its parent folder, so the three are read and shown together:
`open/` is available now, `backlog/` is parked, and `closed/` is the receipt. The number in the
folder name is assigned once in creation order and never reused, so it is an identity rather
than a priority — a workstream keeps it when it moves state.

Day zero is the special case. No `sprepo.json` anywhere means there is no code to read, so the
agent asks instead of reading and the rung points at the `day-zero` skill.

Exit code is always 0 and every read is wrapped: a broken orientation must never cost a window.
"""
import io, json, os, re, subprocess, sys, textwrap, time

try:                                            # silent unless this workspace opened a window
    import timing
except Exception:                               # noqa: BLE001 — a missing recorder is not a failed gate
    timing = None

_SELF = 'orientation'

MARKETPLACE = 'saasplane'
CORE = 'spn-core'
# The derivation `repo agent-sync` already performs, from the manifest and nothing else. A repo
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
    """`042-widget-pricing` reads as number `042`, subject `widget-pricing`. A folder
    carrying no number is still a workstream — the older shapes have none.

    The example is deliberately not a real workstream. This file discovers them by reading
    `.spndevex/`, so naming one here would be a second answer competing with the folders."""
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
                    'page': next((f for f in sorted(files)
                                  if f.endswith('-approach.html')), ''),
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
                          'page': page if os.path.isfile(page) else '', 'arcs': 1,
                          'when': newest([arc, page]), 'legacy': 'arcs/'}
    return sorted(found.values(), key=lambda w: (w['number'] or 'zzz', w['subject']))


def cache_state(root, plugin_names):
    """Whether the cache a live window is judged by matches the source it was built from.

    The install directory is shared across the machine and the version moves, so the version is
    globbed rather than named, and a directory carrying `.orphaned_at` is skipped — it is a
    previous install nothing loads. Any surprise reads as unknown rather than as current.
    """
    # The marketplace is registered in `settings.local.json` on this machine and could be in
    # either file, so both are read and the local one wins — it is the per-developer override.
    sources = {}
    for name in ('settings.json', 'settings.local.json'):
        sources.update((read_json(os.path.join(root, '.claude', name)) or {})
                       .get('extraKnownMarketplaces') or {})
    pairs = [(market, ((entry or {}).get('source') or {}).get('path'))
             for market, entry in sources.items()]
    if not pairs:
        # A marketplace registered at user scope is invisible to this file, and an empty loop
        # below would return `cache current` having compared nothing. The workspace still holds
        # the source as a member, so find the repo carrying these plugins and use that. Failing
        # that, say so — a green nobody earned is worse than an unknown.
        holds = [os.path.join(root, name) for name in listdir(root)
                 if all(os.path.isdir(os.path.join(root, name, 'plugins', plugin))
                        for plugin in plugin_names)]
        pairs = [(MARKETPLACE, holds[0])] if holds else []
    if not pairs:
        return 'cache unknown — no marketplace source'
    stale = []
    for market, source in pairs:
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
            # Only the newest cache directory is the one a window loads. Comparing every retained
            # version reported stale forever, because an older version differs from source by
            # definition — which is the same useless answer as always reporting current.
            newest = max(versions, key=version_key)
            if digest(os.path.join(cached, newest)) != digest(live):
                stale.append(plugin)
    if stale:
        return 'cache stale — ' + ' '.join(sorted(set(stale)))
    return 'cache current'


def version_key(name):
    """`0.10.0` sorts above `0.2.0`, which a string comparison gets backwards."""
    return tuple(int(part) if part.isdigit() else -1 for part in name.split('.'))


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
    who = developer_name()
    governed = [r for r in repos if r['world']]
    streams = workstreams(root)
    level, why = rung(root, governed)

    if not governed:
        text = (f'Good to see you{", " + who if who else ""}. Welcome to SaaS Plane — build the '
                'product, not the platform.\nIt is the AI-native, DevEx-first foundation for '
                'building and launching secure,\nscalable, compliance-ready SaaS platforms.\n\n'
                'I am the DevEx agent, and I work on it with you.\n\n'
                'This folder is empty, which is a good place to start. There is nothing to read '
                'yet, so\nwe begin with the shape. When you are ready, I have five questions. '
                'Your answers name\nevery account, package and prefix that comes after.\n\n'
                'So — what are we building?\n')
        note = ('\n---\nDay-0 mode: no sprepo.json under ' + root + '. You have no code to read, '
                'so do not orient — load the `day-zero` skill and walk it. Ask the five estate '
                'questions first, in order, and let the developer answer before any act.\n')
        return text, note

    # A partner's first session opens here, and a table of repos tells them nothing about what
    # this is or what the agent is for. Three short paragraphs, then the ground — never a fourth,
    # because the header's own rule is that a session opening with a status dump reads like a
    # build log.
    #
    # THE WELCOME IS THE AGENT'S OWN, AND IT IS TYPED HERE ON PURPOSE. Do not read it from a
    # repo. This plugin runs in a partner's workspace, where the foundation book is not a member
    # and absence is how access control works — so a banner sourced from that book would render
    # empty for the reader who needs it most. Everything below the welcome is discovered, and
    # the welcome alone is declared. Change the copy here when the positioning changes.
    lines = [
        f'Good to see you{", " + who if who else ""}.',
        '',
        'Welcome to SaaS Plane — build the product, not the platform. It is the AI-native,',
        'DevEx-first foundation for building and launching secure, scalable, compliance-ready',
        'SaaS platforms.',
        '',
        'I am the DevEx agent, and I work on it with you.',
        '',
        'Tell me what you want to build. Your idea can be rough. We shape it together first,',
        'then build it in four steps: the idea, the docs, the code, and the tests that prove',
        'it works.',
        '',
        *textwrap.wrap(
            f'You have {spell(len(repos))} repo{"" if len(repos) == 1 else "s"} here and one '
            'window. Every file follows its own rules, and finding them is my job. You just '
            'build.', 84),
        '',
    ]
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
    lines += closing_lines(root, streams)
    note = (f'\n---\nGround, read at load — the members, their law, and every workstream in all '
            f'three states. `open/` is available now, `backlog/` is parked behind a named '
            f'blocker, and `closed/` is the receipt. The number is an identity, never a '
            f'priority. Rung {level}: {why}. Say hello with the welcome above, then this ground, '
            f'then the closing question. Never turn the rung into a menu. The standing offer '
            f'under that question appears only when exactly one workstream is open and no other '
            f'session is live here — so where you cannot see one, do not propose resuming '
            f'anything.\n')
    return '\n'.join(line.rstrip() for line in lines), note


def workstream_lines(streams):
    """What is available now, above what is parked, above the receipt. State is printed on every
    row rather than as a heading, so a window skimming one line still knows what it is looking
    at. Closed collapses to one wrapped line — its number is what a later sitting cites."""
    if not streams:
        return ['workstreams   none yet — a subject becomes one by mkdir under backlog/ or open/',
                '              then update the agent and reload BEFORE executing it — cross-repo.md']
    by_state = {state: [w for w in streams if w['state'] == state] for state in STATES}
    tally = ' · '.join(f'{len(by_state[state])} {state}' for state in STATES if by_state[state])
    # RD.DEVEX.049. The MUST binds the moment a workstream is picked up, and this is the surface a
    # session meets before any skill. Printed with the tally rather than under a workstream: it is
    # true of whichever one you open, including one you are about to create.
    out = [f'workstreams   {tally}',
           '              open one with the agent update and the reload, then execute — cross-repo.md']
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
            # A page nobody can open is a page nobody reads. VS Code shows an .html file as
            # source, so the row offers the URL a browser takes rather than the path an editor
            # opens. Only an open workstream gets one: a parked page is not being read.
            if state == 'open' and w['page']:
                out.append(' ' * 16 + 'file://' + w['page'])
    if by_state['closed']:
        done = ' · '.join(w['folder'] for w in by_state['closed'])
        wrapped = textwrap.wrap(done, 84) or ['']
        out.append(f"  {'closed':<9}{wrapped[0]}")
        out += [' ' * 11 + line for line in wrapped[1:]]
    return out


def developer_name():
    """Your Claude registration, so the session greets you rather than an empty chair.

    A greeting is chat, and this is the one place the name belongs — it is never written into a
    document, a workstream page or any file the repo keeps. Read-only, one field, and a failure
    of any kind just means the session says hello without it."""
    try:
        with io.open(os.path.expanduser('~/.claude.json'), encoding='utf-8') as handle:
            name = ((json.load(handle) or {}).get('oauthAccount') or {}).get('displayName') or ''
        first = name.strip().split()[0]
        return first if 1 < len(first) <= 20 and first.replace('-', '').isalpha() else None
    except Exception:
        return None


def spell(n):
    """Small numbers spelled out, because a numeral mid-sentence reads like a status line and
    this paragraph is the one place the session is talking to you rather than reporting."""
    words = ('no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
             'eleven', 'twelve')
    return words[n] if n < len(words) else str(n)


def own_chain():
    """Every ancestor of this process. The hook runs *under* a session, so without this the
    session asking the question counts itself as somebody else working here."""
    chain, pid = set(), os.getpid()
    for _ in range(12):
        chain.add(pid)
        try:
            out = subprocess.run(['ps', '-o', 'ppid=', '-p', str(pid)], capture_output=True,
                                 text=True, timeout=2).stdout.strip()
        except Exception:
            break
        if not out.isdigit() or int(out) <= 1:
            break
        pid = int(out)
    return chain


def sessions_here(root):
    """How many other Claude sessions are live under this workspace right now.

    A session announces itself nowhere on disk, so the honest check is the running one: which
    `claude` processes are alive, and which of those are working below this root. It answers
    for the workspace rather than for one workstream — the conservative direction, since it
    withholds the offer to resume more often than it should and never less."""
    try:
        mine = own_chain()
        listing = subprocess.run(['ps', '-eo', 'pid=,comm='], capture_output=True, text=True,
                                 timeout=3).stdout
        others = 0
        for line in listing.splitlines():
            parts = line.split(None, 1)
            if len(parts) != 2 or not parts[0].isdigit():
                continue
            pid = int(parts[0])
            if pid in mine or os.path.basename(parts[1].strip()) != 'claude':
                continue
            cwd = subprocess.run(['lsof', '-a', '-p', str(pid), '-d', 'cwd', '-Fn'],
                                 capture_output=True, text=True, timeout=3).stdout
            for entry in cwd.splitlines():
                if entry.startswith('n') and os.path.realpath(entry[1:]).startswith(root):
                    others += 1
                    break
        return others
    except Exception:                                   # never cost a window
        return 0


def closing_lines(root, streams):
    """The last thing a session says before you type.

    Two offers and no menu: the open question you arrived with, and — only when exactly one
    workstream is open — the standing one, by name. Two open workstreams would make naming one
    a choice on your behalf, which is the thing this script refuses to do.

    The standing offer is withheld the moment another session is live under this root. Two
    windows on one workstream is how an approach page grows two authors, and a cheap check is
    worth more than the convenience it costs."""
    ask = 'So — what are we building?'
    open_now = [w for w in streams if w['state'] == 'open']
    if len(open_now) != 1:
        return ['', ask, '']
    only = open_now[0]
    name = ' '.join(part for part in (only['number'], only['subject']) if part)
    others = sessions_here(root)
    if others:
        plural = 's are' if others > 1 else ' is'
        offer = (f'{name} is open, but {others} other session{plural} open in this workspace. '
                 f'I will not touch it unless you ask me to.')
    else:
        offer = f'Or ask me to continue {name}, and I will start where we stopped.'
    return ['', ask, ''] + textwrap.wrap(offer, 84) + ['']


def claim(repo):
    if not repo['world']:
        return '—'
    return repo['world'] + (f" · {repo['stack']}" if repo['stack'] else '')


def main():
    stdin_mode = '--stdin' in sys.argv
    cwd = os.getcwd()
    payload = {}
    if stdin_mode:
        try:
            payload = json.load(sys.stdin) or {}
            cwd = payload.get('cwd') or cwd
        except Exception:
            pass
    else:
        args = [a for a in sys.argv[1:] if not a.startswith('-')]
        cwd = args[0] if args else cwd
    if timing is not None:                          # opens only where the window file exists
        timing.begin(payload)
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
    _started = time.perf_counter()
    try:
        _code = main()
    finally:
        # `SessionStart` runs once, so its whole run is the useful number. `PreToolUse` is the hot
        # path and times per check instead.
        if timing is not None:
            timing.span(_SELF, (time.perf_counter() - _started) * 1000)
    sys.exit(_code)
