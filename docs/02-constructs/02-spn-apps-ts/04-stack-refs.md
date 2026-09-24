<!-- spn:doc
{
  "id": "stack-refs",
  "variant": "construct",
  "title": "Stack Refs — The Layer a Stack-Agnostic Skill Loads",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["ref-set"],
  "summary": "Reference material a stack ships for a skill it does not own — how a stack-agnostic skill reaches a concrete step without being copied, why the file has no trigger of its own, and where the rows a design produces are written.",
  "keywords": ["ref", "layer", "plan", "stack", "mode", "rows"]
}
-->

# Stack Refs — The Layer a Stack-Agnostic Skill Loads

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Some skills are the same in every world and still need an answer only one world can give. Planning is one: the act is identical everywhere, and the seats a design's rows land in are not. A stack ref is how the second half is supplied without splitting the first: reference material the stack ships, read by a skill the stack does not own.

The thing to know before opening one is that **it is reference material and not a skill**. It has no frontmatter, it matches no ask, and nothing loads it except the skill that already resolved which stack it is standing in.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a stack ref | `refs/` | a markdown file a stack's plugin ships for a skill living in another plugin |
| the layer | — | the part of a walk that cannot be stack-agnostic: which seats a row lands in, and what each row must carry |
| the claim | `sprepo.json` | what a repository declares about its own world and stack, which is what selects the layer |
| the stamp | `spn:restates` | the block at the top, naming the chapters this file restates and the hash last read from each |
| a planned row | — | what a design lands as: a row in the seat that will later be flipped, rather than an entry in a scratch file |

## Model

The skill is one. The layer is chosen from the repository's own claim, and what it names is where the design is written down.

```dg
{ "kind": "map",
  "caption": "The claim selects the layer, so the layer file needs no trigger of its own to be reached.",
  "boxes": [
    { "id": "a", "label": "the planning skill", "note": "stack-agnostic, and shipped once by the core plugin" },
    { "id": "b", "label": "the claim", "note": "the world and the stack the repository declares for itself" },
    { "id": "c", "label": "the layer file", "note": "reference material with no frontmatter and no trigger" },
    { "id": "d", "label": "rows in the seats", "note": "where a design lands, marked planned" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "resolves" },
    { "from": "b", "to": "c", "label": "selects" },
    { "from": "c", "to": "d", "label": "names" }
  ] }
```

## Parts

### The skill has no stack variant, so the layer is a ref

The book's skill set is closed and carries no planning skill for this world. Shipping one here would add a value the standard does not have, and two skills with almost the same description would then compete for the same ask. So the skill stays in one plugin, and this file supplies the layer instead — the part of the plan that only this stack can answer. *Where:* `plugins/spn-apps-ts/refs/plan.md`

### It says in its first line that it is not a skill

A reader who opens the file directly, or an agent that finds it while searching, has to be told immediately what it is. So the file states its own standing at the top, before anything it describes. *Where:* the first lines of `plugins/spn-apps-ts/refs/plan.md`

### A design lands as rows in the documents that already exist

Planning is written into the documents that will later be flipped to done. A scratch file or a task tree becomes a second plan, and the build then reconciles documents instead of changing statuses. So the file names the seats a row belongs in — what a person can do, and what the contract gains — and marks every one of them as planned. *Where:* `plugins/spn-apps-ts/refs/plan.md`

### The mode is chosen, and the choice is said out loud

A reader who cannot tell which walk ran cannot tell whether the output is complete. The file describes more than one walk, takes the choice from the mode argument [the skill](03-stack-skills.md) declares, and requires the inferred one to be named where nobody gave it. *Where:* `plugins/spn-apps-ts/refs/plan.md`

### It is stamped like any other restatement

The file carries the same block a core ref carries, naming each chapter it restates and the hash last read there, so a drift run reads it exactly as it reads the rest. *Where:* the `spn:restates` block at the top of `plugins/spn-apps-ts/refs/plan.md`

## Boundary

This page answers why a stack ships reference material for a skill it does not own, and what such a file may contain. It does not answer how a restatement is stamped, parsed or compared — that is [The Ref](../01-spn-core/08-ref-set.md). It does not answer what the planning walk itself is either: the walk belongs to the skill, and this file supplies only the part the skill could not know.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| that a skill with no stack variant reads a layer rather than being copied, and that the layer carries no trigger | the block, the stamp, the hash and the drift comparison | [The Ref](../01-spn-core/08-ref-set.md) |
| which seats a design's rows land in for this stack, and what each row carries | the planning walk itself, and the vocabulary it is written in | [The Skill](../01-spn-core/07-skill-set.md) |
| that reference material is not a skill | the skills this stack does own | [Stack Skills](03-stack-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Skills construct | the skill set is closed, so a stack adds a layer rather than a skill | MUST |
| `RD.DOCS.055` | this file is a restatement, carrying its sources and adding no rule | MUST |
| `RD.DEVEX.019` | a stack plugin supplies the layer and never the vocabulary | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-apps-ts` | the planning layer for a node whose world is the apps world and whose stack is TypeScript | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/restate-drift.ts` | gate | the layer file's stamp still matches the chapters it names, so the copy has not fallen behind the book |

Try it: `node plugins/spn-core/hooks/tools/restate-drift.ts`
