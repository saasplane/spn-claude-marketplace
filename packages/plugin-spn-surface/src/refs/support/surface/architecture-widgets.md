<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/07-architecture-widgets.md",
      "seen": "82aa2c8b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/07-architecture-widgets/",
      "seen": "cef5acd3"
    }
  ]
}
-->

# Widgets — Units Placed Beside Others

Source of truth: the foundation's Widgets construct (`docs/02-constructs/02-support/01-surface/07-architecture-widgets.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/07-architecture-widgets/`). Widgets is the seventh of thirteen Surface constructs.

Read this before you place a card drawn from data, or before you decide whether a new block is a widget, a component or a composition of the page. **The thing to unlearn: a widget is not just a bigger component.** A component is the smallest block; a widget is built *from* components, and it stands beside others or in a sidebar, inside a container or not. A block built from components for one task and placed nowhere in particular, such as a data table, is a composite, and it is a component (`architecture-components.md`).

## Terms

| Term | What it means |
| --- | --- |
| Widget | a unit placed beside others or in a sidebar, inside a container or not, built from components and placed whole |

A widget's task states are the task state of `standards-interaction.md`, and this ref carries no second definition of them. A widget adds no states of its own. It may name the kinds of its own parts, as the card widget does with `DSCardWidgetPartType`.

## What makes a unit a widget — 🔮

A widget is built for one purpose. It is not a set of components a page composes one at a time; it is one piece, and the widget itself places and wires the parts inside it. A widget takes one size, from its own prop or from the block above it, and **passes that size to every part inside it** — a page sets one size for the whole widget, and never dresses its parts separately.

**Surface's core widget is the card widget `DSCardWidget`** (`RULE.SUPPORT.SURFACE.127`). Every stack builds it, and the design library draws it. The data table, the filter bar and the comparison are not widgets: each is a composite, a component of its own group (`RULE.SUPPORT.SURFACE.230`). A stack may provide further widgets of its own, as `architecture-components.md` states under the core units and a stack's own. This ref does not name them, and the library does not draw them.

**A name ends in `Widget` only for a unit placed beside others** (`RULE.SUPPORT.SURFACE.229`), with no letter for its layer before the name (`RULE.SUPPORT.SURFACE.098`). `architecture-names.md` states the rule for the layers, and the names that belong to a widget.

## DSCardWidget — 🔮

`DSCardWidget` shows one thing as a card: a head, its parts, and a footer, always in that order. A page gives it data, and the widget draws the card through `DSCard` and its parts, `DSItem`, `DSList` and `DSList.Item`. So every such card of an app starts its head, its rows and its empty words on the same line.

| Part | The page gives | What the widget draws |
| --- | --- | --- |
| Its head | `header`, the props of `DSItem`, whole | an item line that stands flush in the header of the card, at the page level `WIDGET` where the page gives none. A card with no `header` has no head |
| Its parts | `parts`, a list in which each part is of one kind | each part in the order given |
| Its footer | `footer`, any node | the node in the footer of the card. A card with no `footer` has no footer part |

**The library draws** the widget composed from `DSCard`: `size`; `divided`, `headerActions` and `footer` once each; each kind of part once; `opacity` `TRANSLUCENT` once; `frames` and the `surface` keys as modes; and, as its usage, a dashboard's recent orders.

- **`DSCardWidget` MUST take each group of its settings as the props of the unit that draws it, whole** (`RULE.SUPPORT.SURFACE.127`). Its head and the small head of a part are the props of `DSItem`. An item of a part is the props of `DSItem`, and a row of a part is the props of `DSList.Item`. A page that knows those units knows the widget. So the picture of a head or of an item is the `media` of `DSItem`, given as data of one kind.

A part states its kind in `mtype`, which takes `DSCardWidgetPartType`. Every part also takes `key`, `header`, the props of `DSItem` for the small head of the part, and `headerActions`, the actions of that head. That head is drawn at the page level `GROUP` where the page gives none, and a row of an `ITEMS` part at `CONTENT`.

| Kind | The page gives | What the widget draws |
| --- | --- | --- |
| `ITEMS` | `items`, each the props of `DSItem` with a `key` and, where the page gives it, `selected`; and `emptyText`, `divided` and `hoverable` | a `DSList` whose rows each hold a `DSItem` |
| `LIST` | `rows`, each the props of `DSList.Item` with a `key`; and `emptyText`, `divided` and `hoverable` | a `DSList` with the rows as they are given |
| `FREE` | `node`, any node; and `flush` | the node, in the inset of the card. With `flush` the part takes the inset of the card off |

