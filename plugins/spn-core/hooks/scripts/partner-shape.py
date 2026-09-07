#!/usr/bin/env python3
"""Prove every hook runs in a repo that holds the plugins and nothing else.

**A partner receives the public marketplace and neither the foundation book nor its registers**
(CONCEPT.md, DevEx Delivery). So a hook may read those where they exist and may never require them.
A check that crashes on their absence takes the whole hook down, and the partner sees a broken agent
rather than a missing input.

This builds a repo carrying only what a partner actually has — `sprepo.json`, `spkind.json`,
`CONCEPT.md`, `README.md` — and runs every hook against it. A crash is a failure; a finding is not.
Findings are that repo's business. **Silence on a missing input is the contract.**

    partner-shape.py [--keep]     run it; --keep leaves the fixture for inspection

Run it after touching any hook script, and before any release of the plugins.
"""
import os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def plugin_root(name):
    """Where `name`'s files sit, in either layout this script legitimately runs from.

    The marketplace repo puts plugins side by side (`plugins/spn-core/hooks/…`). The installed
    cache puts a VERSION directory between the plugin and its files
    (`cache/saasplane/spn-core/0.6.0/hooks/…`). Running from the cache is the test that matters
    most, because that is the copy a partner's session actually loads.
    """
    family = os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # holds spn-core beside us
    direct = os.path.join(family, name, 'hooks', 'scripts')
    if os.path.isdir(direct):
        return direct                                                # repo layout
    versioned = os.path.join(os.path.dirname(family), name)          # cache layout
    if os.path.isdir(versioned):
        picks = sorted(d for d in os.listdir(versioned)
                       if os.path.isdir(os.path.join(versioned, d, 'hooks', 'scripts')))
        if picks:
            return os.path.join(versioned, picks[-1], 'hooks', 'scripts')
    return None

FIXTURE = {
    'sprepo.json': '{"world":"APPS","stacks":["spn-core","spn-apps-ts"]}\n',
    'spkind.json': '{"kind":"APP_WEB","config":null}\n',
    'CONCEPT.md': ('# Partner Platform — Concept\n\n## What this is\n\n'
                   'A partner platform built on SaaS Plane. You read this to learn its shape.\n\n'
                   '### Boundary\n\nOne deployable, one API face, one browser face.\n'),
    'README.md': '# Partner Platform\n\nYou run this locally with `pnpm dev`.\n',
}

# Every hook, with the arguments it takes when swept over a tree.
SCRIPTS = [
    ('spn-core', 'coherence.py', ['.']),
    ('spn-core', 'doc-check.py', ['.']),
    ('spn-core', 'prose-triage.py', ['.']),
    ('spn-core', 'split-plan.py', ['.']),
    ('spn-core', 'contract-cycle.py', ['.']),
    ('spn-core', 'orientation.py', []),
    ('spn-apps-ts', 'coverage.py', ['--check', 'route-e2e', '.']),
    ('spn-apps-ts', 'coverage.py', ['--check', 'spec-restore', '.']),
    ('spn-apps-ts', 'coverage.py', ['--check', 'foreign-double', '.']),
]


def declared():
    """Every script named by a `hooks.json`, as (plugin, script) pairs.

    **A hook declared with no file behind it is the failure this reads for.** `SCRIPTS` below is
    hand-kept, so it can agree with itself while `hooks.json` points at a script nobody shipped.
    A partner meets that as a broken agent, because the declaration is what their session loads.
    """
    family = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
    found = set()
    for plugin in sorted(os.listdir(family)) if os.path.isdir(family) else []:
        manifest = os.path.join(family, plugin, 'hooks', 'hooks.json')
        if not os.path.isfile(manifest):
            continue
        with open(manifest, encoding='utf-8') as handle:
            for name in re.findall(r'/hooks/scripts/([A-Za-z0-9_.-]+\.(?:py|sh))', handle.read()):
                found.add((plugin, name))
    return sorted(found)


def main():
    # KEEP THE FIXTURE PATH IN ITS OWN NAME. This loop used to reassign `root` to each plugin's
    # scripts directory, so `cwd=root` ran every hook inside the plugins rather than the fixture,
    # and the `rmtree` below then DELETED the last plugin's scripts folder. That is how
    # spn-apps-ts lost coverage.py, enablement-grammar.py and host-assertion.py in 88ac5ca —
    # the verifier removed its own test subjects and the deletion was committed with the rest.
    fixture = tempfile.mkdtemp(prefix='partner-shape-')
    for name, text in FIXTURE.items():
        with open(os.path.join(fixture, name), 'w', encoding='utf-8') as handle:
            handle.write(text)
    failed = []
    for plugin, script in declared():
        where = plugin_root(plugin)
        if not where or not os.path.isfile(os.path.join(where, script)):
            failed.append((f'{plugin}/{script}', 'declared by hooks.json and absent from the plugin'))
            print(f'  ✘ {plugin}/{script} — declared, no file')
    for plugin, script, args in SCRIPTS:
        where = plugin_root(plugin)
        path = os.path.join(where, script) if where else ''
        label = f'{script} {" ".join(args)}'.strip()
        if not path or not os.path.isfile(path):
            failed.append((label, 'not found'))
            print(f'  ✘ {label}')
            continue
        run = subprocess.run([sys.executable, path, *args], cwd=fixture,
                             capture_output=True, text=True)
        if 'Traceback' in run.stderr:
            failed.append((label, run.stderr.strip().splitlines()[-1][:96]))
            print(f'  ✘ {label}')
        else:
            print(f'  ✔ {label}')
    if '--keep' in sys.argv:
        print(f'\nfixture kept at {fixture}')
    else:
        shutil.rmtree(fixture, ignore_errors=True)
    if failed:
        print(f'\n{len(failed)} hook(s) failed the partner shape:')
        for label, why in failed:
            print(f'    {label}\n      {why}')
        print('\n  A hook reads the book where it exists and never requires it,')
        print('  and every script a hooks.json declares ships beside it.')
        return len(failed)
    print(f'\n{len(SCRIPTS)} hook run(s) — every one survives a repo with no foundation.')
    print(f'{len(declared())} declared script(s) — every one present.')
    return 0


if __name__ == '__main__':
    sys.exit(min(main(), 250))
