<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "6f182673"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/03-ideate.md",
      "seen": "9bcedab1"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/",
      "seen": "30cbb880"
    }
  ]
}
-->
---
name: design
description: Design a page of a SaaS Plane app from the blocks of the design system. Use when the user asks to design, lay out or draw a page, a screen or a flow of pages, in words or in Figma. It picks the layout, decides the containers, chooses the pattern for each task, and then the blocks. It states the page as a tree of named blocks with their props. With the Figma connector it draws that tree from the published libraries. Not for deciding what a feature is - that is the `ideate` skill - and not for writing the code of a screen, which is the `implement` skill.
---

# design — a page, from its layout down to its blocks

**Read `refs/devex/workspace/workstream.md` (spn-devex) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

**Then read `refs/support/surface/standards-core.md`, `architecture-names.md`, `architecture-containers.md`, `architecture-layouts.md` and `architecture-app.md`, in this plugin.** They hold the levels of a page, the names, the container, the layout and the theme. This skill holds the order of the decisions, the patterns, and the form of the result.

Take the scope from the argument: one page, or a flow of pages. A flow is several pages, and each page gets a tree of its own.

**Your output is one tree for each page**: every block by the name the book gives it, with its props. State it in the reply. Write it to a file only where the developer or the running arc names one. You write no code here.

The decisions run in one order. Each level of a page owns one thing, and the level above it decides first.

| | Decision | What it settles |
| --- | --- | --- |
| 1 | the layout | the navigation, and the main area the page gets |
| 2 | the containers | which parts of the page are framed as a header, content and a footer |
| 3 | the pattern for each task | how each thing the person does runs, and what they see in each task state |
| 4 | the blocks | the named block for each part of each pattern, with its props |

## Before the first decision — say what the page is for

- **Name the purpose in one sentence**: the main intent, and the main action. A page has one purpose. If the sentence needs *and*, design two pages.
- **List each task the person does on the page.** Read the tasks from the behavior rows of the owning docs. Where a task has no row, say so: the `ideate` skill writes the row.
- **Name the kind of surface.** It is web today. A rule that names hover or a pointer holds for the web alone.
- **Read what the app holds already**: its theme, and the layout its other pages use.

## 1. Pick the layout

A layout frames the page. It draws the navigation, and it hands the page a main area. It owns nothing inside that area.

| Layout type | The navigation |
| --- | --- |
| `RAIL` | a sidebar of icons at the side, which a person opens and closes |
| `DOCK` | a navigation that stays open, beside one column of content |
| `TOPNAV` | a bar across the top, with the content centered below it |

- **The page chooses its layout, and the theme never does.** Say which type the app's other pages use, and propose it. Where the app has no page yet, show the layout types, and the developer chooses.
- **Fill the named places**: the brand, the navigation, the account, the utility actions and the main area. Every layout type places each of them.
- **Mark the place the person is in.** The navigation shows it with the selected state.
- **Leave the navigation to the layout.** A page that draws its own navigation has taken the layout's job.

## 2. Decide the containers

A container is optional. Use one where a part of the page has a header, content and a footer as one unit. A page with no such part uses none.

| A page | Header | Content | Footer |
| --- | --- | --- | --- |
| A listing | the page title, and actions at the right | a data table | none |
| A form | a title, with actions | the form | actions |
| A dashboard | flat | raised, holding widgets that show numbers | none |

- **Give one container to each part that reads as one unit.** Parts that should sit apart are separate containers, or cards. A container frames a part of a page. A card, `DSCard`, frames one thing.
- **Write the parts in one order**: `DSContainer.Header`, then `DSContainer.Content`, then `DSContainer.Footer`. A container holds one or more content parts, and at most one header and one footer.
- **The page decides what fills a part.** Write `flush` on a part whose content reaches the edge of the frame, such as a table. A part without `flush` insets everything it holds.
- **In a `flush` part, a block that draws a border of its own draws none.** Those blocks are a table, a list, a code block, an accordion and an empty state. Every other block reaches the edge.
- **Never put a container inside a container.** A card, an accordion or a set of tabs goes inside the content.
- **Leave the look to the theme.** The look is `frames`, `raised`, `bordered` and `rounded`. Set one on a container only where that container differs from the app.
- **Write no color, no padding and no margin on a container.** The gap between two blocks comes from the scale.
- **A page may use no container at all.** It may put a widget or a component straight into the main area, or fill the area with one block.

## 3. Choose the pattern for each task

Name each task in one verb. Most tasks are one of the intents below under another name: *search* is Find, *edit* is Enter and *delete* is Act.

| Intent | The person | Blocks that carry it | Task states |
| --- | --- | --- | --- |
| Move | goes to another place, and knows where they are | the layout · `DSNavigationMenu` · `DSTabs` · `DSBreadcrumb` · `DSLink` | working, then done or failed |
| Find | searches, filters, sorts and pages through records | `DSWFilterBar` · `DSWDataTable` · `DSCommandPalette` · `DSPagination` | all six |
| Read | reads records as a table, a list or a grid, or one record in detail | `DSTable` · `DSList` · `DSDataFieldView` · `DSEmpty` · `DSSkeleton` | all six |
| Enter | fills fields, sees the check on each one, and sends the form | `DSForm` and the entry fields | idle, working, then done or failed |
| Choose | picks one or many from a set | `DSSelect` · `DSRadioGroup` · `DSCheckboxGroup` · `DSToggleGroup` and the pickers | idle, then done. All six when the set is loaded |
| Act | runs one main action, an action on many records, or one that destroys something | `DSButton` · `DSDropdownMenu` · `DSAlertDialog` | working, then done or failed |
| Interrupt | meets a task that takes over the page for a moment | `DSDialog` · `DSDrawer` · `DSSheet` | those of the task inside it |
| Disclose | sees more in place, without leaving | `DSAccordion` · `DSCollapsible` · `DSPopover` · `DSTooltip` · `DSHoverCard` | idle, then done. All six when it is loaded |
| Hear back | learns that the surface works, is done, or failed | `DSSpinner` · `DSProgress` · `DSToast` · `DSAlert` | working, done and failed |
| Be refused | meets a block they have no permission for | `DSAuthz`, and the gate props `permissions`, `enablements` and `authzDenied` | denied |

