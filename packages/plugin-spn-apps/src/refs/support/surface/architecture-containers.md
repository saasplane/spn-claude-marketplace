<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/08-architecture-containers.md",
      "seen": "9d43ebfd"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/08-architecture-containers/",
      "seen": "df788688"
    }
  ]
}
-->

# Containers — How a Part of a Page Is Framed

Source of truth: the foundation's Containers construct (`docs/02-constructs/02-support/03-surface/08-architecture-containers.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/08-architecture-containers/`). Containers is the eighth of thirteen Surface constructs.

Read this before you frame a part of a page, or before you draw or build the container on a new stack.

## Terms

| Term | What it means |
| --- | --- |
| Container | `DSContainer` — an optional block that frames a part of a page as a header, content and a footer |
| Part | `DSContainer.Header` · `DSContainer.Content` · `DSContainer.Footer` — a named place in a container. It holds anything, and takes only `flush` |
| Frame | `frames` — the drawn edge and fill of a container. A frame is drawn once on any part of a page |
| Container frame | `DSContainerFrameType` — the closed set that names which parts a frame holds |
| Inset | the space a part keeps between the frame and what it holds |
| Flush | `flush` — the one word on a part that turns its inset off, because its content reaches the edge of the frame |
| Card | `DSCard` — the block that frames one thing. It stays beside the container |

## The parts — 🔮

A container is an optional block. A page uses one when a part of it has a header, content and a footer as one unit.

| Part | Named | How many | What it takes |
| --- | --- | --- | --- |
| Header | `DSContainer.Header` | none or one | `flush`, and no other prop |
| Content | `DSContainer.Content` | one or more | `flush`, and no other prop. Several join in one frame |
| Footer | `DSContainer.Footer` | none or one | `flush`, and no other prop |

The parts sit in one order: the header, then the content, then the footer. The header places its first block at the start and its last at the end. The footer starts its blocks at the start edge. A part holds anything: a `div`, a text, a block or a page's own component. The look of a container is four props, and a fifth, `unframed`, that holds a part out of the frame.

### What a page puts in each part

What a page puts in each part follows one form. A person then finds the name and the actions of every framed part in the same place.

| Part | What a page puts in it | Why |
| --- | --- | --- |
| Header | the title of the container at its start, one line under the title where the part needs one, and the actions of the container at its end. The header stands above the outline | a title above the outline reads as the name of the part, and the outline then holds only what that name is about |
| Content | one part, or several parts each under its own title. The action of one part stands at the end of that part's title | a person sees which part an action changes, because the action stands on the title of that part and not in the header |
| Footer | what closes the work of the container, such as the two actions that save an entry or leave it. It stands inside the outline, under a line | the actions that end the work are met last, after everything they act on |

- **A page MUST put the title and the actions of a container in its header, and what closes its work in its footer** (`RD.SUPPORT.SURFACE.074`). The header places its first block at the start and its last block at the end, so the title and the actions need no placing by the page.
- **The action of one part of the content MUST stand at the end of that part's title, and never in the header.** The header holds the actions of the whole container.
- **A page uses one container for each thing a person reads or saves as a whole** (`RD.SUPPORT.SURFACE.116`). The sections of that thing are its content parts, and two things that are read or saved apart are two containers. `standards-patterns.md` states the rule once, for every pattern.
- **A container MUST give the title in its header the level `CONTAINER`, and a listing that is the page MUST give it `PAGE`** (`RD.SUPPORT.SURFACE.107`). The title of a header is an item line. A title the page gives no level takes the level of its box: `WIDGET` in a card, `GROUP` in the head of a part of a card widget, and `CONTAINER` in a dialog, a sheet or a drawer, as `architecture-components.md` states for each box. A container that takes an item line as its header takes `pageLevel` and passes it on to that item line. So every page of an app opens with the same head, and only its body differs.
- **The back action of a header MUST stand level with the line of the title** (`RD.SUPPORT.SURFACE.108`). `DSContainer.Header` draws a back action before its title where the page gives it an address to go back to. That action does not stand level with the middle of the title and the lines under it together. A person then reads the way back and the name of the page on one line.
- **A page that holds several containers MUST put its head above them, outside any frame, with its way back** (`RD.SUPPORT.SURFACE.120`). A page with one container puts its head in the header of that container. A page with several has no one container that its head belongs to, so the head stands alone above them all. It is an item line at the level `PAGE`, with the way back before its title, level with the line of the title.
- **The design system MUST draw that head and its way back, and a page MUST write nothing by hand for them.** A page gives the title and the address to go back to. It writes no row, no back button and no padding of its own.
- **The actions that close the work of an entry MUST stand in one place and in one order** (`RD.SUPPORT.SURFACE.095`). Over the page, in a dialog, a sheet, a drawer or a popover, they stand at the end of the footer: the action that leaves the work first, and the main action last, at the very end. In an entry that is a page of its own they stand at the start of the footer, the main action first, because the fields of a page line up at its start. A value changed in place, as in a row of a data table, keeps its two actions beside the box, the one that saves first, because a person reaches them in the order of reading. The main action MUST be a solid button and the action that leaves an outline button, in both places.
- **A header above the outline is the value of `frames` that lists `CONTENT` and `FOOTER` and leaves `HEADER` out.** The page patterns are drawn in that form. The look is still the theme's to choose: a theme that lists the header too moves the outline, and no page changes.

