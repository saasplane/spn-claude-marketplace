<!-- spn:doc
{
  "id": "behaviors-tests",
  "variant": "behaviors",
  "title": "Behaviors — Tests",
  "lenses": ["QA", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "What the test tree promises: a suite found from its source's own path, a second tier that lands beside the first rather than on it, a move that breaks nothing, a run with nothing installed, and an absent tier that says so.",
  "keywords": ["test", "suite", "tier", "mirror", "runner", "rows"]
}
-->

# Behaviors — Tests

`For: Quality engineer · Backend developer` · `Status: 🔮 PLANNING`

[Tests](../../02-constructs/01-devex/08-tests.md) makes the promises below. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TESTS.01 | Backend developer | find the suite covering a script from the script's own path | The suite sits under the tier at the path its source sits at inside the plugin | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.02 | Quality engineer | add a second tier for a file that already has a suite | The tier is the first folder, so the new suite lands at the same mirror under a different tier | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.03 | Backend developer | move the tree and have every suite still resolve | The plugin root is resolved once in the harness, and no suite computes a depth of its own | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.04 | Quality engineer | add a suite and have it run without editing anything else | The runner walks the tier and runs what it finds, so no list can leave a suite out | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.05 | Partner / integrator | run the suites in a repository holding only the plugins, with nothing installed | The runner is a plain script with no dependency, and the partner proof runs it | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.06 | Architect | tell a tier nothing runs at from a tier somebody forgot | An absent tier has no folder at all, so no empty folder claims to be proof | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.07 | Quality engineer | have a behaviour row's status written by a run rather than typed | A case whose title carries a row's id writes that row's result into `tests/.output/unit/runs/<run>.json`, under the name the caller gave | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.08 | Backend developer | prove a gate in the shape it actually ships in | A suite spawns the script as a process and reads what comes back, rather than importing a function | POSITIVE | UNIT | PLANNED | — |
