<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-apps/04-resources.md",
      "seen": "a37be94a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/04-resources/",
      "seen": "7667ae8c"
    }
  ]
}
-->

# The provider seam

Read this before you reach for a database, a cache, a queue, a store or browser storage from code. It tells you what a resource is, the families and the rule that matters most for each, how a provider is selected, and what you may assume about one once you have reached it.

**This is stack-agnostic.** The interface names below (`ISPResourceProvider`, `isReady`, `close`) are the reference stack's rendering. A stack whose idiom differs renders the same shape its own way, and you never drop the guarantee behind it just because the names change.

## What a resource is

When you touch a resource, you are touching the part of the platform where a mistake stops being a bug and becomes a loss — a database holding the only copy of data, a queue holding work accepted but not yet done, a bucket holding a file a customer handed over. Treat a resource as **declared, never discovered**: what a node needs, and at what fidelity, is stated in its estate declaration, so you provision by reading that declaration rather than by remembering, and a missing resource fails at boot rather than at first use.

**Where a permission is decided is not a resource.** That is a rule, and it lives with the access model. What belongs here is something the estate provisions and something a mistake can lose.

## Lifecycle is one shape, every family

Access differs by family and always will — what you may ask of a database, a queue and a store are genuinely different questions. But whether a resource is usable right now, and releasing it, are the same question for every one of them, and you answer it once:

```ts
export interface ISPResourceProvider {
  isReady(): Promise<boolean>;  // usable right now — reachability, never throughput
  close(): Promise<void>;       // release what this holds; safe to reach more than once
}
```

- Ask `isReady()` rather than reading a cached flag. For some families the honest answer needs a live call — a pooled client tracks its own state, an object store speaks stateless HTTP and has nothing to read. If you cache the answer, you only push the call out of band and hand yourself a verdict that is stale exactly when it matters.
- Put a timeout on that call when you implement one, so a wedged resource fails the probe instead of hanging it.
- Make `close()` safe to call more than once.
- **You do not reach secrets through this interface.** A secret is a value a deployment is handed, read once at boot from the estate's configuration store — there is nothing to keep open and nothing to release. It sits inside the same discipline (a mistake with it is a loss) without being a resource provider.
- **The seal is not that secret, and the two are easy to confuse.** A secret is a value your service is handed at start. The seal is a capability your service calls while it runs, to encrypt a secret a customer gave the product before a store receives it. The seal is a resource provider, and it answers this lifecycle like database, cache, queue and storage.

## The families

### Security — the access discipline the other families assume

Read this family first: it is the discipline database, cache, queue, storage and the seal all build on, not itself a resource you reach through `ISPResourceProvider`.

A server process boots with **two mandatory database connections**, and you refuse to start without both:

| Connection | Role | Used by |
| --- | --- | --- |
| `default` | read-write | every serving deployment — all business reads and writes |
| `migration` | migration | the migration deployment mode only |

Behind the connections sits one **role quartet** per scope:

| Role | Owns schema | DDL | DML | SELECT | Held by |
| --- | --- | --- | --- | --- | --- |
| admin (`app_adm`) | yes | yes | yes | yes | provisioning only — never any application process |
| migration (`app_migration`) | — | yes | yes | yes | the migration mode's connection |
| read-write (`app_rw`) | — | no | yes | yes | the serving deployments' `default` connection |
| read-only (`app_ro`) | — | no | no | yes | oversight, analytics, human investigation |

**Never give the runtime role DDL.** If the serving process you are writing is compromised, it can corrupt rows — it cannot drop a table, alter a column, or grant itself anything, because the migration role is the only DDL-capable credential, and it is present only in the deployment shape that migrates. Grant per schema: give every additional schema beyond the default set its own quartet, scoped to that schema alone, and expect future tables to be pre-granted, so you never add a grant step after a migration lands. **Never let secrets resolution widen access** — a connection's credential resolves from configuration scoped to exactly that connection's role, never wider, so escalate only through a provisioning-plane change, never a config read.

Hold secrets at rest to the same zero-tolerance rule everywhere: persist a credential secret (password, delivered one-time code, recovery code, refresh token, device trust) only as a one-way hash — never encrypted, never reversible. Treat a secret that must be stored to be used (an authenticator seed, a bring-your-own provider key) as write-only from the contract's perspective — mask it on every read, and reach it only through a named internal server-side path.

**Store a secret that must be read back sealed — MUST** (`RD.SUPPORT.APPS.166`). Encryption of the disk protects a stolen disk; it does not protect a dump, a replica, or a query by the read-only role, because the database decrypts for each of them. So the service encrypts the whole `internal` sub-object itself, before it saves the row, through the seal family below. No database role can open a sealed value, so `app_ro` reads a sealed string and you can grant it for investigation without granting the secrets. **The seal is designed and not built yet** — today the `internal` sub-object is stored as written.

### Database — the record of truth

