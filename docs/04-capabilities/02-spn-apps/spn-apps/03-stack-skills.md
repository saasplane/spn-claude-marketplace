<!-- spn:doc
{"id": "spn-apps-capabilities-stack-skills", "variant": "capability", "title": "Stack Skills in spn-apps", "lenses": ["SERVER_DEV", "WEB_DEV"], "status": "DONE", "realizes": ["stack-skills"], "summary": "Five skills for a TypeScript repository, one of them large enough to divide into seven ordered step files, and a deliberate absence where planning would be.", "keywords": ["skill", "implement", "steps", "contract-first", "verify", "review"]}
-->

# Stack Skills in spn-apps

`For: Backend developer · Web developer` · `Status: ✅ DONE` · `Realizes: Stack Skills`

Five folders sit under `plugins/spn-apps/src/skills/`: `new`, `implement`, `review`, `run` and `verify`. Each is named for a command of the `apps` group, made concrete for a SaaS Plane TypeScript repository. The absence is as deliberate as the five. **Planning is not here.** The skill is stack-agnostic and lives once in `spn-devex`; this plugin supplies only the layer that skill reads for the `APPS` and TypeScript combination.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| Scaffolding | `plugins/spn-apps/src/skills/new/SKILL.md` | a workspace root, a project of a supported kind, or an app-owned module |
| The build loop | `plugins/spn-apps/src/skills/implement/SKILL.md` | classifies the requirement, then sequences the steps |
| The ordered steps | `plugins/spn-apps/src/skills/implement/steps/*.md` | `contract` · `service` · `entry` · `queue` · `ui` · `test` · `docs` |
| Review | `plugins/spn-apps/src/skills/review/SKILL.md` | two modes: the code standards, and the contract gate |
| Running | `plugins/spn-apps/src/skills/run/SKILL.md` | start the stack locally, or run its suites |
| Proving | `plugins/spn-apps/src/skills/verify/SKILL.md` | three modes: package, app, and a destructive reset |

## Follows the pattern

- The frontmatter, the matching and the steps a skill sequences — [The Skill](../../../02-constructs/01-spn-devex/07-skill-set.md)
- The stack-agnostic skills these five realize — [Skill in spn-devex](../../01-spn-devex/spn-devex/07-skill-set.md)

## Special handling

### One skill divides into steps, and the order is the rule

**Why** — *the contract comes first, and everything downstream is generated from it or written against it*. A service written before its state is a service that will be rewritten.
**What** — `implement` is the only skill here with a `steps/` folder. Seven files run in a fixed order, and each is read before that layer's code is written rather than after.
**How** — the skill first classifies the requirement as back end only, front end only, or full stack, and that classification decides which steps apply. `plugins/spn-apps/src/skills/implement/SKILL.md`.

### A mode is an argument, not a second skill

**Why** — *two skills with almost the same description compete for the same match*, and the matching gets worse as the pair grows.
**What** — `review` takes `code` or `contract`. `verify` takes `package`, `app` or `reset`. `run` takes `local` or `tests`. One folder each.
**How** — each description names its modes and says which asks belong to a neighbouring skill instead, so a claim about what the code does goes to `check` rather than to `verify`. Read the frontmatter of `verify/SKILL.md`.

### A destructive mode says so in the description

**Why** — *a reset rebuilds from a clean state and throws away what was there*. Discovering that after the fact is the expensive way to learn it.
**What** — `verify` marks its reset mode as destructive in the sentence a session matches against, not only in the body it loads afterwards.
**How** — the same discipline applies to `run`, which states that it starts and does not verify. `plugins/spn-apps/src/skills/verify/SKILL.md`.

### A step carries rules it does not own

**Why** — *a step file is where the next developer copies from*, so a rule missing there is a rule that will not be followed. A rule invented there is a second source.
**What** — two of the seven steps carry a stamped block naming the chapters they restate, and the rest cite their sources in the text.
**How** — the stamp is the same block a ref carries, so a drift run reads a skill step exactly as it reads a ref. `steps/contract.md` and `steps/service.md`.

### The closing gate belongs to the skill, not to the reviewer

**Why** — *a contract change reviewed at the end of a session is reviewed by the context that wrote it*.
**What** — `implement` closes with tests and then hands the change to `review` in its contract mode, rather than leaving the gate to whoever remembers it.
**How** — the hand-off is named in the description, so the match happens even when the developer does not ask for it. `plugins/spn-apps/src/skills/implement/SKILL.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex | the stack-agnostic skills, the command vocabulary and the contract review rules | a domain plugin realizes a skill and never redefines it |
| takes | spn-foundation | the TypeScript provider chapters each step restates | the golden path is stated once, in the book |
| publishes | spn-devex's plan skill | the `APPS` and TypeScript layer, through this plugin's own ref | planning stays one skill with a concrete step |
| publishes | every TypeScript stack repository | five skills a session matches against the work at hand | the paved road is loadable rather than remembered |
