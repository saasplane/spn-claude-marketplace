<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/09-architecture-layouts.md",
      "seen": "8bd22315"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/09-architecture-layouts/",
      "seen": "410a6c34"
    }
  ]
}
-->

# Layouts — How a Page Is Framed

Source of truth: the foundation's Layouts construct (`docs/02-constructs/02-support/01-surface/09-architecture-layouts.md`) and its capability chapters (`docs/04-capabilities/02-support/01-surface/09-architecture-layouts/`). Layouts is the ninth of thirteen Surface constructs.

Read this before you choose a layout for an app, or before you build or draw a layout type on a new stack. A layout owns the navigation and the content of a page, and nothing inside the content. A page chooses its layout, and no rule restricts where the page places a block in the content. The layout types are `RAIL`, `DOCK`, `TOPNAV` and `CANVAS`, the body alone. A layout builds its navigation from the navigation units, fills places named by where they stand, and alone reads the theme. Each layout also marks the place a section reaches, so a section's fill stops at the navigation in an app and runs to the window's edges on a site. A part of a page that runs from edge to edge is a section, and the layout has no flush for it. A layout names no routing library.

## Terms

| Term | What it means |
| --- | --- |
| Layout | the block that frames a page: the navigation and the content it hands to the page |
| Layout type | `DSLayoutType` — `RAIL` · `DOCK` · `TOPNAV` · `CANVAS` |
| Body | the part of a layout that is the whole window: the fill behind everything, and the box every other part stands in, by its width |
| Navigation | the part of a layout that moves a person around the app: the entries, `startNode`, `actionsNode` and `endNode`, with its own fill, line and shadow |
| Content | the part of a layout the page's children stand in, with its own fill, line and shadow |
| Attached | `attached` — a part meets the window's edge; not attached, it floats, the layout's space in, as a rounded container |
| Sticky | `sticky` — the top bar stays in the window while the page scrolls |
| Bordered · Raised | `bordered` · `raised` — a part draws a line at its edges · a part draws a shadow |
| Layout space | `--layout-space` — the one spacing of a layout, from the theme's size: the page's padding and every gap between its parts |
| Place | where a layout puts what a page gives it, named by where it stands: `startNode`, `endNode`, `actionsNode`, `footerNode`, and in a dock or a top nav `headerNode` |
| Bar width | `barWidth` — how wide the bar's items stand in a top nav and a dock: the body's width where it is left out, and wider where it says so |
| Place of a section | the element a section reaches the edges of, which the layout marks: the window, the header, the footer or the content part |
| Entry kind | `DSNavEntryType` — `SOLID` · `QUIET` · `SUBTLE` · `LINE` · `PLAIN` |

## The types — 🔮

| Layout type | The navigation | What it is for |
| --- | --- | --- |
| `RAIL` | a sidebar at the side, with a fixed head and foot, which a person opens and shuts to icons | an app a person works in, with many sections: an admin console, the platform |
| `DOCK` | a bar across the top, and the entries in a column beside one page | one person's or one thing's settings: a profile, an account, set inside another frame |
| `TOPNAV` | a bar across the top, with the content below it | a website, with the few entries that fit on one line |
| `CANVAS` | none: the body alone | a sign-in, a marketing page or a page of an error |

**The library draws `DSLayout`:** each `DSLayoutType` (`RAIL`, `DOCK`, `TOPNAV`, `CANVAS`) once, and on a narrow screen once; `footerNode` as a swap; and, as its usage, an app's page, its rail, its bar and the content.

- **Choose a layout by the job of the app, as the table says, and never by how it looks** (`RD.SUPPORT.SURFACE.206`). One app may hold two: an admin app in `RAIL` signs a person in on `CANVAS` and opens their profile in `DOCK`.

A layout names no routing library — it moves between pages through the navigation seam, and the app's own router decides which page a route shows. The layout type is not a choice of the theme: every theme works with every layout.

