<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/06-architecture-components.md",
      "seen": "2890c98d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/06-architecture-components/",
      "seen": "a081d440"
    }
  ]
}
-->

# Components — The Blocks a Surface Is Built From

Source of truth: the foundation's Components construct (`docs/02-constructs/02-support/03-surface/06-architecture-components.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/06-architecture-components/`). Components is the sixth of thirteen Surface constructs.

Read this before you place a block on a page, before you propose a new one, or before you draw or build a component on a new stack. **The thing to unlearn: a missing control is never a reason to write one inside a page.** A control built inside a page gets none of the theme, the density, the accessibility or the translation that every listed block has. Propose it to the design system. A core unit is named and grouped here, and only then drawn and built.

## Terms

| Term | What it means |
| --- | --- |
| Component | the smallest block: one control, or one way to show something |
| Group | one of the groups a component belongs to. Each answers one need of a surface |
| Host | the block that takes data and draws its item once for each entry |
| Item | the unit a host draws once for each entry of its data |
| Node | `DSDataMenuNodeType` — the kind of one entry a host that draws a tree takes: `ITEM` · `GROUP` · `SECTION` · `SEPARATOR` · `CUSTOM` |
| Item line | `DSItem` — one thing shown as a line: a picture, a title, a description, a line of facts, and what stands at its end |
| Item media type | `DSItemMediaType` — the kind of picture an item line is given: `ICON` · `MARK` · `AVATAR` · `AVATAR_GROUP` · `CUSTOM` |
| Date form | `DSFormatDateType` — the form the two date units write a date in: `DEFAULT`, the date as it is, or `AGO`, how long ago in words |
| Page level | `DSPageLevelType` — the level of a page a block stands at: `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `CONTENT` · `INLINE`. The item line and the tabs take it through `pageLevel` |
| Item media align | `DSItemMediaAlignType` — where the picture of an item line stands against its text: `TOP` · `CENTER` · `BOTTOM`, with `CENTER` when unset |
| Mark | a picture or an icon that stands for a thing or a person. It is round unless a page chooses another shape |
| Core unit | a block the book names, which every stack builds under that name. A stack may provide further units of its own |

An **item line** is not the Item of a host. A host may draw an item line for each entry, and an item line also stands alone, for one thing shown by itself.

A **block** is any unit a surface is built from — a layout, a container, a widget or a component (`standards-core.md`). The component is the smallest of the four.

## The groups — 🔮

Eleven groups, each answering one need of a surface. The list holds the core units: the library draws one page per group, each provider keeps one folder per group, the showcase opens each group of units with an Overview page, and a new core unit joins this list before it is drawn or built anywhere. A stack may provide further units of its own beside them, and this list names none of those.

| Group | Answers | Blocks |
| --- | --- | --- |
| Actions | the ways a person asks for something | `DSButton` · `DSButtonGroup` · `DSToolbar` |
| Data display | how records and values are shown | `DSAccordion` · `DSAccordionGroup` · `DSAddressView` · `DSAvatar` · `DSAvatarGroup` · `DSBadge` · `DSCard` · `DSCarousel` · `DSCodeBlockView` · `DSColorView` · `DSDataFieldView` · `DSDataUnit` · `DSItem` · `DSItemCard` · `DSItemFacts` · `DSJSONView` · `DSList` · `DSTable` |
| Data entry · Fields | every input a form is built from | `DSInput` · `DSInputNumber` · `DSInputOTP` · `DSInputPhone` · `DSTextarea` · `DSLabel` · `DSCheckbox` · `DSCheckboxGroup` · `DSRadio` · `DSRadioGroup` · `DSSwitch` · `DSToggle` · `DSToggleGroup` · `DSToggleGroupMulti` · `DSSlider` · `DSSliderRange` · `DSTagGroup` |
| Data entry · Pickers | choosing from a set, a date or a time | `DSSelect` · `DSSelectMulti` · `DSAutocomplete` · `DSAutocompleteMulti` · `DSCommand` · `DSCommandPalette` · `DSDatePicker` · `DSDateRangePicker` · `DSTimePicker` · `DSDateTimePicker` · `DSCalendar` · `DSColorPicker` |
| Data entry · Composites | the form frame, and inputs built from other inputs | `DSForm` · `DSAddressForm` · `DSAttachment` · `DSAttachmentMulti` · `DSJSONControl` · `DSDataFieldForm` · `DSDataFieldBuilder` · `DSThemeForm` · `DSImagePicker` |
| Feedback | what a surface says while it works, and when it fails | `DSAlert` · `DSSpinner` · `DSToast` · `DSProgress` · `DSProgressCircle` · `DSSkeleton` · `DSEmpty` |
| Structure | the small blocks that divide, scroll or fold a part of a page, or stand it on a fill | `DSCollapsible` · `DSHScroll` · `DSScrollArea` · `DSSeparator` · `DSSurface` |
| Media | images and icons | `DSAspectRatio` · `DSIcon` · `DSMark` · `DSImage` |
| Navigation | moving between places | `DSBreadcrumb` · `DSMenubar` · `DSNavList` · `DSNavMenu` · `DSNavBarSide` · `DSNavBarTop` · `DSNavEntry` · `DSPagination` · `DSTabs` · `DSLink` · `DSAnchor` |
| Overlays | interruption | `DSDialog` · `DSConfirmDialog` · `DSDrawer` · `DSSheet` · `DSBackdrop` |
| Popovers | more, shown beside the block that asked for it | `DSContextMenu` · `DSDropdownMenu` · `DSHoverCard` · `DSPopover` · `DSConfirmPopover` · `DSTooltip` |
| Typography | text | `DSText` · `DSKbd` |
| Utility | blocks with a behaviour and little or no look: they format, gate, place or observe another block, stated by their behaviour and their feedback | `DSFormatCurrency` · `DSFormatDate` · `DSFormatDateTime` · `DSFormatNumber` · `DSFormatTime` · `DSAuthz` · `DSAnchorContainer` · `DSElementObserver` · `DSPortal` · `DSSticky` |

The library draws a sheet for each block of Utility whose behaviour a person feels: a sheet of states for `DSAuthz` (allowed, denied, fallback), `DSSticky` (in flow, stuck) and `DSAnchorContainer`, and one sheet of formats for the formatters. `DSAnchor` of Navigation has a small sheet of states, and `DSAspectRatio` of Media has one sheet of ratios. `DSElementObserver` has an entry with its description and no states, and `DSPortal`, a block of the web alone, has no entry. The widgets, `DSDataTableWidget` and `DSFilterBarWidget`, the container and the layout sit one layer up and each have a construct of their own: `architecture-widgets.md`, `architecture-containers.md`, `architecture-layouts.md`.

**A prop that takes a vocabulary is marked in the book's rows of props.** Beside the prop, the row names the vocabulary, as `type` (`DSTimePickerType`) of `DSTimePicker` or `format` (`SPDateFormatType`) of `DSDatePicker`. The values, and for the design system's own vocabularies the default, are in the tables of `architecture-names.md`. A shared vocabulary of the platform, one named `SP…Type`, is stated in the second of those tables. `variant`, `color` and `size` name no vocabulary in a row, because they take the three shared names and their vocabularies.

## The core units, and a stack's own — 🔮

The surface has two levels (`RD.SUPPORT.SURFACE.081`). The word core unit does not mean the layer Core, which holds the tokens: a core unit sits in any layer from components to layouts.

| Level | Holds | Who states it |
| --- | --- | --- |
| The core | the units the book names, with their props, their vocabularies and their rules; the task patterns; the page patterns and their skeletons | the book, once, for every stack |
| A stack's own | further units that help build apps on that stack, most of them put together from core units | the stack, in its own docs |

- **A stack's design system MUST build every core unit, and it MAY provide further units of its own that help build apps.** Such a unit is usually put together from core units, for a need that many pages of that stack share.
- **The foundation does not drive a stack's own unit, and the book does not name it.** So the list of groups holds none. The stack states it in its own docs, with its props and its rules.
- **A stack's own unit MUST keep every rule a core unit keeps.** It reads the same tokens, takes the three shared names where it has them, and draws each shared state with its one picture.
- **A unit that every stack should build joins the core units, in the book first.** A unit that stays with one stack needs no line there.

So an agent that builds a page reads its pattern and its skeleton from the book. It then picks the units from the stack's design system, the core units and the stack's own, or from a partner's own code.

## The contract every component supports — 🔮

Every realization — the design library's drawing, and each stack's build — gives the same things, whichever block it is: its drawn choices as a property with the choice's own name (`variant`, `color`, `size`); its caller-set states as a property with the state's own name (`disabled`, `loading`); its content as a property named in the book; its behaviour in words, never a description; its permission gate, where the rule that decides stays in words and the denied state is drawn (`permissions`, `enablements`, `authzDenied` name that state); the four shared states it has as the one picture `architecture-names.md` chose; and the size, colour and frame it takes from above as a setting it reads rather than sets anew (`architecture-app.md`).

## A block drawn from data — 🔮

Some blocks are drawn from data: a select from its options, a menu from its nodes, a table from its columns. The **host** takes the data; the **item** is the unit the host draws once for each entry. A field that is drawn (such as `label`, `startIcon`) sits as a property of the item under its own name; the kind of a node sits in one property, `type`; a field that is not drawn (`key`, `data`, `anchor`, `permissions`) and the data shape as a whole stay in the book, in words. **One item serves every host that takes one data shape** — the three menus (dropdown menu, context menu, menubar) take one shape and draw one item; a host whose data differs declares its own item. The same node is drawn differently by where it sits: a group is a section at the top of a menu and a flyout deeper down.

## What a table's rows answer — 🔮

`DSTable` **MUST** take `hoverable`, a yes-or-no prop. A table that is not `hoverable` draws no reaction in its body rows when the pointer rests on one; a table that is `hoverable` fills the body row under the pointer with the table's row-hover fill. A selected row **MUST** keep its selected fill, and a row that holds an open menu **MUST** keep its fill, whichever way `hoverable` is set: the prop decides only whether the pointer changes a row.

The reason is that a hover tells a person the row answers to them. A row that does nothing when it is pressed should not react, so a plain table stays still, and a table whose rows a person acts on turns `hoverable` on. A theme that turns it on does so for every table of the app. `DSDataTableWidget` turns it on. `hoverable` is not a prop for the hover state: hover stays a shown state that the browser produces, and the prop states only whether this block answers to the pointer at all.

- **`DSTable` MUST decide `striped` and `hoverable` in one order: its own prop where the prop is given, else the value of the theme** (`RD.SUPPORT.SURFACE.126`). A prop that says no is given, so a table that says no to `striped` draws no stripes under a theme that says yes. The default theme draws stripes and no hover, and the table keeps no value of its own for an unset theme. The theme holds the two values in its block `table` (`architecture-app.md`).
- **A row of the body of `DSTable` MAY be marked as the row in view, with `selected`** (`RD.SUPPORT.SURFACE.125`). It is the row of the record that the page shows beside the table or under it, such as the order whose detail is open. `selected` is a yes-or-no prop of the row that is no by default. The row in view **MUST** draw the band that a chosen row of a list draws, and it **MUST** carry `aria-current="true"`. It takes no hover fill while it is in view.
- **The row in view and a row that a person ticks MUST NOT share a name or a look.** A person ticks rows to act on many of them at once, and those are the checked records of a data table. One row is in view because its record is open, and it is the `selected` row. A row may be both, and then it shows both.
- **A cell of the head of a table MAY state the width and the least width of its column.**

## What a list's rows carry — 🔮

`DSList` **MUST** take `hoverable`, with the meaning it has on `DSTable` (`RD.SUPPORT.SURFACE.097`). It is a yes-or-no prop that is no by default. A list that is `hoverable` fills the row under the pointer, also where the row is no link. A row that is chosen keeps its fill.

- **In a list the row MUST carry the link, the chosen fill and the reaction to the pointer, and an item line inside it MUST carry none of them.** The row is the whole width, with what stands at its start and at its end, so its fill covers all of it. An item line that stands alone, in a card or a header, carries its own link.
- **`selected` is the row's, and `DSItem` takes none.** A thing is chosen within a set, and the set is the list. So the row of a list, `DSList.Item`, takes `anchor`, `endNode`, `selected` and `showArrow`.
- **A chosen row of a list MUST be drawn as a fill.** A row with `selected` fills its whole width with the subtle tint of primary, and it carries `aria-current="true"`. It takes no hover fill while it is chosen, and it draws no check. The check at the end of a row is the picture of a chosen option of a select or of a menu.
- **A row of a list MUST hold one of three things: plain words, a line of facts, or an item line** (`RD.SUPPORT.SURFACE.132`). A row that is one line of facts holds the unit `DSItemFacts`, which takes `facts` and `pageLevel` and draws the facts as the item line draws its own. A row with a title and a description or facts under it holds a `DSItem`. A row of a list takes no `facts` of its own.
- **`anchor` and `showArrow` stand on both blocks**, because the link and the arrow that says it leads somewhere go together: on the row in a list, and on the item line where it stands alone.
- **The arrow of `showArrow` is off unless a page writes it, and the design system works out no value from the row.** It is a chevron that stands after everything else at the end of the row. **It MUST be drawn as the look-alike of an icon-only ghost button, and it MUST be no control.** So a row that ends in the arrow is as tall as a row that ends in an action, and the arrow and the icon of an action stand in one column. The arrow takes no focus and no press of its own, and it is hidden from a screen reader. The link of the row covers it.
- **An action at the end of a row that is a link MUST NOT follow the link** (`RD.SUPPORT.SURFACE.110`). A press on the action does the action and nothing else, and a press anywhere else on the row follows the link. The row and the list hold this, so a page writes no guard for it.

## What single blocks answer — 🔮

Each rule below is of one block or one prop. The props, their values and their defaults are in `architecture-names.md`.

| Block | Its rule |
| --- | --- |
| `DSButton` | **A button that shows an icon and no label MUST show its label as a tooltip.** The words are those of its `ariaLabel`, shown when the pointer rests on the button and when the keyboard reaches it. A button with a visible label shows none, and a disabled button shows none. `tooltip` takes other words for it, or `false` for none. **An icon-only button that opens a menu MUST keep its tooltip while the pointer rests on it** (`RD.SUPPORT.SURFACE.144`), and the tooltip is gone once the menu is open |
| `DSToolbar` | **A row of controls, and never a menu.** Its parts are `DSToolbar.Item`, `DSToolbar.Group` and `DSToolbar.Separator`. An item is drawn as a `DSButton` at the size of the toolbar. The arrow keys move between the items, so the whole toolbar is one stop for the Tab key. `bordered` draws the frame around the row, and a toolbar inside another surface turns it off |
| `DSTable` | **A cell, head or data, MAY take `verticalAlignment`** (`RD.SUPPORT.SURFACE.177`). It says where the content sits when the row is taller than it: `TOP`, `MIDDLE` or `BOTTOM` (`DSVerticalAlignmentType`). Left out, the content sits in the middle. A cell takes no class for it |
| `DSTable` | **A data cell MAY be `marked`.** A marked cell is the one that stands out in its row, such as the name of a record. Its text is drawn in the medium weight and the default text colour. No cell is marked by default |
| `DSList` | **A list of several columns draws its own gap** (`RD.SUPPORT.SURFACE.177`): wide between the columns and narrow between the rows. A list of one column draws none |
| `DSTable`, `DSList` | **A fixed ordered set MAY reorder, through `reorder`** (`RD.SUPPORT.SURFACE.182`). `reorder` is `IDSReorder`, with one function, `onReorder`, which takes a move: the `id` of the row, its `toIndex` and the full order `ids`. A row of the table body or an item of the list takes `reorderId`. A row with a `reorderId` in a block with `reorder` draws a handle, in a first cell of its own in a table (the head row has an empty cell for it) and at the start of the item in a list. A person moves it by dragging the handle, or with Alt and the up or down arrow on the focused handle, one place; a polite live region says the new place, a line at the drop place in the focus colour shows where the row lands, and Escape cancels. A row with no `reorderId` has no handle and does not move. The block calls `onReorder` once for a move, shows the new order at once and keeps no order of its own: the page holds the order and draws its rows in it, and when `onReorder` answers `false` or fails the block shows the order it had before. The drag is the browser's own. It is for a set whose order is the meaning and that is small enough to show whole; `DSDataTableWidget`, ordered by its viewer's sort, never takes it |
| `DSCard` | **A card MAY hold the parts `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`.** A part pads itself, from the size of the card. Each part takes `flush`, which drops that padding so that what the part holds reaches the edge of the card, and no other prop. The title of a card is an item line in its header, and it starts where what the card holds starts. `divided` draws a line between each two parts, from edge to edge. It is a prop of the card that the page writes, and it is no by default. A card takes `raised`, `bordered` and `rounded` from its own prop where the prop is given, else from the card look of the theme (`architecture-app.md`). **A container or a card that holds parts, or more than one content part, MUST have a title:** an item line in its header, at the level its box gives, `CONTAINER` for a container and `WIDGET` for a card. A card that is one plain block of content needs none. `fullHeight` makes the card fill the height of its place, so the cards of one row of a grid end on one line. A content part of a card is never shorter than what it holds, and only the last content part grows to fill the card, so the footer stands at the end. What then tells a card from a container is in `architecture-containers.md` |
| `DSItem` | **A `DSItem` draws its picture, its text and its end node, and nothing around them** (`RD.SUPPORT.SURFACE.175`). It takes no padding, no border and no fill under the pointer, at any level and at any size, and no `bleed`. Its `anchor` stays: one link that covers the item, with its end node outside the link and a focus ring. The place it stands in gives it its room and its highlight. A row of `DSList.Item` pads by its size and lights up under the pointer where the row or the item it holds is a link. A row in a `flush` part keeps the padding of its size above and below and takes the inset of its place at its two sides, so its text lines up with a title in a part that insets and its band runs from edge to edge. A data table's list, a card widget's rows, the header and the parts of a container and of a card, the header of an overlay and the trigger of a menu that wraps an item line give that room the same way |
| `DSColorView` | **Shows a stored colour that a person reads:** a small swatch, and the value beside it as text. With no colour it shows a dash, or the words of `emptyLabel`. `swatchOnly` draws the swatch alone. A colour that is part of a block's own look, such as a badge drawn in its colour, is not shown through this block |
| `DSTagGroup` | **A set of tags a person removes from.** Each tag is drawn as a `DSBadge` with its close action, and the keyboard reaches each one. The page holds the set: it adds a tag elsewhere, and takes the tag out when the group reports that one was removed. A choice from a fixed set is `DSToggleGroupMulti`, and not this block |
| `DSToggle` · `DSToggleGroup` · `DSToggleGroupMulti` | **A pressed toggle MUST keep its border in every colour, and a pressed toggle of the default hue MUST take a fill a person can see** (`RD.SUPPORT.SURFACE.146`). A pressed toggle draws `QUIET` of its hue. So the pressed option of a group keeps its edge beside the others. Of the default hue, the pressed fill is `surface-soft-hover`, one step stronger than the fill under the pointer, with the strong border |
| `DSCalendar` | **The month grid by itself, on the page.** It is the grid that `DSDatePicker` opens, with no field and no popover around it. Its value is one date, or none |
| `DSColorPicker` | **A swatch that opens the colour picker of the device, with the colour's code beside it.** `showValue` shows the code in a field, and a person may type the code there in place of picking. **It MUST write and show a hex code in capitals, such as `#1A365D`,** whether typed or picked. A code stored in small letters is shown in capitals and left as stored until a person changes the colour. **A typed colour MUST be a hex code of six digits with its `#`,** in either case, taken when the person presses Enter or leaves the field. A text that is no such code leaves the colour as it was, and the field shows its error state. **It MAY hold no colour:** the swatch then has a dashed edge and no fill, and `clearable` offers an action that empties it |
| `DSProgressCircle` | **Progress as a ring.** The ring fills to `value` out of `max`, and `showValue` writes the value inside it. With `indeterminate` the ring turns and reads no value. It is a block of its own beside `DSProgress`: the bar and the ring share no picture |
| `DSTabs` | **A tab that has an address MUST be a link.** A person can then open it in a new browser tab or copy its address. A plain press still opens the tab in its row. A tab with no address stays a control that opens its panel. **The page level of the tabs MUST decide their size, and their look where the page names no `type`** (`RD.SUPPORT.SURFACE.113`, `RD.SUPPORT.SURFACE.209`): `DSTabs` takes `pageLevel`, with the level of its box when unset, and an app's page chooses no look for them. A website's pages name `type` `PILL`. "The tabs by level" below states each look |
| `DSPagination` | **The pager MUST arrange itself by the width of its own place, and not by the width of the window** (`RD.SUPPORT.SURFACE.133`). A pager stands in the footer of a full page and in a narrow column of a wide window, and the device type is the same in both. With no choice of rows on a page, the page controls stand in the middle. With the choice, the choice stands at the start and the page controls at the end. In a narrow place the choice is not drawn, and the page controls stand alone in the middle. A page offers no choice where the number of rows is decided already, such as a data table at the side of a detail |
| `DSFormatDate` · `DSFormatDateTime` | **A line that says when something happened MAY show how long ago it was, through `type`** (`RD.SUPPORT.SURFACE.122`). `type` takes `DSFormatDateType`: `DEFAULT`, the date as it is written, and `AGO`, how long ago in words, such as *yesterday* or *2 days ago*, in the app's language and in the largest whole unit. Such a line says roughly when a thing last changed: a version, a record in a list, a comment. `AGO` stays how long ago however old the moment is. On `DSFormatDate` it counts days of the calendar and never shows a unit under a day. **The exact date and time MUST be reachable from it:** it is the tooltip of the words, and it is in their accessible name. **Where a page is a log of what happened, each line MUST show the date and the time, and not how long ago:** an audit log, a log of the notifications sent, the runs of a scheduled job, a list of sign-ins |
| `DSFormatTime` · `DSFormatDateTime` · a picker of a time | **A block that shows or takes a time MUST use the format the page gives it, else the app's, and it MUST hold no time format of its own** (`RD.SUPPORT.SURFACE.123`). The app context always holds a time format. A picker of a time with no clock of its own reads in the clock of that format |

