<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/09-architecture-containers.md",
      "seen": "876c0fa8"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/09-architecture-containers/",
      "seen": "fc758fe6"
    }
  ]
}
-->

# Containers — How a Part of a Page Is Framed

Source of truth: the foundation's Containers construct (`docs/02-constructs/02-support/01-surface/09-architecture-containers.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/09-architecture-containers/`). Containers is the ninth of sixteen Surface constructs.

Read this before you frame a part of a page, or before you draw or build the panel on a new stack.

## Terms

| Term | What it means |
| --- | --- |
| Container | `DSPanelContainer` — an optional block that frames a part of a page as a header, content and a footer: the head, content and foot unit. `DSDataTablePanelContainer` is built on it, for a data table |
| Part | `DSPanelContainer.Header` · `DSPanelContainer.Content` · `DSPanelContainer.Footer` — a named place in a panel. It holds anything, and takes only `flush`; the footer also takes `sticky` |
| Frame | `frames` — the drawn edge and fill of a panel. A frame is drawn once on any part of a page |
| Part of a box | `DSBoxPartType` — the closed set of the three parts of any box (`HEADER`, `CONTENT`, `FOOTER`): a panel, a card, a dialog, a sheet, a drawer, a popover or the page's head. The parts a frame holds, the parts of a card, and the part a block stands in |
| Surface | `IDSFrameSurface` — the paint of a frame in one prop: its `color`, `strength`, `raised`, `elevation`, `bordered` and `rounded`, each optional. A key left out takes the theme's |
| Inset | the space a part keeps between the frame and what it holds |
| Flush | `flush` — the one word on a part that turns its inset off, because its content reaches the edge of the frame |
| Card | `DSCard` — the block that frames one thing, among others like it. It stays beside the panel |
| Section | `DSSectionContainer` — one part of a page, set apart from the next by its fill and its room above and below. Its room comes from its `size`, and its fill reaches the edges of its place. It holds one child |
| Grid section | `DSFeatureGridSectionContainer` — a section whose one child is a grid of features under a heading of its own. It draws a section from its `section` prop, and is written where a section may be |
| Grid | `IDSGrid` — how the cells of a grid stand: how many columns, and the lines between them. Any unit that draws a grid of cells takes it whole |

## The parts — 🔮

> **Built.** `@saasplane/support-web-ds-ts` carries the grid section `DSFeatureGridSectionContainer`, `IDSGrid`, the one prop `surface` with `IDSFrameSurface` and `prepareFrameSurface`, the one frame drawer, the `frames` of a card and a card widget, `DSBoxPartType`, `DSDataTablePanelContainer` with its `panel`, and the theme by layer from support 5.22.0, and the library is owed.

A panel is an optional block. A page uses one when a part of it has a header, content and a footer as one unit.

**The library draws `DSPanelContainer`** from the category in the library column of its props table (`RULE.SUPPORT.SURFACE.437` · MUST · skill:spn-surface/design): `size` is its `SIZE`, `surface.color` and `surface.strength` its `COLOR`, the parts its `PART`, the sticky footer its `BEHAVIOUR`, and `frames`, `surface`, `divided`, `opacity`, `fullPage` and each `flush` its `LOOK`. As its usage it draws a settings page's billing part, a header with its title and an action, the contact, the invoices in a `flush` part and a footer with its actions. A panel has no state of its own, and its pages are Overview, Main, Playground, a scenario page for a listing, a form and a dashboard, and Screens. **It draws `DSDataTablePanelContainer`** composed from `DSPanelContainer` with a `DSDataTable`, and, as its usage, a page that is one listing.

The unit is `DSPanelContainer`, the head, content and foot unit, and *container* is the layer's word, never the unit's, and its look is the theme's `container.panel` (`RULE.SUPPORT.SURFACE.231` · MUST · skill:spn-surface/design). `DSDataTablePanelContainer` is built on it, for a data table, and takes the panel's props as `panel`. **A level of a page is a position and not a unit:** `CONTAINER` of `DSPageLevelType` names where a full-width section stands, whatever unit fills it, and it does not make that unit a `DSPanelContainer`. Only `DSPanelContainer` reads `theme.container.panel`; a card reads `theme.component.card` alone.

| Part | Named | How many | What it takes |
| --- | --- | --- | --- |
| Header | `DSPanelContainer.Header` | none or one | `flush`, and no other prop |
| Content | `DSPanelContainer.Content` | one or more | `flush`, and no other prop. Several join in one frame |
| Footer | `DSPanelContainer.Footer` | none or one | `flush` and `sticky`, and no other prop |

The parts sit in one order: the header, then the content, then the footer. The header places its first block, the title, at the start, where it grows, and every other block as one group of actions at the end, in the order written; below the medium width the group drops under the title. The footer starts its blocks at the start edge in a page, a panel and a card, and at the end in a dialog, a sheet and a drawer. Every box tells the blocks in each part its level, the part and `flush` (`RULE.SUPPORT.SURFACE.178` · MUST · skill:spn-surface/design): an action takes its size and its look from them, the main action being the one given the colour primary, at the outer edge of its group. The end of an item line holds data, never an action. A part holds anything: a `div`, a text, a block or a page's own component. A footer with `sticky` stays at the bottom of the screen while its panel is on screen, with the panel's own line, fill and inset, and rests at the end of the panel once the panel is scrolled past (`RULE.SUPPORT.SURFACE.367` · MUST · skill:spn-surface/design). The look of a panel is its `frames`, its `surface` and `unframed`, which holds a part out of the frame.

**An action takes its size and its look from its place, where the page gives none** (`RULE.SUPPORT.SURFACE.178` · MUST · skill:spn-surface/design). The main action is the one given the colour primary and every other action is an outline. An icon alone is a ghost, but in the head of a page, where an icon alone, such as the "⋯" of the overflow, is an outline square as tall as the outline actions beside it; in the header of a panel or a card it stays a ghost. The size counts from the size of the box:

| Place | The size of its actions | The main action | Any other action |
| --- | --- | --- | --- |
| the head of a page | one step above the size | solid | outline |
| the header of a panel | the size | quiet | outline |
| the header of a card | one step below the size | outline | outline |
| the head of a group | one step below the size | subtle | outline |
| a footer | the size | solid | outline |

A size or a variant the page writes on a button wins, so a Cancel may stay a ghost. The tints of a header are the place's alone: a page never writes `QUIET`, `SUBTLE` or `SUBTLE_OUTLINE` on a button, and `architecture-components.md` gives the button's cases.

### What a page puts in each part

What a page puts in each part follows one form. A person then finds the name and the actions of every framed part in the same place.

| Part | What a page puts in it | Why |
| --- | --- | --- |
| Header | the title of the panel at its start, one line under the title where the part needs one, and the actions of the panel at its end. The header stands above the outline | a title above the outline reads as the name of the part, and the outline then holds only what that name is about |
| Content | one part, or several parts each under its own title. The action of one part stands at the end of that part's title | a person sees which part an action changes, because the action stands on the title of that part and not in the header |
| Footer | what closes the work of the panel, such as the two actions that save an entry or leave it. It stands inside the outline, under a line | the actions that end the work are met last, after everything they act on |

