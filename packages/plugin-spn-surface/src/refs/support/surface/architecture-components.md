<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/06-architecture-components.md",
      "seen": "13238159"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/06-architecture-components/",
      "seen": "c6becfaa"
    }
  ]
}
-->

# Components — The Blocks a Surface Is Built From

Source of truth: the foundation's Components construct (`docs/02-constructs/02-support/01-surface/06-architecture-components.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/06-architecture-components/`). Components is the sixth of thirteen Surface constructs.

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
| Mark | a picture or an icon that stands for a thing or a person. It is round unless a page chooses another shape |
| Choice table | what says which value each closed prop of a unit takes: its cases, a mapping where the data decides, the limits across a view, and an index of every value the code accepts, each ruled or never |
| Mock | a page or a flow drawn before it is built, as its skeletons: one for each page and each task state, and the flow file that orders them |
| Composite | a block built from components that carries one task end to end, and that no other component is built from |
| Core unit | a block the book names, which every stack builds under that name. A stack may provide further units of its own |

An **item line** is not the Item of a host. A host may draw an item line for each entry, and an item line also stands alone, for one thing shown by itself.

A **block** is any unit a surface is built from — a layout, a container, a widget or a component (`standards-core.md`). The component is the smallest of the four.

## The groups — 🔮

Twelve groups, each answering one need of a surface. The list holds the core units: the library draws one page per group, each provider keeps one folder per group, the showcase opens each group of units with an Overview page, and a new core unit joins this list before it is drawn or built anywhere. A stack may provide further units of its own beside them, and this list names none of those.

| Group | Answers | Blocks |
| --- | --- | --- |
| Actions | the ways a person asks for something | `DSButton` · `DSButtonGroup` · `DSToolbar` |
| Data display | how records and values are shown | `DSAccordion` · `DSAccordionGroup` · `DSAddressView` · `DSAvatar` · `DSAvatarGroup` · `DSBadge` · `DSCard` · `DSCarousel` · `DSCodeBlockView` · `DSColorView` · `DSDataFieldView` · `DSDataUnit` · `DSItem` · `DSItemCard` · `DSItemFacts` · `DSJSONView` · `DSList` · `DSTable` |
| Data entry · Fields | every input a form is built from | `DSInput` · `DSInputNumber` · `DSInputOTP` · `DSInputPhone` · `DSTextarea` · `DSLabel` · `DSCheckbox` · `DSCheckboxGroup` · `DSRadio` · `DSRadioGroup` · `DSSwitch` · `DSToggle` · `DSToggleGroup` · `DSToggleGroupMulti` · `DSSlider` · `DSSliderRange` · `DSTagGroup` |
| Data entry · Pickers | choosing from a set, a date or a time | `DSSelect` · `DSSelectMulti` · `DSAutocomplete` · `DSAutocompleteMulti` · `DSCommand` · `DSCommandPalette` · `DSDatePicker` · `DSDateRangePicker` · `DSTimePicker` · `DSDateTimePicker` · `DSCalendar` · `DSColorPicker` |
| Data entry · Compound fields | the form frame, and inputs built from other inputs | `DSForm` · `DSAddressForm` · `DSAttachment` · `DSAttachmentMulti` · `DSJSONControl` · `DSDataFieldForm` · `DSDataFieldBuilder` · `DSImagePicker` |
| Composites | blocks built from components that carry one task end to end and that no other component is built from | `DSDataTable` · `DSFilterBar` · `DSComparison` · `DSFeature` |
| Feedback | what a surface says while it works, and when it fails | `DSAlert` · `DSSpinner` · `DSToast` · `DSProgress` · `DSProgressCircle` · `DSSkeleton` · `DSEmpty` |
| Structure | the small blocks that divide, scroll or fold a part of a page, or stand it on a fill | `DSCollapsible` · `DSHScroll` · `DSScrollArea` · `DSSeparator` · `DSSurface` |
| Media | images and icons | `DSAspectRatio` · `DSIcon` · `DSMark` · `DSImage` |
| Navigation | moving between places | `DSBreadcrumb` · `DSMenubar` · `DSNavList` · `DSNavMenu` · `DSNavBarSide` · `DSNavBarTop` · `DSNavEntry` · `DSPagination` · `DSTabs` · `DSStepper` · `DSLink` · `DSAnchor` |
| Overlays | interruption | `DSDialog` · `DSConfirmDialog` · `DSDrawer` · `DSSheet` · `DSBackdrop` |
| Popovers | more, shown beside the block that asked for it | `DSContextMenu` · `DSDropdownMenu` · `DSHoverCard` · `DSPopover` · `DSConfirmPopover` · `DSTooltip` |
| Typography | text | `DSText` · `DSKbd` |
| Utility | blocks with a behaviour and little or no look: they format, gate, place or observe another block, stated by their behaviour and their feedback | `DSFormatCurrency` · `DSFormatDate` · `DSFormatDateTime` · `DSFormatNumber` · `DSFormatTime` · `DSAuthz` · `DSAnchorContainer` · `DSElementObserver` · `DSEmbed` · `DSSticky` |

A designer reads a block in the design library, so each table of the book also says what the library draws of it, in the column *The library draws*. A block outside a table carries the same words in one line under its heading. The column names, in this order, what the block's set crosses; what it draws once; its modes; its texts and its swaps; and last its usage, its primary use with the blocks it stands with. A prop the column does not name is the stack's behaviour, and the library never draws it.

The library draws a sheet for each block of Utility whose behaviour a person feels: a sheet of states for `DSAuthz` (allowed, denied, fallback), `DSSticky` (in flow, stuck) and `DSAnchorContainer`, and one sheet of formats for the formatters. `DSAnchor` of Navigation has a small sheet of states, and `DSAspectRatio` of Media has one sheet of ratios. `DSElementObserver` has an entry with its description and no states. `DSPortal`, a block of the web alone, is the stack's own: the book does not list it and the library does not draw it. The composites are stated under Composites below. The widget, the container and the layout sit one layer up and each have a construct of their own: `architecture-widgets.md`, `architecture-containers.md`, `architecture-layouts.md`.

**A prop that takes a vocabulary is marked in the book's rows of props.** Beside the prop, the row names the vocabulary, as `type` (`DSTimePickerType`) of `DSTimePicker` or `format` (`SPDateFormatType`) of `DSDatePicker`. The values, and for the design system's own vocabularies the default, are in the tables of `architecture-names.md`. A shared vocabulary of the platform, one named `SP…Type`, is stated in the second of those tables. `variant`, `color` and `size` name no vocabulary in a row, because they take the three shared names and their vocabularies.

## The core units, and a stack's own — 🔮

The surface has two levels (`RULE.SUPPORT.SURFACE.081`). The word core unit does not mean the layer Core, which holds the tokens: a core unit sits in any layer from components to layouts.

| Level | Holds | Who states it |
| --- | --- | --- |
| The core | the units the book names, with their props, their vocabularies and their rules; the task patterns; the app patterns and their skeletons | the book, once, for every stack |
| A stack's own | further units that help build apps on that stack, most of them put together from core units | the stack, in its own docs |

- **A stack's design system MUST build every core unit, and it MAY provide further units of its own that help build apps.** Such a unit is usually put together from core units, for a need that many pages of that stack share.
- **The foundation does not drive a stack's own unit, and the book does not name it.** So the list of groups holds none. The stack states it in its own docs, with its props and its rules.
- **A stack's own unit MUST keep every rule a core unit keeps.** It reads the same tokens, takes the three shared names where it has them, and draws each shared state with its one picture.
- **A unit that every stack should build joins the core units, in the book first.** A unit that stays with one stack needs no line there.

So an agent that builds a page reads its pattern and its skeleton from the book. It then picks the units from the stack's design system, the core units and the stack's own, or from a partner's own code.

### A new unit weighs every axis the surface offers

The surface already answers most of what a new unit must decide: how dense it is, where on a page it stands, which hue it wears, how strongly it is filled, which way it runs, which device it is drawn for, where its task stands, and how large its words are. A unit designed from the need in front of it alone misses some of these, and each miss shows only when it stands beside one that took it. Most units take only some of the axes: a select runs one way, and a tooltip has no task of its own. What the rule asks is that each axis was weighed, and the answer written down.

- **A new unit MUST name each shared axis of the surface it takes, and give a reason for each it leaves out, and its preview MUST show that table before the unit is approved** (`RULE.SUPPORT.SURFACE.316`). This holds for a core unit, for a stack's own unit and for a unit in a partner's own code. An axis the unit takes uses the shared name and vocabulary, never a prop of its own for the same thing. A reason names what the unit is for, such as *"a value has no place on a page of its own, so it takes the level of the row it stands in"*; *"not needed"* is no reason.

  | Axis | The prop or the source | Take it where |
  | --- | --- | --- |
  | Density | `size`, `DSSizeType` | the unit holds a control, a row or a mark that stands beside another unit's |
  | Place on a page | `pageLevel`, `DSPageLevelType` | the unit's size or look should change between a page, a panel, a card and a row, as the tabs' and the stepper's do |
  | Hue | `color`, `DSColorType` | the unit draws a brand or a status colour |
  | Strength | `variant`, the shared surface treatment | the unit draws a fill, a line or a tint |
  | Direction | `orientation`, `DSOrientationType` | the unit lays its items in a run that could stand across or down |
  | Device | the device from the context it is drawn in | the unit's layout changes on a phone; it never measures a width of its own |
  | Task state | `DSTaskStateType`, or the states of the block's data | the unit is drawn from data, or shows where a task stands |
  | The words of each part | the type step its `size` or `pageLevel` gives | the unit has a title, a label or a description; each part's step follows the unit's size or level, never a fixed step |

## A unit's choice table — 🔮

A unit's props, what the library draws of it and its usage say what the unit can do. They never say which value a page writes, or when: a badge offers seven variants and seven colours, and a page that meets it with no reason picks by guessing. **So a unit with a closed prop has a choice table, which gives every value of each closed prop its cases** (`RULE.SUPPORT.SURFACE.375`). A value is chosen from two facts at once, what the value is and where it stands, and those two facts set the variant, the colour and the size together. So a table never gives one prop alone.

The table is a guide. A case says where a value fits and who writes it, and a page starts from the first case that matches; no value is ruled out, and a partner's own choice stands (`RULE.SUPPORT.SURFACE.394`).

| Form | What it holds | The badge's, for example |
| --- | --- | --- |
| **Cases** | a meaning and a place, which give every closed prop at once, who writes each (the page, the place, the level or the unit), and the rule the case rests on. They are read from the top, and the first that matches wins | a state among the facts of a row: `SUBTLE_OUTLINE` from the level, the hue from the mapping, `XS` |
| **A mapping** | one table from the data to a value, where the data decides | a state to its hue |
| **Limits across a view** | what holds across every unit of one view, which no single case can say | at most one `SOLID` button in a view |
| **An index by value** | every value the code accepts for each closed prop, with its cases. It is produced from the cases | `GHOST` on a badge: no case written yet; a word with no fill is a fact in words |

- **A unit with a closed prop MUST have a choice table beside its rules, here or in `architecture-widgets.md`, and the table MUST give every value the code accepts for each closed prop its cases** (`RULE.SUPPORT.SURFACE.375`). A closed prop is one whose values the code holds as one closed list, and also a closed field of a config only that unit takes, such as `settings.size` of `DSDataTable`. A prop whose value belongs to the record, such as a currency's code, gets one row of the index and no column of the cases.
- **A unit whose every closed prop follows its place MUST have no table of its own, and MUST stand in the list below**, *Their size from the place, a field's check from its DSForm.Field*. Its `size` is the size of the place it stands in, and a field's `validationType` is the one its `DSForm.Field` sets from the field's check.
- **The cases are read from the top, and the first that matches wins.** Each case gives every closed prop at once. Its column *The page writes* names what the page writes; any prop the page does not write comes from the place, the level or the unit, and the cell says which.
- **Each case MUST name, in its last column, *Rule*, the decision it rests on**: the register row that already holds it, or else *this table*, which means the table states the ruling itself and no register row is added.
- **A value is settled in one order: the page's own, else the place's, else the level's, else the unit's default.** A value the case leaves to the place or the level is not written by hand.
- **A case that takes its value from the mapping says so**, and **a limit holds across a view**, where no single case can say it.
- **The index lists every member of each closed vocabulary with its cases: where it fits and who writes it.** A value the place draws itself has that as its case. A value the code ignores says so. A value with no case yet says so too, and that is a gap in the book, never a ban. A prop the library cannot draw, such as `authzDenied` where the column draws none, is marked *not drawn*. `apps surface gaps` reports a member of a closed vocabulary that the index does not list.
- **A case of a choice table is a case of the design library: the unit with its props set, named for what it shows.** One word for one thing, so the table is where a unit's usage and its cases come from. A unit's usage, the last part of the column *The library draws*, MUST be the first case of its table that draws the unit, and the table's cases are among the cases the library draws. `apps surface construct` carries the usage, the cases and the index into the CONSTRUCT snapshot the library is drawn from, and this plugin carries a copy of that snapshot (`delivery-library.md`). `spn-surface unit show <Unit>` prints one unit from it.
- **A container and a pattern have no choice table.** Each is chosen from facts about the page, the person's intent, the part of the pattern and the device, and `standards-patterns.md` and `architecture-containers.md` state them keyed by those facts. A block is chosen last (`RULE.SUPPORT.SURFACE.052`), so a choice table never decides which block stands where: it gives the props of a block once the page has placed it.
- **A unit the book does not name has no choice table either.** Such a unit is a stack's own, a module's or a partner's. Its props and their descriptions in the symbol index carry its use; a description says what the prop and each value are for, and never restates a rule of this ref. A unit built from a core block leaves to that block's table everything its own data does not decide.
- **A mock is a skeleton, and it names units and never their props.** A designer's mock of a page or a flow is drawn as the skeleton the docs draw: one for each page, a view for each task state, and a flow file that lists the pages in order (`standards-patterns.md`, *The specs a screen starts from*). It shows where each block stands and which unit it is, and the choice table gives that unit its props when the page is built.

Every core unit with a closed prop has its table in this ref, under its unit where the ref gives the unit a section of its own, and otherwise in *The choice tables of the other units* below; `DSCardWidget`'s is in `architecture-widgets.md`.

### Their size from the place, a field's check from its DSForm.Field

| Group | The units |
| --- | --- |
| Data entry · Compound fields | `DSForm` · `DSDataFieldForm` · `DSAddressForm` · `DSAttachment` · `DSAttachmentMulti` |
| Data display | `DSList` · `DSDataUnit` · `DSDataFieldView` · `DSTable` |
| Feedback | `DSEmpty` |
| Data entry · Fields | `DSInputNumber` · `DSSwitch` · `DSTextarea` · `DSInputPhone` · `DSCheckbox` · `DSCheckboxGroup` · `DSLabel` · `DSSlider` · `DSSliderRange` · `DSTagGroup` |
| Data entry · Pickers | `DSSelect` · `DSAutocomplete` · `DSSelectMulti` · `DSAutocompleteMulti` · `DSColorPicker` · `DSCommand` · `DSCommandPalette` |
| Navigation | `DSPagination` · `DSNavList` · `DSNavMenu` · `DSNavBarTop` · `DSNavEntry` |
| Composites | `DSComparison` · `DSFilterBar` |
| Typography | `DSKbd` |

## The contract every component supports — 🔮

Every realization — the design library's drawing, and each stack's build — gives the same things, whichever block it is: its drawn choices as a property with the choice's own name (`variant`, `color`, `size`); its caller-set states as a property with the state's own name (`disabled`, `loading`); its content as a property named in the book; its behaviour in words, never a description; its permission gate, where the rule that decides stays in words and the denied state is drawn (`permissions`, `enablements`, `authzDenied` name that state); the four shared states it has as the one picture `architecture-names.md` chose; and the size, colour and frame it takes from above as a setting it reads rather than sets anew (`architecture-app.md`).

## A block drawn from data — 🔮

Some blocks are drawn from data: a select from its options, a menu from its nodes, a table from its columns. The **host** takes the data; the **item** is the unit the host draws once for each entry. A field that is drawn (such as `label`, `startIcon`) sits as a property of the item under its own name; the kind of a node sits in one property, `type`; a field that is not drawn (`key`, `data`, `anchor`, `permissions`) and the data shape as a whole stay in the book, in words. **One item serves every host that takes one data shape** — the three menus (dropdown menu, context menu, menubar) take one shape and draw one item; a host whose data differs declares its own item. The same node is drawn differently by where it sits: a group is a section at the top of a menu and a flyout deeper down.

## What a table's rows answer — 🔮

`DSTable` **MUST** take `hoverable`, a yes-or-no prop. A table that is not `hoverable` draws no reaction in its body rows when the pointer rests on one; a table that is `hoverable` fills the body row under the pointer with the table's row-hover fill. A selected row **MUST** keep its selected fill, and a row that holds an open menu **MUST** keep its fill, whichever way `hoverable` is set: the prop decides only whether the pointer changes a row.

The reason is that a hover tells a person the row answers to them. A row that does nothing when it is pressed should not react, so a plain table stays still, and a table whose rows a person acts on turns `hoverable` on. A theme that turns it on does so for every table of the app. `DSDataTableWidget` turns it on. `hoverable` is not a prop for the hover state: hover stays a shown state that the browser produces, and the prop states only whether this block answers to the pointer at all.

- **`DSTable` MUST decide `striped` and `hoverable` in one order: its own prop where the prop is given, else the value of the theme** (`RULE.SUPPORT.SURFACE.126`). A prop that says no is given, so a table that says no to `striped` draws no stripes under a theme that says yes. The default theme draws stripes and no hover, and the table keeps no value of its own for an unset theme. The theme holds the two values in its block `table` (`architecture-app.md`).
- **A row of the body of `DSTable` MAY be marked as the row in view, with `selected`** (`RULE.SUPPORT.SURFACE.125`). It is the row of the record that the page shows beside the table or under it, such as the order whose detail is open. `selected` is a yes-or-no prop of the row that is no by default. The row in view **MUST** draw the band that a chosen row of a list draws, and it **MUST** carry `aria-current="true"`. It takes no hover fill while it is in view.
- **The row in view and a row that a person ticks MUST NOT share a name or a look.** A person ticks rows to act on many of them at once, and those are the checked records of a data table. One row is in view because its record is open, and it is the `selected` row. A row may be both, and then it shows both.
- **A cell of the head of a table MAY state the width and the least width of its column.**

## What a list's rows carry — 🔮

`DSList` **MUST** take `hoverable`, with the meaning it has on `DSTable` (`RULE.SUPPORT.SURFACE.097`). It is a yes-or-no prop that is no by default. A list that is `hoverable` fills the row under the pointer, also where the row is no link. A row that is chosen keeps its fill.

- **In a list the row MUST carry the link, the chosen fill and the reaction to the pointer, and an item line inside it MUST carry none of them.** The row is the whole width, with what stands at its start and at its end, so its fill covers all of it. An item line that stands alone, in a card or a header, carries its own link.
- **`selected` is the row's, and `DSItem` takes none.** A thing is chosen within a set, and the set is the list. So the row of a list, `DSList.Item`, takes `anchor`, `endNode`, `selected`, `showArrow` and `endIconMotion` (`DSIconMotionType`).
- **A chosen row of a list MUST be drawn as a fill.** A row with `selected` fills its whole width with the subtle tint of primary, and it carries `aria-current="true"`. It takes no hover fill while it is chosen, and it draws no check. The check at the end of a row is the picture of a chosen option of a select or of a menu.
- **Anything set one under another is a `DSList`** (`DEC.SUPPORT.SURFACE.288`, advice). Links, contacts, rows, facts and the entries of a column are each a `DSList` of `DSList.Item`, not a hand-written vertical flex or a stack of elements spaced by a gap. A `flush` list with no `divided` and no padding is the plain stack. The parts of a section are placed by the unit that draws them, such as `DSFeature`, and are not a list.
- **`DSList` MAY take a `title`, and it MUST start where the words of the rows start** (`RULE.SUPPORT.SURFACE.283`). The title is an `IDSText` one title step above the list's `size` (`XS` `TITLE_SM`, `SM` `TITLE_MD`, `MD` `TITLE_LG`, `LG` and `XL` `TITLE_XL`) and in semibold (`RULE.SUPPORT.SURFACE.292`), inside the rows' side inset, so title and rows share one left edge; a page puts no title beside a list to name it. `flush` takes away the side inset of a row and nothing else, and every row keeps its height. A row of a `flush` list that reacts, with an `anchor` or in a `hoverable` list, draws no hover fill: its words and icons step from the quiet tone to the body tone under the pointer, on focus and when chosen, and the focus ring stays (`RULE.SUPPORT.SURFACE.292`).
- **A list of links MUST hold a `DSLink` in each row, and a `DSLink` MUST tell itself from its words by place** (`RULE.SUPPORT.SURFACE.294`). In a line of words it keeps its underline on hover (WCAG 1.4.1). A neutral `DSLink` alone in a `DSList` row is a link by its place, so it brightens to the body tone on hover and focus and draws no underline. A coloured link, and one with an `underline` of its own, keep their look.
- **A row of a list MUST hold one of three things: plain words, a line of facts, or an item line** (`RULE.SUPPORT.SURFACE.132`). A row that is one line of facts holds the unit `DSItemFacts`, which takes `facts` and `pageLevel` and draws the facts as the item line draws its own. A row with a title and a description or facts under it holds a `DSItem`. A row of a list takes no `facts` of its own.
- **`anchor` and `showArrow` stand on both blocks**, because the link and the arrow that says it leads somewhere go together: on the row in a list, and on the item line where it stands alone.
- **The arrow of `showArrow` is off unless a page writes it, and the design system works out no value from the row.** It stands after everything else at the end of the row. **It MUST be a chevron with no button box, in the muted text colour of the surface it stands on, and it MUST be no control.** It is drawn at the icon size of an icon-only button of the size of the row, so its end edge sits on the content edge of the row, as the picture's start edge sits on its start. Its colour is the one a fact takes, so it reads on a row of any colour. The arrow takes no focus and no press of its own, and it is hidden from a screen reader. The link of the row covers it.
- **An action at the end of a row that is a link MUST NOT follow the link** (`RULE.SUPPORT.SURFACE.110`). A press on the action does the action and nothing else, and a press anywhere else on the row follows the link. The row and the list hold this, so a page writes no guard for it.

## What single blocks answer — 🔮

Each rule below is of one block or one prop. The props, their values and their defaults are in `architecture-names.md`.

| Block | Its rule |
| --- | --- |
| `DSButton` | **A button that shows an icon and no label MUST show its label as a tooltip.** The words are those of its `ariaLabel`, shown when the pointer rests on the button and when the keyboard reaches it. A button with a visible label shows none, and a disabled button shows none. `tooltip` takes other words for it, or `false` for none. **An icon-only button that opens a menu MUST keep its tooltip while the pointer rests on it** (`RULE.SUPPORT.SURFACE.144`), and the tooltip is gone once the menu is open |
| `DSToolbar` | **A row of controls, and never a menu.** Its parts are `DSToolbar.Item`, `DSToolbar.Group` and `DSToolbar.Separator`. An item is drawn as a `DSButton` at the size of the toolbar. The arrow keys move between the items, so the whole toolbar is one stop for the Tab key. `bordered` draws the frame around the row, and a toolbar inside another surface turns it off |
| `DSTable` | **A cell, head or data, MAY take `verticalAlignment`** (`RULE.SUPPORT.SURFACE.177`). It says where the content sits when the row is taller than it: `TOP`, `CENTER` or `BOTTOM` (`DSVerticalAlignType`). Left out, the content sits in the middle. A cell takes no class for it |
| `DSTable` | **A data cell MAY be `marked`.** A marked cell is the one that stands out in its row, such as the name of a record. Its text is drawn in the medium weight and the default text colour. No cell is marked by default |
| `DSList` | **A list takes its columns and its lines as one `grid`, an `IDSGrid`** (`RULE.SUPPORT.SURFACE.271`): the columns at each screen class and `borderType`, `NONE` where left out, `GRID` for a line between the cells and none around the outside, `EDGE` for the lines between them and one around the outside, rounded with the theme's corners. **A list of several columns with no lines draws its own gap** (`RULE.SUPPORT.SURFACE.177`): wide between the columns and narrow between the rows. A list of one column draws none. A list with lines stands its rows in a grid with no gap, at one column too: each cell draws its own line at its end and its bottom, in the grid's line colour, so a short last row keeps its lines, and a row's hover and chosen fill reach its lines and stop there. A row of such a list fills its cell, which the tallest row of its line sets, so its hover and chosen fill reach the cell's edges, and its content stands at the top (025 N023 row 42) |
| `DSTable`, `DSList` | **A fixed ordered set MAY reorder, through `reorder`** (`RULE.SUPPORT.SURFACE.182`). `reorder` is `IDSReorder`, with one function, `onReorder`, which takes a move: the `id` of the row, its `toIndex` and the full order `ids`. A row of the table body or an item of the list takes `reorderId`. A row with a `reorderId` in a block with `reorder` draws a handle, in a first cell of its own in a table (the head row has an empty cell for it) and at the start of the item in a list. A person moves it by dragging the handle, or with Alt and the up or down arrow on the focused handle, one place; a polite live region says the new place, a line at the drop place in the focus colour shows where the row lands, and Escape cancels. A row with no `reorderId` has no handle and does not move. The block calls `onReorder` once for a move, shows the new order at once and keeps no order of its own: the page holds the order and draws its rows in it, and when `onReorder` answers `false` or fails the block shows the order it had before. The drag is the browser's own. It is for a set whose order is the meaning and that is small enough to show whole; `DSDataTableWidget`, ordered by its viewer's sort, never takes it |
| `DSCard` | **A card MAY hold the parts `DSCard.Header`, `DSCard.Content` and `DSCard.Footer`.** A part pads itself, from the size of the card. Each part takes `flush`, which drops that padding so that what the part holds reaches the edge of the card, and no other prop. The title of a card is an item line in its header, and it starts where what the card holds starts. `divided` draws a line between each two parts, from edge to edge. It is a prop of the card that the page writes, and it is no by default. A card takes each key of its `surface` from its own prop where the prop is given, else from the card look of the theme, and the parts its frame holds from its `frames` (`architecture-app.md`). A pressed card is pressed whole, its flat header with it. A part not listed in `frames` stands flat outside the frame, half the card's gap from the frame beside it (`RULE.SUPPORT.SURFACE.262`). **A panel or a card that holds parts, or more than one content part, has a title:** an item line in its header, at the level its box gives, `CONTAINER` for a panel and `WIDGET` for a card. A card that is one plain block of content needs none. A card takes no height of its own (`RULE.SUPPORT.SURFACE.270`): in a block it is as tall as what it holds, and in a grid or a row every card stands as tall as the tallest, so the cards of one row end on one line. `fullHeight` makes the card fill the height of a place with a set height. A content part of a card is never shorter than what it holds, and only the last content part grows to fill the card, so the footer stands at the end. What then tells a card from a panel is in `architecture-containers.md` |
| `DSItem` | **A `DSItem` draws its picture, its text and its end node, and nothing around them** (`RULE.SUPPORT.SURFACE.175`). It takes no padding, no border and no fill under the pointer, at any level and at any size, and no `bleed`. Its `anchor` stays: one link that covers the item, with its end node outside the link and a focus ring. The place it stands in gives it its room and its highlight. A row of `DSList.Item` pads by its size and lights up under the pointer where the row or the item it holds is a link. A row in a `flush` part keeps the padding of its size above and below and takes the inset of its place at its two sides, so its text lines up with a title in a part that insets and its band runs from edge to edge. A data table's list, a card widget's rows, the header and the parts of a panel and of a card, the header of an overlay and the trigger of a menu that wraps an item line give that room the same way |
| `DSColorView` | **Shows a stored colour that a person reads:** a small swatch, and the value beside it as text. With no colour it shows a dash, or the words of `emptyLabel`. `swatchOnly` draws the swatch alone. A colour that is part of a block's own look, such as a badge drawn in its colour, is not shown through this block |
| `DSCarousel` | **A carousel MUST mark every slide that is not in view `inert` and `aria-hidden`** (`RULE.SUPPORT.SURFACE.311`). It is the standard carousel pattern. A slide out of view can then be neither reached by the keyboard nor read by a screen reader, and a carousel that shows several slides keeps all of them readable, so a carousel of features adds no `h1` for each slide to the page |
| `DSTagGroup` | **A set of tags a person removes from.** Each tag is drawn as a `DSBadge` with its close action, and the keyboard reaches each one. The page holds the set: it adds a tag elsewhere, and takes the tag out when the group reports that one was removed. A choice from a fixed set is `DSToggleGroupMulti`, and not this block |
| `DSToggle` · `DSToggleGroup` · `DSToggleGroupMulti` | **A pressed toggle MUST keep its border in every colour, and a pressed toggle of the default hue MUST take a fill a person can see** (`RULE.SUPPORT.SURFACE.146`). A pressed toggle draws `QUIET` of its hue. So the pressed option of a group keeps its edge beside the others. Of the default hue, the pressed fill is `surface-soft-hover`, one step stronger than the fill under the pointer, with the strong border |
| `DSCalendar` | **The month grid by itself, on the page.** It is the grid that `DSDatePicker` opens, with no field and no popover around it. Its value is one date, or none |
| `DSColorPicker` | **A swatch that opens the colour picker of the device, with the colour's code beside it.** `showValue` shows the code in a field, and a person may type the code there in place of picking. **It MUST write and show a hex code in capitals, such as `#1A365D`,** whether typed or picked. A code stored in small letters is shown in capitals and left as stored until a person changes the colour. **A typed colour MUST be a hex code of six digits with its `#`,** in either case, taken when the person presses Enter or leaves the field. A text that is no such code leaves the colour as it was, and the field shows its error state. **It MAY hold no colour:** the swatch then has a dashed edge and no fill, and `clearable` offers an action that empties it |
| `DSProgressCircle` | **Progress as a ring.** The ring fills to `value` out of `max`, and `showValue` writes the value inside it. With `indeterminate` the ring turns and reads no value. It is a block of its own beside `DSProgress`: the bar and the ring share no picture |
| `DSTabs` | **A tab that has an address MUST be a link.** A person can then open it in a new browser tab or copy its address. A plain press still opens the tab in its row. A tab with no address stays a control that opens its panel. **The page level of the tabs MUST decide their size, and their look where the page names no `type`** (`RULE.SUPPORT.SURFACE.113`, `RULE.SUPPORT.SURFACE.209`): `DSTabs` takes `pageLevel`, with the level of its box when unset, and a page chooses no look for them: `PAGE` draws `PILL` (`RULE.SUPPORT.SURFACE.224`). A website's pages name `type` `PILL` at any level. "The tabs by level" below states each look |
| `DSPagination` | **The pager MUST arrange itself by the width of its own place, and not by the width of the window** (`RULE.SUPPORT.SURFACE.133`). A pager stands in the footer of a full page and in a narrow column of a wide window, and the device type is the same in both. With no choice of records on a page, the page controls stand in the middle. With the choice, the choice stands at the start and the page controls at the end. The choice is labelled *Records*. In a narrow place the choice is not drawn, and the page controls stand alone in the middle. A page offers no choice where the number of records is decided already, such as a data table at the side of a detail |
| `DSFormatDate` · `DSFormatDateTime` | **A line that says when something happened MAY show how long ago it was, through `type`** (`RULE.SUPPORT.SURFACE.122`). `type` takes `DSFormatDateType`: `DEFAULT`, the date as it is written, and `AGO`, how long ago in words, such as *yesterday* or *2 days ago*, in the app's language and in the largest whole unit. Such a line says roughly when a thing last changed: a version, a record in a list, a comment. `AGO` stays how long ago however old the moment is. On `DSFormatDate` it counts days of the calendar and never shows a unit under a day. **The exact date and time MUST be reachable from it:** it is the tooltip of the words, and it is in their accessible name. **Where a page is a log of what happened, each line shows the date and the time, and not how long ago:** an audit log, a log of the notifications sent, the runs of a scheduled job, a list of sign-ins |
| `DSFormatTime` · `DSFormatDateTime` · a picker of a time | **A block that shows or takes a time MUST use the format the page gives it, else the app's, and it MUST hold no time format of its own** (`RULE.SUPPORT.SURFACE.123`). The app context always holds a time format. A picker of a time with no clock of its own reads in the clock of that format |

- **A block on a fill is `DSSurface`, and what draws a fill gives its surface** (`RULE.SUPPORT.SURFACE.199`). `DSSurface` takes `color`, `strength` and `painted`, draws the fill and nothing else, and what it holds reads the fill, the main action included. `useDSSurface` reads the surface for a choice, never to paint; a popover, a menu, a hover card, the body of an overlay and a tooltip give the page's surface again.
- **A card or a panel frame that draws its own fill inside a coloured surface is a surface of its own** (`RULE.SUPPORT.SURFACE.199`). It writes `data-surface-color` and `ds-shell` with its colour, or with `BASE` where it has none, so its text and its main action are its own; on the page's own surface a `BASE` block writes nothing.
- **A row that scrolls sideways is `DSHScroll`, and its arrows stand on the ground the row stands on** (`RULE.SUPPORT.SURFACE.204`). With `arrow`, each edge that hides more of the row shows a round arrow button one scale step below the row's `size`, on a fade 40 to 72 px wide, and a press moves the row by four fifths of its width. `arrowType` is `DEFAULT`, the fade from the fill of the page or of the surface the row is on (a band of the brand included), or `OVERLAY`, the scrim, for a row over a picture, the arrow then glass. An arrow fades out at the end it has reached, and a coarse pointer shows none. `DSTabs` turns `arrow` on and passes its size.

### The button, and its choice table

