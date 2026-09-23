<!-- spn:doc
{
  "id": "behaviors-loop-events",
  "variant": "behaviors",
  "title": "Behaviors — Loop Events",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "What the moments promise: a first screen read from the ground rather than typed, a refusal available only where a call can still be stopped, a closing line after the move lands, and warnings at the end of a turn.",
  "keywords": ["orientation", "moment", "refusal", "closing", "warning", "rows"]
}
-->

# Behaviors — Loop Events

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

[Loop Events](../../02-constructs/01-spn-core/03-loop-events.md) makes these promises. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.LOOP.01 | Backend developer | open a window and read the ground without asking for it | Every repository's own claim, the wiring it implies, and every workstream in its own state | POSITIVE | UNIT | PLANNED | — |
| MKT.LOOP.02 | Architect | clone another repository and have the next session already know about it | The opening screen walks the workspace, so nothing about the members is typed anywhere | POSITIVE | UNIT | PLANNED | — |
| MKT.LOOP.03 | Engineering leader | start in an empty folder and be asked rather than reported at | A workspace with no manifest is answered with questions and the day-zero skill | POSITIVE | UNIT | PLANNED | — |
| MKT.LOOP.04 | Backend developer | open a window even when the orientation script fails | Every read is wrapped, the exit code is zero, and the window opens | NEGATIVE | UNIT | PLANNED | — |
| MKT.LOOP.05 | Backend developer | read the same opening screen without opening a session | The orientation script runs by hand and prints the same text | POSITIVE | UNIT | PLANNED | — |
| MKT.LOOP.06 | Engineering leader | be told what landed after a scope is closed, not before | The closing line is said once the folder has actually moved, counted from that scope's own plan | POSITIVE | UNIT | PLANNED | — |
| MKT.LOOP.07 | Engineering leader | be warned at the end of a turn rather than refused | A turn ending with unblocked rows, a hold naming no live card, or a handover missing its fields | POSITIVE | UNIT | PLANNED | — |
