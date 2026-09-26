<!-- spn:doc
{
  "id": "behaviors-estate-tests",
  "variant": "behaviors",
  "title": "Behaviors — Tests",
  "lenses": ["INFRA", "QA"],
  "status": "PLANNING",
  "summary": "What the test tree promises: one command for every suite, a suite found where its source sits, a verdict read from the exit code, a refusal checked for what it says, and a tier that stands empty nowhere.",
  "keywords": ["test", "runner", "tier", "mirror", "harness", "rows"]
}
-->

# Behaviors — Tests

`For: DevOps / SRE · Quality engineer` · `Status: 🔮 PLANNING`

[Tests](../../02-constructs/03-infra/07-tests.md) makes the promises below. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TESTS.18 | Quality engineer | run every suite the tree holds with one command | The runner walks the whole tree and reports each suite it found, with a count of cases | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.19 | Quality engineer | move a source file and find its proof at the matching path | A suite sits under the tier and then at its source's own path | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.20 | Quality engineer | trust the run rather than the summary line it printed | Each suite's exit code is the verdict, and the printed line supplies only the count | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.21 | DevOps / SRE | read a run without a fixture's own warnings in it | Standard error is discarded rather than inherited, so a fixture's findings stay out of the summary | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.22 | Quality engineer | move the suites without breaking them | Nothing counts folders: the harness finds the plugin root once and the runner walks | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.23 | DevSecOps / Security | catch a rule that refuses for the wrong reason | A case states a fragment the refusal must carry, not only that something was refused | NEGATIVE | UNIT | PLANNED | — |
| MKT.TESTS.24 | Quality engineer | know a rule is conservative rather than merely working | Each rule is asserted against what it must refuse and against what it must let through | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.25 | Quality engineer | find no tier standing empty to look complete | A tier nothing runs at has no folder, and neither does a fixture step nothing needs | NEGATIVE | UNIT | PLANNED | — |
