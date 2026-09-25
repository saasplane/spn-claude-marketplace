---
name: verify
description: Run the estate's gates - spnutils infra validate for structure and manifest, spnutils infra test for the render harness - and say honestly what a green run proves. Use before asking for any review, after a scaffold or a declaration edit, and whenever a claim is made that an estate node is sound. Not for bringing a layer up (run skill) and not for judging a plan's contents (review skill).
---

# verify — validate the declaration, test the rendering

**Green before any review is asked for.** These two commands are the whole of the mechanical gate; everything they do not cover is a judgment call and belongs to the `review` skill.

## validate — structure against the type, manifest against the contract

```text
spnutils infra validate [repo|organization|platform|module] [--json]
```

The target is **the same selector `scaffold` takes**. `repo` reads the repository root itself. A type target — `organization`, `platform`, `module` — reads **every node of that type**. Omit the target to read every node the repository declares, which is what you want before a review.

It checks the tree against what the type prescribes and the manifest against the contract, and it runs fmt and validate per rendering. `--json` emits the validation State on stdout, for when a run has to be read by something other than a person.

## test — the render harness

```text
spnutils infra test [package]
```

Each node's `tests/run.sh`, where one exists; its exit code is the verdict. `package` is one node folder under `packages/`; omit it for every node. Templates plan against fixtures here — this is where a module's renderings are exercised without reaching an account.

**A node with no `tests/run.sh` is skipped, and a skip is not a pass.** `tests/` exists only where a render harness does, so a silent all-green across a repository may mean nothing ran. Read which nodes reported, not just the exit code.

## What green proves, and what it does not

| A green run says | It does not say |
| --- | --- |
| the tree matches its type, and the manifests match their contracts | the choices inside them are the right choices |
| every rendering formats and validates | the rendering produces the resources you intended — that is a plan, and the `review` skill judges it |
| the harness fixtures render | anything about a real account, a real region, or a real quota |
| the declaration is internally consistent | that the layer below exists — only a cloud plan refuses that, by name |

**No gate here reaches an account.** Nothing in `validate` or `test` provisions, mutates or reads a provider. The first thing that touches a real target is an `--apply`, and the plan before it is the last cheap moment.

## The order

Scaffold or edit → `spnutils infra validate` → `spnutils infra test` → `spnutils infra <layer> up --plan` → hand the plan to the `review` skill → `--apply`. A step skipped is a step somebody else pays for.

## Hand-off

`review` once there is a plan or a diff to judge; `implement` when validate reports a declaration that is wrong; `run` to plan or apply a layer; `release` when the node is proven and a version must publish.
