<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/06-service.md",
      "seen": "69c31d3e"
    }
  ]
}
-->
# Service — the canonical service

**Source of truth:** the foundation's `10-providers/ts/06-service.md`. Read this as the restatement; that chapter governs, and it carries the worked code this ref summarizes.

**Every module service takes one shape.** Learn it once and you can read any of them. Generate a new service to this template, and refactor an existing one toward it.

## The contract triple

**Each entity has these parallel files, the same in every module.**

| File | Holds |
| --- | --- |
| `contract/services/I<MOD><X>Service.ts` | the interface the implementation class implements |
| `contract/states/<entity>.ts` | read levels, wrappers, commands, enums, events |
| `contract/validators/<entity>.ts` | the schemas mirroring every state — generated, never hand-edited |

**A state and its validator must not drift.** The schema is what the API enforces and what the generated client sees, so a change to the state alone is invisible at runtime.

**Command in, state out.** Every contract method takes exactly one command and returns a state or a wrapper. Reuse the shared primitives before minting a bespoke command. A tenant command never carries `orgId` or an actor field, because those come from the execution context.

## Polymorphic states

**One question settles whether a state may vary: is there a row behind it?**

| The state is | Polymorphic | Where variance lives |
| --- | --- | --- |
| entity-backed — a state with a matching entity | never | a nested carrier, usually `<X>Config`: an `mtype` base with `extends` variants, persisted to one JSONB column |
| virtual — a flow outcome, a challenge, a declaration, with no row | may be | the state itself |

**A row has exactly one shape, so pushing the variance inward is the only way to keep the table single-shape and still vary.**

**The carrier is named for its role on the host, not always `Config`.** The rule is the placement rather than the word.

**A variant's write-only half rides under `internal`**, typed as a companion. Those fields are persisted, then nulled by the read mapper or dropped wholesale.

**The entity carries a denormalized, indexable `<noun>_type` column written in sync with the carrier's `mtype`**, and a write-path guard rejects a mismatch.

## The interface and the class

**Declare only what a controller or another module calls.** Group by state, one banner per entity, with the details read after its sub-state methods.

**Keep the internal cached-read tier public on the class but out of the contract**, unless a cross-module caller needs it. Keep the mappers private.

**The implementation class is ordered mappers, then cached reads, then contract methods, then writes.** Every private member takes a leading underscore.

**The registry exposes each service twice**, usually as one instance: `services.contract.<x>Service` typed as the interface, and `services.impl.<x>Service` typed as the class. The implementation registry is the sanctioned internal surface. Reaching into another module's implementation for anything not designed as internal surface bypasses gates. **`services.impl` exists only where the module is mounted.** A service that holds a module remotely has `services.contract` and nothing else, so a call into `impl` does not compile there; a module's inner services are reachable in the same process only.

**A service reaches its repositories and its siblings through the module singleton at call time**, never through constructor wiring. That is what makes the pattern cycle-proof.

**A module's runtime manager answers every method the interface names.** A module has a typed interface (`SPModule<MOD>`, extending `SPServiceAppRuntimeModule`, with a member of its own such as an SDK client declared on that type), a runtime manager `<MOD>RuntimeModuleManager` (`initModule`, `getEntities`, `getMigrations`, `getAPIControllers`, `getAPIRemoteServices`, `getQueueListeners`, `getCLIControllers`, `getContractSchemas`, `shutdownModule` — all nine mandatory), and a remote manager `<MOD>RemoteModuleManager` in `remote/`. A module with no CLI commands returns an empty list, stating the absence rather than omitting the key.

### The three managers

`support-server-service-ts` has three manager classes, each in its own file under `src/app/module/`. `SPServiceAppModuleManager<TModule>` is the base boot starts and stops (`initModule`, `shutdownModule`). `SPServiceAppRuntimeModuleManager<TModule>` is for a module mounted in this service, and its abstract methods are the nine above bar `shutdownModule`. `SPServiceAppRemoteModuleManager<TModule>` is for a module that lives in another service: it writes `getRemoteServices` alone, and its `initModule` and `shutdownModule` are written once in the class. It states no code: the module's code is the one its line in the start file gives, and each proxy sends that code. Boot asks the runtime questions only of a runtime manager, and tells the kinds apart by one type guard.

