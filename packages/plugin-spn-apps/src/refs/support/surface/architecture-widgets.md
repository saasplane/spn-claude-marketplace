<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/07-architecture-widgets.md",
      "seen": "8825dfbd"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/07-architecture-widgets/",
      "seen": "e395ff6a"
    }
  ]
}
-->

# Widgets — Blocks Built for One Purpose

Source of truth: the foundation's Widgets construct (`docs/02-constructs/02-support/03-surface/07-architecture-widgets.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/07-architecture-widgets/`). Widgets is the seventh of thirteen Surface constructs.

Read this before you place a data table, a filter bar or a card drawn from data, or before you decide whether a new block should be a widget or a composed page. **The thing to unlearn: a widget is not just a bigger component.** A component is the smallest block; a widget is built *from* components, for one purpose, and placed as a whole — a page never reaches inside it to rearrange its parts.

## Terms

| Term | What it means |
| --- | --- |
| Widget | a block built for one purpose, from components, placed whole on a page |

A widget's task states are the task state of `standards-interaction.md`, and this ref carries no second definition of them. A widget adds no states of its own. It may name the kinds of its own parts, as the card widget does with `DSCardWidgetPartType`.

## What makes a block a widget — 🔮

A widget is built for one purpose. It is not a set of components a page composes one at a time; it is one piece, and the widget itself places and wires the parts inside it. A widget takes one size, from its own prop or from the block above it, and **passes that size to every part inside it** — a page sets one size for the whole widget, and never dresses its parts separately.

**Surface's core widgets are the data table `DSDataTableWidget`, the filter bar `DSFilterBarWidget` and the card widget `DSCardWidget`** (`RD.SUPPORT.SURFACE.099`, `RD.SUPPORT.SURFACE.127`). Every stack builds each of them, and the design library draws each of them. A stack may provide further widgets of its own, as `architecture-components.md` states under the core units and a stack's own. This ref does not name them, and the library does not draw them.

**Every widget, a core one or a stack's own, ends its name in `Widget`, with no letter for its layer before the name** (`RD.SUPPORT.SURFACE.098`). `architecture-names.md` states the rule for the three layers, and the names that belong to a widget.

## DSDataTableWidget — 🔮

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
- An empty message given as plain text **MUST** be drawn as the standard empty state, `DSEmpty`, with the text as its title and a default icon: an inbox, `INBOX`, where there is no record at all, and a magnifier, `SEARCH`, where the filter found none. It shows no line under the title. A page that gives a block of its own as the message gets that block, drawn as it is, so a page that needs a description or an action writes its own `DSEmpty` there. The web builds the default icon of each case.
- `DSDataTableWidget` **MUST** take one size, from its own prop or the block above it, and **MUST** pass it to its bar, its records and its pager.
- When its records are shown as a table, `DSDataTableWidget` **MUST** turn the table's `hoverable` prop on. A person acts on a record of this widget, so a row under the pointer says that it answers. A plain `DSTable` leaves it off unless the theme turns it on, because a row that does nothing when it is pressed should not react. The page sets nothing for it, and the theme does not turn it off, because the widget gives the table its `hoverable` and a prop that is given wins over the theme.
- The `striped` of the table layout **MUST** follow the order of the table: the setting where the page gives it, else the value of the theme, else off (`RD.SUPPORT.SURFACE.126`).
- The footer **MUST** arrange itself by the width of its own place, as its pager does (`RD.SUPPORT.SURFACE.133`). In a wide place the count stands at the start and the pager at the end of one line. In a narrow place the count stands on a line of its own above the pager, each in the middle.

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
- **A line of the `LIST` layout MUST be an item line, `DSItem`** (`RD.SUPPORT.SURFACE.097`). The page gives the title, the description and the facts of a record, and every list of every data table then reads the same way. The widget's rows carry no padding of their own, so the item line's padding is the only one, and the widget lines the item up with the title of the container it stands in. A page that draws a block of its own in place of an item line brings that block's padding itself.
- **When its records are shown as a list, `DSDataTableWidget` MUST turn `hoverable` on, as it does for a table.** The row under the pointer answers in both layouts. The row carries the reaction, and the item line inside it carries none.
- **A line of the `LIST` layout MUST follow the rules of content of `standards-core.md`.** Its state is a badge on the line of facts, the normal state shows none, and a line stands between each two lines. The widget draws the line between each two lines itself. What a line holds is the page's renderer, so the badge and its place are the page's to write.

