#!/usr/bin/env python3
"""Every PreToolUse check, in one process.

WHY THIS EXISTS. Five hooks matched a single `Edit`, and each one paid Python's start-up before it
read a byte. Measured on 2026-09-08: the chain cost **117.7 ms per edit**, and **60 ms of that was
five interpreters starting**. A hundred edits is nearly twelve seconds spent launching processes
that then agree there is nothing to say. The checks were never the cost; running them apart was.

WHAT IT DOES NOT CHANGE. Each check keeps its own file, its own logic and its own words. This
imports them and calls them, so a verdict here is the same verdict they gave alone — and a check can
still be run by hand exactly as before.

HOW A COMBINED VERDICT IS FORMED. **The first deny wins and stops the chain**, because a refusal is
an answer and running further checks would only add noise to it. Warnings accumulate: they are
advice, and two pieces of advice are better than one. Order is cheapest first, so an ordinary edit
pays as little as possible before something decides.

IT NEVER TAKES THE CHAIN DOWN. A check that raises is skipped, not fatal. A gate that crashes the
PreToolUse chain removes every other gate with it, which is worse than any single miss.
"""
import io
import json
import os
import sys
import time
from contextlib import redirect_stdout

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:                                                # silent unless this workspace opened a window
    import timing
except Exception:                                   # noqa: BLE001 — a missing recorder is not a failed gate
    timing = None

# Cheapest first: a path check before a file read, a file read before a workspace walk. Each entry
# is (script, callable, argv, needs). **`argv` is not optional** — a check reading `sys.argv` would
# otherwise see the dispatcher's, and `doc-check` without `--stdin` sweeps the whole workspace. That
# mistake made the first build of this file 26x SLOWER than the five processes it replaced.
CHECKS = (
    ('env-seat', 'main', ['env-seat.py'], ('command', 'file_path')),
    ('contract-cycle', 'run_stdin', ['contract-cycle.py', '--stdin'], ('file_path',)),
    ('doc-check', 'main', ['doc-check.py', '--stdin'], ('command', 'file_path')),
    ('split-plan', 'gate_documents_first', ['split-plan.py'], ('command', 'file_path')),
    ('split-plan', 'gate_close', ['split-plan.py'], ('command',)),
    ('confirmed', 'gate_confirmed', ['confirmed.py'], ('file_path',)),
)


def load(module_file):
    """Import a hook script whose filename is not a valid module name."""
    import importlib.util

    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'{module_file}.py')
    spec = importlib.util.spec_from_file_location(module_file.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


LOADED = {}


def run_one(module_file, function, argv, payload):
    """One check, with the stdin, stdout and argv it expects when it runs alone."""
    captured = io.StringIO()
    original, original_argv = sys.stdin, sys.argv
    try:
        module = LOADED.get(module_file) or LOADED.setdefault(module_file, load(module_file))
        target = getattr(module, function, None)
        if target is None:
            return None
        sys.stdin = io.StringIO(json.dumps(payload))
        sys.argv = list(argv)
        with redirect_stdout(captured):
            # `gate_*` take the payload directly; the `main`/`run_stdin` forms read stdin.
            target(payload) if function.startswith('gate_') else target()
    except SystemExit:
        # **A refusal is delivered by `sys.exit`, not by returning.** `env-seat` and
        # `contract-cycle` both print their deny and then exit, which is correct when they run
        # alone. Catching only `Exception` threw that refusal away with the exception — the seat
        # guard silently stopped refusing, and the first test after the port caught it.
        pass
    except Exception:
        return None                                 # a check that raises is skipped, never fatal
    finally:
        sys.stdin, sys.argv = original, original_argv
    text = captured.getvalue().strip()
    if not text:
        return None
    try:
        return json.loads(text.splitlines()[-1])
    except Exception:
        return None



REGEN_HINT = (
    'This file is generated — hand edits are lost on the next generator run. Edit the source instead '
    "and regenerate: contract validators come from contract/states/** via 'spnutils apps gen-validators "
    "-p <pkg>'; package barrels via 'spnutils apps gen-barrel -p <pkg>'; client SDKs regenerate from the "
    "running service's published API document. Never hand-edit generated output."
)


def generated_refusal(path):
    """Why this path may not be hand-edited, or None.

    Ported from `deny-generated-edits.sh` so the dispatcher carries every check rather than most of
    them. **A guard left out of a dispatcher is a guard removed**, and this one refuses edits to
    files a generator owns — the failure it prevents is silent, because a hand edit survives until
    the next generation and then vanishes.
    """
    if not path:
        return None
    if '/src/contract/validators/' in path and path.endswith('.ts'):
        return f'Denied: {path} is a generated Zod validator (spnutils apps gen-validators). {REGEN_HINT}'
    if '/dist/generated/' in path:
        return f'Denied: {path} is generated build output. {REGEN_HINT}'
    try:
        with open(path, encoding='utf-8', errors='replace') as handle:
            head = ''.join(next(handle, '') for _ in range(3))
        if 'Generated by spnutils' in head:
            return f"Denied: {path} declares 'Generated by spnutils' in its header. {REGEN_HINT}"
    except OSError:
        pass
    return None


def refuse(reason):
    print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                             'permissionDecision': 'deny',
                                             'permissionDecisionReason': reason}}))


