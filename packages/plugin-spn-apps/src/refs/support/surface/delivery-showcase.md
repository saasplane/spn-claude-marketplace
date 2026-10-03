<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/12-delivery-showcase.md",
      "seen": "d2ccb335"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/12-delivery-showcase/",
      "seen": "03cc01a5"
    }
  ]
}
-->

# Delivery Showcase — The Proof Every Realization Delivers

Source of truth: the foundation's Delivery Showcase construct (`docs/02-constructs/02-support/03-surface/12-delivery-showcase.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/12-delivery-showcase/`). Delivery Showcase is the twelfth of thirteen Surface constructs.

Read this before you add a block to a showcase, or before you judge whether one is complete. A stack that realizes Surface proves it with a showcase: a running catalogue that shows every block as it really draws, like the web's Storybook. The constructs decide how the showcase is arranged; every stack follows the same tree with its own tool — Storybook on the web, a widget catalogue on native. **The thing to unlearn: a showcase is not a demo app a team keeps as it pleases.** It is a checked structure, and a stack builds the pages, never a shape of its own.

## Terms

| Term | What it means |
| --- | --- |
| Showcase | a running catalogue that shows every block as it really draws |
| Group page | one page for a group of components, shared by every block in it |
| Block section | the same five parts, in the same order, on every block's share of its group page |
| Proof layout | the frame a block's section is shown in: inline, panel, overlay or screen |
| Playground | every prop of a block as a control, reached from its section and never from the sidebar |

## The tree — 🔮

Each top-level sidebar entry matches a construct and, where one exists, a library file: Start → `delivery-library.md`; Core → DS 1-core, `architecture-core.md` and `architecture-names.md`; Components (one page per group, Data entry split into Fields / Pickers / Composites) → DS 2-Components, `architecture-components.md`; Widgets → DS 3-Widgets, `architecture-widgets.md`; Containers → DS 4-Containers, `architecture-containers.md`; Layouts → DS 5-Layouts, `architecture-layouts.md`; App → `architecture-app.md`; Patterns → `standards-patterns.md`. The sidebar never nests one section inside another: a group with sub-groups is a section of its own. A component has no page of its own — it is one section on its group's page, and one playground, reached from the section and never listed in the sidebar.

## A block's section — 🔮

Every block section on a group page has the same five parts, in the same order: **Example** (the block with real sample data and its code open underneath, with *Copy*; a sample longer than twelve lines shows its first twelve and *Show all*); **Variants** (its drawn choices side by side: `variant` × `color`, then each `size`); **States** (each shared state it has, and for a block drawn from data, each task state); **Props** (its props table, and *Open playground*); **Links** (its drawing in the library and its chapter in the book).

## Four proof layouts — 🔮

| Layout | For | The frame |
| --- | --- | --- |
| Inline | small blocks | a narrow frame, blocks in rows; the variants as a grid |
| Panel | blocks that hold content | the full width of the page, padded |
| Overlay | blocks a person opens | a fixed-height frame with the button that opens it; the open block shown beside it in States |
| Screen | blocks that are a page or most of one | a full-width frame at a page's height, with *Open full screen* |

Each block declares one layout, so its Example and States fit it. The layout decides the frame, never the parts — the same five parts appear in every layout, only the frame of the Example changes.

## What the showcase proves — 🔮

| Who | Outcome |
| --- | --- |
| Designer | finds every block the constructs name, in the section of its group, under its own name; opens its drawing from its section |
| Developer | reads how to use a block: its example with code, its props, its playground; sees each shared state and task state without writing code |
| Partner | changes a theme choice and sees the page repaint |
| Quality engineer | knows a behaviour (keys, focus, task states) is proven, not only shown — the component tier of tests proves it; the showcase only shows the look |

The showcase never restyles a block and never shows one the constructs do not name.

## Boundary

This ref states what a showcase shows, in what tree, and in what frame. It stops at the edge of that catalogue. It does not state which blocks or groups exist — that is `architecture-components.md` and every construct the tree names. It does not state how a block is drawn before it is built — that is `delivery-library.md`. It does not state how a stack builds the showcase, with which tool — that is `providers.md`. And it does not prove a behaviour: the showcase shows a block, and proving what it does is the component tier of tests.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
