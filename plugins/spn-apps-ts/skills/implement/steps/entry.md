# Step: entry — thin adapters, one grammar

Entries parse transport input into a Command, execute the contract service method, render the State. **Zero business logic** — an entry that cannot be rewritten for a new transport without touching a service is a defect. Follow the route grammar below as the standard; its provenance is the foundation book's information-architecture chapter. Controllers and queue listeners are **classes**, thin and delegating — never free functions.

## Controllers

- Write one controller per entity (`entry/api/controllers/<MOD><Entity>Controller.ts`), one method per exposed service method, **same name**, every handler a one-liner: `return <mod>Module.services.contract.<x>Service.<method>(command);`. Controllers reach services through the module singleton's **contract** registry — never by importing the impl class. Auth, validation, transactions, caching all live below.
- Routes declare themselves via the command-shaped route decorator (method, path, commandSchema, resultSchema). The raw-route escape hatch exists **only** for payloads that cannot be command-shaped (provider-posted SSO assertions, webhook callbacks). Raw routes bypass command validation, must do their own verification, and are the only place path parameters may appear.

## Route grammar (mechanical — no debates per endpoint)

```
/{module}/{entity}[/{sub-entity}][/{suffix}]     module-prefixed, singular kebab-case nouns
```

- **GET is every read** (command query-encoded, plus a cache-busting `timestamp`); **POST is every write AND every search** (command = JSON body). No PUT/PATCH/DELETE. No `:id` path params — every input travels in the command. No `/api/v{n}` prefix — versioning is a contract concern.
- Never plural nouns: cardinality is `/all` (whole collection in scope), `/bulk` (by ids), or a list inside the command.
- Create is `POST /<mod>/<x>` (the base path, never `/create`). Mutations: `/<x>/update`, `/<x>/active` (soft toggle), `/<x>/delete` (hard). Junction sets: `/<x>/<rel>` assign, `/<x>/<rel>/delete` remove.
- Read levels share the entity path with a suffix: `/<x>` · `/<x>/bulk` · `/<x>/meta[/bulk]` · `/<x>/info[/bulk]` · `/<x>/all` · `/<x>/details` · `POST /<x>/search` · `POST /<x>/info/search`. Key lookups: `/<x>/by-code`, `/by-token`, `/by-host`; bulk `/<x>/bulk/by-codes`.
- Authz altitude on the surface: details + State search → `<MOD>_<FAMILY>_VIEW`; create/update/active/junctions → `_MANAGE`; hard delete → `_ADMIN`; other reads authenticated. **Generate only what the entity needs** — a method joins the surface when a frontend or another service uses it.

## GET/POST binding

Command binding follows the verb: **GET binds from the querystring, POST from the body.** An array field on a GET command has two wire forms — always test both `?ids=a` and `?ids=a&ids=b`.

## Queue listeners

- `entry/queue/listeners/<MOD><Event>Listener.ts`, handler `handle<Event>`, delegating to the service's queue handler — no logic in the listener.
- Actor-carrying events rehydrate the originating actor via the authenticated listener base, so authz, context, and `created_by` stamping behave like the online request. System topics use the plain listener base and establish their own context.
- Register in `getQueueListeners` with a stable `subscriberId` (consumer-group name) — renaming it re-delivers the retained backlog. Topics are pre-created by `*-queue-topics` migrations; an undeclared topic is a boot/write-time error.

## After wiring

If routes or contract changed and a frontend consumes them, regenerate the API client from the **running** service before the ui step. Run `pnpm --filter <app> gen:client` with the service up — a stopped or stale service silently produces a stale API client.
