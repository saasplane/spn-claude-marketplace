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
import os, shutil, subprocess, sys, tempfile

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


def main():
    root = tempfile.mkdtemp(prefix='partner-shape-')
    for name, text in FIXTURE.items():
        with open(os.path.join(root, name), 'w', encoding='utf-8') as handle:
            handle.write(text)
    failed = []
    for plugin, script, args in SCRIPTS:
        root = plugin_root(plugin)
        path = os.path.join(root, script) if root else ''
        if not path or not os.path.isfile(path):
            failed.append((script, 'not found'))
            continue
        run = subprocess.run([sys.executable, path, *args], cwd=root,
                             capture_output=True, text=True)
        label = f'{script} {" ".join(args)}'.strip()
        if 'Traceback' in run.stderr:
            failed.append((label, run.stderr.strip().splitlines()[-1][:96]))
            print(f'  ✘ {label}')
        else:
            print(f'  ✔ {label}')
    if '--keep' in sys.argv:
        print(f'\nfixture kept at {root}')
    else:
        shutil.rmtree(root, ignore_errors=True)
    if failed:
        print(f'\n{len(failed)} hook(s) require an input a partner does not have:')
        for label, why in failed:
            print(f'    {label}\n      {why}')
        print('\n  A hook reads the book where it exists and never requires it.')
        return len(failed)
    print(f'\n{len(SCRIPTS)} hook run(s) — every one survives a repo with no foundation.')
    return 0


if __name__ == '__main__':
    sys.exit(min(main(), 250))
