<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/06-architecture-components.md",
      "seen": "6ae6dffc"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/06-architecture-components/",
      "seen": "a65d4c9e"
    }
  ]
}
-->

# Components — The Blocks a Surface Is Built From

Source of truth: the foundation's Components construct (`docs/02-constructs/02-support/03-surface/06-architecture-components.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/06-architecture-components/`). Components is the sixth of thirteen Surface constructs.

Read this before you place a block on a page, before you propose a new one, or before you draw or build a component on a new stack. **The thing to unlearn: a missing control is never a reason to write one inside a page.** A control built inside a page gets none of the theme, the density, the accessibility or the translation that every listed block has. Propose it to the design system, named and grouped here, and only then draw and build it.

## Terms

| Term | What it means |
| --- | --- |
| Component | the smallest block: one control, or one way to show something |
| Group | one of the groups a component belongs to. Each answers one need of a surface |
| Host | the block that takes data and draws its item once for each entry |
| Item | the unit a host draws once for each entry of its data |
| Node | `DSDataMenuNodeType` — the kind of one entry a host that draws a tree takes: `ITEM` · `GROUP` · `SECTION` · `SEPARATOR` · `CUSTOM` |
| Item line | `DSItem` — one thing shown as a line: a picture, a title, a description, a line of facts, and actions at its end |
| Mark | a round picture or icon that stands for a thing or a person |

An **item line** is not the Item of a host. A host may draw an item line for each entry, and an item line also stands alone, for one thing shown by itself.

A **block** is any unit a surface is built from — a layout, a container, a widget or a component (`standards-core.md`). The component is the smallest of the four.

## The groups — 🔮

Eleven groups, each answering one need of a surface. The library draws one page per group, each provider keeps one folder per group, the showcase opens each group of units with an Overview page, and a new component joins this list before it is drawn or built anywhere.

| Group | Answers | Blocks |
| --- | --- | --- |
| Actions | the ways a person asks for something | `DSButton` · `DSButtonGroup` |
| Data display | how records and values are shown | `DSAccordion` · `DSAccordionGroup` · `DSAddressView` · `DSAvatar` · `DSAvatarGroup` · `DSBadge` · `DSCard` · `DSCarousel` · `DSCodeBlockView` · `DSDataFieldView` · `DSDataUnit` · `DSItem` · `DSJSONView` · `DSList` · `DSTable` |
| Data entry · Fields | every input a form is built from | `DSInput` · `DSInputNumber` · `DSInputOTP` · `DSInputPhone` · `DSTextarea` · `DSLabel` · `DSCheckbox` · `DSCheckboxGroup` · `DSRadio` · `DSRadioGroup` · `DSSwitch` · `DSToggle` · `DSToggleGroup` · `DSToggleGroupMulti` · `DSSlider` · `DSSliderRange` |
| Data entry · Pickers | choosing from a set, a date or a time | `DSSelect` · `DSSelectMulti` · `DSAutocomplete` · `DSAutocompleteMulti` · `DSCommand` · `DSCommandPalette` · `DSDatePicker` · `DSDateRangePicker` · `DSTimePicker` · `DSDateTimePicker` |
| Data entry · Composites | the form frame, and inputs built from other inputs | `DSForm` · `DSAddressForm` · `DSAttachment` · `DSAttachmentMulti` · `DSJSONControl` · `DSDataFieldForm` · `DSDataFieldBuilder` · `DSImagePicker` |
| Feedback | what a surface says while it works, and when it fails | `DSAlert` · `DSSpinner` · `DSToast` · `DSProgress` · `DSSkeleton` · `DSEmpty` |
| Structure | the small blocks that divide, scroll or fold a part of a page | `DSCollapsible` · `DSHScroll` · `DSScrollArea` · `DSSeparator` |
| Media | images and icons | `DSAspectRatio` · `DSIcon` · `DSImage` |
| Navigation | moving between places | `DSBreadcrumb` · `DSMenubar` · `DSNavigationMenu` · `DSPagination` · `DSTabs` · `DSLink` · `DSAnchor` |
| Overlays | interruption | `DSDialog` · `DSAlertDialog` · `DSDrawer` · `DSSheet` · `DSBackdrop` |
| Popovers | more, shown beside the block that asked for it | `DSContextMenu` · `DSDropdownMenu` · `DSHoverCard` · `DSPopover` · `DSTooltip` |
| Typography | text | `DSText` · `DSKbd` |
| Utility | blocks with a behaviour and little or no look: they format, gate, place or observe another block, stated by their behaviour and their feedback | `DSFormatCurrency` · `DSFormatDate` · `DSFormatDateTime` · `DSFormatNumber` · `DSFormatTime` · `DSAuthz` · `DSAnchorContainer` · `DSElementObserver` · `DSPortal` · `DSSticky` |

