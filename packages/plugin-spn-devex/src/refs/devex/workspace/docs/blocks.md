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
      "seen": "e30d7f40"
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

**All three are plain language** (`RULE.DEVEX.WORKSPACE.182`, `RULE.DEVEX.WORKSPACE.187`): everyday
words, one idea a sentence, no numbers, no slogan, no figure of speech, and no book word the same
sentence does not explain. The block's `summary` is the Description's first sentence, word for word.
**Show a new Title or Subtitle to the developer before you write it.** The only exemption is the
foundation hub's Title and Subtitle, fixed by `DEC.DEVEX.WORKSPACE.143`. What each level holds on the
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

A skeleton is drawn for **one level: the app, a layout with its body, navigation and content, the page level, a container, a widget or a card, or a component**. It shows where that level's primary sub-components are placed, each with its own component's name, and sample values fill the rest. It draws a surface's views only, never a system, the path of a flow or a data shape (`system`, `flowchart` and `entities` draw those). Each page of a flow is a skeleton of its own, and a flow file puts them in order. It may show an arrangement no block has yet, so a tag names a place in
plain words, or by a block's prop where the block exists. Draw one wherever a reader must picture an
arrangement, in a construct page or an overview: a layout's types and named places, a container's parts, each widget, a showcase section, and the few components that frame others: the table, the form, the dialog. Never one for every component. A hand-written page (an approach page, a
preview) takes the same drawing from `docs figure draw <spec.json>`.

Each sub-component stands where it stands on the screen: the start or the end of its row, the top or the foot of its column; a part that takes the room left takes it in the drawing too.

**A page's skeleton stands in its layout and draws every level: the window, the layout's body, navigation and content, the page level, the containers, the widgets and cards, and the components** (`RULE.DEVEX.WORKSPACE.260`). A level is told by its mark and by its unit's name, never by a tint. So a spec names the layout as `layout`, each view its page level as `page`, and each block the unit of the design system it is as `unit`.

| Level | The units | In the spec | Drawn as |
| --- | --- | --- | --- |
| App | `DSApp` | none: the view is its window | the window, at its screen class |
| Layout | `DSLayout`, of type `RAIL`, `DOCK`, `TOPNAV` or `CANVAS` | `layout` | the body's box, the navigation at its edge, and the content's line |
| Page level | `DSPageLevel` at `PAGE`, or the header of a container with `fullPage` | `page`, on a view | first in the content, with no boundary: the largest title, its actions at the end |
| Container | `DSPanelContainer` | `unit`, on a frame | a dotted outline, its unit's name at its corner, its header under the name with no box round it, and its content and footer in one thin rounded box under the header |
| Widget or card | `DSFilterBar` · `DSDataTable` · `DSComparison` · `DSListDetail`; `DSCardWidget` · `DSCard` · `DSItemCard` | `unit`, on a frame or a part | a widget: a dotted boundary and its name; a card: its outline, its name and its title |
| Content part | `DSPanelContainer.Content`: one or more in a container, all in its one rounded box | a section in `sections` with `part: true` | its title and its actions, a line across the box above it where it is not the first, and no dotted boundary |
| Group | `DSPageLevel` at `GROUP`: a titled cluster inside a container's, a card's or a content part's content | a section in `sections` with a `label` and no `unit` (and no `part`), or in a part's own `sections` | a dotted boundary, the word *Group* at its corner, and its title and its actions inside it |
| Component | `DSItem` · `DSButton` · `DSBadge` · `DSIcon` · `DSForm` · the entry controls | the shapes a spec already has | a control, an item line, an icon or a stand-in, with no name |

**Every level that has a box is outlined and carries its name, and holds its own header** (`RULE.DEVEX.WORKSPACE.268`): its boundary, its name at the corner, `DSPanelContainer`, the widget's unit or *Group*, and its title, the line under it and its actions inside it. A title is never drawn outside the box it belongs to; a heading that belongs to no box is the page level's, or a group's. The content and the inline levels take no mark of their own.

- **The level is read from the unit's name** (`RULE.SUPPORT.SURFACE.098`): a widget's ends in `Widget`, a container's in `Container`, and a component's takes no such word. A spec takes no `level` of its own, since the design system's `pageLevel` already names the level of a heading.
- **A card stands at the level of a widget**: the design system gives a card's title the level `WIDGET`. `DSCard`, `DSItemCard` and `DSCardWidget` are drawn as cards.
- **The page level is one place, whichever unit carries it**: `DSPageLevel` at `PAGE` above the containers, or the header of the one container that is the page, with `fullPage` (`RULE.SUPPORT.SURFACE.179`). A skeleton draws the two the same way.
- **A spec names the book's units**, `DSPanelContainer` and the core widgets, and never a unit one stack builds on top of them.
- **The drawer refuses a unit that the rule names wrongly** (`RULE.SUPPORT.SURFACE.217`, `RULE.SUPPORT.SURFACE.221`): a `DSPanelContainer` is a part with a header, a `DSCardWidget` a card with a head (a title with its mark, actions in the head, often titled parts under it), a `DSCard` a card that shows its own info, several side by side included, and a `DSItem` one line about one thing. A `DSCard` with titled parts, a `DSCardWidget` with no head and no titled parts, a loose row of words and an action on the page, a `look` the unit's level does not give, and a row built by hand where an `item` says it are each a finding. A frame names its unit and leaves its look to it.
- **The chosen entry of the navigation is the page's own** (`RULE.DEVEX.WORKSPACE.268`): a page that is an entry stands under that entry, and a page below one, a record or a step, keeps the entry it was reached from. `chosen` names the entry by its word, and the check names a view whose page is an entry of `nav` drawn under another.
- **The layout is the setting a page is drawn in, and never part of an app pattern.** A spec's `layout` is the layout of the page it shows.

