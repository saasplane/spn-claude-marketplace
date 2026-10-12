<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/06-architecture-components.md",
      "seen": "efd5352c"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/06-architecture-components/",
      "seen": "36cd89d9"
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
| Item line | `DSItem` — one thing shown as a line: a picture, a title, a description, a line of facts, and actions at its end |
| Mark | a picture or an icon that stands for a thing or a person. It is round unless a page chooses another shape |
| Core unit | a block the book names, which every stack builds under that name. A stack may provide further units of its own |

An **item line** is not the Item of a host. A host may draw an item line for each entry, and an item line also stands alone, for one thing shown by itself.

A **block** is any unit a surface is built from — a layout, a container, a widget or a component (`standards-core.md`). The component is the smallest of the four.

## The groups — 🔮

Eleven groups, each answering one need of a surface. The list holds the core units: the library draws one page per group, each provider keeps one folder per group, the showcase opens each group of units with an Overview page, and a new core unit joins this list before it is drawn or built anywhere. A stack may provide further units of its own beside them, and this list names none of those.

| Group | Answers | Blocks |
| --- | --- | --- |
| Actions | the ways a person asks for something | `DSButton` · `DSButtonGroup` · `DSToolbar` |
| Data display | how records and values are shown | `DSAccordion` · `DSAccordionGroup` · `DSAddressView` · `DSAvatar` · `DSAvatarGroup` · `DSBadge` · `DSCard` · `DSCarousel` · `DSCodeBlockView` · `DSColorView` · `DSDataFieldView` · `DSDataUnit` · `DSItem` · `DSJSONView` · `DSList` · `DSTable` |
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

The library draws a sheet for each block of Utility whose behaviour a person feels: a sheet of states for `DSAuthz` (allowed, denied, fallback), `DSSticky` (in flow, stuck) and `DSAnchorContainer`, and one sheet of formats for the five formatters. `DSAnchor` of Navigation has a small sheet of states, and `DSAspectRatio` of Media has one sheet of ratios. `DSElementObserver` has an entry with its description and no states, and `DSPortal`, a block of the web alone, has no entry. The widgets, the container and the layout sit one layer up and each have a construct of their own: `architecture-widgets.md`, `architecture-containers.md`, `architecture-layouts.md`.

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

`DSTable` **MUST** take `hoverable`, a yes-or-no prop that is no by default. A table that is not `hoverable` draws no reaction in its body rows when the pointer rests on one; a table that is `hoverable` fills the body row under the pointer with the table's row-hover fill. A selected row **MUST** keep its selected fill, and a row that holds an open menu **MUST** keep its fill, whichever way `hoverable` is set: the prop decides only whether the pointer changes a row.

The reason is that a hover tells a person the row answers to them. A row that does nothing when it is pressed should not react, so a plain table stays still, and a table whose rows a person acts on turns `hoverable` on. `DSWDataTable` turns it on. `hoverable` is not a prop for the hover state: hover stays a shown state that the browser produces, and the prop states only whether this block answers to the pointer at all.

## What a list's rows carry — 🔮

`DSList` **MUST** take `hoverable`, with the meaning it has on `DSTable` (`RD.SUPPORT.SURFACE.097`). It is a yes-or-no prop that is no by default. A list that is `hoverable` fills the row under the pointer, also where the row is no link. A row that is chosen keeps its fill.

- **In a list the row MUST carry the link, the chosen fill and the reaction to the pointer, and an item line inside it MUST carry none of them.** The row is the whole width, with what stands at its start and at its end, so its fill covers all of it. An item line that stands alone, in a card or a header, carries its own link.
- **`selected` is the row's, and `DSItem` takes none.** A thing is chosen within a set, and the set is the list. So the row of a list, `DSList.Item`, takes `anchor`, `selected` and `showArrow`.
- **`anchor` and `showArrow` stand on both blocks**, because the link and the arrow that says it leads somewhere go together: on the row in a list, and on the item line where it stands alone.

## What single blocks answer — 🔮

Each rule below is of one block or one prop. The props, their values and their defaults are in `architecture-names.md`.

