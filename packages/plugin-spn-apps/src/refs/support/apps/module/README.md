<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-apps/03-module.md",
      "seen": "ffec5f11"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/03-module/",
      "seen": "bee1b146"
    }
  ]
}
-->

# The module contract chain

Read this before you touch a module's `contract/`, `app/`, `entry/`, `migrations/` or `config/` folder. It tells you what a module is, what it publishes, how its three layers divide the work, and how one module reaches another.

**This is stack-agnostic.** Markers are rendered in each language's own morphology; the reference stack spells them `Command`, `Event`, `Service`, `Repository`, `Entity`, `Type`. A stack whose idiom differs renders the same markers its own way, and you never drop them just because the stack does not spell them that way.

## What a module is

When you open a module, you are looking at **one business domain** — users, orders, billing — carried as contract, implementation, entries and migrations in one self-contained folder. Delete the folder and you have removed the capability completely, schema history included. A module lives on one runtime, and the runtime decides which realization of the layer model it carries; read the layering the same way on either one — what changes per runtime is the realization, never the layering itself.

You will sometimes meet two modules describing one domain from two runtimes — a server module and a web module both realizing IAM. They share the domain's docs seats, but each stays its own folder, its own contract, its own deletion boundary. Do not merge them into one.

## The layer model

One rule generates the whole shape: business logic lives in `app/`; everything transport-specific lives in `entry/`. The seam between them is `contract/`. A Command goes in, a State comes out.

| Layer | Holds | Visible to |
| --- | --- | --- |
| `contract/` | States (Commands, States, Events, constants) as pure JSON-representable data, the service interfaces, and their generated validators | Everyone — another module, an entry adapter, an API client, an agent tool |
| `app/` | The implementation: services owning the business logic, plus repositories, entities, support classes, utilities | This module only |
| `entry/` | Transport adapters — one per transport on the server (`api` · `queue` · `cli`), one on the web (`ui`, because the transport is the person) | The application's composition; each further transport is a sibling adapter |

You can replace the three layers independently. `contract/` publishes alone, and **MUST compile with `app/` absent** — that single property is what lets a caller build against a module it does not host, and lets a client ship to another runtime with no implementation behind it. You can rewrite `app/` behind an unchanged contract. You can add an `entry/` adapter without touching either, and switch it on per deployment as configuration.

**The dependency runs one way.** Nothing in `contract/` MAY reference `app/` or `entry/`. `app/` implements the contract, `entry/` consumes it, and a contract that reaches back into either has stopped being publishable. Treat every downstream artifact you see — a route, a validator, an API client, an agent tool schema — as a *projection* of `contract/`, never a second source of truth. If you find yourself about to edit one directly, stop: you would be making it describe a contract that does not exist.

The server module's five code seats — `contract/` · `app/` · `entry/` · `migrations/` · `config/` — each carry the code they need, and no more. A missing queue entry means no `entry/queue/`; no support classes means no `app/support/`. But when a part does exist, it lives in its one canonical seat — never invent a second home for it elsewhere.

## What a module publishes — the contract

### A state is data, never logic

The states seat holds Commands, States, Events, enums and constants, and it MUST be complete on its own — you should be able to compile an API client against it with `app/` absent.

| Construct | Carries | Compatibility |
| --- | --- | --- |
| **Command** | the caller's intent, in | forward-compatible — a new optional field may arrive at any time |
| **State** | the answer, out | backward-compatible — a published field is never removed, retyped or repurposed |
| **Event** | an immutable side-effect record, past-tense | append-only |
| **Enum** | a closed vocabulary, `UPPER_SNAKE_CASE` string values | additive only |

A state **MUST** be a single structured object — one consistent shape for success, failure and effects, never a bare scalar and never a shape that varies by code path. A state **MAY** list its effects (events emitted, notifications queued, tasks scheduled) so a caller sees the whole consequence of a command.

A command **MUST** carry the caller's intent only. Never write context the runtime already authenticated — the caller's own identity, their organization — into the command body; read it from the execution context instead. Write commands carry ids, never codes. Command handling **MUST** be idempotent, so retrying the same command yields the same outcome.

### The read ladder — one entity at four richnesses