- **A block on a fill is `DSSurface`, and what draws a fill gives its surface** (`RD.SUPPORT.SURFACE.199`). `DSSurface` takes `color`, `strength` and `painted`, draws the fill and nothing else, and what it holds reads the fill, the main action included. `useDSSurface` reads the surface for a choice, never to paint; a popover, a menu, a hover card, the body of an overlay and a tooltip give the page's surface again.
- **A card or a container frame that draws its own fill inside a coloured surface is a surface of its own** (`RD.SUPPORT.SURFACE.199`). It writes `data-surface-color` and `ds-shell` with its colour, or with `BASE` where it has none, so its text and its main action are its own; on the page's own surface a `BASE` block writes nothing.
- **A row that scrolls sideways is `DSHScroll`, and its arrows stand on the ground the row stands on** (`RD.SUPPORT.SURFACE.204`). With `arrow`, each edge that hides more of the row shows a round arrow button one scale step below the row's `size`, on a fade 40 to 72 px wide, and a press moves the row by four fifths of its width. `arrowType` is `DEFAULT`, the fade from the fill of the page or of the surface the row is on (a band of the brand included), or `OVERLAY`, the scrim, for a row over a picture, the arrow then glass. An arrow fades out at the end it has reached, and a coarse pointer shows none. `DSTabs` turns `arrow` on and passes its size.

