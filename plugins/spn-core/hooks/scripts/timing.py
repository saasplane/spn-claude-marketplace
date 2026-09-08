#!/usr/bin/env python3
"""What the agent's own machinery costs — written only while you have asked for it.

WHY IT IS OFF BY DEFAULT. The first build recorded every hook run, always. Measured against the
only honest baseline — a hook that parses its payload, so `json` is paid either way — that cost
**0.74 ms of every run**: an `atexit` registration, a `makedirs`, a `getsize` and an append, on
every tool call, to keep answering a question that was asked once. The developer's call:
*"we dont need to always log — we did so we can optimize."*

MEASURING IS FREE; WRITING IS THE COST. Two `perf_counter` reads are nanoseconds, so callers time
their work unconditionally and hand the spans over. **The switch is read at the moment of writing**
— `begin()` touches no filesystem at all, so a hook that refuses early and exits pays nothing.

THE SWITCH.

    .spndevex/.debug/telemetry.on        present means recording. `--on` creates it, `--off` removes it
    .spndevex/.debug/telemetry/hooks.jsonl   one line per check

It lives in the workspace it describes, not under `~/.spnutils/` — a machine-wide path would have
to encode the workspace into a folder name that a moved checkout orphans. **The dot on `.debug`
matters**: every reader of `.spndevex/` already skips `startswith('.')`, so it is invisible to the
workstream walkers by a rule that is already there rather than a new exception.

WHAT IT RECORDS. One line per check, carrying the check's OWN span — not the process total. The
first build could not: `_IMPORTED_AT` was module-level, so every check in one process reported the
same number wearing a different name. It also asked `CLAUDE_HOOK_EVENT` and `CLAUDE_TOOL_NAME` of
the environment, which nothing sets, so all 2,521 lines it wrote carry a null event and a null tool.
**The payload had both all along**, with the session id beside them.

A HOOK MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors. A gate that
refuses to run is infinitely more expensive than a number nobody recorded.
"""
import atexit
import os

DEVEX = '.spndevex'
DEBUG = '.debug'
SWITCH = 'telemetry.on'
FOLDER = 'telemetry'
LOG = 'hooks.jsonl'
# A log nobody prunes becomes a cost of its own. Rewritten from empty past this size.
MAX_BYTES = 4 * 1024 * 1024
# What may appear unquoted in a hand-written line. Everything else is dropped rather than escaped:
# these are our own script names plus Claude Code's tool and event names, and a value that needs
# escaping is a value we did not expect.
SAFE = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._:@/-')

_state = {'cwd': None, 'facts': {}, 'spans': [], 'armed': False}


def workspace_root(start):
    """The folder holding `.spndevex`, walked up from where the caller stood.

    **Not the payload's `cwd` alone** — a `Bash` call carries wherever the shell happened to be,
    which a probe on 2026-09-08 caught pointing at the plugin's own hooks folder. This is the same
    walk `split-plan.py` does, and it costs 8.3 µs from a deep repository path.
    """
    try:
        path = os.path.abspath(start)
        while True:
            if os.path.isdir(os.path.join(path, DEVEX)):
                return path
            parent = os.path.dirname(path)
            if parent == path:
                return None
            path = parent
    except Exception:
        return None


def debug_dir(root):
    """Where this workspace keeps what its machinery says about itself."""
    return os.path.join(root, DEVEX, DEBUG)


def switch_path(root):
    """The file whose presence is the whole question."""
    return os.path.join(debug_dir(root), SWITCH)


def begin(payload=None):
    """Remember what to tag the lines with, and arm the write.

    **Reads nothing from disk.** The switch is checked when there is something to write, so a hook
    that exits early — a refusal, a cheap exit — pays nothing at all for having called this.

    @param payload - the hook payload, for the facts it already carries
    """
    try:
        payload = payload or {}
        _state['cwd'] = payload.get('cwd') or os.getcwd()
        _state['facts'] = {
            'event': payload.get('hook_event_name'),
            'tool': payload.get('tool_name'),
            'session': payload.get('session_id'),
        }
        if not _state['armed']:
            atexit.register(_flush)
            _state['armed'] = True
    except Exception:
        pass


def span(script, ms):
    """One check's own elapsed time.

    **Callers hand these over unconditionally.** Timing a call is two `perf_counter` reads and costs
    nanoseconds, so there is nothing to save by asking first — and a caller that asks is a caller
    with two code paths, one of which is never exercised while the switch is off.

    Held until exit, so a chain pays one write rather than one append per check.
    """
    try:
        _state['spans'].append((script, ms))
    except Exception:
        pass


def _clean(value):
    """A value safe to write unquoted, or `null`. Unexpected characters are dropped, never escaped."""
    if not value:
        return None
    text = ''.join(character for character in str(value) if character in SAFE)
    return text[:96] or None


def _flush():
    """The switch, read once, and then everything this process collected in one write."""
    try:
        if not _state['spans']:
            return
        root = workspace_root(_state['cwd'] or os.getcwd())
        if root is None:
            return
        base = debug_dir(root)
        if not os.path.exists(os.path.join(base, SWITCH)):
            return                                  # off — and this is the whole cost of being off
        import time                                 # free — already loaded by the interpreter

        facts = _state['facts']
        stamp = time.strftime('%Y-%m-%dT%H:%M:%S')
        pid = os.getpid()
        lines = []
        for script, ms in _state['spans']:
            fields = [f'"script":"{_clean(script)}"', f'"ms":{round(float(ms), 2)}']
            for key in ('event', 'tool', 'session'):
                value = _clean(facts.get(key))
                fields.append(f'"{key}":"{value}"' if value else f'"{key}":null')
            fields.append(f'"at":"{stamp}"')
            fields.append(f'"pid":{pid}')
            lines.append('{' + ','.join(fields) + '}')

        folder = os.path.join(base, FOLDER)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, LOG)
        mode = 'a'
        try:
            if os.path.getsize(path) > MAX_BYTES:
                mode = 'w'
        except OSError:
            pass
        with open(path, mode, encoding='utf-8') as handle:
            handle.write('\n'.join(lines) + '\n')
    except Exception:
        pass                                        # never fail a gate over a number
