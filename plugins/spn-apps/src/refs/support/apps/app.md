<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/01-apps/05-app.md", "seen": "a437529a" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/05-app/", "seen": "3d14c381" }
  ]
}
-->

# The application — what it is, how it boots, and what it ships

Source of truth: the foundation's application-lifecycle construct (`docs/02-constructs/02-support/01-apps/05-app.md`) and its capability chapters (`docs/04-capabilities/02-support/01-apps/05-app/`).

An application is the final runtime. Contracts, modules and support packages are all means to an end; the thing a platform actually runs is an application. **An app is `config + providers + modules`.** A module never carries that shape — a module has no providers of its own and boots nothing. Reach for this file when you compose an application, decide what boots before what, or work out what an application owes on release that a module never owes.

## What an application is, and what a module never is

Every application, on every runtime, is the same three-part shape (illustrative — the stack names the concrete types):

```ts
interface App {
  config: AppConfig;       // identity + settings, loaded once at boot
  providers: AppProviders; // infrastructure — app-wide by definition
  modules: AppModules;     // domain — keyed by module code
}
```

**Providers are infrastructure; modules are domain.** When you place a capability, follow one rule: app-wide goes in `providers`, domain-specific goes in the owning module. Never put a service, a client or a repository at the app root — if you find one there, beside the process entry, the app manager, the app reference and the interface, it is a module you have not given a folder yet.

A module mirrors the shape one level down: `config` plus `services`, split into `contract` (the public interface) and `impl` (the concrete implementation). A server module adds `clients` (external SDKs that domain alone uses) and `repositories` (its own data access). **A module owns a capability and no seam of its own.** It ships no shell: its services need an application's configuration, resources and entries before they can run, and its components need an application's providers, session and routing. Neither can be stood up alone — which is exactly what an application is for.

Providers vary by runtime, because a browser provisions no infrastructure at all:

| Runtime | Providers |
| --- | --- |
| universal | `logger` |
| web | `logger`, `auth` |
| server | `logger`, `caches`, `databases`, `queues`, `lock`, `error`, `auth` |

## Configuration is code, read once at the edge

Read the environment exactly once, at boot, and nowhere else. When a service, a repository or an entry adapter needs a setting, read it from the typed configuration you built at boot, never from the process environment directly. That inversion buys three things: a node can be simulated with declared values and no environment at all; local and cloud become one declaration with two sources; and a read outside boot becomes an undeclared dependency — invisible to validation, and the reason a deployment works on one machine and fails on the next.

A value unreachable through configuration is **not configurable**, whatever the environment happens to hold. Configuration is contract-typed and validates on load like any other contract value, so a bad setting **MUST** fail boot rather than a request.

Every variable follows one naming grammar, so its owner is predictable from its name alone:

```text
APP_ENV · APP_MODE                              bootstrap — unprefixed
{CODE}_LOG_* · {CODE}_API_* · {CODE}_AUTH_*     app-shell namespaces — where a capability has
                                                implementations, _PROVIDER selects and the
                                                chosen one's keys nest beneath it
{CODE}_RESOURCE_{FAMILY}_{WORLD}_*              resource blocks — estate-published; the same
                                                selection rule, per block
{CODE}_ORG_* · {CODE}_PLATFORM_*                identity facts — estate-published, seed-read
{CODE}_{MODULE}_*                               module namespaces
```

**The prefix is a bootstrap input, never typed inline.** The code a deployment passes is what a node reads, normalized. That is what keeps one module portable: it reads one deployment's prefix in one place and another's in the next, with no line changing.

`APP_ENV` and `APP_MODE` are the only unprefixed variables, because they exist before the configuration they select: one names which setup's values load, the other names which entries wake up. Both are set by the operator or the deployment — **never** inside a committed file.

**Every variable has exactly one owning layer**, which defines the name, the type, the default and the documentation; the deployment supplies only the value.