You model an entity at escalating richness so a consumer fetches exactly what it renders.

| Level | Built by | For |
| --- | --- | --- |
| `{State}Meta` | the chain root | the navigable label — id, scope, code or name, whether it is active |
| `{State}Info` | extends Meta | Meta plus description-class fields — card views, embedded lists |
| `{State}` | extends Info | Info plus timestamps and resolved audit actors — admin listings, detail reads |
| `{State}Details` | composed from fields, never extension | a detail page's whole payload: the full state plus its dependent sub-states |

**Keep the extension chain strict** — a level that stops extending its parent breaks substitutability, and it breaks the one-mapper-per-level reuse the implementation is built on. Compose `Details` rather than extend it, because it aggregates; extending the state would force every sub-state into one inheritance chain. Only the full state is universal — treat Meta, Info and Details as each optional, chosen independently, and never invent one to complete a set an entity genuinely lacks.

### Collection shapes — the plural is keyed, the List is ordered

| Shape | Carries | Use when |
| --- | --- | --- |
| `{State}s` | a map keyed by id | the caller looks entities up by id |
| `{State}List` | an ordered array | order is part of the answer |

Nest a wrapper's collection under a named field, never a bare top-level map or array. Search results carry their own shape — the ordered rows and the total, together — and if you iterate a map while depending on its order, you have written a bug that will not reproduce.

### The service interface is the only seam a caller sees

Every method you declare takes exactly one Command and returns exactly one State (or a collection wrapper) — no positional scalars, no shape that varies by code path. Declare on the interface only what callers call. Keep implementation-internal readers and mappers off it, and promote a method a cross-module caller genuinely needs onto it deliberately — never let a caller reach around it. The interface holds no logic, imports no implementation, and **MUST** compile with `app/` absent.

### The method families are a closed set

Every entity, every module, every stack gets the same families. Spell a capability in these before you invent a verb, and generate only what a caller actually uses.

| Family | Shape | Returns |
| --- | --- | --- |
| get | `get{State}` | the full state |
| bulk get | `get{State}s` | the keyed map |
| Meta / Info reads | `get{State}Meta` · `get{State}Metas` · `get{State}Info` · `get{State}Infos` | that level, single or keyed plural |
| all | `getAll{State}List` · `get{State}List` · `get{State}ListBy{Scope}` | the ordered list |
| search | `search{State}s` · `search{State}Infos` | rows plus a total |
| details | `get{State}Details` | the composed payload |
| key lookup | `get{State}ByCode` · `…ByToken` · `…ByHost` | the full state |
| create · update | `create{State}` · `update{State}` | the full state |
| active toggle | `update{State}Active` | the full state |
| delete | `delete{State}` | the boolean result |
| junction set ops | `create{State}{Y}s` · `delete{State}{Y}s` | the boolean result, or the parent state |

There is no `bulk` verb — write a many-read as the plural of its read level. `getAll` is unbounded, and that is a commitment: reach for it only for a closed reference set the platform itself controls, and use `search` — which can page — for anything a tenant can grow. Search comes in twins — state rows for permission-gated admin listings, info rows for authenticated pickers. Return the canonical read shape from a mutation, the same state a fresh read would return.

The commands behind these families are a **closed set of reusable primitives** — the empty command, single get, bulk get, key lookup, active toggle, the boolean result. Reuse a primitive before you define a bespoke command; a bespoke command for "get by id" is a defect you are introducing, not a style choice.

### Enums, permission codes and error codes are contract constants

Enum values are stable and additive; tolerate unknown values from a newer producer rather than rejecting them. Permission codes form families — `<MOD>_<FAMILY>_<TIER>`, tiers `VIEW` · `MANAGE` · `ADMIN`, cumulative. Error codes are namespaced — `ERROR.STD.*` or `ERROR.<MOD>.<NAME>` — each carrying a category mapped to an HTTP status exactly once, and a public structured `data` object that carries nothing internal.

**Anti-enumeration is a MUST**: resolve an id outside the caller's scope to NOT_FOUND, never UNAUTHORIZED; return one generic UNAUTHENTICATED for a failed login regardless of which factor failed.

### Polymorphic shapes are a base plus extending variants

