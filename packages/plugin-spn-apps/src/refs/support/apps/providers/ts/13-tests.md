<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/13-tests.md",
      "seen": "1ad4d8cf"
    }
  ]
}
-->
# Tests — which runner per tier, and where a case lives

**Source of truth:** the foundation's `10-providers/ts/13-tests.md`. Read this as the restatement; that chapter governs.

**Read this before you write anything**, because the tier map decides where a case lives.

**A node owns the tiers its kind names, and a dash in the tier map is a ruling rather than a gap.** An `APP_SERVER` owns no journey tier, and that is a prohibition — a journey case written there is in the wrong node, not merely in an unusual one.

| Tier | Runner | What it proves |
| --- | --- | --- |
| unit | Jest on the server, Vitest on the web | one unit, nothing real behind it |
| component | Playwright component testing | one component rendered, in a browser |
| contract | the generated client against a live service | that the published surface is what the client believes |
| integration | Testcontainers | the node against a real resource it fronts |
| journey | Playwright against a running stack | a path a person takes, end to end |

**A node may double a seam it owns, and nothing else.** That one rule decides where a case belongs: a case reaching for a double of somebody else's seam is a case in the wrong node.

**Only Jest typechecks as it runs.** A type error that Jest would catch passes silently under the other runners, so a server package's red is not reproducible by running the web suite.

**The contract tier runs from the service's `CLIENT_API` package.** Its cases sit in `tests/contract/<mod>/*.contract.spec.ts`, laid out by the service's modules, and drive the generated client against a running service. `jest.config.contract.cjs` collects them, and the `test:contract` target runs them, which Nx never caches. `tests/integration/` holds resource-backed cases only.

**A module inside an application keeps its cases in the application's tree**, at `tests/<tier>/<folder>/`, named for the module's folder under `src/modules/`. Nothing under `src/` is collected, so the module has no `tests/` of its own. `apps validate` and the test runner read the module's tiers there, and `apps scaffold app-module` mints the folder.

**A contract case fails when its service is unreachable**, and its message names the command that starts the service. A suite that returned early read as a pass and stamped rows nothing had run. Read the count, not the colour — and remember that a line reporter drops the artifacts that say *which* case skipped.

**A case declares what it flips with `SPTestMutationScopeType` from `@saasplane/toolchain-ts/contract`**, and writes the tag with `mutationTag` from `@saasplane/toolchain-ts/test/axes.mjs` — the same module the phase configurations select by. A platform declares no scope of its own.

**Run the tier that owns the rule you changed.** A change to a refusal needs the integration tier; unit passes straight over it.

**Every run is named, and leaves a file of that name.** `spnutils apps test <tier> <run> <package>` (or `pnpm test <tier> <run>` inside the node) writes `tests/.output/<tier>/runs/<run>.json`; a journey phase writes `<run>.<phase>.json`. A reused name replaces that one file, and each tier keeps its 20 newest. The runner's raw report is deleted once it is folded in. Give every tier of one sitting the same name, then stamp with `spn-devex behaviours stamp write <run> <repo>`.
