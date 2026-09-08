#!/usr/bin/env python3
"""Everything checked when a turn ends, in one process.

WHY THIS EXISTS. A turn is the boundary a deferral crosses. An arc gets written, the page is left
for later, and later is a different context — so the check belongs where the work stops rather than
where it started. `reply-shape` already ran here; this joins it rather than adding a second process.

WHAT IT HOLDS.
  reply-shape   a reply asking for a lettered choice must show the options
  arc-to-page   an arc in an open workstream that no split-plan row names

Neither refuses. A turn's work is already done, and refusing it would only lose the work — so both
say what is missing and name the edit that fixes it.
"""
import io
import json
import os
import re
import sys
import time
from contextlib import redirect_stdout

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:                                                # silent unless this workspace opened a window
    import timing
except Exception:                                   # noqa: BLE001 — a missing recorder is not a failed gate
    timing = None

_SELF = 'stop'


def load(module_file):
    import importlib.util

    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'{module_file}.py')
    spec = importlib.util.spec_from_file_location(module_file.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def unnamed_arcs(root):
    """Every arc in an open workstream that no row of its page names.

    **An arc is not written until the page carries it.** The arc is the plan and the page is what
    you read, so an arc no row names is work that looks finished from the only surface anybody
    opens. The split plan is read by the same parser the close gate uses, so one reader serves both.
    """
    plan = load('split-plan')
    out = []
    for subject, pages in sorted(plan.open_workstreams(root).items()):
        if not pages:
            continue
        folder = os.path.dirname(pages[0])
        arcs = os.path.join(folder, 'arcs')
        if not os.path.isdir(arcs):
            continue
        # **The page must name the arc file.** Rows name pieces of work, never the arc they belong
        # to, so matching a row's words against a filename was guesswork — it fired on a page that
        # carried every arc under a heading. A citation is explicit, greppable, and useful to a
        # reader who wants the argument behind a plan.
        page_text = ' '.join(plan.read(page) for page in pages)
        for name in sorted(os.listdir(arcs)):
            if not name.startswith('arc-') or not name.endswith('.md'):
                continue
            if name in page_text:
                continue
            out.append((subject, name, os.path.basename(pages[0])))
    return out


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    if timing is not None:                          # opens only where `.spndevex/.debug/telemetry/window` exists
        timing.begin(payload)

    notes = []

    captured = io.StringIO()
    original = sys.stdin
    try:
        sys.stdin = io.StringIO(json.dumps(payload))
        with redirect_stdout(captured):
            load('reply-shape').main()
    except SystemExit:
        pass
    except Exception:
        pass
    finally:
        sys.stdin = original
    text = captured.getvalue().strip()
    if text:
        try:
            notes.append(json.loads(text.splitlines()[-1]).get('systemMessage') or '')
        except Exception:
            pass

    try:
        root = load('split-plan').workspace_root(payload.get('cwd') or os.getcwd())
        if root:
            missing = unnamed_arcs(root)
            if missing:
                named = ' · '.join(f'{arc} in {subject}' for subject, arc, _ in missing[:4])
                notes.append(
                    f'An arc no split-plan row names — {named}. An arc is the plan and the page is '
                    f'what anybody reads, so an arc nothing names is work that looks finished from '
                    f'the only surface they open. Add a row to that page\'s `What is built`, with '
                    f'its scope and its state (05-artifacts.md, How has two halves).'
                )
    except Exception:
        pass

    notes = [n for n in notes if n]
    if notes:
        print(json.dumps({'systemMessage': '\n\n'.join(notes)}))
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
