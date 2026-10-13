<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/06-architecture-components.md",
      "seen": "891cf7c3"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/06-architecture-components/",
      "seen": "62c52484"
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
| Item media type | `DSItemMediaType` — the kind of picture an item line is given: `ICON` · `ICON_MARK` · `AVATAR` · `AVATAR_GROUP` · `CUSTOM` |
| Date form | `DSFormatDateType` — the form the two date units write a date in: `DEFAULT`, the date as it is, or `AGO`, how long ago in words |
| Page level | `DSPageLevelType` — the level of a page a block stands at: `PAGE` · `SECTION` · `GROUP` · `CONTENT`. The item line and the tabs take it through `pageLevel` |
| Mark | a picture or an icon that stands for a thing or a person. It is round unless a page chooses another shape |
| Core unit | a block the book names, which every stack builds under that name. A stack may provide further units of its own |

An **item line** is not the Item of a host. A host may draw an item line for each entry, and an item line also stands alone, for one thing shown by itself.

A **block** is any unit a surface is built from — a layout, a container, a widget or a component (`standards-core.md`). The component is the smallest of the four.

## The groups — 🔮

Eleven groups, each answering one need of a surface. The list holds the core units: the library draws one page per group, each provider keeps one folder per group, the showcase opens each group of units with an Overview page, and a new core unit joins this list before it is drawn or built anywhere. A stack may provide further units of its own beside them, and this list names none of those.

| Group | Answers | Blocks |
| --- | --- | --- |
| Actions | the ways a person asks for something | `DSButton` · `DSButtonGroup` · `DSToolbar` |
| Data display | how records and values are shown | `DSAccordion` · `DSAccordionGroup` · `DSAddressView` · `DSAvatar` · `DSAvatarGroup` · `DSBadge` · `DSCard` · `DSCarousel` · `DSCodeBlockView` · `DSColorView` · `DSDataFieldView` · `DSDataUnit` · `DSItem` · `DSItemFacts` · `DSJSONView` · `DSList` · `DSTable` |
| Data entry · Fields | every input a form is built from | `DSInput` · `DSInputNumber` · `DSInputOTP` · `DSInputPhone` · `DSTextarea` · `DSLabel` · `DSCheckbox` · `DSCheckboxGroup` · `DSRadio` · `DSRadioGroup` · `DSSwitch` · `DSToggle` · `DSToggleGroup` · `DSToggleGroupMulti` · `DSSlider` · `DSSliderRange` · `DSTagGroup` |
| Data entry · Pickers | choosing from a set, a date or a time | `DSSelect` · `DSSelectMulti` · `DSAutocomplete` · `DSAutocompleteMulti` · `DSCommand` · `DSCommandPalette` · `DSDatePicker` · `DSDateRangePicker` · `DSTimePicker` · `DSDateTimePicker` · `DSCalendar` · `DSColorPicker` |
| Data entry · Composites | the form frame, and inputs built from other inputs | `DSForm` · `DSAddressForm` · `DSAttachment` · `DSAttachmentMulti` · `DSJSONControl` · `DSDataFieldForm` · `DSDataFieldBuilder` · `DSImagePicker` |
| Feedback | what a surface says while it works, and when it fails | `DSAlert` · `DSSpinner` · `DSToast` · `DSProgress` · `DSProgressCircle` · `DSSkeleton` · `DSEmpty` |
| Structure | the small blocks that divide, scroll or fold a part of a page | `DSCollapsible` · `DSHScroll` · `DSScrollArea` · `DSSeparator` |
| Media | images and icons | `DSAspectRatio` · `DSIcon` · `DSIconMark` · `DSImage` |
| Navigation | moving between places | `DSBreadcrumb` · `DSMenubar` · `DSNavigationMenu` · `DSPagination` · `DSTabs` · `DSLink` · `DSAnchor` |
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

- **`DSTable` MUST decide `striped` and `hoverable` in one order: its own prop where the prop is given, else the value of the theme, else off** (`RD.SUPPORT.SURFACE.126`). A prop that says no is given, so a table that says no to `striped` draws no stripes under a theme that says yes. The theme holds the two values in its block `table` (`architecture-app.md`).
- **A row of the body of `DSTable` MAY be marked as the row in view, with `selected`** (`RD.SUPPORT.SURFACE.125`). It is the row of the record that the page shows beside the table or under it, such as the order whose detail is open. `selected` is a yes-or-no prop of the row that is no by default. The row in view **MUST** draw the band that a chosen row of a list draws, and it **MUST** carry `aria-current="true"`. It takes no hover fill while it is in view.
- **The row in view and a row that a person ticks MUST NOT share a name or a look.** A person ticks rows to act on many of them at once, and those are the checked records of a data table. One row is in view because its record is open, and it is the `selected` row. A row may be both, and then it shows both.
- **A cell of the head of a table MAY state the width and the least width of its column.**