Here is how the parts serve the pages most apps have.

| A page | Header | Content | Footer |
| --- | --- | --- | --- |
| A listing | the page title, a line under it where one is needed, and actions at the end | a filter bar where the listing has one, and a data table in a `flush` part | the paging of the records |
| A form | the title of the form | its sections, one under another, each under its own title | the actions that save the form or leave it |
| A dashboard | flat | raised, holding widgets that show numbers | none |

**What the units do.** A listing's paging in the footer of the container is the form the page patterns are drawn in. `DSDataTableWidget` hands its paging to a place the page gives it. The page puts an element in `DSContainer.Footer` and names it as `settings.pagination.footerElement`, and the table draws its record count and its pager there. The table is handed a place and knows no container, because a widget is a layer before the container. Where a page gives no place, the table draws its paging in a footer of its own, at the foot of the records.

## The look — 🔮

| Prop | Values | What it decides |
| --- | --- | --- |
| `frames` | a list: any of `HEADER`, `CONTENT`, `FOOTER` | which parts the frame holds. A part that is not listed sits flat on the page |
| `color` | `BASE`, `DEFAULT` or `PRIMARY` | the colour of the fill of the frame, as the shell and the content take it. `BASE` is the default, and it leaves the fill to `raised` |
| `strength` | `SUBTLE`, `QUIET` or `SOLID` | how strong the fill of a hue is. `BASE` takes none |
| `raised` | yes or no | whether the frame is filled with the raised surface and lifted |
| `bordered` | yes or no | whether the frame has a border. Inside a bordered frame, a line divides each two parts the frame holds. Blocks that need no line between them sit in one content part |
| `rounded` | yes or no | whether the corners of the frame are rounded |
| `unframed` | a list: any of `HEADER`, `CONTENT`, `FOOTER` | the parts that take no frame, whatever `frames` and the theme give. A part listed here sits flat on the page |

- **The look of a container MUST be declared by these props, and by nothing else** (`RD.SUPPORT.SURFACE.092`). Each of the first six is a choice that does not depend on the others (`RD.SUPPORT.SURFACE.163`). The theme holds the app's default for each, and a container may set its own.
- **A part listed in `unframed` MUST take no frame, whatever `frames` and the theme give.** A page that sets `frames` takes the whole choice from the theme. A page that sets `unframed` takes one part out and leaves the rest to the theme. So a theme can still change the look of that container, and the named part stays flat in every theme.
- **`unframed` is for a part that no theme should frame on this page.** One such part is a header that is the header of the page, which the rules of content keep out of a frame (`standards-core.md`). A page that wants a look sets `frames`, or leaves it to the theme. The book states `unframed` before the web builds it.

A container also takes `size`, which sets the density of every block inside it (`architecture-app.md`).

## A part and its inset — 🔮

A part insets its content, and the page decides what fills a part.

| The part | Its inset |
| --- | --- |
| In the frame, with nothing written | the padding of the container's size step, once around everything in it |
| In the frame, with `flush` | none |
| Not in the frame: the container is flat, or `frames` does not list the part | none, so `flush` changes nothing |

Write `flush` on a part whose content reaches the edge of the frame, such as a table. Let `flush` describe the content, and never the look. A theme can change the frame from flat to bordered to raised, and no page changes.

