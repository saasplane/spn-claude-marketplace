<!-- spn:doc
{
  "id": "design-language",
  "variant": "construct",
  "title": "Design Language",
  "lenses": ["UX", "UI"],
  "status": "PLANNING",
  "dependsOn": ["surfaces"],
  "subtitle": "{{One plain sentence: what is true for you once this exists. Example: every page and drawing of the platform looks like one hand made it.}}",
  "summary": "{{The Description's first sentence, word for word.}}"
}
-->
<!-- RESTATES: spn-foundation docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/05-design-languages.md § A design language · § Where media go · § Media size by placement · § Text alignment and items
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- A PLATFORM'S DESIGN LANGUAGE CONSTRUCT, in the construct seat shape. The agent reads it before it draws any page or
     picture. It records only the decisions; the review rounds that led there are kept beside it. Sections marked
     "Filled by spn-surface language write" are written by that command from the app's real files, never by hand. -->
# Design Language

`For: UX designer · UI designer` · `Status: 🔮 PLANNING`

{{THE DESCRIPTION. What the platform's look is, who reads this page (the agent, before it draws any page or picture), and how the page runs: which app follows which language, the parts every drawing is made of, how a page is laid out, and the samples drawn from the app's real files.}}

## Overview

{{WHY ONE LANGUAGE. What drifts without it: each page and each drawing chooses for itself, and the site reads as many hands.}}

{{WHAT IT CHANGES. Every page and drawing reads one answer, written here in words and in each app's data as values, and the check refuses what departs from it.}}

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Design language | `DesignLanguage` | the one look a site or an app follows, as words here and as values in its data |
| Ground | `DesignGround` | what stands behind a section or a drawing: the section's fill, dots, or a scene's own land |
| Plate | `DrawingPlate` | a group in a drawing: the section's other fill under the units that belong together |
| {{Term}} | `{{ContractTerm}}` | {{one plain sentence}} |

## Model

{{The whole shape before any part: one brand for the platform, a language per app that needs its own, and the design system's own look for the apps that do not.}}

### Which app follows what

| App | Kind | Language | Data |
| --- | --- | --- | --- |
| `{{web-www-ts}}` | Visitor | {{its own: saasplane-site}} | `apps/{{app}}/src/modules/{{module}}/assets/language/design-language.json` |
| `{{web-platform-ts}}` | Team | the design system's | none |

### The brand

{{The platform's one brand: its theme, set once. An app changes only its looks over it, never the brand itself.}}

### The references

| Site | Read | What was taken |
| --- | --- | --- |
| {{https://example.com}} | {{2026-11-18}} | {{grounds, angles, motion. Never words, pictures or branding.}} |

## Parts

{{The parts in reading order: the units every drawing is made of, the blocks built from them, how a page and its drawings are laid out, and samples drawn from the app's real files.}}

### Drawing style

<!-- Filled by spn-surface language write: each element as the pages draw it. Line weights, tiles, wire and pulse, plate, focus, angle. -->
{{Filled by `spn-surface language write`.}}

### Colour and strength

| Element | Token | Strength |
| --- | --- | --- |
| {{Tile face}} | `{{--card}}` | {{full}} |
| {{Wire}} | `{{--ds-drawing-wire}}` | {{30% of the text}} |
| {{Shade}} | `{{--ds-drawing-shade}}` | {{soft in light; black in dark}} |

### Characters and building blocks

{{Filled by `spn-surface language write`: people and the agent at the sizes the pages use, and the tile, wire, group, step and chip, each drawn and counted across the app's drawings.}}

### Page and sections

| Pick | Choice |
| --- | --- |
| A page | {{a hero, then the sections in the order of the reader's questions, then a closing call}} |
| Section groups | {{sections that answer one question share a fill; groups alternate BASE and DEFAULT; three at most}} |
| Room | {{hero XL, section MD, emphasis LG, closing SM}} |

### Where media go

| Media | Placed on | Through |
| --- | --- | --- |
| A hero scene | the section | the section's media, edge to edge |
| A close-up or a sheet | the feature | the feature's media |
| A small picture | an item | the item's media |

### Media size by placement

A medium's size follows where it is placed, and each size is read from the design system's container that holds it, never guessed. A drawing is made for its frame, never scaled from another placement. {{The widths are at the desktop, in the app's body width, less its room on each side.}}

| Placement | Its frame | On a phone |
| --- | --- | --- |
| A hero | the media column beside the words column: {{width by height}} in the {{content width}} stage, {{room}} above and below | under the words, the full width, the drawing cropped to its own content rather than shrunk with its room |
| Beside the words | a feature's split: {{words to media ratio}}, {{gap}} apart, about {{width}} wide | under the words or over them, the full width |
| Under the words | the section's content width, lined up with the grid or items above it, drawn for that wide frame; never a side-sized drawing centred in an empty band | the full width, redrawn tall where a wide drawing would shrink its labels below reading size |
| A band of media only | the content width, its words centred above it or none | the full width |
| A container's ground | the container, edge to edge behind its content, drawn quiet: low-contrast lines, no labels, nothing the words must compete with | the same, still quiet |
| An item's picture | the item's media box: {{size with a title and a line}}, {{size with a title alone}} | the same box |

### Alignment and items

Start-aligned is the default. A section's words centre only where they frame something short, and one carrier holds each claim: the items, or the medium's labels, never both.

| Case | The words | The items |
| --- | --- | --- |
| Words beside a medium | start-aligned | kept, under the words |
| Words over an item grid | start-aligned | kept |
| A hero or closing call with no medium beside it | centred | none, or the actions only |
| A stats band | centred | the numbers |
| One medium as the centrepiece, under a short title and one line | the title and line centred | dropped where the medium already labels each point, the medium spanning the content width |
| A paragraph, or an item grid | never centred | kept |
| Where a reader scans to decide | start-aligned always | kept: {{the value list near the top, the claims, the closing call}} |

### Grounds and drawing kinds

{{Filled by `spn-surface language write`: none, dots, a scene's own ground and a plate, each with when to use it; one drawing of each kind the app uses, from its real files; front and isometric angles, and how parts arrive.}}

### Motion

{{What moves, at what speed, and the frame it holds still on for a reader who asks for less motion.}}

### Tablet and phone

| Drawing form | When |
| --- | --- |
| Whole | its smallest text stays 10px or more |
| Cropped to its subject | a hero scene |
| Laid out again as a column | a row of steps |
| A smaller drawing of the same idea | none of the above reads |

### Samples

{{Filled by `spn-surface language write`: each hero at its real layout, from the app's media files, and the app's section drawings, wide ones full width, the rest two across.}}

## Boundary

{{This page answers what the platform's look is. It does not own the brand theme's values, which are [the platform's theme]({{path}}.md), the design system's units, which are [Support's]({{path}}.md), or each app's own data, which is its capability chapter's.}}

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `{{RULE.SUPPORT.SURFACE.440}}` | a site or an app follows one design language | GUIDE |
| `{{RULE.…}}` | {{…}} | {{MUST}} |

Try it: `{{spn-surface language write <app>}}`
