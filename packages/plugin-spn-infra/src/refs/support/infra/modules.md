<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/06-modules.md",
      "seen": "2ba60a33"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/06-modules/",
      "seen": "db67da25"
    }
  ]
}
-->

# Estate modules and config — what `implement` reads when authoring an estate module

**Source of truth:** the foundation book's `docs/02-constructs/02-support/02-infra/06-modules.md` and `docs/04-capabilities/02-support/02-infra/06-modules/`. Read this card as the restatement; the book governs.

## A module is the estate's one extension point

Blueprints are shipped and nobody writes them, so **a module is the one place the model expects infrastructure to be written** — an estate package that composes the blueprint library at a step it names.

```ts
export interface SPEstateModule {
  code: CDTString;                       // the purpose — `idp`, never a product name
  layer: SPEstateLayerType;              // which layer it attaches at
  after: CDTString | null;               // the named step whose outputs it reads
  source: SPRepoPackageRef;              // the package, by version or by path while it is being written
  hosting: SPEstateHostingType | null;   // null follows the environment; a pin needs both renderings
  config: Record<CDTString, unknown>;    // the module defines its variables; this row values them
}
```

**The module defines its variables and the declaring row values them — MUST.** That is what lets a company add a warehouse or a search engine without the vocabulary an application reads ever widening.

## Additive in its own world, never platform ground

A module consumes only the outputs published at the step it named, runs under its own identity with every guardrail above it still in force, and publishes into resolved state and into the configuration plane at its own seat (`RD.SUPPORT.INFRA.036`).

> Additive in its own world — always. Changing platform ground — never. Needing to — that is a blueprint feature rather than a module power.

**The blueprint is also a library** — minting a resource, a database, a host; publishing a fact; applying the tag set are offered to module renderings as functions. A module composes them rather than reimplementing any of it. **But the library is scoped by the identity of whoever calls it: a module mints only into its own world, and no function it holds reaches platform ground — MUST NOT.** Nothing it does alters a platform schema, joins a default role group, overwrites an engine's published fact, or enters another module's world.

**The consequence is detachability as a property somebody can check.** Removing the row removes exactly the module's tagged footprint and refuses its data the way every stateful teardown does. Any consumer still referring to a fact that is gone fails by name at the next render.

## Where a module may attach

**A module's layer is validated, never assumed.** One declared in a company's manifest names the ground or organization layer; one declared in a product's manifest names the platform, environment or deployments layer. Declaring across that line is refused by name.

**A module sits at company scope only where what it stands is singular for the whole company** (`RD.SUPPORT.INFRA.065`):

- an immutable stream of artifacts consumed by pin — the package registry, base images;
- a provider service singular per company by the provider's own design — identity federation at the root, billing controls, the company audit trail;
- a rule applied to the account tree itself — company guardrails beyond the baseline, account lifecycle hooks.

**Anything that runs with state for a product's workloads stays that product's own — sharing one couples two products' postures**, which is the axis the whole account tree exists to draw.

**A hosted vendor is a module whose purpose is a running thing.** It lands in the `VND` namespace, internal only, and modules are that namespace's only writers; a vendor reached over the network is application configuration behind a support seam, and the estate never sees it. **SaaS Plane provides the shape and never a catalogue** — no per-vendor code anywhere in the tooling, so a module needing a tooling release before it could be added is a module a partner could not add at all.

**A module chooses its own hosting where it has a choice.** Shipping one rendering, that rendering is what runs; shipping both, it follows the environment unless its row pins one — a search index may stay in-cluster while the platform's own engines stay managed, or the reverse where a module's whole point is the managed service's behaviour. **What a pin can never do is put one of the platform's own engine families on containers in production** — a module's own workload is pods wherever it runs, which is why a hosted vendor is pods in every environment, that one included.

## The two renderings, and what carries them

A module is declared once by purpose code, realized in two targets. **The package carries both renderings; the tooling carries neither.**

| Target | The package ships | Applied by |
| --- | --- | --- |
| cloud | one folder per cloud provider, holding that provider's own declarations | the estate engine |
| a laptop | a `local/` folder holding one compose file and what it references | the container tool |