| Block | Its rule |
| --- | --- |
| `DSButton` | **A button that shows an icon and no label MUST show its label as a tooltip.** The words are those of its `ariaLabel`, shown when the pointer rests on the button and when the keyboard reaches it. A button with a visible label shows none, and a disabled button shows none. `tooltip` takes other words for it, or `false` for none |
| `DSToolbar` | **A row of controls, and never a menu.** Its parts are `DSToolbar.Item`, `DSToolbar.Group` and `DSToolbar.Separator`. An item is drawn as a `DSButton` at the size of the toolbar. The arrow keys move between the items, so the whole toolbar is one stop for the Tab key. `bordered` draws the frame around the row, and a toolbar inside another surface turns it off |
| `DSTable` | **A data cell MAY be `marked`.** A marked cell is the one that stands out in its row, such as the name of a record. Its text is drawn in the medium weight and the default text colour. No cell is marked by default |
| `DSCard` | **A card MAY hold the parts `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`.** A part takes its padding from the size of the card, and takes no prop. `divided` draws a line between each two parts, from edge to edge. `fullHeight` makes the card fill the height of its place, so the cards of one row of a grid end on one line. What then tells a card from a container is in `architecture-containers.md` |
| `DSList` · `DSItem` | **`bleed` is for a list or an item that fills a part with no inset**, such as a `flush` part of a container. Each row keeps the padding of its size above and below, and takes the inset of its place at its two sides. So the text of a row lines up with a title in a part that insets, and the fill of a pressed or chosen row runs from edge to edge. On a list, `bleed` wins over `flush` |
| `DSColorView` | **Shows a stored colour that a person reads:** a small swatch, and the value beside it as text. With no colour it shows a dash, or the words of `emptyLabel`. `swatchOnly` draws the swatch alone. A colour that is part of a block's own look, such as a badge drawn in its colour, is not shown through this block |
| `DSTagGroup` | **A set of tags a person removes from.** Each tag is drawn as a `DSBadge` with its close action, and the keyboard reaches each one. The page holds the set: it adds a tag elsewhere, and takes the tag out when the group reports that one was removed. A choice from a fixed set is `DSToggleGroupMulti`, and not this block |
| `DSCalendar` | **The month grid by itself, on the page.** It is the grid that `DSDatePicker` opens, with no field and no popover around it. Its value is one date, or none |
| `DSColorPicker` | **A swatch that opens the colour picker of the device, with the colour's code beside it.** `showValue` shows the code in a field, and a person may type the code there in place of picking. **It MUST write and show a hex code in capitals, such as `#1A365D`,** whether typed or picked. A code stored in small letters is shown in capitals and left as stored until a person changes the colour. **A typed colour MUST be a hex code of six digits with its `#`,** in either case, taken when the person presses Enter or leaves the field. A text that is no such code leaves the colour as it was, and the field shows its error state. **It MAY hold no colour:** the swatch then has a dashed edge and no fill, and `clearable` offers an action that empties it |
| `DSProgressCircle` | **Progress as a ring.** The ring fills to `value` out of `max`, and `showValue` writes the value inside it. With `indeterminate` the ring turns and reads no value. It is a block of its own beside `DSProgress`: the bar and the ring share no picture |
| `DSTabs` | **A tab that has an address MUST be a link.** A person can then open it in a new browser tab or copy its address. A plain press still opens the tab in its row. A tab with no address stays a control that opens its panel |

### The overlays, and the two confirmations

- **`DSDialog`, `DSDrawer` and `DSSheet` MAY hold the parts `Header`, `Content` and `Footer`**, named `DSDialog.Header` and so on. The header stays at the top and the footer at the bottom, and only the content scrolls between them. The header places its first block at the start and its last block at the end, and leaves room for the close action. The footer places its actions at its end, the action that leaves the work first and the main action last (`architecture-containers.md`). `DSConfirmDialog` and `DSConfirmPopover` place their two actions the same way. An overlay that holds plain blocks and no parts scrolls them as one.
- **`DSSheet` takes `modal`, which is yes by default.** A sheet that is not modal stands beside the page. It draws no scrim, and the page stays usable. A press on the page does not close the sheet; its close action and the Escape key do. **On a phone a sheet MUST stay modal, whatever `modal` says.**
- **`DSConfirmDialog` asks a person to confirm an act that cannot be undone, and it stays open while the act runs** (`RD.SUPPORT.SURFACE.088` rules the name, and no older name is kept beside it). The confirm action shows working, neither action can be pressed, and the dialog cannot be left. An act that fails keeps the dialog open and shows the failure in it.
- **`DSConfirmPopover` asks a person to confirm an act they can undo, in a popover that opens from the control that was pressed.** It holds the question, an action that cancels and the action that confirms, named as on `DSConfirmDialog`. It draws on the surface of `DSPopover`, covers no page and draws no scrim. **It MUST stay open while the act runs, and MUST close when the act is done.** An act that fails keeps it open and shows the failure in it. The cancel action and the Escape key close it, and focus goes back to the control that opened it.

