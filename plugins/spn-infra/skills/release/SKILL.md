---
name: release
description: Publishing an estate package - bump the version field in spinfrapkg.json by reviewed edit, run spnutils infra release, publish to the organization's registry pair or stage into the machine store with --local. Use when a package version must publish, when a consumer pin should flip to a published version, or when a bespoke build script or workflow needs repointing at infra release.
---

# release — bump by review, publish whole, to the org's registry pair

**A version is published once, then promoted.** The declaration gets the discipline an image already has: built once, promoted by name, recorded in resolved state.

## 1 · The bump is the reviewed act

Edit **`version`** in the node's `spinfrapkg.json` — semver, typed by a human, in a pull request. **Never a git tag.** An infra tree holds **no `package.json`** — nothing in one is a JavaScript package (RD.INFRA.066). `spinfrapkg.json` carries the name, the semver and the descriptive fields, and it is the only file a bump touches.

## 2 · Dry-run

```text
spnutils infra release -p <package> --dry-run
```

Validate, test, stage `dist/` = **`spinfrapkg.json` + `src/**`, whole — nothing else, nothing stamped**. `docs/`, `tests/` and `README.md` never ship — an artifact carries source alone. Confirm the staged set before approving.

## 3 · Publish — the target is chosen, never derived

```text
spnutils infra release -p <package> -y            # → the org's registry pair
spnutils infra release -p <package> --local -y    # → the machine store, staged only
```

- **The release target is the organization's `-public`/`-private` pair**, routed by the name's scope. Same as `apps release`. **`--local` stages into the machine store (`~/.spnutils/registry`) instead** — the target is a choice on the command, never derived from what happens to be bound.
- **A `--local` stage is not a publish.** The store is the resolve-side cache — where a fetched artifact is kept, and where an unbound workspace may stage its own. Never report a stage as a release, and never tell a consumer to pin against one.
- An **unlisted scope refuses by name** — `scopes` routes everything.
- A version **already present refuses** — immutability holds in the pair and in the cache alike. A fix is a new version, never a re-publish.
- Run it from a laptop while the estate is being built; **CI-only once the pipelines stand** — reached by grant withdrawal, not by rule.

## 4 · After — pins flip at their own pace

Consumers cite `{ package, version }` — the org's `blueprint` pin, a platform's `modules[].source` — and flip from path to pin per package, per the `declare` skill. An apply fetches the published version and applies *that*, never a checkout. `infra show` confirms PINNED @ version per layer.

## The line that holds

**Two builders never coexist.** Delete any bespoke build script or hand-rolled publish workflow the moment `infra release` serves a repo, and repoint the workflow **in the same change**. An interim builder left standing is a second source of dist truth.