## The three parts — 🔮

> **Planned.** The bar's width, the navigation at every size, the header in the body's box and the place a section reaches are design, and no stack builds them yet. The library is owed.

A layout has three parts for its look, whatever its type. Each part owns one thing, and the theme styles the three through its layout look, which `architecture-app.md` states field by field.

| Part | What it owns | Taken by |
| --- | --- | --- |
| Body | the fill behind everything, and the box every other part stands in, by its width | every type, and `CANVAS` alone |
| Navigation | its fill, its line, its shadow, whether it meets the window's edge, and whether the top bar stays while the page scrolls | `RAIL` · `DOCK` · `TOPNAV` |
| Content | its fill, its line, its shadow, and whether it is a box at the body's width that meets the navigation | `RAIL` · `DOCK` · `TOPNAV` |

- **A layout MUST have three parts, the body, the navigation and the content, and each MUST own only what the table gives it** (`RD.SUPPORT.SURFACE.200`). The width and the fill behind everything are the body's, and the content owns nothing inside its area (`RD.SUPPORT.APPS.146`).
- **Each part that draws a fill MUST give its surface** (`RD.SUPPORT.SURFACE.199`): the body for what stands straight on it, the navigation for its entries, and the content for the page.
- **The page's fill is `page-fill`, and the colour of the body sets it** (`RD.SUPPORT.APPS.160`, `RD.SUPPORT.SURFACE.200`). The default theme's body colour is `BASE`, so the page is white in light and 0.22 in dark under a navigation of `DEFAULT` at `SUBTLE`. Nothing works the colour out from the containers. No page and no story sets a fill of its own.
- **A navigation's colour stays in the navigation** (`RD.SUPPORT.SURFACE.226`). The bar, the rail, the dock's column and the phone's bar and drawer carry the navigation's surface; the body and the content each carry their own, `BASE` by default or the theme's colour, so a tile, a card or a text box in the page never takes the navigation's tint. A unit in the navigation, such as an item card in the rail, may take the navigation's tint; a unit in the content takes the content's.
- **The content MUST fill from its own colour and strength**, `BASE` where the app left it out. Its `bordered` and `raised` are its own: they follow neither the navigation's nor each other's.
- **A layout MUST draw its three parts by the layout look of the theme, and the theme holds no setting for one layout type** (`RD.SUPPORT.SURFACE.139`). A field the app left out holds the default theme's value, so a layout keeps no fallback of its own (`RD.SUPPORT.SURFACE.161`). With no choice at all, `RAIL`, `DOCK` and `TOPNAV` draw a white page, a navigation of the neutral hue at `SUBTLE` with a line and a shadow that meets the window, the open entry `SUBTLE`, and the content flat, at the whole width.
- **The three parts take one surface scale**: a colour and a strength give the same fill on every part, so contrast between parts is a choice of values. The default sets the navigation (`DEFAULT` at `SUBTLE`) apart from a `BASE` body and content; a body one step stronger than the parts on it makes floating parts stand out; the same pair on two parts makes them one; all at `BASE` with floating on reads only through borders and shadows.
- **A look comes from the theme, and a page's config changes it field by field** (`RD.SUPPORT.SURFACE.156`). The layouts alone read the theme and hand each look down: the navigation goes to its bar as `look`, and the bar hands it to its list. A config gives `body`, and for `RAIL`, `DOCK` and `TOPNAV` also `navigation` and `content`; `CANVAS` takes the body alone and refuses the others by its `mtype`. What an app chooses once sits in the theme, and what the code supplies sits in the config.
- **The navigation holds no colour of its own: each part of its look points at a token** (`RD.SUPPORT.SURFACE.163`).

## The width, on the body — 🔮

- **The width is the body's, and the navigation and the content stand in its box** (`RD.SUPPORT.SURFACE.158`, `RD.SUPPORT.SURFACE.200`). The box is the width, centred. `width` takes five steps, and `maxWidth` stays for a page whose width no step names. The theme gives every app `FULL`. A width only bounds: on a screen narrower than its step, the box is the screen less the layout's space.

