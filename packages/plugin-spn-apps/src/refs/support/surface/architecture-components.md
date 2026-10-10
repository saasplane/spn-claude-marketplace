<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/06-architecture-components.md",
      "seen": "5247fc05"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/06-architecture-components/",
      "seen": "9c5a42e1"
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

## Composing, never restyling — 🔮

A page composes these blocks, and never restyles a copy of one. A control that is missing is proposed to the design system, named and grouped here first. An overlay a block opens — a popover, a tooltip, a dropdown menu — is a private part of that block, shown by a switch such as `open`, and never a block a designer places on its own.

## Boundary

This ref states which components exist, in which group, and what every one must give. It stops at the edge of one block. It does not state what makes a block a widget, or what the container or the layout are — those are `architecture-widgets.md`, `architecture-containers.md` and `architecture-layouts.md`. It does not state how a prop is named or where a role or scale step comes from — those are `architecture-names.md` and `architecture-core.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.144` | a block drawn from data is declared as a host and an item, and one item serves every host that takes one data shape |
| `RD.SUPPORT.APPS.164` | an overlay is drawn as its surface alone, over a backdrop, sized to the instance, and never placed as a block of its own |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
