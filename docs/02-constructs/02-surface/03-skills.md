<!-- spn:doc
{
  "id": "surface-skills",
  "variant": "construct",
  "title": "Skills — The Command a Surface Question Answers To",
  "subtitle": "The command a page, a flow or a mock is asked for, in one folder.",
  "lenses": ["UX", "WEB_DEV"],
  "status": "PLANNING",
  "dependsOn": ["skill-set"],
  "summary": "A skill belongs to this domain when it describes work on what a person sees and touches before any code is written, which today is one skill: design.",
  "keywords": ["skill", "design", "steps", "tree", "figma", "stage"]
}
-->

# Skills — The Command a Surface Question Answers To

`For: UX designer · Web developer` · `Status: 🔮 PLANNING`

A skill belongs to this domain when it describes work on what a person sees and touches before any code is written, which today is one skill: `design`. Read this page to see what the skill produces, which steps it reads only when the work reaches them, and why it serves the ideate stage. It explains the skill's shape and leaves its rules to the refs.

## Overview

The design skill answers a request to design, lay out or draw a page, a screen or a flow of pages. **Its result is a tree of named blocks, one tree for each page**, and it writes no code. The decisions it orders are the ones the Surface standards order: the person, the flow, the pattern, the panels, the tasks, and only then the blocks.

This construct realizes the book's `01-devex/02-agent/02-skills`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a skill | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group this domain answers to |
| the value | `SURFACE_{SKILL}` | the name the enum carries for that folder, its domain prefix derived from the plugin's own claim |
| the stage | `RD.DEVEX.AGENT.017` | the one stage a skill serves, which is what makes the applicable standards derivable from the skill that was invoked |
| a step | `steps/` | one file of a longer walk, read only when the skill's own router names it |
| a tree | — | one page as every block by the name the book gives it, with its props, in the order the decisions were taken |

## Model

The ask is matched to the skill, the skill orders the decisions and reads the refs for each, and the Figma steps load only where the window holds the connector.

```dg
{ "kind": "map",
  "caption": "The tree is complete without Figma: the drawing steps are read only where the window can draw.",
  "boxes": [
    { "id": "a", "label": "the ask", "note": "design, lay out or draw a page, a screen or a flow" },
    { "id": "b", "label": "the skill", "note": "design — the order of decisions and the form of the result" },
    { "id": "c", "label": "the refs", "note": "standards, patterns and names, read where each decision needs them" },
    { "id": "d", "label": "the steps", "note": "draw and change-library, read only with the Figma connector" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "matched to" },
    { "from": "b", "to": "c", "label": "reads" },
    { "from": "b", "to": "d", "label": "reaches" }
  ] }
```

## Parts

### The skill states a page before its code is written

You ask it to design, lay out or draw a page, a screen or a flow of pages. It picks the layout, decides the containers, chooses the pattern for each task, and then names the blocks. Its result is one tree for each page: every block by the name the book gives it, with its props. Deciding what a feature is stays with the core plugin's `ideate`, and writing the screen stays with the build skill of the apps plugin.

### A step that names no stack stays in the skill's own folder

The skill has two steps, `draw` and `change-library`. `draw` draws the page in Figma from the published libraries, and `change-library` walks a change of a library file through the connector, with the scripts the skill ships to read a page and to lay out a set. Neither names a language, so no provider holds them. The skill reads them only where the window holds the Figma connector and the work reaches them. A window with no connector never loads them, and the design is complete without them.

### The skill serves the ideate stage

A skill and a stage are separate closed sets mapped many to one, and the mapping is what makes *which standards apply to this request* derivable from the skill that was invoked. A page is designed before its code is written, so this skill answers to the ideate stage.

### One skill serves the builder and a partner alike

Both design from the refs and the specs this plugin carries, and neither needs the book open. The skill is the same for both.

### A skill carries a stamp, so a chapter it fell behind can say so

A skill is prose the agent loads, and prose drifts from the book silently because nothing compares it. The skill opens with a block naming the chapters it restates and the hash last read from each, so a drift run reads it exactly as it reads a ref.

## Boundary

This page answers which skill this domain ships and how it is shaped. It does not answer what a skill is — the frontmatter, the listing and the rule that a skill carries steps and never a rule of its own are [The Skill](../01-devex/04-skills.md). It does not answer what the standards say; that is [Refs](05-refs.md).

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the skill this domain answers to, the order of its decisions, and the steps it reads only with the connector | the frontmatter, the listing, the matching and the step mechanism | [The Skill](../01-devex/04-skills.md) |
| that the skill gives a page as a tree and writes no code | the screen's code, and the steps of the build | [Skills](../03-apps/03-skills.md) |
| that a window with no connector still gets the tree | what the connector accepts | [Hooks](02-hooks.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.AGENT.025` | one folder per skill value and one value per folder, the prefix derived from the shipping plugin's own claim | MUST |
| `RD.DEVEX.AGENT.017` | each skill declares the one stage it serves, so the standards that apply are derivable from the skill | MUST |
| `RD.DEVEX.AGENT.080` | the set holds `design`, which serves the ideate stage and gives a page as a tree of named blocks | MUST |
| `RD.DEVEX.WORKSPACE.118` | a skill that carries a rule it does not own is a restatement, and says so under a stamp | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a skill edit is loadable only after an install and a fresh window | MUST |

Try it: `spn-devex restates check`
