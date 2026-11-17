---
name: execute
description: Carry out a go. Use the moment the developer gives the go on one arc or several - it derives the plan from the change sheets, briefs every helper from it, runs the full suites once per repository, and releases in chain order.
---
<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "7beac2a2"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "seen": "e02f4215"
    }
  ]
}
-->

1. The scope: every arc the go covers is DECIDED and its sheet reads whole (`workstream sheet check`). The go refuses an entry that is incomplete, a change with no patch or a step with no command or no proof, in every hand-written file, the book, config, migrations, contract, server, web and tests included, and no warning stands in place of the refusal; a change marked judged still carries its patch (`RULE.DEVEX.WORKSPACE.502` · MUST · check:split-plan).
2. Drift: `workstream state check --facts`, and `sheet edit` for each entry whose fact moved.
3. The plan: before a go, the lead runs `go propose` and puts the scope to the developer; then `workstream go write <lead> --scope …`, and `go show` to read it. The plan is derived from the workspace map, rebuilt from the repositories' files on every plan, and from the passes each repository's world declares, which the plugin that serves that world supplies (`RULE.DEVEX.WORKSPACE.508`, `RULE.DEVEX.WORKSPACE.509` · MUST · skill:spn-devex/execute).
4. Baselines: `go start` each repository's baseline, its whole suite on the base, once, and record what already fails.
5. The parts: launch each part's brief, a pass at a time; fold each report with `report write`.
   Run the parts three or four at a time, each on a Sonnet helper. Review, and the developer, stay with the main agent.
   The go is one workflow, generated from the plan across every arc it covers: patches apply, steps run, independent parts run side by side, and the waits come from the plan.
   The go applies the patches in passes and runs every tier once (`RULE.DEVEX.WORKSPACE.507` · MUST · check:split-plan). Apply each repository's patches as one pass, in release order, each after its base check, then connect. A helper is briefed only to re-cut a patch that no longer applies, and it edits and type-checks and never runs a test tier. Between passes nothing runs but what a repository's commit or push hook refuses without, and every tier runs once, in the full run. A part's proof is the type-check its pass names, and a code part formats before its proof.
   A new case is shown failing on the base before the code it proves, and it fails for the right reason (`RULE.DEVEX.WORKSPACE.511` · MUST · skill:spn-devex/execute): after the web tests pass, a worktree at the base holding only the new test files runs each case on a name the base has, and it fails at its assertion; a case on a name new to the base is red by that name's absence. The sheet holds what each case proves and its code is written in the test passes, once the names are final (`RULE.DEVEX.WORKSPACE.510` · MUST · skill:spn-devex/execute).
   A repository's apply part is the lead's own and holds every code change: `go start <lead> apply-<repo>` applies the patches and commits them. That part has no brief and no report. A patched change is never cut into a helper's part; `go write` refuses a change whose patch no longer applies, by name, and it is patched again against the new head. A step is a part of its own: run its command and check its proof.
   Each brief says the five things an order never does (`RULE.DEVEX.WORKSPACE.515` · MUST · skill:spn-devex/execute): `sed -i`, `git stash`, a commit, formatting a generated file, and starting a demo app from anywhere but the main checkout.
   Each brief carries the line that a helper meeting a name, a shape or a construct no entry holds stops, returns `needs-you` and lists it under `unnamed:`; `report write` refuses `landed` while it lists one (`RULE.DEVEX.WORKSPACE.495` · MUST · check:split-plan).
   A change from the developer mid-run: let what is running finish, `go check` to hold the parts it
   touches, update their entries and the preview and show it, then `go write` again before they run.
   A change that rewrites the approach page's What decides its figure in the same pass (`RULE.DEVEX.WORKSPACE.497` · MUST · check:doc-check): a figure, or the one `<!-- no figure: … -->` line.
6. Full runs: `go start` each repository's full run, once, with the runner's reuse on, so only what changed runs; every tier runs once, here, and every code row lands on it. A red case is fixed and rerun on only what its fix reaches.
   A code or proof row that names `provedBy` runs no tiers here: `go write` lists it as waiting on that arc, and it lands on that arc's proof run. A repository whose open code rows all name a later arc is released on its code alone, ahead of that proof, which the named arc's proof run supplies before the workstream closes.
   The fix pass reads each failure against its entry's trace and reruns only what the fix reaches.
7. Generated files, then the release chain, in the order the workspace map gives and the sheets set.
8. Close: `go check` prints nothing, and every row of the scope is LANDED; then `workstream close <workstream>`.
   When an arc lands, the lead runs `debug cost review` and raises each finding as a suggestion.

## The rules this step holds

<!-- Generated by the plugins build from `spn-devex/src/refs/rules.json`. Change the book, never these lines. -->