## What a list's rows carry — 🔮

`DSList` **MUST** take `hoverable`, with the meaning it has on `DSTable` (`RD.SUPPORT.SURFACE.097`). It is a yes-or-no prop that is no by default. A list that is `hoverable` fills the row under the pointer, also where the row is no link. A row that is chosen keeps its fill.

- **In a list the row MUST carry the link, the chosen fill and the reaction to the pointer, and an item line inside it MUST carry none of them.** The row is the whole width, with what stands at its start and at its end, so its fill covers all of it. An item line that stands alone, in a card or a header, carries its own link.
- **`selected` is the row's, and `DSItem` takes none.** A thing is chosen within a set, and the set is the list. So the row of a list, `DSList.Item`, takes `anchor`, `endNode`, `selected` and `showArrow`.
- **A chosen row of a list MUST be drawn as a fill.** A row with `selected` fills its whole width with the soft step of the primary role, and it carries `aria-current="true"`. It takes no hover fill while it is chosen, and it draws no check. The check at the end of a row is the picture of a chosen option of a select or of a menu.
- **A row of a list MUST hold one of three things: plain words, a line of facts, or an item line** (`RD.SUPPORT.SURFACE.132`). A row that is one line of facts holds the unit `DSItemFacts`, which takes `facts` and `size` and draws the facts as the item line draws its own. A row with a title and a description or facts under it holds a `DSItem`. A row of a list takes no `facts` of its own.
- **`anchor` and `showArrow` stand on both blocks**, because the link and the arrow that says it leads somewhere go together: on the row in a list, and on the item line where it stands alone.
- **The arrow of `showArrow` is off unless a page writes it, and the design system works out no value from the row.** It is a chevron that stands after everything else at the end of the row. **It MUST be drawn as the look-alike of an icon-only ghost button, and it MUST be no control.** So a row that ends in the arrow is as tall as a row that ends in an action, and the arrow and the icon of an action stand in one column. The arrow takes no focus and no press of its own, and it is hidden from a screen reader. The link of the row covers it.
- **An action at the end of a row that is a link MUST NOT follow the link** (`RD.SUPPORT.SURFACE.110`). A press on the action does the action and nothing else, and a press anywhere else on the row follows the link. The row and the list hold this, so a page writes no guard for it.

## What single blocks answer — 🔮

Each rule below is of one block or one prop. The props, their values and their defaults are in `architecture-names.md`.

