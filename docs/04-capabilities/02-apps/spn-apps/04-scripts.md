<!-- spn:doc
{"id": "spn-apps-capabilities-scripts", "variant": "capability", "title": "Scripts in spn-apps", "lenses": ["SERVER_DEV", "QA"], "status": "DONE", "realizes": ["stack-checks"], "summary": "Everything this plugin executes — the gate that resolves a write to the declared stack without naming one, the single process behind the wired entry, the shared reading and hashing both halves use, and the commands run by name over an apps repository's own registers.", "keywords": ["gate", "subject", "dispatcher", "register", "action", "stamp"]}
-->

# Scripts in spn-apps

`For: Backend developer · Quality engineer` · `Status: ✅ DONE` · `Realizes: Scripts`

The folder divides by what calls each file. `events/` holds the one process the wiring names. `checks/` holds the gate that process asks. `tools/` holds what a person or an agent runs by typing its path. `lib/` holds what the others read. Two things are true of all of it. **Nothing here names a stack** — the code that knows a language sits under `providers/`, and this folder only resolves into it. And **a tool writes only what a run found**, because part of a behaviour row is somebody's decision and a tool writing over it would turn a declaration into a guess.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The gate | `plugins/spn-apps/src/scripts/checks/subjects.ts` | names the subjects and their order, resolves the stack, imports the provider's half |
| The stack read | `plugins/spn-apps/src/scripts/lib/stack.ts` | walks to the nearest `sprepo.json` and returns the declared stack, or nothing |
| The dispatcher | `plugins/spn-apps/src/scripts/events/pretooluse.ts` | one process behind the entry: keeps the first refusal, joins the advice |
| How a source file is read | `plugins/spn-apps/src/scripts/lib/source.ts` | masking, and the source as the pending write would leave it |
| The payload and verdict shapes | `plugins/spn-apps/src/scripts/lib/payload.ts` | this plugin's own copy, named as the core plugin names the same job |
| What a run cost | `plugins/spn-apps/src/scripts/lib/timing.ts` | written only while the developer has asked for it, and never able to fail a gate |
| The restatement hash | `plugins/spn-apps/src/scripts/lib/stamp.ts` | the `seen` value, spelled once per plugin and required to agree with the other copy |
| What a register is | `plugins/spn-apps/src/scripts/lib/register.ts` | the behaviour headings, in order, and the test for one row |
| The row writer | `plugins/spn-apps/src/scripts/tools/behaviour-rows.ts` | writes `Status` and `Updated at` from a run's own results file |
| The action surface | `plugins/spn-apps/src/scripts/tools/action-coverage.ts` | every declared action, matched against the rows that claim it |
| The package table | `plugins/spn-apps/src/scripts/tools/library-catalogue.ts` | writes the list of published packages a node may depend on |

## Follows the pattern

- What a check may decide on its own account, and how a tool is graded — [The Check](../../../02-constructs/01-devex/05-scripts.md)
- The verdict, the composition and the always-zero exit — [Hooks in spn-devex](../../01-devex/spn-devex/02-hooks.md)
- The behaviour row and the register it lives in — the foundation's `02-docs/02-document.md`

## Special handling

### The gate composes the provider path, and that is why a second stack costs no edit

**Why** — *a gate that could name a stack is a gate somebody edits to add the next one*, and that edit is what the provider shape exists to remove.
**What** — the gate reads the declared stack and imports `providers/<stack>/scripts/checks/<subject>.ts`. The import is composed rather than written out, because a written one would be this file naming a stack.
**How** — a declaration this plugin ships no folder for resolves to no subject, silently: a gate that refused what it cannot classify would refuse far more than it was asked to, and a stub that answered would teach a reader the realization works. `plugins/spn-apps/src/scripts/checks/subjects.ts`.

### The subjects are ordered by what they cost

**Why** — *one subject reads a single file and another walks a whole test tree to answer*.
**What** — the cheaper subject is asked first, and a refusal there means the walk never happens.
**How** — which rules apply is decided by the path and the node's kind, never by a subject's name. Same file.

### One entry, and the measurement behind it

**Why** — *the interpreter start-ups were nine parts in ten of the cost*. One ordinary edit across eight separate entries cost 1,123 ms on 19 September 2026, of which 1,040 ms was starting programs; the checking was about 83 ms.
**What** — the wiring declares one entry and this file runs the chain behind it.
**How** — the saving lives in the registration rather than in the scripts: eight entries in any language are still eight start-ups. `plugins/spn-apps/src/scripts/events/pretooluse.ts`.

