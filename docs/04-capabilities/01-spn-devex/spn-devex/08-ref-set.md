<!-- spn:doc
{"id": "spn-devex-capabilities-ref-set", "variant": "capability", "title": "Ref in spn-devex", "lenses": ["VOICE", "ARCHITECT"], "status": "DONE", "realizes": ["ref-set"], "summary": "Eleven restatements a reader with no book checkout can still read in full, each stamped with the hash of what it last saw, and the one parser two different drift checks share.", "keywords": ["ref", "restates", "hash", "drift", "seen", "partner"]}
-->

# Ref in spn-devex

`For: Editor · Architect` · `Status: ✅ DONE` · `Realizes: Ref`

Eleven markdown files sit directly under `plugins/spn-devex/refs/`, each restating part of the foundation book for a reader who may never open it. The eleven lens files under `refs/lenses/` are the same idea at a finer grain and have their own chapter. `spn-devex` also realizes the machinery: the block parser, and the tool that re-reads a stamped chapter and reports what moved. The one thing to know before writing one is that **a ref is a copy under a stamp**. It adds no rule; where it and the book disagree, the book wins and the ref is rewritten.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The restatements | `plugins/spn-devex/refs/*.md` | eleven files: `blocks`, `commands`, `contract-rules`, `cross-repo`, `decision-cards`, `doc-sets`, `getting-started`, `intent`, `permission-vs-enablement`, `platform-worksheet`, `workstream-loop` |
| The block and its hash | `plugins/spn-devex/src/scripts/lib/restates.ts` | parsing, the hash, and the undeclared, unstamped and unread classification |
| The comparison | `plugins/spn-devex/src/scripts/tools/restate-drift.ts` | every stamp re-read against a book handed to it |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [The Ref](../../../02-constructs/01-spn-devex/08-ref-set.md)
- How a tool is run and how it grades — [Tools in spn-devex](05-tools.md)

## Special handling

### The hash covers a section when the stamp names one

**Why** — *a citation should be exactly as precise as the sentence it replaces*. Hashing a whole file re-flags a ref every time an unrelated paragraph moves, and a check that cries wolf is a check people stop reading.
**What** — a stamp naming a section hashes that section; a stamp naming only a path hashes the file. A block can also carry the register rows it restates.
**How** — the block is a JSON comment at the top of the file, listing chapters with `path`, optional `section`, and `seen`. `plugins/spn-devex/src/scripts/lib/restates.ts`.

### The parser lives once because two checks read it

**Why** — *the same rule stated twice, drifting, is the defect this construct exists to stop*. Writing the block parser in both checks would be that defect inside the instrument meant to catch it.
**What** — `coherence.ts` compares the foundation's own restatements inside one repository, and `restate-drift.ts` compares this repository's restatements against a book. Both call the same parser.
**How** — the parser is a library file, not a tool, so neither check owns it. `plugins/spn-devex/src/scripts/lib/restates.ts`.

### A partner never runs the drift check, and that is correct

**Why** — *a partner holds the plugins and not the book*. What the foundation publishes is the corrected restatement, never the checker.
**What** — with no book to compare against, the tool prints one line and exits clean. It is run here, before a release.
**How** — with no argument it looks for a sibling checkout carrying the register. The clean-exit behaviour is one of the properties the partner proof tests. `plugins/spn-devex/src/scripts/tools/restate-drift.ts`.

### A source comment is not a stamp

**Why** — *a `RESTATES:` line in a source file names a chapter and carries no hash*, so nothing can compare it. It tells a reader where the rule lives and warns nobody when it moves.
**What** — every hook and tool in this plugin opens with such a line, and that is deliberate: the rule is that a change is made in the chapter first, then here, in the same change. The stamped block is what a drift run reads.
**How** — compare the header of `plugins/spn-devex/src/scripts/checks/doc-check.ts` with the block at the top of `plugins/spn-devex/src/refs/devex/workspace/docs/doc-sets.md`.

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
