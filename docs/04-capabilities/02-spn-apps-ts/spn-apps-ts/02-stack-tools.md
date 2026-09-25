<!-- spn:doc
{"id": "spn-apps-ts-capabilities-stack-tools", "variant": "capability", "title": "Stack Tools in spn-apps-ts", "lenses": ["SERVER_DEV", "QA"], "status": "DONE", "realizes": ["stack-tools"], "summary": "Two commands over one behaviour register — the published action surface measured against what claims it, and the writer that puts what the last run found into two cells and touches nothing else.", "keywords": ["tool", "coverage", "action", "behaviour row", "register", "tier"]}
-->

# Stack Tools in spn-apps-ts

`For: Backend developer · Quality engineer` · `Status: ✅ DONE` · `Realizes: Stack Tools`

Two files sit under `plugins/spn-apps-ts/hooks/tools/`, and neither is wired to an event. Each is run by its own path against one TypeScript stack repository, and each reads or writes the same behaviour register. The register's shape lives in a third file so the reader and the writer cannot disagree about it. What decides both tools' design is the line between a decision and a finding. **Four of a row's cells are somebody's decision and two are what a run found**, and a tool that wrote over the first four would turn a declaration into a guess.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The action surface | `plugins/spn-apps-ts/hooks/tools/action-coverage.ts` | every declared API action, matched against the rows that claim it |
| The row writer | `plugins/spn-apps-ts/hooks/tools/behaviour-rows.ts` | writes `Status` and `Updated at` from a run's own results file |
| What a register is | `plugins/spn-apps-ts/hooks/lib/register.ts` | the eight headings, in order, and the test for one row |

## Follows the pattern

- A tool is run by name and answers with an exit code — [Tools in spn-devex](../../01-spn-devex/spn-devex/05-tools.md)
- The behaviour row and the register it lives in — the foundation's `02-docs/02-document.md`

## Special handling

### A register is found by its header, never by a path

**Why** — *a docs tree that moves must not break either tool*. It is also the only way to be right in the per-node layout and in the one-tree-per-repository layout that follows it.
**What** — any table carrying the eight headings is a behaviour register, wherever in the repository it sits.
**How** — the headings and the row test are one exported pair, read by both tools. `plugins/spn-apps-ts/hooks/lib/register.ts`.

### Two cells are the agent's and the rest are a person's

**Why** — *`Type` and `Tier` are decisions somebody made*, while `Status` and `Updated at` are what the last run found. The two were one cell until they disagreed quietly, so a row whose case had stopped running still read as proven.
**What** — the writer touches those two cells and nothing else. A hand edit to either is a claim rather than a finding.
**How** — every other cell is copied through untouched. `plugins/spn-apps-ts/hooks/tools/behaviour-rows.ts`.

### A run speaks only for the tiers it ran

**Why** — *a partial run that reset the whole register would make the status swing on every run*, and nobody could read a red as new.
**What** — a contract run updates rows declaring the contract tier and leaves journey rows exactly as it found them. A row marked as checked by a person is never written over.
**How** — this is why the tier cell is a person's to declare: it is what a run matches itself against. Same file.

### It reads the run's own artifact, never a spec

**Why** — *a derived status reports a case that exists as a case that ran*. Crossing a route with a surface, or scanning a source tree for case titles, cannot see a case that was skipped or filtered out.
**What** — the writer reads the results file the runner produced, so a case that never reached the runner says so.
**How** — `spn-devex`'s own writer reads the same artifact shape for this repository, which is not a stack. Same file, and `plugins/spn-devex/hooks/tools/behaviour-status.mjs`.

### Coverage is measured against actions, not routes

**Why** — *a route says where a screen lives and nothing about what can be done there*. One settings route can carry six actions behind it, and counting routes reports that screen as covered while five of them have never been performed.
**What** — every published API action is an interaction, whether a person performs it through a browser or another system performs it through the generated client. The tool reads the declared actions and the register's rows and compares the two.
**How** — the actions come from the route-command declarations in a node's own source. `plugins/spn-apps-ts/hooks/tools/action-coverage.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | a stack repository | its declared API actions, its behaviour registers, and its test results file | the tools read the repository they are pointed at and hold no state |
| publishes | spn-devex | the artifact shape and the two-cell rule its own row writer follows | a stack repository and the marketplace report in one vocabulary |
| publishes | the repository's own registers | the status of the last run, and when it ran | a row's proof is a finding rather than a memory |