The rule that matters most: **one schema per service; reach your own tables and join another's only on a declared key.**

Hold entity shape fixed across every table you write: a sortable, service-assigned 26-character `id` you assign yourself, never database-generated; audit stamps `created_at`/`updated_at`/`created_by`/`updated_by`; lifecycle as an `active` boolean — **never add a soft-delete column**, and reserve hard delete for junction and owned-child rows; put semi-structured data in `{purpose}_json` columns with `camelCase` keys; denormalize a polymorphic document's discriminator to an indexable `{noun}_type` column alongside it; store a value that must never be read back under an `internal` sub-object or in a column with no read mapping. Once the seal is built, a value the service itself must read back is stored sealed, so the column holds one sealed string and never the value.

| Object | Grammar | Sample |
| --- | --- | --- |
| Table | `{module}_{entity}`, snake_case | `ord_order` |
| Column | snake_case | `tracking_code` |
| Foreign key | `{referenced_entity}_id` | `order_id` |
| Enum type | `{module}_{concept}_type` | `ord_shipment_status_type` |
| Index | `idx_{table}_{columns}`; unique `uq_{table}_{columns}` | `idx_ord_shipment_org_order` |

Order a composite index you add with organization scope first, then parent keys in hierarchy order, then business filters, then the sorting timestamp last — match the query's own filter order. Add an index only against a measured, frequent query; never add one against a theoretical query by reflex.

**Make every business row you write resolvable to an organization**, directly through a scope column or through an unbroken parent chain. Carry the scope predicate on every query you write, by-id reads included — never write `WHERE id = :id` alone; write `WHERE id = :id AND org_id = :orgId`, so isolation is enforced in the query rather than remembered in review. Resolve an id outside the caller's scope as not found, never as forbidden.

### Cache — never the only copy

The rule that matters most: **never the only copy — correctness may not depend on a hit.**

Carry the application's own `{CODE}` prefix on every cache key you build, and for organization-scoped data put the organization in the key too, before you rely on storage-level scoping for isolation. Name a key for the entity, the id and the read level it caches — never for a table, a query, or any other storage identifier.

**Cache the prepared contract read model, never the storage entity.** When you write, invalidate every cached tier it touches — every level, every affected scope — before the canonical re-read, so the response you hand back and the next read are the same bytes. Hold a trusted asynchronous writer (a queue consumer, a scheduled job) to the same rule; never let a path mutate behind the cache's back. Validate a value you fetch from the cache against the state's generated validator before you use it — treat a hit that fails validation as a miss to rebuild, never as an error to surface.

### Queue — at-least-once, so every consumer is idempotent

The rule that matters most: **at-least-once delivery, so every consumer is idempotent.**

Declare topics at the connection level, and expect publishing or subscribing to an undeclared topic to fail. Pair every declared topic with an error topic, provisioned together with it, so failed handling always lands somewhere you can inspect. **Put contract Events on the queue only — never Commands, never States.** Publish post-commit only; roll back and you emit nothing. Carry an idempotency key on a cross-module write request you send as an event.

Make every consumer you write idempotent — short-circuit redelivered work through the event's request key before any effect, so the same event processed twice produces one outcome for you.

### Storage — reached by reference, never streamed through the application

The rule that matters most: **reached by reference, never streamed through the application.**

Expect buckets to be provisioned; never create one at runtime. Put the **access class first** in an object key — `{class}/{org}/…`, `public` or `private` as the leading segment — because a prefix is the one thing both the edge and the store's policy can scope by. Put the owning organization second, so storage-level isolation mirrors the database's tenancy scoping.

**Derive a key; never author one.** What you hold as a caller is a logical folder path — bounded, POSIX-style segments with no way to spell `.`, `..` or a separator — and let the store compose the physical key from validated segments, the file's own id, and a lossy key-safe rendering of the display name. **Put metadata in the database and content in storage** — own every stored object with a database record carrying identity, scope, classification and lifecycle, and treat the storage key as an attribute of that record, never a public fact.

**Treat public as a prefix, not a permission.** Issue private access short-lived and signed, from a service, after its authorization gate; follow the same discipline in reverse for upload. A private object reachable by a stable URL is a defect you should fix. Put content the product must serve without a session under the store's `PUBLIC` prefix, fronted by the platform documents host — the edge caches that prefix, it does not decide access, so a request that goes around it meets the store's own prefix policy.

### Seal — it stores nothing, and it opens a value only where it belongs

The rule that matters most: **a value opens only under the context it was sealed with, and a value that does not open answers nothing.**

**The family is designed and not built yet** (`RD.SUPPORT.APPS.166`). What follows is the design of record; today a secret that must be read back is stored as it was written.

The seal has one interface with two operations. `seal` takes a value and a context and returns one sealed string; the value is the whole `internal` sub-object of a stored document, never one field of it. `open` takes a sealed string and a context and returns the value. Each `seal` uses a **data key** made for that value alone, under a **master key** that never leaves its holder, and the sealed string keeps the encrypted value and the wrapped data key together.

