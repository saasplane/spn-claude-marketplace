---
name: declare
description: The declare verb for SaaS Plane estate repos - a change to what the estate IS, done as a manifest edit, validated, and reviewed as a one-line-per-choice diff. Use when adding or changing an environment, an app grant row, a module row, a region, a schema, a size, a hosting or a deploy trigger. Not for authoring a new module package (module-author skill) and not for publishing (release skill).
---

# declare — edit the manifest, validate, review the choices

**The estate declares; it never implements.** A change to what exists is an edit to a `src/spestate.json` (or a `spinfrapkg.json`), and the whole change is reviewable as the small set of choices it makes. Read `refs/manifests.md` for the shapes and `refs/laws.md` for the lines no edit may cross.

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

## 3 · Validate

```text
spnutils infra validate -p <package>
```

Structure against the type, manifest against the contract, fmt and validate per rendering. Green before any review is asked for.

## 4 · Review as a one-line-per-choice diff

Present the change as **one line per choice** — what was chosen, at which scope, and what will derive from it:

```text
+ environment in-stg (region in, NP, size XS, CLUSTER, deploys from branch develop)
    → derives network spn-dmo-in-stg, namespaces in-stg-*, records in-stg-*.internal.spndemo.app
+ app grant splt: API (PRD, 9120) + PROCESSOR (PRD)
```

Never present a raw JSON dump as the review, and never bury a choice inside a reformat. The declaration change rides a pull request — **PRs plan, merges apply** (see `refs/laws.md`, plan-is-the-review).

## Hand-off

`plan-review` when the plan output needs a verdict; `release` when a package must publish; `module-author` when the change turned out to need a new module package.
