<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § A step row says where, at what altitude, and how · § A step names every surface the change reaches, and how you would know · § A suggestion is recorded before it is executed · § A prompt while an arc runs · § An arc's status says which of eight states it is in
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ARC IS THE INDEX AND THE STATE; ITS PLAN IS THE WORK ORDER. What each row changes, exactly, lives in
     `notes/N<n>/plan.md`, pinned to commits. An arc is a plan, never an argument: no card lives here. A question
     is a card on the approach page's Open; HELD names that card; a scope change is logged as a dated line.
     Name the arc for the cycle it pays, never for its subject. -->
# N{{n}} — {{the cycle it pays, named: "R: the support release that carries X"}}

Status: **{{PROPOSED · DECIDED · RUNNING · HELD — waits on Q<n> · PART-LANDED · LANDED · CARRIED — to <where> · DROPPED — <why>}} — {{date}}.** {{One sentence: what this arc changes, and why it is one arc.}}

| Field | This arc |
| --- | --- |
| **Decides** | **{{what this arc decides, in one phrase}}.** {{What is true once it lands.}} |
| **Highest document** | `{{repo}}` → `{{the document that must change first}}` |
| **Lowest package** | `{{the deepest file or folder it touches}}` |
| **Repos** | {{repo}} → {{repo}}: chain order, and why this order |
| **Cycle it pays** | {{a book change · a support release · a plugin release and reinstall · a renumbering · a corpus pass · a symbols regeneration · a full verification}} (an arc with no cycle is a step on another arc) |
| **What it must follow** | {{N<m> — why it must land first}}, or nothing |
| **Design gate** | {{the cards that must be answered first: Q<n>}}, or passed |
| **Green baseline** | {{the whole-repository gate}} at `{{sha}}`, {{date}}: {{its result line}} |
| **Model** | Coordinator: {{Opus 5}}. Each order's model is in the plan's Orders table. |
| **Page** | `{{subject}}-approach.html`: this arc's Cycles row, and the cards it owns ({{Q<n>}}) |
| **Work order** | `notes/N{{n}}/plan.md` (pinned facts, commands, rows, orders) · `samples/` (approved previews) · `scripts/` · `orders/` (one brief and its report per agent) |

## What done means

{{The state a person can observe once this lands, and the command from the plan's Commands table that shows it.}}

## Steps

<!-- A ROW IS ONE REPOSITORY AT ONE ALTITUDE. Repo is the repository, or `—` for the workstream itself; Altitude is
     DOCS · CODE (with its tests) · GENERATED · RELEASE · PROOF; rows run in chain order by repository, then by
     altitude. What names the files, or "plan § k" — and every "plan § k" has that section. Mechanism is by hand ·
     script · command · agents (order <nn>). Acceptance cites a row of the plan's Commands table and its count:
     `command` → before → after — never a sentence. A GENERATED row's acceptance is "no diff on a second run".
     A RELEASE row's acceptance names a consumer install (the published packages, no overrides), never only the
     tool's version. A row inserted mid-run takes a letter suffix (4b). State follows the chapter: empty (not
     started) · in progress <date> <time> <offset> (set when the row starts; landing replaces it) · ◐ stopped — <what was done, what is unsafe> · ⏸ held on Q<n> (waits on that open card; not runnable until it is answered) · ✅ landed — `<commit>` — <the acceptance's result line> ·
     ↷ carried — to <where> · ⊘ deferred — <why>. Row 0 is a precondition of RUNNING; the last row is never deleted. -->

| # | Repo | Altitude | What | Mechanism | Acceptance | State |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | — | DOCS | write `notes/N{{n}}/plan.md`: pins, what exists today, commands with their before, rows, orders | agents (order 00) | every plan row has Files, Fails before and Proof; every Commands row has its Before | |
| 1 | {{repo}} | DOCS | plan § 1 | by hand | `{{Commands row}}` → {{before}} → {{after}} | |
| 2 | {{repo}} | CODE | plan § 2 | agents (order 02) | `{{Commands row}}` → {{before}} → {{after}} | |
| {{n}} | — | PROOF | re-run every gate above in one pass, cache off, after the last write; and the consumer install | command | each Commands row → its after, in one run | |

## Before you write LANDED

Every row is ✅ landed, ↷ carried or ⊘ deferred, and none is ◐ stopped or ⏸ held. The PROOF row's output is recorded, run with
the cache off. Every card this arc answered has left the approach page's Open for the section that states it, and
this arc's Cycles row reads LANDED. The landing is committed. The arcs are the state, and the page shows them.

## Log

<!-- An answer or a review point lands in the same turn in the card, in this log and every row it changes, and in
     notes/N<n>/ (the spec, the plan, and any sample they name). Name the note files it changed. A decision the book,
     the plugin references or the lenses settle is logged here with its reason, and never raised as a card. -->
- **{{date}} — {{what was decided or corrected, by whom, and why; the notes it changed}}.**
