<!-- spn:doc
{"id": "spn-apps-capabilities-scripts", "variant": "capability", "title": "Scripts in spn-apps", "lenses": ["SERVER_DEV", "QA"], "status": "DONE", "realizes": ["stack-checks"], "summary": "Everything this plugin executes — the gate that resolves a write to the declared stack without naming one, the single process behind the wired entry, the shared reading and hashing both halves use, and the commands run by name over an apps repository's own registers.", "keywords": ["gate", "subject", "dispatcher", "register", "action", "stamp"]}
-->

# Scripts in spn-apps

`For: Backend developer · Quality engineer` · `Status: ✅ DONE` · `Realizes: Scripts`

The folder divides by what calls each file. `events/` holds the one process the wiring names. `checks/` holds the gate that process asks. `tools/` holds what a person or an agent runs by typing its path. `lib/` holds what the others read. Two things are true of all of it. **Nothing here names a stack** — the code that knows a language sits under `providers/`, and this folder only resolves into it. And **a tool writes only what a run found**, because part of a behaviour row is somebody's decision and a tool writing over it would turn a declaration into a guess.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The gate | `packages/plugin-spn-apps/src/scripts/checks/subjects.ts` | names the subjects and their order, resolves the stack, imports the provider's half |
| The stack read | `packages/plugin-spn-apps/src/scripts/lib/stack.ts` | walks to the nearest `sprepo.json` and returns the declared stack, or nothing |
| The dispatcher | `packages/plugin-spn-apps/src/scripts/events/pretooluse.ts` | one process behind the entry: keeps the first refusal, joins the advice |
| How a source file is read | `packages/plugin-spn-apps/src/scripts/lib/source.ts` | masking, and the source as the pending write would leave it |
| The payload and verdict shapes | `packages/plugin-spn-apps/src/scripts/lib/payload.ts` | this plugin's own copy, named as the core plugin names the same job |
| What a run cost | `packages/plugin-spn-apps/src/scripts/lib/timing.ts` | written only while the developer has asked for it, and never able to fail a gate |
| The restatement hash | `packages/plugin-spn-apps/src/scripts/lib/stamp.ts` | the `seen` value, spelled once per plugin and required to agree with the other copy |
| What a register is | `packages/plugin-spn-apps/src/scripts/lib/register.ts` | the headings a register carries, each column found by its heading — this plugin's copy of the core plugin's file, held byte for byte to it |
| The tiers each kind owes | `packages/plugin-spn-apps/src/scripts/lib/kinds.ts` | the book's table of kind and owed tier, which tells a contract case from an integration one |
| What a run left behind | `packages/plugin-spn-apps/src/scripts/lib/runs.ts` | the walk the case reader uses; this plugin's copy of the core plugin's file |
| The join check | `packages/plugin-spn-apps/src/scripts/checks/behaviour-join.ts` | every row against every case title, in both directions |
| The package table | `packages/plugin-spn-apps/src/scripts/tools/library-catalogue.ts` | writes the list of published packages a node may depend on |

## Follows the pattern

- What a check may decide on its own account, and how a tool is graded — [The Check](../../../02-constructs/01-devex/05-scripts.md)
- The verdict, the composition and the always-zero exit — [Hooks in spn-devex](../../01-devex/plugin-spn-devex/02-hooks.md)
- The behaviour row and the register it lives in — the foundation's `02-docs/02-document.md`
- The one-entry, `<group> <action>` shape `commands/` dispatches by — the foundation's `04-plugins/02-shape.md`

## Special handling

### One entry, `<group> <action>`, dispatches under two groups

**Why** — the foundation's `04-plugins/02-shape.md` states the target every plugin here realizes: one entry, `<group> <action>`, in place of a tool reached by typing its own path.
**What** — `cli.ts` dispatches to `commands/<group>/<action>.ts`, one file per action. This plugin's two groups: `coverage` (`floor` · `check`, over the TS parts under `providers/ts`) and `library` (`catalogue`).
**How** — a command is printed as `spn-apps coverage check`, never as a bare path.

### The gate composes the provider path, and that is why a second stack costs no edit

**Why** — *a gate that could name a stack is a gate somebody edits to add the next one*, and that edit is what the provider shape exists to remove.
**What** — the gate reads the declared stack and imports `providers/<stack>/scripts/checks/<subject>.ts`. The import is composed rather than written out, because a written one would be this file naming a stack.
**How** — a declaration this plugin ships no folder for resolves to no subject, silently: a gate that refused what it cannot classify would refuse far more than it was asked to, and a stub that answered would teach a reader the realization works. `packages/plugin-spn-apps/src/scripts/checks/subjects.ts`.