- **A part MUST NOT set the gap between its blocks.** The page writes that gap, from the scale.
- **The foundation defines no block for a row or a grid. A stack MAY provide one** (`RD.SUPPORT.SURFACE.084`). Such a block is the stack's own unit, made to keep building simple, and its stack states it. A page on a stack that provides none writes the row or the grid itself. Either way the gap comes from the scale, and readings still stand as the rules of content ask.

| Space | Owner |
| --- | --- |
| The frame | the container |
| The inset of a part | the part |
| The gap between two blocks in a part | the page |
| A block's border | the block |
| The gap between two containers | the page |

A container takes no background color, no padding value, no margin, no container inside it, and no prop named `variant`. It takes no child that is not one of its parts.

### The card

The card, `DSCard`, stays a separate block beside the container, taking `color`, `strength`, `raised`, `bordered` and `rounded`. They mean on a card what they mean on a container. The theme holds a card look of its own. Where the app chose no card value, the theme takes the container's choice, else the default (`architecture-app.md`). A container frames a part of a page. A card frames one thing: a record, an app, a file, a number. A card may hold a header, content and a footer of its own, so the parts do not tell the two apart. These do.

| | A container | A card |
| --- | --- | --- |
| It frames | a part of a page, with the title and the actions of that part | one thing |
| How many stand together | one for a part of the page | often many alike, side by side in a grid |
| Its parts | named places that the look reaches. `frames` and the theme decide which parts the frame holds, and a part takes `flush` | all inside the one frame, in every theme. A part pads itself, and a part takes `flush`, which drops that padding |
| Pressed as a whole | never | it may be, with `anchor` |
| A block inside it | reacts to a `flush` part | reacts to a `flush` part of the card, in the same way. A `flush` part of a container around the card does not reach it, because a card starts a frame of its own |
| Its size | sets the density of every block inside it | the same. A card hands its size to what it holds |

- **A card MAY hold the parts `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`, and it MUST still frame one thing** (`RD.SUPPORT.SURFACE.091`). The parts give the one thing a title, a body and what closes it, such as its action. `divided` draws a line between each two parts. A part of a page that has a title, actions and data of its own stays a container.
- **A part of a card MUST pad itself, from the size of the card, and `flush` on a part MUST drop that padding.** A page then writes no padding of its own around what a card holds. A part whose content reaches the edge of the card, such as a list or a picture, takes `flush`. A part takes no other prop.
- **A card MUST hand its size to what it holds, as a container does** (`RD.SUPPORT.SURFACE.114`). A block inside a card that reads the size of its place reads the size of the card. An item line with `bleed` and a title in a `flush` part are such blocks: each takes the inset of the card's size, so it starts where the card's own parts start their content. A card that states no size hands on the size it stands in.
- **A `flush` part of a card MUST say so to what it holds, as a `flush` part of a container does.** The header, the content and the footer of a card all do this.
- **A card MAY sit inside the content of a container.** A dashboard MAY also use cards and no container at all.

## A frame is drawn once — 🔮

A frame is drawn once on any part of a page. The page follows that rule, and no code enforces it. A block never changes because of where it sits — it reacts to one thing only: sitting in a `flush` part, of a container or of a card.

