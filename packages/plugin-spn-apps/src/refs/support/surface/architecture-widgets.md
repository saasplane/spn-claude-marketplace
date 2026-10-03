<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/07-architecture-widgets.md",
      "seen": "620a6471"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/07-architecture-widgets/",
      "seen": "0abb52c7"
    }
  ]
}
-->

# Widgets — Blocks Built for One Purpose

Source of truth: the foundation's Widgets construct (`docs/02-constructs/02-support/03-surface/07-architecture-widgets.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/07-architecture-widgets/`). Widgets is the seventh of thirteen Surface constructs.

Read this before you place a data table or a filter bar, or before you decide whether a new block should be a widget or a composed page. **The thing to unlearn: a widget is not just a bigger component.** A component is the smallest block; a widget is built *from* components, for one purpose, and placed as a whole — a page never reaches inside it to rearrange its parts.

## Terms

| Term | What it means |
| --- | --- |
| Widget | a block built for one purpose, from components, placed whole on a page |

A widget's task states are the task state of `standards-interaction.md`, and this ref carries no second definition of them.

## What makes a block a widget — 🔮

A widget is built for one purpose. It is not a set of components a page composes one at a time; it is one piece, and the widget itself places and wires the parts inside it. A widget takes one size, from its own prop or from the block above it, and **passes that size to every part inside it** — a page sets one size for the whole widget, and never dresses its parts separately. Surface has two widgets today.

## DSWDataTable — 🔮

Shows many records as one block: a bar (the bulk select and the bulk actions, present only when the table has bulk actions; then `headerNode`, a place that takes any node the page gives it, such as a search or a filter bar; then the sort; then the layout switch), its records (one shape for the whole widget: table, list or grid of cards), and a footer (the count of what is shown, and the pagination).

| Task state | What it shows |
| --- | --- |
| Idle | nothing has been asked for yet |
| Working | a placeholder the shape of the page that is coming, so records do not jump when they land |
| Done | the records, in the chosen shape |
| Empty, nothing to show | one centered message: there is nothing here yet |
| Empty, a filter leaves nothing | its own message, so a person can tell *nothing is there* from *nothing matches* |
| Failed | the read failed; it says so, and offers a retry |
| Denied | a record, column or action the person may not see or use is left out: hidden or disabled, never drawn and then blocked |

- The bar holds no search and no filter bar of its own. A search or a filter bar is the page's, and goes into `headerNode`.
- A read that fails **MUST** offer a retry.
- The two empty messages **MUST** differ.
- `DSWDataTable` **MUST** take one size, from its own prop or the block above it, and **MUST** pass it to its bar, its records and its pager.

## DSWFilterBar — 🔮

A row of fields a person narrows records by, and what is narrowed shows back to them: its fields (one per filter — a text, a choice of one, a choice of several, a yes-or-no, a date, or a range of dates — matching one field of the records underneath), and what is applied (one removable chip per active filter, and a way to clear every filter at once).

- A field **MAY** sit inline, or wait behind "more." A bar with many fields keeps the few a person reaches for most, and folds the rest away.
- What is applied **MUST** show back as a chip, removable without opening the field again.

## Boundary

This ref states what makes a block a widget, and what `DSWDataTable` and `DSWFilterBar` are built from. It stops at the edge of the widget. It does not state what a component is — that is `architecture-components.md`. It does not state what fills a part of a container, or what a widget does in a `flush` part — that is `architecture-containers.md`. It does not state where a widget's size comes from when none is set — that is `architecture-app.md`.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
