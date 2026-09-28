<!-- spn:doc
{"id": "spn-apps-capabilities-skills", "variant": "capability", "title": "Skills in spn-apps", "lenses": ["SERVER_DEV", "WEB_DEV"], "status": "DONE", "realizes": ["stack-skills"], "summary": "The skills an apps repository answers to — one folder each, one stage each, the build loop that classifies before it sequences and reads its steps from the provider for the declared stack, and the deliberate absence where deciding what a node is would be.", "keywords": ["skill", "implement", "steps", "mode", "stage", "stamp"]}
-->

# Skills in spn-apps

`For: Backend developer · Web developer` · `Status: ✅ DONE` · `Realizes: Skills`

Each folder under this plugin's `skills/` is named for a command of the `apps` group, and each declares the one stage it serves. The absence is as deliberate as anything present. **Deciding what a node is happens through a skill this plugin does not ship**: that skill answers to no stack, it lives once in the core plugin, and what this plugin supplies is the part of the walk only a language can answer — filed under the provider rather than here.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| Scaffolding | `packages/plugin-spn-apps/src/skills/new/SKILL.md` | a workspace root, a project of a supported kind, or an app-owned module |
| The build loop | `packages/plugin-spn-apps/src/skills/implement/SKILL.md` | classifies the requirement, then sequences the steps in contract-first order |
| Review | `packages/plugin-spn-apps/src/skills/review/SKILL.md` | two modes: the code standards, and the contract gate |
| Running | `packages/plugin-spn-apps/src/skills/run/SKILL.md` | start the stack locally, or run its suites |
| Proving | `packages/plugin-spn-apps/src/skills/verify/SKILL.md` | three modes: package, app, and a destructive reset |
| Publishing | `packages/plugin-spn-apps/src/skills/release/SKILL.md` | the repository's releasable projects, in lockstep, scoped to the repository and never one package |
| The steps it names | `packages/plugin-spn-apps/src/providers/ts/skills/implement/steps/` | one file per layer, held by the provider for the declared stack |
| What each one restates | the `spn:restates` block at the top of each `SKILL.md` | the skills chapter, and the chapter of the one stage that skill serves |
| The absent planning skill's material | `packages/plugin-spn-apps/src/providers/ts/skills/ideate/plan.md` | the part of the core `ideate` walk only this stack can answer, held by the provider rather than under `skills/` |

## Follows the pattern

- The frontmatter, the matching against a listing, and the steps a skill sequences — [The Skill](../../../02-constructs/01-devex/04-skills.md)
- The stack-agnostic skills these realize — [Skill in spn-devex](../../01-devex/plugin-spn-devex/04-skills.md)

## Special handling

### One skill sequences steps, and the order is the rule

**Why** — *the contract comes first, and everything downstream is generated from it or written against it*. A service written before its state is a service that will be rewritten.
**What** — `implement` is the only skill here that sequences steps. The order is fixed, and each step is read before that layer's code is written rather than after.
**How** — the skill first classifies the requirement as back end only, front end only, or full stack, and that classification decides which steps apply. `packages/plugin-spn-apps/src/skills/implement/SKILL.md`.

### The skill names the step and never the stack

**Why** — *a step file is written in a language*, so a skill that linked to one would have decided which stack it serves.
**What** — the skill states the step names, their order and what each settles, and composes the path `providers/{stack}/skills/implement/steps/{step}.md` from the nearest manifest.
**How** — the steps are a table rather than a list of links, and a step the declared stack does not ship is a step that stack does not walk. `packages/plugin-spn-apps/src/skills/implement/SKILL.md`.

### A mode is an argument, not a second skill

**Why** — *two skills with almost the same description compete for the same match*, and the matching gets worse as the pair grows.
**What** — `review` takes `code` or `contract`. `verify` takes `package`, `app` or `reset`. `run` takes `local` or `tests`. One folder each.
**How** — each description names its modes and says which asks belong to a neighbouring skill instead, so a claim about what the code does goes to the core plugin's `check` rather than to `verify`. `packages/plugin-spn-apps/src/skills/verify/SKILL.md`.

### A destructive mode says so in the description

**Why** — *a reset rebuilds from a clean state and throws away what was there*. Discovering that after the fact is the expensive way to learn it.
**What** — `verify` marks its reset mode as destructive in the sentence a session matches against, not only in the body it loads afterwards.
**How** — the same discipline applies to `run`, whose description states that it starts and does not verify. `packages/plugin-spn-apps/src/skills/run/SKILL.md`.

### Every skill carries a stamp, because prose drifts silently

**Why** — *nothing compared a skill against the book*, so a ruling could reach the book, the register and the code and never reach the skill that routes on it. One skill routed to a skill that had been deleted for two weeks.
**What** — each `SKILL.md` opens with a block naming the chapters it restates and the hash last read from each: the skills chapter, plus the chapter of the one stage it serves.
**How** — a drift run then reads a skill exactly as it reads a ref. `packages/plugin-spn-apps/src/skills/implement/SKILL.md`.

### The closing gate belongs to the skill, not to the reviewer

**Why** — *a contract change reviewed at the end of a session is reviewed by the context that wrote it*.
**What** — `implement` closes with the suites and then hands the change to `review` in its contract mode, rather than leaving the gate to whoever remembers it.
**How** — the hand-off is named in the description, so the match happens even when the developer does not ask for it. `packages/plugin-spn-apps/src/skills/implement/SKILL.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex | the stack-agnostic skills, the command vocabulary and the contract review rules | a domain plugin realizes a skill and never redefines it |
| takes | spn-foundation | the skills chapter and the stage chapters each skill restates | the standard is stated once, in the book |
| takes | this plugin's own providers | the step files the build loop names and reads | a skill states the order; the provider holds the language |
| publishes | every repository declaring the apps world | skills a session matches against the work at hand | the paved road is loadable rather than remembered |