- **A page puts the title and the actions of a panel in its header, and what closes its work in its footer** (`RULE.SUPPORT.SURFACE.074` · GUIDE). The header places its first block, the title, at the start, where it grows, and every other block as one group of actions at the end, in the order written (`RULE.SUPPORT.SURFACE.178` · MUST · skill:spn-surface/design), so the title and the actions need no placing by the page. Which action is the main one, and how many stand before "⋯", is the button's *limits across a header* in `architecture-components.md` (`RULE.SUPPORT.SURFACE.390` · GUIDE).
- **The action of one part of the content stands at the end of that part's title, and not in the header.** The header holds the actions of the whole panel.
- **A page uses one panel for each thing a person reads or saves as a whole** (`RULE.SUPPORT.SURFACE.116` · GUIDE). The sections of that thing are its content parts, and two things that are read or saved apart are two panels. The Surface Catalogue states the rule once, for every app page kind (`standards-patterns.md` holds the task and flow patterns).
- **A panel MUST give the title in its header the level of its box, `CONTAINER` unless the panel is the whole page, and a panel that is the whole page MUST say so with `fullPage`** (`RULE.SUPPORT.SURFACE.107` · MUST · skill:spn-surface/design) (`RULE.SUPPORT.SURFACE.179` · MUST · skill:spn-surface/design). The title of a header is an item line. A panel takes `fullPage`, a boolean that is `false` where the page gives none and that is not a size: it says that this panel is the page. The level of its box is `CONTAINER`, or `PAGE` with `fullPage`, and the panel gives it to its header, its content and its footer as their place. With `fullPage` the header is the page head: the title is the `h1` with no level of its own, the main action is solid one step above the size, and every other action is an outline. A data table panel container takes `fullPage` in its `panel` and gives it to its box, and it takes no level from its title: the `pageLevel` of a title styles the title alone, as on any item line. A title the page gives no level takes the level of its box: `WIDGET` in a card, `GROUP` in the head of a part of a card widget, and `CONTAINER` in a dialog, a sheet or a drawer, as `architecture-components.md` states for each box. So every page of an app opens with the same head, and only its body differs.
- **The way back of a header MUST be a row of its own above the title line** (`RULE.SUPPORT.SURFACE.108` · MUST · skill:spn-surface/design). `DSPanelContainer.Header` draws it where the page gives it an address to go back to: a link with an arrow and the words of where it leads, `backLabel`, or Back, 4 px above the title line and flush with its start. It is the row of `DSPageHead` (`RULE.SUPPORT.SURFACE.622` · MUST · skill:spn-surface/design), so the title keeps the start of its line.
- **A page that holds several panels puts its head above them, outside any frame, with its way back** (`RULE.SUPPORT.SURFACE.120` · GUIDE). A page with one panel puts its head in the header of that panel. A page with several has no one panel that its head belongs to, so the head stands alone above them all. It is `DSPageHead`, whose title line is an item at the level `PAGE`, with the way back in a row above the title line.
- **The design system MUST draw that head and its way back.** A page gives the title and the address to go back to, and writes no row, no back button and no padding of its own. So the head of a page looks the same whether the page has one panel or several.
- **The actions that close the work of an entry stand in one place and in one order** (`RULE.SUPPORT.SURFACE.095` · GUIDE). Over the page, in a dialog, a sheet, a drawer or a popover, they stand at the end of the footer: the action that leaves the work first, and the main action last, at the very end. In an entry that is a page of its own they stand at the start of the footer, the main action first, because the fields of a page line up at its start. A value changed in place, as in a row of a data table, keeps its two actions beside the box, the one that saves first, because a person reaches them in the order of reading. The main action is a solid button and the action that leaves an outline button, in both places.
- **A header above the outline is the value of `frames` that lists `CONTENT` and `FOOTER` and leaves `HEADER` out.** The app page kinds are drawn in that form. The look is still the theme's to choose: a theme that lists the header too moves the outline, and no page changes.

Here is how the parts serve the pages most apps have.

| A page | Header | Content | Footer |
| --- | --- | --- | --- |
| A listing | the page title, a line under it where one is needed, and actions at the end | a filter bar where the listing has one, and a data table in a `flush` part | the paging of the records |
| A form | the title of the form | its sections, one under another, each under its own title | the actions that save the form or leave it |
| An overview | flat | raised, holding widgets that show numbers | none |

**What the units do.** A listing's paging in the footer of the panel is the form the app page kinds are drawn in. `DSDataTable` hands its paging to a place the page gives it. The page puts an element in `DSPanelContainer.Footer` and names it as `settings.pagination.footerElement`, and the table draws its record count and its pager there. The table is handed a place and knows no panel, because a composite is a component, a layer before the panel. Where a page gives no place, the table draws its paging in a footer of its own, at the foot of the records.

## The look — 🔮

The look of a panel is the props `frames`, `surface` and `unframed`, set out in the table below. A **frame** is the drawn edge and fill of a panel. The `surface` is the paint of the frame in one prop, an `IDSFrameSurface`, and a panel, a card, a feature and a card widget take the same one.

| prop | type | default | what it does and when to use it | library |
| --- | --- | --- | --- | --- |
| `children` | `ReactNode`: the parts | required | the parts of the panel, in one order: `.Header`, `.Content`, `.Footer`; each part is a named place the look of the panel reaches | PART · Parts |
| ↳ `Header.flush` | `boolean` | `false` | what the part holds fills it from edge to edge, with no inset | LOOK · Flush header |
| ↳ `Header.backAnchor` | `IDSBaseAnchor` | none | a way back, a row of its own above the title line: a link with an arrow and the words of where it leads; with none, the one a page frame above offers below a desktop | ACTIONS · Back link |
| ↳ `Header.backLabel` | `IDSText` | Back | the words of that way back, such as Settings; with none, the frame's | WORDS · Back label |
| ↳ `Content.flush` | `boolean` | `false` | what the part holds fills it from edge to edge, with no inset | LOOK · Flush content |
| ↳ `Footer.flush` | `boolean` | `false` | what the part holds fills it from edge to edge, with no inset | LOOK · Flush footer |
| ↳ `Footer.sticky` | `boolean` | `false` | the footer stays at the bottom of the screen while its panel is on screen. Scroll behaviour, so it is not drawn. | BEHAVIOUR |
| `frames` | `DSBoxPartType[]`: `HEADER` · `CONTENT` · `FOOTER` | the theme's `container.panel.frames` | which parts the frame holds. Two listed parts next to each other share one frame; a part not listed sits flat on the page; an empty list is no frame | LOOK · Frames |
| `unframed` | `DSBoxPartType[]` | none | the parts that take no frame, whatever `frames` and the theme give; a part listed here sits flat on the page | LOOK · Unframed parts |
| `surface` | `IDSFrameSurface`: `color` · `strength` · `gradient` · `raised` · `elevation` · `bordered` · `rounded` | the theme's `container.panel` | the paint of the frame, in one prop; a key left out takes the theme's | LOOK · Surface |
| ↳ `surface.color` | `DSSurfaceColorType`: `BASE`, `DEFAULT`, `PRIMARY` | `BASE` | the colour of the fill of the frame; `BASE` leaves the fill to `raised`; × `surface.strength` | COLOR |
| ↳ `surface.strength` | `DSSurfaceStrengthType`: `SUBTLE`, `QUIET`, `SOLID` | `SUBTLE` | how strong the fill of a hue is; `BASE` takes none; × `surface.color` | COLOR |
| ↳ `surface.gradient` | `IDSSurfaceGradient`: `type` · `origin` · `end` · `reach` | flat | a gradient drawn over the fill, from the fill's own shades at its strength; `BASE` ignores it | LOOK · Gradient |
| ↳ `surface.gradient.type` | `DSSurfaceGradientType`: `LINEAR` · `RADIAL` | required in a gradient | the kind of gradient | LOOK · Gradient kind |
| ↳ `surface.gradient.origin` | `DSPlacementType`: the sides and the corners, `TOP_LEFT` and the others | `RADIAL` centred, `LINEAR` from `TOP` | where the gradient starts; a corner and its pair (`TOP_LEFT`, `LEFT_TOP`) draw the same; `LEFT` and `RIGHT` do not flip in right-to-left | LOOK · Gradient start |
| ↳ `surface.gradient.end` | `DSSurfaceGradientEndType`: `SOFTER_15` · `SOFTER_30` · `SOFTER_45` · `SOFTER_60` · `STRONGER_15` · `STRONGER_30` | clear, the page's own fill | what the gradient ends in, a step softer or stronger than its start | LOOK · Gradient end |
| ↳ `surface.gradient.reach` | `DSSurfaceGradientReachType`: `REACH_25` · `REACH_50` · `REACH_75` · `REACH_100` | `REACH_100` | how far the gradient reaches: the whole surface for `LINEAR`, a share of the longer side as the radius for `RADIAL` | LOOK · Gradient reach |
| ↳ `surface.raised` | `boolean` | the theme's | fills the frame with the raised surface and lifts it on a shadow | LOOK · Raised |
| ↳ `surface.elevation` | `DSSizeType`: `XS` to `XL` | `SM` | how far a raised frame stands off the page, by the tokens `--shadow-elevation-xs` to `--shadow-elevation-xl`, each a two-layer shadow; read only where `raised`; a bordered frame keeps its border; in dark the same shadow is drawn stronger; elevation never changes the fill | LOOK · Elevation |
| ↳ `surface.bordered` | `boolean` | the theme's | draws the edge of the frame; inside a bordered frame a line divides each two parts | LOOK · Bordered |
| ↳ `surface.rounded` | `boolean` | the theme's | rounds the corners of the frame; how much comes from the size step of the panel | LOOK · Rounded |
| `divided` | `boolean \| DSBoxPartType[]` | `true` | the lines inside a bordered frame: `true` a line between every two parts, `false` none, a list a line above each part it names (`CONTENT`, `FOOTER`) | LOOK · Divided |
| `opacity` | `DSSurfaceOpacityType`: `OPAQUE` · `TRANSLUCENT` | `OPAQUE` | whether a person sees through the frame's fill where content passes behind it | LOOK · Opacity |
| `className` | `string` | none | a class of the app that paints this one panel through the paint tokens, on its root | WIRING |
| `size` | `DSSizeType`: `XS` to `XL` | the size of its place | the size step; the panel gives it to every block inside | SIZE |
| `fullPage` | `boolean` | `false` | says this panel is the whole page: its header is the page head, the title takes the `h1`, and its content and footer stand at `PAGE`; once | LOOK · Whole page |
| `testData` | `IDSTestData` | none | from `IDSBaseProps` | WIRING |

