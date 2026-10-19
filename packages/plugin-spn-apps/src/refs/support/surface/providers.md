<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/13-providers.md",
      "seen": "b8028def"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/13-providers/",
      "seen": "e5884193"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/13-providers/ts/01-design-system.md",
      "seen": "66afd7b5"
    }
  ]
}
-->

# Providers — Who Realizes Surface in Code

Source of truth: the foundation's Providers construct (`docs/02-constructs/02-support/03-surface/13-providers.md`), its capability chapters (`docs/04-capabilities/02-support/03-surface/13-providers/`), and the TypeScript provider's own chapter, `13-providers/ts/01-design-system.md`. Providers is the thirteenth and last of the Surface constructs.

Read this before you ask which stack builds a block, whether Figma counts as one, or how `@saasplane/support-web-ds-ts` realizes the app's two contexts. **The thing to unlearn: the design library is not a provider.** It draws the look; a provider builds code. Figma lives beside this construct, in `delivery-library.md`'s capability, never in this one's.

## Terms

| Term | What it means |
| --- | --- |
| Provider | a stack that realizes Surface in code, and states no rule |

## What every provider delivers — 🔮

A provider holds one design-system package and one showcase, `ts` today and `native` later.

- A provider **MUST** realize every block and vocabulary the constructs name, under the book's own names. A renamed block or prop is a second name nobody else reads by.
- A provider **MUST** build the showcase that `delivery-showcase.md` lists, in its own stack's tool.
- A provider **MUST** say what it does not realize yet. A gap stated in words is a plan; a gap left unstated is a surprise for whoever reaches for it next.
- A provider **MUST NOT** give a core unit a second name, and **MUST NOT** restate a rule. The name of a core unit and a rule belong to the book, once; a provider that invents either has made a second standard nobody else reads.
- A provider **MAY** hold units of its own that help build apps, beside the core units (`RD.SUPPORT.SURFACE.081`). It names them and states them in its own docs, and each one keeps the rules of the book, as `architecture-components.md` states. Its showcase shows them marked as its own. They are no part of what every provider owes.

## The ts provider — ✅ for the two contexts and tokens, 🔮 for the rest

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

The package has an interior the UI taxonomy deliberately does not reach — the taxonomy binds what a package *exposes*; this is what the system is *made of*: `ui/app/` (the App layer: `DSApp`, the context definitions and the roots it mounts, in `boot/`, and the cross-cutting runtime helpers the components share, in `managers/`); `ui/core/` (the vocabularies every component reads); `ui/components/<group>/` (one folder per capability group, composites included); `ui/components/composites/` (the group Composites, with one `interface.ts` for its enums and interfaces: the core composites `DSDataTable`, `DSFilterBar`, `DSComparison` and `DSFeature`, with their private parts in `_data-table/`, `_list-detail/` and `_feature/`, where `_feature/` holds the feature's level map, from the level to its title step, description step, button size and the level of its points; and `DSListDetail`, this stack's own composite, which places a list beside the detail of its chosen row for a page of groups and their items. Its `listWidth` takes `DSListDetailListWidthType`: `WIDE`, the default and 320px, `NARROW`, 256px, and `COMPACT`, 224px. The unit has no stacked form: below a desktop it shows one of the two sides at a time); `ui/containers/` (`DSPanelContainer`, with its private parts in `_panel-container/`, `DSDataTableContainer`, built on it, and `DSSectionContainer`, the band of a page); `ui/widgets/` (the widgets, units placed beside others: the core widget is the card widget, `DSCardWidget`); `ui/layouts/` (the layout, `DSLayout`); `ui/hooks/` · `ui/utils/` (context accessors and density resolution, pure helpers); `assets/` (fonts, images, token stylesheets); `_shadcn/` (vendored primitives, never exported, never hand-edited). **`ui/app/boot/` is the design system booting itself, not the application's boot** — two different acts, one word apart.

The tokens sit in tiers, and a component sees only the roles and the scale: Tier 0 the seed (one brand value); Tier 1 the ramps (generated from the seed; neutral and status ramps fixed); Tier 2 the roles (mode-adaptive surface / foreground / accent tokens) and the scale (fixed by the design system); Tier 3 components (`variant` × `color` → role classes). A component consumes role tokens, never ramps and never the seed — reaching past the role layer is what makes dark mode a second component tree instead of a mode flip. Light and dark are one re-pointing of the role layer, not a parallel stylesheet. A component reads the scale through the size maps, never a number of its own.

`@saasplane/support-web-ds-ts` 2.1.0 builds the panel container, the contexts that carry the size and the level, the part and `flush` of a place, the theme's choices, the inset of the main area, the page's fill, the layout's own measures, and how the navigation behaves.

`web-ds-showcase-ts` is the `ts` provider's showcase, built with Storybook. The outline in `delivery-showcase.md` leaves one measure to the stack, the width under which a page is narrow: in this showcase a page is narrow below 768 px.

## No file under `_shadcn/` is edited by hand

The shadcn CLI emits or copies every file under `_shadcn/`, the hooks and helpers included — the rule covers the whole folder, stated in full in `architecture-app.md`. Make the change a component needs in its `DS*` wrapper. Run the CLI again to refresh a file; re-point the tokens to change a look, because an edited primitive loses the edit at the next regeneration.

## Figma is not a provider — 🔮

Figma is where the library is drawn, and it lives in `delivery-library.md`'s capability, in `02-figma/`. What a stack must prove against lives in `delivery-showcase.md`'s capability. A provider is code; the library is a drawing, and the two are never the same folder.

## Boundary

This ref states who realizes Surface, and what every provider owes and refuses. It stops at the edge of that obligation. It does not state which blocks or vocabularies exist — that is every ref before this one. It does not state how the library draws a block — that is `delivery-library.md`. It does not state what a provider's showcase must show — that is `delivery-showcase.md`. For the TypeScript stack's component shape, its naming and its file structure, read `../apps/providers/ts/08-web.md` in this plugin.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
