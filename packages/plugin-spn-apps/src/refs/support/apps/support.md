<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-apps/02-support.md",
      "seen": "bdbd1609"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/02-support/",
      "seen": "ef7faef6"
    }
  ]
}
-->

# What a support package may share

When you are deciding whether code belongs in a support package, test it against one question: does it carry a business domain? A support package is a capability with no business domain in it, embedded in whatever composes it. What makes a package **support** is domain-free, and nothing else — never who shares it, never how big it is, so do not let scope decide the question for you.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Support package | `SUPPORT_UNIVERSAL` · `SUPPORT_SERVER` · `SUPPORT_WEB` | a capability with no business domain, embedded in whatever composes it |
| Capability group | — | one published folder, named for what it does, that a consumer reaches through an interface rather than through an implementation |
| Provider seam | `SPKindSymbolSeam` | the arrangement that lets the engine behind a capability group change without a consumer noticing |
| Engine | — | one concrete answer behind a capability — a vendor, a product, a mode |
| Selection | `{CODE}_{GROUP}_PROVIDER` | the one configuration value, from a closed vocabulary, that decides which implementation a capability group runs |
| Execution context | `traceId` | what a call carries without being passed — identity, scope, and the one identifier every log, event and span is indexed by |

## Domain-free is the whole definition

Do not let where a package sits decide whether it is support. A support package may belong to the stack, shared by every platform, or to one platform, shared by its own modules — scope is not part of the definition, so a platform-scoped package still owes you every rule below.

| It knows | It never knows |
| --- | --- |
| a capability — caching, queueing, mail, storage, rendering | a business domain, an entity, a workflow |
| the shape of what it is handed | who is calling, or what they are calling about |
| its own configuration namespace | another package's configuration |
| the engines it can front | which engine a given deployment chose |

**Keep the dependency running one way: never let a support package import a module.** If it needs a domain fact, hand that fact in as a parameter, never as an import. The moment you find a support package naming a module, treat it as having stopped being support — it is a platform module sitting in the wrong repository, and you should propose moving it rather than patching around it. In the other direction, never import a vendor SDK into a module, never let a module depend on the service-app framework group from inside the support family, and reach every capability only through its published interface.

## The interior follows what is published

Before you lay out a package's `src/`, decide what it publishes — the shape follows from that:

| Shape | Interior | Why |
| --- | --- | --- |
| **capability groups** | one folder per capability | the package publishes things a consumer **calls** |
| **the layers** (`contract` · `app` · `entry`) | the framework reading of the layer model | the package publishes a surface a consumer **implements against** — the application shell is the case; here `app/` is the very machinery consumers import and extend, not private internals the way a module's `app/` is |
| **the web surface** (`ui/` at the source root) | groups beside it | the interface itself **is** the published surface, not a module's adapter to it |

If you find a group named for no capability — `common/`, `shared/`, `misc/` — treat it as the catch-all every rule below forbids, however it is spelled.

## The provider seam

Lay out a capability group this way:

```text
src/
└── <group>/                      # one capability, named for what it does — never for the engine
    ├── (capability interface)    # what a consumer names — the only thing it may name
    ├── (implementation)          # one per engine, each complete on its own
    ├── <engine>/                 # earned — where one implementation needs more than a file
    ├── (group types)             # the shapes the interface takes and returns
    └── _internal/                # whatever the group needs and nobody else may reach
```

