<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The masthead, and the opening",
      "seen": "25162f20"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The blocks — what a page reaches for instead of prose",
      "seen": "f7b7dabf"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The figures — what sits inside a block, and the closed set of them",
      "seen": "248805fb"
    }
  ]
}
-->
# Blocks and figures, in the spelling you actually write

**Source of truth:** the foundation's `04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md` — *The masthead, and the opening*, *The blocks* and *The figures*. This file restates them for an agent that ships without the book beside it; where the two disagree, the book wins.

**You write markdown.** `docs page write` produces the HTML, and the shared stylesheet that every page
links supplies every border, background and colour. That gives a block the same form on every page
and in both themes, so you never add styling to a page. So this file is the whole vocabulary you
need: what a block is *typed as* in a seat file. The HTML blocks template is the **rendered**
reference a person opens to see what a block looks like. It is much larger than this file and tells
you nothing you can type, so do not open it (Q135, 2026-09-22).

The rules behind this file are `05-artifacts.md § The blocks` and `§ The figures`. When the two
disagree, the chapter wins and this file is wrong.

## The masthead comes first, and it is three levels

**A page opens on its Title, its Subtitle and its Description, and nothing else sits above the
first heading.** In a construct seat you type them in three places:

| Level | What you type in the seat | What it holds |
| --- | --- | --- |
| **Title** | the `# Title` line, matching the block's `title` | the construct's own name, in full |
| **Subtitle** | a `subtitle` field in the `spn:doc` block. Never a paragraph in the body, because `docs page` reads the first lead paragraph as the Description | one plain sentence: the construct's one-line promise |
| **Description** | the first paragraph after the tag line, and only one | what it is · why read this page · at most two short sentences on how the page runs |

**All three are plain language** (`RD.DEVEX.WORKSPACE.182`, `RD.DEVEX.WORKSPACE.187`): everyday
words, one idea a sentence, no numbers, no slogan, no figure of speech, and no book word the same
sentence does not explain. The block's `summary` is the Description's first sentence, word for word.
**Show a new Title or Subtitle to the developer before you write it.** The only exemption is the
foundation hub's Title and Subtitle, fixed by `RD.DEVEX.WORKSPACE.143`. What each level holds on the
other page kinds is [`doc-sets.md`](doc-sets.md) § Every page opens on a masthead of three levels.

## Most of a page is not a block

Paragraphs, lists, numbered steps and subheadings are what a section is made of. Write them plainly
and label them as nothing at all. **A section holds none, one or several blocks**, and nothing
declares *the* block of a section.

## What you type

| What you are writing | What you type |
| --- | --- |
| an explanation, an argument, a part, the Description | a paragraph. Nothing else |
| a part, a sub-part | `### Title`, `#### Title` — `###` through `#####` all render |
| a list where order does not matter | `- item` or `* item` |
| a list where the order **is** the content | `1. item` — numbered lists render as numbered lists |
| a rule somebody has to follow (`MUST`) | `> the rule, in one sentence` — a blockquote becomes the accent callout |
| a record, a comparison, a glossary | a markdown table. A table already arrives as a bordered card, so it needs nothing added |
| a literal — a contract, a manifest, a command, its output (`CODE`) | a fenced block **tagged with its language** |
| a hierarchy easier read than drawn (`TREE`) | a fenced block, untagged |
| today against after (`DIFF`) | a fenced block tagged `diff`. **An approach page or a preview only**, since a construct states current truth |
| a shape (a figure) | a fenced block tagged `dg`, holding strict JSON |
| a note to yourself, never rendered | `<!-- … -->`, on one line or many |

**A fenced block with no language is never coloured**, so tag it. The page holds the code plain, and
the shared script colours a tagged block when the page opens. The script knows seven languages:
`ts` · `json` · `yaml` · `sql` · `sh` · `diff` · `md`.

**One rule for figures, and it is not optional**: every figure has a **sentence before it** saying
what you are looking at and a **caption after it** saying what to notice. A figure with neither is
decoration.

## A code block that is one file stands in a `FILE` frame

**A code block that shows one file, or a part of one, is framed, with the file's path from its
repository's root as the frame's title and its language as a small badge at the end.** You know which
file you are reading before the first line, and a path in a line above a block is read as prose and
skipped. A `DIFF` always shows one file, so it always stands in one. A block that is no one file — a
command, a sample of output, a shape written out — stays a `CODE` block, with no frame.