| Width | At most | What it fits |
| --- | --- | --- |
| `NARROW` | 768 px | a page to read: an article, a sign-in, a single form |
| `MEDIUM` | 1024 px | settings and profile pages, a form with a side column |
| `WIDE` | 1280 px | the default page of an app |
| `XWIDE` | 1400 px | a public site's page and dense dashboards; the widest step that leaves a margin on a 1440 laptop |
| `FULL` | the screen | a canvas, a map, a board that uses every pixel |

- **A page that wants a column narrower than the box sets that width on its own block.** What stands inside the content is the page's.
- **The bar's items and the page's content stand in one box in every layout type, at every width** (`RD.SUPPORT.SURFACE.172`). The box is the body's, and the content keeps `--layout-space` as its padding, so the bar's first item starts where the content starts and its last item ends where it ends.

## Attached and sticky — 🔮

- **An attached navigation belongs to the window's edge.** Its fill runs to the edge it meets, and what it holds stands in the body's box. An attached content is the body's box itself: it meets the navigation and runs to the window's bottom, at the body's width and centred (beside a rail, centred in the area beside it), the body showing around it; its fill, line, shadow and `className` fall on that box, and at `FULL` and on a phone the box is the window. A part that is not attached floats, the layout's space in from the window and from the part beside it, rounded with the theme's radius, with its own fill, line and shadow. The navigation's default is attached, and the content's too.
- **A part's `bordered` and `raised` are its look wherever it stands, attached or floating; no switch is ever ignored.** A floating content draws its line and shadow all round its sheet. An attached content runs from the navigation to the page's end, so bordered it draws its line down its two sides and none across its top or bottom, and raised it casts its shadow from its two sides only; a side that meets a bordered, attached navigation shows the navigation's one line. A raised content beside a navigation that is not raised stands above it, so its shadow falls on the navigation; where both are raised, the navigation stands above. There is no `inset` and no alias for it.
- **`sticky` governs the top bar alone, the bar of `TOPNAV` and of `DOCK`**, and the default is sticky. A rail always stays at the height of the window, and the column of a dock always stays beside the page; `sticky` governs neither. Sticky and attached stand apart, so each of their four combinations is drawn.
- **A page that opens on a section MUST start the section's fill at the top of its place, and one that closes on a section MUST end the fill at the place's end.** The layout's page space stands above the first block and below the last only where that block is not a section, so a section's fill meets the bar and the footer with no band of the page between. The footer still keeps the layout's space above its own words. `DOCK` keeps its page space, because its column lines up with the page's first block.
- **Where the content draws a line at a side, the line MUST stand within the layout's space at that side**, so the page's words still start where the bar's, the header's and the footer's start.
- **A top navigation takes no `overlay`, and nothing stands over the content** (`RD.SUPPORT.SURFACE.200`). The content starts under the bar, or under the header. A marketing page that wants its hero to read as one with the bar gives the body the hero's colour and lets the bar float.
- **A part of the navigation draws its line and its shadow only at the sides that face the page** (`RD.SUPPORT.SURFACE.170`). The edge line of a rail follows the `bordered` of the navigation (`RD.SUPPORT.SURFACE.165`).
- **A translucent navigation shows only where content passes behind it:** a top bar that stays in view, a panel of navigation, and a navigation drawn raised over the content. The fill stays mostly opaque, with a blur behind it. Where the system of the person asks for less transparency, and where the browser cannot blur, it draws opaque.
- **A panel of entries of the navigation belongs to the navigation** (`RD.SUPPORT.SURFACE.140`). The panel of a group under a top bar and the flyout of a shut rail take the fill and the opacity of the navigation, a line where it is `bordered`, and a shadow where it is `raised`. A menu of actions, such as the menu of the account, does not take the look of the navigation.

