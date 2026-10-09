<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/04-resources.md",
      "seen": "e2bcb7ee"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/04-resources/",
      "seen": "eb53d73e"
    }
  ]
}
-->

# Estate resources — what a node may declare, and what an app never asks for

**Source of truth:** the foundation book's `docs/02-constructs/02-support/02-infra/04-resources.md` and `docs/04-capabilities/02-support/02-infra/04-resources/`. Read this card as the restatement; the book governs.

## What a resource is

A resource is a backing service that holds state: a database, a cache, a queue, or object storage. A running process can be restarted; a lost row cannot — that is why the estate treats resources differently from everything else it stands up.

**A platform declares which engine fills each family, and at what version — that is the whole ask.** The four engine families are the **platform baseline, total by contract**: every family is present, and no application selects among them (decision `RD.SUPPORT.INFRA.050`). Declaring an engine buys its **baseline interior** — the invariant SaaS Plane ships with the blueprint: the role architecture and its per-application factory, the access model, the disabled default users, the naming policy. That interior versions with the blueprint pin and is identical on a laptop and in the cloud.

| Type (`SPEstateResourceType`, one family per key on `SPEstateResourcesPlatform`) | The estate supplies | The app's derived share |
| --- | --- | --- |
| `DATABASE` | the server; the platform, product and migration schemas; the default role groups | a role set at its own coordinate; its migrations own its DDL |
| `CACHE` | one instance, one logical database, read-write and read-only groups | a key prefix at its own coordinate |
| `QUEUE` | a broker, auto-create off | topics `{owner}-{noun}`, created by its own migrations |
| `STORAGE` | one store for the environment, private with no exception | access through the one document system, never a key prefix |

**The secret store is on no row, because nobody declares it — every environment has one, so asking for it would be asking for something already there.** The set of four is closed and total: a fifth engine is a contract change, exactly the ceremony a baseline set should demand.

**An environment also stands a key for stored secrets, and nobody declares that either** (`RD.SUPPORT.INFRA.109`). A product stores some secrets it must read back, such as a provider key an organization brings, and its service encrypts each one before it saves the row. That needs a master key held where the data is not, so the environment's blueprint creates one in each environment, at apply. **It is a key of its own** — not the key that encrypts the engines' data, so reading the data and opening a stored secret are two separate rights. **It carries a policy of its own**: only the role of an application whose row lists the `SEAL` grant may use it; the role that provisions the account may not, and no database role can. **It is one for each environment** — the platform and its spaces share it, so an application in a space that lists the grant seals with the same key. **The declaration gains nothing for it** — no row to write and no engine family to name. The key is built and released in the blueprints. It has not been stood on a real cloud account yet.

**An application selects no engine and names no share — MUST NOT.** Every scheduled deployment receives a derived share scoped to its own coordinates: its role set from the factory, topics named for their owner, storage reached through the one document system, its own configuration prefix. Nothing nameable crosses the seam in either direction, in either direction — that is what keeps the estate from ever reading a code repository. A new application is one reviewed row; a new version is no estate change at all.

## The grant purposes

Roles come from the baseline's factory in four purposes and only four. **Grants are fixed per purpose and never authored.**

| Purpose (`SPEstateDataRoleType`) | Grants | Held by |
| --- | --- | --- |
| `ADM` | owns the schema — grant, revoke, alter ownership | the blueprint; published to no application |
| `MIG` | schema changes | migrations only |
| `RW` | the application's own reads and writes | runtime pods |
| `RO` | reads | reporting and tooling |

**Nothing that deploys ever holds `ADM` — MUST NOT.** One default group per purpose — `app_adm`, `app_migration`, `app_rw`, `app_ro` — covers every schema the platform did not isolate, so ten applications in one environment share one set and no role is ever named after an application. A cache has no shape to migrate, so it exports no migrate purpose; a queue's topics *are* created by a migration, so it does. The word means the same power wherever it appears.

**The tracking schema — what migrations have already run — is isolated without being asked.** A runtime able to rewrite that record could replay or skip a migration; only a grant makes that unreachable. The migration connection opens as a member of the default migration group, because running a migration means writing the record and changing the shape in one act.

