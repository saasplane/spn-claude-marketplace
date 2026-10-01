<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § An arc carries its specification, or names the note that holds it · § An order is one delegated execution, and every order follows the same rules
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- AN ORDER IS ONE DELEGATED EXECUTION: a child session in this workspace, or a window of its own in another
     repository. Every path is absolute, so either can resolve it. -->
# Order {{nn}} — {{what this agent does}}

| | |
| --- | --- |
| **Repo** | `{{repo}}` · **Depth:** {{child here · own window}} · **Run from:** `{{absolute path}}` |
| **Workstream** | `{{NNN-subject}}` · **Arc:** `{{absolute path to arcs/N<nnn>-<subject>.md}}`, rows {{k}} |
| **Pinned** | `{{repo}}` @ `{{sha}}` — stale if `git -C {{repo}} log {{sha}}..HEAD -- <path>` lists a file you touch |
| **Model** | {{Opus 5 · Sonnet 5}} |
| **Read first** | `spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md` § An order is one delegated execution, and every order follows the same rules · `{{absolute path}}/orders/00-facts.md` (this arc's checkout, shared nodes, the gates you may run) · `{{absolute path}}/plan.md` § Traps, § Commands, § Rows {{k}} · the arc's Log |

## What already exists

{{The mechanism this order changes or sits beside, and its twin elsewhere. Read these files whole before writing.}}

## The outcome

{{What is true when this order is done, in one paragraph.}}

## Files you own

- `{{absolute path}}`

Every other file belongs to another agent. If you must touch one, stop and say so in your report.

## Loop

Documents first, then source, then the changed cases run alone until they pass, then the whole level once, then the
stamp. A case written to fail first is one narrow run on the unchanged code. No source or test file changes while a
test run for this repository is in flight.

## Steps

1. {{the step, exact enough to do without asking}}

## Prove it

| Check | Command | Before | After | Artifact |
| --- | --- | --- | --- | --- |
| {{from the plan's Commands table}} | `{{command}}` | {{exit · count}} | {{exit · count}} | `{{path}}` {{changes how}} |
| known bad | {{the new case run against the unchanged code}} | — | {{red, and the line it prints}} | — |

## Never

Launch no child agent: do every step yourself.

{{What this order must not do beyond the rules: files it leaves alone, cycles it does not pay.}}

---

## Report

Written by: {{the agent's final message, saved here by the coordinator · the window's own close}}.

| File | What changed | Commit |
| --- | --- | --- |
| `{{absolute path}}` | {{one line}} | `{{sha}}` · — (the coordinator commits) |

**Diff:** `git -C {{repo}} diff --stat -- <the files you own>`, pasted as printed; it lists exactly the files above.
**Gates run:** each as `command` → exit {{code}} · {{pass/fail/skipped}} · cache {{off · hit}}.
**Register text for the coordinator:** {{rows, or none}}. **Found, not changed:** {{each with its file; the coordinator
adds it to the plan's Findings table}}. **Needs the developer:** {{a card, or none}}.
