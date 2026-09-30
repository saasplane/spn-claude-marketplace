<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "efbbe76f"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/04-develop.md",
      "seen": "d3d654ab"
    }
  ]
}
-->
---
name: run
description: Start a SaaS Plane TS platform locally or run its test suites. Use when the user asks to run, start, bring up, or boot the platform, an app, or the local stack (mode local - start only, no tests), or to run tests (mode tests). Not for health verification or resets - that is the `verify` skill.
---

# run — local stack and test suites

**Read `refs/devex/workspace/workstream.md` (spn-devex) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

Pick the mode (`local` | `tests`). pnpm only — never npm/yarn. All infra goes through `spnutils infra`, driven by the platform declaration that `sprepo.json` pins and each app's row in it — never hand-rolled docker.

## The form — read this before you type a command

**A TS repo declares what it can do. Ask it, then run what it declared.**

```bash
npx nx run <project>:<target>              # one project
npx nx run-many -t <target> -p '<pattern>' # many, in dependency order, cached
npx nx run-many -t <target> --all          # every project that has the target
npx nx show project <project> --json       # WHAT CAN I RUN HERE — ask, never guess
npx nx show projects                       # every project name in the repo
```

**Never hand-roll what a target already names.** Not `pnpm --filter x dev`, not
`cd apps/x && pnpm y`, not a bare `npx jest`, `npx eslint`, `npx vitest` or `tsx src/index.ts`.
Each one opts out of the dependency graph and the cache that `nx.json` declares in
`targetDefaults`. Each one also drifts from the repo the day somebody edits a script.

**A target `run-many` skips is a target that project does not have.** That is information, not a
failure — a `MODULE_SERVER` has no `start` because it serves nothing, and a node has no
`test:journey` unless it carries journey cases.

**A script whose body is `pnpm --filter <other> run <target>` is a defect, not a shortcut.** It is a
second name for a target that already exists, it hides which project does the work, and it is the
shape an agent copies next. Call the owning project's target.

## A SCRIPT and a TARGET are different things, and this is where people trip

**A node declares one script per command, and nx carries a target per tier.** Both are real and they
are not duplicates of each other (`RD.SUPPORT.APPS.118`, and `Q95` = B):

```bash
pnpm test unit                     # the SCRIPT — one command, the tier as its argument
npx nx run <project>:test:unit     # the TARGET — inferred from what the node IS
```

**Why the targets stay per tier when the scripts do not.** nx declares `cache` on a TARGET, and
`configurations` carry option sets alone — so a single `test` target would force one cache policy
across every tier. The unit tier is cacheable and the four that need a running stack are not. Get
that wrong either way and it costs: a cached journey run reports a stack it never touched, and an
uncached unit tier is paid for on every commit of every day.

**The targets are inferred, so no node declares them.** A node gains a tier by carrying a case for
it, or by being a kind that owes it — never by somebody remembering a line. So
`npx nx show project <p> --json` is the only honest answer to *what can I run here*; a
`package.json` no longer lists the tiers.

## The commands, and what carries each

**A command exists where a fact the kind already declares says it does.** That is the rule; the table
below is what it produces today, and a kind added later needs no row of its own.

| Command | Carried by | The variant, as an argument |
| --- | --- | --- |
| `build` | every kind | `pnpm build test` — the bundle a browser tier drives, in development mode |
| `check` · `format` | every kind | — |
| `test` | every kind | `pnpm test unit` · `contract` · `journey` · `component` · `integration` |
| `clean` | every kind | — |
| `release` | what publishes | **the repository's, never a node's** — `-p` is refused (`RD.SUPPORT.APPS.034`) |
| `dev` · `start` · `stop` | what publishes nothing | `pnpm dev --mode API` on a kind that declares modes |
| `migrate` | what owns a schema | `pnpm migrate up` · `down` · `list` · `pending` · `status` · `generate` |
| `codegen` | `CLIENT_API` | `pnpm codegen api-client` |

