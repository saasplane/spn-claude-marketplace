<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/04-architecture-names.md",
      "seen": "3332bf53"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/04-architecture-names/",
      "seen": "858b564f"
    }
  ]
}
-->

# Names — One Name for a Block, a Prop and a Value

Source of truth: the foundation's Names construct (`docs/02-constructs/02-support/03-surface/04-architecture-names.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/04-architecture-names/`). Names is the fourth of thirteen Surface constructs, and the first of the Architecture group — what a surface is built from, layer by layer.

Read this before you name a new block, a new prop or a new layer of the design system, or before you change a block of the design system.

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

## The three shared names — ✅

| Name | Means | Values | Vocabulary |
| --- | --- | --- | --- |
| `variant` | the surface treatment | `SOLID` · `SOFT` · `OUTLINE` · `GHOST` · `LINK` | `DSVariantType` |
| `color` | the hue | `DEFAULT` · `CUSTOM` · `PRIMARY` · `INFO` · `SUCCESS` · `WARNING` · `ERROR` | `DSColorType` |
| `size` | the density step, read smallest to largest | `XS` · `SM` · `MD` · `LG` · `XL` | `DSSizeType` |

**The five values of `size` are read smallest to largest, `XS` to `XL`, wherever they are listed** — in the book, in the design library and in every stack — **and `SM` is the default size a theme sets**; a block told no size takes it. Neither rule holds for `variant` or `color`, because neither of those is a scale.

**`CUSTOM` is a value of `color` that means the caller owns the colour.** A block's inner text and icon take the colour around them, and a page passes a chosen colour as `customColor` on the blocks that take it. It is the one named way a page sets a colour outside the theme. `DSButton` and `DSSeparator` take no `customColor`.

Keep each of the three names for its one meaning, on every block — a block takes `variant` and `color` independently. A prop that means something else takes another name: a shape, a type step or a kind of alert is not a surface treatment. Name a prop and its vocabulary with one word: the vocabulary `DS<Component><Word>Type` is taken through the prop `<word>`. Take every value from the vocabulary of its prop, never a free string. The text props follow it: `underline` of `DSLink` and `DSText` takes `SOLID` · `DOTTED` · `DASHED`, and `format` of `DSText` takes `UPPERCASE` · `LOWERCASE` · `CAPITALIZE`. A drawer and a sheet take `extent` for their reach, and the design library draws no `extent` variant, because the extent of an overlay there is the size of the instance.

A few names carry their own rule rather than the shared three: use `bordered` for a border a block draws around itself, and `rounded` for the corners of its frame. Only the container and the card take `raised`. An unset `bordered` reads the frame setting of a `flush` part above it, and only on a block that frames a part of a page — the table, the code block, the accordions and the empty state. The data table and the list take no `bordered`, because neither draws a border on any page. A field, a menubar and an avatar read their own default, because their border is the control's own chrome. Use `flush` on a part of a container for a part that draws no inset — it is yes or no, and no when it is not set. `DSTable` takes `hoverable`, yes or no and no by default, for whether a body row takes the table's row-hover fill under the pointer; a selected row, and a row that holds an open menu, keep their fill whichever way it is set. A prop that is a trait that is on or off takes an adjective, so the name is `hoverable`.

## A prop that takes a vocabulary is stated with its values — ✅

A design and its code agree on a prop only when they agree on what it takes. Without the values, a designer draws the clock of a time picker as a switch under a name of the designer's own, and the stack has to be corrected afterwards. Four rules keep the design library and every stack to the values.

- **A prop whose values are a vocabulary is stated with its values.** A long code list may be stated by the vocabulary's name and the place its values are stated, as the icons are. The first table below holds the vocabularies of the design system, and the second holds the shared ones.
- **The design library carries such a prop under the same name and the same values, and every stack takes it under the same name and the same values.** This is the rule that a name is the contract, applied to the values of a prop.
- **A vocabulary is either the design system's own or a shared one of the platform.** The design system's own is `DS<Component><Word>Type`, and it drops the component where several blocks take it, as `DSOrientationType` does. A shared one is `SP…Type`. It is realized once, in the Support contract, so that a service and a surface use the same values, and a design system never defines a shared one again.
- **A unit or a prop of the design library follows one order: the construct in the book, then the library in Figma as its visual proof, then each stack, then the showcase.** Each step follows the one before it. A component that belongs to one app does not follow this order.

**The design system's own vocabularies.** A yes-or-no prop takes no vocabulary. The default is the value shown with "when unset".

