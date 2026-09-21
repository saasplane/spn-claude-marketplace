<!-- spn:doc
{
  "id": "behaviors-hook-set",
  "variant": "behaviors",
  "title": "Behaviors — The Hook",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "What the hook frame promises: a refusal that cannot be lost on the way back, one process for a whole chain, a broken rule that never removes the rules beside it, and an exit code that is always zero.",
  "keywords": ["hook", "verdict", "dispatcher", "exit code", "behaviors", "rows"]
}
-->

# Behaviors — The Hook

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

These are the promises [The Hook](../../02-constructs/01-spn-core/02-hook-set.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells, and a row no case reached says so.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.HOOK.01 | Backend developer | have a refusal reach the agent rather than the developer's pane alone | A refusal sets the decision and its reason, and advice is set as context the turn reads | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOK.02 | Backend developer | run one check on its own and get the same answer the chain would give | The file prints the decision the dispatcher would have returned, on the same stream | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOK.03 | Architect | keep every other gate alive when one of them breaks | A check that throws is passed over, and the rest of the chain still runs | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOK.04 | Architect | have a refusal end the chain and advice accumulate | The first refusal is the answer, and every note is joined into one message | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOK.05 | Backend developer | pay one interpreter start-up for a whole chain rather than one per rule | The wiring declares one entry per moment, and the dispatcher imports every check behind it | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOK.06 | Backend developer | be refused a hand edit to a file a generator owns | The dispatcher's own guard runs before the chain and names the verb to run instead | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOK.07 | DevSecOps / Security | see a hook end cleanly whatever it decided | Every path exits zero, and a refusal is the printed decision rather than a failure code | POSITIVE | UNIT | PLANNED | — |
