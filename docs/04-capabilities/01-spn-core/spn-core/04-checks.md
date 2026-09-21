<!-- spn:doc
{"id": "spn-core-capabilities-checks", "variant": "capability", "title": "Checks in spn-core", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["checks"], "summary": "Six stack-agnostic checks the dispatcher composes, each naming in its own header the chapter it restates, and each carrying a fast path so an ordinary edit pays almost nothing.", "keywords": ["check", "deny", "note", "restates", "fast path", "gate"]}
-->

# Checks in spn-core

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Checks`

A check is one file under `hooks/checks/`, exporting a function that reads the call and returns a verdict. Six exist, and the dispatcher composes them into one process. Two habits run through the folder. **Each names, in its header, the chapter it restates**, so the rule has one home. And **each reads the smallest slice the call touches** — the sweep-everything shape once cost three quarters of every millisecond hooks had spent.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| Confirmed execution | `plugins/spn-core/hooks/checks/confirmed.ts` | warns on an edit with no recorded go |
| The contract cycle | `plugins/spn-core/hooks/checks/contract-cycle.ts` | refuses a state write that would close a loop |
| The document bars | `plugins/spn-core/hooks/checks/doc-check.ts` | measures prose against what a script can measure |
| The machine seat | `plugins/spn-core/hooks/checks/env-seat.ts` | refuses a command that would render `~/.spnenv` |
| The governing mirror | `plugins/spn-core/hooks/checks/mirror.ts` | names the capability document an edit belongs to |
| The two workstream gates | `plugins/spn-core/hooks/checks/split-plan.ts` | the documents-first warning, the close refusal, the parser |

## Follows the pattern

- The verdict, the composition, the always-zero exit — [Hook in spn-core](02-hook-set.md)
- What a check may decide alone — [The Hook](../../../02-constructs/01-spn-core/02-hook-set.md)
- The citation a header carries — [The Ref](../../../02-constructs/01-spn-core/08-ref-set.md)

## Special handling

### Refusing beats an allowlist of safe reads

**Why** — *a value in the machine seat is never printed or logged*. Three surfaces said so and a session broke it anyway, putting five live credentials into a transcript.
**What** — every route that would render the file is refused, rather than the safe ones listed. One pipeline prints key names and the next prints every value, and telling those apart in a shell string is guesswork.
**How** — the whole command is read, so even a heredoc quoting the path is refused, and the message names the door instead. `plugins/spn-core/hooks/checks/env-seat.ts`.

### The cycle check reads the folder, not the file

**Why** — *a cycle is a property of the seat*. Generated validators import in the same shape as the states, so a loop resolves to nothing at boot and the application starts broken.
**What** — the whole `contract/states/` folder is read, with the pending write overlaid, so the graph judged is the one the write would make.
**How** — the same file runs as a hook and as a scan. `plugins/spn-core/hooks/checks/contract-cycle.ts`.

### A warning that repeats is a warning nobody reads

**Why** — *one turn writes many files, often into one folder*. A line printed on every write teaches you to skip it, and the time it mattered goes past unread.
**What** — the confirmed-execution warning speaks once per session, the mirror note once per mirror per session.
**How** — both remember what they said under `.spndevex/.debug/`, where the workspace keeps what its machinery says about itself. `confirmed.ts` and `mirror.ts`.

### The mirror check never refuses

**Why** — *the seams a mirror carries are prose*, and whether an edit changed one is a reading rather than a match. A gate there would be guessing.
**What** — it names the document governing the folder you are editing, and nothing else. Where no row governs it, it stays silent: that gap is the audit's, over the whole tree.
**How** — the longest governing folder wins, so a deep edit is never sent to the shallower mirror. `plugins/spn-core/hooks/checks/mirror.ts`.

### The close gate asks for accounting, not completion

**Why** — *closing a scope with work pending is good housekeeping*. What must not happen is a row nobody decided.
**What** — landed, carried and deferred all pass, and only an undecided row refuses. There is no override: recording the deferral is the way through. The other gate warns when an approach page is written into a pocket while rows sit unlanded.
**How** — the split plan is the approach page's `How` tables read by their scope column. `plugins/spn-core/hooks/checks/split-plan.ts`.

### The document check is calibrated to the rule, never to the corpus

**Why** — *a bar set from the corpus average moves every time the corpus does*, so a sweep would approve whatever the corpus already is.
**What** — the numbers come from the register row: an average past eighteen words a sentence reports, and past twenty-four refuses, as does any sentence past thirty. Records are exempt, because a row is never warmed.
**How** — headings, tables, code and front matter come out before scoring. `plugins/spn-core/hooks/checks/doc-check.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters and rows each header cites | the chapter rules, and a check is the copy that can fire |
| publishes | spn-core's events | the split-plan parser, the cards and the arc rows | the close line and the turn-end warnings read one plan |
| publishes | spn-core's tools | `doc-check`'s prose reader and Bash write routes | one reading of a command serves the gate and the sweep |