| Block | Prop | Values | Vocabulary |
| --- | --- | --- | --- |
| `DSAlert` · `DSToast` | `color` | `INFO` · `SUCCESS` · `WARNING` · `ERROR` | `DSColorType`, limited to these four |
| `DSText` | `typography` | `HEADING_XL` to `HEADING_XS` · `TITLE_XL` to `TITLE_XXS` · `CONTENT_XL` to `CONTENT_XXS` | `DSTypographyType` |
| `DSLink` · `DSText` | `underline` | `SOLID` · `DOTTED` · `DASHED` | `DSTextUnderlineType` |
| `DSText` | `format` | `UPPERCASE` · `LOWERCASE` · `CAPITALIZE` | `DSTextFormatType` |
| `DSLink` · `DSText` | `tone` | `DEFAULT` · `MUTED` · `SUBTLE` · `INVERSE` | `DSTextToneType` |
| `DSImage`, `DSImagePicker`'s `image` | `shape` | `NONE` · `FILM` · `WIDE` · `SQUARE` · `CIRCLE` | `DSImageShapeType` |
| `DSImage`, `DSImagePicker`'s `image` | `widthStep` | `NONE`, and `WIDTH_80` to `WIDTH_1280` | `DSImageWidthStepType` |
| `DSInputOTP` | `digits` | `FOUR` · `SIX` | `DSInputOTPDigitsType` |
| `DSIcon` | `iconSize` | `XXS` · `XS` · `SM` · `MD` · `LG` · `XL` · `XXL` · `XXL2` to `XXL5` | `DSIconSizeType` |
| `DSDrawer` · `DSSheet` | `extent` | `XS` · `SM` · `MD` · `LG` · `XL`, `MD` when unset | `DSOverlayExtentType` |
| `DSTabs` | `type` | `DEFAULT` · `LINE` · `BADGE` | `DSTabsType` |
| `DSRadio` · `DSRadioGroup` | `type` | `DEFAULT` · `BADGE` | `DSRadioType` |
| `DSSkeleton` | `type` | `LINE` · `TEXT` · `LIST` · `CARD` · `FORM` · `TABLE` | `DSSkeletonType` |
| `DSButton` | `type` | `SUBMIT` · `BUTTON`, `BUTTON` when unset | `DSButtonType` |
| `DSButtonGroup` · `DSTabs` · `DSSeparator` | `orientation` | `HORIZONTAL` · `VERTICAL`, `HORIZONTAL` when unset | `DSOrientationType` |
| `DSButton` · `DSLink` · `DSMenubar` · `DSDropdownMenu` | `authzDenied` | `HIDE` · `DISABLE`, `HIDE` when unset | `DSAuthzDeniedType` |
| `DSAccordion` · `DSAccordionGroup` · `DSCollapsible` | `indicatorPlacement` | `LEFT` · `RIGHT`, `LEFT` when unset | `DSPlacementHorizontalType` |
| `DSAccordion` · `DSAccordionGroup` · `DSCollapsible` | `indicatorExpandedIcon` · `indicatorCollapsedIcon` | an icon of the core's icons, `CHEVRON_UP` open and `CHEVRON_DOWN` closed when unset | `DSIconType` |
| `DSAddressView` | `layout` | `BLOCK` · `INLINE`, `BLOCK` when unset | `DSAddressViewLayoutType` |
| `DSCodeBlockView` | `language` | `PLAIN` · `JSON` · `JAVASCRIPT` · `TYPESCRIPT` · `JSX` · `TSX` · `HTML` · `CSS` · `SHELL`; unset or `PLAIN` draws no highlighting | `DSCodeLanguageType` |
| `DSCodeBlockView` · `DSJSONView` · `DSJSONControl` | `mode` | `LIGHT` · `DARK`; unset, it follows the app theme | `DSThemeModeType` |
| `DSInput` | `type` | `TEXT` · `NUMBER` · `PASSWORD` · `EMAIL` · `TEL` · `COLOR`, `TEXT` when unset | `DSInputType` |
| `DSInput` | `mode` (the keyboard a touch device offers) | `NONE` · `TEXT` · `DECIMAL` · `NUMERIC` · `TEL` · `SEARCH` · `EMAIL` · `URL`, `TEXT` when unset | `DSInputModeType` |
| `DSTimePicker` | `type` (the clock; required) | `TWENTY_FOUR_HOUR` · `TWELVE_HOUR` | `DSTimePickerType` |
| `DSDateTimePicker` | `timeFormat` (the clock of the time part) | `TWENTY_FOUR_HOUR` · `TWELVE_HOUR`, `TWENTY_FOUR_HOUR` when unset | `DSTimePickerType` |
| `DSTimePicker` | `intervalMinutes` | `MIN_15` · `MIN_30` · `MIN_60`, `MIN_15` when unset | `DSTimePickerIntervalType` |
| `DSDateTimePicker` | `minuteStep` (the values are numbers) | `15` · `30` · `60`, `15` when unset | `DSDateTimeMinuteStepType` |
| `DSImagePicker` | `mode` (required) | `VIEW` · `EDIT` | `DSImagePickerModeType` |
| `DSAttachment` · `DSAttachmentMulti` | `acceptedFileTypes` (a list of these) | `TEXT` · `DOC` · `EXCEL` · `CSV` · `IMAGES` · `PDF` · `ZIP` | `IDSAttachmentType` |
| Every entry control | `validationType` | `ERROR`; unset, no error is drawn | `DSEntryControlValidationType` |
| `DSToast` | `placement` | `TOP` · `BOTTOM` · `TOP_LEFT` · `TOP_RIGHT` · `BOTTOM_LEFT` · `BOTTOM_RIGHT`, `TOP_RIGHT` when unset | `DSToastPlacementType` |
| `DSHScroll` | `arrowType` | `DEFAULT` · `PRIMARY` · `OVERLAY`, `DEFAULT` when unset | `DSHScrollArrowType` |
| `DSScrollArea` | `direction` | `VERTICAL` · `HORIZONTAL` · `BOTH`, `VERTICAL` when unset | `DSScrollDirectionType` |
| `DSDrawer` | `placement` | `LEFT` · `RIGHT` · `TOP` · `BOTTOM`, `BOTTOM` when unset | `DSDrawerPlacementType` |
| `DSSheet` | `placement` | `LEFT` · `RIGHT` · `TOP` · `BOTTOM`, `RIGHT` when unset | `DSSheetPlacementType` |
| `DSPopover` · `DSHoverCard` · `DSTooltip` · `DSDropdownMenu` | `placement` (`DSPopover` requires it; the others open at `BOTTOM`, `TOP` and `BOTTOM_LEFT` when unset, in that order) | `LEFT` · `RIGHT` · `TOP` · `BOTTOM` · `TOP_LEFT` · `TOP_RIGHT` · `BOTTOM_LEFT` · `BOTTOM_RIGHT` · `RIGHT_TOP` · `RIGHT_BOTTOM` · `LEFT_TOP` · `LEFT_BOTTOM` | `DSPlacementType` |
| `DSContextMenu` | `placement` | `LEFT` · `RIGHT`, `LEFT` when unset | `DSPlacementHorizontalType` |
| `DSPopover` | `trigger` | `HOVER` · `CLICK`, `HOVER` when unset | `DSTriggerType` |
| `DSSticky` | `mode` (required) | `TOP` · `BOTTOM` | `DSPlacementVerticalType` |

