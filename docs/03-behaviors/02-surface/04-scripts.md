<!-- spn:doc
{
  "id": "behaviors-surface-scripts",
  "variant": "behaviors",
  "title": "Behaviors — Scripts",
  "lenses": ["WEB_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "What this plugin's scripts promise: one process behind the wired entry, a check that can run alone and answers as it does in the chain, and helpers that live once in the shared folder.",
  "keywords": ["dispatcher", "check", "mask", "bundle", "rows"]
}
-->

# Behaviors — Scripts

`For: Web developer · Architect` · `Status: 🔮 PLANNING`

The table below lists the promises [Scripts](../../02-constructs/02-surface/04-scripts.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.SCRIPTS.182 | Web developer | run the connector check by hand and get the verdict the chain gives | The check exports one verdict function and runs alone on a payload from stdin | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.183 | Architect | find the masker, the resulting text and the stack read in one place | They are one copy each in the shared support folder, and each plugin that reads them bundles them in | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.184 | Web developer | type the plugin's name and be told it ships no command | The entry prints the grammar under the plugin's own name, lists nothing, and refuses an unknown group by name | NEGATIVE | UNIT | PLANNED | — |