| Layer | Owns | Value set by |
| --- | --- | --- |
| Launcher | the two unprefixed bootstrap variables | the operator or the deployment, never a file |
| App shell | logging, the api entry, auth defaults, connection lists | the shell defines; the deployment values |
| Module | its own namespace | the module defines; the deployment values |
| Application | the prefix itself, the environment files, the platform identity facts | the application author |

**No layer may define a variable in another layer's namespace, and a module may not read outside its own prefix.** Commit configuration files, one per setup, at the project root — a deployment's accepted variables are documentation, and documentation outside the repository is folklore. One rule is absolute when you write one of these files: **never put a secret value in it.** Give a secret an empty value and an annotation naming where the real one comes from.

Where a capability group has more than one implementation, **which one runs is a configuration value, never a code path.** The group declares one selection variable from a closed vocabulary, and the chosen implementation's keys nest beneath it:

```text
{CODE}_EMAIL_PROVIDER=SES            the selection — a closed vocabulary, not free text

{CODE}_EMAIL_SES_REGION=eu-west-1    the chosen implementation's keys
{CODE}_EMAIL_SES_SENDER=

{CODE}_EMAIL_SMTP_HOST=              the other implementation's keys — declared, unset
{CODE}_EMAIL_SMTP_PORT=
```

Declare every implementation's keys, not only the active one, so a reader sees what a deployment could switch to without finding the code. **Validate the selection at boot** and fail naming the group and the unrecognized value — never fall back silently. Give most groups one selection variable; give the connection families **named instances** instead, because a service genuinely needs several credentials of one kind at once.

## Boot: an order the application owns end to end

A server application is a process that has to be built before it can answer anything. Nothing it needs exists when it starts — no configuration, no connections, no modules, no routes — and it constructs every one of them in an order it owns end to end.

| Phase | Produces | Fails when |
| --- | --- | --- |
| Config | typed configuration, read once from the environment | a value is missing, mistyped, or names an unknown selection |
| Providers | the capability groups, with implementations selected and connected | a resource is unreachable, or a selection is unrecognized |
| Modules | every composed module registered, its own configuration contributed | a module declares a dependency nothing provides |
| Entries | the transports this run mode activates, listening | a route, topic or command collides with one already claimed |

**Every phase MUST fail loudly and stop.** A process that boots halfway accepts traffic it cannot serve, and the failure then surfaces as a request error at three in the morning rather than a deploy error at noon. There is no partial boot.

Everything composed into the build is present after the module phase. What differs between one running instance and another is only which entries wake up — the run mode selects a subset from one composed build, never a second layout and never a second image.

**Shutdown is the same list, reversed.** Stop accepting first — an entry stops taking new work before anything else is released, so in-flight work completes against providers that are still alive. Release in the reverse order of acquisition: entries, then modules, then providers. And a shutdown that cannot complete **MUST** be bounded, then reported — it does not hang forever, and it does not exit silently pretending it drained.

### The module manager contract

Plug a module into the application through one manager class. Register it as exactly one entry in the app's module list, and stop there — nothing else at the app root may know the module exists:

| Method | Returns | When it runs |
| --- | --- | --- |
| `initModule` | the module — config, services, clients, repositories | boot phase 2 |
| `getEntities` | ORM entities the module owns | database init (phase 1) |
| `getMigrations` | schema migrations the module owns | the `MIGRATE` run mode |
| `getAPIControllers` | HTTP controllers, mounted under the module's API base path | HTTP entry start |
| `getCLIControllers` | command surfaces the module contributes | CLI entry start |
| `getQueueListeners` | queue consumers | queue entry start |
| `getContractSchemas` | validator namespaces published as named OpenAPI schemas | before HTTP entry start |
| `shutdownModule` | teardown | shutdown, reverse order |

The split of ignorance is the point: the boot manager never knows business domains, only the providers it built; the app manager never knows modules, only app-wide concerns; a module manager never knows other modules, only its own slice. Adding a domain costs one folder plus one line; deleting it is the reverse.