- **A view holds at most one `SOLID` button, its main action** (`RULE.SUPPORT.SURFACE.370`, advice). Every other button is `OUTLINE`, or `GHOST` where it stands at the end of a row or in a toolbar, or is an icon alone. A view is what a person sees as one task: a page, a dialog, a drawer, a sheet or a step, and a dialog over a page is a view of its own that holds its own. A main action that deletes or ends something is `SOLID` `ERROR`, and a view with no main action holds no `SOLID`. On a site's page the closing call says the hero's one act again at the page's end, so its `SOLID` and the hero's are one main action said twice, not on screen together (`site-patterns.md`, *Closing call*). One filled button tells a person where to go next; two make them guess. A feature's buttons are this rule's case for a feature, under `DSFeature` below.
- **A button with no `variant` MUST draw `OUTLINE` outside a header or a footer** (`RULE.SUPPORT.SURFACE.376`). In a header or a footer the place gives the look, as `architecture-containers.md` states. So the default keeps the rule above by itself: a page writes `SOLID` once, on the view's main action, and leaves every other button bare.
- **A page's button is `SOLID`, `OUTLINE`, `GHOST` or `LINK`, and the tints `QUIET`, `SUBTLE` and `SUBTLE_OUTLINE` are the place's** (`RULE.SUPPORT.SURFACE.379`, advice). A header draws its main action in the look of its level; a tint a page writes on a button is a case not written yet.
- **A button's colour says what its act does: `PRIMARY` the main action, `ERROR` a main action that deletes or ends something, and `DEFAULT` every other** (`RULE.SUPPORT.SURFACE.384`, advice). `INFO`, `SUCCESS` and `WARNING` say a state, and a button is an act, so no case for them is written yet. `CUSTOM` draws `DEFAULT`, because a button takes no `customColor`.

#### The choice table of `DSButton`

A button is chosen by its view, then by whether it is the view's main action, then by where it stands. A view is a page, a dialog, a drawer, a sheet or a step. "The place's" is the look and the size the header or the footer gives, as the container states; "the size above" is the size of the place the button stands in.

**The cases**, read from the top; the first that matches wins.

