<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The masthead, and the opening",
      "seen": "4fe3fa2f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The blocks \u2014 what a page reaches for instead of prose",
      "seen": "0dd7f138"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The figures \u2014 what sits inside a block, and the closed set of them",
      "seen": "8a447dae"
    }
  ]
}
-->
# Blocks and figures, in the spelling you actually write

**Source of truth:** the foundation's `04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md` — *The masthead, and the opening*, *The blocks* and *The figures*. This file restates them for an agent that ships without the book beside it; where the two disagree, the book wins.

**You write markdown.** `docs.ts page` produces the HTML, and the stylesheet the template ships
supplies every border, background and colour. So this file is the whole vocabulary you need: what a
block is *typed as* in a seat file. The HTML blocks template is the **rendered** reference a person
opens to see what a block looks like — reading it costs about 16,400 tokens and tells you nothing
you can type, so do not open it (Q135, 2026-09-22).

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
none of them** — there is no markdown that asks for one, and `docs.ts page` adds no navigation. They
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