## A platform may name a schema; an application never may

```ts
export interface SPEstateResourceSchemaSpec {
  name: CDTString;        // recorded exactly as written — the migrations own this identifier
  dedicated: CDTBoolean;  // always written, never inferred from an absent key
}
```

A shared schema joins the default group. **A `dedicated` schema mints its own set of purpose roles and withholds the default group from it — an isolation posture inherited from an absent key is one nobody reviewed, which is why the flag is stated on every row rather than defaulted** (`RD.SUPPORT.INFRA.077`). Both fields are always written; a declared schema or group adds to the baseline and never replaces it.

## Resource spaces — the second extension axis

Beside the platform resources, a platform may declare named per-need data worlds:

```ts
export interface SPEstateSpace {
  code: CDTString;                                 // names the space; the platform's code goes in front of it in every published name
  database: SPEstateSpaceResourceDatabase | null;   // a family left out is simply not stood
  cache: SPEstateResourceCache | null;
  queue: SPEstateResourceQueue | null;
  storage: SPEstateResourceStorage | null;
}
```

**A space is per-need where the platform resources are total.** A family absent from a space is not stood at all. Its database family speaks the baseline's own grammar — the same `schemas` rows, the same `users` grant rows. A space owns no applications, no accounts, no domains; an application binds to one by the `space` key on its registration row, and an absent key means the platform resources answer. A row that names a space may also keep the platform, and its deployment is then given both sets of settings. An application still declares no demand — selecting a space is passing a code.

**A space carries its platform's code** (`RD.SUPPORT.INFRA.112`). Every name the estate publishes for a space starts with the platform's code and then the space's code.

| What | The platform's own | A space's |
| --- | --- | --- |
| The prefix of its published keys | `{SPC}_` | `{SPC}_{SPACE}_` |
| The world token in its host names | `{spc}` | `{spc}-{space}` |
| An example key | `DMO_RESOURCE_DB_APP_ENDPOINTS` | `DMO_SAS_RESOURCE_DB_APP_ENDPOINTS` |
| An example local host | `dmo-database.lc-spndemo.app` | `dmo-sas-database.lc-spndemo.app` |

A prefix is one word for a platform and two words for a space. A space's code must differ from the other spaces' codes of its platform; two platforms may use the same space code. The world token in a host name always matches the key prefix that carries it.

**On a machine, a space's engines take their ports from the five hundred the platform declares, and nobody writes them** (`RD.SUPPORT.INFRA.062`). The first hundred of the range holds the engines, ten ports for each world: the platform's own take the first ten, and space *i*, counting from one in declaration order, takes the ten ports from `+10 × i`, with each family at the same offset it has in the platform's own engines. So a platform stands at most nine spaces locally. A space has engines and nothing else; an application that belongs to a space takes a service's port or a web application's port like any other.

**A space is one of two independent extension axes, and they never couple** (`RD.SUPPORT.INFRA.085`). A space extends by **data**; a service domain (bound by `serviceDomain`) extends by **face**. An application takes either, both or neither.

**The platform's own resources are a preset composition of the same blueprint functions a space composes** — database, schema, user, topic, bucket. There is no privileged path a space cannot take, and no capability the baseline has that a space cannot ask for.

## A module owns its own world

A module's resources are its own engine instances, in its own world, under the module's own purpose code — **never databases or schemas inside the platform's engines** (`RD.SUPPORT.INFRA.053`). A module that migrates itself is structurally the administrator of *something*, so it owns the whole world its administrator role reaches. **The estate standardizes the boundary — the world code, its host labels, the local ports it derives inside the platform's declared range, its placement, a private configuration seat, a ledger seat, and the standing guardrails — and never the interior.** Which resources a module stands, and how its blueprint stands them, is the module's own business. How a module reaches applications through the configuration plane is a separate topic, restated in the modules card.

## Hosting and size are independent axes

