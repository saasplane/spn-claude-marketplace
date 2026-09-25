<!-- spn:doc
{"id": "spn-devex-capabilities-hook-set", "variant": "capability", "title": "Hook in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["hook-set"], "summary": "The wiring and the shared shapes every hook in the workspace is built on: a verdict that is returned rather than printed, one process for the whole PreToolUse chain, and an exit code that is always zero.", "keywords": ["hook", "verdict", "dispatcher", "payload", "hooks.json", "timing"]}
-->

# Hook in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Hook`

`spn-devex` realizes the parts of the construct that every other hook in the marketplace reuses: the wiring file, the payload and verdict shapes, the dispatcher that composes many checks into one answer, and the timing that says what all of it cost. The two events and the tools it wires are their own chapters; this one is the frame they sit in. One decision shapes everything else here. **A check returns its verdict instead of printing one.** The earlier scripts each printed JSON and exited, and the dispatcher parsed what it could read — so a refusal that did not parse was silently dropped, which is how one check fired one hundred and forty-seven times and changed nothing.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The event wiring | `plugins/spn-devex/hooks/hooks.json` | four entries, one per moment, each naming a script and a timeout |
| The verdict and the payload | `plugins/spn-devex/hooks/lib/payload.ts` | the `Payload` and `Verdict` types, `readPayload`, `emit`, `runAlone` |
| The dispatcher | `plugins/spn-devex/hooks/events/pretooluse.ts` | one process for every `PreToolUse` check |
| What a run cost | `plugins/spn-devex/hooks/lib/timing.ts` | one span per check, written only when the developer asked for it |

## Follows the pattern

- The four events, the verdict shape, and the line between refusing and reporting — [The Hook](../../../02-constructs/01-spn-devex/02-hook-set.md)
- The folder and the manifest a hook is wired inside — [The Plugin](../../../02-constructs/01-spn-devex/01-plugin-set.md)

## Special handling

### A verdict is a return value

**Why** — *a refusal that travels through stdout can be lost on the way*. Redirecting output, swapping arguments and parsing the last line gives a refusal several places to disappear, and it disappeared in all of them.
**What** — each check is a function returning `{ deny?, note? } | null`. The dispatcher calls it and reads the object. A file can still be run on its own, and then `emit` prints the same JSON to the same stream.
**How** — `emit` sets `permissionDecision` and `permissionDecisionReason` for a refusal and `additionalContext` for a note, because a message put only in the developer's pane is invisible to the agent. `plugins/spn-devex/hooks/lib/payload.ts`.

### Exit zero, always, and a throwing check is skipped

**Why** — *a hook that crashes takes every other gate in the chain with it*. One broken rule must never remove the rules beside it.
**What** — a refusal is the documented decision on stdout and never a non-zero exit. Inside the chain, a check that throws is caught and passed over; the rest still run.
**How** — the dispatch loop wraps each call, and the top level wraps the whole dispatch before emitting. `plugins/spn-devex/hooks/events/pretooluse.ts`, the `dispatch` function and the lines under it.

### One process, cheapest check first

**Why** — *five hooks matched one edit and each paid an interpreter start-up before reading a byte*. Measured on 8 September 2026, the chain cost 117.7 ms per edit and 60 ms of that was five programs starting.
**What** — `hooks.json` declares one `PreToolUse` entry. The dispatcher imports every check, and each declares what it `applies` to and which fields it `needs`, so a call that cannot interest a check never reaches it.
**How** — the order is a path test, then a file read, then a workspace walk, and the tree-reading check is last. `plugins/spn-devex/hooks/events/pretooluse.ts`, the `CHECKS` list.

### The first refusal is the answer; advice adds up

**Why** — *a refusal ends the call, so anything after it is noise*, while two pieces of advice are worth more than one.
**What** — the loop returns on the first `deny` and joins every `note` into one message.
**How** — the generated-file guard runs before the list, because it refuses from the path alone and needs nothing else read. Same file, `generatedRefusal`.

### Measuring is free; writing is the cost

**Why** — *telemetry must not make the gate slower*, and a gate that fails because timing failed is worse than a number nobody recorded.
**What** — every run is timed. Whether any of it reaches disk is a switch the developer sets, and every path swallows its own errors.
**How** — `begin` touches no filesystem; the switch is read at the moment of writing, under a fixed size cap. `plugins/spn-devex/hooks/lib/timing.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| publishes | spn-apps-ts | the payload and verdict job, copied rather than imported | a plugin never depends on another plugin's internals |
| publishes | spn-devex's own events, checks and tools | `readPayload`, `emit`, `read`, `workspaceRoot` and the folder walks | parsing a call is written once |
| takes | the Claude Code harness | the event JSON on stdin, and the decision fields it reads back | the shape of both is the harness's, not this repository's |