**`lint`, `prettier`, `test:<tier>`, `build:test`, `preview` and `release:verified` are retired
spellings.** `lint` and `prettier` were second names for `check` and `format`; `preview` was `start`
under another name; the rest spelled a variant as a command. A node still carrying one has not been
swept yet — read it as drift, not as a target to use.

### Two things the word *mode* means, and they are unrelated

| | Means |
| --- | --- |
| `--mode` on `build` | the build FLAVOUR, realized per bundler — vite takes `--mode development`, storybook takes `--test`, and a server app has no bundler so it takes neither |
| `--mode` on `dev` · `start` | the SERVING mode — `ALL · API · QUEUE`, and only where the kind declares them. `spn-dev` refuses the flag by name on a kind that declares none |

**`dist/spn-build.json` says which flavour the folder holds**, so a browser tier can tell a
development bundle from a production one instead of guessing.

### What a browser tier needs standing up

| Target | What it does |
| --- | --- |
| `pnpm build test` | the bundle a browser suite drives, in development mode against the local env |
| `pnpm start` | serves what `build` produced, on the port the estate's vhost proxies to |
| `test:component` | Playwright component tests, where only paint can show the claim. **Check it runs before trusting it** — a package can carry written cases that collect zero tests. This tier sits on `@playwright/experimental-ct-react`, which upstream **froze at Playwright 1.63**: still published, still installable, no longer developed. Two constraints follow. The CT package version must match the `playwright` runner version exactly, and browser binaries are per-version, so a runner bump needs `npx playwright install`. The build cache is cleared first, because it is keyed by file name and survives a rename |

## The recipes you will actually type

| You want to | Command |
| --- | --- |
| see what a project can do | `npx nx show project <p> --json` |
| start the service | `npx nx run <service>:dev` |
| migrate a fresh schema | `pnpm --filter <service> migrate up` |
| start one web app | `npx nx run <web>:dev` |
| **prepare a browser run** | `npx nx run-many -t build -p 'web-*'` then `pnpm --filter <web> build test` for the one under test |
| **serve it** | `npx nx run-many -t start -p 'web-*'` |
| unit tests, one project | `npx nx run <p>:test:unit` |
| unit tests, everywhere | `npx nx run-many -t test:unit --all` |
| check everything | `npx nx run-many -t check --all` |
| the contract suite | `npx nx run <client>:test:contract` |
| rebuild after a contract change | `pnpm --filter <client> codegen api-client` then `npx nx run-many -t build --all` |

## The four things nx does not own

**Typecheck of a suite.** The `typecheck` target compiles `src`. A suite has its own config, and
**those configs are PER PROJECT — there is none at the workspace root.** Point `-p` at the project
you mean:

```bash
npx tsc --noEmit --pretty false -p <project>/tsconfig.test.json         # unit
npx tsc --noEmit --pretty false -p <project>/tsconfig.integration.json  # component / e2e, where present
```

Most projects carry `tsconfig.test.json`; only the ones with a component or e2e tier carry
`tsconfig.integration.json`. Running either from the root without a path fails with `TS5058: the
specified path does not exist`, which reads as a broken command rather than a missing argument.

## After a run: the rows say what it found

Every run is named by its caller, and leaves `tests/.output/<tier>/runs/<run>.json` behind — or `<run>.<phase>.json` for a journey phase — with every behaviour id its case titles carried, and what the runner actually did with each. **`spnutils` writes the run file and never a row** (`RD.DEVEX.UTILS.071`). Writing it into the registers is the **spn-devex** plugin's row writer, `spn-devex behaviours stamp <run> <repo>` in that plugin (cross-plugin pointer; it ships alongside this plugin), run the way its `test` skill runs it: first without `--write` to see what it would change, then with it. It reads only the run you name, and writes `Updated at` as `<time> · <run>`. The same plugin's `spn-devex behaviours check` then refuses a `SUCCESS` row the run it cites contradicts.

The join is this plugin's, because where a case lives is the stack's:

```bash
node "${CLAUDE_PLUGIN_ROOT}"/scripts/checks/behaviour-join.ts .      # a SUCCESS row no case cites, a case citing no row
```