Every prop of the look, and every key of `surface`, is a row of this one table; the library column holds its category (`RULE.SUPPORT.SURFACE.437` · MUST · skill:spn-surface/design), which says which section, subsection and cell the library and the showcase draw it in (`architecture-components.md`, *The page model*).

The values of `frames` are the three parts of a box, one closed set, `DSBoxPartType`, that every stack spells the same way. A card names its parts with it too, and so do a dialog, a sheet, a drawer, a popover and the page's head, and so does the place that tells a block which part it stands in.

- **The parts of any box MUST be `DSBoxPartType`** (`RULE.SUPPORT.SURFACE.266` · MUST · skill:spn-surface/design). The set belongs to every box, and `DSPageLevelContext` keeps its name, because its first fact is the level.
- **The paint of a frame MUST be one prop, `surface`, typed `IDSFrameSurface`, and a unit MUST NOT declare its keys one by one** (`RULE.SUPPORT.SURFACE.261` · MUST · skill:spn-surface/design). `DSPanelContainer`, `DSCard`, `DSFeature` and `DSCardWidget` take it in place of six props, each from its own look of the theme, and `frames`, `unframed`, `divided` and `opacity` stay props of their own. `DSSectionContainer` and `DSSurface` draw a fill with no frame, so they keep `color`, `strength` and `painted`.
- **The look of a panel MUST be declared by these props, and by nothing else** (`RULE.SUPPORT.SURFACE.092` · MUST · skill:spn-surface/design). Each key of the surface is a choice that does not depend on the others (`RULE.SUPPORT.SURFACE.163` · MUST · skill:spn-surface/design). The theme holds the app's default for each, and a panel may set its own.
- **A look MUST NOT take a name of its own.** A flat header above raised content is a value of `frames` and `surface`, so no list of named looks grows with each new one.
- **A partner MAY paint one panel with a class of their own, through the paint tokens** (`RULE.SUPPORT.SURFACE.192` · MUST · skill:spn-surface/design). `DSPanelContainer` takes `className`, which goes on its root, and `opacity`; `DSSectionContainer`, the section of a page, takes `className` on the same terms and no `opacity`, because a section is not translucent. The class sets `--surface-fill`, `--surface-translucent-fill` and `--surface-blur` from the partner's own tokens, in light and in `[data-mode='dark']`, and each frame the panel draws reads them, and the section reads `--surface-fill` for its fill. Anything else a class sets on the panel or the section is unsupported, and a card inside a painted panel keeps its own fill. A card takes `className` and `opacity` the same way, and no `style`.
- **A part listed in `unframed` MUST take no frame, whatever `frames` and the theme give.** A page that sets `frames` takes the whole choice from the theme. A page that sets `unframed` takes one part out and leaves the rest to the theme. So a theme can still change the look of that panel, and the named part stays flat in every theme.
- **`unframed` is for a part that no theme should frame on this page.** One such part is a header that is the header of the page, which the rules of content keep out of a frame (`standards-core.md`). A page that wants a look sets `frames`, or leaves it to the theme. The book states `unframed` before the web builds it.

A panel also takes `size`, which sets the density of every block inside it (`architecture-app.md`).

## A part and its inset — 🔮

A part insets its content, and the page decides what fills a part.

| The part | Its inset |
| --- | --- |
| In the frame, with nothing written | the padding of the panel's size step, once around everything in it |
| In the frame, with `flush` | none |
| Not in the frame: the panel is flat, or `frames` does not list the part | none, so `flush` changes nothing |

Write `flush` on a part whose content reaches the edge of the frame, such as a table. Let `flush` describe the content, and not the look. Deciding what fills a part is the page's, and it is advice (`RULE.SUPPORT.APPS.155` · GUIDE). A theme can change the frame from flat to bordered to raised, and no page changes.

- **A part MUST NOT set the gap between its blocks.** The page writes that gap, from the scale.
- **The foundation defines no block for a row or a grid. A stack MAY provide one** (`RULE.SUPPORT.SURFACE.084` · GUIDE). Such a block is the stack's own unit, made to keep building simple, and its stack states it. A page on a stack that provides none writes the row or the grid itself. Either way the gap comes from the scale, and readings still stand as the rules of content ask.

| Space | Owner |
| --- | --- |
| The frame | the panel |
| The inset of a part | the part |
| The gap between two blocks in a part | the page |
| A block's border | the block |
| The gap between two panels | the page |

A container takes no background color, no padding value, no margin, no container inside it, and no prop named `variant`. It takes no child that is not one of its parts.

### The section of a page

A section is one part of a page, set apart from the next by a fill of its own and its own room above and below: the hero of a website, a row of three pillars, the strip behind a closing call, a tinted greeting that opens an app's page. `DSSectionContainer` is the unit (`RULE.SUPPORT.SURFACE.243` · MUST · skill:spn-surface/design), and it draws a `<section>`. It has no header, no footer, no frame and no parts. It holds one child. What stands in it sets its own level: a pitch on a website is a `DSFeature` placed in the section, with its own `pageLevel`, and the section hands down no level. It takes a `color` (`BASE` when unset), a `strength` (`SUBTLE` when unset) and `painted`, as a surface does, a `className`, a `size` (the app's when unset), `flush`, a `mediaNode` and an `id`.

Each container kind of MARKETING and RESOURCES, the site categories of the Surface Catalogue, is realized by a section container, named in the site container kinds of the catalogue, so no section is defined twice.

