<!-- spn:doc
{"id": "spn-infra-capabilities-estate-tests", "variant": "capability", "title": "Tests in spn-infra", "lenses": ["INFRA", "QA"], "status": "DONE", "realizes": ["estate-tests"], "summary": "How this plugin proves its own gate — a tree filed by tier and then by what a suite proves, a runner that walks, a harness that drives a real process and finds the plugin root once, and the tiers that deliberately do not exist.", "keywords": ["test", "runner", "harness", "tier", "mirror", "suite"]}
-->

# Tests in spn-infra

`For: DevOps / SRE · Quality engineer` · `Status: ✅ DONE` · `Realizes: Tests`

`plugins/spn-infra/tests/` holds a runner, a harness and one tier. **The tier comes first and the mirror second**: `unit/` says what kind of proof a suite is, and the path under it repeats the path of the file being proven. The refusals this plugin ships are regular expressions over text somebody is about to write, so each rule is asserted against what it must refuse **and** against what it must let through — a rule tested only on known-bad input cannot tell you it is conservative.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The runner | `plugins/spn-infra/tests/run.mjs` | walks the tree, runs every suite it finds, and judges each on its exit code |
| The harness | `plugins/spn-infra/tests/helpers/harness.mjs` | drives a real process per case, reads the decision back, and exports the plugin root |
| The estate laws proven | `plugins/spn-infra/tests/unit/scripts/lib/t-estate.mjs` | each rule against what it refuses and what it allows, both sides of the credential boundary |
| The subject resolution proven | `plugins/spn-infra/tests/unit/providers/t-subjects.mjs` | each cloud's spellings refused, each cloud's sanctioned homes allowed, the other cloud's caught too |
| What is under proof | `plugins/spn-infra/src/scripts/` · `plugins/spn-infra/src/providers/` | the paths the suites mirror beneath the tier |

## Follows the pattern

- The tier, the mirror, and the discovery rule — [Tests](../../../02-constructs/01-devex/08-tests.md)
- The staleness and bundle-parity cases every plugin owes once it builds — the foundation's `04-plugins/02-shape.md`

## Special handling

### 🔮 Planned: a staleness case and a parity case join the mirror

**Why** — the foundation's `04-plugins/02-shape.md` states both as things every plugin's suite must refuse once its `dist/` is committed: a bundle older than its sources, and a bundle whose behaviour drifted from its source during a rebuild. This plugin ships no `commands/` yet, but `hooks.json` will still run a built `dist/events/pretooluse.mjs`, so it owes both cases exactly as its two siblings do.
**What** — `unit/t-dist-current.mjs` will recompute the hash of the bundle's declared sources against the banner esbuild wrote into it. `unit/t-bundle-parity.mjs` will run a recorded payload through the source and through the committed bundle and assert source and bundle decide alike.
**How** — both sit at `tests/unit/`, proving a property of the whole plugin rather than of one rule.

### The runner walks rather than globbing one folder

**Why** — *a runner that reads one flat folder makes a rule test, a structural test and a tool test indistinguishable*, and moving a source file then moves its test nowhere.
**What** — every file under the tree whose name marks it as a suite is run, wherever it sits, so a suite is discovered by where its source sits.
**How** — the walk is recursive and the names are sorted, so the run order is stable. `plugins/spn-infra/tests/run.mjs`.

### The exit code is the verdict, and the printed line only counts

**Why** — *a suite that exits non-zero while printing a cheerful last line would read as green*, and one that passes in different words would read as red. A runner that can disagree with its own suites cannot prove anything.
**What** — each suite's exit code decides pass or fail, and the summary line supplies the case count.
**How** — standard error is discarded rather than inherited, so a fixture's own warnings do not appear in the run as this run's findings. `plugins/spn-infra/tests/run.mjs`.

### Nothing counts folders to reach the code

**Why** — *moving the suites once broke every one of them at the same moment*, because each computed its own depth back to the plugin.
**What** — the harness finds the plugin root once and exports it; the runner walks; a suite states only what it proves.
**How** — a suite that types a depth is a suite the next move breaks, and none of them types one. `plugins/spn-infra/tests/helpers/harness.mjs`.

### A case drives the real process and reads the real verdict

**Why** — *what a case should prove is what the harness would see*, not what a function returns in the same process.
**What** — an event is written to a fresh process on standard input and the decision is parsed back out. A case states the decision it expects and, for a refusal, a fragment the message must carry.
**How** — asserting on the fragment is how a rule that fires for the wrong reason is caught rather than counted as a pass. `plugins/spn-infra/tests/helpers/harness.mjs`, `one()`.

### The discovery is proven load-bearing, not merely green

**Why** — *a passing suite proves the code does what the suite says, not that the suite would notice if the code stopped*.
**What** — moving the Google provider folder aside turned exactly the two Google cases red and left every other case green; restoring the folder returned the whole run.
**How** — that is the difference between a suite that reads the tree and a suite that agrees with it. `plugins/spn-infra/src/providers/`.

### The framework is deliberately not adopted

**Why** — *these suites drive a real hook process through standard input and assert on what it writes back*. A framework here would wrap a subprocess harness in another harness.
**What** — the folder names follow the stack's own test convention; the runner and the suites stay plain.
**How** — there is no `integration/` folder and no `setup/` folder, because nothing runs at that tier and the runner needs no fixture stood up. An empty folder would teach a reader that the tier works. `plugins/spn-infra/tests/`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-infra's scripts | the dispatcher a case runs, and the refusal messages it asserts fragments of | a proof drives the real gate rather than a copy of it |
| takes | spn-infra's providers | the folders the discovery reads, which is what moving one proves | the suite reads the tree rather than agreeing with it |
| publishes | this repository | one command per plugin, reporting suites and cases | a repository with no application still proves what it ships |