## The spacing — 🔮

- **The layout keeps one spacing, `--layout-space`, from the theme's `size`, with no setting of its own** (`RD.SUPPORT.SURFACE.200`). It is 16 px at `XS` and `SM`, 24 at `MD`, 32 at `LG` and `XL`, and 16 on a phone at every size. There is no gutter type and no gutter.
- **`--layout-space` is the page's padding and every gap of the layout:** the padding inside the content, the gap between a floating navigation and the window and the content, the gap around a floating content, the gap between the dock's column and the page, and the gap above the header under a floating bar.
- **Where two parts both float, the space between them is one `--layout-space`, never two.**
- **A top navigation holds the few entries that fit, on one line, and moves none of them** (`RD.SUPPORT.SURFACE.173`). `DSNavBarTop` keeps every label to one line, and its start node, its list and its end node never shrink. An app with many sections takes `RAIL` or `DOCK`. Below `md` the entries stand in the drawer.
- **The layout's measures are named in the scale**: the rail open (one value for each size step: 224, 240, 256, 288 and 320 px, `XS` to `XL`, by the rail's `size`), shut and in the drawer, the room above and below the brand in the head of the rail (the padding one step below the rail's `size`, `XS` keeping its own: 8, 8, 12, 16 and 20 px), the height of a bar (`layout-bar`, 48, 56, 56, 64 and 72 px by the layout's `size`), the width of the dock's column (`layout-dock-column`, 224, 240, 256, 288 and 320 px by the dock's `size`), the widest body at `XWIDE`, `WIDE`, `MEDIUM` and `NARROW` (`layout-xwide`, `layout-shell`, `layout-medium`, `layout-narrow`), and `layout-space`. No layout holds one as a number (`RD.SUPPORT.APPS.152`).

## The places — 🔮

| Place | Where it stands | Taken by |
| --- | --- | --- |
| `nav` | the navigation, given as data | `RAIL` · `DOCK` · `TOPNAV` |
| `startNode` | the start of the navigation: the head of a rail, the start of a top bar | `RAIL` · `DOCK` · `TOPNAV` |
| `actionsNode` | the actions of the frame: the foot of a rail above `endNode`, and before `endNode` in a top bar | `RAIL` · `DOCK` · `TOPNAV` |
| `endNode` | the end of the navigation: the foot of a rail, the end of a top bar | `RAIL` · `DOCK` · `TOPNAV` |
| `headerNode` | the header, directly under the bar, for a hero, a slideshow, or the head of an account or a project. What it holds stands in the body's box, as the footer's does, and the content's box starts under it | `DOCK` · `TOPNAV` |
| `footerNode` | the footer that closes the page, the place at its end | every type |
| the children | the content | every type |

A place has a short form for where its room is short: `startNodeCollapsed`, `actionsNodeCollapsed` and `endNodeCollapsed`.

- **A place MUST be named by where it stands, and never by what it holds** (`RD.SUPPORT.SURFACE.157`). A brand, an account or a search is what a page puts in a place.
- **The places of the navigation sit in the config of a layout type that has a navigation, and the `mtype` of the config decides them.** So `CANVAS` refuses a place of the navigation by its type. Every type with a navigation takes the same places, so a page moves between them with nothing in its content changing.
- **The footer is an optional place that closes the page, and every layout type places it the same way, at the end of the page, as the top bar is at its start.** It runs the window's width, and beside a rail the width of the area beside it; what it holds stands in the body's box, with the same layout space as the header and the bar, so it lines up with the bar's items and the page. It stands under the content's box, so its own fill or line runs the full width. Where the content is short it stands at the window's bottom, where long after the content. The layout draws no fill or line for it and pads it by the layout space above and below. At `FULL` the box is the window less the layout space; on a phone, the screen's width.

## Built from the navigation — 🔮

