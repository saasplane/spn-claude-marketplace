<!-- spn:doc
{"id": "spn-devex-capabilities-tests", "variant": "capability", "title": "Tests in spn-devex", "lenses": ["ARCHITECT", "QA"], "status": "PLANNING", "realizes": ["tests"], "summary": "How this plugin proves itself — the tier folders it borrows from the TypeScript convention without its framework, the mirror that files a suite where its source sits, and the rule that no suite may count a path depth.", "keywords": ["tests", "tier", "mirror", "harness", "runner", "suite"]}
-->

# Tests in spn-devex

`For: Architect · Quality engineer` · `Status: 🔮 PLANNING` · `Realizes: Tests`

Twenty suites drive the real scripts as processes, feeding each one an event on standard input and reading the verdict back off standard output. **Nothing here imports a rule and calls it.** A check that passes when called as a function and fails when spawned as a hook is a check that does not work, and only the second is what a session runs.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The runner | `plugins/spn-devex/tests/run.mjs` | walks the tree for `t-*.mjs`, runs each, and reports per suite |
| The shared harness | `plugins/spn-devex/tests/helpers/harness.mjs` | the plugin root, the fixture builder, and the one-case assertion |
| The fixture builder | `plugins/spn-devex/tests/helpers/fixture.mjs` | a repository shaped on disk for a case to run against |
| Checks | `plugins/spn-devex/tests/unit/scripts/checks/` | one suite per file under `src/scripts/checks/` |
| Loop events | `plugins/spn-devex/tests/unit/scripts/events/` | the dispatcher, the orientation screen, the close, the stop |
| Tools | `plugins/spn-devex/tests/unit/scripts/tools/` | the corpus tools, each run as a command |
| Libraries | `plugins/spn-devex/tests/unit/scripts/lib/` | the shared computations a tool and a check both read |
| The corpus-shape suite | `plugins/spn-devex/tests/unit/scripts/t-seats.mjs` | a whole-tree property rather than one file's behaviour |
| What fills a row from a run | `plugins/spn-devex/src/scripts/tools/behaviour-rows.ts` | reads the run's own artifact and writes the two cells a run owns into each row a case's title names |

## Follows the pattern

- The tier folders, the mirror and the discovery rule — [The Tests](../../../02-constructs/01-devex/08-tests.md)
- What each script under test is for — [Scripts in spn-devex](05-scripts.md)
- What a hook hands a script — [Hooks in spn-devex](02-hooks.md)

## Special handling

### The folders are the stack's convention; the framework is not

`tests/{unit, integration, helpers, setup}` is what an APPS · TS node keeps, and this plugin keeps the same folder names so a reader who has learned one tree has learned the other. **The runner is a plain `.mjs` file rather than jest or vitest**, because every case here already spawns a process and asserts on its output. A framework would wrap a subprocess harness inside another harness, and the failure a person then reads would be the wrapper's.

### `integration/` and `setup/` are absent, and that is the statement

Nothing in this plugin runs at a tier above unit: a suite either spawns one script or reads the tree. And the runner needs no setup file. **An empty folder would teach a reader that something runs there**, which is the one thing an absence cannot do.

### The suite sits where its source sits

`unit/` mirrors `src/` folder for folder, so the suite for `src/scripts/checks/arc-status.ts` is `unit/scripts/checks/t-arc-status.mjs`. **The tier comes first and the mirror second** — a tier answers *what kind of proof is this*, and the mirror answers *of what*. A second suite proving the same file at a higher tier lands at the same path under `integration/`, colliding with nothing.

### Nothing counts a path depth

Suites sit at four different depths, so a `..` hop per suite would be a constant every move has to update. **`run.mjs` walks rather than globbing one folder**, `harness.mjs` exports the plugin root found once, and each suite asks the harness for it. A suite that types a depth is a suite the next move breaks — which is exactly what happened the first time these files were filed by tier, when all of them broke at the same moment.

### A suite drives the process, never the function

Each case builds a repository on disk, hands the script an event on standard input, and reads the verdict off standard output. That is what a session does, so it is what a case does. The cost is a process start per case and it is paid deliberately.

### The corpus suite proves a property, not a behaviour

`t-seats.mjs` asks whether the produced pages, the joined register rows and the seat files agree across a whole fixture tree. It sits beside the per-file suites rather than under `scripts/checks/` because no single source file owns it, and it is the one suite whose failure means the corpus is wrong rather than a script.

## Between modules

This chapter takes the tier vocabulary from [The Tests](../../../02-constructs/01-devex/08-tests.md), which the other two plugins realize the same way, and it publishes nothing: a suite is read by the person changing the script beside it.
