<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/07-architecture-widgets.md",
      "seen": "e77d1488"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/07-architecture-widgets/",
      "seen": "89d80782"
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
- A read refused because the person is no longer signed in belongs to the app, which sends the person to sign in. The table shows its refused state for a read the person may not make.
- The two empty messages **MUST** differ.
- `DSWDataTable` **MUST** take one size, from its own prop or the block above it, and **MUST** pass it to its bar, its records and its pager.
- When its records are shown as a table, `DSWDataTable` **MUST** turn the table's `hoverable` prop on. A person acts on a record of this widget, so a row under the pointer says that it answers. A plain `DSTable` leaves it off, because a row that does nothing when it is pressed should not react.

### The three layouts

The records take one of three layouts, and the data decides which. The widget is the same in each: it keeps its bar, its paging and its task states. So a page changes a layout and builds nothing new.

| Layout | Shows one record as | Used when |
| --- | --- | --- |
| `TABLE` | a row of cells, under headings | one record holds several facts a person compares across rows, at a desktop and a tablet |
| `LIST` | a line: a title, with a line of facts under it | one record is read by its name; and on a phone, in place of `TABLE` and of `GRID`; and where the records are many groups a person searches |
| `GRID` | a card | the set is shown as cards, because each record is a thing of its own: a kind to set up, an app, a file with a preview |

- **A page MUST choose the layout from the data, by the table above** (`RD.SUPPORT.SURFACE.068`). It lists the layout in the widget's `layouts`, with the columns or the renderer of that layout.
- **On a phone the records MUST be in the `LIST` layout.** A phone has no room for columns, or for cards side by side. At a tablet `TABLE` shows fewer columns, and `GRID` fewer cards across. That `LIST` stands on a phone, also in place of `GRID`, is proposed and not yet confirmed.
- **Many groups that a person searches MUST be in the `LIST` layout, and never in `TABLE`** (`RD.SUPPORT.SURFACE.069`). A group is read by its name, as a line, and the groups stand in a narrow part of the page. A person picks one group and does not compare groups across columns.
- **A line of the `LIST` layout MUST follow the rules of content of `standards-core.md`.** Its state is a badge on the line of facts, the normal state shows none, and a line stands between each two lines. The widget draws the line between each two lines itself. What a line holds is the page's renderer, so the badge and its place are the page's to write.

**Not there yet.** The widget draws the layouts a page lists, and it reads no device type today. So it does not change to `LIST` on a phone by itself. A page that lists `TABLE` alone shows a table on a phone.

### A search and a filter go to the server

- **A search and a filter of the records MUST be sent to the server** (`RD.SUPPORT.SURFACE.070`). They **MUST NOT** be run in the page over the records already loaded. The widget holds one page of the records. A search over what is loaded would miss every record on another page, and a person would read *nothing matches* when something does.

The widget asks the page for each page of records through `getData`, with the page number, the records for each page and the sort. The page sends its search and its filters to the server in that same read.

### A row ends with its actions

- **In every layout the actions of a record MUST stand at the end of its row, its line or its card** (`RD.SUPPORT.SURFACE.071`). They are shown as icons, or behind one action that opens them. A person then finds them in the same place on every record.
- **The end of a row MUST hold nothing else** (`RD.SUPPORT.SURFACE.059`). A state there would look like something to press.
- **Three more parts of this rule are proposed, and not yet confirmed.** One action stands on the row itself. Two or more go behind one action. A press on a row opens the record.

### A value changed in a table is changed in its cell

A row is read until a person chooses to change it.

| Step | What the person sees |
| --- | --- |
| The row is read | each cell shows its value as words, and the action at the end of the row opens the row |
| The row is opened | the cell turns from words into a box as wide as the cell. The action that saves the value stands beside the box, and the action that leaves it unchanged stands after that |
| On a phone | the same table is in its `LIST` layout. A row that is read is a line. The row that is being changed is its text with the box under it, and the same two actions beside the box |

