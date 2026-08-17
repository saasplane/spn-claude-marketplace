---
name: release
description: Publishing an estate package - bump the release field in spinfrapkg.json by reviewed edit, run spnutils infra release, the target derives. Use when a package version must publish, when a consumer pin should flip to a published version, or when a bespoke build script or workflow needs repointing at infra release.
---

# release — bump by review, publish whole, target derives

**A version is published once, then promoted.** The declaration gets the discipline an image already has: built once, promoted by name, recorded in resolved state.

## 1 · The bump is the reviewed act

Edit `release` in the node's `spinfrapkg.json` — semver, typed by a human, in a pull request. **Never a git tag, never a stack file's version** — a `package.json`, where one exists, is inert metadata the release neither bumps nor reads.

## 2 · Dry-run

```text
spnutils infra release -p <package> --dry-run
```

Validate, test, stage `dist/` = **`spinfrapkg.json` + `src/**`, whole — nothing else, nothing stamped**. `docs/`, `tests/` and `README.md` never ship — an artifact carries source alone. Confirm the staged set before approving.

## 3 · Publish — the target is THE REGISTRY, never a flag

```text
spnutils infra release -p <package> -y
```

- The target **derives**: the org's `-public`/`-private` pair by the name's scope once the pairs stand; the machine store (`~/.spnutils/registry`) — the pair's local rendering — until then. Same verb, same dist.
- An **unlisted scope refuses by name** — `scopes` routes everything.
- A version **already present refuses, locally too** — immutability is the store's rule, not the provider's. A fix is a new version, never a re-publish.
- From a laptop while the estate is being built; **CI-only once the pipelines stand** — reached by grant withdrawal, not by rule.

## 4 · After — pins flip at their own pace

Consumers cite `{ package, version }` — the org's `blueprint` pin, a platform's `modules[].source` — and flip from path to pin per package, per the `declare` skill. An apply fetches the published version and applies *that*, never a checkout. `infra show` confirms PINNED @ version per layer.

## The line that holds

**Two builders never coexist.** The moment `infra release` serves a repo, any bespoke build script or hand-rolled publish workflow is deleted and the workflow repointed **in the same change** — an interim builder left standing is a second source of dist truth.