**The shared vocabularies of the platform.** The Support contract realizes them for code, and the book states the values for a designer.

| Block | Prop | Vocabulary | Values |
| --- | --- | --- | --- |
| `DSDatePicker` · `DSDateRangePicker` | `format` | `SPDateFormatType` | `US_STANDARD` · `EUROPEAN_STANDARD` · `EUROPEAN_DASH` · `ISO_8601` · `GERMAN_STANDARD` · `SHORT_MONTH` · `FULL_MONTH` |
| `DSFormatDate` · `DSFormatDateTime` | `dateFormat` | `SPDateFormatType` | the values of the row above |
| `DSFormatTime` · `DSFormatDateTime` | `timeFormat` | `SPTimeFormatType` | `HH_MM` · `HH_MM_SS` · `HH_MM_DAY_FORMAT` · `HH_MM_SS_DAY_FORMAT` |
| `DSFormatNumber` | `numberFormat` | `SPNumberFormatType` | `US_STANDARD` · `EUROPEAN_STANDARD` · `FRENCH_STANDARD` · `NO_SEPARATOR` · `INTEGER_COMMA` · `INTEGER_PLAIN` |
| `DSFormatCurrency` | `currencyCode` | `SPCurrencyCodeType` | `USD` · `EUR` · `GBP` · `INR` · `JPY` · `CAD` · `AUD` · `CHF` · `CNY` · `BRL` · `MXN` · `SEK` · `AED` · `SGD` |
| `DSAddressForm` | `format` | `SPAddressFormatType` | `DEFAULT` · `US` · `IN` · `UK`, or a partial address configuration in their place |

