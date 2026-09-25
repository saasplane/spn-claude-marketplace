<!-- spn:doc
{
  "id": "lenses",
  "variant": "construct",
  "title": "The Lens — One Reviewing Viewpoint, Written Down",
  "lenses": ["LEAD", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["ref-set"],
  "summary": "One engineering function's judgment stated as a file — what it checks, the one condition it may block on, everything below that which it can only advise, and why the same values also name the audience a document declares.",
  "keywords": ["lens", "review", "block", "advise", "panel", "audience"]
}
-->

# The Lens — One Reviewing Viewpoint, Written Down

`For: Engineering leader · Architect` · `Status: 🔮 PLANNING`

A backend developer reads a change differently than a security reviewer does, and both read it differently than the person who owns the release. Give every change one undifferentiated review and each of those people works out what to look for from nothing, every time. A lens is that working-out, written down once: one file per engineering function, saying what it checks and where its authority stops.

## Overview

A lens is a ref, so it carries a stamp and adds no rule of its own. What makes it a construct rather than another restatement is how it is used. **A lens is an argument handed to one reviewer, not a reviewer of its own.** The brief that reviews carries none of the viewpoints; it is given a name at the moment it is convened and reads that file before it says anything.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a lens | `lenses/` | one file naming what a single engineering function checks when it reads work |
| worn | — | the agent loading a lens for itself while it writes, so the work is right the first time |
| convened | — | a context that did not write the work reading it through one lens and reporting what it found |
| the block condition | — | the one thing a lens may refuse on; everything the file finds below that is advice and says so |
| the lens register | `LENS_LABEL` | the closed set of values, and the reader label each one renders as on a document's own header |
| the audience | `lenses` | the field in a document's metadata block, drawn from that same closed set |

## Model

A gate names a viewpoint, the viewpoint resolves to a file, and the file is what decides how far the reviewer's authority reaches.

```dg
{ "kind": "map",
  "caption": "Authority comes from the lens file rather than from the gate, which only chooses which viewpoint reads.",
  "boxes": [
    { "id": "a", "label": "a gate", "note": "a moment a skill says to convene a review" },
    { "id": "b", "label": "a lens name", "note": "one of the values the panel's own description lists" },
    { "id": "c", "label": "the lens file", "note": "what this viewpoint checks, and the one thing it blocks" },
    { "id": "d", "label": "the finding", "note": "a refusal on that one condition; everything else advises" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "chooses" },
    { "from": "b", "to": "c", "label": "resolves to" },
    { "from": "c", "to": "d", "label": "bounds" }
  ] }
```

The set of files is closed by a rule rather than fixed at a number: one lens per engineering function, and the functions are named in the book.

## Parts

### What one file says

A lens file opens by saying when the viewpoint is worn, when it is convened, and the one condition on which it blocks. Then it says what it checks. Everything below the stated threshold is advice, and the file says so plainly, because a reviewer who can block anything stops being a reviewer and the work stops on taste. *Where:* `plugins/spn-devex/refs/lenses/architect.md`

### One procedure, many viewpoints

A brief for each viewpoint would be many copies of one procedure, drifting apart, each needing the same change. So the procedure lives in one brief — read fresh, review what you did not write, report and never edit — and the subject matter lives in the lens file. The caller passes the name and the work. *Where:* `plugins/spn-devex/agents/spn-panel.md`

### The names are also the audience a document declares

The reader a document is written for and the reviewer who judges it are one list. Two lists would let a document declare an audience no reviewer could be convened as. The register that maps each value to its reader label lives in the documents tool, and a document declaring a value outside the set is refused. *Where:* `plugins/spn-devex/hooks/tools/docs.ts`, `LENS_LABEL`

### A lens is regenerated, never argued with

Each file names its own sources at the top and states that it restates them and adds none of its own. Where a lens and the book disagree, the book wins. A lens that starts deciding rules has become a second standard nobody audits. *Where:* the first lines of `plugins/spn-devex/refs/lenses/trust.md`

### Wearing and convening are different acts

Wearing a lens while writing makes the work better and is never a review, because the context that drafted something already agrees with its own reasoning. Convening is the other act: a reader who did not write the work, holding one file, reporting what that viewpoint found. A skill says which gate convenes which viewpoint. *Where:* `plugins/spn-devex/skills/plan/SKILL.md`, `plugins/spn-devex/skills/develop/SKILL.md`

## Boundary

This page answers what a viewpoint file holds and how far its authority reaches. It does not answer how a restatement is stamped or compared — a lens is a ref, and [The Ref](08-ref-set.md) answers that. It does not answer who does the reviewing either: the brief that reads a lens is a persona, and it has its own page.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| what a viewpoint file states, and the line between blocking and advising | the block, the stamp and the drift comparison every one of these files carries | [The Ref](08-ref-set.md) |
| that the viewpoint set and the document audience set are one closed list | who is convened, what authority a brief carries, and whether it may write | [The Agent](10-agent-set.md) |
| that wearing a lens is never a review | which gate in a walk convenes which viewpoint | [The Skill](07-skill-set.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's Actors, Lenses and Panels construct | the viewpoint set is closed by a rule, and a reviewer blocks only where its own file says it may | MUST |
| `RD.DOCS.055` | a lens is a restatement, and the book wins wherever the two disagree | MUST |
| `RD.DEVEX.019` | a lens carries rules it does not own and adds none | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/03-lenses` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-devex` | one file per reviewing viewpoint, the brief that reads one by name, and the register the document audience is drawn from | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/hooks/tools/restate-drift.ts` | gate | every viewpoint file still reads as the chapters it stamps read today |
| `node plugins/spn-devex/hooks/tools/docs.ts audit docs` | gate | every document declares an audience drawn from the closed set, and its header renders the labels that set maps to |

Try it: `node plugins/spn-devex/hooks/tools/restate-drift.ts`
