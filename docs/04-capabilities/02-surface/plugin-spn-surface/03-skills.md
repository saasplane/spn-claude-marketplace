<!-- spn:doc
{"id": "spn-surface-capabilities-skills", "variant": "capability", "title": "Skills in spn-surface", "lenses": ["UX", "WEB_DEV"], "status": "PLANNING", "realizes": ["surface-skills"], "summary": "The one skill a Surface question answers to — the design skill, its stage, and the two steps it reads only where the window holds the connector.", "keywords": ["skill", "design", "steps", "figma", "stage"]}
-->

# Skills in spn-surface

`For: UX designer · Web developer` · `Status: 🔮 PLANNING` · `Realizes: Skills`

The folder under this plugin's `skills/` is named for a command of the Surface group, and it declares the one stage it serves. **Deciding what a feature is happens through a skill this plugin does not ship**: it lives once in the core plugin.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| Designing a page | `packages/plugin-spn-surface/src/skills/design/SKILL.md` | the layout, the containers, the pattern of each task and the blocks, stated as a tree of named blocks |
| The steps the skill names | `packages/plugin-spn-surface/src/skills/design/steps/draw.md` and `change-library.md` | draw the tree in Figma from the published libraries, and change a library file through the connector, held by the skill because they name no stack |
| The scripts the steps run | `packages/plugin-spn-surface/src/skills/design/scripts/` | the scripts that read a page, lay out a set and check what was drawn, run through the connector |
| What the skill restates | the `spn:restates` block at the top of `SKILL.md` | the skills chapter, the ideate chapter and the Surface chapters it follows |

## Follows the pattern

- The frontmatter, the matching against a listing, and the steps a skill sequences — [The Skill](../../../02-constructs/01-devex/04-skills.md)
- The stack-agnostic skills this one sits beside — [Skill in spn-devex](../../01-devex/plugin-spn-devex/04-skills.md)

## Special handling

### One skill holds its own steps, because the steps name no stack

**Why** — *a step is read when the work reaches it*. A window with no Figma connector never reaches the drawing or the change of a library file, so it never loads those files.
**What** — `design` serves the ideate stage. You ask it to design, lay out or draw a page, and it states the page as a tree of named blocks. Its steps are `draw`, which draws that tree in Figma, and `change-library`, which changes a library file through the connector.
**How** — the steps are written in no language, so they sit in the skill's own folder and no provider holds them. `packages/plugin-spn-surface/src/skills/design/steps/draw.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-surface refs | the standards, patterns and names the skill orders its decisions by | the skill holds the order, and the refs hold the rules |
| takes | the Figma connector | the script runner the steps send their scripts to | a drawing is made in the person's own file |
| publishes | every window that designs a page | a tree of named blocks for each page | code is written against a design rather than from nothing |
