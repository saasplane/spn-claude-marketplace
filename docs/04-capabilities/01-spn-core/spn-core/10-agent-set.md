<!-- spn:doc
{"id": "spn-devex-capabilities-agent-set", "variant": "capability", "title": "Agent in spn-devex", "lenses": ["LEAD", "ARCHITECT"], "status": "DONE", "realizes": ["agent-set"], "summary": "Four briefs a session can convene — one fixed engineering persona, one reviewer parameterized by a lens, and a rewrite and review pair in which only the rewriter is allowed to edit.", "keywords": ["agent", "persona", "panel", "reviewer", "rewriter", "authority"]}
-->

# Agent in spn-devex

`For: Engineering leader · Architect` · `Status: ✅ DONE` · `Realizes: Agent`

Four markdown files sit under `plugins/spn-devex/agents/`, each a persona a session convenes by name. Three read as themselves every time; one is handed a lens name and reads that file first. The reason the folder exists at all is independence: **the context that wrote a change already agrees with every reason it gave itself**, so a second read has to come from somewhere that did not write it. What a reader should check first in any brief is its authority — what this persona may decide, and whether it may write anything at all.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The engineering persona | `plugins/spn-devex/agents/spn-engineer.md` | design reviews, architecture decisions, build guidance with judgment |
| The review panel | `plugins/spn-devex/agents/spn-panel.md` | one lens over one change, at a gate a skill names |
| The prose rewriter | `plugins/spn-devex/agents/spn-prose-rewriter.md` | rewrites flagged paragraphs, never a whole file |
| The prose reviewer | `plugins/spn-devex/agents/spn-prose-reviewer.md` | judges whether a rewrite kept every claim it had to keep |
| The viewpoints the panel reads | `plugins/spn-devex/refs/lenses/*.md` | eleven files, one per lens name |

## Follows the pattern

- The frontmatter, the trigger and the bound authority — [The Agent](../../../02-constructs/01-spn-devex/10-agent-set.md)
- The eleven viewpoints and their block-or-advise line — [Lenses in spn-devex](09-lenses.md)

## Special handling

### Only one of the four may write

**Why** — *a reviewer that edits has stopped reviewing*. Its finding and its fix arrive together, and nobody can weigh one without the other.
**What** — the panel and the prose reviewer report and never edit. The engineer advises. The rewriter is the single brief permitted to write, and only over the paragraphs it was handed.
**How** — the permission is in each brief's frontmatter `tools` list, so it is bound rather than requested. Compare the first lines of `spn-prose-rewriter.md` and `spn-prose-reviewer.md`.

### The panel is parameterized, the others are fixed

**Why** — *one procedure should not be copied eleven times*. The way a fresh reviewer works is the same whatever viewpoint it wears.
**What** — the panel brief carries the procedure and no subject matter; the caller passes a lens name and the work. The other three are whole personas in one file.
**How** — the brief's own description lists the eleven names a caller may pass, which is also what makes them discoverable. `plugins/spn-devex/agents/spn-panel.md`.

### The reviewer reads a sample, not the batch

**Why** — *reviewing everything costs as much as writing it*, and a review that never finishes protects nothing.
**What** — the prose reviewer is convened after a rewriting batch lands and judges a sample of it, asking one question: did the rewrite keep every claim, exact term, constraint and MUST that it was supposed to keep.
**How** — its brief names the sample rule, and the rewriter's brief names the unit it is handed — paragraphs from the triage tool, never whole files. `plugins/spn-devex/agents/spn-prose-reviewer.md`.

### A brief points at a rule and never invents one

**Why** — *an agent stating a rule with no chapter behind it has produced a suggestion wearing the clothes of a finding*, and the next reader cannot tell which they are holding.
**What** — each brief names where its standard lives. The panel's standard is the lens file; the lens file's standard is the book.
**How** — the engineer's brief is the widest of the four and still cites rather than rules. `plugins/spn-devex/agents/spn-engineer.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex's refs | the eleven lens files, read by name when the panel is convened | one brief reviews from any viewpoint |
| takes | spn-devex's tools | the flagged paragraphs the prose triage reports | the rewriter reads candidates, never a corpus |
| publishes | spn-devex's skills | the gate personas each skill convenes after a plan, a contract change or a build | a skill says who reads next |
| publishes | every session | four names a turn can convene without opening a second window | a fresh read costs a call, not a context |
