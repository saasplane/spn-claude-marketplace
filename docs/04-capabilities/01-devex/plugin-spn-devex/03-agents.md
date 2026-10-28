<!-- spn:doc
{"id": "spn-devex-capabilities-agent-set", "variant": "capability", "title": "Agents in spn-devex", "lenses": ["LEAD", "ARCHITECT"], "status": "DONE", "realizes": ["agent-set"], "summary": "The briefs a session can convene — one fixed engineering persona, one reviewer parameterized by a viewpoint, a rewrite and review pair in which only the rewriter may edit, and the viewpoint files the parameterized one reads by name.", "keywords": ["agent", "persona", "lens", "panel", "rewriter", "authority"]}
-->

# Agents in spn-devex

`For: Engineering leader · Architect` · `Status: ✅ DONE` · `Realizes: Agents`

Four markdown files sit under `packages/plugin-spn-devex/src/agents/`, each a persona a session convenes by name. Three read as themselves every time; one is handed a viewpoint name and reads that file first. The reason the folder exists at all is independence: **the context that wrote a change already agrees with every reason it gave itself**, so a second read has to come from somewhere that did not write it. What a reader should check first in any brief is its authority — what this persona may decide, and whether it may write anything at all. The second thing to know is that **a viewpoint is an argument passed to one brief, not a brief of its own**: the panel carries none of the viewpoints and reads the named file before it says anything.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The engineering persona | `packages/plugin-spn-devex/src/agents/spn-engineer.md` | design reviews, architecture decisions, build guidance with judgment |
| The review panel | `packages/plugin-spn-devex/src/agents/spn-panel.md` | one viewpoint over one change, at a gate a skill names |
| The prose rewriter | `packages/plugin-spn-devex/src/agents/spn-prose-rewriter.md` | rewrites flagged paragraphs, never a whole file |
| The prose reviewer | `packages/plugin-spn-devex/src/agents/spn-prose-reviewer.md` | judges whether a rewrite kept every claim it had to keep |
| The viewpoint files | `packages/plugin-spn-devex/src/refs/devex/agent/lenses/` | one file per reviewing function: `lead` · `business` · `product` · `architect` · `server-dev` · `web-dev` · `qa` · `infra` · `trust` · `partner` · `voice` · `ux` |
| What the set of viewpoints is | `packages/plugin-spn-devex/src/refs/devex/agent/lenses.md` | the restatement that states the set itself, and what each function is for |
| The lens register | `packages/plugin-spn-devex/src/scripts/lib/render.ts` | the same values a document's `lenses` field may carry, and the label each renders as |
| Where a viewpoint is convened | `packages/plugin-spn-devex/src/skills/ideate/SKILL.md` · `packages/plugin-spn-devex/src/skills/develop/SKILL.md` | the skills that say which gate convenes which viewpoint |

## Follows the pattern

- The frontmatter, the trigger, the bound authority, and the block-or-advise line — [Agents](../../../02-constructs/01-devex/03-agents.md)
- The stamped block every viewpoint file carries — [Refs in spn-devex](06-refs.md)

## Special handling

### Only one of the four may write

**Why** — *a reviewer that edits has stopped reviewing*. Its finding and its fix arrive together, and nobody can weigh one without the other.
**What** — the panel and the prose reviewer report and never edit. The engineer advises. The rewriter is the single brief permitted to write, and only over the paragraphs it was handed.
**How** — the permission is in each brief's frontmatter `tools` list, so it is bound rather than requested. Compare the first lines of `packages/plugin-spn-devex/src/agents/spn-prose-rewriter.md` and `packages/plugin-spn-devex/src/agents/spn-prose-reviewer.md`.

### The panel is parameterized, the others are fixed

**Why** — *one procedure should not be copied once per viewpoint*. The way a fresh reviewer works is the same whatever viewpoint it wears.
**What** — the panel brief carries the procedure and no subject matter; the caller passes a viewpoint name and the work. The other three are whole personas in one file.
**How** — the brief's own description lists the names a caller may pass, which is also what makes them discoverable. `packages/plugin-spn-devex/src/agents/spn-panel.md`.

### Each viewpoint file separates what it blocks from what it advises

**Why** — *a reviewer who can block everything stops being a reviewer*. A viewpoint with no stated threshold turns every preference into a refusal, and the work stops on taste.
**What** — each file opens by saying when the viewpoint is worn, when it is convened, and the one condition on which it blocks. Everything below that threshold is advice, and the file says so.
**How** — read the paragraph before `## What it checks` in any of them. The architect viewpoint, for example, blocks only a new mechanism reachable from more than one module with no decision entry behind it. `packages/plugin-spn-devex/src/refs/devex/agent/lenses/architect.md`.

### The viewpoint names are also the document audience

**Why** — *the reader a document is written for and the reviewer who judges it are the same list*. Two lists would let a document declare an audience no reviewer could be convened as.
**What** — the same values are what a `spn:doc` block's `lenses` field may carry, and the audit refuses anything outside the list.
**How** — the register maps each value to the label a tag line renders — `SERVER_DEV` reads *Backend developer*. `packages/plugin-spn-devex/src/scripts/lib/render.ts`, `LENS_LABEL`.

### A viewpoint file is regenerated, never argued with

**Why** — *where a viewpoint file and the book disagree, the book wins*. A file that starts deciding rules becomes a second standard nobody audits.
**What** — each one names its own sources of truth at the top and states plainly that it restates them and adds none of its own.
**How** — the stamped block above that line is what the drift run re-reads. Read the first lines of `packages/plugin-spn-devex/src/refs/devex/agent/lenses/trust.md`.

### The reviewer reads a sample, not the batch

**Why** — *reviewing everything costs as much as writing it*, and a review that never finishes protects nothing.
**What** — the prose reviewer is convened after a rewriting batch lands and judges a sample of it, asking one question: did the rewrite keep every claim, exact term, constraint and MUST that it was supposed to keep.
**How** — its brief names the sample rule, and the rewriter's brief names the unit it is handed — paragraphs from the triage tool, never whole files. `packages/plugin-spn-devex/src/agents/spn-prose-reviewer.md`.

### A brief points at a rule and never invents one

**Why** — *an agent stating a rule with no chapter behind it has produced a suggestion wearing the clothes of a finding*, and the next reader cannot tell which they are holding.
**What** — each brief names where its standard lives. The panel's standard is the viewpoint file; the viewpoint file's standard is the book.
**How** — the engineer's brief is the widest of the four and still cites rather than rules. `packages/plugin-spn-devex/src/agents/spn-engineer.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters each viewpoint file restates, stamped per file | a viewpoint carries rules it does not own |
| takes | spn-devex's scripts | the flagged paragraphs the prose triage reports | the rewriter reads candidates, never a corpus |
| publishes | spn-devex's skills | the gate each skill names — after a plan draft, a contract change, a build | a skill says who reads next, and from which viewpoint |
| publishes | every document in the workspace | the audience values a metadata block may declare | the reader and the reviewer are one list |
| publishes | every session | four names a turn can convene without opening a second window | a fresh read costs a call, not a context |
