# Estate manifests — quick reference

**Source of truth:** the foundation book's infra domain and the repo-root `CONCEPT.md` (Estate Manifest · Estate Packages) in `spn-foundation`. Use this card as the digest; the book governs.

## Two files per node

Every estate node is a package. **Find its root by `spinfrapkg.json`; read its type from `src/spestate.json`** — never infer either from the folder name (the family-first name is *checked against* the manifest).

```jsonc
// spinfrapkg.json — infra's own package file, at the node root
{ "name": "@spn/infra-platform-dmo",
  "version": "0.1.0",
  "description": "The SPN Demo platform node — its environments, resource spaces, modules and apps.",
  "author": "SPN Demo",
  "license": "UNLICENSED" }
```

- `name` is authoritative; the folder is validated against it. Its scope, matched against the org's `packages` lists, routes the publish.
- **`version` is the artifact's semver.** This is the manifest naming a *publishable artifact*, and the bump is a reviewed edit — the bump commit is the reviewed act (see the `release` skill).
- `description` · `author` · `license` are the descriptive fields, optional in the tree. With them this file fills a package manifest's slot completely, so **an infra repository carries no `package.json` at all** (RD.INFRA.066). One appearing in an estate tree is a defect, not metadata.
- Read by the packaging machinery alone — release and ref-resolution — never by a layer.

```jsonc
// src/spestate.json — declares a node, publishes nothing; mirrors the kind manifest's shape
{ "type": "PLATFORM", "config": { "mtype": "PLATFORM", … } }
```

- **`type` opens the file; `config` is discriminated by its `mtype`.** `sprepo.json` (`type` · `config`) and `spkind.json` (`kind` · `config`) carry the same two-key shape, one naming what it declares and one carrying that declaration's own fields; the `spn:doc` block opens on `id`.
- Keep the declaration under `src/` because **what publishes is source**; a declaration node's `src/` is the manifest alone.

## The four types

| Type | Package name | `config` | `src/` |
| --- | --- | --- | --- |
| `SUPPORT` | `@saasplane/infra-<group>` — `infra-blueprints` first | `null` — it builds estates and declares none | `spestate.json` + renderings, **category-first, provider innermost** (`src/cloud/<step>/<provider>/…`) |
| `ORGANIZATION` | `@{org}/infra-organization` — at most one per repo | `org` · `blueprint` pin · `packages` · `emailDomain` · `legal` · `regions` · `providers` · `modules` | the manifest alone |
| `PLATFORM` | `@{org}/infra-platform-{spc}` | `spc` · `name` · `domains` (`platform.domain` = the `{spd}`, never the marketing domain, plus its `records[]`; `service[]` for service domains) · `owner` · `networkIndex` · **declaration**: `resources` (`platform` + `spaces[]`) · `apps` · `modules` · **realization**: `providers` (scm · cloud environments · local) — RD.INFRA.051 | the manifest alone |
| `MODULE` | `@{org}/infra-module-{code}` — **purpose code, never a product** (`idp`, not a vendor name) | `null` — identity only; usage stays on the referencing `modules[]` row | `spestate.json` + `aws/` + `local/` renderings — a rendering ships iff its folder exists |

Keep `docs/`, `tests/`, `README.md` repo-internal, always; `tests/` exists only where a render harness does. `infra validate` holds every tree to its type's shape.

## The shapes that get edited

Organization config, the essentials:

```jsonc
{
  "org": "spn",
  "blueprint": { "package": "@saasplane/infra-blueprints", "version": "0.1.0" },   // verified SUPPORT on fetch
  "packages": { "scopes": { "public": ["saasplane"], "private": ["spn"] },
                "stacks": [{ "code": "TS", "external": [] }], "infra": { "external": [] } },
  "emailDomain": "example.com",                                                     // every account address derives from it
  "legal": { "name": "…", "address": "…" },                                         // the registering entity, on the account

  "regions": [{ "code": "in", "networkIndex": 0 }],                                 // append-only, 0–14
  "providers": { "scm": { "mtype": "GITHUB" },
                 "cloud": { "mtype": "AWS", "home": "in",
                            "regions": [{ "code": "in", "region": "ap-south-1" }],  // the ONLY place a provider region is spelled
                            "profiles": null },
                 "local": {} },
  "modules": []
}
```

Platform config, the moving parts (manifest grammar laws — RD.INFRA.050/051). **`domains.platform.domain` is the `{spd}`** — the domain every host derives from, with its DNS `records[]` beside it; `domains.service[]` holds the service domains an app is reached on. **`owner`** is the platform owner — `email` · `firstName` · `lastName` · `displayName` — and the email is not decorative: the identity module seeds it as the owner's sign-in handle, so every recovery and step-up message goes there. It MUST be deliverable, on the organization's `emailDomain` or on a domain whose declaration carries MX (RD.INFRA.093). **declaration vs realization** — `resources` · `apps` · `modules` say what the platform *is*; `providers` say where it *runs*. `resources.platform` names the total four: database · cache · queue · storage — secrets never declared, every environment has one. Beside it `resources.spaces[]` holds per-need data worlds: `code` = published prefix · families each optional · db declares `schemas` `{name, dedicated}` rows and `users` `[{group, purposes, schemas}]` grants. `apps[]` rows sit at config level (`kindCode` — claim ∧ grant · `repo` · optional **`space`** binding, absent = platform resources · `deployments[]` one per mtype). `environments[]` rows sit under `providers.cloud` (`setup` free text — nothing derives from it · `region` · `networkIndex` append-only 0–7 · `workload` `PROD|NP` · `size` · `hosting` — `CLUSTER` refused under `PROD` · `deploy` trigger). `providers.local` mirrors the declaration **thing-first**: `resources.platform` ports · `resources.spaces` and `modules` as **maps keyed by declared code**. Declare in arrays, realize in maps; an orphan key is a validate ERROR, and absent = derived. **One fact once**: realizations carry no `mtype` — the declared engine selects the realization schema.

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
- Scoped refs resolve **the org's registry pair → the machine store (`~/.spnutils/registry`), the resolve-side cache → refused by name**. The store answers a resolve, and `infra release --local` stages into it — a staged artifact is not a published one.

## The artifact

`dist/` = `spinfrapkg.json` + `src/**`, nothing else — staged by the build, published whole. Documentation never ships, and **dist/ is never hand-edited** (the plugin's hook denies it).
