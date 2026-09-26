<!-- spn:doc
{"id": "spn-devex-capabilities-skill-set", "variant": "capability", "title": "Skills in spn-devex", "lenses": ["ARCHITECT", "LEAD"], "status": "DONE", "realizes": ["skill-set"], "summary": "One folder per stack-agnostic DevEx stage, each holding a single SKILL.md whose description is written to be matched against a turn's work rather than browsed by a person.", "keywords": ["skill", "command", "description", "stage", "stack-agnostic", "interactive"]}
-->

# Skills in spn-devex

`For: Architect · Engineering leader` · `Status: ✅ DONE` · `Realizes: Skills`

`spn-devex` ships one folder per stack-agnostic DevEx stage: `bootstrap`, `check`, `deliver`, `develop`, `ideate`, `operate`, `provision`, `report`, `scm` and `test`. Each folder holds one `SKILL.md` and nothing else, so none of them uses the `steps/` folder a domain plugin's larger skills need. What a reader should know before opening one is that **every rule a skill carries belongs to a chapter somewhere else**. A skill sequences work and states the vocabulary; the moment it invents a rule, it has become an undeclared second source.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The skill folders | `plugins/spn-devex/src/skills/` | one folder per stack-agnostic stage skill |
| The file a session loads | `plugins/spn-devex/src/skills/ideate/SKILL.md` | frontmatter with `name` and `description`, then the instructions |
| The vocabulary they name | `plugins/spn-devex/src/refs/devex/utils/spnutils/README.md` | the command groups and the stage skills, stack-agnostic |
| The command surface itself | `plugins/spn-devex/src/refs/devex/utils/spnutils/commands.md` | rendered from the CLI's own help, so an agent holds it without asking |
| What each stage is for | `plugins/spn-devex/src/refs/devex/function/` | one restatement per function: `bootstrap` · `deliver` · `develop` · `ideate` · `operate` · `provision` · `scm` · `test` |
| The layer a realization supplies | `plugins/spn-apps/src/providers/ts/skills/ideate/plan.md` | read by `ideate`, rather than copied into it |

## Follows the pattern

- The frontmatter, the matching and the steps a skill sequences — [Skills](../../../02-constructs/01-devex/04-skills.md)
- The folder a skill is delivered inside — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)
- How a concrete step is resolved rather than hardcoded — [Providers](../../../02-constructs/01-devex/07-providers.md)

## Special handling

### The description is matched, never browsed

**Why** — *the listing is what a session holds in full*, one line per skill, and the body is read only once a description matches. A description written as a catalogue entry never fires.
**What** — each description states the class of ask the skill answers and gives the phrasing that should trigger it, including the words a developer actually types.
**How** — the frontmatter carries `name` and `description` and nothing else. Read any `SKILL.md` under `plugins/spn-devex/src/skills/`, the first three lines.

### The stage stays here, and the realization supplies its layer

**Why** — *the skill is stack-agnostic*. Copying it into each domain plugin would put the same rule in two places, drifting, with nothing comparing them.
**What** — `ideate` lives once, in this plugin, and reads the realization's own layer file at the point it needs a concrete step. The domain plugin ships that file and no stage skill of its own.
**How** — `plugins/spn-devex/src/skills/ideate/SKILL.md` names the file; `plugins/spn-apps/src/providers/ts/skills/ideate/plan.md` is the layer for the `APPS` and TypeScript combination, and the gate resolves the stack from the node's own `sprepo.json` rather than typing it.

### Two skills are interactive by design

**Why** — *some answers cannot be derived from the ground*. What a node IS, and what an organization's estate should be, are decisions rather than readings.
**What** — `ideate` works one agreed block at a time and never drafts a whole concept in one pass. `bootstrap` asks the estate questions first and runs no act on an answer nobody gave.
**How** — both name the file the agreed answer lands in: `CONCEPT.md` at a repository root for `ideate`, and the two minted repositories for `bootstrap`. `plugins/spn-devex/src/skills/ideate/SKILL.md` and `plugins/spn-devex/src/skills/bootstrap/SKILL.md`.

### One skill is never run unasked

**Why** — *a report is an artifact somebody has to read and maintain*, and a report nobody asked for is work created rather than work done.
**What** — `report` produces a report or an approach document into a node's artifacts pocket only on request, and says so in its own description.
**How** — the templates it fills are the book's, and the commands each one reads from come from the domain plugin. `plugins/spn-devex/src/skills/report/SKILL.md`.

### A skill names the command group, never the command

**Why** — *the command belongs to the stack that realizes it*. A stack-agnostic skill naming a concrete command would be wrong in every repository that runs a different one.
**What** — `deliver`, `develop`, `provision`, `operate`, `scm` and `test` each name the group they drive — `apps`, `infra`, `repo` — and hand the domain plugin the job of realizing it. The rest drive no command group at all.
**How** — the group for each skill is stated once, in `plugins/spn-devex/src/refs/devex/utils/spnutils/README.md`.

### Every skill carries a stamp, because prose drifts silently

**Why** — *a skill with no stamped block is invisible to the drift run*, so a chapter could move and every skill restating it would keep reading as though nothing had happened.
**What** — each `SKILL.md` opens with a `spn:restates` block naming the chapters it restates and the hash it last read there.
**How** — the block is read by the same parser a ref's is, so a stale skill and a stale ref are one finding rather than two. `plugins/spn-devex/src/scripts/tools/restate-drift.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-apps | the `APPS` and TypeScript layer files a stage skill loads | a stack-agnostic skill still reaches a stack-concrete step |
| takes | spn-foundation | the chapters each skill restates, stamped in its own block | a skill carries a rule and never owns one |
| publishes | every session | one skill per stage and its description, matched against the work at hand | the loop is entered by naming what you are doing |
