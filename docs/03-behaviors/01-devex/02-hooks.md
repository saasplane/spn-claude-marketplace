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
| MKT.HOOKS.30 | Engineering leader | have a row somebody is on now named rather than called unfinished | A row marked `in progress <date> <time> <offset>` is named with its age, never counted toward a runnable warning — proven in `tests/unit/scripts/events/t-stop.mjs` | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.31 | Backend developer | be refused an edit to source or tests while a test run for that repository is going | A write under `src` or `tests` is refused while the run has a start file, and the refusal names the run and its age | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.32 | Backend developer | edit a document or another repository while a test run is going | A write outside that repository's `src` and `tests` gets no verdict, and a start file older than 600,000 ms is not read as a run | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.33 | Backend developer | be refused a hand edit between the `spnutils:agent` markers | An `Edit` or a `Write` that changes the text between the markers is refused, naming `spnutils workspace agent-sync` and `spnutils repo agent-sync` | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.34 | Backend developer | edit a file that only quotes a marker, or edit below the block | A marker counts only as a whole line, so a quoted marker holds no block, and an edit below the end marker passes | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.35 | Engineering leader | be told before the turn ends that an arc change left the page stale | One warning names the workstream and `spn-devex docs cycles write <workstream>`, and only for an arc this session wrote | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.36 | Engineering leader | be shown the close gate's report when an arc reaches `LANDED` | A row of that arc that reads empty or pending is listed in one warning, and an arc with every row accounted for gets none | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.37 | Engineering leader | be warned about a handover whose values start in different columns | The `[handover]` warning names the column that `do not touch:` sets, and a wrapped value indented to that column passes | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.38 | Engineering leader | be told when a step row is written with a wrong cell count | The note names the row with its count and the header's, and a cell holding an escaped pipe is read as one cell | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.39 | Engineering leader | have a tick with no date and no landed word read as pending | `✅ the arc is written` reads pending in the close gate and at the end of a turn, and `✅ 2026-09-07` still reads landed | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.40 | Engineering leader | be told when a page's header status disagrees with its arcs | The finding names the word the page shows, the word the arcs give, and the command that writes it | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.41 | Engineering leader | have a Bash call that runs several programs timed once | One line is written for the call, naming the first program the filter matches, and `programs` holds how many it ran | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.42 | Engineering leader | read what the hook after a failed call cost | A failed call writes its `events › closed` line under `PostToolUseFailure`, beside its command line | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.43 | Engineering leader | have a call that was refused after its start file was written leave no start file behind | A start file older than 600,000 ms is removed when the next one is written, so no reader takes it for a running command | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.44 | Engineering leader | have a failed call made by a child agent closed like any other | The call's line carries its exit code and the agent, and its start file is removed | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.45 | Editor | be refused a page that links a version nobody cut | The write is refused, and the message names the version the page links and the versions that exist | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.46 | Editor | be refused a publish of a page that links its styles from outside | The publish is refused, and the message names `docs sds bundle` and the copy to publish instead | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.47 | Editor | write the version's address into a page and get no finding for it | The check accepts a page that links a version which was cut, and says nothing about its address | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.48 | Engineering leader | find a window in the session list by the workstream it works on | A prompt that names one workstream folder that exists names the session after that folder, such as `020-agent-workstream-improvements` | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.49 | Engineering leader | find the window a handover started by its arc | A handover whose `continue:` line names a workstream and an arc of it names the session `020-N011 artifacts-by-domain`, and an arc with no file or the reload form gives the folder's name | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.50 | Engineering leader | keep the name Claude Code gave a session that is bound to no workstream | A prompt that names no workstream folder, or two of them with no handover, gets no answer and no record | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.51 | Engineering leader | keep a name typed for a session until the work changes | The script is silent while the name it works out is the one it recorded last, and a later prompt that names another workstream changes nothing | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.52 | Backend developer | send a prompt even when the naming script cannot read it | A broken payload or a missing session id ends in exit zero with nothing printed, and a prompt holding quotes, newlines and backticks still gets valid JSON | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.53 | Engineering leader | read a progress reply that does not open with a line about an older card | While a row of the window's arcs is marked in progress, a reply owes no **Needs you** line for a card open from an earlier reply, and a reply that waits names each such card in one line | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.54 | Engineering leader | be shown a card in full in the reply that raises it, whether work runs or not | A reply that raises a card and does not hold it in full at its top draws the `needs-you` warning, while a row is in progress as well | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.55 | Architect | be told when a card in an approach page's Open has no Views part | A write of the page reports the card by name as a RULE finding and the write goes ahead, and a card in Deferred is not asked for the part | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.56 | Backend developer | have the rules a reply must follow in front of the agent from the first prompt | The session-start script prints the heading *The short rules* and ten lines after the ground, and each line names a reference file and a heading that exist | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.57 | Engineering leader | not be sent a second progress reply for a finding about a page or a docs tree | While a row is in progress only `needs-you`, `reply-shape`, `handover` and `welcome` send the agent back, and every other finding is held and the hook exits zero | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.58 | Engineering leader | hear a held finding whole once no row is in progress | The first turn end with no row in progress says each held finding that is still true, and says nothing of one that was fixed in between | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.59 | Engineering leader | pass work on once and not be asked for the handover block again | After a reply that holds a whole block, a later pass-on with no block draws no finding while the step rows of the window's arcs have not moved, and a block is owed again once they move | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.60 | Engineering leader | pass work on over an open card without printing the card again | The pass-on is asked to name each open card in one line on the block's `open:` line, and never to put a card in full | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.61 | Backend developer | see a refusal in the pane and none of a hook's advice | A refusal is carried in the developer's pane and to the agent, and a note is set as context for the agent alone | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.62 | Editor | edit one file many times and have a soft finding of the doc standard said once | The same finding about one file is said once in a window, and a finding that changes is said again | POSITIVE | UNIT | PLANNED | — |

## Retired ids

**A promise is re-issued under the construct that now makes it, and the id it used to carry is never reused.** The moments a session offers are a part of the hook frame rather than a construct beside it, so the rows they carried are re-issued here. The numbers below are gaps, and gaps are expected.

| Retired | Re-issued as |
| --- | --- |
| `MKT.HOOK.01` – `MKT.HOOK.07` | `MKT.HOOKS.01` – `MKT.HOOKS.07`, in order |
| `MKT.LOOP.01` – `MKT.LOOP.07` | `MKT.HOOKS.08` – `MKT.HOOKS.14`, in order |
