---
name: run
description: Start a SaaS Plane TS platform locally or run its test suites. Use when the user asks to run, start, bring up, or boot the platform, an app, or the local stack (mode local - start only, no tests), or to run tests (mode tests). Not for health verification or resets - that is the `verify` skill.
---

# run — local stack and test suites

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
failure — a `MODULE_SERVER` has no `preview` because it serves nothing.

**A script whose body is `pnpm --filter <other> run <target>` is a defect, not a shortcut.** It is a
second name for a target that already exists, it hides which project does the work, and it is the
shape an agent copies next. Call the owning project's target.

## Every target, by the kind that carries it

**Common to every kind**

| Target | What it does | Notes |
| --- | --- | --- |
| `build` | the production bundle | **cached**, and `dependsOn: ['^build']` |
| `test` | that project's own suite | Jest on a server kind, Vitest on a web kind |
| `lint` | ESLint | **cached** |
| `format` | Prettier write | `lint:fix` and `prettier:fix` exist on package kinds |
| `typecheck` | `tsc --build --emitDeclarationOnly` | **live on every kind except `APP_WEB`**, where it is disabled because project references set `noEmit` — that kind uses `vite:typecheck` |

**`APP_SERVER` — the service**

| Target | What it does |
| --- | --- |
| `dev` | every entry at once (`APP_MODE=ALL`) |
| `dev:api` · `dev:queue` | one entry only, when you want to isolate a face |
| `start` · `start:api` · `start:queue` | the built bundle rather than the watcher |
| `migrate:up` · `migrate:down` | apply, roll back |
| `migrate:status` · `migrate:pending` · `migrate:list` | what has run, what has not |
| `migrate:generate` | a new migration file |

**`APP_WEB` — a web app**

| Target | What it does |
| --- | --- |
| `dev` | vite dev server — **compiles a route inside the request** |
| `build:test` | the bundle a browser suite needs, with `isDebug` on and `data-testid` emitted |
| `preview` | serves what `build` or `build:test` produced |
| `serve` · `serve-static` | the nx-native equivalents |
| `build-deps` · `watch-deps` | build or watch this app's workspace dependencies |
| `vite:typecheck` | `tsc --noEmit -p tsconfig.json` — narrower than the two forms below |

**`CLIENT_API` — the generated client**

| Target | What it does |
| --- | --- |
| `generate` | regenerate from the OpenAPI document |
| `test:integration` | **the contract tier** — drives a live service, `--runInBand` |
| `test:integration:dev` | the same, tolerating a stack that is down |
| `release:verified` | integration suite, then build, then publish |

**`MODULE_WEB` — a web module**

| Target | What it does |
| --- | --- |
| `test:ct` | Playwright component tests, where only paint can show the claim |
| `dev` · `preview` · `serve` | its own harness, not an app |

**`MODULE_SERVER` · `SUPPORT_*` — packages**

| Target | What it does |
| --- | --- |
| `test:integration` | where the package declares one |
| `prerelease` · `postbuild` · `postrelease` | the release lifecycle, run by `release` |

## The recipes you will actually type

| You want to | Command |
| --- | --- |
| see what a project can do | `npx nx show project <p> --json` |
| start the service | `npx nx run <service>:dev` |
| migrate a fresh schema | `npx nx run <service>:migrate:up` |
| start one web app | `npx nx run <web>:dev` |
| **prepare a browser run** | `npx nx run-many -t build:test -p 'web-*'` |
| **serve it** | `npx nx run-many -t preview -p 'web-*'` |
| unit tests, one project | `npx nx run <p>:test` |
| unit tests, everywhere | `npx nx run-many -t test --all` |
| lint everything | `npx nx run-many -t lint --all` |
| the contract suite | `npx nx run <client>:test:integration` |
| rebuild after a contract change | `npx nx run <client>:generate` then `npx nx run-many -t build --all` |

## The four things nx does not own

**Typecheck.** The `typecheck` target is disabled on purpose, because project references set
`noEmit`. Run these directly:

```bash
npx tsc --noEmit --pretty false -p tsconfig.test.json          # unit
npx tsc --noEmit --pretty false -p tsconfig.integration.json   # component / e2e, where present
```

**The browser suite.** The workspace root is not an nx project, so Playwright stays a root script:

```bash
pnpm test:e2e                     # the whole sweep
pnpm test:e2e -- --max-failures=5 # while diagnosing — a failing case pays its whole timeout
pnpm test:e2e:report              # the last run's report
```

**Whole-repo unit runs.** `pnpm test:all` and `pnpm test:dev` are root scripts that wrap nx; either
is fine, and `npx nx run-many -t test --all` is the same work.

**Infrastructure.** Every layer goes through `spnutils infra`, never hand-rolled docker.

## Three rules that cost a session each

**`dev` and `preview` are alternatives, never concurrent.** `dev` compiles a route inside the
request, which a browser suite reads as a 45-second timeout rather than as a compile. Journeys run
against `preview`.

**`build:test`, never `build`, before a browser suite.** A production bundle sets `isDebug` false
and emits no `data-testid`, so every selector times out. The suite refuses a plain build and says
so — believe it the first time.

**Registering an app adds a volume mount the ingress cannot reload into.** `infra app up` reloads
nginx rather than recreating it. If `/config.json` 404s on a surface, that container predates the
app. The symptom to know by sight: **a blank page and a navigation timeout, never a missing-file
error.**


## Mode: local — start the platform stack (start only, no tests)

1. **Organization layer** (once per machine — skip if already up): `spnutils infra organization up` — the machine's trust bootstrap: the local certificate authority, its one trust prompt, the shared ingress.
2. **Platform layer**: `spnutils infra platform up` — this platform's container group (database, cache, queue, and each installed module's local rendering) from the pinned declaration. Check with `spnutils infra platform status`.
3. **App layer** (per app, if not yet registered): `spnutils infra app up -p <app>` — schemas, per-schema roles, local TLS certificate, hosts entry, ingress vhost. No containers of its own.
4. **Hosted-vendor modules** need no step of their own — a vendor you run is a module row in the platform declaration, and its local rendering comes up with the platform layer. There is no vendor verb.
5. **Start the service app**: `npx nx run <service>:dev`. It loads `local.env`, and its port and API-docs path come from the repo's own app env — read them rather than assume. On a fresh schema run `npx nx run <service>:migrate:up` first; it needs the platform-owner env variables sourced.
6. **Start web apps** as needed: `npx nx run-many -t dev -p '<pattern>'`, on the ports each app declares in its own manifest. For a browser suite start `preview` instead, over a `build:test` bundle — never `dev`.

Stop here — this mode starts things; it does not test or verify them. Hand off to the `verify` skill for health checks. Report what is up and on which ports/hosts.

Notes: `spnutils infra platform down --clean` **wipes the shared local DB**. Never run it in this mode — that belongs to the reset macro in the `verify` skill, on explicit command only. Logs: `spnutils infra logs [service]`.

## Mode: tests

Typecheck first, then the suites — a type error makes every later result noise:

```bash
npx nx run-many -t build -p '<touched>'   # the service for BE, ui packages / web apps for FE
npx nx run-many -t test --all            # every unit suite
```

**BE integration** (drives the running service through the API client):

1. Service up with migrations applied (mode local, steps 1-5).
2. If the contract changed since the client was generated: regenerate the client from the live service first.
3. `npx nx run <client>:test:integration` — the target already carries the config and `--runInBand`.

**FE E2E**: `pnpm test:e2e` (root Playwright) — after the BE suite, on a quiesced stack (no concurrent resets/builds), with the stack seeded.

Codegen freshness comes before any suite. Run `spnutils apps gen-validators -p <pkg>` for packages with edited `contract/states/**`. Run `spnutils apps gen-barrel -p <pkg>` for lib packages that gained/lost files — never apps, never the API client.

Report per-suite results honestly — a suite you did not run is "not run", never assumed green. Test-state hygiene rules: the `implement` skill steps/test.md.
