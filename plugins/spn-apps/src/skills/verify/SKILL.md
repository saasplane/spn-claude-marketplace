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

**`package` mode proves what a project can prove ALONE.** It runs the gates and the tiers that need no wired stack — codegen freshness, validation, build, check, and the `unit/` and `component/` suites. It does **not** run `integration/` or a journey: those need real resources or a real browser against a running platform, so they belong to `app` mode. A `package` pass is therefore not a claim that the thing works wired, and reporting it as one is the false green this mode exists to avoid.

No running stack required. Run the cheapest gate first, so a failure stops the run early:

1. **Codegen freshness** — regenerate what is derived, then prove nothing changed:
   - `spnutils apps gen-validators <pkg>` for every package with edited `contract/states/**`
   - `spnutils apps gen-barrel <pkg>` for every lib package that gained or lost files (never apps, never the API client, never the CLI)
   - then `git status --short` on the generated paths. **A diff here is the finding**: either generated output was hand-edited or a generator was never re-run. Both mean the committed artifact and its source disagree.
   - `spnutils apps gen-symbols` — **no `-p`** — sweeps every project in the workspace, the way `repo agent-sync` refreshes the merged index. Run it when you need the workspace's own packages to describe themselves *now*. Generation is a release-time cost by design, so a package changed on this branch otherwise still advertises the surface it last released. It writes to `dist/` and is never committed, so there is no diff to check — the point is fresh context, not a gate.