The frame is HTML, on a hand-written page (an approach page or a preview): a `figure.sds-file` holding
a `figcaption` with its `.sds-file-path` and its `.sds-file-lang`, then the `pre`. The code stays plain
in the file, and the shared script colours it. It is never a sample framed in the page.

## What has no markdown spelling yet

`CATALOG` · `CARDS` · `NEXT` · `FILE` · the `PROSE` panel are named in the chapter and **the renderer produces
none of them** — there is no markdown that asks for one, and `docs page write` adds no navigation. They
exist today only as hand-written HTML in the templates. Until that changes, write a table for a
`CATALOG` and ordinary paragraphs where you wanted a `PROSE` panel, and do not hand-write HTML to
fake either.

## A figure is a ```dg``` fence of strict JSON

```dg
{ "kind": "map",
  "title": "what the figure is, for a screen reader",
  "caption": "what to notice — rendered under the drawing",
  "boxes": [{ "id": "a", "label": "Contract", "note": "the shared surface", "em": true },
            { "id": "b", "label": "App" }],
  "links": [{ "from": "a", "to": "b", "label": "types" }] }
```

A **box** takes `id` · `label` · `note` (a second line, wrapped for you) · `em` (accented) ·
`warn` (a refusal) · `off` (faded) · `in` (the id of the box that contains it) · `shape`.
A **link** takes `from` · `to` · `label` · `dashed` · `card` (its cardinality, on an `entities` figure).

**Never write a coordinate.** Every drawer computes them, and the figure check holds the result to
the contract: `24` between unconnected shapes and parallel runs, `56` where a connector joins two
boxes, `16` of padding, `36` of minimum visible shaft, `8` of clear air around every label. Drawing
one figure by hand took more than twenty rounds against that check.

**A one-way chain is drawn as a straight line, and horizontal when it fits.** Nothing in it turns
back, so a bend would show a turn that is not there.

**Every figure is looked at by eye once the page is produced, and the verdict is written down.** The
check reads the geometry; only a person reading the page sees whether the figure is laid out well
and can be read.

### The kinds

| `kind` | Reach for it when | What it adds to the spec above |
| --- | --- | --- |
| `map` | the content is the **parts** of one thing and how they touch | nothing. Nest with `in`, at most two deep |
| `flowchart` | the content is a **path** somebody takes, and where it turns | `shape` per box. The path runs down the page |
| `system` | the content is the **architecture** of something you build | `layers` and `outside` instead of `boxes` |
| `sequence` | a process has more than one participant and **who speaks to whom** is the point | `boxes` are participants, `links` are messages in order; `dashed` is a reply |
| `entities` | the construct is **data** and what relates to what is the point | `card` on every link. The subject is `em`; direction decides the column |
| `chain` | a straight run of steps, left to right | nothing. No `links` needed |
| `skeleton` | the content is **where the parts of one level sit** — a mock of a layout, a preview | `frame` instead of `boxes` and `links`; dotted boundaries with a name for components, parts and slots. No connectors: position is the whole claim |

`flow` is **retired**. It aliased `map` before `flowchart` existed; asking for one is refused.

### `flowchart` shapes

`terminator` (the ends of the path) · `process` (a step) · `decision` (a diamond) · `io`
(a parallelogram) · `predefined` (a step defined elsewhere) · `store` (a cylinder) · `connector`
(a lettered circle, where the path continues).

You may leave `shape` out. The ends of the path become terminators and a box with more than one way
out becomes a decision. **Every branch out of a decision must carry its answer**, or it is a finding.

```dg
{ "kind": "flowchart",
  "caption": "What happens when a request arrives, and where it turns.",
  "boxes": [{ "id": "s", "label": "A request arrives" },
            { "id": "c", "label": "Is the caller a member?" },
            { "id": "y", "label": "Mint a session" },
            { "id": "n", "label": "Refuse", "warn": true },
            { "id": "log", "label": "Write the audit row", "shape": "store" },
            { "id": "e", "label": "Done" }],
  "links": [{ "from": "s", "to": "c" }, { "from": "c", "to": "y", "label": "yes" },
            { "from": "c", "to": "n", "label": "no" }, { "from": "y", "to": "log" },
            { "from": "n", "to": "e" }, { "from": "log", "to": "e" }] }
```

### `system` — layers inside a boundary, resources outside it

One kind for a server module, a web module and an estate package, because the three are the same
shape. Derive it from the source: read `entry/` for the doors, `app/` for the middle, the imports for
the outward edges — **a repository reaches the database and nothing else**.

