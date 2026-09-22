<!-- spn:doc
{"id": "spn-infra-capabilities-estate-skills", "variant": "capability", "title": "Estate Skills in spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "realizes": ["estate-skills"], "summary": "Four skills for an estate repository — declaring what the estate is, reading a plan before it is approved, authoring a module end to end, and publishing a package — none of which mutates a cloud itself.", "keywords": ["skill", "declare", "plan-review", "module-author", "release", "estate"]}
-->

# Estate Skills in spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE` · `Realizes: Estate Skills`

Four folders sit under `plugins/spn-infra/skills/`: `declare`, `plan-review`, `module-author` and `release`. Each holds one `SKILL.md` and none divides into steps. They realize the `infra` command group's layer model for an estate repository, and they share one boundary that is stated in each of them. **No skill here mutates a cloud.** Each names the command that does, and the estate caution — cloud mutation passes only through the tool's own doors — is restated rather than worked around.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| What the estate is | `plugins/spn-infra/skills/declare/SKILL.md` | an environment, a grant row, a module row, a region, a schema, a size, a hosting, a trigger |
| Reading a plan | `plugins/spn-infra/skills/plan-review/SKILL.md` | what a plan must name and what it must never contain, before any approval |
| Authoring a module | `plugins/spn-infra/skills/module-author/SKILL.md` | scaffold, renderings, the path locator, proving, releasing, the pin flip |
| Publishing | `plugins/spn-infra/skills/release/SKILL.md` | the version edit, the release command, the registry pair or the machine store |
| The vocabulary they use | `plugins/spn-infra/refs/*.md` | manifests, layers and doors, naming, and the laws |

## Follows the pattern

- The frontmatter, the matching and the description that is matched — [The Skill](../../../02-constructs/01-spn-core/07-skill-set.md)
- The stack-agnostic skills these four realize — [Skill in spn-core](../../01-spn-core/spn-core/07-skill-set.md)

## Special handling

### Declaring is a manifest edit, reviewed line by line

**Why** — *a change to what the estate is should read as one line per choice*. A diff that mixes rendered output with declared intent hides the decision inside the consequence.
**What** — `declare` changes the manifest, validates it, and shows the diff in that shape. Authoring a new module package and publishing one are explicitly not this skill.
**How** — the description names both neighbours so the wrong ask lands in the right skill. `plugins/spn-infra/skills/declare/SKILL.md`.

### A plan is read before anything is approved

**Why** — *approval is the last moment a wrong rendering is cheap*. After it, the estate has changed and the question becomes a repair.
**What** — `plan-review` states what a plan output must name and what it must never contain, and it also answers the narrower question of whether a declaration change rendered exactly what was intended and nothing more.
**How** — it is convened before any approval flag is passed, never after. `plugins/spn-infra/skills/plan-review/SKILL.md`.

### Authoring a module names what is not a module

**Why** — *a vendor reached over the network is application configuration behind a support seam*, and the estate never sees it. Treating one as a module builds infrastructure for something that does not exist.
**What** — `module-author` covers a lifecycle plug-in the platform actually runs — a vendor you host, a warehouse, a search engine — and its description rules out the networked vendor case in the sentence a session matches against.
**How** — it walks the whole path in one skill, from scaffold to the pin flip that points a consumer at the published version. `plugins/spn-infra/skills/module-author/SKILL.md`.

### The version is a reviewed edit, and the release command does the rest

**Why** — *a version somebody typed into a build script is a second place the number lives*. The package manifest is the one place.
**What** — `release` bumps the version field in the package manifest as a reviewed edit, then runs the release command. Publishing goes to the organization's registry pair, or stages into the machine store when asked to stay local.
**How** — the skill also covers repointing a bespoke build script or workflow at the release command, so the second place stops existing. `plugins/spn-infra/skills/release/SKILL.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-infra's refs | the manifest and locator card, the layer and door card, the naming grammar and the laws | a skill sequences the work and the card holds the vocabulary |
| takes | spn-core | the stack-agnostic skills, the command vocabulary and the cross-repo protocol | a stack plugin realizes a skill and never redefines it |
| publishes | every estate repository | four skills a session matches against the work at hand | the estate is changed by a named path rather than by hand |