| Block | Its rule |
| --- | --- |
| `DSButton` | **A button that shows an icon and no label MUST show its label as a tooltip.** The words are those of its `ariaLabel`, shown when the pointer rests on the button and when the keyboard reaches it. A button with a visible label shows none, and a disabled button shows none. `tooltip` takes other words for it, or `false` for none |
| `DSToolbar` | **A row of controls, and never a menu.** Its parts are `DSToolbar.Item`, `DSToolbar.Group` and `DSToolbar.Separator`. An item is drawn as a `DSButton` at the size of the toolbar. The arrow keys move between the items, so the whole toolbar is one stop for the Tab key. `bordered` draws the frame around the row, and a toolbar inside another surface turns it off |
| `DSTable` | **A data cell MAY be `marked`.** A marked cell is the one that stands out in its row, such as the name of a record. Its text is drawn in the medium weight and the default text colour. No cell is marked by default |
| `DSCard` | **A card MAY hold the parts `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`.** A part pads itself, from the size of the card. Each part takes `flush`, which drops that padding so that what the part holds reaches the edge of the card, and no other prop. The title of a card is an item line in its header, and it starts where what the card holds starts. `divided` draws a line between each two parts, from edge to edge. It is a prop of the card that the page writes, and it is no by default. A card takes `raised`, `bordered` and `rounded` from its own prop where the prop is given, else from the card look of the theme (`architecture-app.md`). **A container or a card that holds parts, or more than one content part, MUST have a title:** an item line at the level `SECTION` in its header. A card that is one plain block of content needs none. `fullHeight` makes the card fill the height of its place, so the cards of one row of a grid end on one line. What then tells a card from a container is in `architecture-containers.md` |
| `DSList` · `DSItem` | **`bleed` is for a list or an item that fills a part with no inset**, such as a `flush` part of a container or of a card. On an item line it is for a line among others, the level `CONTENT`, and it changes nothing on an item line that is a title. Each row keeps the padding of its size above and below, and takes the inset of its place at its two sides. So the text of a row lines up with a title in a part that insets, and the fill of a pressed or chosen row runs from edge to edge. On a list, `bleed` wins over `flush` |
| `DSColorView` | **Shows a stored colour that a person reads:** a small swatch, and the value beside it as text. With no colour it shows a dash, or the words of `emptyLabel`. `swatchOnly` draws the swatch alone. A colour that is part of a block's own look, such as a badge drawn in its colour, is not shown through this block |
| `DSTagGroup` | **A set of tags a person removes from.** Each tag is drawn as a `DSBadge` with its close action, and the keyboard reaches each one. The page holds the set: it adds a tag elsewhere, and takes the tag out when the group reports that one was removed. A choice from a fixed set is `DSToggleGroupMulti`, and not this block |
| `DSCalendar` | **The month grid by itself, on the page.** It is the grid that `DSDatePicker` opens, with no field and no popover around it. Its value is one date, or none |
| `DSColorPicker` | **A swatch that opens the colour picker of the device, with the colour's code beside it.** `showValue` shows the code in a field, and a person may type the code there in place of picking. **It MUST write and show a hex code in capitals, such as `#1A365D`,** whether typed or picked. A code stored in small letters is shown in capitals and left as stored until a person changes the colour. **A typed colour MUST be a hex code of six digits with its `#`,** in either case, taken when the person presses Enter or leaves the field. A text that is no such code leaves the colour as it was, and the field shows its error state. **It MAY hold no colour:** the swatch then has a dashed edge and no fill, and `clearable` offers an action that empties it |
| `DSProgressCircle` | **Progress as a ring.** The ring fills to `value` out of `max`, and `showValue` writes the value inside it. With `indeterminate` the ring turns and reads no value. It is a block of its own beside `DSProgress`: the bar and the ring share no picture |
| `DSTabs` | **A tab that has an address MUST be a link.** A person can then open it in a new browser tab or copy its address. A plain press still opens the tab in its row. A tab with no address stays a control that opens its panel. **The page level of the tabs MUST decide their look** (`RD.SUPPORT.SURFACE.113`): `DSTabs` takes `pageLevel`, with `CONTENT` when unset, and a page chooses no look for them. "The tabs by level" below states each look |
| `DSPagination` | **The pager MUST arrange itself by the width of its own place, and not by the width of the window** (`RD.SUPPORT.SURFACE.133`). A pager stands in the footer of a full page and in a narrow column of a wide window, and the device type is the same in both. With no choice of rows on a page, the page controls stand in the middle. With the choice, the choice stands at the start and the page controls at the end. In a narrow place the choice is not drawn, and the page controls stand alone in the middle. A page offers no choice where the number of rows is decided already, such as a data table at the side of a detail |
| `DSFormatDate` · `DSFormatDateTime` | **A line that says when something happened MAY show how long ago it was, through `type`** (`RD.SUPPORT.SURFACE.122`). `type` takes `DSFormatDateType`: `DEFAULT`, the date as it is written, and `AGO`, how long ago in words, such as *yesterday* or *2 days ago*, in the app's language and in the largest whole unit. Such a line says roughly when a thing last changed: a version, a record in a list, a comment. `AGO` stays how long ago however old the moment is. On `DSFormatDate` it counts days of the calendar and never shows a unit under a day. **The exact date and time MUST be reachable from it:** it is the tooltip of the words, and it is in their accessible name. **Where a page is a log of what happened, each line MUST show the date and the time, and not how long ago:** an audit log, a log of the notifications sent, the runs of a scheduled job, a list of sign-ins |
| `DSFormatTime` · `DSFormatDateTime` · a picker of a time | **A block that shows or takes a time MUST use the format the page gives it, else the app's, and it MUST hold no time format of its own** (`RD.SUPPORT.SURFACE.123`). The app context always holds a time format. A picker of a time with no clock of its own reads in the clock of that format |

### The overlays, and the two confirmations

- **`DSDialog`, `DSDrawer` and `DSSheet` MAY hold the parts `Header`, `Content` and `Footer`**, named `DSDialog.Header` and so on. The header stays at the top and the footer at the bottom, and only the content scrolls between them. The header places its first block at the start and its last block at the end, and leaves room for the close action. The footer places its actions at its end, the action that leaves the work first and the main action last (`architecture-containers.md`). `DSConfirmDialog` and `DSConfirmPopover` place their two actions the same way. An overlay that holds plain blocks and no parts scrolls them as one.
- **A dialog, a drawer and a sheet MUST announce their title once** (`RD.SUPPORT.SURFACE.121`). Where an item line at the level `SECTION` stands as the title in the header, that title and the name of the overlay are one heading to a screen reader. A page gives the title once, and it writes nothing more for the name.
- **`DSSheet` takes `modal`, which is yes by default.** A sheet that is not modal stands beside the page. It draws no scrim, and the page stays usable. A press on the page does not close the sheet; its close action and the Escape key do. **On a phone a sheet MUST stay modal, whatever `modal` says.**
- **`DSConfirmDialog` asks a person to confirm an act that cannot be undone, and it stays open while the act runs** (`RD.SUPPORT.SURFACE.088` rules the name, and no older name is kept beside it). The confirm action shows working, neither action can be pressed, and the dialog cannot be left. An act that fails keeps the dialog open and shows the failure in it.
- **`DSConfirmPopover` asks a person to confirm an act they can undo, in a popover that opens from the control that was pressed.** It holds the question, an action that cancels and the action that confirms, named as on `DSConfirmDialog`. It draws on the surface of `DSPopover`, covers no page and draws no scrim. **It MUST stay open while the act runs, and MUST close when the act is done.** An act that fails keeps it open and shows the failure in it. The cancel action and the Escape key close it, and focus goes back to the control that opened it.

