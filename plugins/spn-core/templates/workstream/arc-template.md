<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The arc · § An arc is named for the cycle it pays
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
# N{{n}} — {{the arc, named for the cycle it pays}}

Status: **PROPOSED — waits on {{the card or the arc it follows}}.** Opened {{date}}.   <!-- The status is one of eight, and the set is closed (RD.DEVEX.058): PROPOSED · DECIDED · RUNNING · HELD — waits on Q<n> · PART-LANDED · LANDED · CARRIED — to <where> · DROPPED — <why>. LANDED, CARRIED and DROPPED are terminal. The set is defined in the workspace capability, § The arc; this comment cites it and states no rule of its own. Write the line exactly as `Status: **WORD ...**` — one spelling, because a reader that has to know two knows neither. --> {{One sentence: what this arc changes, and why it is one arc.}}
Repos: {{repo}} · {{repo}} — {{in what order, and why}}

<!-- HELD is the state a scope change puts an arc in when it reaches what is planned: the card is on the page, the arc
     names it, and what changes under each option is written here; nothing in the arc runs until the card is answered,
     and the log records the revision. An arc is a plan, never an argument: no card lives here — a question goes to the approach page's Open section.
     Name the arc for the cycle it pays. Say what done means before you name a step. Log every instruction and correction
     as a dated line. This file is copied from arc-template.md; keep the field rows, in this order. -->

| Field | This arc |
| --- | --- |
| **Altitude** | **{{what this arc decides, in one phrase.}}** {{What is true after it lands}} |
| **Highest document** | `{{repo}}` → `{{the document that must change first}}` |
| **Lowest package** | `{{the deepest file or folder it touches}}` |
| **Design gate** | {{the cards on the page that must be answered, or "passed"}} |
| **Cycle it pays** | {{a book change · a spnutils release · a plugin reinstall · a renumbering · a corpus pass · a symbols regeneration · a gate flip · none}} |
| **What it must follow** | N{{m}} — {{why}} |
| **Model** | {{Opus 5 for rules and reading · Sonnet 5 for batches · never Haiku}} |

## What done means
{{One paragraph: the observable state, and the command or check that shows it.}} An arc runs to this in one window unless a card blocks it; a milestone is reported between steps and never ends the turn while a row is runnable.

## Steps
| # | What | Where | How you would know it works |
| --- | --- | --- | --- |
| 1 | {{…}} | `{{repo · path}}` | {{the observable result}} |

## Before you write LANDED
{{The approach page is current: every row this arc owns reads landed, carried or deferred; every card it answered
has left `Open` for the section that states it. The page is the state and this file is a log, so a developer who
opens the page reads the truth without asking anybody. `11-workspace.md` § Every workstream document is current.}}

## Log
- **{{date}} — {{what was decided or corrected, and why}}.**
