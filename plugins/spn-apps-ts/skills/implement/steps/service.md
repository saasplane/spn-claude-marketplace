# Step: service — the canonical service shape

Use one template for every module service — **this template is the standard**. The method families it fills in are the foundation book's, closed and stack-agnostic (`01-services.md` · `02-repositories.md`, the method-families sections). The TypeScript rendering and the fuller skeleton are the service-patterns and database-patterns chapters of the provider set. Layer rule: `app/services`, `app/repositories`, `app/entities` hold classes only — helpers go to `app/utils/` or `app/support/` (see `02-structure.md`).

## Reads — one terminal reader per (entity, level)

- **`get<X>sByIds` is the single source of truth**: exactly one DB-touching, cache-built bulk reader per (entity, level); public-on-class, not on the contract. It takes raw `ids: string[]`, returns `Record<id, X>`, starts with `if (!ids.length) { return {}; }`, and org-scopes via `this.getContextOrgId()`. Singles delegate to their bulk (`(await this.getWidgetsByIds([id]))[id]`). Everything — single, Info, Meta, by-code, search hydration, create/update returns — funnels through the cached readers.
- **`_prepare*` mappers are pure**, `_`-prefixed, chained up the ladder: Info spreads Meta, and only the full State adds resolved deps like actor Metas. Reach them **only** via the cached readers — never from a create/update/search body, never after `repo.save`. A mapper that reads (repo call or `get…ByIds` in its body) is forbidden. **Pass deps in**, resolved batched in the async `_prepare<X>s`.
- Keep return-type annotations on level mappers — they are the drift guard. Dates `.toISOString()`; DB `active` → contract `isActive`.
- Contract read facades are one-liner adapters over the readers, gated: `search<X>s` (State rows) and `get<X>Details` → `*_VIEW`; every by-id/by-code/Meta/Info read and `search<X>Infos` → `AUTHENTICATED`. Put **no** `@SPAuthorize` at all on a pre-auth method (an empty gate still 401s).
- Code-keyed entities: master data (code IS the key) mirrors the reader tier by code; surrogate-id catalogs resolve `code → id` then hit the cached `getById` — never a second code-keyed cache.
- Bounded catalogs may serve whole from one `AL`-suffixed cache entry; everything org-authored goes through search.

## Search

Repo returns `{ total, entityIds }` (mode-split TOTAL/RECORDS/BOTH, ids-only select); the service hydrates via the cached bulk reader **in `entityIds` order** (never `Object.values`). Twin methods: `search<X>s` (State, `_VIEW`) and `search<X>Infos` (Info, authenticated). No cache decorator on the search result itself. Search commands carry `active: boolean | null` (null = all).

## Mutations

- **Create**: `entity.id = ulid()` (service-assigned, never DB-generated), `orgId` from context, `createdBy`/`updatedBy` from `getContextPrincipalId()` (IAM tables: identity id) — **no purge**; return via `get<X>ById(saved.id)`.
- **Update**: load entity → **null-skip** (`if (command.name !== null) { … }`; never spread the command) → save → **write-then-fresh-read**: return via `get<X>ById` after the purge marked keys dirty.
- **`@SPCachePurge` on writes**: exact keys reproduced from the write command (`[[0,'id']]`), wildcard clears the suffix family. When the cache key isn't on the command (list-keyed caches), route the write through a private `_save<X>`/`_delete<X>` carrying the purge keyed off the **entity**. Wildcard-clearing an org prefix from an id-only mutation is a smell.
- **Active toggle, not delete**: `update<X>Active(SPUpdateActiveCommand)`; hard delete only for junction/owned-child rows. Junction sets are replaced **wholesale** (delete-all-then-insert for plain rows; diff add/deactivate for rows with history); validate every incoming id against the caller's scope (anti-enumeration) and dedupe.
- **Migration-seeded SYSTEM/DEFAULT rows are API-immutable** — service hardcodes `CUSTOM` on create; an `_assertMutable` guard sits on **every** write path including active toggles.
- **Single-writer rule**: one service owns each entity's save/update/delete; cross-module writes go through the owning contract service or a request queue. Trusted internal writers (schedulers, listeners) use dedicated `*Internal` repo methods and must still purge.

## Cross-cutting