**The layout is drawn around the frame, and the page level above it.** The window is the body. Below `FULL`, at a desktop, the body's box is drawn at its share of a window 1920 wide, centred, so the body shows on both sides; at a tablet and on a phone the box is the screen. The navigation is a surface at its edge: a rail runs the window's height and is drawn shut to its icons on every device, desktop included, so the content gets the room (`RULE.DEVEX.WORKSPACE.270`); only a figure about the rail itself draws it open at a desktop, with `navigation.open`, with the tile and the name of the app at its head, the words of `nav` with the page's own entry, `chosen`, in a band and the person at its foot; a top bar runs across the window, its items in the box; a dock's column stands inside the content, at its left. The content is a solid line round its box: attached, it is the body's box from the navigation, or the window's top, to the bottom, with square corners, and beside a rail it is centred in the area beside the rail. A part that is not attached is rounded and stands 16px in. On a phone every part attaches, and one bar stands at the top: the menu, the tile and the name of the app, and the person at its end. `CANVAS` draws the body alone. The page level stands first in the content, with no boundary: the title of its item at the page's step, its description and facts under it, its picture before it, the way back, `back`, before the title, and its actions at the end, the main one solid.

**A place is one of three things, and each reads by its own mark, never by a tint.**

| A place is | Marked | Holds |
| --- | --- | --- |
| a component, a part or a slot | a dotted boundary, with its name | a part draws what it holds; a slot that accepts any node draws nothing inside it, only its name |
| a frame's own look | a background for `raised`, a solid line for `bordered`, neither for `flat`, a thin rounded outline for a `card`, and for a `container` a dotted outline with a thin rounded box round its content and footer | the parts of one frame, together. Never a colour that stands for one place against another |
| a control, a title or a stand-in | nothing of its own | see below |

A **control** carries no tag and takes its own size: the height its real component has at the size step drawn, never stretched to its row and never shrunk to a label's line. **Its state is told by position and by weight, never by a colour**: a switch's knob stands at the end of its track when it is on and at the start when it is off; the chosen tab is heavier and has a line under it, except that tabs standing at the page level, in the content or in the page head's actions, are drawn as pills (`RULE.DEVEX.WORKSPACE.271`): a muted rounded track, the chosen tab in a filled pill, and no line under anything, while tabs inside a container, a card or a widget keep the line, and a row of tabs that names its own `type` is drawn in it wherever it stands (`RULE.DEVEX.WORKSPACE.302`); a badge is a small framed word, lower than a button and never with the weight of a main action, so nobody reads it as something to press. A **title** is plain text, never a tagged box and never `em`. **Sample values fill the rest**: a title, a button, a field or a record carries a value a real screen could show, in the words of the product it stands for and never the name of a pattern, a unit or a level, and where the content is many of one thing a stand-in shows the kind with no name. An **icon** is a small square holding one of a small set of plain line shapes the drawer draws itself, with one default where none fits; a skeleton shows no icon of the library. So the icon of an enum, the icon of one of its values and a brand's mark are all the default: a skeleton says that an icon is there, never which one. A badge and a tab may carry an icon before their word, with no square around it.

One outer `frame`, or `views` and never both: a box with an optional `label` (its title), `look`, `note` and `tag`, holding `rows` top to
bottom. A row holds `items` left to right; `label` names the row in a column every row of the frame
shares.

