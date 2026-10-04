<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/09-architecture-layouts.md",
      "seen": "52af90e7"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/09-architecture-layouts/",
      "seen": "3f3eab29"
    }
  ]
}
-->

# Layouts — How a Page Is Framed

Source of truth: the foundation's Layouts construct (`docs/02-constructs/02-support/03-surface/09-architecture-layouts.md`) and its capability chapters (`docs/04-capabilities/02-support/03-surface/09-architecture-layouts/`). Layouts is the ninth of thirteen Surface constructs.

Read this before you choose a layout for an app, or before you build or draw a layout type on a new stack. A layout owns the navigation and the main area of a page, and nothing inside that area. A page chooses its layout, and no rule restricts where the page places a block in the main area. The layout types are `RAIL`, `DOCK` and `TOPNAV`, and every type places the same named places: the brand, the navigation, the account, the utility actions and the main area. A layout names no routing library.

## Terms

| Term | What it means |
| --- | --- |
| Layout | the block that frames a page: the navigation, and the main area it hands to the page |
| Layout type | `DSLayoutType` — `RAIL` · `DOCK` · `TOPNAV` |

## The types — 🔮

| Layout type | The navigation |
| --- | --- |
| `RAIL` | a sidebar of icons at the side, which a person opens and closes |
| `DOCK` | a navigation that stays open, beside one column of content |
| `TOPNAV` | a bar across the top, with the content centered below it |

Every layout type places the same named places. A layout names no routing library — it moves between pages through the navigation seam, and the app's own router decides which page a route shows. The layout type is not a choice of the theme: every theme works with every layout.

## The main area — 🔮

- **The page's fill is `page/fill`, and the theme sets it.** A theme whose containers are raised draws the page on the sunken surface, so a raised frame shows. Any other theme draws the page on the plain surface. No page and no story sets a fill of its own.
- **The layout gives the main area one inset, `layout/main-inset`, in every layout type.** A page whose content runs from edge to edge gives `flush` on the layout, the same word a part of a container takes. The page writes no inset of its own.
- **The layout's measures are named in the scale**: the width of the rail open, shut and on a narrow screen, the height of a bar, the width of the dock's column, the width of the shell and the inset of the main area. No layout holds one as a number.

## How the navigation behaves — 🔮

Each layout type draws its navigation the same way, whatever the type.

- **An item's actions are reachable without hover**, in room of their own in the row, wherever the item is drawn as a row: the open rail, the dock, the flyout of the shut rail, the panel of the top bar, and the menus of a narrow screen.
- **A closed group that holds the current page shows the selected mark, in every layout type.** The top bar marks the selected row of its panel.
- **The flyout of a shut group opens on a press, and hover shows the group's name, as a tooltip.** Hover opens nothing.
- **The narrow dock keeps its back link.** An item does the same thing on every screen.

## Boundary

This ref states what a layout owns, its three types, and how its navigation behaves. It stops at the edge of the main area. It does not state what a container is, or how a part of a page is framed inside the main area — that is `architecture-containers.md`. It does not state where the theme's choices come from, or how a setting reaches a block from above — that is `architecture-app.md`.

## Binds

| Rule | What it decides |
| --- | --- |
| `RD.SUPPORT.APPS.146` | a layout owns the navigation and the main area, and nothing inside that area |
| `RD.SUPPORT.APPS.160` | the page's fill is the theme's, and no page sets a fill behind itself |
| `RD.SUPPORT.APPS.161` | the layout gives the main area one inset, in every layout type |
| `RD.SUPPORT.APPS.163` | an item's actions are reachable without hover, in every layout type |

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
