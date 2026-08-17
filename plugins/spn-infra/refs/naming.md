# Names, DNS and the published vocabulary — quick reference

**Source of truth:** the foundation's `CONCEPT.md` (Estate Coordinates · Estate Config). This card digests; the book governs. Examples use SPN Demo — org `spn`, platform `dmo`, domain `spndemo.app` — the only sample platform.

**Every name is composed from coordinates; a name that cannot be composed is a defect.** Nothing is ever derived from a setup name — `{env}` = `{region}-{setup}` is a label; posture comes from `{workload}` (`PROD` · `NP`) alone. The provider's own region is a **mapping on the cloud entry, never a coordinate**.

## The resource name grammar

```text
{org}[-{spc}][-{env}]-{noun}      coordinates in scope order, the noun last
```

1. Coordinates in scope order, the noun last.
2. A name carries the coordinates of its **sharing boundary** — nothing more, nothing less.
3. Separators are typed: `-` joins coordinates, `_` joins data-plane tokens, `/` nests. The substrate picks the rendering; coordinates and order never change.
4. A coordinate drops **only inside a sealed substrate** (namespace, broker, database interior). A cloud account is not sealed — cloud resources always carry full coordinates.

Worked examples: network `spn-dmo-in-dev` · NP cluster `spn-dmo-np-in` · bucket `spn-dmo-in-live-s3-docs` (every bucket composes `…-s3-{name}`) · KMS alias `spn-dmo-in-live` · IAM role `spn-dmo-in-dev-splt` · log group `/spn-dmo-in-dev/prd/splt` · namespace `in-dev-prd` · registry pair `spn-infra-public|-private` · governance seats `spn-root` · `spn-internal-cc` · `spn-internal-log` · `spn-internal-audit`.

## The DNS grammar — uniform `{env}`, no bare hostnames ever

```text
internal service   {env}-{ns}-{app}-{stype}.internal.{spd}
engine records     {env}-database · {env}-cache · {env}-queue   → internal.{spd}, low TTL
consumer app       {env}-{app}.{spd}            every environment — PROD included
platform docs      {env}-docs.{spd}             a distribution under BOTH hostings; only the origin swaps
storage API        {env}-storage.{spd}          CLUSTER only — the engine's S3 API via the ingress, TLS from the zone wildcard
tenant             {env}-{tenant}.{spd}         canonical; a pretty name is a site entry
custom domain      customer-owned               outside the zone, its own certificate
```

- **Engine records**: the environment apply writes them into the private zone, pointing at whatever the hosting rendered. Published endpoint facts use these names, **never provider hostnames** — an engine swap flips a record, and every consumer follows.
- **PROD keeps `{env}` like every environment.** A bare name never exists as grammar, so published facts, config documents and minted URLs are env-pinned always.
- One single-level wildcard per zone covers every present and future name — adding an environment or app never issues a certificate.

## The published vocabulary — one format, in the shape the app opens (RD.INFRA.043)

Written by blueprints into the **environment global only**. Identity facts flat; resources as connection blocks the support shell reads directly; **plus each installed module's purpose code** (`DMO_IDP_URL` — the purpose as the environment stands it, never the product that renders it).

```text
{SPC}_ORG_LEGAL_*                                   {SPC}_PLATFORM_CODE · _NAME · _DOMAIN · _OWNER_*
{SPC}_RESOURCE_{FAM}_ENDPOINTS                      the engine record — once per family (DB · CACHE · QUEUE · STORAGE)
{SPC}_RESOURCE_{FAM}_{WORLD}_PROVIDER               worlds: APP everywhere; db adds MIGRATION + one {SCHEMA} block per custom schema
{SPC}_RESOURCE_{FAM}_{WORLD}_{PROVIDER}_{FACT}      e.g. DMO_RESOURCE_DB_APP_POSTGRESQL_HOST · _SCHEMAS · _USER_RW
```

Pairs per purpose the engine stands — db and queue `USER_RW`/`_RO`/`_MIGRATION`, cache `RW`/`RO`; values are `{group}_{purpose}` full-word (`app_rw` · `app_ro` · `app_migration`; migration block `migration_*`; dedicated schema `{schema}_*`); which pair a connection opens is the service's choice at boot; `ADM` is ledger-held, published to no application. Storage adds `PUBLIC_ENDPOINTS` (the public read path — the access class, never `CDN`-spelled).

- A published key never spells a product, a rendering, or an app token. A key that would repeat identically in every environment's global belongs one level up; a key a machine wants to write into the app plane belongs in the globals under a grammar name.
- **A global is always a literal**; only dev-authored app-plane values carry `${…}` references — one direction, one pass, unknown references refuse by name. A published endpoint is **write-once**.

## Tags — the queryable rendering of the coordinates

Stamped as provider default-tags from the declaration, never hand-typed; **creation without the full set denies**. Keys PascalCase, values lowercase declared facts — never a secret, never a person:

`Name` · `Org` · `Platform` · `Environment` · `Region` · `Setup` · `Workload` · `Ns` · `App` (the owning unit — a kindCode, or a module code in `vnd`) · `Layer` · `Category` · `DataClass`
