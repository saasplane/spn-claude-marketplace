<!-- spn:doc
{
  "id": "behaviors-stack-checks",
  "variant": "behaviors",
  "title": "Behaviors — Stack Checks",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "What a stack's write-time checks promise: a refusal about the edit rather than about the file, a word inside a quote never read as code, a settled rule that refuses and an unsettled one that warns.",
  "keywords": ["check", "mask", "introduced", "refuse", "warn", "rows"]
}
-->

# Behaviors — Stack Checks

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

[Stack Checks](../../02-constructs/02-spn-apps/01-stack-checks.md) makes these promises. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TSCHECK.01 | Backend developer | edit a file somebody else wrote without being refused for their pattern | Only a pattern the pending write brings in is answered for | POSITIVE | UNIT | PLANNED | — |
| MKT.TSCHECK.02 | Backend developer | write the name of a pattern inside a comment or a string safely | Comments and string bodies are blanked before the search runs | POSITIVE | UNIT | PLANNED | — |
| MKT.TSCHECK.03 | Web developer | be refused a navigation assertion whose host pattern could match inside a longer address | The host is compared as a parsed host, or the pattern is anchored | NEGATIVE | UNIT | PLANNED | — |
| MKT.TSCHECK.04 | Backend developer | be refused an enablement code that is not prefixed by its own module | The refusal names the code, the module it belongs to, and the card carrying the reasoning | NEGATIVE | UNIT | PLANNED | — |
| MKT.TSCHECK.05 | Backend developer | be refused a read verb returning a list type under a plural name | The suggested name is given, and a keyed map, a write verb and a search are left alone | NEGATIVE | UNIT | PLANNED | — |
| MKT.TSCHECK.06 | Backend developer | be warned rather than refused where the model behind a rule is still open | The coverage findings warn, and the file marks what to replace when the model lands | POSITIVE | UNIT | PLANNED | — |
| MKT.TSCHECK.07 | Backend developer | pay one interpreter start-up for this plugin's whole chain | The wiring declares one entry, and the dispatcher imports every check behind it | POSITIVE | UNIT | PLANNED | — |