**Entries MUST mount only after every module has initialized.** An entry executes contract services, and nothing it invokes may still be assembling. Before the HTTP entry starts, boot collects every module's contract schemas and publishes each Command and State as a named OpenAPI component — the source the generated API clients read.

**Migrations never run beside serving traffic.** They execute in a run mode of their own: boot phases 1 and 2 run identically, no entry starts, the runner merges every module's declared migrations, runs the pending ones over the migration connection — the only DDL-capable credential the application ever holds — then the process exits.

### Cross-module collaboration goes through contracts

```ts
app.modules.order.services.contract.orderService  // the public seam
app.modules.order.services.impl.orderService      // never — private implementation
app.modules.order.repositories.order              // never — another domain's data access
```

The `contract` slot is deliberately narrower than `impl`, so one module structurally cannot reach another's internals. Every collaboration crosses that seam, so swapping the implementation behind it changes nothing for callers — which is what keeps *where a module runs* a deployment decision rather than a rewrite.

### Schema ownership is part of what an app decides

One application talks to one logical database, partitioned into schemas as ownership boundaries. The default set exists before any application code runs:

| Schema | Owned by | Holds |
| --- | --- | --- |
| `platform` | the installed platform modules | platform capabilities' tables — one module prefix per module |
| `product` | the application's own product modules | the product's business tables |
| `migration` | the migration runner | which versions ran, when, with what outcome |
| *additional schemas* | the declaring application | embedded infrastructure, or a dataset with a different access profile |

**Schemas are provisioned, never migrated.** A migration **MUST NOT** create or drop a schema — it creates tables inside schemas that provisioning already owns. Every table belongs to exactly one module, and every schema has exactly one owning side. Both platform and product modules mount on the same `default` connection, so cross-schema joins stay cheap; migrations **MUST** still name their schema explicitly rather than rely on the search path, which is what keeps a later extraction mechanical. A module **MAY** reference another module's rows by id only along a dependency its manifest declares — every write still goes through the owning module's own service.

Modules come in two flavors, distinguished by ownership and schema, never by API surface — the boot manager treats both identically:

| Flavor | Ships from | Owns tables in |
| --- | --- | --- |
| Platform module | a platform-stack package, installed as a dependency | `platform` schema |
| Product module | the product application itself | `product` schema |

## The commands a node answers, derived rather than listed

Ask any node the same five questions — build it, run it, prove it, check it, publish it. What differs between two nodes is never the question, only the answer, and the answer is not yours to invent: what a kind publishes, stores and generates decides which commands exist for that node at all.

| Command | Takes | Refuses when |
| --- | --- | --- |
| `build` · `check` · `format` · `clean` | the node | the node is not in this repository |
| `test` | the node, a tier | the tier is neither owed by the kind nor carried by the node |
| `release` | the repository | a node is named instead of the repository |
| `dev` · `start` · `stop` | the node, optionally a mode | the kind declares no such mode, or nothing was built |
| `migrate` | the node, an operation | the kind owns no schema |
| `codegen` | the node, what to generate | the kind generates nothing from a published surface |

A stack that has not realized a command **MUST** refuse by name, so a missing realization reads as missing rather than as a command that quietly succeeded at nothing.

**The command is the script; the variant is the argument.** A node declares one line per command, never one line per variant — a tier, a flavour, a run mode is an argument you pass, never a second command you invent. Writing the variant into the command's own name spells one fact three times, and the day two of the three disagree, nothing says which is the node's real answer.

**Release is the repository's command, never a node's.** Versioning is lockstep within a repository, so asking one node to release is refused, with the reason stated. A node's own release line is the per-package step the repository's release runs, in order, for every package it publishes.

## Deployment: one build, many shapes

Never build a second variant of the application for a second deployment shape. A deployment is the application, told which entries to start, and the unprefixed `APP_MODE` bootstrap variable, read at boot, is what tells it:

| Mode | What starts |
| --- | --- |
| `ALL` | every declared serving entry — the default when no mode is configured |
| `API` | the HTTP entry only |
| `QUEUE` | the queue listeners only |
| `MIGRATE` | no entries — pending migrations run, then the process exits |
| `CLI` | the CLI entry only — one command runs, then the process exits |

**Two modes serve and two run-and-exit, and `ALL` never reaches the second pair.** `MIGRATE` and `CLI` are how an application is *invoked* rather than how it is *served*, so a mode activates them explicitly or not at all. **A run-and-exit act MUST NOT be folded into the mode that serves everything** — folding it in means a restart silently re-runs it. Running a migration therefore uses the same build that was tested, reached by a declared value rather than by a second image.

**Contract**

```text
SPKindAppModeType  ALL · API · QUEUE · MIGRATE · CLI
```

Declare the full entry set in code regardless of how the application is deployed — a serving mode never changes what was composed; the mode filters only which entries phase 3 starts. Choose which entries a deployment activates with configuration, never with a code change. The same build ships as, for example, the `api` and `lst` deployments of the `{app}-{stype}` pattern, each scaled and sized for its own workload:

```text
one build {app} → {app}-api   HTTP entry, scaled for request load
                → {app}-lst   queue listeners, scaled for queue load
```

**Every deployment shape runs the same artifact.** An API deployment and its queue sibling cannot drift: one build, one contract, one boot. An application runtime keeps no state in process memory, so any instance is replaceable and a shape scales by adding instances — failover is a restart, not a recovery procedure. Vertical scaling **MAY** cover a short-term need; a shape **MUST** stay horizontally scalable as the plan.

## Delivery, and the one stamped version behind it

Release a change and every node's output goes one of three ways, decided by its kind: **published** to a registry, **deployed** to an estate, or **regenerated** from something else that shipped.

| Kind | Delivered as |
| --- | --- |
| `TOOLCHAIN` | published configuration, consumed by path at build time |
| `SUPPORT_*` · `MODULE_*` | published libraries, carrying their symbol index |
| `CLIENT_API` | regenerated from the released service's published surface, then published |
| `APP_SERVER` | a deployed image — migrations first, then serving entries by run mode |
| `APP_WEB` | a deployed static bundle behind declared entries |
| `APP_UTILITY` | published and installed, never deployed |

**Delivery follows the dependency direction**: toolchain, then support, then modules, then the clients regenerated from what those services publish, then the applications that compose them. Invert that order and an application ships against a package that does not exist yet. **A task mode runs before a serving mode**, so migrations complete before any entry accepts traffic. **A client is downstream of its service by construction** and cannot be released first. And **a module living inside an application ships inside its host** — it has no delivery of its own.

A repository releases as one version, and every project it holds carries that version. Any two artifacts on the same version were built and tested together, which is what makes a client regeneration safe and a partner's report reproducible.

**Never store the version in the source tree.** Write a placeholder in the manifest, use the workspace protocol for an internal dependency, and let the release stamp the repository's real version into every artifact at publish — into the artifact, never into the tree:

```text
in the tree                          at publish
version        0.0.0                 →   2.4.0
internal dep   workspace:*           →   2.4.0
```

The tag is the only record of the version, so releasing edits no file and a long-lived branch never conflicts over a number nobody typed. A release **MUST** run from a clean tree at the commit it tags; a source manifest still holding a real version stops the run before anything is built.

## The web application

A web application asks the same two questions a server does — how does it come alive, and how does it ship — and each has a short answer. Left undocumented, a web project grows a boot manager because the server has one, and a run mode for the same reason, and a deployment shape for a thing that is a file. **Each of those is a faithful port of machinery whose whole purpose was to solve a problem the browser does not have.**

**There is no boot manager, because there is nothing for one to build.** Its sequence is shorter, and several of its steps are ordered for reasons that stay invisible until the order breaks:

| Phase | Produces | Fails when |
| --- | --- | --- |
| Failure handling | the surface-wide handlers for what nothing else caught | installed after the first import evaluates — a failure *during* loading is then lost |
| Presentation | the style layers, in cascade order | the order is wrong, and a layer that should win is silently overridden |
| Config | typed configuration, resolved at build rather than read at start | a required value was never supplied to the build |
| Providers | the capability groups this surface composes | a selection is unrecognized, or a provider needs something not yet built |
| Reference | the typed handle the rest of the code reaches the surface through | something reads it during composition, before it exists |
| Teardown | the hook that flushes and cancels when the surface goes away | registered after the surface is already interactive |
| Mount | the root rendered into its host | the host is absent — and it fails loudly rather than rendering nowhere |

**Presentation is a boot phase, and only here** — style layers resolve by load order, so a correct set loaded in the wrong sequence is wrong in a way no single layer's own test catches. There is no migration step, because a web application owns no schema. There is **no module registration** — a web surface's modules are composed by its router, so composition happens at navigation rather than at startup. And configuration is already resolved when it starts, arriving as build-time values rather than being read — which is why a web surface cannot be reconfigured without rebuilding it.

**Assembly is import order, not a phased boot.** The app manager assembles the typed app config and the web providers (logger, auth) at page load — the two runtime addresses it needs (`apiBaseUrl`, `authHubUrl`) arrive in the runtime configuration document fetched same-origin, beside the bundle. **Composition by import**: the app composes UI module packages by importing their pages and URL builders, the router mounts module screens lazily, and registering a module is an import plus a route entry — nothing else in the app knows it exists. **The shell is a module too** — the router, the composition root, the app context and navigation live in the application's own `boot` module, so the `src` root stays the frame. **One client**: every data call flows through the API client; a web app never hand-writes an HTTP client and never talks to storage directly. Sessions arrive through the platform's session transport; the app consumes it and never implements it.

**Teardown is best-effort and cannot be awaited.** The exit signal fires both when a surface is closed and when it is navigated away and cached, so nothing may block on the work it starts. **A web surface never boots into a privileged state** — everything it can do it could do from a reload, so the guard is the server refusing the call, never the boot order.

### The web build has two sources and two fates

A web project's tree carries two source folders, and the build treats them differently:

```text
src/      compiles → dist/_assets/**      hashed names — the system's output
public/   copies verbatim → dist root     stable names — the author's chrome
```

`_assets/` is reserved so the cache contract can depend on only hashed names living there; `public/` is chrome — well-known files and small media — never product content, which belongs to the platform's own document store.

**The bundle is environment-free.** No runtime fact is baked in, so the build happens once and its content hash is the release. A deployed bundle instead reads the runtime configuration document at load — written per environment by the deploy, carrying exactly the public-safe keys a page needs. **The document is public by definition**, so a secret-shaped value inside it is refused at composition. A deployed web application builds no image at all: its artifact is the bundle, whole, delivered as a copy into the environment's release store and a pointer move — never a second horizontal-scaling decision, because static serving scales by the host rather than by the app.

## What an application owns that a module never does

- **A running process (or, on the web, a mounted page).** A module ships no shell; it is composed into one.
- **Every provider.** Infrastructure is app-wide by definition; a module reaches it, never provisions it.
- **The boot and shutdown order**, and the entries that boot's last phase mounts.
- **Its full entry set and its deployment shapes.** Which entries wake up is a deployment's selection over one build a module cannot make on its own.
- **The database connection and the schema set**, including which schema each module it hosts writes into.
- **Its own delivery and its own stamped version.** A hosted module ships inside its host and has no delivery of its own.
- **The commands `dev`, `start`, `stop`, `migrate` and `release` at the repository level** — a module answers `build`, `check`, `format`, `clean` and `test` alone.

## What this file leaves out

The rules for how a support package's capability groups are structured, and how a module's own contract, services and repositories are shaped, are the module's own model — ask for `module.md` in this plugin. Which tiers a node owes as proof, and how a behaviour row is joined to the case proving it, are a separate subject — ask for `tests.md`.