- **Name a context on every call** — the facts that say what the value belongs to: the organization, the table and the row, or the identity in the organization's place for a person's own secret. Which facts make a context is your module's decision; the support stage treats them as opaque names and values. The sealed string records its context, and an `open` under another context does not open it.
- **Treat an `open` that answers nothing as an absent secret.** A changed string, another context, an unknown form, or a refused key all answer nothing — no value and no error. Never fall back to a value stored in plain. `open` throws only when the key holder cannot be reached, because a retry may succeed.
- **Readiness is reachability of the key holder.** A wrong setting — an unknown provider, a missing key id, a key the service's role may not use — fails boot by name, never through readiness.
- **Only a service that lists the family opens it.** Boot builds the provider for a service that names the seal among its families, and the estate grants the key to those services' roles alone.
- **The cloud and the local implementation write the same stored form.** In the cloud the cloud's key service holds the master key, apart from the key that encrypts the database. On a machine the key is a fixed constant in the implementation; it is not a secret, and it protects test data only.

**What the family refuses:** it stores nothing and has no read by name, so it is no vault; it is not the configuration store that hands a deployment its own secrets; it does not replace a hash for a secret that is never read back; and it does not replace the mask — every contract read still masks a sealed value. If you need a secret back from an API, the seal does not give it to you.

## The provider seam — how one is selected

Reach every resource through a capability group — the interface, never the engine — so you can swap a resource's provider as a configuration change, never a code change. Select it as a config value, never a code path: `{CODE}_RESOURCE_{FAM}_{WORLD}_PROVIDER` carries a value from a closed, `Type`-suffixed enum, and the chosen variant's own keys nest beneath it. Fail boot on an unknown provider value. Add a vendor as a new enum value plus a new variant, and change nothing that consumes the capability.

You may open a named door onto the engine underneath a provider, for a need that is genuinely the engine's own — name the door, because that is what keeps it countable. **Do not depend on an undeclared door**, because reaching around the interface quietly standardizes you on one engine nobody chose to standardize on. Where two engines answer one need by different mechanisms, keep the interface free of either vocabulary: pass the setting through untyped, and let the chosen engine's own provider translate it. An interface that names one engine's concepts is portable to that engine alone, and only a second implementation ever proves it to you.

## Both runtimes ask the same question

A browser surface has resources too — storage the person owns rather than the platform — and what differs from the server is the blast radius, never the question you ask. Nothing in the browser half is provisioned: it cannot refuse a caller, so you move the enforcement this half relies on to build time and code review, not a runtime refusal.

**Store nothing sensitive in the browser, and decide nothing there.** Choose from four tiers, by how long a value should outlive the code that wrote it:

| Tier | Lifetime | Readable by | Holds |
| --- | --- | --- | --- |
| Memory (a closure) | until reload | only the code holding the reference | the session and its access token |
| Cookie (HttpOnly) | server-controlled | the auth host only | the durable, revocable sign-in credential |
| Session storage | the browser tab | any script on the page | non-secret, deployment-stable values; on a customer's own domain alone, a renewal token |
| Durable storage | until cleared | any script on the page | non-secret preferences, offline read models |

Hold the access token in a module closure and nowhere else — not local storage, not session storage, not a script-readable cookie — because a stored-XSS payload cannot exfiltrate what it cannot read. Give a web surface a renewal secret only where the browser's own cross-site rules leave it no cookie to use, and name that surface rather than let it happen by default.

Treat the web bundle as public by construction, so **put only publishable values in web configuration** — never an API key, signing key, vendor credential or connection string. If a capability needs a secret, put it behind a server capability fronted by an API; let the browser ask and the server hold.

Reach the network through exactly one path: the generated API client, which you configure once at boot with its base address and the session's bearer token on the transport. Never construct a request by hand — no raw fetch, no second HTTP helper, no per-feature wrapper — and normalize every failure through one error interceptor into the platform's error type, so every caller you write sees the same thrown shape regardless of which call failed.

## What a resource costs to change

A resource is the one part of a platform you cannot redeploy out of a mistake, so its rules govern the moment of change, not the moment of use.

- **Make schema change append-only and forward-compatible.** A running instance of the previous version must survive the new schema, because both versions run at once during a deploy.
- **Expect data to outlive every version of the code that wrote it.** A shape you write today is one something must still read years from now.
- **Declare a resource; never discover it** — worth repeating, because it is the rule every other one here depends on. A missing resource should fail at boot, never at first use.

## What this does not cover

Which engine answers a given family in a given environment, and how that engine gets provisioned, is an estate declaration this file assumes rather than states — read the declaring manifest before you treat a resource as absent. Where a permission over a resource is decided is the access model's question, not this file's; use only the fact here that the decision is never the resource's own.