The library draws a sheet for each block of Utility whose behaviour a person feels: a sheet of states for `DSAuthz` (allowed, denied, fallback), `DSSticky` (in flow, stuck) and `DSAnchorContainer`, and one sheet of formats for the five formatters. `DSAnchor` of Navigation has a small sheet of states, and `DSAspectRatio` of Media has one sheet of ratios. `DSElementObserver` has an entry with its description and no states, and `DSPortal`, a block of the web alone, has no entry. The widgets, the container and the layout sit one layer up and each have a construct of their own: `architecture-widgets.md`, `architecture-containers.md`, `architecture-layouts.md`.

**A prop that takes a vocabulary is marked in the book's rows of props.** Beside the prop, the row names the vocabulary, as `type` (`DSTimePickerType`) of `DSTimePicker` or `format` (`SPDateFormatType`) of `DSDatePicker`. The values, and for the design system's own vocabularies the default, are in the tables of `architecture-names.md`. A shared vocabulary of the platform, one named `SP…Type`, is stated in the second of those tables. `variant`, `color` and `size` name no vocabulary in a row, because they take the three shared names and their vocabularies.

## The contract every component supports — 🔮

Every realization — the design library's drawing, and each stack's build — gives the same things, whichever block it is: its drawn choices as a property with the choice's own name (`variant`, `color`, `size`); its caller-set states as a property with the state's own name (`disabled`, `loading`); its content as a property named in the book; its behaviour in words, never a description; its permission gate, where the rule that decides stays in words and the denied state is drawn (`permissions`, `enablements`, `authzDenied` name that state); the four shared states it has as the one picture `architecture-names.md` chose; and the size, colour and frame it takes from above as a setting it reads rather than sets anew (`architecture-app.md`).

## A block drawn from data — 🔮

Some blocks are drawn from data: a select from its options, a menu from its nodes, a table from its columns. The **host** takes the data; the **item** is the unit the host draws once for each entry. A field that is drawn (such as `label`, `startIcon`) sits as a property of the item under its own name; the kind of a node sits in one property, `type`; a field that is not drawn (`key`, `data`, `anchor`, `permissions`) and the data shape as a whole stay in the book, in words. **One item serves every host that takes one data shape** — the three menus (dropdown menu, context menu, menubar) take one shape and draw one item; a host whose data differs declares its own item. The same node is drawn differently by where it sits: a group is a section at the top of a menu and a flyout deeper down.

## What a table's rows answer — 🔮

`DSTable` **MUST** take `hoverable`, a yes-or-no prop that is no by default. A table that is not `hoverable` draws no reaction in its body rows when the pointer rests on one; a table that is `hoverable` fills the body row under the pointer with the table's row-hover fill. A selected row **MUST** keep its selected fill, and a row that holds an open menu **MUST** keep its fill, whichever way `hoverable` is set: the prop decides only whether the pointer changes a row.

The reason is that a hover tells a person the row answers to them. A row that does nothing when it is pressed should not react, so a plain table stays still, and a table whose rows a person acts on turns `hoverable` on. `DSWDataTable` turns it on. `hoverable` is not a prop for the hover state: hover stays a shown state that the browser produces, and the prop states only whether this block answers to the pointer at all.

## The item line, the badge and the mark — 🔮

Three things show a record and its facts on most pages: a line for the record, a badge for a state, and a mark for a picture. Each has one form here. These are the blocks that carry the rules of content of `standards-core.md`.

### The item line

