<!-- spn:doc
{"id": "spn-devex-capabilities-hook-set", "variant": "capability", "title": "Hooks in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["hook-set"], "summary": "The four moments this plugin wires and the shared shapes every hook in the workspace is built on: a verdict that is returned rather than printed, one process for the whole call chain, and an exit code that is always zero.", "keywords": ["hook", "moment", "verdict", "dispatcher", "hooks.json", "timing"]}
-->

# Hooks in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Hooks`

`spn-devex` is the only plugin that wires more than one moment: all four, one script each, none of them reached any other way. It also realizes the parts every other hook in the marketplace reuses — the payload and verdict shapes, the dispatcher that composes many checks into one answer, and the timing that says what all of it cost. Two decisions shape the rest. **The moment decides the authority**: a call about to run is the only place a call can still be stopped, so the other three speak and nothing more. And **a check returns its verdict instead of printing one**: the earlier scripts each printed JSON and exited, and the dispatcher parsed what it could read — which is how one check fired one hundred and forty-seven times and changed nothing.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The event wiring | `packages/plugin-spn-devex/src/hooks/hooks.json` | five entries, one per moment plus `PostToolUseFailure` for Bash, each naming a script and a timeout |
| The window opening | `packages/plugin-spn-devex/src/scripts/events/orientation.ts` | `SessionStart`, on `startup`, `resume` or `clear` |
| A call about to run | `packages/plugin-spn-devex/src/scripts/events/pretooluse.ts` | `PreToolUse`, matching `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `NotebookRead` and `Artifact`, and the dispatcher behind it |
| A shell command that finished | `packages/plugin-spn-devex/src/scripts/events/closed.ts` | `PostToolUse` and `PostToolUseFailure`, matching `Bash` |
| A turn about to end | `packages/plugin-spn-devex/src/scripts/events/stop.ts` | `Stop`, with no matcher |
| The verdict and the payload | `packages/plugin-spn-devex/src/scripts/lib/payload.ts` | the `Payload` and `Verdict` types, `readPayload`, `emit`, `runAlone` |
| What a run cost | `packages/plugin-support-lib/src/lib/timing.ts` | one line per check, in the shape every plugin writes, only when the developer asked for it, and the tags each session and agent carries forward in `telemetry/tags.json` |
| What a Bash command cost | `packages/plugin-spn-devex/src/scripts/lib/command-reader.ts` · `lib/bash-timing.ts` | the command read into the programs it runs, and the start file the hooks before and after the call pair on |

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

### A publish is reminded, never refused

**Why** — *the agent publishes no page unless the developer asks* (RD.DEVEX.WORKSPACE.117), and the habit came from the publishing tool's own default, which a rule in a reference file loses to at the moment of the call. The hook cannot know whether the developer asked.
**What** — `hooks.json` routes the `Artifact` tool through `PreToolUse`. A call that publishes a page — no action, or `publish`, and not an asset upload to a page already published — gets one note stating the rule and the full path to hand over instead, and the call goes ahead. No other check reads a publish, because it writes no file here.
**How** — `dispatch` returns the note before the check list. `packages/plugin-spn-devex/src/scripts/checks/publish.ts`.

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

**Why** — *the turn is already written*, and a refusal at that point would only lose it. A warning makes the agent reply again, so a check speaks once in a turn and only about the session's own work (RD.DEVEX.WORKSPACE.197 · RD.DEVEX.WORKSPACE.198).
**What** — warnings for a reply that puts a decision with the card's shape incomplete, a reply over an open card that does not open with **Needs you** — a card this turn raised in full there once, and every card open from an earlier reply named in one line (RD.DEVEX.WORKSPACE.189) — an answer logged in an arc whose notes (spec, plan, previews, samples) did not move in the same turn, a proposed arc carrying a review point to a later step of itself (RD.DEVEX.WORKSPACE.193), an arc *this session* wrote to that still has runnable rows and no card open, an arc marked `HELD` that names no live card, a reply that passes work on while a card is open or the handover's seven fields are missing, and the corpus questions a whole-tree read still owes.
**How** — a check that spoke at the session's last Stop is skipped while `stop_hook_active` is true, because the reply is its answer; the baseline keeps what spoke earlier in the turn beside what spoke now. The cards, the hold check and the four arc-to-page checks read the open workstreams the session has written to, taken from its transcript and kept in the baseline as `workstreams`; where no transcript can be read, they read every open workstream. The baseline also keeps the cards open at the session's last Stop, so a card open now and not then is the one this turn raised, and each open arc's log entries (hashed), its notes' size and time, and its status, so a new log entry recording an answer is judged against notes that did or did not move. An arc's notes are `notes/N<nnn>/spec.md`, `plan.md`, and every file under `previews/` and `samples/` in that folder; the warning names the spec and the plan by file and each of the two folders once. The arc number is read as the file name writes it, with one, two or three digits. `runnable` reads a baseline kept per session, under `.spndevex/.debug/stop/sessions/`, comparing each open arc's step-row hash against what this session last saw and reading its own transcript for which arcs it wrote — so an arc another window is executing never fires here. A status of `PROPOSED`, `DECIDED` or `HELD` is never runnable, whoever touched it, and a row already marked `in progress <date> <time> <offset>` is named with its age rather than counted as unfinished, because somebody may still be on it. `[handover]` reads a pass-on only where a verb sends the work to another session, or the next session is said to start somewhere, and never where a session is merely named. It strips fenced blocks, code spans, block quotes and quoted text before it looks for that phrase, so a reply quoting the check's own words, or a `diff` block previewing a change, is never mistaken for one. `packages/plugin-spn-devex/src/scripts/events/stop.ts`.

### Measuring is free; writing is the cost

**Why** — *telemetry must not make the gate slower*, and a gate that fails because timing failed is worse than a number nobody recorded.
**What** — every run is timed, and so is each Bash command the agent runs through a program the filter names. Every line has one shape — the program or plugin, up to three levels below it, the arguments, the time, the exit code, the repository and a UTC time — and names the workstream, arc, order and agent the call belongs to, so a later reading can join a cost to the work that paid it without guessing from a path. Whether any of it reaches disk is a switch the developer sets, and every path swallows its own errors.
**How** — `begin` touches no filesystem; the switch is read at the moment of writing, under a fixed size cap; `tagsOf` matches every string in a call's input against a workstream path and keeps the most specific match — an order over an arc over a bare workstream — reading the hook's own `agent_id` for which agent made the call. **The tags carry forward** (RD.DEVEX.WORKSPACE.185): per session and agent, the last tagged call's tags sit in `telemetry/tags.json`, written only while the switch is on; a call that touches no workstream path inherits them, a call inside the same work keeps what it does not name, and a call that names other work replaces them. **A Bash command is paired on its `tool_use_id`**: `PreToolUse` writes `telemetry/pending/<tool_use_id>.json` for a matched command while the switch is on, and `PostToolUse` or `PostToolUseFailure` reads it, writes one line per program with the whole call's time and exit code, and removes it; a start file older than a day is removed when the next one is written. The programs are `spnutils`, the plugin CLIs, `nx`, `git` and `docker`, and `.spndevex/.debug/telemetry/filter.json` adds or removes them. `packages/plugin-support-lib/src/lib/timing.ts`, `carryTags`; `packages/plugin-spn-devex/src/scripts/lib/bash-timing.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| publishes | spn-apps · spn-infra | the payload and verdict job, copied rather than imported | a plugin never depends on another plugin's internals |
| publishes | spn-devex's own scripts | `readPayload`, `emit`, `read`, `workspaceRoot` and the folder walks | parsing a call is written once |
| takes | spn-devex's checks | the dispatcher's check list, and `split-plan.ts`'s parser for the plan, the arcs and the cards | one reading of the split plan serves the gate, the close line and the turn-end warnings |
| takes | every repository in the workspace | each one's `sprepo.json`, and the `.spndevex/` workstream folders | the orientation is the ground, read fresh each time |
| takes | the Claude Code harness | the event JSON on stdin, and the decision fields it reads back | the shape of both is the harness's, not this repository's |