| Field | Draws |
| --- | --- |
| `frame` | a region, such as a navigation beside the content: `look` `raised` · `bordered` · `flat` · `card` · `container`, and a `container` also takes `actions`, what stands at the end of its header, `sections`, its content as several parts each with a `label`, `actions` and `rows`, a section with `part: true` being a content part, with its own `sections` as the groups inside it, a section with a `label`, no `unit` and no `part` being a group, and `footer`, the rows under its last line, and a `card` takes `sections` as well, and `actions`, what stands at the end of its title; a `DSAccordionGroup` takes `options`, its entries, each with its `header`, its `content` and `expanded`, and `bordered`; `width` `1/4` · `1/3` · `1/2` · `2/3` · `3/4` of the row, or what is left with `fill`; regions in one row end on one line |
| `text` | a box as wide as its word, or the rest of the row with `fill` |
| `note` | muted text, no box |
| `slot` | one block whose text is its own name, with nothing drawn inside it |
| `tag` | the name on a component, a part or a slot's dotted boundary |
| `control` | `button` · `field` · `select` · `checkbox` · `switch` · `tabs` · `badge` · `pager`, each at its own component's height, with a sample value; a `pager` is one packed group. A `switch` takes `on`; `tabs` takes the words as `tabs`, the place of the chosen one as `chosen`, counted from 0, and its look as `type`, `LINE` · `PILL`; a `badge` and `tabs` may take an `icon` |
| `views` | one screen at several screen classes, or in several task states, in place of `frame`: a list of views, each with a `viewport` of `DESKTOP`, `TABLET` or `MOBILE`, a `state` of `DSTaskStateType` where it shows one, and a whole `frame` of its own |
| `layout` | the layout the views stand in: `type`, one of `RAIL` · `DOCK` · `TOPNAV` · `CANVAS`; `body`, with its `width`, one of `FULL` · `XWIDE` · `WIDE` · `MEDIUM` · `NARROW`, and `FULL` where it is left out; `navigation`, with `attached`, the words of its entries as `nav` and the page's own entry as `chosen`, by its word; and `content`, with `attached`. Each part is attached where `attached` is left out. Left out, a view is the inside of a page alone |
| `page` | on a view, the page level: its `item`, the title with its description, picture and facts; its `actions`, at the end; and `back`, the way back before the title. It stands first in the content, with no boundary |
| `unit` | on a frame or a part, the unit of the design system it is. Its name gives its level: a container, a widget, a card, or a component. Its name is drawn at the boundary's corner, a card's as well, and a widget is a dotted boundary |
| `standin` | `rows` · `cards` · `field` · `list`: placeholder bars at the skeleton's own rhythm, for the many of one thing; and `table`, which takes `columns`, the words of its head row, and `cells`, a few rows of sample values. A `field` with a `label` is the field of a form as the library's form field lays it out: its title above its control, never beside it; `info`, the mark of its help at the end of the title's line; `text`, the sample value; `control: "select"`; and one line under the control, its `error` in the failure colour or else its `description`, whose room is kept where it has neither. A box in a cell of a `table` that takes `fill` is as wide as its column, so the action that saves a row being changed stands beside its box. A row of the page beside its containers has no border of its own; it takes `marked` where a figure is about the parts and their alignment, and the drawer puts a dotted line around it as wide as the containers' outline. A figure that shows a page for its content leaves it off. A container takes no `marked`: its header stands inside its outline. The checkboxes of one set each take `fill`, so they stand in columns, and a shorter row is filled with spacers. A `field` with a `label` and `read` is a field that is read, as the library's data unit shows it: its value in `text` under its title, with no box, the title heavier than the value and lighter in tone and the mark of its help beside the title, the value as plain words or as a badge with `control: "badge"`; a title never stands beside its value. A container, a card or a part whose rows are all item lines takes `divided`: the lines of a list have a line between each two, and a card draws those lines only, with none between its parts |
| `item` | a line in the style of the library's item: a `media`, the name of an icon, or a bare icon or a mark in `IDSItemMedia`'s shape; a `title`; a `description` under it; `meta`, several facts on that line, each a word or a badge; `factsPlacement`, where the facts stand against the description; `inline: true`, a compact line at the level `INLINE`, whose facts follow the title on its own line after a dot ("v3 · Draft") where it has no description; `end`, what stands at the end of the line; and `selected`, the chosen line of a feature's boxed items. In a feature whose `items.type` is `STATS` it is a statistic, its `title` the value and its `description` the label |
| `head` | a feature's head, in the names of `IDSFeatureProps`: `pageLevel`, `PAGE` · `CONTAINER` · `WIDGET`, and `CONTAINER` where it is left out; `eyebrow`, the words over the title, in a sentence's case, or a badge; `title`; `description`; `facts`, each a word or a badge; `textAlign`, `START` · `CENTER`; and `media`, a `MARK` or an `AVATAR` over its words. It takes the rest of its row, and wraps to it |
| `icon` | a small square holding the name of one plain shape the drawer draws itself, or its default. With `mark`, or with `on`, it is a mark and is drawn in a circle; `on: false` draws the default mark empty. With `mark: false` and `on` it is a tile, an action square, and `on: true` puts a small check at its top end corner. In an item line's `end`, `ARROW_RIGHT` and `ARROW_UP_RIGHT` are its arrows, drawn bare |
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

