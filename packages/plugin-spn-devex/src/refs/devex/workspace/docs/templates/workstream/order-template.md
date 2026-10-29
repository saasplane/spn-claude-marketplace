---
row: "{{row}}"                          # the row this order carries out; the file is orders/{{row}}.md
model: {{sonnet}}                       # Sonnet for a written order; Opus only where the order designs, and says why
blockedBy: ["{{row or q<n>}}"]          # what must land first; [] when nothing
touches: ["{{repository:place}}"]       # what the row writes, so two orders never write one file
decisions: [{{q<n>}}]                   # the cards the row rests on, by id
facts: [{{f<n>}}]                       # the facts it rests on, by id, from the arc's facts.jsonl
---
<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A workstream works on one branch per repository · § Once an arc is decided, it runs in three passes per repository · § The arc · § An arc carries its specification, or names the note that holds it · § An order is one delegated execution, and every order follows the same rules · § The formats · § Orders name what they need by id, and a workflow runs the ready rows · § Work is sized by its kind, and fixes gather into a round
     and docs/04-capabilities/02-support/02-apps/06-tests/README.md § The selective loop — what runs while work is under way
     and docs/04-capabilities/01-devex/01-function/02-scm.md § A workstream's branch, and its promotion
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ORDER IS ONE DELEGATED EXECUTION: a child session in this workspace, or a window of its own in another
     repository. Every path is absolute, so either can resolve it. It is saved as `notes/N<nnn>/orders/<row>.md`, and
     the front matter above comes first, because the commands read it and never the prose below it. -->
<!-- AN ORDER IS CUT PER REPOSITORY AND PASS (docs, code and tests, or the owed tiers), from the preview's file list, never per
     row. A row the preview does not pin is fixed in the preview first. -->
<!-- ONE WORKTREE SET SERVES THE WORKSTREAM: orders whose `touches` name the same repository run one after another, and
     orders in different repositories may run side by side. -->
<!-- AN ORDER IS FOR JUDGEMENT WORK LONGER THAN ABOUT 15 MINUTES. A mechanical row (a pin move, a rename, a prop swap
     the brief could list) is the coordinator's own, done directly, with no order, brief or report. -->
<!-- THE LIGHT FORM IS THE DEFAULT: the files, the one rule, the acceptance, and nothing else to read first. Work that adds
     a new prop, token, rule or construct keeps the section "The constructs"; delete it otherwise. No order runs a whole
     tier, a browser walk or a probe, and none takes shots: those run once, in the arc's final re-check row. -->
# Order {{row}} — {{what this agent does}}

| | |
| --- | --- |
| **Repo** | `{{repo}}` · **Run from:** `{{absolute path}}` |
| **Arc** | `{{NNN-subject}}` [`N{{nnn}}`](../../../approach.html#N{{nnn}}), row {{row}} |

**Launch no agent.** Stop at 150k of context or 100 turns, at the next whole step, save the report with what is left and
hand back. **Read only** the files below; read further only where one of them sends you, and read a file over 20 KB in
parts. **Hand back** at most 8 lines; save the report, at most 15 lines, as `orders/{{row}}.report.md` beside this order, its front matter first.

<!-- IN AN ARC THAT KEEPS A CHANGE SHEET (arcs/N<nnn>/sheet.json), THE ORDER NAMES ITS ROW AND NOTHING ELSE ABOUT THE WORK:
     the files, the rules, the callers, the tiers and the book lines come from the row's entries, read first with
     `spn-devex workstream sheet show N{{nnn}} --row {{row}}`, and never from prose here. The launch check refuses an
     order whose row names an entry the sheet does not hold. An arc with no sheet keeps the two sections below. -->
## The files

- `{{absolute path}}` — {{what changes in it, in a line; in a sheet arc: "the entries of row {{row}}, from `workstream sheet show`"}}

Every other file belongs to another agent. If you must touch one, stop and say so in your report.

## The rule

{{The one rule these files follow, as the section that states it: `{{chapter}}` § {{section}}, or a fact quoted with its
source and commit. In a sheet arc, the rules and the book lines are the row's entries'.}}

## The constructs (new prop, token, rule or construct only)

{{What exists, what is reused, and every new name and path this order adds. Nothing unnamed here is added.}}

## Acceptance

{{The row's acceptance: `spnutils apps check` on each node you touched, and the specs you changed or added, run
narrowed under one fresh run name, each named id → `SUCCESS` read from the run file; an id the run does not name is
*nothing proves this*. A case written to fail first only for new behaviour, one narrow run on the unchanged code.
Stamp with `spn-devex behaviours stamp write {{fresh run name}} {{repo}}`, never with `--reach repository`.}}

---

## Report

Your report, saved as `orders/{{row}}.report.md` beside this order, at most 15 lines. It is not a report artifact. Your
hand-back to the coordinator is your final message, and says the same in at most 8 lines. Paste no diff: the
coordinator reads it from git. The file opens with its front matter, which `spn-devex workstream report write` folds
into the row.

```text
---
row: "{{row}}"
outcome: {{landed · stopped · needs-you}}
proof: "{{each gate's command and exit code, joined by middots}}"
commits: { {{repo}}: [{{sha}}] }
followUps: ["{{new row id}} {{its title}}"]
cost: { tokens: {{n}}, minutes: {{n}} }
---
```

**Rows:** {{each row's outcome}}.
**Gates:** each as `command` → exit {{code}}.
**Stage:** {{the paths to stage}}.
**Commit:** {{a subject and body for a developer reviewing on GitHub: what changed for someone using the code, in the words of the approach page and the preview, with no workstream, arc, row, order or card number}}.
**Decided, and not in the order:** {{each decision in one line, or none}}.
**Needs the developer:** {{a card, or none}}.