**What the widget does.** The widget draws the layouts a page lists, and it reads no device type. The page chooses, and the widget follows what the page lists each time it draws: the layout a person chose while the page still lists it, and the first of the list otherwise. So the page reads the live device, `useDSContext().device`, and lists `LIST` on a phone, and the widget shows the list at once when the screen becomes a phone. The widget does not change to `LIST` by itself. A page that lists `TABLE` alone shows a table on a phone.

### The record in view

A page may show one record of the table beside the table or under it, such as the detail of an order. The table then marks that record, so a person sees which row the detail belongs to.

- **`DSDataTableWidget` MUST take the id of the record in view, as `selectedRecordId` in the `data` of its config** (`RD.SUPPORT.SURFACE.125`). The widget compares that id with the id of each record, which it reads through `getRecordId` of its data.
- **The `LIST` layout and the `TABLE` layout MUST draw the row of that record as the row in view,** with the band of a chosen row of a list and `aria-current="true"`. The `GRID` layout ignores the setting.
- **The page MUST give the id, and the widget MUST hold no state for it.** The page usually reads the id from the address. A person who presses a row follows the link or the action of that row, and the page then gives the new id. A page with no record in view gives no id, and no row is marked.
- **The record in view is not a record that a person ticked.** The bulk select of the bar ticks records to act on many of them, and it keeps its own look. A ticked record is checked, and the record in view is selected. A record may be both at once.

### A search and a filter go to the server

- **A search and a filter of the records MUST be sent to the server** (`RD.SUPPORT.SURFACE.070`). They **MUST NOT** be run in the page over the records already loaded. The widget holds one page of the records. A search over what is loaded would miss every record on another page, and a person would read *nothing matches* when something does.

The widget asks the page for each page of records through `getData`, with the page number, the records for each page and the sort. The page sends its search and its filters to the server in that same read.

### A row ends with its actions

- **In every layout the actions of a record MUST stand at the end of its row, its line or its card** (`RD.SUPPORT.SURFACE.071`). They are shown as icons, or behind one action that opens them. A person then finds them in the same place on every record.
- **What else stands at the end of a row is the page's own** (`RD.SUPPORT.SURFACE.059`). A badge may stand there with the actions, as the rules of content of `standards-core.md` state.
- **Three more parts of this rule are proposed, and not yet confirmed.** One action stands on the row itself. Two or more go behind one action. A press on a row opens the record.

### The widths of the columns

- **In the `TABLE` layout, the tick column and the actions column MUST be as wide as what they hold** (`RD.SUPPORT.SURFACE.134`). Neither column takes a share of the spare width of the table, at any size.
- **The spare width MUST go to the data columns that state no width.** A data column that states a width keeps it.
- **Where every data column states a width, each width MUST be a least width, and the columns share the spare width in proportion to it.** A table narrower than its columns scrolls sideways, and no column is narrower than the width it states.
- **The cells at the two ends of the head MUST take the insets of the cells of the body under them.** So in every column what the head holds starts where what the rows hold starts.

### A value changed in a table is changed in its cell

A row is read until a person chooses to change it.

| Step | What the person sees |
| --- | --- |
| The row is read | each cell shows its value as words, and the action at the end of the row opens the row |
| The row is opened | the cell turns from words into a box as wide as the cell. The action that saves the value stands beside the box, and the action that leaves it unchanged stands after that |
| On a phone | the same table is in its `LIST` layout. A row that is read is a line. The row that is being changed is its text with the box under it, and the same two actions beside the box |

- **A value changed in a table MUST be changed in its cell** (`RD.SUPPORT.SURFACE.072`). Nothing opens over the page, and the page holds no form.
- **One row MUST be changed at a time.** So one value is saved at a time, and a person always knows what a save will write.

