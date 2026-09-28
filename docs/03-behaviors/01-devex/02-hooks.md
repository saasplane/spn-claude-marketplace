<!-- spn:doc
{
  "id": "behaviors-hook-set",
  "variant": "behaviors",
  "title": "Behaviors — Hooks",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "What the hook frame promises: a first screen read from the ground, a refusal available only where a call can still be stopped, a verdict that cannot be lost on the way back, one process for a whole chain, and an exit code that is always zero.",
  "keywords": ["hook", "moment", "verdict", "dispatcher", "exit code", "rows"]
}
-->

# Behaviors — Hooks

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

The table below lists the promises [Hooks](../../02-constructs/01-devex/02-hooks.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells, and a row no case reached says so.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.HOOKS.01 | Backend developer | have a refusal reach the agent rather than the developer's pane alone | A refusal sets the decision and its reason, and advice is set as context the turn reads | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.02 | Backend developer | run one check on its own and get the same answer the chain would give | The file prints the decision the dispatcher would have returned, on the same stream | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.03 | Architect | keep every other gate alive when one of them breaks | A check that throws is passed over, and the rest of the chain still runs | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.04 | Architect | have a refusal end the chain and advice accumulate | The first refusal is the answer, and every note is joined into one message | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.05 | Backend developer | pay one interpreter start-up for a whole chain rather than one per rule | The wiring declares one entry per moment, and the dispatcher imports every check behind it | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.06 | Backend developer | be refused a hand edit to a file a generator owns | The dispatcher's own guard runs before the chain and names the command to run instead | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.07 | DevSecOps / Security | see a hook end cleanly whatever it decided | Every path exits zero, and a refusal is the printed decision rather than a failure code | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.08 | Backend developer | open a window and read the ground without asking for it | Every repository's own claim, the wiring it implies, and every workstream in its own state | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.09 | Architect | clone another repository and have the next session already know about it | The opening screen walks the workspace, so nothing about the members is typed anywhere | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.10 | Engineering leader | start in an empty folder and be asked rather than reported at | A workspace with no manifest is answered with questions and the day-zero skill | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.11 | Backend developer | open a window even when the orientation script fails | Every read is wrapped, the exit code is zero, and the window opens | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.12 | Backend developer | read the same opening screen without opening a session | The orientation script runs by hand and prints the same text | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.13 | Engineering leader | be told what landed after a scope is closed, not before | The closing line is said once the folder has actually moved, counted from that scope's own plan | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.14 | Engineering leader | be warned at the end of a turn rather than refused | A turn ending with unblocked rows, a hold naming no live card, or a handover missing its fields | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.27 | Engineering leader | trust a hook reflects the source that was last checked in | `hooks.json` runs the committed `dist/events/*.mjs`, and a bundle older than its declared sources is refused by `tests/unit/t-dist-current.mjs` | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.28 | Engineering leader | finish a turn in one window without clobbering another window's verdict | `checks/corpus.ts` caches one verdict per docs tree in the machine store, keyed by content, and replays a finding rather than dropping it — proven in `tests/unit/scripts/checks/t-corpus.mjs` | POSITIVE | UNIT | PLANNED | — |

## Retired ids

**A promise is re-issued under the construct that now makes it, and the id it used to carry is never reused.** The moments a session offers are a part of the hook frame rather than a construct beside it, so the rows they carried are re-issued here. The numbers below are gaps, and gaps are expected.

| Retired | Re-issued as |
| --- | --- |
| `MKT.HOOK.01` – `MKT.HOOK.07` | `MKT.HOOKS.01` – `MKT.HOOKS.07`, in order |
| `MKT.LOOP.01` – `MKT.LOOP.07` | `MKT.HOOKS.08` – `MKT.HOOKS.14`, in order |