| Layout type | Its navigation is built from |
| --- | --- |
| `RAIL` | `DSNavBarSide` at the edge, which folds to icons, with `startNode` in its head, the entries scrolling, and `actionsNode` above `endNode` in its foot |
| `DOCK` | a top bar with `startNode` at its start, and `actionsNode` then `endNode` at its end. Under it, the header `headerNode`, then the content's box, which holds `DSNavBarSide` inline in the page, with the way back as its start, beside the content |
| `TOPNAV` | `DSNavBarTop`, with `startNode` at its start, and `actionsNode` then `endNode` at its end. Under it, the header `headerNode`, then the content's box |
| `CANVAS` | nothing: the body, with the page's children and `footerNode` |

- **A layout MUST build its navigation from the navigation units** (`architecture-components.md`, `RD.SUPPORT.SURFACE.157`).
- **A rail has a fixed head, entries that scroll, and a fixed foot, and no strip over the content.** The page draws its own head, trail, title and actions in its first block.
- **The column of a dock is a rounded panel beside the page, as tall as its entries, with its top edge on the same line as the page's first block** (`RD.SUPPORT.SURFACE.157`, `RD.SUPPORT.SURFACE.199`). With the content attached, the column stands inside the box at its left, on the content's fill, wearing the navigation's whole look, its fill, line and shadow. With the content floating, the column stands on the body beside the sheet wearing the navigation's whole look. The header is above both.
- **The header MUST stand directly under the bar, and what it holds MUST stand in the body's box, as the footer's does** (`RD.SUPPORT.SURFACE.258`). It belongs to `TOPNAV` and `DOCK`, and a rail and a canvas take none. The place runs the window's width and scrolls with the page; it is not sticky. Under a floating bar it starts one `--layout-space` below it. The layout draws no fill, line or padding for it. A hero that needs the whole window is a section placed in it, with `flush` or `mediaNode`: the section's fill reaches the window's edges and its words stay in the box, so a section behaves the same in the header, the page and the footer.
- **The bar of a dock is drawn only when it holds `startNode`, `actionsNode` or `endNode`;** on a phone a bar is still drawn. A top nav always draws its bar.

## The bar's width and the navigation's size — 🔮

A website's bar often stands wider than its page, and a dense app wants smaller entries than a site does. Both are props of the layout's config, not looks of the theme. The navigation look is shared by `RAIL`, `DOCK` and `TOPNAV`, so a field only one of them reads does not belong in it, and an app on `TOPNAV` that sets neither keeps the bar it has.

- **`TOPNAV` and `DOCK` MUST take the width of the bar's items as `barWidth` in their config, and the theme MUST hold none** (`RD.SUPPORT.SURFACE.257`). `barWidth` takes `DSLayoutWidthType`. Left out, or narrower than the body's width, it is the body's width, so the bar's items and the page stand in one box. Wider, the bar's items stand in the wider box and the page keeps the body's: a bar at `FULL` over a page at `WIDE`. A floating bar stands on the edges of the bar's box.
- **`RAIL`, `DOCK` and `TOPNAV` MUST take the size of the navigation's entries as `size` in their config, of every step `XS` to `XL`** (`RD.SUPPORT.SURFACE.257`). Left out, it is the size of the scope above, the theme's where nothing sets one. The layout hands it to its bar, and the bar to its list. A top nav's `size` sets its entries and the bar's height, a dock's sets its column's entries, the column's width and the height of its bar, and a rail's sets its entries and the open rail's width. `architecture-components.md` states the values of each step.

## The place a section reaches — 🔮

A section reaches the edges of its place and no further (`RD.SUPPORT.SURFACE.254`). The layout says which element that place is, so a section asks nothing about the layout it stands in.

| Layout type | A section in the page reaches | A section in the header or the footer reaches |
| --- | --- | --- |
| `TOPNAV` | the window; the content, where the content draws a frame of its own (bordered, raised or floating) | the window |
| `CANVAS` | the window | the window, in the footer |
| `RAIL` | the content part, and never under the rail | the area beside the rail, in the footer |
| `DOCK` | the content part, and never under the column | the window |

