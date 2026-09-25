<!-- spn:doc
{"id": "spn-devex-capabilities-pages", "variant": "capability", "title": "Pages in spn-devex", "lenses": ["ARCHITECT", "VOICE"], "status": "DONE", "realizes": ["pages"], "summary": "The renderer that turns a seat file into the page a reader opens, the drawer that measures every figure from its own text, and the checker that treats a connector as a claim.", "keywords": ["page", "render", "figure", "svg", "generated", "markers"]}
-->

# Pages in spn-devex

`For: Architect · Editor` · `Status: ✅ DONE` · `Realizes: Pages`

A page is the HTML a reader opens, produced from the markdown an author writes. `spn-devex` realizes the whole production: the renderer, the figure drawer, the figure checker, and the commands that run them. One rule decides the design of all four. **A page is never edited by hand.** The author writes the seat file, the tool writes the page, and the audit re-produces the page to compare — so a header can never disagree with the block it was rendered from, and a hand edit is found rather than inherited.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The renderer | `plugins/spn-devex/src/scripts/lib/render.ts` | the body from the markdown, then the header, the tag line and the furniture |
| The figure drawer | `plugins/spn-devex/src/scripts/lib/draw.ts` | a fenced `dg` spec turned into inline SVG |
| The figure checker | `plugins/spn-devex/src/scripts/lib/figures.ts` | labels fit, connectors join, and a coloured code block matches its own text |
| The commands | `plugins/spn-devex/src/scripts/tools/docs.ts` | `page` produces, `face` writes the generated regions, `figures` checks |
| The block vocabulary | `plugins/spn-devex/src/refs/devex/workspace/docs/blocks.md` | the blocks an author types, in the spelling they type them |

## Follows the pattern

- The header, the blocks and the figures a page carries — the foundation's `02-docs/05-artifacts.md`
- The metadata block every document opens with — the foundation's `02-docs/02-document.md`

## Special handling

### A small renderer, not a markdown library

**Why** — *a partner installs nothing to read a document*. A dependency would have to be on the machine before the page could be produced.
**What** — the seat file's grammar is closed — headings, paragraphs, tables, lists and fenced blocks — so the renderer covers that grammar and no more.
**How** — the file is a few hundred lines with no imports beyond the drawer and the colouring. `plugins/spn-devex/src/scripts/lib/render.ts`.

### The produced page is compared byte for byte

**Why** — *a page a person edited is a second source of truth*, and the edit survives until the next production run silently overwrites it.
**What** — the audit re-renders the seat file with the same link rewriter the production used, and any difference is refused with one message: edit the seat file and produce it again.
**How** — the pocket mirrors the seat folder for folder, so the pair is found by path alone. `plugins/spn-devex/src/scripts/tools/docs.ts`, `checkProduced`.

### Nothing in a figure is drawn by eye

**Why** — *a connector is a claim that two things touch*, which is what makes a figure checkable rather than a matter of taste.
**What** — every box is measured from its own text, so a connector lands on an edge and a label fits by construction. The canvas is 1100 wide with three type sizes and no fourth.
**How** — the shape carries the meaning, so a decision reads as a decision before its label is read. `plugins/spn-devex/src/scripts/lib/draw.ts`.

### A figure check reads the drawn result, not the spec

**Why** — *a hand-drawn figure is the one nothing measured*. Every fault found on 22 September 2026 was in hand-written SVG, and every drawer-produced figure was already clean.
**What** — the checker asks whether each label fits its box, whether every connector starts and ends on a box edge or another connector, whether a connector has visible shaft, and whether anything hugs the edge of the canvas. A label lying across its neighbour used to pass, because a label was only ever compared with the box containing it.
**How** — the same file also colours a code block, and the audit's other half re-colours the block from its own text to prove the colouring was produced rather than typed. `plugins/spn-devex/src/scripts/lib/figures.ts`.

### Generated regions are bounded, and a hand edit inside them is lost

**Why** — *part of a face is written and part is generated*, and the two must be told apart without a second file.
**What** — the dictionary and a capability face's map sit between named markers that say what writes them. The rest of the face is the author's.
**How** — the capability face declares its own source root, so a repository whose source is not `src/` — this one, whose plugins are the source — generates a map naming folders that exist. `plugins/spn-devex/src/scripts/tools/docs.ts`, `buildMap` and `face`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the page templates and the stylesheet the furniture is built from | the look is stated once, in the book |
| publishes | spn-devex's tools | the renderer and the checker, imported by the audit rather than reimplemented in it | one page shape for production and for comparison |
| publishes | every author in the workspace | the block vocabulary a seat file is written in | the author types blocks, never HTML |