```dg
{ "kind": "system", "title": "modules/project",
  "caption": "One http door in, the contract at the foot, and what it reaches outward.",
  "layers": [
    { "name": "Entry", "boxes": [{ "id": "api", "label": "api — controllers" }] },
    { "name": "App", "boxes": [{ "id": "svc", "label": "services", "em": true },
                               { "id": "repo", "label": "repositories" }] },
    { "name": "Contract", "boxes": [{ "id": "ct", "label": "states and commands" }] }],
  "outside": [{ "id": "client", "label": "A client", "as": "client" },
              { "id": "door", "label": "HTTP router", "as": "way-in" },
              { "id": "db", "label": "Database", "note": "through typeorm", "as": "store" }],
  "links": [{ "from": "client", "to": "door", "label": "arrives" },
            { "from": "door", "to": "api", "label": "calls" },
            { "from": "repo", "to": "db", "label": "rows" }] }
```

`as` gives an outside thing the shape of what it is: `client` (a window) · `way-in` (a chevron) ·
`queue` (a pipe) · `store` (a cylinder) · `cache` (a cylinder you can afford to lose) · `bucket` ·
`service` (a plain rectangle). **Every edge crossing the boundary carries what flows** — an
unlabelled line meaning *related* is the one thing this kind refuses.

### `entities` — and every relation line says one or many

```dg
{ "kind": "entities",
  "caption": "What an account relates to, and how many of each.",
  "boxes": [{ "id": "c", "label": "Account", "em": true }, { "id": "u", "label": "User" },
            { "id": "m", "label": "Membership" }, { "id": "o", "label": "Org" }],
  "links": [{ "from": "u", "to": "c", "label": "belongs to", "card": "N:1" },
            { "from": "m", "to": "c", "label": "grants a role in", "card": "N:1" },
            { "from": "c", "to": "o", "label": "scopes", "card": "1:N" }] }
```

**A relation with no `card` is a finding.** A diagram whose lines say only *belongs to* leaves the
reader with the one question they opened it to answer.

### `sequence` — lifelines, and a dashed arrow for a reply

```dg
{ "kind": "sequence",
  "caption": "Who speaks to whom when somebody signs in.",
  "boxes": [{ "id": "b", "label": "The sign-in page" }, { "id": "h", "label": "The identity hub" },
            { "id": "p", "label": "The provider" }],
  "links": [{ "from": "b", "to": "h", "label": "asks to sign in" },
            { "from": "h", "to": "p", "label": "hands off" },
            { "from": "p", "to": "p", "label": "authenticates" },
            { "from": "p", "to": "h", "label": "returns a code", "dashed": true },
            { "from": "h", "to": "b", "label": "sets the session cookie", "dashed": true }] }
```

`from` and `to` naming the same participant draws a loop off its own lifeline. Every message needs a
label: a sequence shows who says **what** to whom.

### `skeleton` — a mock of a layout, and nothing about how it looks

A skeleton is drawn for **one level: the app, a layout with its body, navigation and content, the page level, a container, a widget or a card, or a component**. It shows where that level's primary sub-components are placed, each with its own component's name, and sample values fill the rest. It draws a surface's views only, never a system, a flow or a data shape (`system`, `flowchart` and `entities` draw those). It may show an arrangement no block has yet, so a tag names a place in
plain words, or by a block's prop where the block exists. Draw one wherever a reader must picture an
arrangement, in a construct page or an overview: a layout's types and named places, a container's parts, each widget, a showcase section, and the few components that frame others: the table, the form, the dialog. Never one for every component. A hand-written page (an approach page, a
preview) takes the same drawing from `docs figure draw <spec.json>`.

Each sub-component stands where it stands on the screen: the start or the end of its row, the top or the foot of its column; a part that takes the room left takes it in the drawing too.

**A page's skeleton stands in its layout and draws every level: the window, the layout's body, navigation and content, the page level, the containers, the widgets and cards, and the components** (`RD.DEVEX.WORKSPACE.260`). A level is told by its mark and by its unit's name, never by a tint. So a spec names the layout as `layout`, each view its page level as `page`, and each block the unit of the design system it is as `unit`.

