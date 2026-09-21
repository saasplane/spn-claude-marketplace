<!-- spn:doc
{"id": "spn-core-capabilities-lenses", "variant": "capability", "title": "Lenses in spn-core", "lenses": ["LEAD", "ARCHITECT"], "status": "DONE", "realizes": ["lenses"], "summary": "Eleven reviewing viewpoints, each naming the one thing it may block and everything it can only advise, read by name at the moment a panel is convened rather than carried by eleven agents.", "keywords": ["lens", "review", "block", "advise", "panel", "gate"]}
-->

# Lenses in spn-core

`For: Engineering leader · Architect` · `Status: ✅ DONE` · `Realizes: Lenses`

Eleven files sit under `plugins/spn-core/refs/lenses/`, one per reviewing viewpoint: `lead`, `business`, `product`, `architect`, `server-dev`, `web-dev`, `qa`, `infra`, `trust`, `partner` and `voice`. They are refs, so each carries a stamped block and adds no rule of its own. What makes them their own construct is how they are used. **A lens is an argument passed to one agent, not an agent of its own.** The panel brief carries none of the eleven; it is handed a name at the moment it is convened and reads that file before it says anything.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The eleven files | `plugins/spn-core/refs/lenses/*.md` | one viewpoint each, named for the lens value |
| The reader | `plugins/spn-core/agents/spn-panel.md` | the brief handed a lens name and the work to review |
| The lens register | `plugins/spn-core/hooks/tools/docs.ts` | the same eleven values a document's `lenses` field may carry, and the label each renders as |

## Follows the pattern

- The stamped block every ref carries — [Ref in spn-core](08-ref-set.md)
- The frontmatter and the convening of a parameterized reviewer — [The Agent](../../../02-constructs/01-spn-core/10-agent-set.md)

## Special handling

### Each file separates what it blocks from what it advises

**Why** — *a reviewer who can block everything stops being a reviewer*. A viewpoint with no stated threshold turns every preference into a refusal, and the work stops on taste.
**What** — each file opens by saying when the lens is worn, when it is convened, and the one condition on which it blocks. Everything below that threshold is advice, and the file says so.
**How** — read the paragraph before `## What it checks` in any lens file. The architect lens, for example, blocks only a new mechanism reachable from more than one module with no decision entry behind it.

### One brief, eleven viewpoints

**Why** — *eleven agent briefs would be eleven copies of one procedure*, drifting apart, each needing the same change.
**What** — the panel brief holds the procedure — read fresh, review what you did not write, report and never edit — and the lens file holds the subject matter.
**How** — the caller passes the lens name and what to review; the brief's own description lists the eleven names a caller may pass. `plugins/spn-core/agents/spn-panel.md`.

### The lens names are also the document audience

**Why** — *the reader a document is written for and the reviewer who judges it are the same list*. Two lists would let a document declare an audience no reviewer could be convened as.
**What** — the same eleven values are what a `spn:doc` block's `lenses` field may carry, and the audit refuses anything outside the list.
**How** — the register maps each value to the label a tag line renders — `SERVER_DEV` reads *Backend developer*. `plugins/spn-core/hooks/tools/docs.ts`, `LENS_LABEL`.

### A lens is regenerated, never argued with

**Why** — *where a lens and the book disagree, the book wins*. A lens that starts deciding rules becomes a second standard nobody audits.
**What** — each file names its own sources of truth at the top and states plainly that it restates them and adds none of its own.
**How** — the stamped block above that line is what the drift run re-reads. Read the first fifteen lines of `plugins/spn-core/refs/lenses/architect.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters each viewpoint restates, stamped per file | a lens carries rules it does not own |
| publishes | spn-core's agents | the eleven files the panel reads by name | one procedure, any viewpoint |
| publishes | spn-core's skills | the gate each verb names — after a plan draft, a contract change, a build | a skill says which lens to convene and when |
| publishes | every document in the workspace | the audience values a metadata block may declare | the reader and the reviewer are one list |