A format prop that is not set takes the person's preference from the app context. `DSFormatTime` falls back to `HH_MM` when the person has no time preference, and `DSAddressForm` derives its format from the selected country.

## The six layers — ✅

| Design-system layer | Holds | May use |
| --- | --- | --- |
| Core | the tokens, the vocabularies and the icons | nothing |
| Components | the smallest blocks | core |
| Widgets | blocks built for one purpose | components and core |
| Containers | the container | components and core |
| Layouts | the layout | every layer before it |
| App | the root block `DSApp`, the app's contract and the theme | every layer before it |

A layer uses only the layers named before it, so the direction between two blocks is never an argument: the block in the later layer is the one that depends. The vocabulary is `CORE` · `COMPONENTS` · `WIDGETS` · `CONTAINERS` · `LAYOUTS` · `APP`.

**App is the last layer, so no block of another layer uses the root block.** A block reads what the root block hands down from where it sits (`architecture-app.md`). Reading a setting that was handed down is not using the block that handed it. In a web package, each layer from components to layouts is one folder of the `ui` taxonomy, and the root block stands beside those folders.

## Marking each property — ✅

Mark each property of the design library as a declared prop, a shown state, or a setting taken from the block above. A design read back to code never gains a prop that no platform has. Name a hook of the design system by its context: `useDS`, then the context, then the value. Each context has one hook that returns it whole. The size and the frame setting each have a hook of one value, which takes the block's own prop. The rule binds a hook whose value comes from one context: a hook that reads several, or none, is named for what it does.

## Each shared state has one picture — ✅

A block drawn from data is a host and an item: one item serves every host that takes one data shape, and a host whose data differs declares its own item (stated further in `architecture-components.md`). Each shared state has one picture, on every block and on every kind of surface, chosen on the first component that has it. Selected has one picture for each kind of entry: a row of a list or a menu draws a check at its end; an entry that is no row — a bar entry, the current page of a pager, a tab, a day of a calendar, an item of the layout's navigation — has no room for a check, and draws a fill of the primary role with its label in that role. A breadcrumb is the one trail that is not a bar of entries: its current page is the last crumb, and draws plain text in a stronger weight than the links before it, is not a link, and draws no fill. Every block that takes the key draws the focus picture, including a tab, an entry of a menubar or a breadcrumb, and the header of an accordion or a collapsible. No block takes the key and shows nothing. The picture shows when a person reaches the block with the keyboard, and not after a click with a pointer, and a picture that shows is whole: neither the box of the block nor a neighbour cuts it.

## Boundary

This ref states which three props mean one thing everywhere, what kind every other prop is, which props take a vocabulary and with which values, which six layers a block is built from, and which seven states share one picture. It stops at giving any of them a value — that is `architecture-core.md`. It does not say which blocks exist — that is `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.140` | the book names every block, prop and token of the design system, and every stack uses that name |
| `RD.SUPPORT.APPS.143` | `variant` names the surface treatment, `color` the hue and `size` the density step, on every block and every kind of surface |
| `RD.SUPPORT.SURFACE.007` | the five values of `size` are read smallest to largest, `XS` to `XL`, wherever they are listed, and `SM` is the default size a theme sets |
| `RD.SUPPORT.SURFACE.009` | `CUSTOM` is a value of `color` on every stack, and the one named way a page sets a colour outside the theme |
| `RD.SUPPORT.SURFACE.040` | a prop whose values are a vocabulary is stated in the book with its values |
| `RD.SUPPORT.SURFACE.041` | the design library carries such a prop, and every stack takes it, under the same name and the same values |
| `RD.SUPPORT.SURFACE.042` | a vocabulary is the design system's own or a shared one of the platform, and a shared one is realized once in the Support contract |
| `RD.SUPPORT.SURFACE.043` | a unit or a prop of the design library follows the order construct, Figma, stack, showcase |
| `RD.SUPPORT.APPS.145` | the design system has the layers core, components, widgets, containers, layouts and app, on every stack, and a layer uses only the layers named before it |
| `RD.SUPPORT.APPS.154` | a hook of the design system names the context its value comes from |
| `RD.SUPPORT.APPS.142` | each shared state of a control has one picture, chosen in the design library on the first component that has it |
| `RD.SUPPORT.APPS.157` | selected has one picture for each kind of entry |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