The tooling resolves the package, selects the target's folder, and invokes the engine that reads it — it parses neither rendering and knows no product on either side. **A module is addressed by its purpose code everywhere** — the folder, the compose project, the namespace its published keys sit under — so the product realizing it is named nowhere outside its own package, and swapping the product changes no consumer.

**A module may have no local form, and that is not a defect.** Some modules cannot stand on a laptop at all — a managed pipeline, a provider-run service. Such a module ships its cloud rendering and no local folder, and the local stand-up **warns and continues**, naming what it skipped and why, rather than refusing to stand the whole estate over one plug-in with no local form.

### What a local rendering may contain, and what it may never

```text
src/local/
  docker-compose.yml     the one entry point, where a local form exists at all
  *.conf, *.sql, …       configuration the compose file mounts, by relative path
```

| Refused | Why |
| --- | --- |
| a build instruction or an image recipe | a module ships images it does not build; a laptop that builds is slow, fragile offline, and no longer running what the cloud runs |
| a script that runs on the host | a module runs in containers; machine work — trust, names, certificates — belongs to the layer that owns the machine |
| a path escaping the folder | a mount reaching upward reaches state the package does not own |
| privileged containers, host networking, or a host bind outside the published ports | a plug-in that can reach the whole machine is not a plug-in |
| a secret in the tree | credentials are minted at stand-up and published; a value in the tree is a value in every copy of the tree |

**The compose file is plain and runnable**, using the container tool's own `${VAR}` substitution — a person can `docker compose up` it by hand, which no template could offer. The variables the tooling supplies are small and closed:

| Variable | Is |
| --- | --- |
| `LI_PROJECT` | the compose project and container-name prefix — `{org}-{spc}-mod-{code}` |
| `LI_NETWORK` | the platform's shared network |
| `LI_DOMAIN` | the platform's local domain; the module composes its own host under it |
| `LI_CERT_DIR` | the machine CA and shared certificates, read-only |
| `LI_OUT_DIR` | a host directory the module writes `publish.env` into |
| `LI_PORT_{NAME}` | one per port the row declares, derived inside the platform's five hundred local ports |

**Ports are declared on the row, not the compose file** — usage lives on the referencing row, so two products may stand the same module at different ports without forking the package. On a machine, a module's port derives inside the five hundred its platform declares, in the modules' own part of it (`+400`–`449`), in module-row order from `+400`, unless the row overrides it (`RD.SUPPORT.INFRA.062`). **Readiness is the compose file's own** `healthcheck` plus `--wait`; a module that never becomes healthy fails by its own definition, and neither side writes a probe.

**Publishing runs the other way — Docker has no outputs primitive.** A module that mints something a consumer needs writes `KEY=value` into `publish.env` under `LI_OUT_DIR`; each line reaches the config plane as `{SPC}_{CODE}_{KEY}`. It is a file rather than a stream because facts are read far oftener than produced — status and the config plane read them without standing anything up, and a person can open the file directly. **Timing belongs to the module**: it writes when it has the value, not when something asks. A module that publishes nothing writes no file, and an application that needed a key still fails at boot naming it.

## Two configuration stores, split by audience

An environment's configuration is either a fact the estate discovered or a choice somebody made — different writers, different lifetimes, different readers, so they live in different stores and neither overwrites the other (`RD.SUPPORT.INFRA.041`).

| Store | Written by | Shape | Holds |
| --- | --- | --- | --- |
| parameter store | the blueprints, during an apply | nested — the steps' own shape | what provisioning discovered or minted: endpoints, identifiers, roles, credentials |
| secret store | people, through the configuration commands | flat — fixed prefixes, nothing below them | what only a team knows: selections, keys, tuning |

**Both are read by the deploy step, and neither is read by a running application — MUST.** An application never learns that either store exists; it receives an environment. That is what makes the ledger safe to hold minted credentials — its only readers are the apply and the deploy, both infrastructure. **The split is audience, never sensitivity**: sensitivity is a judgement two engineers will disagree about, audience is a fact the declaration already knows.

