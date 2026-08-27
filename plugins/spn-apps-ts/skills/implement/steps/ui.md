# Step: ui — `MODULE_WEB` plug-in points and permission gating

Frontend modules are plain packages composed by each app's router — no runtime module registry. Layering: `web-*-ts` app (route table, nav, vite build) → `module-web-<mod>-ts` (pages/components/hooks/URL helpers for ONE module) → the shared FE kernel package (app manager, session, auth gates, shell, nav builder) → the web runtime + design system + **API client**. Where a workspace documents its own frontend architecture, that document governs its app composition; this layering is the rule in every case.

**The component standard** — the wrapper as the public API, the four-step component recipe, the density hook (never a `size` destructure default), naming, and the token tiers a component may consume — is owned by the provider chapter `providers/apps/ts/10-web-patterns.md` and digested into this plugin. Apply the digest; the chapter is provenance, not a file to open, because the book is not delivered to every seat. This step covers where UI code *lives* and how it plugs in, not how a component is written.

> **A client service is not a server service in a browser.** No transaction, no authorization decorator, no cache-build decorator — the server gates every call and owns atomicity. Client-side services belong to the web module's **full form**, which is 🔮 planned and unrealized; today a ui package's data access is hooks over the API client.

## The UI module package (`MODULE_WEB`)

- Layout: `src/entry/ui/{components/<group>, hooks/<group>, pages/<group>, utils/url}` + generated root barrel — the browser is a transport, so the UI is the web module's **entry** (decision RD.APPS.031); `assets/` sits beside `entry/`, never inside. **Named exports only** — no defaults anywhere; the app's `React.lazy` imports do the `{ default: m.Page }` mapping, the one sanctioned place it exists.
- A ui package owns feature UI for its module and **never** owns routes, nav placement, or session handling — apps own composition. URL helpers (`get<Entity>ListPageUrl` / `…DetailPageUrl`) are how modules name their routes once.
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

The surface has exactly two contexts and they point opposite ways (foundation book, `docs/03-capabilities/02-apps/02-support/02-web/04-design-system.md`):

- **App context** — session, permission codes, the reader's locale facts (language, country, timezone, currency, date/number/time formats), the `translate` implementation, and the unauthenticated policy. Supplied by the app; read with the DS app-context hook.
- **DS context** — live theme and its setter, device, `navigate`, image transformation with placeholder/error, and `defaultComponentSize`. Supplied by `DSApp`; read with the DS context hook.

Three rules fall out, all enforced in review:

- **Never format by hand.** Dates, numbers, and currency render through the DS format components/helpers, which are the only thing holding the reader's preferences — an absent optional preference falls back to the vocabulary default, never to the browser locale.
- **Never own routing in a component.** Movement goes through the `navigate` seam; a page hands components destinations, and no component builds a path or imports the router.
- **Never thread context facts as props.** Permissions, locale, and theme are read where they are needed; threading them creates a second copy of something the surface already resolved.

## Reads and writes

- **Reads wrap in the DS service executor**: it returns `T | undefined` (undefined = handled failure); 401 tears down the session (the auth gate renders login — never toast per failed call), anything else toasts. Detail hooks return `{ details, loading, reload }`.
- **Writes** are DS forms calling the API client mutation through the same executor; after a mutation on a detail page call the hook's `reload()` — never patch fetched state by hand.
- **Client vs contract types are never assignable** (the API client re-emits unions and nominal enums). Where a value crosses that boundary, add a **bridge file** — one file per type, `toContract<Type>` / `fromContract<Type>`, the cast exists exactly once, placed in the package that owns the type — never cast at the call site.

## Permission gating — three layers, none of which enforces

1. **Nav filtering** — the nav builder drops leaves the session's permission codes can't see.
2. **DS component gating** — actionable DS components take a `permissions` prop (codes like `IAM_ACCESS_VIEW`) with a denied mode (hide/disable); table row actions carry the same key.
3. **The server enforces** — every route is gated server-side by its authz tier; the client layers only keep dead links out of the UI. Never treat client gating as security.

Auth surfaces: business apps never implement login — the auth gate hands off to the identity hub with the app-site id and waits for the silent session bootstrap before deciding.

## Regenerate

- `spnutils apps gen-barrel -p module-web-<mod>-ts` after adding/removing files.
- If the BE contract changed: regenerate the API client from the running service **before** consuming it.
- Labels: `translate('<scope>.<key>', 'Fallback')` with dotted scope + snake_case leaf (`common.*` flat, mirrors its value; module keys may add one subscope). `spnutils apps gen-labels -p <pkg>` builds the label manifest at build/prerelease (a `dist` artifact — not committed, not a pre-commit step).
- Verify with the FE builds (`pnpm nx build <ui-pkg>` / the web apps).
