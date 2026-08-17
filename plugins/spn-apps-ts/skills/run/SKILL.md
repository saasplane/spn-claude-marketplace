---
name: run
description: Start a SaaS Plane TS platform locally or run its test suites. Use when the user asks to run, start, bring up, or boot the platform, an app, or the local stack (mode local - start only, no tests), or to run tests (mode tests). Not for health verification or resets - that is the `verify` skill.
---

# run — local stack and test suites

Pick the mode (`local` | `tests`). pnpm only — never npm/yarn. All infra goes through `spnutils infra`, driven by the platform declaration that `sprepo.json` pins and each app's row in it — never hand-rolled docker.

## Mode: local — start the platform stack (start only, no tests)

1. **Organization layer** (once per machine — skip if already up): `spnutils infra organization up` — the machine's trust bootstrap: the local certificate authority, its one trust prompt, the shared ingress.
2. **Platform layer**: `spnutils infra platform up` — this platform's container group (database, cache, queue, and each installed module's local rendering) from the pinned declaration. Check with `spnutils infra platform status`.
3. **App layer** (per app, if not yet registered): `spnutils infra app up -p <app>` — schemas, per-schema roles, local TLS certificate, hosts entry, ingress vhost. No containers of its own.
4. **Hosted-vendor modules** need no step of their own — a vendor you run is a module row in the platform declaration, and its local rendering comes up with the platform layer. There is no vendor verb.
5. **Start the service app**: `cd apps/<service-app> && pnpm dev` (loads `local.env`; its port and API-docs path come from the repo's own app env — read them, never assume). Run migrations first on a fresh schema: `pnpm migrate:up` (needs the platform-owner env variables sourced).
6. **Start web apps** as needed: `pnpm dev` per app, on the ports that app declares in its own manifest. Use each app's `pnpm dev` — the bundler binary alone is not on PATH.

Stop here — this mode starts things; it does not test or verify them. Hand off to the `verify` skill for health checks. Report what is up and on which ports/hosts.

Notes: `spnutils infra platform down --clean` **wipes the shared local DB** — never run it in this mode (that belongs to the reset macro in the `verify` skill, on explicit command only). Logs: `spnutils infra logs [service]`.

## Mode: tests

Typecheck first, then the suites — a type error makes every later result noise:

```bash
pnpm nx build <nx-name>       # per touched project (service app for BE, ui packages / web apps for FE)
pnpm test:all                 # every unit suite        pnpm test:dev   # affected only
```

**BE integration** (drives the running service through the API client):

1. Service up with migrations applied (mode local, steps 1-5).
2. If the contract changed since the client was generated: regenerate the client from the live service first.
3. `cd packages/<service>-api-client-ts && npx jest --config jest.config.integration.ts --runInBand`

**FE E2E**: `pnpm test:e2e` (root Playwright) — after the BE suite, on a quiesced stack (no concurrent resets/builds), with the stack seeded.

Codegen freshness before any suite: `spnutils apps gen-validators -p <pkg>` for packages with edited `contract/states/**`, `spnutils apps gen-barrel -p <pkg>` for lib packages that gained/lost files (never apps, never the API client).

Report per-suite results honestly — a suite you did not run is "not run", never assumed green. Test-state hygiene rules: the `implement` skill steps/test.md.
