<!-- spn:doc
{"id": "spn-devex-capabilities-skill-set", "variant": "capability", "title": "Skill in spn-devex", "lenses": ["ARCHITECT", "LEAD"], "status": "DONE", "realizes": ["skill-set"], "summary": "Eleven stack-agnostic skills, one folder and one SKILL.md each, whose descriptions are written to be matched against a turn's work rather than browsed by a person.", "keywords": ["skill", "command", "description", "stage", "stack-agnostic", "interactive"]}
-->

# Skill in spn-devex

`For: Architect · Engineering leader` · `Status: ✅ DONE` · `Realizes: Skill`

`spn-devex` ships eleven skills, one folder per stack-agnostic DevEx stage: `check`, `day-zero`, `deliver`, `develop`, `ideate`, `operate`, `plan`, `provision`, `report`, `scm` and `test`. Each folder holds one `SKILL.md` and nothing else, so none of them uses the `steps/` folder a stack's larger skills need. What a reader should know before opening one is that **every rule a skill carries belongs to a chapter somewhere else**. A skill sequences work and states the vocabulary; the moment it invents a rule, it has become an undeclared second source.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The eleven folders | `plugins/spn-devex/src/skills/<skill>/` | one per stack-agnostic stage skill |
| The file a session loads | `plugins/spn-devex/src/skills/<skill>/SKILL.md` | frontmatter with `name` and `description`, then the instructions |
| The vocabulary they name | `plugins/spn-devex/src/refs/devex/utils/spnutils.md` | the command groups and the stage skills, stack-agnostic |
| The layer a stack supplies | `plugins/spn-apps/src/refs/providers/ts/plan.md` | read by `plan`, rather than copied into it |

## Follows the pattern

- The frontmatter, the matching and the steps a skill sequences — [The Skill](../../../02-constructs/01-spn-devex/07-skill-set.md)
- The folder a skill is delivered inside — [The Plugin](../../../02-constructs/01-spn-devex/01-plugin-set.md)

## Special handling

### The description is matched, never browsed

**Why** — *the listing is what a session holds in full*, one line per skill, and the body is read only once a description matches. A description written as a catalogue entry never fires.
**What** — each description states the class of ask the skill answers and gives the phrasing that should trigger it, including the words a developer actually types.
**How** — the frontmatter carries `name` and `description` and nothing else. Read any `plugins/spn-devex/src/skills/<skill>/SKILL.md`, the first three lines.

### Planning stays here, and the stack supplies its layer

**Why** — *the skill is stack-agnostic*. Copying it into each stack's plugin would put the same rule in two places, drifting, with nothing comparing them.
**What** — `plan` lives once, in this plugin, and reads the stack's own layer file at the point it needs a concrete step. The stack's plugin ships that file and no planning skill of its own.
**How** — `plugins/spn-devex/src/skills/ideate/SKILL.md` names the ref; `plugins/spn-apps/src/refs/providers/ts/plan.md` is the layer for the `APPS` and TypeScript combination.

### Two skills are interactive by design

**Why** — *some answers cannot be derived from the ground*. What a node IS, and what an organization's estate should be, are decisions rather than readings.
**What** — `ideate` works one agreed block at a time and never drafts a whole concept in one pass. `day-zero` asks the estate questions first and runs no act on an answer nobody gave.
**How** — both name the file the agreed answer lands in: `CONCEPT.md` at a repository root for `ideate`, and the two minted repositories for `day-zero`. `plugins/spn-devex/src/skills/ideate/SKILL.md` and `skills/day-zero/SKILL.md`.

### One skill is never run unasked

**Why** — *a report is an artifact somebody has to read and maintain*, and a report nobody asked for is work created rather than work done.
**What** — `report` produces a report or an approach document into a node's artifacts pocket only on request, and says so in its own description.
**How** — the templates it fills are the book's, and the commands each one reads from come from the stack's plugin. `plugins/spn-devex/src/skills/report/SKILL.md`.

### A skill names the command group, never the command

**Why** — *the command belongs to the stack that realizes it*. A stack-agnostic skill naming a concrete command would be wrong in every repository that runs a different one.
**What** — `deliver`, `develop`, `provision`, `operate`, `scm` and `test` each name the group they drive — `apps`, `infra`, `repo` — and hand the stack's plugin the job of realizing it. Four of the eleven drive no command group at all.
**How** — the group for each skill is stated once, in `plugins/spn-devex/src/refs/devex/utils/spnutils.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-apps | the `APPS` and TypeScript planning layer, loaded by `plan` | a stack-agnostic skill still reaches a stack-concrete step |
| takes | spn-foundation | the chapters each skill restates, stamped in its own block | a skill carries a rule and never owns one |
| publishes | every session | eleven skills and their descriptions, matched against the work at hand | the loop is entered by naming what you are doing |