| A block in a `flush` part | What it does |
| --- | --- |
| `DSTable` · `DSCodeBlockView` · `DSAccordion` · `DSAccordionGroup` · `DSEmpty` | draws no border and no rounding of its own. Its own `bordered` still wins |
| `DSAccordion` · `DSDataTableWidget` | keeps its own text off the edge of the frame |
| `DSList` · `DSDataTableWidget` | draws no border on any page, so it has none to leave out, and takes no `bordered` |
| `DSItem` at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` | it takes the inset of its place at its two sides, so the title starts where the rows under it start their text. In a part that is not `flush` it takes none |
| `DSTabs` | the label of its first tab starts at the inset of its place, and its line still reaches the edge. Its panel takes that inset at its sides, and what the panel holds stands in a padded place |
| Any other block | nothing. It reaches the edge |
| A block inside the one that reacted | nothing. The setting stops at the block that used it |
| A card or an overlay, and each block inside it | nothing. A block that draws a frame of its own starts a new one. A `flush` part of the card itself says so again to what that part holds |

A block with `bordered` in a `flush` part keeps its border, because its own prop wins — the page then shows two lines, and the `UX` lens reports it as a finding. A popover draws its own surface; a block that opens a popover draws no surface of its own around it.

## A container in use — 🔮

The three parts below are a container in use. Each says how the same header, content and footer carry one of the page patterns of `standards-patterns.md`. None adds a prop or a part to the container.

### An entry over the page

An entry is a form a person fills in to add or change something. A small or a medium entry opens over the page it belongs to. The person then keeps their place and sees what the entry is about. How much there is to enter decides what it opens as.

| The entry | At a desktop and a tablet | On a phone |
| --- | --- | --- |
| Small: up to about five fields in one group | a dialog over the page, `DSDialog` | a sheet from the bottom of the screen |
| Medium: one column with a few groups, up to about a dozen fields | a sheet at the side, `DSSheet`, with the page still in view beside it | the full screen |
| Large: sections, a part that repeats, or records of its own inside it | a page of its own, as a large form | a page of its own |

- **A page MUST choose what an entry opens as by its size, from the table** (`RD.SUPPORT.SURFACE.075`). A large entry has more to hold than a dialog or a sheet has room for. The two numbers, about five and about a dozen, are proposed and not yet confirmed.
- **A dialog on a phone MUST become a sheet from the bottom** (`RD.SUPPORT.SURFACE.076`). A phone has no room around a dialog. `DSDialog` already opens this way on a phone: it stands at the bottom of the screen and takes its full width. So a page writes nothing for it.
- **A medium entry MUST take the full screen on a phone.** No part of the page would stay in view beside it.
- **An entry MUST be one container, placed inside the dialog or the sheet** (`RD.SUPPORT.SURFACE.077`). Its title and the action that closes it stand in its header. Its fields are its content. Its actions stand in its footer.
- **That the actions stand in the footer is proposed, and not yet confirmed.** The reason is that the container already has a footer for the actions that end its work. A person then finds them in the same place in a dialog, in a sheet and on the full screen.

**What the unit does.** `DSSheet` does this by itself. It reads the device, and on a phone it takes the full screen, whatever side and extent the page gave it, with no scrim around it. So a page writes nothing for it. At a tablet and a desktop the sheet stands at its side, and takes at most 95% of the width of the screen.

### A large form

- **A large form MUST be a page of its own, and the page MUST be one container** (`RD.SUPPORT.SURFACE.078`). Its title stands in the header. Its sections are the parts of its content, one under another in one column, each under its own title. Its actions stand in its footer.
- **A section of a large form MUST NOT be a container of its own.** The sections are parts of one form that is saved once. A frame around each section, with actions under each, would say that each is saved by itself.
- **A list of the sections MUST NOT stand beside the form.** The app already has its navigation at the side, and a form of a few sections is read from top to bottom.
- **Fields that are short and belong together MAY share a row at a desktop, and each MUST take a row of its own on a phone.** Each field keeps its title above its control, as the rules of content of `standards-core.md` state.

### Groups and their items

Some pages hold things in groups: the fields of each record type, or the actions of each group of notifications. Such a page has two parts, the groups and the items of the chosen group, and each part is a container.

| Screen class | What the page shows |
| --- | --- |
| A desktop | both parts. The groups stand at the left and stay in view, and the items of the chosen group stand at the right |
| A tablet and a phone | one part at a time. A person chooses a group, the items of that group are shown where the groups were, and a back action returns to the groups |

- **Both parts MUST be in view at a desktop only** (`RD.SUPPORT.SURFACE.079`). There a person goes from one group to the next without losing the list.
- **On a tablet and on a phone the items MUST take the place of the groups.** The two parts do not fit side by side there.
- **The part that holds the groups MAY be narrow, and a named choice MUST say so** (`RD.SUPPORT.SURFACE.119`). Where a group is read by its name alone, the items need most of the width. A unit that places the two parts keeps its usual width for the groups where the page chooses none, and it offers a narrower one by name. A page **MUST NOT** write a width of its own. The choice holds at a desktop, where both parts are in view.
- **The swap MUST change the address.** It happens in place, and the address still changes to name the chosen group. So the back of the browser does the same as the back action. A reload stays on the chosen group, and a link to one group opens that group on every screen.
- **Each part MUST be shown by what its own data asks for: a list, a table, a data table, or a view of one thing** (`RD.SUPPORT.SURFACE.049`). The groups and the items seldom hold data of the same shape.
- **A set of groups that can be added to MUST be a list, and never a row of tabs** (`RD.SUPPORT.SURFACE.080`). A row of tabs is safe only where the set cannot grow past the width of the page. A list takes any number of groups.
- **Many groups that a person searches MUST be a data table in its `LIST` layout** (`RD.SUPPORT.SURFACE.069`, stated in `architecture-widgets.md`). A group is read by its name, as a line, and the groups stand in a narrow part of the page.

Where the groups are few and fixed, the page needs no swap. Each group is a container of its own, one under another on one page, and nothing is hidden.

**What the units do.** The page patterns draw the back action on the title line of the container that holds the items. `DSContainer.Header` has a small place for it before the title: a page gives the header the address to go back to, and the header draws a back action there, in one group with its first block, so the title stays at the start and the last block at the end. The back action stands level with the line of the title. While the items stand alone, that back action is the way back to the groups.

**The foundation names no core unit that places the two parts** (`RD.SUPPORT.SURFACE.099`). The rules above say what a person sees, and they hold whatever places the parts. The web stack has a unit of its own that places them, `DSListDetailWidget`: both parts at a desktop, and one at a time on a tablet and a phone. Its `listWidth` is the named choice for the width of the groups. `providers.md` names it and its values.

## Boundary

This ref states what frames a part of a page, what that frame looks like, and what a block does inside it. It stops at the edge of the part. It does not state what frames the whole page — that is `architecture-layouts.md`. It does not state where the app's choice for `raised`, `bordered`, `rounded` and `frames` comes from, or how `size` reaches a block — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.147` | the parts of a container, the six props of its look, and what it refuses |
| `RD.SUPPORT.SURFACE.163` | a container and a card take a `color` and a `strength`, `BASE` by default |
| `RD.SUPPORT.SURFACE.092` | `unframed` names the parts that take no frame, whatever `frames` and the theme give |
| `RD.SUPPORT.APPS.162` | inside a bordered frame, a line divides each two parts the frame holds |
| `RD.SUPPORT.APPS.155` | the page decides what fills a part, with `flush`, and a block never changes by where it sits |
| `RD.SUPPORT.APPS.148` | the card stays a separate block beside the container |
| `RD.SUPPORT.SURFACE.084` | the foundation defines no block for a row or a grid, and a stack may provide one |
| `RD.SUPPORT.SURFACE.091` | a card may hold a header, content and a footer as parts, and still frames one thing |
| `RD.SUPPORT.APPS.149` | a frame is drawn once, and which blocks pass a size and the frame setting on |
| `RD.SUPPORT.SURFACE.074` | what a page puts in the header, the content and the footer of a container |
| `RD.SUPPORT.SURFACE.095` | where the actions that close the work of an entry stand, and in what order |
| `RD.SUPPORT.SURFACE.114` | a card hands its size to what it holds, as a container does |
| `RD.SUPPORT.SURFACE.116` | a page uses one container for each thing a person reads or saves as a whole |
| `RD.SUPPORT.SURFACE.107` | the level a box gives the title in its header: `CONTAINER` for a container, `PAGE` for a listing that is the page, `WIDGET` for a card |
| `RD.SUPPORT.SURFACE.108` | the back action of a header stands level with the line of the title |
| `RD.SUPPORT.SURFACE.120` | a page that holds several containers has its head above them, outside any frame, with its way back, and writes nothing by hand for it |
| `RD.SUPPORT.SURFACE.119` | the part that holds the groups may be narrow, by a named choice and never by a width the page writes. It is a MAY |
| `RD.SUPPORT.SURFACE.075` | an entry opens as a dialog, a sheet or a page of its own, by its size. The two numbers are proposed |
| `RD.SUPPORT.SURFACE.076` | a dialog on a phone becomes a sheet from the bottom |
| `RD.SUPPORT.SURFACE.077` | an entry is one container, placed inside the dialog or the sheet. That its actions stand in the footer is proposed |
| `RD.SUPPORT.SURFACE.078` | a large form is a page of its own and one container, with no container for each section |
| `RD.SUPPORT.SURFACE.079` | groups and their items are both in view at a desktop only, and the swap changes the address |
| `RD.SUPPORT.SURFACE.080` | a set of groups that can be added to is a list, and never a row of tabs |
| `RD.SUPPORT.SURFACE.049` | each part of a page is shown by what its own data asks for |
| `RD.SUPPORT.SURFACE.069` | many groups a person searches are a data table in its `LIST` layout |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
