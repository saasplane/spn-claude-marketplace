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
      "seen": "ecd6d365"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The figures — what sits inside a block, and the closed set of them",
      "seen": "104bf524"
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
| today against after (`DIFF`) | a fenced block tagged `diff`. **An approach page only** |
| a shape (a figure) | a fenced block tagged `dg`, holding strict JSON |
| a note to yourself, never rendered | `<!-- … -->`, on one line or many |

**A fenced block with no language is never coloured**, so tag it. The page holds the code plain, and
the shared script colours a tagged block when the page opens. The script knows seven languages:
`ts` · `json` · `yaml` · `sql` · `sh` · `diff` · `md`.

**One rule for figures, and it is not optional**: every figure has a **sentence before it** saying
what you are looking at and a **caption after it** saying what to notice. A figure with neither is
decoration.

## What has no markdown spelling yet

`CATALOG` · `CARDS` · `NEXT` · the `PROSE` panel are named in the chapter and **the renderer produces
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
| `skeleton` | the content is **where the parts of one layer sit** — a mock of a layout, a preview | `frame` instead of `boxes` and `links`; dotted boundaries with a name for components, parts and slots. No connectors: position is the whole claim |

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

A skeleton is drawn for **one layer: the app, a layout, a container, a widget or a component**. It shows where that layer's primary sub-components are placed, each with its own component's name, and sample values fill the rest. It draws a surface's views only, never a system, a flow or a data shape (`system`, `flowchart` and `entities` draw those). It may show an arrangement no block has yet, so a tag names a place in
plain words, or by a block's prop where the block exists. Draw one wherever a reader must picture an
arrangement, in a construct page or an overview: a layout's types and named places, a container's parts, each widget, a showcase section, and the few components that frame others: the table, the form, the dialog. Never one for every component. A hand-written page (an approach page, a
preview) takes the same drawing from `docs figure draw <spec.json>`.

Each sub-component stands where it stands on the screen: the start or the end of its row, the top or the foot of its column; a part that takes the room left takes it in the drawing too.

**A place is one of three things, and each reads by its own mark, never by a tint.**

| A place is | Marked | Holds |
| --- | --- | --- |
| a component, a part or a slot | a dotted boundary, with its name | a part draws what it holds; a slot that accepts any node draws nothing inside it, only its name |
| a frame's own look | a background for `raised`, a solid line for `bordered`, neither for `flat`, and a thin rounded outline for a `card` and for a `container` | the parts of one frame, together. Never a colour that stands for one place against another |
| a control, a title or a stand-in | nothing of its own | see below |

A **control** carries no tag and takes its own size: the height its real component has at the size step drawn, never stretched to its row and never shrunk to a label's line. **Its state is told by position and by weight, never by a colour**: a switch's knob stands at the end of its track when it is on and at the start when it is off; the chosen tab is heavier and has a line under it; a badge is a small framed word, lower than a button and never with the weight of a main action, so nobody reads it as something to press. A **title** is plain text, never a tagged box and never `em`. **Sample values fill the rest**: a title, a button, a field or a record carries a value a real screen could show, and where the content is many of one thing a stand-in shows the kind with no name. An **icon** is a small square holding one of a small set of plain line shapes the drawer draws itself, with one default where none fits; a skeleton shows no icon of the library. So the icon of an enum, the icon of one of its values and a brand's mark are all the default: a skeleton says that an icon is there, never which one. A badge and a tab may carry an icon before their word, with no square around it.

One outer `frame`, or `views` and never both: a box with an optional `label` (its title), `look`, `note` and `tag`, holding `rows` top to
bottom. A row holds `items` left to right; `label` names the row in a column every row of the frame
shares.

| Field | Draws |
| --- | --- |
| `frame` | a region, such as a navigation beside a main area: `look` `raised` · `bordered` · `flat` · `card` · `container`, and a `container` also takes `actions`, what stands at the end of its header, `sections`, its content as several parts each with a `label`, `actions` and `rows`, and `footer`, the rows under its last line; `width` `1/4` · `1/3` · `1/2` · `2/3` · `3/4` of the row, or what is left with `fill`; regions in one row end on one line |
| `text` | a box as wide as its word, or the rest of the row with `fill` |
| `note` | muted text, no box |
| `slot` | one block whose text is its own name, with nothing drawn inside it |
| `tag` | the name on a component, a part or a slot's dotted boundary |
| `control` | `button` · `field` · `select` · `checkbox` · `switch` · `tabs` · `badge` · `pager`, each at its own component's height, with a sample value; a `pager` is one packed group. A `switch` takes `on`; `tabs` takes the words as `tabs` and the place of the chosen one as `chosen`, counted from 0; a `badge` and `tabs` may take an `icon` |
| `views` | one screen at several screen classes, in place of `frame`: a list of views, each with a `viewport` of `DESKTOP`, `TABLET` or `MOBILE` and a whole `frame` of its own |
| `standin` | `rows` · `cards` · `field` · `list`: placeholder bars at the skeleton's own rhythm, for the many of one thing; and `table`, which takes `columns`, the words of its head row, and `cells`, a few rows of sample values |
| `item` | a line in the style of the library's item: a `media`, the name of an icon; a `title`; a `description` under it; `meta`, several facts on that line, each a word or a badge; and `end`, what stands at the end of the line |
| `icon` | a small square holding the name of one plain shape the drawer draws itself, or its default. With `mark`, or with `on`, it is a mark and is drawn in a circle; `on: false` draws the default mark empty |
| `spacer` | free room: the items after it sit at the end of the row |
| `height` | a region standing taller than what it holds, in rows |

