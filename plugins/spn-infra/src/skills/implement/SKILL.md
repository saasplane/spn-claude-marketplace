---
name: implement
description: Author an estate node - locate it, write the choices a person actually makes into its manifest, and build out a lifecycle module package end to end. Use when adding or changing an environment, an app grant row, a module row, a region, a schema, a size, a hosting or a deploy trigger; and when a platform needs a lifecycle plug-in - a vendor you run, a warehouse, a search engine, anything attached at a layer step. Not for scaffolding a node that does not exist yet (new skill), not for reading a plan back (review skill), and not for publishing (release skill).
---

# implement — locate the node, write the choices, build the module

**The estate declares; it never implements what it declares.** A change to what exists is an edit to a `src/spestate.json` (or a `spinfrapkg.json`), and the whole change must read back as the small set of choices it makes. Read `refs/support/infra/packages.md`, in this plugin, for the manifest shapes and the locator rules; `refs/support/infra/laws.md` for the lines no edit may cross; `refs/support/infra/modules.md` for what a module is and where it may attach.

## 1 · Locate the node

Find the node root by `spinfrapkg.json` and read the type from `src/spestate.json` — never infer it from the folder name. Organization-scoped choices (regions, packages, blueprint pin, org modules) belong to the `ORGANIZATION` node; platform-scoped ones (environments, apps, resources, platform modules) to the `PLATFORM` node. An edit landing in the wrong scope is the first finding.

## 2 · Edit — a person writes choices, and nothing else

| May be typed | Never typed |
| --- | --- |
| codes, regions, `networkIndex` values, environments, sizes, hosting, deploy triggers, schema rows, module rows, app grant rows, package refs, ports | derived names or addresses · discovered identifiers · secrets, ARNs, account ids · provider strings outside a cloud entry |

- **`src/spestate.json` opens on `type`**, with `config` discriminated by its `mtype`. **`spinfrapkg.json` names the publishable artifact** — `name` · `version` (the semver) · `description` · `author` · `license` — and an infra tree holds no `package.json` (RD.INFRA.066).
- **`networkIndex` is append-only, forever** — a freed index is never reused.
- A module row's `source` is a locator: a path while iterating (`version: null`), a scoped package + semver once published. Keep `hosting` `null` unless there is a real pin to make.
- **The `apps[]` rows are the cloud grant list** — deploy requires claim (`spkind.config.code`) ∧ grant (`kindCode`). Granting an app is a declaration change here, never anything in the app's own repo.
- `setup` is free text and **nothing derives from it** — never encode posture in a name; posture is `workload`.

The declaration change rides a pull request — **PRs plan, merges apply** (see `refs/support/infra/laws.md`, plan-is-the-review). Before asking anyone to look at it, run the `verify` skill, then present it with the `review` skill's one-line-per-choice form.

---

# Authoring a lifecycle module

**A module is a package attached to the layer lifecycle** — the estate's one extension point. It consumes only the outputs published at its named step, runs under that scope's credentials, and publishes into `/environments/{env}/modules/{code}/*` and the config plane. Its supply reaches apps as configured values, never as new vocabulary. The tri-law binds everything below (`refs/support/infra/laws.md` §6).

A vendor reached over the network is **not** a module — that is application configuration behind a support seam, and the estate never sees it.

## 3 · Name by purpose, scaffold

The code is a **purpose, never a product** — `idp`, not a vendor name — so swapping the product changes no consumer. Use the `new` skill: `spnutils infra scaffold module <code>`.

## 4 · The identity-only manifest

`src/spestate.json` is `{ "type": "MODULE", "config": null }`; `spinfrapkg.json` gives `name: "@{org}/infra-module-{code}"` with `version` the module's **semver**, plus `description` · `author` · `license` — and no `package.json` beside it (RD.INFRA.066). **Usage stays on the referencing `modules[]` row** — the module defines its variables; the declaring row values them. Nothing about a consumer ever enters the module.

## 5 · Renderings derive from the tree

`src/local/` (the compose rendering) first — local-first is the loop; `src/{cloud}/` where a cloud rendering ships, the code being the one the estate declares rather than one typed here. **A rendering absent is absent, not stubbed** — its folder's presence is exactly what the hosting-pin check reads. A module shipping one rendering runs that one; shipping both, it follows the environment unless its row pins one.

## 6 · Compose the library — never reimplement it

The baseline's machinery is exposed to renderings as identity-scoped functions; a module composes them and is as capable as a blueprint step:

| Function | Mints | The scoping |
| --- | --- | --- |
| `publishFact` | a `{SPC}_{CODE}_*` key in the globals | key composed from the caller's purpose code — off-grammar keys impossible |
| `mintDatabase` | `{spc}_{module}` owned by `{module}_adm` | the vendor-DB narrowing — never a platform schema |
| `registerHost` | `{env}-{purpose}.{spd}` / the local vhost | the DNS grammar, composed |
| `mintManagedResource` | full coordinates + the required tag set | detach = the reverse of the tagged footprint, data refused |

You never pass a key or a name — the library composes them. A module's workload lands in the `VND` namespace, internal only; modules are that namespace's only writers. **No function reaches platform ground** — a module that cannot live without changing platform ground is asking the blueprint for a capability, and that request travels as a declaration change.

## 7 · Wire the consuming row — path locator while iterating

On the consuming platform's `modules[]`: `code` · `layer` · `after` (a named step that publishes outputs) · `source: ./packages/infra-module-<code>` · `version: null` · `hosting: null` unless a real pin · `config` values. That edit is §1 and §2 above.

## 8 · Prove

```text
spnutils infra validate module        # tree to type, manifest to contract
spnutils infra test <package>         # the render harness — templates plan against fixtures
spnutils infra platform up --plan     # the rendering, locally
```

**A cloud plan refuses the path-resolved ref by name — that is the correct gate**, not a failure to fix around; it opens when the pin exists. See the `verify` skill for what each green run proves.

## 9 · Release, then flip the pin

Use the `release` skill (bump `version` in `spinfrapkg.json` → `spnutils infra release <package>`, to the org's registry pair). Then flip the consuming row: `source: "@{org}/infra-module-<code>"`, `version` a semver — and run `spnutils infra platform up --plan --cloud` to see the gate open. Refs flip at each consumer's own pace.

## Hand-off

`verify` to prove the edit; `review` when a plan output or a declaration diff needs a verdict; `release` when a package must publish; `new` when the change turned out to need a node that does not exist yet.