`standards-patterns.md` states when a confirmation is the popover and when it is the dialog.

### The tabs by level

| `pageLevel` | The tabs are | Their look | At the size of the theme, `SM` |
| --- | --- | --- | --- |
| `PAGE` | the sub-pages of a page | the line: the open tab has a line under it in the primary colour, and no fill | a label of 16px in a row of 40px |
| `SECTION` | the parts of a section | the line | a label of 14px in a row of 36px |
| `GROUP` · `CONTENT` | two ways to show one thing | the filled row: the open tab is a raised pill on a filled bar | a label of 13px in a row of 32px |

- **The `size` of the tabs picks the step, and the level says how far above it the tabs are drawn.** At `GROUP` and at `CONTENT` a tab is drawn at the step of its size. At `SECTION` it is drawn one step above, and at `PAGE` two steps above, and never above `XL`. A step gives the label its content step and the row the height of a control.
- **Tabs that say no level draw the filled row.** The tabs of a part of a page say `SECTION`, and the tabs that lead to the sub-pages of a whole page say `PAGE`.
- **In a `flush` part, the tabs MUST place their first tab and their panel by the inset of their place** (`RD.SUPPORT.SURFACE.118`). The label of the first tab starts at that inset, so it starts where the text under it starts. The line of the tabs still runs from edge to edge. The panel takes the same inset at its sides, and what it holds stands in a padded place. So a title in the panel takes no inset of its own, and a code view or a table in the panel keeps its border.
- **A page MUST NOT write a padding for the tabs or for their panel.** The part says that it is `flush`, and the tabs do the rest.

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
  | Plain words | the words alone | the words, in the quiet tone |
  | `TEXT` | `text`, and where it needs them a `label`, a `startIcon` and an `endIcon` | the words in the quiet tone, with the icons at their two sides. A `label` stands before the words with a colon, as *Members: 12* |
  | `BADGE` | `text`, and where it needs them a `color`, a `startIcon` and an `endIcon` | a small soft badge. The page chooses its colour and its icons, and never its size or its look |
  | `CUSTOM` | `node`, a block of the page's own | the block as it is given, in its place on the line |

- **A fact MAY carry its label before it, where the value cannot be read alone.** A count, a date and a person are such values. A state, a kind and a code are read alone and take no label. This is the one place a title stands beside its value.
- **A fact that is empty MUST be left out, with its dot.**
- **The picture of an item line MUST be given to `media` as data of one kind, and never as a block the page has sized** (`RD.SUPPORT.SURFACE.130`). The picture states its kind in `mtype`, which takes `DSItemMediaType`. The item draws the unit of that kind, so the heads of two pages hold one picture at one size.

  | Kind | What the page gives | What the block draws |
  | --- | --- | --- |
  | `ICON` | the icon, and nothing else | the icon alone, with no background, at the icon size the level and the size of the item give |
  | `ICON_MARK` | what a mark takes that is not a size: its icon, its colour, its variant, its shape and its accessible name | a `DSIconMark`, at the scale size the level and the size of the item give |
  | `AVATAR` | what an avatar takes that is not a size: the name it stands for, the address of its picture, and what else an avatar takes | a `DSAvatar`, at that scale size |
  | `AVATAR_GROUP` | what a group of avatars takes that is not a size: its avatars, and how many it shows at most | a `DSAvatarGroup`, at that scale size |
  | `CUSTOM` | `node`, a block of the page's own | the block as it is given, in the place of the picture. The item does not size it |

