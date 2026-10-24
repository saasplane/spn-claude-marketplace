<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/04-architecture-names.md",
      "seen": "af312396"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/04-architecture-names/",
      "seen": "bdc3b084"
    }
  ]
}
-->

# Names — One Name for a Block, a Prop and a Value

Source of truth: the foundation's Names construct (`docs/02-constructs/02-support/01-surface/04-architecture-names.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/04-architecture-names/`). Names is the fourth of thirteen Surface constructs, and the first of the Architecture group — what a surface is built from, layer by layer.

> **Built.** `@saasplane/support-web-ds-ts` carries the names `DSFeatureGridSectionContainer`, `DSDataTablePanelContainer`, `IDSGrid`, `IDSFrameSurface`, `DSBoxPartType` and the props `surface`, `section`, `panel`, `heading` and `grid` from support 5.22.0, and the library is owed.

Read this before you name a new block, a new prop or a new layer of the design system, or before you change a block of the design system. It runs from the rule that keeps a name from drifting, to the three shared prop names, to the two sizes, to the six layers and the suffix that says where a unit is placed, to the kinds of prop and the states a design and its code share.

## Terms

| Term | What it means |
| --- | --- |
| Name | the one word the book gives a block, a prop or a value. The design library and every stack build under that word |
| Shared name | one of the three prop names (`variant` · `color` · `size`) that mean one thing on every block and every kind of surface |
| Vocabulary | a closed set of values a prop may take |
| Layer | one of the six steps the design system is built in: core, components, widgets, containers, layouts, app. A layer uses only the layers named before it |
| Declared prop | a property the caller sets, under the same name on every stack |
| Shown state | a state the platform produces itself, such as hover or focus. It has a picture and no prop |
| Shared state | `REST` · `HOVER` · `FOCUS` · `PRESSED` · `DISABLED` · `ERROR` · `SELECTED` — a state most blocks share, with one picture on every block and every kind of surface |

## A name is the contract — ✅

One name is used in the book, in the design library and in every stack. The book names every block, prop, closed value and token. The design library draws each one under that name, and a stack builds it under that name. No file maps a design name to a code name. A stack may add the form its language asks for, and never a second name.

- **A token has one name, the book's, written in small letters with dashes** (`RD.SUPPORT.SURFACE.298`). The library names its variable with it as it is, and each stack spells it by one fixed rule of its language: the web as a custom property, `--surface-raised`, and a native stack as its language writes a name, such as `surfaceRaised`. A slash, which only a design tool can hold, is never part of a token's name.

## The three shared names — ✅

| Name | Means | Values | Vocabulary |
| --- | --- | --- | --- |
| `variant` | the surface treatment, by its strength | `SOLID` · `QUIET` · `SUBTLE` · `SUBTLE_OUTLINE` · `OUTLINE` · `GHOST` · `LINK` | `DSVariantType` |
| `color` | the hue | `DEFAULT` · `CUSTOM` · `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` | `DSColorType` |
| `size` | the density step, read smallest to largest | `XS` · `SM` · `MD` · `LG` · `XL` | `DSSizeType` |

**The five values of `size` are read smallest to largest, `XS` to `XL`, wherever they are listed** — in the book, in the design library and in every stack — **and `SM` is the default size a theme sets**; a block told no size takes it. `color` has no order, because a hue is no scale. **The values of `variant` are named by their strength, as the tones are, and read from the strongest to the faintest** (`RD.SUPPORT.SURFACE.154`): `SOLID` the hue's full colour, `QUIET` a medium tint, `SUBTLE` a light tint with no edge, `SUBTLE_OUTLINE` the light tint with a line, `OUTLINE` a line and no fill, `GHOST` no fill until the pointer, `LINK` text alone. Every variant of every hue keeps its text at 4.5 to 1, at rest and under the pointer; the line of an outline is a decoration, not held to 3 to 1. `architecture-core.md` gives the shades.

**`CUSTOM` is a value of `color` that means the caller owns the colour.** A block's inner text and icon take the colour around them, and a page passes a chosen colour as `customColor` on the blocks that take it. It is the one named way a page sets a colour outside the theme. `DSButton` and `DSSeparator` take no `customColor`. A colour the page chooses gives every variant: the design system works the fill, the text and the line of each out from the one colour, in light and in dark, and pulls the text until it reads at 4.5 to 1 on its fill.

Keep each of the three names for its one meaning, on every block — a block takes `variant` and `color` independently. A prop that means something else takes another name: a shape, a type step or a kind of alert is not a surface treatment. Name a prop and its vocabulary with one word: the vocabulary `DS<Component><Word>Type` is taken through the prop `<word>`. Take every value from the vocabulary of its prop, never a free string. The text props follow it: `underline` of `DSLink` and `DSText` takes `SOLID` · `DOTTED` · `DASHED`, and `format` of `DSText` takes `UPPERCASE` · `LOWERCASE` · `CAPITALIZE`. A drawer and a sheet take `extent` for their reach, and the design library draws no `extent` variant, because the extent of an overlay there is the size of the instance.

### Size and scale size