- **Make the capability interface complete.** Put every operation, message shape, and result a consumer needs on the interface and its contract states, so no caller has to reach around it. A consumer should be able to name the interface and nothing past it — never an implementation, never a branch on which one is active, and it should never learn which one it got.
- **Make each implementation complete on its own** — never write a shared base carrying half the behaviour. A partial implementation makes the seam a lie: swapping engines would then swap whatever the base already decided for every implementation.
- **Never leak vendor detail through the seam** — no vendor error shapes, no vendor identifiers in signatures, no vendor configuration objects as parameters. Where a capability is organization-facing (email, SMS, storage), check the platform's system-provider registry too — platform defaults with per-account overrides, credentials held write-only.
- **Make selection an `mtype`-valued configuration from a closed `Type` vocabulary, never a branch in code.** Fail at boot on an unknown selector value, naming the group and the value you did not recognize — never fall back silently to a default engine. Add a vendor additively: one new enum value, one new implementation, one new configuration variant, and leave every consumer unchanged. Load a vendor dependency only when its value is selected, and if it is missing, fail at the point of selection, naming both the dependency and the selector that asked for it.
- **Quarantine vendor code** in the integrations group (organization-facing vendors) or the providers group (infrastructure engines) — never inline it in a module, and never import a vendor SDK from one. Scope vendor credentials to the constructor: construct an implementation with its decrypted credentials and register it; never pass credentials per call, and never read them from storage the implementation does not own.
- **Classify retriability as part of the result**, never as a thrown vendor-shaped error. Classify a provider-rejected outcome (invalid input, a refused request) non-retriable; classify a transport failure, timeout, or upstream server error retriable. Branch callers on the classification, never on vendor-specific error shapes. Extend the shared result base for a typed payload (a provider message id, a stored object handle) — never return an untyped vendor blob.
- **Ship a local implementation for every capability where you can** — an in-memory lock, file-backed email, directory-backed storage — answering the same interface with real classified results, so local development runs one set of implementations and the cloud another against unchanged consumers. Select a local implementation by a caller-side debug flag or local configuration, never by a stored provider type, and never add it as a member of an organization-facing provider catalog.
- **Use the two role names as written.** Name a swappable implementation, chosen by configuration, answering an interface, `Provider`. Name a lifecycle class — construct, wire, boot, dispose — `Manager`, and never swap one by data.

**Earn a seam; do not assume one.** Add it only where a genuine choice sits behind a capability — ask yourself whether two deployments could reasonably want different behaviour here. If yes, give the group a seam from its first implementation, because retrofitting one later means changing every consumer. If no, leave the group plain however large it grows — publish and index a `utils`, `types`, `constants` or `errors` group with no interface and nothing to select. Where you do add a seam, document it on the capability interface's own comment so it is harvested into the package's generated symbol index, and the composition contract travels with the package.

## The six server and universal groups

Check that dependencies point strictly rootward, and never let anything inside the family depend on the service-app framework group:

| Group | Runtime | Carries | Who may depend on it |
| --- | --- | --- | --- |
| **Contract primitives** | universal | CDT scalar types, global contract states (CRUD commands, auth markers, event envelopes, address family, reference vocabularies, result states), each with its generated validator | everything: every group, module, app, and both sides of the wire |
| **Core utilities** | universal | the universal app shape (`config + providers + modules`), the base error machinery, the HTTP client seam, logging interface, pure utilities | every runtime-specific group, every module, every app |
| **Server infrastructure providers** | server | cache, queue, distributed lock, logging, error reporting — each behind its capability interface | the service-app framework; also directly by scripts, workers, CLIs needing infrastructure without the full framework |
| **Service-app framework** | server | boot machinery, app and module manager contracts, the auth provider seam, entry managers (HTTP · queue · CLI), migration machinery, cross-cutting guards, the testing seat | service applications and server modules only — nothing inside the support family depends on it |
| **Vendor integrations** | server, standalone | vendor implementations behind organization-facing capability interfaces (email, SMS, messaging, storage, certificates), the resolving registry, shared result classification | modules that execute against external providers — always through the interface, never as a vendor SDK |
| **Toolchain configuration** | dev-time only | shared build, lint, test, bundling bases keyed by artifact kind, release lifecycle machinery | every project, as a development-time dependency only — never at runtime |

Treat contract primitives as the true root when you check dependencies — it depends on nothing in the family, which is what lets a contract publish alone and a client compile with every other layer absent. Expect vendor integrations to be standalone and droppable: its interfaces and registry carry no family dependency, and each vendor SDK loads only when selected. Expect toolchain configuration to be a leaf by construction — it can never join a build cycle, because nothing it needs exists yet when it runs.

**Read a group as logical, not as a package count.** A stack may split a group across packages, merge several small always-installed-together groups into one, or add a package for a concern this standard names no group for. What you must hold fixed is the set of groups and the dependency direction; how many artifacts carry them is the stack's own registry to check against.

## The two web groups

Remember the browser provisions no infrastructure, so the web support family you are working with ships a frame and a language, not a boot:

| Group | Carries | Who may depend on it |
| --- | --- | --- |
| **Web app framework** | the app shell (`config + providers + modules`) with a required auth provider, boot at page load, the client-side session seam, browser utilities (device detection, typed storage, logging) | the design-system group, every web module, every web application |
| **Design system** | the component library and embeddable widgets, hooks, theme system and tokens, i18n plumbing, permission-gated rendering, the app-level contexts | web modules and web applications — never the framework group beneath it |

