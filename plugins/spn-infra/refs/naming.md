<!-- spn:restates
{
  "chapters": [
    { "path": "CONCEPT.md", "section": "Estate Coordinates", "seen": "738ec521" },
    { "path": "CONCEPT.md", "section": "Estate Config", "seen": "c888bb3f" }
  ]
}
-->

# Names, DNS and the published vocabulary — quick reference

**Source of truth:** the foundation's `CONCEPT.md` (Estate Coordinates · Estate Config). Read this card as a restatement; the book governs. Examples use SPN Demo — org `spn`, platform `dmo`, domain `spndemo.app` — the only sample platform.

**Compose every name from coordinates; a name that cannot be composed is a defect.** Nothing is ever derived from a setup name — `{env}` = `{region}-{setup}` is a label; posture comes from `{workload}` (`PROD` · `NP`) alone. The provider's own region is a **mapping on the cloud entry, never a coordinate**.

## The resource name grammar

```text
{org}[-{spc}][-{env}]-{noun}      coordinates in scope order, the noun last
```

1. Put coordinates in scope order, the noun last.
2. A name carries the coordinates of its **sharing boundary** — nothing more, nothing less.
3. Use typed separators: `-` joins coordinates, `_` joins data-plane tokens, `/` nests. The substrate picks the rendering; coordinates and order never change.
4. A coordinate drops **only inside a sealed substrate** (namespace, broker, database interior). A cloud account is not sealed — cloud resources always carry full coordinates.

Worked examples: network `spn-dmo-in-dev` · NP cluster `spn-dmo-np-in` · bucket `spn-dmo-in-live-s3-docs` (every bucket composes `…-s3-{name}`) · KMS alias `spn-dmo-in-live`. More of them: IAM role `spn-dmo-in-dev-splt` · log group `/spn-dmo-in-dev/prd/splt` · namespace `in-dev-prd` · registry pair `spn-infra-public|-private`. Note the governance seats: `spn-root` · `spn-internal-cc` · `spn-internal-log` · `spn-internal-audit`.

## The DNS grammar — uniform `{env}`, no bare hostnames ever

```text
internal service   {env}-{ns}-{app}-{stype}.internal.{spd}
engine records     {env}-{world}-{engine}.internal.{spd}   database · cache · queue — low TTL
consumer app       {env}-{app}.{spd}            every environment — PROD included
module services    {env}-{module}-{service}.{spd}   the estate owns the namespace; the module names its services
platform documents {env}-{world}-docs.{spd}
storage API        {env}-{world}-storage.{spd}  CLUSTER only — the engine's S3 API via the ingress, TLS from the zone wildcard
tenant             {env}-{tenant}.{spd}         canonical; a pretty name is a site entry
custom domain      customer-owned               outside the zone, its own certificate
```

- **One world-marking rule covers every service hostname class** (RD.INFRA.052): the world token is the platform's `{spc}`, a space's code, or a module's code — **no unmarked default world exists**. A space that stands its own engine gets its own records (`in-dev-sas-database…`), which is why unmarked records would be ambiguous, not merely inconsistent. The world token always matches the key prefix of the facts carrying the hostname.
- **Locally**: `{world}-{service}.{lc-domain}` for HTTP-facing services (`dmo-docs` · `sas-docs` · `idp-auth`); engines are `localhost:{port}` — no DNS fronts a local engine, the declared or derived port is the local world-distinguisher.
- **Module namespaces are validated** (RD.INFRA.056): no kindCode may equal a declared module code or begin with one plus a hyphen.
- **Engine records**: the environment apply writes them into the private zone, pointing at whatever the hosting rendered. Use these names in published endpoint facts, **never provider hostnames** — an engine swap flips a record, and every consumer follows.
- **PROD keeps `{env}` like every environment.** A bare name never exists as grammar, so published facts, config documents and minted URLs are env-pinned always.
- One single-level wildcard per zone covers every present and future name — adding an environment, app, space, or module service never issues a certificate.

## The published vocabulary — one format, in the shape the app opens (RD.INFRA.043)

Written by blueprints into each **resource world's own seat** — the platform world at `/environments/{env}/global`, a space at `/environments/{env}/spaces/{code}`, a module's private seat at `/environments/{env}/modules/{code}`. The app plane at `/environments/{env}/apps/{app}` is dev-authored only (RD.INFRA.054). Identity facts flat; resources as connection blocks the support shell reads directly. **Plus each installed module's purpose code** — `DMO_IDP_URL` names the purpose as the environment stands it, never the product that renders it.

```text
{SPC}_ORG_LEGAL_*                                   {SPC}_PLATFORM_CODE · _NAME · _DOMAIN · _OWNER_*
{SPC}_RESOURCE_{FAM}_{WORLD}_ENDPOINTS              per connection block (RD.INFRA.055): DB_APP · DB_MIGRATION ·
                                                    DB_{SCHEMA} · CACHE_APP · QUEUE_APP · STORAGE_APP (+ _PUBLIC_ENDPOINTS)
{SPC}_RESOURCE_{FAM}_{WORLD}_PROVIDER               connection worlds: APP everywhere; db adds MIGRATION + one {SCHEMA} block per custom schema
{SPC}_RESOURCE_{FAM}_{WORLD}_{PROVIDER}_{FACT}      e.g. DMO_RESOURCE_DB_APP_POSTGRESQL_HOST · _SCHEMAS · _USER_RW
{SPC}_{MODULE}_{FACT}                               module boundary fact, plain half — DMO_IDP_URL
{SPC}_{MODULE}_{APP}_{FACT}                         per-consumer minted pair, secret half — DMO_IDP_SPLT_CLIENT_ID (RD.INFRA.057)
```

**Two senses of "world", ruled** (glossary). The **connection world** is the `{WORLD}` token above — APP · MIGRATION · {SCHEMA}, what a connection opens. The **resource world** is the prefix/hostname token — `{spc}` · space code · module code, who owns the engines. A space's family publishes under the space's own prefix (`SAS_RESOURCE_DB_*`), same format, its seat's path.

Pairs per purpose the engine stands — db and queue `USER_RW`/`_RO`/`_MIGRATION`, cache `RW`/`RO`. Values are `{group}_{purpose}` full-word: `app_rw` · `app_ro` · `app_migration`, the migration block `migration_*`, a dedicated schema `{schema}_*`. Which pair a connection opens is the service's choice at boot. `ADM` is ledger-held, published to no application. Storage adds `PUBLIC_ENDPOINTS` (the public read path — the access class, never `CDN`-spelled).

- A published key never spells a product, a rendering, or an app token. A key that would repeat identically in every environment's global belongs one level up. A key a machine wants to write into the app plane belongs in the globals under a grammar name.
- **A global is always a literal**; only dev-authored app-plane values carry `${…}` references — one direction, one pass, unknown references refuse by name. A published endpoint is **write-once**.

## Tags — the queryable rendering of the coordinates

Stamped as provider default-tags from the declaration, never hand-typed; **creation without the full set denies**. Write keys PascalCase, values lowercase declared facts — never a secret, never a person:

`Name` · `Org` · `Platform` · `Environment` · `Region` · `Setup` · `Workload` · `Ns` · `App` (the owning unit — a kindCode, or a module code in `vnd`) · `Layer` · `Category` · `DataClass`
