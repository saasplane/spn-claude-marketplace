<!-- spn:doc
{"id": "spn-devex-capabilities-loop-events", "variant": "capability", "title": "Loop Events in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["loop-events"], "summary": "The four moments spn-devex wires into — the window opening, a call about to run, a shell command that finished, and a turn about to end — and why only one of them may refuse anything.", "keywords": ["SessionStart", "PreToolUse", "PostToolUse", "Stop", "orientation", "turn"]}
-->

# Loop Events in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Loop Events`

`spn-devex` is the only plugin that wires more than one moment: all four, one script each, none of them called any other way. Each file reads the payload the harness hands it, does its own work, and answers in the way its moment allows. The thing to know before opening the folder is that **the moment decides the authority**. `PreToolUse` is the only place a call can still be stopped, so the other three speak and nothing more — by the time they run, whatever they might object to has already happened.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `plugins/spn-devex/hooks/hooks.json` | the four entries, their matchers and their timeouts |
| The window opening | `plugins/spn-devex/hooks/events/orientation.ts` | `SessionStart`, on `startup`, `resume` or `clear` |
| A call about to run | `plugins/spn-devex/hooks/events/pretooluse.ts` | `PreToolUse`, matching `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob` and `NotebookRead` |
| A shell command that finished | `plugins/spn-devex/hooks/events/closed.ts` | `PostToolUse`, matching `Bash` |
| A turn about to end | `plugins/spn-devex/hooks/events/stop.ts` | `Stop`, with no matcher |

## Follows the pattern

- The four events and what each may say back — [The Hook](../../../02-constructs/01-spn-devex/02-hook-set.md)
- The dispatcher, the verdict and the always-zero exit — [Hook in spn-devex](02-hook-set.md)

## Special handling

### The session's first screen is read from the ground

**Why** — *the workspace is discovered, never declared*. A file naming the members in prose is wrong the first time somebody clones another repository, and a repository that is absent is not missing.
**What** — nothing in the opening screen is typed. The script walks the root, reads each `sprepo.json` for the world and the stack claim, checks the wiring that claim implies, and lists every workstream in all three states.
**How** — three parts in a fixed order: a welcome, the ground, and exactly one open question. You arrive with a subject in mind, so a list of options would only talk you out of it. Read `plugins/spn-devex/hooks/events/orientation.ts`.

### Day zero is the case where there is nothing to read

**Why** — *an empty folder has no manifest to walk*, and a status dump over nothing teaches the reader nothing.
**What** — no `sprepo.json` anywhere means the agent asks instead of reading, and points at the `day-zero` skill.
**How** — the same script, choosing its shape from what the walk found. Same file.

### A broken orientation must never cost a window

**Why** — *this script's output is the session's first screen*, so a crash here is a window that opens on a stack trace.
**What** — every read is wrapped and the exit code is always zero. The same script also runs by hand, printing the same text, so it can be read without opening a session.
**How** — `node orientation.ts --stdin` for the hook and `node orientation.ts [path]` by hand. Same file.

### The close is congratulated after it lands, not before

**Why** — *the close gate runs before the move and speaks only to refuse*. Congratulating from there would congratulate something that has not happened and might still fail.
**What** — `PostToolUse` on `Bash` reads the command's own `mv`, and when a workstream folder has actually moved into `closed/` it says what landed, counted from that page's split plan.
**How** — the subject is taken from the source of the move, because `mv <subject> closed/` is how a close is typed and the destination is then only a structural name. It reads the same parser the close gate refused with, so both count the same table. `plugins/spn-devex/hooks/events/closed.ts`.

### A turn that ends warns and never refuses

**Why** — *the turn is already written*, and a refusal at that point would only lose it.
**What** — three warnings: a turn ending while the running arc still has rows nothing blocks, an arc marked `HELD` that names no live card, and a reply announcing a new window without the handover fields.
**How** — the runnable warning exists because reporting is not stopping; a milestone line belongs between steps, in the same turn as the next step. `plugins/spn-devex/hooks/events/stop.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex's checks | the dispatcher's check list, and `split-plan.ts`'s parser for the plan, the arcs and the cards | one reading of the split plan serves the gate, the close line and the turn-end warnings |
| takes | every repository in the workspace | each one's `sprepo.json`, and the `.spndevex/` workstream folders | the orientation is the ground, read fresh each time |
| publishes | the session | the opening screen, a refusal or a note on a call, a closing line, and the end-of-turn warnings | the loop is where a written rule becomes something that happens |