### The subjects are ordered by what they cost

**Why** — *one subject reads a single file and another walks a whole test tree to answer*.
**What** — the cheaper subject is asked first, and a refusal there means the walk never happens.
**How** — which rules apply is decided by the path and the node's kind, never by a subject's name. Same file.

### One entry, and the measurement behind it

**Why** — *the interpreter start-ups were nine parts in ten of the cost*. One ordinary edit across eight separate entries cost 1,123 ms on 19 September 2026, of which 1,040 ms was starting programs; the checking was about 83 ms.
**What** — the wiring declares one entry and this file runs the chain behind it.
**How** — the saving lives in the registration rather than in the scripts: eight entries in any language are still eight start-ups. `packages/plugin-spn-apps/src/scripts/events/pretooluse.ts`.

### A source file is read with the write already applied, once per write

**Why** — *reading what is on disk reports faults somebody else wrote and misses the one arriving now*.
**What** — comments and string bodies are masked, the caller's pending text is laid over the file, and the search runs on that.
**How** — the reading is shared code rather than private to one rule, and the subject builds it once rather than once per rule. `packages/plugin-spn-apps/src/scripts/lib/source.ts`.

### This plugin's libraries are its own copies, deliberately

**Why** — *a partner may hold this plugin with no core plugin beside it on disk*, and the installed cache puts a version directory between a plugin and its files. An import across plugin folders would work in this checkout and break in every install.
**What** — the payload shape, the timing record and the restatement hash each exist here as well as in the core plugin, named for the same job in both.
**How** — the hash is the one that must agree byte for byte, because two spellings would report drift between files that agree — and a finding that is wrong teaches people to stop reading the run. A case in this plugin's suite hashes a fixture with both copies and fails if they differ. `packages/plugin-spn-apps/src/scripts/lib/stamp.ts`.

### A register is found by its header, never by a path

**Why** — *a documents tree that moves must break no tool*. It is also the only way to be right in the layout a repository has today and in the one that follows it.
**What** — any table carrying the behaviour headings is a register, wherever in the repository it sits.
**How** — the headings and the row test are one exported pair read by every tool that touches a register, because two tools parsing a table differently means one writes rows the other cannot see. `packages/plugin-spn-apps/src/scripts/lib/register.ts`.

### The join is a repository gate, and the stack says where a case lives

**Why** — *a case that exists is not a case that ran*, and the join asks only the first question: does a case cite each `SUCCESS` row, and does each cited id name a row. It reads both sets whole, so it cannot be a check at the moment one file is written. Whether a run supports a row is the core plugin's proof check, and stamping a row is the core plugin's writer (the book's RD.DEVEX.UTILS.071).
**What** — the join names a `SUCCESS` row no case title cites, and a case title citing an id no row declares. It exits non-zero on a finding; `--report` prints the same and exits zero.
**How** — where a case lives and how its title is written are the stack's, so the join imports `providers/<stack>/scripts/lib/cases.ts` by a composed path, the way the gate does. It reads rows through this plugin's copy of the core plugin's register grammar, which a case holds byte for byte to the original. `packages/plugin-spn-apps/src/scripts/checks/behaviour-join.ts`, proven in `packages/plugin-spn-apps/tests/unit/scripts/checks/t-behaviour-join.mjs`.

### One table is written by a command, because nobody could keep it by hand

**Why** — *a published set moves every release*, so a hand-written list is stale the day after it is written and nothing reports that.
**What** — the tool reads what the support repository publishes and writes the table, leaving out anything a partner could not depend on.
**How** — the output carries a citation naming the command that produced it, so re-running the command is how a reader checks it. `packages/plugin-spn-apps/src/scripts/tools/library-catalogue.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | this plugin's own providers | the parse and the rules for the declared stack | the gate resolves; the provider knows the language |
| takes | a repository | its behaviour registers, its case titles, its test results files, and each node's declared kind | the tools read the repository they are pointed at and hold no state |
| takes | spn-foundation | the table of which tier each kind owes | a plugin imports nothing, so the table is restated with its source named |
| takes | spn-devex | the shapes it names for the same jobs, copied rather than imported | the plugins install and version separately |
| takes | spn-devex | the register grammar and the run artifact reader, copied byte for byte | the join reads rows exactly as the one writer writes them |
| publishes | a repository's own registers and refs | the status of the last run, and the table of packages a node may depend on | a finding is written down rather than remembered |
