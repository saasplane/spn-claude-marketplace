<!-- spn:doc
{
  "id": "behaviors-surface-tests",
  "variant": "behaviors",
  "title": "Behaviors — Tests",
  "lenses": ["QA", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "What this plugin's proof promises: a suite found by walking, a bundle held to its source, and a launcher held to the code.",
  "keywords": ["tests", "mirror", "runner", "bundle", "rows"]
}
-->

# Behaviors — Tests

`For: Quality engineer · Web developer` · `Status: 🔮 PLANNING`

The table below lists the promises [Tests](../../02-constructs/02-surface/06-tests.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TESTS.26 | Quality engineer | add a suite and have it run without registering it anywhere | The runner walks the folder rather than reading a list, and judges each suite on its exit code | POSITIVE | UNIT | PLANNED | — |
| MKT.TESTS.27 | Quality engineer | trust that a hook runs the rule that was last written | A bundle older than its sources fails by name, and the bundle answers what the source answers over recorded calls | NEGATIVE | UNIT | PLANNED | — |
