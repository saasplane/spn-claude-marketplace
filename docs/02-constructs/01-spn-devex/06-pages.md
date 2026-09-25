<!-- spn:doc
{
  "id": "pages",
  "variant": "construct",
  "title": "The Page — Produced From a Seat File, Never Typed",
  "lenses": ["ARCHITECT", "VOICE"],
  "status": "PLANNING",
  "dependsOn": ["tools"],
  "summary": "The HTML a reader opens, produced from the markdown an author writes — the block vocabulary that markdown is written in, the drawer that measures every figure from its own text, the checker that treats a connector as a claim, and the comparison that catches a hand edit.",
  "keywords": ["page", "seat file", "render", "figure", "dg", "connector"]
}
-->

# The Page — Produced From a Seat File, Never Typed

`For: Architect · Editor` · `Status: 🔮 PLANNING`

An author writes markdown. A reader opens HTML. Everything between the two is produced, and this page names that production: the vocabulary the markdown is written in, the renderer, the figure drawer, the figure checker, and the comparison that proves a page is still what its source would produce.

## Overview

One rule decides the design of all of it. **A page is never edited by hand.** A page somebody edited is a second source of truth, and the edit survives only until the next production run silently overwrites it. So the audit produces the page again and compares it byte for byte, and any difference is refused with one message: edit the seat file and produce it again.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a seat file | — | the markdown an author writes, carrying its metadata block; the only file in this pair a person edits |
| a block | — | one piece a section is made of — a paragraph, a table, a list, a fenced literal, a rule callout or a figure — each typed in plain markdown |
| a figure spec | `dg` | a fenced block holding strict JSON, which is a figure's single source |
| the drawer | `Spec` | the code turning one spec into inline drawing, measuring every box from its own text |
| a connector | `Link` | a line from one box to another, which is a claim that the two touch and is checked as one |
| a generated region | `spn:generated` | a part of a face written by a tool, bounded by markers that say so; the prose around it belongs to the author |

## Model

The author writes one file. Everything else in the chain is produced from it, including the copy the audit compares against.

```dg
{ "kind": "map",
  "caption": "The comparison judges the page against what the seat file produces again, so a hand edit cannot survive.",
  "boxes": [
    { "id": "a", "label": "the seat file", "note": "markdown an author writes, with its metadata block" },
    { "id": "b", "label": "the renderer", "note": "the body, each figure drawn, then the furniture" },
    { "id": "c", "label": "the page", "note": "the HTML a reader opens, in the mirrored pocket" },
    { "id": "d", "label": "the comparison", "note": "the audit produces it again and reads the difference" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "read by" },
    { "from": "b", "to": "c", "label": "writes" },
    { "from": "c", "to": "d", "label": "judged by" }
  ] }
```

The pocket holding pages mirrors the seat folder exactly, so a seat file and its page are found from each other by path alone, with nothing to look up.

## Parts

### A small renderer rather than a library

A partner installs nothing to read a document, so a dependency would have to be on the machine before a page could be produced at all. The seat file's grammar is closed — headings, paragraphs, tables, lists and fenced blocks — so the renderer covers that grammar and no more. *Where:* `plugins/spn-devex/src/scripts/lib/render.ts`

### The block vocabulary an author types

An author never types HTML. One card states the whole vocabulary in the spelling it is written in: a paragraph is a paragraph, a rule is a blockquote, a literal is a fenced block tagged with its language, a figure is a fenced block tagged `dg`. The card is the thing to read before writing a seat file, and the chapter it restates is what wins where the two disagree. *Where:* `plugins/spn-devex/src/refs/devex/workspace/docs/blocks.md`

### Nothing in a figure is drawn by eye

Every box is measured from its own text, so a label fits and a connector lands on an edge by construction rather than by luck. The canvas is one width and the type sizes are a closed set. The shape carries meaning too: a reader knows a decision from a step before reading either label. *Where:* `plugins/spn-devex/src/scripts/lib/draw.ts`

### A figure check reads the drawn result, not the spec

The checker asks whether each label fits its box, whether every connector starts and ends where it claims to, whether a connector has enough visible length for a reader to see it, and whether anything crowds the edge of the canvas or its neighbour. It reads the drawing rather than the specification, because a figure authored as drawing by hand is exactly the one nothing measured. *Where:* `plugins/spn-devex/src/scripts/lib/figures.ts`

### The links a page carries are re-expressed, never copied

A seat file's links are written from the seat's own folder, and a page sits in a different folder whose neighbours carry different names. So the renderer re-expresses each relative link against the page's own location as it writes. Copying them across unchanged once broke a link on every produced page in the workspace, and no check saw it. *Where:* `plugins/spn-devex/src/scripts/lib/render.ts`, `hrefForPage`

### Behaviour rows are joined, never typed

A page's proof section carries the rows from the register beside it, spliced in at production time and marked with the register they came from. The seat file is not touched: the join happens on the markdown in memory. That is what keeps one status in one place, because the copy on the page is produced again on every write. *Where:* `plugins/spn-devex/src/scripts/tools/docs.ts`, `joinProof`

### Generated regions are bounded, and a hand edit inside them is lost

Part of a face is written by a person and part is generated. The two are told apart by markers that name what writes the region, so no second file is needed to know which is which. A face also declares its own source root, so a repository whose source is not laid out in the usual place generates a map naming folders that exist. *Where:* `plugins/spn-devex/src/scripts/tools/docs.ts`, `face`

## Boundary

This page answers how a page is produced, what a figure is measured against, and why a page is never edited. It does not answer what a document must contain — the sections a construct owes, the fields its metadata block carries — because that is the corpus standard, and the book states it. It does not answer what a tool is either: the jobs that produce and check a page are tools, and [The Tool](05-tools.md) names what that means.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the production chain, the block vocabulary, the drawer and the figure checker | which sections a document owes, and what its metadata block must carry | the foundation's docs construct |
| that a page is compared with what it would be produced from, and a difference refused | that a tool is invoked by its own path and grades its findings | [The Tool](05-tools.md) |
| that a figure is measured from its own text | where a behaviour row comes from, and who writes its status | [Stack Tools](../02-spn-apps/02-stack-tools.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's `05-artifacts.md` § The figures | a connector is a claim that two things touch, which is what makes a figure checkable | MUST |
| the foundation's `05-artifacts.md` § The blocks | the block kinds a section may hold, and how each is typed | MUST |
| the foundation's `02-document.md` § Metadata | the fields a document's metadata block carries, and the header derived from them | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/04-workspace/04-docs` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-devex` | the renderer, the drawer, the figure checker, the block card, and the jobs that produce and compare a page | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/src/scripts/tools/docs.ts figures check docs` | gate | every label fits its box, every connector starts and ends on a shape, nothing crowds its neighbour, and every figure's spec carries the caption a reader is owed. The path is the whole tree rather than the produced pages alone, because a caption is read from the spec in the seat file and a produced page holds none |
| `node plugins/spn-devex/src/scripts/tools/docs.ts audit docs` | gate | every page is what its seat file produces, so no page carries a hand edit |

Try it: `node plugins/spn-devex/src/scripts/tools/docs.ts figures check docs`