The item line, `DSItem`, shows one thing as a line. With `selected` it is the chosen one of its list, and a band stands behind it; a row of `DSList` takes `selected` the same way.

| Part of the item line | Holds | Its prop on `DSItem` |
| --- | --- | --- |
| A picture | a picture or an icon of the thing, at the start of the line | `media`, or `startIcon` for an icon alone |
| A title | the name of the thing | `title` |
| A description | one line about the thing, under its title | `description` |
| A line of facts | the short facts of the thing, under its title, with a dot between each two. A badge stands among them, before the other facts | `description`. The block has no prop of its own for the facts |
| Actions | the actions of the thing, at the end of the line | `actions` |

- **A page MUST give the parts of an item line to these props, and the block places them in one order** (`RD.SUPPORT.SURFACE.064`). A person then reads every line of every list the same way.
- **The line of facts MUST be written in the place the item line has under its title.** So `DSItem` takes no new part for it, and a badge needs no place of its own on the block.
- **Nothing but the actions MAY stand at the end of an item line.** A state at the end would look like something to press.
- **The header of a record and a line of a list MUST have the same shape: a picture, a title, a line under it, and actions.** A badge then stands in the same place on both. A person who has read a list can read the page of one record.

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

A mark is a picture or an icon that stands for a thing or a person: a person's picture, the brand of a provider, a channel.

- **A mark MUST be round, and an icon inside an action MUST keep the square of the control it sits in** (`RD.SUPPORT.SURFACE.067`). The two shapes tell a person which picture names a thing and which one is a control, before they read a word.
- **A filled mark is a thing that is set up, and an empty mark is a thing that is not set up yet.** So a row of marks shows where a setup stands with no count beside it.

### The two blocks of a field

A field has two blocks, one to enter a value and one to read it.

| The field | Its block | What the block draws |
| --- | --- | --- |
| A field a person enters | `DSForm.Field` | its title above its control, and one line under the control that holds its description, or its error in place of the description. The room of that line is kept where a field has neither |
| A field a person reads | `DSDataUnit` | its title above its value, with no box around the value. A value that is empty shows a dash |

- **A form holds each field a person enters in `DSForm.Field`, and a page shows each field a person reads in `DSDataUnit`.** Both keep the title above, as the rules of content ask (`RD.SUPPORT.SURFACE.060`, `RD.SUPPORT.SURFACE.061`). So a record that is read and the form that changes it have the same shape.
- **`DSDataFieldView` draws through `DSDataUnit`, and it needs the config of a data field.** So it fits a custom field, whose config the record already carries. A field with no such config is read through `DSDataUnit` itself.
- **Neither block places its neighbours.** The grid that readings stand in is the page's to write, as `architecture-containers.md` says of every gap between two blocks.

## Composing, never restyling — 🔮

A page composes these blocks, and never restyles a copy of one. A control that is missing is proposed to the design system, named and grouped here first. An overlay a block opens — a popover, a tooltip, a dropdown menu — is a private part of that block, shown by a switch such as `open`, and never a block a designer places on its own.

## Boundary

This ref states which components exist, in which group, and what every one must give. It stops at the edge of one block. It does not state what makes a block a widget, or what the container or the layout are — those are `architecture-widgets.md`, `architecture-containers.md` and `architecture-layouts.md`. It does not state how a prop is named or where a role or scale step comes from — those are `architecture-names.md` and `architecture-core.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.144` | a block drawn from data is declared as a host and an item, and one item serves every host that takes one data shape |
| `RD.SUPPORT.APPS.164` | an overlay is drawn as its surface alone, over a backdrop, sized to the instance, and never placed as a block of its own |
| `RD.SUPPORT.SURFACE.064` | the parts of the item line and their order, and the header of a record and a line of a list have one shape |
| `RD.SUPPORT.SURFACE.065` | a badge always shows its word, and its colour says a state and never a kind. Both are proposed |
| `RD.SUPPORT.SURFACE.066` | a value of an enum is shown by its name, and the order its icon is chosen in. The order is proposed |
| `RD.SUPPORT.SURFACE.067` | a mark is round, and an icon inside an action keeps its square |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
