<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/09-architecture-layouts.md",
      "seen": "cdd898cb"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/09-architecture-layouts/",
      "seen": "7a390842"
    }
  ]
}
-->

# Layouts — How a Page Is Framed

Source of truth: the foundation's Layouts construct (`docs/02-constructs/02-support/03-surface/09-architecture-layouts.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/09-architecture-layouts/`). Layouts is the ninth of thirteen Surface constructs.

Read this before you choose a layout for an app, or before you build or draw a layout type on a new stack. A layout owns the navigation and the main area of a page, and nothing inside that area. A page chooses its layout, and no rule restricts where the page places a block in the main area. The layout types are `RAIL`, `DOCK` and `TOPNAV`, and every type places the same named places: the brand, the navigation, the account, the utility actions, the main area and an optional footer. A layout names no routing library.

## Terms

| Term | What it means |
| --- | --- |
| Layout | the block that frames a page: the navigation, and the main area it hands to the page |
| Layout type | `DSLayoutType` — `RAIL` · `DOCK` · `TOPNAV` |
| Shell | the part of a layout that holds the brand, the navigation and the account |

## The types — 🔮

| Layout type | The navigation |
| --- | --- |
| `RAIL` | a sidebar of icons at the side, which a person opens and closes |
| `DOCK` | a navigation that stays open, beside one column of content |
| `TOPNAV` | a bar across the top, with the content centered below it |

Every layout type places the same named places: the brand, the navigation, the account, the utility actions, the main area and the footer. **The footer is an optional place that closes the main area, and every layout type places it the same way.** Where the content is short, the footer stands at the bottom edge of the main area. Where the content is long, it stands after the content. An app that gives no footer has none. The layout places the footer and decides nothing about what it holds, as with the other named places.

A layout names no routing library — it moves between pages through the navigation seam, and the app's own router decides which page a route shows. The layout type is not a choice of the theme: every theme works with every layout.

## The main area — 🔮

- **The page's fill is `page/fill`, and the theme sets it.** A theme whose containers are raised draws the page on the sunken surface, so a raised frame shows. Any other theme draws the page on the plain surface. Where the theme's layout look gives `content.surface`, that decides the fill of the main area. No page and no story sets a fill of its own.
- **The layout gives the main area one inset, `layout/main-inset`, in every layout type.** A page whose content runs from edge to edge gives `flush` on the layout, the same word a part of a container takes. The page writes no inset of its own.
- **The layout's measures are named in the scale**: the width of the rail open, shut and on a narrow screen, the height of a bar, the width of the dock's column, the width of the shell and the inset of the main area. No layout holds one as a number.

## The shell and the content — 🔮

A layout has two parts for its look, whatever its type. The shell holds the brand, the navigation and the account. The content is the main area. The theme styles the two through its layout look, which `architecture-app.md` states field by field.

| Layout type | Its shell | Its content |
| --- | --- | --- |
| `RAIL` | the side panel | the main area, with the thin bar over it that holds the collapse button and the utility actions |
| `DOCK` | the top bar and the column of the navigation | the main area |
| `TOPNAV` | the bar across the top | the main area |

- **A layout MUST draw its shell and its content by the layout look of the theme, and the theme holds no setting for one layout type** (`RD.SUPPORT.SURFACE.139`). With no layout look, and with a field left out, a layout draws as it did before.
- **The thin bar over the content of `RAIL` MUST belong to the content.** It takes the surface of the content, and it stands inside the sheet where the content is inset.
- **`content.inset` MUST draw the content as a sheet.** The sheet has the corner radius of the theme. It is set into the shell with a gutter, and the surface of the shell shows around it.
- **A translucent shell MUST show only where content passes behind the shell:** a top bar that stays in view, a panel of navigation, and a shell drawn raised over the content. The fill stays mostly opaque, with a blur behind it. Where the system of the person asks for less transparency, and where the browser cannot blur, the shell draws solid.

An entry of the navigation has three states, drawn from one set of colours in every layout type.

| State of an entry | What it draws |
| --- | --- |
| At rest | the text of the shell that can be read on its surface |
| Under the pointer | a quiet tint of the surface of the shell, and never the brand colour |
| The entry of the open page | what `shell.entry` of the theme says |

| `shell.entry` | The entry of the open page draws |
| --- | --- |
| `SOLID` | the brand fill. On a shell whose surface is `PRIMARY` it draws the reverse, so it does not vanish |
| `SOFT` | a quiet tint, one step stronger than the tint under the pointer |
| `LINE` | a line: under the entry in a top bar, and at the start edge of the entry in a rail or a dock |
| `PLAIN` | stronger text alone |

- **A nested entry of a rail MUST follow the same states, one step quieter.**
- **Every pair of a shell surface and an entry MUST meet WCAG AA for text, in light and in dark.** A partner cannot choose a pair that hides the navigation.
- **A panel of entries of the navigation MUST belong to the shell** (`RD.SUPPORT.SURFACE.140`). The panel of a group under a top bar and the flyout of a shut rail are such panels. Each takes the surface and the material of the shell, a line where the shell is `bordered`, and a shadow where it is `raised`.
- **A menu of actions MUST NOT take the look of the shell.** The menu of the account is such a menu, and it keeps the look every menu has.

The web builds this part, and the design library has not drawn it yet.

## How the navigation behaves — 🔮

Each layout type draws its navigation the same way, whatever the type.

- **An item's actions are reachable without hover**, in room of their own in the row, wherever the item is drawn as a row: the open rail, the dock, the flyout of the shut rail, the panel of the top bar, and the menus of a narrow screen.
- **A closed group that holds the current page shows the selected mark, in every layout type.** The top bar marks the selected row of its panel.
- **The flyout of a shut group opens on a press, and hover shows the group's name, as a tooltip.** Hover opens nothing.
- **The narrow dock keeps its back link.** An item does the same thing on every screen.

## Boundary

This ref states what a layout owns, its three types, its shell and its content, and how its navigation behaves. It stops at the edge of the main area. It does not state what a container is, or how a part of a page is framed inside the main area — that is `architecture-containers.md`. It does not state where the theme's choices come from, or how a setting reaches a block from above — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.146` | a layout owns the navigation and the main area, and nothing inside that area |
| `RD.SUPPORT.APPS.160` | the page's fill is the theme's, and no page sets a fill behind itself |
| `RD.SUPPORT.APPS.161` | the layout gives the main area one inset, in every layout type |
| `RD.SUPPORT.APPS.163` | an item's actions are reachable without hover, in every layout type |
| `RD.SUPPORT.SURFACE.139` | the theme styles a layout in two parts, the shell and the content, with no setting for one layout type |
| `RD.SUPPORT.SURFACE.140` | a panel of entries of the navigation belongs to the shell, and a menu of actions does not |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