## The rungs — every path ends in `/vars`

**The environment is the unit of replication: one declaration, many environments, each standing the complete world, everything minted or derived per instantiation, nothing copied between environments.**

```text
/organization/vars
/organization/modules/{code}/vars
/platform/vars
/environments/{env}/vars
/environments/{env}/spaces/{code}/vars
/environments/{env}/modules/{code}/vars
/environments/{env}/apps/{app}/vars
/environments/{env}/apps/{app}/deployments/{deployment}/vars
```

**Every rung ends in the same leaf segment `/vars`, and that is what makes the tree enumerable — MUST.** A rung that ended at the thing it described worked only while it was a leaf, and an application is not one — it carries a seat per deployment beneath it, so its path would have to be both a value and a parent of values, which is a collision in a store shaped as a hierarchy. Moving every value one level down leaves the path above it free to branch.

Each path exists as a plain half and a secret half. **Identity follows residency, which is why no path carries the platform's own token.** An environment's subtree is written by an apply bound to that environment's workload account; the organization and platform rungs by one bound to the platform's control account (`RD.SUPPORT.INFRA.059`). The organization apply **writes** the organization's facts into each platform's store — platforms stay self-contained, a re-apply propagates, and nothing reads across an account at the moment of composition. **A module's seat sits at the rung its `layer` puts it on** — an environment-scope module publishes at `/environments/{env}/modules/{code}`, an organization-scope one at `/organization/modules/{code}` — admitted only for what is org-singular by nature (`RD.SUPPORT.INFRA.065`).

**Keys are open; paths are fixed.** SaaS Plane fixes the prefixes and defines nothing beneath them — a value nobody predicted is a write inside a prefix that already exists, never an estate edit, a blueprint change or a foundation release. A check can only ever test **placement**: is this write inside a prefix this writer may write, and is a credential being pinned into a manifest. The foundation has no vocabulary for which keys ought to exist, and does not pretend to.

## Composition is derived, never declared

```text
the standard block
  → /organization/vars
    → /platform/vars
      → the application's world rungs — the platform's, the bound space's, or both
        → /environments/{env}/apps/{app}/vars
          → /environments/{env}/apps/{app}/deployments/{deployment}/vars
```

**Later rungs win — MUST.** A team's value overrides a standard default by construction, and no deployment lists a path anywhere; the coordinate is the whole address. **The sequence can never be declared** (`RD.SUPPORT.INFRA.054`): extending it is a register row, uniformly — a space's own rung entered exactly that way. The sanctioned ways to reach around it are to promote a value up a rung, to write a `${…}` reference, to author in the application plane, or to use a module's own seat. The narrowest rung is the deployment's own, and it is last because two deployments of one application differ in exactly the values that make them different deployments.

**A local environment is the same composition against a different source** — the compose tree stands in for the ledger, so an environment behaves the same on a laptop without a second mechanism, and a missing key is found on a laptop instead of in a pipeline.

Which world rungs a deployment is given follows from its application's row (`RD.SUPPORT.INFRA.113`):

| Path | On the platform | Space only | The platform and a space |
| --- | --- | --- | --- |
| `/organization/vars` · `/platform/vars` | yes | yes | yes |
| `/environments/{env}/vars` | yes | no | yes |
| `/environments/{env}/spaces/{code}/vars` | no | yes | yes |
| `/environments/{env}/apps/{app}/vars` | yes | yes | yes |
| `/environments/{env}/apps/{app}/deployments/{deployment}/vars` | yes | yes | yes |

The secret half is taken from the last three rows only, because the organization's and the platform's facts are plain. A later path wins where two hold the same key, and the two world rungs cannot hold the same key, because every key under a world's rung starts with that world's prefix, which the blueprint refuses otherwise. **Nothing is merged and nothing is given a second name**: the deployment loads both layers as they are, and the application's own settings join them, as a second queue connection that points at the platform's queue by reference.

**A fact is published once, at the path that describes it, and never copied to the consumers that read it.** Many applications on one database read one entry, and rotating it is one write; copying a fact per application turns every rotation into a fan-out and every staleness into a quiet defect nothing connects to the others.