- **A kind of picture MUST hold no size and no scale size.** The item owns the size of its picture, from its `pageLevel` and its `size`. A page that needs a picture the item does not know gives `CUSTOM`, and that picture is the page's to size.
- **The start of an item line MUST be one place that one prop fills, and `DSItem` MUST take no `startIcon`.** An icon alone is the kind `ICON` of `media`. `media` takes a block in no way but `CUSTOM`. Each stack states the fields of each kind in its own docs.
- **`DSItem` MUST take what stands at its end as `endNode`, a node, and it takes no prop named `actions`** (`RD.SUPPORT.SURFACE.131`). The node stands at the end of the line and outside the link of the line, so a control in it runs alone and does not follow the link. The page gives the node as it is, and the item line reads nothing inside it. It holds the actions of the thing, a badge, or both. The row of a list takes `endNode` under the same name.
- **What stands at the end of an item line is the page's own: its actions, a badge, or both** (`RD.SUPPORT.SURFACE.059`, `RD.SUPPORT.SURFACE.087`). A line that leads to a page shows the arrow of `showArrow` where its end holds no action. A line that has an action gives it at its end and shows no arrow. Where the end holds a badge alone, the page may show the arrow too. The arrow is no state: it stands on a line that leads somewhere when it is pressed, and a line that leads nowhere shows none. A row of `DSList` takes `showArrow` the same way, and in a list the arrow is the row's.
- **The header of a record and a line of a list MUST have the same shape: a picture, a title, a line under it, and what stands at its end.** A person who has read a list can read the page of one record.

- **An item line MUST draw its description whole, and the page decides what the description says** (`RD.SUPPORT.SURFACE.111`). The item line cuts no description and takes no prop for a number of lines. A page that wants the heads of a row of cards at one height gives each a description of one length.

One item line serves every level of a page, and `pageLevel`, from `DSPageLevelType`, says which one it stands at. The level picks the family of the title and how far above the item's `size` the title stands, and the `size` picks the step.

| `pageLevel` | The item line is | Its title | Its element | Its picture |
| --- | --- | --- | --- | --- |
| `PAGE` | the head of the whole page, such as the header of a record or of a listing that is the page | a heading, one step above the item's size | an `h1` | the scale size two steps above that heading's own step |
| `SECTION` | the title line of a part of a page, such as the header of a container or of a card | a title, two steps above the item's size | an `h2` | the scale size of the same step as that title |
| `GROUP` | the title line of a titled group inside the content of a part | a title, one step above the item's size | an `h3` | the scale size of the same step as that title |
| `CONTENT` | a line among others, such as a line of a list. It is the default | a title, at the step of the item's size | no heading | the scale size of the same step as the title |

Each cell below names the step of the title and the scale size of the picture, with the pixels of the text and of an avatar or a mark.

| Size of the item | `CONTENT` | `GROUP` | `SECTION` | `PAGE` |
| --- | --- | --- | --- | --- |
| `XS` | `TITLE_XS`, 12px, with `XS`, 28px | `TITLE_SM`, 13px, with `SM`, 32px | `TITLE_MD`, 14px, with `MD`, 36px | `HEADING_SM`, 24px, with `LG`, 40px |
| `SM` | `TITLE_SM`, 13px, with `SM`, 32px | `TITLE_MD`, 14px, with `MD`, 36px | `TITLE_LG`, 16px, with `LG`, 40px | `HEADING_MD`, 28px, with `XL`, 44px |
| `MD` | `TITLE_MD`, 14px, with `MD`, 36px | `TITLE_LG`, 16px, with `LG`, 40px | `TITLE_XL`, 18px, with `XL`, 44px | `HEADING_LG`, 34px, with `XXL`, 48px |
| `LG` | `TITLE_LG`, 16px, with `LG`, 40px | `TITLE_XL`, 18px, with `XL`, 44px | `TITLE_XXL`, 24px, with `XXL`, 48px | `HEADING_XL`, 40px, with `XXL2`, 56px |
| `XL` | `TITLE_XL`, 18px, with `XL`, 44px | `TITLE_XXL`, 24px, with `XXL`, 48px | `TITLE_XXL2`, 32px, with `XXL2`, 56px | `HEADING_XXL`, 48px, with `XXL3`, 64px |

- **The `pageLevel` and the `size` of an item line MUST together decide the type step of its title, its element and the scale size of its picture** (`RD.SUPPORT.SURFACE.094`). A page chooses the level and the size, and writes no type step, no heading element and no scale size of its own. A larger head needs no new level: the head of a profile page is the same item at `LG`.
- **The item line gives its picture the scale size.** A picture of a kind the item knows is drawn at the step of the table, and a page cannot set one. A `CUSTOM` picture is placed and keeps the size it has. At the level `PAGE`, an icon alone, the kind `ICON`, is the size of the heading or the next size up: 24px, 32px, 40px, 40px and 48px for the five sizes of the item.
- **In the header of a page, an avatar or a mark MUST stand at the top of the text, its top where the heading's line starts.** An icon alone stands in the middle of the heading's first line, and so does the way back. On the title line of a part or of a group, the picture stands level with the middle of the text.
- **The line of facts MUST stand 4px under the text above it, at every level of an item line** (`RD.SUPPORT.SURFACE.135`). The text above it is the description, or the title where the line has no description.
- **Under the heading of a page, the description MUST take the content type one step above the size of the item.** The largest size has no step above it and keeps its own. At every other level the description takes the content type of the size of the item.
- **`size` MUST still set the padding of the item line, and it is handed to what stands inside it.** So a head at a larger size has larger buttons beside it.
- **An item line that is a title MUST start where what stands under it starts** (`RD.SUPPORT.SURFACE.109`). A title is an item line at the level `PAGE`, `SECTION` or `GROUP`. It takes no padding of its own at its two sides. So the title of a group starts where the labels of the fields under it start, in a part that insets, in a card, in a dialog and in a sheet. The head of a page starts where the framed parts under it start. Above and below, a title keeps the padding of its size.
- **In a `flush` part, a title MUST take the inset of its place at its two sides.** What stands under it there reaches the edge, and the rows start their text at that inset. The place is the container or the card the part belongs to, and its size sets the inset.
- **A page MUST NOT write a prop or a padding to place a title.** The level says that the line is a title, and the part says whether it is `flush`. `bleed` on a title changes nothing.
- **An item line at the level `CONTENT` pads as a row does.** It keeps the padding of its size on every side. With `bleed` it takes the inset of its place at its two sides, so its fill runs from edge to edge.
- **An item line at the level `SECTION` MAY stand as the title of a dialog, a drawer or a sheet, in its header, and it MUST take no inset beside the inset of that header.** The title then starts where the fields under it start. `DSConfirmDialog` and `DSConfirmPopover` take a `title` and draw it themselves, so a page gives them the words and no item line.

