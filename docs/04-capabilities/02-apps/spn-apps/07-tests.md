<!-- spn:doc
{"id": "spn-apps-capabilities-tests", "variant": "capability", "title": "Tests in spn-apps", "lenses": ["QA", "SERVER_DEV"], "status": "DONE", "realizes": ["apps-tests"], "summary": "How this plugin proves itself — one tier, mirrored exactly on its own source, behind a runner that walks and judges on an exit code, and a harness that drives the real scripts against a throwaway tree without counting a single depth.", "keywords": ["tests", "tier", "mirror", "runner", "harness", "discovery"]}
-->

# Tests in spn-apps

`For: Quality engineer · Backend developer` · `Status: ✅ DONE` · `Realizes: Tests`

This plugin holds other people's repositories to rules, so it owes proof of its own. The folder follows the convention this domain's provider asks of every node it governs — suites at the project's root, divided by tier, never beside the source — with one deliberate exception: **the folders are the convention and the framework is not.** These suites drive real hook processes through standard input and read what those processes write back, so a framework would wrap a subprocess harness inside another harness.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The runner | `plugins/spn-apps/tests/run.mjs` | walks the folder, runs each suite, and reports the verdict of each |
| The harness | `plugins/spn-apps/tests/helpers/harness.mjs` | the plugin root found once, a throwaway tree, one case, and the search for a rule |
| The unit tier | `plugins/spn-apps/tests/unit/` | the one tier this plugin proves anything at |
| The provider rules | `plugins/spn-apps/tests/unit/providers/ts/checks/_src/` · `_tests/` | one suite per private rule, at the path that rule sits at |
| The plugin's own code | `plugins/spn-apps/tests/unit/scripts/` | the gate's parse-once behaviour, the dispatcher, the hash, and each tool |

## Follows the pattern

- Which tier proves which behaviour in a governed repository — the foundation's test standard, restated in `plugins/spn-apps/src/providers/ts/skills/implement/steps/test.md`
- What the rules under test decide — [Providers in spn-apps](06-providers.md)
- The staleness and bundle-parity cases every plugin owes once it builds — the foundation's `04-plugins/02-shape.md`

## Special handling

### 🔮 Planned: a staleness case and a parity case join the mirror

**Why** — the foundation's `04-plugins/02-shape.md` states both as things every plugin's suite must refuse once its `dist/` is committed: a bundle older than its sources, and a bundle whose behaviour drifted from its source during a rebuild.
**What** — `unit/t-dist-current.mjs` will recompute the hash of a bundle's declared sources against the banner esbuild wrote into it. `unit/t-bundle-parity.mjs` will run a recorded payload through the source and through the committed bundle and assert source and bundle answer alike, reading fixtures from a new `tests/fixtures/payloads/`.
**How** — both sit at `tests/unit/`, proving a property of the whole plugin rather than of one file.

### The tier comes first and the mirror second

**Why** — *the tier answers what kind of proof this is and the mirror answers of what*. Putting the mirror first would leave nowhere to file a second kind of proof for the same file.
**What** — a suite sits under its tier, at the path its subject sits at inside the plugin.
**How** — a wired proof of something a unit suite already covers then lands at the same path under its own tier, colliding with nothing. `plugins/spn-apps/tests/unit/`.

### A tier with nothing in it has no folder

**Why** — *an empty folder teaches a reader that the thing works*, where a missing one says what is true. It is the same rule the gate already states about a realization that is absent.
**What** — there is no folder for a tier this plugin proves nothing at, and none for a setup the runner does not need.
**How** — the folder holds the runner, the helpers and the one tier, and nothing stands in for the others. `plugins/spn-apps/tests/`.

### The runner walks, and judges on the exit code

**Why** — *judging on the printed text read a suite that fails while printing a cheerful summary as green*, and a suite that passes in different words as red. A runner that can disagree with its own suites proves nothing.
**What** — the suites are found by walking, so a new one runs by existing; the verdict is each suite's exit code, and the summary line only says how many cases there were.
**How** — a suite's error output is discarded rather than inherited, because a suite exercising a gate prints that gate's findings and they would read as this run's. `plugins/spn-apps/tests/run.mjs`.

### Nothing counts its own depth

**Why** — *moving the suites once broke all of them at the same moment*, each having computed its own way back to the plugin root. The mirror puts suites at many depths, so a typed depth is a constant every move has to update — the defect the mirror exists to remove.
**What** — the plugin root is found once and exported, the runner walks, and the search for a rule walks whatever folders a provider ships.
**How** — the only files that resolve their own location are the runner and the harness. `plugins/spn-apps/tests/helpers/harness.mjs`.

### A case names the rule, never its folder

**Why** — *a harness that knew which stack to look in would be the one place in this plugin naming an instance*, which is the thing the provider shape exists to remove.
**What** — the harness searches every provider folder, and every private folder inside it, for the file a case names.
**How** — a rule that moves between subjects or between providers breaks no suite, and a case stays about the rule. When the file is genuinely absent, the failure reports the path a reader would have expected rather than an empty string. Same file.

### A case runs the real process against a throwaway tree

**Why** — *what a session gets is what a process wrote to its output*, not what a function returns when called directly.
**What** — the harness writes a temporary tree, sends a real payload on standard input, and reads the decision and the reason back out.
**How** — the trees are removed when the run ends, so a failing case leaves nothing behind. Same file.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | this plugin's own providers | the rules each suite drives, found by searching rather than by a typed path | a rule and its proof move together |
| takes | this plugin's own scripts | the gate, the dispatcher, the hash and the tools each suite proves | the plugin's own code owes proof like anything else |
| takes | spn-devex | the other copy of the restatement hash, which one case requires to agree with this one | two spellings would report drift between files that agree |
| publishes | this repository's own gates | a verdict a release can be judged on | a plugin that holds others to rules owes proof of its own |