**Hosting selects the rendering family; the pair of workload and size selects the capacity inside it.** A large cluster-hosted database and an extra-small managed one are both expressible, because how much an engine must carry and where it runs are unrelated questions. Cluster hosting exists because a managed service charges for existing rather than for being used — a control plane, a broker floor, an instance hour all arrive before the first query. **Cluster hosting is refused under the `PROD` workload rather than overridden.** The refusal governs the engine families, not everything that runs: a module's own workload is pods in every environment, which is what a hosted vendor has always been.

## A version is written the way its provider names it

**An engine's declared `version` is the string its provider accepts, never a shorter one that reads the same to a person** — a version the provider refuses is found at apply, in the account, long after review. The contract fixes the form per engine: the database takes a major (`16`) or `major.minor`; the cache takes `major.minor` (`7.1`), because the managed caches refuse a bare major from 7 on; the queue takes `major.minor.patch`, or `major.minor.x` where the broker service names a line (`3.7.x`), because the managed broker refuses a two-part version. The contract refuses the wrong shape before a plan is attempted.

**A `CLUSTER` engine runs the local realization's own image, at that image's own tag, and the declared version is the managed service's.** The database's tag agrees with the declared version; the cache's and the queue's need not — the cache's image carries the newest release of its major because no `7.1` is published upstream, and the queue's image is the one the local stack pins, which may lag the declared line. So a `CLUSTER` environment proves the engine family, and the managed version is proven only where it runs — the first apply against an account, never a plan.

## Storage declares a capability; its provider is derived

Storage is the one engine whose *provider* is derived rather than declared — a platform declares the capability `OBJECT`, and which product answers falls out of where the environment runs.

| Realization | Hosting | What answers | Published provider |
| --- | --- | --- | --- |
| a laptop | — | a self-hosted object store, as a container | `MINIO` |
| the cloud | `CLUSTER` | the same, as a workload | `MINIO` |
| the cloud | `MANAGED` | the cloud's own object storage | the cloud's own provider token |

**Two vocabularies, two jobs.** The declared value (`mtype`) names what stays true across every rendering; the published provider (`_PROVIDER`) names what actually answered. For the other three engines they coincide — a Postgres container and a managed Postgres are both `POSTGRES`. Storage is the one place they part, and an application switches on the published value in its integrations layer, exactly as it already does for the others.

**A cluster-hosted engine a browser must reach is exposed by a route on a gateway of the environment, and never by another product.** Storage is the one engine with that need, because a presigned link is signed against a host the browser resolves — so a cluster-hosted environment carries a storage host of its own, a route to the engine's interface with transport security from the zone's wildcard certificate. Under managed hosting no such row exists, because the provider's own endpoint already answers. An environment is containers throughout or managed services throughout, never a mixture.

## Storage's key grammar

**Every object key leads with its access class — `public` or `private` — as the first segment, and those two roots are the only part of a key the estate ever reads** (`RD.SUPPORT.INFRA.080`). The edge and the store's policy both scope by prefix; a class buried mid-key is one neither can see. Everything beneath the root belongs to the application layer, which is what lets a store be swapped without either side learning the other's vocabulary.

**A stored file cannot be reclassified — MUST NOT.** Its class is stamped at creation, and because the class *is* the file's location, changing it would mean moving bytes and invalidating every link already handed out. A file needing a different class is a different file, uploaded as one — the store's contract carries no move and no copy. **A key is derived, never authored.** What a person sees is a logical folder path of bounded slugs, so traversal is excluded by shape rather than by a check; the display name is a row, not part of the key.

**An application never learns the mechanism.** It asks for a connection, and whether a container or a managed service answered is not a fact it holds — same declaration, same baseline, same grants on a laptop and in a region. That is why a permission problem surfaces on a laptop rather than in a deployment.

## An engine is reached by its name, never by its endpoint

Every engine endpoint the configuration plane publishes is a record the estate owns, not the provider's own hostname — written once, when the environment stands, and untouched by any swap behind it.

| Engine | What its record covers |
| --- | --- |
| database, cache | the swap, fully — new connections land on the new resource |
| queue | bootstrap only — brokers advertise their own listeners, so a broker migration still cycles its clients |
| storage | out of scope — already named by its own key-grammar rows |