### A source file is read with the write already applied, once per write

**Why** — *reading what is on disk reports faults somebody else wrote and misses the one arriving now*.
**What** — comments and string bodies are masked, the caller's pending text is laid over the file, and the search runs on that.
**How** — the reading is shared code rather than private to one rule, and the subject builds it once rather than once per rule. `plugins/spn-apps/src/scripts/lib/source.ts`.

### This plugin's libraries are its own copies, deliberately

**Why** — *a partner may hold this plugin with no core plugin beside it on disk*, and the installed cache puts a version directory between a plugin and its files. An import across plugin folders would work in this checkout and break in every install.
**What** — the payload shape, the timing record and the restatement hash each exist here as well as in the core plugin, named for the same job in both.
**How** — the hash is the one that must agree byte for byte, because two spellings would report drift between files that agree — and a finding that is wrong teaches people to stop reading the run. A case in this plugin's suite hashes a fixture with both copies and fails if they differ. `plugins/spn-apps/src/scripts/lib/stamp.ts`.

### A register is found by its header, never by a path

**Why** — *a documents tree that moves must break no tool*. It is also the only way to be right in the layout a repository has today and in the one that follows it.
**What** — any table carrying the behaviour headings is a register, wherever in the repository it sits.
**How** — the headings and the row test are one exported pair read by every tool that touches a register, because two tools parsing a table differently means one writes rows the other cannot see. `plugins/spn-apps/src/scripts/lib/register.ts`.

### Two cells are the run's and the rest are a person's

**Why** — *the kind of behaviour and the tier that proves it are decisions somebody made*, while the status and the moment it was found are what the last run saw. The two were one cell until they disagreed quietly, and a row whose case had stopped running still read as proven.
**What** — the writer touches those two cells and copies every other one through untouched. A hand-written edit to either is a claim rather than a finding.
**How** — a run updates only the rows declaring a tier it covered, and never writes over a row a person proves. That is why the tier is a person's cell: it is what a run matches itself against. `plugins/spn-apps/src/scripts/tools/behaviour-rows.ts`.

### It reads the run's own artifact, never a specification

**Why** — *a derived status reports a case that exists as a case that ran*. Crossing a route with a surface, or scanning a source tree for case titles, cannot see a case that was skipped or filtered out.
**What** — the writer reads the file the runner produced, so a row whose case never reached the runner says so.
**How** — the core plugin's own row writer reads the same artifact shape for this repository, which declares no stack at all. Same file, and `plugins/spn-devex/src/scripts/tools/behaviour-status.mjs`.

### Coverage is measured against actions, not routes

**Why** — *a route says where a screen lives and nothing about what can be done there*. One settings route can carry several actions behind it, and counting routes reports that screen as covered while most of them have never been performed.
**What** — every published action is an interaction, whether a person performs it through a browser or another system performs it through the generated client. The tool reads the declared actions and the register's rows and compares them.
**How** — an action is found by its own declaration rather than by a folder shape. The glob this replaced named one stack's folders and missed a whole module whose home was an application. `plugins/spn-apps/src/scripts/tools/action-coverage.ts`.

### One table is written by a command, because nobody could keep it by hand

**Why** — *a published set moves every release*, so a hand-written list is stale the day after it is written and nothing reports that.
**What** — the tool reads what the support repository publishes and writes the table, leaving out anything a partner could not depend on.
**How** — the output carries a citation naming the command that produced it, so re-running the command is how a reader checks it. `plugins/spn-apps/src/scripts/tools/library-catalogue.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | this plugin's own providers | the parse and the rules for the declared stack | the gate resolves; the provider knows the language |
| takes | a repository | its declared actions, its behaviour registers, and its test results file | the tools read the repository they are pointed at and hold no state |
| takes | spn-devex | the shapes it names for the same jobs, copied rather than imported | the plugins install and version separately |
| publishes | spn-devex | the artifact shape and the two-cell rule its own row writer follows | a stack repository and the marketplace report in one vocabulary |
| publishes | a repository's own registers and refs | the status of the last run, and the table of packages a node may depend on | a finding is written down rather than remembered |
