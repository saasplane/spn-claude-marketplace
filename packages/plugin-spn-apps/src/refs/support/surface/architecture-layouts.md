<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/09-architecture-layouts.md",
      "seen": "96fdf3e9"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/09-architecture-layouts/",
      "seen": "2768cf3c"
    }
  ]
}
-->

# Layouts — How a Page Is Framed

Source of truth: the foundation's Layouts construct (`docs/02-constructs/02-support/03-surface/09-architecture-layouts.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/09-architecture-layouts/`). Layouts is the ninth of thirteen Surface constructs.

Read this before you choose a layout for an app, or before you build or draw a layout type on a new stack. A layout owns the navigation and the main area of a page, and nothing inside that area. A page chooses its layout, and no rule restricts where the page places a block in the main area. The layout types are `RAIL`, `DOCK`, `TOPNAV` and `CANVAS`, the content alone. A layout builds its navigation from the navigation units, fills places named by where they stand, and alone reads the theme. A layout names no routing library.

## Terms

| Term | What it means |
| --- | --- |
| Layout | the block that frames a page: the navigation, and the main area it hands to the page |
| Layout type | `DSLayoutType` — `RAIL` · `DOCK` · `TOPNAV` · `CANVAS` |
| Shell | the part of a layout that holds the bars of the navigation and the places they hold |
| Place | where a layout puts what a page gives it, named by where it stands: `startNode`, `endNode`, `actionsNode`, `footerNode`, and in a dock `headerNode` |
| Entry kind | `DSNavEntryType` — `SOLID` · `QUIET` · `SUBTLE` · `LINE` · `PLAIN` |

## The types — 🔮

| Layout type | The navigation |
| --- | --- |
| `RAIL` | a sidebar of icons at the side, which a person opens and closes |
| `DOCK` | a navigation that stays open, beside one column of content |
| `TOPNAV` | a bar across the top, with the content centered below it |
| `CANVAS` | none: the content alone, for a marketing page, a sign-in or a page of an error |

A layout names no routing library — it moves between pages through the navigation seam, and the app's own router decides which page a route shows. The layout type is not a choice of the theme: every theme works with every layout.

## The places — 🔮

| Place | Where it stands | Taken by |
| --- | --- | --- |
| `nav` | the navigation, given as data | `RAIL` · `DOCK` · `TOPNAV` |
| `startNode` | the start of the shell: the top of a rail, the start of a top bar | `RAIL` · `DOCK` · `TOPNAV` |
| `endNode` | the end of the shell: the foot of a rail, the end of a top bar | `RAIL` · `DOCK` · `TOPNAV` |
| `actionsNode` | the actions of the frame: the end of the bar over the content of a rail, and before `endNode` in a top bar | `RAIL` · `DOCK` · `TOPNAV` |
| `headerNode` | a band across both columns of a dock, above them, for the head of an account or a project | `DOCK` |
| `footerNode` | the footer that closes the main area | every type |
| the children | the main area | every type |

- **A place MUST be named by where it stands, and never by what it holds** (`RD.SUPPORT.SURFACE.157`). A brand, an account or a search is what a page puts in a place.
- **The places of the shell MUST sit in the config of a layout type that has a shell, and the `mtype` of the config MUST decide them.** So `CANVAS` refuses a place of the shell by its type. Every type with a shell takes the same places, so a page moves between them with nothing in its main area changing.
- **The footer is an optional place that closes the main area, and every layout type places it the same way.** Where the content is short, it stands at the bottom edge of the main area; where the content is long, after the content.

## Built from the navigation — 🔮

| Layout type | Its shell is built from |
| --- | --- |
| `RAIL` | `DSNavBarSide` at the edge, which folds to icons, with `startNode` and `endNode`. `actionsNode` stands at the end of the bar over the content |
| `DOCK` | a top bar with `startNode` at its start, and `actionsNode` then `endNode` at its end. Under it, `headerNode` as a band across both columns, then `DSNavBarSide` inline in the page, with the way back as its start, beside the content |
| `TOPNAV` | `DSNavBarTop`, with `startNode` at its start, and `actionsNode` then `endNode` at its end |
| `CANVAS` | nothing: the main area alone, with `footerNode` |

- **The side column of `DOCK` MUST take the full height of the content beside it, and grow with the page, while its entries stay at the top.** The band of `headerNode` stands above both columns, and the footer of a dock spans both columns.
- **A layout MUST build its navigation from the navigation units** (`architecture-components.md`). On a narrow screen `DOCK` and `TOPNAV` open their navigation in a menu that holds a `DSNavList`.
- **The layouts alone MUST read the theme, and each MUST hand the look down** (`RD.SUPPORT.SURFACE.156`). The shell of the theme goes to the bar as `look`, and the bar hands it to its list.
- **A layout's config MAY give the content a look over the theme's**, field by field, so one page can draw its content on the brand colour while the app keeps its own.

## The main area — 🔮