| prop | type | default | what it does and when to use it | library |
| --- | --- | --- | --- | --- |
| `children` | `ReactNode`: one child | required | what the section holds; it holds one child, which sets its own level, and the section hands down none | SLOT · Child |
| `color` | `DSSurfaceColorType` | `BASE` | the colour of the fill of the section | COLOR |
| `strength` | `DSSurfaceStrengthType` | `SUBTLE` | how strong the fill of a hue is. `BASE` takes none | COLOR |
| `gradient` | `IDSSurfaceGradient`: `type` · `origin` · `end` · `reach` | flat | a gradient drawn over the fill, from the fill's own shades at its strength; `BASE` ignores it | LOOK · Gradient |
| ↳ `gradient.type` | `DSSurfaceGradientType`: `LINEAR` · `RADIAL` | required in a gradient | the kind of gradient | LOOK · Gradient kind |
| ↳ `gradient.origin` | `DSPlacementType`: the sides and the corners, `TOP_LEFT` and the others | `RADIAL` centred, `LINEAR` from `TOP` | where the gradient starts; a corner and its pair (`TOP_LEFT`, `LEFT_TOP`) draw the same | LOOK · Gradient start |
| ↳ `gradient.end` | `DSSurfaceGradientEndType`: `SOFTER_15` · `SOFTER_30` · `SOFTER_45` · `SOFTER_60` · `STRONGER_15` · `STRONGER_30` | clear, the page's own fill | what the gradient ends in, a step softer or stronger than its start | LOOK · Gradient end |
| ↳ `gradient.reach` | `DSSurfaceGradientReachType`: `REACH_25` · `REACH_50` · `REACH_75` · `REACH_100` | `REACH_100` | how far the gradient reaches | LOOK · Gradient reach |
| `painted` | `DSThemeModeType` | none | that the section stands on a picture the page paints, as `DSSurface` states | LOOK · Painted on |
| `className` | `string` | none | that the app paints this one section: the class sets the paint token `--surface-fill`, a colour, in light and in `[data-mode='dark']`, and the section's fill is it. Nothing else a class sets on the section is supported | WIRING |
| `size` | `DSSizeType` | the app's size | the room above and below, and the size every block inside the section takes. A section's room is `MD` under a design language that sets none | SIZE |
| `flush` | `boolean` | `false` | whether the section draws no room of its own on any side, above, below or at the sides, so that the child runs to the edges of the section's place. It means here what it means on a card part, a panel part and `DSList`: it draws no padding of its own (rule RULE.SUPPORT.SURFACE.313 · MUST · skill:spn-surface/design) | LOOK · Flush |
| `mediaNode` | `ReactNode` | none | art drawn behind the child from one edge of the place to the other: a picture, a gradient, a video, a canvas, or a slideshow, a `DSCarousel` with `overlay`. Still art is hidden from a reader; art that holds a control, a slideshow's arrows and dots, is not | SLOT · Art behind |
| `mediaScrim` | `DSHorizontalAlignType`: `START` · `CENTER` · `END` | none: the words stand on the art | where the words stand over `mediaNode`, on a scrim of the section's own fill, as a `BACKDROP` feature's words do: `START` dense at the start and clear at the end, `END` its mirror, `CENTER` an even wash, and the whole width on a phone. The scrim lies over the art and under the art's own controls, and the child keeps to the part it covers, three fifths of the box from the tablet up. Read only where `mediaNode` is set | LOOK · Media scrim |
| `width` | `DSLayoutWidthType`: `FULL` · `XWIDE` · `WIDE` · `MEDIUM` · `NARROW` | none: nothing is capped | caps what the section holds at that layout width's own measure, centred inside the side room, as `DSLayout` reads it; the ground, the `mediaNode` and the scrim stay edge to edge, a phone narrower than the width keeps the full width, and `FULL` caps nothing. It narrows this section's content only and is not the page's layout width: `NARROW`, 768px at most, draws the reading measure of questions and of a reading column (Q71 A) | SIZE · Content width |
| `inset` | `boolean` | `false` | an inner shadow along the section's top and bottom edges, over its fill and its `mediaNode`, from the one token `--shadow-inset`. It sets the section apart from the sections above and below it | LOOK · Inset |
| `parting` | `DSSectionPartingType`: `NONE` · `HAIRLINE` | the design language's, else `NONE` | how the section is set apart from the next one: `HAIRLINE` draws one thin line along its lower edge, and `NONE` leaves the fill and the room to part them | LOOK · Parting |
| `pattern` | `DSSectionPatternType`: `NONE` · `DOTS` · `LINES` · `GRID` | the design language's, else `NONE` | a pattern drawn behind the child, over the fill and under `mediaNode`, in the section's own hue at a low strength | LOOK · Pattern |
| `fadedEdges` | `boolean` | the design language's, else `false` | whether the pattern fades into the ground at the section's edges, so it has no hard line where it stops. Read only where `pattern` is set | LOOK · Faded edges |
| `id` | `string` | none | the anchor a page's own links land on. The section lands below a sticky bar, never under it | WIRING |

- **A section of a page MUST be `DSSectionContainer`, and it MUST be the only unit that gives a part of a page its fill and its room** (`RULE.SUPPORT.SURFACE.243` · MUST · skill:spn-surface/design). The room above and below comes from the section's size and the sides are the layout's space, `--layout-space` (`RULE.SUPPORT.SURFACE.200` · MUST · skill:spn-surface/design), so a page writes no padding, no maximum width and no gutter for a section. A section that is `flush` draws no room of its own on any side (`RULE.SUPPORT.SURFACE.313` · MUST · skill:spn-surface/design). It takes no header, no footer, no frame and no parts, and `DSPanelContainer` takes no section's job.
- **A section MUST take its room above and below from its size, and hand that size to what it holds** (`RULE.SUPPORT.SURFACE.247` · MUST · skill:spn-surface/design). The size is the app's where it is unset, and every block inside the section takes it, as the blocks in a panel container take the panel's. Each value is a token, `--section-<step>-room` and `--section-<step>-gap`, with a smaller value under the layouts' phone width, and a partner overrides the tokens once for the whole site.
- **Two or more features stacked in one section MUST stand the section's stack apart, two thirds of its room on the 8 grid** (`RULE.SUPPORT.SURFACE.549` · MUST · skill:spn-surface/design). The token is `--section-<step>-stack`, 64px at `MD` and 40px on a phone, so the features read as blocks of one section and never as two sections; a section that holds one child takes none of it, and an item gap never stands between two features.
- **A second feature in a band stands at the level of the section's first** (`RULE.SUPPORT.SURFACE.587` · MUST · skill:spn-surface/design). A level that does not allow a feature's `type` draws the default of that level, silently, so a band's second feature at `WIDGET`, which allows only `MEDIA_TOP` and `MEDIA_BOTTOM`, lost its `ITEMS_SPLIT_END`. The features of a band share the level that allows the type the band names.

| Size | Room above and below | Grid gap, or room on each side of a line | Typical use |
| --- | --- | --- | --- |
| `XS` | 32px · 24px on a phone | 16px · 16px | a strip of logos |
| `SM` | 56px · 32px | 24px · 16px | a short call |
| `MD`, the app's size | 96px · 56px | 32px · 24px | an ordinary section |
| `LG` | 112px · 64px | 40px · 24px | a section that leads |
| `XL` | 128px · 72px | 48px · 32px | the hero |

- **A section MUST reach the edges of its place and no further** (`RULE.SUPPORT.SURFACE.254` · MUST · skill:spn-surface/design). The place is the window in TOPNAV and CANVAS and in the header and the footer of every layout (in TOPNAV the content, where the content draws a frame of its own), and the content part in RAIL and DOCK, as `architecture-layouts.md` marks it. The section's fill, its `mediaNode` and the child of a `flush` section run from one edge of the place to the other, and the section's words stay in the body's box. The child of a `flush` section lines its own words up with the box by `--section-box-inset`. In an app the fill stops at the navigation, and a content drawn bordered, raised or floating keeps its line, its corners and its shadow. Where the browser's scrollbar takes width from the window, the section adds no sideways scroll. A page does not put a section inside a panel, a card, an overlay or the nav column, since a section sets a part of a page apart and frames nothing; that part is advice.
- **Where the words stand over the art, the section's `mediaScrim` keeps them readable.** It draws a scrim of the section's own fill over the `mediaNode`, dense at the start, at the end or evenly, and the words keep to the three fifths it covers from the tablet up. So a slideshow can stand behind a hero and every slide leaves the claim readable. With no `mediaScrim` the words stand on the art itself, as a scene's do.
- **A section's fill MAY be a gradient of its own colour** (`RULE.SUPPORT.SURFACE.415` · MUST · skill:spn-surface/design). A surface's fill is one shape everywhere it is painted, `IDSSurfaceFillProps` (`color`, `strength`, `gradient`), declared once and taken by `DSSurface`, `DSSectionContainer`, the panel container, the card and the feature; a navigation bar takes no gradient. A gradient is `LINEAR` or `RADIAL`; its `origin` is a `DSPlacementType` (left out, a radial is centred and a linear runs from the top; a linear from a corner runs to the opposite corner); its `end` is the same colour softer, toward the page, by 15, 30, 45 or 60%, or stronger by 15 or 30%, and clear where left out; its `reach` is 25, 50, 75 or 100% of the way, flat beyond. Every value keeps the section's words readable across the whole band in both modes, so no value changes the words' colour. `BASE`, `painted` and an app's own fill stay flat, and `mediaNode` draws over the gradient.
- **Sections MUST be told apart by a change of fill, never by a line** (`RULE.SUPPORT.SURFACE.416` · MUST · skill:spn-surface/design). Two sections side by side never share a tinted fill, and a site's page carries its brand fill at most three times: its opening, one pause mid-page and its closing call. A section whose words have no media beside them stands centred, its head and its items; a section with media beside its words stands at the start, where every start-aligned section's words share one edge with the bar's first item.
- **A partner MAY paint one section with a class of their own, through the paint token** (`RULE.SUPPORT.SURFACE.192` · MUST · skill:spn-surface/design). The class sets `--surface-fill`, a colour, in light and in `[data-mode='dark']`, and the section draws that colour from edge to edge of its place in place of its `color`. A section that takes a dark colour in a light page, or a light one in a dark page, names the mode of that colour with `painted`, so that what it holds takes that mode's tokens and its text.

