<!-- spn:doc
{"id": "spn-devex-capabilities-ref-set", "variant": "capability", "title": "Ref in spn-devex", "lenses": ["VOICE", "ARCHITECT"], "status": "DONE", "realizes": ["ref-set"], "summary": "Restatements a reader with no book checkout can still read in full, filed by the part of the book they restate and each stamped with the hash of what it last saw, and the one parser two different drift checks share.", "keywords": ["ref", "restates", "hash", "drift", "seen", "partner"]}
-->

# Ref in spn-devex

`For: Editor · Architect` · `Status: ✅ DONE` · `Realizes: Ref`

The files under `packages/plugin-spn-devex/src/refs/devex/` each restate part of the foundation book for a reader who may never open it. They are filed the way the book is: one folder per part restated — `agent` · `function` · `utils` · `workspace`. The lens files under `devex/agent/lenses/` are the same idea at a finer grain, and the agents chapter describes them. `spn-devex` also realizes the machinery: the block parser, and the tool that re-reads a stamped chapter and reports what moved. The one thing to know before writing one is that **a ref is a copy under a stamp**. It adds no rule; where it and the book disagree, the book wins and the ref is rewritten.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The restatements | `packages/plugin-spn-devex/src/refs/devex/` | one folder per part of the book restated: `agent` — plugins, skills and the lenses · `function` — the stages · `utils` — the CLI · `workspace` — the workspace, the workstream, what a repository declares, and the doc rules |
| The workstream loop | `packages/plugin-spn-devex/src/refs/devex/workspace/workstream.md` | how a session opens, reads a prompt, moves an arc through its states, and closes a reply — cited by every skill before it acts |
| How the folder is arranged | `packages/plugin-spn-devex/src/refs/README.md` | only domain folders at the top, and which files are authored, generated or copied |
| The CLI restated | `packages/plugin-spn-devex/src/refs/devex/utils/spnutils.md` | one file, merging what used to be a `README.md` and a separate `commands.md` — restated from the book's `01-spnutils.md` chapters through a `docs` citation, in its own words |
| The copied templates | `packages/plugin-spn-devex/src/refs/devex/workspace/docs/templates/` | copied byte for byte, because a template is copied rather than restated |
| The block and its hash | `packages/plugin-spn-devex/src/scripts/lib/restates.ts` | parsing, the hash, and the undeclared, unstamped and unread classification |
| The comparison | `packages/plugin-spn-devex/src/scripts/commands/restates/check.ts` | every stamp re-read against a book handed to it, run as `spn-devex restates check` |
| A stamped block, as written | the first lines of `packages/plugin-spn-devex/src/refs/devex/workspace/workspace.md` | the `spn:restates` comment: each chapter's path, an optional section, and its hash |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [The Ref](../../../02-constructs/01-devex/06-refs.md)
- How a tool is run and how it grades — [Scripts in spn-devex](05-scripts.md)

## Special handling

### The hash covers a section when the stamp names one

**Why** — *a citation should be exactly as precise as the sentence it replaces*. Hashing a whole file re-flags a ref every time an unrelated paragraph moves, and a check that cries wolf is a check people stop reading.
**What** — a stamp naming a section hashes that section; a stamp naming only a path hashes the file. A block can also carry the register rows it restates.
**How** — the block is a JSON comment at the top of the file, listing chapters with `path`, optional `section`, and `seen`. `packages/plugin-spn-devex/src/scripts/lib/restates.ts`.

### The parser lives once because two checks read it

**Why** — *the same rule stated twice, drifting, is the defect this construct exists to stop*. Writing the block parser in both checks would be that defect inside the instrument meant to catch it.
**What** — `commands/docs/coherence.ts` compares the foundation's own restatements inside one repository, and `commands/restates/check.ts` compares this repository's restatements against a book. Both call the same parser.
**How** — the parser is a library file, not a command, so neither one owns it. `packages/plugin-spn-devex/src/scripts/lib/restates.ts`.

### A partner never runs the drift check, and that is correct

**Why** — *a partner holds the plugins and not the book*. What the foundation publishes is the corrected restatement, never the checker.
**What** — with no book to compare against, the tool prints one line and exits clean. It is run here, before a release.
**How** — with no argument it looks for a sibling checkout carrying the register. The clean-exit behaviour is one of the properties the partner proof tests. `packages/plugin-spn-devex/src/scripts/commands/restates/check.ts`, run as `spn-devex restates check`.

### A source comment is not a stamp

**Why** — *a `RESTATES:` line in a source file names a chapter and carries no hash*, so nothing can compare it. It tells a reader where the rule lives and warns nobody when it moves.
**What** — every hook and tool in this plugin opens with such a line, and that is deliberate: the rule is that a change is made in the chapter first, then here, in the same change. The stamped block is what a drift run reads.
**How** — compare the header of `packages/plugin-spn-devex/src/scripts/checks/doc-check.ts` with the block at the top of `packages/plugin-spn-devex/src/refs/devex/workspace/docs/doc-sets.md`.

### The loop moved out of the unloaded agent, into a ref every skill cites

**Why** — *nothing loads an agent brief at session start*, so a rule written only into `spn-engineer.md` reached a session by accident, whenever that persona happened to be convened.
**What** — how a session opens on the welcome and one status line, how it reads and routes each prompt, where a new ask goes, what a prompt does to a running arc, the front desk that dispatches batches to subagents, and the three shapes a reply closes in, sit in `workstream.md` now; `spn-engineer.md` keeps only the persona and points at it.
**How** — one entry line, cited by name, opens every stage skill in all three plugins. `packages/plugin-spn-devex/src/refs/devex/workspace/workstream.md`.

### The masthead is three levels, and the page-writing refs restate it once

**Why** — *the same rule stated in a rewriter's brief and in the page templates drifts the moment one changes*.
**What** — every page opens on a Title, a Subtitle (one plain sentence, the seat's own `subtitle` field) and a Description (one paragraph, in the standfirst's place), all in plain language, none of them a number, a slogan, or a book word the same sentence does not explain.
**How** — `doc-sets.md` § Every page opens on a masthead of three levels states which page kind carries which; `docs/blocks.md` § The masthead comes first, and it is three levels states the Subtitle field and where it is never written; `agent/lenses/voice.md` carries the same rule as the readability bar every prose rewrite is held to.

### A ref is loaded when something names it

**Why** — *loading every rule into every turn drowns the turn that needed one*.
**What** — no file here loads on its own. A skill, an agent brief or a check names the one it needs at the point it needs it.
**How** — read the citations rather than the folder: `skills/ideate/SKILL.md` names its ref, and `agents/spn-panel.md` names a lens by the argument it was handed.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters each file restates, and the text a stamp is hashed from | the book is the source of truth in both directions |
| publishes | spn-devex's skills and agents | the vocabulary, the contract rules, the card grammar and the workstream loop | a rule is restated once and cited from many places |
| publishes | spn-apps · spn-infra | the cross-repo protocol and the command vocabulary neither domain plugin repeats | a domain plugin supplies the layer, never the vocabulary |
| publishes | a partner | every file in full, readable with no book checkout | the book is cited by name and never required |