Declare one discriminator, `mtype`, on a polymorphic family's base, typed as the family's closed enum, and redeclare `mtype` as its own literal on each variant. `mtype` is required and immutable for the life of the value — treat a change of kind as a new value, never a mutation. Select the variant schema named by `mtype` and validate the whole value against it before you treat it as that variant; fail validation on an unknown `mtype`, never let it pass through. Declare a family as a base plus extending variants — never a union alias listing the variants side by side, which gives generation nothing to name and leaves a consumer no shape to hold while the kind is still unknown.

## What only this module sees — the app layer

`app/` is module-private. What crosses in is a Command; what crosses out is a State returned by a contract service. Two seams run through it, and they are the whole of its structure: **one seam out** — the contract services the module implements — and **one seam down** — the repositories, the only code touching storage. Read entities, utils and support as internal parts of one of those two.

| Concern | Service | Repository |
| --- | --- | --- |
| Business rules | owns every guarantee, named as explicit checks | none — trusts its calling service |
| Storage access | never queries storage directly | owns every query and persistence op |
| Shapes | maps entities to contract states | entities in, entities out — never contract states |
| Transactions | opens one per contract operation | joins the ambient transaction, never begins one |
| Authorization | gates every contract method | none — every call arrives already gated |
| Cache | builds and invalidates the read model | none |

**Route every write to a module's storage through the owning service** — that is what keeps authorization, invariants, cache invalidation, audit and events from being skipped. Never list a repository in a contract, and never call one from an entry or from another module — only the owning module's own services call it.

When you write a service method, compose the same seven steps, in order, each one declared line rather than hand-written control flow: gate → cached read or transaction open → repository work → cache invalidation → post-commit publish → audit → canonical re-read. Omit the steps a method does not need; never reorder them.

**What leaves this layer — exactly two exceptions**, named here so you do not have to decide case by case:

| Folder | Published | Why |
| --- | --- | --- |
| `services/` · `repositories/` · `support/` | no | this is how the module works; a consumer coupling to it couples to a decision meant to change |
| `entities/` | yes | another module's repository may need to express a declared cross-schema join, and a join needs the key it joins on |
| `utils/` | yes | a pure function exposes no interior — publishing a service would leak how the module works; publishing input-to-output leaks nothing |

An entity's join keys and a pure function's signature are stable by construction; treat everything else in `app/` as not. Reach the rest through the module's contract services — never reach into this layer directly, whichever module you are working from.

### Support — by area, then by kind of file

`app/support/` is the internal toolkit behind the services. Organize it the same way in a module and in an app. Give each subject of the toolkit one **area**: a folder directly under `support/`, named with a full word. Put no file directly in `support/`, so every file has an area that owns it. An area may hold a sub-area, laid out the same way.

| Kind | What it is | Where it sits in its area |
| --- | --- | --- |
| **Manager** | a class that runs a lifecycle, such as create, start, stop and sync, or that owns the providers of a seam | the top of the area |
| **Provider** | a class that implements a seam's interface for one vendor or one stack | the area's `providers/` folder |
| **Simple class** | a class that holds values through its constructor and uses them across its methods, and is neither a manager nor a provider | the top of the area |
| **Util** | an independent function: input in, output out. It works by itself or through other utils | the area's `utils/` folder, in a file named for its subject |
| **Types** | the area's interfaces and types, a seam's interface included | the area's one types file |
| **Constants** | the area's constants | the area's one constants file |

A **seam** is one interface with an implementation behind it for each vendor or stack. A service calls a manager or a util. A provider is built by a service or by a manager. A util calls other utils. It never builds a provider, and never calls a service or a manager.