The six task states are idle, working, done, failed, empty and denied.

- **One intent is the main one**, and it carries the main action of the page.
- **Decide what the person sees in each task state**, for every task. A block drawn from data shows all six, each with a picture of its own. An action shows working, and then done or failed.
- **Decide the way back from each failure.** A failed state says what went wrong. A failed send keeps what the person entered. An empty result keeps its filters shown.
- **An action that destroys something asks first**, in `DSAlertDialog`.
- **A toast and an alert take their icon from their hue, and the two draw one picture.** The toast is an alert that appears for a while and leaves, so no caller passes its icon.
- **Put nothing a person needs behind hover alone.** `DSTooltip` and `DSHoverCard` hold an addition, and never the one way to a thing.
- **Never invent a pattern for an intent the table holds.** A task that fits no intent is named in the result, and the page waits. A new intent joins the patterns chapter of the book first.

## 4. Then the blocks

Take each block from the list its pattern names. Write it by its name in the book, with each prop that differs from its default.

- **`variant`, `color` and `size` each mean one thing on every block.** `variant` is the surface treatment, `color` is the hue and `size` is the density step, read smallest to largest, `XS` to `XL`, with `SM` the default a theme sets. Every value comes from the vocabulary of its prop. `CUSTOM` is a value of `color` that means the caller owns the colour: a page sets a colour outside the theme only through it, as `customColor` on a block that takes it.
- **Leave `size` unset**, unless one block must differ. A block takes the size that the container, the widget or the `DSScope` above it passes on, and then the app's.
- **Write only props the book names.** Hover, focus and pressed are shown states. The platform produces them, and the tree never sets them.
- **A block drawn from data is a host and its items.** Write the host, and then one item for each entry you want shown. One item serves every host that takes one data shape — the three menus take one shape and share `DSMenuNode`. A host whose data differs declares its own item.
- **What a block does stays in words**: where an action leads, and which permission gates it. Write it beside the block.
- **A block the design system lacks is never built inside the page.** Name it under *Missing*, with the task that needs it. It is proposed to the design system.

## 5. State the page as a tree

Write one tree for each page. It reads from the top level down: the page, the layout, each container, then each widget or component.

| A line of the tree | Is written as |
| --- | --- |
| The page | its route, its purpose in one sentence, and its main action |
| The layout | `DSLayout`, then its type |
| A block | its name in the book, then each prop as `name=VALUE` |
| A part of a block | the name of the part: `DSContainer.Header`, or a named place of the layout. A part of a container carries `flush` after its name, where the page writes it |
| Content | the text a person reads, in quotes |
| A placement of the page's own | `row`, `column` or `grid`, in lower case. It is no block, and it carries no look |
| A task | at the right of the block that carries it: the intent, and what the block does |

```text
page  /orders · purpose: find an order · main action: New order
└── DSLayout  RAIL
    ├── brand             DSText "Acme"
    ├── navigation        items: "Orders" selected · "Customers" · "Reports"      Move
    ├── account           DSAvatar
    ├── utility actions   DSButton variant=GHOST "Help"
    └── main area
        └── DSContainer
            ├── DSContainer.Header
            │   ├── DSText    typography=TITLE_LG "Orders"
            │   └── DSButton  variant=SOLID color=PRIMARY "New order"             Move · leads to /orders/new
            ├── DSContainer.Content
            │   └── DSWFilterBar                                                  Find
            └── DSContainer.Content  flush
                └── DSWDataTable                                                  Find · Read
```

Under the tree, give one line for each task: what the person sees in each task state, and the way back from a failure. Then name what is missing.

For a flow, write the trees in the order a person meets the pages. Each Move names the page it leads to.

```text
Find · Read   DSWDataTable   idle: the filters, with no search asked yet
                             working: the skeleton of the table
                             done: the orders, one row each
                             empty: nothing matches, and the filters stay shown
                             failed: what went wrong, and the search offered again
                             denied: the page says that the person has no permission
Move          New order      working: shown on the button · failed: the place says that it cannot be shown
Missing       none
```

## 6. Draw it in Figma — only where the window holds the connector

A tree is complete with no drawing. Draw it where the window holds the Figma connector and the developer asks for the drawing. Read `skills/design/steps/draw.md` then, and follow it. It draws the tree from the published libraries, by instances, with the look as theme modes. It then reads the page back by name. Where the window holds no connector, say so, and hand over the tree.

## Close

- **Convene the `ux` lens over the tree**, and over the drawing where one exists. Run it through the `spn-panel` subagent, with the spn-devex plugin's `refs/devex/agent/lenses/ux.md`. The context that designed the page does not review it.
- **Report** the purpose, the tree of each page, the tasks with their task states, and what is missing. For a drawing, add the read-back and each difference from the tree. Then give the findings of the lens.
- **Hand off by name.** The `implement` skill builds the page, in its `ui` step.

## Lenses

Wear the spn-devex plugin's `refs/devex/agent/lenses/ux.md` while you design. The close's review is the same lens convened.

**This file and its step are the standard for anyone reading them.** Their provenance is the foundation book's Surface chapters: standards, interaction, patterns, names, layout and container, and the design library. Those chapters carry the reasoning behind each rule, for a reader who holds the book. Nothing here is deferred to them.