- **A value changed in a table MUST be changed in its cell** (`RD.SUPPORT.SURFACE.072`). Nothing opens over the page, and the page holds no form.
- **One row MUST be changed at a time.** So one value is saved at a time, and a person always knows what a save will write.

**Not there yet.** `DSWDataTable` has no cell that turns into a box with a save action. A cell today draws what the column's renderer gives it. The web stack adds this cell by its own change.

## DSWFilterBar — 🔮

A row of fields a person narrows records by. It holds one field for each filter: a text, a choice of one, a choice of several, a yes-or-no, a date, or a range of dates. Each field matches one field of the records underneath. The bar also holds the actions that search and that clear every filter at once.

- A field **MAY** sit inline, or wait behind the action that shows the hidden filters. A bar with many fields keeps the few a person reaches for most, and folds the rest away.
- What is applied **MUST** show back to the person in the bar itself. Each field keeps its chosen value, and on a phone the count on *Filters (n)* says how many are applied.
- A text field **MUST** apply on the key that submits a form. A person who types a search term and presses it does not also have to find a button.

### The form of the bar

The bar has one form, read from its start to its end. A person who has used one filter bar then knows every other.

| Place in the bar | Holds | Why |
| --- | --- | --- |
| Its start | the filter icon. It is a mark and not an action, so it is round | it says what the bar is, and its round shape tells it from the actions at the end of the bar |
| Its fields | the boxes of the filters in view, which share the width of the bar equally | no filter looks more important than the next, and the bar keeps one shape whatever its fields are |
| After the fields | the action that shows the filters that are hidden | it belongs to the fields, so it stands with them |
| Its end | a line, and after it the two actions that search and clear | the line sets apart the actions that run the filters from the action that only shows more of them |

- **A realization MUST draw the bar in this form, and a page MUST NOT rearrange it** (`RD.SUPPORT.SURFACE.073`). The page gives the bar its fields and says which stay in view.
- **At a tablet the bar MUST hold fewer fields in view, and the rest wait behind the action that shows them.** A tablet has less width than a desktop, so fewer boxes fit across it.
- **On a phone the bar MUST be one button that says how many filters are on, such as *Filters (2)*, with the action that clears them beside it.** A phone has no room for a row of boxes. One button keeps the records in view. Its number tells a person that the records are narrowed before they open anything.

**What the widget does today.** `DSWFilterBar` draws the fields, the action that shows the hidden ones, the line, and the search and clear actions in this order. Its fields share the width equally. On a phone it is the one button already: the button opens the fields in a drawer from the bottom of the screen. With no filter on, the button reads *Filters* and the clear action is not shown.

**Not there yet.** Two things differ today. The widget draws the filter icon plain, with no round shape around it. And it keeps the same fields in view at a desktop and a tablet: the fields a page marks `primary`, and up to `moreLimit` others, three unless the page sets it. So the bar does not hold fewer fields at a tablet by itself.

## Boundary

This ref states what makes a block a widget, and what `DSWDataTable` and `DSWFilterBar` are built from. It stops at the edge of the widget. It does not state what a component is — that is `architecture-components.md`. It does not state what fills a part of a container, or what a widget does in a `flush` part — that is `architecture-containers.md`. It does not state where a widget's size comes from when none is set — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.068` | the layout of the data table is chosen from the data, and it is `LIST` on a phone. That `LIST` also takes the place of `GRID` on a phone is proposed |
| `RD.SUPPORT.SURFACE.069` | many groups a person searches are in the `LIST` layout, and never in `TABLE` |
| `RD.SUPPORT.SURFACE.070` | a search and a filter of the records are sent to the server |
| `RD.SUPPORT.SURFACE.071` | the actions of a record stand at the end of its row, its line or its card. How many stand on the row, and what a press on a row does, are proposed |
| `RD.SUPPORT.SURFACE.072` | a value changed in a table is changed in its cell, one row at a time |
| `RD.SUPPORT.SURFACE.073` | the one form of the filter bar, at a desktop, at a tablet and on a phone |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
