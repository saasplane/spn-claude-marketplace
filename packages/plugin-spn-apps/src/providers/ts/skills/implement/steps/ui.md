# Step: ui — `MODULE_WEB` plug-in points and permission gating

Frontend modules are plain packages composed by each app's router — no runtime module registry. Layering: `web-*-ts` app (route table, nav, vite build) → `module-web-<mod>-ts` (pages/components/hooks/URL helpers for ONE module). That module package sits on the shared FE kernel package — app manager, session, auth gates, shell, nav builder. The kernel sits on the web runtime + design system + **API client**. Where a workspace documents its own frontend architecture, that document governs its app composition; this layering is the rule in every case.

**The component standard** is owned by the provider chapter `docs/04-capabilities/02-support/02-apps/10-providers/ts/08-web.md` and restated in this plugin. It covers the wrapper as the public API, the four-step component recipe, and the density hook (never a `size` destructure default). It also covers naming, and the token tiers a component may consume. Apply the restatement; the chapter is provenance, not a file to open, because the book is not delivered to every seat. This step covers where UI code *lives* and how it plugs in, not how a component is written.

> **A client service is not a server service in a browser.** No transaction, no authorization decorator, no cache-build decorator — the server gates every call and owns atomicity. Client-side services belong to the web module's **full form**, which is 🔮 planned and unrealized; today a ui package's data access is hooks over the API client.

## The UI module package (`MODULE_WEB`)

- Layout: `src/entry/ui/{components/<group>, hooks/<group>, pages/<group>, utils/url}` + generated root barrel — the browser is a transport, so the UI is the web module's **entry** (decision RD.SUPPORT.APPS.031); `assets/` sits beside `entry/`, never inside. **Use named exports only** — no defaults anywhere; the app's `React.lazy` imports do the `{ default: m.Page }` mapping, the one sanctioned place it exists.
- A ui package owns feature UI for its module and **never** owns the router, nav placement, or session handling — apps own composition. URL helpers (`get<Entity>ListPageUrl` / `…DetailPageUrl`) are how modules name their routes once today. 🚧 Not yet realized in the platform's modules: the book states a route as data, a key and a path declared once by the module (RD.SUPPORT.APPS.186), read by the app's router, a link and the menu. `ISPRoute` and `getRouteUrl` are built in `@saasplane/support-web-ts`, and the platform's web modules do not declare their routes with them. Read the installed package first, because a package you installed may be older than this step; `refs/support/apps/providers/ts/08-web.md` has the names.
- **Name every unit for what it is** (RD.SUPPORT.APPS.202): a page ends in `Page`, a container in `Container`, a widget in `Widget`, a dialog in `Dialog`, a form in `Form`. A unit that follows a common pattern carries that pattern's word, such as `Autocomplete` or `Picker`. A hook starts with `use`. Only a plain component needs no suffix. `refs/support/apps/providers/ts/02-naming.md` has the table.
- **Assemble a page from containers** (RD.SUPPORT.APPS.182, RD.SUPPORT.APPS.183). The page reads the address and places containers under `entry/ui/containers/`. A container takes its data or an id as props and holds no path. A SaaS Plane container takes data only (RD.SUPPORT.APPS.185). `refs/support/apps/support.md` has the table of what each knows and takes.
- Data access goes through the module's own hooks calling the **API client** — there is never a hand-written client. `src/generated/` in the client package is untouchable (regenerate from the running service instead).

## Plug-in points — wiring a module into an app (all five, per app)

| Touch point | File | What |
| --- | --- | --- |
| Dependency | app `package.json` | the ui package as `workspace:*` |
| Routes | `src/AppRouter.tsx` | `lazy(() => import('<ui-pkg>').then((m) => ({ default: m.<Page> })))` + Route entries inside the gated workspace area |
| Nav | `src/nav.ts` | nav items using the package's URL helpers; **only leaf items carry permission codes** |
| Build chunking | `vite.config.ts` | a `manualChunks` claim per ui package, plus `server.warmup` / `optimizeDeps.include` kept in step with the lazy imports |
| Tailwind scan | `tailwind.config.js` | the package's `src/**/*.{js,ts,jsx,tsx}` glob in `content` |