**The section stands beside `DSPanelContainer` and takes none of its job.** The panel container frames a part of a page that a person reads or saves as a whole, with a title above it and actions in its header. The section frames nothing: it sets one part of a page apart from the next. A section is for the pages of a website and for a strip that opens an app's page, and an app part with a title and actions is a panel container. The theme holds no look for a section: a page alternates its sections on purpose, and the rhythm is in the stylesheet's tokens.

### The depth of what a section holds

**A section never frames itself, and what stands in it takes its depth from what it holds and does for the visitor, not from the page's taste** (`RULE.SUPPORT.SURFACE.293` · MUST · skill:spn-surface/design). The band's fill gives the rhythm.

| An item that is | Depth |
| --- | --- |
| a point to read, with no `anchor` | flat |
| a door to another page, with an `anchor` | boxed and raised at `MD`, in the fill that stands off its band: `DEFAULT` on a `BASE` band, `BASE` on a `DEFAULT` band |
| a choice that changes what is shown, with `selected` or an `anchor` that sets state | boxed and raised at `MD`, the chosen one marked |
| a step in order, `numbered` with no `anchor` | flat, with a line between each two |
| a statistic, `STATS` | flat |
| a thing of its own, such as a quote or a plan | boxed; a recommended plan one level higher |

A media follows its kind, named before its art exists: the product (a screen, a recording, a live view) is framed and raised, `LG` at `PAGE` and `MD` at `CONTAINER`; an illustration or a diagram is flat on its band; a photo is flush and rounded with no border and no raise; code or a terminal sits in its code frame, flat; logos are flat and muted.

### The grid section

**The library draws `DSSectionContainer`** from the category in the library column of its props table: `size` is its `SIZE`, `color` and `strength` its `COLOR`, `painted`, `flush`, `inset` and the gradient its `LOOK`, and `mediaNode` and the child its `SLOT`. As its usage it draws a website's band, an `XL` section of the brand's colour holding the hero at `PAGE`. A section has no state of its own. **It draws `DSFeatureGridSectionContainer`** composed from `DSSectionContainer` with a `DSFeature` grid, and, as its usage, a website's band of features.

A grid of features under a heading is `DSFeatureGridSectionContainer` (`RULE.SUPPORT.SURFACE.259` · MUST · skill:spn-surface/design). A section holds one child, so a heading over a few cells has no place in it: the heading would become a cell of the grid, or a second section above it. The grid section gives the heading and the cells one home, and a page writes it where it writes a section. The data decides when a section is a grid section: it holds a set of features that are each a thing of their own, such as the integrations or the component groups of a product, under one heading, while a `DSFeature` with items holds its own parts or points under its own heading, description, facts and actions, with media or without, so media alone decides neither. `site-patterns.md` states when a section of a site's page is a grid section, and its uses: shown features, a directory, plans and quotes. It draws a `DSSectionContainer` from `section`, and its one child is a `DSFeature` at `CONTAINER` that holds the grid where its items stand. A set of modules is such a grid: each cell has its mark, its kind as a fact, and the page it opens as its `anchor`, so it is a door, `frames` `TEXT` with `surface` `DEFAULT`, raised, `elevation` `MD`. Points of one subject, each a title and one line, are not a grid section: they are the items of one `DSFeature`.

