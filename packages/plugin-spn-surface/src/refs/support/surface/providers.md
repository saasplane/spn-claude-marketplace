<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-surface/13-providers.md",
      "seen": "b9c139c2"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/13-providers/",
      "seen": "4177c6d3"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/13-providers/ts/01-design-system.md",
      "seen": "462133dd"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/03-standards-patterns/",
      "seen": "dbf273eb"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/07-architecture-widgets/",
      "seen": "06a4c7c3"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-surface/08-architecture-containers/",
      "seen": "b3e5c65c"
    }
  ]
}
-->

# Providers — Who Realizes Surface in Code

Source of truth: the foundation's Providers construct (`docs/02-constructs/02-support/01-surface/13-providers.md`), its capability chapters (`docs/04-capabilities/02-support/01-surface/13-providers/`), and the TypeScript provider's own chapter, `13-providers/ts/01-design-system.md`. Providers is the thirteenth and last of the Surface constructs.

Read this before you ask which stack builds a block, whether Figma counts as one, or how `@saasplane/support-web-ds-ts` realizes the app's two contexts. **The thing to unlearn: the design library is not a provider.** It draws the look; a provider builds code. Figma lives beside this construct, in `delivery-library.md`'s capability, never in this one's.

## Terms

| Term | What it means |
| --- | --- |
| Provider | a stack that realizes Surface in code, and states no rule. The repository's stack claim picks it |

## What every provider delivers — 🔮

A provider holds one design-system package and one showcase, `ts` today and `native` later.

- A provider **MUST** realize every block and vocabulary the constructs name, under the book's own names. A renamed block or prop is a second name nobody else reads by.
- A provider **MUST** build the showcase that `delivery-showcase.md` lists, in its own stack's tool.
- A provider **MUST** say what it does not realize yet. A gap stated in words is a plan; a gap left unstated is a surprise for whoever reaches for it next.
- A provider **MUST NOT** give a core unit a second name, and **MUST NOT** restate a rule. The name of a core unit and a rule belong to the book, once; a provider that invents either has made a second standard nobody else reads.
- A unit's name and props are the standard's; what a stack builds the unit from is the stack's own and private. A stack **MAY** replace a primitive under a unit, and no page that uses the unit changes.
- A provider **MAY** hold units of its own that help build apps, beside the core units (`RULE.SUPPORT.SURFACE.081`). It names them and states them in its own docs, and each one keeps the rules of the book, as `architecture-components.md` states. Its showcase shows them marked as its own. They are no part of what every provider owes.

## The claim that picks a provider — 🔮

**One claim picks a provider: the stack claim of the repository the code stands in, `config.stack` in its `sprepo.json`** (`RULE.SUPPORT.SURFACE.383`). It is the claim that picks a stack's provider for Apps, so one fact answers both. A repository that claims `TS` builds its surface with the `ts` provider. An agent, a check or a command reads a provider's folder, in the book or in a plugin, only where the claim names that provider's stack, and reads no other folder to decide.

**The kind of surface, `WEB` or `NATIVE`, is what a provider builds, and never what picks it.** A native provider joins as the provider of a stack the claim names, with a folder of its own and no second key. No value of the claim names a native stack today, so nothing reads a native folder yet.

## The ts provider — ✅ for the two contexts and tokens, 🔮 for the rest

The package carries these names and shapes from support 5.22.0: `DSFeatureGridSectionContainer` and `IDSGrid`, `DSDataTablePanelContainer`, `DSBoxPartType`, the prop `surface` with `IDSFrameSurface`, and the theme by layer. `architecture-containers.md` and `architecture-app.md` state each.

`@saasplane/support-web-ds-ts` realizes the design system. `DSApp` mounts the roots and owns theme state, the choice and the whole theme; components read the contexts through hooks and never through props.

