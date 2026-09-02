---
name: module-author
description: Authoring an estate module (infra-module-{code}) end to end - scaffold, renderings, path locator while iterating, prove, release, pin flip. Use when a platform needs a lifecycle plug-in - a vendor you run, a warehouse, a search engine, anything attached at a layer step. Not for vendors reached over the network (application configuration behind a support seam - the estate never sees them).
---

# module-author — the estate's one extension point

**A module is a package attached to the layer lifecycle.** It consumes only the outputs published at its named step, runs under that scope's credentials, and publishes into `/environments/{env}/modules/{code}/*` and the config plane. Its supply reaches apps as configured values, never as new vocabulary. The tri-law binds everything below (`refs/laws.md` §6).

## 1 · Name by purpose, scaffold

The code is a **purpose, never a product** — `idp`, not a vendor name — so swapping the product changes no consumer. The purpose lives in the package name and nowhere else.

```text
spnutils infra scaffold module --code <code>
```

## 2 · The identity-only manifest

`src/spestate.json` is `{ "type": "MODULE", "config": null }`; `spinfrapkg.json` gives `name: "@{org}/infra-module-{code}"` with `version` the module's **semver**, plus `description` · `author` · `license` — and no `package.json` beside it (RD.INFRA.066). **Usage stays on the referencing `modules[]` row** — the module defines its variables; the declaring row values them. Nothing about a consumer ever enters the module.

## 3 · Renderings derive from the tree

`src/local/` (the compose rendering) first — local-first is the loop; `src/aws/` where a cloud rendering ships. **A rendering absent is absent, not stubbed** — its folder's presence is exactly what the hosting-pin check reads. A module shipping one rendering runs that one; shipping both, it follows the environment unless its row pins one.

## 4 · Compose the library — never reimplement it

The baseline's machinery is exposed to renderings as identity-scoped functions; a module composes them and is as capable as a blueprint step:

| Function | Mints | The scoping |
| --- | --- | --- |
| `publishFact` | a `{SPC}_{CODE}_*` key in the globals | key composed from the caller's purpose code — off-grammar keys impossible |
| `mintDatabase` | `{spc}_{module}` owned by `{module}_adm` | the vendor-DB narrowing — never a platform schema |
| `registerHost` | `{env}-{purpose}.{spd}` / the local vhost | the DNS grammar, composed |
| `mintManagedResource` | full coordinates + the required tag set | detach = the reverse of the tagged footprint, data refused |

You never pass a key or a name — the library composes them. A module's workload lands in the `VND` namespace, internal only; modules are that namespace's only writers. **No function reaches platform ground** — a module that cannot live without changing platform ground is asking the blueprint for a capability, and that request travels as a declaration change.

## 5 · Wire the consuming row — path locator while iterating

On the consuming platform's `modules[]`: `code` · `layer` · `after` (a named step that publishes outputs) · `source: ./packages/infra-module-<code>` · `version: null` · `hosting: null` unless a real pin · `config` values. Use the `declare` skill for this edit.

## 6 · Prove

Run `spnutils infra validate -p` (tree to type, manifest to contract) → `infra test -p` (the render harness — templates plan against fixtures) → `infra platform plan` locally. **`--cloud` refuses the path-resolved ref by name — that is the correct gate**, not a failure to fix around; it opens when the pin exists.

## 7 · Release, then flip the pin

Use the `release` skill (bump `version` in `spinfrapkg.json` → `infra release`, to the org's registry pair). Then flip the consuming row: `source: "@{org}/infra-module-<code>"`, `version` a semver — and run `infra platform plan --cloud` to see the gate open. Refs flip at each consumer's own pace.
