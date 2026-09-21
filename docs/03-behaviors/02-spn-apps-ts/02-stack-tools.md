<!-- spn:doc
{
  "id": "behaviors-stack-tools",
  "variant": "behaviors",
  "title": "Behaviors — Stack Tools",
  "lenses": ["SERVER_DEV", "QA"],
  "status": "PLANNING",
  "summary": "What a stack's tools promise: a register found wherever it sits, a run that writes only the cells it owns, a partial run that leaves the other rungs alone, and coverage measured against actions rather than routes.",
  "keywords": ["register", "row", "tier", "manual", "action", "rows"]
}
-->

# Behaviors — Stack Tools

`For: Backend developer · Quality engineer` · `Status: 🔮 PLANNING`

These are the promises [Stack Tools](../../02-constructs/02-spn-apps-ts/02-stack-tools.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TSTOOL.01 | Quality engineer | move a documents tree and have both tools still find the registers | A register is recognised by its own headings, wherever in the repository it sits | POSITIVE | UNIT | PLANNED | — |
| MKT.TSTOOL.02 | Quality engineer | keep the cells a person decided after a run writes | Only the status and the moment it was found are written; every other cell is copied through | POSITIVE | UNIT | PLANNED | — |
| MKT.TSTOOL.03 | Quality engineer | run one rung and leave the rows of the others as they were | A run updates only the rows declaring a tier it covered | NEGATIVE | UNIT | PLANNED | — |
| MKT.TSTOOL.04 | Quality engineer | keep a hand-checked row through every run | A row marked as checked by a person is never written over | NEGATIVE | UNIT | PLANNED | — |
| MKT.TSTOOL.05 | Quality engineer | tell a case that was skipped from a case that passed | The status comes from the runner's own results file rather than from a specification | POSITIVE | UNIT | PLANNED | — |
| MKT.TSTOOL.06 | Backend developer | find a published action no behaviour row claims | The declared actions and the register's rows are read and compared | NEGATIVE | UNIT | PLANNED | — |
| MKT.TSTOOL.07 | Backend developer | have an action found even in a module an application owns | An action is found by its declaration rather than by a folder shape | POSITIVE | UNIT | PLANNED | — |
