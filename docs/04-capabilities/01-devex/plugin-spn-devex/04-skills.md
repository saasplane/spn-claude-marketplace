<!-- spn:doc
{"id": "spn-devex-capabilities-skill-set", "variant": "capability", "title": "Skills in spn-devex", "lenses": ["ARCHITECT", "LEAD"], "status": "DONE", "realizes": ["skill-set"], "summary": "One folder per stack-agnostic DevEx stage, each holding a single SKILL.md whose description is written to be matched against a turn's work rather than browsed by a person.", "keywords": ["skill", "command", "description", "stage", "stack-agnostic", "interactive"]}
-->

# Skills in spn-devex

`For: Architect · Engineering leader` · `Status: ✅ DONE` · `Realizes: Skills`

`spn-devex` ships one folder per stack-agnostic DevEx stage: `bootstrap`, `check`, `deliver`, `develop`, `ideate`, `operate`, `provision`, `report`, `scm` and `test`. Each folder holds one `SKILL.md` and nothing else, so none of them uses the `steps/` folder a domain plugin's larger skills need. What a reader should know before opening one is that **every rule a skill carries belongs to a chapter somewhere else**. A skill sequences work and states the vocabulary; the moment it invents a rule, it has become an undeclared second source.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The skill folders | `packages/plugin-spn-devex/src/skills/` | one folder per stack-agnostic stage skill |
| The file a session loads | `packages/plugin-spn-devex/src/skills/ideate/SKILL.md` | frontmatter with `name` and `description`, then the instructions |
| The vocabulary and the command surface | `packages/plugin-spn-devex/src/refs/devex/utils/spnutils.md` | the command groups and the stage skills, restated in one file from the book |
| What each stage is for | `packages/plugin-spn-devex/src/refs/devex/function/` | one restatement per function: `bootstrap` · `deliver` · `develop` · `ideate` · `operate` · `provision` · `scm` · `test` |
| The layer a realization supplies | `packages/plugin-spn-apps/src/providers/ts/skills/ideate/plan.md` | read by `ideate`, rather than copied into it |

## Follows the pattern

- The frontmatter, the matching and the steps a skill sequences — [Skills](../../../02-constructs/01-devex/04-skills.md)
- The folder a skill is delivered inside — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)
- How a concrete step is resolved rather than hardcoded — [Providers](../../../02-constructs/01-devex/07-providers.md)

## Special handling

### The description is matched, never browsed

**Why** — *the listing is what a session holds in full*, one line per skill, and the body is read only once a description matches. A description written as a catalogue entry never fires.
**What** — each description states the class of ask the skill answers and gives the phrasing that should trigger it, including the words a developer actually types.
**How** — the frontmatter carries `name` and `description` and nothing else. Read any `SKILL.md` under `packages/plugin-spn-devex/src/skills/`, the first three lines.

### The stage stays here, and the realization supplies its layer

**Why** — *the skill is stack-agnostic*. Copying it into each domain plugin would put the same rule in two places, drifting, with nothing comparing them.
**What** — `ideate` lives once, in this plugin, and reads the realization's own layer file at the point it needs a concrete step. The domain plugin ships that file and no stage skill of its own.
**How** — `packages/plugin-spn-devex/src/skills/ideate/SKILL.md` names the file; `packages/plugin-spn-apps/src/providers/ts/skills/ideate/plan.md` is the layer for the `APPS` and TypeScript combination, and the gate resolves the stack from the node's own `sprepo.json` rather than typing it.

### Two skills are interactive by design

**Why** — *some answers cannot be derived from the ground*. What a node IS, and what an organization's estate should be, are decisions rather than readings.
**What** — `ideate` works one agreed block at a time and never drafts a whole concept in one pass. `bootstrap` asks the estate questions first and runs no act on an answer nobody gave.
**How** — both name the file the agreed answer lands in: `CONCEPT.md` at a repository root for `ideate`, and the two minted repositories for `bootstrap`. `packages/plugin-spn-devex/src/skills/ideate/SKILL.md` and `packages/plugin-spn-devex/src/skills/bootstrap/SKILL.md`.

