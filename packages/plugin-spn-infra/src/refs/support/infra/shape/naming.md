<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/01-shape/02-coordinates.md",
      "seen": "7905545a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/06-modules/02-config.md",
      "section": "The published vocabulary",
      "seen": "b6dbcd41"
    },
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/06-modules.md",
      "section": "The rungs, and what a path may be",
      "seen": "8efff768"
    }
  ]
}
-->

# Names, DNS and the published vocabulary — quick reference

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/01-shape/02-coordinates.md`, `docs/04-capabilities/02-support/02-infra/06-modules/02-config.md` and `docs/02-constructs/02-support/02-infra/06-modules.md`. Read this card as a restatement; the book governs. Examples use SPN Demo — org `spn`, platform `dmo`, domain `spndemo.app` — the only sample platform.

**Compose every name from coordinates; a name that cannot be composed is a defect.** Nothing is ever derived from a setup name — `{env}` = `{region}-{setup}` is a label; posture comes from `{workload}` (`PROD` · `NP`) alone. The provider's own region is a **mapping on the cloud entry, never a coordinate**.

## The resource name grammar

```text
{org}[-{spc}][-{env}]-{noun}      coordinates in scope order, the noun last
```

1. Put coordinates in scope order, the noun last.
2. A name carries the coordinates of its **sharing boundary** — nothing more, nothing less.
3. Use typed separators: `-` joins coordinates, `_` joins data-plane tokens, `/` nests. The substrate picks the rendering; coordinates and order never change.
4. A coordinate drops **only inside a sealed substrate** (namespace, broker, database interior). A cloud account is not sealed — cloud resources always carry full coordinates.

Worked examples: network `spn-dmo-in-dev` · NP cluster `spn-dmo-np-in` · bucket `spn-dmo-in-live-s3-docs` (every bucket composes `…-s3-{name}`) · KMS alias `spn-dmo-in-live`. More of them: IAM role `spn-dmo-in-dev-splt` · log group `/spn-dmo-in-dev/prd/splt` · registry pair `spn-infra-public|-private`. Note the governance seats: `spn-mgmt` · `spn-internal-cc` · `spn-internal-log` · `spn-internal-audit`.

**A namespace is the sealed substrate rule 4 names, so it drops `{env}` entirely — plain `{ns}`, never `{env}-{ns}`.** One cluster per environment already seals it, so the coordinate would be redundant rather than merely dropped: `prd` · `plt` · `vnd`, never `in-dev-prd`. A `CLUSTER`-hosted engine inside that namespace is one `StatefulSet` and one `Service`, named `{world}-{family}` — `dmo-database` · `sas-cache` · `dmo-storage` — because a world holds its own engines and the name already carries it.

## The DNS grammar — uniform `{env}`, no bare hostnames ever

```text
internal service   {env}-{ns}-{app}-{stype}.internal.{domain}
engine records     {env}-{world}-{engine}.internal.{spd}   database · cache · queue — low TTL
consumer app       {env}-{app}.{domain}         every environment — PROD included
remote port        {env}-{app}-remote.internal.{spd}   {app} = the application's kindCode — the platform's private zone, always
gateway            {env}-gateway.{spd} · {env}-gateway.internal.{spd}   each gateway's own host; a route's host points at it
module services    {env}-{module}-{service}.{spd}   the estate owns the namespace; the module names its services
platform documents {env}-{world}-docs.{spd}
storage API        {env}-{world}-storage.{spd}  CLUSTER only — the engine's S3 API, a route on a gateway, TLS from the zone wildcard
tenant             {env}-{tenant}.{spd}         canonical; a pretty name is a site entry; a route, never a record
custom domain      customer-owned               outside the zone, its own certificate
```

- **`{domain}` is the zone an app's row binds** — the platform domain `{spd}` unless the row carries a `serviceDomain` key naming one of the platform's service domains. Engine records, the documents host and the storage API belong to a **world**, and a world has no domain: they stay on `{spd}` however many service domains the platform declares.
- **Every declared domain stands a public zone `{domain}` and a private zone `internal.{domain}`, and the private zone is always a child name — never the apex** (RD.SUPPORT.INFRA.086). A private zone takes precedence for its whole namespace inside every network it joins, so a private zone on the apex would make the platform's own public hosts unresolvable from inside the cluster.
- **One world-marking rule covers every service hostname class** (RD.SUPPORT.INFRA.052): the world token is the platform's `{spc}`, a space's code, or a module's code — **no unmarked default world exists**. A space that stands its own engine gets its own records (`in-dev-sas-database…`), which is why unmarked records would be ambiguous, not merely inconsistent. The world token always matches the key prefix of the facts carrying the hostname.
- **Locally** (RD.SUPPORT.INFRA.079): `{world}-{service}.{lc-domain}` for every service, engines included — `dmo-docs` · `dmo-sas-docs` · `idp-auth` · `dmo-database.lc-spndemo.app:9000` · `dmo-sas-cache.lc-spndemo.app:9011`. The machine's resolver answers the host with `127.0.0.1`, so nothing is proxied and no engine protocol is intercepted. The port stays the transport distinguisher, and the hostname carries the world; each port comes from the five hundred the platform declares (RD.SUPPORT.INFRA.062, see `../providers/local/04-addressing.md`). Server certificates are minted per `{world}-{family}`, so an engine presents a certificate for the name you dial.
- **Module namespaces are validated** (RD.SUPPORT.INFRA.056): no kindCode may equal a declared module code or begin with one plus a hyphen.
- **Two labels belong to the grammar and never to a deployment** (RD.SUPPORT.INFRA.119): `gateway`, which is each gateway's own host, and any label that ends `-remote`, which is an application's remote port. `spnutils infra validate` refuses a deployment whose `subdomains` hold either, and names the row.
- **Engine records**: the environment apply writes them into the private zone, pointing at whatever the hosting rendered. Use these names in published endpoint facts, **never provider hostnames** — an engine swap flips a record, and every consumer follows.
- **PROD keeps `{env}` like every environment.** A bare name never exists as grammar, so published facts, config documents and minted URLs are env-pinned always.
- One single-level wildcard per zone covers every present and future name — adding an environment, app, space, or module service never issues a certificate. Adding a service domain issues exactly that domain's own pair.

## The published vocabulary — one format, in the shape the app opens (RD.SUPPORT.INFRA.043)

Written by blueprints into each **resource world's own seat**. **Every configuration rung ends in the same leaf segment, `vars`** (RD.SUPPORT.INFRA.054) — the platform world at `/environments/{env}/vars`, a space at `/environments/{env}/spaces/{code}/vars`, a module's private seat at `/environments/{env}/modules/{code}/vars`, with `/organization/vars` and `/platform/vars` above them. The app plane — `/environments/{env}/apps/{app}/vars` and one seat per deployment beneath it at `/environments/{env}/apps/{app}/deployments/{deployment}/vars` — is dev-authored (RD.SUPPORT.INFRA.054). Identity facts flat; resources as connection blocks the support shell reads directly. **Plus each installed module's purpose code** — `DMO_IDP_URL` names the purpose as the environment stands it, never the product that renders it.

```text
{SPC}_ORG_LEGAL_*                                   {SPC}_PLATFORM_CODE · _NAME · _DOMAIN · _ENV · _APPS_{APP}_SUBDOMAIN · _OWNER_*
{SPC}_RESOURCE_{FAM}_{WORLD}_ENDPOINTS              per connection block (RD.SUPPORT.INFRA.055): DB_APP · DB_MIGRATION ·
                                                    DB_{SCHEMA} · CACHE_APP · QUEUE_APP · STORAGE_APP (+ _PUBLIC_ENDPOINTS)
{SPC}_RESOURCE_{FAM}_{WORLD}_PROVIDER               connection worlds: APP everywhere; db adds MIGRATION + one {SCHEMA} block per custom schema
{SPC}_RESOURCE_{FAM}_{WORLD}_{PROVIDER}_{FACT}      e.g. DMO_RESOURCE_DB_APP_POSTGRESQL_HOST · _SCHEMAS · _USER_RW
{SPC}_{MODULE}_{FACT}                               module boundary fact, plain half — DMO_IDP_URL
{SPC}_{MODULE}_{APP}_{FACT}                         per-consumer minted pair, secret half — DMO_IDP_SPLT_CLIENT_ID (RD.SUPPORT.INFRA.057)
```

**Two senses of "world", ruled** (glossary). The **connection world** is the `{WORLD}` token above — APP · MIGRATION · {SCHEMA}, what a connection opens. The **resource world** is the prefix/hostname token — `{spc}` · space code · module code, who owns the engines. A space's family publishes under the space's own prefix, which is the platform's code and then the space's (`DMO_SAS_RESOURCE_DB_*` for the space `sas` of `dmo`, `RD.SUPPORT.INFRA.112`), same format, its seat's path.

Pairs per purpose the engine stands — db and queue `USER_RW`/`_RO`/`_MIGRATION`, cache `RW`/`RO`. Values are `{group}_{purpose}` full-word: `app_rw` · `app_ro` · `app_migration`, the migration block `migration_*`, a dedicated schema `{schema}_*`. Which pair a connection opens is the service's choice at boot. `ADM` is ledger-held, published to no application. Storage adds `PUBLIC_ENDPOINTS` (the public read path — the access class, never `CDN`-spelled). The seal block (RD.SUPPORT.INFRA.109) carries `{SPC}_RESOURCE_SEAL_APP_PROVIDER` and `_{PROVIDER}_KEY_ID` and nothing else: the key id is plain and read from the cloud by the apply, no pair and no `ENDPOINTS` publish, and locally the block is the selector alone, `LOCAL`. `SEAL` is one of the `connections` tokens, and an application whose estate row lists the `SEAL` grant receives the block (RD.SUPPORT.INFRA.110).

- A published key never spells a product, a rendering, an app token, or a module of the code that reads it (`RD.SUPPORT.INFRA.111`): the tenant edge's facts publish as `{SPC}_PLATFORM_INTEGRATION_EDGE_*`, and the identity module reads its own `{SPC}_IAM_EDGE_*`. A key that would repeat identically in every environment's rung belongs one rung up. A key a machine wants to write into the app plane belongs in a rung above, under a grammar name.
- **A published fact is always a literal**; only dev-authored app-plane values carry `${…}` references — one direction, one pass, unknown references refuse by name. A published endpoint is **write-once**.

## Tags — the queryable rendering of the coordinates

Stamped as provider default-tags from the declaration, never hand-typed; **creation without the full set denies**. Write keys PascalCase, values lowercase declared facts — never a secret, never a person:

`Name` · `Org` · `Platform` · `Environment` · `Region` · `Setup` · `Workload` · `Ns` · `App` (the owning unit — a kindCode, or a module code in `vnd`) · `Layer` · `Category` · `DataClass`
