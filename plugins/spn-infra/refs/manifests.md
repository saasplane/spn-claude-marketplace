# Estate manifests — quick reference

**Source of truth:** the foundation book's infra domain and the repo-root `CONCEPT.md` (Estate Manifest · Estate Packages) in `spn-foundation`. This card digests; the book governs.

## Two files per node

Every estate node is a package. Its **root is found by `spinfrapkg.json`; its type is read from `src/spestate.json`** — never inferred from the folder name (the family-first name is *checked against* the manifest).

```jsonc
// spinfrapkg.json — infra's own package file, at the node root
{ "version": 1, "name": "@spn/infra-platform-dmo", "release": "0.3.0" }
```

- `name` is authoritative; the folder is validated against it. Its scope, matched against the org's `packages` lists, routes the publish.
- `release` is the package's semver, bumped only by a reviewed edit — the bump commit is the reviewed act (see the `release` skill).
- Read by the packaging machinery alone — release and ref-resolution — never by a layer.

```jsonc
// src/spestate.json — the envelope, mirroring the kind manifest's shape
{ "version": 1, "type": "PLATFORM", "config": { "mtype": "PLATFORM", … } }
```

- **`version` is the integer `1`.** The retired `"v"` key must not appear anywhere — a manifest still carrying it is unmigrated.
- The declaration lives under `src/` because **what publishes is source**; a declaration node's `src/` is the manifest alone.

## The four types

| Type | Package name | `config` | `src/` |
| --- | --- | --- | --- |
| `SUPPORT` | `@saasplane/infra-<group>` — `infra-blueprints` first | `null` — it builds estates and declares none | `spestate.json` + renderings, **category-first, provider innermost** (`src/cloud/<step>/<provider>/…`) |
| `ORGANIZATION` | `@{org}/infra-organization` — at most one per repo | `org` · `blueprint` pin · `packages` · `emailDomain` · `regions` · `providers` · `modules` | the manifest alone |
| `PLATFORM` | `@{org}/infra-platform-{spc}` | `spc` · `domain` (`{spd}`, never the marketing domain) · `networkIndex` · `providers` (environments · apps · local) · `resources` · `modules` | the manifest alone |
| `MODULE` | `@{org}/infra-module-{code}` — **purpose code, never a product** (`idp`, not a vendor name) | `null` — identity only; usage stays on the referencing `modules[]` row | `spestate.json` + `aws/` + `local/` renderings — a rendering ships iff its folder exists |

`docs/`, `tests/`, `README.md` are repo-internal, always; `tests/` exists only where a render harness does. `infra validate` holds every tree to its type's shape.

## The shapes that get edited

Organization config, the essentials:

```jsonc
{
  "org": "spn",
  "blueprint": { "package": "@saasplane/infra-blueprints", "version": "0.1.0" },   // verified SUPPORT on fetch
  "packages": { "scopes": { "public": ["saasplane"], "private": ["spn"] },
                "stacks": [{ "code": "TS", "external": [] }], "infra": { "external": [] } },
  "regions": [{ "code": "in", "networkIndex": 0 }],                                 // append-only, 0–14
  "providers": { "scm": { "mtype": "GITHUB" },
                 "cloud": { "mtype": "AWS", "home": "in",
                            "regions": [{ "code": "in", "region": "ap-south-1" }],  // the ONLY place a provider region is spelled
                            "profiles": null },
                 "local": {} },
  "modules": []
}
```

Platform config, the moving parts: `environments[]` rows (`setup` free text — nothing derives from it · `region` · `networkIndex` append-only 0–7 · `workload` `PROD|NP` · `size` · `hosting` — `CLUSTER` refused under `PROD` · `deploy` trigger); `apps[]` rows (`kindCode` — claim ∧ grant · `repo` · `deployments[]` one per mtype); `local` (domain + the four resource ports); `resources` (the total four: database · cache · queue · storage — secrets never declared, every environment has one).

A module row:

```jsonc
{ "code": "idp", "layer": "ENVIRONMENT", "after": "compute",
  "source": "./packages/infra-module-idp",   // a locator — see below
  "version": null,                            // ignored when source is a path — written null
  "hosting": null,                            // null = follow the environment; a pin needs both renderings
  "config": {} }                              // the module defines its variables; this row values them
```

## Locator rules

- **Every package reference is role-keyed `{ package, version }`, scoped.** `@saasplane/*` is what SaaS Plane ships; `@{org}/*` is the org's own.
- **`@`-prefixed = published; semver required.** Anything else is a **path** (a sibling in the estate repo, while iterating) — `version` is ignored and written `null`.
- References verify by type on fetch: the org's `blueprint` against `SUPPORT`, a `modules[].source` against `MODULE`. A fetched type contradicting its role key refuses before anything renders.
- **Cloud verbs refuse path-resolved declarations by name** — that refusal is the correct gate until pins publish, never something to work around.
- Scoped refs resolve **cloud pair when bound → the machine store (`~/.spnutils/registry`) → refused by name**.

## The artifact

`dist/` = `spinfrapkg.json` + `src/**`, nothing else — staged by the build, published whole. Documentation never ships, and **dist/ is never hand-edited** (the plugin's hook denies it).