**A container on a surface is one box that holds its header** (`RULE.DEVEX.WORKSPACE.268`). The header, `DSPanelContainer.Header`, is a part of its container, so one dotted outline, as a group's, is the container's extent: the unit's name at its corner, then the header as a band under the name, with the title and the line under it at the start and the actions at the end, and no line and no box round it. **The default frame of a container is round its content and its footer, not its header** (`RULE.DEVEX.WORKSPACE.269`): under the header, the content and the footer stand in one thin rounded box, with a line across it between every two content parts and above the footer (`RULE.DEVEX.WORKSPACE.272`). The screen is the same: the theme's `frames` leaves the header out of the frame, so its line goes round the content and the footer alone. **A container whose content is only cards stands flush**: each card is its own box, so no box goes round them and they reach the container's edges with no padding at the sides. The lines between the rows of a list in a group stay. **The content of a container may be several parts, as `sections`** (`RULE.DEVEX.WORKSPACE.272`). A section with `part: true` is a content part: its title and actions, a line across the box above it, and no dotted boundary; its own `sections` are the groups inside it. A section with a title, no unit and no `part` is a group, at the level `GROUP`: a dotted boundary round it, the word *Group* at its corner, and its title inside, a step under the container's, with the actions of that part at the end of its title, so an action stands beside what it acts on. No line crosses between two groups, whose boundaries mark them, and the lines of a list in a group stay inside its boundary. This is the form for a page. The form with named parts, a frame with `frames`, is for teaching the parts of the container itself.

**The titles of a surface stand in steps, as the type steps of the design system do.** The title of the page level is the largest, a container's is a step under it, a card's is a step under that, and the title of a part of the content is a step under that again; all four are heavy, since each names a part of the page. An item's title names one thing among the content, so it is smaller and of medium weight, and the line under it is smaller again and quiet. A reader so tells a title of a part from the name of a record at a glance, by size and by weight together. A card's content may be several parts as well, as `sections`, with no line between them.

**A card is a smaller part inside a container's content or on the page, with a title of its own, and it stands at the level of a widget.** It is a thin outline with a rounded corner and nothing behind it, and its title is drawn in the heavy weight of a title, so a reader finds the parts of a page by their titles. A card carries its unit's name at its corner, as every unit does, and its title under the name. **A card may carry actions at the end of its title's line**, as a container's stand at the end of its header (`RULE.DEVEX.WORKSPACE.269`). A card may carry a mark before its title, as `media`, for the kind of thing the card is about. Use a card where a mock shows a page as a person sees it, and a named boundary where it teaches the names of a block's parts.

**An icon is an action unless the spec says it is a mark.** An action is pressed and keeps its square, as *more*, *close* and *add* do. A mark stands for a thing or a person and is drawn in a circle: the default mark is a filled circle, and an empty one where the thing is there to be set up and is not yet; any other mark is a circle that holds its shape. The media of an item line is a mark, unless the spec gives it as a bare icon (`RULE.DEVEX.WORKSPACE.294`). **A mark is as large as its place asks**: one that tells a state, set up or not, is small; one that stands for a thing is as tall as a control; and the media of an item is as tall as the lines beside it, so the picture of a record is in proportion to what it names. **A brand that is pressed to set it up is a tile, not a mark** (`RULE.DEVEX.WORKSPACE.269`). The brand of a social sign-in is what a person looks for and what they press, so a spec gives it `mark: false` with `on`: it is an action, a square as tall as a control, and `on: true` puts a small filled check at its top end corner to say the brand is set up. A brand that is not yet set up has no check.

```dg
{ "kind": "skeleton",
  "caption": "A card with its title, a row of marks of which one is not set up, a mark for a person, and an action that keeps its square.",
  "frame": { "label": "Organization", "rows": [{ "items": [
    { "frame": { "look": "card", "label": "Sign-in", "rows": [
      { "items": [{ "icon": "default", "on": true }, { "icon": "default", "on": true }, { "icon": "default", "on": false }, { "note": "2 of 3" }] },
      { "items": [{ "item": { "media": "person", "title": "Dana Lee", "description": "Owner", "end": [{ "icon": "more" }] }, "fill": true }] }] } }] }] } }
```

**A table may carry sample values in place of bars, and a line may be drawn as an item.** Bars say that a part holds many of one thing, and nothing about what one of them is. Where a reader must see that, the skeleton shows a few rows of sample values. A table stand-in takes the words of its head row and a few rows of cells; a cell is a word, a badge, an icon or another control, and a column with an empty head holds the actions of a row and stands at the end. **A table that is the whole of a part of a container is flush**, with `flush`: the line under its head row and a line under each row run from one edge of the outline to the other, as the table of a listing does under its filter bar. Its head row is a band, with its words small and in capitals, as the library's table draws it. **An item has up to three levels: its title, a description in plain words, and the line of facts.** Each of the last two is there only where the data has it, so an item is one, two or three lines. Where both are there, the description stands on a line of its own, above the facts. A badge on the line of facts is as tall as the words beside it, and smaller than a badge that stands alone. Where the rows of a container, or of one part of it, are the lines of a list, `divided` draws a line between each two, as the LIST layout of a data table does. **The chosen line of a list is a band.** A row of a container takes `chosen`, and a band is drawn behind it across the outline, from the line above it to the line under it, so a reader sees which group the part beside the list belongs to. An item line is the library's item: its media at the start, its title with its description under it, and what stands at its end. The title is of medium weight, and the description is small and quiet. **The line under the title may hold several facts**, as `meta`: a word, a pair such as *Owner: Dana Lee*, or a badge. A dot stands between every two facts, a badge among them, since a line may hold two badges or a badge that carries an icon. A bar between facts is not used. A badge that says what kind of thing a record is stands on this line, and never after the title, because titles differ in length; a state stands on this line as well, before the other facts, in a list and in the header of a page alike: the end of a line holds actions only, so a person finds what can be done in one place and what is true in another. Bars stay for running text, and for a part whose data the page does not need to show.