- **While work runs, the main agent delegates by default, and a Sonnet helper does the work** (`RULE.DEVEX.AGENT.076` · MUST · skill:spn-devex/execute)
- **A lens is worn while writing and convened at review, and the two are never substituted** (`RULE.DEVEX.AGENT.121` · MUST · skill:spn-devex/execute)
- **The moment the developer gives the go on one arc or several, the `execute` skill carries it out, so the plan is never left to memory** (`RULE.DEVEX.AGENT.158` · MUST · skill:spn-devex/execute)
- **Ideating owes nothing, and once it stops, any edit runs against a step that already exists** (`RULE.DEVEX.WORKSPACE.065` · MUST · skill:spn-devex/execute)
- **Every order states three things, in its own words** (`RULE.DEVEX.WORKSPACE.226` · MUST · skill:spn-devex/execute)
- **What a change owes the documents is set by its kind, and the agent reads the kind before it writes a line of the book** (`RULE.DEVEX.WORKSPACE.306` · MUST · skill:spn-devex/execute)
- **Before a pull request, each entry that changes behaviour has its book line read against the landed code, and the verdict goes in the tiers pass's report** (`RULE.DEVEX.WORKSPACE.330` · MUST · skill:spn-devex/execute)
- **Each arc reports what its orders cost and how many rows were rework, split into what ideation missed and what a later answer of yours asked for** (`RULE.DEVEX.WORKSPACE.331` · MUST · skill:spn-devex/execute)
- **A surprise in the tiers comes back to you as a card, with the rows it holds, and is never fixed quietly in code** (`RULE.DEVEX.WORKSPACE.360` · MUST · skill:spn-devex/execute)
- **A brief is in the light form: the files to change, the one rule they follow, and the row's acceptance** (`RULE.DEVEX.WORKSPACE.367` · MUST · skill:spn-devex/execute)
- **An order states its acceptance as named behaviour ids, and never as a count of a whole tier** (`RULE.DEVEX.WORKSPACE.368` · MUST · skill:spn-devex/execute)
- **An order takes no baseline of its own where a run on the same commit exists** (`RULE.DEVEX.WORKSPACE.369` · MUST · skill:spn-devex/execute)
- **An agent launches no child agent** (`RULE.DEVEX.WORKSPACE.370` · MUST · skill:spn-devex/execute)
- **You instruct and correct while the work runs, and each one is written down before it is acted on** (`RULE.DEVEX.WORKSPACE.378` · MUST · skill:spn-devex/execute)
- **When one step waits on something, the agent carries on with every step that does not depend on it** (`RULE.DEVEX.WORKSPACE.428` · MUST · skill:spn-devex/execute)
- **A fix you ask for now is done now** (`RULE.DEVEX.WORKSPACE.431` · MUST · skill:spn-devex/execute)
- **No handover is given while a child the window launched has no report** (`RULE.DEVEX.WORKSPACE.448` · MUST · skill:spn-devex/execute)
- **The go's scope runs as one set of passes, derived by `workstream go write` from the scope's sheets and the measured times** (`RULE.DEVEX.WORKSPACE.455` · MUST · skill:spn-devex/execute)
- **The plan is written only by `go write`, into the lead arc's `go.json`, and it never appears on a preview or on the approach page** (`RULE.DEVEX.WORKSPACE.456` · MUST · skill:spn-devex/execute)
- **A change to what is being built runs as five steps, and the plan never carries on with work you have just changed** (`RULE.DEVEX.WORKSPACE.459` · MUST · skill:spn-devex/execute)
- **A step lands once every entry it holds sits in a landed part, and a code step lands on the full run** (`RULE.DEVEX.WORKSPACE.461` · MUST · skill:spn-devex/execute)
- **A part or a row that waits on something outside the window reads waiting on, and is never named as ready** (`RULE.DEVEX.WORKSPACE.469` · MUST · skill:spn-devex/execute)
- **A code part added after a repository's full run has landed opens a second full run** (`RULE.DEVEX.WORKSPACE.470` · MUST · skill:spn-devex/execute)
- **Closing a workstream runs a retrospective that raises a suggestion for each pattern it finds** (`RULE.DEVEX.WORKSPACE.483` · MUST · skill:spn-devex/execute)
- **A go plans from a map of the workspace's own repositories, derived from their files on every plan and kept nowhere** (`RULE.DEVEX.WORKSPACE.508` · MUST · skill:spn-devex/execute)
- **The devex plugin stays stack-agnostic: it asks the plugin that serves each repository's world for that world's passes** (`RULE.DEVEX.WORKSPACE.509` · MUST · skill:spn-devex/execute)
- **The sheet holds what each case proves, and its code is written in the test passes, once the names are final** (`RULE.DEVEX.WORKSPACE.510` · MUST · skill:spn-devex/execute)
- **Every new case is shown failing on the base before the code it proves, and it fails for the right reason** (`RULE.DEVEX.WORKSPACE.511` · MUST · skill:spn-devex/execute)
- **Five things an order never does, and every brief says so** (`RULE.DEVEX.WORKSPACE.515` · MUST · skill:spn-devex/execute)
