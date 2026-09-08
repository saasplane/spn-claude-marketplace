#!/usr/bin/env python3
"""What gets said when a workstream closes.

WHY THIS EXISTS. The developer asked for it, in these words: *"we should say some cheer up message
when workstream is done, make devs happy on small achievements."* A scope that took days ended in a
silent `mv`, and the only thing that ever spoke at that moment was a refusal.

WHY `PostToolUse`. It is the one honest moment. The close gate runs before the move and speaks only
to refuse, so congratulating from there would be congratulating something that has not happened and
might still fail. This fires after the folder has actually moved.

WHAT IT SAYS. What landed, counted from the page's own split plan — not a generic well done. The
number is the work, and a line that names it is worth reading twice.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:                                                # silent unless this workspace opened a window
    import timing
except Exception:                                   # noqa: BLE001 — a missing recorder is not a failed gate
    timing = None

_SELF = 'closed'


def load(module_file):
    import importlib.util

    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'{module_file}.py')
    spec = importlib.util.spec_from_file_location(module_file.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    if timing is not None:                          # opens only where `.spndevex/.debug/telemetry/window` exists
        timing.begin(payload)
    tool_input = payload.get('tool_input') or {}
    command = tool_input.get('command') or ''
    if not command:
        return 0

    plan = load('split-plan')
    cwd = payload.get('cwd') or os.getcwd()
    for source, destination in plan.moves(command):
        destination = os.path.join(cwd, destination)
        if not plan.closing(destination):
            continue
        root = plan.workspace_root(destination) or plan.workspace_root(cwd)
        if not root:
            continue
        subject = os.path.basename(destination.rstrip('/'))
        if not subject or subject in plan.STRUCTURE:
            continue
        rows = [row for page in plan.subject_pages(root, subject, destination)
                for row in plan.plan_of(page)]
        states = [plan.state_of(row) for row in rows]
        landed = states.count('landed')
        carried = states.count('carried')
        deferred = states.count('deferred')
        tail = []
        if carried:
            tail.append(f'{carried} carried to a named successor')
        if deferred:
            tail.append(f'{deferred} deferred with its trigger')
        rest = f", and {' and '.join(tail)}" if tail else ''
        print(json.dumps({'systemMessage':
                          f'{subject} is closed. {landed} rows landed{rest} — that is a scope '
                          f'finished, recorded, and findable by whoever comes next. Well done.'}))
        return 0
    return 0


if __name__ == '__main__':
    _started = time.perf_counter()
    try:
        _code = main()
    except Exception:                               # noqa: BLE001 — never take the chain down
        _code = 0
    finally:
        # The whole run, because these events fire a handful of times a session and the breakdown
        # would cost more attention than it buys. `PreToolUse` is the hot path, and it times per check.
        if timing is not None:
            timing.span(_SELF, (time.perf_counter() - _started) * 1000)
    sys.exit(_code)
