# Step: test — unit + repo-level integration

**Which tier a project owes is derived from its kind** — the `test` skill carries the ladder and the derivation; this step is how TypeScript runs each one. The service harness (test app, principal factory, substitutable providers, capturing log provider) ships in `@saasplane/support-service-ts` under `testing/` — never assemble a boot in a suite.

Tests are **never co-located with source**: every project keeps `tests/{unit, integration, helpers, setup}` at its root; the repo root `tests/` holds only cross-app E2E suites (Playwright).

## Unit tests

- `tests/unit/*.spec.ts` in the owning project (jest for node projects, vitest for web). Cover the service rules you just wrote: guards (`_assert*` throwing), null-skip update behavior, mapper ladders, error codes/categories.
- Typecheck first: `pnpm nx build <nx-name>` for every touched project — a stale barrel/validator or type error invalidates everything after it.

## Typechecking the tests themselves

**`nx build` compiles `src` only — it never looks at `tests/`.** A spec can reference a symbol that does not exist and stay green until the runner reaches it. Typecheck the test siblings explicitly:

```bash
npx tsc --noEmit --pretty false -p tsconfig.test.json          # unit
npx tsc --noEmit --pretty false -p tsconfig.integration.json   # component / e2e, where present
```

Every project is `tsconfig.json` plus **one sibling per tier it has** — never nested, never extending each other:

| File | Tier | Overlay it composes |
| --- | --- | --- |
| `tsconfig.json` | dev / IDE | the kind base |
| `tsconfig.build.json` | emit | `build.json` |
| `tsconfig.test.json` | unit | `test-server.json` (jest) or `test-web.json` (vitest) |
| `tsconfig.integration.json` | Playwright component + e2e | `test-integration.json` |

**Pick the overlay by runner, not by package kind.** A web project on the server overlay types its globals as jest, so `vi` does not resolve while `jest.fn()` compiles and then fails at runtime.

Two traps worth knowing, because both produce a **passing command that checked nothing**:

- **`--pretty false` is not cosmetic.** `tsc` prints ANSI codes between `error` and the code, so `grep "error TS"` silently matches nothing on coloured output — an agent counting errors that way reads every failing project as clean.
- **A test project must never keep incremental state.** With `incremental` inherited, `tsc` reads a stale `.tsbuildinfo`, reports itself up to date and exits `0` without checking. The shipped overlays pin `incremental: false`; do not override it.

## Repo-level integration (backend)

- The BE integration suite lives with the **API client package** (`jest.config.integration.cjs`) and drives the **running** service through the API client — the same surface every real client uses. Run: service up, then `npx jest --config jest.config.integration.cjs --runInBand` from the client package.
- If the contract changed, regenerate the client from the live service **before** the suite — a stale API client tests the old surface.
- **GET array commands have two wire forms** — test both `?ids=a` and `?ids=a&ids=b`.

## State hygiene — the suite is shared and non-hermetic

The suite runs `--runInBand` against a shared, stateful local DB (seeded platform org, policies, master data, providers, roles, the platform owner). A test that mutates seeded/shared state and doesn't restore it corrupts every later suite. Pick one, always:

1. **Throwaway data (preferred)** — onboard a fresh org / create a fresh entity and mutate that.
2. **Capture-and-restore** — capture the original in `beforeAll` (with a token captured **before** the mutation, so a policy that locks login can still be undone) and restore in `afterAll`.

Never leave mutated: the platform org and its policies, org-TYPE/GLOBAL auth/data policies, seeded master data, system providers, DEFAULT notification configs, roles/apps, the platform owner, seeded app-sites. Do not rely on a later reset to clean up; a green run on a fresh DB does not prove hygiene — verify seed rows byte-identical before/after (dump, run, dump, diff).

## Frontend E2E

- Root Playwright suite (`pnpm test:e2e`) runs **after** the BE suite, on a quiesced stack (no concurrent resets/builds — they cause 504s and login-handoff timeouts). Consistent failure = regression; cold-stack handoff flakiness is environmental (confirm via snapshots).

## Fixture rules

- **PII is allowed ONLY in `tests/` fixtures, never in `src/`.** Test personas must stay env-overridable; passwords are never hardcoded anywhere — always the env variable.
- **Behavior ids in titles**: a contract-tier test proving a behavior row embeds its id (`<MOD>.<CAP>.<NN>`) in the test title, so docs↔tests coupling is greppable (foundation decision RD.DEVEX.008). Internals-only tests are exempt. Flip the row to ✅ only once its test exists.
- Fixtures that construct jsonb-persisted contract objects must be updated in the same change as any required-field addition to those types.

## Commands

```bash
pnpm test:all        # everything            pnpm test:dev   # affected
pnpm nx build <p>    # typecheck a project   pnpm test:e2e   # root Playwright (stack up + seeded)
```

pnpm only — never npm/yarn. Full local orchestration (bring-up, seeding, ports): the `run` skill and the `verify` skill.
