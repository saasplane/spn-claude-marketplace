# Step: test — unit + the contract tier

**Which tier a project owes is derived from its kind** — the `test` skill carries the ladder and the derivation; this step is how TypeScript runs each one. The service harness (test app, principal factory, substitutable providers, capturing log provider) ships in `@saasplane/support-service-ts` under `testing/` — never assemble a boot in a suite.

Keep `tests/{unit, integration, helpers, setup}` at every project's root (and `tests/contract/` in a `CLIENT_API`), **never co-located with source**; the repo root `tests/` holds only cross-app E2E suites (Playwright).

## Before you write or fix a case

Three habits, in the order you need them. Each replaces reading you would otherwise pay for.

- **Read the failure's own artifact before its source.** The runner writes one per failure — for a journey, `tests/.output/artifacts/<case>/error-context.md`, holding the message and a snapshot of the page as it rendered. That is shorter than the spec plus its component, and it tells you more, because a snapshot shows what rendered rather than what should have. Open it first, with the service log beside it.
- **Fix by shape, not by instance.** Failures collapse into a few shapes, and *the case reads a control before waiting for it* is one of them. Name the shape from the first two failures, then grep for the rest and fix them together. Diagnosing the twentieth instance on its own costs twenty diagnoses.
- **Write a case from the vocabularies, not the components.** The test-id enums, the label vocabulary, the route lock and the coverage map already say what a screen offers. A case written from those plus its behaviour row never has to open the component.

**And every journey assertion says why it might have failed.** `expect(editors, 'the content page rendered no channel editor at all — the session may lack NTF_CONFIG_MANAGE').toHaveCount(1)` has diagnosed itself. Its neighbour reporting `expected > 0, received 0` costs the next reader an investigation. Playwright takes that message on `expect`, `expect.soft` and `expect.poll`, and a write-time check warns you when one is missing. Jest takes no such argument, so a contract case carries the same thinking in its title and in the comment above the assertion.

## Unit tests

- Put `tests/unit/*.spec.ts` in the owning project (jest for node projects, vitest for web). Cover the service rules you just wrote: guards (`_assert*` throwing), null-skip update behavior, mapper ladders, error codes/categories.
- Typecheck first, for every touched project — a stale barrel or validator invalidates everything after it. `npx nx run <project>:typecheck`, and for a web app `npx tsc --noEmit -p <project>/tsconfig.json`, because its `typecheck` target is disabled and reports success while checking nothing.

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

- **`--pretty false` is not cosmetic.** `tsc` prints ANSI codes between `error` and the code, so `grep "error TS"` silently matches nothing on colored output. An agent counting errors that way reads every failing project as clean.
- **A test project must never keep incremental state.** With `incremental` inherited, `tsc` reads a stale `.tsbuildinfo`, reports itself up to date and exits `0` without checking. The shipped overlays pin `incremental: false`; do not override it.

## Component tier (Playwright CT)

Two traps here, and both cost real time. Neither shows up as a normal test failure.

**A function cannot cross into the browser as a prop.** CT runs the spec in Node and marshals the mounted component's props to the browser, so only data survives. A function prop becomes a one-way call back into Node that answers `undefined` in the browser, and a component *defined* in a spec file cannot be mounted at all. So a mount taking behaviour — a render prop, a compound child like `{({ option }) => <div/>}`, a callback whose answer the component reads — cannot be written inline in the spec.

- Put that JSX in `tests/component/helpers/<subject>-scenarios.tsx` and export it with a **`Scenario` suffix** (`DSWDataTableScenario`). The spec imports the wrapper and drives it through serializable props only, so the function is compiled into the browser bundle and never serialized.
- **Not every component needs one.** A component mounted with plain serializable props stays inline in its spec — that is simpler and stays the default. Reach for a `Scenario` only when the mount itself takes a function.
- The name is deliberate: `Fixture` is taken (a fixture is test *data*), and `Story` reads as Storybook, a separate app.
- Measured: two specs written inline gave 4 failed / 213 passed; the same components behind wrappers gave 217 passed, on the same clean cache.

