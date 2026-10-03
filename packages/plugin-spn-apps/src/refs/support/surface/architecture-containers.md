<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/08-architecture-containers.md",
      "seen": "2c8a85bd"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/08-architecture-containers/",
      "seen": "c816ab8f"
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

The parts sit in one order: the header, then the content, then the footer. The header places its first block at the start and its last at the end. The footer starts its blocks at the start edge. A part holds anything: a `div`, a text, a block or a page's own component. The look of a container is four props, and nothing else.

## The look — 🔮

| Prop | Values | What it decides |
| --- | --- | --- |
| `frames` | a list: any of `HEADER`, `CONTENT`, `FOOTER` | which parts the frame holds. A part that is not listed sits flat on the page |
| `raised` | yes or no | whether the frame is filled with the raised surface and lifted |
| `bordered` | yes or no | whether the frame has a border. Inside a bordered frame, a line divides each two parts the frame holds. Blocks that need no line between them sit in one content part |
| `rounded` | yes or no | whether the corners of the frame are rounded |

A container also takes `size`, which sets the density of every block inside it (`architecture-app.md`).

## A part and its inset — 🔮

A part insets its content, and the page decides what fills a part.

| The part | Its inset |
| --- | --- |
| In the frame, with nothing written | the padding of the container's size step, once around everything in it |
| In the frame, with `flush` | none |
| Not in the frame: the container is flat, or `frames` does not list the part | none, so `flush` changes nothing |

Write `flush` on a part whose content reaches the edge of the frame, such as a table. Let `flush` describe the content, and never the look. A theme can change the frame from flat to bordered to raised, and no page changes.

| Space | Owner |
| --- | --- |
| The frame | the container |
| The inset of a part | the part |
| The gap between two blocks in a part | the page |
| A block's border | the block |
| The gap between two containers | the page |

A container takes no background color, no padding value, no margin, no container inside it, and no prop named `variant`. It takes no child that is not one of its parts. The card, `DSCard`, stays a separate block beside it, taking `raised`, `bordered` and `rounded`.

## A frame is drawn once — 🔮

A frame is drawn once on any part of a page. The page follows that rule, and no code enforces it. A block never changes because of where it sits — it reacts to one thing only: sitting in a `flush` part.

| A block in a `flush` part | What it does |
| --- | --- |
| `DSTable` · `DSCodeBlockView` · `DSAccordion` · `DSAccordionGroup` · `DSEmpty` | draws no border and no rounding of its own. Its own `bordered` still wins |
| `DSAccordion` · `DSWDataTable` | keeps its own text off the edge of the frame |
| `DSList` · `DSWDataTable` | draws no border on any page, so it has none to leave out, and takes no `bordered` |
| Any other block | nothing. It reaches the edge |
| A block inside the one that reacted | nothing. The setting stops at the block that used it |
| A block inside a card, or inside an overlay | nothing. A block that draws a frame of its own starts a new one |

A block with `bordered` in a `flush` part keeps its border, because its own prop wins — the page then shows two lines, and the `UX` lens reports it as a finding. A popover draws its own surface; a block that opens a popover draws no surface of its own around it.

## Boundary

This ref states what frames a part of a page, what that frame looks like, and what a block does inside it. It stops at the edge of the part. It does not state what frames the whole page — that is `architecture-layouts.md`. It does not state where the app's choice for `raised`, `bordered`, `rounded` and `frames` comes from, or how `size` reaches a block — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.147` | the parts of a container, the four props of its look, and what it refuses |
| `RD.SUPPORT.APPS.162` | inside a bordered frame, a line divides each two parts the frame holds |
| `RD.SUPPORT.APPS.155` | the page decides what fills a part, with `flush`, and a block never changes by where it sits |
| `RD.SUPPORT.APPS.148` | the card stays a separate block beside the container |
| `RD.SUPPORT.APPS.149` | a frame is drawn once, and which blocks pass a size and the frame setting on |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