### The overlays, and the two confirmations

- **`DSDialog`, `DSDrawer` and `DSSheet` MAY hold the parts `Header`, `Content` and `Footer`**, named `DSDialog.Header` and so on. The header stays at the top and the footer at the bottom, and only the content scrolls between them. The header places its first block, the title, at the start, where it grows, and every other block as one group of actions at the end, and leaves room for the close action. The footer places its actions at its end, the action that leaves the work first and the main action last (`architecture-containers.md`). `DSConfirmDialog` and `DSConfirmPopover` place their two actions the same way. An overlay that holds plain blocks and no parts scrolls them as one.
- **A dialog, a drawer and a sheet MUST announce their title once** (`RD.SUPPORT.SURFACE.121`). Where an item line stands as the title in the header, that title and the name of the overlay are one heading to a screen reader. A page gives the title once, and it writes nothing more for the name.
- **A dialog, a sheet and a drawer MUST be filled with the page's surface, `BASE`, and a popover, a menu and a tooltip with the raised surface, each fixed** (`RD.SUPPORT.SURFACE.163`). The theme chooses neither. A side panel inside a dialog, a sheet or a drawer takes a shell look, `DEFAULT` at `SUBTLE` unless the page says otherwise.
- **A dialog, a drawer and a sheet MUST take their width from one scale, `extent`, and their padding from `size`** (`RD.SUPPORT.SURFACE.190`). `extent` is `XS` 320 px, `SM` 400, `MD` 480, `LG` 560 and `XL` 720, each capped at 95 percent of the window. A sheet and a drawer at the side default to `MD`, a dialog to `XL`. `size` sets only the padding and never the width. A dialog's `width` and `height` in pixels stay only for content that sizes itself, such as the image cropper, and win over `extent`. A phone takes the whole width. On a top or bottom sheet `extent` is the height.
- **`DSSheet` takes `modal`, which is yes by default.** A sheet that is not modal stands beside the page. It draws no scrim, and the page stays usable. A press on the page does not close the sheet; its close action and the Escape key do. **On a phone a sheet MUST stay modal, whatever `modal` says.**
- **`DSConfirmDialog` asks a person to confirm an act that cannot be undone, and it stays open while the act runs** (`RD.SUPPORT.SURFACE.088` rules the name, and no older name is kept beside it). The confirm action shows working, neither action can be pressed, and the dialog cannot be left. An act that fails keeps the dialog open and shows the failure in it.
- **`DSConfirmPopover` asks a person to confirm an act they can undo, in a popover that opens from the control that was pressed.** It holds the question, an action that cancels and the action that confirms, named as on `DSConfirmDialog`. It draws on the surface of `DSPopover`, covers no page and draws no scrim. **It MUST stay open while the act runs, and MUST close when the act is done.** An act that fails keeps it open and shows the failure in it. The cancel action and the Escape key close it, and focus goes back to the control that opened it.

`standards-patterns.md` states when a confirmation is the popover and when it is the dialog.

### The tabs by level

| `pageLevel` | The tabs are | Their look, with no `type` | At the size of the theme, `SM` |
| --- | --- | --- | --- |
| `PAGE` | the sub-pages of a page | `LINE` | a label of 16px in a row of 40px |
| `CONTAINER` · `WIDGET` | the parts of a container or of a card | `LINE` | a label of 14px in a row of 36px |
| `GROUP` · `CONTENT` · `INLINE` | two ways to show one thing | `SWITCH` | a label of 13px in a row of 32px |

- **A page MUST name the `type` of its tabs only where the level's look does not belong, and the pages of a website MUST take `PILL`** (`RD.SUPPORT.SURFACE.209`). `type` takes `DSTabsType` and changes the look alone: the level still gives the size, and the keys and the focus ring are the same in each type. An app keeps choosing by level.

  | `type` | Its look | Where it belongs |
  | --- | --- | --- |
  | `LINE` | the underline: the open tab is the navigation's colour over a line, and no fill; flat, and with `raised` a soft shadow under the base line | the pages of an app, and the parts of its containers and cards |
  | `SWITCH` | a sunken bar, with a pill on the open tab, filled as the navigation's entry says, with no shadow; with `raised` the open tab is a raised pill with its soft shadow | two ways to show one thing, inside a part of a page |
  | `PILL` | a bar on the switch's muted track with no shadow unless `raised`, so its tabs read as one control; with `raised` the bar is on the raised surface, lifted by its shadow alone; no line, padded 5px either way, fully rounded across, roomier than the switch; the open tab filled as the navigation's entry says, with no line, and a label stronger in colour, and in weight only where the entry gives no fill; a closed tab a soft tint of the navigation's colour under the pointer and the focus (`RD.SUPPORT.SURFACE.213`, `RD.SUPPORT.SURFACE.214`, `RD.SUPPORT.SURFACE.215`) | the pages of a website, in its top bar, with `raised` where the bar floats |

- **`DSTabs` MUST be lifted only where `raised` asks, and MUST read no card or container look** (`RD.SUPPORT.SURFACE.215`). `raised` is a prop of the row, as on `DSCard`, with no default: unset, the row is not lifted. Tabs read neither `theme.card` nor `theme.container`. `raised` adds a soft shadow under the base line of `LINE`, the raised pill with its shadow on the open tab of `SWITCH`, and the raised bar with its shadow under `PILL`.

- **The tabs MUST take their colour, and the fill of their open tab, from the theme's navigation, `theme.layout.navigation`, and a row MAY override each** (`RD.SUPPORT.SURFACE.214`). Tabs mostly lead from page to page or switch what a part shows, as the navigation does, so they match it. No theme field is added, `DSTabs` draws its own tabs and never `DSNavEntry`, and unlike the navigation units, which take their look as one prop, it reads the theme's navigation.

  | The navigation's | `LINE` | `SWITCH` | `PILL` |
  | --- | --- | --- | --- |
  | `color` `PRIMARY` | the open label and its line in the brand, `--primary-fg` | the open tab's fill in the brand; a closed tab the brand's soft tint at half strength under the pointer and the focus | as the switch |
  | `color` `BASE` · `DEFAULT` | the open label and its line in the full text colour, `--fg` | the open tab's fill in the neutral greys; a closed tab's label turns full under the pointer | the open tab's fill in the neutral greys; a closed tab `--neutral-subtle` under the pointer and the focus |
  | `entry` `SOLID` | no change | a strong fill: `--primary`, or `--fg` with the page's colour as its label | as the switch |
  | `entry` `QUIET` · `SUBTLE` | no change | a soft fill: the raised pill, laid with the brand's soft tint in the brand | a soft fill: `--primary-subtle`, or `--neutral-quiet` |
  | `entry` `LINE` · `PLAIN` | no change | no fill: the label alone, stronger in colour and in weight | as the switch |

  The theme's default navigation is `DEFAULT` at `QUIET`, so tabs are neutral, with a soft fill on the open tab, until the navigation is `PRIMARY`. `color` takes `DSSurfaceColorType` and `entry` takes `DSNavEntryType`, the navigation's own types, mapped as its values are. A row names them only where it must differ from the navigation, such as a second row of tabs or the tabs of a busy card; unset, the navigation decides.

- **Every `type` MUST stand one under another and share the whole width** (`RD.SUPPORT.SURFACE.213`). With `orientation` `VERTICAL` the line runs down the side, the switch is a sunken column and the pill a raised column with a raised panel's large radius, its tabs' corners nesting inside; with `fill` the tabs of every type share the width equally.

- **A unit that takes a page level MUST be given its `pageLevel` first, and its `size` only to override the size the level gives** (`RD.SUPPORT.SURFACE.209`). `DSItem` and `DSItemFacts` take no `size`, so the level is all a page gives them.

- **The `size` of the tabs picks the step, and the level says how far above it the tabs are drawn.** At `GROUP`, `CONTENT` and `INLINE` a tab is drawn at the step of its size. At `CONTAINER` and `WIDGET` it is drawn one step above, and at `PAGE` two steps above, and never above `XL`. A step gives the label its content step and the row the height of a control.
- **Tabs that say no level and no type draw the switch.** The tabs of the parts of a container or of a card say `CONTAINER` or `WIDGET`, and the tabs that lead to the sub-pages of a whole page say `PAGE`.
- **In a `flush` part, the tabs MUST place their first tab and their panel by the inset of their place** (`RD.SUPPORT.SURFACE.118`). The label of the first tab starts at that inset, so it starts where the text under it starts. The line of the tabs still runs from edge to edge. The panel takes the same inset at its sides, and what it holds stands in a padded place. So a title in the panel takes no inset of its own, and a code view or a table in the panel keeps its border.
- **A page MUST NOT write a padding for the tabs or for their panel.** The part says that it is `flush`, and the tabs do the rest.