### The badge

The badge, `DSBadge`, shows a state or a kind as one of the facts of a thing. Where it stands, and that the normal state shows none, are rules of content in `standards-core.md`. Two more rules keep a badge readable. Both are proposed, and not yet confirmed (`RD.SUPPORT.SURFACE.065`).

- **A badge MUST always show its word.** It then reads without its colour and without its icon, also for a person who cannot tell the colours apart. `DSBadge` asks for its `label` on every use.
- **The colour of a badge MUST say a state, and never a kind.** A person learns that a coloured badge asks to be looked at. A colour on every kind would spend that signal on things that need no attention.

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
- **A mark MUST draw each value of `variant` from the one surface that a button and a badge draw from, with the step that value has under the pointer.** A mark, a badge and a button of one variant and one hue are then the same colours. The step under the pointer is for the look alone: a mark is a picture and no control, and it takes no press.
- **A filled mark is a thing that is set up, and an empty mark is a thing that is not set up yet.** So a row of marks shows where a setup stands with no count beside it.

`DSIconMark` draws an icon as a mark, on a background of its own. `shape` takes `DSIconMarkShapeType`: `CIRCLE`, the default; `ROUNDED`, a square with the corner radius of its size step; `SQUARE`, a square with sharp corners. `size` is the density step: a mark with no `scaleSize` takes the scale size of the same name, so its background is as tall as a control of that step. `scaleSize`, from `DSScaleSizeType`, says how large the mark is drawn, with a background of 24 to 96px, and the mark holds the icon of its own step. `color` is the hue. `variant` is how the background is drawn, from `DSVariantType`: `SOFT`, a tinted fill and the default; `SOLID`, a strong fill; `OUTLINE`, a ring with no fill; `GHOST` and `LINK`, the icon alone with no fill and no ring. A screen reader passes a mark by; a mark that stands alone takes a name through `ariaLabel`, and is then read as an image. A person's picture stays `DSAvatar`, which is round.

### The avatar

`DSAvatar` shows the picture of a person or of a thing, and its initials where there is no picture. `DSAvatarGroup` shows several of them as one stack. Both take `scaleSize`, from 24 to 96px, and both keep `size`. With no `scaleSize`, an avatar takes the step of the same name as its `size`, and with neither it takes the size of the place it stands in. A group gives its scale size to each avatar it holds.

- **The badge of an avatar MUST follow the scale size of the avatar** (`RD.SUPPORT.SURFACE.136`). A badge that holds an icon is about a third of the avatar, and never under 12px: 12, 12, 12, 14, 14, 16, 16, 20, 20, 24 and 32px from `XXS` to `XXL5`. A badge with no icon is a dot of about a quarter of the avatar, and never under 8px: 8, 8, 8, 10, 10, 12, 12, 14, 16, 20 and 24px. A page sets no size for either.
- **The initials of an avatar MUST be a title step of about four tenths of the avatar** (`RD.SUPPORT.SURFACE.105`). From `XXL` up they are not the title of the avatar's own step name, because that title would fill the circle.

| Scale size of the avatar | Its size | Its initials | What it is for |
| --- | --- | --- | --- |
| `XXS` | 24px | 10px | a person named inside a line of text or a dense table |
| `XS` · `SM` · `MD` · `LG` · `XL` | 28 · 32 · 36 · 40 · 44px | 12 · 13 · 14 · 16 · 18px | a row, a list, the head of a section or of a page |
| `XXL` | 48px | 18px | a card about one person |
| `XXL2` | 56px | 24px | the head of a record with a line under its name |
| `XXL3` | 64px | 24px | the head of a record with a line and facts |
| `XXL4` | 80px | 32px | a profile page |
| `XXL5` | 96px | 40px | an account's own page |

