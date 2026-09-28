<!-- spn:doc
{"id": "spn-apps-capabilities-providers", "variant": "capability", "title": "Providers in spn-apps", "lenses": ["ARCHITECT", "SERVER_DEV"], "status": "DONE", "realizes": ["apps-providers"], "summary": "One folder for the stack this domain serves, carrying both halves — the build steps and the material a core skill loads, and the two doors whose private rules read this stack's own syntax.", "keywords": ["provider", "stack", "steps", "subject", "door", "private"]}
-->

# Providers in spn-apps

`For: Architect · Backend developer` · `Status: ✅ DONE` · `Realizes: Providers`

One folder sits under `packages/plugin-spn-apps/src/providers/`, named for the stack this domain serves today, and it carries **both halves**. That is not a stage this domain is passing through: a provider earns a half that a skill loads when the instance changes the language the work is written in, and here **the instance is the stack**, so it always does.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The build steps | `packages/plugin-spn-apps/src/providers/ts/skills/implement/steps/` | one file per layer: `contract` · `service` · `entry` · `queue` · `ui` · `test` · `env` |
| A core skill's own half | `packages/plugin-spn-apps/src/providers/ts/skills/ideate/plan.md` | how ownership is read from what a repository composes, and where markdown may not go |
| The source door | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/src.ts` | parses once, orders the verdicts, isolates a rule that throws |
| The tests door | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/tests.ts` | the same, for the subject that reads a test file |
| The enablement grammar | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_src/enablement-grammar.ts` | prefix, verb, noun, and no hardcoded organization types |
| The read-method name | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_src/read-verb-naming.ts` | a read returning a list type under a plural name |
| The sequencing rule | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_src/await-sequencing.ts` | a chained continuation in a server node's source |
| The contract cycle | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_src/contract-cycle.ts` | a contract state write that would close a dependency cycle |
| The host assertion | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/host-assertion.ts` | an unanchored host pattern in a navigation assertion |
| The assertion message | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/assertion-message.ts` | a journey assertion with nothing explaining an absence |
| The coverage warnings | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/coverage.ts` | a route nothing exercises, a mutation nothing undoes, a doubled seam |
| The coverage floor check | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/coverage-floor.ts` | a write that lowers a floor, or adds an exclude with no reason |
| The coverage floor script | `packages/plugin-spn-apps/src/providers/ts/scripts/lib/coverage-floor.ts` | raises each floor in a project's own configuration to what a run measured |
| How a floor and its excludes are read | `packages/plugin-spn-apps/src/providers/ts/scripts/lib/floors.ts` | one parse of a Jest or Vitest configuration, shared by the floor script and the floor check |
| Where a case lives, and its title | `packages/plugin-spn-apps/src/providers/ts/scripts/lib/cases.ts` | each tier's folder and file pattern, and the ids a case title cites, for the join |

## Follows the pattern

- The two halves, the naming mirror, and the rule that a gate never names an instance — [The Provider](../../../02-constructs/01-devex/07-providers.md)
- How the shape is realized across the plugins, and why one of them carries no provider at all — [Provider in spn-devex](../../01-devex/plugin-spn-devex/07-providers.md)

## Special handling

### Both halves, because for this domain the instance is the stack

**Why** — *writing a contract, a service and an entry is a different procedure in a different language*. Where the instance is a cloud and every rendering is written against the same engine, the procedure does not change and the provider carries a scripts half alone. Here it changes every time.
**What** — the folder carries a `skills/` half and a `scripts/` half, under the plugin's own folder names.
**How** — a contributor filling either has already read the folders it mirrors, so plugging in a stack needs no explanation. `packages/plugin-spn-apps/src/providers/ts/`.

### A folder named for the skill, not for the plugin that ships it

**Why** — *what a reader needs to know is which skill loads this material*, and that skill lives in the core plugin rather than in this one.
**What** — the material for deciding what a node is sits under that skill's own name here: how ownership of a capability is read from the installed packages a repository actually composes, and where markdown may not go.
**How** — this is the first material proving a provider folder works across plugins — a core skill loading a domain plugin's provider. `packages/plugin-spn-apps/src/providers/ts/skills/ideate/plan.md`.

### Two subjects, because a contract subject overlapped the source one on every file

**Why** — *every contract rule watches a path under `src/`*. While contracts were a subject of their own, a write to a contract state matched both, and the file was read and masked twice — at write time, where a person is waiting.
**What** — a write is asked about its source and about its tests, and nothing else.
**How** — which rules apply is decided by the path and the node's kind rather than by a subject's name. `packages/plugin-spn-apps/src/providers/ts/scripts/checks/src.ts`.