## The navigation units — 🔮

The navigation is drawn by units of its own, and the layouts are built from them (`architecture-layouts.md`).

| Unit | What it is | Its props |
| --- | --- | --- |
| `DSNavList` | the vertical inner part: sections, groups that open and close, and entries with their actions | `nodes`; `look` (`IDSNavLook`); `size` (`SM` or `MD`); `collapsed` |
| `DSNavMenu` | the horizontal inner part: entries in a row, where a group opens a wide panel | `nodes`; `look` (`IDSNavLook`); `size` (`SM` or `MD`) |
| `DSNavBarSide` | a bar at the side, a surface: `startNode`, a `DSNavList`, then `endNode`. At `EDGE` it folds to icons; at `INLINE` it is a column in the page | `nodes`; `look` (`IDSNavBarLook`); `size`; `startNode`; `endNode`; `startNodeCollapsed`; `endNodeCollapsed`; `placement` = `EDGE`; `collapsible` = `true`; `defaultOpen` = `true`; `side` = `LEFT` |
| `DSNavBarTop` | a bar across the top, a surface: `startNode`, a `DSNavMenu`, then `endNode` | `nodes`; `look` (`IDSNavBarLook`); `size`; `startNode`; `endNode` |
| `DSNavEntry` | one entry: its link, hover, focus, open mark and actions. Every list, menu and panel draws it, and an app's drawing of a panel places it | `item`; `look` (`IDSNavLook`); `size` (`SM` or `MD`); `onSelect`; `children` (a node, or a function of `{ active, selected }`) |

`IDSNavLook` is `color`, `strength` and `entry`. `IDSNavBarLook` is a surface look — `color`, `strength`, `opacity`, `bordered`, `raised` — with `entry`, and it is also the shell of the theme (`architecture-app.md`).

- **A navigation unit MUST take its look as one prop, `look`, and MUST NOT read the theme** (`RD.SUPPORT.SURFACE.156`). The layouts alone read the theme and hand the look down, so a unit draws the same outside a layout, such as the side list of a settings page. A bar draws its look's fill, opacity, line and shadow, and hands the look to its inner part. Where the look of an inner part names a colour, the part draws its entries for that fill alone.
- **The navigation's data is the menu's narrowed, never a second family:** `IDSNavItem` (an entry, with its own `actions`), `IDSNavGroup` (entries and `IDSNavGroupSection`s, one level deep, and an optional `renderPanel`), `IDSNavGroupSection` (a section inside a group, holding entries alone), `IDSNavSection`, `IDSNavSeparator` (its own type), and `IDSNavNode`, with no custom node. The kinds stay `DSDataMenuNodeType`, so one filter by `permissions` and `enablements` reads both, and drops a section of a group with nothing left. A group that holds the open page in one of its sections holds it. What a drawing needs beyond the data, a line of description or a picture, rides in the entry's `data`.
- **A group of the navigation MUST open in place, one level deep. A group of a menu MAY fly out to any depth.**
- **A navigation unit takes `size` `SM` or `MD`.** With no `size`, a `DSNavList` takes the size of its place, then the theme's.
- **A group's wide panel in `DSNavMenu` MUST be rows as tight as a menu bar's, or the app's own drawing** (`RD.SUPPORT.SURFACE.159`). With no drawing it is one column of rows at the height and padding of `DSMenubar`'s, a section its small muted name over its rows, a line between sections. A group's `renderPanel(context)` draws the inside instead: tiles, columns, a picture beside each entry. The context, `IDSNavPanelContext`, gives the group filtered by permission, `open`, `close`, the look and the size.
- **The menu MUST keep the bar, the entries, the opening, the keys, the closing and the panel's frame**, the frame being the shell's fill, line, corner and shadow. A list, a rail, a dock and the menu of a phone always draw the group's data, so every entry is reachable whatever a drawing leaves out.
- **A drawing's closing animation MUST finish inside the panel's own closing transition**, and a panel on a strong fill gives what it holds the opposite mode's tokens, so an item, an icon and a text unit read on it.
- **A drawing MUST place each entry as a `DSNavEntry`** (`RD.SUPPORT.SURFACE.160`), passing `close` as its `onSelect`. The entry keeps its link, hover, focus, open mark and actions wherever it stands. Its content may be a node or a function of `{ active, selected }`, so an icon can turn or be swapped while the entry is active. **Nothing pressable stands inside an entry**: a command goes in its actions or beside it. Its link carries `data-nav-entry`, for a page's own stylesheet.
- **An entry MAY carry a `count`, and the number MUST be in its name.** Open, a quiet `DSBadge` at its end; shut, a dot on its icon; the name reads "Orders, 2"; `0` or none shows nothing. `DSButton` takes the same `count`: a quiet badge after its label, or a dot at the top end of an icon alone, named "Notifications, 3 unread" through `translate`.
- **Still open, with each lean:** the sizes of a top bar (`SM` and `MD`; keep that range).

The web builds the navigation units in a change not released yet, and the library is owed.

## The item line, the badge and the mark — 🔮

Three things show a record and its facts on most pages: a line for the record, a badge for a state, and a mark for a picture. Each has one form here. These are the blocks that carry the rules of content of `standards-core.md`.

### The item line

The item line, `DSItem`, shows one thing as a line. It takes no `selected`: in a list the row is the chosen one, and the row carries the fill (`RD.SUPPORT.SURFACE.097`).

| Part of the item line | Holds | Its prop on `DSItem` |
| --- | --- | --- |
| A picture | a picture or an icon of the thing, at the start of the line | `media`, given as data of one kind |
| A title | the name of the thing | `title` |
| A description | a short summary of the thing, under its title, drawn whole | `description` |
| A line of facts | the short facts of the thing, under its description, with a dot between each two. A badge stands among them, before the other facts | `facts` |
| The end | what stands at the end of the line: the actions of the thing, a badge, or both | `endNode` |
| An arrow | a chevron after the actions, on a line that leads somewhere | `showArrow` |

- **A page MUST give the parts of an item line to these props, and the block places them in one order** (`RD.SUPPORT.SURFACE.064`). A person then reads every line of every list the same way.
- **The line of facts MUST be given to `facts`, and the block MUST place it after the title and the description** (`RD.SUPPORT.SURFACE.086`). The order under the picture is the title, the description, then the facts. A line that has a description and facts then shows both. A badge is one of the facts, so it needs no place of its own on the block.
- **A fact MUST be given in one of four forms, and the block draws each form the same way on every line** (`RD.SUPPORT.SURFACE.096`). A page gives the fact as data, and never as a block it has styled itself. The forms `TEXT`, `BADGE` and `CUSTOM` are the values of `DSItemFactType`, on the fact's `mtype`.

  | Form | What the page gives | What the block draws |
  | --- | --- | --- |
  | Plain words | the words alone | the words, in the muted tone |
  | `TEXT` | `text`, and where it needs them a `label`, a `startIcon` and an `endIcon` | the words in the muted tone, with the icons at their two sides. A `label` stands before the words with a colon, as *Members: 12* |
  | `BADGE` | `text`, and where it needs them a `color`, a `customColor`, a `variant`, a `startIcon` and an `endIcon` | a badge, at the size of the level of the line. A `variant` that is given wins; else `QUIET` at `PAGE` and `CONTAINER`, and `SUBTLE_OUTLINE` at the others. The page chooses its colour, its icons and its variant, and never its size |
  | `CUSTOM` | `node`, a block of the page's own | the block as it is given, in its place on the line |

- **The words, the label and the icons of a fact MUST take the muted tone, and the dot between two facts the subtle tone** (`RD.SUPPORT.SURFACE.141`). The facts are small text that a person reads, and the subtle tone does not reach 4.5 to 1 there.
- **A fact MAY carry its label before it, where the value cannot be read alone.** A count, a date and a person are such values. A state, a kind and a code are read alone and take no label. This is the one place a title stands beside its value.
- **A fact that is empty MUST be left out, with its dot.**
- **The picture of an item line MUST be given to `media` as data of one kind, and never as a block the page has sized** (`RD.SUPPORT.SURFACE.130`). The picture states its kind in `mtype`, which takes `DSItemMediaType`. The item draws the unit of that kind, so the heads of two pages hold one picture at one size.

  | Kind | What the page gives | What the block draws |
  | --- | --- | --- |
  | `ICON` | the icon, and nothing else | the icon alone, with no background, on the line of the title, as large as the title or the next icon step up |
  | `MARK` | what a mark takes that is not a size: its icon or its text, its colour, its variant, its shape and its accessible name | a `DSMark`, at the scale size the level and the rows of the text give. It is a rounded square where the page names no shape |
  | `AVATAR` | what an avatar takes that is not a size: the name it stands for, the address of its picture, and what else an avatar takes | a `DSAvatar`, at that scale size |
  | `AVATAR_GROUP` | what a group of avatars takes that is not a size: its avatars, and how many it shows at most | a `DSAvatarGroup`, at that scale size |
  | `CUSTOM` | `node`, a block of the page's own | the block as it is given, in the place of the picture. The item does not size it |

- **A kind of picture MUST hold no size and no scale size.** The item owns the size of its picture, from its `pageLevel` and the rows of its text. A page that needs a picture the item does not know gives `CUSTOM`, and that picture is the page's to size.
- **The start of an item line MUST be one place that one prop fills, and `DSItem` MUST take no `startIcon`.** An icon alone is the kind `ICON` of `media`. `media` takes a block in no way but `CUSTOM`. Each stack states the fields of each kind in its own docs.
- **`DSItem` MUST take what stands at its end as `endNode`, a node, and it takes no prop named `actions`** (`RD.SUPPORT.SURFACE.131`). The node stands at the end of the line and outside the link of the line, so a control in it runs alone and does not follow the link. The page gives the node as it is, and the item line reads nothing inside it. It holds the actions of the thing, a badge, or both. The row of a list takes `endNode` under the same name.
- **What stands at the end of an item line is data: a badge, a count, a status, and never an action** (`RD.SUPPORT.SURFACE.059`, `RD.SUPPORT.SURFACE.087`, `RD.SUPPORT.SURFACE.178`). A line that leads to a page shows the arrow of `showArrow` where its row holds no action. A row that has an action gives it at the end of the row and shows no arrow. Where the end holds a badge alone, the page may show the arrow too. The arrow is no state: it stands on a line that leads somewhere when it is pressed, and a line that leads nowhere shows none. A row of `DSList` takes `showArrow` the same way, and in a list the arrow is the row's.
- **The header of a record and a line of a list MUST have the same shape: a picture, a title, a line under it, and what stands at its end.** A person who has read a list can read the page of one record.