`standards-patterns.md` states when a confirmation is the popover and when it is the dialog.

## The item line, the badge and the mark — 🔮

Three things show a record and its facts on most pages: a line for the record, a badge for a state, and a mark for a picture. Each has one form here. These are the blocks that carry the rules of content of `standards-core.md`.

### The item line

The item line, `DSItem`, shows one thing as a line. It takes no `selected`: in a list the row is the chosen one, and the row carries the fill (`RD.SUPPORT.SURFACE.097`).

| Part of the item line | Holds | Its prop on `DSItem` |
| --- | --- | --- |
| A picture | a picture or an icon of the thing, at the start of the line | `media`, or `startIcon` for an icon alone |
| A title | the name of the thing | `title` |
| A description | one line about the thing, under its title | `description` |
| A line of facts | the short facts of the thing, under its description, with a dot between each two. A badge stands among them, before the other facts | `facts` |
| Actions | the actions of the thing, at the end of the line | `actions` |
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
- **Nothing but the actions MAY stand at the end of an item line, and the arrow of `showArrow` MAY stand after them** (`RD.SUPPORT.SURFACE.087`). A state at the end would look like something to press. The arrow is no state: it stands on a line that leads somewhere when it is pressed. It is off by default. A row of `DSList` takes `showArrow` the same way, and in a list the arrow is the row's.
- **The header of a record and a line of a list MUST have the same shape: a picture, a title, a line under it, and actions.** A badge then stands in the same place on both. A person who has read a list can read the page of one record.

One item line serves three places, and `type`, from `DSItemType`, says which one it stands in.

| `type` | The item line is | What the type decides |
| --- | --- | --- |
| `CONTENT` | a line among others, such as a line of a list. It is the default | the title is plain text at the size of the line |
| `SECTION` | the title line of a part of a page, such as the header of a container | the title is a heading of a section, at a larger type step |
| `HEADER` | the header of a page or of a record | the title is the heading of the page, at the largest type step of the three |

- **The `type` of an item line MUST decide the type step of its title, its heading level and the size of its picture** (`RD.SUPPORT.SURFACE.094`). A page chooses the type and writes no type step and no heading level of its own.

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
- **An icon inside an action MUST keep the square of the control it sits in** (`RD.SUPPORT.SURFACE.067`). A mark is never pressed, so it draws no reaction to the pointer, whatever its shape.
- **A filled mark is a thing that is set up, and an empty mark is a thing that is not set up yet.** So a row of marks shows where a setup stands with no count beside it.

`DSIconMark` draws an icon as a mark, on a background of its own. `shape` takes `DSIconMarkShapeType`: `CIRCLE`, the default; `ROUNDED`, a square with the corner radius of its size step; `SQUARE`, a square with sharp corners. `size` is the size step: the background is as tall as a control of that step. `color` is the hue. `variant` is how the background is drawn: `SOFT`, a tinted fill and the default; `SOLID`, a strong fill; `OUTLINE`, a ring with no fill. A screen reader passes a mark by; a mark that stands alone takes a name through `ariaLabel`, and is then read as an image. A person's picture stays `DSAvatar`, which is round.

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
| `RD.SUPPORT.SURFACE.087` | the arrow of a line that leads somewhere may stand after its actions. It is a MAY |
| `RD.SUPPORT.SURFACE.088` | the dialog that asks a person to confirm an act is named `DSConfirmDialog` |
| `RD.SUPPORT.SURFACE.089` | `DSToolbar`, `DSTagGroup`, `DSCalendar`, `DSColorPicker` and `DSProgressCircle` are core units |
| `RD.SUPPORT.SURFACE.090` | `DSColorView`, `DSIconMark` and `DSConfirmPopover` are core units |
| `RD.SUPPORT.SURFACE.094` | the type of an item line decides the type step and the heading level of its title, and the size of its picture |
| `RD.SUPPORT.SURFACE.096` | the four forms a fact of an item line is given in, and a fact may carry its label before it |
| `RD.SUPPORT.SURFACE.097` | `DSList` takes `hoverable`, and `selected` is the row's and not the item line's |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task. The book states `facts` and `type` on `DSItem` before the web builds them, so a page checks what its stack's `DSItem` takes before it uses either.
