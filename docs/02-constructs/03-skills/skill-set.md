<!-- spn:doc
{
  "id": "skill-set",
  "variant": "construct",
  "parentId": "concept",
  "title": "The Skill — A Verb's Steps, Loaded on Match",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "What a skill is — a name and a description a session matches against the work at hand, and the steps it loads once matched — and why a skill never becomes a second place a rule lives.",
  "keywords": ["skill", "SKILL.md", "description", "trigger", "steps", "verb"]
}
-->

# The Skill — A Verb's Steps, Loaded on Match

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

Loading every rule this repository knows into every turn would drown the turn that needed one of them. A skill is how this repository loads instead of dumping: a name, a sentence that says when it applies, and the steps for doing that one thing — read only once a session's work actually matches the sentence. This construct names that shape.

## Terms — the words this construct needs

| Term | Contract term | What it means here |
| --- | --- | --- |
| a skill | `SkillFrontmatter` | one folder under a plugin's `skills/`, named for its verb, holding `SKILL.md` and anything that file sequences |
| the trigger | `SkillDescription` | the `description` field in `SKILL.md`'s frontmatter — matched against the work at hand to decide whether to load the file |
| a step | `SkillStep` | a file under a skill's own `steps/`, named for one part of its walk, read only when the skill sequences it |

## Boundary — what it owns, and what it refuses

If the question is *when does an agent reach for this, and what does it do once it has*, it belongs here. If the question is *what must be true for the thing the skill builds*, that is a rule, and the skill only carries it — it never becomes the second place that rule lives.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the frontmatter shape a skill declares, and the folder a multi-step skill sequences | stating a rule nowhere else states — a skill that invents one has become an undeclared second source | `the foundation's 04-devex/10-delivery.md` |
| matching one description against one turn's work to decide whether to load | naming a stack's own build commands — those belong to the stack's own plugin, not to this domain | [The Plugin](../01-plugins/plugin-set.md) |

## Model — the shape, in one picture

A turn's work is read once, matched against every loaded skill's own sentence, and at most the matching ones load.
```dg
{ "kind": "map",
  "boxes": [
    { "id": "ask", "label": "the work at hand", "note": "what the turn is trying to do" },
    { "id": "listing", "label": "the skill listing", "note": "every installed skill's name and description, one line each" },
    { "id": "skill", "label": "SKILL.md", "note": "loaded only once matched" },
    { "id": "steps", "label": "steps/", "note": "further files SKILL.md sequences, for a skill big enough to need them" }
  ],
  "links": [
    { "from": "ask", "to": "listing", "label": "matched against" },
    { "from": "listing", "to": "skill", "label": "loads on a match" },
    { "from": "skill", "to": "steps", "label": "reads in the order it names" }
  ] }
```
The listing is cheap to hold in full because it is one line per skill; `SKILL.md` and its steps are read only for the one skill that matched, which is what keeps a large skill from costing anything on a turn that never needed it.

## Parts — each piece, named once

### `SKILL.md`
A YAML frontmatter block naming `name` and `description`, then a body of Markdown instructions. The description is written for matching, not for a human browsing a list: it states the class of ask this skill answers and gives worked examples of the phrasing that should trigger it, because the match is made against those words. *Where:* `plugins/*/skills/<name>/SKILL.md`

### A multi-step skill
A skill whose walk is long enough to outgrow one file keeps `SKILL.md` as the router — it classifies the ask and names which files to read in which order — and puts each part of the walk in its own file under `steps/`. `SKILL.md` is read on every match; a step file is read only once the router names it. *Where:* `plugins/*/skills/<name>/steps/`

### Loaded, not run
A skill is prose an agent reads and then follows, never a script the runtime executes on your behalf. It is a document that happens to be selected the way code is dispatched — by a match at the top rather than by a person opening the right file by hand. *Where:* the same folder as the frontmatter it belongs to.

## Relations — what it needs

| Needs | For |
| --- | --- |
| [The Plugin](../01-plugins/plugin-set.md) | the folder a skill is delivered inside, and the install that makes its frontmatter loadable at all |

## Binds — what holds it, and where it lives today

| Rule | What it decides | Weight |
| --- | --- | --- |
| `the foundation's 04-devex/10-delivery.md` § When an edit becomes behaviour | a skill edit needs a fresh window before it is loadable — it is not the one instrument that reloads live | MUST |
| `RD.DEVEX.019` | every skill restates a chapter's steps and adds no rule of its own | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-claude-marketplace | spn-core · spn-apps-ts · spn-infra | the `SKILL.md` frontmatter and step files each plugin ships under `skills/` | planned |

## Proof — how you check it

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/03-skills/skill-set.md` | gate | the metadata block, the tag line and the outline hold the shape this construct names |

Try it: `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/03-skills/skill-set.md`