| prop | type | default | what it does and when to use it | library |
| --- | --- | --- | --- | --- |
| `section` | `IDSFeatureGridSectionContainerSectionProps`: every prop of `DSSectionContainer` but its child, `flush` and its test data | the section's own | the section it draws. A key left out takes the section's own default, so `size`, `color`, `strength`, `painted`, `mediaNode` and `id` work as on any section, and are drawn on [the page of `DSSectionContainer`](#dssectioncontainer) | LOOK · Section |
| ↳ `section.size` | `DSSizeType`: `XS` · `SM` · `MD` · `LG` · `XL` | the app's size | the room above and below the grid | SIZE |
| ↳ `section.color` | `DSSurfaceColorType`: `BASE` · `DEFAULT` · `PRIMARY` | `BASE` | the colour of the fill of the section; × `section.strength` | COLOR |
| ↳ `section.strength` | `DSSurfaceStrengthType`: `SUBTLE` · `QUIET` · `SOLID` | `SUBTLE` | how strong the fill of a hue is; `BASE` takes none; × `section.color` | COLOR |
| ↳ `section.inset` | `boolean` | `false` | the soft inner shadow along the section's top and bottom edges | LOOK · Inset |
| `heading` | `IDSFeatureGridSectionContainerHeadingProps`: `eyebrow`, `title`, `description`, `facts`, `factsPlacement`, `actions` and `textAlign` of `IDSFeatureProps` | none | the heading over the grid, a `DSFeature` at `CONTAINER`. Left out, the grid stands alone. `title` is required, as a feature's is | WORDS · Heading |
| ↳ `heading.actions` | `IDSFeatureProps['actions']` | none | the actions of the heading; they stand under it, above the grid | ACTIONS · Heading actions |
| ↳ `heading.facts` | `IDSFeatureProps['facts']` | none | the facts of the heading, one quiet line under the description | ITEMS · Heading facts |
| ↳ `heading.factsPlacement` | `DSItemFactsPlacementType`: `AFTER_DESCRIPTION` · `AFTER_TITLE` | the feature's, `AFTER_DESCRIPTION` | where the facts stand; its values are drawn on the page of `DSFeature` | LOOK · Facts placement |
| ↳ `heading.textAlign` | `DSHorizontalAlignType`: `START` · `CENTER` · `END` | `START` | where the heading's words line up | LOOK · Heading alignment |
| `grid` | `IDSGrid`. Left out, 3 columns on a desktop, 2 on a tablet and 1 on a phone, with no lines | the default columns | how the cells stand: the columns at each screen class, and the lines between them | LOOK · Grid |
| ↳ `grid.desktop`, `grid.tablet`, `grid.mobile` | `number`, from 1 to 4 | 3, 2 and 1 | the columns at each screen class | LOOK · Columns |
| ↳ `grid.borderType` | `DSGridBorderType`: `NONE` · `GRID` · `EDGE` | `NONE` | the lines of the grid | LOOK · Lines of the grid |
| `reveal` | `IDSFeatureGridSectionContainerRevealProps` | none | how the heading and then the cells move into place the first time they scroll into view. Left out, nothing moves. It plays once, the heading first and then the cells row by row | BEHAVIOUR |
| ↳ `reveal.heading` | `DSMotionType`: `FADE` or `RISE` | none | how the heading moves in | BEHAVIOUR |
| ↳ `reveal.grid` | `DSMotionType`: `FADE`, `RISE` or `ZOOM` | none | how the cells move in | BEHAVIOUR |
| `children` | the cells, each a `DSFeature` | required | the cells of the grid | SLOT · Cells |
| `testData` | the unit's own | none | handed to the section's root | WIRING |

- **A grid of features under a heading MUST be `DSFeatureGridSectionContainer`, and it MUST take `section`, and MAY take a `heading` and a `grid`.** `DSFeature` is not changed for it.
- **The actions of the heading MUST stand under it, above the grid.** The unit passes `DSFeatureActionsPlacementType.BEFORE_ITEMS` and does not offer `actionsPlacement`. A feature frames nothing by default, so the heading is not framed.
- **The grid section MUST NOT take `flush`.** `flush` takes a child to the edges of its place with no room, for a child that pads its own track. With `flush` the title and the outer cells would stand at the window's edges, out of line with the bar and with the sections above and below.
- **The grid section MUST take no `pageLevel` and hand the cells none.** The heading stands at `CONTAINER`, as a panel's does. Each cell is a `DSFeature` that names its own `pageLevel`: `WIDGET` for a thing of its own, such as a module or an integration, `GROUP` or `CONTENT` for a denser grid. A cell with none reads its place, which is `PAGE` on a website, so a page names a level on every cell.
- **The columns MUST follow the screen class, and never a measured width** (`RULE.SUPPORT.SURFACE.271` · MUST · skill:spn-surface/design). `grid` states how many columns stand at a desktop, a tablet and a phone, each from 1 to 4, and the live device picks one. A number above 4 is read as 4 and one below 1 as 1. Nothing in the section measures its place.
- **The gap and the lines MUST follow the section's size.** With `NONE` the cells stand the section's grid gap apart. With `GRID` or `EDGE` each cell keeps that gap as its room on every side and draws its own line at its end and at its bottom, so a short last row keeps its lines at every width. `EDGE` adds a line around the outside, rounded with the theme's radius.
- **A section MAY take `inset`, the grid section MUST take it through `section`, and a reveal MUST play once** (`RULE.SUPPORT.SURFACE.282` · MUST · skill:spn-surface/design). `DSSectionContainer` takes no `reveal`, because a section holds no words of its own.
- **The grid section MUST add no surface, and each cell MUST hand its height to its feature** (`RULE.SUPPORT.SURFACE.530` · MUST · skill:spn-surface/design) (`RULE.SUPPORT.SURFACE.531` · MUST · skill:spn-surface/design). The section's fill is under the heading and each feature draws its own frame from its own `surface`. A row is as tall as its tallest feature, and every feature of the row fills its cell.
- **The columns of a grid MUST be one shape, `IDSGridColumns`, and a page MUST set them per screen class** (`RULE.SUPPORT.SURFACE.260` · MUST · skill:spn-surface/design) (`RULE.SUPPORT.SURFACE.271` · MUST · skill:spn-surface/design). `IDSGridColumns` holds `desktop`, `tablet` and `mobile`, all required. `IDSGrid` extends it and adds the optional `borderType` of `DSGridBorderType`, `NONE` where left out: a grid is its columns and its lines. Every other unit that draws a grid of cells holds the shape as an attribute, `gridColumns`, and never extends it, except `DSList`, which takes lines too and holds the whole `IDSGrid` as `grid`, each with its own default and range stated in `architecture-components.md`.

### The name of a unit and its props

- **The word before `Container` MUST name the box a unit draws, and the unit MUST be written in place of that box** (`RULE.SUPPORT.SURFACE.267` · MUST · skill:spn-surface/design). A `…PanelContainer` stands where a panel may, and a `…SectionContainer` where a section may, so a reader knows where a unit may stand from its name alone. `DSDataTablePanelContainer` and `DSFeatureGridSectionContainer` are the two.
- **There MUST be no `DSCardContainer`, no `DSFeatureContainer` and no `DSFeatureSectionContainer`** (`RULE.SUPPORT.SURFACE.263` · MUST · skill:spn-surface/design). A container exists to do a container's job: a card is a card, and a section already holds one feature.
- **A `…PanelContainer` MUST take its box's props as `panel`, and a `…SectionContainer` as `section`** (`RULE.SUPPORT.SURFACE.268` · MUST · skill:spn-surface/design). Each is a named interface that omits what the unit decides: the panel's parts, `unframed` where the layout in view decides it, and the test data.
- **A unit with many props MUST group them by owner, in named interfaces built from the owner's props, and its own props that belong together too.** The groups are `section`, `panel`, `heading`, `surface` and `grid`. A stack writes them with its own tools; the provider states the form.
- **The test data MUST stay on the unit, and the unit MUST hand it to the box's root.** `panel` and `section` omit `testData`, so a test finds the unit by its own name. A listing takes the whole panel, `size`, `surface`, `frames`, `divided` and `backAnchor` among its props, `fullPage` lives in `panel`, and the listing keeps `unframed` to itself.

### The card

The card, `DSCard`, stays a separate block beside the panel, taking `surface` and `frames`. The keys of its `surface` mean on a card what they mean on a panel. The theme holds a card look of its own, and a key the card leaves out takes it, never the panel's (`architecture-app.md`). A panel frames a part of a page. A card frames one thing: a record, an app, a file, a number. A card may hold a header, content and a footer of its own, so the parts do not tell the two apart. Level and purpose do: a card is one thing at `WIDGET`, among cards like it, pressed whole; a panel is a part of a page at `CONTAINER`, and the head of the page with `fullPage`.

| | A panel | A card |
| --- | --- | --- |
| It frames | a part of a page, with the title and the actions of that part | one thing |
| How many stand together | one for a part of the page | often many alike, side by side in a grid |
| Its parts | named places that the look reaches. `frames`, from the theme where the page names none, decide which parts the frame holds, and a part takes `flush` | the card's `frames` decide which parts its frame holds, all three where it names none, in every theme. A part pads itself, and a part takes `flush`, which drops that padding |
| Pressed as a whole | never | it may be, with `anchor`, and a pressed card is pressed whole, its flat header with it |
| Its level | `CONTAINER`, and `PAGE` with `fullPage` | `WIDGET` |
| A block inside it | reacts to a `flush` part | reacts to a `flush` part of the card, in the same way. A `flush` part of a panel around the card does not reach it, because a card starts a frame of its own |
| Its size | sets the density of every block inside it | a card's size sets its own spacing and reaches no block it holds |

- **A card MAY hold the parts `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`, and it MUST still frame one thing** (`RULE.SUPPORT.SURFACE.091` · MUST · skill:spn-surface/design). The parts give the one thing a title, a body and what closes it, such as its action. `divided` draws a line between each two parts. A part of a page that has a title, actions and data of its own stays a panel.
- **A part of a card MUST pad itself, from the size of the card, and `flush` on a part MUST drop that padding.** A page then writes no padding of its own around what a card holds. A part whose content reaches the edge of the card, such as a list or a picture, takes `flush`. A part takes no other prop.
- **A card's size MUST set its own spacing and reach no block it holds** (`RULE.SUPPORT.SURFACE.114` · MUST · skill:spn-surface/design). The size pads the card's parts and sets the gaps between them; a block inside, a button, a badge, a row's words and its chevron, takes the size of the place above the card, so a large card is roomier and what it holds is drawn as it is anywhere else. A row of a list and a title in a `flush` part still take the inset of the card's size at their sides, because that inset is spacing, so each starts where the card's own parts start their content. A card that states no size pads by the size it stands in.
- **A `flush` part of a card MUST say so to what it holds, as a `flush` part of a panel does.** The header, the content and the footer of a card all do this.
- **The card MUST take `surface` and `frames` for its look, and the paint of its frame MUST come from the theme's `component.card`** (`RULE.SUPPORT.SURFACE.261` · MUST · skill:spn-surface/design). `surface` is an `IDSFrameSurface`, and its keys mean on a card what they mean on a panel.
- **A card MAY take `frames`, `DSBoxPartType[]`, and its default MUST be `HEADER`, `CONTENT` and `FOOTER`** (`RULE.SUPPORT.SURFACE.262` · MUST · skill:spn-surface/design). Two listed parts next to each other share one frame, and a part not listed sits flat, half the card's gap from the frame beside it. A header takes the same room at a size whether it stands in the frame or flat, so two cards of one size side by side line their headers up. So an overview tile may stand its title flat above a framed body by listing `CONTENT` alone. `DSCardWidget` takes `frames` and hands them to its card.
- **A card and a panel MUST be told apart by level and purpose, and no unit MUST merge them** (`RULE.SUPPORT.SURFACE.263` · MUST · skill:spn-surface/design). There is no `DSCardContainer`, no `DSFeatureContainer` and no `DSFeatureSectionContainer`.
- **A card MAY sit inside the content of a panel.** An overview page MAY also use cards and no panel at all.

### The frames of a box

The components choose, and only the panel reads the theme for its frames. An app repeats a panel on every screen, so one choice in the theme keeps them alike. A card and a feature frame by their own `frames`, from a fixed default, because a website designs each section on purpose.

| Unit | `frames` where left out | Its paint comes from |
| --- | --- | --- |
| `DSPanelContainer` | `theme.container.panel.frames` | `theme.container.panel` |
| `DSCard` | `HEADER`, `CONTENT`, `FOOTER` | `theme.component.card` |
| `DSCardWidget` | handed to its `DSCard` | `theme.widget.card` for what it adds, its card's look for the paint |
| `DSFeature` | none | its own `surface` over the fixed feature default, never the theme |

- **Only `DSPanelContainer` MUST take its `frames` from the theme** (`RULE.SUPPORT.SURFACE.262` · MUST · skill:spn-surface/design). A card and a feature take theirs from the table above, and the theme holds `frames` for neither.
- **A feature MUST frame nothing unless the page asks, and it MUST take no `unframed`.** `frames` is `DSFeaturePartType[]`, empty where it is left out. There is no theme default to take a part out of.
- **The paint of every frame MUST be an `IDSFrameSurface` that went through `prepareFrameSurface`** (`RULE.SUPPORT.SURFACE.261` · MUST · skill:spn-surface/design). The resolver keeps the theme's value for a key the unit leaves undefined, which a spread of the theme and the prop would not.
- **One frame drawer MUST draw every frame.** It is internal, it draws an `IDSFrameSurface` as the fill, the border, the corners, the shadow and the surface the blocks inside read, and the panel, the card and the feature call it with the parts they frame.

## A frame is drawn once — 🔮

A frame is drawn once on any part of a page. The page follows that rule, and no code enforces it. A block never changes because of where it sits — it reacts to one thing only: sitting in a `flush` part, of a panel or of a card.

| A block in a `flush` part | What it does |
| --- | --- |
| `DSTable` · `DSCodeBlockView` · `DSAccordion` · `DSAccordionGroup` · `DSEmpty` | draws no border and no rounding of its own. Its own `bordered` still wins |
| `DSAccordion` · `DSDataTable` | keeps its own text off the edge of the frame |
| `DSList` · `DSDataTable` | draws no border on any page, so it has none to leave out, and takes no `bordered` |
| `DSItem` at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` | it takes the inset of its place at its two sides, so the title starts where the rows under it start their text. In a part that is not `flush` it takes none |
| `DSTabs` | the label of its first tab starts at the inset of its place, and its line still reaches the edge. Its panel takes that inset at its sides, and what the panel holds stands in a padded place |
| Any other block | nothing. It reaches the edge |
| A block inside the one that reacted | nothing. The setting stops at the block that used it |
| A card or an overlay, and each block inside it | nothing. A block that draws a frame of its own starts a new one. A `flush` part of the card itself says so again to what that part holds |

A block with `bordered` in a `flush` part keeps its border, because its own prop wins — the page then shows two lines, and the `UX` lens reports it as a finding. A popover draws its own surface; a block that opens a popover draws no surface of its own around it.

## A panel in use — 🔮

The three parts below are a panel in use. Each says how the same header, content and footer carry one of the app page kinds, the Pages of DASHBOARD and PORTAL in the Surface Catalogue. None adds a prop or a part to the panel.

### `RECORD_ENTRY` over the page

An entry is a form a person fills in to add or change something. A small or a medium entry opens over the page it belongs to. The person then keeps their place and sees what the entry is about. How much there is to enter decides what it opens as.

| The entry | At a desktop and a tablet | On a phone |
| --- | --- | --- |
| Short and fixed: one to four fields | a dialog over the page, `DSDialog`, 480 px | a sheet from the bottom of the screen |
| One column, with more fields or a part that grows: category fields, sections, a list of people | a sheet at the side, `DSSheet`, 480 px (extent `MD`), with the page still in view beside it | the full screen |
| Fields side by side: a form laid in two columns | a sheet at the side, `DSSheet`, 560 px (extent `LG`), asked with `columns` 2 on the entry overlay | the full screen |
| A customer or another large record: sections, a part that repeats, or records of its own inside it | a page of its own, as a large form | a page of its own |

- **A page chooses what an entry opens as by its size, from the table** (`RULE.SUPPORT.SURFACE.075` · GUIDE). A form with fields side by side asks for the wider sheet with the entry overlay's `columns?: 1 | 2`, `columns` 2. An entry that opens over its page lets the person keep their place, and a large entry has more to hold than a dialog or a sheet has room for.
- **A dialog on a phone MUST become a sheet from the bottom** (`RULE.SUPPORT.SURFACE.076` · MUST · skill:spn-surface/design). A phone has no room around a dialog. `DSDialog` already opens this way on a phone: it stands at the bottom of the screen and takes its full width. So a page writes nothing for it.
- **A medium entry MUST take the full screen on a phone.** No part of the page would stay in view beside it.
- **An entry is one panel, placed inside the dialog or the sheet** (`RULE.SUPPORT.SURFACE.077` · GUIDE). Its title and the action that closes it stand in its header. Its fields are its content. Its actions stand in its footer.
- **That the actions stand in the footer is proposed, and not yet confirmed.** The reason is that the panel already has a footer for the actions that end its work. A person then finds them in the same place in a dialog, in a sheet and on the full screen.

**What the unit does.** `DSSheet` does this by itself. It reads the device, and on a phone it takes the full screen, whatever side and extent the page gave it, with no scrim around it. So a page writes nothing for it. At a tablet and a desktop the sheet stands at its side, and takes at most 95% of the width of the screen.

### A large form

- **A large form is a page of its own, and the page is one panel** (`RULE.SUPPORT.SURFACE.078` · GUIDE). Its title stands in the header. Its sections are the parts of its content, one under another in one column, each under its own title. Its actions stand in its footer.
- **A section of a large form is not a panel of its own.** The sections are parts of one form that is saved once. A frame around each section, with actions under each, would say that each is saved by itself.
- **A list of the sections does not stand beside the form.** The app already has its navigation at the side, and a form of a few sections is read from top to bottom.
- **Fields that are short and belong together may share a row at a desktop, and each takes a row of its own on a phone.** Each field keeps its title above its control, as the rules of content of `standards-core.md` state.

### `RECORD_HOME` with its `GROUPS` case

Some pages hold things in groups: the fields of each record type, or the actions of each group of notifications. Such a page has two parts, the groups and the items of the chosen group, and each part is a panel.

| Screen class | What the page shows |
| --- | --- |
| A desktop | both parts. The groups stand at the left and stay in view, and the items of the chosen group stand at the right |
| A tablet and a phone | one part at a time. A person chooses a group, the items of that group are shown where the groups were, and the way back above their title returns to the groups |

- **Both parts are in view at a desktop only** (`RULE.SUPPORT.SURFACE.079` · MUST · skill:spn-surface/design). There a person goes from one group to the next without losing the list.
- **On a tablet and on a phone the items take the place of the groups.** The two parts do not fit side by side there.
- **The part that holds the groups MAY be narrow, and a named choice MUST say so** (`RULE.SUPPORT.SURFACE.119` · MUST · skill:spn-surface/design). Where a group is read by its name alone, the items need most of the width. A unit that places the two parts keeps its usual width for the groups where the page chooses none, and it offers a narrower one by name. A page **MUST NOT** write a width of its own. The choice holds at a desktop, where both parts are in view.
- On the web the swap also changes the address, as the web's app page kinds state under *On the web: the address of a screen*.
- **Each part is shown by what its own data asks for: a list, a table, a data table, or a view of one thing** (`RULE.SUPPORT.SURFACE.049` · GUIDE). The groups and the items seldom hold data of the same shape.
- **A set of groups that can be added to is a list, and not a row of tabs** (`RULE.SUPPORT.SURFACE.080` · GUIDE). A row of tabs is safe only where the set cannot grow past the width of the page. A list takes any number of groups.
- **Many groups that a person searches are a data table in its `LIST` layout** (`RULE.SUPPORT.SURFACE.069` · GUIDE), stated in `architecture-components.md`. A group is read by its name, as a line, and the groups stand in a narrow part of the page.

Where the groups are few and fixed, the page needs no swap. Each group is a panel of its own, one under another on one page, and nothing is hidden.

**What the units do.** The app page kinds draw the way back in the header of the panel that holds the items: a page gives the header the address to go back to and its words, and the header draws the row above its title line. While the items stand alone, that row is the way back to the groups.

**The foundation names no core unit that places the two parts** (`RULE.SUPPORT.SURFACE.099` · MUST · skill:spn-surface/design). The rules above say what a person sees, and they hold whatever places the parts. The web stack has page frames of its own that place them, `DSPageFrameListDetail` and `DSPageFrameGroups`: every part at a desktop, and one at a time on a phone. Their widths are the named choice for the width of the groups. `architecture-components.md` states them and `providers.md` names their folder.

### Two containers side by side

- **A page MUST set at most two containers side by side, one taking the larger share** (`RULE.SUPPORT.SURFACE.625` · MUST · skill:spn-surface/design). A third box beside them splits a person's attention three ways and leaves each part too narrow to work in. What a part is follows its job, never its size:

  | The part's job | What it is | Today's example |
  | --- | --- | --- |
  | a person moves between sets, and works in none of them | navigation, drawn flat | a mailbox's folders, a `DSNavList` in the groups of `DSPageFrameGroups` |
  | a person works in it, reads it, or chooses one thing from it | a container | the list and the detail of `DSPageFrameListDetail`, each a `DSPanelContainer` |
  | it holds small facts about the one record the page is about | widgets | the aside of `DSPageFrameAside`, `DSCardWidget`s one under another |

- **A part in a page frame's slot fills it.** In a frame with `fullHeight` a panel scrolls its own content and keeps its header and footer in view, and in a frame with `attached` it squares the corners it touches and the line between two panels is drawn once (`RULE.SUPPORT.SURFACE.623` · MUST · skill:spn-surface/design). A card widget stands apart, so a slot of cards is never attached.

## Boundary

This ref states what frames a part of a page, what that frame looks like, and what a block does inside it. It stops at the edge of the part. It does not state what frames the whole page — that is `architecture-layouts.md`. It does not state where the app's choice for the surface and for `frames` comes from, or how `size` reaches a block — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.APPS.147` | the parts of a panel, the props of its look, and what it refuses |
| `RULE.SUPPORT.SURFACE.231` | the framing unit is `DSPanelContainer`, `DSDataTablePanelContainer` is built on it, and a level is a position and not a unit |
| `RULE.SUPPORT.SURFACE.243` | a section of a page is `DSSectionContainer`, the one unit that gives a part of a page its fill and its room, and it frames nothing |
| `RULE.SUPPORT.SURFACE.259` | a grid of features under a heading is `DSFeatureGridSectionContainer`, which draws a section from `section`, takes a `heading` and an optional `grid`, leaves out `flush`, hands the cells no level and follows the screen class for its columns (that a grid section is for things of their own is advice) |
| `RULE.SUPPORT.SURFACE.260` | how the cells of a grid stand is `IDSGrid`, the columns required and the lines `NONE` where left out, and any unit that draws a grid of cells takes it whole |
| `RULE.SUPPORT.SURFACE.247` | a section takes its room above and below from its size, and hands that size to what it holds |
| `RULE.SUPPORT.SURFACE.254` | a section reaches the edges of its place; that a page does not put it in a panel, a card, an overlay or the nav column is advice |
| `RULE.SUPPORT.SURFACE.415` | a section's fill may be a gradient of its own colour, in the one fill shape every surface takes |
| `RULE.SUPPORT.SURFACE.416` | sections are told apart by a change of fill, never by a line |
| `RULE.SUPPORT.SURFACE.261` | the paint of a frame is the one prop `surface`, an `IDSFrameSurface`, every frame is drawn by one drawer, and one resolver keeps the theme's value for a key left out |
| `RULE.SUPPORT.SURFACE.282` | a raised frame takes `elevation`, a section takes `inset`, and the grid section takes `reveal`, which plays once |
| `RULE.SUPPORT.SURFACE.293` | what a section holds takes its depth from what it does for the visitor, and a section never frames itself. It is advice |
| `RULE.SUPPORT.SURFACE.262` | only the panel takes its frames from the theme, a card takes `frames` and defaults to all three parts, and a feature frames nothing by default |
| `RULE.SUPPORT.SURFACE.263` | a card and a panel are told apart by level and purpose, and no card, feature or feature section container exists |
| `RULE.SUPPORT.SURFACE.266` | the three parts of any box are `DSBoxPartType` |
| `RULE.SUPPORT.SURFACE.267` | the word before `Container` names the box a unit draws and is written in place of |
| `RULE.SUPPORT.SURFACE.268` | a `…PanelContainer` takes its box's props as `panel`, a `…SectionContainer` as `section`, and a unit groups its props by owner |
| `RULE.SUPPORT.SURFACE.271` | the columns of a grid follow the screen class, never a measured width |
| `RULE.SUPPORT.SURFACE.163` | a panel and a card take a `color` and a `strength`, `BASE` by default |
| `RULE.SUPPORT.SURFACE.092` | `unframed` names the parts that take no frame, whatever `frames` and the theme give |
| `RULE.SUPPORT.APPS.162` | inside a bordered frame, a line divides each two parts the frame holds |
| `RULE.SUPPORT.APPS.155` | a block never changes by where it sits; that the page decides what fills a part, with `flush`, is advice |
| `RULE.SUPPORT.APPS.148` | the card stays a separate block beside the panel, and takes `surface` and `frames` |
| `RULE.SUPPORT.SURFACE.084` | the foundation defines no block for a row or a grid, and a stack may provide one |
| `RULE.SUPPORT.SURFACE.091` | a card may hold a header, content and a footer as parts, and still frames one thing |
| `RULE.SUPPORT.APPS.149` | a frame is drawn once, and which blocks pass a size and the frame setting on |
| `RULE.SUPPORT.SURFACE.074` | what a page puts in the header, the content and the footer of a panel. It is advice |
| `RULE.SUPPORT.SURFACE.095` | where the actions that close the work of an entry stand, and in what order. It is advice |
| `RULE.SUPPORT.SURFACE.114` | a card's size sets its own spacing and reaches no block it holds, which takes the size of the place above |
| `RULE.SUPPORT.SURFACE.116` | a page uses one panel for each thing a person reads or saves as a whole |
| `RULE.SUPPORT.SURFACE.107` | the level a box gives the title in its header: `CONTAINER` for a panel, `PAGE` for a listing that is the page, `WIDGET` for a card |
| `RULE.SUPPORT.SURFACE.179` | a panel that is the whole page says so with the boolean `fullPage`, and its header, content and footer then take the level `PAGE` as their place |
| `RULE.SUPPORT.SURFACE.108` | the way back of a header is a row of its own above the title line, the row of `DSPageHead` |
| `RULE.SUPPORT.SURFACE.120` | a page that holds several panels has its head above them, outside any frame, with its way back, and writes nothing by hand for it. It is advice |
| `RULE.SUPPORT.SURFACE.119` | the part that holds the groups may be narrow, by a named choice and never by a width the page writes. It is a MAY |
| `RULE.SUPPORT.SURFACE.075` | an entry opens as a dialog, a sheet or a page of its own, by its size. The two numbers are proposed. It is advice |
| `RULE.SUPPORT.SURFACE.076` | a dialog on a phone becomes a sheet from the bottom |
| `RULE.SUPPORT.SURFACE.077` | an entry is one panel, placed inside the dialog or the sheet. That its actions stand in the footer is proposed. It is advice |
| `RULE.SUPPORT.SURFACE.078` | a large form is a page of its own and one panel, with no panel for each section. It is advice |
| `RULE.SUPPORT.SURFACE.079` | the parts of `RECORD_HOME` with its `GROUPS` case are both in view at a desktop only, and the items take the place of the groups on a tablet and a phone. It is advice |
| `RULE.SUPPORT.SURFACE.313` | `flush` on a section means it draws no room of its own on any side, as it means on a card part, a panel part and a list |
| `RULE.SUPPORT.SURFACE.080` | a set of groups that can be added to is a list, and not a row of tabs. It is advice |
| `RULE.SUPPORT.SURFACE.049` | each part of a page is shown by what its own data asks for. It is advice |
| `RULE.SUPPORT.SURFACE.069` | many groups a person searches are a data table in its `LIST` layout. It is advice |
| `RULE.SUPPORT.SURFACE.312` | the unit that frames a part of a page is the panel, where the book's container chapter calls it a container |
| `RULE.SUPPORT.SURFACE.178` | every box tells its level, its part and `flush` to what each part holds, and an action takes its size and its look from its place: the main action solid in the head of a page and in a footer, quiet in a panel's header, outline in a card's, subtle in a group's head |
| `RULE.SUPPORT.SURFACE.367` | the footer of a panel takes `sticky`, which keeps it in view |
| `RULE.SUPPORT.SURFACE.612` | a settings page keeps the actions that cannot be undone in a danger zone, its last titled panel, set apart, each action behind a confirm |
| `RULE.SUPPORT.SURFACE.625` | a page sets at most two containers side by side, one taking the larger share; a column a person moves between sets in is navigation, drawn flat; a part a person works in, reads or chooses one thing from is a container; small facts about the one record are widgets; and a part is placed by its job, never by its size |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
