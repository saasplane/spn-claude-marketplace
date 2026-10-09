<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § An arc carries its specification, or names the note that holds it · § An order is one delegated execution, and every order follows the same rules
     and docs/04-capabilities/02-support/01-apps/06-tests/README.md § The selective loop — what runs while work is under way
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ORDER IS ONE DELEGATED EXECUTION: a child session in this workspace, or a window of its own in another
     repository. Every path is absolute, so either can resolve it. -->
<!-- AN ORDER IS FOR WORK LONGER THAN ABOUT 15 MINUTES. The coordinator does shorter work itself. -->
# Order {{nn}} — {{what this agent does}}

| | |
| --- | --- |
| **Repo** | `{{repo}}` · **Depth:** {{child here · own window}} · **Run from:** `{{absolute path}}` |
| **Workstream** | `{{NNN-subject}}` · **Arc:** `{{absolute path to arcs/N<nnn>-<subject>.md}}`, rows {{k}} |
| **Pinned** | `{{repo}}` @ `{{sha}}` — stale if `git -C {{repo}} log {{sha}}..HEAD -- <path>` lists a file you touch |
| **Model** | {{Opus 5 · Sonnet 5}} |
| **Read first** | Only these parts: `spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md` § An order is one delegated execution, and every order follows the same rules · `{{absolute path}}/orders/00-facts.md` § {{the checkout and the gates this order uses}} · `{{absolute path}}/plan.md` § Traps, § Commands, § Rows {{k}} · the arc's Log, {{the entries this order needs, by date}} |

**Launch no agent.** **Read only:** the parts named in *Read first*, above, and the file you change. **Hand back** at most 15 lines; write the rest to `{{nn}}-{{subject}}-report.md` beside this order.

## What already exists

{{The mechanism this order changes or sits beside, and its twin elsewhere. Name the part of each file to read: its
section, its function or its lines. Name a whole file only where the whole is needed.}}

## The outcome

{{What is true when this order is done, in one paragraph.}}

## Files you own

- `{{absolute path}}`

Every other file belongs to another agent. If you must touch one, stop and say so in your report.

## Loop

Documents first, then source. Then run the cases of what you touched, under the working run name, until they pass. Then
run every case the step touched once more under the fresh run name, and stamp the rows from that run. Run no whole
tier. A case written to fail first is one narrow run on the unchanged code. No source or test file changes while a
test run for this repository is in flight.

| | |
| --- | --- |
| **Touched** | {{the behaviour ids the capability page of the changed code claims; and every caller's cases where a contract state or a generated client changed}} |
| **Selection** | `spnutils apps test {{tier}} {{run}} {{package}} -- {{the runner's own selection, written from the plan's list of files}}`; for an estate package, `spnutils infra test {{run}} {{package}}` |
| **Working run name** | `{{name}}`, reused by every run made while coding |
| **Fresh run name** | `{{name}}`, used once, for the run the rows are stamped from |
| **Stamp** | `spn-devex behaviours stamp write {{fresh run name}} {{repo}}`, and never with `--reach repository` |

Take no baseline where `00-facts.md` holds a run on the pinned commit: its number is your *Before*. Run the gates once,
at the end of each step. A whole test tier is not one of them, unless one of the five cases holds and the order names
which.

## Steps

1. {{the step, exact enough to do without asking}}

## Prove it

| Check | Command | Before | After | Artifact |
| --- | --- | --- | --- | --- |
| {{a gate that is not a test tier, from the plan's Commands table}} | `{{command}}` | {{exit · count, from `00-facts.md` where it holds a run on the pin}} | {{exit · count}} | `{{path}}` {{changes how}} |
| the behaviour ids | {{the selection above, under the fresh run name}} | {{each id's `Status` in its row today}} | {{each named id}} → `SUCCESS`, read from the run file; an id the run does not name is *nothing proves this* | `tests/.output/{{tier}}/runs/{{fresh run name}}.json` |
| known bad | {{the new case run against the unchanged code}} | — | {{red, and the line it prints}} | — |

## Never

Launch no child agent: do every step yourself.

{{What this order must not do beyond the rules: files it leaves alone, cycles it does not pay.}}

---

## Report

Your hand-back to the coordinator: your final message, saved as `{{nn}}-{{subject}}-report.md` beside this order. It
is not a report artifact. The reply is at most 15 lines, and the file at most 40. List no file and paste no diff: the
coordinator reads both from git.

**Steps:** {{each step: done · not done, and why}}.
**Gates run:** each as `command` → exit {{code}} · {{counts}} · cache {{off · hit}}. A test run as its run file, and each
named id → {{`SUCCESS` · its status · *nothing proves this*}}.
**Decided, and not in the order:** {{each decision in one line, or none}}.
**Left:** {{what is not done · register text for the coordinator · what was found and not changed · nothing}}.
**Needs the developer:** {{a card, or none}}.