| Level | The units | In the spec | Drawn as |
| --- | --- | --- | --- |
| App | `DSApp` | none: the view is its window | the window, at its screen class |
| Layout | `DSLayout`, of type `RAIL`, `DOCK`, `TOPNAV` or `CANVAS` | `layout` | the body's box, the navigation at its edge, and the content's line |
| Page level | `DSPageLevel` at `PAGE`, or the header of a container with `fullPage` | `page`, on a view | first in the content, with no boundary: the largest title, its actions at the end |
| Container | `DSContainer` | `unit`, on a frame | a dotted outline, its unit's name at its corner, its header under the name with no box round it, and its content and footer in one thin rounded box under the header |
| Widget or card | `DSFilterBarWidget` · `DSDataTableWidget` · `DSComparisonWidget` · `DSListDetailWidget`; `DSCardWidget` · `DSCard` · `DSItemCard` | `unit`, on a frame or a part | a widget: a dotted boundary and its name; a card: its outline, its name and its title |
| Group | `DSPageLevel` at `GROUP`: a part of a container's or a card's content with a title of its own | a part in `sections` with a `label` and no `unit` | a dotted boundary, the word *Group* at its corner, and its title and its actions inside it |
| Component | `DSItem` · `DSButton` · `DSBadge` · `DSIcon` · `DSForm` · the entry controls | the shapes a spec already has | a control, an item line, an icon or a stand-in, with no name |

**Every level that has a box is outlined and carries its name, and holds its own header** (`RD.DEVEX.WORKSPACE.268`): its boundary, its name at the corner, `DSContainer`, the widget's unit or *Group*, and its title, the line under it and its actions inside it. A title is never drawn outside the box it belongs to; a heading that belongs to no box is the page level's, or a group's. The content and the inline levels take no mark of their own.

- **The level is read from the unit's name** (`RD.SUPPORT.SURFACE.098`): a widget's ends in `Widget`, a container's in `Container`, and a component's takes no such word. A spec takes no `level` of its own, since the design system's `pageLevel` already names the level of a heading.
- **A card stands at the level of a widget**: the design system gives a card's title the level `WIDGET`. `DSCard`, `DSItemCard` and `DSCardWidget` are drawn as cards.
- **The page level is one place, whichever unit carries it**: `DSPageLevel` at `PAGE` above the containers, or the header of the one container that is the page, with `fullPage` (`RD.SUPPORT.SURFACE.179`). A skeleton draws the two the same way.
- **A spec names the book's units**, `DSContainer` and the core widgets, and never a unit one stack builds on top of them.
- **The drawer refuses a unit that the rule names wrongly** (`RD.SUPPORT.SURFACE.217`): a `DSContainer` is a part with a header, a `DSCardWidget` one of several of a kind with titled parts, a `DSCard` a single thing with no parts, and a `DSItem` one line about one thing. A `DSCard` with titled parts, `DSCard`s of one kind side by side or alone in a container, a `DSCardWidget` with no titled parts and no sibling card, a loose row of words and an action on the page, a `look` the unit's level does not give, and a row built by hand where an `item` says it are each a finding. A frame names its unit and leaves its look to it.
- **The chosen entry of the navigation is the page's own** (`RD.DEVEX.WORKSPACE.268`): a page that is an entry stands under that entry, and a page below one, a record or a step, keeps the entry it was reached from. `chosen` names the entry by its word, and the check names a view whose page is an entry of `nav` drawn under another.
- **The layout is the setting a page is drawn in, and never part of a page pattern.** A spec's `layout` is the layout of the page it shows.

**The layout is drawn around the frame, and the page level above it.** The window is the body. Below `FULL`, at a desktop, the body's box is drawn at its share of a window 1920 wide, centred, so the body shows on both sides; at a tablet and on a phone the box is the screen. The navigation is a surface at its edge: a rail runs the window's height and is drawn shut to its icons on every device, desktop included, so the content gets the room (`RD.DEVEX.WORKSPACE.270`); only a figure about the rail itself draws it open at a desktop, with `navigation.open`, with the tile and the name of the app at its head, the words of `nav` with the page's own entry, `chosen`, in a band and the person at its foot; a top bar runs across the window, its items in the box; a dock's column stands inside the content, at its left. The content is a solid line round its box: attached, it is the body's box from the navigation, or the window's top, to the bottom, with square corners, and beside a rail it is centred in the area beside the rail. A part that is not attached is rounded and stands 16px in. On a phone every part attaches, and one bar stands at the top: the menu, the tile and the name of the app, and the person at its end. `CANVAS` draws the body alone. The page level stands first in the content, with no boundary: the title of its item at the page's step, its description and facts under it, its picture before it, the way back, `back`, before the title, and its actions at the end, the main one solid.