## The published vocabulary

Every resource key follows one shape, and the middle token names the **connection world** the block serves:

```text
{SPC}_RESOURCE_{FAMILY}_{WORLD}_ENDPOINTS              the connection block's endpoint records
{SPC}_RESOURCE_{FAMILY}_{WORLD}_PROVIDER               which product answered, for this block
{SPC}_RESOURCE_{FAMILY}_{WORLD}_{PROVIDER}_{FACT}      that product's own facts
```

**The endpoints key is the canonical connectivity fact, per connection block** (`RD.SUPPORT.INFRA.055`) — an ordered list of the estate-owned records the environment apply wrote, first entry primary, never a provider's own hostname. **The block set is fixed plus declared.** Every family carries a block for the application's own grants (`APP`); the database adds `MIGRATION` and one dynamic `{SCHEMA}` block per declared schema, `dedicated` deciding which role group fills it — **a consumer's connection keys never change when its isolation does**. A block naming a schema no declaration mentions is refused by name.

**Every block exports one credential pair per purpose its engine stands** — `USER_*`/`PASSWORD_*`, full-word purposes. **Which pair a connection opens is the service's own choice at boot; `ADM` stays ledger-held, published to no application.** Provider-specific facts nest under the product that answered, so each variant carries exactly its own; provider tokens come from a closed list, decomposed by matching known values rather than by splitting on a separator.

**The seal publishes a block of the same shape, with less in it** (`RD.SUPPORT.INFRA.109`). The seal is the family a service calls to encrypt a stored secret before it saves the row, and its key is the environment's key for stored secrets. Its block carries `{SPC}_RESOURCE_SEAL_APP_PROVIDER`, which key holder answered, and `{SPC}_RESOURCE_SEAL_APP_{PROVIDER}_KEY_ID`, the id of that key. The id is not a secret, so it sits on the plain half, and nobody types it: the environment apply reads it from the cloud and publishes it. The block exports no credential pair, because the service calls the key holder as its own workload identity, and no endpoints key, because the estate owns no record for a key holder. **The environment's blueprint publishes the seal block when it stands the key.**

**Families are consumed by declaration, opted out by a present-but-empty marker** (`RD.SUPPORT.INFRA.046`). An application's `connections` block names the families it opens; a family not stood publishes no record and no keys, so a missing key at boot names exactly what was never declared. **Worlds are per-need within a family** — a read-only database consumer declares no `MIGRATION` world and holds the `ro` pair alone. `SEAL` is one of the family tokens: an application whose estate row lists the `SEAL` grant receives the seal block, and its workload role receives the right to use the environment's key for stored secrets (`RD.SUPPORT.INFRA.110`); an application whose row does not list it receives neither.

**A space's family lands under its own prefix, one level further down** (`RD.SUPPORT.INFRA.112`). The platform's prefix is `{SPC}_` and a space's is `{SPC}_{SPACE}_`: `DMO_RESOURCE_DB_APP_POSTGRESQL_HOST` for the platform `dmo`, `DMO_SAS_RESOURCE_DB_APP_POSTGRESQL_HOST` for its space `sas`. **A prefix is one word for a platform and two words for a space — MUST**; the blueprint refuses a key under a world's path that does not start with that world's prefix. The world token in a host name matches the prefix (`{spc}-{space}`), a space's code differs from the other spaces' of its platform, and a service in a space starts its own keys with the two-word code. An application bound to no space composes the platform's blocks; bound to a space, that space's; bound to a space with `"platform": true`, both, each under its own prefix. No other application reads across a world boundary by composition, because the derivation never offers it those keys.

**The remote channel publishes three kinds of key** (`RD.SUPPORT.INFRA.114`). A service that serves its modules' contracts to the other services of its platform listens a second time, on a remote port, and the services that call it need its address:

| Setting | Path | Why there |
| --- | --- | --- |
| `{SPC}_API_REMOTE_PORT` | the deployment's own `/vars` | one deployment's own, from `remotePort` on its row |
| `{SPC}_REMOTE_SERVICE_{NAME}_ENDPOINTS` | `/environments/{env}/vars` | one for each deployment that declares a remote port; every calling service reads it |
| `{SPC}_REMOTE_CREDENTIAL_PROVIDER` | `/environments/{env}/vars` | `KUBERNETES` in a cloud; one cluster issues every service's token |
| `{SPC}_REMOTE_CREDENTIAL_KUBERNETES_TOKEN_PATH` · `_AUDIENCE` · `_NAMESPACES` · `_ISSUER` | `/environments/{env}/vars` | the token's file in the pod, what a token must be for, this platform's namespaces, and the cluster's issuer |

- **`{NAME}` is the application's `kindCode`.** An application has at most one deployment that declares a remote port, so the name is one address.
- **In a cloud the address is `https://{env}-{app}-remote.internal.{spd}`**, with its scheme. `{app}` is the same `kindCode`, and the host is a route on the private gateway. A pod and an operator's machine read the same value.
- **The estate publishes two proxy counts beside a deployment's ports.** `{SPC}_API_TRUSTED_PROXIES` is `2` for a deployment that has a route (the load balancer, then the gateway) and `0` for an `INTERNAL` one. `{SPC}_API_REMOTE_TRUSTED_PROXIES` is `3`: the calling service, the internal load balancer, then the private gateway. A value a team authors for either key wins.
- **A module held remotely reads the address under its own prefix**, `{SPC}_{MODULE}_REMOTE_ENDPOINTS`, and the service's own settings write that key as a reference: `DMO_IAM_REMOTE_ENDPOINTS=${DMO_REMOTE_SERVICE_API_ENDPOINTS}`. So moving a module to another service is a change of one settings line.
- **The namespaces are `prd,plt,vnd`**, and the token's audience is `spn-remote`, so a token issued for anything else is refused.
- **Locally the provider is `LOCAL`**, written in the service's own environment file with `{SPC}_REMOTE_CREDENTIAL_LOCAL_SERVICE`, the application's `kindCode`. `infra config render` writes each remote address as plain HTTP on the service's local host and remote port: `http://api.lc-spndemo.app:9200`.

