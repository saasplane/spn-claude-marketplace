<!-- spn:doc
{
  "id": "behaviors-apps-tests",
  "variant": "behaviors",
  "title": "Behaviors — Tests",
  "lenses": ["QA", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "What this plugin's own proof promises: a suite found by being written, a verdict read from an exit code, a rule and its proof that move together, and nothing that breaks the next time the folder moves.",
  "keywords": ["tests", "tier", "mirror", "runner", "harness", "rows"]
}
-->

# Behaviors — Tests

`For: Quality engineer · Backend developer` · `Status: 🔮 PLANNING`

The table below lists the promises [Tests](../../02-constructs/02-apps/07-tests.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TESTS.09 | Quality engineer | add a suite and have it run without registering it anywhere | The runner walks the folder rather than reading a list | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.10 | Quality engineer | trust the runner's verdict over a suite's own summary line | Each suite is judged on its exit code, and the summary only says how many cases there were | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.11 | Quality engineer | read a run without a fixture's own findings in it | What a suite writes to the error stream is discarded rather than inherited | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.12 | Backend developer | find the proof of a rule from the rule's own path | A suite sits under its tier at the path its subject sits at inside the plugin | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.13 | Quality engineer | add a second kind of proof for a file that already has one | The tier is the first folder, so the second lands at the same path under its own tier | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.14 | Architect | tell a tier this plugin proves nothing at from one that is unfinished | No folder exists for a tier with nothing in it, and the absence is the statement | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.15 | Backend developer | move a rule between subjects or providers without breaking its suite | The harness searches the provider folders for the file a case names rather than typing a path | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.16 | Quality engineer | move the suites without every one of them breaking at once | Nothing counts its own depth: the plugin root is found once, and the runner and the search walk | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.17 | Quality engineer | prove what a session would actually get rather than what a function returns | A case sends a real payload to the real script against a throwaway tree, and reads what came back | POSITIVE | UNIT | PLANNED | — |