**Code coverage is read, never enforced** (`RD.SUPPORT.APPS.133`). A run that collects coverage prints its summary after the tests — lines, statements, functions and branches — and the test tool writes `coverage-summary.json` beside its report. Report those numbers as they are. No configuration carries a threshold, and nothing fails a run on a percentage. The one rule about coverage you check is that every exclude says why:

```bash
node "${CLAUDE_PLUGIN_ROOT}"/dist/cli.mjs coverage check <project>   # an exclude with no comment giving its reason
```

**Pass `--reach repository` only when the run you name IS the whole of the tiers it names** — a full run of every node that owes them, under one name. Without it, a row the run did not mention is left exactly as it was. With it, such a row goes back to `PLANNED`, which is right after a complete run and wrong after a single node's: runs are per node and a register is per repository, so one node's journey run would otherwise reset another's rows.

| It writes | It never writes |
| --- | --- |
| `Status` and `Updated at`, from the run | `Type` and `Tier` — decisions a person makes, which the run reads |
| `SUCCESS` · `FAILED` · `PENDING` | `MANUAL` — the one intent no evidence can recover |

A hand edit to `Status` or `Updated at` is a claim rather than a finding, and the next run overwrites it. **Never edit those two cells by hand** — if a row is wrong, the case that proves it is what to change.

**One file out of a suite.** The target runs the whole tier. To narrow, pass the argument THROUGH
it rather than going under it — everything after `--` reaches the runner:

```bash
npx nx run <project>:test:unit --run <run> -- <file>          # one unit file
npx nx run <project>:test:integration --run <run> -- <file>   # one integration file
npx nx run <project>:test:unit --run <run> -- --listTests     # what would run, without running it
```

**The integration config is `jest.config.integration.cjs`, never `.ts`** — you only meet the name
if you bypass the target, and reaching for `.ts` is the natural guess. It fails describing a
module rather than a missing file, so you go looking at your jest setup instead of at the
extension. Passing through the target is why you never have to know this.

**The browser suite runs in three steps, in this order:** build the test bundle, serve it, then run
the journey tier against what is served.

```bash
pnpm build test                                          # 1. the bundle a browser drives, in development mode
pnpm start                                               # 2. serve what the build produced
spnutils apps test journey <run> <node>                        # 3. the sweep, the default phase
spnutils apps test journey <run> <node> --phase serialized     #    the cases that flip a global or a session, one worker
spnutils apps test journey <run> <node> --phase window         #    the cases that wait out a window, one worker
pnpm test journey <run> -- --max-failures=5                    # in the node, while diagnosing — a failing case pays its whole timeout
```

**A phase is an argument, never a file.** A node carries one journey configuration, and `--phase`
sets `SPN_TEST_PHASE` for it; naming no phase runs the sweep. Give every phase the same run name:
each writes its own `<run>.<phase>.json`, and the stamp reads them all. The command runs the configuration
beside the node, or else the one at the repository root. Everything after `--` reaches Playwright
untouched when you run `spn-test` through the node's own script; `spnutils apps test` does not pass it on yet.

**Whole-repo runs.** `pnpm test:all` is the root script that runs every tier each node owes or
carries, across the repository.

**Infrastructure.** Every layer goes through `spnutils infra`, never hand-rolled docker.

## Three rules that cost a session each

**`dev` and `preview` are alternatives, never concurrent.** `dev` compiles a route inside the
request, which a browser suite reads as a 45-second timeout rather than as a compile. Journeys run
against `start`, which serves the built bundle.

**`build test`, never `build`, before a browser suite.** Test attributes are gated on
`isTestDataDebug`, set from `VITE_TEST_DATA_DEBUG`; a build without it emits no `data-testid` and every
selector times out. The suite refuses such a build and names the variable — believe it the first time.