- **An item line MUST cut nothing it draws, and the page decides what its words say** (`RD.SUPPORT.SURFACE.111`). There is no ellipsis and no clamp to a number of lines. A long title wraps, a long description wraps, and the facts wrap to a further line, each dot staying with the fact before it. The item line takes no prop for a number of lines. A page that wants the heads of a row of cards at one height gives each a description of one length.

One item line serves every level of a page, and `pageLevel` says which one it stands at. It takes the vocabulary `DSPageLevelType`, as the names (`architecture-names.md`) state. The item line has no `size`, so the level is all a page chooses about its look.

| `pageLevel` | The item line is the title of | Its title | Its description | Its facts | A badge in its facts | A mark |
| --- | --- | --- | --- | --- | --- | --- |
| `PAGE` | the whole page, such as the header of a record or of a listing that is the page | `HEADING_SM`, 22px | `CONTENT_LG`, 16px | `CONTENT_MD`, 14px | `MD` | `QUIET` |
| `CONTAINER` | a container, and a dialog, a sheet or a drawer | `HEADING_XS`, 18px | `CONTENT_LG`, 16px | `CONTENT_MD`, 14px | `MD` | `QUIET` |
| `WIDGET` | a widget or a card, and a confirmation | `TITLE_LG`, 16px | `CONTENT_MD`, 14px | `CONTENT_MD`, 14px | `SM` | `SUBTLE` |
| `GROUP` | an inner part of a widget, such as the head of a part of a card | `HEADING_XXS`, 14px, in the quiet tone | `CONTENT_SM`, 13px | `CONTENT_MD`, 14px | `SM` | `SUBTLE` |
| `CONTENT` | a row among others, such as a row of a list or of a card. It is the default | `TITLE_SM`, 13px | `CONTENT_SM`, 13px | `CONTENT_SM`, 13px | `XS` | `SUBTLE` |
| `INLINE` | a value inside another unit, such as a row of a popover, of a menu or of a cell | `TITLE_XS`, 12px | `CONTENT_XS`, 12px | `CONTENT_XS`, 12px | `XS` | `SUBTLE` |

- **The `pageLevel` of an item line MUST alone decide the type of its title, its description and its facts, the size of a badge among its facts, and the size of its picture** (`RD.SUPPORT.SURFACE.094`). A page chooses the level, and writes no type step, no badge size and no scale size. `DSItem` takes no `size`. So the header of a record, the title of a container, of a widget and of a group, and a row keep one shape on every page. The titles run 22, 18, 16, 14, 13 and 12px from the page down to a small row.
- **The title MUST take the body tone, and the title of a group the quiet tone. The description MUST take the quiet tone at every level but `INLINE`, where it and the facts take the muted tone** (`RD.SUPPORT.SURFACE.143`, `166`). So a group's bold 14px title stands a step back from the rows under it. On a row under the pointer or a chosen row the muted words step to the quiet tone.
- **A mark among the item line's pictures MUST take its default variant from the level: `QUIET` at `PAGE` and `CONTAINER`, and `SUBTLE` at `WIDGET`, `GROUP`, `CONTENT` and `INLINE`** (`RD.SUPPORT.SURFACE.194`). The fill carries the hierarchy: the mark of a page or a container head draws the stronger tint, which its badges share, and the mark from a widget down draws the lighter one. No level rings the mark. A `variant` the page writes on the mark wins. An avatar's ring is an emphasis the page sets, and the level gives none.
- **A badge among the facts MUST take the size of its level, two levels to a size:** `MD` at `PAGE` and `CONTAINER`, `SM` at `WIDGET` and `GROUP`, and `XS` at `CONTENT` and `INLINE`. Its words are then 14, 13 and 12px. No badge is smaller than `XS`, the smallest of the standard sizes.
- **The description MUST stand directly under the title, and the line of facts MUST stand 2px under whatever stands above it** (`RD.SUPPORT.SURFACE.135`). Each row of the text takes the line height of its own type step, 1.2 for a Heading, 1.3 for a Title and 1.5 for Content. A line of facts is as tall as its words, or as its badge where the badge is taller.
- **An item line at `INLINE` with a title, a description and facts MUST draw two lines.** The first holds the title, a dot and the description, and the second holds the facts. Where the first line is full, the description wraps under the title within the text column. With a description alone or facts alone, and at every other level, the rows stand one under another.
- **The picture MUST be read from a fixed table, by the level and the rows of the text** (`RD.SUPPORT.SURFACE.094`). It is not worked out from the height of the text, so a change to a line height or a gap moves no picture. A mark, an avatar and a group of avatars take the same box, and a mark holds the icon of its box's step. The rows are counted by kind: a description that wraps is still one row, and a line of facts that draws nothing is no row. The table gives the box in pixels.

  | `pageLevel` | The title alone | With a description | With facts | With a description and facts |
  | --- | --- | --- | --- | --- |
  | `PAGE` | 36 | 56 | 56 | 80 |
  | `CONTAINER` | 32 | 44 | 44 | 64 |
  | `WIDGET` | 28 | 40 | 40 | 56 |
  | `GROUP` | 24 | 36 | 36 | 48 |
  | `CONTENT` | 24 | 32 | 32 | 48 |
  | `INLINE` | 24 | 28 | 28 | 28 |