**A place is one of three things, and each reads by its own mark, never by a tint.**

| A place is | Marked | Holds |
| --- | --- | --- |
| a component, a part or a slot | a dotted boundary, with its name | a part draws what it holds; a slot that accepts any node draws nothing inside it, only its name |
| a frame's own look | a background for `raised`, a solid line for `bordered`, neither for `flat`, a thin rounded outline for a `card`, and for a `container` a dotted outline with a thin rounded box round its content and footer | the parts of one frame, together. Never a colour that stands for one place against another |
| a control, a title or a stand-in | nothing of its own | see below |

A **control** carries no tag and takes its own size: the height its real component has at the size step drawn, never stretched to its row and never shrunk to a label's line. **Its state is told by position and by weight, never by a colour**: a switch's knob stands at the end of its track when it is on and at the start when it is off; the chosen tab is heavier and has a line under it; a badge is a small framed word, lower than a button and never with the weight of a main action, so nobody reads it as something to press. A **title** is plain text, never a tagged box and never `em`. **Sample values fill the rest**: a title, a button, a field or a record carries a value a real screen could show, in the words of the product it stands for and never the name of a pattern, a unit or a level, and where the content is many of one thing a stand-in shows the kind with no name. An **icon** is a small square holding one of a small set of plain line shapes the drawer draws itself, with one default where none fits; a skeleton shows no icon of the library. So the icon of an enum, the icon of one of its values and a brand's mark are all the default: a skeleton says that an icon is there, never which one. A badge and a tab may carry an icon before their word, with no square around it.

One outer `frame`, or `views` and never both: a box with an optional `label` (its title), `look`, `note` and `tag`, holding `rows` top to
bottom. A row holds `items` left to right; `label` names the row in a column every row of the frame
shares.

| Field | Draws |
| --- | --- |
| `frame` | a region, such as a navigation beside the content: `look` `raised` · `bordered` · `flat` · `card` · `container`, and a `container` also takes `actions`, what stands at the end of its header, `sections`, its content as several parts each with a `label`, `actions` and `rows`, a part with a `label` and no `unit` being a group, and `footer`, the rows under its last line, and a `card` takes `sections` as well, and `actions`, what stands at the end of its title; `width` `1/4` · `1/3` · `1/2` · `2/3` · `3/4` of the row, or what is left with `fill`; regions in one row end on one line |
| `text` | a box as wide as its word, or the rest of the row with `fill` |
| `note` | muted text, no box |
| `slot` | one block whose text is its own name, with nothing drawn inside it |
| `tag` | the name on a component, a part or a slot's dotted boundary |
| `control` | `button` · `field` · `select` · `checkbox` · `switch` · `tabs` · `badge` · `pager`, each at its own component's height, with a sample value; a `pager` is one packed group. A `switch` takes `on`; `tabs` takes the words as `tabs` and the place of the chosen one as `chosen`, counted from 0; a `badge` and `tabs` may take an `icon` |
| `views` | one screen at several screen classes, in place of `frame`: a list of views, each with a `viewport` of `DESKTOP`, `TABLET` or `MOBILE` and a whole `frame` of its own |
| `layout` | the layout the views stand in: `type`, one of `RAIL` · `DOCK` · `TOPNAV` · `CANVAS`; `body`, with its `width`, one of `FULL` · `XWIDE` · `WIDE` · `MEDIUM` · `NARROW`, and `FULL` where it is left out; `navigation`, with `attached`, the words of its entries as `nav` and the page's own entry as `chosen`, by its word; and `content`, with `attached`. Each part is attached where `attached` is left out. Left out, a view is the inside of a page alone |
| `page` | on a view, the page level: its `item`, the title with its description, picture and facts; its `actions`, at the end; and `back`, the way back before the title. It stands first in the content, with no boundary |
| `unit` | on a frame or a part, the unit of the design system it is. Its name gives its level: a container, a widget, a card, or a component. Its name is drawn at the boundary's corner, a card's as well, and a widget is a dotted boundary |
| `standin` | `rows` · `cards` · `field` · `list`: placeholder bars at the skeleton's own rhythm, for the many of one thing; and `table`, which takes `columns`, the words of its head row, and `cells`, a few rows of sample values. A `field` with a `label` is the field of a form as the library's form field lays it out: its title above its control, never beside it; `info`, the mark of its help at the end of the title's line; `text`, the sample value; `control: "select"`; and one line under the control, its `error` in the failure colour or else its `description`, whose room is kept where it has neither. A box in a cell of a `table` that takes `fill` is as wide as its column, so the action that saves a row being changed stands beside its box. A row of the page beside its containers has no border of its own; it takes `marked` where a figure is about the parts and their alignment, and the drawer puts a dotted line around it as wide as the containers' outline. A figure that shows a page for its content leaves it off. A container takes no `marked`: its header stands inside its outline. The checkboxes of one set each take `fill`, so they stand in columns, and a shorter row is filled with spacers. A `field` with a `label` and `read` is a field that is read, as the library's data unit shows it: its value in `text` under its title, with no box, the title heavier than the value and lighter in tone and the mark of its help beside the title, the value as plain words or as a badge with `control: "badge"`; a title never stands beside its value. A container, a card or a part whose rows are all item lines takes `divided`: the lines of a list have a line between each two, and a card draws those lines only, with none between its parts |
| `item` | a line in the style of the library's item: a `media`, the name of an icon; a `title`; a `description` under it; `meta`, several facts on that line, each a word or a badge; and `end`, what stands at the end of the line |
| `icon` | a small square holding the name of one plain shape the drawer draws itself, or its default. With `mark`, or with `on`, it is a mark and is drawn in a circle; `on: false` draws the default mark empty. With `mark: false` and `on` it is a tile, an action square, and `on: true` puts a small check at its top end corner |
| `spacer` | free room: the items after it sit at the end of the row |
| `height` | a region standing taller than what it holds, in rows |