**The CT build cache is keyed by file name and survives a rename.** `playwright/.cache` holds `metainfo.json` and generated assets under the paths they had when built, and nothing invalidates them when you rename, move or delete a file the tier compiles. The build then fails resolving a module no source references — seen as `Could not resolve .../PrincipalFactorVerificationBadge` when every source file and the spec already said `IdentityFactorVerificationBadge`. **Clear `playwright/.cache` in the same change as the rename**; moving it aside with zero source edits turned a total build failure into a full run. One Vite build serves every spec, so a stale name takes down the whole tier, not one suite.

## The contract tier (backend)

- The BE contract suite lives with the **API client package**, in `tests/contract/<mod>/*.contract.spec.ts` (`jest.config.contract.cjs`), and drives the **running** service through the generated client — the same surface every real client uses. Run: service up, then `npx nx run <client>:test:contract`. It fails when the service is unreachable, and its message names the command that starts it.
- If the contract changed, regenerate the client from the live service **before** the suite — a stale API client tests the old surface.
- **GET array commands have two wire forms** — test both `?ids=a` and `?ids=a&ids=b`.

## State hygiene — the suite is shared and non-hermetic

The suite runs `--runInBand` against a shared, stateful local DB (seeded platform org, policies, master data, providers, roles, the platform owner). A test that mutates seeded/shared state and doesn't restore it corrupts every later suite. Pick one, always:

1. **Throwaway data (preferred)** — onboard a fresh org / create a fresh entity and mutate that.
2. **Capture-and-restore** — capture the original in `beforeAll` (with a token captured **before** the mutation, so a policy that locks login can still be undone) and restore in `afterAll`.

Never leave mutated: the platform org and its policies, org-TYPE/GLOBAL auth/data policies, seeded master data, system providers, DEFAULT notification configs, roles/apps, the platform owner, seeded app-sites. Do not rely on a later reset to clean up; a green run on a fresh DB does not prove hygiene — verify seed rows byte-identical before/after (dump, run, dump, diff).

## Frontend journeys

- The journey tier runs `pnpm build test` → `pnpm start` → `spnutils apps test journey <node>`, **after** the BE suite, on a quiesced stack (no concurrent resets/builds — they cause 504s and login-handoff timeouts). Consistent failure = regression; cold-stack handoff flakiness is environmental (confirm via snapshots).

## Fixture rules

- **PII is allowed ONLY in `tests/` fixtures, never in `src/`.** Test personas must stay env-overridable; passwords are never hardcoded anywhere — always the env variable.
- **Behavior ids in titles — the tier decides which cases carry one** (foundation decision RD.DEVEX.FUNCTION.064, amending RD.DEVEX.FUNCTION.008). The id (`<MOD>.<CAP>.<NN>`) opens the case or `describe` title and the sentence follows it: `IAM.LOGIN.01 a person signs in with a password`.

  | Tier | Which cases carry an id | A case with no id |
  | --- | --- | --- |
  | contract · component · journey | every case | is a finding |
  | integration | every case proving a guarantee the integration tier owns — in practice every real case | a fixture or a helper's own check names what it checks |
  | unit | a case proving a row whose `Tier` is `UNIT` | a case over a private rule names the rule |

  **A row's `Tier` equals the tier of the case that proves it.** A run writes only the rows declaring the tier it ran, so a `CONTRACT` row whose only case runs at integration stays unproved. Where they differ, read the case and correct the side that is wrong. **Flip the row to ✅ only once its test has run and passed** — a case the runner merely collected proves nothing, and a case that skips itself is collected too.
- Fixtures that construct jsonb-persisted contract objects must be updated in the same change as any required-field addition to those types.

## Commands

```bash
npx nx run-many -t test:unit --all   # every unit suite
npx nx run <project>:test:unit       # one project
npx nx run <client>:test:contract    # the contract tier, against a live service
pnpm --filter <project> test unit    # the same, through the node's own script
spnutils apps test journey <node>   # the sweep; --phase serialized and --phase window are separate runs
npx tsc --noEmit --pretty false -p <project>/tsconfig.test.json   # a suite's own typecheck
```

Use pnpm only — never npm/yarn. See the `run` skill and the `verify` skill for full local orchestration (bring-up, seeding, ports).
