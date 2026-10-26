<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-apps/10-providers/ts/08-web.md",
      "seen": "d21a8d91"
    }
  ]
}
-->
# Web — the canonical component, hook and screen

**Source of truth:** the foundation's `10-providers/ts/08-web.md`. Read this as the restatement; that chapter governs.

**One canonical component shape, written so the next one is written the same way.** Read the chapter as the standard rather than as a catalogue: it is not a list of components you may use, it is the shape yours must take.

**The wrapper is the public API.** A generated primitive is never hand-edited and never exported directly — the wrapper around it is what the rest of the application sees, and what absorbs a regeneration.

**No file under `_shadcn/` is edited by hand.** The shadcn CLI emits or copies every file there: the primitives, and the hooks and helpers beside them. The rule covers the whole folder. Make the change a component needs in its `DS*` wrapper. Run the CLI again to refresh a file. Re-point the tokens to change a look, because an edited primitive loses the edit at the next regeneration.

**Three prop names are shared, and each one means one thing.** `variant` is the surface treatment, `color` is the hue, and `size` is the density step. A component takes `variant` and `color` independently, and never folds the two into one prop. The spn-surface plugin's entry ref, `refs/support/surface/README.md`, routes to the three names with their values.

**A name is the book's, and TypeScript adds only its form.** The Surface construct states the name of a component, of a prop and of a closed value. This stack adds the form and nothing else: `DS` + PascalCase for a component, `I` + that name + `Props` for its props, a `Type` suffix for an enum, and `DS_` + UPPER_SNAKE for a constant map. A prop the book renames takes the book's name.

**A hook names its context.** A hook of the design system reads as `useDS` + the context + the value, such as `useDSSize` and `useDSOverlayConfirm`. The spn-surface plugin's entry ref, `refs/support/surface/README.md`, routes to the rule and to the contexts realized — the app context, the design-system context, the size context and the page-level context, the default size and the tokens a component may consume — which this package's own interior realizes.

**Every web app declares the same scripts, and a separate preview script is not among them** — it was the start script under another name and is retired. **The test bundle is a flavour of the build, never a second script.**

**The dev server accepts the host the estate serves it on**, because the name a browser reaches it by comes from the estate's coordinates rather than from localhost.

**A stylesheet's asset paths are relative to the stylesheet**, not to the page that loads it.

**A web app has no asset origin to configure.** It serves its own files from its own hostname, and no asset-base key exists. A component writes a root-relative path, never an origin. The design system's `transformImageUrl` seam is where an app would write another origin for its images, if one were ever needed.

## Routes, overlays and the session a container reads

**The route as data and the overlay with an address are built in the Support stack.** `@saasplane/support-web-ts` holds the first and `@saasplane/support-web-ds-ts` the second, and the sample app of the stack uses both. The Platform's nine web modules declare their routes as `<MOD>_ROUTES`, and its pages show an entry with `useDSOverlayRoute`. **The provider a partner mounts and `usePlatformSession` are built in the Platform's `@saasplane/support-web-ui-ts`.** The callback after a save is built on the Platform's entry containers as a required prop, `onSaved`. No test proves any of these yet. Read the installed package before you use a name: a package you installed may be older than this ref. The rules behind the names are in `../../shape.md` and `../../module/README.md` in this plugin.

**A route as data** lives in `@saasplane/support-web-ts`, in `utils/route.ts`, with no router inside (`RD.SUPPORT.APPS.186`, `RD.SUPPORT.APPS.189`).

| What | TypeScript | State |
| --- | --- | --- |
| A route | `ISPRoute`: `key` and `path`. A path names a value as `:name` and an optional one as `:name?` | decided |
| What a route needs | `permissions?` and `enablements?` on `ISPRoute` (`RD.SUPPORT.APPS.187`) | proposed |
| The routes by key | `prepareRouteMap(routes, paths?)`. `paths` replaces the path of a key, which is how an app moves a module's default path (`RD.SUPPORT.APPS.188`) | proposed |
| The address of a route | `getRouteUrl(route, params?, query?)`. It fills each `:name` and adds the query | decided |
| A missing value | `getRouteUrl` throws where a required value is missing | proposed |
| At or under | `isRouteUrlUnder(url, currentUrl)`. It compares whole parts of the path, and leaves out the query and the part after `#` | decided |
| The entry in view | `getRouteUrlInView(urls, currentUrl)` (`RD.SUPPORT.APPS.191`). That the longest address wins is proposed | decided |

None of these imports a router or reads `window.location`. The app hands them the current address.

**An overlay with an address** is in `@saasplane/support-web-ds-ts`.

| What | TypeScript | State |
| --- | --- | --- |
| Shown through the overlay context | `DSOverlayContext.showComponent(component)`. It hands back the function that removes what it showed (`RD.SUPPORT.APPS.195`) | decided |
| Shown while the address matches | `useDSOverlayRoute(match, renderer, onClose)`. It shows the overlay while `match` is not `null`, removes it when `match` turns to `null`, and calls `onClose` when the person closes it (`RD.SUPPORT.APPS.196`). The match comes from the app's own router | proposed |
| The part after `#` | the app's own `navigate`: an address that begins with `#` goes to the router's reader of that part (`RD.SUPPORT.APPS.197`) | proposed |

**An edit container's callback after a save** is the prop `onSaved?`. It is proposed (`RD.SUPPORT.APPS.184`). The Platform's entry containers take `onSaved` as a required prop, so the page that places one always decides the next move.

**The provider a partner mounts** is the platform's, in `@saasplane/support-web-ui-ts`, because it calls the platform's client. There `AppRoot` mounts it with both design-system contexts beneath it (`RD.SUPPORT.APPS.199`, `RD.SUPPORT.APPS.200`).

| What | TypeScript | State |
| --- | --- | --- |
| The one small provider | `SPPlatformProvider`. The developer uses the name and has not ruled on it | the provider is decided; the name and the package are proposed |
| What a partner passes | `sessionType`, `appSite?` and `onSignInRequired?`. With no `appSite` the provider finds the site by the host | proposed |
| The service's client | not a prop. The app calls `initClient(config)` once at its start | proposed |
| Where it stands | outside `DSApp` | proposed |
| What a container and the app read | `usePlatformSession()`: the signed-in person or `null`, `isAuthenticated` and `authLoading`, with the `permissions`, the `enablements` and `handleUnauthenticated` the app passes to the design system's app context | proposed |

The names of a web module's own units are in `02-naming.md`, beside this file.