| The view | The action is | Where it stands | `variant` | `color` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| any view | the main action, which neither deletes nor ends anything | the content of the view, outside a feature, or in no box | `SOLID` | `PRIMARY` | the size above | the variant and the colour | `RULE.SUPPORT.SURFACE.370` |
| any view | the main action, which neither deletes nor ends anything | a footer | `SOLID` (the place's) | `PRIMARY` | the place's: the size of the box | the colour | `RULE.SUPPORT.SURFACE.370` |
| any view | the main action, which neither deletes nor ends anything | a header | the place's: the look of the header's level | `PRIMARY` | the place's: a step from the box's size, by its level | the colour | `RULE.SUPPORT.SURFACE.390` |
| any view | the main action, which deletes or ends something | anywhere | `SOLID` | `ERROR` | the place's, else the size above | the variant and the colour | `RULE.SUPPORT.SURFACE.370` |
| any view | an action of a feature | a feature | by the feature's level, from its table: one `SOLID` at `PAGE`, then `OUTLINE`, `GHOST` and `LINK` down the levels | `PRIMARY` on the one `SOLID`, else `DEFAULT` | the level's: `LG` at `PAGE` and `CONTAINER`, `MD` at `WIDGET`, `SM` at `GROUP` | the feature's `actions`, as data | `RULE.SUPPORT.SURFACE.234` |
| any view | an icon alone | the head of a page | `OUTLINE` (the place's) | `DEFAULT` | the place's | the icon and `ariaLabel` | this table |
| any view | an icon alone | any other header, or a footer | `GHOST` (the place's) | `DEFAULT` | the place's | the icon and `ariaLabel` | this table |
| any view | an icon alone | the end of a row, a toolbar, or the content | `GHOST` | `DEFAULT` | the place's, else the size above | the variant, the icon and `ariaLabel` | `RULE.SUPPORT.SURFACE.370` |
| any view | another action | the end of a row, or a toolbar | `GHOST` | `DEFAULT` | the place's, else the size above | the variant | `RULE.SUPPORT.SURFACE.370` |
| any view | another action | a header or a footer | `OUTLINE` (the place's) | `DEFAULT` | the place's | nothing | `RULE.SUPPORT.SURFACE.376` |
| any view | another action | the content, or no box | `OUTLINE` (the unit's) | `DEFAULT` | the size above | nothing | `RULE.SUPPORT.SURFACE.376` |

**The limits across a view.** A view holds at most one `SOLID` button, its main action, and a view with no main action holds none (`RULE.SUPPORT.SURFACE.370`). A dialog, a drawer or a sheet over a page is a view of its own and holds its own. On a site page the closing call repeats the hero's one act at the page's end, so its `SOLID` and the hero's are one main action said twice, not on screen together (the site patterns). A feature leads with at most one `SOLID` `PRIMARY` (`RULE.SUPPORT.SURFACE.234`).

**The limits across a header.** A header shows at most one main action, the one given `PRIMARY`, and one or two secondaries (`RULE.SUPPORT.SURFACE.390`). On a record that moves through states, the main action is the move its state expects next, and it changes when the state changes. Every other move open at that state is a secondary, `DEFAULT`, and a record whose state expects no next move has no main action. A move shows only when the state allows it, and is left out and not drawn disabled. The two secondaries that stand are the two a person takes most. A third and every one after it stand behind "⋯", a `DSDropdownMenu` whose trigger is a `DSButton` with the icon `MORE_HORIZONTAL` alone, so the place draws it `GHOST`, or `OUTLINE` in the head of a page. The main action stays out of "⋯". A menu item has no colour, so a move there that deletes or ends something takes `ERROR` on its confirmation. Every move of a record, every track's included, stands in the record's header. Write no `variant` on a header's buttons: give the main action `color={DSColorType.PRIMARY}` and the place draws the rest.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `variant` | `SOLID` | the main action in the content, in a footer and in the head of a page; a main action that deletes or ends; a feature's one `SOLID` |
| `variant` | `QUIET` · `SUBTLE` · `SUBTLE_OUTLINE` | the place's: a header draws them as its main action's look at its level (`RULE.SUPPORT.SURFACE.379`) |
| `variant` | `OUTLINE` | every other action, in a header, a footer or the content; an icon alone in the head of a page; a feature's other actions. It is the unit's own default outside a header or a footer (`RULE.SUPPORT.SURFACE.376`) |
| `variant` | `GHOST` | an icon alone, outside the head of a page; another action at the end of a row or in a toolbar; a feature's action at `CONTAINER` and `WIDGET` |
| `variant` | `LINK` | a feature's action from `WIDGET` down. Nowhere else, because a link among words is a `DSLink` |
| `color` | `PRIMARY` | the main action, and a feature's one `SOLID` |
| `color` | `ERROR` | a main action that deletes or ends something |
| `color` | `DEFAULT` | every action that is not the main one. It is the unit's own default |
| `color` | `INFO` · `SUCCESS` · `WARNING` | no case written yet: a hue says a state, and a button is an act, so a page that writes one says a state on an act (`RULE.SUPPORT.SURFACE.384`) |
| `color` | `CUSTOM` | draws `DEFAULT`: a button takes no `customColor` (`RULE.SUPPORT.SURFACE.384`) |
| `size` | `XS` · `SM` · `MD` · `LG` · `XL` | in every case: the place's, else the size above, and a feature's by its level. A size the page writes wins, and a page writes one only to keep a size of its own |
| `type` | `BUTTON` | every button that does not send its form. It is the unit's own default |
| `type` | `SUBMIT` | the action that sends a form, which `DSForm.ButtonSubmit` writes. A page writes neither value |
| `authzDenied` | `HIDE` | an action a person may not take is left out, as a move a state does not allow is (`RULE.SUPPORT.SURFACE.390`). It is the unit's own default |
| `authzDenied` | `DISABLE` | an action shown so a person knows it exists and asks for the grant, such as an invite where only some members may send one |
| `startIconMotion` | `NUDGE_UP` to `LIFT` | by the icon's meaning, as the motion of an icon gives it: `NUDGE_START` on a back arrow, `NUDGE_END` on a next arrow, and `NUDGE_UP_END` set by the unit on a link that leaves the site (`RULE.SUPPORT.SURFACE.285`). A page writes one only for an icon the table names (`RULE.SUPPORT.SURFACE.201`) |
| `endIconMotion` | `NUDGE_UP` to `LIFT` | by the icon's meaning, as `startIconMotion` is |

The library draws `DSButton`'s usage as the first case: a view's main action in its content, `SOLID` `PRIMARY`, beside an `OUTLINE`.

### The overlays, and the two confirmations

- **`DSDialog`, `DSDrawer` and `DSSheet` MAY hold the parts `Header`, `Content` and `Footer`**, named `DSDialog.Header` and so on. The header stays at the top and the footer at the bottom, and only the content scrolls between them. The header places its first block, the title, at the start, where it grows, and every other block as one group of actions at the end, and leaves room for the close action. The footer places its actions at its end, the action that leaves the work first and the main action last (`architecture-containers.md`). `DSConfirmDialog` and `DSConfirmPopover` place their two actions the same way. An overlay that holds plain blocks and no parts scrolls them as one.
- **A dialog, a drawer and a sheet MUST announce their title once** (`RULE.SUPPORT.SURFACE.121`). Where an item line stands as the title in the header, that title and the name of the overlay are one heading to a screen reader. A page gives the title once, and it writes nothing more for the name.
- **A dialog, a sheet and a drawer MUST be filled with the page's surface, `BASE`, and a popover, a menu and a tooltip with the raised surface, each fixed** (`RULE.SUPPORT.SURFACE.163`). The theme chooses neither. A side panel inside a dialog, a sheet or a drawer takes a shell look, `DEFAULT` at `SUBTLE` unless the page says otherwise. **A dialog, a sheet and a drawer are each one surface** (`RULE.SUPPORT.SURFACE.250`): the panel draws the fill, its corners, its line and its shadow, and the card inside it draws none of them, so a drawer's swipe handle and its body stand on one fill with no strip and no second top.
- **A dialog, a drawer and a sheet MUST take their width from one scale, `extent`, and their padding from `size`** (`RULE.SUPPORT.SURFACE.190`). `extent` is `XS` 320 px, `SM` 400, `MD` 480, `LG` 560 and `XL` 720, each capped at 95 percent of the window, or `FIT`, which is as wide as what the panel holds, up to about 85 percent of the window. A sheet and a drawer at the side default to `MD`, a dialog to `XL`. `size` sets only the padding and never the width. A dialog's `width` and `height` in pixels stay only for content that sizes itself, such as the image cropper, and win over `extent`. A phone takes the whole width. On a top or bottom sheet `extent` is the height, and `FIT` is as tall as what the panel holds, up to about 85 percent of the window, past which the content scrolls (`RULE.SUPPORT.SURFACE.245`). A panel whose content is a form of fields uses `FIT`, so the fields open whole.
- **`DSSheet` takes `modal`, which is yes by default.** A sheet that is not modal stands beside the page. It draws no scrim, and the page stays usable. A press on the page does not close the sheet; its close action and the Escape key do. **On a phone a sheet MUST stay modal, whatever `modal` says.**
- **`DSConfirmDialog` asks a person to confirm an act that cannot be undone, and it stays open while the act runs** (`RULE.SUPPORT.SURFACE.088` rules the name, and no older name is kept beside it). The confirm action shows working, neither action can be pressed, and the dialog cannot be left. An act that fails keeps the dialog open and shows the failure in it.
- **`DSConfirmPopover` asks a person to confirm an act they can undo, in a popover that opens from the control that was pressed.** It holds the question, an action that cancels and the action that confirms, named as on `DSConfirmDialog`. It draws on the surface of `DSPopover`, covers no page and draws no scrim. **It MUST stay open while the act runs, and MUST close when the act is done.** An act that fails keeps it open and shows the failure in it. The cancel action and the Escape key close it, and focus goes back to the control that opened it.

`standards-patterns.md` states when a confirmation is the popover and when it is the dialog.

#### The choice table of `DSSheet`

A sheet is chosen by what it holds. Each sheet stands at the right of the page it belongs to, and how far it reaches follows what it holds. On a phone the sheet takes the whole screen by itself, whatever the page gave it (`RULE.SUPPORT.SURFACE.075`).

**The cases**, read from the top; the first that matches wins.

| The sheet holds | Where it stands | `placement` | `extent` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a medium entry: one column, a few groups, up to about a dozen fields | at the side of the page it belongs to | `RIGHT` (the unit's) | `MD` (the unit's) | the place's | nothing: one panel inside it | `RULE.SUPPORT.SURFACE.075` |
| a record's detail, opened from a row of a list | at the side, with the list in view | `RIGHT` (the unit's) | `LG` | the place's | the extent | this table |
| settings a person works by turns with the page, whose result shows on it | beside the page, which stays usable | `RIGHT` (the unit's) | `MD` (the unit's) | the place's | `modal` `false` | `RULE.SUPPORT.SURFACE.093` |
| a small entry: up to about five fields in one group | — | not a sheet: a `DSDialog` | — | — | — | `RULE.SUPPORT.SURFACE.075` |
| a large entry: sections, a part that repeats, or records of its own | — | not a sheet: a page of its own | — | — | — | `RULE.SUPPORT.SURFACE.078` |

**The limits across a view.** A sheet over a page is a view of its own, and holds its own main action (`RULE.SUPPORT.SURFACE.370`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `RIGHT` | every case. It is the unit's own default |
| `placement` | `LEFT` · `TOP` · `BOTTOM` | no case written yet: a sheet stands where the page's reading ends, and the navigation keeps the left; on a phone the unit draws it whole |
| `extent` | `MD` | a medium entry; settings worked by turns. It is the unit's own default |
| `extent` | `LG` | a record's detail |
| `extent` | `XS` · `SM` · `XL` · `FIT` | no case written yet: `XS` and `SM` leave a column of fields too narrow, `XL` leaves no page in view beside it, and `FIT` is the height of a sheet at the top or the bottom, which no case holds |
| `size` | `XS` to `XL` | the place's. It sets the padding and never the width (`RULE.SUPPORT.SURFACE.190`) |

#### The choice table of `DSDialog`

A dialog is chosen by what it holds, and it stands over the page that opened it. Its width follows what it holds, and its padding is its place's.

**The cases**, read from the top; the first that matches wins.

| The dialog holds | Where it stands | `extent` | `role` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a small entry: up to about five fields in one group | over the page it belongs to | `MD` | `'dialog'` (the unit's) | the place's | the extent | `RULE.SUPPORT.SURFACE.075` |
| one short step a person finishes before going on: a sign-in again, a code to confirm, a choice of two | over the page | `SM` | `'dialog'` (the unit's) | the place's | the extent | this table |
| a wide thing a person works in: a picture to crop, a preview, a set to choose from | over the page | `XL` (the unit's) | `'dialog'` (the unit's) | the place's | nothing | `RULE.SUPPORT.SURFACE.190` |
| a thing that sets its own width, such as a code shown once | over the page | `FIT` | `'dialog'` (the unit's) | the place's | the extent | `RULE.SUPPORT.SURFACE.245` |
| a question that confirms an act | — | not this unit: a `DSConfirmDialog`, which takes `'alertdialog'` | — | — | — | `RULE.SUPPORT.SURFACE.088` |
| a medium entry, or a record's detail | — | not a dialog: a `DSSheet` | — | — | — | `RULE.SUPPORT.SURFACE.075` |
| a large entry | — | not a dialog: a page of its own | — | — | — | `RULE.SUPPORT.SURFACE.078` |

**The limits across a view.** A dialog over a page is a view of its own, and holds its own main action (`RULE.SUPPORT.SURFACE.370`). On a phone it opens as a sheet from the bottom of the screen (`RULE.SUPPORT.SURFACE.076`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `extent` | `MD` | a small entry. Not drawn: the library draws a dialog's surface at one width |
| `extent` | `SM` | one short step. Not drawn |
| `extent` | `XL` | a wide thing a person works in. It is the unit's own default. Not drawn |
| `extent` | `FIT` | a thing that sets its own width (`RULE.SUPPORT.SURFACE.245`). Not drawn |
| `extent` | `XS` | no case written yet: `XS` is too narrow for a field and its label |
| `extent` | `LG` | no case written yet: an entry that needs more room than `MD` fits a sheet (`RULE.SUPPORT.SURFACE.075`), and a wide thing takes `XL` |
| `role` | `'dialog'` | every case. It is the unit's own default. Not drawn: a role is read by a screen reader |
| `role` | `'alertdialog'` | a confirmation, which `DSConfirmDialog` writes. A page writes neither value. Not drawn |
| `size` | `XS` to `XL` | the place's. It sets the padding and never the width (`RULE.SUPPORT.SURFACE.190`) |

#### The choice table of `DSDrawer`

A drawer is chosen by what it holds and the device: on a phone it rises from the foot of the screen, and beside a record it holds how that record looks.

**The cases**, read from the top; the first that matches wins.

| The drawer holds | Where it stands | `placement` | `extent` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a filter bar's fields on a phone | the foot of the screen | `BOTTOM` (the unit's) | `FIT` | the place's | nothing: the filter bar opens it | `RULE.SUPPORT.SURFACE.245` |
| the settings of how a record looks, beside it | the end of the screen | `RIGHT` | `MD` (the unit's), or `LG` for many groups | the place's | the placement, and `LG` where it holds many groups | this table |
| an entry, or a record's detail | — | not a drawer: a `DSSheet` | — | — | — | `RULE.SUPPORT.SURFACE.075` |

**The limits across a view.** A drawer over a page is a view of its own, and holds its own main action (`RULE.SUPPORT.SURFACE.370`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `BOTTOM` | a phone's fields. It is the unit's own default |
| `placement` | `RIGHT` | how a record looks, beside it |
| `placement` | `LEFT` · `TOP` | no case written yet: the navigation keeps the left, and a panel from the top covers the page's head |
| `extent` | `FIT` | fields at the foot, which open whole (`RULE.SUPPORT.SURFACE.245`) |
| `extent` | `MD` · `LG` | how a record looks. `MD` is the unit's own default |
| `extent` | `XS` · `SM` · `XL` | no case written yet: `XS` and `SM` leave a group of settings too narrow, and `XL` leaves no record in view beside it |
| `size` | `XS` to `XL` | the place's. It sets the padding and never the width (`RULE.SUPPORT.SURFACE.190`) |

#### The choice table of `DSConfirmDialog`

A confirmation is chosen by the act it confirms. Its colour is the colour of its confirm action, by what that act does, and it is one question and two actions wide.

**The cases**, read from the top; the first that matches wins.

| The act | Where it stands | `color` | `extent` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| deletes or ends something: delete a project, deactivate a record | over the page | `ERROR` | `SM` (the unit's) | the words and the colour | `RULE.SUPPORT.SURFACE.384` |
| starts or turns on something: activate a record | over the page | `PRIMARY` | `SM` (the unit's) | the words and the colour | `RULE.SUPPORT.SURFACE.384` |
| changes nothing a person keeps, such as leaving a page with changes unsaved | over the page | `DEFAULT` (the unit's) | `SM` (the unit's) | the words | `RULE.SUPPORT.SURFACE.384` |
| is small and undone in one press, from the control that does it | — | not this unit: a `DSConfirmPopover` | — | — | `RULE.SUPPORT.SURFACE.088` |

**The limits across a view.** The confirmation is a view of its own, and its confirm action is its one main action (`RULE.SUPPORT.SURFACE.370`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `ERROR` | an act that deletes or ends something |
| `color` | `PRIMARY` | an act that starts or turns on something |
| `color` | `DEFAULT` | an act that changes nothing a person keeps. It is the unit's own default |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `CUSTOM` | no case written yet: a confirmation's colour is its action's, and a button has no case for them (`RULE.SUPPORT.SURFACE.384`) |
| `extent` | `SM` | every confirmation. It is the unit's own default. Not drawn |
| `extent` | `XS` · `MD` · `LG` · `XL` · `FIT` | no case written yet: a confirmation is one question and two actions |

#### The choice table of `DSConfirmPopover`

A confirm popover is chosen by a small act a person confirms where they pressed it. Its colour is its confirm action's, by what the act does.

**The cases**, read from the top; the first that matches wins.

| The act | Where it stands | `color` | `placement` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| deletes or ends something: remove a member, deactivate a record | from the button that does it | `ERROR` | `BOTTOM_RIGHT` (the unit's) | the words and the colour | `RULE.SUPPORT.SURFACE.384` |
| starts or turns on something: activate a record | from the button that does it | `PRIMARY` | `BOTTOM_RIGHT` (the unit's) | the words and the colour | `RULE.SUPPORT.SURFACE.384` |
| changes nothing a person keeps | from the button | `DEFAULT` (the unit's) | `BOTTOM_RIGHT` (the unit's) | the words | `RULE.SUPPORT.SURFACE.384` |
| cannot be undone and reaches far, such as deleting a project | — | not this unit: a `DSConfirmDialog` | — | — | `RULE.SUPPORT.SURFACE.088` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `ERROR` · `PRIMARY` · `DEFAULT` | each by its case. `DEFAULT` is the unit's own default |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `CUSTOM` | no case written yet: its colour is its action's (`RULE.SUPPORT.SURFACE.384`) |
| `placement` | `LEFT` to `LEFT_BOTTOM` | the room the trigger leaves: under it where there is room, else over it, else beside it; the unit turns to the side with room. `BOTTOM_RIGHT` is the unit's own default |

### The tabs by level

| `pageLevel` | The tabs are | Their look, with no `type` | At the size of the theme, `SM` |
| --- | --- | --- | --- |
| `PAGE` | the sub-pages of a page | `PILL`, grouped on its track and not raised | a label of 18px in a row of 44px |
| `CONTAINER` | the parts of a panel | `LINE` | a label of 16px in a row of 40px |
| `WIDGET` | the parts of a card | `LINE` | a label of 14px in a row of 36px |
| `GROUP` · `CONTENT` | two ways to show one thing | `SWITCH` | a label of 13px in a row of 32px |
| `INLINE` | two ways to show one value | `SWITCH` | a label of 12px in a row of 28px |

- **A page names the `type` of its tabs only where the level's look does not belong, and the pages of a website take `PILL`** (`RULE.SUPPORT.SURFACE.209`; this part is advice). `type` takes `DSTabsType` and changes the look alone: the level still gives the size, and the keys and the focus ring are the same in each type. An app keeps choosing by level.

  | `type` | Its look | Where it belongs |
  | --- | --- | --- |
  | `LINE` | the underline: the open tab is the navigation's colour over a line, and no fill; it draws no surface, so it ignores `raised`, as it ignores `grouped` | the pages of an app, and the parts of its panels and cards |
  | `SWITCH` | a bar that takes the navigation's colour, with a pill on the open tab, filled as the navigation's entry says; with `raised` the open tab takes a soft shadow, `ds:shadow-sm`, and no colour changes | two ways to show one thing, inside a part of a page |
  | `PILL` | a bar on the same fill as the switch's bar, so its tabs read as one control; with `raised` the bar takes a soft shadow, `ds:shadow-sm`, and no colour changes; no line, padded 5px either way, the bar fully rounded across and every tab fully rounded across and down, roomier than the switch; the open tab filled as the navigation's entry says, with no line, and a label stronger in colour, and in weight only where the entry gives no fill; a closed tab a soft tint of the navigation's colour under the pointer and the focus (`RULE.SUPPORT.SURFACE.213`, `RULE.SUPPORT.SURFACE.214`, `RULE.SUPPORT.SURFACE.215`, `RULE.SUPPORT.SURFACE.220`) | the pages of a website, in its top bar, with `raised` where the bar floats |

- **`DSTabs` MUST be lifted only where `raised` asks, and MUST read no card or panel look** (`RULE.SUPPORT.SURFACE.215`). `raised` is a prop of the row, as on `DSCard`, with no default: unset, the row is not lifted. Tabs read neither `theme.card` nor `theme.container`. `raised` lifts and never recolours (`RULE.SUPPORT.SURFACE.220`): it adds a soft shadow, `ds:shadow-sm`, and no colour, as the rail, the top bar and the dock add `ds:shadow-md` alone. The shadow goes on the open tab of `SWITCH`, on the bar of `PILL`, and on the open tab of either where the tabs stand without a bar; `LINE` has no surface to lift and ignores `raised`, as it ignores `grouped`.

- **The tabs of `SWITCH` and `PILL` MAY stand without their bar, with `grouped={false}`** (`RULE.SUPPORT.SURFACE.218`). `grouped` is a prop of the row, `true` when unset, and `LINE` ignores it. `grouped={false}` drops the bar's fill, its padding and its bar shadow, so the tabs stand on the page and the open tab's fill alone marks it, with its rounding kept; where the entry gives no fill, the open tab's label alone marks it. With `raised`, the open tab of either takes a soft shadow, `ds:shadow-sm`, in place of the bar's, where it has a fill, and no colour changes. Each tab keeps its padding and the gaps, so no label moves. The name sits beside `DSButtonGroup` and `DSToggleGroup`.

- **The tabs MUST take their colour, and the fill of their open tab, from the theme's navigation, `theme.layout.navigation`, and a row MAY override each** (`RULE.SUPPORT.SURFACE.214`). Tabs mostly lead from page to page or switch what a part shows, as the navigation does, so they match it. No theme field is added, `DSTabs` draws its own tabs and never `DSNavEntry`, and unlike the navigation units, which take their look as one prop, it reads the theme's navigation.

  | The navigation's | `LINE` | `SWITCH` | `PILL` |
  | --- | --- | --- | --- |
  | `color` `PRIMARY` | the open label and its line in the brand, `--primary-fg` | the bar in the brand's soft tint, `--primary-subtle`, except under a soft open tab, where in light it stays on the neutral track; the open tab's fill in the brand; a closed tab the brand's soft tint at half strength under the pointer and the focus | as the switch |
  | `color` `DEFAULT` | the open label and its line in the full text colour, `--fg` | the bar on the neutral track, `--surface-inset`; the open tab's fill in the neutral greys; a closed tab's label turns full under the pointer | the bar as the switch's; the open tab's fill in the neutral greys; a closed tab `--neutral-subtle` under the pointer and the focus |
  | `color` `BASE` | as `DEFAULT` | the bar on the base surface, `--surface`; the open tab and the closed tab as `DEFAULT` | the bar as the switch's; the open tab and the closed tab as `DEFAULT` |
  | `entry` `SOLID` | no change | a strong fill: `--primary`, or `--fg` with the page's colour as its label | as the switch |
  | `entry` `QUIET` · `SUBTLE` | no change | a soft fill: `--primary-subtle`, or `--neutral-quiet` | as the switch |
  | `entry` `LINE` · `PLAIN` | no change | no fill: the label alone, stronger in colour and in weight | as the switch |

  The theme's default navigation is `DEFAULT` at `QUIET`, so tabs are neutral, with a soft fill on the open tab, until the navigation is `PRIMARY`. `color` takes `DSSurfaceColorType` and `entry` takes `DSNavEntryType`, the navigation's own types, mapped as its values are. A row names them only where it must differ from the navigation, such as a second row of tabs or the tabs of a busy card; unset, the navigation decides.

- **Every `type` MUST stand one under another and share the whole width** (`RULE.SUPPORT.SURFACE.213`). With `orientation` `VERTICAL` the line runs down the side, the switch is a column on the bar's fill and the pill a column on the same fill with a panel's large radius, its tabs fully rounded as across; with `fill` the tabs of every type share the width equally.

- **A unit that takes a page level is given its `pageLevel` first, and its `size` only to replace the size of its place** (`RULE.SUPPORT.SURFACE.209`, advice). The level says where the unit stands, and the size of its place and its level give its size; a page that passes `size` as well says that this one unit counts the level from a size other than its place's, and the level still raises that size. `DSItem` and `DSItemFacts` take no `size`, so the level is all a page gives them.

- **The `size` of the tabs MUST pick the step, and the level MUST say how far from it the tabs are drawn, one step for each level** (`RULE.SUPPORT.SURFACE.315`). At `GROUP` and `CONTENT` a tab is drawn at the step of its size. At `WIDGET` it is drawn one step above, at `CONTAINER` two steps above and at `PAGE` three, and at `INLINE` one step under, never above `XL` and never under `XS`. So each level from the page down to the widget is one step apart, as the titles of those levels are. A step gives the label its content step and the row the height of a control.

  | Size of the tabs | `INLINE` | `GROUP` · `CONTENT` | `WIDGET` | `CONTAINER` | `PAGE` |
  | --- | --- | --- | --- | --- | --- |
  | `XS` | 12px in a row of 28px | 12px in a row of 28px | 13px in a row of 32px | 14px in a row of 36px | 16px in a row of 40px |
  | `SM` | 12px in a row of 28px | 13px in a row of 32px | 14px in a row of 36px | 16px in a row of 40px | 18px in a row of 44px |
  | `MD` | 13px in a row of 32px | 14px in a row of 36px | 16px in a row of 40px | 18px in a row of 44px | 18px in a row of 44px |
  | `LG` | 14px in a row of 36px | 16px in a row of 40px | 18px in a row of 44px | 18px in a row of 44px | 18px in a row of 44px |
  | `XL` | 16px in a row of 40px | 18px in a row of 44px | 18px in a row of 44px | 18px in a row of 44px | 18px in a row of 44px |
- **Tabs that say no level and no type draw the switch.** The tabs of the parts of a panel or of a card say `CONTAINER` or `WIDGET`, and the tabs that lead to the sub-pages of a whole page say `PAGE`.
- **In a `flush` part, the tabs MUST place their first tab and their panel by the inset of their place** (`RULE.SUPPORT.SURFACE.118`). The label of the first tab starts at that inset, so it starts where the text under it starts. The line of the tabs still runs from edge to edge. The panel takes the same inset at its sides, and what it holds stands in a padded place. So a title in the panel takes no inset of its own, and a code view or a table in the panel keeps its border.
- **A page writes no padding for the tabs or for their panel.** The part says that it is `flush`, and the tabs do the rest.

#### The choice table of `DSTabs`

Tabs are chosen by where they stand: the level says their size and, where the page names no type, their look. Their colour and the fill of the open tab are the navigation's.

**The cases**, read from the top; the first that matches wins.

| The tabs are | Where they stand | `pageLevel` | `type` | `color` and `entry` | `orientation` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| the sub-pages of a page | under the page's head | `PAGE` | left out: `PILL`, the level's | the navigation's | `HORIZONTAL` (the unit's) | the place's | the level | `RULE.SUPPORT.SURFACE.224` |
| the sub-pages of a record of an app, where the app keeps the line | under the record's head | `PAGE` | `LINE` | the navigation's | `HORIZONTAL` (the unit's) | the place's | the level and the type | `RULE.SUPPORT.SURFACE.209` |
| the parts of a panel | the panel's header or a `flush` part | `CONTAINER` | left out: `LINE`, the level's | the navigation's | `HORIZONTAL` (the unit's) | the place's | the level | `RULE.SUPPORT.SURFACE.209` |
| the parts of a card | the card's header or a `flush` part | `WIDGET` | left out: `LINE`, the level's | the navigation's | `HORIZONTAL` (the unit's) | the place's | the level | `RULE.SUPPORT.SURFACE.209` |
| two ways to show one thing | over what they switch | `CONTENT` (the unit's), or `GROUP` | left out: `SWITCH`, the level's | the navigation's | `HORIZONTAL` (the unit's) | the place's | nothing | `RULE.SUPPORT.SURFACE.209` |
| two ways to show one value | inside another unit | `INLINE` | left out: `SWITCH` | the navigation's | `HORIZONTAL` (the unit's) | the place's | the level | `RULE.SUPPORT.SURFACE.209` |
| the tabs of a site's page | a band of the site | the band's | `PILL` | the navigation's | `HORIZONTAL` (the unit's) | the place's | the type | `RULE.SUPPORT.SURFACE.209` |
| the sections of a settings page, down its side | a column at the start | the place's | the level's | the navigation's | `VERTICAL` | the place's | the orientation | `RULE.SUPPORT.SURFACE.213` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `pageLevel` | `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `CONTENT` · `INLINE` | each by its case. `CONTENT` is the unit's own default |
| `type` | `LINE` · `SWITCH` · `PILL` | left out, the level's; `PILL` on a site; `LINE` where an app keeps it at `PAGE` (`RULE.SUPPORT.SURFACE.209`) |
| `color` | `BASE` · `DEFAULT` · `PRIMARY` | the navigation's (`RULE.SUPPORT.SURFACE.214`); a row writes one only to match a surface it stands on |
| `entry` | `SOLID` · `QUIET` · `SUBTLE` · `LINE` · `PLAIN` | the navigation's (`RULE.SUPPORT.SURFACE.214`) |
| `orientation` | `HORIZONTAL` | every row of tabs. It is the unit's own default |
| `orientation` | `VERTICAL` | sections down a side (`RULE.SUPPORT.SURFACE.213`) |
| `size` | `XS` to `XL` | the place's; the level counts its steps from it (`RULE.SUPPORT.SURFACE.315`) |

### DSStepper

`DSStepper` shows where a person stands in a run of steps: a form in parts, such as a sign-up, or a timeline, such as a parcel's journey or an account being set up. A page hands it its steps as data and never builds the parts one by one (`RULE.SUPPORT.SURFACE.308`). It is a block drawn from data, a host and an item, so it names a step by its `key` as `DSTabs` names a tab, and takes the shared names for its look. It sits in Navigation beside `DSTabs`, because it moves a person between the steps of a run, takes the open step as `activeKey` and calls `onActiveKeyChange` when a person returns to one.

| Prop | Takes | Unset | What it decides |
| --- | --- | --- | --- |
| `items` | `IDSStepperItem[]`, required | — | the steps, in the order they are drawn |
| `activeKey` | a step's `key` | the stepper keeps its own | the open step, said by the page. A key and not an index, so a step added or hidden moves no other |
| `defaultActiveKey` | a step's `key` | the first step | the seed when the page does not hold the open step |
| `onActiveKeyChange` | `(key: string) => void` | no step can be pressed | given, the steps a person may return to become buttons. It pairs with `activeKey` |
| `type` | `DSStepperType`: `NUMBER` · `ICON` · `DOT` | `NUMBER` | the form of a step's indicator |
| `orientation` | `DSOrientationType`: `HORIZONTAL` · `VERTICAL` | `HORIZONTAL` | the axis the steps run along |
| `pageLevel` | `DSPageLevelType`, all six levels | the level of the box it stands in | where the stepper stands on a page; it raises the size, the indicator and the words |
| `size` | `DSSizeType`: `XS` to `XL` | the size of its place | the size the level counts from; given, it replaces the size of the place, and the level still raises it |
| `color` | `DSColorType` | `PRIMARY` | the hue of the done and the current steps and of the bar between them |
| `testData` | as every unit | — | the root's test hook; each step carries its own |

A step is `IDSStepperItem`, which extends `IDSDataOption`, so a step is an option, as a tab is: `key`, `label`, `disabled`, `data` and `testData` are the option's; `startIcon` is its indicator where `type` is `ICON` (ignored by `NUMBER` and `DOT`); `endIcon` stands after its title, such as a lock on a step the person cannot open yet; `description` is the line under the title; and `taskState` takes `DSTaskStateType`, `IDLE` · `WORKING` · `DONE` · `FAILED`. `NUMBER` draws each step's number and is the one form that draws numbers; `ICON` draws each step's `startIcon`, and a step with none falls back to a dot; `DOT` draws a dot. A done step draws its check in `NUMBER` and `ICON`, and a filled dot in `DOT`.

- **A stepper MUST take its steps as data, and a step MUST take a task state and invent no state of its own** (`RULE.SUPPORT.SURFACE.308`, `RULE.SUPPORT.SURFACE.309`). There is no `PENDING` and no `IN_PROGRESS`: pending is `IDLE`, and in progress is `WORKING`. `EMPTY` and `DENIED` are task states of a block's data, and a step takes neither.
- **A step's task state MUST be the one its `taskState` gives, else the one its place gives against `activeKey`** (`RULE.SUPPORT.SURFACE.308`). Unset, the steps before the active one are `DONE`, the active one `WORKING` and the steps after it `IDLE`; no step is `FAILED` unless the page says so. A form in steps gives `activeKey` alone; a timeline gives each step its own `taskState`, because two may be in progress at once. A step's own `taskState` wins.

| Task state | Unset, which steps take it | The indicator | The bar after it | Words for a screen reader |
| --- | --- | --- | --- | --- |
| `DONE` | the steps before the active one | filled in `color`, a check | filled in `color` | "Done" |
| `WORKING` | the active one | a ring in `color`, its number, icon or dot in `color` | the track | "In progress"; the active step also carries `aria-current="step"` |
| `IDLE` | the steps after the active one | an outline in the border token, its number, icon or dot muted | the track | "Not started" |
| `FAILED` | none: only the page says a step failed | filled in `ERROR`, the error icon | the track | "Failed" |

- **The indicator MUST be a mark at the stepper's size, the title MUST take that size's type step as a tab's label does, and the description MUST stand one step under it** (`RULE.SUPPORT.SURFACE.308`, `RULE.SUPPORT.SURFACE.314`). A `DOT` is a dot a third of that size. The title is 12, 13, 14, 16 and 18px from `XS` to `XL`, in the title weight; the description is 12, 12, 13, 14 and 16px in the muted tone. An icon after the title follows the title's size.
- **Horizontal, each step's indicator MUST stand on the row with a bar to the next one, and its words under it. Below the small screen class the row MUST keep its indicators and bars, and only the current step's title and description MUST stand under it, with "Step 2 of 4" before the title** (`RULE.SUPPORT.SURFACE.308`). So four titles never crush into a phone's width.
- **Vertical, the indicator MUST stand at the start of the title's line, the bar MUST run down to the next indicator, and the description MUST stand under the title** (`RULE.SUPPORT.SURFACE.308`).
- **The root MUST be an `ol` and each step an `li`, and the active step MUST carry `aria-current="step"`** (`RULE.SUPPORT.SURFACE.308`). A step a person may press is a button inside its `li`, with the focus ring; Tab moves between them and Enter or Space presses one.
- **A person MUST be able to press a done step and the current one, and MUST NOT be able to press an upcoming step** (`RULE.SUPPORT.SURFACE.308`). Going forward waits on what the current step checks, which the page decides when it moves `activeKey`. A step is pressed only where `onActiveKeyChange` is given.
- **The page level of a stepper MUST decide its size, as the tabs' does** (`RULE.SUPPORT.SURFACE.314`, `RULE.SUPPORT.SURFACE.315`). The level moves its step by the tabs' steps: `PAGE` three up, `CONTAINER` two, `WIDGET` one, `GROUP` and `CONTENT` none, and `INLINE` one down, never above `XL` and never under `XS`. A `size` given replaces the size of the place the level counts from, and the level still moves it: at `PAGE`, in a place of `SM`, the stepper is `XL`; with `size` `XS` it is `LG`.

  | `pageLevel` | The stepper is | At the theme's `SM`: the indicator, the title, the description |
  | --- | --- | --- |
  | `PAGE` | the steps of a page, such as a sign-up | 44px, 18px, 16px |
  | `CONTAINER` | the steps in a panel | 40px, 16px, 14px |
  | `WIDGET` | the steps in a card | 36px, 14px, 13px |
  | `GROUP` · `CONTENT` | the steps inside a part, or a row | 32px, 13px, 12px |
  | `INLINE` | the steps inside a value | 28px, 12px, 12px |

#### The choice table of `DSStepper`

A stepper is chosen by the steps of one flow a person goes through. The level of its box gives its size, and its colour is the brand's, as a step's number is.

**The cases**, read from the top; the first that matches wins.

| The steps are | Where they stand | `pageLevel` | `type` | `color` | `orientation` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| the steps of a sign-up or a setup, each named | over the step in view | the place's | `NUMBER` (the unit's) | `PRIMARY` (the unit's) | `HORIZONTAL` (the unit's) | the place's | the items and the step in view | `RULE.SUPPORT.SURFACE.314` |
| the steps of a long form, down its side | a column at the start | the place's | `NUMBER` (the unit's) | `PRIMARY` (the unit's) | `VERTICAL` | the place's | the orientation | `RULE.SUPPORT.SURFACE.314` |
| steps a person tells apart by their kind, such as a checklist of a setup | over the steps | the place's | `ICON` | `PRIMARY` (the unit's) | `HORIZONTAL` (the unit's) | the place's | the type and each icon | `RULE.SUPPORT.SURFACE.314` |
| a short run of steps with no names, such as the pages of an introduction | under the step in view | the place's | `DOT` | `PRIMARY` (the unit's) | `HORIZONTAL` (the unit's) | the place's | the type | `RULE.SUPPORT.SURFACE.314` |
| the stages a record has passed through, which a person reads and does not take | a reading of the record | the place's | `NUMBER` (the unit's) | `DEFAULT` | `HORIZONTAL` (the unit's) | the place's | the colour | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `pageLevel` | `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `CONTENT` · `INLINE` | the level of the box it stands in (`RULE.SUPPORT.SURFACE.314`) |
| `type` | `NUMBER` | named steps. It is the unit's own default |
| `type` | `ICON` · `DOT` | steps told apart by their kind; a short run with no names |
| `color` | `PRIMARY` | every flow a person takes. It is the unit's own default (`RULE.SUPPORT.SURFACE.385`) |
| `color` | `DEFAULT` | stages a person reads |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: each step draws its own state, done or failed, and the stepper says none |
| `orientation` | `HORIZONTAL` | steps over the one in view. It is the unit's own default |
| `orientation` | `VERTICAL` | steps down a form's side |
| `size` | `XS` to `XL` | the place's; the level raises it (`RULE.SUPPORT.SURFACE.314`) |

## The navigation units — ✅

The navigation is drawn by units of its own, and the layouts are built from them (`architecture-layouts.md`).

| Unit | What it is | Its props |
| --- | --- | --- |
| `DSNavList` | the vertical inner part: sections, groups that open and close, and entries with their actions | `nodes`; `look` (`IDSNavLook`); `size` (`XS` to `XL`); `collapsed` |
| `DSNavMenu` | the horizontal inner part: entries in a row, where a group opens a wide panel | `nodes`; `look` (`IDSNavLook`); `size` (`XS` to `XL`) |
| `DSNavBarSide` | a bar at the side, a surface: `startNode`, a `DSNavList`, then `endNode`. At `EDGE` it folds to icons; at `INLINE` it is a column in the page | `nodes`; `look` (`IDSNavBarLook`); `size` (`XS` to `XL`); `startNode`; `endNode`; `startNodeCollapsed`; `endNodeCollapsed`; `placement` = `EDGE`; `collapsible` = `true`; `defaultOpen` = `true`; `side` = `LEFT` |
| `DSNavBarTop` | a bar across the top, a surface: `startNode`, a `DSNavMenu`, then `endNode` | `nodes`; `look` (`IDSNavBarLook`); `size` (`XS` to `XL`); `startNode`; `endNode` |
| `DSNavEntry` | one entry: its link, hover, focus, open mark and actions. Every list, menu and panel draws it, and an app's drawing of a panel places it | `item`; `look` (`IDSNavLook`); `size` (`XS` to `XL`); `onSelect`; `children` (a node, or a function of `{ active, selected }`) |

`IDSNavLook` is `color`, `strength` and `entry`. `IDSNavBarLook` is a surface look — `color`, `strength`, `opacity`, `bordered`, `raised` — with `entry`, and it is also the shell of the theme (`architecture-app.md`).

- **A navigation unit MUST take its look as one prop, `look`, and MUST NOT read the theme** (`RULE.SUPPORT.SURFACE.156`). The layouts alone read the theme and hand the look down, so a unit draws the same outside a layout, such as the side list of a settings page. A bar draws its look's fill, opacity, line and shadow, and hands the look to its inner part. Where the look of an inner part names a colour, the part draws its entries for that fill alone.
- **The navigation's data is the menu's narrowed, never a second family:** `IDSNavItem` (an entry, with its own `actions`), `IDSNavGroup` (entries and `IDSNavGroupSection`s, one level deep, and an optional `renderPanel`), `IDSNavGroupSection` (a section inside a group, holding entries alone), `IDSNavSection`, `IDSNavSeparator` (its own type), and `IDSNavNode`, with no custom node. The kinds stay `DSDataMenuNodeType`, so one filter by `permissions` and `enablements` reads both, and drops a section of a group with nothing left. A group that holds the open page in one of its sections holds it. What a drawing needs beyond the data, a line of description or a picture, rides in the entry's `data`.
- **A group of the navigation MUST open in place, one level deep. A group of a menu MAY fly out to any depth.**
- **A navigation unit MUST take every size, `DSSizeType` from `XS` to `XL`, as every unit does** (`RULE.SUPPORT.SURFACE.256`). With no `size`, a unit takes the size of its place, then the theme's, so a scope's size reaches the bar, the column and the menu as it is. A layout hands its config's `size` to its bar (`architecture-layouts.md`).

**The navigation at each step.** Every value is a token of the step, in the design system's font, and the popover's rows, the drawer and the rows of a column and a rail follow the step as the bar does.

| Part | `XS` | `SM` | `MD` | `LG` | `XL` |
| --- | --- | --- | --- | --- | --- |
| The text of every entry | 12px | 13px | 14px | 16px | 18px |
| The icon of an entry, of the entry's own step | 12px | 14px | 16px | 18px | 20px |
| The top bar's height | 48px | 56px | 56px | 64px | 72px |
| A bar entry's box | 28px | 32px | 36px | 40px | 44px |
| A bar entry's side padding | 8px | 10px | 12px | 14px | 16px |
| The gap between two bar entries | 8px | 8px | 8px | 8px | 8px |
| From one bar entry's label to the next | 24px | 28px | 32px | 36px | 40px |
| A row of the popover menu, its box | 28px | 32px | 36px | 40px | 44px |
| A row of the popover menu, its side padding | 8px | 10px | 12px | 14px | 16px |
| The popover's padding and least width | 4px · 144px | 6px · 160px | 8px · 176px | 8px · 208px | 10px · 240px |
| A group's heading in the popover, in capitals at 500 | 11px | 12px | 12px | 13px | 14px |
| A row of a column and a rail, its box and side padding | 28px · 8px | 32px · 8px | 36px · 8px | 40px · 12px | 44px · 12px |
| The dock's column and the open rail, their width | 224px | 240px | 256px | 288px | 320px |

- **An entry's box MUST be the height a button of the same step takes, `--size-<step>-height`, and its side padding `--size-<step>-padding-x`.** So an entry and a button of one step stand the same height side by side.
- **The gap between two bar entries MUST be 8px at every step.** The entries pad themselves, so they nearly touch, and the distance from label to label grows with the padding.
- **A bar entry MUST stand at the weight 500, and a row of the popover at 400, with 500 for the open page, at every step.**
- **A group's wide panel in `DSNavMenu` MUST be rows as tight as a menu bar's, or the app's own drawing** (`RULE.SUPPORT.SURFACE.159`). With no drawing it is one column of rows at the height and padding of `DSMenubar`'s, a section its small muted name over its rows, a line between sections. A group's `renderPanel(context)` draws the inside instead: tiles, columns, a picture beside each entry, edge to edge in a panel that has no padding. The context, `IDSNavPanelContext`, gives the group filtered by permission, `open`, `close`, the look and the size.
- **The menu MUST keep the bar, the entries, the opening, the keys, the closing and the panel's frame**, the frame being the shell's fill, line, corner and shadow. A list, a rail, a dock and the menu of a phone always draw the group's data, so every entry is reachable whatever a drawing leaves out.
- **A drawing's closing animation MUST finish inside the panel's own closing transition**, and a panel on a strong fill gives what it holds the opposite mode's tokens, so an item, an icon and a text unit read on it. The fill itself is worked out in the page's own mode, so a card or a panel on a strong fill in a light page draws the light page's strong fill, and only what it holds takes dark mode.
- **A panel a group draws MUST have no padding, and MUST clip its drawing to its corner** (`RULE.SUPPORT.SURFACE.159`). The panel keeps its frame and gives the drawing none of its room, so the drawing reaches the panel's edge and sets its own room: a tile's hover fill meets the panel's line, and a corner tile's fill follows the rounded corner. The default rows keep the panel's room. No prop asks for it: a `renderPanel` is the ask.
- **A drawing MUST place each entry as a `DSNavEntry`** (`RULE.SUPPORT.SURFACE.160`), passing `close` as its `onSelect`. The entry keeps its link, hover, focus, open mark and actions wherever it stands. Its content may be a node or a function of `{ active, selected }`, so an icon can turn or be swapped while the entry is active. **Nothing pressable stands inside an entry**: a command goes in its actions or beside it. Its link carries `data-nav-entry`, for a page's own stylesheet.
- **An entry MAY carry a `count`, and the number MUST be in its name.** Open, a quiet `DSBadge` at its end; shut, a dot on its icon; the name reads "Orders, 2"; `0` or none shows nothing. `DSButton` takes the same `count`: a quiet badge after its label, or a dot at the top end of an icon alone, named "Notifications, 3 unread" through `translate`.
- **A `GRID` layout MUST take its columns per screen class** (`RULE.SUPPORT.SURFACE.271`). The layout's `gridColumns` is `IDSGridColumns`, left out 3 on a desktop, 2 on a tablet and 1 on a phone, each from 1 to 6. A stack's unit that sets a record's readings in a grid takes the same `gridColumns`. `DSCheckboxGroup`, `DSRadioGroup` and `DSSkeleton` take `gridColumns` as an attribute in place of `columns`, 1 to 6, and `DSList` takes the whole `IDSGrid` as `grid`.

The web builds the navigation units in place of `DSNavigationMenu` and the lists the layouts drew themselves.

## Composites — 🔮

A composite is a block built from components that carries one task end to end, and a page places it whole: a data table finds and shows records, a filter bar narrows them, a comparison sets subjects side by side, a feature pitches a thing and asks the reader to act. A page does not reach inside one to rearrange its parts (`RULE.SUPPORT.SURFACE.230`).

**A composite carries one task end to end, and no other component is built from it.** A component that others are built from stays in its group, however many parts it has: the item line, the list, the table and the card stay in Data display, because the rows of a list, the records of a data table, `DSCardWidget` and the header of a panel are built from them.

| Unit | Others built from it | Group |
| --- | --- | --- |
| `DSItem`, `DSList`, `DSTable`, `DSCard` | yes: a list's row, `DSItemCard`, `DSItemFacts`, a data table's records, `DSCardWidget`, the header of a panel | Data display |
| `DSDataTable`, `DSFilterBar`, `DSComparison` | no: only panels and pages use them | Composites |
| `DSFeature` | no | Composites |

A composite owns its inner wiring and its size. It takes one size, from its own prop or from the block above it, and **passes that size to every part inside it**, so a page sets one size for the whole composite and never dresses its parts separately. A composite adds no states of its own: the states its records can be in are the task state of `standards-interaction.md`, and this ref carries no second definition of them.

| Unit | The question it answers |
| --- | --- |
| `DSDataTable` | How does a page show many records as one block, with its own search, sort and paging? |
| `DSFilterBar` | How does a page let a person narrow those records, and see what is narrowed? |
| `DSComparison` | How does a page set a few subjects side by side across the same settings, from data alone? |
| `DSFeature` | How does a page make a claim at any level and ask the reader to act, from data alone? |

**Surface's core composites are the data table, the filter bar, the comparison and the feature** (`RULE.SUPPORT.SURFACE.230`, `RULE.SUPPORT.SURFACE.181`). Every stack builds each of them, and the design library draws each of them. A stack may provide further composites of its own, as the core units above state. The web stack has one, `DSListDetail`, which places a list beside the detail of its chosen row. It is not a core unit (`RULE.SUPPORT.SURFACE.099`), and the book states no rule for it: `architecture-containers.md` states what a person sees on such a page.

### DSDataTable

Shows many records as one block: a bar (the control that ticks every record, with its menu of the bulk actions, present only when the table has bulk actions and shows records; then `headerNode`, a place that takes any node the page gives it, such as a search or a filter bar; then the sort, present only when records are shown; then the layout switch), its records (one shape for the whole composite: table, list or grid of cards), and a footer (the count of what is shown, and the pagination).

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
- `DSDataTable` **MUST** take one size, from its own prop or the block above it, and **MUST** pass it to its bar, its records and its pager.
- When its records are shown as a table, `DSDataTable` **MUST** turn the table's `hoverable` prop on. A person acts on a record of this composite, so a row under the pointer says that it answers. A plain `DSTable` leaves it off unless the theme turns it on, because a row that does nothing when it is pressed should not react. The page sets nothing for it, and the theme does not turn it off, because the composite gives the table its `hoverable` and a prop that is given wins over the theme.
- The `striped` of the table layout **MUST** follow the order of the table: the setting where the page gives it, else the value of the theme, which stripes by default (`RULE.SUPPORT.SURFACE.126`).
- The footer **MUST** arrange itself by the width of its own place, as its pager does (`RULE.SUPPORT.SURFACE.133`). In a wide place the count stands at the start and the pager at the end of one line. In a narrow place the count stands on a line of its own above the pager, each in the middle.

#### The three layouts

The records take one of three layouts, and the data decides which. The composite is the same in each: it keeps its bar, its paging and its task states. So a page changes a layout and builds nothing new.

| Layout | Shows one record as | Used when |
| --- | --- | --- |
| `TABLE` | a row of cells, under headings | one record holds several facts a person compares across rows, at a desktop and a tablet |
| `LIST` | a line: a title, with a line of facts under it | one record is read by its name; and on a phone, in place of `TABLE` and of `GRID`; and where the records are many groups a person searches |
| `GRID` | a card | the set is shown as cards, because each record is a thing of its own: a kind to set up, an app, a file with a preview |

- **A page chooses the layout from the data, by the table above** (`RULE.SUPPORT.SURFACE.068`, advice). It lists the layout in the composite's `layouts`, with the columns or the renderer of that layout.
- **On a phone the records fit the `LIST` layout.** A phone has no room for columns, or for cards side by side. At a tablet `TABLE` shows fewer columns, and `GRID` fewer cards across. That `LIST` stands on a phone, also in place of `GRID`, is proposed and not yet confirmed.
- **Many groups that a person searches fit the `LIST` layout, and not `TABLE`** (`RULE.SUPPORT.SURFACE.069`, advice). A group is read by its name, as a line, and the groups stand in a narrow part of the page. A person picks one group and does not compare groups across columns.
- **A line of the `LIST` layout MUST be an item line, `DSItem`** (`RULE.SUPPORT.SURFACE.097`). The page gives the title, the description and the facts of a record, and every list of every data table then reads the same way. The composite's rows carry no padding of their own, and the composite gives each line its room: the padding of an item line above and below, and the inset of the table at its two sides, so the line lines up with the title of the panel it stands in. The item line draws no padding of its own. A block of the page's own in place of an item line stands in the same room.
- **When its records are shown as a list, `DSDataTable` MUST turn `hoverable` on, as it does for a table.** The row under the pointer answers in both layouts. The row carries the reaction, and the item line inside it carries none.
- **A line of the `LIST` layout MUST follow the rules of content of `standards-core.md`.** Its state is a badge on the line of facts, the normal state shows none, and a line stands between each two lines. The composite draws the line between each two lines itself. What a line holds is the page's renderer, so the badge and its place are the page's to write.

**What the composite does.** The composite draws the layouts a page lists, and it reads no device type. The page chooses, and the composite follows what the page lists each time it draws: the layout a person chose while the page still lists it, and the first of the list otherwise. So the page reads the live device, `useDSContext().device`, and lists `LIST` on a phone, and the composite shows the list at once when the screen becomes a phone. The composite does not change to `LIST` by itself. A page that lists `TABLE` alone shows a table on a phone.

#### The record in view

A page may show one record of the table beside the table or under it, such as the detail of an order. The table then marks that record, so a person sees which row the detail belongs to.

- **`DSDataTable` MUST take the id of the record in view, as `selectedRecordId` in the `data` of its config** (`RULE.SUPPORT.SURFACE.125`). The composite compares that id with the id of each record, which it reads through `getRecordId` of its data.
- **The `LIST` layout and the `TABLE` layout MUST draw the row of that record as the row in view,** with the band of a chosen row of a list and `aria-current="true"`. The `GRID` layout ignores the setting.
- **The page MUST give the id, and the composite MUST hold no state for it.** The page usually reads the id from the address. A person who presses a row follows the link or the action of that row, and the page then gives the new id. A page with no record in view gives no id, and no row is marked.
- **The record in view is not a record that a person ticked.** The bulk select of the bar ticks records to act on many of them, and it keeps its own look. A ticked record is checked, and the record in view is selected. A record may be both at once.

#### The bar above the records

- **A control that acts on records MUST be drawn only where there are records to act on** (`RULE.SUPPORT.SURFACE.147`). The control that ticks every record, with its menu, and the sort are not drawn while the first page is read, on a page that came back empty, first or after a filter, or where the read failed or was refused. They stay while a later page is read over records already shown. The layout's control and `headerNode` are drawn in every state, because they do not depend on records. A bar left with nothing to draw draws nothing and takes no height.
- **The control that ticks every record MUST be a bare checkbox on the line of the rows' tick boxes** (`RULE.SUPPORT.SURFACE.148`). It has no border and no fill around it. It is the checkbox a row draws, at the size of the rows, and its start edge and its centre are those of a row's tick box, in the `TABLE` and the `LIST` layout, on a plain page and in a `flush` part. In the `GRID` layout it stands at the start edge of the grid.
- **The checkbox MUST say whether no record, every record or some records of the page are checked.** Some is the mixed state of a checkbox. A press checks every record of the page, also from the mixed state, and clears them where every record is checked.
- **After the checkbox, an icon-only ghost button MUST open the menu of the actions on the checked records.** Its name is its tooltip. A table with no bulk action, or none the person may use, has no tick box on a row and no control in the bar.

#### A search and a filter go to the server

- **A search and a filter of the records MUST be sent to the server** (`RULE.SUPPORT.SURFACE.070`). They **MUST NOT** be run in the page over the records already loaded. The composite holds one page of the records. A search over what is loaded would miss every record on another page, and a person would read *nothing matches* when something does.

The composite asks the page for each page of records through `getData`, with the page number, the records for each page and the sort. The page sends its search and its filters to the server in that same read.

#### A row ends with its actions

- **In every layout the actions of a record MUST stand at the end of its row, its line or its card** (`RULE.SUPPORT.SURFACE.071`). They are shown as icons, or behind one action that opens them. A person then finds them in the same place on every record.
- **What else stands at the end of a row is the page's own** (`RULE.SUPPORT.SURFACE.059`). A badge may stand there with the actions, as the rules of content of `standards-core.md` state.
- **Three more parts of this rule are proposed, and not yet confirmed.** One action stands on the row itself. Two or more go behind one action. A press on a row opens the record.

#### The widths of the columns

- **In the `TABLE` layout, the tick column and the actions column MUST be as wide as what they hold** (`RULE.SUPPORT.SURFACE.134`). Neither column takes a share of the spare width of the table, at any size.
- **The spare width MUST go to the data columns that state no width.** A data column that states a width keeps it.
- **Where every data column states a width, each width MUST be a least width, and the columns share the spare width in proportion to it.** A table narrower than its columns scrolls sideways, and no column is narrower than the width it states.
- **The cells at the two ends of the head MUST take the insets of the cells of the body under them.** So in every column what the head holds starts where what the rows hold starts.

#### The pinned columns

- **Wherever the `TABLE` layout may scroll sideways, the composite MUST pin its tick column at the start edge and its actions column at the end edge** (`RULE.SUPPORT.SURFACE.149`). A person who scrolls a wide table can then still tick a record and reach its actions. The page sets nothing for it, and no setting of the composite turns it on or off. Where the table may not scroll sideways, nothing is pinned.
- **The columns a page pins MUST join the composite's own as one block on each side, with the composite's own column the outermost.** No cell scrolls beneath the actions column.
- **The shadow at the edge of a pinned block MUST be drawn only while content is beneath that edge.** A table that fits its place, and a table scrolled to the end of that side, draw none. A pinned cell draws the fill of its row in every state, so a table that fits looks as a table with no pinned column looks. This holds for every `DSTable` with a pinned column.

#### A value changed in a table is changed in its cell

A row is read until a person chooses to change it.

| Step | What the person sees |
| --- | --- |
| The row is read | each cell shows its value as words, and the action at the end of the row opens the row |
| The row is opened | the cell turns from words into a box as wide as the cell. The action that saves the value stands beside the box, and the action that leaves it unchanged stands after that |
| On a phone | the same table is in its `LIST` layout. A row that is read is a line. The row that is being changed is its text with the box under it, and the same two actions beside the box |

- **A value changed in a table is changed in its cell** (`RULE.SUPPORT.SURFACE.072`, advice). Nothing opens over the page, and the page holds no form.
- **One row is changed at a time.** So one value is saved at a time, and a person always knows what a save will write.

**What the composite does.** `DSDataTable` does this for a value that is text. A page puts `edit` on one column of the `TABLE` layout, and on the `LIST` layout: `getValue(record)`, `onSave(record, value)` and an optional `placeholder`. The composite then adds the action that opens a row, first among the actions at the end of the row. It draws the box and the two actions, keeps one row open at a time, and closes a row that is open when a person opens another, without saving it. After a save it reads its page again. A save that fails keeps the box open with what was typed, and says why. The renderer of the `LIST` layout gets `isEditing` as its second argument, so it leaves the value's own line out of the row that is open. A second column with `edit` in one layout is refused.

**Not there yet.** A value of another kind, such as a choice or a date, is not changed in a cell.

#### The choice table of `DSDataTable`

A data table is chosen by how a person tells its records apart: by comparing their columns, by reading each as a line, or by their picture. Its size is its place's, and its row actions follow how many there are.

**The cases**, read from the top; the first that matches wins.

| The records are | Where it stands | `layouts.mtype` | `settings.size` | `settings.actions.layout` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| compared by their columns: a listing of customers, of orders | a listing's page or a panel | `TABLE` | the place's | `DROPDOWN` | the layout, with `LIST` beside it for a phone | this table |
| read each as one line: a log, a list of members | a panel, or a phone | `LIST` | the place's | `DROPDOWN` | the layout | this table |
| told apart by their picture: products, files | a listing's page | `GRID` | the place's | `DROPDOWN` | the layout | this table |
| a table whose rows hold two or three actions a person takes on most of them | any of the above | the case's | the place's | `ICONS` | the actions' layout | this table |
| a fixed set a person reads and never filters, such as an invoice's lines | — | not this unit: a `DSTable` | — | — | — | this table |

**The limits across a view.** A data table holds one size for the whole composite, as one size for the whole composite states.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `layouts.mtype` | `TABLE` | records compared by their columns |
| `layouts.mtype` | `LIST` | records read as lines, and the table's form on a phone |
| `layouts.mtype` | `GRID` | records told apart by their picture |
| `settings.size` | `XS` to `XL` | the place's |
| `settings.actions.layout` | `DROPDOWN` | a row's actions behind one "⋯" (`RULE.SUPPORT.SURFACE.390`) |
| `settings.actions.layout` | `ICONS` | two or three actions a person takes on most rows, each an icon alone |

### DSFilterBar

A row of fields a person narrows records by. It holds one field for each filter: a text, a choice of one, a choice of several, a yes-or-no, a date, or a range of dates. Each field matches one field of the records underneath. The bar also holds the actions that search and that clear every filter at once.

- A field **MAY** sit inline, or wait behind the action that shows the hidden filters. A bar with many fields keeps the few a person reaches for most, and folds the rest away.
- What is applied **MUST** show back to the person in the bar itself. Each field keeps its chosen value, and on a phone the count on *Filters (n)* says how many are applied.
- A text field **MUST** apply on the key that submits a form. A person who types a search term and presses it does not also have to find a button.

#### The form of the bar

The bar has one form, read from its start to its end. A person who has used one filter bar then knows every other.

| Place in the bar | Holds | Why |
| --- | --- | --- |
| Its start | the filter icon. It is a mark and not an action, so it is round | it says what the bar is, and its round shape tells it from the actions at the end of the bar |
| Its fields | the boxes of the filters in view, which share the width of the bar equally | no filter looks more important than the next, and the bar keeps one shape whatever its fields are |
| After the fields | the action that shows the filters that are hidden | it belongs to the fields, so it stands with them |
| Its end | a line, and after it the two actions that search and clear | the line sets apart the actions that run the filters from the action that only shows more of them |

- **A realization MUST draw the bar in this form** (`RULE.SUPPORT.SURFACE.073`). That a page does not rearrange it is advice. The page gives the bar its fields and says which stay in view.
- **At a tablet the bar MUST hold fewer fields in view, and the rest wait behind the action that shows them.** A tablet has less width than a desktop, so fewer boxes fit across it.
- **On a phone the bar MUST be one button that says how many filters are on, such as *Filters (2)*, with the action that clears them beside it.** A phone has no room for a row of boxes. One button keeps the records in view. Its number tells a person that the records are narrowed before they open anything.

**What the composite does.** `DSFilterBar` draws the fields, the action that shows the hidden ones, the line, and the search and clear actions in this order. Its fields share the width equally. It draws the filter icon in a round shape, as tall as the fields beside it. It keeps in view the fields a page marks `primary`, and beside them a number of the others: up to `moreLimit` at a desktop, three unless the page sets it, and up to `moreLimitTablet` at a tablet, one unless the page sets it. So the bar holds fewer fields at a tablet by itself. On a phone it is the one button: the button opens the fields in a drawer from the bottom of the screen, with the extent `FIT`, so the drawer is as tall as its fields and scrolls only when the window runs out (`RULE.SUPPORT.SURFACE.246`). The size of the bar sets only how dense its controls are, and never how far the drawer reaches. With no filter on, the button reads *Filters* and the clear action is not shown.


### DSComparison

`DSComparison` sets subjects side by side across the same settings: plans against their limits, roles against their permissions. A page gives it data only (`RULE.SUPPORT.SURFACE.181`), and the composite draws a table through `DSTable`, the head of each subject and each group through `DSItem`, and each value through `DSDataFieldView`.

| Setting | The page gives | What the composite draws |
| --- | --- | --- |
| `subjects` | each a `key`, a `header`, the props of `DSItem`, and `actions` where the subject has some of its own | one column for each subject, headed by its item and its actions, after the column of labels |
| `groups` | each a `key`, a `header` where the page gives one, and `rows` | a head row at the level `GROUP`, then its rows |
| `differencesOnly` | a yes-or-no, no by default | only the rows whose values are not all equal |

A row states its kind in `mtype`, which takes `DSComparisonRowType`: `FIELD` gives `config`, an `SPDataFieldConfig`, and `values`, a value or null for each subject by its `key`; `CUSTOM` gives `label`, `renderer`, which draws the cell of one subject, and `compareValue` where the cells should be compared, a function of the subject that returns a plain value or null.

- **The composite MUST draw every value of a `FIELD` row through `DSDataFieldView`.** A page gives the config and the stored values, never a node for a value a field can read. A value that is null, or missing, reads *not set* in the muted tone, translated.
- **A value that differs from the most common value of its row MUST be marked as the cell that stands out in its row, or, where the page gives `baselineKey`, one that differs from that subject's** (`RULE.SUPPORT.SURFACE.184`). A row whose most common value is a tie marks none, and an unknown key marks none. A `CUSTOM` row is compared on the values its `compareValue` returns, by the same rule, and a `CUSTOM` row without `compareValue` is never marked (`RULE.SUPPORT.SURFACE.306`).
- **With `differencesOnly` the composite MUST keep only the rows whose values are not all equal, and every `CUSTOM` row without `compareValue`.** A group with no row left is not drawn, and with no row at all the composite draws the empty state.
- **A subject's `actions` MUST stand in its own head cell, at the end beside its item, and take their size and look from the place as the actions in the head of a card do** (`RULE.SUPPORT.SURFACE.193`). The head is a header of the level the composite stands at: the item at the start and the actions as one group at the end, below the item on a phone. A button writes no size, no variant and no class; a head with actions and a head without stand at one height; a `DSItem` holds no action, so the actions belong to the head that holds it.
- **The first column MUST hold the label of each row and stay pinned while the subjects scroll sideways.**
- **The composite fills a `flush` content part of a panel, as `DSDataTable` does.** A set that needs paging, a search or a sort is a data table.

### DSFeature

`DSFeature` pitches one thing and ends on what to do: a hero, the head of a section with its items, a closing call, the tile of an integration. A page that draws these by hand gives each its own sizes and its own phone size, so no two match. A page gives the feature data only, and its level and its form are all it chooses about how it looks (`RULE.SUPPORT.SURFACE.233`).

| Part of DSFeature | Holds | Its prop |
| --- | --- | --- |
| An eyebrow | the line over the title: one of the item line's facts, such as a badge or a short phrase. At `PAGE` and `CONTAINER` a `TEXT` eyebrow stands out, semibold in the primary tone where the fact sets no `color`; a state such as Alpha, New or Beta is a `BADGE` eyebrow in `PRIMARY` (`RULE.SUPPORT.SURFACE.290`); a grid cell's eyebrow is ruled once, in `site-patterns.md` | `eyebrow` |
| A title and a description | the claim in one colour, and a sentence under it | `title`, `description` |
| Facts | one quiet line of short facts | `facts`, `factsPlacement` |
| Items | item lines drawn inside the feature, at a level the feature gives them by its own, given as one group | `items` |
| A part of the page's own | a node in the place of the items: a stepper is `DSStepper`, given as the `contentNode` | `contentNode` |
| Actions | what to do next, the main action first, after the items or before them | `actions`, `actionsPlacement` |
| Media | a small picture in the item line's shape, or a node of art as wide as the feature | `media`, `mediaNode` |
| The whole feature as a link | the feature pressed as one tile | `anchor` |
| A frame | the fill, the edge and the corners around the words, the media, or both | `frames`, `surface` |
| Its size, its form and its alignment | the level that sizes it, where the media stands against the words, where the text lines up inside its place, and where the two columns of a split stand against each other | `pageLevel`, `type`, `textAlign`, `verticalAlign` |

`type` takes `DSFeatureType` and `textAlign` takes `DSHorizontalAlignType` (`START` · `CENTER` · `END`; `START` when unset), `pageLevel` takes `DSPageLevelType` (unset, the level of the box it stands in, and `PAGE` straight on a page), `factsPlacement` takes `DSItemFactsPlacementType` (`AFTER_DESCRIPTION` when unset), `actionsPlacement` takes `DSFeatureActionsPlacementType` (`BEFORE_ITEMS`, `AFTER_ITEMS`; `AFTER_ITEMS` when unset) and `frames` takes `DSFeaturePartType` (`TEXT`, `MEDIA`; none when unset). `surface` is an `IDSFrameSurface`, and a key it leaves out takes the design system's fixed feature default, `FEATURE_SURFACE_DEFAULT`: `BASE`, `SUBTLE`, flat, rounded. `eyebrow` is one `IDSItemFact`, `items` is one group, `IDSFeatureItemsProps`, below, and `actions` are the props of `DSButton` whole but `size`, each with a `key`. The `items` prop is one group, `IDSFeatureItemsProps`, built from the feature's own words so that a wrapper can take it whole. Its keys are:

| Key | Takes | What it decides |
| --- | --- | --- |
| `nodes` | `IDSFeatureItem[]`: the props of `DSItem`, whole, but `pageLevel`, `orientation` and `backAnchor`, and a `key`, and `selected` | the items, in the order they are drawn |
| `type` | `DSFeatureItemsType`: `GRID` · `LIST` · `STATS`. `GRID` when unset | how the items are drawn |
| `numbered` | yes or no. No by default | whether the numbers 1 to n stand before the titles, as text. `GRID` and `LIST` only |
| `orientation` | `DSOrientationType`. Unset, `VERTICAL` for `GRID` and `HORIZONTAL` for `LIST` | how every item stands |
| `borderType` | `DSGridBorderType`: `NONE` · `GRID` · `EDGE`. Unset, `GRID` for `LIST` and `NONE` for `GRID` and `STATS` | the lines between the items, and around them with `EDGE`. Not read where `surface` is set |
| `surface` | `IDSFrameSurface`: `color` · `strength` · `raised` · `elevation` · `bordered` · `rounded`. A key left out takes the card's theme | each item in a frame of its own, the level's gap apart; a boxed item's room lies inside its frame (`RULE.SUPPORT.SURFACE.284`) |
| `gridColumns` | `IDSGridColumns`: `desktop`, `tablet` and `mobile`, each from 1 to 4. Left out, the count of the items decides the desktop number: one for one item, two for two or four, three for any other count; the tablet is that number held to two, and a phone is one | how many columns a `GRID` and `STATS` stand in at each screen class. A `LIST` is one column |

The level the feature gives its items is part of the prop's comment: `WIDGET` under `PAGE` and `CONTAINER`, `GROUP` under `WIDGET`, `CONTENT` under `GROUP` and `CONTENT`, `INLINE` under `INLINE`.

A node a page hands in ends in `Node`, so the node of art is `mediaNode` and `media` is data, as on `DSItem`. `DSFeatureItemsType` takes `type` inside the `items` group, where the group is the owner of the word.

#### The level and the form

- **A feature MUST be sized by its `pageLevel` alone, and placed by its `type`** (`RULE.SUPPORT.SURFACE.233`). The level sets the size of the title, the step of the description, the gaps, the room between the items and the level they are drawn at, the box of a small picture, the size of the buttons and the inset of a frame. A page writes no type step, no gap and no class for any of them.
- **A feature MUST keep every level of `DSPageLevelType`, and `CONTENT` and `INLINE` keep a look of their own** (`RULE.SUPPORT.SURFACE.252`). The look of `CONTENT` and `INLINE` is the item line's rows, so a small feature stands in a small place; there is no narrower vocabulary of levels for a feature.
- **A feature MUST draw the type the level allows, and a type the level does not allow MUST draw as the default of that level.** The design system warns in development. A type is only ever added to the vocabulary.

| `type` | Where the media stands | `PAGE` | `CONTAINER` | `WIDGET` | `GROUP` | `CONTENT` · `INLINE` |
| --- | --- | --- | --- | --- | --- | --- |
| `SPLIT_END` | the words at the start, the media at the end, side by side | default | default | — | — | — |
| `SPLIT_START` | the media at the start, the words at the end | allowed | allowed | — | — | — |
| `MEDIA_TOP` | the media over the words, the width of the feature | — | allowed | default | default | default |
| `MEDIA_BOTTOM` | the words over the media | allowed | allowed | allowed | allowed | — |
| `BACKDROP` | the media fills the feature and the words stand over it | allowed | allowed | — | — | — |
| `ITEMS_SPLIT_END` | the words across the feature; under them the items at the start and the media at the end, side by side | allowed | allowed | — | — | — |
| `ITEMS_SPLIT_START` | the words across the feature; under them the media at the start and the items at the end | allowed | allowed | — | — | — |

- **A small media MUST stand in a square of the level's box, on step 1 of the surface, with `MEDIA_TOP` at `GROUP` and below.** At `PAGE`, `CONTAINER` and `WIDGET` the media is drawn as given.
- **The side of a small picture MUST be one box per level, whatever lines the feature has** (`RULE.SUPPORT.SURFACE.274`, which replaces the sizing of `RULE.SUPPORT.SURFACE.253`). The picture is a mark, an avatar, a group of avatars or a bare icon. It stands above or beside a column of words in every type, never on the words' own line, so the lines under the title do not size it: it is 80, 64, 56, 44, 32 and 28px at `PAGE`, `CONTAINER`, `WIDGET`, `GROUP`, `CONTENT` and `INLINE`. A bare icon is the step nearest half the side, and a tie goes to the larger step: 40, 32, 32, 24, 16 and 14px. No form of the text picks a size; the vertical `DSItem` takes one box per level too (`RULE.SUPPORT.SURFACE.278`). A `mediaNode` is art and is not sized by it.
- **`BACKDROP` MUST keep the words readable.** The words stand over the media where `textAlign` puts them, on a scrim of the surface's own fill, and on a phone the scrim covers the whole width. From the tablet up the scrim follows the words: with `START` it is full at the start of the reading direction and clear at its end, so a right-to-left page has it on the right; with `END` it is the mirror, full at the end; with `CENTER` it is an even wash across the whole feature.
- **In `ITEMS_SPLIT_END` and `ITEMS_SPLIT_START` the words MUST stand across the feature, and `textAlign` MUST line up the words alone** (`RULE.SUPPORT.SURFACE.233`, `RULE.SUPPORT.SURFACE.248`). The eyebrow, the title, the description, the facts and the actions before the items stand across; the items, or a `contentNode`, and the actions after them stand at the start of their column beside the media. The columns are `1.1fr` to `1fr` from the tablet up, mirrored for the start. With no items and no `contentNode` nothing is split, and the feature draws as `SPLIT_END` or `SPLIT_START`.
- **A split MUST stand its two columns by `verticalAlign`: `TOP`, `CENTER` or `BOTTOM`, `CENTER` when unset** (`RULE.SUPPORT.SURFACE.248`). It is read in `SPLIT_END`, `SPLIT_START`, `ITEMS_SPLIT_END` and `ITEMS_SPLIT_START`, and nowhere else. The row is as tall as its taller column, so one value moves the shorter one.
- **The text MUST align inside the place its type gives it, by `textAlign`, and `BACKDROP`'s scrim MUST follow it** (`RULE.SUPPORT.SURFACE.248`). `textAlign` takes `DSHorizontalAlignType`: `START`, the default, `CENTER` or `END`, read in the reading direction, so `END` on a right-to-left page stands at the left. It applies in every type, and in a split inside the text's column; in `ITEMS_SPLIT_END` and `ITEMS_SPLIT_START` it moves the words across the feature alone, and the split under them stands at the start. It moves the eyebrow, the title, the description and the facts, the row of actions, and a small `media` in the level's box. A wide `mediaNode` stands where the type puts it. The items, `items` or a `contentNode`, keep their own layout: the block of items takes the width of the text part and is not aligned again. A centred pitch is a type with `textAlign` `CENTER`, so the type answers one question, where the media stands.

| Level | Title: step, desktop · phone | Description | Eyebrow, and facts after the title | To the description | To facts below | Before the actions | Words to media | Inset, framed | Box of a small media | Buttons | Items at | An item: title over description | Between two items | `STATS`: number over label |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PAGE` | `HEADING_XXL3`, 64 · 44px | `CONTENT_XXL`, 20px | 8px | 8px | 12px | 40px | 64px | 40px | 80px | `LG` | `WIDGET` | 16px over 14px, `h3` | 24px | 40px over 18px |
| `CONTAINER` | `HEADING_XL`, 40 · 32px | `CONTENT_XL`, 18px | 8px | 8px | 12px | 32px | 48px | 32px | 64px | `LG` | `WIDGET` | 16px over 14px, `h3` | 24px | 22px over 16px |
| `WIDGET` | `HEADING_SM`, 22px | `CONTENT_LG`, 16px | 2px | 2px | 2px | 24px | 24px | 24px | 56px | `MD` | `GROUP` | 14px over 14px, `h4` | 16px | 18px over 14px |
| `GROUP` | `HEADING_XS`, 18px | `CONTENT_MD`, 14px | 2px | 2px | 2px | 16px | 16px | 16px | 44px | `SM` | `CONTENT` | 13px over 13px, no tag | 12px | 13px over 13px |
| `CONTENT` | the item line's row, 13px | the item line's row, 13px | 2px | 0px | 2px | 12px | 12px | 12px | 32px | `SM` | `CONTENT` | 13px over 13px, no tag | 12px | 12px over 12px |
| `INLINE` | the item line's small row, 12px | the item line's small row, 12px | 2px | 0px | 2px | 12px | 12px | 12px | 28px | `XS` | `INLINE` | 12px over 12px, no tag | 12px | 12px over 12px |

A frame pads by the room before the actions (`RULE.SUPPORT.SURFACE.273`), so the edge stands from the words as far as the words stand from the buttons; from `WIDGET` down it pads as a card of size `XL`, `MD`, `SM`, `SM`.

The three gaps of the words are the item line's own block from `CONTENT` down (`RULE.SUPPORT.SURFACE.272`): a heading step's line height (1.2) leaves less room under the title than an item's title step (1.3), so `WIDGET` and `GROUP` keep 2px to look as an item does, and only `PAGE` and `CONTAINER`, the display sizes, keep 8px and 12px of air. They are no tokens.

Each of these but the box of a small media is a token of the level (`architecture-core.md`), and the title is a type step, so its phone size follows with nothing written.

#### The items, the actions and the facts

- **A feature MUST draw its items as item lines at a level it gives them by its own, and each level MUST take the heading element of its own level** (`RULE.SUPPORT.SURFACE.235`). A `PAGE` or a `CONTAINER` feature gives `WIDGET`, a `WIDGET` feature gives `GROUP`, a `GROUP` or a `CONTENT` feature gives `CONTENT`, and an `INLINE` feature gives `INLINE`; the table above gives the size of each. The items are inner content, so they stand a step or more below the feature and never larger than `WIDGET`. Only the room between two items follows the feature's level, not the items' own, and it is the frame padding of the level the items are drawn at (`RULE.SUPPORT.SURFACE.275`): 24px at `PAGE` and `CONTAINER`, 16px at `WIDGET`, 12px at `GROUP`, `CONTENT` and `INLINE`. The feature and each item take the heading element of their own level: `h1` at `PAGE`, `h2` at `CONTAINER`, `h3` at `WIDGET`, `h4` at `GROUP`, and none at `CONTENT` and `INLINE`, so an item's element follows the level the feature gives it: `h3` under `PAGE` and `CONTAINER`, `h4` under `WIDGET`, none under the rest. A feature uses items mostly at `PAGE` and `CONTAINER`, one or two at `WIDGET` and seldom at `GROUP`; no rule in code enforces it, and the showcase shows it.
- **`items.type` MUST decide how the items stand.** `GRID` stands them side by side in the columns `items.gridColumns` asks for, and where the page asks for none, in as many columns as there are items, up to three, with four items in two rows of two. `LIST` stands them one under another with a line between each two. `STATS` stands them side by side, each title a number and each description its label, at the sizes of the level one below the feature's own (the last column of the table above), so a hero's numbers stay large and a number is never a size the page picks.
- **The feature MUST give the orientation to every item, and an item MUST NOT set its own.** `items.orientation` is `VERTICAL` for `GRID` and `HORIZONTAL` for `LIST` where it is unset. So a grid never mixes an item that stands up with one that lies down.
- **`items.numbered` MUST draw the numbers 1 to n as text on the title's line,** in the title's size and weight and the muted tone. It applies to `GRID` and `LIST` only, and `STATS` draws none. A stepper with a bar from one number to the next is `DSStepper`, given as the `contentNode`.
- **`items.gridColumns` MUST follow the screen class, and never a measured width** (`RULE.SUPPORT.SURFACE.269`, `RULE.SUPPORT.SURFACE.271`). The live device picks the desktop, tablet or mobile number. A number above 4 is read as 4 and one below 1 as 1. The feature's items, the grid section and every other grid share one map of columns.
- **A `VERTICAL` item and a statistic MUST line up as the feature's heading does, and a `HORIZONTAL` item MUST stand at the start** (`RULE.SUPPORT.SURFACE.269`). Under `textAlign` `CENTER` each vertical item's picture, title, description and facts stand centred, under `END` at the end, and under `START` at the start. A `HORIZONTAL` item is a row: its icon and words line up at the start at every `textAlign`, and its group still stands where `textAlign` puts it.
- **The items of a `GRID` and of `STATS` MUST keep a width of at most one column width per column, and stand where `textAlign` puts them** (`RULE.SUPPORT.SURFACE.269`). The column width is 20rem, one value of the design system. The width is an upper bound: a narrower place still steps the columns down by its own width.
- **The items of a `LIST` MUST take the width of the text part, at most `62ch`, the measure of the description** (`RULE.SUPPORT.SURFACE.291`). A `LIST` is a grid of one column, but the column cap is a grid's rule, so a row reads as wide as the description above it and no wider.
- **A feature's items MUST be parted in one of four ways on every form, and the defaults MUST stay as they were** (`RULE.SUPPORT.SURFACE.269`). `NONE` stands the items one room apart, the frame padding of the level the items are drawn at. `GRID` draws a line between each two. `EDGE` draws the lines between them and one around the outside, rounded with the theme's corners. Boxed, which is `surface` set, puts each item in a frame of its own, that room apart, and `borderType` is then not read. A `LIST` draws `GRID` where `borderType` is unset, and a `GRID` and `STATS` draw `NONE`.

| Form | `NONE` | `GRID` | `EDGE` | Boxed |
| --- | --- | --- | --- | --- |
| `GRID` (columns) | the default | lines between the cells | a bordered table | a grid of item cards |
| `LIST` (one under another) | the gap only | the default: a line between each two | a bordered list | stacked item cards |
| `STATS` (numbers in a row) | the default | lines between the numbers | a bordered strip | each statistic in a card |

- **Boxed items MUST be cards, and a card MUST be pressable only where the item has an anchor.** A `GRID` or `LIST` item is a `DSItemCard`: it is pressed, and lit under the pointer, where it has an `anchor`, and marked as chosen where its `selected` is set. `selected` is read only where the items are boxed on a `GRID` or a `LIST`. A statistic is a `DSCard` and is never pressable. A key of `surface` left out takes the card's theme.
- **Where there are lines, each cell MUST draw its own,** so a short last row keeps its lines at every width and no rule counts the cells (`RULE.SUPPORT.SURFACE.259`).
- **`contentNode` MUST stand where the items stand, in place of them.** A feature with both draws the node.
- **A feature's actions MUST stand after its items, or before them where `actionsPlacement` is `BEFORE_ITEMS`** (`RULE.SUPPORT.SURFACE.251`). `AFTER_ITEMS`, the default, closes the feature on what to do: the words, the facts, the items, then the actions. `BEFORE_ITEMS` puts the actions under the words and the items under them, so a hero leads with its call and its items prove it after. A `contentNode` in the place of the items moves the same way. `textAlign` aligns the row of actions in either place.
- **A feature's actions MUST be data, and each MUST take its size from the level** (`RULE.SUPPORT.SURFACE.234`). The buttons are `LG` at `PAGE` and `CONTAINER`, `MD` at `WIDGET` and `SM` at `GROUP`. The main action stands first, and a feature leads with at most one `SOLID` `PRIMARY`. An `href` draws a link, and a function draws a button. On a `SOLID` fill the surface gives every button the colours that read on it.
- **A feature MAY take `facts` and `factsPlacement` of its own** (`RULE.SUPPORT.SURFACE.236`): after the description where `factsPlacement` is `AFTER_DESCRIPTION`, the default, and under the title where it is `AFTER_TITLE`.
- **A feature MAY take an `anchor`, and then it MUST take no `actions`** (`RULE.SUPPORT.SURFACE.236`). The whole feature is then pressable as a tile, and a link cannot hold another link or a button.
- **A feature MAY take a small `media` in the item line's shape of `DSItemMediaType`,** drawn in the box of its level, and a `mediaNode` for art that is drawn as given.

#### The phone and the frame

- **A feature MUST fold its form on a phone by its type, and it MUST read no device** (`RULE.SUPPORT.SURFACE.237`). `SPLIT_END` becomes `MEDIA_BOTTOM`, `SPLIT_START` becomes `MEDIA_TOP`, `ITEMS_SPLIT_END` becomes one column of the words, the items, then the media, `ITEMS_SPLIT_START` one column of the words, the media, then the items, and every other type keeps its shape. The size of the title on a phone is the phone value of its type step, and a page never chooses a smaller step for a phone.
- **A feature MAY reveal its parts through `reveal`, and it MUST play once, the words first, then the media, then the items** (`RULE.SUPPORT.SURFACE.282`). `reveal` is `IDSFeatureRevealProps`: `text` (`NONE`, `FADE`, `RISE`), `media` (adds `SLIDE`, `ZOOM`) and `items` (`NONE`, `FADE`, `RISE`, `ZOOM`), each a member of `DSMotionType`, and nothing moves when it is left out. Items come in 60 ms apart, and from the sixth on together. The words are in the page before any script runs.
- **A view holds at most one `SOLID` button, its main action** (`RULE.SUPPORT.SURFACE.370`, advice), as *The button, and its choice table* states with the button's cases, and a feature's buttons are that rule's case for a feature.
- **A feature's buttons follow its level, as the case of a feature for that rule** (`RULE.SUPPORT.SURFACE.287`, advice). The primary is the only `SOLID` in view, and an arrow stands only on a link that goes somewhere.

| Level | How many | Their look | Their arrows |
| --- | --- | --- | --- |
| `PAGE` | 1 to 2 | one `SOLID` primary with no icon, then `OUTLINE` | a secondary that leaves the site: `ARROW_UP_RIGHT`, `NUDGE_UP_END` |
| `CONTAINER` | 0 to 2 | `OUTLINE`, then `GHOST`; `SOLID` only in a closing band | onward `ARROW_RIGHT`, `NUDGE_END`; leaving `ARROW_UP_RIGHT`, `NUDGE_UP_END` |
| `WIDGET` | 0 to 1 | `GHOST` or `LINK`, or the whole card is the link | `ARROW_RIGHT`, `NUDGE_END` |
| `GROUP`, `CONTENT`, `INLINE` | 0 to 1 | `LINK` | the same arrows |

A label starts with a verb, is 1 to 3 words and names where it goes.
- **A feature's items follow their form** (`RULE.SUPPORT.SURFACE.287`, advice). `GRID` is for parallel features, 3, 4 or 6; `LIST` for a sequence or steps, numbered, 3 to 6; `STATS` for numbers that prove a claim, 3 to 4; inside a `WIDGET` 2 to 4. Icons stand on all the items or on none, and a boxed item keeps the same budget as a plain one. The words follow the length by level in `standards-core.md`.
- **A feature MUST frame nothing unless its `frames` lists a part, and it MUST take its paint from its `surface`, else from the design system's fixed feature default, `FEATURE_SURFACE_DEFAULT`** (`RULE.SUPPORT.SURFACE.240`, `RULE.SUPPORT.SURFACE.262`, `RULE.SUPPORT.SURFACE.277`). `frames` lists the parts the frame holds, and it is empty where it is left out: only a panel takes its frames from the theme. There is no `unframed`, because there is no theme default to take a part out of. The inset of a frame is the room before the actions at the level. There is no `divided`. Left unset, a key of the surface never falls back to the look of the panel or the card the feature stands in, and the theme holds no feature look (`architecture-app.md`).
- **It is not a grid of features.** Features stand side by side in a grid section, `DSFeatureGridSectionContainer` (`architecture-containers.md`). Pricing tables and carousels are not its job.

#### The choice table of `DSFeature`

A feature is chosen by the level it stands at and by what proves its claim: a picture, items, or the product running. The level gives its sizes and the forms it may take, and the type says where the media stands.

**The cases**, read from the top; the first that matches wins.

| The feature is | Where it stands | `pageLevel` | `type` | `textAlign` | `verticalAlign` | `actionsPlacement` | `factsPlacement` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a hero: the claim of a page, with its media beside it | the top of a site's page, or a band | `PAGE` (the place's) | `SPLIT_END` (the level's) | `START` (the unit's) | `CENTER` (the unit's) | `AFTER_ITEMS` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | the words, the media and the actions, one `SOLID` `PRIMARY` first | `RULE.SUPPORT.SURFACE.234` |
| a hero whose words stand over a picture that fills it | the top of a site's page | `PAGE` (the place's) | `BACKDROP` | `START` (the unit's) | `CENTER` (the unit's) | `AFTER_ITEMS` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | the type and the picture | this table |
| a hero whose actions lead before its items, such as a sign-up over its proofs | the top of a site's page | `PAGE` (the place's) | `SPLIT_END` (the level's) | `START` (the unit's) | `CENTER` (the unit's) | `BEFORE_ITEMS` | `AFTER_DESCRIPTION` (the unit's) | the actions' place | this table |
| a band of a page with its words centred over a grid of items or a picture | a band of a site, or a panel | `CONTAINER` (the place's) | `MEDIA_BOTTOM` | `CENTER` | `CENTER` (the unit's) | `AFTER_ITEMS` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | the type and the alignment | this table |
| a band whose words and media stand side by side, the media first | a band of a site | `CONTAINER` (the place's) | `SPLIT_START` | `START` (the unit's) | `CENTER` (the unit's) | `AFTER_ITEMS` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | the type | this table |
| a band whose words run across, over its items and its media side by side | a band of a site | `CONTAINER` (the place's) | `ITEMS_SPLIT_END` or `ITEMS_SPLIT_START` | `START` (the unit's) | `TOP` where the items are taller | `AFTER_ITEMS` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | the type, and the alignment | this table |
| a card that sells one thing, with a picture over its words | a cell of a grid | `WIDGET` (the place's) | `MEDIA_TOP` (the level's) | `START` (the unit's) | `CENTER` (the unit's) | `AFTER_ITEMS` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | the words and the media | this table |
| a feature whose facts say what it is before its sentence, such as a plan's price | any level | the place's | the level's | `START` (the unit's) | `CENTER` (the unit's) | `AFTER_ITEMS` (the unit's) | `AFTER_TITLE` | the facts' place | `RULE.SUPPORT.SURFACE.242` |
| a record's head on an app's page | — | not a feature: an item line at `PAGE` | — | — | — | — | — | — | `RULE.SUPPORT.SURFACE.209` |

**The limits across a view.** A feature leads with at most one `SOLID` `PRIMARY` (`RULE.SUPPORT.SURFACE.234`), and a site's page holds one hero, which its closing call repeats (the site patterns).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `pageLevel` | `PAGE` · `CONTAINER` · `WIDGET` | a hero; a band or a panel; a card of a grid |
| `pageLevel` | `GROUP` · `CONTENT` · `INLINE` | the place's: a feature inside a part of a card or a row takes the level of its box |
| `type` | `SPLIT_END` | a hero; the default at `PAGE` and `CONTAINER` |
| `type` | `BACKDROP` · `SPLIT_START` · `MEDIA_BOTTOM` | each by its case |
| `type` | `ITEMS_SPLIT_END` · `ITEMS_SPLIT_START` | words across, over items and media side by side |
| `type` | `MEDIA_TOP` | a card of a grid; the default from `WIDGET` down |
| `textAlign` | `START` | every case but a centred band. It is the unit's own default |
| `textAlign` | `CENTER` | a band centred over a grid or a picture |
| `textAlign` | `END` | words beside media at the start, on a site that sets them against the end |
| `verticalAlign` | `CENTER` | every split. It is the unit's own default |
| `verticalAlign` | `TOP` | a split whose items stand taller than its media |
| `verticalAlign` | `BOTTOM` | no case written yet: a split's columns meet at their middle or their top, where a person starts to read |
| `actionsPlacement` | `AFTER_ITEMS` | every case but a sign-up hero. It is the unit's own default |
| `actionsPlacement` | `BEFORE_ITEMS` | a hero whose actions lead its proofs |
| `factsPlacement` | `AFTER_DESCRIPTION` | every case but a plan's price. It is the unit's own default |
| `factsPlacement` | `AFTER_TITLE` | facts that say what the feature is before its sentence (`RULE.SUPPORT.SURFACE.242`) |

## The item line, the badge and the mark — 🔮

Three things show a record and its facts on most pages: a line for the record, a badge for a state, and a mark for a picture. Each has one form here. These are the blocks that carry the rules of content of `standards-core.md`.

### The item line

The item line, `DSItem`, shows one thing as a line. It takes no `selected`: in a list the row is the chosen one, and the row carries the fill (`RULE.SUPPORT.SURFACE.097`).

| Part of the item line | Holds | Its prop on `DSItem` |
| --- | --- | --- |
| A picture | a picture or an icon of the thing, at the start of the line | `media`, given as data of one kind |
| An eyebrow | one fact over the title, such as a kind or a period, at the facts step of the level | `eyebrow` |
| A title | the name of the thing | `title` |
| A description | a short summary of the thing, under its title, drawn whole | `description` |
| A line of facts | the short facts of the thing, under its description, or under its title where `factsPlacement` says so, with a dot between each two. A badge stands among them, before the other facts | `facts`, `factsPlacement` |
| The end | what stands at the end of the line: the actions of the thing, a badge, or both | `endNode` |
| An arrow | a chevron after the actions, on a line that leads somewhere | `showArrow` |

- **A page MUST give the parts of an item line to these props, and the block places them in one order** (`RULE.SUPPORT.SURFACE.064`). A person then reads every line of every list the same way.
- **The line of facts MUST be given to `facts`, and the block MUST place it after the title and the description** (`RULE.SUPPORT.SURFACE.086`). The order under the picture is the title, the description, then the facts. A line that has a description and facts then shows both. A badge is one of the facts, so it needs no place of its own on the block.
- **A fact MUST be given in one of four forms, and the block draws each form the same way on every line** (`RULE.SUPPORT.SURFACE.096`). A page gives the fact as data, and never as a block it has styled itself. The forms `TEXT`, `BADGE` and `CUSTOM` are the values of `DSItemFactType`, on the fact's `mtype`.

  | Form | What the page gives | What the block draws |
  | --- | --- | --- |
  | Plain words | the words alone | the words, in the muted tone |
  | `TEXT` | `text`, and where it needs them a `label`, a `color`, a `startIcon` and an `endIcon` | the words in the muted tone, or in the `color` the page gives, with the icons at their two sides. A `label` stands before the words with a colon, as *Members: 12* |
  | `BADGE` | `text`, and where it needs them a `color`, a `customColor`, a `variant`, a `startIcon` and an `endIcon` | a badge, at the size of the level of the line. A `variant` that is given wins; else `QUIET` at `PAGE` and `CONTAINER`, and `SUBTLE_OUTLINE` at the others. The page chooses its colour, its icons and its variant, and never its size |
  | `CUSTOM` | `node`, a block of the page's own | the block as it is given, in its place on the line |

- **The words, the label and the icons of a fact MUST take the muted tone, unless a `TEXT` fact gives a `color`, and the dot between two facts the subtle tone** (`RULE.SUPPORT.SURFACE.141`). The facts are small text that a person reads, and the subtle tone does not reach 4.5 to 1 there.
- **A fact MAY carry its label before it, where the value cannot be read alone.** A count, a date and a person are such values. A state, a kind and a code are read alone and take no label. This is the one place a title stands beside its value.
- **A fact that is empty MUST be left out, with its dot.**
- **The picture of an item line MUST be given to `media` as data of one kind, and never as a block the page has sized** (`RULE.SUPPORT.SURFACE.130`). The picture states its kind in `mtype`, which takes `DSItemMediaType`. The item draws the unit of that kind, so the heads of two pages hold one picture at one size.

  | Kind | What the page gives | What the block draws |
  | --- | --- | --- |
  | `ICON` | the icon, and nothing else | the icon alone, with no background, on the line of the title, at the size of its level, as the table of a bare icon below states |
  | `MARK` | what a mark takes that is not a size: its icon or its text, its colour, its variant, its shape and its accessible name | a `DSMark`, at the scale size the level and the rows of the text give. It is a rounded square where the page names no shape |
  | `AVATAR` | what an avatar takes that is not a size: the name it stands for, the address of its picture, and what else an avatar takes | a `DSAvatar`, at that scale size |
  | `AVATAR_GROUP` | what a group of avatars takes that is not a size: its avatars, and how many it shows at most | a `DSAvatarGroup`, at that scale size |
  | `CUSTOM` | `node`, a block of the page's own | the block as it is given, in the place of the picture. The item does not size it |

- **A kind of picture MUST hold no size and no scale size.** The item owns the size of its picture, from its `pageLevel` and the rows of its text. A page that needs a picture the item does not know gives `CUSTOM`, and that picture is the page's to size.
- **The start of an item line MUST be one place that one prop fills, and `DSItem` MUST take no `startIcon`.** An icon alone is the kind `ICON` of `media`. `media` takes a block in no way but `CUSTOM`. Each stack states the fields of each kind in its own docs.
- **`DSItem` MUST take what stands at its end as `endNode`, a node, and it takes no prop named `actions`** (`RULE.SUPPORT.SURFACE.131`). The node stands at the end of the line and outside the link of the line, so a control in it runs alone and does not follow the link. The page gives the node as it is, and the item line reads nothing inside it. It holds the actions of the thing, a badge, or both. The row of a list takes `endNode` under the same name.
- **What stands at the end of an item line is data: a badge, a count, a status, and never an action** (`RULE.SUPPORT.SURFACE.059`, `RULE.SUPPORT.SURFACE.087`, `RULE.SUPPORT.SURFACE.178`). A line that leads to a page shows the arrow of `showArrow` where its row holds no action. A row that has an action gives it at the end of the row and shows no arrow. Where the end holds a badge alone, the page may show the arrow too. The arrow is no state: it stands on a line that leads somewhere when it is pressed, and a line that leads nowhere shows none. A row of `DSList` takes `showArrow` the same way, and in a list the arrow is the row's.
- **The header of a record and a line of a list MUST have the same shape: a picture, a title, a line under it, and what stands at its end.** A person who has read a list can read the page of one record.

- **An item line MUST cut nothing it draws, and the page decides what its words say** (`RULE.SUPPORT.SURFACE.111`). There is no ellipsis and no clamp to a number of lines. A long title wraps, a long description wraps, and the facts wrap to a further line, each dot staying with the fact before it. The item line takes no prop for a number of lines. A page that wants the heads of a row of cards at one height gives each a description of one length.

One item line serves every level of a page, and `pageLevel` says which one it stands at. It takes the vocabulary `DSPageLevelType`, as the names (`architecture-names.md`) state. The item line has no `size`, so the level is all a page chooses about its look.

| `pageLevel` | The item line is the title of | Its title | Its description | Its facts | A badge in its facts | A mark |
| --- | --- | --- | --- | --- | --- | --- |
| `PAGE` | the whole page, such as the header of a record or of a listing that is the page | `HEADING_SM`, 22px | `CONTENT_LG`, 16px | `CONTENT_MD`, 14px | `MD` | `QUIET` |
| `CONTAINER` | a panel, and a dialog, a sheet or a drawer | `HEADING_XS`, 18px | `CONTENT_LG`, 16px | `CONTENT_MD`, 14px | `MD` | `QUIET` |
| `WIDGET` | a widget or a card, and a confirmation | `TITLE_LG`, 16px | `CONTENT_MD`, 14px | `CONTENT_MD`, 14px | `SM` | `SUBTLE` |
| `GROUP` | an inner part of a widget, such as the head of a part of a card | `HEADING_XXS`, 14px, in the quiet tone where no description stands under it, else the body tone | `CONTENT_MD`, 14px | `CONTENT_MD`, 14px | `SM` | `SUBTLE` |
| `CONTENT` | a row among others, such as a row of a list or of a card. It is the default | `TITLE_SM`, 13px | `CONTENT_SM`, 13px | `CONTENT_SM`, 13px | `XS` | `SUBTLE` |
| `INLINE` | a value inside another unit, such as a row of a popover, of a menu or of a cell | `TITLE_XS`, 12px | `CONTENT_XS`, 12px | `CONTENT_XS`, 12px | `XS` | `SUBTLE` |

- **The `pageLevel` of an item line MUST alone decide the type of its title, its description and its facts, the size of a badge among its facts, and the size of its picture** (`RULE.SUPPORT.SURFACE.094`). A page chooses the level, and writes no type step, no badge size and no scale size. `DSItem` takes no `size`. So the header of a record, the title of a panel, of a widget and of a group, and a row keep one shape on every page. The titles run 22, 18, 16, 14, 13 and 12px from the page down to a small row.
- **The description of an item line at `GROUP` MUST be `CONTENT_MD`, 14px** (`RULE.SUPPORT.SURFACE.239`). The words of a website are 14px or larger, and an item line at `GROUP` heads a part of a page's own words, so its description keeps that floor. A feature draws its items at `WIDGET` under `PAGE` and `CONTAINER` and at `GROUP` under `WIDGET`, whose descriptions are `CONTENT_MD` too. Under a `GROUP` or a `CONTENT` feature the items are at `CONTENT`, 13px over 13px, and under an `INLINE` feature at `INLINE`, 12px over 12px: the one place the floor is waived, because items are seldom used there. The description at `CONTENT` stays 13px.
- **The title MUST take the body tone, and the title of a group the quiet tone only where no description stands under it. The description MUST take the quiet tone at every level but `INLINE`, where it and the facts take the muted tone** (`RULE.SUPPORT.SURFACE.143`, `166`). So the bold 14px title that heads a part of a card stands a step back from the rows under it, while a group item with a description is an entry and its title takes the body tone, so it stands apart from its quiet description. On a row under the pointer or a chosen row the muted words step to the quiet tone.
- **A mark among the item line's pictures MUST take its default variant from the level: `QUIET` at `PAGE` and `CONTAINER`, and `SUBTLE` at `WIDGET`, `GROUP`, `CONTENT` and `INLINE`** (`RULE.SUPPORT.SURFACE.194`). The fill carries the hierarchy: the mark of a page or a panel head draws the stronger tint, which its badges share, and the mark from a widget down draws the lighter one. No level rings the mark. A `variant` the page writes on the mark wins. An avatar's ring is an emphasis the page sets, and the level gives none.
- **A badge among the facts MUST take the size of its level, two levels to a size:** `MD` at `PAGE` and `CONTAINER`, `SM` at `WIDGET` and `GROUP`, and `XS` at `CONTENT` and `INLINE`. Its words are then 14, 13 and 12px. No badge is smaller than `XS`, the smallest of the standard sizes.
- **The description MUST stand directly under the title, and the line of facts MUST stand 4px under whatever stands above it** (`RULE.SUPPORT.SURFACE.135`). Each row of the text takes the line height of its own type step, 1.2 for a Heading, 1.3 for a Title and 1.5 for Content, and that leading spaces the description from the title. A badge among the facts brings no leading, and its border would meet the line above, so the facts keep 4px on every item, with a badge or without. A line of facts is as tall as its words, or as its badge where the badge is taller.
- **A `DSItem` MUST set its words alike in either orientation, and only the picture moves** (`RULE.SUPPORT.SURFACE.272`). The eyebrow stands 2px over the title, the description stands directly under it and facts stand 4px under the title or the description. The picture stands beside the title or above the words, by the room of the level. A `HORIZONTAL` item is a row and keeps its own gaps.
- **An item line at `INLINE` with a title, a description and facts MUST draw two lines.** The first holds the title, a dot and the description, and the second holds the facts. Where the first line is full, the description wraps under the title within the text column. With a description alone or facts alone, and at every other level, the rows stand one under another.
- **An item line at `INLINE` with a title and facts and no description MUST draw its facts on the title's line, after a dot** (`RULE.SUPPORT.SURFACE.223`). The line reads "v3 · Draft": the facts stand at the level's badge size, and where the line is full the title is cut before the facts are. A compact list is a `DSList` of `DSList.Item`, each `content` an item line at `INLINE` and its actions in `endNode`.
- **The picture MUST be read from a fixed table, by the level and the rows of the text** (`RULE.SUPPORT.SURFACE.094`). It is not worked out from the height of the text, so a change to a line height or a gap moves no picture. A mark, an avatar and a group of avatars take the same box, and a mark holds the icon of its box's step. The rows are counted by kind: a description that wraps is still one row, and a line of facts that draws nothing is no row. The table gives the box in pixels. The table is the `HORIZONTAL` item's, where the picture matches the words beside it; a `VERTICAL` item takes the with-a-description column at every form, and the last column gives the gap under its picture, about a third of that box at every level.

  | `pageLevel` | The title alone | With a description | With facts | With a description and facts | `VERTICAL`: the picture to the text |
  | --- | --- | --- | --- | --- | --- |
  | `PAGE` | 36 | 56 | 56 | 80 | 12 |
  | `CONTAINER` | 32 | 44 | 44 | 64 | 12 |
  | `WIDGET` | 28 | 40 | 40 | 56 | 8 |
  | `GROUP` | 24 | 36 | 36 | 48 | 8 |
  | `CONTENT` | 24 | 32 | 32 | 48 | 8 |
  | `INLINE` | 24 | 28 | 28 | 28 | 4 |

- **A title alone at `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` MUST keep the room of a control, 36px, whether or not it holds actions.** Its title and its picture stand in the middle of that room, level with the middle of an action beside it. So a head does not move when an action appears or leaves. A title with a description or facts under it is taller than a control already. A row at `CONTENT` or `INLINE` keeps no such room, and neither does a vertical item at any level: nothing stands beside its title, as its end node stands on the picture's row, so a title alone stands as close to the picture as a title with a description.
- **A `DSItem` MAY stand vertical, with `orientation` `VERTICAL`** (`RULE.SUPPORT.SURFACE.216`). The picture stands on top, then the title, the description and the facts last, all aligned to the start, with the end node at the top end on the picture's row and the gap of its level between the picture and the text, 12, 12, 8, 8, 8 and 4px, the last column of the table above. The picture takes one box per level, the box of a title with a description in the table above, 56, 44, 40, 36, 32 and 28px at `PAGE`, `CONTAINER`, `WIDGET`, `GROUP`, `CONTENT` and `INLINE`, whatever lines stand under it, because a picture above the words is not beside them (`RULE.SUPPORT.SURFACE.278`). A bare icon keeps the size of the title's line. `mediaAlign` does not apply. Unset or `HORIZONTAL`, the line is as before. `DSItemCard` holds a vertical item as it holds any other.
- **A `DSItem` MAY take an `eyebrow`, one `IDSItemFact`, and a `TEXT` fact MAY take a `color`** (`RULE.SUPPORT.SURFACE.242`). The eyebrow stands over the title, in the text column, at the facts step of the level and in the muted tone, for a short phrase such as *MRR · 90D*. A `CUSTOM` fact puts a node of the page's own there, and the item has no eyebrow type of its own. The `color` of a `TEXT` fact takes `DSColorType` and says how a thing is going, such as a count that grew. Unset, the words take the muted tone.
- **A `DSItem` MAY place its facts after the title, with `factsPlacement`** (`RULE.SUPPORT.SURFACE.242`). It takes `DSItemFactsPlacementType`: `AFTER_DESCRIPTION`, the default, and `AFTER_TITLE`, the facts under the title and over the description. With no description the two are the same.
- **A `DSItem` MAY align its end node, with `endAlign`** (`RULE.SUPPORT.SURFACE.219`). It takes `DSVerticalAlignType`. On a line, `TOP` puts the centre of the end node on the centre of the title's first line, `CENTER` on the middle of the text block, and `BOTTOM` on the last line of the text block. On a vertical item, `TOP` keeps it at the top end beside the picture, `CENTER` centres it on the text below the picture, and `BOTTOM` puts it on that text's last line. The arrow stands with the end node and takes the same alignment. Unset, a line keeps its end node centred and a vertical item keeps it at the top end.
- **The picture MUST stand at the middle of the text at every level, and `mediaAlign` MAY move it.** `mediaAlign` takes `DSVerticalAlignType`: `TOP`, its top at the top of the title's first line; `CENTER`, the default; and `BOTTOM`, its foot at the foot of the text's last line. A title alone keeps its picture in the middle of its room, whatever `mediaAlign` says.
- **An icon MUST take `tone` as a text does, and `tone` MUST win over `color`** (`RULE.SUPPORT.SURFACE.303`). The tone colours the glyph in the foreground of that tone, so a page mutes an icon with the prop and not with a class of its own. Where `tone` is set, `color`, `customColor` and the colour of the pointer do not apply.
- **A bare icon of an item line that the page gives no `color` and no `tone` MUST draw in the muted tone, as a default mark's icon does** (`RULE.SUPPORT.SURFACE.187`, `RULE.SUPPORT.SURFACE.304`). A page that wants the colour of the title passes `color` `DEFAULT`.
- **A bare icon MUST be drawn at the size of its level, and it MUST stand in the middle of the title's first line** (`RULE.SUPPORT.SURFACE.310`). `mediaAlign` does not move it.

  | `pageLevel` | The bare icon | The title beside it |
  | --- | --- | --- |
  | `PAGE` | 32px | 22px |
  | `CONTAINER` | 24px | 18px |
  | `WIDGET` | 18px | 16px |
  | `GROUP` | 14px | 14px |
  | `CONTENT` | 14px | 13px |
  | `INLINE` | 12px | 12px |
- **A line that says who did a thing and when is an item line at `INLINE`.** Its picture is the `AVATAR` of the person, its title the name, and the time a fact, in the form the date units give it. A stack may keep a unit of its own that draws it.
- **A record's item line MUST be its module's `<State>Item`, and a place MUST give it only `IDSItemPlacementProps`** (`RULE.SUPPORT.APPS.218`). The web module that owns a record makes `DSItem` specific for it once, so the record reads the same in its picker, in its list and on its own page: `RoleItem` draws a role. The Item decides every part once, the title, the description, the picture, the facts and their order, the same at all six levels from `PAGE` to `INLINE`, and the level sets only the sizes. An `INLINE` line has room for little, so there the Item keeps what a person needs to tell its record apart in a line of text, the description, the facts or both, decided once for its record and never by a place: a person's Item may keep the email and drop the facts, a release's may keep its version and state and drop the description. The level comes from where the Item stands, never from the room it has. The record's state shows only when the record is off, first among the facts, and its code shows at every level. The Item fetches nothing and holds no action: an action belongs to the row or the header that holds it. A place says where the line stands and where it leads (`pageLevel`, `orientation`, `anchor`, `showArrow`, `backAnchor`) and gives its own data at the end (`endNode`, `endAlign`), never a badge or a state of the record, which stand in its facts. It may leave out the description with `hideDescription`, or every fact with `hideFacts`, and it never changes a part or adds one. The design system declares `IDSItemPlacementProps` once, so no Item restates it.
- **A mark in an item line MUST be a rounded square where the page names no shape, and its corner MUST follow its box.** The corner is one of the theme's radius steps: 6px at 24 and 28px, 8px at 32 and 36px, and 10px from 40px up. A page that names a shape still gets it.
- **An item line that is a title MUST start where what stands under it starts** (`RULE.SUPPORT.SURFACE.109`). A title is an item line at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP`. It takes no padding of its own at its two sides. So the title of a group starts where the labels of the fields under it start, in a part that insets, in a card, in a dialog and in a sheet. The head of a page starts where the framed parts under it start. Above and below, a title keeps the padding of its place, which the part that holds it gives.
- **In a `flush` part, a title MUST take the inset of its place at its two sides.** What stands under it there reaches the edge, and the rows start their text at that inset. So the title starts where the text of the rows starts. The place is the panel or the card the part belongs to, and its size sets the inset, as the card (`architecture-containers.md`) states for a card.
- **A page writes no prop or padding to place a title.** The level says that the line is a title, and the part says whether it is `flush`.
- **A row that holds an item line at the level `CONTENT` or `INLINE` MUST give it the padding of a row.** The row takes the padding of the size of its place on every side, and that size is handed to what stands inside the item line. The look of the line does not follow that size. In a `flush` part the row takes the inset of its place at its two sides, so its fill runs from edge to edge. An item line that stands alone, in no row, has no padding of its own: the page puts it in a row of a list, or in a place that gives it room.
- **A trigger that wraps an item line MUST give it its room and its highlight, and where it stands on a line its highlight MUST reach past the line** (`RULE.SUPPORT.SURFACE.175`). `DSDropdownMenu` pads the item line as an entry of a menu is padded and fills it under the pointer. Where the trigger stands in a bar or on the line of a page, not in a row, its content stands on the line, and its padding, then an equal negative margin, reaches outside it. A page pulls nothing out by hand. A trigger in a row of a list, or in a row of the navigation at an edge, keeps the padding and takes no pull.
- **The heading element of a title MUST follow its level, and it MUST change no style** (`RULE.SUPPORT.SURFACE.106`). The title of a `PAGE` item is the `h1`, of a `CONTAINER` the `h2`, of a `WIDGET` the `h3` and of a `GROUP` the `h4`, whatever the boxes around it. A title at `CONTENT` or `INLINE` is no heading.
- **A title in the header of a box MUST take the level its box gives, where the page names none** (`RULE.SUPPORT.SURFACE.107`). A level the page names wins, and an item line anywhere else is `CONTENT`.

  | The box | The level of the title in its header |
  | --- | --- |
  | a panel and a data table panel | the level of its box: `CONTAINER`, and `PAGE` where the panel takes `fullPage` and is the whole page, whose header is then the page head |
  | a card, and the head of a card widget | `WIDGET` |
  | the head of a part of a card widget | `GROUP`, and its rows `CONTENT` |
  | a dialog, a sheet and a drawer | `CONTAINER` |
  | a confirmation | `WIDGET` |

  So in a page with one panel, its title is an `h2`, the title of a card in it an `h3`, and the title of a group in that card an `h4`.

> [!NOTE]
> **Still open, each with its lean.**
> - **Whether the item line follows the density of its place.** Today a row pads by the size of its place and its look does not follow it. The lean is that it follows the place's density, with no prop on the item.
> - **The looks on a phone.** The titles keep the sizes of the desktop there, 22, 18, 16, 14, 13 and 12px, because an item draws no title above 22px. The display steps a page writes with `DSText` take smaller values on a phone (`architecture-core.md`). The lean is that a row a person presses is at least 44px tall.
> - **The shade of the titles at `PAGE`, `CONTAINER` and `WIDGET`.** They take the body tone. Drawing them in the strongest text, with the descriptions muted, is open, and it is not leaned to yet.

#### The choice table of `DSItem`

An item line is chosen by the box it is the title of, and then by the room its words take. The level is all a page chooses about its look, and a box gives the level to the item line in its header.

**The cases**, read from the top; the first that matches wins.

| The item line is | Where it stands | `pageLevel` | `orientation` | `factsPlacement` | `mediaAlign` | `endAlign` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| the head of a record, or of a listing that is the page | the head of the page | `PAGE` | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `CENTER` (the unit's) | the level | `RULE.SUPPORT.SURFACE.209` |
| the title of a panel, a dialog, a sheet or a drawer | the box's header | `CONTAINER` (the place's) | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `CENTER` (the unit's) | nothing | `RULE.SUPPORT.SURFACE.107` |
| the title of a card or a widget | the box's header | `WIDGET` (the place's) | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `CENTER` (the unit's) | nothing | `RULE.SUPPORT.SURFACE.107` |
| the head of an inner part of a box, such as a part of a card | the part's header, or over the part where no header stands | `GROUP` | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `CENTER` (the unit's) | the level, where no header gives it | `RULE.SUPPORT.SURFACE.107` |
| a record among others: a row of a list or of a card | a row | `CONTENT` (the unit's) | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `CENTER` (the unit's) | nothing | this table |
| a value inside another unit: a row of a menu or of a popover, a cell | inside that unit | `INLINE` | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `CENTER` (the unit's) | the level | `RULE.SUPPORT.APPS.218` |
| a tile whose picture stands over its words: a card of a grid, an app in a launcher | a cell of a grid | the place's | `VERTICAL` | `AFTER_DESCRIPTION` (the unit's) | `CENTER` (the unit's) | `TOP` (the unit's on a vertical item) | the orientation | `RULE.SUPPORT.SURFACE.216` |
| a comment or a post, where who wrote it and when come before the words | a row of a thread | `CONTENT` (the unit's) | `HORIZONTAL` (the unit's) | `AFTER_TITLE` | `TOP` | `TOP` | the facts' place and the two alignments | `RULE.SUPPORT.SURFACE.242` |
| a row whose words run to three lines or more | a row | the place's | `HORIZONTAL` (the unit's) | `AFTER_DESCRIPTION` (the unit's) | `TOP` | `TOP` | the two alignments | `RULE.SUPPORT.SURFACE.219` |

**The limits across a view.** The item line holds none of its own. A box holds one title, the item line in its header (`RULE.SUPPORT.SURFACE.107`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `pageLevel` | `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `CONTENT` · `INLINE` | each by its case. `CONTENT` is the unit's own default, and a box gives `CONTAINER` or `WIDGET` to its header |
| `orientation` | `HORIZONTAL` | every case but a tile. It is the unit's own default |
| `orientation` | `VERTICAL` | a tile whose picture stands over its words (`RULE.SUPPORT.SURFACE.216`) |
| `factsPlacement` | `AFTER_DESCRIPTION` | every case but a comment. It is the unit's own default |
| `factsPlacement` | `AFTER_TITLE` | a comment or a post (`RULE.SUPPORT.SURFACE.242`) |
| `mediaAlign` | `CENTER` | every line of one or two lines. It is the unit's own default |
| `mediaAlign` | `TOP` | a comment; a row of three lines or more |
| `mediaAlign` | `BOTTOM` | no case written yet: a picture fits beside the title, which a person reads first |
| `endAlign` | `CENTER` | every line of one or two lines, as the unit keeps it where it is left out |
| `endAlign` | `TOP` | a comment; a row of three lines or more; a tile, as the unit keeps it (`RULE.SUPPORT.SURFACE.219`) |
| `endAlign` | `BOTTOM` | no case written yet: an action at the end fits beside the title it acts on |

### The badge

The badge, `DSBadge`, shows a state or a kind as one of the facts of a thing. Where it stands, and that the normal state shows none, are rules of content in `standards-core.md`. The rules below keep a badge readable.

- **A badge MUST always show its word** (`RULE.SUPPORT.SURFACE.065`). It then reads without its colour and without its icon, also for a person who cannot tell the colours apart. `DSBadge` asks for its `label` on every use.
- **The colour of a badge says a state, and not a kind** (`RULE.SUPPORT.SURFACE.065`, advice). A person learns that a coloured badge asks to be looked at, and a colour on every kind would spend that signal on things that need no attention. The one exception is a colour a person chose for their own label, `CUSTOM`, such as a tenant's tag: that colour is their data, so it may mark a kind.
- **A badge with no `variant` MUST draw `SUBTLE`, the light tint** (`RULE.SUPPORT.SURFACE.153`). A page asks for a stronger fill by writing `QUIET`, so the badges of a table or a card stay quiet beside the words around them.
- **A word with no fill is a fact in words, a `TEXT` fact, and a link is a `DSLink`** (`RULE.SUPPORT.SURFACE.377`, advice). So a badge's `GHOST` and `LINK` have no case written yet.
- **A badge is `SOLID` only over a picture** (`RULE.SUPPORT.SURFACE.378`, advice). A strong fill is kept for the one place a tint cannot be read, so a page does not write `SOLID` on a badge to make it stand out.
- **A badge in a table cell is `XS`, a badge on its own is `SM`, and a badge over a picture takes the size of its place** (`RULE.SUPPORT.SURFACE.380` and `RULE.SUPPORT.SURFACE.391`, advice). A person scans a table row by row, so a larger badge weighs on every row and tells them nothing more. Among the facts of an item line the level gives the size, as the rule below states.
- **Several values of one set are each drawn by their own case, one size step smaller than their place** (`RULE.SUPPORT.SURFACE.381`, advice). A row of small badges then reads as one fact with several values, and each keeps the look its own meaning gives. No badge is smaller than `XS`.
- **A label a person coloured is a `SUBTLE` badge in `CUSTOM`, with that colour in `customColor`** (`RULE.SUPPORT.SURFACE.382`, advice). The badge works out its fill, its words and its line from that one colour, so a colour a person picks never draws a badge that cannot be read.
- **A status badge MUST keep its own colour on a coloured surface.** On a surface other than `BASE` only a neutral and a primary badge take the surface's tint; a success, warning, error or info badge stays its hue, so Live, Syncing and Pending draw apart on a stage as they do on the page.
- **A state badge among the facts of an item line MUST take the `variant` the page gives, and else the one its level chooses:** `QUIET` at `PAGE` and `CONTAINER`, so it is seen beside a large title, and `SUBTLE_OUTLINE` at the others, whose line gives a small badge an edge a person finds down a list. A badge that names a kind is not a state badge, and the next rule is its own.
- **A badge that names a kind or a type draws `OUTLINE` in `DEFAULT`, with the icon its enum gives the value where it gives one** (`RULE.SUPPORT.SURFACE.368`, advice). Its line gives it an edge with no fill, so it reads as a label and never asks to be looked at. This holds at every level and in a table; the level's `variant` is for a state badge.
- **A badge that says a state takes the hue its meaning gives, from one table, at the `variant` its place gives** (`RULE.SUPPORT.SURFACE.369`, advice). The place gives the page's `variant`, else the level's, else `SUBTLE`. One table fixes the hue, so Active is green in every app and no module picks a colour of its own for a value.

  | What the state tells a person | Hue | Values in the apps |
  | --- | --- | --- |
  | it works, it is done or it is proved | `SUCCESS` | Active, Live, Verified, Published, Sent, Paid, Accepted |
  | it waits on a person, or is on its way to them | `WARNING` | Pending, Invited, Unverified, Awaiting approval |
  | it failed, was refused, or stops something working until a person acts | `ERROR` | Failed, Rejected, Blocked, Bounced, a credential Expired |
  | the system is working on it now | `INFO` | Running, Processing, Syncing, Scheduled |
  | it is off, ended or not started, and asks nothing | `DEFAULT` | Draft, Disabled, Archived, Revoked, an invite Expired |
  | it marks the one chosen among its peers, or a stage of release | `PRIMARY` | Current, Default, Primary, Alpha, Beta |

  A value that fits two rows takes the one that says what the person must do: Expired is `ERROR` where something stops working and `DEFAULT` where nothing needs doing.
- **A badge over a picture is `SOLID`, and it says a state in that state's hue** (`RULE.SUPPORT.SURFACE.374`, advice). A picture can be light or dark anywhere, and a solid fill keeps the words readable on any of them. A kind over a picture is the picture's caption, and not a badge.

#### The choice table of `DSBadge`

A badge is chosen from what its value is and where it stands. Every case rests on the rules above: a badge always shows its word, and its colour says a state, never a kind, but for a colour a person chose. A thing shows one state, so several values of one set are kinds or labels.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `variant` | `color` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| the normal state | anywhere | no badge | — | — | nothing | `RULE.SUPPORT.SURFACE.065` |
| a state | an item line from `WIDGET` to `INLINE` | `SUBTLE_OUTLINE` (the level's) | from the hue table | `SM` at `WIDGET` and `GROUP`, `XS` below (the level's) | the word and the colour | `RULE.SUPPORT.SURFACE.153` |
| a state | an item line at `PAGE` or `CONTAINER` | `QUIET` (the level's) | from the hue table | `MD` (the level's) | the word and the colour | `RULE.SUPPORT.SURFACE.153` |
| a state | over a picture | `SOLID` | the state's hue, from the hue table | the place's | the word, the colour and the variant | `RULE.SUPPORT.SURFACE.378` |
| a state | a table cell | `SUBTLE` (the unit's) | from the hue table | `XS` | the word and the colour, and `XS` where the place is larger | `RULE.SUPPORT.SURFACE.391` |
| a state | on its own | `SUBTLE` (the unit's) | from the hue table | `SM` | the word and the colour, and `SM` where the place is larger | `RULE.SUPPORT.SURFACE.380` |
| a release stage, such as Alpha, Beta or New | a feature's eyebrow | the level's | `PRIMARY` | the level's | the word | this table |
| a plan's highlight, such as Most popular | a plan | the level's | `PRIMARY` | the level's | the word | this table |
| several values of one set | anywhere | each by its own case | each by its own case | one step smaller than the place's | the words, and the size | `RULE.SUPPORT.SURFACE.381` |
| a label a person coloured, such as a tenant's tag | anywhere | `SUBTLE` | `CUSTOM`, with its colour in `customColor` | the place's | the word and the colour | `RULE.SUPPORT.SURFACE.382` |
| a kind | over a picture | not a badge: the picture's caption | — | — | — | `RULE.SUPPORT.SURFACE.065` |
| a group or a kind | a grid cell's eyebrow | not a badge: the eyebrow in words, as the feature grid rules it | — | — | — | this table |
| a kind or a type | the facts, the end of a row, a table, anywhere | `OUTLINE` | `DEFAULT` | the place's | the word, the icon its enum gives the value, and the variant | `RULE.SUPPORT.SURFACE.065` |
| a count | an entry of the navigation, or a button | drawn by the unit, from its `count` | — | — | the count | this table |

**The mapping** is the hue table above: one hue for each state, from what the state tells a person. A case that says *from the hue table* takes its colour there, and a value that fits two rows takes the one that says what the person must do.

**The limits across a view.** The badge holds none of its own. A strong fill stays rare because a badge is `SOLID` only over a picture, which a case holds.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `variant` | `SOLID` | a state over a picture (`RULE.SUPPORT.SURFACE.378`) |
| `variant` | `QUIET` | a state in an item line at `PAGE` or `CONTAINER`, and a release stage or a plan's highlight at those levels |
| `variant` | `SUBTLE` | a state in a table cell or on its own; a label a person coloured. It is the unit's own default |
| `variant` | `SUBTLE_OUTLINE` | a state in an item line from `WIDGET` to `INLINE`, and a release stage or a plan's highlight at those levels |
| `variant` | `OUTLINE` | a kind or a type, at every level |
| `variant` | `GHOST` | no case written yet: a word with no fill is a fact in words (`RULE.SUPPORT.SURFACE.377`) |
| `variant` | `LINK` | no case written yet: a link fits a `DSLink` (`RULE.SUPPORT.SURFACE.377`) |
| `color` | `DEFAULT` | a kind or a type; a state that is off, ended or not started, by the hue table. It is the unit's own default |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` | a state, by the hue table; `PRIMARY` also a release stage and a plan's highlight |
| `color` | `CUSTOM` | a label a person coloured, with `customColor` (`RULE.SUPPORT.SURFACE.382`). Not for a state the system names |
| `size` | `XS` | a state in an item line at `CONTENT` and `INLINE`; a state in a table cell (`RULE.SUPPORT.SURFACE.391`); several values where their place is `SM` or `XS` |
| `size` | `SM` | a state in an item line at `WIDGET` and `GROUP`; a state on its own (`RULE.SUPPORT.SURFACE.380`); several values where their place is `MD` |
| `size` | `MD` | a state in an item line at `PAGE` and `CONTAINER`; several values where their place is `LG` |
| `size` | `LG` · `XL` | the place's alone: a kind, a state over a picture or a label a person coloured, in a place of that size, and several values where their place is `XL`. A page writes neither |

### A value of an enum

- **A value of an enum MUST be shown by its name, and never by its code** (`RULE.SUPPORT.SURFACE.066`). The name is the one a person reads. The code is written for the contract and not for a person.
- **Its icon MUST be chosen in one order.** First the icon of the value, where its enum gives one to each value. Then the icon of the enum. Then the word alone. So a missing icon never stops a page, and a module is held to no icon it cannot find in the library.

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

- **A mark MUST support three shapes: round, rounded and square. It MUST be round by default** (`RULE.SUPPORT.SURFACE.085`). A round mark still tells a person, before they read a word, that the picture names a thing and is no control. A page chooses rounded or square where the thing is better shown so, such as an app or a file.
- **An icon inside an action MUST keep the square of the control it sits in** (`RULE.SUPPORT.SURFACE.067`). A mark is never pressed, whatever its shape.
- **A mark MUST take `variant` with the shared vocabulary, `DSVariantType`** (`RULE.SUPPORT.SURFACE.124`). `GHOST` and `LINK` draw the icon alone, in the hue of the mark, with no fill and no ring. The icon stays in the box of the mark, so it keeps the place and the size of a mark beside the marks next to it.
- **A mark MUST draw each value of `variant` from the one surface that a button and a badge draw from, with the step that value has under the pointer.** A mark, a badge and a button of one variant and one hue are then the same colours. A mark with no `variant` draws `SUBTLE`. A default mark in `SUBTLE`, `SUBTLE_OUTLINE` or `OUTLINE` draws its icon in the muted tone, and a ringed mark draws its ring in the colour of its icon (`RULE.SUPPORT.SURFACE.187`). The light tint of the default hue is the text colour mixed into transparency, `6` percent at rest and `11` under the pointer, so it stands apart from the page, a card and a dialog in light and in dark (`RULE.SUPPORT.SURFACE.180`), and every other tint, light and medium, is a wash of its hue's step 500 into transparency, the light one at the least share that stands `0.04` from them (`RULE.SUPPORT.SURFACE.183`). The step under the pointer is for the look alone: a mark is a picture and no control, and it takes no press.
- **The icon of a mark on the light tint of the default hue MUST take the muted tone.** A mark that states no hue then stays quiet beside the title it stands with.
- **A filled mark is a thing that is set up, and an empty mark is a thing that is not set up yet.** So a row of marks shows where a setup stands with no count beside it.
- **A mark that is not set up is `OUTLINE` in `DEFAULT`, and a mark that is set up takes the filled tint of its place** (`RULE.SUPPORT.SURFACE.386`, advice). The ring with no fill is the empty mark, and the tint is the full one: the level's in an item line, else `SUBTLE`.
- **A mark's colour says a state, from the badge's hue table, or the brand, in `PRIMARY`, and else is `DEFAULT`** (`RULE.SUPPORT.SURFACE.385`, advice). The brand is the app's own mark, the chosen one of a run of marks, and a step's number. A mark says what a thing is, and its colour does not mark a kind. `CUSTOM` draws `DEFAULT`, because a mark has no colour of its own to draw from.
- **A mark is `SOLID` only for the app's own mark beside its name, and for the chosen one of a run of marks** (`RULE.SUPPORT.SURFACE.387`, advice). A run of marks is a row or a column of icons that stand for places, such as a rail shut to its icons.
- **A mark draws its icon alone, `GHOST`, only in a run of marks, for the marks that are not chosen** (`RULE.SUPPORT.SURFACE.388`, advice). The icon keeps the box of the chosen mark beside it, so the run stands in line. An icon alone anywhere else is a `DSIcon`, or the kind `ICON` of an item line's picture.
- **A mark is no link, and no level rings a mark** (`RULE.SUPPORT.SURFACE.389`, advice). `LINK` draws what `GHOST` draws with no step under the pointer, and the empty mark is `OUTLINE`, so the light tint with a ring means nothing of its own on a mark. So `LINK` and `SUBTLE_OUTLINE` have no case written yet on a mark.

`DSMark` says what: it draws an icon, or a symbol of one to three characters (`text`, one of the two, drawn whole in the type step of its scale size), as a mark, on a background of its own. `shape` takes `DSMarkShapeType`: `CIRCLE`, the default; `ROUNDED`, a square with the corner radius of its size step; `SQUARE`, a square with sharp corners. `size` is the density step: a mark with no `scaleSize` takes the scale size of the same name, so its background is as tall as a control of that step. `scaleSize`, from `DSScaleSizeType`, says how large the mark is drawn, with a background of 24 to 96px, and the mark holds the icon of its own step. `color` is the hue. `variant` is how the background is drawn, from `DSVariantType`: `SOLID`, a strong fill; `QUIET`, a medium tint; `SUBTLE`, a light tint and the default; `SUBTLE_OUTLINE`, the light tint with a ring; `OUTLINE`, a ring with no fill; `GHOST` and `LINK`, the icon alone with no fill and no ring. A screen reader passes a mark by; a mark that stands alone takes a name through `ariaLabel`, and is then read as an image. A person's picture stays `DSAvatar`, which is round.

#### The choice table of `DSMark`

A mark is chosen by its level, then by the thing it stands for, then by whether that thing is set up. A person is no mark: their picture is an avatar. An icon inside an action is no mark either: it is the button's own icon, in the button's square.

**The cases**, read from the top; the first that matches wins.

| The level | The thing | Set up | `variant` | `color` | `shape` | `size` and `scaleSize` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| an item line from `WIDGET` to `INLINE` | the kind of the thing, as the line's picture | — | `SUBTLE` (the level's) | `DEFAULT`, or the hue of the thing's state | `ROUNDED` (the item's) | the item's box | `media` `MARK` with its icon, and its colour where it says a state | `RULE.SUPPORT.SURFACE.385` |
| an item line at `PAGE` or `CONTAINER` | the kind of the thing, as the line's picture | — | `QUIET` (the level's) | `DEFAULT`, or the hue of the thing's state | `ROUNDED` (the item's) | the item's box | `media` `MARK` with its icon, and its colour where it says a state | `RULE.SUPPORT.SURFACE.385` |
| any level | the app's own mark, beside its name | — | `SOLID` | `PRIMARY` | `ROUNDED` | the scale size of the name's title step | the icon, the variant, the colour, the shape and the scale size | `RULE.SUPPORT.SURFACE.387` |
| any level | a run of marks, such as a rail shut to its icons | the chosen one | `SOLID` | `PRIMARY` | the run's | the run's | the icon, the variant and the colour | `RULE.SUPPORT.SURFACE.387` |
| any level | a run of marks | every other one | `GHOST` | `DEFAULT` | the run's | the run's | the icon and the variant | `RULE.SUPPORT.SURFACE.388` |
| any level | a thing a setup holds, in a row of marks, such as a channel | set up | the level's in an item line, else `SUBTLE` (the unit's) | `DEFAULT`, or the hue of its state | `CIRCLE` (the unit's) | the place's | the icon, and its colour where it says a state | `RULE.SUPPORT.SURFACE.386` |
| any level | a thing a setup holds, in a row of marks | not set up | `OUTLINE` | `DEFAULT` | `CIRCLE` (the unit's) | the place's | the icon and the variant | `RULE.SUPPORT.SURFACE.386` |
| any level | a symbol of one to three characters: a step's number, or a file's type | — | `SUBTLE` (the unit's) | `PRIMARY` for a step's number, `DEFAULT` for a file's type | `CIRCLE` for a step, `ROUNDED` for a file | the scale size of the title beside it, as what stands beside what states | the text, the colour and the scale size | `RULE.SUPPORT.SURFACE.385` |
| any level | a thing, beside a title or a heading of a builder's own unit | — | `SUBTLE` (the unit's) | `DEFAULT`, or the hue of the thing's state | `CIRCLE` (the unit's), or `ROUNDED` or `SQUARE` where the thing is better shown so, such as an app or a file | as what stands beside what states | the icon and the scale size | `RULE.SUPPORT.SURFACE.385` |

**The mapping** is the badge's hue table: a mark that says a state takes the hue that state takes on a badge.

**The limits across a view.** A run of marks holds one chosen mark, the one `SOLID` among them.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `variant` | `SOLID` | the app's own mark; the chosen one of a run of marks (`RULE.SUPPORT.SURFACE.387`) |
| `variant` | `QUIET` | an item line's picture at `PAGE` and `CONTAINER`, and a set-up mark there |
| `variant` | `SUBTLE` | an item line's picture from `WIDGET` down; a set-up mark; a symbol; a mark beside a title or a heading. It is the unit's own default |
| `variant` | `OUTLINE` | a thing that is not set up yet (`RULE.SUPPORT.SURFACE.386`) |
| `variant` | `GHOST` | the marks of a run that are not chosen (`RULE.SUPPORT.SURFACE.388`) |
| `variant` | `SUBTLE_OUTLINE` · `LINK` | no case written yet: no level rings a mark, and a mark is no link (`RULE.SUPPORT.SURFACE.389`) |
| `color` | `DEFAULT` | a mark that says no state and is no brand. It is the unit's own default |
| `color` | `PRIMARY` | the app's own mark, the chosen one of a run, and a step's number; a state, by the hue table |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | a mark that says a state, by the hue table (`RULE.SUPPORT.SURFACE.385`) |
| `color` | `CUSTOM` | draws `DEFAULT`: a mark has no colour of its own to draw from (`RULE.SUPPORT.SURFACE.385`) |
| `size` | `XS` · `SM` · `MD` · `LG` · `XL` | the place's: the size above, which also sets the corner of `ROUNDED`. A page sizes a mark by `scaleSize`, and writes `size` only beside it, to set that corner |
| `scaleSize` | `XXS` to `XXL5` | the item's box in an item line; the run's in a run; beside a title or a heading, as what stands beside what states |
| `shape` | `CIRCLE` · `ROUNDED` · `SQUARE` | each by its case. `CIRCLE` is the unit's own default |
| `iconMotion` | `NUDGE_UP` to `LIFT` | by the icon's meaning, as the motion of an icon gives it: `LIFT` on a mark of a tile that opens. A page writes one only for an icon the table names (`RULE.SUPPORT.SURFACE.201`) |

### The avatar

`DSAvatar` says who: it shows the picture of a person, a company or a workspace, and the initials of its name where there is no picture, in the `shape` a mark takes (a circle when unset) and with an optional `color` for the initials, drawn as the `SUBTLE` tint of that hue; a picture ignores it. A mark never holds a name, and an avatar's name is never a mark's text. `DSAvatarGroup` shows several of them as one stack. Both take `scaleSize`, from 24 to 96px, and both keep `size`. With no `scaleSize`, an avatar takes the step of the same name as its `size`, and with neither it takes the size of the place it stands in. A group gives its scale size to each avatar it holds. The badge sits on the curve of a circle; on a `ROUNDED` or a `SQUARE` avatar a badge with an icon moves a sixth of its own size out of the corner, and a status dot a quarter.

- **The badge of an avatar MUST follow the scale size of the avatar** (`RULE.SUPPORT.SURFACE.136`). A badge that holds an icon is about a third of the avatar, and never under 12px: 12, 12, 12, 14, 14, 16, 16, 20, 20, 24 and 32px from `XXS` to `XXL5`. A badge with no icon is a dot of about a quarter of the avatar, and never under 8px: 8, 8, 8, 10, 10, 12, 12, 14, 16, 20 and 24px. A page sets no size for either.
- **The initials of an avatar MUST be a title step of about four tenths of the avatar** (`RULE.SUPPORT.SURFACE.105`). From `XXL` up they are not the title of the avatar's own step name, because that title would fill the circle.

- **A group of avatars MUST overlap its avatars as the design library draws it, and an overlapped avatar MUST centre its initials in what shows** (`RULE.SUPPORT.SURFACE.197`). The overlap is 4, 6, 8, 10, 14, 20, 22, 26, 30, 36 and 44px from `XXS` to `XXL5`. The initials sit in the visible part, the circle less the overlap and the gap, and where they are still wider they are drawn one title step smaller, then one more, at most four, so that none reach into the gap at any size. The last avatar and a photo are unchanged.

| Scale size of the avatar | Its size | Its initials | What it is for |
| --- | --- | --- | --- |
| `XXS` | 24px | 10px | a person named inside a line of text or a dense table |
| `XS` · `SM` · `MD` · `LG` · `XL` | 28 · 32 · 36 · 40 · 44px | 12 · 13 · 14 · 16 · 18px | a row, a list, the head of a panel, of a widget or of a page |
| `XXL` | 48px | 18px | a card about one person |
| `XXL2` | 56px | 24px | the head of a record with a line under its name |
| `XXL3` | 64px | 24px | the head of a record with a line and facts |
| `XXL4` | 80px | 32px | a profile page |
| `XXL5` | 96px | 40px | an account's own page |

#### The choice table of `DSAvatar`

An avatar is chosen by whose it is: a person is a circle, and an organization or an account a rounded square. It is sized by the words it stands beside.

**The cases**, read from the top; the first that matches wins.

| It is the picture of | Where it stands | `shape` | `color` | `scaleSize` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a person | beside their name in a row, a menu or a head | `CIRCLE` (the unit's) | left out | the step of the name beside it, as what stands beside what states | the place's | the picture or the initials, and the scale size | this table |
| an organization or an account | beside its name, or in a switcher | `ROUNDED` | left out | the step of the name beside it | the place's | the shape and the scale size | this table |
| the person or the organization being edited | over its form, large | the case's | left out | `XXL4` or `XXL5` | the place's | the scale size | this table |
| a thing that is no person and no organization: an app, a file, a channel | — | not an avatar: a `DSMark` | — | — | — | — | `RULE.SUPPORT.SURFACE.385` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `shape` | `CIRCLE` | a person. It is the unit's own default |
| `shape` | `ROUNDED` | an organization or an account |
| `shape` | `SQUARE` | no case written yet: a square corner reads as an app or a file, which a `DSMark` draws |
| `color` | `DEFAULT` | left out, the colour behind the initials |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: a person or an organization has no state and no brand of their own to say (`RULE.SUPPORT.SURFACE.065`); a state beside them is a badge |
| `scaleSize` | `XXS` to `XXL5` | the step of the name beside it; `XXL4` and `XXL5` over a form that edits it |
| `size` | `XS` to `XL` | the place's. A page sizes an avatar by `scaleSize` |

### The slider

- **A slider MUST show its value on its handle** (`RULE.SUPPORT.SURFACE.198`). `DSSlider` and `DSSliderRange` draw each handle's value in a small label above it, formatted as the app formats numbers, with as many decimals as the step has; on a range the two labels join into one when they would touch, and `aria-valuetext` carries the same text. The slider adds no prop, and takes the line of room the label needs above its track.

### What stands beside what

These rules are for a component a builder makes, where a text stands beside an icon, a mark or an avatar. Inside an item line the item decides, and a page chooses none of this there.

- **Beside a title, an icon, a mark and an avatar take the scale size of the title's own step name** (`RULE.SUPPORT.SURFACE.104`, advice). `TITLE_XXL3` stands beside `XXL3`: a 40px title, a 40px icon, and a 64px mark or avatar. An icon beside a title is not smaller than the title.
- **Beside a heading, an icon is the size of the heading or the next size up, up to 56px.** A heading has no scale size of its own name, so the pairing goes by size. Beside a heading larger than 56px, the icon stands in a mark.
- **Beside a heading, an avatar or a mark is two steps above the heading's own step, and no larger than `XXL5`.**

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
| the name of a panel, a dialog, a sheet or a drawer | an item line at the level `CONTAINER`, a heading | one for each panel |
| the name of a widget or a card, and the question of a confirmation | an item line at the level `WIDGET`, a title | one for each widget |
| the name of an inner part of a widget: a set of rows under one name | an item line at the level `GROUP`, a heading in the quiet tone | one for each group |
| a row among others: a row of a list or of a card | an item line at the level `CONTENT`, a title | as many as there are rows |
| a value inside another unit: a row of a popover, of a menu or of a cell | an item line at the level `INLINE`, a title | as many as there are rows |
| a number, a price, the line of a hero | a heading step above `HEADING_XL`, in a component of the builder's own | one or two |

- **A panel that is the whole page MUST say so with `fullPage`, and its header is then the page head** (`RULE.SUPPORT.SURFACE.179`). A listing that is a part of a page takes `CONTAINER`, the level its box gives. So every page of an app opens with the same head, and only its body differs.
- **Every level of a page has its title, and a title is larger than the titles of what stands under it** (`RULE.SUPPORT.SURFACE.112`, advice). The titles run 22, 18, 16, 14, 13 and 12px from the page down to a value inside another unit. In a page with one panel that holds a card, they are the `h1`, an `h2`, an `h3` and an `h4`, and a row is no heading.
- **An inner part of a widget draws its title as an item line at the level `GROUP`.** The action of the group stands at the end of that item line. So a group needs no block and no prop of its own.

### The two blocks of a field

A field has two blocks, one to enter a value and one to read it.

| The field | Its block | What the block draws |
| --- | --- | --- |
| A field a person enters | `DSForm.Field` | its title above its control, and one line under the control that holds its description, or its error in place of the description. The line is kept where the field can fail or has a description, and drawn nowhere else. Its label line reads the label, the `info` mark, and `labelEndNode` at the right end |
| A field a person reads | `DSDataUnit` | its title above its value, with no box around the value. A value that is empty shows a dash |

- **`DSForm.Field` MUST take `labelEndNode` at the end of its label line** (`RULE.SUPPORT.SURFACE.169`). The label line reads the label, the `info` mark right after the label's text, then `labelEndNode` at the right end. Only the label shrinks when room runs out, cut with an ellipsis and its whole text shown on hover; the mark and the end node never shrink. The end node stands centred on the label line and never makes it taller, so fields with and without one stand level in a row and step the same in a column. A switch or a checkbox stands in a field with no `label` and `inline`, and the field's note lines up under the control's own label.
- **A `DSForm.Field` with no label of its own MUST keep a blank label line, and `showBlankLabel={false}` MUST take it away.** The blank line is never announced, and an `inline` control there stands in the height of a control, centred, so the field stands level beside a labelled one in a row. `showBlankLabel` is true where left out; a field alone on its line in a column takes `false` and draws its control and its message line only.
- **`DSForm.Field` MUST keep its message line always, and that line is the space between two fields** (`RULE.SUPPORT.SURFACE.189`, which replaces the condition of `RULE.SUPPORT.SURFACE.171`). The line is kept while it is empty, with a space that is never announced, so a form has one rhythm and an error or a validator added later moves nothing. A field that stands in one row, a field of a filter bar or one edited inline in a table, is not drawn through `DSForm.Field` and keeps none.
- **A field MUST carry no space around it, and whoever places the fields MUST space them** (`RULE.SUPPORT.SURFACE.195`). `DSForm` and `DSForm.Field` add no gap: the field keeps only its message line. The code that places the fields, a composite of the design system or a page, sets the space between them, vertical or horizontal. The composites of the design system that stack their fields, `DSDataFieldBuilder` and `DSAddressForm`, stack them 8 px apart beyond the message line, a switch or a check that carries its own label included.
- **`DSAccordionGroup` MAY be controlled, through `expandedKeys`** (`RULE.SUPPORT.SURFACE.191`). Given, the open sections are exactly these keys, the options' `expanded` seeds nothing, and a press is reported through `onChange` without opening anything by itself. Left out, the group keeps its own state. **An accordion fits a settings form, every field already holding a value; a task form with fields to fill uses one scroll or steps.** Both are advice.
- **An accordion's head is one line, its title, with at most a short count or status at the end; a description belongs in its content** (`RULE.SUPPORT.SURFACE.191`, advice). The content keeps as much room above its first line as below its last, the vertical padding of the size the accordion reads, in every accordion.
- **A card, a card widget and a panel MAY be painted by a class of the app, and the class MUST set the block's paint tokens and nothing else** (`RULE.SUPPORT.SURFACE.192`). `DSCard`, `DSCardWidget` and `DSPanelContainer` take `className`, which goes on the block's root, and `opacity`, OPAQUE by default; `DSCard` takes no `style`. The class sets `--surface-fill`, `--surface-translucent-fill` and `--surface-blur` from the app's own tokens, in light and in `[data-mode='dark']`; anything else a class sets on the block is unsupported. A block reads only the tokens set on its own root, so four looks are four classes and every card stays a design-system card. Our own code, the showcase and the platform put no class on a block.
- **A switch MUST take its own `label`, drawn beside it as a checkbox draws its own, and no description; and a control with an edge MUST step that edge under the pointer** (`RULE.SUPPORT.SURFACE.167`). Pressing the label flips the switch. One label names the setting, never a label for each state. Under the pointer the off track steps from the strong border one small step, and the on track takes the primary one step lighter. A field, a select, a picker, a radio, a checkbox and a toggle at rest take the same step on their edge; a disabled control, a focused control and a control in error keep their own.
- **The drop area of an attachment MUST be neutral in every state, take a `title` and a `description`, and in `mini` be as wide as its content** (`RULE.SUPPORT.SURFACE.168`). The edge is dashed, `--surface-border-strong`, on the `--surface-sunken` fill, with no brand colour; under the pointer the edge steps to `--surface-border-hover`, and while a file is dragged over it the fill takes `--surface-hover`. The full form is a centred column of an upload-cloud icon, the title, the description in the muted tone and an outline button one size step under the control's size. Left out, the title reads "Drag files here or click to browse", with no description. `mini` is one row, as wide as its content and left-aligned.
- **A form holds each field a person enters in `DSForm.Field`, and a page shows each field a person reads in `DSDataUnit`.** Both keep the title above, as the rules of content ask (`RULE.SUPPORT.SURFACE.060`, `RULE.SUPPORT.SURFACE.061`). So a record that is read and the form that changes it have the same shape.
- **`DSDataFieldView` draws through `DSDataUnit`, and it needs the config of a data field.** So it fits a custom field, whose config the record already carries. A field with no such config is read through `DSDataUnit` itself.
- **Neither block places its neighbours.** The foundation defines no block for the grid that readings stand in. The page writes that grid, or uses a unit for it where its stack provides one, as `architecture-containers.md` says of every gap between two blocks.

## Data entry · The value of a control

A form holds what a person enters until it sends a command, and each field of the command already has a type. A control that holds a value of another type makes the form cast between the two, and a cast hides from the compiler every place the two disagree. So a control holds the type of the attribute it edits, and the form holds the command's own types and casts nothing.

- **A control's value MUST be the type of the attribute it edits** (`RULE.SUPPORT.SURFACE.299`). A form then passes each field to its control and back with no cast, and a control that does not fit its attribute fails to compile.

  | The attribute | Its control | What the control shows | What it writes when it is emptied |
  | --- | --- | --- | --- |
  | a text, `string` | `DSInput`, `DSTextarea` | the text | `''`, which a required check refuses |
  | a text that may be empty, `string \| null` | `DSInput` or `DSTextarea`, saying `nullable` | `null` as a blank box | `null` |
  | a choice of one, its enum | `DSSelect`, `DSRadioGroup` or `DSToggleGroup`, typed by the enum | the placeholder until a value is chosen; the form holds `null` until then | nothing: it has no clear |
  | a choice of one that may be empty, its enum or `null` | the same, with `clearable` | the placeholder for `null` | `null`, by the clear |
  | a choice of many, a list of its enum | `DSSelectMulti`, `DSToggleGroupMulti` or `DSCheckboxGroup`, typed by the enum | nothing chosen, for an empty list | `[]` |
  | a record, by its id | `DSAutocomplete`, or `DSAutocompleteMulti` for many | the record its option carries | `null`, or `[]` for many |

- **A record is chosen by an autocomplete and not by a select** (`RULE.SUPPORT.SURFACE.307`, advice). What decides is what is chosen, not how long the list is. An enum is a value the contract fixes, so its options are known whole and a select shows them. A record is a row on the server, different for each organization and able to change while the form is open, and stored by its id; a saved form must turn that id back into its record, and `DSAutocomplete` does this through `search` and `resolveByIds`. The owning module says how its list opens: a short, bounded list is preloaded with `minChar` `0` and opens whole; a long or growing list opens empty and is searched. A set that changes only by a release and is the same for every organization belongs in the contract as an enum and takes a select.
- **A text control MUST say `nullable` where its attribute may be empty, and only there.** It then shows `null` as a blank box and writes `null` when a person empties it.
- **A choice of one MUST take its enum's values as its keys, and `null` MUST mean that nothing is chosen.** A contract enum is always a string, so a key is a string and never a number. `null` is shown by the placeholder and is never an option. The clear stands only on an attribute that may be empty.
- **A choice of many MUST be empty as an empty list, and never as `null`.**
- **A record picker's value MUST be the record's id, and its option MUST carry the record, typed.** The command takes the id, and the line that draws the option reads the record with no cast, such as an option drawn by its `<State>Item`.
- **The other controls already hold their attribute's type.** A yes-or-no holds a boolean, a number `number | null`, and a date or a time `string | null`, where `null` is nothing chosen. `DSForm.Field` hands its control the value of its field as it is.

> [!NOTE]
> **Not built yet.** The web does not yet type its controls by the attribute each edits, and `nullable` on `DSInput` and `DSTextarea` is not built. Support builds both in its next release. The library draws nothing for them, because a value's type is no look.

### An embedded page

- **A page from another address, or a document the page wrote, MUST be drawn through `DSEmbed`** (`RULE.SUPPORT.SURFACE.305`). `title` is required: it is what a screen reader calls the embedded page. `src` names the address and `srcDoc` holds the document, and a unit takes one of them.
- **A document given as `srcDoc` MUST run sandboxed with nothing allowed.** It runs no script, opens no address and reaches nothing of the page. `allow` is read only beside `src`, for a permission the embedded page asks for, such as a passkey.
- **`DSEmbed` MUST draw no look of its own.** It has no fill, border, shadow or corner. It stands in the frame of the unit that holds it, such as a `DSCard` or the media of a `DSFeature`. It fills the width it is given, at its `height` in pixels.
- **`mode` sets the theme mode the embedded page is drawn in, and follows the app where it is left out.** `LIGHT` draws it on a white ground in the light colour scheme, for a document written for light only, such as an email.

## The motion of an icon — 🔮

An icon moves only because what holds it is hovered, pressed or open; it never moves on its own and never loops. `DSIcon` takes `motion` (`DSIconMotionType`) and `hoverNode`, and no block takes a speed prop.

| Motion | What it does |
| --- | --- |
| `NUDGE_UP`, `NUDGE_DOWN`, `NUDGE_START`, `NUDGE_END` | 2 px that way; `START` and `END` flip in a right-to-left language |
| `NUDGE_UP_END`, `NUDGE_UP_START`, `NUDGE_DOWN_START`, `NUDGE_DOWN_END` | the diagonals; `NUDGE_UP_END` is a link that leaves the app, drawn with `ARROW_UP_RIGHT` as its end icon; `DSButton`, `DSLink` and `DSList.Item` give it where their anchor is external and no motion is set (`RULE.SUPPORT.SURFACE.285`) |
| `LIFT` | a 2 px rise |
| `ZOOM_IN`, `ZOOM_OUT` | x 1.12, x 0.88 |
| `FADE_IN`, `FADE_OUT` | opacity 0.4 at rest and full while held, or the reverse; never 0 |
| `SPIN_ONCE`, `WIGGLE` | one turn, one short shake |
| `TURN_90`, `TURN_180` | a quarter or half turn while open |

- The nudges, zooms, turns, lift and fades take the hover duration; `SPIN_ONCE` and `WIGGLE` take the icon's emphasis duration.
- `hoverNode` shows another icon while the holder is hovered or pressed; the two cross-fade. `DSButton`'s icons, `DSMark` and `DSItem`'s media pass both through.
- Under reduced motion an icon swaps but does not move; fades and `hoverNode` stay.
- The theme's speed is `motionSpeed`: `DEFAULT`, `FAST` or `SLOW`. The loader (`DSSpinner`) is not motion and owns its turning.

## The choice tables of the other units — 🔮

Every other core unit with a closed prop has its table here, by the group the book puts it in. Each is in the book's own form: the cases with *The page writes* and *Rule* as their last two columns, the limits across a view, and the index by value. `spn-surface unit show <Unit>` prints a unit's table with its props from the snapshot this plugin carries.

### Actions

#### The choice table of `DSButtonGroup`

A group of buttons is chosen by how its buttons stand: in a row, or one under another where the place is narrow.

**The cases**, read from the top; the first that matches wins.

| The buttons are | Where they stand | `orientation` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a few acts or views of one thing, side by side | a row of a header, a bar or the content | `HORIZONTAL` (the unit's) | the place's | the buttons, and `attached` `false` where they are separate acts | this table |
| ways to go on, each a whole line, such as the ways to sign in again | a narrow dialog or a column | `VERTICAL` | the place's | the orientation | this table |
| one choice among a few views that stays chosen | — | not this unit: a `DSToggleGroup` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `orientation` | `HORIZONTAL` | buttons side by side. It is the unit's own default |
| `orientation` | `VERTICAL` | ways to go on, one under another |
| `size` | `XS` to `XL` | the place's; each button takes the group's |

#### The choice table of `DSToolbar`

A toolbar is chosen by the controls it holds for one surface, such as an editor, and runs the way that surface reads.

**The cases**, read from the top; the first that matches wins.

| The toolbar holds | Where it stands | `orientation` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| an editor's controls: bold, italic, a link | over what it edits | `HORIZONTAL` (the unit's) | the place's | the items | this table |
| the tools of a canvas | a column beside the canvas | `VERTICAL` | the place's | the orientation | this table |
| a row's or a header's actions | — | not a toolbar: the place's buttons | — | — | `RULE.SUPPORT.SURFACE.390` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `orientation` | `HORIZONTAL` | controls over what they edit. It is the unit's own default |
| `orientation` | `VERTICAL` | tools beside a canvas |
| `size` | `XS` to `XL` | the place's; each item takes the toolbar's |

### Data display

#### The choice table of `DSCard`

A card is chosen by what it holds. Its size is the size of its place, and it is opaque unless the page behind it is meant to show through.

**The cases**, read from the top; the first that matches wins.

| What it holds | Where it stands | `opacity` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a block of a page with content of its own, such as a settings card: an item line in its header over a list | a column of a page, a cell of a grid, a panel's content | `OPAQUE` (the unit's) | the place's | nothing | `RULE.SUPPORT.SURFACE.221` |
| the same block over a picture or a band the app paints, where the band should show through | over the picture or the band | `TRANSLUCENT` | the place's | the opacity | `RULE.SUPPORT.SURFACE.192` |
| a block that is mostly its head, with a body the widget draws from data | — | not a card: a `DSCardWidget` | — | — | `RULE.SUPPORT.SURFACE.221` |
| a compact tile: a connected account, a chosen plan, a rail's switcher | — | not a card: a `DSItemCard` | — | — | this table |

**The limits across a view.** The card holds none of its own. A pressed card is pressed whole, and the cards of one row end on one line (`RULE.SUPPORT.SURFACE.270`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `opacity` | `OPAQUE` | every card that does not stand over a picture or a band. It is the unit's own default |
| `opacity` | `TRANSLUCENT` | a card over a picture or a band the app paints (`RULE.SUPPORT.SURFACE.192`) |
| `size` | `XS` to `XL` | the place's. A page writes one only to keep a size of its own, such as a small card of a sign-in step |

#### The choice table of `DSItemCard`

A tile is chosen by where it stands. With no `card.color` it wears the tint of the surface under it, so in a rail it takes the navigation's tint and in the content the content's. A colour makes it a card of its own, as `DSCard` is. Its size is the size of its place.

**The cases**, read from the top; the first that matches wins.

| What it holds | Where it stands | `card.color` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a switcher or an account row, which a menu wraps | the navigation: a rail, a dock's column, a phone's drawer | left out: the navigation's tint, from the surface it stands on | the item and the menu | `RULE.SUPPORT.SURFACE.226` |
| a linked tile, a connected account, a chosen plan | the content: a settings list, a detail page's side column | left out: the content's tint, from the surface it stands on | the item, and `selected` on the chosen tile | `RULE.SUPPORT.SURFACE.226` |
| a boxed item of a feature, on a `GRID` or a `LIST` | a feature whose `items.surface` is set | the feature's: its `items.surface`, else the card look of the theme | the feature's `items`, as data | `RULE.SUPPORT.SURFACE.269` |
| a tile that stands apart from the surface under it, as a card of its own | the content | the page's: `BASE`, `DEFAULT` or `PRIMARY`, as `DSCard` takes it | the colour | this table |

**The limits across a view.** A navigation's colour stays in the navigation: a tile in the content never takes it (`RULE.SUPPORT.SURFACE.226`).

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `card.color` | `BASE` | a tile as a card of its own on a tinted surface, bordered; or a feature's boxed items whose `items.surface` gives it |
| `card.color` | `DEFAULT` | a tile as a card of its own in the quiet tint; or a feature's boxed items whose `items.surface` gives it |
| `card.color` | `PRIMARY` | a tile as a card of its own in the brand's colour; or a feature's boxed items whose `items.surface` gives it. Left out in a `PRIMARY` rail, the tile takes the rail's tint, which is the place's and no colour of its own |

#### The choice table of `DSCodeBlockView`

A sample of code is chosen by the language it is written in, which is the sample's own, and it follows the app's mode.

**The cases**, read from the top; the first that matches wins.

| The code is | Where it stands | `mode` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a sample of code in a guide, with its filename | the content of a page or a part | left out: the app's | the place's | the code, its `language` and its filename | this table |
| a sample that must read the same in either mode, such as a site's band of code | a band of a site | `DARK` or `LIGHT` | the place's | the mode | this table |
| a value a person edits as code | — | not this unit: a `DSJSONControl` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `mode` | `LIGHT` · `DARK` | left out, the app's; written only where the sample must read the same in both |
| `language` | `PLAIN` to `SHELL` | the sample's own language, written with the sample |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSJSONView`

A view of JSON is chosen by the value it shows, read-only, and it follows the app's mode.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `mode` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a payload a person reads: a webhook's body, an event | a dialog or a part | left out: the app's | the value | this table |
| a payload shown beside code that is always dark | beside that code | `DARK` | the mode | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `mode` | `LIGHT` · `DARK` | left out, the app's; written only beside code of a fixed mode |

#### The choice table of `DSAccordion`

An accordion is chosen by a part of a settings form a person opens to change, with its indicator at the end, as a select's is.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | `indicatorPlacement` | `indicatorExpandedIcon` and `indicatorCollapsedIcon` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| the parts of a settings form, whose fields already hold values | a settings page or panel | left out: the end | left out: the unit's chevrons | the place's | the header and the content | `RULE.SUPPORT.SURFACE.191` |
| a level of a tree, whose title leads | a row of the tree | `LEFT` | left out | the place's | the placement | this table |
| the fields of a task form | — | not this unit: one scroll, or steps | — | — | — | `RULE.SUPPORT.SURFACE.191` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `indicatorPlacement` | `RIGHT` | left out, at the end |
| `indicatorPlacement` | `LEFT` | a level of a tree |
| `indicatorExpandedIcon` | `ACTIVITY` to `ZAP` | the unit's chevron; a page writes one only where a part opens a thing that is not a section, such as a minus |
| `indicatorCollapsedIcon` | `ACTIVITY` to `ZAP` | the unit's chevron, as `indicatorExpandedIcon` is, such as a plus |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSAccordionGroup`

A group of accordions is chosen as one accordion is, for the parts of one settings form, the first open.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | `indicatorPlacement` | `indicatorExpandedIcon` and `indicatorCollapsedIcon` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| the parts of a settings form, whose fields already hold values | a settings page or panel | left out: the end | left out: the unit's chevrons | the place's | the header and the content | `RULE.SUPPORT.SURFACE.191` |
| a level of a tree, whose title leads | a row of the tree | `LEFT` | left out | the place's | the placement | this table |
| the fields of a task form | — | not this unit: one scroll, or steps | — | — | — | `RULE.SUPPORT.SURFACE.191` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `indicatorPlacement` | `RIGHT` | left out, at the end |
| `indicatorPlacement` | `LEFT` | a level of a tree |
| `indicatorExpandedIcon` | `ACTIVITY` to `ZAP` | the unit's chevron; a page writes one only where a part opens a thing that is not a section, such as a minus |
| `indicatorCollapsedIcon` | `ACTIVITY` to `ZAP` | the unit's chevron, as `indicatorExpandedIcon` is, such as a plus |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSAddressView`

An address is chosen by the room it has: its lines one under another under a label, or one line in a row.

**The cases**, read from the top; the first that matches wins.

| The address stands | Where | `layout` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| on its own, under its label: an order's address | a reading of a record | `BLOCK` (the unit's) | the place's | the address | this table |
| in one line among others | a row of a list, or a cell | `INLINE` | the place's | the layout | this table |
| as fields a person fills | — | not this unit: a `DSAddressForm` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `layout` | `BLOCK` | an address on its own. It is the unit's own default |
| `layout` | `INLINE` | an address in a row or a cell |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSAvatarGroup`

A group of avatars is chosen by the people of one set, sized by the words it stands beside, as one avatar is.

**The cases**, read from the top; the first that matches wins.

| The people are | Where they stand | `scaleSize` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a team's members, or the people a thing is shared with | among a card's facts, or at a row's end | the step of the words beside it | the place's | the avatars and `max` | this table |
| one person | — | not this unit: a `DSAvatar` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `scaleSize` | `XXS` to `XXL5` | the step of the words beside it |
| `size` | `XS` to `XL` | the place's. A page sizes the group by `scaleSize` |

#### The choice table of `DSItemFacts`

A line of facts is chosen by the row it stands in, and it takes that row's level, as an item line's facts do.

**The cases**, read from the top; the first that matches wins.

| The facts are | Where they stand | `pageLevel` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a list row's one line of facts, with no title | a row of a list | `CONTENT` (the unit's) | the facts | `RULE.SUPPORT.SURFACE.132` |
| the facts of a value inside another unit, such as a cell | inside that unit | `INLINE` | the facts and the level | `RULE.SUPPORT.SURFACE.132` |
| facts under a title | — | not this unit: the item line's `facts` | — | `RULE.SUPPORT.SURFACE.132` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `pageLevel` | `CONTENT` | a row of a list. It is the unit's own default |
| `pageLevel` | `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `INLINE` | the level of the row or the unit it stands in |

### Data entry · Fields

#### The choice table of `DSInput`

A field of text is chosen by the value it holds. Its type says what the value is, which also gives the keyboard; its mode asks for another keyboard only where the type does not say it. Its size is its place's, and its error is its field's.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `type` | `mode` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a text: a name, a title, a code | a field of a form | `TEXT` (the unit's) | `TEXT` (the unit's) | the place's | the field's | nothing | `RULE.SUPPORT.SURFACE.299` |
| an email address | a field of a form | `EMAIL` | `TEXT` (the unit's) | the place's | the field's | the type | `RULE.SUPPORT.SURFACE.299` |
| a password or a secret a person types and no one reads back | a field of a form | `PASSWORD` | `TEXT` (the unit's) | the place's | the field's | the type, and `autoComplete` | this table |
| a text that is digits alone, such as a postal code or a card's last four | a field of a form | `TEXT` (the unit's) | `NUMERIC` | the place's | the field's | the mode | this table |
| a web address or a domain | a field of a form | `TEXT` (the unit's) | `URL` | the place's | the field's | the mode | this table |
| a search over a list | a bar over the list, or a filter | `TEXT` (the unit's) | `SEARCH` | the place's | — | the mode, and the icon `SEARCH` at its start | this table |
| a number, or an amount | — | not this unit: `DSInputNumber` | — | — | — | — | `RULE.SUPPORT.SURFACE.299` |
| a phone number | — | not this unit: `DSInputPhone` | — | — | — | — | `RULE.SUPPORT.SURFACE.299` |
| a colour | — | not this unit: `DSColorPicker` | — | — | — | — | this table |
| a code a person types from a message | — | not this unit: `DSInputOTP` | — | — | — | — | this table |

**The limits across a view.** The field holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `TEXT` | a text; digits kept as text; a web address; a search. It is the unit's own default |
| `type` | `EMAIL` | an email address |
| `type` | `PASSWORD` | a password or a secret |
| `type` | `NUMBER` | no case written yet: a number fits a `DSInputNumber`, which holds `number \| null` (`RULE.SUPPORT.SURFACE.299`) |
| `type` | `TEL` | no case written yet: a phone fits a `DSInputPhone`, which holds its country beside the number |
| `type` | `COLOR` | no case written yet: a colour fits a `DSColorPicker`, which writes its code in one form |
| `mode` | `TEXT` | every case that names no other. It is the unit's own default. Not drawn: a mode is a keyboard, which the library cannot draw |
| `mode` | `NUMERIC` · `URL` · `SEARCH` | digits kept as text; a web address; a search. Not drawn |
| `mode` | `EMAIL` | no case written yet: the type `EMAIL` already gives that keyboard |
| `mode` | `DECIMAL` · `TEL` | no case written yet: a decimal fits a `DSInputNumber`, and a phone a `DSInputPhone` |
| `mode` | `NONE` | no case written yet: a field that opens no keyboard fits a picker |
| `size` | `XS` to `XL` | the place's. A page writes one only to keep a size of its own |
| `validationType` | `ERROR` | the field's, which `DSForm.Field` gives from the field's check (`RULE.SUPPORT.SURFACE.189`) |

#### The choice table of `DSToggleGroup`

A group of toggles is one choice among a few short values, shown whole. Its colour is the neutral one, because a choice says no state.

**The cases**, read from the top; the first that matches wins.

| The choice is | Where it stands | `color` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| one view among two to four, or one short value of a form | a bar over what it switches, or a field | `DEFAULT` (the unit's) | the place's | the field's | the options, and `attached` `false` where each stands apart | `RULE.SUPPORT.SURFACE.299` |
| a choice of several values | — | not this unit: a `DSToggleGroupMulti` | — | — | — | `RULE.SUPPORT.SURFACE.299` |
| a choice of more than about five values | — | not this unit: a `DSSelect` | — | — | — | `RULE.SUPPORT.SURFACE.299` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | every choice. Its pressed toggle keeps a fill a person can see (`RULE.SUPPORT.SURFACE.146`) |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: a hue says a state, and a choice is no state |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSInputOTP`

A field of a code is chosen by the code a person was sent. Its number of digits is the code's own.

**The cases**, read from the top; the first that matches wins.

| The code is | Where it stands | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a code sent to confirm a sign-in, an email or a phone | a step of a sign-in or of a form | the place's | the field's | the `digits` the code has | this table |
| a password | — | not this unit: a `DSInput` of `PASSWORD` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `digits` | `FOUR` · `SIX` | the code's own number of digits, as the server sends it |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSRadio`

A radio standing alone is one option of a choice a page lays out itself; its type is the group's.

**The cases**, read from the top; the first that matches wins.

| The choice is | Where it stands | `type` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| one of a few options a person reads, each with its label and perhaps a line under it | a field of a form | `DEFAULT` (the unit's) | the place's | the field's | the options | `RULE.SUPPORT.SURFACE.299` |
| one of a few short values, such as a plan, shown as chips | a field of a form | `BADGE` | the place's | the field's | the type | this table |
| one of more than about five values | — | not this unit: a `DSSelect` | — | — | — | `RULE.SUPPORT.SURFACE.299` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `DEFAULT` | options a person reads. It is the unit's own default |
| `type` | `BADGE` | a few short values shown as chips |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSRadioGroup`

A radio group is chosen by a choice of one among a few options, shown whole.

**The cases**, read from the top; the first that matches wins.

| The choice is | Where it stands | `type` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| one of a few options a person reads, each with its label and perhaps a line under it | a field of a form | `DEFAULT` (the unit's) | the place's | the field's | the options | `RULE.SUPPORT.SURFACE.299` |
| one of a few short values, such as a plan, shown as chips | a field of a form | `BADGE` | the place's | the field's | the type | this table |
| one of more than about five values | — | not this unit: a `DSSelect` | — | — | — | `RULE.SUPPORT.SURFACE.299` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `DEFAULT` | options a person reads. It is the unit's own default |
| `type` | `BADGE` | a few short values shown as chips |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSToggle`

A toggle is chosen by a setting a person turns on and off where they work, such as bold in an editor. Its colour is the neutral one, because a setting says no state.

**The cases**, read from the top; the first that matches wins.

| The choice is | Where it stands | `color` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a setting of what a person edits: bold, italic | a toolbar or a bar over what it changes | `DEFAULT` (the unit's) | the place's | the field's | the label or the icon | `RULE.SUPPORT.SURFACE.146` |
| a setting of a record, kept when it is saved | — | not this unit: a `DSSwitch` | — | — | — | `RULE.SUPPORT.SURFACE.167` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | every toggle. It is the unit's own default (`RULE.SUPPORT.SURFACE.146`) |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: a hue says a state, and a choice is no state |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSToggleGroupMulti`

A group of toggles of many is a choice of several short values, shown whole, such as the days of a week. Its colour is the neutral one.

**The cases**, read from the top; the first that matches wins.

| The choice is | Where it stands | `color` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| several of a few short values: the days of a week, the channels of a message | a field of a form | `DEFAULT` (the unit's) | the place's | the field's | the options | `RULE.SUPPORT.SURFACE.299` |
| several of many values | — | not this unit: a `DSSelectMulti` | — | — | — | `RULE.SUPPORT.SURFACE.299` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | every choice. It is the unit's own default |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: a hue says a state, and a choice is no state |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

### Data entry · Pickers

#### The choice table of `DSDatePicker`

A date picker is chosen by a day a person sets. The form of the date is the person's own, from the app.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `format` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a day with no time: a due date, a birthday | a field of a form | left out: the app's | the place's | the field's | the value | `RULE.SUPPORT.SURFACE.123` |
| a day and a time | — | not this unit: a `DSDateTimePicker` | — | — | — | this table |
| a period | — | not this unit: a `DSDateRangePicker` | — | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `format` | `US_STANDARD` to `FULL_MONTH` | the app's: no case writes one (`RULE.SUPPORT.SURFACE.123`) |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSDateRangePicker`

A range picker is chosen by a period a person sets, from one day to another. The form of the dates is the person's own.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `format` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a report's period, or a filter's | a field of a form or a filter bar | left out: the app's | the place's | the field's | the value, and its shortcuts | `RULE.SUPPORT.SURFACE.123` |
| one day | — | not this unit: a `DSDatePicker` | — | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `format` | `US_STANDARD` to `FULL_MONTH` | the app's: no case writes one (`RULE.SUPPORT.SURFACE.123`) |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSTimePicker`

A time picker is chosen by a time of day a person sets. Its clock is the app's, and its steps follow how exact the time must be.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `type` | `intervalMinutes` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a reminder's time, a meeting's start | a field of a form | left out: the app's clock | `MIN_15` (the unit's) | the place's | the field's | the value | `RULE.SUPPORT.SURFACE.123` |
| a slot of a booking taken by the half hour or the hour | a field of a form | left out: the app's clock | `MIN_30` or `MIN_60` | the place's | the field's | the interval | this table |
| a day and a time | — | not this unit: a `DSDateTimePicker` | — | — | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `TWELVE_HOUR` · `TWENTY_FOUR_HOUR` | the app's clock: no case writes one (`RULE.SUPPORT.SURFACE.123`) |
| `intervalMinutes` | `MIN_15` | a time of day. It is the unit's own default |
| `intervalMinutes` | `MIN_30` · `MIN_60` | a slot taken by the half hour or the hour |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

#### The choice table of `DSDateTimePicker`

A date and time picker is chosen by a moment a person sets, such as when a message is sent. Its clock is the app's.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `timeFormat` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| when a message is sent, when a job runs once | a field of a form | left out: the app's clock | the place's | the field's | the value, and `min` where it must be in the future | `RULE.SUPPORT.SURFACE.123` |
| a day with no time | — | not this unit: a `DSDatePicker` | — | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `timeFormat` | `TWELVE_HOUR` · `TWENTY_FOUR_HOUR` | the app's clock: no case writes one (`RULE.SUPPORT.SURFACE.123`) |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

### Data entry · Compound fields

#### The choice table of `DSImagePicker`

An image picker is chosen by whether the person may change the picture.

**The cases**, read from the top; the first that matches wins.

| The picture is | Where it stands | `mode` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a person's or an organization's own picture, which they may change | over the form that edits it | `EDIT` | the mode | this table |
| the same picture, shown where it may not be changed | a head or a reading | `VIEW` | the mode | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `mode` | `EDIT` | a picture its owner may change |
| `mode` | `VIEW` | a picture shown where it may not be changed |

#### The choice table of `DSJSONControl`

A JSON field is chosen by a value a person writes as JSON, such as a webhook's headers, and it follows the app's mode.

**The cases**, read from the top; the first that matches wins.

| The value is | Where it stands | `mode` | `size` | `validationType` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| JSON a person writes: a webhook's headers, a sample payload | a field of a form | left out: the app's | the place's | the field's | the schema and its sample | this table |
| JSON a person only reads | — | not this unit: a `DSJSONView` | — | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `mode` | `LIGHT` · `DARK` | left out, the app's; written only beside code of a fixed mode |
| `size` | `XS` to `XL` | the place's |
| `validationType` | `ERROR` | the field's, from `DSForm.Field` |

### Feedback

#### The choice table of `DSAlert`

An alert is chosen by what it says. Its colour says the state of what it reports, in the hue a badge gives the same state, and its size is the size of what it stands over.

**The cases**, read from the top; the first that matches wins.

| What it says | Where it stands | `color` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a warning to read before acting, such as a change that reaches every member | over the form or the part it concerns | `WARNING` | the place's | the text and the colour | this table |
| a task that failed, with the way back | over the fields of the form that sent it | `ERROR` | the place's | the text, the colour, and the way back in `description` or `linkInfo` | this table |
| work the system is doing now, such as an import that runs | over the part whose data it changes | `INFO` | the place's | the text and the colour | this table |
| a result that stays true while the page is open, such as a domain verified | over the part it concerns | `SUCCESS` | the place's | the text and the colour | this table |
| a task done, which leaves nothing to read on the page | — | not an alert: a `DSToast` in `SUCCESS` | — | — | this table |
| a field whose value fails its check | under its field | not an alert: the field's message line | — | — | `RULE.SUPPORT.SURFACE.189` |

**The limits across a view.** The alert holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `WARNING` · `ERROR` · `INFO` · `SUCCESS` | each by its case, in the hue a badge gives the same state (`RULE.SUPPORT.SURFACE.369`) |
| `size` | `XS` to `XL` | the place's, the size of what the alert stands over |

#### The choice table of `DSSkeleton`

A skeleton is chosen by what will stand in its place once the data has come. It draws the shape of that block, so the page does not jump when the data arrives.

**The cases**, read from the top; the first that matches wins.

| What is coming | Where it stands | `type` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| the rows of a list | the list's place | `LIST` | the type | this table |
| the fields of a form, while the record it edits is read | the form's place | `FORM` | the type | this table |
| one line: a value, a title, a reading | the line's place | `LINE` | the type | this table |
| a paragraph, or a preview of words | the paragraph's place | `TEXT` | the type | this table |
| the rows of a table, or a whole page while its route is read | the table's place, or the page's content | `TABLE` | the type | this table |
| a grid of cards | the grid's place | `CARD` | the type, and `gridColumns` as the grid's | this table |
| a task a person started, such as a save | — | not a skeleton: the `loading` of the button that started it | — | this table |

**The limits across a view.** A part that is read shows one skeleton in its place, and no spinner beside it.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `LIST` · `FORM` · `LINE` · `TEXT` · `TABLE` · `CARD` | each by its case |

#### The choice table of `DSToast`

A toast is chosen by a task that ended and leaves nothing to read on the page. Every toast of an app stands in one corner, so a person learns where to look.

**The cases**, read from the top; the first that matches wins.

| The task | Where it stands | `color` | `placement` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| is done | the corner at the foot and the end of the screen | `SUCCESS` | `BOTTOM_RIGHT` | the text, the colour and the placement | this table |
| failed, with nothing on the page to fix | the same corner | `ERROR` | `BOTTOM_RIGHT` | the text, the colour and the placement | this table |
| failed in a form a person can fix | — | not a toast: a `DSAlert` in `ERROR` over the form | — | — | this table |
| asks to be read before acting, or runs still | — | not a toast: a `DSAlert` | — | — | this table |

**The limits across a view.** An app shows its toasts in one corner.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `SUCCESS` · `ERROR` | a task done; a task that failed with nothing to fix |
| `color` | `INFO` · `WARNING` | no case written yet: what a person reads before acting, and work that runs, fit on the page as a `DSAlert` |
| `placement` | `BOTTOM_RIGHT` | every toast, as every app draws it |
| `placement` | `TOP` · `BOTTOM` · `TOP_LEFT` · `TOP_RIGHT` · `BOTTOM_LEFT` | the design system's: one corner for every toast. `TOP_RIGHT` is the unit's own default, which every page replaces until the design system moves it |

#### The choice table of `DSSpinner`

A spinner is chosen by a wait whose result has no shape to draw yet. Where the shape is known, a skeleton stands in its place.

**The cases**, read from the top; the first that matches wins.

| The wait is for | Where it stands | `color` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a list that a menu or a step fetches, with no rows to outline | inside the menu or the step | `DEFAULT` (the unit's) | the place's | nothing | this table |
| rows, fields or a card whose shape is known | — | not a spinner: a `DSSkeleton` | — | — | this table |
| a task a person started from a button | — | not a spinner: the button's `loading` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | every wait. It is the unit's own default |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: a wait says no state |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSProgress`

A bar of progress is chosen by how far a thing has gone, and its colour says a state only where the measure has one.

**The cases**, read from the top; the first that matches wins.

| The bar shows | Where it stands | `color` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| work moving to its end: an upload, an import | under or beside what moves | `DEFAULT` (the unit's) | the place's | the value | this table |
| a measure whose level says a state, such as a plan's use near its limit | beside its label | the state's hue, as a badge gives it | the place's | the value and the colour | `RULE.SUPPORT.SURFACE.369` |
| the steps of a flow | — | not a bar: a `DSStepper` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | work moving to its end. It is the unit's own default |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | a measure whose level says that state (`RULE.SUPPORT.SURFACE.369`) |
| `color` | `PRIMARY` · `CUSTOM` | no case written yet: a bar says how far, and the brand or a colour of a person's own says nothing more |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSProgressCircle`

A ring of progress is chosen as a bar is, by how far a thing has gone, where the room is square: a plan's use, a tile's count.

**The cases**, read from the top; the first that matches wins.

| The ring shows | Where it stands | `color` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| work moving to its end, in a square room | a tile or a row's end | `DEFAULT` (the unit's) | the place's | the value | this table |
| a measure whose level says a state, such as a plan's use near its limit | beside its label | the state's hue, as a badge gives it | the place's | the value and the colour | `RULE.SUPPORT.SURFACE.369` |
| progress along a line | — | not this unit: a `DSProgress` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | work moving to its end. It is the unit's own default |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | a measure whose level says that state (`RULE.SUPPORT.SURFACE.369`) |
| `color` | `PRIMARY` · `CUSTOM` | no case written yet: a ring says how far, and the brand or a colour of a person's own says nothing more |
| `size` | `XS` to `XL` | the place's |

### Structure

#### The choice table of `DSSeparator`

A separator is chosen by what it parts: blocks one under another, or items in a row.

**The cases**, read from the top; the first that matches wins.

| It parts | Where it stands | `orientation` | `color` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| two blocks one under another, or two ways to do one thing, with `label` *or* | between them | `HORIZONTAL` (the unit's) | `DEFAULT` (the unit's) | nothing, or the label | this table |
| groups of items in a row, such as a toolbar's | between them | `VERTICAL` | `DEFAULT` (the unit's) | the orientation | this table |
| the rows of a list, or the parts of a card | — | not a separator: the list's or the card's `divided` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `orientation` | `HORIZONTAL` | blocks one under another. It is the unit's own default |
| `orientation` | `VERTICAL` | groups in a row |
| `color` | `DEFAULT` | every line. It is the unit's own default |
| `color` | `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` · `CUSTOM` | no case written yet: a line parts two things and says no state |

#### The choice table of `DSCollapsible`

A collapsible part is chosen by what it hides: more of a form a person rarely needs. Its indicator stands at the end, as a select's does, and turns as it opens.

**The cases**, read from the top; the first that matches wins.

| It hides | Where it stands | `indicatorPlacement` | `indicatorExpandedIcon` and `indicatorCollapsedIcon` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| advanced settings a person rarely needs | under the form they belong to | left out: the end | left out: the unit's chevrons | the place's | the header | this table |
| a level of a tree, whose title leads | a row of the tree | `LEFT` | left out | the place's | the placement | this table |
| the parts of a settings form, one open at a time | — | not this unit: a `DSAccordionGroup` | — | — | — | `RULE.SUPPORT.SURFACE.191` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `indicatorPlacement` | `RIGHT` | left out, at the end |
| `indicatorPlacement` | `LEFT` | a level of a tree |
| `indicatorExpandedIcon` | `ACTIVITY` to `ZAP` | the unit's chevron; a page writes one only where its part opens a thing that is not a section, such as a minus |
| `indicatorCollapsedIcon` | `ACTIVITY` to `ZAP` | the unit's chevron, as `indicatorExpandedIcon` is, such as a plus |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSHScroll`

A row that scrolls across is chosen by a run of items wider than its place, such as tabs. Its arrows stand beside the row, or over it where the row must keep its width.

**The cases**, read from the top; the first that matches wins.

| The row holds | Where it stands | `arrowType` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a run of tabs or chips wider than its place | a bar of a page or a part | `DEFAULT` (the unit's) | the place's | the row, and `arrow` where a pointer needs them | this table |
| a run of cards, such as a shelf of products, that keeps its full width | a band of a site | `OVERLAY` | the place's | the arrow type | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `arrowType` | `DEFAULT` | arrows beside a row of tabs or chips. It is the unit's own default |
| `arrowType` | `OVERLAY` | arrows over a row of cards |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSScrollArea`

A scroll area is chosen by the way what it holds runs past a place of fixed size.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | `direction` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a long list | a panel of fixed height | `VERTICAL` (the unit's) | the height | this table |
| a row wider than its place | a part of fixed width | `HORIZONTAL` | the direction and the width | this table |
| a sheet larger than its place both ways, such as a preview | a part of fixed size | `BOTH` | the direction | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `direction` | `VERTICAL` | a long list. It is the unit's own default |
| `direction` | `HORIZONTAL` · `BOTH` | a wide row; a large sheet |

#### The choice table of `DSSurface`

A surface is chosen by how strongly a band of a page stands apart from the page, and in which hue. What stands on it reads its fill.

**The cases**, read from the top; the first that matches wins.

| The band is | Where it stands | `color` | `strength` | `painted` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a hero band in the brand's soft tint | the top of a site's page | `PRIMARY` | `SUBTLE` (the unit's) | left out | the colour | this table |
| a band that sets a part apart in the neutral greys | a band of a page | `DEFAULT` (the unit's) | `SUBTLE` (the unit's) | left out | nothing | this table |
| a band a step stronger, between two soft ones | a band of a page | the case's | `QUIET` | left out | the strength | this table |
| a closing call in the brand's full colour | the end of a site's page | `PRIMARY` | `SOLID` | left out | the colour and the strength | this table |
| a band that stays dark in either mode, such as a band of code | a band of a site | the case's | the case's | `DARK` | the painted mode | this table |
| a band that returns to the page's own surface between two tinted ones | a band of a page | `BASE` | `SUBTLE` (the unit's) | left out | the colour | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | a neutral band. It is the unit's own default |
| `color` | `PRIMARY` | a hero band; a closing call |
| `color` | `BASE` | a band on the page's own surface |
| `strength` | `SUBTLE` | a soft band. It is the unit's own default |
| `strength` | `QUIET` · `SOLID` | a band a step stronger; a closing call |
| `painted` | `DARK` | a band that stays dark in either mode |
| `painted` | `LIGHT` | a band that stays light in either mode, such as a sheet of paper |

### Media

#### The choice table of `DSIcon`

An icon is chosen by what it says, and it is sized and toned by the words it stands beside. Its colour says a state only where it says one.

**The cases**, read from the top; the first that matches wins.

| The icon | Where it stands | `color` | `tone` | `scaleSize` | `motion` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| names what the words beside it are about | beside a title or a label | left out | the tone of the words beside it | the step of the words beside it, as what stands beside what states | left out | the icon and the scale size | this table |
| says a state: a check passed, a warning | beside the words of that state | the state's hue, as a badge gives it | left out | the step of the words beside it | left out | the icon, the colour and the scale size | `RULE.SUPPORT.SURFACE.369` |
| marks a thing a person coloured, such as a type of their own | beside its name | `CUSTOM`, with `customColor` | left out | the step of the name beside it | left out | the icon and the colour | `RULE.SUPPORT.SURFACE.382` |
| moves with what holds it: a back arrow, a chevron that turns | inside its holder | left out | left out | the holder's | by its meaning | the motion | `RULE.SUPPORT.SURFACE.201` |
| is a kind of thing in the picture of an item line, or the app's own mark | — | not an icon alone: a `DSMark`, or the item line's `media` | — | — | — | — | `RULE.SUPPORT.SURFACE.388` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `DEFAULT` | left out, the colour of its tone |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | an icon that says that state (`RULE.SUPPORT.SURFACE.369`) |
| `color` | `CUSTOM` | a thing a person coloured, with `customColor` (`RULE.SUPPORT.SURFACE.382`) |
| `color` | `PRIMARY` | no case written yet: an icon in the brand is the app's own mark, a `DSMark` (`RULE.SUPPORT.SURFACE.387`) |
| `tone` | `DEFAULT` · `QUIET` · `MUTED` · `SUBTLE` | the tone of the words beside it; a bare icon of an item line draws muted (`RULE.SUPPORT.SURFACE.304`) |
| `tone` | `INVERSE` | the place's: an icon on a painted fill takes the fill's text, as `DSSurface` paints it |
| `scaleSize` | `XXS` to `XXL5` | the step of the words beside it. `MD` is the unit's own default |
| `motion` | `NUDGE_UP` to `LIFT` | by the icon's meaning, as the motion of an icon gives it (`RULE.SUPPORT.SURFACE.201`) |

#### The choice table of `DSEmbed`

An embedded page is chosen by the page it shows, and it follows the app's mode unless that page has one of its own.

**The cases**, read from the top; the first that matches wins.

| It shows | Where it stands | `mode` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a page of the app's own, such as a sign-in drawn inside a page | a part of a page | left out: the app's | the source and the height | this table |
| a page drawn for one mode alone, such as an email's preview | a part of a page | `LIGHT` | the mode | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `mode` | `LIGHT` | a page drawn for light alone, such as an email |
| `mode` | `DARK` | a page drawn for dark alone |

#### The choice table of `DSImage`

A picture is chosen by what it shows: its shape is the picture's own aspect, and its width the step of the place it fills.

**The cases**, read from the top; the first that matches wins.

| The picture is | Where it stands | `shape` | `widthStep` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a product's picture in a card | the top of a card | `SQUARE` | left out: the card's width | the picture and the shape | this table |
| a photo or a scene in a band or a card | a band or a card | `FILM` | left out | the shape | this table |
| a band's picture or a still of a video | a band of a site | `WIDE` | the step of the band's column | the shape and the width | this table |
| a picture shown at its own shape, such as a diagram | a part of a page | `NONE` | the step that fits it | the width | this table |
| a person's picture standing alone, such as on a profile | a head | `CIRCLE` | the step of the head | the shape | this table |
| a person beside their name | — | not this unit: a `DSAvatar` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `shape` | `NONE` · `FILM` · `WIDE` · `SQUARE` · `CIRCLE` | each by its case |
| `widthStep` | `NONE` to `WIDTH_1280` | left out, the width of its place; else the step of the column it fills |

### Navigation

#### The choice table of `DSLink`

A link is chosen by where it stands. Among words it takes the brand's colour and an underline under the pointer, so a person tells it from the words around it. Alone in a row it is a link by its place, and it stays neutral.

**The cases**, read from the top; the first that matches wins.

| The link | Where it stands | `color` | `tone` | `underline` | `size` | `authzDenied` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a link in a line of words | among words | `PRIMARY` (the unit's) | left out | left out: the line shows under the pointer | the place's | `HIDE` (the unit's) | nothing | this table |
| a link in a paragraph a person reads through, such as a legal page | among long words | `PRIMARY` (the unit's) | left out | `SOLID` | the place's | `HIDE` (the unit's) | the underline | this table |
| a link alone in a row of a list | a row of a `DSList` | `DEFAULT` | left out | left out: it brightens under the pointer | the place's | `HIDE` (the unit's) | the colour | `RULE.SUPPORT.SURFACE.294` |
| one link among many of a site's footer | the footer of a site | `DEFAULT` | `MUTED`, or `QUIET` for the footer's headings | left out | the place's | `HIDE` (the unit's) | the colour and the tone | this table |
| a link a person may not follow, shown so they know it is there | anywhere | the case's | the case's | the case's | the place's | `DISABLE` | the denial | this table |
| a link that leaves the site | anywhere | the case's | the case's | the case's | the place's | the case's | nothing more: the unit draws `ARROW_UP_RIGHT` after it | `RULE.SUPPORT.SURFACE.285` |
| an act, not a place to go | — | not a link: a `DSButton` | — | — | — | — | — | `RULE.SUPPORT.SURFACE.377` |

**The limits across a view.** The link holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `color` | `PRIMARY` | a link among words. It is the unit's own default |
| `color` | `DEFAULT` | a link alone in a row; a link of a site's footer |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | no case written yet: a hue says a state (`RULE.SUPPORT.SURFACE.065`), and a link is a place to go |
| `color` | `CUSTOM` | ignored: a link takes no `customColor` |
| `tone` | `DEFAULT` · `MUTED` · `QUIET` | left out, the colour's own; `MUTED` the links of a site's footer, `QUIET` the footer's headings |
| `tone` | `SUBTLE` | no case written yet: the faintest tone is for marks that are not words |
| `tone` | `INVERSE` | the place's: a link on a painted fill takes the fill's text, as `DSSurface` paints it |
| `underline` | `SOLID` | a link in a paragraph a person reads through |
| `underline` | `DOTTED` · `DASHED` | no case written yet: a dotted line marks a word a tooltip explains, which a `DSText` draws |
| `size` | `XS` to `XL` | the place's |
| `authzDenied` | `HIDE` | a link a person may not follow is left out. It is the unit's own default |
| `authzDenied` | `DISABLE` | a link shown so a person knows it is there |

#### The choice table of `DSNavBarSide`

A bar at the side is chosen by whether it is the app's navigation, at the edge of the screen, or a column of a page.

**The cases**, read from the top; the first that matches wins.

| The bar is | Where it stands | `placement` | `side` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| an app's rail, its account at the end | the edge of the screen | `EDGE` (the unit's) | `LEFT` (the unit's) | the place's | nothing: the layout places it | this table |
| the sections of a settings page | a column of the page | `INLINE` | `LEFT` (the unit's) | the place's | the placement | this table |
| a page's own tools, at its end, such as an editor's panels | the end of the page | `INLINE` | `RIGHT` | the place's | the placement and the side | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `EDGE` | an app's rail. It is the unit's own default |
| `placement` | `INLINE` | a column of a page |
| `side` | `LEFT` | the navigation. It is the unit's own default |
| `side` | `RIGHT` | a page's own tools at its end |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSMenubar`

A menubar is chosen by an editor's menus in a row, each opening its own list, such as File, Edit and View.

**The cases**, read from the top; the first that matches wins.

| The menus are | Where they stand | `authzDenied` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| an editor's menus | over what it edits | `HIDE` (the unit's) | the place's | the nodes | this table |
| menus a person may not use, shown so they know they exist | over what it edits | `DISABLE` | the place's | the denial | this table |
| a row's actions | — | not this unit: a `DSDropdownMenu` | — | — | `RULE.SUPPORT.SURFACE.390` |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `authzDenied` | `HIDE` | a menu a person may not use is left out. It is the unit's own default |
| `authzDenied` | `DISABLE` | menus shown so a person knows they exist |
| `size` | `XS` to `XL` | the place's |

### Popovers

#### The choice table of `DSDropdownMenu`

A menu is chosen by the actions it holds behind one trigger, and it opens where its trigger leaves room.

**The cases**, read from the top; the first that matches wins.

| The menu holds | Where it stands | `placement` | `authzDenied` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| a row's or a header's other actions, behind "⋯" | the end of the row or the header | `BOTTOM_RIGHT` | `HIDE` (the unit's) | the place's | the nodes and the placement | `RULE.SUPPORT.SURFACE.390` |
| an app's menus at the start of its bar | the start of a bar | `BOTTOM_LEFT` (the unit's) | `HIDE` (the unit's) | the place's | the nodes | this table |
| the account or the organization of a rail | the foot or the head of a rail | `RIGHT`, or the rail's side | `HIDE` (the unit's) | the place's | the placement | this table |
| actions a person may not take, shown so they know they exist | any of the above | the case's | `DISABLE` | the place's | the denial | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `LEFT` to `LEFT_BOTTOM` | the room the trigger leaves: under it where there is room, else over it, else beside it; the unit turns to the side with room. `BOTTOM_LEFT` is the unit's own default |
| `authzDenied` | `HIDE` | an action a person may not take is left out. It is the unit's own default |
| `authzDenied` | `DISABLE` | actions shown so a person knows they exist |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSPopover`

A popover is chosen by what a person does in it: a few words read under the pointer, or a control they press open and act in.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | `trigger` | `placement` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| controls or several lines a person acts in: a filter's options, a theme's choices | from the button that opens it | `CLICK` | the room the trigger leaves | the content, the trigger and the placement | this table |
| a few words that explain the control under the pointer | beside the control | `HOVER` (the unit's) | the room the trigger leaves | the content | this table |
| a label of an icon-only button | — | not this unit: a `DSTooltip` | — | — | this table |
| a person's or a record's card over its name | — | not this unit: a `DSHoverCard` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `trigger` | `CLICK` | a popover a person acts in |
| `trigger` | `HOVER` | a few words that explain a control. It is the unit's own default |
| `placement` | `LEFT` to `LEFT_BOTTOM` | the room the trigger leaves: under it where there is room, else over it, else beside it; the unit turns to the side with room |

#### The choice table of `DSContextMenu`

A context menu is chosen by the actions of a thing a person presses with the right button, and it opens where they pressed.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | `placement` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a file's or a row's actions | where the person pressed | `LEFT` (the unit's) | the place's | the nodes | this table |
| the same, near the end of the screen | where the person pressed | `RIGHT` | the place's | nothing: the unit turns to the side with room | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `LEFT` · `RIGHT` | the room the trigger leaves: the side named where there is room, else the one opposite; the unit turns to the side with room. `LEFT` is the unit's own default |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSTooltip`

A tooltip is chosen by the label of a control that shows none, such as an icon-only button.

**The cases**, read from the top; the first that matches wins.

| It says | Where it stands | `placement` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| an icon-only button's label | over the button | `TOP` (the unit's) | the place's | nothing: the button shows its `ariaLabel` | `RULE.SUPPORT.SURFACE.144` |
| what a term means | over the word | `TOP` (the unit's) | the place's | the words | this table |
| more than a line, or anything a person acts in | — | not this unit: a `DSPopover` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `LEFT` to `LEFT_BOTTOM` | the room the trigger leaves: the side named where there is room, else the one opposite; the unit turns to the side with room. `TOP` is the unit's own default |
| `size` | `XS` to `XL` | the place's |

#### The choice table of `DSHoverCard`

A hover card is chosen by a person or a record shown whole over its name.

**The cases**, read from the top; the first that matches wins.

| It shows | Where it stands | `placement` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a person's card over their name | under the name | `BOTTOM` (the unit's) | the content | this table |
| words that explain a control | — | not this unit: a `DSTooltip` | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `placement` | `LEFT` to `LEFT_BOTTOM` | the room the trigger leaves: the side named where there is room, else the one opposite; the unit turns to the side with room. `BOTTOM` is the unit's own default |

### Typography

#### The choice table of `DSText`

Words are chosen by what they are to the person reading. Their step says how large and how heavy they are, and their tone how far they stand back. A title of a box is an item line in its header, and not a `DSText`.

**The cases**, read from the top; the first that matches wins.

| The words are | Where they stand | `typography` | `color` | `tone` | `format` | `underline` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a paragraph a person reads | the content of a page or of a part | `CONTENT_MD` | left out | left out: the body's | left out | left out | the step | `RULE.SUPPORT.SURFACE.103` |
| words a person scans down a list: a line of a row, a cell, a card's body | a row, a cell, a card | `CONTENT_SM` | left out | left out: the body's | left out | left out | the step | `RULE.SUPPORT.SURFACE.103` |
| a label a person reads to learn what a value is, or a fact | beside its value, among facts | `CONTENT_SM` | left out | `MUTED` | left out | left out | the step and the tone | `RULE.SUPPORT.SURFACE.166` |
| a description that stands a step back under a title the page draws itself | under the title | the step of its level | left out | `QUIET` | left out | left out | the step and the tone | `RULE.SUPPORT.SURFACE.143` |
| a note that stands back from what it notes: a line under a list, the time or the person beside an entry, a site's fine print | under or beside what it notes | `CONTENT_SM`, or `CONTENT_XS` for fine print | left out | `SUBTLE` | left out | left out | the step and the tone | this table |
| a title the page draws itself, where no box gives one: a group of a form, a name in a step | over what it names | `TITLE_SM` to `TITLE_LG`, by its level | left out | left out | left out | left out | the step | `RULE.SUPPORT.SURFACE.103` |
| a display heading: a site's band, a home's greeting | the head of a band | `HEADING_LG` and up, as the site patterns give it | left out | left out | left out | left out | the step | `RULE.SUPPORT.SURFACE.103` |
| a sentence that reports a state: a count gone wrong, a check that passed | in the part it reports on | the place's step | `ERROR` or `SUCCESS`, the hue a badge gives the state | left out | left out | left out | the step and the colour | `RULE.SUPPORT.SURFACE.369` |
| a short label over a title that the site's look sets in capitals | over the title | `CONTENT_XS` | left out | `MUTED` | `UPPERCASE` | left out | the step, the tone and the format | this table |
| a word a tooltip explains: a term, an abbreviation | in a line of words | the line's step | left out | left out | left out | `DOTTED` | the underline | this table |
| a link among words | — | not words: a `DSLink` | — | — | — | — | — | `RULE.SUPPORT.SURFACE.294` |

**The limits across a view.** The words hold none of their own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `typography` | `HEADING_XXL5` to `HEADING_XXS` | a display heading, at the step the site patterns or the level's title give |
| `typography` | `TITLE_XXL5` to `TITLE_XXS` | a title the page draws itself, at its level's step |
| `typography` | `CONTENT_XXL5` to `CONTENT_XXS` | words, by their place: `CONTENT_MD` a paragraph, `CONTENT_SM` a line of a row, a label and a note, `CONTENT_XS` fine print |
| `color` | `DEFAULT` | left out, the body's colour |
| `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | a sentence that reports that state, in the hue a badge gives it (`RULE.SUPPORT.SURFACE.369`) |
| `color` | `PRIMARY` | no case written yet: words in the brand's colour read as a link, and a link fits a `DSLink` |
| `color` | `CUSTOM` | no case written yet: a colour a person chose fits a badge (`RULE.SUPPORT.SURFACE.382`) or `DSColorView` |
| `tone` | `DEFAULT` | left out, the body's tone. It is the unit's own default |
| `tone` | `QUIET` | a description a step back (`RULE.SUPPORT.SURFACE.143`) |
| `tone` | `MUTED` | a label, a fact; a short label over a title (`RULE.SUPPORT.SURFACE.166`) |
| `tone` | `SUBTLE` | a note that stands back from what it notes |
| `tone` | `INVERSE` | the place's: words on a painted fill take the fill's own text, as `DSSurface` paints it |
| `format` | `UPPERCASE` | a short label over a title that the site's look sets in capitals |
| `format` | `LOWERCASE` · `CAPITALIZE` | no case written yet: words keep the case their translation gives them, and a language's capitals are its own |
| `underline` | `DOTTED` | a word a tooltip explains |
| `underline` | `SOLID` · `DASHED` | no case written yet: a solid line reads as a link, and one mark for a word a tooltip explains is enough |

### Utility

#### The choice table of `DSFormatDateTime`

A moment is written by what it tells a person. How long ago suits a line a person scans to see what moved, and the date and the time suit a line a person reads to learn when. The forms of the date and the time are the person's own, from the app.

**The cases**, read from the top; the first that matches wins.

| The time says | Where it stands | `type` | `dateFormat` and `timeFormat` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| when a thing last changed: a version, a record, a comment | a line of a list, or a head | `AGO` | the app's, read in its tooltip | the time and the type | `RULE.SUPPORT.SURFACE.122` |
| when a thing happened, on a page a person reads to learn when: an audit log, the notifications sent, a job's runs, the sign-ins | a row of the log | `DEFAULT` (the unit's) | the app's | the time | `RULE.SUPPORT.SURFACE.122` |
| a moment that is a fact of the record, such as when a message is scheduled to send | a reading under its title, or a cell | `DEFAULT` (the unit's) | the app's | the time | this table |
| a day with no time, such as a due date | — | not this unit: `DSFormatDate` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `AGO` | when a thing last changed |
| `type` | `DEFAULT` | a log; a moment that is a fact of the record. It is the unit's own default |
| `dateFormat` | `US_STANDARD` to `FULL_MONTH` | the app's: no case writes one, so the unit reads the person's own (`RULE.SUPPORT.SURFACE.123`) |
| `timeFormat` | `HH_MM` to `HH_MM_SS_DAY_FORMAT` | the app's, as `dateFormat` is (`RULE.SUPPORT.SURFACE.123`) |

#### The choice table of `DSFormatDate`

A day is written by what it tells a person, as a moment is: how long ago for a line a person scans, the date for a fact a person reads. The form of the date is the person's own.

**The cases**, read from the top; the first that matches wins.

| The day says | Where it stands | `type` | `dateFormat` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a day that is a fact of the record: a due date, a start date | a reading or a cell | `DEFAULT` (the unit's) | the app's | the date | `RULE.SUPPORT.SURFACE.123` |
| the day a thing last changed, where the hour does not matter | a line of a list | `AGO` | the app's, in its tooltip | the date and the type | `RULE.SUPPORT.SURFACE.122` |
| a moment with its time | — | not this unit: `DSFormatDateTime` | — | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `type` | `DEFAULT` | a day that is a fact of the record. It is the unit's own default |
| `type` | `AGO` | the day a thing last changed (`RULE.SUPPORT.SURFACE.122`) |
| `dateFormat` | `US_STANDARD` to `FULL_MONTH` | the app's: no case writes one (`RULE.SUPPORT.SURFACE.123`) |

#### The choice table of `DSFormatCurrency`

An amount is written in the currency it is in, which is the record's own.

**The cases**, read from the top; the first that matches wins.

| The amount is | Where it stands | The page writes | Rule |
| --- | --- | --- | --- |
| a price or a total among a row's facts | a fact, a cell or a reading | the value and its `currencyCode` | this table |
| a count with no currency | not this unit: `DSFormatNumber` | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `currencyCode` | `USD` to `SGD` | the record's own currency, written with the value |

#### The choice table of `DSFormatNumber`

A number is written in the person's own form, from the app.

**The cases**, read from the top; the first that matches wins.

| The number is | Where it stands | `numberFormat` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a count among a row's facts | a fact, a cell or a reading | left out: the app's | the value | this table |
| an amount of money | — | not this unit: `DSFormatCurrency` | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `numberFormat` | `US_STANDARD` to `INTEGER_PLAIN` | the app's: no case writes one |

#### The choice table of `DSFormatTime`

A time of day is written in the person's own clock, from the app.

**The cases**, read from the top; the first that matches wins.

| The time is | Where it stands | `timeFormat` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a meeting's time among a row's facts | a fact, a cell or a reading | left out: the app's | the time | `RULE.SUPPORT.SURFACE.123` |
| a moment with its date | — | not this unit: `DSFormatDateTime` | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `timeFormat` | `HH_MM` to `HH_MM_SS_DAY_FORMAT` | the app's: no case writes one (`RULE.SUPPORT.SURFACE.123`) |

#### The choice table of `DSAnchorContainer`

An anchor container is chosen by a block a person presses whole, such as a tile. Its element is the one the markup around it asks for.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | The page writes | Rule |
| --- | --- | --- | --- |
| a tile pressed whole | a grid or a column | the anchor | this table |
| a row of a list pressed whole | not this unit: the row's own `anchor` | — | this table |
| a picture that is a link | not this unit: a `DSAnchor` | — | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `element` | `'div'` | the unit's own default; a page writes another element only where the markup around it asks one, such as `'li'` in a list |

#### The choice table of `DSSticky`

A sticky part is chosen by a bar a person needs while the page scrolls past it.

**The cases**, read from the top; the first that matches wins.

| The bar is | Where it stands | `mode` | The page writes | Rule |
| --- | --- | --- | --- | --- |
| a listing's bar of search and filters | held at the top of the screen | `TOP` | the mode | this table |
| a long form's actions | held at the foot of the screen | `BOTTOM` | the mode | this table |

**The limits across a view.** The unit holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `mode` | `TOP` · `BOTTOM` | a bar held at the top; actions held at the foot |

## Composing, never restyling — 🔮

A page composes these blocks, and never restyles a copy of one. A control that is missing is proposed to the design system. One that every stack should build is named and grouped here first. One that helps a single stack may be that stack's own unit. **A block takes data and props, and a class on one is a missing prop or a place's room** (`RULE.SUPPORT.SURFACE.177`). Where a block has a prop for what a class would say, such as the tone and the weight of a text, the colour of a card, or where a table cell holds its content, the page gives the prop. Where the class is the room the block stands in, the parent gives it: a row, a grid or a part, or a plain element with the width around the block. Where no prop exists and three or more calls need it, the block gains the prop, and that the design system builds. A list or an item is not given a `flex` and a gap to lay a row of things: a plain row holds blocks, and an item holds its content in its own slots. A class stays on a block only on a page that shows how a primitive is styled, and in the showcase's own chrome. What a page writes here is advice. The reason is that a class on a block is copied by the next page, and the theme and the density never reach it.

An overlay a block opens — a popover, a tooltip, a dropdown menu — is a private part of that block, shown by a switch such as `open`, and never a block a designer places on its own.

## Boundary

This ref states which components exist, in which group, and what every one must give. It stops at the edge of one block. It does not state what makes a unit a widget, or what the container or the layout are — those are `architecture-widgets.md`, `architecture-containers.md` and `architecture-layouts.md`. It does not state how a prop is named or where a role or scale step comes from — those are `architecture-names.md` and `architecture-core.md`. It does not name the units a stack provides on its own: each stack states those in its own docs.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.APPS.144` | a block drawn from data is declared as a host and an item, and one item serves every host that takes one data shape |
| `RULE.SUPPORT.APPS.164` | an overlay is drawn as its surface alone, over a backdrop, sized to the instance, and never placed as a block of its own |
| `RULE.SUPPORT.SURFACE.064` | the parts of the item line and their order, and the header of a record and a line of a list have one shape |
| `RULE.SUPPORT.SURFACE.065` | a badge always shows its word; that its colour says a state and not a kind, but for a colour a person chose for their own label, `CUSTOM`, is advice |
| `RULE.SUPPORT.SURFACE.066` | a value of an enum is shown by its name, and the order its icon is chosen in |
| `RULE.SUPPORT.SURFACE.067` | an icon inside an action keeps its square, and what a filled and an empty mark say |
| `RULE.SUPPORT.SURFACE.081` | the foundation defines the core units, and a stack may provide further units of its own |
| `RULE.SUPPORT.SURFACE.085` | a mark supports the shapes round, rounded and square, and is round by default |
| `RULE.SUPPORT.SURFACE.086` | the line of facts is a part of its own on the item line, after the title and the description |
| `RULE.SUPPORT.SURFACE.059` | what stands at the end of a line is data, a badge, a count, a status or the arrow, never an action, and when a line shows its arrow |
| `RULE.SUPPORT.SURFACE.087` | the arrow of a line that leads somewhere may stand after its actions. It is a MAY |
| `RULE.SUPPORT.SURFACE.088` | the dialog that asks a person to confirm an act is named `DSConfirmDialog` |
| `RULE.SUPPORT.SURFACE.089` | `DSToolbar`, `DSTagGroup`, `DSCalendar`, `DSColorPicker` and `DSProgressCircle` are core units |
| `RULE.SUPPORT.SURFACE.090` | `DSColorView`, `DSMark` and `DSConfirmPopover` are core units |
| `RULE.SUPPORT.SURFACE.094` | the page level of an item line alone decides the type of its text, the size of a badge among its facts, and its picture, read from a fixed table |
| `RULE.SUPPORT.SURFACE.096` | the four forms a fact of an item line is given in, and a fact may carry its label before it |
| `RULE.SUPPORT.SURFACE.097` | `DSList` takes `hoverable`, and `selected` is the row's and not the item line's |
| `RULE.SUPPORT.SURFACE.104` | which icon, mark and avatar stand beside a title and beside a heading. It is advice |
| `RULE.SUPPORT.SURFACE.105` | the initials of an avatar are a title step of about four tenths of the avatar |
| `RULE.SUPPORT.SURFACE.106` | the heading element of a title follows its level, the head of a page being the `h1`, and it changes no style |
| `RULE.SUPPORT.SURFACE.107` | the level a box gives the title in its header, where the page names none |
| `RULE.SUPPORT.SURFACE.109` | an item line that is a title starts where what stands under it starts, and takes the inset of its place only in a `flush` part |
| `RULE.SUPPORT.SURFACE.175` | an item line draws only its content, and the place it stands in gives it its room and its highlight, a trigger on a line letting its highlight reach past the line |
| `RULE.SUPPORT.SURFACE.182` | a fixed ordered set reorders on `DSTable` or `DSList` through `reorder`, and a listing of records never does |
| `RULE.SUPPORT.SURFACE.110` | an action at the end of a row that is a link does not follow the link |
| `RULE.SUPPORT.SURFACE.111` | an item line cuts nothing it draws, and the page decides what its words say |
| `RULE.SUPPORT.SURFACE.112` | every level of a page has its title, and a title is larger than the titles of what stands under it. It is advice |
| `RULE.SUPPORT.SURFACE.113` | the item line and the tabs take `pageLevel`, with the one vocabulary `DSPageLevelType`, the item line has no size, and the level decides the look of the tabs |
| `RULE.SUPPORT.SURFACE.118` | in a `flush` part the tabs place their first tab and their panel by the inset of their place |
| `RULE.SUPPORT.SURFACE.121` | a dialog, a drawer and a sheet announce their title once |
| `RULE.SUPPORT.SURFACE.122` | a line that says when something happened may show how long ago it was, through the `type` of the two date units, with the exact date and time reachable from it. It is a MAY |
| `RULE.SUPPORT.SURFACE.123` | a block that shows or takes a time holds no time format of its own |
| `RULE.SUPPORT.SURFACE.124` | a mark takes `variant` with the shared vocabulary, `SUBTLE` when unset, and `GHOST` and `LINK` draw the icon with no fill |
| `RULE.SUPPORT.SURFACE.125` | a table marks the row in view, with the band and `aria-current` of a chosen row of a list, apart from the rows a person ticks. It is a MAY |
| `RULE.SUPPORT.SURFACE.126` | the order a table takes its stripes and its hover in: its own prop, else the theme |
| `RULE.SUPPORT.SURFACE.130` | the picture of an item line is data of one kind, the item owns its size, and the item line takes no `startIcon` |
| `RULE.SUPPORT.SURFACE.131` | the item line takes what stands at its end as `endNode`, a node outside the link of the line |
| `RULE.SUPPORT.SURFACE.132` | a row of a list holds plain words, a line of facts through `DSItemFacts`, or an item line, and takes no `facts` of its own |
| `RULE.SUPPORT.SURFACE.133` | the pager arranges itself by the width of its own place, and where its parts stand |
| `RULE.SUPPORT.SURFACE.135` | the description stands directly under the title, and the line of facts 4 pixels under whatever is above it |
| `RULE.SUPPORT.SURFACE.136` | the badge of an avatar is about a third of the avatar and its dot about a quarter, by scale size |
| `RULE.SUPPORT.SURFACE.143` | the title of a group takes the quiet tone, and so does the description of an item but at `INLINE` |
| `RULE.SUPPORT.SURFACE.166` | the description of an item is quiet at every level but `INLINE`, and facts are muted |
| `RULE.SUPPORT.SURFACE.163` | a dialog, a sheet and a drawer are filled with the page's surface and a popover, a menu and a tooltip with the raised surface, each fixed |
| `RULE.SUPPORT.SURFACE.144` | an icon-only button that opens a menu keeps its tooltip |
| `RULE.SUPPORT.SURFACE.146` | a pressed toggle keeps its border, and a pressed toggle of the default hue takes a fill a person can see |
| `RULE.SUPPORT.SURFACE.153` | a badge with no `variant` draws `SUBTLE`, and a badge among the facts of an item line takes the given variant, else the one its level chooses |
| `RULE.SUPPORT.SURFACE.156` | a navigation unit takes its look as one prop and never reads the theme, and the navigation's data is the menu's narrowed |
| `RULE.SUPPORT.SURFACE.159` | a group's wide panel in a top menu is rows as tight as a menu bar's or the app's own drawing, and every other place draws the data |
| `RULE.SUPPORT.SURFACE.160` | an entry of the navigation is one public unit, `DSNavEntry`, with nothing pressable inside it |
| `RULE.SUPPORT.SURFACE.167` | a switch takes its own `label` and no description, and a control with an edge steps the edge, and a switch its track, under the pointer |
| `RULE.SUPPORT.SURFACE.168` | the drop area of an attachment is neutral in every state, takes a `title` and a `description`, and in `mini` is as wide as its content |
| `RULE.SUPPORT.SURFACE.169` | `DSForm.Field` takes `labelEndNode` after the info mark, and only its label shrinks |
| `RULE.SUPPORT.SURFACE.171` | `DSForm.Field` keeps its message line while its field can fail, a condition `RULE.SUPPORT.SURFACE.189` replaces |
| `RULE.SUPPORT.SURFACE.189` | `DSForm.Field` always keeps its message line, so the line is the space between fields, and a field standing in one row keeps none |
| `RULE.SUPPORT.SURFACE.195` | a field carries no space around it, whoever places the fields spaces them, and the compound fields of the design system stack theirs 8 px apart |
| `RULE.SUPPORT.SURFACE.191` | `DSAccordionGroup` may be controlled with `expandedKeys`; that an accordion's head is one line, its title, and that an accordion fits a settings form while a task form uses one scroll or steps, is advice |
| `RULE.SUPPORT.SURFACE.192` | a partner paints one panel, card or card widget with a class of their own, and the class sets the block's paint tokens `--surface-fill`, `--surface-translucent-fill` and `--surface-blur` and nothing else |
| `RULE.SUPPORT.SURFACE.199` | the surface a block stands on is one value, a colour and a strength, carried by context and read by tokens; `DSSurface` puts a block on a fill, `painted` stands it on a picture, and a popup sets the page's surface again |
| `RULE.SUPPORT.SURFACE.190` | every overlay takes its width from one scale, `extent`, `XS` 320 px to `XL` 720, and its padding from `size`; a sheet and a drawer default to `MD`, a dialog to `XL` |
| `RULE.SUPPORT.SURFACE.201` | the surface moves by one set of tokens, a role for each kind of unit, icon motions moved only by their holder, and one reduced-motion rule |
| `RULE.SUPPORT.SURFACE.204` | a row that scrolls sideways is `DSHScroll`, its arrows sized from its size and standing on the ground the row stands on, or on a scrim over a picture |
| `RULE.SUPPORT.SURFACE.209` | `DSTabs` takes a `type`, `LINE`, `SWITCH` or `PILL`, the level giving the size and the look where no type is named; that a website's pages take `PILL`, and that a unit that takes a page level is given its `pageLevel` first and its `size` only to replace the size of its place, is advice |
| `RULE.SUPPORT.SURFACE.213` | the `PILL` bar is raised by its shadow alone with no line, its closed tab takes the brand one step softer under the pointer and the focus, and every type of `DSTabs` stands vertical and shares the width |
| `RULE.SUPPORT.SURFACE.214` | `DSTabs` take their colour and the fill of their open tab from the theme's navigation, and a row may override each with `color` and `entry`, of the navigation's own types |
| `RULE.SUPPORT.SURFACE.215` | `DSTabs` are lifted only where `raised` asks, with no default, and read no card or panel look |
| `RULE.SUPPORT.SURFACE.216` | `DSItem` stands vertically when `orientation` is `VERTICAL`, the picture on top and the end node at the top end, and `DSItemCard` holds it as it is |
| `RULE.SUPPORT.SURFACE.218` | the tabs of `SWITCH` and `PILL` may stand without their bar with `grouped={false}`, `true` when unset and ignored by `LINE`, the open tab's fill alone marking it |
| `RULE.SUPPORT.SURFACE.219` | a page may align the end node of a `DSItem` with `endAlign` (`TOP`, `CENTER`, `BOTTOM`), unset leaving a line centred and a vertical item at the top end |
| `RULE.SUPPORT.SURFACE.220` | `DSTabs` raised only lifts, with a soft shadow and no colour, and `LINE` ignores it; the bar of `SWITCH` and `PILL` takes the navigation's colour; every tab of a vertical `PILL` is fully rounded |
| `RULE.SUPPORT.SURFACE.223` | an item line at `INLINE` with a title and facts and no description draws its facts on the title's line after a dot ("v3 · Draft"), the title cut before the facts |
| `RULE.SUPPORT.SURFACE.228` | superseded: a vertical item line spaces its description and its facts by its level (`RULE.SUPPORT.SURFACE.272` sets the words alike in either orientation) |
| `RULE.SUPPORT.SURFACE.224` | `DSTabs` at the level `PAGE` draw `PILL` where no `type` is named, grouped on its track and not raised; `LINE` stays at `CONTAINER` and `WIDGET` and `SWITCH` at the other levels |
| `RULE.SUPPORT.SURFACE.187` | a default mark draws its icon muted and a ringed mark its ring in the icon's colour, and a `PAGE` item's description is `CONTENT_LG`, 16px |
| `RULE.SUPPORT.SURFACE.230` | a block built from components for one task is a component of the group Composites; the data table, the filter bar, the comparison and the feature are core composites, and the unit for a list beside its detail is not a core unit |
| `RULE.SUPPORT.SURFACE.233` | a feature is sized by its level alone, placed by its type, and draws the default of its level for a type the level does not allow |
| `RULE.SUPPORT.SURFACE.234` | a feature's actions are data and take their size from its level, with at most one solid primary |
| `RULE.SUPPORT.SURFACE.235` | a feature draws its items as item lines at a level it gives them by its own, the gap between two items following its level, the feature and each item taking the heading element of their level, the statistics keeping their sizes one level below the feature's, and the feature giving the items' orientation |
| `RULE.SUPPORT.SURFACE.236` | a feature takes its own facts, an anchor that makes it pressable and takes no actions, and a small picture |
| `RULE.SUPPORT.SURFACE.237` | a feature folds its form on a phone by its type and reads no device |
| `RULE.SUPPORT.SURFACE.239` | the description of an item line at `GROUP` is 14px |
| `RULE.SUPPORT.SURFACE.240` | a feature frames nothing unless the page lists its `frames`, and takes the paint of a frame from its `surface`, else from the design system's fixed feature default |
| `RULE.SUPPORT.SURFACE.242` | an item line takes an eyebrow, a colour on a fact in words, and a place for its facts after the title |
| `RULE.SUPPORT.SURFACE.245` | a drawer, a sheet and a dialog offer the extent `FIT`, as wide or as tall as what they hold |
| `RULE.SUPPORT.SURFACE.246` | the drawer of the filter bar on a phone fits its fields, and the bar's size sets only how dense its controls are |
| `RULE.SUPPORT.APPS.218` | a module makes the item line specific for each record it owns as `<State>Item`, the same parts at all six levels, what it keeps at `INLINE` decided once by the Item for its record, a place gives it `IDSItemPlacementProps`, and may leave out the description or the facts and never changes a part or adds one |
| `RULE.SUPPORT.SURFACE.248` | a feature's text aligns inside the place its type gives it, by `textAlign`, and `BACKDROP`'s scrim follows it |
| `RULE.SUPPORT.SURFACE.250` | a dialog, a sheet and a drawer are each one surface: the panel draws the fill, the corners, the line and the shadow, and what it holds draws none |
| `RULE.SUPPORT.SURFACE.251` | a feature's actions stand after its items, or before them where `actionsPlacement` says so |
| `RULE.SUPPORT.SURFACE.252` | a feature keeps every level of `DSPageLevelType`, `CONTENT` and `INLINE` with a look of their own, and what it draws under its words are its items |
| `RULE.SUPPORT.SURFACE.253` | superseded by `RULE.SUPPORT.SURFACE.274`: the side of a feature's small picture is one box per level |
| `RULE.SUPPORT.SURFACE.256` | every navigation unit takes every size from `XS` to `XL`, its text, icon, boxes, padding, popover and widths following the step, with an 8px gap between bar entries |
| `RULE.SUPPORT.SURFACE.261` | the paint of a frame is the one prop `surface`, an `IDSFrameSurface`, on a card, a feature, a card widget and a panel |
| `RULE.SUPPORT.SURFACE.282` | a feature reveals its parts once through `reveal`, a frame takes `elevation`, and the theme form offers it |
| `RULE.SUPPORT.SURFACE.283` | `DSList` takes a `title` that starts where the rows' words start |
| `RULE.SUPPORT.SURFACE.284` | a boxed item's room lies inside its frame |
| `RULE.SUPPORT.SURFACE.285` | a link that leaves the site ends on `ARROW_UP_RIGHT` with `NUDGE_UP_END` |
| `RULE.SUPPORT.SURFACE.287` | an arrow moves only while its door or its button is hovered or pressed; that a feature's words, buttons and items follow its level and its form is advice |
| `DEC.SUPPORT.SURFACE.288` | anything set one under another is a `DSList`. It is advice |
| `RULE.SUPPORT.SURFACE.290` | the `TEXT` eyebrow of a feature at `PAGE` and `CONTAINER` is semibold in the primary tone, and a state is a `BADGE` eyebrow |
| `RULE.SUPPORT.SURFACE.291` | the items of a `LIST` take the text's width, at most `62ch` |
| `RULE.SUPPORT.SURFACE.292` | `DSList`'s title is one step above its size and semibold, and a reacting row of a `flush` list draws no hover fill |
| `RULE.SUPPORT.SURFACE.294` | a `DSLink` in a line of words keeps its hover underline, and a neutral one alone in a `DSList` row brightens and draws none |
| `RULE.SUPPORT.SURFACE.262` | a card takes `frames` and defaults to all three parts, and a feature frames nothing by default |
| `RULE.SUPPORT.SURFACE.269` | a feature's items are one group, parted by a gap, lines or a frame of their own on every form, and a boxed item is a card pressed where it has an anchor and marked where it is selected |
| `RULE.SUPPORT.SURFACE.270` | a card takes no height of its own, so the cards of a grid or a row stand as tall as the tallest |
| `RULE.SUPPORT.SURFACE.272` | a `DSItem` sets its words alike in either orientation, and a feature's three gaps of words are the item line's own from `CONTENT` down |
| `RULE.SUPPORT.SURFACE.273` | a feature's frame pads by the room before the actions |
| `RULE.SUPPORT.SURFACE.274` | the picture of a feature is one box per level, whatever lines the feature has |
| `RULE.SUPPORT.SURFACE.275` | the room between a feature's items is the frame padding of the level the items are drawn at |
| `RULE.SUPPORT.SURFACE.278` | the picture of a vertical item line takes one box per level, the box of a title with a description |
| `RULE.SUPPORT.SURFACE.181` | the comparison is a core composite that compares subjects across the same settings, draws every value through the data field view, marks a differing value and keeps the label column pinned |
| `RULE.SUPPORT.SURFACE.299` | a control's value is the type of the attribute it edits, so a form casts nothing |
| `RULE.SUPPORT.SURFACE.303` | an icon takes `tone` as a text does, and `tone` wins over `color` |
| `RULE.SUPPORT.SURFACE.304` | a bare icon of an item line with no `color` and no `tone` draws in the muted tone |
| `RULE.SUPPORT.SURFACE.305` | a page from another address, or a document the page wrote, is drawn through `DSEmbed`, sandboxed and with no look of its own |
| `RULE.SUPPORT.SURFACE.306` | a `CUSTOM` row of a comparison is compared on the values its `compareValue` returns |
| `RULE.SUPPORT.SURFACE.307` | a record is chosen by an autocomplete and not by a select. It is advice |
| `RULE.SUPPORT.SURFACE.308` | a stepper is `DSStepper`, a block of Navigation drawn from data, whose steps take a task state given by the page or following from the open step |
| `RULE.SUPPORT.SURFACE.310` | a bare icon of an item line is drawn at the size of its level, 32, 24, 18, 14, 14 and 12px from `PAGE` to `INLINE` |
| `RULE.SUPPORT.SURFACE.311` | a carousel marks every slide that is not in view `inert` and `aria-hidden` |
| `RULE.SUPPORT.SURFACE.314` | `DSStepper` takes `pageLevel` as the tabs do, at all six levels, `size` replacing only the size of the place, and a step's words following the size as a tab's label does |
| `RULE.SUPPORT.SURFACE.315` | the tabs and the stepper step one size for each page level, `PAGE` three up, `CONTAINER` two, `WIDGET` one, `GROUP` and `CONTENT` none and `INLINE` one down, held at `XS` and `XL` |
| `RULE.SUPPORT.SURFACE.316` | a new unit names each shared axis of the surface it takes, with a reason for each it leaves out, and its preview shows that table before it is approved |
| `RULE.SUPPORT.SURFACE.184` | a comparison marks a value that differs from the most common value of its row, or from the subject `baselineKey` names; a tie or an unknown key marks none |
| `RULE.SUPPORT.SURFACE.193` | a subject of a comparison carries its own actions in its head, beside its item, taking their size and look from the place |
| `RULE.SUPPORT.SURFACE.068` | the layout of the data table is chosen from the data, and it is `LIST` on a phone. That `LIST` also takes the place of `GRID` on a phone is proposed. It is advice |
| `RULE.SUPPORT.SURFACE.069` | many groups a person searches fit the `LIST` layout, and not `TABLE`. It is advice |
| `RULE.SUPPORT.SURFACE.134` | the tick column and the actions column are as wide as what they hold, and where the spare width of a table goes |
| `RULE.SUPPORT.SURFACE.147` | the bar of a data table draws the control that ticks every record, and the sort, only where there are records |
| `RULE.SUPPORT.SURFACE.148` | the control that ticks every record is a bare checkbox on the line of the rows' tick boxes |
| `RULE.SUPPORT.SURFACE.149` | a data table pins its tick column and its actions column wherever it may scroll sideways, and a pinned edge shows its shadow only while content is beneath it |
| `RULE.SUPPORT.SURFACE.070` | a search and a filter of the records are sent to the server |
| `RULE.SUPPORT.SURFACE.071` | the actions of a record stand at the end of its row, its line or its card. How many stand on the row, and what a press on a row does, are proposed |
| `RULE.SUPPORT.SURFACE.072` | a value changed in a table is changed in its cell, one row at a time. It is advice |
| `RULE.SUPPORT.SURFACE.073` | the one form of the filter bar, at a desktop, at a tablet and on a phone; that a page does not rearrange it is advice |
| `RULE.SUPPORT.SURFACE.368` | a badge that names a kind or a type draws `OUTLINE` in `DEFAULT`, with the icon its enum gives the value. It is advice |
| `RULE.SUPPORT.SURFACE.369` | a badge that says a state takes the hue its meaning gives, from one table, at the page's `variant`, else the level's, else `SUBTLE`. It is advice |
| `RULE.SUPPORT.SURFACE.370` | a view holds at most one `SOLID` button, its main action; a site page's closing call repeats the hero's one act; the feature's buttons are the case of a feature. It is advice |
| `RULE.SUPPORT.SURFACE.374` | a badge over a picture is `SOLID`, and says a state in that state's hue. It is advice |
| `RULE.SUPPORT.SURFACE.375` | a unit with a closed prop has a choice table of cases, a mapping, limits across a view and an index by value; the index gives every value of a closed prop its cases, and each case names its rule; a unit its place sizes stands in one list instead; a value is settled by the page, else the place, else the level, else the unit; its cases are the library's cases and its first case that draws the unit is the unit's usage; a container and a pattern have none |
| `RULE.SUPPORT.SURFACE.376` | a button with no `variant` draws `OUTLINE` outside a header or a footer |
| `RULE.SUPPORT.SURFACE.377` | a word with no fill is a fact in words and a link is a `DSLink`, so a badge's `GHOST` and `LINK` have no case written yet. It is advice |
| `RULE.SUPPORT.SURFACE.378` | a badge is `SOLID` only over a picture. It is advice |
| `RULE.SUPPORT.SURFACE.379` | a page's button is `SOLID`, `OUTLINE`, `GHOST` or `LINK`, and the tints `QUIET`, `SUBTLE` and `SUBTLE_OUTLINE` are the place's. It is advice |
| `RULE.SUPPORT.SURFACE.380` | a badge on its own is `SM`, and over a picture takes the size of its place. It is advice |
| `RULE.SUPPORT.SURFACE.381` | several values of one set are each drawn by their own case, one size step smaller than their place. It is advice |
| `RULE.SUPPORT.SURFACE.382` | a label a person coloured is a `SUBTLE` badge in `CUSTOM` with that colour. It is advice |
| `RULE.SUPPORT.SURFACE.384` | a button's colour says what its act does: `PRIMARY` the main action, `ERROR` a main action that deletes or ends, `DEFAULT` every other, with `INFO`, `SUCCESS` and `WARNING` as no case written yet and `CUSTOM` drawn `DEFAULT`. It is advice |
| `RULE.SUPPORT.SURFACE.385` | a mark's colour says a state from the badge's hue table, the brand in `PRIMARY`, `DEFAULT` where it says neither, with `CUSTOM` drawn `DEFAULT`. It is advice |
| `RULE.SUPPORT.SURFACE.386` | a mark that is not set up is `OUTLINE` in `DEFAULT`, and a mark that is set up takes the filled tint of its place. It is advice |
| `RULE.SUPPORT.SURFACE.387` | a mark is `SOLID` only as the app's own mark beside its name and as the chosen one of a run of marks. It is advice |
| `RULE.SUPPORT.SURFACE.388` | a mark draws its icon alone, `GHOST`, only in a run of marks, where it keeps their box. It is advice |
| `RULE.SUPPORT.SURFACE.389` | a mark is no link and no level rings a mark, so `LINK` and `SUBTLE_OUTLINE` have no case written yet on a mark. It is advice |
| `RULE.SUPPORT.SURFACE.390` | a header shows at most one main action and one or two secondaries, the rest behind "⋯"; on a record moving through states the main action is the move its state expects next. It is advice |
| `RULE.SUPPORT.SURFACE.391` | a badge in a table cell is `XS`, because a person scans a table row by row. It is advice |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task. The web builds `facts` and `pageLevel` on `DSItem`. It also builds the larger sizes, in Support `5.13.0`: `scaleSize` on `DSIcon`, `DSMark`, `DSAvatar` and `DSAvatarGroup`, the item line and the tabs drawn by their page level, and `flush` on the parts of a card. The web builds the tabs in a `flush` part, the one name of an overlay with a title, the form `AGO` of the two date units, the time format that a block takes from the app alone, the row in view of a table, the order a table takes `striped` and `hoverable` in, and the picture of an item line given as data. The web builds, in a change not released yet, the levels of the item line from `PAGE` to `INLINE` with no size on it, the heading element by nesting, the picture by its fixed table, `mediaAlign`, the tabs at every level, and the variants by strength, with `SUBTLE` as the default of a badge and a mark. In the web the title of a confirmation is still drawn by hand. The design library has not drawn the larger sizes or any of these yet, and it is drawn after the stack. So a page on another stack checks what its stack's units take before it uses one of these. The web draws a `DSButton` with no `variant` as `SOLID` outside a header or a footer, where its choice table draws `OUTLINE`; Support draws `OUTLINE` there in its next release, and each app then writes `SOLID` on each view's main action. The library is owed the choice tables' cases. No check reads a choice table yet: `apps surface gaps` reports a value the index does not list once it reads the tables.
