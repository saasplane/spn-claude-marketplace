<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc carries its specification, or names the note that holds it · § A step names every surface the change reaches, and how you would know · § Documents first, and the order they are written in · § An order is one delegated execution, and every order follows the same rules
     and docs/04-capabilities/02-support/01-apps/06-tests/README.md § When a whole tier runs
     This file carries rules it does not own. The chapters above are the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- A PLAN IS WRITTEN JUST BEFORE ITS ARC RUNS (row 0), BY READING WHAT EXISTS FIRST. It holds no question: a
     question is a card on the approach page. It holds no status: the arc's rows do. -->
# N{{nnn}} — plan (the work order)

Written {{date}}, just before N{{nnn}} runs. **Each fact is pinned to the commit and tree it was read at.** A fact is
stale when `git -C <repo> log <sha>..HEAD -- <path>` lists its file, or `git -C <repo> status --short -- <path>` is
not empty (another session's uncommitted work); then re-read that file. Re-run this check before each wave.

| Repo | Pinned at | Tree at pin |
| --- | --- | --- |
| {{repo}} | `{{sha}}` | {{clean · dirty: <paths>}} |

**Installed at pin:** spnutils `{{version}}` · plugins `{{name@version}}`, read {{date}}.
**Approved inputs:** the arc's Log lines {{dates}} (the cards answered, the samples approved).

## What exists today, and what depends on it

<!-- Read before anything is planned. A breaking row needs a card on the page, and a major bump its dated go in
     the arc's Log (RD.DEVEX.WORKSPACE.069). -->

| Thing | Today (read at pin) | Who reads or calls it | Twin or prior art | Change class |
| --- | --- | --- | --- | --- |
| `{{path or command}}` | {{what it does now}} | {{callers, found by `rg`}} | {{where the same rule already stands}} | new · additive · breaking · fix |

## What this change reaches

| Surface | Files | Why it is reached |
| --- | --- | --- |
| Book: constructs, capabilities, register | `{{repo}} → {{path}}` | {{…}} |
| Behaviour rows | `{{repo}} → {{path}}` | {{…}} |
| Source and tests | `{{repo}} → {{path}}` | {{…}} |
| Callers of the changed behaviour | `{{repo}} → {{path}}` (from the table above) | {{what they must now do}} |
| Generated | {{what regenerates, by which command}} | {{…}} |
| Restatements | {{the refs and templates that copy any of the above}} | {{…}} |

## The specification

<!-- The sets, moves and worked example the rows act on. A set is named by its members, never a count; a move is a
     table whose targets are unique; a step producing many files carries one worked example. Too large for here →
     `notes/N<nnn>/<subject>.<ext>`, named by path in the row. -->

## Traps — read before any row

- **{{the trap}}.** {{What happens if you walk into it, and what to do instead.}}

## Commands, and what green looks like

<!-- One home for every command a row or order proves with. Green is the exit code AND the count, never the
     runner's summary line alone, which a cached or replayed run prints too. Artifact is what must change on disk
     (a file, its mtime, a hash, a marker) — verify it, not the runner. Cache is `off` unless the row says why a
     cache hit is acceptable. Before is filled in row 0 by running the command at the pin.
     A TEST COMMAND IS SELECTIVE. It carries its selection after `--`, written by hand from the Files of the rows it
     proves. Its green is the named behaviour ids read as SUCCESS from the run's file: never an exit code, and never
     a count of a whole tier. A whole tier is a row here only where the Traps name which of the five cases holds:
     what the changed package publishes changed, and nodes outside the order import it; a test config, a global setup or a runner file
     changed; a spec or source file was renamed, moved or deleted; a dependency's version moved; the developer asks. -->

| Check | Command (run from) | Before (at pin) | Green after | Artifact | Cache |
| --- | --- | --- | --- | --- | --- |
| {{name}} | `{{command}}` ({{folder}}) | {{exit · count}} | {{exit 0 · exact count, skipped 0}} | `{{path}}` {{changes how}} | off |
| {{the cases rows k touch}} | `spnutils apps test {{tier}} {{run}} {{package}} -- {{selection}}` ({{folder}}) | {{each id's `Status` today}} | {{each named id}} → `SUCCESS` in the run's file | `tests/.output/{{tier}}/runs/{{run}}.json` | off |

## Rows

### {{k}} · {{repo}} · {{altitude}} — {{what}}

- **Files:** `{{path}}` (anchor: `{{the text you will find there today}}`).
- **Change:** {{before → after, exact enough to type}}.
- **Fails before:** `{{command}}` → {{the red line it prints at the pin, or on the unchanged code}}.
- **Proof:** Commands row `{{name}}` → {{before}} → {{after}}.

## Orders — no two share a file

| Wave | Order | Repo | Depth | Rows | Files it owns | Model | Needs first | Review first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | {{nn name}} | {{repo}} | {{child here · own window}} | {{rows}} | `{{paths, listed}}` | {{Opus 5 · Sonnet 5}} | {{order or row}} | {{what the developer sees first · —}} |

**Order of work:** {{which waves run in parallel, the hard edges, the ~5-agent limit}}. An order's gates are evidence
of its own files only; the arc's PROOF row runs again, on clean trees, what the rows touched, and no whole tier unless
one of the five cases holds.

## Findings, and where each goes

<!-- Empty "Goes to" is not allowed once the arc is RUNNING. An order's "Found, not changed" is added here. -->

| Finding | File | Goes to |
| --- | --- | --- |
| {{what}} | `{{path}}` | {{arc N<k> row j · card Q<n> · workstream NNN note}} |