2. **Description coverage** — the symbol indexes ARE the report. After the sweep above, read each `dist/generated/spn-symbols.json`. Count the symbols in the **required set** whose `intent` is null. That set is `SERVICE`, `OPERATION`, `COMMAND`, `STATE`, `EVENT`, `ENUM`, `COMPONENT`, `HOOK`, `PAGE`, `CLI_COMMAND`, and every `ERROR` / `PERMISSION` member. Each one is a published symbol an agent cannot select (the core plugin's `refs/intent.md` owns the rule). Report the count per package and name the worst offenders; a repo-wide sweep is one pass over files that already exist, so there is no reason to sample.

   **Count only what owns its meaning, or the number is worse than useless.** Three exclusions, each of them the rule rather than a convenience:

   - **`internal: true`** — not reachable by a consumer, so nothing selects it.
   - **A symbol whose owner is a `CONTROLLER`, `REPOSITORY` or `LISTENER`.** The artifact names members as `Owner.member`, so resolve each `OPERATION`'s owner and drop it if that owner is a transport adapter. The standard says never to describe one; a gate that demands it is asking for filler, and filler is worse than absence because it reads as information. In one real module this alone was 312 of 785 `OPERATION` rows.
   - **A generated package** — never hand-edited, and it inherits whatever its source document gave it.

   One thing this cannot see, and it must not be reported as clean: a **Command's members**. The artifact carries states by name, so member descriptions are checked in the source. They are also the highest-value descriptions in the repo, because they become the input-field descriptions of every agent tool. So a package with described Commands and undescribed members is a worse result than the headline number suggests.
3. **Kind conformance** — `spnutils apps validate`. Walks every workspace project and reports where one disagrees with what its own declared kind requires: `UNDECLARED`, `NAMING`, `TOOLCHAIN`, `SCOPE`, `LAYER`, `FILE_NAMING`. Exits non-zero on findings, changes nothing on disk. Each message names the rule *and* the remedy — apply the remedy rather than inventing one.
4. **Action coverage** — `node "${CLAUDE_PLUGIN_ROOT}"/hooks/tools/action-coverage.ts`. Reads every `@SPAPIRouteCommand` the repository publishes and every behaviour row it declares, and names each action that moves an entity between states which no row claims. Exits non-zero on one, changes nothing on disk; pass `--report` to see the same list without the gate.

   **An unclaimed action is a missing ROW, not a missing test.** It is an interaction somebody can perform and no document says who may perform it — so writing a case would be proving something nobody has agreed to. Send the finding to whoever owns the register, not to whoever owns the suite.

   It also prints each entity's action shape, where a dash is an action the API deliberately does not publish. **A dash owes a `NEGATIVE` row saying so**, in the same grammar as the `POSITIVE` one beside it; without one, nothing distinguishes *this cannot be created, by design* from *nobody has built create yet*.

   **It reads a register by its eight headings** — `Id · Who · Does · Sees · Type · Tier · Status · Updated at`. A repository whose rows do not yet carry that grammar has no register for it to read, and it says so in as many words rather than reporting every action as uncovered.
5. **Build** — `npx nx run-many -t build --all`, or `-p '<pattern>'` when the scope is narrower.
6. **Check + format** — `npx nx run-many -t check --all`, or `-p '<pattern>'`. The command is `check`:
   `lint` and `prettier` were second names for it and are retired (`RD.APPS.118`). It runs the
   project's own typecheck and ESLint together, so neither is inferred from the other.
7. **Tests** — `npx nx run-many -t test:unit --all`, and `test:component` where a kind carries it.
   **The tier is named, never aggregated**: there is no `test` target, because one word covering
   every tier meant the unit tier for seven kinds and the component tier for a web application. The
   per-tier targets are INFERRED from what a node is, so `npx nx show project <p> --json` is what
   says which a node has. **A red sends you to the failure's own artifact first, never to the source** — the error context the runner wrote, and the service log beside it. Then fix by shape rather than one instance at a time; see [implement/steps/test](../implement/steps/test.md#before-you-write-or-fix-a-case).

**What the gates cover follows from the project's declared kind**, not from the repo it sits in:

| Kind | `package` mode covers |
| --- | --- |
| `SUPPORT_*` · `MODULE_SERVER` | validator + barrel freshness, `validate`, build, check, unit tests |
| `MODULE_WEB` | barrel freshness, `validate`, build, check, unit tests — e2e belongs to the app that mounts it |
| `APP_SERVER` | the above, plus migrations applying cleanly and the integration suite |
| `APP_WEB` | the above, plus the production build and e2e |
| `CLIENT_API` | regenerate from the live OpenAPI and diff — **a diff is the finding**, never a fix-up |
| `APP_UTILITY` | build, check, tests |

Report per gate: the command run and its **actual output**. Report the test count, not just the color — a suite that silently stopped collecting is green. **Never report a gate you did not run**, and never infer one gate from another: a passing build says nothing about kind conformance.

> Every gate here is static. Passing all seven means the code is *well-formed*, not that the feature *works* — that is mode `app`, and for anything user-visible it is the real exit criterion.

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

1. **Regenerate and typecheck first** — never reset onto stale or broken code. Run the codegen commands for everything touched on the branch, then build to green. A stale barrel or a type error means the reset boots broken code and the whole cycle is wasted. **A green build does not cover `tests/`** — `nx build` compiles `src` only, so typecheck each test sibling too (`tsc --noEmit --pretty false -p tsconfig.test.json`, and `tsconfig.integration.json` where present); see [implement/steps/test](../implement/steps/test.md#typechecking-the-tests-themselves).
2. **Stop what is running** — the app and any stale watch or dev-server processes holding its ports.
3. **Cycle the stack** — `spnutils infra app down` → `infra platform down --clean` → `infra platform up` → `infra app up`.
4. **Hosted-vendor modules cycle with the platform layer.** A vendor you run is a module row in the platform declaration, with no lifecycle of its own. Its state is wiped only by the same explicit `--clean`, never as an inferred side step.
5. **Migrate** the clean database.
6. **Seed and test** — run the suite that seeds, then the integration suite, then any e2e on a **quiesced** stack. Do not run a reset, a build, or a re-provision concurrently with e2e; the resulting timeouts read as failures and are not.
7. **Write back what the run proved** — a full run is the one moment the documents can be brought current, so do it here and not by hand.
   - `node "${CLAUDE_PLUGIN_ROOT}"/hooks/tools/behaviour-rows.ts --write --reach repository` writes `Status` and `Updated at` into every behaviour row the run's ids resolve to. **`--reach repository` is the caller saying these artifacts are the whole of these tiers**, which is true after a full run and false after any narrower one — it sends a row nothing cited back to `PLANNED`, so on a partial run it erases evidence that was true. Run it without the flag when you ran less than everything.
   - **Run the tiers through `spnutils apps test <tier>`.** Where a repository still consumes a published toolchain older than the derived-artifact change, any other door runs the suite and writes nothing — and with `--reach repository` set, that silence resets rows the run actually proved.
   - **Then produce the pages whose behaviours moved**: the `spn-devex:check` skill, asking it to produce the matching `02-constructs` seat page. A construct page joins its behaviours from the register, so writing statuses makes every page for a changed construct stale, and `docs.ts audit` reds until they are produced again.
   - **Last, the report** — the `TRACEABILITY_MATRIX` template through the `spn-devex:report` skill, into `docs/artifacts/reports/`. It is written by you from what you just read, never by a tool, and it names which tiers the run spoke for.
8. **Finish** — stop what you started unless told to leave it running, and report the seeded credentials and the tally per suite.

A seed or template migration edit only lands on a clean re-migrate. A warm database keeps the old row, so a seed change tested against a warm stack proves nothing about a fresh one.

**The repo supplies the specifics.** Read ports, app names, vendor stacks, seeded principals, and host names from the repo being reset — its own `CLAUDE.md` documents them. This skill supplies the sequence; it never hardcodes one repo's instance of it.