**The runtime manager lists the module's contract services** in `getAPIRemoteServices`, whether or not the service opens a remote listener. Each entry is `{ name, methods, impl }` — the service's name, its interface as data (`I<MOD><Entity>ServiceMethods`, produced) and what implements it — written `satisfies SPAPIRemoteService<I<MOD><Entity>Service>`, so a registration does not compile when the implementation does not fit the interface or the methods object misses or adds a method.

**The remote manager names the module's code and its contract services**, and its base does the rest: `getRemoteServices(): SPModuleRemoteServices<SPModule<MOD>Remote>` returns one methods object for each contract service, and the type refuses a list that misses a service or names one the contract does not have. The base's `initModule` reads where the module lives from `{CODE}_{MODULE}_REMOTE_ENDPOINTS` (a missing, empty or multi-address value is refused at boot by the key's name), builds one HTTP client over `SPHttpClientAxiosAPI`, makes one proxy for each contract service with `prepareRemoteProxy`, and returns the module with `moduleType: SPAppModuleType.REMOTE` and `services.contract` alone.

**The proxy has one function for each method the contract lists**, and no other. Each parses the command with the method's validator, posts `{ module, service, method, command }` to `API_REMOTE_ROUTE_PATH`, and parses the reply with the result's validator; a refusal is turned back into the standard error and thrown. A call that gets no answer fails after `{CODE}_REMOTE_TIMEOUT_MS` (ten seconds unless set), with no second try, as `DOWNSTREAM_ERROR` (`ERROR.STD.504`) naming the module.

**A line of a service's module list pairs a config with a manager**, typed by `SPServiceAppRuntimeBootModule` and `SPServiceAppRemoteBootModule`: `{ config: { code: 'DOC', entry: { api: { basePath: '/doc' } } }, moduleManager: new DOCRuntimeModuleManager() }` for a mounted module, and `{ config: { code: 'IAM' }, moduleManager: new IAMRemoteModuleManager() }` (imported from `…/remote`) for a held one. A caller writes the same line either way (`iamModule.services.contract.principalService…`), and one check of `moduleType` (`SPAppModuleType.RUNTIME` or `REMOTE`) tells the compiler whether `services.impl` exists.

## Controllers stay thin

**A handler holds no logic**: it returns the contract service's method call and nothing else. Authorization, validation, transactions and caching all live below.

**Declare a route with the command-shaped decorator**, giving the method, the path, the command schema and the result schema. The raw escape hatch exists only for a payload a provider posts, which cannot be command-shaped, and is the only place a path parameter appears.

**Command binding follows the verb** — a read binds from the querystring, a write from the body. An array field on a read has two wire forms, so test both.

**A pre-auth route carries no authorization**, so nothing charges the caller for reaching it. Declare rate limiting and a captcha challenge on the route instead, as counts of seconds rather than phrases. The count is kept by `SPFastifyRateLimitCacheStore`, over the service's default cache, so a declared limit is one limit however many pods serve the route, and a count the store could not make lets the call through.

**Declaring a captcha obliges your application's IAM handler to answer `getCaptchaConfig(request)`**, which is required and returns an `SPCaptchaConfig`, never `null`. The server refuses to start when a route asks for a protection the application never wired, so you find out at boot. **The framework counts; a service verifies.** On a challenge the manager throws `throwErrorCaptchaRequired(config)` (`COMMON_CAPTCHA_REQUIRED`, `ERROR.STD.409`); the client resends the command with `captcha` populated; the method that receives it asks the service that owns the captcha to check the solution — for the platform's captcha, `iamModule.services.contract.sessionService.verifyCaptchaInput({ captchaInput: command.captcha })`, which works from any service. The solution's `mtype` chooses the verifier, and a kind the deployment has no verifier for throws `CAPTCHA_INVALID`. The person's address is read from the call's own context and is not a member of the command. A partner's own captcha is chosen in the handler by route, and its own method checks the solution. `SPCaptchaConfig`, `SPCaptchaInput` and `SPCaptchaResult` each carry `mtype` alone, and a module extends all three with its own vendor enum, base plus `mtype`, never a union alias.

## Authentication — the Issuer and the Verifier

A server app is given its sign-in support as one provider, `serviceApp.providers.auth`, typed `ISPAuthProvider`; layers use the interface and never a class. **Only the identity module says whose token this is and whether the session is alive, and every service asks it — MUST.** So there are two roles: the **Issuer** in the service that mounts the identity module, and the **Verifier** in every other service.

| Interface | Methods | Who has it |
| --- | --- | --- |
| `ISPAuthProvider` | `prepareAuthSession`, `authorize`, `prepareAuthPassport`, `prepareAuthUser`, optional `getCaptchaConfig` | every auth provider |
| `ISPAuthSessionIssuer` | `saveAuthSession`, `clearAuthSession` | only a service that signs people in |

**Which class a service builds — MUST:** a service that mounts the identity module, or signs people in, builds `SPAuthProviderIAMIssuer` (it verifies a token and reads the session cache itself, signs tokens and a passport's proof, and checks one); a service that holds the identity module remotely builds `SPAuthProviderIAMVerifier` (its `prepareAuthSession` asks the identity module, one remote call for each request that carries a token, and a request with no token asks nobody); a service with no identity module builds `SPAuthProviderDefault` (no session for any token); a service with an identity system of its own writes its own class. `SPAuthProviderIAM` is the abstract base both share. The Verifier has no method that saves or ends a session and its config has no place for a secret, so a service cannot be set up to sign by mistake; a service that mounts the identity module with any other provider refuses to start; a newly scaffolded service builds `SPAuthProviderDefault`, and the step that adds the identity module writes the Issuer or the Verifier in its place.

**Handlers.** `support-server-service-ts` cannot import the identity module, so each class is given a handler the app writes: `ISPAuthProviderIAMHandler` (`verifyAuthPassport`, which throws when refused; `getCaptchaConfig`), extended by `ISPAuthProviderIAMIssuerHandler` (`resolveAuthUserPrincipal`, `resolveAuthUserIdentity`) and `ISPAuthProviderIAMVerifierHandler` (`verifyAuthToken`). The Issuer's config is `{ jwtSecret, jwtSecretFallback, cachePrefix, cacheTTL, handler }`, the Verifier's `{ handler }`. The identity module's contract offers `verifyAuthToken`, `verifyAuthPassport` (throws `COMMON_UNAUTHENTICATED` when the signature does not hold or the caller is no longer allowed; never answers nothing), `getCaptchaConfig` and `verifyCaptchaInput` on `IIAMSessionService`, and `getSystemAuthUser` on `IIAMPrincipalService`.

**A signed passport** says the identity module confirmed this caller and nobody has changed it since. The proof is `SPIAMAuthPassportProof` (`issuedAt`, `evidenceId`, `sessionId`, `signature`); the passport types are `SPIAMAuthPassport` (base), `SPIAMAuthPassportPrincipal` (a caller acting in an organization) and `SPIAMAuthPassportIdentity` (the person alone), and `SPIAMAuthUserUnsigned` is a caller before its proof is signed.

- **Only the identity module signs a passport and checks the signature — MUST**, with the secret it holds; no key goes to any other service.
- **A proof is signed when a session is made**, at sign-in and when a person switches organization, not on every request; a renewal keeps the session's proof unless the cache entry is gone.
- **A caller rebuilt from a passport keeps that passport's proof**, so a chain of work keeps the proof of the request that started it.
- **A passport has no age limit.** Whether the person is still allowed is decided when the work runs. When the signing secret changes, the old secret stays accepted for as long as work can wait in a queue; an event with no proof is refused.
- **The passport header is base64url JSON** (`formatAPIRemotePassport`, `parseAPIRemotePassport`), encoded and not encrypted.

**The calling service's credential.** A remote call also proves which service is calling, through `serviceApp.providers.remoteCredential`, behind `ISPRemoteCredentialProvider` (`prepareCredential()`, `resolveCaller(credential)`, `close()`). `SPRemoteCredentialProviderKubernetes` (`KUBERNETES`) uses the token the cluster writes to a file in the pod, read ahead and again every minute, checked against the cluster's public keys, issuer, audience and expiry, with a subject of `system:serviceaccount:<namespace>:<app>` in one of the platform's own namespaces. `SPRemoteCredentialProviderLocal` (`LOCAL`) uses a short note naming the service, signed with one fixed local secret. The settings are in `10-configuration.md`.

## Reads

**One terminal cached bulk reader per entity and level, and everything else delegates to it.** The single read, the level reads, the by-code read, search, and both mutation returns all funnel through it.

**Keep `_prepare*` a pure mapper, reached only through the cached readers.** A mapper whose body performs a read is not a mapper. A mapper that reaches into a repository breaks the batching discipline — pass its dependencies in.

**Meta, Info and the state extend; details compose.**

| Level | Built by | Content |
| --- | --- | --- |
| `<X>Meta` | the chain root | a navigable label — id, scope, code or name, active flag |
| `<X>Info` | extends Meta | Meta plus description-class fields |
| `<X>` | extends Info | Info plus timestamps and resolved audit actors |
| `<X>Details` | fields, never `extends` | the state under a named field, with its dependent sub-states beside it |

**Details composes because it aggregates other entities.** Extending the state would make the aggregate a subtype of one member and force every sub-state into that chain. Composition keeps each member independently nullable, independently versioned, and carried at whatever level the page needs.

**Only the full state is universal.** Skip a level an entity genuinely lacks, and never invent one to complete a set.

**The plural is a keyed map and the List is ordered.** Reading it the other way round is the easy mistake, because English suggests the plural is the sequence. Returning a List says the server decided the order and the client must keep it.

| Verb | Command | Bounded by |
| --- | --- | --- |
| `get<X>` · `get<X>By<Parent>` | one id or key | one row |
| `get<X><Level>s` | an id list | the caller's list — returns a map |
| `getAll<X>List` | none | nothing |
| `get<X>List` | none | the caller the auth context names |
| `get<X>ListBy<Scope>` | the scope's id | one parent |
| `search<X>s` | a search command | filter and page |

**`getAll` is unbounded and that is a commitment.** It is correct only for a closed reference set the platform controls, and wrong for anything a tenant can grow. Choose search when in doubt, because a `getAll` that outgrows its assumption fails in production rather than in review.

### `internal` never leaves on a public read

| | Public read | The `*Internal` read |
| --- | --- | --- |
| Returns `internal` | never — masked to null, or the carrying field omitted | yes, unmasked |
| Reachable from a controller | yes | no — server-side callers only |

**The masking is in the read path, not the caller**, so a new controller or a forgotten select cannot leak it. **The unmasked read has a different name**, so the audit question becomes who calls the `*Internal` method, which you can grep for.

**An integration's constructor config holds credentials in plain, for use, and stays flat.** Today the service reads them from the stored entity's `internal` as they were written. Once the seal is built, the stored `internal` is one sealed string, and the service opens it before it builds that config.

## Search

**The repository resolves which rows match and returns ids with a total; the service hydrates them through the cached readers.** Search never duplicates the mapper or the cache.

- **The record order is the repository's id order.** Mapping over the hydrated map's values discards it.
- **Give each entity twin methods**: the state search that powers admin listings, and the Info search that powers pickers and embedded lists.
- **Never cache a search result.** Only the per-id hydration is cached; totals and orderings stay fresh.
- **Give a search command an explicit active filter** with a null meaning all, rather than silently dropping inactive rows.

## Mutations

**A create takes no purge.** It warms the cache on commit, and a rolled-back create would orphan an unreachable key.

**An update or delete purges the exact key.** Where the cache key is not on the command, load the entity first and hand it to a private save or delete method that carries the purge, so the decorator reads the natural key off the entity's own fields. Wildcard-clearing a whole scope prefix from an id-only mutation is a smell.

**Every mutation returns through the fresh read**, never by mapping the saved entity. The client then cache-fills with canonical data, and denormalized and actor fields are correct.

**Null means leave unchanged in a partial update.** Never spread a command into an entity. This makes null unusable as a clear-this-field signal, so a clearable field needs an explicit sentinel or its own command.

**Toggle active rather than deleting.** A hard delete is for a junction or owned-child row and for wholesale set replacement. Match the row's nature: revoking an access grant deactivates and keeps the history, while a plain junction row is deleted.

**Replace a multi-select set wholesale from the command**, not by deltas. Validate every incoming id against the caller's scope before inserting, and dedupe the list.

**Seeded platform rows are created and maintained only by migrations.** The API authors the tenant-scoped tier alone, and a guard rejects a write to any other tier — on every write path, including the active toggle. A seeded row is shared across tenants, so letting one mutate it is a cross-tenant leak.

**One service owns each entity's writes.** Nobody else calls that repository's save, update or delete, so the owning method's purge always fires. A trusted internal writer may write through a dedicated method, and must still purge the affected prefix.

## Authorization

**Authorize at the service method, never at the controller**, so a queue or internal caller passes through the same gate.

**Keep the vocabulary in one frozen per-module table** built from the module's permission enum. A gate has two terms: the permission term, a list of ways in of which one must hold, and the offer term, codes of which one must be enabled for the caller's organization type. Both must hold, and the offer sits on the gate rather than inside one way in.

**A gate names a scope only to pin the platform master**, never to decide what an organization type may reach. A gate never names an application id, because an id is minted per install and would mean something different in every environment.

**Tiers are cumulative, and the cumulativeness is encoded at the gate.** A view gate lists every code in the family, a manage gate lists manage and admin, an admin gate lists admin alone. Forgetting the higher tiers in a view gate silently locks out administrators.

| Method | Gate |
| --- | --- |
| a state search, and a details read | the view tier |
| every by-id, by-code, Meta and Info read, and the Info search | authenticated only |
| a create, update or activate | the manage tier |
| a destructive or configuration-critical operation | the admin tier |

**A pre-auth method carries no gate at all**, not an empty one.

**An authenticated-only read is still scope-filtered in the repository.** The gate proves a caller signed in; the scope predicate prevents a cross-tenant read.

**Pin the scope inside the method, not in the gate.** An administrative gate accepts many scopes, so forgetting to resolve the scope turns manage your own organization into manage any organization.

**The sudo gate requires a recent interactive authentication** on top of authorization, for the most sensitive self-service actions. A system actor can never satisfy it, so never put it on anything a queue or provisioning path must call.

## Transactions, cache and the decorator order

**One transaction per service operation**, with nested calls joining the ambient one. A delegating one-liner omits it.

**The order matters, outermost first**: authorize, then the sudo gate, then the cache decorators, then the transaction. Purges run around the transactional body, and queue publishing must not fire inside the transaction window unless deferred.

**Cache the prepared read model, never the entity**, and cache each read level as its own validated entry. The validator on a cache hit is what makes a shape change deploy-safe: an entry that no longer parses is ignored and rebuilt.

**Keep the key shape uniform**: a namespace, a prefix, the key parameters, then an optional suffix that tiers the levels under one base key. A tenant-scoped entry leads with the caller's organization, so tenants can never share an entry.

**A purge must reproduce the build key exactly.** Any drift silently stops invalidation. Put a purge on the write method or the single save point, never on a read.

**Use one time-to-live constant per module** — short for tenant data, long for migration-seeded master data, which changes only by migration.

## Queues

**Publish after commit.** Never emit a cross-module event for work that may still roll back, and never block the request on a slow broker. A broker failure is logged and dropped, because the transaction is already durable.

**A module never calls another module's service to make it write.** It publishes a request event on a platform queue and the owning module consumes it. The producer gets fire-and-forget; the consumer owns the record.

**Every request event carries a request key, and the consumer looks it up before writing.** That is what makes at-least-once delivery safe. Choose a semantic key for a once-per-fact send and a fresh identifier where each attempt is its own fact. A key that is too broad suppresses a legitimate resend; one that is too narrow double-sends on redelivery.

**Let the listener rehydrate the originating actor** through the auth provider's `prepareAuthUser`, so authorization, context reads and audit stamping behave as they do online. The queue carries the base passport, so either kind of caller travels, a person acting in an organization or a person outside any, and a passport the identity module does not vouch for throws. Use the plain listener for a system topic with no actor.

**A topic is pre-created by a migration.** Publishing or subscribing to an undeclared topic is an error, and the subscriber id is part of the consumption contract — renaming it redelivers the retained backlog to a new group.

**The queue re-enters the module through a deliberately ungated handler** that delegates to the private implementation, because the producer already authorized at request time. Keep it off the API surface, and say in a comment why it is ungated — an unexplained ungated public method reads as a security bug.

**Run gated work with no session under an explicit system actor.** Batch several writes inside one such callback rather than opening a context per call. `runAsOrgSystem` takes a function, and a function cannot cross between services, so a module in a service that holds the identity module remotely asks for the caller with `iamModule.services.contract.principalService.getSystemAuthUser(command)` and runs its work under it locally; that method has no permission gate and no public route, and the remote route's check of the calling service guards it.

## Audit

**An authenticated mutation records audit after the fresh read**, so the recorded target reflects the final state. The caller supplies what happened, the result and the target; who and where come from the contexts.

**Where no usable session exists, use the explicit-actor form** and supply every field. Never fake a context to reach the ordinary one.

**A full-state read model exposes its audit actors as resolved Meta objects, batched and deduped.** Use the system resolver for an actor lookup, because a scope-filtered read would fail on a cross-organization system actor.

**Apply audit Metas only where they earn their keep** — states with a search. A seed, system, self-managed, sub-state or junction row drops them from the state while keeping the columns.

## Guards, errors and masking

**Name every business invariant as a private assert helper**, so a write flow reads as a checklist. A helper throws and never returns a boolean.

**Utilities are static and may not call services.** A common helper that must call a service or read context belongs on the module's base service.

**Declare a module error code once with its category, and throw it through one helper.** The expected-against-unexpected judgement is made once per code, so a call site never picks a raw status. The code rides in the response body for branching and localization, and the error data is a client contract — never an internal field name or a secret.

**A cross-tenant or cross-owner probe gets not-found, never forbidden.** Existence itself is the secret. Reserve forbidden for a permission failure on an entity the caller may know exists.

**Secret material never reaches a read model, and masking is the mapper's job.** There is no column hiding at the ORM level.

- an entity that is never mapped out at all, such as a stored credential
- a polymorphic config whose secrets sit under `internal`, nulled before return
- a display-masking helper for a challenge response

**Put a new secret field under `internal` from the first day**, so the standard masking covers it. A reveal-once secret is returned exactly once at creation in a dedicated state, never by unmasking the stored config.

**A masking mapper that switches on the parent discriminator must gain a branch per nesting level.** A fall-through branch that returns the config untouched will pass a new variant through unmasked.

## Repositories

**A repository owns all ORM access, takes and returns entities, and never calls a service or reads execution context.** It is a thin class over an entity manager that is already transaction-aware, so it never begins or commits a transaction itself.

- **The tenant scope is the first parameter**, and the by-id read filters on it too. An optional scope parameter is the tell of a scoping bug.
- **The bulk get throws on any missing id**, so the single get is a delegating one-liner with no query and no throw of its own. Every bulk get has a paired single get, added even where nothing calls it yet.
- **Search returns ids and a total**, never entities or states. The service hydrates those ids through its cached reader.
- **A nullable single read is the exception** — a dedup or availability lookup — and is a separately named method rather than a weakening of the bulk contract.
- **Always parameter-bind in a where or sort helper**, and put an enum-driven sort through an exhaustive switch.

## The checklist

- One terminal cached bulk reader per entity and level; everything else delegates to it.
- Pure chained mappers, reached only through the cached readers.
- Meta, Info and the state extend; details compose. Only the full state is universal.
- The plural is a map keyed by id; the List is ordered and claims the server chose the sequence.
- A read returning a List is named for it, and there is no bulk verb.
- A public read never returns `internal`; the unmasked read is a separately named method no controller routes.
- An entity-backed state is never polymorphic; variance goes in its nested carrier.
- A mutation returns through the fresh read, never through the saved entity.
- Create takes no purge; update and delete purge the exact key.
- Search: the repository returns ids and a total, the service hydrates in that order.
- Authorize every contract method, and give a pre-auth method no gate at all.
- Decorator order: authorize, sudo, cache, transaction.
- Cross-module writes ride the request queues with key-based idempotency, published on commit.
- Toggle active rather than deleting; null skips in a partial update; a junction set is replaced wholesale.
- Repositories take and return entities, scope first, throwing bulk gets, no service calls.
- Not-found for a cross-tenant probe; forbidden only for a known entity.
