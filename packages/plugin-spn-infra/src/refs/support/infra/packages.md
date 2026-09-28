<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/02-packages.md",
      "seen": "20ab2e56"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/02-packages/01-manifests.md",
      "seen": "274f33f2"
    }
  ]
}
-->

# Estate manifests — quick reference

**Source of truth:** the foundation book's `docs/02-constructs/02-support/02-infra/02-packages.md` and `docs/04-capabilities/02-support/02-infra/02-packages/01-manifests.md`. Read this card as the restatement; the book governs.

## Two files per node

Every estate node is a package. **Find its root by `spinfrapkg.json`; read its type from `src/spestate.json`** — never infer either from the folder name (the family-first name is *checked against* the manifest).

```jsonc
// spinfrapkg.json — infra's own package file, at the node root
{ "name": "@spn/infra-platform-dmo",
  "version": "0.11.0",
  "description": "The SPN Demo platform node — its environments, resource spaces, modules and apps.",
  "author": "SPN Demo",
  "license": "UNLICENSED" }
```

- `name` is authoritative; the folder is validated against it. Its scope, matched against the org's `packages` lists, routes the publish.
- **`version` is the artifact's semver.** This is the manifest naming a *publishable artifact*, and the bump is a reviewed edit — the bump commit is the reviewed act (see the `release` skill).
- `description` · `author` · `license` are the descriptive fields, optional in the tree. With them this file fills a package manifest's slot completely, so **an infra repository carries no `package.json` at all** (RD.SUPPORT.INFRA.066). One appearing in an estate tree is a defect, not metadata.
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
| `SUPPORT` | `@saasplane/infra-<group>` — `infra-blueprints` first | `mtype` · `name` — a readable name and nothing else; it builds estates and declares none (RD.SUPPORT.INFRA.099) | `spestate.json` + renderings, **seam, then provider, then layer, then step** (RD.SUPPORT.INFRA.101) |
| `ORGANIZATION` | `@{org}/infra-organization` — at most one per repo | `name` · `org` · `blueprint` pin · `packages` · `emailDomain` · `legal` · `regions` · `providers` · `modules` | the manifest alone |
| `PLATFORM` | `@{org}/infra-platform-{spc}` | `org` · `spc` · `name` · `domains` (`platform.domain` = the `{spd}`, never the marketing domain, plus its `records[]`; `service[]` for service domains) · `owner` · `network` · **declaration**: `resources` (`platform` + `spaces[]`) · `apps` · `modules` · **realization**: `providers` (scm · cloud environments · local) — RD.SUPPORT.INFRA.051 | the manifest alone |
| `MODULE` | `@{org}/infra-module-{code}` — **purpose code, never a product** (`idp`, not a vendor name) | `mtype` · `name` — identity only; usage stays on the referencing `modules[]` row | `spestate.json` + `aws/` + `local/` renderings — a rendering ships iff its folder exists |

Keep `docs/`, `tests/`, `README.md` repo-internal, always. `infra validate` holds every tree to its type's shape. `tests/` holds one folder per tier the node's kind owes — `contract/` always, `unit/` for `SUPPORT` alone, `integration/` for every kind — the folder naming the tier and the file's kind naming the engine; see `blueprints.md` § *What proves an estate change* for the ladder and `02-tests.md` in the foundation for the tree itself.

**The blueprint tree orders seam, then provider, then layer, then step** (RD.SUPPORT.INFRA.101) — `src/{seam}/{provider}/{layer}[/{step}]`:

```text
src/common/                               naming, tags, profiles, config — shared by every layer
src/scm/github/{ground,platform}
src/cloud/aws/{ground,organization,platform,environment,deployments,functions}
```

Provider-innermost would put one provider's folder inside every step, so adding a cloud would touch every path in the tree. Provider-second adds a sibling folder and touches nothing.

## The shapes that get edited

Organization config, the essentials:

```jsonc
{
  "name": "SaaS Plane",                                                             // readable; `org` is a token, not a sentence
  "org": "spn",
  "blueprint": { "package": "@saasplane/infra-blueprints", "version": "0.2.1" },    // verified SUPPORT on fetch
  "packages": { "scopes": { "public": ["saasplane"], "private": ["spn"] },
                "stacks": [{ "code": "TS", "external": [] }], "infra": { "external": [] } },
  "emailDomain": "example.com",                                                     // every account address derives from it
  "legal": { "name": "…", "address": "…" },                                         // the registering entity, on the account

  "regions": [{ "code": "in", "networkIndex": 0 }],                                 // R — appended forever, never reused
  "providers": { "scm": { "mtype": "GITHUB", "org": "saasplane" },                  // the one account every platform's repositories live under
                 "cloud": { "mtype": "AWS", "home": "in",
                            "regions": [{ "code": "in", "region": "ap-south-1" }],  // the ONLY place a provider region is spelled
                            "profiles": null },
                 "local": {} },
  "modules": []
}
```