**A feature's head is drawn as a head item, in `DSFeature`'s own names, and it leads the items under it** (`RULE.DEVEX.WORKSPACE.284`). A head is where a reader decides whether to read on, and the design system sizes it by its level; loose lines of one small size, each with a control's room under it, read as one more line among the items. So a spec writes `head`. The title stands at its level's step, 24, 20 or 15px and heavy, for `PAGE`, `CONTAINER` and `WIDGET`. The description stands 8px under it, a step larger than an item's words: 16, 14 or 13px, and quiet. The eyebrow written in words is drawn in small capitals, 11px and spaced, packed 6px above the title; one written as a badge is a badge (`RULE.DEVEX.WORKSPACE.295`). The facts stand on one line 8px under the description, as an item's `meta` does. The title and the description wrap at a word to the head's column, and so do the facts where they run past it (`RULE.DEVEX.WORKSPACE.303`); the head is one block as tall as its lines. `textAlign` `CENTER` centres every line. A head with no title, a level or an alignment the head does not take, and a title with a word wider than its column are findings. Loose `text` and `note` keep their two sizes, and draw as before.

**A section of a page is drawn with its fill and its room, in `DSSectionContainer`'s own names** (`RULE.DEVEX.WORKSPACE.285`). What sets one section apart from the next is its fill and the room above and below it, so a spec writes them on the section's frame: `color`, `BASE` · `DEFAULT` · `PRIMARY`, and `BASE` where it is left out; `strength`, `SUBTLE` · `QUIET` · `SOLID`; `inset`; and `size`. Each is a mark on the section's box, never a colour. A fill other than `BASE` is a band, a raised frame's background across the whole box, and every strength draws the same band, since how strong a fill is belongs to the library's look. `inset` is a solid line along the box's top and bottom edges, and none at its sides. A `size` stands the section's room above and below its content, at its room on a phone: 24 · 32 · 56 · 64 · 72px for `XS` to `XL`, which is about a desktop's room at the scale a desktop view is drawn. A section with no `size` keeps a boundary's padding, so a spec written before draws as before. `DSFeatureGridSectionContainer` is a unit a spec may name, a container by its name, drawn as a section is; it takes its own fill and room in its `section` prop, drawn as a section's are (`RULE.DEVEX.WORKSPACE.293`). A `color`, a `strength` or an `inset` on a frame that is not a `DSSectionContainer` is a finding.

**A feature's frames are drawn where the design system takes them, in `DSFeature`'s own names** (`RULE.DEVEX.WORKSPACE.286`). A door, a plan raised among plans and a product shown raised could only be faked as tagged frames while every look on a unit was refused. So a `DSFeature`, and no other unit, takes two fields for its own frame. `frames` names the parts of the feature's own frame, `TEXT` and `MEDIA`: `TEXT` frames the whole feature where it has no media, `MEDIA` frames each slot that is its media, the two together frame the whole feature, and `TEXT` alone beside media frames the words and the items. `surface` is what that frame draws, in the keys of `IDSFrameSurface`: `color`, `strength`, `raised`, `elevation`, `bordered`, `rounded`. A frame is drawn with the marks a look already has: a thin outline, solid where it is `bordered`, with a raised frame's background where it is `raised` or its colour is not `BASE`, and a rounded corner unless `rounded` is false. `elevation` is checked, `XS` to `XL`, and draws the same raised frame. A `surface` with no part in `frames`, an `elevation` on a frame that is not raised, and a part or a value the design system does not have are findings. A `look` on a unit stays a finding.

**A feature's item lines stand each in a frame of their own where it takes `items.surface`, as `DSItemCard` draws them** (`RULE.DEVEX.WORKSPACE.288`). Only a `DSFeature` takes `items`, and a skeleton reads its `surface`. Each item line is drawn with the marks of the feature's own frame, with a boundary's padding round its words, and its frame stands as tall as its row. Another key of `items` is a finding until a skeleton draws it.

