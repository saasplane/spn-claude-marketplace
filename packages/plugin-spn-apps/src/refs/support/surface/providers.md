<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/03-surface/13-providers.md",
      "seen": "ec3066be"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/13-providers/",
      "seen": "54b71953"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/03-surface/13-providers/ts/01-design-system.md",
      "seen": "94d901fc"
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
- A provider **MUST NOT** add a name the book does not give, and **MUST NOT** restate a rule.

## The ts provider — ✅ for the two contexts and tokens, 🔮 for the rest

`@saasplane/support-web-ds-ts` realizes the design system. `DSApp` mounts the roots and owns theme state; components read the contexts through hooks and never through props.

| Book concept | TypeScript |
| --- | --- |
| App context | `IDSAppContextProps` — the `app` handle, `IDSAppContextInfo` (permissions, languages, `SPLanguageCodeType`, `SPCountryCodeType`, `SPCurrencyCodeType`, `SPDateFormatType`, `SPNumberFormatType`, optional `SPTimeFormatType`, timezone), `translate(key, defaultValue, vars)`, and `handleUnauthenticated` |
| Design-system context | `IDSContextProps` — `theme` + `setTheme`, `device`, `navigate`, `transformImageUrl`, `getImagePlaceholderUrl`, `getImageErrorUrl` |
| Theme lifecycle | the app seeds `theme`; `DSApp` holds it; `setTheme` retints or flips mode from any depth |
| Density | `size` is required on the theme. `useDSScopeSize` resolves a component rendered without `size`: the nearest block above that sets one, then the theme's `size` |
| The scope | `DSScope` sets the size or the frame setting for what it holds. A page writes `<DSScope size={…}>` around a region. A part of a container with `flush` wraps what it holds in `DSScope framed`; without `flush` it sets no frame setting. A card, and each overlay that holds blocks, wrap what they hold in `DSScope framed={false}`. An unset `framed` passes the setting on |
| Overlays | `DSOverlayContext.showComponent` plus `useDSOverlayConfirm` — no screen mounts a dialog into the tree |
| Access to it all | one hook per context, returning it whole: `useDSContext` · `useDSAppContext` · `useDSScopeContext` · `useDSOverlayContext`. `useDSAppAuthz` checks a permission; `useDSAppTestData` builds the test attributes; `useDSScopeIsFramed` returns whether the block sits in a `flush` part, with the block's own `bordered` winning. `useServiceExecutor` resolves to what the call returns, or to nothing on failure |

The package has an interior the UI taxonomy deliberately does not reach — the taxonomy binds what a package *exposes*; this is what the system is *made of*: `ui/boot/` (the system's own composition — `DSApp`, the contexts, the roots it mounts); `ui/core/` (the vocabularies every component reads); `ui/components/<group>/` (one folder per capability group); `ui/widgets/` (assembled surfaces mounted whole: the data table and the filter bar); `ui/layouts/` (the app layout); `ui/hooks/` · `ui/utils/` (context accessors and density resolution, pure helpers); `ui/managers/` (cross-cutting runtime helpers); `assets/` (fonts, images, token stylesheets); `_shadcn/` (vendored primitives, never exported, never hand-edited). **`ui/boot/` is the design system booting itself, not the application's boot** — two different acts, one word apart.

The tokens sit in tiers, and a component sees only the roles and the scale: Tier 0 the seed (one brand value); Tier 1 the ramps (generated from the seed; neutral and status ramps fixed); Tier 2 the roles (mode-adaptive surface / foreground / accent tokens) and the scale (fixed by the design system); Tier 3 components (`variant` × `color` → role classes). A component consumes role tokens, never ramps and never the seed — reaching past the role layer is what makes dark mode a second component tree instead of a mode flip. Light and dark are one re-pointing of the role layer, not a parallel stylesheet. A component reads the scale through the size maps, never a number of its own.

`@saasplane/support-web-ds-ts` 2.1.0 builds the container, the context that carries a frame (`DSScope`), the theme's six choices, the inset of the main area, the page's fill, the layout's own measures, and how the navigation behaves.

## No file under `_shadcn/` is edited by hand

The shadcn CLI emits or copies every file under `_shadcn/`, the hooks and helpers included — the rule covers the whole folder, stated in full in `architecture-app.md`. Make the change a component needs in its `DS*` wrapper. Run the CLI again to refresh a file; re-point the tokens to change a look, because an edited primitive loses the edit at the next regeneration.

## Figma is not a provider — 🔮

Figma is where the library is drawn, and it lives in `delivery-library.md`'s capability, in `02-figma/`. What a stack must prove against lives in `delivery-showcase.md`'s capability. A provider is code; the library is a drawing, and the two are never the same folder.

## Boundary

This ref states who realizes Surface, and what every provider owes and refuses. It stops at the edge of that obligation. It does not state which blocks or vocabularies exist — that is every ref before this one. It does not state how the library draws a block — that is `delivery-library.md`. It does not state what a provider's showcase must show — that is `delivery-showcase.md`. For the TypeScript stack's component shape, its naming and its file structure, read `../apps/providers/ts/08-web.md` in this plugin.

## Proof

No check reads a page against these rules yet. A review applies them by reading the page and by running each task.
