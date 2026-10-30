---
name: execute
description: Carry out a go. Use the moment the developer gives the go on one arc or several - it derives the plan from the change sheets, briefs every helper from it, runs the full suites once per repository, and releases in chain order.
---

1. The scope: every arc the go covers is DECIDED and its sheet reads whole (`workstream sheet check`).
2. Drift: `workstream state check --facts`, and `sheet edit` for each entry whose fact moved.
3. The plan: `workstream go write <lead> --scope …`, then `go show` to read it.
4. Baselines: `go start` each repository's baseline, and record what already fails.
5. The parts: launch each part's brief, a pass at a time; fold each report with `report write`.
   A change from the developer mid-run: let what is running finish, `go check` to hold the parts it
   touches, update their entries and the preview and show it, then `go write` again before they run.
6. Full runs: `go start` each repository's full run; every code row lands on it.
7. Generated files, then the release chain, in the order the sheets set.
8. Close: `go check` prints nothing, and every row of the scope is LANDED; then `workstream close <workstream>`.