App-local modules (a feature owned by one app) live under `apps/<app>/src/modules/<code>/ui/` with the same components/hooks/pages layout, their own chunk claim, and literal route strings in nav.

## The two contexts — read them, never re-derive them

The surface has exactly two contexts and they point opposite ways (the foundation book's Surface app chapter, *The contexts*). Every Surface rule this step meets, the contexts, the levels of a page, the names, the containers, what a page writes for each unit and the choice tables, is reached through one file: `refs/support/surface/README.md`, the entry ref of the spn-surface plugin, by its route 3, *Build a screen*.

**If spn-surface's entry ref is not in the session**, the repository's wiring comes from an older spnutils: update spnutils, run `spnutils repo agent-sync`, and open a new window.

**A page is built from its tree, never from a picture.** Where the partner brings a design of the page or a page to follow, the design skill's given-design mode makes the tree first, and the build follows it, kept lines included.

- **App context** — session, permission codes, the reader's locale facts (language, country, timezone, currency, date/number/time formats), the `translate` implementation, and the unauthenticated policy. Read it with the DS app-context hook; the app supplies it.
- **DS context** — live theme and its setter, device, `navigate`, and image transformation with placeholder/error. Read it with the DS context hook; `DSApp` supplies it.
- **The default size is the theme's `size`.** A component with no `size` takes the size of the nearest block above it that sets one, and then the theme's `size`. 🚧 Not yet realized: the context holds it as `defaultComponentSize` today, so read the installed package first.

Three rules fall out, all enforced in review:

- **Never format by hand.** Dates, numbers, and currency render through the DS format components/helpers, which are the only thing holding the reader's preferences. An absent optional preference falls back to the vocabulary default, never to the browser locale.
- **Never own routing in a component.** Movement goes through the `navigate` seam; a page hands components destinations, and no component builds a path or imports the router.
- **Never thread context facts as props.** Permissions, locale, and theme are read where they are needed; threading them creates a second copy of something the surface already resolved.

## Reads and writes

- **Reads wrap in the DS service executor**: it returns `T | undefined`, where undefined means a handled failure. A 401 tears down the session — the auth gate renders login, never a toast per failed call — and anything else toasts. Detail hooks return `{ details, loading, reload }`.
- **Writes** are DS forms calling the API client mutation through the same executor; after a mutation on a detail page call the hook's `reload()` — never patch fetched state by hand.
- **Client vs contract types are never assignable** (the API client re-emits unions and nominal enums). Add a **bridge file** where a value crosses that boundary — one file per type, `toContract<Type>` / `fromContract<Type>`. The cast exists exactly once, placed in the package that owns the type; never cast at the call site.

## Permission gating — three layers, none of which enforces

1. **Nav filtering** — the nav builder drops leaves the session's permission codes can't see.
2. **DS component gating** — actionable DS components take a `permissions` prop (codes like `IAM_ACCESS_VIEW`) with a denied mode (hide/disable); table row actions carry the same key.
3. **The server enforces** — every route is gated server-side by its authz tier; the client layers only keep dead links out of the UI. Never treat client gating as security.

Auth surfaces: business apps never implement login — the auth gate hands off to the identity hub with the app-site id and waits for the silent session bootstrap before deciding.

## Regenerate

- Run `spnutils apps gen-barrel module-web-<mod>-ts` after adding/removing files.
- If the BE contract changed: regenerate the API client from the running service **before** consuming it.
- Write a module page's label in its stored form, `translate('<SCOPE>.<KEY>', 'Fallback')`, with a dotted scope and a snake_case leaf (`COMMON.*` flat, mirrors its value; module keys may add one subscope); only the design system writes lower case. An enum value's label is `translateEnumLabel(translate, '<ContractEnumName>', value)`, which builds `ENUM.<ENUMNAME>.<VALUE>`; never write an enum key by hand. `spnutils apps gen-labels <pkg>` builds the label manifest at build/prerelease (a `dist` artifact — not committed, not a pre-commit step).
- Verify with the FE builds — `npx nx run-many -t build -p '<ui-pkg>,web-*'`.
