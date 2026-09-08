#!/usr/bin/env python3
"""Execution is confirmed, never assumed — S3's instrument.

WHAT IT CATCHES. A session reads an open workstream, understands the plan, and starts editing a
repository. Nobody said go. The page still reads as a proposal, the developer still thinks they are
being shown something, and the first they learn otherwise is a diff. **The failure is silent on
both sides**: the agent believes the plan is agreement, and the developer believes the plan is a
plan.

WHAT A GO LOOKS LIKE, so this can be checked at all. A go is a line in an arc's `## Log`, opening
with the date and the word `go`:

    - **2026-09-09 — go.** The developer said finish it.

Nothing else counts, because nothing else is written down. A conversation is not a record: the
window ends and the go ends with it, which is exactly the state this hook exists to make visible.

WHEN IT FIRES. On the first write into a MEMBER REPOSITORY — never on `.spndevex/` itself, because
writing the plan is how a session earns the go. One workstream open with no go, one warning.

AND IT DOES NOT NAG. A warning repeated on every write is a warning nobody reads, and it would fire
several times inside one turn. The session is remembered under `.spndevex/.debug/`, the container
the workspace already keeps for what its machinery says about itself, so a second write is silent.

A HOOK MUST NEVER FAIL BECAUSE THIS FAILED. Every path swallows its own errors, and an unreadable
workstream is not a workstream without a go.
"""
import os
import re

DEVEX = '.spndevex'
DEBUG = '.debug'
CONFIRMED = 'confirmed'
WORKSTREAMS = 'workstreams'
OPEN = 'open'

# `- **2026-09-09 — go.` — the date, the dash, then the word. The bold is how every other log line
# in these files opens, so this asks for the shape that is already there rather than a new one.
GO = re.compile(r'^\s*-\s*\*\*\d{4}-\d{2}-\d{2}\s*[—-]\s*go\b', re.IGNORECASE | re.MULTILINE)


def workspace_root(start):
    """The folder holding `.spndevex`, walked up from where the caller stood."""
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


def open_workstreams(root):
    """Every folder under `workstreams/open/`, which is the state that means available now."""
    folder = os.path.join(root, DEVEX, WORKSTREAMS, OPEN)
    try:
        return sorted(
            os.path.join(folder, name)
            for name in os.listdir(folder)
            if not name.startswith('.') and os.path.isdir(os.path.join(folder, name))
        )
    except Exception:
        return []


def has_go(workstream):
    """Whether any arc under this workstream records one."""
    arcs = os.path.join(workstream, 'arcs')
    try:
        names = sorted(name for name in os.listdir(arcs) if name.endswith('.md'))
    except Exception:
        return False
    for name in names:
        try:
            with open(os.path.join(arcs, name), encoding='utf-8') as handle:
                if GO.search(handle.read()):
                    return True
        except Exception:
            continue
    return False


def is_repo_write(root, path):
    """A write into a member repository, rather than into the working state or the workspace floor.

    **`.spndevex/` is deliberately excluded.** Writing the plan is how a session earns a go, so a
    hook that fired on it would refuse the very act that answers it. The workspace's own `.claude/`
    is excluded for the same reason: wiring the window is not executing the plan.
    """
    try:
        relative = os.path.relpath(os.path.abspath(path), root)
    except Exception:
        return False
    if relative.startswith('..'):
        return False
    head = relative.split(os.sep)[0]
    return head not in ('', '.', DEVEX, '.claude')


def already_warned(root, session):
    """One warning per session, remembered where the workspace keeps its own machinery's state."""
    if not session:
        return False
    marker = os.path.join(root, DEVEX, DEBUG, CONFIRMED, str(session))
    try:
        if os.path.exists(marker):
            return True
        os.makedirs(os.path.dirname(marker), exist_ok=True)
        with open(marker, 'w', encoding='utf-8') as handle:
            handle.write('warned\n')
        return False
    except Exception:
        return False


def gate_confirmed(payload):
    """Warn once when a repository write happens and no open workstream records a go."""
    try:
        tool_input = payload.get('tool_input') or {}
        written = tool_input.get('file_path')
        if not written:
            return
        cwd = payload.get('cwd') or os.getcwd()
        root = workspace_root(cwd)
        if not root:
            return
        if not is_repo_write(root, os.path.join(cwd, written)):
            return
        workstreams = open_workstreams(root)
        if not workstreams:
            return
        # One go covers the window. A developer running two scopes said go to one of them, and
        # warning about the other would be noise on work they are watching.
        if any(has_go(workstream) for workstream in workstreams):
            return
        if already_warned(root, payload.get('session_id')):
            return
        names = ' · '.join(os.path.basename(workstream) for workstream in workstreams)
        print(
            f'This is a repository write and no open workstream records a go — {names}. '
            f'Execution is confirmed rather than assumed: show the plan, ask, and write the '
            f'answer down as a log line in the arc, opening `- **<date> — go.**`. A go held only '
            f'in the conversation ends with the window, and the next session cannot tell a plan '
            f'from an agreement (refs/workstream-loop.md, S3).'
        )
    except Exception:
        pass                                        # never fail a gate over a warning