**What the name buys is that replacing an engine — a rebuild, a major-version migration, a hosting change — is a record flip plus a connection drain, never an application change and never a redeploy.** Three disciplines keep the claim true: records carry a low TTL; a swap ends by draining the old side, and pools follow the name only when they reconnect, which the migration forces; transport security verifies the provider's chain rather than the hostname, because a managed engine's certificate names its own endpoint rather than the estate's record.

## Hosted vendors — the one thing a company authors

Not everything a platform runs is something SaaS Plane wrote, and third parties arrive in two shapes that behave nothing alike.

| Reached | Is | Behind |
| --- | --- | --- |
| over the network — a payment processor, a mail sender | application configuration | a support seam; the estate never sees it |
| by running it yourself — an identity server, a search engine | a **module** | the vendor namespace (`VND`), internal only |

**A hosted vendor is a module whose purpose is a running thing, declared as a `modules[]` row so its existence is intent under review.** Its files are an estate package of its own (`infra-module-<code>`), and its purpose lives in the package name — `infra-module-idp`, never the product it renders — and in no second mechanism. It runs in the `VND` namespace, reachable internally and never publicly, and modules are that namespace's only writers. The estate hands it a credential at its coordinate and never learns what it creates inside.

**The blueprint's baseline machinery is exposed to module renderings as a library** — functions that mint a resource, a database, a host, that publish a fact, that apply the tag set. A module composes them rather than reimplementing any of it, so it is as capable as a blueprint step. **But the library is scoped by the caller's identity: a module mints only into its own world, and no function it holds reaches platform ground** — nothing alters a platform schema, joins a default group, overwrites an engine's published fact, or enters another module's world.

**The consequence is detachability as a checkable property.** Removing the row removes exactly the module's tagged footprint and refuses its data like every stateful teardown; any consumer still referencing a detached fact fails by name at the next render.

> Additive in its own space — always. Mutating platform ground — never, whatever the temptation. Needing to — a blueprint feature, not a module power.

**SaaS Plane provides the shape and never a catalogue — MUST NOT.** There is no per-vendor code anywhere in the tooling; a vendor you add is a `modules[]` row and a module package, and a vendor that requires a tooling release to add is a vendor a partner cannot add at all. Reached through a seam, replacing a vendor is a configuration change a caller never sees; reached through its own API directly, every caller is now coupled to a product the company does not own — an identity server placed behind an interface can be swapped by configuration, and the same server reached directly is vendor lock-in wearing an infrastructure costume.

## What a resource costs to change

- **Schema change is append-only and forward-compatible** — a running instance of the previous version must survive the new schema, because during a deploy both are running.
- **Data outlives every version of the code that wrote it** — a shape written today is one something must still read years from now.
- **Supply is declared once, at `PLATFORM`, and shares are never declared at all.** Provisioning reads the declaration and the coordinates, never a developer's memory; a missing engine fails at plan, by name.
- **Credentials are generated per environment, written to the secret store, and injected at runtime — never in a manifest, never in an image, never in a committed file.**

## What it makes checkable

| Defect | What it means |
| --- | --- |
| a share that was hand-named — a schema, a topic, a prefix | a derivation was bypassed, and it will drift |
| a connection string written by hand | the derivation was bypassed and will drift |
| a grant that exists in one realization only | the two are no longer one declaration |
| a credential in a manifest, image or committed file | the repository is now the leak |
| an application branching on which realization it is in | the mechanism leaked through the supply seam |
| an engine reached by its provider hostname | the record indirection was bypassed, and the next swap becomes a redeploy |
| per-vendor code anywhere in the tooling | a catalogue formed, and a partner can no longer add a vendor of their own |
| a caller naming a vendor's own API directly | the seam was bypassed and lock-in is now structural |
| a module writing outside its tagged space | the identity scoping failed, and detachment can no longer be checked |

Try it: `spnutils infra config render dmo in-dev api` — it composes one application's environment and masks every secret.