- **Write a util as an independent function: input in, output out.** It is a low-level building block that works by itself or by calling other utils. It may read a file, run a command or read the environment. Never call a service or a manager from a util, and never build a provider in one. A util builds no class of the area and calls none, a simple class included. Keep a helper that only one util file uses private to that file.
- **Let a util read the app's global object where it needs to**: the app's configuration, and a provider the app set up at boot, such as the logger. The object is a standard every app has, so a util of the module's own `app/utils/` may read it too. That is using what the app already holds, not building a provider. Through that object a util still never reaches a service or a manager.
- **Do not read a support area's utils as the module's own `app/utils/`.** A util of `app/utils/` reads no file, runs no command and reaches no resource, and that folder is published. A util of a support area is internal, like everything in support.
- **Make a class only for a lifecycle, or for values held through its constructor and used across its methods.** A simple class is right for the second reason: an object holds values, and several of its methods use them.
- **Never make a class only to hold functions.** Here is the test. A class that has no constructor, extends no class, implements no interface and holds only functions is a group of static functions. That is a util module. Write it as one file in the area's `utils/` folder that holds those functions, the private ones too, and never as a class.
- **Make a function a method only where it is part of a manager's or a provider's own job**: a step of its lifecycle, or work on the values or the providers the object holds. A method of a simple class uses the values that class holds. Every other function is a util.
- **Export one class from a class file, and nothing else.** A file named for a class promises that class to every file that imports it. Move a function a class file would export to the area's utils.
- **Pick a provider where the knowledge to pick it is**: in a manager that owns the seam, or in the service itself. Think of a service that processes a file. It reads the file's type, and builds the parser for that type. The value that decides arrives with the call, so nothing at boot could have picked the parser. A util never builds a provider. A class that abstracts a vendor follows the provider seam: one interface, an `mtype`-selected implementation per vendor, configuration as data.
- **Give every class and every exported type its area as a prefix**: the area, then the subject, then the word for its kind, such as manager, store or reader. A provider ends with its vendor or its stack. A sub-area uses its own name, in the singular, and never the parent's before it. A seam's interface carries the area too, and the seam's subject where an area has more than one seam. An area declares its prefix, and it may be a short code where the area's name is long; the app states each area's prefix once. In a module the module's code is the prefix, and the area follows it only where the module's support holds more than one area.
- **Build a class as an object.** A manager and a provider hold their own state, and a static method never stands in for a function.
- **Put the tests in the same areas**: one folder for each area, under the area's own name.

How a kind is declared, and what its file is called, belong to the stack. For TypeScript, read `providers/ts/03-structure.md` and `providers/ts/02-naming.md` in this same plugin.

## How the outside reaches it — entry

Every adapter you write is the same equation: **parse** the transport's input into a Command, **execute** the matching contract service method, **render** the returned State back in the transport's terms. Put nothing else into an adapter — no branching on business conditions, no storage, no composition across services. A guarantee you enforce at an entry is a guarantee the other transports do not have, so put authorization, invariants, audit, transactions and cache on the contract service method, never the adapter.

**The set of server transports is closed at three** — HTTP API, queue listener, CLI. Do not treat a scheduler as a fourth: it fires and calls an entry, as any caller does, so a cron-triggered run arrives as `CLI` and a durable job as `QUEUE`. Which of a module's declared entries actually start is deployment configuration, not something you decide in code.

Follow one grammar for every API route you add — `/{module}/{entity}[/{sub-entity}][/{suffix}]` — module-prefixed, singular kebab-case nouns, GET for every read, POST for every write and every search, no `:id` path params and no version prefix. Stack read levels as suffixes: `/X` (state) · `/X/meta` · `/X/info` · `/X/details`, each with `/bulk`, `/all` or `/search` where the entity needs it.

**The API entry also serves a module's contract services to the other services of the platform, on the remote route.** It is the HTTP API and not a fourth entry. The module's manager lists its contract services (name, methods as data, what implements it), boot registers each, and the entry mounts one route for all of them, which reads the module, the service and the method from the request: `POST /remote` with the passport header and the calling service's credential header. The order **MUST** hold: check the calling service first, before the body is read; find the contract service among those registered; find the method among those the methods data lists; validate the command; build the execution context from the passport (a passport that cannot be read or is refused ends the call as unauthenticated, and no passport runs with no caller); run the method; validate the result. The route listens on a port of its own (`{CODE}_API_REMOTE_PORT`; no port, no listener), keeps no list of who may call what (authorization stays on the service method), answers as the public API does, and keeps the passport and the service credential out of logged headers. A contract may hold methods that have no controller, such as one that returns an opened secret to another module, so no public call can reach them. A person's address is counted from the right of the forwarded-address header, by the number of proxies in front of each listener (`{CODE}_API_TRUSTED_PROXIES`, `{CODE}_API_REMOTE_TRUSTED_PROXIES`), and a route's rate limit is counted in the service's shared cache, so it is one limit however many instances serve the route.