**What the widget does.** `DSDataTableWidget` does this for a value that is text. A page puts `edit` on one column of the `TABLE` layout, and on the `LIST` layout: `getValue(record)`, `onSave(record, value)` and an optional `placeholder`. The widget then adds the action that opens a row, first among the actions at the end of the row. It draws the box and the two actions, keeps one row open at a time, and closes a row that is open when a person opens another, without saving it. After a save it reads its page again. A save that fails keeps the box open with what was typed, and says why. The renderer of the `LIST` layout gets `isEditing` as its second argument, so it leaves the value's own line out of the row that is open. A second column with `edit` in one layout is refused.

**Not there yet.** A value of another kind, such as a choice or a date, is not changed in a cell.

## DSFilterBarWidget — 🔮

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

**What the widget does.** `DSFilterBarWidget` draws the fields, the action that shows the hidden ones, the line, and the search and clear actions in this order. Its fields share the width equally. It draws the filter icon in a round shape, as tall as the fields beside it. It keeps in view the fields a page marks `primary`, and beside them a number of the others: up to `moreLimit` at a desktop, three unless the page sets it, and up to `moreLimitTablet` at a tablet, one unless the page sets it. So the bar holds fewer fields at a tablet by itself. On a phone it is the one button: the button opens the fields in a drawer from the bottom of the screen. With no filter on, the button reads *Filters* and the clear action is not shown.

## DSCardWidget — 🔮

`DSCardWidget` shows one thing as a card: a head, its parts, and a footer, always in that order. A page gives it data, and the widget draws the card through `DSCard` and its parts, `DSItem`, `DSList` and `DSList.Item`. So every such card of an app starts its head, its rows and its empty words on the same line.

| Part | The page gives | What the widget draws |
| --- | --- | --- |
| Its head | `header`, the props of `DSItem`, whole | an item line that stands flush in the header of the card, at the page level `SECTION` where the page gives none. A card with no `header` has no head |
| Its parts | `parts`, a list in which each part is of one kind | each part in the order given |
| Its footer | `footer`, any node | the node in the footer of the card. A card with no `footer` has no footer part |

- **`DSCardWidget` MUST take each group of its settings as the props of the unit that draws it, whole** (`RD.SUPPORT.SURFACE.127`). Its head and the small head of a part are the props of `DSItem`. An item of a part is the props of `DSItem`, and a row of a part is the props of `DSList.Item`. A page that knows those units knows the widget. So the picture of a head or of an item is the `media` of `DSItem`, given as data of one kind.

A part states its kind in `mtype`, which takes `DSCardWidgetPartType`. Every part also takes `key`, and `header`, the props of `DSItem` for the small head of the part. That head is drawn at the page level `GROUP` where the page gives none.

| Kind | The page gives | What the widget draws |
| --- | --- | --- |
| `ITEMS` | `items`, each the props of `DSItem` with a `key` and, where the page gives it, `selected`; and `emptyText`, `divided` and `hoverable` | a `DSList` whose rows each hold a `DSItem` |
| `LIST` | `rows`, each the props of `DSList.Item` with a `key`; and `emptyText`, `divided` and `hoverable` | a `DSList` with the rows as they are given |
| `FREE` | `node`, any node; and `flush` | the node, in the inset of the card. With `flush` the part takes the inset of the card off |