The design system has two sizes, and each means one thing (`RD.SUPPORT.SURFACE.100`). A person operates a control, so its height follows the density of the place it stands in. A picture is only shown, so a page chooses how large it is drawn.

| What is compared | `size` | `scaleSize`, with the vocabulary `DSScaleSizeType` |
| --- | --- | --- |
| What it says | how dense a control is | how large a thing that is shown is drawn |
| Its steps | `XS` to `XL` | `XXS` · `XS` · `SM` · `MD` · `LG` · `XL` · `XXL` · `XXL2` · `XXL3` · `XXL4` · `XXL5` |
| Who takes it | a button, a field, a table, a card, and every block that has padding. The item line takes none, and its level gives its look | `DSIcon`, `DSMark`, `DSAvatar` and `DSAvatarGroup` |
| Handed down | yes: a block with no `size` takes the size of the place it stands in | no: a block with no `scaleSize` takes the step that fits its `size` |
| The text beside it | the content step of that size | the title step of the same name |

- **Neither word is used for the other meaning, on any block.** No other prop and no other vocabulary says how large an icon, a mark, an avatar or a group of avatars is drawn.
- **Each of these blocks holds its own pixels for a step.** An icon of `XXL3` is 40 px, and a mark or an avatar of `XXL3` is 64 px. So one value, given to all of them, draws things that fit together. `architecture-core.md` states the pixels of every step.
- **A scale size is not handed down.** A block that is given no `scaleSize` takes the step of the same name as its `size`. `DSMark`, `DSAvatar` and `DSAvatarGroup` keep `size` for this, and with neither prop set each one takes the size of the place it stands in. `DSIcon` has no `size`, and its `scaleSize` is `MD` when unset.
- **A `scaleSize` that is given decides how large the block is drawn, whatever its `size` is.** `size` stays the density step on the block.
- **The values of `scaleSize` are read smallest to largest, `XXS` to `XXL5`, wherever they are listed.**

### Names with a rule of their own

A few names carry their own rule rather than the shared three: use `bordered` for a border a block draws around itself, and `rounded` for the corners of its frame. `raised` stays with the container, the card, the feature and the row of tabs (`DSTabs`, with no default): a key of `surface` on the first three, and a prop on the tabs. A container and a card take `raised`, `bordered` and `rounded` as the keys of their `surface`, and a table and a code view take `bordered` and `rounded` as props of their own. `rounded` is a key of `surface` on `DSCard` and a prop on `DSTable` and `DSCodeBlockView`; `RD.SUPPORT.SURFACE.215` still gives the tabs no default and no card look. An unset `bordered` reads the frame setting of a `flush` part above it, and only on a block that frames a part of a page — the table, the code block, the accordions and the empty state. The data table and the list take no `bordered`, because neither draws a border on any page. A field, a menubar and an avatar read their own default, because their border is the control's own chrome. Use `flush` on a part of a container for a part that draws no inset — it is yes or no, and no when it is not set. A part of a card takes `flush` too, for a part that draws no padding of its own, so that its content reaches the edge of the card. `DSTable` takes `hoverable`, yes or no, for whether a body row takes the table's row-hover fill under the pointer. A selected row, and a row that holds an open menu, keep their fill whichever way it is set. `DSTable`, and the table layout config of `DSDataTable`, take `striped`, yes or no, for whether the rows take alternating fills. Where `hoverable` or `striped` is not given, it takes the value of the theme's `table`: stripes and no hover by default. A prop that is a trait that is on or off takes an adjective, so the name is `hoverable`.

A word keeps one meaning in the whole design system. So `shape` always means an outline: the one a picture is cut to, or the one a mark stands on. The word `overlay` always means drawn over the content.

These yes-or-no props each belong to one block or two. Each is no when it is not set, unless its row says yes.

| Block | Prop | Whether |
| --- | --- | --- |
| `DSList` | `hoverable` | a row takes the list's row-hover fill under the pointer, also where it is no link. A row that is chosen keeps its fill |
| `DSList.Item` · `DSItem` | `showArrow` | a chevron is drawn at the end of the row, to say that the row leads somewhere |
| A data cell of `DSTable` | `marked` | the cell stands out in its row, in the medium weight and the default text colour |
| `DSCard` | `fullHeight` | the card fills the height of a place with a set height. Otherwise it takes no height of its own: alone it is as tall as what it holds, and in a grid or a row it stands as tall as the tallest card |
| `DSSectionContainer` | `flush` | the child runs to the edges of the section's place, with no gutter. Its words then line up with the box by `--section-box-inset` |
| `DSCard` | `divided` | a line is drawn between each two parts of the card |
| `DSSheet` | `modal` | the sheet takes the page over, with a scrim. Otherwise it stands beside the page, and the page stays usable. Yes by default |
| `DSToolbar` | `bordered` | a frame is drawn around the row of controls. Yes by default |
| `DSColorPicker` | `showValue` | the code of the colour is shown beside the swatch, in a field a person may type in. Yes by default |
| `DSColorPicker` | `clearable` | an action that empties the picker is offered while it holds a colour. Yes by default |
| `DSColorView` | `swatchOnly` | the swatch is drawn alone, with no value beside it |