- **Decorator order** (top → bottom): `@SPAuthorize` → `@SPRequireReauth` → `@SPCachePurge`/`@SPCacheBuild` → `@Transactional({ connectionName: 'default' })`. Add `@Transactional` to every DB-touching method (delegating one-liners omit it).
- **Authz**: per-module `<MOD>_AUTHZ` table in `app/utils/authz.ts`. A gate is an `SPIAMAuthConfig` with two terms. `appPermissions` are ways in, and any one passes; inside an entry `any`/`all` over codes, `appScope` narrows it. `enablements` sit on the CONFIG — codes the caller's org TYPE must be offered. Both hold. The offer sits beside the ways in, never inside one, so a second way in cannot reach past it (RD.SAAS.033). A gate pins `appScope: PLATFORM` only to guard a platform master, and **never names an app id** — an id is minted per install (RD.SAAS.034). Authenticated-only is `{ appPermissions: [] }`. Cumulative tiers encoded **at the gate** (a `_VIEW` gate lists VIEW+MANAGE+ADMIN — forgetting the higher tiers locks out admins). Put the gate on the **service** method, not the controller. `resolveScopeOrgId(appScope, orgId)` pins non-PLATFORM sessions to their own org **inside** the method. `@SPRequireReauth` only for the most sensitive self-service flows — system actors can never satisfy it.
- **Cache**: key grammar `namespace:prefix:params[:suffix]` (suffixes: MT/IF/DT/AL/BE); tenant-scoped keys lead with `[null,'authUser.orgId']`; cache the prepared read model, never the entity; TTL one module constant (60s tenant data, 3600s master data). A purge must reproduce the build key exactly.
- **Queues**: cross-module writes ride the three request queues (notification / audit / job) via the `request*` helpers. **Publish on commit** (`_publishOnCommit`), never inside the transaction window, and never construct the event base by hand. **RequestKey idempotency**: consumer short-circuits on `getByRequestKey`; semantic keys for once-per-fact sends, `ulid()` when each attempt is its own fact. Queue re-entry is a deliberately **ungated** public `handle*Event` (documented as queue-only, no route). Listeners rehydrate the originating actor from the event's auth passport. `subscriberId` is part of the consumption contract — renaming it replays the backlog.
- **Audit**: every authenticated mutation calls `recordAuditLog` **after** the fresh read (WHAT/RESULT/TARGET only; WHO/WHERE derive from context; `requestKey: ulid()`); no-session paths use the explicit-actor `requestAuditLog` — never fake a context. Full-State read models expose `createdBy`/`updatedBy` as resolved Metas, batched and deduped via the terminal (non-recursing) resolvers.
- **System actors**: gated work with no session runs under `runAsOrgSystem(orgId, fn)` / `runAsPlatformSystem(fn)` — batch sub-writes inside one callback.

## Guards, errors, masking

- Business invariants are named `_assert*` helpers that **throw** (never return booleans); `throw<MOD>Error(code, message, data?)` from the module error registry (category decided once per code); shared helpers (`throwErrorEntityNotFound`, `throwErrorBadInput({ field })`, …) otherwise. Prefer throwing to logging; logging is not handling — re-throw. Never `Promise<void>` returns — return `SPResultBoolean`.
- **Anti-enumeration 404**: cross-tenant/cross-owner probes get EntityNotFound, never Forbidden; 403 only for known-entity permission failures.
- **Secret masking is a mapper responsibility** (no ORM column hiding): secrets live under `internal` in polymorphic configs, nulled by `_mask*` before any read model leaves. That holds in every mapper path including Details. Reveal-once secrets return exactly once at creation in a dedicated state. Never read a secret off a read model — read the stored entity's `internal`.

## Entities

- One class per table in `app/entities/`, decorated for the ORM, `snake_case` column names mapped to `camelCase` fields. Entities are the storage shape and never leave the app layer — a repository returns entities, a service maps them to contract states.
- **Every business entity carries the same tail**: the service-assigned `CHAR(26)` ulid `id`, `org_id` where it is tenant-scoped, `active BOOLEAN` as the soft lifecycle, then `created_at` / `updated_at` / `created_by` / `updated_by`. There is **no `deleted_at`** — deactivating is flipping `active`, and hard delete is reserved for junction and owned-child rows.
- A discriminator is `<noun>_type` as a real column, never a bare `type` and never read out of a JSON document. Keep it in sync with the config's `mtype`, and index the column.
- Purpose-named `jsonb` columns hold structured config. Adding a required field to one means updating every migration literal, the runtime builder and the fixtures in the same change — prefer `| null` and avoid the sweep.

## Repository + schema summary

- Repos: thin `EntityManager` classes; entities in/out (never CDT states); **never call services or read context**; tenant-scope param **first** on every method — the by-id read filters by it too. Bulk `get<E>sByIds` **throws** EntityNotFound on any missing id; the single delegates. `search<E>s` returns `{ total, entityIds }` only. Parameter-bind everything; enum sorts via exhaustive switch. Use nullable reads only for genuinely-optional lookups (`getByRequestKey`).
- Schema: `CHAR(26)` ulid PKs; `snake_case` module-prefixed tables (`iam_org`). Columns ordered id → org_id → entity refs/parents (grandparent before parent) → business → jsonb → lifecycle → audit tail; `org_id` leads every index. `active BOOLEAN` — **no `deleted_at`**, no soft-delete columns; discriminator `<noun>_type` column kept in sync with `config.mtype` (index the column, never the JSON); prefer NOT NULL; no views/stored functions.
- Migrations: pure and self-contained (inline env via `getEnv*`, never raw `process.env`; only seed-ID constant imports). `version` = epoch-ms, and must exceed everything it depends on. **DDL and seed data in separate migrations** — seeds in FK order, higher versions, and each `down` deletes only its own rows. Add a required field to a jsonb-persisted type by updating every migration literal + runtime builder + fixture **in the same change**, then verify on a clean reset (prefer `| null`).
