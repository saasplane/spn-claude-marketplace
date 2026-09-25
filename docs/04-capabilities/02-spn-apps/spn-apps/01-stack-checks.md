<!-- spn:doc
{"id": "spn-apps-capabilities-stack-checks", "variant": "capability", "title": "Stack Checks in spn-apps", "lenses": ["SERVER_DEV", "WEB_DEV"], "status": "DONE", "realizes": ["stack-checks"], "summary": "Six write-time checks for the TypeScript stack behind one dispatcher, reading a source file with its comments masked and the pending write already applied, so each can answer whether this edit introduced the pattern.", "keywords": ["check", "dispatcher", "enablement", "host assertion", "await", "coverage"]}
-->

# Stack Checks in spn-apps

`For: Backend developer · Web developer` · `Status: ✅ DONE` · `Realizes: Stack Checks`

Six checks live under `plugins/spn-apps/src/scripts/checks/`, each catching one pattern in how this stack writes its contract, service and test layers. A seventh file is the dispatcher that composes them. Two things separate these from `spn-devex`'s. **Each restates a chapter of the TypeScript provider standard**, never a stack-agnostic rule: anything general enough to hold everywhere belongs in the core plugin. And **each asks whether this edit introduces the pattern**, not whether the file already has it, which is what makes a refusal fair on a file somebody else wrote.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `plugins/spn-apps/src/hooks/hooks.json` | one `PreToolUse` entry matching `Write` and `Edit` |
| The dispatcher | `plugins/spn-apps/src/scripts/events/pretooluse.ts` | composes the six into one process |
| The enablement grammar | `plugins/spn-apps/src/scripts/checks/contract/enablement-grammar.ts` | prefix, verb, noun, and no hardcoded organization types |
| The host assertion | `plugins/spn-apps/src/scripts/checks/tests/host-assertion.ts` | an unanchored host pattern in a navigation assertion |
| The three coverage warnings | `plugins/spn-apps/src/scripts/checks/tests/coverage.ts` | a route nothing exercises, a mutation nothing undoes, a doubled seam |
| The read-verb name | `plugins/spn-apps/src/scripts/checks/contract/read-verb-naming.ts` | a `get…` returning a list type under a plural name |
| The sequencing rule | `plugins/spn-apps/src/scripts/checks/src/await-sequencing.ts` | a `.then()` chain in a server node's source |
| The assertion message | `plugins/spn-apps/src/scripts/checks/tests/assertion-message.ts` | a journey assertion with nothing explaining an absence |
| How a source file is read | `plugins/spn-apps/src/scripts/lib/source.ts` · `lib/payload.ts` | masking, the pending write, and the verdict shape |

## Follows the pattern

- The verdict, the composition and the always-zero exit — [Hook in spn-devex](../../01-spn-devex/spn-devex/02-hook-set.md)
- What a check may decide on its own account — [The Hook](../../../02-constructs/01-spn-devex/02-hook-set.md)

## Special handling

### The registration change is where the saving is

**Why** — *eight separate entries meant eight interpreter start-ups on every write*. Measured on 19 September 2026, one ordinary edit cost 1,123 ms, of which 1,040 ms was starting programs. The checking was about 83 ms.
**What** — `hooks.json` declares one entry. Porting the scripts alone would not have collected the saving, because eight entries are still eight start-ups.
**How** — the dispatcher imports each check and calls it, in the shape `spn-devex` uses. `plugins/spn-apps/src/scripts/events/pretooluse.ts`.

### The payload shape is copied, not imported

**Why** — *a plugin never depends on another plugin's internals*. The two install separately and version separately, so an import across them would break on a version skew nobody chose.
**What** — this plugin keeps its own `payload.ts`, named as `spn-devex` names the same job, so learning one teaches you both.
**How** — the file says so in its opening comment. `plugins/spn-apps/src/scripts/lib/payload.ts`.

### A source file is read with the write already applied

**Why** — *a check must answer whether this edit introduces the pattern*. Reading what is on disk reports faults somebody else wrote and misses the one being written now.
**What** — comments and strings are masked out, the caller's pending write is overlaid, and the search runs on that text.
**How** — the helpers were once private to one check and reached into by four siblings, each paying a second module load; they are shared code in a shared file now. `plugins/spn-apps/src/scripts/lib/source.ts`.

### Two checks exist because a green run was lying

**Why** — *a check that cannot fail is worse than no check*. A loose host pattern matched our own redirect address inside a provider's authorize URL, so the journey agreed it was home while the browser sat on the vendor's consent screen.
**What** — a host assertion compares a parsed hostname for equality, or anchors its pattern. The check fires only when the literal looks like a host and the statement is about navigation.
**How** — the same reasoning shapes the assertion-message warning, which asks a journey case what an absence would mean. `host-assertion.ts` and `assertion-message.ts`.

### Warnings where the model is not settled, refusals where it is

**Why** — *a refusal on a rule still being designed teaches people to work around the hook*. The coverage model belongs to its own arc.
**What** — the three coverage findings warn and under-report on purpose: covered means, for now, that the route's own path appears somewhere under a test tree in the same node. The grammar, naming, sequencing and host rules refuse, because each is settled and each names its own exception.
**How** — the coverage file marks the function to replace when the model lands, and keeps the trigger and the message. `plugins/spn-apps/src/scripts/checks/tests/coverage.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex | the permission-and-enablement ref the grammar check's denials cite | the reasoning lives once, stack-agnostic |
| takes | spn-foundation | the TypeScript provider chapters each check restates | a chapter cannot fire when somebody writes the file |
| publishes | every TypeScript stack repository | six refusals and warnings at the moment a pattern is written | the rule is checked on every call rather than remembered |