### What stands beside what

These rules are for a component a builder makes, where a text stands beside an icon, a mark or an avatar. Inside an item line the item decides, and a page chooses none of this there.

- **Beside a title, an icon, a mark and an avatar MUST take the scale size of the title's own step name** (`RD.SUPPORT.SURFACE.104`). `TITLE_XXL3` stands beside `XXL3`: a 40px title, a 40px icon, and a 64px mark or avatar. An icon beside a title is never smaller than the title.
- **Beside a heading, an icon MUST be the size of the heading or the next size up, up to 56px.** A heading has no scale size of its own name, so the pairing goes by size. Beside a heading larger than 56px, the icon stands in a mark.
- **Beside a heading, an avatar or a mark MUST be two steps above the heading's own step, and never larger than `XXL5`.**

| Heading | Its size | The icon beside it | The avatar or the mark beside it |
| --- | --- | --- | --- |
| `HEADING_XS` | 20px | `XL`, 20px | `MD`, 36px |
| `HEADING_SM` | 24px | `XXL`, 24px | `LG`, 40px |
| `HEADING_MD` | 28px | `XXL2`, 32px | `XL`, 44px |
| `HEADING_LG` | 34px | `XXL3`, 40px | `XXL`, 48px |
| `HEADING_XL` | 40px | `XXL3`, 40px | `XXL2`, 56px |
| `HEADING_XXL` | 48px | `XXL4`, 48px | `XXL3`, 64px |
| `HEADING_XXL2` | 56px | `XXL5`, 56px | `XXL4`, 80px |
| `HEADING_XXL3` · `HEADING_XXL4` · `HEADING_XXL5` | 64 · 72 · 80px | the icon in a mark | `XXL5`, 96px |

### Which to use where

A title and a heading share sizes from 24 to 56px, so the size does not say which one a text is. What the text does on the page says it.

| The text is | Use | How many on a page |
| --- | --- | --- |
| the name of the whole page: a record, a list, a page of cards | a heading, as an item line at the level `PAGE` | one |
| the name of a part of a page: a container, a card | a title, as an item line at the level `SECTION`, at the size of its place | one for each part |
| the name of a group inside the content of a part: a set of rows under one name | a title, as an item line at the level `GROUP`, at the size of its place | one for each group |
| a line among others: a row of a list, a person in a cell | a title, as an item line at the level `CONTENT` | as many as there are lines |
| a number, a price, the line of a hero | a heading step above `HEADING_XL`, in a component of the builder's own | one or two |

- **A heading MUST name the whole page, and a page MUST have one heading that names it. A title MUST name a part of a page or a line among others** (`RD.SUPPORT.SURFACE.106`). A person then learns from the weight of a text whether it names the page or a part of it.
- **A listing that is the page MUST give the header of its container the level `PAGE`.** A listing that is a part of a page says `SECTION`. So every page of an app opens with the same head, and only its body differs.
- **Every level of a page MUST have its title, and a title MUST be larger than the titles of what stands under it** (`RD.SUPPORT.SURFACE.112`). At the size of the theme, `SM`, the page draws a heading of 28px, a part a title of 16px, a group a title of 14px and a row a title of 13px.
- **A group inside the content of a part MUST draw its title as an item line at the level `GROUP`, at the size of its place.** The action of the group stands at the end of that item line. So a group needs no block and no prop of its own.

### The two blocks of a field

A field has two blocks, one to enter a value and one to read it.

| The field | Its block | What the block draws |
| --- | --- | --- |
| A field a person enters | `DSForm.Field` | its title above its control, and one line under the control that holds its description, or its error in place of the description. The room of that line is kept where a field has neither |
| A field a person reads | `DSDataUnit` | its title above its value, with no box around the value. A value that is empty shows a dash |

- **A form holds each field a person enters in `DSForm.Field`, and a page shows each field a person reads in `DSDataUnit`.** Both keep the title above, as the rules of content ask (`RD.SUPPORT.SURFACE.060`, `RD.SUPPORT.SURFACE.061`). So a record that is read and the form that changes it have the same shape.
- **`DSDataFieldView` draws through `DSDataUnit`, and it needs the config of a data field.** So it fits a custom field, whose config the record already carries. A field with no such config is read through `DSDataUnit` itself.
- **Neither block places its neighbours.** The foundation defines no block for the grid that readings stand in. The page writes that grid, or uses a unit for it where its stack provides one, as `architecture-containers.md` says of every gap between two blocks.

## Composing, never restyling — 🔮