A queue listener you write consumes a message, parses it into the contract Event, rehydrates the recorded actor into a fresh execution context, then hands the work to a service — never business logic of its own. Make handling idempotent through the event's request key, and run it under a real principal — the originating actor or an explicit system actor, never context-free. Subscribe only to declared topics.

A CLI controller declares one command per contract service method, its flags derived from the Command contract. Keep the run one-shot: it executes once, and the outcome becomes the process exit code.

## Migrations travel with the module

Treat `migrations/` as the module's only schema-change path — never run DDL by hand and never rely on ORM auto-sync, anywhere including local. Write files timestamped and **append-only**: once a migration has run anywhere, it is immutable, so write a correction as a new migration rather than editing an old one. The runner merges every module's migrations into one global ascending order by numeric version, deduplicated and tracked per application. Implement `up` on every migration, and implement `down` where the change is reversible. Runs happen over the migration connection only, the only DDL-capable credential the application ever holds, in a run mode that starts no entries.

## Config is one namespace the module carries with it

A module's configuration is one namespace, declared by the module and populated once at boot from the environment. Read it thereafter through the module reference, never by reading the environment directly — a variable you read anywhere but boot is an undeclared dependency, invisible to validation and impossible to supply in a test that stands the module up with no environment at all. Stay inside your own `{CODE}_{MODULE}_*` prefix; never read outside it. When your setting is a fact the estate publishes, the estate's key carries no module's name, and the application's own settings write your key as a `${…}` reference to it (`RD.SUPPORT.INFRA.111`).

## How one module reaches another

Treat cross-module composition as service composition. Ask the owning module's contract services for what another module needs — **never reach into its internals, and never call its repositories.** That is what keeps the monolith/microservice choice reversible: a caller depends on the contract, not on the deployment.

Two narrow exceptions let data cross the boundary without a service call:

- **Declared entity joins.** You may reference another module's rows by id, and join them in a read, only along a dependency your own manifest declares. Never join into a module you do not depend on, and route every *write* through the owning module's contract services regardless.
- **Asynchronous events.** Send a cross-module write request as a queue event carrying an idempotency key, so at-least-once delivery is safe to act on. The queue carries events only, never Commands or States, and you publish post-commit — rolled-back work emits nothing.

Hold both paths to the same discipline as a direct call: route every read and write on the asynchronous path through services, so you never skip a guarantee just because the call crossed a queue instead of a method signature.

## Naming across stacks — one grammar, every language

Contract names live at two altitudes. **Wire names are identical on every stack, byte for byte** — enum values, permission and error codes, JSON keys, the `mtype` discriminator. **Declaration names render a foundation concept in a stack's own idiom** — the reference stack marks an enum vocabulary with the `Type` suffix; a snake_case stack renders the same marker as `_type`. Never drop the marker, vary it per module, or touch the wire values behind it, whichever stack you are in.

## The web module — the same layers, a person as the transport

A web module carries the same three layers, but expect most modules to never earn more than `entry/ui/` — the thin form, and the default. The generated API client is already the contract-derived client of the platform surface, so wrap it in a local service only when the module owns genuine client-side domain logic (offline operation, local persistence, a complex editor evaluating without a round trip). That is the full form, and it brings a local contract with it — states and service interfaces under the same seam discipline the server follows, but carrying **no permission codes**: authorization is decided on the server, so cite the server's permission code rather than declaring a second one.

`entry/ui/` holds `pages` (routes and composition), `components` (props in, events out, no data fetching of their own), `hooks` (the only layer that calls the generated client, one hook per concern) and `utils` (pure presentational helpers — label lookups, formatting, never a business rule).

## What this does not cover

The rules for *changing* a published contract — additive versus breaking, the secrets discipline, the compatibility review gate — are the review gate rather than the model. Find them in `module-changes.md` in this same plugin; reach for it when the question is whether a change you are making is safe to ship.
