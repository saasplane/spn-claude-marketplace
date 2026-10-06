<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/04-architecture-names.md",
      "seen": "3332bf53"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/04-architecture-names/",
      "seen": "2b7a6384"
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

**`CUSTOM` is a value of `color` that means the caller owns the colour.** A block's inner text and icon take the colour around them, and a page passes a chosen colour as `customColor` on the blocks that take it. It is the one named way a page sets a colour outside the theme.

Keep each of the three names for its one meaning, on every block — a block takes `variant` and `color` independently. A prop that means something else takes another name: a shape, a type step or a kind of alert is not a surface treatment. Name a prop and its vocabulary with one word: the vocabulary `DS<Component><Word>Type` is taken through the prop `<word>`. Take every value from the vocabulary of its prop, never a free string.

A few names carry their own rule rather than the shared three: use `bordered` for a border a block draws around itself, and `rounded` for the corners of its frame. Only the container and the card take `raised`. An unset `bordered` reads the frame setting of a `flush` part above it, and only on a block that frames a part of a page — the table, the code block, the accordions and the empty state. The data table and the list take no `bordered`, because neither draws a border on any page. A field, a menubar and an avatar read their own default, because their border is the control's own chrome. Use `flush` on a part of a container for a part that draws no inset — it is yes or no, and no when it is not set.

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

This ref states which three props mean one thing everywhere, what kind every other prop is, which six layers a block is built from, and which seven states share one picture. It stops at giving any of them a value — that is `architecture-core.md`. It does not say which blocks exist — that is `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.140` | the book names every block, prop and token of the design system, and every stack uses that name |
| `RD.SUPPORT.APPS.143` | `variant` names the surface treatment, `color` the hue and `size` the density step, on every block and every kind of surface |
| `RD.SUPPORT.SURFACE.007` | the five values of `size` are read smallest to largest, `XS` to `XL`, wherever they are listed, and `SM` is the default size a theme sets |
| `RD.SUPPORT.SURFACE.009` | `CUSTOM` is a value of `color` on every stack, and the one named way a page sets a colour outside the theme |
| `RD.SUPPORT.APPS.145` | the design system has the layers core, components, widgets, containers, layouts and app, on every stack, and a layer uses only the layers named before it |
| `RD.SUPPORT.APPS.154` | a hook of the design system names the context its value comes from |
| `RD.SUPPORT.APPS.142` | each shared state of a control has one picture, chosen in the design library on the first component that has it |
| `RD.SUPPORT.APPS.157` | selected has one picture for each kind of entry |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
