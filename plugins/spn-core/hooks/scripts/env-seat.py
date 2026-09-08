#!/usr/bin/env python3
"""Refuse to render `~/.spnenv`. A value never reaches a terminal.

WHY THIS EXISTS. Three surfaces state that a value in the machine seat is never printed or
logged, and a session broke it anyway — five live credentials went into a transcript, hours after
arguing the rule at length on the same day. **A rule three documents state and no instrument
checks is exactly the shape workstream 009 exists to fix.** Prose plainly did not stop it.

WHAT IS AND IS NOT REFUSED. The agent may READ this file; `Q7` settled that, and it has to —
`spnutils` reads the whole file on every `sync` to preserve the regions you own. What is refused
is RENDERING one: a command whose output lands in a transcript that outlives the session.

    refused   cat ~/.spnenv · sed -n '72,89p' ~/.spnenv · head · tail · less · awk · grep
              the Read tool pointed at it
    fine      `spnutils workspace status`, which reports key names and set-state
              anything inside spnutils' own process, which this never sees

DENY, RATHER THAN AN ALLOWLIST OF SAFE READS. A pipeline ending in `cut -d= -f1` prints only key
names, and one ending in `cut -d= -f2` prints every value. Telling those apart in a shell string
is guesswork, and a guard that is wrong occasionally is one people learn to work around. So every
route is refused and the message names the door instead.

A COMMAND THAT ONLY WRITES PROSE ABOUT THE SEAT IS REFUSED TOO, and that is not a bug. This guard
reads the whole command string, so a heredoc whose body quotes the path looks exactly like a read.
Narrowing it would re-open a guard written because five live credentials reached a transcript. The
refusal names the way through instead — put the text in a script file and run the file.

Exit 0 always. A hook that crashes takes the whole PreToolUse chain down with it, and this one
guards a file the loop legitimately uses.
"""
import os
import re
import sys
import json
import pathlib

SEAT = ".spnenv"
DOOR = (
    "Use the keys-only door: `spnutils workspace status` reports which keys this machine has and "
    "whether each is set, and never a value. To test one key, test presence without expanding it "
    "— `if [[ -n ${(P)k} ]]` — never `printf '%s' \"$v\"`. If the developer asked for one specific "
    "value by name, ask them to read it themselves."
)
WHY = (
    "A transcript outlives the session that wrote it. A printed credential is exposed from that "
    "moment and rotation is the only repair — this has already happened here twice."
)
# A14. This guard reads the whole command string, so a command that merely QUOTES the path is
# refused exactly like one that reads the file. That is deliberate — telling a pipeline's halves
# apart in a shell string is guesswork, and a guard that is wrong occasionally is one people learn
# to work around. What was missing was saying so: the refusal now names the way through, because
# this cost two sessions a minute each before anybody wrote it down.
WRITING = (
    "If you are only WRITING a document that quotes this path — a heredoc body, an editing script "
    "— that is refused too, because the guard reads the whole command and cannot tell your prose "
    "from a read. Put the text in a script file and run the file: the path is then in the file "
    "rather than in the command line."
)
# A token naming the seat, however it is spelled: ~/.spnenv, $HOME/.spnenv, ${HOME}/.spnenv,
# /Users/someone/.spnenv, and each of those inside single or double quotes.
TOKEN = re.compile(r"""(?:~|\$HOME|\$\{HOME\}|/[^\s'"]*)/\.spnenv\b""")


def seat_paths():
    """Every real path that IS the seat on this machine."""
    home = os.environ.get("HOME") or str(pathlib.Path.home())
    return {os.path.realpath(os.path.join(home, SEAT)), os.path.join(home, SEAT)}


def names_the_seat(text):
    """Does this string reach the machine seat, by any spelling it is written in."""
    if not text:
        return False
    if TOKEN.search(text):
        return True
    # An absolute or expanded path that resolves to the seat, including a symlink to it.
    for candidate in re.findall(r"""[^\s'"|;&<>()]+""", text):
        cleaned = candidate.strip("'\"")
        if not cleaned.endswith(SEAT):
            continue
        expanded = os.path.expanduser(os.path.expandvars(cleaned))
        try:
            if os.path.realpath(expanded) in seat_paths():
                return True
        except OSError:
            continue
    return False


def deny(reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def main():
    try:
        event = json.loads(sys.stdin.read() or "{}")
    except (json.JSONDecodeError, ValueError):
        return                                     # unparsable input is not a finding — allow
    if not isinstance(event, dict):
        return
    tool = event.get("tool_name", "")
    supplied = event.get("tool_input") or {}
    if not isinstance(supplied, dict):
        return

    if tool in ("Read", "NotebookRead"):
        if names_the_seat(str(supplied.get("file_path", ""))):
            deny(f"Denied: reading ~/.spnenv puts every value in it into this transcript. {WHY} {DOOR}")
        return

    if tool in ("Grep", "Glob"):
        for field in ("path", "pattern", "glob"):
            if names_the_seat(str(supplied.get(field, ""))):
                deny(f"Denied: searching ~/.spnenv prints the lines it matches, values and all. {WHY} {DOOR}")
        return

    if tool == "Bash":
        command = str(supplied.get("command", ""))
        if names_the_seat(command):
            deny(
                f"Denied: this command renders ~/.spnenv, and its output lands in the transcript. "
                f"{WHY} {DOOR} "
                f"You may still WRITE the file and read it inside a tool's own process — what is "
                f"refused is putting a region of it on screen. {WRITING}"
            )
        return


if __name__ == "__main__":
    try:
        main()
    except Exception:                              # noqa: BLE001 — a guard must never take the chain down
        pass
    sys.exit(0)