- **Each layout MUST mark one element for each place a section can stand in as a size container, and the marked element MUST carry no padding at its sides** (`RD.SUPPORT.SURFACE.255`). The marked element is the window's root in `TOPNAV` and `CANVAS` (in `TOPNAV` the content, where the content is bordered, raised or floating), the header and the footer in every layout that has them, and the content part in `RAIL` and `DOCK`. On the web it takes `container-type: inline-size`, so `100cqw` inside it is the width of the place.
- **No size container MUST stand between a place and a section in it.** A section reads the nearest one, so a size container of any other block would become the section's place.
- **A section MUST NOT stand in the nav column, a panel, a card or an overlay.** The nav column is the navigation's, and the others frame what they hold. `architecture-containers.md` states the section.

## The phone and the tablet — 🔮

- **On a phone everything attaches, and `--layout-space` is 16 px.** Each layout draws a bar: the menu at its start, the nodes the page places there, and the account's avatar at its end.
- **One drawer serves all three layouts on a phone, and it replaces the pop-up menu of the top nav and of the dock** (`RD.SUPPORT.SURFACE.200`). It opens from the left, `layout-rail-narrow` wide, over a dimmed page. The dock's drawer starts with the way back, then the column's entries. It closes on a press of an entry that navigates, and a group that only opens stays open. Shut, the foot's actions stand in a column above the person, each with its tooltip, and past three the rest are behind a "⋯" menu. The bar's start is the menu that opens the drawer, or the way back where the dock has `backTo`.
- **Each node takes a place on a phone, with a default, by `DSLayoutPhonePlaceType`:** `BAR`, `DRAWER` or `BOTH`. The config's `phone` places `startNode` (default `BOTH`), `actionsNode` (default `DRAWER`) and `endNode` (default `BAR`). A node in the bar draws its collapsed form when the page gives one.
- **On a tablet floating applies.** The rail is shut to icons by default, and the top nav puts its entries in the drawer.
- **The bar is at least `layout-bar` high, every tap target at least 44 px, and the bar and the drawer keep clear of the safe areas.** Tabs along the bottom of a phone are not a feature of the layout.

## The entry kinds — 🔮

An entry of the navigation is drawn by the kind its look names, `entry`. Each kind has its own look for the open entry and its own hover. A step is a shade away from the bar's own fill, so on a tinted bar or a brand bar every step moves with the bar.

| Kind | The open entry | The open entry under the pointer | Any other entry under the pointer |
| --- | --- | --- | --- |
| `SOLID` | the brand fill | the brand fill one step deeper | a tint one step off the bar |
| `QUIET` | a tint two steps off the bar | a tint three steps off the bar | a tint one step off the bar |
| `SUBTLE` | a tint one step off the bar | a tint two steps off the bar | no fill, and its text turns full |
| `LINE` | a line in the brand colour, and no fill | its text stays full | no fill, and its text turns full |
| `PLAIN` | stronger text, and no fill | its text stays full | no fill, and its text turns full |

- **An open entry MUST never be mistaken for an entry under the pointer** (`RD.SUPPORT.SURFACE.155`). Under `SUBTLE`, `LINE` and `PLAIN` another entry draws no fill under the pointer, and only its text turns full.
- **Under `LINE` and `PLAIN` an entry MUST keep no inset.** Its icon and its words start where the start of the bar starts.
- **A list or a menu standing alone MUST pad its own fill as a bar does**, so an entry with no fill never stands on the edge of the fill.
- **A group's child MUST line up with the group's words, under every entry kind**, in a list, a rail, a dock and a pop-up.
- **A nested entry of a rail MUST follow the same kinds, one step quieter.**
- **Every pair of a navigation fill and an entry kind MUST keep the text of the open entry at 4.5 to 1, in light and in dark.** A partner cannot choose a pair that hides the navigation.

