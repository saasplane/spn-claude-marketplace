---
name: verify
description: Prove SaaS Plane TS work is sound by running gates. Use when the ask names a target to run against - "verify this package", "verify the app", "clean reset and verify". Modes - package (conformance gates and tests, no running stack), app (health checks on what is running), reset (rebuild from a clean state, destructive). If the ask is a claim about what the code does rather than a target to run, hand to the check skill instead.
---

# verify — run the gates against a target

**First decide what was actually asked**, because developers say *verify* for two different jobs:

| The object is… | Then… |
| --- | --- |
| a statement that could be true or false — *"verify accounts have MFA in migrations"* | **hand to `check`.** It is an evidence question; running gates answers nothing |
| a target — *"verify this package"*, *"verify the app"*, *"clean reset and verify"* | this skill |
| unclear | ask which is wanted before running anything |

**Then decide the scope.** Every mode below is scoped to a project. When the ask does not name one and the workspace holds more than one, **ask: this app, this package, or all?** Never infer it from the last file edited or from what the branch changed — see the core plugin's `refs/commands.md`.

**Then pick the mode** — `package` | `app` | `reset`. `package` and `app` prove different things and neither substitutes for the other: `package` proves what was *written* conforms, `app` proves what is *running* works. Code green with a broken stack is a passing build of a broken product; a healthy stack with unvalidated code is a change nobody checked. After a change on a running stack, run `package` first, then `app`.

## Mode: package — conformance gates on what was written

No running stack required. Cheapest gate first, so a failure stops the run early:

1. **Codegen freshness** — regenerate what is derived, then prove nothing changed:
   - `spnutils apps gen-validators -p <pkg>` for every package with edited `contract/states/**`
   - `spnutils apps gen-barrel -p <pkg>` for every lib package that gained or lost files (never apps, never the API client, never the CLI)
   - then `git status --short` on the generated paths. **A diff here is the finding**: either generated output was hand-edited or a generator was never re-run. Both mean the committed artifact and its source disagree.
   - `spnutils apps gen-symbols` — **no `-p`** — sweeps every project in the workspace, the way `repo agent-sync` refreshes the merged index. Run it when you need the workspace's own packages to describe themselves *now*: generation is a release-time cost by design, so a package changed on this branch otherwise still advertises the surface it last released. It writes to `dist/` and is never committed, so there is no diff to check — the point is fresh context, not a gate.