**A field that a skeleton does not have is a finding** (`RULE.DEVEX.WORKSPACE.287`). A field the drawer skipped drew nothing and said nothing, so `numbered` on a feature drew no numbers and nobody could tell. Every field is read against the grammar, on the spec, a view, its page, a frame, a section, a row, an item, an item line, a head, a feature's `items` and a `surface`, and a field none of them has is named in a finding. `tone`, `em`, `off` and `warn` on an item or a frame keep the findings that name what replaced them.

**The lines between a feature's items, and between the cells of a grid section, are drawn in `DSGridBorderType`'s own words** (`RULE.DEVEX.WORKSPACE.289`). Points, steps and shown features part their items by lines, not boxes. So a `DSFeature`'s `items` takes `type`, `GRID` · `LIST` · `STATS`, and `GRID` where it is left out, and `borderType`, `NONE` · `GRID` · `EDGE`. A `LIST` has a line under every item but its last where `borderType` is left out, and a `GRID` and `STATS` have none. The items are the rows of item lines, in the feature or in a region of it that is no unit. With `GRID`, a line runs across the column under every row of items but the last, and in a `GRID` of items, or of statistics, a line stands in the gap after every item of a row but its last, with no box round any. `EDGE` adds a thin rounded outline round them all. `DSFeatureGridSectionContainer` takes the same word in `grid.borderType`, for its rows of `DSFeature` cells, `NONE` where it is left out. Items boxed by `items.surface` take no line. `STATS` draws each item as a statistic (`RULE.DEVEX.WORKSPACE.300`). `divided` on a `DSFeature`, a container's word for a list, is a finding.

**A feature's numbered items carry their number before the title, as `items.numbered` writes it** (`RULE.DEVEX.WORKSPACE.290`). A number typed into each title read as part of the step's name. So `items.numbered` puts *1.*, *2.* and on before the title of each item line of the feature, in the order its rows are read: on the title's line, at the title's size and weight, and quiet. The media keeps its place at the start, and the description stands under the title as before.

**A feature's `textAlign` lines up the rows that stand with its head, as the design system aligns a feature's words, its actions and its items** (`RULE.DEVEX.WORKSPACE.291`). A skeleton that centred only the head needed a spacer on each side of a centred hero's buttons. So a skeleton reads the `textAlign` a spec writes on the head. Where it is `CENTER`, each row in the same frame as the head stands centred in its column where it holds actions, words, icons or the item lines of a `GRID`: what the row holds keeps its widths, and the room left over is shared on its two sides. A row of a `LIST` stands at the start, and so does a row in a region of the feature that holds no head, as the items and their action under a head across do. A grid section's heading lines up its actions the same way. A row whose `fill` or spacer takes its width draws as before.

**A feature's `verticalAlign` stands the two sides of a split against each other, and each side keeps its own height** (`RULE.DEVEX.WORKSPACE.292`). A skeleton that stretched every part to its row could draw only the top. So a `DSFeature` takes `verticalAlign`, `TOP` · `CENTER` · `BOTTOM`. It is read on each row of the feature that holds its media beside its words: two parts or more, one of them a slot or a frame. There each part stands at its own height, a slot at its `height`, at the top, the middle or the foot of the row. A view where the split folds, as a phone's does, has no such row, and the field is read nowhere there. With no `verticalAlign`, every part stretches to its row as before, although the design system's own default is `CENTER`.

**A grid section's fill and room are drawn from its `section`, as a section's are** (`RULE.DEVEX.WORKSPACE.293`). `DSFeatureGridSectionContainer` draws a `DSSectionContainer` from its `section` prop, so a spec writes `color`, `strength`, `inset` and `size` there, and each is drawn as the same field of a `DSSectionContainer`: the band, the line along the top and the bottom edge, and the room above and below. Its `size` is also the size of every block inside. `section` and `grid` on any other frame are findings, and so is a key of either that a skeleton does not draw.

**An item line's media is read in `IDSItemMedia`'s own kinds, and a bare icon is drawn bare** (`RULE.DEVEX.WORKSPACE.294`). A point with an icon shows a glyph as large as its title, on the title's line, with nothing round it. So an item's `media` may take the shape of `IDSItemMedia`. `{ "mtype": "ICON", "node": … }` is a bare icon: the drawer's shape alone, as large as the title, 16px beside an item's title, centred on its first line, with no circle and no square. `{ "mtype": "MARK", "icon": … }` is a mark, drawn as a media written as a word is, so a spec written before draws as before. Each names one of the drawer's shapes. A kind an item line does not take is a finding, and a mark stands in its place.

**A feature's head takes its own media, a `MARK` or an `AVATAR`, over its words** (`RULE.DEVEX.WORKSPACE.294`). A cell of a feature grid leads with a small picture, a mark for a module or a face for a quote, and below `PAGE` the design system draws it on top of the words. So a head takes `media` in the same shape: `MARK`, with its `icon`, or `AVATAR`, with the `title` of who it stands for. It stands first in the head, in its level's box, 48px at `CONTAINER` and 40px at `WIDGET`, 12px above the eyebrow or the title, at the start or centred with `textAlign` `CENTER`. A mark is a circle holding its shape, and an avatar a circle holding the initials of its `title`. A feature at `PAGE` stands its media beside its words, so a head there draws none, and the finding says to draw a slot beside the head. Another kind on a head, and an `AVATAR` with no `title`, are findings.