A skeleton takes neither `tone` nor `em`; a `map` takes both.

**A skeleton takes its own guidelines, apart from the grid every other figure shares.** Padding inside a boundary is 16px, and the gap between parts, in a row or down a frame, is 24px. A control's height follows its own component's size step: 28 · 32 · 36 · 40 · 44px for `XS` · `SM` · `MD` · `LG` · `XL`. A name sits on a 20px line, at its boundary's own corner, and an icon beside a word sits on that same centre line. A stand-in's rhythm is a 6px bar and an 8px heading bar, stepping 14px to the next. A badge stands 8px lower than a control and a switch's track 12px lower, each centred on the row's line. A table's head row is 24px with a line under it, and a body row gives its tallest cell 8px above and below. An item's title and its description stand on two 18px lines. A view is drawn 1052 · 617 · 411px wide for `DESKTOP` · `TABLET` · `MOBILE`, and the views stand 24px apart. Below `FULL`, the body's box at a desktop is 421 · 561 · 701 · 842px of the view's 1052 for `NARROW` · `MEDIUM` · `WIDE` · `XWIDE`. A rail is 131px wide open and 40px shut, and a top bar and a phone's bar are 48px high. So the desktop view takes the grid's content width on a line of its own, and the tablet and the phone views share the next line, three parts to two. A card's head is 40px, or 58px with a note under its title, under the line of its name; its corner is 8px. A container's header is a band inside its outline, under the line of its name, 44px, or 52px with a note under its title, and a line closes it. A mark that tells a state is 12px lower than a control. Inside the outer frame a named boundary nests no deeper than three: a container, a widget or a card in it, and a group in that; a fourth level is drawn as its own skeleton. A page's layout and its page level stand around and above the frame, so the count starts at the container. The check asks five things of a skeleton alone: a component, a part or a slot boundary carries a name; a control carries no tag; a named boundary nests no deeper than three; a view fits the width of its class; and the chosen entry of the navigation is a word of `nav`, and the page's own where the page is an entry.

```dg
{ "kind": "skeleton",
  "caption": "RAIL: each named place carries its prop's name; a place that takes any node is a slot; the navigation's entries are a list stand-in.",
  "frame": { "label": "DSLayout — RAIL", "rows": [{ "items": [
    { "frame": { "width": "1/4", "rows": [
      { "items": [{ "slot": "startNode", "fill": true }] },
      { "items": [{ "frame": { "tag": "nav", "fill": true, "rows": [
        { "items": [{ "standin": "list", "lines": 5, "headings": [0], "fill": true }] }] } }] },
      { "items": [{ "slot": "endNode", "fill": true }] }] } },
    { "frame": { "rows": [
      { "items": [{ "icon": "menu" }, { "spacer": true }, { "slot": "actionsNode" }] },
      { "items": [{ "frame": { "tag": "children", "fill": true, "rows": [] } }] }] } }] }] } }
```