| Book concept | TypeScript |
| --- | --- |
| App context | `IDSAppContextProps` — the `app` handle, `IDSAppContextInfo` (permissions, languages, `SPLanguageCodeType`, `SPCountryCodeType`, `SPCurrencyCodeType`, `SPDateFormatType`, `SPNumberFormatType`, `SPTimeFormatType`, timezone, each one required), `translate(key, defaultValue, vars)`, and `handleUnauthenticated` |
| Design-system context | `IDSContextProps` — `theme`, the whole theme `IDSTheme` with every value, `themeChoice`, the `DSDeepPartialType<IDSTheme>` the app chose, `setTheme`, `device`, `navigate`, `transformImageUrl`, `getImagePlaceholderUrl`, `getImageErrorUrl`. `DSApp` keeps `device` live: the app passes the first value, and the device then follows the window across a screen class and a turn |
| Theme lifecycle | the app seeds the choice as `theme` in `IDSContextConfigProps`; `DSApp` holds it and lays it over `DS_THEME_DEFAULT`, field by field; `setTheme` takes a new choice from any depth |
| Preferences and formatting | format components and helpers read the context's info, and never the browser locale. The app context holds the date format, the number format and the time format as required facts, and no unit falls back to a format of its own. `DSFormatDateTime` and `DSFormatDate` take `type`, a `DSFormatDateType`, and `AGO` writes how long ago in words |
| Density | `size` is optional on the choice and held on the theme, `SM` by default. `useDSSize` resolves a component rendered without `size`: the nearest box or composite above that sets one, then the theme's `size` |
| The size and the place | `DSSizeContext` holds only the size a box or a composite set below the root, and `useDSSize` returns it, else the theme's. `DSPageLevelContext` holds the level of the box, the part of it a block stands in and `flush`; every box writes it for each part through `DSPageLevel`, and as a header it lays out a title and its actions. A page writes `size` on the box that holds a region |
| Overlays | `DSOverlayContext.showComponent` plus `useDSOverlayConfirm` — no screen mounts a dialog into the tree. `showComponent` hands back the function that removes what it showed, and `useDSOverlayRoute` shows an overlay while the match the app's router gives it holds a value |
| Access to it all | one hook per context, returning it whole: `useDSContext` · `useDSAppContext` · `useDSSize` · `useDSPageLevelContext` · `useDSOverlayContext`. `useDSAppAuthz` checks a permission; `useDSAppTestData` builds the test attributes. `useServiceExecutor` resolves to what the call returns, or to nothing on failure |