The web builds these parts in a change not released yet, and the design library has not drawn them.

## How the navigation behaves — 🔮

Each layout type draws its navigation the same way, whatever the type.

- **An item's actions are reachable without hover**, in room of their own in the row, wherever the item is drawn as a row: the open rail, the dock, the flyout of the shut rail, the panel of the top bar, and the menus of a narrow screen.
- **A closed group that holds the current page shows the selected mark, in every layout type.** The top bar marks the selected row of its panel.
- **The flyout of a shut group opens on a press, and hover shows the group's name, as a tooltip.** Hover opens nothing.
- **The narrow dock keeps its back link.** An item does the same thing on every screen.

## Boundary

This ref states what a layout owns, its types and its places, the units it is built from, its three parts, the entry kinds, and how its navigation behaves. It stops at the edge of the content. It does not state what a container is, or how a part of a page is framed inside the content — that is `architecture-containers.md`. It does not state where the theme's choices come from, or how a setting reaches a block from above — that is `architecture-app.md`. The navigation units themselves are `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.146` | a layout owns the navigation and the content, and nothing inside that area |
| `RD.SUPPORT.APPS.160` | the page's fill is the body's colour, and no page sets a fill behind itself |
| `RD.SUPPORT.SURFACE.226` | a navigation's colour stays in the navigation; the body and the content carry their own surface |
| `RD.SUPPORT.APPS.161` | the layout kept a gutter from the content look; superseded by `RD.SUPPORT.SURFACE.200`, which keeps one spacing, `--layout-space`, from the theme's size, with no gutter |
| `RD.SUPPORT.APPS.163` | an item's actions are reachable without hover, in every layout type |
| `RD.SUPPORT.SURFACE.139` | the theme styles a layout by its layout look, with no setting for one layout type |
| `RD.SUPPORT.SURFACE.140` | a panel of entries of the navigation belongs to the navigation, and a menu of actions does not |
| `RD.SUPPORT.SURFACE.155` | the entry kinds, each with its own hover, and that an open entry is never mistaken for one under the pointer |
| `RD.SUPPORT.SURFACE.157` | the layout types with `CANVAS`, the places named by where they stand and held in the config by `mtype`, the layouts built from the navigation units, and that the layouts alone read the theme |
| `RD.SUPPORT.SURFACE.158` | the width and `maxWidth` are the body's, on five steps |
| `RD.SUPPORT.SURFACE.165` | the edge line of a rail follows the navigation's `bordered` |
| `RD.SUPPORT.SURFACE.172` | the bar's items and the page's content stand in one box, the body's, with `--layout-space` as its padding |
| `RD.SUPPORT.SURFACE.173` | a top navigation holds the few entries that fit, on one line, and moves none of them |
| `RD.SUPPORT.SURFACE.199` | each part that draws a fill gives its surface, and the dock's column and header stand by the content |
| `RD.SUPPORT.SURFACE.255` | each layout marks one size container for each place a section stands in, carrying no padding: the window in `TOPNAV` and `CANVAS`, the header and the footer, the content part in `RAIL` and `DOCK` |
| `RD.SUPPORT.SURFACE.257` | `TOPNAV` and `DOCK` take `barWidth`, and `RAIL`, `DOCK` and `TOPNAV` take `size`, in their config, the bar's height, the dock column's and the open rail's width following the step |
| `RD.SUPPORT.SURFACE.258` | `headerNode` stands in the body's box in `TOPNAV` and `DOCK`, as `footerNode` does |
| `RD.SUPPORT.SURFACE.200` | a layout has three parts, the body, the navigation and the content; attached and sticky, the one spacing, no overlay, and one drawer on a phone |
| `RD.SUPPORT.SURFACE.206` | a layout is chosen by the job of the app: an admin app, a profile, a website or a sign-in |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