**A container on a surface is one box that holds its header** (`RD.DEVEX.WORKSPACE.268`). The header, `DSContainer.Header`, is a part of its container, so one dotted outline, as a group's, is the container's extent: the unit's name at its corner, then the header as a band under the name, with the title and the line under it at the start and the actions at the end, and no line and no box round it. **The default frame of a container is round its content and its footer, not its header** (`RD.DEVEX.WORKSPACE.269`): under the header, the content and the footer stand in one thin rounded box, with no line across it between its parts. The screen is the same: the theme's `frames` leaves the header out of the frame, so its line goes round the content and the footer alone. **A container whose content is only cards stands flush**: each card is its own box, so no box goes round them and they reach the container's edges with no padding at the sides. The lines between the rows of a list in a group stay. **The content of a container may be several parts, as `sections`.** A part with a title and no unit is a group, at the level `GROUP`: a dotted boundary round it, the word *Group* at its corner, and its title inside, a step under the container's, with the actions of that part at the end of its title, so an action stands beside what it acts on. A line divides each two parts, and the lines of a list in a part stay inside its boundary. This is the form for a page. The form with named parts, a frame with `frames`, is for teaching the parts of the container itself.

**The titles of a surface stand in steps, as the type steps of the design system do.** The title of the page level is the largest, a container's is a step under it, a card's is a step under that, and the title of a part of the content is a step under that again; all four are heavy, since each names a part of the page. An item's title names one thing among the content, so it is smaller and of medium weight, and the line under it is smaller again and quiet. A reader so tells a title of a part from the name of a record at a glance, by size and by weight together. A card's content may be several parts as well, as `sections`, with no line between them.

**A card is a smaller part inside a container's content or on the page, with a title of its own, and it stands at the level of a widget.** It is a thin outline with a rounded corner and nothing behind it, and its title is drawn in the heavy weight of a title, so a reader finds the parts of a page by their titles. A card carries its unit's name at its corner, as every unit does, and its title under the name. **A card may carry actions at the end of its title's line**, as a container's stand at the end of its header (`RD.DEVEX.WORKSPACE.269`). A card may carry a mark before its title, as `media`, for the kind of thing the card is about. Use a card where a mock shows a page as a person sees it, and a named boundary where it teaches the names of a block's parts.

**An icon is an action unless the spec says it is a mark.** An action is pressed and keeps its square, as *more*, *close* and *add* do. A mark stands for a thing or a person and is drawn in a circle: the default mark is a filled circle, and an empty one where the thing is there to be set up and is not yet; any other mark is a circle that holds its shape. The media of an item line is always a mark. **A mark is as large as its place asks**: one that tells a state, set up or not, is small; one that stands for a thing is as tall as a control; and the media of an item is as tall as the lines beside it, so the picture of a record is in proportion to what it names. **A brand that is pressed to set it up is a tile, not a mark** (`RD.DEVEX.WORKSPACE.269`). The brand of a social sign-in is what a person looks for and what they press, so a spec gives it `mark: false` with `on`: it is an action, a square as tall as a control, and `on: true` puts a small filled check at its top end corner to say the brand is set up. A brand that is not yet set up has no check.

```dg
{ "kind": "skeleton",
  "caption": "A card with its title, a row of marks of which one is not set up, a mark for a person, and an action that keeps its square.",
  "frame": { "label": "Organization", "rows": [{ "items": [
    { "frame": { "look": "card", "label": "Sign-in", "rows": [
      { "items": [{ "icon": "default", "on": true }, { "icon": "default", "on": true }, { "icon": "default", "on": false }, { "note": "2 of 3" }] },
      { "items": [{ "item": { "media": "person", "title": "Dana Lee", "description": "Owner", "end": [{ "icon": "more" }] }, "fill": true }] }] } }] }] } }
```