### One skill is never run unasked

**Why** — *a report is an artifact somebody has to read and maintain*, and a report nobody asked for is work created rather than work done.
**What** — `report` produces a report or an approach document into a node's artifacts pocket only on request, and says so in its own description.
**How** — the templates it fills are the book's, and the commands each one reads from come from the domain plugin. `packages/plugin-spn-devex/src/skills/report/SKILL.md`.

### Every skill opens by pointing at the loop, never repeating it

**Why** — *`spn-engineer.md` is an agent brief, and nothing loads an agent brief at session start*, so a loop rule written only there reached a session by accident, whenever that persona happened to be convened.
**What** — how a session opens on the welcome and one status line, how it reads and routes each prompt, where a new ask goes, what a prompt does to a running arc, the front desk that dispatches batches to subagents, and the three shapes a reply closes in, all sit in one ref now, and every stage skill's opening paragraph points at it before doing anything else. `spn-engineer.md` keeps the persona and cites the same file rather than restating the loop.
**How** — one entry line, worded alike, opens every `SKILL.md` under this folder and under `packages/plugin-spn-apps/src/skills/` and `packages/plugin-spn-infra/src/skills/`. `packages/plugin-spn-devex/src/skills/develop/SKILL.md:27`, citing `refs/devex/workspace/workstream.md`.

### `develop` runs documents, then source, then tests, then run

**Why** — *going part by part with no fixed order leaves you, at every moment, with code nobody has described and tests for half a shape* — the foundation's `01-function/04-develop.md` § Model states the rule this skill sequences.
**What** — a part of a change runs all four stages before the next part starts: the doc seat first, so the code is written against a page rather than a page written to match the code; then the contract, the regeneration and the implementation; then the tests, at the tier that proves the change; then the checks and suites against that part's own acceptance.
**How** — `packages/plugin-spn-devex/src/skills/develop/SKILL.md` § The loop.

### `test` reports coverage and enforces none

**Why** — *a percentage used as a gate gets met the cheapest way* — by lowering the number, or by writing cases that run code without checking what it does (`RD.SUPPORT.APPS.133`).
**What** — the skill states coverage as measured and reported, never enforced: no configuration carries a threshold, an exclude carries its reason beside it, and a journey configuration collects none. It also carries the per-tier id rule — which cases must carry the id of the row they prove, and which may instead name a fixture or a private rule — and the full-run rule: a whole-repository run fixes a row proven at the wrong tier, a runner that wrote no result, a case with no id, or a red case, before the report is written.
**How** — `packages/plugin-spn-devex/src/skills/test/SKILL.md` § Code coverage is reported, never enforced · § Which case carries an id.

### A skill names the command group, never the command

**Why** — *the command belongs to the stack that realizes it*. A stack-agnostic skill naming a concrete command would be wrong in every repository that runs a different one.
**What** — `deliver`, `develop`, `provision`, `operate`, `scm` and `test` each name the group they drive — `apps`, `infra`, `repo` — and hand the domain plugin the job of realizing it. The rest drive no command group at all.
**How** — the group for each skill is stated once, in `packages/plugin-spn-devex/src/refs/devex/utils/spnutils.md`.

### Every skill carries a stamp, because prose drifts silently

**Why** — *a skill with no stamped block is invisible to the drift run*, so a chapter could move and every skill restating it would keep reading as though nothing had happened.
**What** — each `SKILL.md` opens with a `spn:restates` block naming the chapters it restates and the hash it last read there.
**How** — the block is read by the same parser a ref's is, so a stale skill and a stale ref are one finding rather than two. `packages/plugin-spn-devex/src/scripts/commands/restates/check.ts`, run as `spn-devex restates check`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-apps | the `APPS` and TypeScript layer files a stage skill loads | a stack-agnostic skill still reaches a stack-concrete step |
| takes | spn-foundation | the chapters each skill restates, stamped in its own block | a skill carries a rule and never owns one |
| publishes | every session | one skill per stage and its description, matched against the work at hand | the loop is entered by naming what you are doing |