**A head's eyebrow may be a badge, as the design system's eyebrow takes a badge's form** (`RULE.DEVEX.WORKSPACE.295`). A recommended plan says so in a badge over its name. The design system's eyebrow is one of an item's facts, words or a badge, so a head's `eyebrow` is words, drawn in small capitals as before, or a badge written as a fact's badge is, `{ "control": "badge", "text": … }`. A badge eyebrow is drawn as a badge on the line of facts is, on a line 20px tall, packed 6px above the title, and its word keeps the case it is written in. `textAlign` `CENTER` centres it. An eyebrow that is neither is a finding.

**An item line's facts may stand under its title and over its description, as `factsPlacement` `AFTER_TITLE` puts them** (`RULE.DEVEX.WORKSPACE.296`). A directory reads a connector's kind and how it connects before the line about it. So an item line takes `factsPlacement`, `AFTER_DESCRIPTION` · `AFTER_TITLE`, and `AFTER_DESCRIPTION` where it is left out. With `AFTER_TITLE` the line of facts and the description trade places: the facts stand on the line under the title, and the description under them, and the item keeps its height. An item with facts and no description of its own has nothing to trade, and an `INLINE` line keeps its facts on the title's line. A value the design system does not have is a finding.

**The arrow at the end of an item line is drawn bare, in `DSIconType`'s own names** (`RULE.DEVEX.WORKSPACE.297`). A door says where it leads by an arrow at its end: across where it opens a page of the site, and rising to the end where it leaves it. Drawn as the `next` shape, the arrow stood in an action's square and read as a button beside the line. So an icon in an item line's `end` takes `ARROW_RIGHT` and `ARROW_UP_RIGHT`. Each is its shape alone, a shaft with its head, in an icon's place with no square round it, since the whole line is what a person presses. Either name anywhere but an item line's `end` is a finding.

**The chosen item line of a feature's boxed items is marked inside its box, as `DSItemCard` marks a selected tile** (`RULE.DEVEX.WORKSPACE.298`). A choice to see shows which option is open beside it, and outside a container no row could be drawn chosen. The design system marks the item with `selected`, and reads it only where `items.surface` boxes the items. So an item line takes `selected`: in a box it draws a heavier line 2px inside the box's edge, and the box keeps its size and its frame. Where the line stands in no box, `selected` draws nothing and is a finding, and so is a value that is not true or false.

**A grid section's columns are read in each view of their screen class, as `IDSGrid` names them** (`RULE.DEVEX.WORKSPACE.299`). The design system's grid takes `desktop`, `tablet` and `mobile`, the columns at each class, so `grid` takes the three, each a whole number from 1 to 4. A spec's rows still say where each cell stands, so the drawer reads the count and lays nothing out by it: in a view, every row of a grid section's cells holds its class's count, a spacer filling a short row, and a row that holds another count is a finding. A spec with one frame and no views has no class, so the counts are accepted there and read nowhere. A count outside 1 to 4 is a finding.

**A feature's statistics are drawn as the design system draws a stat, its value large over its label, as `items.type` `STATS` writes them** (`RULE.DEVEX.WORKSPACE.300`). A band of numbers is read for its figures, and a number faked as the title of a head of its own drew a heading where the page has a statistic. So a `DSFeature`'s `items` takes `STATS`, and each of its item lines is a statistic: its `title` is the value and its `description` the label under it. The design system draws a statistic a level below the feature's own: the value at that level's title step, heavy, and the label at its description step, quiet, with no room between them. Under a head at `PAGE`, `CONTAINER` or `WIDGET` the value stands at 20, 15 or 13px and the label at 14, 13 or 12px. Statistics stand side by side as a `GRID`'s items do, with no line where `borderType` is left out, a frame each with `items.surface`, and each centred in its place with `textAlign` `CENTER`. A statistic draws nothing else, so `media`, `meta`, `end`, `inline`, `factsPlacement` or `selected` on one is a finding, and so is `items.numbered`, since the design system numbers no statistic.

**A `DSAccordionGroup` is drawn with its entries and the open one's body, in `IDSAccordionGroupOption`'s own names** (`RULE.DEVEX.WORKSPACE.301`). Questions are read one at a time, the open one under its question, and rows of words with a chevron and a note could not say which entry was open or where one ended. So a `DSAccordionGroup` takes `options`, its entries, each with the words of its `header`, the words its body shows as `content`, and `expanded` where it is open. An entry is a header line as tall as a control: the design system's chevron at its start, down while the entry is shut and up while it is open, then the header at an item title's step. Under an open entry its words wrap at a word to the entry's width. The entries stand the gap between parts apart. With `bordered` each stands in a thin rounded outline of its own, its words a boundary's padding in and a line across under an open entry's header. A group that has `options` draws no `rows`, and a group written with rows draws as before. `options` on another unit, an entry with no `header`, and an `expanded` or a `bordered` that is not true or false are findings.