**A table may carry sample values in place of bars, and a line may be drawn as an item.** Bars say that a part holds many of one thing, and nothing about what one of them is. Where a reader must see that, the skeleton shows a few rows of sample values. A table stand-in takes the words of its head row and a few rows of cells; a cell is a word, a badge, an icon or another control, and a column with an empty head holds the actions of a row and stands at the end. **A table that is the whole of a part of a container is flush**, with `flush`: the line under its head row and a line under each row run from one edge of the outline to the other, as the table of a listing does under its filter bar. Its head row is a band, with its words small and in capitals, as the library's table draws it. **An item has up to three levels: its title, a description in plain words, and the line of facts.** Each of the last two is there only where the data has it, so an item is one, two or three lines. Where both are there, the description stands on a line of its own, above the facts. A badge on the line of facts is as tall as the words beside it, and smaller than a badge that stands alone. Where the rows of a container, or of one part of it, are the lines of a list, `divided` draws a line between each two, as the LIST layout of a data table does. **The chosen line of a list is a band.** A row of a container takes `chosen`, and a band is drawn behind it across the outline, from the line above it to the line under it, so a reader sees which group the part beside the list belongs to. An item line is the library's item: its media at the start, its title with its description under it, and what stands at its end. The title is of medium weight, and the description is small and quiet. **The line under the title may hold several facts**, as `meta`: a word, a pair such as *Owner: Dana Lee*, or a badge. A dot stands between every two facts, a badge among them, since a line may hold two badges or a badge that carries an icon. A bar between facts is not used. A badge that says what kind of thing a record is stands on this line, and never after the title, because titles differ in length; a state stands on this line as well, before the other facts, in a list and in the header of a page alike: the end of a line holds actions only, so a person finds what can be done in one place and what is true in another. Bars stay for running text, and for a part whose data the page does not need to show.

```dg
{ "kind": "skeleton",
  "caption": "The same records as a table with sample cells at a desktop, and as item lines on a phone.",
  "views": [
    { "viewport": "DESKTOP", "frame": { "label": "Users", "rows": [
      { "items": [{ "standin": "table", "fill": true, "columns": ["Name", "Email", "State", ""],
        "cells": [[{ "icon": "person", "text": "Dana Lee" }, "dana@acme.com", "", { "icon": "more" }],
                  [{ "icon": "person", "text": "Omar Haddad" }, "omar@acme.com", { "control": "badge", "text": "Invited" }, { "icon": "more" }]] }] }] } },
    { "viewport": "MOBILE", "frame": { "label": "Users", "rows": [
      { "items": [{ "item": { "media": "person", "title": "Dana Lee", "description": "Admin", "end": [{ "icon": "more" }] }, "fill": true }] },
      { "items": [{ "item": { "media": "person", "title": "Omar Haddad", "description": "Member", "end": [{ "control": "badge", "text": "Invited" }, { "icon": "more" }] }, "fill": true }] }] } }] }
```

**A skeleton may hold a view of one screen for each screen class.** The classes are the surface's own, `DESKTOP`, `TABLET` and `MOBILE`, so a skeleton makes no second set of names. What changes between two classes is the arrangement: parts stack, a table becomes a list, and a list at the side becomes a step of its own. So each view is a whole frame of its own, and none is derived from another. The views are drawn in one figure in one order, desktop, then tablet, then phone, each under the name of its class, whatever order the spec lists them in. The desktop stands on a line of its own at the full width, and the tablet and the phone stand side by side under it. A view's width stands for its class and is never a size on a screen; a view whose frame needs more room than its class has is a finding. One sentence before the figure and one caption after it serve all the views.

```dg
{ "kind": "skeleton",
  "caption": "On a desktop the list of groups stays in view beside the items. On a phone the items are a step of their own.",
  "views": [
    { "viewport": "DESKTOP", "frame": { "label": "Custom fields", "rows": [{ "items": [
      { "frame": { "tag": "groups", "width": "1/3", "rows": [{ "items": [{ "standin": "list", "lines": 4, "fill": true }] }] } },
      { "frame": { "tag": "items", "rows": [
        { "items": [{ "text": "Project" }, { "control": "badge", "text": "4 fields" }, { "spacer": true }, { "control": "button", "text": "Add field", "main": true }] },
        { "items": [{ "standin": "rows", "lines": 4, "fill": true }] }] } }] }] } },
    { "viewport": "MOBILE", "frame": { "label": "Project", "rows": [
      { "items": [{ "icon": "previous", "text": "Custom fields" }, { "spacer": true }, { "icon": "add" }] },
      { "items": [{ "control": "tabs", "tabs": ["Fields", "Tags"], "chosen": 0 }] },
      { "items": [{ "standin": "list", "lines": 4, "fill": true }] },
      { "items": [{ "control": "switch", "text": "Required", "on": true }] }] } }] }
```

**No connector, ever.** Where a part sits is the whole claim, so a skeleton never draws an arrow.
**And never the library's look**: no colour that means something in the product, no size in pixels. Where the look matters, the section links the drawing in the library.
