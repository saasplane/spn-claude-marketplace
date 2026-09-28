<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md", "seen": "ebb9e28f" },
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/05-test.md", "seen": "6cb0dbee" }
  ]
}
-->
---
name: verify
description: Run the estate's gates - spnutils infra validate for the build, spnutils infra test for the tiers a node's kind owes - stamp the rows a run proved, and say honestly what a green run proves. Use before asking for any review, after a scaffold or a declaration edit, and whenever a claim is made that an estate node is sound. Not for bringing a layer up (run skill) and not for judging a plan's contents (review skill).
---

# verify — validate the build, test the tiers, stamp what proved them

**Green before any review is asked for.** These two commands are the whole of the mechanical gate; everything they do not cover is a judgment call and belongs to the `review` skill.

## The loop

A node's behaviour rows open `PLANNED`. Proving one is not a separate errand from writing it:

1. **Write the row before the case.** A case with no row to cite proves nothing a reader can act on.
2. **One case line, or one `tofu test` run, per row — in the tier folder that owns it.** The folder says the tier; the file's kind says the engine. A `*.sh` case prints `ok <TIER> <ID> <title>` through `helpers/case.sh`; a `*.tftest.hcl` run is named for its id (`PLT_ZONE_01_<title>` proves `PLT.ZONE.01`).
3. **`spnutils infra test`** runs the node's build, then its cases, then its `*.tftest.hcl` files under `tofu test`, and writes `tests/.output/<tier>/spn-tests.json` per tier — one artifact, never a document a person edits by hand.
4. **The agent stamps the rows the run proved**, with the same writer and the same rules as an application's: a run speaks only for the tiers it ran, and a row marked `MANUAL` is never overwritten.
5. **`spnutils infra release`** refuses a node whose kind owes a tier with no case, or any case that fails. There is no flag that skips the harness.

## validate — the build, before any tier

```text
spnutils infra validate [repo|organization|platform|module] [--json]
```

The target is **the same selector `scaffold` takes**. `repo` reads the repository root itself. A type target — `organization`, `platform`, `module` — reads **every node of that type**. Omit the target to read every node the repository declares, which is what you want before a review.

This is the build, not a tier: it checks the tree against what the type prescribes, the manifest against the contract, `tofu fmt`/`validate` per rendering, and `docker compose config` where there is a local face. **It prints no case, and a failure here stops the run before any tier starts** — a node with no manifest identity has nothing yet for a case to prove. `--json` emits the validation State on stdout, for when a run has to be read by something other than a person.

## test — the tiers the node's kind owes

```text
spnutils infra test [package]
```

`package` is one node folder under `packages/`; omit it for every node. **A node owes the tiers its kind fixes, and no node chooses its own**:

| Kind | Owes | Because |
| --- | --- | --- |
| the blueprints (`SUPPORT`) | `UNIT` · `CONTRACT` · `INTEGRATION` | it derives, it declares an interface, and it renders |
| `ORGANIZATION` | `CONTRACT` · `INTEGRATION` | the ground and organization layers render its declaration from its own seat |
| `PLATFORM` | `CONTRACT` · `INTEGRATION` | the platform layer renders once, and the environment and deployments layers again per declared environment |
| `MODULE` | `CONTRACT` · `INTEGRATION` | identity alone, but the estate stands a seat for its world |

Every owed tier lives in its own folder under `tests/` — `contract/` · `unit/` · `integration/` — and `cloud/` is reserved, unwritten until the cloud tier lands. **The folder is the tier; the extension is the engine**: `*.sh` under `contract/` runs through bash; `*.test.mjs` under `unit/` runs under `node --test`; `*.tftest.hcl` under `unit/` or `integration/` plans under `tofu test`, mock providers only, plan-only, never an account. `integration/` also takes one `*.sh`, `acceptance.sh`, for the one render no test file can stage. A case sitting in the wrong folder, or written as the wrong kind of file, is refused at write time and at run time both — the full table is the foundation's `04-capabilities/02-support/02-infra/02-packages/02-tests.md`.

**A harness reports cases, never only an exit code.** `ok`, `not ok` or `skip`, per `<TIER> <BEHAVIOUR-ID> <title>` — a harness that prints no case line has proven nothing, whatever it exits. A `skip` line is recorded `PENDING`, and a tier whose only cases were skipped reads as *no cases*, never as a pass.

## What green proves, and what it does not

| A green run says | It does not say |
| --- | --- |
| `validate` — the tree matches its type, and the manifest matches its contract | the choices inside them are the right choices |
| `test` `CONTRACT` — the declared interface holds: a layer's shape, a declaration's shape, the names it publishes | that anything resolves |
| `test` `INTEGRATION` — a plan-only render under mock providers is what its consumer expected | that a real provider would accept the plan, or that anything was stood up |
| a stand-up (`run`'s `--apply`, never a tier a harness runs) | anything about a target it did not run against — a green local stand-up is evidence about a laptop, not a cloud |

**No gate here reaches an account.** Nothing in `validate` or `test` provisions, mutates or reads a provider. The first thing that touches a real target is an `--apply`, and the plan before it is the last cheap moment.

## The order

Scaffold or edit → write the row `PLANNED` → the case, in its tier folder → `spnutils infra validate` → `spnutils infra test` → rows stamped → `spnutils infra <layer> up --plan` → hand the plan to the `review` skill → `--apply` → `release`. A step skipped is a step somebody else pays for.

## Hand-off

`review` once there is a plan or a diff to judge; `implement` when validate reports a declaration that is wrong; `run` to plan or apply a layer; `release` when the node is proven and a version must publish.