def written_paths(payload):
    """Every path this tool call would write — the `file_path` form, and shell write routes.

    The routes are parsed by `doc-check --bash-writes`, which is the one place that knows them, so a
    newly learned route serves this guard too.
    """
    tool_input = payload.get('tool_input') or {}
    if tool_input.get('file_path'):
        return [tool_input['file_path']]
    command = tool_input.get('command')
    if not command:
        return []
    try:
        module = LOADED.get('doc-check') or LOADED.setdefault('doc-check', load('doc-check'))
        return [path for path, _, _, _ in module.bash_writes(command)]
    except Exception:
        return []


def wanted(needs, payload):
    tool_input = payload.get('tool_input') or {}
    return any(tool_input.get(key) for key in needs)


# What a check could possibly have an opinion about, decided from the path alone. Loading a module
# costs ~8 ms whether or not it has anything to say, and most edits touch a file no gate cares
# about — so the question is asked before the import rather than inside it.
PROSE_SUFFIXES = ('.md', '.html')


def applies(module_file, payload):
    tool_input = payload.get('tool_input') or {}
    path = tool_input.get('file_path') or ''
    command = tool_input.get('command') or ''
    if module_file == 'contract-cycle':
        return '/contract/states/' in path or '/contract/states/' in command
    if module_file == 'doc-check':
        return path.endswith(PROSE_SUFFIXES) or any(s in command for s in PROSE_SUFFIXES)
    if module_file == 'split-plan':
        # Its workspace sweep is the point: an answered card must be caught on ANY write. What it
        # cannot matter to is a call that writes nothing at all.
        return bool(path or command)
    return True


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    # The generated-file guard runs first: it is the cheapest refusal there is, and it needs no
    # workspace walk to decide.
    for path in written_paths(payload):
        reason = generated_refusal(path)
        if reason:
            refuse(reason)
            return 0

    # **Measuring is free; writing is the cost.** Two `perf_counter` calls are nanoseconds, so the
    # loop below always times and always reports. What the window decides is whether any of it is
    # ever written down — which is the only part anybody pays for.
    if timing is not None:
        timing.begin(payload)

    notes = []
    for module_file, function, argv, needs in CHECKS:
        if not applies(module_file, payload):
            continue
        if not wanted(needs, payload):
            continue
        # Named `module.function` so the two `split-plan` gates are told apart — one sweeps the
        # workspace and one reads a path, and an optimisation needs to know which is costing.
        started = time.perf_counter()
        verdict = run_one(module_file, function, argv, payload)
        if timing is not None:
            timing.span(f'{module_file}.{function}', (time.perf_counter() - started) * 1000)
        if verdict is None:
            continue
        specific = verdict.get('hookSpecificOutput') or {}
        if specific.get('permissionDecision') == 'deny':
            print(json.dumps(verdict))              # the first refusal is the answer
            return 0
        note = specific.get('additionalContext') or verdict.get('systemMessage')
        if note:
            notes.append(note)

    if notes:
        joined = '\n\n'.join(notes)
        print(json.dumps({'systemMessage': joined,
                          'hookSpecificOutput': {'hookEventName': 'PreToolUse',
                                                 'additionalContext': joined}}))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:                               # noqa: BLE001 — never take the chain down
        sys.exit(0)
