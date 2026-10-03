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
      "seen": "95e1ebbb"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The figures — what sits inside a block, and the closed set of them",
      "seen": "4afebe89"
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

**A fenced block with no language is never coloured**, so tag it. The colourer knows seven:
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
| a frame's own look | a background for `raised`, a solid line for `bordered`, neither for `flat` | the parts of one frame, together. Never a colour that stands for one place against another |
| a control, a title or a stand-in | nothing of its own | see below |

A **control** carries no tag and takes its own size: the height its real component has at the size step drawn, never stretched to its row and never shrunk to a label's line. A **title** is plain text, never a tagged box and never `em`. **Sample values fill the rest**: a title, a button, a field or a record carries a value a real screen could show, and where the content is many of one thing a stand-in shows the kind with no name. An **icon** is a small square holding one of a small set of plain line shapes the drawer draws itself, with one default where none fits; a skeleton shows no icon of the library.

One outer `frame`: a box with an optional `label` (its title), `look`, `note` and `tag`, holding `rows` top to
bottom. A row holds `items` left to right; `label` names the row in a column every row of the frame
shares.

| Field | Draws |
| --- | --- |
| `frame` | a region, such as a navigation beside a main area: `look` `raised` · `bordered` · `flat`; `width` `1/4` · `1/3` · `1/2` · `2/3` · `3/4` of the row, or what is left with `fill`; regions in one row end on one line |
| `text` | a box as wide as its word, or the rest of the row with `fill` |
| `note` | muted text, no box |
| `slot` | one block whose text is its own name, with nothing drawn inside it |
| `tag` | the name on a component, a part or a slot's dotted boundary |
| `control` | `button` · `field` · `select` · `checkbox` · `pager`, each at its own component's height, with a sample value; a `pager` is one packed group |
| `standin` | `rows` · `cards` · `field` · `list`: placeholder bars at the skeleton's own rhythm, for the many of one thing |
| `icon` | a small square holding the name of one plain shape the drawer draws itself, or its default |
| `spacer` | free room: the items after it sit at the end of the row |
| `height` | a region standing taller than what it holds, in rows |

A skeleton takes neither `tone` nor `em`; a `map` takes both.

**A skeleton takes its own guidelines, apart from the grid every other figure shares.** Padding inside a boundary is 16px, and the gap between parts, in a row or down a frame, is 24px. A control's height follows its own component's size step: 28 · 32 · 36 · 40 · 44px for `XS` · `SM` · `MD` · `LG` · `XL`. A name sits on a 20px line, at its boundary's own corner, and an icon beside a word sits on that same centre line. A stand-in's rhythm is a 6px bar and an 8px heading bar, stepping 14px to the next. Inside the outer frame a named boundary nests no deeper than two; a third level is drawn as its own skeleton. The check asks three things of a skeleton alone: a component, a part or a slot boundary carries a name; a control carries no tag; and a named boundary nests no deeper than two.

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

**No connector, ever.** Where a part sits is the whole claim, so a skeleton never draws an arrow.
**And never the library's look**: no colour that means something in the product, no size in pixels. Where the look matters, the section links the drawing in the library.
