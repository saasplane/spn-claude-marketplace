<!-- spn:doc
{
  "id": "design-language",
  "variant": "construct",
  "title": "{{Owner}} Design Language",
  "lenses": ["UX", "UI"],
  "status": "PLANNING",
  "dependsOn": ["surfaces"],
  "subtitle": "{{One plain sentence: what is true for you once this exists. Example: every page and drawing of the platform looks like one hand made it.}}",
  "summary": "{{The Description's first sentence, word for word.}}"
}
-->
<!-- RESTATES: spn-foundation docs/04-capabilities/02-support/01-surface/03-standards-patterns/01-common/05-design-languages.md § A design language · § Where media go · § Media size by placement · § Text alignment and items · § The drawing scale · § A section's two layers · § Which layer takes a medium · § Media by kind of section · § A section's scene · § Items with a medium
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

{{WHAT IT CHANGES. Every page and drawing reads one answer, written here, the brand once and a row for each app, and each app's theme is written from it.}}

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Design language | `DesignLanguage` | the one look a site or an app follows, as words and values here, and as one typed theme setting in each app's code |
| Ground | `DesignGround` | what stands behind a section or a drawing: the section's fill, dots, or a scene's own land |
| Plate | `DrawingPlate` | a group in a drawing: the section's other fill under the units that belong together |
| {{Term}} | `{{ContractTerm}}` | {{one plain sentence}} |

## Model

{{The whole shape before any part: one brand for the platform, a language per app that needs its own, and the design system's own look for the apps that do not.}}

### Which app follows what

| App | Kind | Language | Layout | Looks (body, navigation, frames, size, motion) |
| --- | --- | --- | --- | --- |
| `{{web-www-ts}}` | Visitor | {{its own: saasplane-site}} | {{the app's layout setting}} | {{body, navigation, frames, size, motion}} |
| `{{web-platform-ts}}` | Team | the design system's | {{the app's layout setting}} | {{its looks}} |

Each app's row is also written as one fenced `json` block, keyed by the app's code, which `spnutils apps surface render --app` and `spnutils apps surface theme` read. It holds the theme's own values for the app, the layout as the app's own setting, and the kind of page. The table above is for the reader, the block for the commands, and the two never differ.

```json
{ "app": "{{www}}",
  "ds": "{{the design system version the app pins}}",
  "theme": { "app": { "primary": "{{#084A75}}" } },
  "layout": { "type": "{{TOPNAV}}", "nav": [] },
  "page": "{{SITE}}" }
```

### The brand

{{The platform's one brand, as values: the primary colour, the greys and the typefaces, set once. The radius, like every other look, is each app's, in its row. An app changes only its looks over it, never the brand itself.}}

| Brand value | Value |
| --- | --- |
| Primary | {{the primary colour}} |
| Greys | {{the neutral temperature and its steps}} |
| Typefaces | {{the heading, body and mono faces}} |

The brand is also one fenced `json` block, in the theme's own keys, which the commands read with every row.

```json
{ "brand": { "app": { "primary": "{{#084A75}}", "neutralTemperature": {{0}} },
             "typefaces": { "text": "{{…}}", "display": "{{…}}", "code": "{{…}}" } } }
```

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
| {{Shade}} | `{{--ds-drawing-shade}}` | {{one small shadow in light; none in dark}} |

### Characters and building blocks

{{Filled by `spn-surface language write`: people and the agent at the sizes the pages use, and the tile, wire, group, step and chip, each drawn and counted across the app's drawings.}}

### How the blocks meet

How the blocks meet is part of the style of a drawn medium, and a drawing is checked against it before it ships. {{Drop this part where the language uses no drawn media.}}

| Where blocks meet | The rule |
| --- | --- |
| A wire's ends | Each end meets the unit it joins at the middle of the facing edge: never inside a plate, past a border, or in empty space. A wire into a group meets the plate's edge, or the one card it means. |
| A wire's label | Stands {{8}} clear of its wire and is crossed by no wire. |
| A plate's name | Lies inside its plate, in {{small capitals}}; a name longer than the plate is cut to the plate's subject. |
| Words in a tile | Keep at least {{12}} from every edge of their tile and never cross it; a name too long for its tile is cut to its subject or the tile widens. |
| Words under a name | One short line, never three; the detail stays on the page the drawing leads to. |
| Code in a drawing | Real and valid, in the shape the product writes it, never a sketch of it. |

### Drawing scale

Every medium takes one scale, and each value in it is a token, so a name reads the same size on every page. A medium picks its step from where it sits: {{S in a card, M beside or under a section's words and in every docs figure, L in a hero}}. Its text never shrinks to fit, each medium is made at 1:1 for its frame, and no word renders below {{9}}px. The values below are SaaS Plane's defaults; a language may change any of them.

{{Where the language uses no drawn media, write "No drawn media" here and keep only the text, steps, shape and shadow rows below.}}

| Part of the scale | Applies to |
| --- | --- |
| Text levels | any words placed on media: a drawing's labels, callouts on a screenshot, a chart's axis labels, a caption inside a picture |
| Steps by placement | every kind of medium; the placement sets the size, whatever fills it |
| Shape and shadow | every framed medium: a tile, a photo's frame, a product screen |
| Lines | drawn media, and lines drawn over other media: a callout's pointer, a chart's grid |
| Spacing, tile forms, alignment, how blocks meet | drawn media only: diagrams and drawn product views |

| Level | What it names | Type | S | M | L |
| --- | --- | --- | --- | --- | --- |
| Label | a group: a plate, a column, a lane | {{mono 600, capitals, .08em}} | {{9}} | {{9.5}} | {{10.5}} |
| Name | a unit: a tile, a step, a person | {{sans 600}} | {{11}} | {{12}} | {{14}} |
| Detail | one thing about it, or a line of code | {{mono 400, muted}} | {{9.5}} | {{10}} | {{11.5}} |

| Shape | Value |
| --- | --- |
| A framed medium's radius | {{10}} |
| The one shadow | {{0 1px 1px at 8%, on a framed medium only; none in dark}} |

| Line | Weight | Style | Colour |
| --- | --- | --- | --- |
| A guide, a plate's edge | {{0.75}} | {{dotted 1 3, round ends, for a guide; solid for an edge}} | {{the guide role's token, `--draw-dot-color`: the accent mixed into the ground at 24%}} |
| A boundary that holds parts | {{1}} | {{dotted 1 3, round ends}} | {{the strong guide role's token, `--draw-dot-strong-color`: the accent at 45% in light, 55% in dark}} |
| A tile's edge, a wire | {{1}} | {{solid}} | {{the edge role's token; the wire role's token}} |
| A reply, an inactive unit, a slot you fill | {{1}} | {{dashed 4 4}} | {{the muted text role's token, `--draw-dash-color`}} |
| The one unit in focus | {{1.25}} | {{solid}} | {{the focus role's token}} |

A line's style sets its pattern, its weight its thickness, which for a dotted line is its dot size, and its role its colour. A dotted line that must be seen is never below weight {{1}}. No line takes opacity, and nothing else is dashed or dotted. The lines of an illustration, a scene's ground, a desk or a person, are not wires: they take the ink at full, at the weight the scene is drawn in.

A caption that names a plate from outside it is a detail line, set {{8}} below the plate's edge and lined up with it, and never a fourth text level.

| Between | At step M |
| --- | --- |
| A tile's edge and its words or icon | {{12}} |
| An icon and its words | {{10 inline, 8 stacked}} |
| Two tiles | {{12}} |
| A plate's edge and its tiles | {{16}} |
| Two plates | {{24; 56 where a wire joins them}} |
| Two floors of a stack | {{12}}, closer than two plates, so they never touch, flat or in isometric |
| A wire and its label | {{8}} |
| Two parallel wires | {{16}} |
| A wire's bend | {{radius 8}} |
| The content and the drawing's edge | {{16}} |

S takes these at {{0.85}} and L at {{1.2}}, rounded to the {{4}} grid.

| Tile form | When | At step M |
| --- | --- | --- |
| Inline | a name, or a name and a detail line | {{icon 16 at 12 from the left, 10 to the words; 36 tall with a name, 48 with a detail line}} |
| Stacked | a short name in a row of steps | {{icon 20 over the name, 8 between, 12 above and below; 64 tall}} |

Every edge and baseline sits on a {{4}} grid. Tiles in a row share their top and their height, and tiles in a column share their left edge. A row's tiles share their plate's width, so no tile stands with empty room beside it: one tile spans the row, two take half each, three take a third. A wire runs straight between centres that line up, and no wire crosses another wire.

### Page and sections

| Pick | Choice |
| --- | --- |
| A page | {{a hero, then the sections in the order of the reader's questions, then a closing call}} |
| Onward | {{a section that opens onto a group leads with the group's own link, Explore and its name; a deeper page or the demo comes second}} |
| Section groups | {{sections that answer one question share a fill; groups alternate BASE and DEFAULT; three at most}} |
| Room | {{hero XL, section MD, emphasis LG, closing SM}} |
| Page text | {{each role of a page's words, its element or class and the design system's type step it reads: page title on the heading step XL, section MD, sub-section SM, part title on the title step LG, body on the content step LG, small and tables MD, labels XS; one token a role, never a class a role}} |
| Faces | {{which of the design system's three faces each role takes: display for the titles a page is read by, text for every other word, code for code}} |
| Weights | {{which of the design system's four weights each role takes, and that no weight sits between them}} |

### Where media go

| Media | Placed on | Through |
| --- | --- | --- |
| A hero scene | the section | the section's background, its `mediaNode`, edge to edge |
| A close-up or a sheet | the feature | the feature's media |
| A small picture | an item | the item's media |

### A section's two layers

A section has two layers, and they are separate. The section's background is nothing, a pattern such as {{dots}}, or a scene that fills the section edge to edge on its ground. The feature's own media stands beside, under or over its words. A section may use both. Three questions say which layer a medium takes:

| Question | If yes, the medium is |
| --- | --- |
| Must it be read, because words or items point at it? | the feature's |
| Is it a place or a surface the words stand on? | the section's |
| Does it belong to one item? | the item's |

{{Drop the scene rows below where the language uses no scene.}}

| Kind of section | The section's background | The feature's media |
| --- | --- | --- |
| A landing hero | {{a scene, edge to edge, or none}} | {{none while a scene stands behind it, else a drawing beside the words}} |
| A sub-page hero | {{none or dots}} | {{the page's drawing beside the words}} |
| A section making a claim | {{none or dots}} | {{a drawing beside or under the words}} |
| Items with a picture | {{none}} | {{a drawing beside the items, and each item's own small picture}} |
| A grid or stats | {{none or dots}} | {{none}} |
| A quote | {{none}} | {{none, or one picture of the person}} |
| A demo | {{none or dots}} | {{the product view under the words}} |
| A closing call | {{none or dots}} | {{none}} |

A page has at most one scene. A scene never stands behind a section whose feature also has media. On a phone a section's scene moves under the words.

### A section's scene

A scene is drawn at 1:1 and never stretched. Its land runs past the content box on both sides to {{2560}} wide, fading at its far ends. Its subjects stand inside the content box. The section keeps the scene's height under its words, so the words and the actions stand in the sky.

### Media size by placement

A medium's size follows where it is placed, and each size is read from the design system's container that holds it, never guessed. A drawing is made for its frame, never scaled from another placement, and never cut: it fits its frame whole on its ground, and only empty sky is trimmed. A screenshot inside a drawn window crops to the top of its page. {{The widths are at the desktop, in the app's body width, less its room on each side.}}

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
| Items with a medium: steps or layers | start-aligned, across the section | beside the drawing, numbered and in the drawing's order |
| Items with a medium: doors | start-aligned, across the section | beside the group's picture, the picture centred on the items |
| A grid of peers | start-aligned | kept, with no drawing beside it |
| A paragraph, or an item grid | never centred | kept |
| Where a reader scans to decide | start-aligned always | kept: {{the value list near the top, the claims, the closing call}} |

### Grounds and drawing kinds

{{Filled by `spn-surface language write`: none, dots, a scene's own ground and a plate, each with when to use it; one drawing of each kind the app uses, from its real files; front and isometric angles, and how parts arrive.}}

### Motion

{{What moves, at what speed, and the frame it holds still on for a reader who asks for less motion.}}

### Tablet and phone

| Drawing form | When |
| --- | --- |
| Whole | no word renders below 9px |
| Cropped to its subject | a hero scene |
| Laid out again as a column | a row of steps |
| A smaller drawing of the same idea | none of the above reads |

### Samples

{{Filled by `spn-surface language write`: each hero at its real layout, from the app's media files, and the app's section drawings, wide ones full width, the rest two across.}}

## Boundary

{{This page answers what the platform's look is. It owns each app's looks and the platform's brand values. It does not own the design system's units, which are [Support's]({{path}}.md), or an app's layout, which is the app's own layout setting.}}

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `{{RULE.SUPPORT.SURFACE.440}}` | a site or an app follows one design language | GUIDE |
| `{{RULE.SUPPORT.SURFACE.577}}` | an app whose theme setting is out of step with its row is refused by the theme check | MUST |
| `{{RULE.SUPPORT.SURFACE.578}}` | the brand and each app's row are also written as one data block each, which the commands read | MUST |
| `{{RULE.SUPPORT.SURFACE.536}}` | a language fills one drawing scale, and each medium takes the parts that apply to its kind | MUST |
| `{{RULE.SUPPORT.SURFACE.557}}` | a section's background and its feature's media are two layers, used together or apart | MUST |
| `{{RULE.SUPPORT.SURFACE.558}}` | a medium takes the layer the three questions give it | MUST |
| `{{RULE.SUPPORT.SURFACE.570}}` | a dotted line has two strengths, a guide and a boundary, and one that must be seen is never below weight 1 | MUST |
| `{{RULE.SUPPORT.SURFACE.562}}` | a section's scene is drawn at 1:1, its land running past the content box | MUST |
| `{{RULE.…}}` | {{…}} | {{MUST}} |

Try it: `{{spn-surface language write <app>}}`