Ask one question to place code between them: **does this know how something looks?** The framework knows nothing about appearance — it answers what "the app" is in a browser. The design system knows nothing about the business — let it reach session, person, and policy only through a context the application hands it. Keep the design system standing on the framework, the framework standing on the universal groups, dependencies pointing strictly rootward, no cycles, and no dependency on any module or app.

Let exactly two contexts cross the boundary, one direction each — never let anything cross the other way:

| | App context | Design-system context |
| --- | --- | --- |
| Supplied by | the application | the design system |
| Carries | session, permissions, locale facts, the translate implementation, the unauthenticated policy | theme, device, navigation seam, media resolution, density |

If you find a design system reaching into application state — a store, a router instance, a domain service — treat it as having stopped being portable. If you find an application reaching around the context to style a component, treat it as having stopped inheriting the system.

## Where the design system and accessibility are stated

The web family states its two groups, the `ui/` taxonomy, the web app framework, and one standard that belongs to neither group alone. That standard is client-side authorization: treat permission-gated rendering as presentation only. Hiding a control is courtesy, and the refusal is always the server's. The framework supplies the session seam that rule depends on, so a module never reads or stores a credential itself.

**The depth of the design-system group is not in the web family.** What a person sees and touches is one standard for every kind of surface, and the Surface topic states it. That topic holds the design system and the accessibility baseline, with what only a browser needs beside them. Read the `surface.md` ref in this plugin for theming, formatting, translation, navigation, media, overlays, the capability set, the names of the blocks, and the accessibility rules.

## The `ui/` taxonomy every web consumer inherits

Apply this same taxonomy whether you are filing a support package's own tree or a module's or an application's UI:

| Folder | Holds | Present in |
| --- | --- | --- |
| `components/` | the unit's owned visual components, one per file, composing the design system's components rather than raw browser primitives | every unit |
| `pages/` | route-level screens, one per route, no business logic | units that own routes |
| `hooks/` | reusable stateful logic and service invocation, named `use` + what it does | every unit that has any |
| `utils/` | pure helper functions only | every unit that has any |
| `widgets/` | embeddable composite units, self-contained enough to mount anywhere their props allow | units shipping embeddable composites |
| `containers/` | blocks that frame a part of a page as a header, content and a footer | units that ship containers (the design system) |
| `layouts/` | blocks that frame a page, with its navigation and its main area | units that ship layouts (the design system) |

A layout frames a page, and a container frames a part of one. Give a container its look from the theme and from its own props, never from a style the caller writes, and never put a container inside a container. Let a layout own the navigation and the main area of a page, and nothing inside that area. Never import a router into a layout: it moves between pages through the navigation seam. This taxonomy says where the two live. The `surface.md` ref states the blocks themselves.

Export through exactly one barrel at a package's root; never give a subfolder its own barrel index. If a util in one of these folders turns out domain-free and broadly useful, promote it to core utilities rather than copying it between units.

## What you must never reach for in a support package

1. **A business noun.** No order, no shipment, no user — the moment one appears, every consumer inherits that coupling, and you should treat the package as a platform module sitting in the wrong repository.
2. **A neighbor's surface.** Keep groups subdomain-specific — never grow entry adapters on infrastructure providers, never grow vendor code on the framework, never grow session logic on the design system.
3. **A catch-all name.** Never let `common`, `shared`, or `misc` exist — a symbol with no owner is a use case you have not named yet.
4. **A cycle, or a reach upward.** Point dependencies rootward only — never let anything in the family depend on the service-app framework, and never let a support package depend on any module or app.
5. **A vendor SDK outside its seam.** Never import one directly into a module — put it behind the integrations or providers group alone.
6. **A runtime dependency from the toolchain.** Keep toolchain configuration development-time only.

## Boundary

Use this ref for what makes a package support, what it may depend on, and what it must never reach for. Reach for the shape ref (`shape.md` in this plugin) first when the question is where a file goes — it owns what folders a support package's `src/` interior takes, and what the privacy marker does inside them. Reach for the `surface.md` ref when the question is what a page is built from, what a block is named, or how the design system gives an app its look. Reach for the application lifecycle standard when the question is how a selection value is named, where it is read, and what boot does with it. Reach for the backing-resources standard when the question is what a resource costs once it holds state a mistake can lose.

## Proof

Run `spnutils apps validate` as the gate: it confirms no support package imports a module, no consumer imports an implementation directly, and no top-level group is named for an engine. Run `spnutils apps gen-symbols` as the convergence check: it confirms every published capability group appears in the index under its own name, and that a group holding more than one implementation carries a seam.