- **A page chooses the kind by what it holds.** A page that holds records as item lines gives `ITEMS`, and the widget builds the list. A page that needs a row of its own gives `LIST`. Anything else, such as a group of buttons, is `FREE`.
- **The widget decides where things start, so a page does not.** An `ITEMS` part and a `LIST` part run from edge to edge of the card, and their rows pad to the inset of the card. The small head of a part, its rows and its empty words start on one line.
- **A part with no row MUST draw its `emptyText`, in the inset of the card and in the muted tone.** With no `emptyText` it draws its head alone.
- **A row of an `ITEMS` part MUST hold one link, and never a link inside a link.** What `endNode` holds stays outside the link, so a press on an action there does the action and does not follow the link.
- **A row of an `ITEMS` part or of a `LIST` part MAY be `selected`.** The page says which row is chosen, and the widget draws it as a chosen row of a list, with the band and `aria-current="true"`. The widget holds no state for it.
- **The widget MUST take `raised`, `bordered` and `rounded` for the surface of its card, and `fullHeight`, and MUST hand each to its `DSCard`.** One that the page does not give follows the card look of the theme (`architecture-app.md`).
- **The widget MUST take `divided` from its own prop where the prop is given, else from the theme's `cardWidget`, else off** (`RD.SUPPORT.SURFACE.128`). `divided` draws the lines between the head, the parts and the footer of the card.
- **The rows of an `ITEMS` part and of a `LIST` part take `divided` from the prop of the part, else from `rowsDivided` of the theme's `cardWidget`, else on. They take `hoverable` from the prop of the part, else from `rowsHoverable`, else off.** A prop that says no is given, so a part that says no wins over a theme that says yes.
- **The widget MUST take one `size`, and MUST pass it to its head, its lists and its rows.**
- **The widget MUST NOT fold rows away.** A row that a page wants hidden, or shown in another way, is the page's to place, usually in a `FREE` part or in the footer.
- **The widget has no paging, no search, and no working or failed state.** A set that needs them is a `DSDataTableWidget`.
- **The widget takes no `anchor` around the whole card, and no `className`, `style` or `minWidth`.** A card that is one link, or that needs a style of its own, is a `DSCard` that the page writes.

## Boundary

This ref states what makes a block a widget, and what `DSDataTableWidget`, `DSFilterBarWidget` and `DSCardWidget` are built from. It stops at the edge of the widget. It does not state how a page shows a list beside the detail of its chosen row. That is a page pattern, groups and their items, and `architecture-containers.md` states what a person sees on such a page. No core widget is built for it: the web stack has a unit of its own, `DSListDetailWidget`, which `providers.md` names. It does not state what a component is — that is `architecture-components.md`. It does not state what fills a part of a container, or what a widget does in a `flush` part — that is `architecture-containers.md`. It does not state where a widget's size comes from when none is set — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.SURFACE.099` | the data table and the filter bar are core widgets, and the unit for a list beside its detail is not a core unit |
| `RD.SUPPORT.SURFACE.127` | the card widget is a core widget, each group of its settings is the props of the unit that draws it, the kinds of its parts, and it folds no rows away |
| `RD.SUPPORT.SURFACE.128` | the order the card widget takes its lines and the hover of its rows in: its own prop, else the theme's card widget look |
| `RD.SUPPORT.SURFACE.125` | a data table takes the id of the record in view, and draws its row in the `LIST` and `TABLE` layouts |
| `RD.SUPPORT.SURFACE.126` | the `striped` of the table layout follows the order of the table: the setting, else the theme, else off |
| `RD.SUPPORT.SURFACE.134` | the tick column and the actions column are as wide as what they hold, and where the spare width of a table goes |
| `RD.SUPPORT.SURFACE.133` | the footer of the data table arranges itself by the width of its own place |
| `RD.SUPPORT.SURFACE.059` | what stands at the end of a row beside its actions is the page's own |
| `RD.SUPPORT.SURFACE.098` | a widget's name ends in `Widget`, with no letter for the layer before it |
| `RD.SUPPORT.SURFACE.068` | the layout of the data table is chosen from the data, and it is `LIST` on a phone. That `LIST` also takes the place of `GRID` on a phone is proposed |
| `RD.SUPPORT.SURFACE.069` | many groups a person searches are in the `LIST` layout, and never in `TABLE` |
| `RD.SUPPORT.SURFACE.097` | a line of the `LIST` layout is an item line, and in a list the row carries the link, the chosen fill and the reaction to the pointer |
| `RD.SUPPORT.SURFACE.070` | a search and a filter of the records are sent to the server |
| `RD.SUPPORT.SURFACE.071` | the actions of a record stand at the end of its row, its line or its card. How many stand on the row, and what a press on a row does, are proposed |
| `RD.SUPPORT.SURFACE.072` | a value changed in a table is changed in its cell, one row at a time |
| `RD.SUPPORT.SURFACE.073` | the one form of the filter bar, at a desktop, at a tablet and on a phone |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task. The web builds the record in view, the widths of the columns, the footer that arranges itself by its place and `DSCardWidget`. The design library has drawn none of them yet.