**A rebuild that reports success may have rebuilt nothing.** A cached `build test` prints
*"successfully ran"* while leaving `dist` untouched — measured with timestamps 46 minutes stale and
identical hashes. Before a sweep that must see your change, capture the served bundle name, rebuild
with the cache skipped, and check three things: the hash moved, the marker is present, and what the
host serves matches what is on disk. **`dist/spn-build.json` names the flavour and the instant**, so
a stale folder is readable rather than inferred. The server needs no restart — it serves `dist` per
request.

**Serve every app before a sweep, not just the one under test.** Signing in leaves for the hub, so
an unserved `identity` makes nginx answer **502** and the login form never renders — which reads as
broken auth. Measured: with one app served, 94 of 95 cases did not run. The snapshot tells you which:
`502 Bad Gateway` means nothing is behind that host; `Welcome back` is a handoff timeout; a blank page
means a build value was missing and threw at boot, naming the key.


## Mode: local — start the platform stack (start only, no tests)

1. **Organization layer** (once per machine — skip if already up): `spnutils infra organization up --apply` — the machine's trust bootstrap: the local certificate authority, its one trust prompt, the shared ingress. The organization layer takes no `<spc>`, because a repository has at most one organization.
2. **Platform layer**: `spnutils infra platform up <spc> --apply` — this platform's container group (database, cache, queue, and each installed module's local rendering) from the pinned declaration. `<spc>` is the platform code `sprepo.json` pins, and a different one is refused (`RD.DEVEX.UTILS.072`). Check with `spnutils infra platform status <spc>`.
3. **App layer** (per app, if not yet registered): `spnutils infra app up <app>` — schemas, per-schema roles, local TLS certificate, hosts entry, ingress vhost. No containers of its own.
4. **Hosted-vendor modules** need no step of their own — a vendor you run is a module row in the platform declaration, and its local rendering comes up with the platform layer. There is no vendor command.
5. **Start the service app**: `npx nx run <service>:dev`. It loads `local.env`, and its port and API-docs path come from the repo's own app env — read them rather than assume. On a fresh schema run `pnpm --filter <service> migrate up` first; it needs the platform-owner env variables sourced.
6. **Start web apps** as needed: `npx nx run-many -t dev -p '<pattern>'`, on the ports each app declares in its own manifest. For a browser suite run `start` instead, over a `build test` bundle — never `dev`.

Stop here — this mode starts things; it does not test or verify them. Hand off to the `verify` skill for health checks. Report what is up and on which ports/hosts.

Notes: `spnutils infra platform down <spc> --apply --clean` **wipes the shared local DB**. Never run it in this mode — that belongs to the reset macro in the `verify` skill, on explicit command only. Logs: `spnutils infra logs <spc> [service]`. To route one more host to a registered app, `spnutils infra domain register <spc> <host> --app <kind code>` — the app's port comes from its registration.

## Mode: tests

Typecheck first, then the suites — a type error makes every later result noise:

```bash
npx nx run-many -t build -p '<touched>'   # the service for BE, ui packages / web apps for FE
npx nx run-many -t test:unit --all --run <run>   # every unit suite, under one run name
```

**BE contract** (drives the running service through the API client):

1. Service up with migrations applied (mode local, steps 1-5).
2. If the contract changed since the client was generated: regenerate the client from the live service first.
3. `npx nx run <client>:test:contract --run <run>` — the target already carries `jest.config.contract.cjs` and `--runInBand`, and it fails when the service is unreachable, naming the command that starts it.

**FE journeys**: `pnpm build test` → `pnpm start` → `spnutils apps test journey <run> <node>`, then `--phase serialized` and `--phase window` under the same run name where the node carries those cases — after the BE suite, on a quiesced stack (no concurrent resets/builds), with the stack seeded.

Codegen freshness comes before any suite. Run `spnutils apps gen-validators <pkg>` for packages with edited `contract/states/**`. Run `spnutils apps gen-barrel <pkg>` for lib packages that gained/lost files — never apps, never the API client.

Report per-suite results honestly — a suite you did not run is "not run", never assumed green. Test-state hygiene rules: the `implement` skill steps/test.md.