A page composes these blocks, and never restyles a copy of one. A control that is missing is proposed to the design system. One that every stack should build is named and grouped here first. One that helps a single stack may be that stack's own unit. An overlay a block opens — a popover, a tooltip, a dropdown menu — is a private part of that block, shown by a switch such as `open`, and never a block a designer places on its own.

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
| `RD.SUPPORT.SURFACE.059` | what stands at the end of a line is the page's own, its actions, a badge or both, and when a line shows its arrow |
| `RD.SUPPORT.SURFACE.087` | the arrow of a line that leads somewhere may stand after its actions. It is a MAY |
| `RD.SUPPORT.SURFACE.088` | the dialog that asks a person to confirm an act is named `DSConfirmDialog` |
| `RD.SUPPORT.SURFACE.089` | `DSToolbar`, `DSTagGroup`, `DSCalendar`, `DSColorPicker` and `DSProgressCircle` are core units |
| `RD.SUPPORT.SURFACE.090` | `DSColorView`, `DSIconMark` and `DSConfirmPopover` are core units |
| `RD.SUPPORT.SURFACE.094` | the page level and the size of an item line together decide the type step and the element of its title, and the scale size of its picture |
| `RD.SUPPORT.SURFACE.096` | the four forms a fact of an item line is given in, and a fact may carry its label before it |
| `RD.SUPPORT.SURFACE.097` | `DSList` takes `hoverable`, and `selected` is the row's and not the item line's |
| `RD.SUPPORT.SURFACE.104` | which icon, mark and avatar stand beside a title and beside a heading |
| `RD.SUPPORT.SURFACE.105` | the initials of an avatar are a title step of about four tenths of the avatar |
| `RD.SUPPORT.SURFACE.106` | a heading names the whole page, one to a page, and a title names a part or a line |
| `RD.SUPPORT.SURFACE.109` | an item line that is a title starts where what stands under it starts, and takes the inset of its place only in a `flush` part |
| `RD.SUPPORT.SURFACE.110` | an action at the end of a row that is a link does not follow the link |
| `RD.SUPPORT.SURFACE.111` | an item line draws its description whole, and the page decides what it says |
| `RD.SUPPORT.SURFACE.112` | every level of a page has its title, and a title is larger than the titles of what stands under it |
| `RD.SUPPORT.SURFACE.113` | the item line and the tabs take `pageLevel`, with the one vocabulary `DSPageLevelType`, and the level decides the look of the tabs |
| `RD.SUPPORT.SURFACE.118` | in a `flush` part the tabs place their first tab and their panel by the inset of their place |
| `RD.SUPPORT.SURFACE.121` | a dialog, a drawer and a sheet announce their title once |
| `RD.SUPPORT.SURFACE.122` | a line that says when something happened may show how long ago it was, through the `type` of the two date units, with the exact date and time reachable from it. It is a MAY |
| `RD.SUPPORT.SURFACE.123` | a block that shows or takes a time holds no time format of its own |
| `RD.SUPPORT.SURFACE.124` | a mark takes `variant` with the shared vocabulary, and `GHOST` and `LINK` draw the icon with no fill |
| `RD.SUPPORT.SURFACE.125` | a table marks the row in view, with the band and `aria-current` of a chosen row of a list, apart from the rows a person ticks. It is a MAY |
| `RD.SUPPORT.SURFACE.126` | the order a table takes its stripes and its hover in: its own prop, else the theme, else off |
| `RD.SUPPORT.SURFACE.130` | the picture of an item line is data of one kind, the item owns its size, and the item line takes no `startIcon` |
| `RD.SUPPORT.SURFACE.131` | the item line takes what stands at its end as `endNode`, a node outside the link of the line |
| `RD.SUPPORT.SURFACE.132` | a row of a list holds plain words, a line of facts through `DSItemFacts`, or an item line, and takes no `facts` of its own |
| `RD.SUPPORT.SURFACE.133` | the pager arranges itself by the width of its own place, and where its parts stand |
| `RD.SUPPORT.SURFACE.135` | the line of facts stands 4 pixels under the text above it, and the step of the description under the heading of a page |
| `RD.SUPPORT.SURFACE.136` | the badge of an avatar is about a third of the avatar and its dot about a quarter, by scale size |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task. The web builds `facts` and `pageLevel` on `DSItem`. It also builds the larger sizes, in Support `5.13.0`: `scaleSize` on `DSIcon`, `DSIconMark`, `DSAvatar` and `DSAvatarGroup`, the item line and the tabs drawn by their page level, and `flush` on the parts of a card. The web builds the tabs in a `flush` part, the one name of an overlay with a title, the form `AGO` of the two date units, the time format that a block takes from the app alone, the row in view of a table, the order a table takes `striped` and `hoverable` in, and the picture of an item line given as data. The design library has not drawn the larger sizes or any of these yet, and it is drawn after the stack. So a page on another stack checks what its stack's units take before it uses one of these.
