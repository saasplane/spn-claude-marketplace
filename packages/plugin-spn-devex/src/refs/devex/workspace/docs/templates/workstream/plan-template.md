<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc carries its specification, or names the note that holds it · § A step names every surface the change reaches, and how you would know · § Documents first, and the order they are written in · § An order is one delegated execution, and every order follows the same rules
     and docs/04-capabilities/02-support/02-apps/06-tests/README.md § When a whole tier runs
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- A PLAN IS OPTIONAL, AND WRITTEN AT THE GO. It keeps the traps and the commands only: the specification, the sets and
     moves, and what a change reaches live in the arc's change sheet, which `workstream sheet show` prints. An arc keeps a plan
     only when it has traps or commands to hold, and never while it is PROPOSED; the rows are the steps,
     so no row writes a plan and nothing waits on one. Keep only the sections this arc needs and delete the rest. It
     holds no question: a question is a card on the approach page. It holds no status: the arc's rows do. It holds no
     fact: each fact is pinned in the arc's facts.jsonl by `workstream fact write`. -->
# N{{nnn}} — plan

## Traps — read before any row

- **{{the trap}}.** {{What happens if you walk into it, and what to do instead.}}

## Commands, and what green looks like

<!-- Only where a row's acceptance needs more than its own line. Green is the exit code AND the count, never the runner's
     summary line alone. A test command is selective: its selection after `--`, written from the rows' files, and its green
     the named behaviour ids read as SUCCESS from the run's file. The whole tiers, the walks and the look are the arc's
     PROOF row's, once; no other row runs them. -->

| Check | Command (run from) | Green after |
| --- | --- | --- |
| {{name}} | `{{command}}` ({{folder}}) | {{exit 0 · exact count}} |