The package has an interior the UI taxonomy deliberately does not reach — the taxonomy binds what a package *exposes*; this is what the system is *made of*: `ui/app/` (the App layer: `DSApp`, the context definitions and the roots it mounts, in `boot/`, and the cross-cutting runtime helpers the components share, in `managers/`); `ui/core/` (the vocabularies every component reads); `ui/components/<group>/` (one folder per capability group, composites included); `ui/components/composites/` (the group Composites, with one `interface.ts` for its enums and interfaces: the core composites `DSDataTable`, `DSFilterBar`, `DSComparison` and `DSFeature`, with their private parts in `_data-table/`, `_list-detail/` and `_feature/`, where `_feature/` holds the feature's level map, from the level to its title step, description step, button size and the level of its items; and `DSListDetail`, this stack's own composite, which places a list beside the detail of its chosen row for a page of groups and their items. Its `listWidth` takes `DSListDetailListWidthType`: `WIDE`, the default and 320px, `NARROW`, 256px, and `COMPACT`, 224px. The unit has no stacked form: below a desktop it shows one of the two sides at a time); `ui/containers/` (`DSPanelContainer`, with its private parts in `_panel-container/`, `DSDataTablePanelContainer`, built on it and taking the panel's props as `panel`, `DSSectionContainer`, the section of a page, and `DSFeatureGridSectionContainer`, a section that holds a grid of features under a heading and takes `section`, `heading` and `grid`. One internal frame drawer draws the frame of the panel, the card and the feature); `ui/widgets/` (the widgets, units placed beside others: the core widget is the card widget, `DSCardWidget`); `ui/layouts/` (the layout, `DSLayout`); `ui/hooks/` · `ui/utils/` (context accessors and density resolution, pure helpers); `assets/` (fonts, images, token stylesheets); `_shadcn/` (vendored primitives, never exported, never hand-edited). **`ui/app/boot/` is the design system booting itself, not the application's boot** — two different acts, one word apart.

The tokens sit in tiers, and a component sees only the roles and the scale: Tier 0 the seed (one brand value); Tier 1 the ramps (generated from the seed; neutral and status ramps fixed); Tier 2 the roles (mode-adaptive surface / foreground / accent tokens) and the scale (fixed by the design system); Tier 3 components (`variant` × `color` → role classes). A component consumes role tokens, never ramps and never the seed — reaching past the role layer is what makes dark mode a second component tree instead of a mode flip. Light and dark are one re-pointing of the role layer, not a parallel stylesheet. A component reads the scale through the size maps, never a number of its own.

`@saasplane/support-web-ds-ts` 2.1.0 builds the panel container, the contexts that carry the size and the level, the part and `flush` of a place, the theme's choices, the inset of the main area, the page's fill, the layout's own measures, and how the navigation behaves.

`web-surface-ts` is the `ts` provider's showcase, built with Storybook. The outline in `delivery-showcase.md` leaves one measure to the stack, the width under which a page is narrow: in this showcase a page is narrow below 768 px.

### What a page writes for each unit

**A pattern asks a few things of a page, and in the ts design system the page passes each one and the unit does the rest.** `architecture-components.md`, `architecture-widgets.md` and `architecture-containers.md` state the rule or the advice behind each row, and the choice table of each unit in those refs gives the values its cases write; this table says what a page on this stack writes for it, and a row that says *nothing* is a thing the unit already does. Where a pattern's row is advice, a partner's own choice stands, and the page writes that choice instead.

| The pattern asks | What the page writes |
| --- | --- |
| the `LIST` layout on a phone | the page reads the live device, `useDSContext().device`, and lists `LIST` on a phone. `DSDataTable` reads no device type, and follows the layouts its page lists each time it draws |
| a line of the `LIST` layout | the page gives each record as an item line, `DSItem`, with its title, its description and its facts. The table's rows carry no padding of their own and answer the pointer, so the page writes no padding and no hover. In a list the row carries the link, the chosen fill and the arrow, and the item line inside it carries none; `DSItem` takes no `selected` |
| the picture and the end of an item line | the page gives the picture to `media` as data of one kind, `ICON`, `MARK`, `AVATAR`, `AVATAR_GROUP` or `CUSTOM`, with no size (`RULE.SUPPORT.SURFACE.130`). It gives what stands at the end, which is data, a badge, a count or a status and never an action, to `endNode` (`RULE.SUPPORT.SURFACE.131`, `RULE.SUPPORT.SURFACE.178`). The actions of a head are the other blocks of its header, and they take their size and look from the place. `DSItem` takes no `startIcon` and no `actions` |
| the record in view, beside a data table or under it | the page gives the id of that record as `selectedRecordId` in the `data` of the table's config, usually read from the address. The table holds no state for it (`RULE.SUPPORT.SURFACE.125`) |
| a card with a head, drawn from data (a card that shows its own info is a `DSCard`) | the page gives `DSCardWidget` its `header`, its `parts` of the kinds `ITEMS`, `LIST` and `FREE`, and its `footer`. The widget places the head, the rows and the empty words, so the page writes no padding (`RULE.SUPPORT.SURFACE.127`). The small head of a part takes `headerActions`, drawn as the head of a group (`RULE.SUPPORT.SURFACE.181`) |
| subjects compared across the same settings | the page gives `DSComparison` its `subjects` (each with `actions` of its own where it has some, such as an Edit, drawn in its head), its `groups` of rows, each a data field's `config` with a value for each subject or a `CUSTOM` row with a `renderer`, and `differencesOnly`. The composite draws every value through `DSDataFieldView` and marks a value that differs from the most common value of its row, or from the subject `baselineKey` names (`RULE.SUPPORT.SURFACE.181`, `RULE.SUPPORT.SURFACE.184`, `RULE.SUPPORT.SURFACE.193`) |
| a section of a website: one part of a page with a fill of its own | the page uses `DSSectionContainer` and writes no padding, no maximum width and no gutter. The room above and below comes from its `size`, the app's when unset, the sides are the layout's space, `--layout-space`, and the section hands that size to what it holds. A `flush` section draws no room of its own on any side (`RULE.SUPPORT.SURFACE.313`). It holds one child and hands down no level; what stands in it sets its own. It reaches the edges of its place; that a page sets it straight in a place, and not in a panel, a card, an overlay or the nav column, is advice. To paint one section the app gives `className`, which sets `--surface-fill` and nothing else, and `painted` names the mode of that colour where it differs from the page's (`RULE.SUPPORT.SURFACE.243`, `RULE.SUPPORT.SURFACE.247`, `RULE.SUPPORT.SURFACE.254`, `RULE.SUPPORT.SURFACE.192`). The section never frames itself; what stands in it is flat, boxed or raised by what it does for the visitor, and a media by its kind, which is advice (`RULE.SUPPORT.SURFACE.293`) |
| a grid of features under a heading | the page uses `DSFeatureGridSectionContainer` where it writes a section, and gives it `section` (the section's props but its child and `flush`), `heading` (the words, facts and actions of a feature) and `grid` (`IDSGrid`: `desktop`, `tablet` and `mobile` columns, each 1 to 4, and `borderType`), and may take `reveal` (the heading and the cells moving in once as they scroll into view) and, through `section`, `inset`. Each cell is a `DSFeature` that names its own `pageLevel`, `WIDGET` for a thing of its own. The data decides when a section is a grid section, and `site-patterns.md` gives its uses: a set of features that are each a thing of their own under one heading, while a `DSFeature` with items holds its own parts or points under its own heading, with media or without (`RULE.SUPPORT.SURFACE.259`, `RULE.SUPPORT.SURFACE.271`) |
| a time shown as how long ago | the page writes `type` as `AGO` on `DSFormatDate` or `DSFormatDateTime`, and no time format where the app's is meant (`RULE.SUPPORT.SURFACE.122`, `RULE.SUPPORT.SURFACE.123`). A log of what happened shows the date and the time |
| the paging in the footer of the panel | the page puts an element in `DSPanelContainer.Footer` and gives it to the table as `settings.pagination.footerElement` |
| a value changed in its cell | the page puts `edit` on one column of the `TABLE` layout, and on the `LIST` layout. The value is text |
| a way back on the title line | the page gives `DSPanelContainer.Header` the address to go back to, and the header draws the back action before its title, level with the line of the title (`RULE.SUPPORT.SURFACE.108`). No core unit places the two parts of a page of groups and their items (`RULE.SUPPORT.SURFACE.099`). On the web, the stack's own `DSListDetail` places them, and its `listWidth` is the named choice for a narrow part of groups (`RULE.SUPPORT.SURFACE.119`). A page writes no width |
| the head of a page that holds several panels | the head stands above the panels, outside any frame, as an item line at the level `PAGE` with its way back. The page gives the title and the address to go back to, and writes no row, no back button and no padding (`RULE.SUPPORT.SURFACE.120`) |
| tabs in a `flush` part | the page writes no padding for the tabs or for their panel. The tabs place their first tab and their panel by the inset of their place (`RULE.SUPPORT.SURFACE.118`) |
| the head of a page, or of a part of a page | the title of a header is an item line. A panel that is the whole page says so with `fullPage`, and its header is then the page head (`RULE.SUPPORT.SURFACE.179`); any other box gives the level of its kind: `CONTAINER` for a panel or an overlay, `WIDGET` for a card, `GROUP` for the head of a part of a card widget (`RULE.SUPPORT.SURFACE.107`). The item line takes no `size`, and the heading element follows the level (`RULE.SUPPORT.SURFACE.106`). A page that holds several panels writes `DSPageLevel` with the level `PAGE` and the part `HEADER` for its head (`RULE.SUPPORT.SURFACE.178`). The page writes no type step and no heading element |
| the padding around what a card holds | the page writes none. A part of a card pads itself, from the size of the card. The page writes `flush` on a part whose content reaches the edge of the card, such as a list or a picture. A card hands its size to what it holds (`RULE.SUPPORT.SURFACE.114`) |
| where a title starts | the page writes no prop and no padding. The part that holds an item line at the level `PAGE`, `CONTAINER`, `WIDGET` or `GROUP` gives it no padding at its two sides, and in a `flush` part the inset of its place (`RULE.SUPPORT.SURFACE.109`). An item line draws no padding or highlight of its own, and a page writes no `bleed` (`RULE.SUPPORT.SURFACE.175`) |
| a control alone on its line, or an action of a field | the page puts every control a person sets in a `DSForm.Field`, a lone checkbox or switch too, and writes `showBlankLabel={false}` on a field with no label alone on its line in a column. A field's own action, such as *Forgot password?*, goes to `labelEndNode` (`RULE.SUPPORT.SURFACE.169`, `RULE.SUPPORT.SURFACE.171`) |
| a confirmation before an act | `DSConfirmPopover` for an act a person can undo, such as activate, deactivate or remove from a list, and `DSConfirmDialog` for an act that cannot be undone, such as delete. Both stay open while the act runs |
| the actions that close the work of an entry | over the page, in a dialog, a sheet, a drawer or a popover, the page puts them at the end of the footer, the action that leaves first and the main action last. In an entry that is a page of its own it puts them at the start of the footer, the main action first, and gives `DSPanelContainer.Footer` `sticky` so they stay in view on a long form (`RULE.SUPPORT.SURFACE.367`). A value changed in place keeps its two actions beside the box, the one that saves first. The main action is a solid button and the action that leaves is an outline button |
| an empty message of the data table | plain text, which the table draws as `DSEmpty` with the text as its title and a default icon. A page that needs a description or an action there gives its own `DSEmpty` |
| a sheet a person works in while the page stays usable | the page turns `modal` off on `DSSheet`. The sheet then stands beside the page and draws no scrim. On a phone it stays modal |
| a row or a grid of blocks in a part | the page writes it, with its gap from the scale, or uses a unit for it where its stack provides one. The foundation defines no block for it |
| a medium entry on the full screen on a phone | nothing. `DSSheet` takes the full screen on a phone by itself |
| fewer fields in the filter bar at a tablet | nothing. `DSFilterBar` holds fewer by itself, and `moreLimitTablet` sets how many |

### What a unit does not do yet

A unit that does not do a thing yet is a gap of the unit, named under *Missing* and proposed to the design system, never closed by a private copy inside a module. Today the ts design system has two:

| The unit | What it does not do yet |
| --- | --- |
| `DSDataTable` | it changes a value in its cell only where the value is text. A choice, a date or another kind is not changed in a cell |
| a strip of steps | the design system has no unit for one, which A record and its steps draws as plain words |

## No file under `_shadcn/` is edited by hand

The shadcn CLI emits or copies every file under `_shadcn/`, the hooks and helpers included — the rule covers the whole folder, stated in full in `architecture-app.md`. Make the change a component needs in its `DS*` wrapper. Run the CLI again to refresh a file; re-point the tokens to change a look, because an edited primitive loses the edit at the next regeneration.

## Figma is not a provider — 🔮

Figma is where the library is drawn, and it lives in `delivery-library.md`'s capability, in `02-figma/`. What a stack must prove against lives in `delivery-showcase.md`'s capability. A provider is code; the library is a drawing, and the two are never the same folder.

## Boundary

This ref states who realizes Surface, and what every provider owes and refuses. It stops at the edge of that obligation. It does not state which blocks or vocabularies exist — that is every ref before this one. It does not state how the library draws a block — that is `delivery-library.md`. It does not state what a provider's showcase must show — that is `delivery-showcase.md`. The TypeScript stack's component shape, its naming and its file structure are the stack's own, and the stack's build steps state them.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
