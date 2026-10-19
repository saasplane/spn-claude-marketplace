---
row: "{{row}}"                          # the row this order carries out; the file is orders/{{row}}.md
model: {{sonnet}}                       # Sonnet for a written order; Opus only where the order designs, and says why
blockedBy: ["{{row or q<n>}}"]          # what must land first; [] when nothing
touches: ["{{repository:place}}"]       # what the row writes, so two orders never write one file
decisions: [{{q<n>}}]                   # the cards the row rests on, by id
facts: [{{f<n>}}]                       # the facts it rests on, by id, from the arc's facts.jsonl
---
<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § An arc carries its specification, or names the note that holds it · § An order is one delegated execution, and every order follows the same rules · § The formats · § Orders name what they need by id, and a workflow runs the ready rows · § Work is sized by its kind, and fixes gather into a round
     and docs/04-capabilities/02-support/01-apps/06-tests/README.md § The selective loop — what runs while work is under way
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ORDER IS ONE DELEGATED EXECUTION: a child session in this workspace, or a window of its own in another
     repository. Every path is absolute, so either can resolve it. It is saved as `notes/N<nnn>/orders/<row>.md`, and
     the front matter above comes first, because the commands read it and never the prose below it. -->
<!-- AN ORDER IS FOR WORK LONGER THAN ABOUT 15 MINUTES. The coordinator does shorter work itself. -->
<!-- TWO FORMS. Pick one and delete the other's rows.
     LIGHT FORM, for fixes (a one-line fix is made inline and has no order; several fixes in one area are one order): a targeted test
     for each fix, the book updated once per round, no shots; the heavy checks run once, at the gate before a release.
     FULL FORM, for a new prop, token, rule or construct: a fail-first test, the book row, the shots, and a section that names every
     new construct before anything is added. -->
<!-- AN ORDER QUOTES THE FACTS IT NEEDS AND POINTS TO THE RULES IT FOLLOWS. A fact is one line with its source and commit, as
     plan.md pins it, so `state check` still finds one that moved. A rule is a named section, never a whole page or a report. -->
# Order {{row}} — {{what this agent does}}

| | |
| --- | --- |
| **Repo** | `{{repo}}` · **Depth:** {{child here · own window}} · **Run from:** `{{absolute path}}` |
| **Workstream** | `{{NNN-subject}}` · **Arc:** [`N{{nnn}}`](../../../approach.html#N{{nnn}}), row {{row}} — `spn-devex workstream rows show {{NNN}}` reads it |
| **Pinned** | the facts named above, each pinned to its commit; `spn-devex workstream state check` lists any source that moved since |
| **Form** | {{light · full}} |
| **Read first** | A few items: the preview's section `{{absolute path}}/notes/N{{nnn}}/preview.html#{{part}}` · `{{absolute path}}/notes/N{{nnn}}/plan.md` § Traps · the facts quoted below with their pins |
| **Look** | {{none · the look decided on `notes/N{{nnn}}/preview.html#{{part}}`, with the developer's go of {{date}}}} |

**Launch no agent.** **Read only:** the parts named in *Read first*, above, and the file you change. **Hand back** at most {{10 for the light form · 15 for the full form}} lines; save the same as `orders/{{row}}.report.md` beside this order, its front matter first.

## What already exists

{{The mechanism this order changes or sits beside, and its twin elsewhere. Name the part of each file to read: its
section, its function or its lines. Name a whole file only where the whole is needed.}}

## The constructs (full form only)

{{What exists, what is reused, and every new name and path this order adds. Nothing unnamed here is added.}}

## The outcome

{{What is true when this order is done, in one paragraph.}}

## Files you own

- `{{absolute path}}`

Every other file belongs to another agent. If you must touch one, stop and say so in your report.

## Loop

Documents first, then source. Then run the cases of what you touched, under the working run name, until they pass. In the
light form, a targeted test for each fix is the proof, the book is updated once for the round and no shot is taken. In the full
form, run every case the step touched once more under the fresh run name, and stamp the rows from that run. Run no whole
tier. A case written to fail first is one narrow run on the unchanged code. No source or test file changes while a
test run for this repository is in flight.

| | |
| --- | --- |
| **Touched** | {{the behaviour ids the capability page of the changed code claims; and every caller's cases where a contract state or a generated client changed}} |
| **Selection** | `spnutils apps test {{tier}} {{run}} {{package}} -- {{the runner's own selection, written from the plan's list of files}}`; for an estate package, `spnutils infra test {{run}} {{package}}` |
| **Working run name** | `{{name}}`, reused by every run made while coding |
| **Fresh run name** | `{{name}}`, used once, for the run the rows are stamped from |
| **Stamp** | `spn-devex behaviours stamp write {{fresh run name}} {{repo}}`, and never with `--reach repository` |

Take no baseline where the arc's facts hold a run on the pinned commit: that fact's number is your *Before*, named by
its id. Run the gates once, at the end of each step. A whole test tier is not one of them, unless one of the five cases
holds and the order names which.

## Steps

1. {{the step, exact enough to do without asking}}

## Prove it

| Check | Command | Before | After | Artifact |
| --- | --- | --- | --- | --- |
| {{a gate that is not a test tier, from the plan's Commands table}} | `{{command}}` | {{exit · count, from fact f<n> where it holds a run on the pin}} | {{exit · count}} | `{{path}}` {{changes how}} |
| the behaviour ids | {{the selection above, under the fresh run name}} | {{each id's `Status` in its row today}} | {{each named id}} → `SUCCESS`, read from the run file; an id the run does not name is *nothing proves this* | `tests/.output/{{tier}}/runs/{{fresh run name}}.json` |
| known bad | {{the new case run against the unchanged code}} | — | {{red, and the line it prints}} | — |

## Never

Launch no child agent: do every step yourself.

{{What this order must not do beyond the rules: files it leaves alone, cycles it does not pay.}}

---

## Report

Your hand-back to the coordinator: your final message, saved as `orders/{{row}}.report.md` beside this order. It is
not a report artifact. The reply is at most 15 lines, and the file at most 40. List no file and paste no diff: the
coordinator reads both from git. The file opens with its front matter, which `spn-devex workstream report write` folds
into the row; the prose under it is for the coordinator.

```text
---
row: "{{row}}"
outcome: {{landed · stopped · needs-you}}
proof: "{{each gate's result line, joined by middots}}"
commits: { {{repo}}: [{{sha}}] }
followUps: ["{{new row id}} {{its title}}"]
cost: { tokens: {{n}}, minutes: {{n}} }
---
```

**Steps:** {{each step: done · not done, and why}}.
**Gates run:** each as `command` → exit {{code}} · {{counts}} · cache {{off · hit}}. A test run as its run file, and each
named id → {{`SUCCESS` · its status · *nothing proves this*}}.
**Decided, and not in the order:** {{each decision in one line, or none}}.
**Left:** {{what is not done · register text for the coordinator · what was found and not changed · nothing}}.
**Needs the developer:** {{a card, or none}}.