## A prop that takes a vocabulary is stated with its values — ✅

A design and its code agree on a prop only when they agree on what it takes. Without the values, a designer draws the clock of a time picker as a switch under a name of the designer's own, and the stack has to be corrected afterwards. Five rules keep the design library and every stack to the values.

- **A prop whose values are a vocabulary is stated with its values.** A long code list may be stated by the vocabulary's name and the place its values are stated, as the icons are. The first table below holds the vocabularies of the design system, and the second holds the shared ones.
- **The design library carries such a prop under the same name and the same values, and every stack takes it under the same name and the same values.** This is the rule that a name is the contract, applied to the values of a prop.
- **A vocabulary is either the design system's own or a shared one of the platform.** The design system's own is `DS<Component><Word>Type`, and it drops the component where several blocks take it, as `DSOrientationType` does. A shared one is `SP…Type`. It is realized once, in the Support contract, so that a service and a surface use the same values, and a design system never defines a shared one again.
- **An alignment takes the core's vocabulary of its axis, on any unit** (`RD.SUPPORT.SURFACE.249`). There is one for each axis: `DSHorizontalAlignType`, `START` · `CENTER` · `END` in the reading direction, and `DSVerticalAlignType`, `TOP` · `CENTER` · `BOTTOM`. They are the design system's own and drop the component, as `DSOrientationType` does, because any unit takes them. The prop keeps the unit's word, such as `mediaAlign`, `endAlign`, `verticalAlignment` or `textAlign`, and no unit defines an alignment vocabulary of its own (`architecture-core.md`).
- **A unit or a prop of the design library follows one order: the construct in the book, then the library in Figma as its visual proof, then each stack, then the showcase.** Each step follows the one before it. A component that belongs to one app does not follow this order.
- **The order binds a core unit and its props, which are the ones the book names. It does not bind a unit that a stack provides on its own** (`RD.SUPPORT.SURFACE.082`). The foundation does not drive such a unit, as `architecture-components.md` states. The stack builds it and states it in its own docs, and the showcase shows it marked as the stack's own. A stack's own unit that is to join the core units takes the order from its first step.

**The design system's own vocabularies.** A yes-or-no prop takes no vocabulary. The default is the value shown with "when unset".