A skeleton takes neither `tone` nor `em`; a `map` takes both.

**A skeleton takes its own guidelines, apart from the grid every other figure shares.** Padding inside a boundary is 16px, and the gap between parts, in a row or down a frame, is 24px. A control's height follows its own component's size step: 28 · 32 · 36 · 40 · 44px for `XS` · `SM` · `MD` · `LG` · `XL`. A name sits on a 20px line, at its boundary's own corner, and an icon beside a word sits on that same centre line. A stand-in's rhythm is a 6px bar and an 8px heading bar, stepping 14px to the next. A badge stands 8px lower than a control and a switch's track 12px lower, each centred on the row's line. A table's head row is 24px with a line under it, and a body row gives its tallest cell 8px above and below. An item's title and its description stand on two 18px lines. A view is drawn 1052 · 617 · 411px wide for `DESKTOP` · `TABLET` · `MOBILE`, and the views stand 24px apart. So the desktop view takes the grid's content width on a line of its own, and the tablet and the phone views share the next line, three parts to two. A card's head is 40px, or 58px with a note under its title; its corner is 8px. A container's header is 48px above its outline. A mark that tells a state is 12px lower than a control. Inside the outer frame a named boundary nests no deeper than two; a third level is drawn as its own skeleton. The check asks four things of a skeleton alone: a component, a part or a slot boundary carries a name; a control carries no tag; a named boundary nests no deeper than two; and a view fits the width of its class.

```dg
{ "kind": "skeleton",
  "caption": "RAIL: each named place carries its prop's name; a place that takes any node is a slot; the navigation's entries are a list stand-in.",
  "frame": { "label": "DSLayout — RAIL", "rows": [{ "items": [
    { "frame": { "width": "1/4", "rows": [
      { "items": [{ "slot": "brand", "fill": true }] },
      { "items": [{ "frame": { "tag": "nav", "fill": true, "rows": [
        { "items": [{ "standin": "list", "lines": 5, "headings": [0], "fill": true }] }] } }] },
      { "items": [{ "slot": "account", "fill": true }] }] } },
    { "frame": { "rows": [
      { "items": [{ "icon": "menu" }, { "spacer": true }, { "slot": "utilityActions" }] },
      { "items": [{ "frame": { "tag": "children", "fill": true, "rows": [] } }] }] } }] }] } }
```

**A container on a surface is drawn with its header above it.** A page is made of containers, and a mock of a page shows each as a person sees it: the header stands above with nothing around it, the title and the line under it at the start and the actions at the end, and a thin rounded outline holds the content and, under a line, the footer. So a reader finds the parts of a page by the titles that stand between the outlines, and an outline never holds a title of its own. **The content of a container may be several parts, as `sections`.** Each part has its own title inside the outline, lighter than the container's, with the actions of that part at the end of its title, so an action stands beside what it acts on. A line divides each two parts. This is the form for a page. The form with named parts, a frame with `frames`, is for teaching the parts of the container itself.

**A card is a smaller part inside a container's content, with a title of its own.** It is a thin outline with a rounded corner and nothing behind it, and its title is drawn in the heavy weight of a title, so a reader finds the parts of a page by their titles. A card needs no name on its boundary: its title says what it is. Use a card where a mock shows a page as a person sees it, and a named boundary where it teaches the names of a block's parts.

**An icon is an action unless the spec says it is a mark.** An action is pressed and keeps its square, as *more*, *close* and *add* do. A mark stands for a thing or a person and is drawn in a circle: the default mark is a filled circle, and an empty one where the thing is there to be set up and is not yet; any other mark is a circle that holds its shape. The media of an item line is always a mark. **A mark is as large as its place asks**: one that tells a state, set up or not, is small; one that stands for a thing is as tall as a control; and the media of an item is as tall as the lines beside it, so the picture of a record is in proportion to what it names.

```dg
{ "kind": "skeleton",
  "caption": "A card with its title, a row of marks of which one is not set up, a mark for a person, and an action that keeps its square.",
  "frame": { "label": "Organization", "rows": [{ "items": [
    { "frame": { "look": "card", "label": "Sign-in", "rows": [
      { "items": [{ "icon": "default", "on": true }, { "icon": "default", "on": true }, { "icon": "default", "on": false }, { "note": "2 of 3" }] },
      { "items": [{ "item": { "media": "person", "title": "Dana Lee", "description": "Owner", "end": [{ "icon": "more" }] }, "fill": true }] }] } }] }] } }
```

**A table may carry sample values in place of bars, and a line may be drawn as an item.** Bars say that a part holds many of one thing, and nothing about what one of them is. Where a reader must see that, the skeleton shows a few rows of sample values. A table stand-in takes the words of its head row and a few rows of cells; a cell is a word, a badge, an icon or another control, and a column with an empty head holds the actions of a row and stands at the end. An item line is the library's item: its media at the start, its title with its description under it, and what stands at its end. The title is heavy, and the description is small and quiet. **The line under the title may hold several facts**, as `meta`: a word, a pair such as *Owner: Dana Lee*, or a badge. A dot stands between two facts that are words, and a badge needs none. A bar between facts is not used. A badge that says what kind of thing a record is stands on this line, and never after the title, because titles differ in length; a state that a person scans a list for stands at the end of the line. Bars stay for running text, and for a part whose data the page does not need to show.

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