Platform config, part by part (manifest grammar laws — RD.SUPPORT.INFRA.050/051). **`domains.platform.domain` is the `{spd}`** — the domain every host derives from, with its DNS `records[]` beside it; `domains.service[]` holds the service domains an app is reached on. **`owner`** is the platform owner — `email` · `firstName` · `lastName` · `displayName`. Treat the email as load-bearing: the identity module seeds it as the owner's sign-in handle. Every recovery and step-up message goes there. It MUST be deliverable, on the organization's `emailDomain` or on a domain whose declaration carries MX (RD.SUPPORT.INFRA.093). **`network` carries two facts** (RD.SUPPORT.INFRA.100): `index`, the platform's slot in the address plan, appended forever; and `operatorCidrs`, the ranges an operator of this platform arrives from — admitted, never created. It sits on the platform because one organization may run several, and the answer does not change between an environment and its sibling. **declaration vs realization** — `resources` · `apps` · `modules` say what the platform *is*; `providers` say where it *runs*. `resources.platform` names the total four: database · cache · queue · storage — secrets never declared, every environment has one. Beside it `resources.spaces[]` holds per-need data worlds: `code` = published prefix · families each optional · db declares `schemas` `{name, dedicated}` rows and `users` `[{group, purposes, schemas}]` grants. `apps[]` rows sit at config level (`kindCode` — claim ∧ grant · `repo` · optional **`space`** and **`serviceDomain`** bindings, absent = platform resources and the platform domain · `deployments[]`). `environments[]` rows sit under `providers.cloud` (`setup` free text — nothing derives from it · `region` · `networkIndex` append-only · `workload` `PROD|NP` · `size` · `hosting` — `CLUSTER` refused under `PROD` · `deploy` trigger); an environment declares **neither `env` nor the provider's region string** (RD.SUPPORT.INFRA.098). `providers.local` mirrors the declaration **thing-first**: `domains` joined by code · `resources.platform` ports · `resources.spaces` and `modules` as **maps keyed by declared code**. Declare in arrays, realize in maps; an orphan key is a validate ERROR, and absent = derived. **One fact once**: realizations carry no `mtype` — the declared engine selects the realization schema.

**Every deployment declares four facts, and exposure is one of them** (RD.SUPPORT.INFRA.103). The base carries `mtype` (`API` · `WEB` · `PROCESSOR`), a mandatory `deploymentCode` — the token that distinguishes one deployment of an application from another in every name and every config path — `ns`, and `expose` (`PUBLIC` · `PRIVATE` · `INTERNAL`). The namespace is the **ceiling** rather than the source: a `plt` or `vnd` deployment claiming `PUBLIC` is refused at resolve, and a processor is refused anything but `INTERNAL`. An API adds `port` · `healthPort` · `websocket` · `size` · `subdomains`; a web deployment adds `port` (null where nothing listens) and `subdomains`. A publicly exposed web deployment is a bundle and stands no workload; a privately exposed one is a process and needs one.

A module row:

```jsonc
{ "code": "idp", "layer": "ENVIRONMENT", "after": "compute",
  "source": { "package": "./packages/infra-module-idp", "version": null },  // a locator — see below
  "hosting": null,                            // null = follow the environment; a pin needs both renderings
  "config": {} }                              // the module defines its variables; this row values them
```

## Locator rules

- **Every package reference is role-keyed `{ package, version }`, scoped.** `@saasplane/*` is what SaaS Plane ships; `@{org}/*` is the org's own.
- **`@`-prefixed = published; semver required.** Anything else is a **path** (a sibling in the estate repo, while iterating) — `version` is ignored and written `null`. There is no `file:` prefix, no environment-variable override, and no hand-copied package.
- References verify by type on fetch: the org's `blueprint` against `SUPPORT`, a `modules[].source` against `MODULE`. A fetched type contradicting its role key refuses before anything renders.
- **A path ref resolves only where the sibling checkout exists** — every machine in the standard workspace layout, and deliberately not CI. The day a pipeline needs the pin is the day it gets published. An apply fetches the published version and applies *that*, never a checkout.
- Scoped refs resolve **the org's registry pair → the machine store (`~/.spnutils/registry`), the resolve-side cache → refused by name**. The store answers a resolve, and `infra release --local` stages into it — a staged artifact is not a published one, and a version already present is refused in the store too.

## The artifact

`dist/` = `spinfrapkg.json` + `src/**`, nothing else — staged by the build, published whole. **Packing is structural, never declared**: what `src/` lacks, the artifact lacks. Documentation never ships, and **dist/ is never hand-edited** (the plugin's hook denies it).