| Block | Prop | Values | Vocabulary |
| --- | --- | --- | --- |
| `DSAlert` · `DSToast` | `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | `DSColorType`, limited to these four |
| `DSText` | `typography` | `HEADING_XXL5` to `HEADING_XXS` · `TITLE_XXL5` to `TITLE_XXS` · `CONTENT_XXL5` to `CONTENT_XXS` | `DSTypographyType` |
| `DSLink` · `DSText` | `underline` | `SOLID` · `DOTTED` · `DASHED` | `DSTextUnderlineType` |
| `DSText` | `format` | `UPPERCASE` · `LOWERCASE` · `CAPITALIZE` | `DSTextFormatType` |
| `DSLink` · `DSText` · `DSIcon` | `tone` | `DEFAULT` · `QUIET` · `MUTED` · `SUBTLE` · `INVERSE` | `DSToneType` |
| `DSImage`, `DSImagePicker`'s `image` | `shape` | `NONE` · `FILM` · `WIDE` · `SQUARE` · `CIRCLE` | `DSImageShapeType` |
| `DSMark` · `DSAvatar` | `shape` (the outline of the background the icon, the symbol or the picture stands on; one type for both units) | `CIRCLE` · `ROUNDED` · `SQUARE`, `CIRCLE` when unset | `DSMarkShapeType` |
| `DSImage`, `DSImagePicker`'s `image` | `widthStep` | `NONE`, and `WIDTH_80` to `WIDTH_1280` | `DSImageWidthStepType` |
| `DSNavBarSide` | `placement` (where the bar stands: at the edge of the screen, where it folds to icons, or inline in the page as a column) | `EDGE` · `INLINE`, `EDGE` when unset | `DSNavBarSidePlacementType` |
| `DSInputOTP` | `digits` | `FOUR` · `SIX` | `DSInputOTPDigitsType` |
| `DSIcon` · `DSMark` · `DSAvatar` · `DSAvatarGroup` | `scaleSize` (how large the block is drawn; an icon is 10 to 56 px, and a mark or an avatar is 24 to 96 px) | `XXS` · `XS` · `SM` · `MD` · `LG` · `XL` · `XXL` · `XXL2` to `XXL5`. Unset, the step that fits the block's `size`, and `MD` on `DSIcon` | `DSScaleSizeType` |
| `DSDrawer` · `DSSheet` | `extent` | `XS` · `SM` · `MD` · `LG` · `XL` · `FIT`, `MD` when unset | `DSOverlayExtentType` |
| `DSItem` · `DSItemFacts` · `DSTabs` · `DSFeature` | `pageLevel` (the level of a page the block stands at: the page, a container, a widget, an inner part of a widget, a row, or a value inside another unit. On the item line it alone decides the type of the text, the size of a badge among the facts and the size of the picture. On the tabs it decides the look. On the feature it decides the size of the title, the gaps, the box of a small picture and the buttons) | `PAGE` · `CONTAINER` · `WIDGET` · `GROUP` · `CONTENT` · `INLINE`. Unset, the level the header of a box gives, else `CONTENT` | `DSPageLevelType` |
| `DSItem` · `DSFeature` | `eyebrow` (the line over the title: one fact, drawn at the facts step of the level) | an `IDSItemFact`, in any of its forms, a `CUSTOM` fact included | `DSItemFactType` is the vocabulary of its form |
| `DSItem` · `DSFeature` | `factsPlacement` (where the line of facts stands against the words) | `AFTER_DESCRIPTION` · `AFTER_TITLE`, `AFTER_DESCRIPTION` when unset | `DSItemFactsPlacementType` |
| `DSItem`, on a fact whose `mtype` is `TEXT` | `color` (the hue of the words of the fact; unset, the muted tone) | `DEFAULT` · `CUSTOM` · `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` | `DSColorType` |
| `DSFeature` | `verticalAlign` (where the two columns of a split stand against each other when one is taller: the shorter one at the top, in the middle or at the foot of the row) | `TOP` · `CENTER` · `BOTTOM`, `CENTER` when unset | `DSVerticalAlignType` |
| `DSFeature` | `type` (where the media stands against the words) | `SPLIT_END` · `SPLIT_START` · `MEDIA_TOP` · `MEDIA_BOTTOM` · `BACKDROP` · `ITEMS_SPLIT_END` · `ITEMS_SPLIT_START`. Unset, the default of the level | `DSFeatureType` |
| `DSFeature` | `textAlign` (how the text part lines up inside the place its type gives it: the words, the actions and a small picture, in the reading direction) | `START` · `CENTER` · `END`, `START` when unset | `DSHorizontalAlignType` |
| `DSFeature` | `actionsPlacement` (where the actions stand against the items: after them, closing the feature, or before them, under the words) | `BEFORE_ITEMS` · `AFTER_ITEMS`, `AFTER_ITEMS` when unset | `DSFeatureActionsPlacementType` |
| `IDSFeatureItemsProps`, on `DSFeature`'s `items` | `type` (how the items are drawn) | `GRID` · `LIST` · `STATS`, `GRID` when unset | `DSFeatureItemsType` |
| `IDSFeatureItemsProps`, on `DSFeature`'s `items` | `numbered` (whether the numbers 1 to n stand before the titles of the items) | yes or no, no by default | none |
| `IDSFeatureItemsProps`, on `DSFeature`'s `items` | `orientation` (how every item stands; an item sets none of its own) | `HORIZONTAL` · `VERTICAL`. Unset, `VERTICAL` for `GRID` and `HORIZONTAL` for `LIST` | `DSOrientationType` |
| `IDSGridColumns`, in `IDSGrid` on `DSFeatureGridSectionContainer` and `DSList`, and as `gridColumns` on every other unit that draws a grid | `desktop` · `tablet` · `mobile` (how many columns a grid stands in at each screen class; the live device picks one and nothing measures a width; all three required) | a whole number, 1 to 4 on the grid section, the feature's items and the data unit group, 1 to 6 elsewhere | none |
| `IDSGrid`, on `DSFeatureGridSectionContainer` and `DSList` · `IDSFeatureItemsProps`, on `DSFeature`'s `items` | `borderType` (the lines of a grid: none, lines between the cells, or lines between them and around the outside) | `NONE` · `GRID` · `EDGE`, `NONE` when unset, and `GRID` for a list of items | `DSGridBorderType` |
| `DSFeatureGridSectionContainer` · `DSDataTablePanelContainer` | `section` · `panel` (the props of the box the unit draws, a section or a panel, whole but what the unit decides: one attribute named after the box) | a named interface of the owner's props, `IDSFeatureGridSectionContainerSectionProps` · `IDSDataTablePanelContainerPanelProps` | none |
| `DSFeatureGridSectionContainer` | `heading` (the heading over the grid: the eyebrow, title, description, facts, actions and alignment of a feature) | a named interface of `IDSFeatureProps`' props, `IDSFeatureGridSectionContainerHeadingProps` | none |
| `DSPanelContainer` · `DSCard` · `DSFeature` · `DSCardWidget` · `IDSFeatureItemsProps`, on `DSFeature`'s `items` | `surface` (the paint of the frame in one prop: its fill, how strong the fill is, whether it is lifted, its border and its corners) | `IDSFrameSurface`: `color` · `strength` · `raised` · `bordered` · `rounded`, each optional, a key left out taking the theme's | none |
| `DSFeature` | `frames` (the parts of the feature the frame holds) | a list of `TEXT` · `MEDIA`. None when unset | `DSFeaturePartType` |
| `DSPanelContainer` · `DSCard` · `DSCardWidget` | `frames` (the parts of the box the frame holds) | a list of `HEADER` · `CONTENT` · `FOOTER`. A panel's, from the theme's `container.panel` when unset; a card's and a card widget's, all three | `DSBoxPartType` |
| `DSFeature` | `mediaNode` · `contentNode` (art drawn as given, and a part of the page's own in the place of the items; `media` is data, as on `DSItem`) | a node | none |
| `DSItem` | `mediaAlign` (where the picture stands against the text) | `TOP` · `CENTER` · `BOTTOM`, `CENTER` when unset | `DSVerticalAlignType` |
| `DSItem` | `endAlign` (where the end node stands against the text: at the title's first line, in the middle of the text, or at the last line of the text) | `TOP` · `CENTER` · `BOTTOM`. Unset, a line keeps its end node centred and a vertical item keeps it at the top end | `DSVerticalAlignType` |
| A cell of `DSTable`, head or data | `verticalAlignment` (where the content of a cell sits when the row is taller than the content) | `TOP` · `CENTER` · `BOTTOM`, `CENTER` when unset | `DSVerticalAlignType` |
| `DSFormatDateTime` · `DSFormatDate` | `type` (the form the date is written in: the date as it is, or how long ago in words) | `DEFAULT` · `AGO`, `DEFAULT` when unset | `DSFormatDateType` |
| `DSItem` | `mtype`, on the picture given to `media` (the kind of picture: a bare icon, a mark, an avatar, a group of avatars, or a block of the page's own) | `ICON` · `MARK` · `AVATAR` · `AVATAR_GROUP` · `CUSTOM` | `DSItemMediaType` |
| `DSItem` | `mtype`, on a fact of `facts` (the form the fact is given in) | `TEXT` · `BADGE` · `CUSTOM` | `DSItemFactType` |
| `DSRadio` · `DSRadioGroup` | `type` | `DEFAULT` · `BADGE` | `DSRadioType` |
| `DSSkeleton` | `type` | `LINE` · `TEXT` · `LIST` · `CARD` · `FORM` · `TABLE` | `DSSkeletonType` |
| `DSButton` | `type` | `SUBMIT` · `BUTTON`, `BUTTON` when unset | `DSButtonType` |
| `DSButtonGroup` · `DSToolbar` · `DSTabs` · `DSSeparator` | `orientation` | `HORIZONTAL` · `VERTICAL`, `HORIZONTAL` when unset | `DSOrientationType` |
| `DSButton` · `DSLink` · `DSMenubar` · `DSDropdownMenu` | `authzDenied` | `HIDE` · `DISABLE`, `HIDE` when unset | `DSAuthzDeniedType` |
| `DSAccordion` · `DSAccordionGroup` · `DSCollapsible` | `indicatorPlacement` | `LEFT` · `RIGHT`, `LEFT` when unset | `DSPlacementHorizontalType` |
| `DSAccordion` · `DSAccordionGroup` · `DSCollapsible` | `indicatorExpandedIcon` · `indicatorCollapsedIcon` | an icon of the core's icons, `CHEVRON_UP` open and `CHEVRON_DOWN` closed when unset | `DSIconType` |
| `DSAddressView` | `layout` | `BLOCK` · `INLINE`, `BLOCK` when unset | `DSAddressViewLayoutType` |
| `DSCodeBlockView` | `language` | `PLAIN` · `JSON` · `JAVASCRIPT` · `TYPESCRIPT` · `JSX` · `TSX` · `HTML` · `CSS` · `SHELL`; unset or `PLAIN` draws no highlighting | `DSCodeLanguageType` |
| `DSCodeBlockView` · `DSJSONView` · `DSJSONControl` | `mode` | `LIGHT` · `DARK`; unset, it follows the app theme | `DSThemeModeType` |
| `DSInput` | `type` | `TEXT` · `NUMBER` · `PASSWORD` · `EMAIL` · `TEL` · `COLOR`, `TEXT` when unset | `DSInputType` |
| `DSInput` | `mode` (the keyboard a touch device offers) | `NONE` · `TEXT` · `DECIMAL` · `NUMERIC` · `TEL` · `SEARCH` · `EMAIL` · `URL`, `TEXT` when unset | `DSInputModeType` |
| `DSTimePicker` | `type` (the clock; required) | `TWENTY_FOUR_HOUR` · `TWELVE_HOUR` | `DSTimePickerType` |
| `DSDateTimePicker` | `timeFormat` (the clock of the time part) | `TWENTY_FOUR_HOUR` · `TWELVE_HOUR`, the clock of the app's time format when unset | `DSTimePickerType` |
| `DSTimePicker` | `intervalMinutes` | `MIN_15` · `MIN_30` · `MIN_60`, `MIN_15` when unset | `DSTimePickerIntervalType` |
| `DSDateTimePicker` | `minuteStep` (the values are numbers) | `15` · `30` · `60`, `15` when unset | `DSDateTimeMinuteStepType` |
| `DSImagePicker` | `mode` (required) | `VIEW` · `EDIT` | `DSImagePickerModeType` |
| `DSAttachment` · `DSAttachmentMulti` | `acceptedFileTypes` (a list of these) | `TEXT` · `DOC` · `EXCEL` · `CSV` · `IMAGES` · `PDF` · `ZIP` | `IDSAttachmentType` |
| Every entry control | `validationType` | `ERROR`; unset, no error is drawn | `DSEntryControlValidationType` |
| `DSToast` | `placement` | `TOP` · `BOTTOM` · `TOP_LEFT` · `TOP_RIGHT` · `BOTTOM_LEFT` · `BOTTOM_RIGHT`, `TOP_RIGHT` when unset | `DSToastPlacementType` |
| `DSHScroll` | `arrowType` | `DEFAULT` · `OVERLAY`, `DEFAULT` when unset | `DSHScrollArrowType` |
| `DSTabs` | `type` | `LINE` · `SWITCH` · `PILL`, the look the `pageLevel` picks when unset | `DSTabsType` |
| `DSTabs` | `color` | `BASE` · `DEFAULT` · `PRIMARY`, the theme's `layout.navigation.color` when unset | `DSSurfaceColorType` |
| `DSTabs` | `entry` | `SOLID` · `QUIET` · `SUBTLE` · `LINE` · `PLAIN`, the theme's `layout.navigation.entry` when unset | `DSNavEntryType` |
| `DSTabs` | `raised` | yes or no, no by default: a soft shadow and no colour, on the switch's open tab, on the pill's bar, or on the open tab of either where it stands without a bar; the line ignores it | none |
| `DSScrollArea` | `direction` | `VERTICAL` · `HORIZONTAL` · `BOTH`, `VERTICAL` when unset | `DSScrollDirectionType` |
| `DSDrawer` | `placement` | `LEFT` · `RIGHT` · `TOP` · `BOTTOM`, `BOTTOM` when unset | `DSDrawerPlacementType` |
| `DSSheet` | `placement` | `LEFT` · `RIGHT` · `TOP` · `BOTTOM`, `RIGHT` when unset | `DSSheetPlacementType` |
| `DSPopover` · `DSHoverCard` · `DSTooltip` · `DSDropdownMenu` · `DSConfirmPopover` | `placement` (`DSPopover` requires it; the others open at `BOTTOM`, `TOP`, `BOTTOM_LEFT` and `BOTTOM_RIGHT` when unset, in that order) | `LEFT` · `RIGHT` · `TOP` · `BOTTOM` · `TOP_LEFT` · `TOP_RIGHT` · `BOTTOM_LEFT` · `BOTTOM_RIGHT` · `RIGHT_TOP` · `RIGHT_BOTTOM` · `LEFT_TOP` · `LEFT_BOTTOM` | `DSPlacementType` |
| `DSContextMenu` | `placement` | `LEFT` · `RIGHT`, `LEFT` when unset | `DSPlacementHorizontalType` |
| `DSPopover` | `trigger` | `HOVER` · `CLICK`, `HOVER` when unset | `DSTriggerType` |
| `DSSticky` | `mode` (required) | `TOP` · `BOTTOM` | `DSPlacementVerticalType` |

**A block that draws itself by its place on a page takes `pageLevel` for that place, with the vocabulary `DSPageLevelType`** (`RD.SUPPORT.SURFACE.113`). The values are read from the top of the page down: `PAGE`, `CONTAINER`, `WIDGET`, `GROUP`, `CONTENT`, `INLINE`. `DSItem`, `DSItemFacts`, `DSTabs` and `DSFeature` take it, and a block takes no vocabulary of its own for its place on a page. `architecture-components.md` states what each level draws.

**The shared vocabularies of the platform.** The Support contract realizes them for code, and the book states the values for a designer.

| Block | Prop | Vocabulary | Values |
| --- | --- | --- | --- |
| `DSDatePicker` · `DSDateRangePicker` | `format` | `SPDateFormatType` | `US_STANDARD` · `EUROPEAN_STANDARD` · `EUROPEAN_DASH` · `ISO_8601` · `GERMAN_STANDARD` · `SHORT_MONTH` · `FULL_MONTH` |
| `DSFormatDate` · `DSFormatDateTime` | `dateFormat` | `SPDateFormatType` | the values of the row above |
| `DSFormatTime` · `DSFormatDateTime` | `timeFormat` | `SPTimeFormatType` | `HH_MM` · `HH_MM_SS` · `HH_MM_DAY_FORMAT` · `HH_MM_SS_DAY_FORMAT` |
| `DSFormatNumber` | `numberFormat` | `SPNumberFormatType` | `US_STANDARD` · `EUROPEAN_STANDARD` · `FRENCH_STANDARD` · `NO_SEPARATOR` · `INTEGER_COMMA` · `INTEGER_PLAIN` |
| `DSFormatCurrency` | `currencyCode` | `SPCurrencyCodeType` | `USD` · `EUR` · `GBP` · `INR` · `JPY` · `CAD` · `AUD` · `CHF` · `CNY` · `BRL` · `MXN` · `SEK` · `AED` · `SGD` |
| `DSAddressForm` | `format` | `SPAddressFormatType` | `DEFAULT` · `US` · `IN` · `UK`, or a partial address configuration in their place |

A format prop that is not set takes the person's preference from the app context. A time takes the app's time format, which the app context always holds, and a block falls back to none of its own. `DSAddressForm` derives its format from the selected country.

## The six layers — ✅

| Design-system layer | Holds | May use |
| --- | --- | --- |
| Core | the tokens, the vocabularies and the icons | nothing |
| Components | the smallest blocks, and the composites: blocks built from components for one task | core |
| Widgets | units placed beside others or in a sidebar | components and core |
| Containers | the containers | components and core |
| Layouts | the layout | every layer before it |
| App | the root block `DSApp`, the app's contract and the theme | every layer before it |

A layer uses only the layers named before it, so the direction between two blocks is never an argument: the block in the later layer is the one that depends. The vocabulary is `CORE` · `COMPONENTS` · `WIDGETS` · `CONTAINERS` · `LAYOUTS` · `APP`.

**App is the last layer, so no block of another layer uses the root block.** A block reads what the root block hands down from where it sits (`architecture-app.md`). Reading a setting that was handed down is not using the block that handed it. In a web package, each layer is one folder of the `ui` taxonomy: the root block, its boot and its managers stand in the folder of the app layer.

## A name says its layer — ✅

A suffix names where a unit is placed: `App`, `Layout`, `Container` and `Widget`. A component carries none, and a composite is a component.

| Where the unit is placed | Its name ends in | Example |
| --- | --- | --- |
| Nowhere in particular: a component, a composite included | no word | `DSButton` · `DSTable` · `DSDataTable` · `DSFilterBar` · `DSFeature` |
| Beside others, or in a sidebar, inside a container or not | `Widget` | `DSCardWidget` |
| Around a part of a page | `Container`, with the box it draws before it when it draws one | `DSPanelContainer` · `DSDataTablePanelContainer` · `DSSectionContainer` · `DSFeatureGridSectionContainer` |
| Around a page | `Layout` | `DSLayout` |
| Around an app | `App` | `DSApp` |

- **A suffix MUST name where a unit is placed: `App`, `Layout`, `Container` or `Widget`** (`RD.SUPPORT.SURFACE.229`). A reader then tells where a block stands from its name alone, in the book, in the design library and in every stack.
- **The word before `Container` MUST name the box the unit draws, and the unit MUST be written in place of that box** (`RD.SUPPORT.SURFACE.267`). A `…PanelContainer` stands where a panel may, and a `…SectionContainer` where a section may. There is no `DSCardContainer`, `DSFeatureContainer` or `DSFeatureSectionContainer`. `architecture-containers.md` states the rule and the props it carries.
- **A component MUST take no such word.** A composite is placed nowhere in particular, so it is a component and takes none: a data table is `DSDataTable`, never a widget by name.
- **No block MAY carry a letter for its layer before its name.** A letter before the name was the only mark of its kind in the design system, and a reader had to be told what it stood for.
- **A name that belongs to a block MUST keep the block's whole name first, and its own word follows.** This holds for a config, a vocabulary, an item and a private part. The table below gives the names that belong to the core composites and the core widget.
- **A unit that a stack provides on its own MUST follow the same rule**, because it keeps every rule of the book that a core unit keeps (`architecture-components.md`). So the web stack's own composite for a list beside its detail is `DSListDetail`.

| Belongs to | What it is | Its name |
| --- | --- | --- |
| `DSDataTable` | its settings | `IDSDataTableConfig` |
| `DSDataTable` | the vocabulary of its layouts | `DSDataTableConfigLayoutType` |
| `DSDataTable` | its private part for the empty state, in the design library | `.DSDataTableEmpty` |
| `DSFilterBar` | its item, one field | `DSFilterBarField`, with its shape `IDSFilterBarField` |
| `DSFilterBar` | the vocabulary of the kinds of field | `DSFilterBarFieldType` |
| `DSCardWidget` | its settings | `IDSCardWidgetProps` |
| `DSCardWidget` | the vocabulary of the kinds of part | `DSCardWidgetPartType` |
| `DSCardWidget` | the shape every part shares, and the shape of each kind of part | `IDSCardWidgetPartBase`, with `IDSCardWidgetPartItems`, `IDSCardWidgetPartList` and `IDSCardWidgetPartFree` |
| `DSCardWidget` | an item of an `ITEMS` part, and a row of a `LIST` part | `IDSCardWidgetItem` and `IDSCardWidgetRow` |
| `DSFeature` | its props | `IDSFeatureProps` |
| `DSFeature` | the vocabulary of its forms, of the ways it draws its items, of where its actions stand, and of the parts its frame holds | `DSFeatureType`, `DSFeatureItemsType`, `DSFeatureActionsPlacementType` and `DSFeaturePartType` |
| `DSFeature` | an action, and an item | `IDSFeatureAction` and `IDSFeatureItem` |
| `DSFeatureGridSectionContainer` | its props, and the interface of each group | `IDSFeatureGridSectionContainerProps`, with `IDSFeatureGridSectionContainerSectionProps` and `IDSFeatureGridSectionContainerHeadingProps` |
| `DSDataTablePanelContainer` | its props, its metadata, and the panel it draws | `IDSDataTablePanelContainerProps`, `IDSDataTablePanelContainerMetadata` and `IDSDataTablePanelContainerPanelProps` |

`DSAnchorContainer` is a component of Utility, and its name ends in `Container` today. The developer has not ruled on that name, so it stays as it is.

## Marking each property — ✅

Mark each property of the design library as a declared prop, a shown state, or a setting taken from the block above. A design read back to code never gains a prop that no platform has. Name a hook of the design system by its context: `useDS`, then the context, then the value. Each context has one hook that returns it whole. The size context has a hook of one value, `useDSSize`, and the block's own `size` wins over it. The rule binds a hook whose value comes from one context: a hook that reads several, or none, is named for what it does.

## Each shared state has one picture — ✅

A block drawn from data is a host and an item: one item serves every host that takes one data shape, and a host whose data differs declares its own item (stated further in `architecture-components.md`). Each shared state has one picture, on every block and on every kind of surface, chosen on the first component that has it. Selected has one picture for each kind of entry: the chosen option of a select or of a menu draws a check at its end; a chosen row of a list, the row with `selected`, draws a fill of the soft step of the primary role across the row, and no check; an entry that is no row — a bar entry, the current page of a pager, a tab, a day of a calendar, an item of the layout's navigation — has no room for a check, and draws a fill of the primary role with its label in that role. A breadcrumb is the one trail that is not a bar of entries: its current page is the last crumb, and draws plain text in a stronger weight than the links before it, is not a link, and draws no fill. Every block that takes the key draws the focus picture, including a tab, an entry of a menubar or a breadcrumb, and the header of an accordion or a collapsible. No block takes the key and shows nothing. The picture shows when a person reaches the block with the keyboard, and not after a click with a pointer, and a picture that shows is whole: neither the box of the block nor a neighbour cuts it.

## Boundary

This ref states which three props mean one thing everywhere, which of the two sizes a block takes, what kind every other prop is, which props take a vocabulary and with which values, which six layers a block is built from, which suffix of a name says where a unit is placed, and which seven states share one picture. It stops at giving any of them a value — that is `architecture-core.md`. It does not say which blocks exist — that is `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.140` | the book names every block, prop and token of the design system, and every stack uses that name |
| `RD.SUPPORT.APPS.143` | `variant` names the surface treatment, `color` the hue and `size` the density step, on every block and every kind of surface |
| `RD.SUPPORT.SURFACE.229` | a suffix names where a unit is placed (`App`, `Layout`, `Container`, `Widget`); a component, a composite included, takes none, and no block carries a letter for its layer before its name |
| `RD.SUPPORT.SURFACE.100` | `size` says how dense a control is and `scaleSize` how large a thing that is shown is drawn; the icon, the mark, the avatar and the avatar group take `scaleSize` |
| `RD.SUPPORT.SURFACE.267` | the word before `Container` names the box a unit draws and is written in place of, so a `…PanelContainer` stands where a panel may and a `…SectionContainer` where a section may |
| `RD.SUPPORT.SURFACE.113` | the item line and the tabs take `pageLevel`, with the one vocabulary `DSPageLevelType`, and the item line has no size |
| `RD.SUPPORT.SURFACE.154` | the values of `variant` are named by their strength and read from the strongest to the faintest, and every variant of every hue, and of a colour the page chooses, keeps its text readable |
| `RD.SUPPORT.SURFACE.007` | the five values of `size` are read smallest to largest, `XS` to `XL`, wherever they are listed, and `SM` is the default size a theme sets |
| `RD.SUPPORT.SURFACE.298` | a token has one name, the book's, in small letters with dashes, and each stack spells it by one fixed rule of its language |
| `RD.SUPPORT.SURFACE.009` | `CUSTOM` is a value of `color` on every stack, and the one named way a page sets a colour outside the theme |
| `RD.SUPPORT.SURFACE.040` | a prop whose values are a vocabulary is stated in the book with its values |
| `RD.SUPPORT.SURFACE.041` | the design library carries such a prop, and every stack takes it, under the same name and the same values |
| `RD.SUPPORT.SURFACE.042` | a vocabulary is the design system's own or a shared one of the platform, and a shared one is realized once in the Support contract |
| `RD.SUPPORT.SURFACE.249` | an alignment takes `DSHorizontalAlignType` or `DSVerticalAlignType` on any unit, and no unit defines an alignment vocabulary of its own |
| `RD.SUPPORT.SURFACE.043` | a unit or a prop of the design library follows the order construct, Figma, stack, showcase |
| `RD.SUPPORT.SURFACE.082` | that order binds the core units, and not a unit that a stack provides on its own |
| `RD.SUPPORT.APPS.145` | the design system has the layers core, components, widgets, containers, layouts and app, on every stack, and a layer uses only the layers named before it |
| `RD.SUPPORT.APPS.154` | a hook of the design system names the context its value comes from |
| `RD.SUPPORT.APPS.142` | each shared state of a control has one picture, chosen in the design library on the first component that has it |
| `RD.SUPPORT.APPS.157` | selected has one picture for each kind of entry |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
