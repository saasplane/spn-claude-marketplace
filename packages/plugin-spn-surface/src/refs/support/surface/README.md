<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/06-architecture-components.md",
      "section": "The choice table",
      "seen": "af5c2473"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/04-plugins.md",
      "section": "Apps into Surface",
      "seen": "91f2b341"
    }
  ]
}
-->

# Surface — Where a Job Starts

The one way into this plugin's Surface refs. Find your job below, and read its route from the top. Every Surface ref sits on exactly one route; a route that needs another route's refs names that route and never lists its files again.

**Every route runs in one order, the design skill's: the person, the flow, the pattern, the panels, the tasks, and only then the blocks.** A page is decided in four steps with a block chosen last (`RULE.SUPPORT.SURFACE.052` · MUST · skill:spn-surface/design), so no job starts from a unit's table. A choice table gives a block its props once the page has placed it, and never decides which block stands where.

**Another plugin points here, and at no other Surface file.** spn-apps' implement, verify and review steps name this file, because every world that loads spn-apps loads this plugin too. This plugin names nothing in spn-apps.

## The routes

| Your job | Start with | Route |
| --- | --- | --- |
| Design a page or a flow | the `design` skill | 1 |
| Bring your own design, or a page to follow | the `design` skill's given-design mode; in plain words, `guide-bring-a-feature.md` | 1 |
| Draw a mock without Figma | the `design` skill's mock step | 2 |
| Build a screen | the page's design tree | 3 |
| Review or verify a page | the page beside its tree | 4 |
| Change the design library | the `design` skill's library step | 5 |
| Your own units, library or theme | the section of the rule you extend | 6 |

## 1. Design a page or a flow

Run the `design` skill. It reads these refs in its own order, and states each page as a tree of named blocks.

| Order | What it settles | Ref |
| --- | --- | --- |
| the person | the kind of person the app is for, what each kind changes, the levels of a page and the rules of content | `standards-core.md` |
| the flow | the flow the page is a step of, its steps and its task states | `flow-patterns.md` |
| the layout | the navigation, and the content the page gets | `architecture-layouts.md` |
| the pattern | the app pattern of a screen, its tree by level and its spec; how a skeleton and a flow file are written | `standards-patterns.md`, with the specs in `app-patterns/` |
| the pattern, on a site | the site pattern of each section, its look and its spec | `site-patterns.md`, with the specs in `site-patterns/` |
| the panels | which parts are framed, a panel's parts, the card and the section | `architecture-containers.md` |
| the tasks | the six parts of a pattern, the task patterns and the six task states | `standards-interaction.md` |
| the blocks: widgets | the card widget and what a widget holds | `architecture-widgets.md` |
| the blocks: units and their props | the choice tables, through `spn-surface unit show <Unit>` | route 3 |

With the Figma connector in the window, the skill draws the tree in Figma (`skills/design/steps/draw.md`).

**Where the partner brings a design of the page, or points at a page to follow**, the skill runs its given-design mode, `skills/design/steps/given-design.md`: it reads what was brought, checks it at each of the steps above, writes the same tree, and shows the rows, the picture of the page and the changes the person would feel before any code. `guide-bring-a-feature.md` says the same to a partner in plain words. It is guidance: the partner's choice stands wherever they keep it.

## 2. Draw a mock without Figma

Run the `design` skill to its tree, then its mock step, `skills/design/steps/mock.md`. The mock is the tree drawn as skeletons: the facts first, one skeleton for each page in the order a person meets them, drawn once with its errors in place and its other states in words, and a flow file that orders the pages. A mock names units and never their props. The skeleton's own rules are in route 1's `standards-patterns.md`, under *The specs a screen starts from*.

## 3. Build a screen

1. **The page's design tree first.** It names the person, the flow, the facts, the pattern and every block by level. A page with no tree runs route 1 through the tree, shown before any code; with a design or a page to follow, in the design skill's given-design mode. A page is built from its tree, never from a picture, and a kept line is built as kept.
2. **Then what a page writes for each unit on its stack**, and what a unit does not do yet: `providers.md`, which also says which provider the repository's stack claim picks.
3. **Then the choice tables**, for every closed prop the page writes. Look a unit up with `spn-surface unit show <Unit>`: one call prints its props, their values and defaults, its usage, its cases with their rules and its index, from the CONSTRUCT snapshot this plugin carries beside these refs. The tables themselves stand in `architecture-components.md`, under each unit or among *the other units*, and in `architecture-widgets.md` for the card widget. A value is the page's, else the place's, else the level's, else the unit's, and the case says which; a unit whose props all follow its place has no table and stands in that ref's list *Their size from the place*. The cases are a guide: they name where each value fits, and a partner's choice stands. **Before any header is written**, read the header's parts in `architecture-containers.md` and the button's *limits across a header*: one main action, the move the record's state expects next, one or two secondaries, the rest behind "⋯".
4. **Then the names and the app's contexts**, where the code meets them: `architecture-names.md` for the names and the vocabularies, and `architecture-app.md` for the two contexts and the theme.

## 4. Review or verify a page

Read the page beside its tree, in the same order: route 1's pattern, its spec at each screen class, its panels and its task states; then route 3's choice tables for each closed prop the page writes. A unit that does not do a thing yet is a gap of the unit, which route 3's `providers.md` lists, and never a finding on the page. Nothing here is a ref of its own: a review reads what the design and the build read.

## 5. Change the design library

Run the `design` skill's library step, `skills/design/steps/change-library.md`, through the Figma connector.

| What it settles | Ref |
| --- | --- |
| the library's files, a unit's set, its Usage and Cases bands, and how the connector changes a library file | `delivery-library.md` |
| what a stack's showcase must show, so the library and the code stay in step | `delivery-showcase.md` |
| the seed, the ramps, the roles and the scale every look is drawn from | `architecture-core.md` |

A unit's usage and its cases come from its choice table in route 3.

## 6. Your own units, library or theme

A partner extends Surface by adding, and never by editing what it installed. Each extension has one section, in a ref another route carries.

| You add | Read | It says |
| --- | --- | --- |
| a unit of your own | `architecture-components.md`, *A new unit weighs every axis the surface offers* | each shared axis your unit takes, with a reason for each it leaves out, shown before the unit is approved. Your unit has no choice table: the descriptions of its props say what each value is for, and a unit made from a core block leaves the rest to that block's table |
| a library of your own | `delivery-library.md`, *The files, by layer* | how your library file is organised, and how it uses ours without editing it |
| a look of your own | `architecture-app.md`, *The theme* | one theme changes the look of an app, and a page writes no style for a block |
| a painted panel | `architecture-containers.md`, *The look* | a class of your own sets a panel's paint tokens and nothing else |
