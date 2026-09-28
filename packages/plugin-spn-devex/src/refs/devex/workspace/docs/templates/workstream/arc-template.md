<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § An arc is named for the cycle it pays · § A step names every surface the change reaches, and how you would know · § An arc carries its specification, or names the note that holds it
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
# N{{n}} — {{the arc, named for the cycle it pays}}

Status: **PROPOSED — waits on {{the card or the arc it follows}}.** Opened {{date}}.   <!-- The status is one of eight, and the set is closed (RD.DEVEX.WORKSPACE.058): PROPOSED · DECIDED · RUNNING · HELD — waits on Q<n> · PART-LANDED · LANDED · CARRIED — to <where> · DROPPED — <why>. LANDED, CARRIED and DROPPED are terminal. The set is defined in the workspace capability, § The arc; this comment cites it and states no rule of its own. Write the line exactly as `Status: **WORD ...**` — one spelling, because a reader that has to know two knows neither. --> {{One sentence: what this arc changes, and why it is one arc.}}
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

## What this change reaches
<!-- Name every surface before you name a step. A rename, an outline change, a contract change and a
     new rule each reach a fixed set of surfaces — the chapter § A step names every surface the change
     reaches lists them per kind. Delete the rows that do not apply; never delete the section. -->

| Surface | This arc | Why it is reached |
| --- | --- | --- |
| Construct chapters | `{{repo}} → {{path}}` | {{…}} |
| Behaviour rows | `{{repo}} → {{path}}` | {{…}} |
| Capability chapters | `{{repo}} → {{path}}` | {{…}} |
| Register rows | `{{ids}}` | {{…}} |
| Source | `{{repo}} → {{path}}` | {{…}} |
| Generated | `{{what regenerates, and by which command}}` | {{…}} |
| Restatements | `{{the refs and templates that cite any of the above}}` | {{…}} |

## The specification
<!-- WHAT THE STEPS ACT ON, carried here or named by path (RD.DEVEX.WORKSPACE.064). A step that states a
     COUNT and not the members has left the specification where the next session cannot reach it,
     and a conversation is not a place. A move is a TABLE with unique targets. A step producing many
     files carries ONE WORKED EXAMPLE, because a brief without one produces placeholders.
     Too large for this section? It goes to notes/{{n}}-{{subject}}.tsv and a step names that path.
     Carry NO COUNTS — RD.DEVEX.WORKSPACE.162. Name the set; let the reader count it. -->

{{The closed sets, the move table, the rules — whichever this arc acts on. Delete what does not
apply; never delete the section, because an empty one is a claim that the steps act on nothing.}}

## Traps
<!-- What is known to go wrong on this path, where somebody executing will meet it rather than in a
     log they will not read first. A trap that cost one session costs the next one the same, and the
     only thing that stops it is the sentence being in the way. -->

- {{the trap, and what to do instead}}

## Steps
<!-- How you would know is a COMMAND or a COUNT, never a sentence. A check whose subject is the file
     the step just wrote proves the write, not the rule — name a gate that had a reason to fail. -->

| # | What | Where | How you would know it works |
| --- | --- | --- | --- |
| 1 | {{…}} | `{{repo · path}}` | `{{the command}}` → {{the count or exit code}} |
| {{n}} | **Re-run what the earlier steps moved** | — | {{every gate above, green in one pass at the end}} |

## Before you write LANDED
{{The approach page is current: every row this arc owns reads landed, carried or deferred; every card it answered
has left `Open` for the section that states it. The page is the state and this file is a log, so a developer who
opens the page reads the truth without asking anybody. `11-workspace.md` § Every workstream document is current.}}

## Log
- **{{date}} — {{what was decided or corrected, and why}}.**