- **The page's fill is `page/fill`, and the theme sets it.** A theme whose containers are raised draws the page on the sunken surface, so a raised frame shows. Any other theme draws the page on the plain surface. Where the layout look gives the content a colour, that decides the fill of the main area. No page and no story sets a fill of its own.
- **The layout gives the main area its gutter, `layout/main-inset`, always in `RAIL`, `DOCK` and `TOPNAV`, and never in `CANVAS`** (`RD.SUPPORT.APPS.161`). No prop turns it off. A page whose bands run from edge to edge takes `CANVAS`. The page writes no inset of its own.
- **The layout's measures are named in the scale**: the width of the rail open, shut and on a narrow screen, the height of a bar, the width of the dock's column, the width of the shell and the gutter of the main area. No layout holds one as a number.

## The shell and the content — 🔮

A layout has two parts for its look, whatever its type. The shell is the bars of the navigation and the places they hold. The content is the main area. The theme styles the two through its layout look, which `architecture-app.md` states field by field.

| Layout type | Its shell | Its content |
| --- | --- | --- |
| `RAIL` | the side panel | the main area, with the thin bar over it that holds the collapse button and `actionsNode` |
| `DOCK` | the top bar and the column of the navigation | the main area |
| `TOPNAV` | the bar across the top | the main area |
| `CANVAS` | none | the main area, with no gutter |

- **A layout MUST draw its shell and its content by the layout look of the theme, and the theme holds no setting for one layout type** (`RD.SUPPORT.SURFACE.139`). With no layout look, and with a field left out, a layout draws as it did before.
- **The thin bar over the content of `RAIL` MUST belong to the content.** It takes the fill of the content, and it stands inside the sheet where the content is inset.
- **`inset` of the content MUST draw the content as a sheet.** The sheet has the corner radius of the theme. It is set into the shell with a gutter, and the fill of the shell shows around it.
- **A translucent shell MUST show only where content passes behind the shell:** a top bar that stays in view, a panel of navigation, and a shell drawn raised over the content. The fill stays mostly opaque, with a blur behind it. Where the system of the person asks for less transparency, and where the browser cannot blur, the shell draws opaque.
- **A panel of entries of the navigation MUST belong to the shell** (`RD.SUPPORT.SURFACE.140`). The panel of a group under a top bar and the flyout of a shut rail are such panels. Each takes the fill and the opacity of the shell, a line where the shell is `bordered`, and a shadow where it is `raised`.
- **A menu of actions MUST NOT take the look of the shell.** The menu of the account is such a menu, and it keeps the look every menu has.

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
- **A nested entry of a rail MUST follow the same kinds, one step quieter.**
- **Every pair of a shell fill and an entry kind MUST keep the text of the open entry at 4.5 to 1, in light and in dark.** A partner cannot choose a pair that hides the navigation.

The web builds these parts in a change not released yet, and the design library has not drawn them.

## How the navigation behaves — 🔮

Each layout type draws its navigation the same way, whatever the type.

- **An item's actions are reachable without hover**, in room of their own in the row, wherever the item is drawn as a row: the open rail, the dock, the flyout of the shut rail, the panel of the top bar, and the menus of a narrow screen.
- **A closed group that holds the current page shows the selected mark, in every layout type.** The top bar marks the selected row of its panel.
- **The flyout of a shut group opens on a press, and hover shows the group's name, as a tooltip.** Hover opens nothing.
- **The narrow dock keeps its back link.** An item does the same thing on every screen.

## Boundary

This ref states what a layout owns, its types and its places, the units it is built from, its shell and its content, the entry kinds, and how its navigation behaves. It stops at the edge of the main area. It does not state what a container is, or how a part of a page is framed inside the main area — that is `architecture-containers.md`. It does not state where the theme's choices come from, or how a setting reaches a block from above — that is `architecture-app.md`. The navigation units themselves are `architecture-components.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.146` | a layout owns the navigation and the main area, and nothing inside that area |
| `RD.SUPPORT.APPS.160` | the page's fill is the theme's, and no page sets a fill behind itself |
| `RD.SUPPORT.APPS.161` | the layout gives the main area its gutter always in `RAIL`, `DOCK` and `TOPNAV`, and never in `CANVAS`, with no switch |
| `RD.SUPPORT.APPS.163` | an item's actions are reachable without hover, in every layout type |
| `RD.SUPPORT.SURFACE.139` | the theme styles a layout in two parts, the shell and the content, with no setting for one layout type |
| `RD.SUPPORT.SURFACE.140` | a panel of entries of the navigation belongs to the shell, and a menu of actions does not |
| `RD.SUPPORT.SURFACE.155` | the entry kinds, each with its own hover, and that an open entry is never mistaken for one under the pointer |
| `RD.SUPPORT.SURFACE.157` | the layout types with `CANVAS`, the places named by where they stand and held in the config by `mtype`, the layouts built from the navigation units, and that the layouts alone read the theme |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
