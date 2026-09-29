<!-- spn:doc
{"id": "spn-devex-capabilities-hook-set", "variant": "capability", "title": "Hooks in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["hook-set"], "summary": "The four moments this plugin wires and the shared shapes every hook in the workspace is built on: a verdict that is returned rather than printed, one process for the whole call chain, and an exit code that is always zero.", "keywords": ["hook", "moment", "verdict", "dispatcher", "hooks.json", "timing"]}
-->

# Hooks in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Hooks`

`spn-devex` is the only plugin that wires more than one moment: all four, one script each, none of them reached any other way. It also realizes the parts every other hook in the marketplace reuses — the payload and verdict shapes, the dispatcher that composes many checks into one answer, and the timing that says what all of it cost. Two decisions shape the rest. **The moment decides the authority**: a call about to run is the only place a call can still be stopped, so the other three speak and nothing more. And **a check returns its verdict instead of printing one**: the earlier scripts each printed JSON and exited, and the dispatcher parsed what it could read — which is how one check fired one hundred and forty-seven times and changed nothing.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The event wiring | `packages/plugin-spn-devex/src/hooks/hooks.json` | four entries, one per moment, each naming a script and a timeout |
| The window opening | `packages/plugin-spn-devex/src/scripts/events/orientation.ts` | `SessionStart`, on `startup`, `resume` or `clear` |
| A call about to run | `packages/plugin-spn-devex/src/scripts/events/pretooluse.ts` | `PreToolUse`, matching `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob` and `NotebookRead`, and the dispatcher behind it |
| A shell command that finished | `packages/plugin-spn-devex/src/scripts/events/closed.ts` | `PostToolUse`, matching `Bash` |
| A turn about to end | `packages/plugin-spn-devex/src/scripts/events/stop.ts` | `Stop`, with no matcher |
| The verdict and the payload | `packages/plugin-spn-devex/src/scripts/lib/payload.ts` | the `Payload` and `Verdict` types, `readPayload`, `emit`, `runAlone` |
| What a run cost | `packages/plugin-spn-devex/src/scripts/lib/timing.ts` | one span per check, written only when the developer asked for it |

## Follows the pattern

- The moments, the verdict shape, and the line between refusing and reporting — [Hooks](../../../02-constructs/01-devex/02-hooks.md)
- The folder and the manifest a hook is wired inside — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)

## Special handling

### A verdict is a return value

**Why** — *a refusal that travels through stdout can be lost on the way*. Redirecting output, swapping arguments and parsing the last line gives a refusal several places to disappear, and it disappeared in all of them.
**What** — each check is a function returning `{ deny?, note? } | null`. The dispatcher calls it and reads the object. A file can still be run on its own, and then `emit` prints the same JSON to the same stream.
**How** — `emit` sets `permissionDecision` and `permissionDecisionReason` for a refusal and `additionalContext` for a note, because a message put only in the developer's pane is invisible to the agent. `packages/plugin-spn-devex/src/scripts/lib/payload.ts`.

### Exit zero, always, and a throwing check is skipped

**Why** — *a hook that crashes takes every other gate in the chain with it*. One broken rule must never remove the rules beside it.
**What** — a refusal is the documented decision on stdout and never a non-zero exit. Inside the chain, a check that throws is caught and passed over; the rest still run.
**How** — the dispatch loop wraps each call, and the top level wraps the whole dispatch before emitting. `packages/plugin-spn-devex/src/scripts/events/pretooluse.ts`, the `dispatch` function and the lines under it.

### One process, cheapest check first

**Why** — *five hooks matched one edit and each paid an interpreter start-up before reading a byte*. Measured on 8 September 2026, the chain cost 117.7 ms per edit and 60 ms of that was five programs starting.
**What** — `hooks.json` declares one `PreToolUse` entry. The dispatcher imports every check, and each declares what it `applies` to and which fields it `needs`, so a call that cannot interest a check never reaches it.
**How** — the order is a path test, then a file read, then a workspace walk, and the tree-reading check is last. `packages/plugin-spn-devex/src/scripts/events/pretooluse.ts`, the `CHECKS` list.

### A hook runs a committed bundle, not its source

**Why** — *a fresh process pays for start-up on every call, and type-stripping a TypeScript source is the largest piece of it* — the foundation's `04-plugins/02-shape.md` § *Why a hook runs a bundle* states the general case and the measurements it rests on.
**What** — `hooks.json` names `dist/events/*.mjs`, never `scripts/events/*.ts`. Measured on this machine, 2026-09-28: `PreToolUse` fell from 63 ms to 26 ms.
**How** — `pnpm build:plugins` at the marketplace root rebuilds every plugin once; `pnpm build:plugins:watch` rebuilds on every source change while editing a hook; `spn-devex plugin build` runs the same script from inside any plugin checkout. An edit to a hook's source is not live until the next rebuild — `tests/unit/t-dist-current.mjs` refuses a bundle older than its sources, so an unrebuilt edit fails the suite by name rather than running silently stale. `packages/plugin-spn-devex/src/hooks/hooks.json`, `packages/plugin-spn-devex/src/scripts/commands/plugin/build.ts`.

