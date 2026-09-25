<!-- spn:doc
{"id": "spn-apps-capabilities-stack-refs", "variant": "capability", "title": "Stack Refs in spn-apps", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["stack-refs"], "summary": "One file: the planning layer for an APPS and TypeScript node, written as reference material a stack-agnostic skill loads rather than as a skill of its own.", "keywords": ["ref", "plan", "layer", "restates", "mode", "stack"]}
-->

# Stack Refs in spn-apps

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Stack Refs`

This plugin restates exactly one thing on its own: the planning layer for a node whose world is `APPS` and whose stack is TypeScript. Everything else a ref could carry — the command vocabulary, the contract rules, the cross-repo protocol, the card grammar — is `spn-devex`'s, restated once and read by every stack's plugin. The one decision worth knowing before you open the file is that **it is reference material and not a skill**. It has no frontmatter, it matches no ask, and nothing loads it except the stack-agnostic `ideate` skill once that skill has resolved which stack it is standing in.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The planning layer | `plugins/spn-apps/src/refs/providers/ts/plan.md` | the three modes, the rows a design lands as, and the seats that hold them |
| Its stamp | the `spn:restates` block at the top of that file | the docs domain and two apps provider chapters, each with the hash last seen |
| The skill that loads it | `plugins/spn-devex/src/skills/ideate/SKILL.md` | resolves the world and stack claim, then reads this file |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [The Ref](../../../02-constructs/01-spn-devex/08-ref-set.md)
- How a ref is stamped, parsed and compared — [Ref in spn-devex](../../01-spn-devex/spn-devex/08-ref-set.md)

## Special handling

### The skill has no stack variant, so the layer is a ref

**Why** — *the book's skill vocabulary is closed and carries no planning skill for the apps world*. Shipping one here would add a value the standard does not have, and two skills would then compete for the same ask.
**What** — the planning skill stays in `spn-devex`. This file supplies what only a stack-concrete file can state: which seats a design's rows land in, and what each row must carry.
**How** — the file states its own status in its first line, so a reader who opens it directly is told it is not a skill. `plugins/spn-apps/src/refs/providers/ts/plan.md`.

### A design lands as rows in the owning documents

**Why** — *planning is written into the documents that will later be flipped to done*. A scratch file or a task tree becomes a second plan, and implementation then reconciles documents instead of changing statuses.
**What** — the file names the seats a row belongs in — the behaviour face for what a person can do, the capability mirror and its dictionary for the contract delta — and marks every one of them as planned.
**How** — the purpose and guide seats are named too, with the narrow conditions under which either moves. Same file, the design mode.

### The mode is chosen, and the choice is said out loud

**Why** — *a reader who cannot tell which mode ran cannot tell whether the output is complete*.
**What** — three modes exist: writing a design, auditing a repository's docs tree, and recording a decision. Where no mode was given, the file requires the inferred one to be named.
**How** — the modes are taken from the skill's own argument. Same file, the opening lines.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the docs domain chapter and the apps provider chapters it restates, each stamped | the book governs and this file is the copy |
| takes | spn-devex | the corpus standard its row shapes point at, rather than restating it again | one description of a docs tree, cited from everywhere |
| publishes | spn-devex's plan skill | the concrete layer for the `APPS` and TypeScript combination | a stack-agnostic skill still reaches a stack-concrete step |