- **A page chooses the kind by what it holds.** A page that holds records as item lines gives `ITEMS`, and the widget builds the list. A page that needs a row of its own gives `LIST`. Anything else, such as a group of buttons, is `FREE`.
- **The widget decides where things start, so a page does not.** An `ITEMS` part and a `LIST` part run from edge to edge of the card, and their rows pad to the inset of the card. The small head of a part, its rows and its empty words start on one line.
- **The `headerActions` of a part MUST be drawn after the title of its head, as one group at the end, with the look of the head of a group** (`RULE.SUPPORT.SURFACE.181`): the main action `SUBTLE`, every other action `OUTLINE`, an icon alone `GHOST`, one step below the size of the card. A size or a variant on a button wins. A part with no `header` draws no action.
- **A part with no row MUST draw its `emptyText`, in the inset of the card and in the muted tone.** With no `emptyText` it draws its head alone.
- **A row of an `ITEMS` part MUST hold one link, and never a link inside a link.** What `endNode` holds stays outside the link, so a press on an action there does the action and does not follow the link.
- **A row of an `ITEMS` part or of a `LIST` part MAY be `selected`.** The page says which row is chosen, and the widget draws it as a chosen row of a list, with the band and `aria-current="true"`. The widget holds no state for it.
- **The widget MUST take `surface` and `frames` for the frame of its card, and `fullHeight`, and MUST hand each to its `DSCard`** (`RULE.SUPPORT.SURFACE.261`, `RULE.SUPPORT.SURFACE.262`). `surface` is an `IDSFrameSurface` and `frames` is `DSBoxPartType[]`, and they mean on the widget what they mean on the card. `frames` is `HEADER`, `CONTENT` and `FOOTER` where the page names none, so a dashboard tile may list `CONTENT` alone and stand its title flat above a framed body. A key of the surface that the page does not give follows the card look of the theme (`architecture-app.md`).
- **A built part.** From support 5.22.0 the web widget carries `frames` and `surface` in place of the four paint props, and its look at `theme.widget.card`. The library is owed.
- **The widget MUST take `divided` from its own prop where the prop is given, else from the theme's `widget.card`** (`RULE.SUPPORT.SURFACE.128`). `divided` draws the lines between the head, the parts and the footer of the card, and the default theme draws none.
- **The rows of an `ITEMS` part and of a `LIST` part take `divided` from the prop of the part, else from `rowsDivided` of the theme's `widget.card`, yes by default. They take `hoverable` from the prop of the part, else from `rowsHoverable`, yes by default.** The widget keeps no value of its own for an unset theme. A prop that says no is given, so a part that says no wins over a theme that says yes.
- **The widget MUST take one `size`, and MUST pass it to its head, its lists and its rows.**
- **The widget MUST NOT fold rows away.** A row that a page wants hidden, or shown in another way, is the page's to place, usually in a `FREE` part or in the footer.
- **The widget has no paging, no search, and no working or failed state.** A set that needs them is a `DSDataTable`.
- **The widget takes no `anchor` around the whole card, and no `style` or `minWidth`; its `className` and `opacity` paint the card and nothing else** (`RULE.SUPPORT.SURFACE.192`). A class of the app on the widget sets the card's paint tokens and the widget hands it to the card it draws. A card that is one link, or that needs a style of its own, is a `DSCard` that the page writes.

### The choice table of `DSCardWidget`

A card widget is chosen the way a card is, by what it holds: a head, and a body it draws from data. It takes its size from its place, and it stays opaque unless the page behind it is meant to show through.

**The cases**, read from the top; the first that matches wins.

| It holds | Where it stands | `opacity` | `size` | The page writes | Rule |
| --- | --- | --- | --- | --- | --- |
| a head over parts it draws from data: recent orders, a record's activity | a column or a grid of a page | `OPAQUE` (the unit's) | the place's | the parts | `RULE.SUPPORT.SURFACE.221` |
| the same, over a picture or a band the app paints | over the picture or the band | `TRANSLUCENT` | the place's | the opacity | `RULE.SUPPORT.SURFACE.192` |
| a block of content of its own with no head | — | not this unit: a `DSCard` | — | — | `RULE.SUPPORT.SURFACE.221` |

**The limits across a view.** The widget holds none of its own.

**The index by value.**

| Prop | Value | Its cases |
| --- | --- | --- |
| `opacity` | `OPAQUE` | every widget not over a picture or a band. It is the unit's own default |
| `opacity` | `TRANSLUCENT` | a widget over a picture or a band (`RULE.SUPPORT.SURFACE.192`) |
| `size` | `XS` to `XL` | the place's |

## Boundary

This ref states what makes a unit a widget, and what `DSCardWidget` is built from. It stops at the edge of the widget. It does not state what a component is, or what any one of the components a widget is built from does — those are in `architecture-components.md`. It does not state how a page shows a list beside the detail of its chosen row. That is an app pattern, groups and their items, and `architecture-containers.md` states what a person sees on such a page. No core unit is built for it; the web stack has one of its own, `DSListDetail`, which `providers.md` names. It does not state what fills a part of a container, or what a widget does in a `flush` part — that is `architecture-containers.md`. It does not state where a widget's size comes from when none is set — that is `architecture-app.md`. It does not state what a data table, a filter bar, a comparison or a feature is; each is a composite of `architecture-components.md`. It does not state how `DSCardWidget` is drawn in the library or built by a stack — those are `delivery-library.md` and `providers.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RULE.SUPPORT.SURFACE.099` | the library draws nothing of a pattern, and the unit that places a list beside its detail is not a core unit |
| `RULE.SUPPORT.SURFACE.127` | the card widget is a core widget, each group of its settings is the props of the unit that draws it, the kinds of its parts, and it folds no rows away |
| `RULE.SUPPORT.SURFACE.128` | the order the card widget takes its lines and the hover of its rows in: its own prop, else the theme's card widget look |
| `RULE.SUPPORT.SURFACE.261` | the paint of a frame is the one prop `surface`, and the widget hands it to its card |
| `RULE.SUPPORT.SURFACE.262` | the widget takes `frames` and hands them to its card, all three parts where the page names none |
| `RULE.SUPPORT.SURFACE.181` | the small head of a card widget's part takes actions drawn as the head of a group |
| `RULE.SUPPORT.SURFACE.192` | a partner paints the card widget with a class of their own, and the class sets the card's paint tokens and nothing else |
| `RULE.SUPPORT.SURFACE.098` | a widget's name has no letter for the layer before it |
| `RULE.SUPPORT.SURFACE.229` | a suffix names where a unit is placed (`App`, `Layout`, `Container`, `Widget`), and a component carries none |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task. The web builds `DSCardWidget`. The design library has not drawn it yet.