### The first refusal is the answer; advice adds up

**Why** — *a refusal ends the call, so anything after it is noise*, while two pieces of advice are worth more than one.
**What** — the loop returns on the first `deny` and joins every `note` into one message.
**How** — the generated-file guard runs before the list, because it refuses from the path alone and needs nothing else read. Same file, `generatedRefusal`.

### The session's first screen is read from the ground

**Why** — *the workspace is discovered, never declared*. A file naming the members in prose is wrong the first time somebody clones another repository, and a repository that is absent is not missing.
**What** — nothing in the opening screen is typed. The script walks the root, reads each `sprepo.json` for the world and the stack claim, checks the wiring that claim implies, and lists every workstream in all three states. Where no manifest exists anywhere, it asks instead of reading and points at the `bootstrap` skill.
**How** — the first reply opens with the welcome, whatever the prompt, then **one status line** — `7 repos · 1 workstream open (008) · 3 other windows open here` — that drops any part reading zero and adds a clause, never a second line, for an unwired repository, a stale plugin, or a rung below an ordinary session. The tables of repositories and workstreams, and the one open question, are held back for when you ask: a reply opening on a table shows numbers before anybody asked for them. Every read is wrapped and the exit code is always zero, because this output is the session's first screen and a crash here is a window that opens on a stack trace. `packages/plugin-spn-devex/src/scripts/events/orientation.ts`.

### The close is congratulated after it lands, not before

**Why** — *the close gate runs before the move and speaks only to refuse*. Congratulating from there would congratulate something that has not happened and might still fail.
**What** — `PostToolUse` on `Bash` reads the command's own `mv`, and when a workstream folder has actually moved into `closed/` it says what landed, counted from that page's split plan.
**How** — the subject is taken from the source of the move, because `mv <subject> closed/` is how a close is typed and the destination is then only a structural name. It reads the same parser the close gate refused with, so both count the same table. `packages/plugin-spn-devex/src/scripts/events/closed.ts`.

### A turn that ends warns and never refuses

**Why** — *the turn is already written*, and a refusal at that point would only lose it.
**What** — warnings for a reply that puts a decision with the card's shape incomplete, an arc *this session* wrote to that still has runnable rows and no card open, an arc marked `HELD` that names no live card, a reply that passes work on while a card is open or the handover's seven fields are missing, and the corpus questions a whole-tree read still owes.
**How** — `runnable` reads a baseline kept per session, under `.spndevex/.debug/stop/sessions/`, comparing each open arc's step-row hash against what this session last saw and reading its own transcript for which arcs it wrote — so an arc another window is executing never fires here. A status of `PROPOSED`, `DECIDED` or `HELD` is never runnable, whoever touched it, and a row already marked `in progress <date> <time> <offset>` is named with its age rather than counted as unfinished, because somebody may still be on it. `[handover]` strips fenced blocks, code spans, block quotes and quoted text before it looks for a phrase that passes work on, so a reply quoting the check's own words, or a `diff` block previewing a change, is never mistaken for one. `packages/plugin-spn-devex/src/scripts/events/stop.ts`.

### Measuring is free; writing is the cost

**Why** — *telemetry must not make the gate slower*, and a gate that fails because timing failed is worse than a number nobody recorded.
**What** — every run is timed, and each line also names the workstream, arc, order and agent the call belongs to, so a later reading can join a cost to the work that paid it without guessing from a path. Whether any of it reaches disk is a switch the developer sets, and every path swallows its own errors.
**How** — `begin` touches no filesystem; the switch is read at the moment of writing, under a fixed size cap; `tagsOf` matches every string in a call's input against a workstream path and keeps the most specific match — an order over an arc over a bare workstream — reading the hook's own `agent_id` for which agent made the call. `packages/plugin-spn-devex/src/scripts/lib/timing.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| publishes | spn-apps · spn-infra | the payload and verdict job, copied rather than imported | a plugin never depends on another plugin's internals |
| publishes | spn-devex's own scripts | `readPayload`, `emit`, `read`, `workspaceRoot` and the folder walks | parsing a call is written once |
| takes | spn-devex's checks | the dispatcher's check list, and `split-plan.ts`'s parser for the plan, the arcs and the cards | one reading of the split plan serves the gate, the close line and the turn-end warnings |
| takes | every repository in the workspace | each one's `sprepo.json`, and the `.spndevex/` workstream folders | the orientation is the ground, read fresh each time |
| takes | the Claude Code harness | the event JSON on stdin, and the decision fields it reads back | the shape of both is the harness's, not this repository's |