- **A title alone at `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` MUST keep the room of a control, 36px, whether or not it holds actions.** Its title and its picture stand in the middle of that room, level with the middle of an action beside it. So a head does not move when an action appears or leaves. A title with a description or facts under it is taller than a control already. A row at `CONTENT` or `INLINE` keeps no such room.
- **A `DSItem` MAY stand vertical, with `orientation` `VERTICAL`** (`RD.SUPPORT.SURFACE.216`). The picture stands on top, then the title, the description and the facts last, all aligned to the start, with the end node at the top end on the picture's row and one step of the item's level between the picture and the text. The picture keeps the size its level gives, and `mediaAlign` does not apply. Unset or `HORIZONTAL`, the line is as before. `DSItemCard` holds a vertical item as it holds any other.
- **The picture MUST stand at the middle of the text at every level, and `mediaAlign` MAY move it.** `mediaAlign` takes `DSItemMediaAlignType`: `TOP`, its top at the top of the title's first line; `CENTER`, the default; and `BOTTOM`, its foot at the foot of the text's last line. A title alone keeps its picture in the middle of its room, whatever `mediaAlign` says.
- **A bare icon MUST follow the line of the title.** It is as large as the title, or the next icon step up where no step is equal, and it stands in the middle of the title's first line. `mediaAlign` does not move it.
- **A mark in an item line MUST be a rounded square where the page names no shape, and its corner MUST follow its box.** The corner is one of the theme's radius steps: 6px at 24 and 28px, 8px at 32 and 36px, and 10px from 40px up. A page that names a shape still gets it.
- **An item line that is a title MUST start where what stands under it starts** (`RD.SUPPORT.SURFACE.109`). A title is an item line at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP`. It takes no padding of its own at its two sides. So the title of a group starts where the labels of the fields under it start, in a part that insets, in a card, in a dialog and in a sheet. The head of a page starts where the framed parts under it start. Above and below, a title keeps the padding of its place, which the part that holds it gives.
- **In a `flush` part, a title MUST take the inset of its place at its two sides.** What stands under it there reaches the edge, and the rows start their text at that inset. So the title starts where the text of the rows starts. The place is the container or the card the part belongs to, and its size sets the inset, as the card (`architecture-containers.md`) states for a card.
- **A page MUST NOT write a prop or a padding to place a title.** The level says that the line is a title, and the part says whether it is `flush`.
- **A row that holds an item line at the level `CONTENT` or `INLINE` MUST give it the padding of a row.** The row takes the padding of the size of its place on every side, and that size is handed to what stands inside the item line. The look of the line does not follow that size. In a `flush` part the row takes the inset of its place at its two sides, so its fill runs from edge to edge. An item line that stands alone, in no row, has no padding of its own: the page puts it in a row of a list, or in a place that gives it room.
- **A trigger that wraps an item line MUST give it its room and its highlight, and where it stands on a line its highlight MUST reach past the line** (`RD.SUPPORT.SURFACE.175`). `DSDropdownMenu` pads the item line as an entry of a menu is padded and fills it under the pointer. Where the trigger stands in a bar or on the line of a page, not in a row, its content stands on the line, and its padding, then an equal negative margin, reaches outside it. A page pulls nothing out by hand. A trigger in a row of a list, or in a row of the navigation at an edge, keeps the padding and takes no pull.
- **The heading element of a title MUST follow its level, and it MUST change no style** (`RD.SUPPORT.SURFACE.106`). The title of a `PAGE` item is the `h1`, of a `CONTAINER` the `h2`, of a `WIDGET` the `h3` and of a `GROUP` the `h4`, whatever the boxes around it. A title at `CONTENT` or `INLINE` is no heading.
- **A title in the header of a box MUST take the level its box gives, where the page names none** (`RD.SUPPORT.SURFACE.107`). A level the page names wins, and an item line anywhere else is `CONTENT`.

  | The box | The level of the title in its header |
  | --- | --- |
  | a container and a data table container | the level of its box: `CONTAINER`, and `PAGE` where the container takes `fullPage` and is the whole page, whose header is then the page head |
  | a card, and the head of a card widget | `WIDGET` |
  | the head of a part of a card widget | `GROUP`, and its rows `CONTENT` |
  | a dialog, a sheet and a drawer | `CONTAINER` |
  | a confirmation | `WIDGET` |

  So in a page with one container, its title is an `h2`, the title of a card in it an `h3`, and the title of a group in that card an `h4`.

> [!NOTE]
> **Still open, each with its lean.**
> - **Whether the item line follows the density of its place.** Today a row pads by the size of its place and its look does not follow it. The lean is that it follows the place's density, with no prop on the item.
> - **The looks on a phone.** The titles keep the sizes of the desktop there, 22, 18, 16, 14, 13 and 12px, because an item draws no title above 22px. The display steps a page writes with `DSText` take smaller values on a phone (`architecture-core.md`). The lean is that a row a person presses is at least 44px tall.
> - **`INLINE` against `DSActorView`.** `DSActorView` draws who did a thing and when, and it does not use the item line. One way is that a page writes an item line at `INLINE` in its place. The other is that `DSActorView` keeps its name and draws an item line at `INLINE` inside. Neither is leaned to yet.
> - **The shade of the titles at `PAGE`, `CONTAINER` and `WIDGET`.** They take the body tone. Drawing them in the strongest text, with the descriptions muted, is open, and it is not leaned to yet.

### The badge

The badge, `DSBadge`, shows a state or a kind as one of the facts of a thing. Where it stands, and that the normal state shows none, are rules of content in `standards-core.md`. Two more rules keep a badge readable. Both are proposed, and not yet confirmed (`RD.SUPPORT.SURFACE.065`).

- **A badge MUST always show its word.** It then reads without its colour and without its icon, also for a person who cannot tell the colours apart. `DSBadge` asks for its `label` on every use.
- **The colour of a badge MUST say a state, and never a kind.** A person learns that a coloured badge asks to be looked at. A colour on every kind would spend that signal on things that need no attention.
- **A badge with no `variant` MUST draw `SUBTLE`, the light tint** (`RD.SUPPORT.SURFACE.153`). A page asks for a stronger fill by writing `QUIET` or `SOLID`. So the badges of a table or a card stay quiet beside the words around them.
- **A status badge MUST keep its own colour on a coloured surface.** Only a neutral and a primary badge take the surface's tint; success, warning, error and info stay their hue.
- **A badge among the facts of an item line MUST take the `variant` the page gives, and else the one its level chooses:** `QUIET` at `PAGE` and `CONTAINER`, so it is seen beside a large title, and `SUBTLE_OUTLINE` at the others, whose line gives a small badge an edge down a list.

### A value of an enum

- **A value of an enum MUST be shown by its name, and never by its code** (`RD.SUPPORT.SURFACE.066`). The name is the one a person reads. The code is written for the contract and not for a person.
- **Its icon MUST be chosen in one order.** First the icon of the value, where its enum gives one to each value. Then the icon of the enum. Then the word alone. So a missing icon never stops a page. This order is proposed, and not yet confirmed.

Where the value stands decides how it is shown.

| The value is | Shown as |
| --- | --- |
| a state or a kind, beside other facts of the record | a badge |
| the subject of the page, or of a part of it | a title |
| the only thing in a field that has its label | plain text |
| several values of one set | a row of small badges |
| a choice that is being made | a control in a form |

### The mark

A mark is a picture or an icon that stands for a thing or a person: a person's picture, the brand of a provider, a channel. It is round unless a page chooses another shape.

- **A mark MUST support three shapes: round, rounded and square. It MUST be round by default** (`RD.SUPPORT.SURFACE.085`). A round mark still tells a person, before they read a word, that the picture names a thing and is no control. A page chooses rounded or square where the thing is better shown so, such as an app or a file.
- **An icon inside an action MUST keep the square of the control it sits in** (`RD.SUPPORT.SURFACE.067`). A mark is never pressed, whatever its shape.
- **A mark MUST take `variant` with the shared vocabulary, `DSVariantType`** (`RD.SUPPORT.SURFACE.124`). `GHOST` and `LINK` draw the icon alone, in the hue of the mark, with no fill and no ring. The icon stays in the box of the mark, so it keeps the place and the size of a mark beside the marks next to it.
- **A mark MUST draw each value of `variant` from the one surface that a button and a badge draw from, with the step that value has under the pointer.** A mark, a badge and a button of one variant and one hue are then the same colours. A mark with no `variant` draws `SUBTLE`. A default mark in `SUBTLE`, `SUBTLE_OUTLINE` or `OUTLINE` draws its icon in the muted tone, and a ringed mark draws its ring in the colour of its icon (`RD.SUPPORT.SURFACE.187`). The light tint of the default hue is the text colour mixed into transparency, `6` percent at rest and `11` under the pointer, so it stands apart from the page, a card and a dialog in light and in dark (`RD.SUPPORT.SURFACE.180`), and every other tint, light and medium, is a wash of its hue's step 500 into transparency, the light one at the least share that stands `0.04` from them (`RD.SUPPORT.SURFACE.183`). The step under the pointer is for the look alone: a mark is a picture and no control, and it takes no press.
- **The icon of a mark on the light tint of the default hue MUST take the muted tone.** A mark that states no hue then stays quiet beside the title it stands with.
- **A filled mark is a thing that is set up, and an empty mark is a thing that is not set up yet.** So a row of marks shows where a setup stands with no count beside it.

`DSMark` says what: it draws an icon, or a symbol of one to three characters (`text`, one of the two, drawn whole in the type step of its scale size), as a mark, on a background of its own. `shape` takes `DSMarkShapeType`: `CIRCLE`, the default; `ROUNDED`, a square with the corner radius of its size step; `SQUARE`, a square with sharp corners. `size` is the density step: a mark with no `scaleSize` takes the scale size of the same name, so its background is as tall as a control of that step. `scaleSize`, from `DSScaleSizeType`, says how large the mark is drawn, with a background of 24 to 96px, and the mark holds the icon of its own step. `color` is the hue. `variant` is how the background is drawn, from `DSVariantType`: `SOLID`, a strong fill; `QUIET`, a medium tint; `SUBTLE`, a light tint and the default; `SUBTLE_OUTLINE`, the light tint with a ring; `OUTLINE`, a ring with no fill; `GHOST` and `LINK`, the icon alone with no fill and no ring. A screen reader passes a mark by; a mark that stands alone takes a name through `ariaLabel`, and is then read as an image. A person's picture stays `DSAvatar`, which is round.

### The avatar

`DSAvatar` says who: it shows the picture of a person, a company or a workspace, and the initials of its name where there is no picture, in the `shape` a mark takes (a circle when unset) and with an optional `color` for the initials, drawn as the `SUBTLE` tint of that hue; a picture ignores it. A mark never holds a name, and an avatar's name is never a mark's text. `DSAvatarGroup` shows several of them as one stack. Both take `scaleSize`, from 24 to 96px, and both keep `size`. With no `scaleSize`, an avatar takes the step of the same name as its `size`, and with neither it takes the size of the place it stands in. A group gives its scale size to each avatar it holds. The badge sits on the curve of a circle; on a `ROUNDED` or a `SQUARE` avatar a badge with an icon moves a sixth of its own size out of the corner, and a status dot a quarter.

- **The badge of an avatar MUST follow the scale size of the avatar** (`RD.SUPPORT.SURFACE.136`). A badge that holds an icon is about a third of the avatar, and never under 12px: 12, 12, 12, 14, 14, 16, 16, 20, 20, 24 and 32px from `XXS` to `XXL5`. A badge with no icon is a dot of about a quarter of the avatar, and never under 8px: 8, 8, 8, 10, 10, 12, 12, 14, 16, 20 and 24px. A page sets no size for either.
- **The initials of an avatar MUST be a title step of about four tenths of the avatar** (`RD.SUPPORT.SURFACE.105`). From `XXL` up they are not the title of the avatar's own step name, because that title would fill the circle.

- **A group of avatars MUST overlap its avatars as the design library draws it, and an overlapped avatar MUST centre its initials in what shows** (`RD.SUPPORT.SURFACE.197`). The overlap is 4, 6, 8, 10, 14, 20, 22, 26, 30, 36 and 44px from `XXS` to `XXL5`. The initials sit in the visible part, the circle less the overlap and the gap, and where they are still wider they are drawn one title step smaller, then one more, at most four, so that none reach into the gap at any size. The last avatar and a photo are unchanged.

| Scale size of the avatar | Its size | Its initials | What it is for |
| --- | --- | --- | --- |
| `XXS` | 24px | 10px | a person named inside a line of text or a dense table |
| `XS` · `SM` · `MD` · `LG` · `XL` | 28 · 32 · 36 · 40 · 44px | 12 · 13 · 14 · 16 · 18px | a row, a list, the head of a container, of a widget or of a page |
| `XXL` | 48px | 18px | a card about one person |
| `XXL2` | 56px | 24px | the head of a record with a line under its name |
| `XXL3` | 64px | 24px | the head of a record with a line and facts |
| `XXL4` | 80px | 32px | a profile page |
| `XXL5` | 96px | 40px | an account's own page |

### The slider

- **A slider MUST show its value on its handle** (`RD.SUPPORT.SURFACE.198`). `DSSlider` and `DSSliderRange` draw each handle's value in a small label above it, formatted as the app formats numbers, with as many decimals as the step has; on a range the two labels join into one when they would touch, and `aria-valuetext` carries the same text. The slider adds no prop, and takes the line of room the label needs above its track.

### What stands beside what

These rules are for a component a builder makes, where a text stands beside an icon, a mark or an avatar. Inside an item line the item decides, and a page chooses none of this there.

- **Beside a title, an icon, a mark and an avatar MUST take the scale size of the title's own step name** (`RD.SUPPORT.SURFACE.104`). `TITLE_XXL3` stands beside `XXL3`: a 40px title, a 40px icon, and a 64px mark or avatar. An icon beside a title is never smaller than the title.
- **Beside a heading, an icon MUST be the size of the heading or the next size up, up to 56px.** A heading has no scale size of its own name, so the pairing goes by size. Beside a heading larger than 56px, the icon stands in a mark.
- **Beside a heading, an avatar or a mark MUST be two steps above the heading's own step, and never larger than `XXL5`.**

| Heading | Its size on a desktop | The icon beside it | The avatar or the mark beside it |
| --- | --- | --- | --- |
| `HEADING_XXS` | 14px | `SM`, 14px | `SM`, 32px |
| `HEADING_XS` | 18px | `LG`, 18px | `MD`, 36px |
| `HEADING_SM` | 22px | `XXL`, 24px | `LG`, 40px |
| `HEADING_MD` | 28px | `XXL2`, 32px | `XL`, 44px |
| `HEADING_LG` | 34px | `XXL3`, 40px | `XXL`, 48px |
| `HEADING_XL` | 40px | `XXL3`, 40px | `XXL2`, 56px |
| `HEADING_XXL` | 48px | `XXL4`, 48px | `XXL3`, 64px |
| `HEADING_XXL2` | 56px | `XXL5`, 56px | `XXL4`, 80px |
| `HEADING_XXL3` · `HEADING_XXL4` · `HEADING_XXL5` | 64 · 72 · 80px | the icon in a mark | `XXL5`, 96px |

### Which to use where

A title and a heading share sizes, so the size does not say which family a text is. The level of the page the text names says it, and the item line gives each level its family.

| The text is | Use | How many on a page |
| --- | --- | --- |
| the name of the whole page: a record, a list, a page of cards | an item line at the level `PAGE`, a heading | one |
| the name of a container, a dialog, a sheet or a drawer | an item line at the level `CONTAINER`, a heading | one for each container |
| the name of a widget or a card, and the question of a confirmation | an item line at the level `WIDGET`, a title | one for each widget |
| the name of an inner part of a widget: a set of rows under one name | an item line at the level `GROUP`, a heading in the quiet tone | one for each group |
| a row among others: a row of a list or of a card | an item line at the level `CONTENT`, a title | as many as there are rows |
| a value inside another unit: a row of a popover, of a menu or of a cell | an item line at the level `INLINE`, a title | as many as there are rows |
| a number, a price, the line of a hero | a heading step above `HEADING_XL`, in a component of the builder's own | one or two |

- **A container that is the whole page MUST say so with `fullPage`, and its header is then the page head** (`RD.SUPPORT.SURFACE.179`). A listing that is a part of a page takes `CONTAINER`, the level its box gives. So every page of an app opens with the same head, and only its body differs.
- **Every level of a page MUST have its title, and a title MUST be larger than the titles of what stands under it** (`RD.SUPPORT.SURFACE.112`). The titles run 22, 18, 16, 14, 13 and 12px from the page down to a value inside another unit. In a page with one container that holds a card, they are the `h1`, an `h2`, an `h3` and an `h4`, and a row is no heading.
- **An inner part of a widget MUST draw its title as an item line at the level `GROUP`.** The action of the group stands at the end of that item line. So a group needs no block and no prop of its own.

### The two blocks of a field

A field has two blocks, one to enter a value and one to read it.

| The field | Its block | What the block draws |
| --- | --- | --- |
| A field a person enters | `DSForm.Field` | its title above its control, and one line under the control that holds its description, or its error in place of the description. The line is kept where the field can fail or has a description, and drawn nowhere else. Its label line reads the label, the `info` mark, and `labelEndNode` at the right end |
| A field a person reads | `DSDataUnit` | its title above its value, with no box around the value. A value that is empty shows a dash |

- **`DSForm.Field` MUST take `labelEndNode` at the end of its label line** (`RD.SUPPORT.SURFACE.169`). The label line reads the label, the `info` mark right after the label's text, then `labelEndNode` at the right end. Only the label shrinks when room runs out, cut with an ellipsis and its whole text shown on hover; the mark and the end node never shrink. The end node stands centred on the label line and never makes it taller, so fields with and without one stand level in a row and step the same in a column. A switch or a checkbox stands in a field with no `label` and `inline`, and the field's note lines up under the control's own label.
- **A `DSForm.Field` with no label of its own MUST keep a blank label line, and `showBlankLabel={false}` MUST take it away.** The blank line is never announced, and an `inline` control there stands in the height of a control, centred, so the field stands level beside a labelled one in a row. `showBlankLabel` is true where left out; a field alone on its line in a column takes `false` and draws its control and its message line only.
- **`DSForm.Field` MUST keep its message line always, and that line is the space between two fields** (`RD.SUPPORT.SURFACE.189`, which replaces the condition of `RD.SUPPORT.SURFACE.171`). The line is kept while it is empty, with a space that is never announced, so a form has one rhythm and an error or a validator added later moves nothing. A field that stands in one row, a field of a filter bar or one edited inline in a table, is not drawn through `DSForm.Field` and keeps none.
- **A field MUST carry no space around it, and whoever places the fields MUST space them** (`RD.SUPPORT.SURFACE.195`). `DSForm` and `DSForm.Field` add no gap: the field keeps only its message line. The code that places the fields, a composite of the design system or a page, sets the space between them, vertical or horizontal. The composites of the design system that stack their fields, `DSThemeForm`, `DSDataFieldBuilder` and `DSAddressForm`, stack them 8 px apart beyond the message line, a switch or a check that carries its own label included.
- **`DSThemeForm` MUST arrange its settings in six parts that follow the theme's keys: Global, Layout, Container, Card widget, Card and Table** (`RD.SUPPORT.SURFACE.191`). They are the sections of one `DSAccordionGroup`, several open at once and Global first. Global holds the brand colour, the mode, the size, the corner radius, the motion speed and the greys, a toggle of *Cool*, *Neutral* and *Warm* (`RD.SUPPORT.SURFACE.203`). The head of each is one line, its title, with a small badge at its end that counts the settings that differ from the default; what the part holds is the first line of its content, muted, with the part's *Reset* at the end of that line. A field carries no reset and no default note of its own, and a choice equal to the default is left out of the theme. Inside a part the fields stand two to a row and one to a row on a phone, a field that needs the width taking the whole row. A save that finds an error opens its part and moves the focus to the field. The form offers no font family (`RD.SUPPORT.SURFACE.196`).
- **`DSAccordionGroup` MAY be controlled, through `expandedKeys`** (`RD.SUPPORT.SURFACE.191`). Given, the open sections are exactly these keys, the options' `expanded` seeds nothing, and a press is reported through `onChange` without opening anything by itself. Left out, the group keeps its own state. **An accordion MUST fit a settings form, every field already holding a value; a task form with fields to fill MUST use one scroll or steps.**
- **An accordion's head MUST be one line, its title, with at most a short count or status at the end; a description belongs in its content** (`RD.SUPPORT.SURFACE.191`). The content keeps as much room above its first line as below its last, the vertical padding of the size the accordion reads, in every accordion.
- **A card, a card widget and a container MAY be painted by a class of the app, and the class MUST set the block's paint tokens and nothing else** (`RD.SUPPORT.SURFACE.192`). `DSCard`, `DSCardWidget` and `DSContainer` take `className`, which goes on the block's root, and `opacity`, OPAQUE by default; `DSCard` takes no `style`. The class sets `--surface-fill`, `--surface-translucent-fill` and `--surface-blur` from the app's own tokens, in light and in `[data-mode='dark']`; anything else a class sets on the block is unsupported. A block reads only the tokens set on its own root, so four looks are four classes and every card stays a design-system card. Our own code, the showcase and the platform put no class on a block.
- **A switch MUST take its own `label`, drawn beside it as a checkbox draws its own, and no description; and a control with an edge MUST step that edge under the pointer** (`RD.SUPPORT.SURFACE.167`). Pressing the label flips the switch. One label names the setting, never a label for each state. Under the pointer the off track steps from the strong border one small step, and the on track takes the primary one step lighter. A field, a select, a picker, a radio, a checkbox and a toggle at rest take the same step on their edge; a disabled control, a focused control and a control in error keep their own.
- **The drop area of an attachment MUST be neutral in every state, take a `title` and a `description`, and in `mini` be as wide as its content** (`RD.SUPPORT.SURFACE.168`). The edge is dashed, `--surface-border-strong`, on the `--surface-sunken` fill, with no brand colour; under the pointer the edge steps to `--surface-border-hover`, and while a file is dragged over it the fill takes `--surface-hover`. The full form is a centred column of an upload-cloud icon, the title, the description in the muted tone and an outline button one size step under the control's size. Left out, the title reads "Drag files here or click to browse", with no description. `mini` is one row, as wide as its content and left-aligned.
- **A form holds each field a person enters in `DSForm.Field`, and a page shows each field a person reads in `DSDataUnit`.** Both keep the title above, as the rules of content ask (`RD.SUPPORT.SURFACE.060`, `RD.SUPPORT.SURFACE.061`). So a record that is read and the form that changes it have the same shape.
- **`DSDataFieldView` draws through `DSDataUnit`, and it needs the config of a data field.** So it fits a custom field, whose config the record already carries. A field with no such config is read through `DSDataUnit` itself.
- **Neither block places its neighbours.** The foundation defines no block for the grid that readings stand in. The page writes that grid, or uses a unit for it where its stack provides one, as `architecture-containers.md` says of every gap between two blocks.

## The motion of an icon — 🔮

An icon moves only because what holds it is hovered, pressed or open; it never moves on its own and never loops. `DSIcon` takes `motion` (`DSIconMotionType`) and `hoverNode`, and no block takes a speed prop.

| Motion | What it does |
| --- | --- |
| `NUDGE_UP`, `NUDGE_DOWN`, `NUDGE_START`, `NUDGE_END` | 2 px that way; `START` and `END` flip in a right-to-left language |
| `NUDGE_UP_END`, `NUDGE_UP_START`, `NUDGE_DOWN_START`, `NUDGE_DOWN_END` | the diagonals; `NUDGE_UP_END` is a link that leaves the app |
| `LIFT` | a 2 px rise |
| `ZOOM_IN`, `ZOOM_OUT` | x 1.12, x 0.88 |
| `FADE_IN`, `FADE_OUT` | opacity 0.4 at rest and full while held, or the reverse; never 0 |
| `SPIN_ONCE`, `WIGGLE` | one turn, one short shake |
| `TURN_90`, `TURN_180` | a quarter or half turn while open |

- The nudges, zooms, turns, lift and fades take the hover duration; `SPIN_ONCE` and `WIGGLE` take the icon's emphasis duration.
- `hoverNode` shows another icon while the holder is hovered or pressed; the two cross-fade. `DSButton`'s icons, `DSMark` and `DSItem`'s media pass both through.
- Under reduced motion an icon swaps but does not move; fades and `hoverNode` stay.
- The theme's speed is `motionSpeed`: `DEFAULT`, `FAST` or `SLOW`. The loader (`DSSpinner`) is not motion and owns its turning.

## Composing, never restyling — 🔮

A page composes these blocks, and never restyles a copy of one. A control that is missing is proposed to the design system. One that every stack should build is named and grouped here first. One that helps a single stack may be that stack's own unit. **A block takes data and props, and a class on one is a missing prop or a place's room** (`RD.SUPPORT.SURFACE.177`). Where a block has a prop for what a class would say, such as the tone and the weight of a text, the colour of a card, or where a table cell holds its content, the page gives the prop. Where the class is the room the block stands in, the parent gives it: a row, a grid or a part, or a plain element with the width around the block. Where no prop exists and three or more calls need it, the block gains the prop. A list or an item is never given a `flex` and a gap to lay a row of things: a plain row holds blocks, and an item holds its content in its own slots. A class stays on a block only on a page that shows how a primitive is styled, and in the showcase's own chrome.

An overlay a block opens — a popover, a tooltip, a dropdown menu — is a private part of that block, shown by a switch such as `open`, and never a block a designer places on its own.

## Boundary

This ref states which components exist, in which group, and what every one must give. It stops at the edge of one block. It does not state what makes a block a widget, or what the container or the layout are — those are `architecture-widgets.md`, `architecture-containers.md` and `architecture-layouts.md`. It does not state how a prop is named or where a role or scale step comes from — those are `architecture-names.md` and `architecture-core.md`. It does not name the units a stack provides on its own: each stack states those in its own docs.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.144` | a block drawn from data is declared as a host and an item, and one item serves every host that takes one data shape |
| `RD.SUPPORT.APPS.164` | an overlay is drawn as its surface alone, over a backdrop, sized to the instance, and never placed as a block of its own |
| `RD.SUPPORT.SURFACE.064` | the parts of the item line and their order, and the header of a record and a line of a list have one shape |
| `RD.SUPPORT.SURFACE.065` | a badge always shows its word, and its colour says a state and never a kind. Both are proposed |
| `RD.SUPPORT.SURFACE.066` | a value of an enum is shown by its name, and the order its icon is chosen in. The order is proposed |
| `RD.SUPPORT.SURFACE.067` | an icon inside an action keeps its square, and what a filled and an empty mark say |
| `RD.SUPPORT.SURFACE.081` | the foundation defines the core units, and a stack may provide further units of its own |
| `RD.SUPPORT.SURFACE.085` | a mark supports the shapes round, rounded and square, and is round by default |
| `RD.SUPPORT.SURFACE.086` | the line of facts is a part of its own on the item line, after the title and the description |
| `RD.SUPPORT.SURFACE.059` | what stands at the end of a line is data, a badge, a count, a status or the arrow, never an action, and when a line shows its arrow |
| `RD.SUPPORT.SURFACE.087` | the arrow of a line that leads somewhere may stand after its actions. It is a MAY |
| `RD.SUPPORT.SURFACE.088` | the dialog that asks a person to confirm an act is named `DSConfirmDialog` |
| `RD.SUPPORT.SURFACE.089` | `DSToolbar`, `DSTagGroup`, `DSCalendar`, `DSColorPicker` and `DSProgressCircle` are core units |
| `RD.SUPPORT.SURFACE.090` | `DSColorView`, `DSMark` and `DSConfirmPopover` are core units |
| `RD.SUPPORT.SURFACE.094` | the page level of an item line alone decides the type of its text, the size of a badge among its facts, and its picture, read from a fixed table |
| `RD.SUPPORT.SURFACE.096` | the four forms a fact of an item line is given in, and a fact may carry its label before it |
| `RD.SUPPORT.SURFACE.097` | `DSList` takes `hoverable`, and `selected` is the row's and not the item line's |
| `RD.SUPPORT.SURFACE.104` | which icon, mark and avatar stand beside a title and beside a heading |
| `RD.SUPPORT.SURFACE.105` | the initials of an avatar are a title step of about four tenths of the avatar |
| `RD.SUPPORT.SURFACE.106` | the heading element of a title follows its level, the head of a page being the `h1`, and it changes no style |
| `RD.SUPPORT.SURFACE.107` | the level a box gives the title in its header, where the page names none |
| `RD.SUPPORT.SURFACE.109` | an item line that is a title starts where what stands under it starts, and takes the inset of its place only in a `flush` part |
| `RD.SUPPORT.SURFACE.175` | an item line draws only its content, and the place it stands in gives it its room and its highlight, a trigger on a line letting its highlight reach past the line |
| `RD.SUPPORT.SURFACE.182` | a fixed ordered set reorders on `DSTable` or `DSList` through `reorder`, and a listing of records never does |
| `RD.SUPPORT.SURFACE.110` | an action at the end of a row that is a link does not follow the link |
| `RD.SUPPORT.SURFACE.111` | an item line cuts nothing it draws, and the page decides what its words say |
| `RD.SUPPORT.SURFACE.112` | every level of a page has its title, and a title is larger than the titles of what stands under it |
| `RD.SUPPORT.SURFACE.113` | the item line and the tabs take `pageLevel`, with the one vocabulary `DSPageLevelType`, the item line has no size, and the level decides the look of the tabs |
| `RD.SUPPORT.SURFACE.118` | in a `flush` part the tabs place their first tab and their panel by the inset of their place |
| `RD.SUPPORT.SURFACE.121` | a dialog, a drawer and a sheet announce their title once |
| `RD.SUPPORT.SURFACE.122` | a line that says when something happened may show how long ago it was, through the `type` of the two date units, with the exact date and time reachable from it. It is a MAY |
| `RD.SUPPORT.SURFACE.123` | a block that shows or takes a time holds no time format of its own |
| `RD.SUPPORT.SURFACE.124` | a mark takes `variant` with the shared vocabulary, `SUBTLE` when unset, and `GHOST` and `LINK` draw the icon with no fill |
| `RD.SUPPORT.SURFACE.125` | a table marks the row in view, with the band and `aria-current` of a chosen row of a list, apart from the rows a person ticks. It is a MAY |
| `RD.SUPPORT.SURFACE.126` | the order a table takes its stripes and its hover in: its own prop, else the theme |
| `RD.SUPPORT.SURFACE.130` | the picture of an item line is data of one kind, the item owns its size, and the item line takes no `startIcon` |
| `RD.SUPPORT.SURFACE.131` | the item line takes what stands at its end as `endNode`, a node outside the link of the line |
| `RD.SUPPORT.SURFACE.132` | a row of a list holds plain words, a line of facts through `DSItemFacts`, or an item line, and takes no `facts` of its own |
| `RD.SUPPORT.SURFACE.133` | the pager arranges itself by the width of its own place, and where its parts stand |
| `RD.SUPPORT.SURFACE.135` | the description stands directly under the title, and the line of facts 2 pixels under whatever is above it |
| `RD.SUPPORT.SURFACE.136` | the badge of an avatar is about a third of the avatar and its dot about a quarter, by scale size |
| `RD.SUPPORT.SURFACE.143` | the title of a group takes the quiet tone, and so does the description of an item but at `INLINE` |
| `RD.SUPPORT.SURFACE.166` | the description of an item is quiet at every level but `INLINE`, and facts are muted |
| `RD.SUPPORT.SURFACE.163` | a dialog, a sheet and a drawer are filled with the page's surface and a popover, a menu and a tooltip with the raised surface, each fixed |
| `RD.SUPPORT.SURFACE.144` | an icon-only button that opens a menu keeps its tooltip |
| `RD.SUPPORT.SURFACE.146` | a pressed toggle keeps its border, and a pressed toggle of the default hue takes a fill a person can see |
| `RD.SUPPORT.SURFACE.153` | a badge with no `variant` draws `SUBTLE`, and a badge among the facts of an item line takes the given variant, else the one its level chooses |
| `RD.SUPPORT.SURFACE.156` | a navigation unit takes its look as one prop and never reads the theme, and the navigation's data is the menu's narrowed |
| `RD.SUPPORT.SURFACE.159` | a group's wide panel in a top menu is rows as tight as a menu bar's or the app's own drawing, and every other place draws the data |
| `RD.SUPPORT.SURFACE.160` | an entry of the navigation is one public unit, `DSNavEntry`, with nothing pressable inside it |
| `RD.SUPPORT.SURFACE.167` | a switch takes its own `label` and no description, and a control with an edge steps the edge, and a switch its track, under the pointer |
| `RD.SUPPORT.SURFACE.168` | the drop area of an attachment is neutral in every state, takes a `title` and a `description`, and in `mini` is as wide as its content |
| `RD.SUPPORT.SURFACE.169` | `DSForm.Field` takes `labelEndNode` after the info mark, and only its label shrinks |
| `RD.SUPPORT.SURFACE.171` | `DSForm.Field` keeps its message line while its field can fail, a condition `RD.SUPPORT.SURFACE.189` replaces |
| `RD.SUPPORT.SURFACE.189` | `DSForm.Field` always keeps its message line, so the line is the space between fields, and a field standing in one row keeps none |
| `RD.SUPPORT.SURFACE.195` | a field carries no space around it, whoever places the fields spaces them, and the composites of the design system stack theirs 8 px apart |
| `RD.SUPPORT.SURFACE.191` | `DSThemeForm` arranges its settings in six parts, as the sections of one accordion a page may control with `expandedKeys`, and an accordion fits a settings form while a task form uses one scroll or steps |
| `RD.SUPPORT.SURFACE.192` | a partner paints one container, card or card widget with a class of their own, and the class sets the block's paint tokens `--surface-fill`, `--surface-translucent-fill` and `--surface-blur` and nothing else |
| `RD.SUPPORT.SURFACE.199` | the surface a block stands on is one value, a colour and a strength, carried by context and read by tokens; `DSSurface` puts a block on a fill, `painted` stands it on a picture, and a popup sets the page's surface again |
| `RD.SUPPORT.SURFACE.190` | every overlay takes its width from one scale, `extent`, `XS` 320 px to `XL` 720, and its padding from `size`; a sheet and a drawer default to `MD`, a dialog to `XL` |
| `RD.SUPPORT.SURFACE.201` | the surface moves by one set of tokens, a role for each kind of unit, icon motions moved only by their holder, and one reduced-motion rule |
| `RD.SUPPORT.SURFACE.204` | a row that scrolls sideways is `DSHScroll`, its arrows sized from its size and standing on the ground the row stands on, or on a scrim over a picture |
| `RD.SUPPORT.SURFACE.209` | `DSTabs` takes a `type`, `LINE`, `SWITCH` or `PILL`, the level giving the size and the look where no type is named, a website's pages taking `PILL`; a unit that takes a page level is given its `pageLevel` first and its `size` only to override |
| `RD.SUPPORT.SURFACE.213` | the `PILL` bar is raised by its shadow alone with no line, its closed tab takes the brand one step softer under the pointer and the focus, and every type of `DSTabs` stands vertical and shares the width |
| `RD.SUPPORT.SURFACE.214` | `DSTabs` take their colour and the fill of their open tab from the theme's navigation, and a row may override each with `color` and `entry`, of the navigation's own types |
| `RD.SUPPORT.SURFACE.215` | `DSTabs` are lifted only where `raised` asks, with no default, and read no card or container look |
| `RD.SUPPORT.SURFACE.216` | `DSItem` stands vertically when `orientation` is `VERTICAL`, the picture on top and the end node at the top end, and `DSItemCard` holds it as it is |
| `RD.SUPPORT.SURFACE.187` | a default mark draws its icon muted and a ringed mark its ring in the icon's colour, and a `PAGE` item's description is `CONTENT_LG`, 16px |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task. The web builds `facts` and `pageLevel` on `DSItem`. It also builds the larger sizes, in Support `5.13.0`: `scaleSize` on `DSIcon`, `DSMark`, `DSAvatar` and `DSAvatarGroup`, the item line and the tabs drawn by their page level, and `flush` on the parts of a card. The web builds the tabs in a `flush` part, the one name of an overlay with a title, the form `AGO` of the two date units, the time format that a block takes from the app alone, the row in view of a table, the order a table takes `striped` and `hoverable` in, and the picture of an item line given as data. The web builds, in a change not released yet, the levels of the item line from `PAGE` to `INLINE` with no size on it, the heading element by nesting, the picture by its fixed table, `mediaAlign`, the tabs at every level, and the variants by strength, with `SUBTLE` as the default of a badge and a mark. In the web the title of a confirmation is still drawn by hand. The design library has not drawn the larger sizes or any of these yet, and it is drawn after the stack. So a page on another stack checks what its stack's units take before it uses one of these.