### A door parses once, keeps the first refusal, and survives a rule that throws

**Why** — *a person fixes one thing at a time*, so several refusals for one edit read as a broken gate rather than as several problems. And a subject that crashes takes every other rule in the chain with it, which is worse than any single miss.
**What** — the door builds the resulting text once per write, returns the first refusal, collects every note when nothing refused, and skips a rule that throws.
**How** — advice never outranks a refusal, because advice is advice and several pieces can be true at once. `packages/plugin-spn-apps/src/providers/ts/scripts/checks/tests.ts`.

### A rule is private to the door beside it

**Why** — *a rule is an implementation detail of the check that runs it*, not an entry in a shared registry. A registry is where rules drift that only one instance ever needed.
**What** — each rule sits behind an underscore folder named for its own subject, so listing the checks folder shows the doors alone.
**How** — nothing outside a private folder imports into it, and the suites find a rule by searching those folders rather than by naming one. `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_src/`.

### One rule is written twice, and its header says where the other copy is

**Why** — *the failure the cycle rule prevents lands at start-up*. The generated validators import in the same shape as the states, so a loop resolves to nothing and the application comes up broken rather than failing to build — and a check that runs at review time runs after the damage.
**What** — the rule is also in the command-line tool. This copy refuses the write; that copy is the single home of the rule.
**How** — the header names the tool's own file and carries the instruction: a change is made there first, then here, in the same change. `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_src/contract-cycle.ts`.

### Refusals where the model is settled, warnings where it is not

**Why** — *a refusal on a rule still being designed teaches people to work around the hook*. The coverage model belongs to its own argument.
**What** — the coverage findings warn and under-report on purpose; the grammar, naming, sequencing, cycle and host rules refuse, because each is settled and each names its own exception.
**How** — the coverage file marks the function to replace when the model lands, and keeps its trigger and its message meanwhile. `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/coverage.ts`.

### A floor rises by script and never falls by hand

**Why** — *without a ratchet, the cheapest way past a failing floor is to edit it down* (the book's RD.SUPPORT.APPS.133). A number somebody typed is a number nobody measured, and an exclude with no reason cannot be told from code nobody wrote a case for.
**What** — after a run that collected coverage, the script reads `coverage-summary.json` and raises each of the four numbers in `coverageThreshold.global` or `coverage.thresholds` to the measured value rounded down, with the date in a comment. A number above the measurement is left as it was, and the script says the run falls below it. The check refuses a write that lowers any of the four, and refuses a new `coveragePathIgnorePatterns` or `coverage.exclude` entry with no comment beside it. A Playwright configuration is never read.
**How** — the script writes the file directly, so the check at the moment of a write sees only a person's edit. `packages/plugin-spn-apps/src/providers/ts/scripts/lib/coverage-floor.ts` and `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/coverage-floor.ts`, proven on fixtures in `packages/plugin-spn-apps/tests/unit/providers/ts/lib/t-coverage-floor.mjs` and `packages/plugin-spn-apps/tests/unit/providers/ts/checks/_tests/t-coverage-floor.mjs`.

### Two rules exist because a green run was lying

**Why** — *a pattern loose enough to match inside a longer string is a check that cannot fail*. One matched a redirect address sitting inside a provider's own consent URL, so a browser journey agreed it was home while the screen was still the vendor's.
**What** — a host assertion compares a parsed host for equality, or anchors its pattern, and fires only where the literal looks like a host and the statement is about navigation.
**How** — the same reasoning shapes the assertion-message rule, which asks a journey case what an absence would mean. `packages/plugin-spn-apps/src/providers/ts/scripts/checks/_tests/host-assertion.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | this plugin's own scripts | the shared reading of a source file, the payload shape and the stack read | a rule reads a parse it did not build |
| takes | spn-devex | the card the enablement refusals cite, and the skill that loads the planning half | the reasoning lives once, stack-agnostic |
| takes | spn-foundation | the provider chapters and the layer promises each rule restates | a chapter cannot fire when somebody writes the file |
| publishes | this plugin's own gate | two subjects, resolved by a path composed from the declaration | a second stack joins by adding a folder |
| publishes | every repository declaring this stack | refusals and warnings at the moment a pattern is written | the rule is asked on every call rather than remembered |