**A row of tabs that names its `type` is drawn in it wherever it stands, as `DSTabs` draws the type a page names** (`RULE.DEVEX.WORKSPACE.302`). The second form of a choice to see sets pill tabs over the panel they open, inside a feature, and a skeleton that picked the look by the level alone drew them as the line. So a row of tabs takes `type`, in `DSTabsType`'s words: `PILL` draws the pills and `LINE` the line, at any level. Left out, the level picks as before: pills at the page level, and the line inside a container, a card, a widget or a feature. `SWITCH`, which a skeleton does not draw, is a finding, and so is `type` on an item that is no row of tabs.

**Words that run past their column wrap at a word inside it, as `DSItem` and `DSItemFacts` wrap them** (`RULE.DEVEX.WORKSPACE.303`). A tablet's column is narrower than a desktop's, and a skeleton that kept every line whole drew a door's description and a hero's badges past their box. So an item line's description, its line of facts, a head's line of facts and a `note` wrap at a word to their column, only where they run past it: words that fit stand as written, and a drawing that fits draws as before. A line of facts breaks between two facts; a fact in words breaks at a word where it alone is too wide, and a badge never breaks. A further line steps 18px, or 20px for a line of facts that holds a badge; the item grows by as much, and its media keeps its size at the top. Where a row's own widths run past it, these give room, each down to its widest word. An item's title never wraps.

**Code and a row of tabs wider than their column keep their width and scroll inside it, as `DSCodeBlockView` and `DSTabs` let them** (`RULE.DEVEX.WORKSPACE.304`). Neither folds: the design system scrolls a long line inside its block, and a long row of tabs in `DSHScroll`, with an arrow at an edge that has more. So a `note` in the rows of a `DSCodeBlockView` is a line of code, and never wraps. Where code or a row of tabs, `LINE` or `PILL`, is wider than its column, it is cut at the column's end: the tabs that stand whole before the cut are drawn, a pill's track ends at the column, and the mark of the cut stands at that end, a small round tile with the `next` shape.

**A feature of `type` `BACKDROP` stands its media behind its words and its actions, as `DSFeature` lays a backdrop** (`RULE.DEVEX.WORKSPACE.305`). A hero with a mood picture sets its words over it, and a skeleton with no layering faked the picture as a named region holding the words. So a `DSFeature` takes `type`, in `DSFeatureType`'s words, and a skeleton reads `BACKDROP`; the other types are drawn by where the rows place the media, so another value is a finding. The media is a slot alone in a row of the feature. That row leaves the flow, and the slot is drawn behind the rows, across the feature under its name, its own name at its corner and the rows a line under it. On a tablet and a desktop the words, the actions and the items keep to three fifths of the width, at the start or centred with the head's `textAlign` `CENTER`; on a phone, and with no views, the whole width. A part named in `frames` frames the whole feature. A `BACKDROP` with no such slot, and `type` on a frame that is not a `DSFeature`, are findings.

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

**A mock draws each page once** (`RULE.DEVEX.WORKSPACE.230`). The page is drawn with its data, and the errors a person meets on it are drawn where they appear, such as a form's alert and a field's message. The other task states, working, empty and denied, are the tree's task lines, in words, because drawing every state cost many tokens and the words of a state already carry it. A view takes `state`, a value of `DSTaskStateType`, for the page that needs a state drawn to be understood, and that is the exception. A view with no `state` shows the page with its data and its errors in place; a view with a `state` shows the same page in that state, as a whole frame, with only what the state changes drawn differently. A phone gets a view of its own only where its arrangement differs, such as a table that becomes a list. The views of one screen class stand together, the view with no `state` first and the others in the order of `DSTaskStateType`, each under the name of its class and the word of its state. A `state` that is not a value of `DSTaskStateType` is a finding.

**A flow's pages are listed in a flow file, in the order a person meets them, each with where its moves lead** (`RULE.DEVEX.WORKSPACE.230`). A skeleton draws one page and no path, so a flow drawn as loose skeletons leaves its reader to guess which page follows which. The file is `<flow>.flow.json`, beside the specs of its pages: `flow` is its name, the name of the flow pattern where it follows one, and `pages` lists the pages in order, each with its `page`, a word the file is unique by, its `spec`, the skeleton that draws it, and its `moves`. A move names what a person does and where it leads: `on` is the words of the action or the event, `to` is a page of the file, or `end` where the flow is done, and `state` is the task state of the view it lands on, where it lands on one. The flow file draws nothing; it is read against the specs, and a `to` that names no page of the file, a page that no move reaches but the first, a `spec` that is not there and a `state` that the page's spec does not draw are each a finding.

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