2. **Description coverage** — the symbol indexes ARE the report. After the sweep above, read each `dist/generated/spn-symbols.json` and count symbols in the **required set** — `SERVICE`, `OPERATION`, `COMMAND`, `STATE`, `EVENT`, `ENUM`, `COMPONENT`, `HOOK`, `PAGE`, `CLI_COMMAND`, and every `ERROR` / `PERMISSION` member — whose `intent` is null. Each one is a published symbol an agent cannot select (the core plugin's `refs/intent.md` owns the rule). Report the count per package and name the worst offenders; a repo-wide sweep is one pass over files that already exist, so there is no reason to sample.

   **Count only what owns its meaning, or the number is worse than useless.** Three exclusions, each of them the rule rather than a convenience:

   - **`internal: true`** — not reachable by a consumer, so nothing selects it.
   - **A symbol whose owner is a `CONTROLLER`, `REPOSITORY` or `LISTENER`** — the artifact names members as `Owner.member`, so resolve each `OPERATION`'s owner and drop it if that owner is a transport adapter. The standard says never to describe one; a gate that demands it is asking for filler, and filler is worse than absence because it reads as information. In one real module this alone was 312 of 785 `OPERATION` rows.
   - **A generated package** — never hand-edited, and it inherits whatever its source document gave it.

   One thing this cannot see, and it must not be reported as clean: a **Command's members**. The artifact carries states by name, so member descriptions are checked in the source. They are also the highest-value descriptions in the repo — they become the input-field descriptions of every agent tool — so a package with described Commands and undescribed members is a worse result than the headline number suggests.
3. **Kind conformance** — `spnutils apps validate`. Walks every workspace project and reports where one disagrees with what its own declared kind requires: `UNDECLARED`, `NAMING`, `TOOLCHAIN`, `SCOPE`, `LAYER`, `FILE_NAMING`. Exits non-zero on findings, changes nothing on disk. Each message names the rule *and* the remedy — apply the remedy rather than inventing one.
4. **Build** — `pnpm nx run-many --target=build --all`, or the affected projects when the scope is narrower.
5. **Lint + format** — `npx eslint` on changed files, `npx prettier --check`.
6. **Tests** — `pnpm nx run-many --target=test --all`, or the owning project's suite.

**What the gates cover follows from the project's declared kind**, not from the repo it sits in:

| Kind | `package` mode covers |
| --- | --- |
| `SUPPORT_*` · `MODULE_SERVER` | validator + barrel freshness, `validate`, build, lint, unit tests |
| `MODULE_WEB` | barrel freshness, `validate`, build, lint, unit tests — e2e belongs to the app that mounts it |
| `APP_SERVER` | the above, plus migrations applying cleanly and the integration suite |
| `APP_WEB` | the above, plus the production build and e2e |
| `CLIENT_API` | regenerate from the live OpenAPI and diff — **a diff is the finding**, never a fix-up |
| `APP_UTILITY` | build, lint, tests |

Report per gate: the command run and its **actual output**. Report the test count, not just the color — a suite that silently stopped collecting is green. **Never report a gate you did not run**, and never infer one gate from another: a passing build says nothing about kind conformance.

> Every gate here is static. Passing all five means the code is *well-formed*, not that the feature *works* — that is mode `app`, and for anything user-visible it is the real exit criterion.

## Mode: app — health checks on what is running

Read the ports and hosts from the pinned platform declaration's `apps[]` row — never assume them.

1. **API up** — the service's OpenAPI endpoint returns 200. A 200 means boot, migrations, and module wiring all held.
2. **Infra layers** — `spnutils infra platform status` and `spnutils infra organization status` report healthy.
3. **Web apps respond** on their configured dev ports, or through the local proxy's vhosts.
4. **Login proof**, where the repo seeds credentials — authenticate a seeded principal through its own site host and assert the session comes back active.
5. **Exercise the changed flow end to end** through the real entry. Tests passing is not the exit criterion; the change working in the running app is.

Report per check: pass/fail with the observed evidence. Never report a check you did not run.

## Mode: reset — rebuild from a clean state

**What reset means depends on the kind, and for most projects it is not destructive at all.**

### A package — build and tests

For every kind except an app, there is no stack to tear down. Reset is `package` mode from a clean build: remove stale build output, rebuild, run the suite. Nothing is provisioned and nothing is wiped.

### An app, in a repo whose `sprepo.json` pins a platform — the full cycle

Destructive, and the local stack is frequently **shared**: `infra platform down --clean` wipes a database other work on the machine is using. **Run only on an explicit instruction, and only against a named target.**

1. **Regenerate and typecheck first** — never reset onto stale or broken code. Run the codegen verbs for everything touched on the branch, then build to green. A stale barrel or a type error means the reset boots broken code and the whole cycle is wasted. **A green build does not cover `tests/`** — `nx build` compiles `src` only, so typecheck each test sibling too (`tsc --noEmit --pretty false -p tsconfig.test.json`, and `tsconfig.integration.json` where present); see [implement/steps/test](../implement/steps/test.md#typechecking-the-tests-themselves).
2. **Stop what is running** — the app and any stale watch or dev-server processes holding its ports.
3. **Cycle the stack** — `spnutils infra app down` → `infra platform down --clean` → `infra platform up` → `infra app up`.
4. **Hosted-vendor modules cycle with the platform layer** — a vendor you run is a module row in the platform declaration, with no lifecycle of its own; its state is wiped only by the same explicit `--clean`, never as an inferred side step.
5. **Migrate** the clean database.
6. **Seed and test** — run the suite that seeds, then the integration suite, then any e2e on a **quiesced** stack. Do not run a reset, a build, or a re-provision concurrently with e2e; the resulting timeouts read as failures and are not.
7. **Finish** — stop what you started unless told to leave it running, and report the seeded credentials and the tally per suite.

A seed or template migration edit only lands on a clean re-migrate — a warm database keeps the old row, so a seed change tested against a warm stack proves nothing about a fresh one.

**The repo supplies the specifics.** Ports, app names, vendor stacks, seeded principals, and host names belong to the repo being reset and are documented in its own `CLAUDE.md`. This skill supplies the sequence; it never hardcodes one repo's instance of it.
