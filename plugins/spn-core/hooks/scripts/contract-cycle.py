#!/usr/bin/env python3
"""Refuse a contract-state write that would close a dependency cycle.

The rule: **a contract state never closes a dependency cycle.** A state importing a sibling
one-way is correct — `role.ts` citing `AppPermissionMeta` from `app.ts` is right, and `app.ts` is
that type's home. What cannot be supported is a bidirectional dependency: the generated validators
import in the same shape as the states, so a loop resolves to `undefined` at boot rather than
failing at build. The application starts, which is the worst way to fail.

`core.ts` is the release valve for exactly that, and nothing else. A seat that has never hit a
cycle correctly has no `core.ts` at all.

**Why a hook and not `apps validate` alone** (decision RD.DEVEX.035): the failure lands at boot, so
a check that runs at review time runs after the damage. The rule itself lives once, in the CLI's
`contract-purity.ts`; this reads the same graph at write time so the loop never reaches disk.

It reads the SEAT, not the single file — a cycle is a property of the folder. The file being
written is overlaid on what is on disk, so the graph checked is the one the write would produce.

  hook :  contract-cycle.py --stdin      (PreToolUse JSON on stdin; denies with the loop named)
  scan :  contract-cycle.py <path> …     (any folder or repo; prints every cycle it finds)
"""
import json, os, re, sys

STATES_DIR = os.path.join("src", "contract", "states")
SIBLING = re.compile(r"from\s+'\./([\w-]+)'")
BLOCK_COMMENT = re.compile(r"/\*[\s\S]*?\*/")
LINE_COMMENT = re.compile(r"//[^\n]*")


def siblings(source, seat, stem):
    """Sibling state files this source imports — comments stripped, self never counted."""
    body = LINE_COMMENT.sub("", BLOCK_COMMENT.sub("", source))
    found = []
    for name in SIBLING.findall(body):
        if name != stem and os.path.isfile(os.path.join(seat, name + ".ts")):
            found.append(name)
    return sorted(set(found))


def graph_for(seat, overlay_stem=None, overlay_source=None):
    """The seat's import graph, with the pending write overlaid on what is on disk."""
    graph = {}
    for entry in sorted(os.listdir(seat)):
        if not entry.endswith(".ts") or entry.endswith(".d.ts"):
            continue
        stem = entry[:-3]
        if stem == overlay_stem:
            continue
        try:
            with open(os.path.join(seat, entry), encoding="utf8") as handle:
                graph[stem] = siblings(handle.read(), seat, stem)
        except OSError:
            continue
    if overlay_stem is not None:
        graph[overlay_stem] = siblings(overlay_source or "", seat, overlay_stem)
    return graph


def cycles(graph):
    """Every distinct loop, each named as the path a reader follows to see it."""
    state, out, seen = {}, [], set()

    def walk(node, trail):
        state[node] = 1
        for nxt in graph.get(node, ()):
            if state.get(nxt) == 1:
                loop = trail[trail.index(nxt):] + [nxt]
                key = "|".join(sorted(set(loop)))
                if key not in seen:
                    seen.add(key)
                    out.append(loop)
            elif nxt not in state:
                walk(nxt, trail + [nxt])
        state[node] = 2

    for node in sorted(graph):
        if node not in state:
            walk(node, [node])
    return out


def seat_of(path):
    """The states seat a path sits in, or None — the hook only ever speaks about that folder."""
    parent = os.path.dirname(os.path.abspath(path))
    return parent if parent.replace(os.sep, "/").endswith(STATES_DIR.replace(os.sep, "/")) else None


def deny(reason):
    json.dump({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}, sys.stdout)
    sys.exit(0)


def run_stdin():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0                                   # unparsable input allows, as the other hooks do
    tool_input = event.get("tool_input") or {}
    path = tool_input.get("file_path") or ""
    if not path.endswith(".ts"):
        return 0
    seat = seat_of(path)
    if seat is None or not os.path.isdir(seat):
        return 0

    source = tool_input.get("content")
    if source is None:
        # An Edit carries only the replacement, so the file on disk plus the new text is the
        # closest honest reading of what the write produces.
        fragment = tool_input.get("new_string")
        if fragment is None:
            return 0
        try:
            with open(path, encoding="utf8") as handle:
                source = handle.read() + "\n" + fragment
        except OSError:
            source = fragment

    stem = os.path.basename(path)[:-3]
    found = cycles(graph_for(seat, stem, source))
    if not found:
        return 0
    loops = " · ".join(" -> ".join(loop) for loop in found)
    deny(
        f"Contract-state dependency cycle: {loops}\n"
        f"  The generated validators import in this shape too, so the loop resolves to undefined "
        f"at boot rather than failing at build — the application starts.\n"
        f"  A one-way sibling import is fine and a type belongs in its own domain file. Move only "
        f"the state that CLOSES the loop into core.ts, which exists to open exactly this.\n"
        f"  (layer promise; decisions RD.DEVEX.035 · RD.DEVEX.024)"
    )
    return 0


def run_scan(paths):
    total = 0
    for root in paths:
        for base, dirs, _ in os.walk(root):
            dirs[:] = [d for d in dirs if d not in {"node_modules", "dist", ".git", ".nx"}]
            if not base.replace(os.sep, "/").endswith(STATES_DIR.replace(os.sep, "/")):
                continue
            for loop in cycles(graph_for(base)):
                total += 1
                print(f"{base}: {' -> '.join(loop)}")
    print(f"\n{total} contract-state cycle(s)")
    return 1 if total else 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--stdin"]
    sys.exit(run_stdin() if "--stdin" in sys.argv else run_scan(args or ["."]))