**The gateway's rate limit store is published beside them** (`RD.SUPPORT.INFRA.120`). A gateway counts a deployment's rate limit once across all its proxy pods, in the environment's own cache. The platform's world publishes three keys in the secret half of `/environments/{env}/vars`: `{SPC}_GATEWAY_RATE_LIMIT_STORE_URL` (the cache's address), `{SPC}_GATEWAY_RATE_LIMIT_STORE_AUTH` (the cache user the gateway counts as, with its password) and `{SPC}_GATEWAY_RATE_LIMIT_STORE_TLS` (whether the connection is encrypted). The gateway reads them and no service does. A deployment given the environment's settings receives them with the rest.

**An installed module's purpose code joins the family set** for the facts its own apply publishes. **Module facts keep a three-way placement**: plain boundary facts (`{SPC}_{MODULE}_{FACT}`) sit on the plain half; per-consumer minted pairs (`{SPC}_{MODULE}_{APP}_{FACT}`) sit on the secret half, composed only into their consumer's environment; the module's own interior sits in its own seat and is never published. A published key never spells the product a module renders, and never spells an application's token either.

**A published key carries no module of the code that reads it — MUST** (`RD.SUPPORT.INFRA.111`). The estate publishes a fact under a name for the thing the fact is about. A module reads a setting under its own prefix, `{SPC}_{MODULE}_*`, and nothing outside it. The service's own settings join the two: the module's key is written as a `${…}` reference to the published key. The tenant edge is the example, and the job scheduler has the same shape:

| | The estate publishes | The module reads | The service's own settings write |
| --- | --- | --- | --- |
| the edge | `{SPC}_PLATFORM_INTEGRATION_EDGE_TYPE` | the identity module: `{SPC}_IAM_EDGE_TYPE` | `DMO_IAM_EDGE_TYPE=${DMO_PLATFORM_INTEGRATION_EDGE_TYPE}` |
| the job scheduler | `{SPC}_RESOURCE_DB_JOBPGBOSS_POSTGRESQL_HOST` | the job module: `{SPC}_JOB_SCHEDULER_PGBOSS_HOST` | `DMO_JOB_SCHEDULER_PGBOSS_HOST=${DMO_RESOURCE_DB_JOBPGBOSS_POSTGRESQL_HOST}` |

A setting the estate does not publish stays the module's own and is written as a literal. An installed module of the estate is not a module of the code: its boundary facts keep `{SPC}_{MODULE}_{FACT}`, because that module is what the fact is about.

## The app plane is authored

**`/environments/{env}/apps/{app}/vars` is dev-authored, and nothing lands there by machine**, with one composed exception. What belongs there is what only a team knows:

- **The CORS origin regex is an authored key, never a derived formula** — no formula from the platform domain can say which origins an API admits.
- **Identity facts (`{SPC}_ORG_*`, `{SPC}_PLATFORM_*`) are SaaS-construct facts** — an independent application adopting no SaaS construct composes an environment without them, and that absence is blessed, not a gap.
- **The routing facts publish into every environment's store**, so a loading application reads what the blueprint generated: `{SPC}_PLATFORM_DOMAIN` (the one key for the platform domain), `{SPC}_PLATFORM_ENV` (the host prefix — never blank in the cloud, blank locally), `{SPC}_PLATFORM_APPS_{APP}_SUBDOMAIN` (the bare label), and the tenant edge's six facts, `{SPC}_PLATFORM_INTEGRATION_EDGE_TYPE` · `_ROUTE_STORE_ARN` · `_TARGET` · `_DISTRIBUTION_ID` · `_CERTIFICATE_REGION` · `_CUSTOM_DOMAINS`. `infra config render {spc} {env} {app}` produces the routing block locally, with the same spellings. No cloud edge stands on a machine and nothing publishes one there, so the local rendering writes the edge block as the identity module's own keys, `{SPC}_IAM_EDGE_*`, as literals. Two of them are settings the cloud never publishes: `{SPC}_IAM_EDGE_DEBUG` (selects the local edge provider — a deployment cannot ask for it by type, only by this flag) and `{SPC}_IAM_EDGE_ROUTE_DIR` (the machine path the local edge provider reads and writes its routes under).
- **The health port is `{CODE}_HEALTH_PORT`** — unset or empty means no health server, and local runs opt in. A deployed environment receives a **published default of `8010`, supplied by the deploy render** — a published default, never a code default, so the composed environment states everything true of the running application.

**A dev-authored value may cite a fact; a fact is always a literal.** `${…}` references resolve one pass against the *composed* rungs, so a reference sees exactly what the application would see. An unknown reference refuses by name at the comparison and at the render, never expanding quietly to nothing. An expansion pulling in a credential materializes on the secret path. That is what makes a published endpoint written once: an engine swap flips a record, and every value referencing it follows at the next render.

## What it makes checkable

| Defect | What it means |
| --- | --- |
| a module package with no rendering for any target | declared but unrealizable — a row nothing can stand |
| a build instruction inside a local rendering | a laptop asked to build what the cloud pulls |
| a mount resolving outside the package | a plug-in reaching state it does not own |
| a product name in a module code, a folder, or a published key | the indirection the purpose code exists for, bypassed |
| a published key that spells a module of the code that reads it | the estate named a consumer, and the fact changes when that module is renamed or replaced |
| a credential in a manifest or an environment file | the plane was bypassed, and the value now lives wherever that file went |
| a machine writing outside the environment rung | the split between writers broke, and a team's value can be replaced by an apply |
| an application granted read access to the ledger | the boundary that lets the ledger hold credentials is gone |
| the same fact at two paths | one of them is already stale, and nothing will say which |
| a reference inside a published fact | a fact became a template, and a one-pass expansion is now a question of ordering |
| a `{SCHEMA}` block with no declaration behind it | the store claims a world nobody reviewed |
| a health probe answered on the API's serving port | the dedicated-listener rule was bypassed |

Try it: `spnutils infra config render dmo in-dev api` — it composes and prints one application's environment without reaching a running deployment.
