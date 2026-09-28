<!-- spn:doc
{
  "id": "agent-set",
  "variant": "construct",
  "title": "Agents — The Personas a Session Convenes, and the Lenses They Are Handed",
  "lenses": ["LEAD", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set", "ref-set"],
  "summary": "A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the reviewing viewpoint a parameterized brief is handed, and the one condition that viewpoint may block on.",
  "keywords": ["agent", "brief", "persona", "lens", "panel", "authority"]
}
-->

# Agents — The Personas a Session Convenes, and the Lenses They Are Handed

`For: Engineering leader · Architect` · `Status: 🔮 PLANNING`

The context that wrote a change has already agreed with every reason it gave itself. A brief is how a second, independent read arrives without opening a second window: a persona with its own name, convened mid-turn, carrying only what its own file grants it. A backend developer reads a change differently than a security reviewer does, and a lens is that difference written down — one file per engineering function, handed to a reviewing brief at the moment it is convened.

## Overview

The thing to check first in any brief is its authority — what this persona may decide, and whether it may write anything at all. Some of that authority is bound by the frontmatter and some of it is only stated in the prose, and the two are not the same promise.

A lens is where the rest of the authority comes from. **A lens is an argument handed to one reviewer, not a reviewer of its own.** The brief that reviews carries none of the viewpoints; it is given a name at the moment it is convened and reads that file before it says anything, and that file — rather than the brief — states what this convening may refuse and what it may only advise.

This construct realizes the book's `01-devex/02-agent/01-agent`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a brief | `agents/` | a markdown file naming a persona a session can convene by name |
| the bound model | `model` | an optional field choosing which model runs the persona |
| the bound tools | `tools` | an optional field narrowing what the persona may call; leaving it out grants everything the session has |
| a parameterized brief | — | a brief holding a procedure and no subject matter, handed a viewpoint name at the moment it is convened |
| a lens | `lenses/` | one file naming what a single engineering function checks when it reads work |
| worn | — | the agent loading a lens for itself while it writes, so the work is right the first time |
| convened | — | a context that did not write the work reading it through one lens and reporting what it found |
| the block condition | — | the one thing a lens may refuse on; everything the file finds below that is advice and says so |
| the lens register | `LENS_LABEL` | the closed set of viewpoint values, and the reader label each one renders as on a document's own header |
| the audience | `lenses` | the field in a document's metadata block, drawn from that same closed set |

## Model

A session names a persona. The brief decides what that persona may do, and where the convening carries a viewpoint name, the lens file narrows it further.

```dg
{ "kind": "map",
  "caption": "Authority comes from the files rather than from the caller, so a caller cannot ask a reviewing persona to edit.",
  "boxes": [
    { "id": "a", "label": "a session", "note": "convenes a persona by name, in the middle of a turn" },
    { "id": "b", "label": "the brief", "note": "the procedure, and sometimes a model and a tools list" },
    { "id": "c", "label": "the lens file", "note": "the subject matter, where a viewpoint name is passed" },
    { "id": "d", "label": "the authority", "note": "what may be refused, what may only be advised, what may be written" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "convenes" },
    { "from": "b", "to": "c", "label": "is handed" },
    { "from": "c", "to": "d", "label": "states" }
  ] }
```

Most briefs are a fixed persona and read the same way on every convening. One is parameterized, and the lens files are what it is parameterized by. The set of those files is closed by a rule rather than fixed at a number: one lens per engineering function, and the functions are named in the book.

## Parts

### The frontmatter

`name` and `description`, read the same way [a skill's](04-skills.md) are: the description is matched against the moment rather than browsed, and it decides whether this persona takes the reply. Two more fields are optional. `model` chooses which model runs the persona, and `tools` narrows what it may call. Leaving `tools` out grants every tool the session itself has.

### Where a read-only promise is actually bound

A brief declaring `tools` is bound by it: the permission is a fact about the convening rather than an instruction the persona is asked to follow. A brief that declares no `tools` inherits everything the session has, and its promise not to write is prose. Both kinds exist here, and telling them apart matters when a reviewer's independence is what the brief is for.

### A fixed persona

A brief with no argument is one voice, always: an engineering lead, a prose rewriter, a prose reviewer. Its whole authority is the words in its own file, read the same way each time it is called.

### A parameterized reviewer

One brief here takes a viewpoint name as part of what it is convened over. It reads that viewpoint's own file before anything else, and the brief's own description lists the names a caller may pass, which is also what makes them discoverable. A brief for each viewpoint would be many copies of one procedure, drifting apart, each needing the same change — so the procedure lives in one file and the subject matter lives beside it.

### What one lens file says

A lens file opens by saying when the viewpoint is worn, when it is convened, and the one condition on which it blocks. Then it says what it checks. Everything below the stated threshold is advice, and the file says so plainly, because a reviewer who can block anything stops being a reviewer and the work stops on taste.

### Wearing and convening are different acts

Wearing a lens while writing makes the work better and is never a review, because the context that drafted something already agrees with its own reasoning. Convening is the other act: a reader who did not write the work, holding one file, reporting what that viewpoint found. A skill says which gate convenes which viewpoint.

### The lens names are also the audience a document declares

The reader a document is written for and the reviewer who judges it are one list. Two lists would let a document declare an audience no reviewer could be convened as. The register that maps each value to its reader label lives in the documents tool, and a document declaring a value outside the set is refused.

### A lens is regenerated, never argued with

A lens is a ref, so it carries a stamp and adds no rule of its own. Each file names its own sources at the top and states that it restates them. Where a lens and the book disagree, the book wins and the lens is rewritten; a lens that starts deciding rules has become a second standard nobody audits.

### A reviewer that edits has stopped reviewing

Where a persona both finds a problem and fixes it, the finding and the fix arrive together and nobody can weigh one without the other. So the reviewing briefs report, the engineering brief advises, and exactly one brief is permitted to write — over the paragraphs it was handed, never over a whole file.

### A brief points at a rule and never invents one

A persona stating a rule with no chapter behind it has produced a suggestion wearing the clothes of a finding, and the next reader cannot tell which they are holding. Each brief names where its standard lives: the reviewing brief's standard is the viewpoint file, and that file's standard is the book.

## Boundary

This page answers what a brief is, how a persona is convened, what a viewpoint file holds, and how far the authority of either reaches. It does not answer how a restatement is stamped or compared — a lens is a ref, and [Refs](06-refs.md) answers that. It does not answer what a skill is either, although a brief and a skill are selected by the same kind of sentence.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the frontmatter a brief declares, and the difference between an authority bound by a field and one stated in prose | the block, the stamp and the drift comparison every lens file carries | [Refs](06-refs.md) |
| what a viewpoint file states, and the line between blocking and advising | whether the rule being restated is correct | the foundation chapter the stamp names |
| that a reviewing persona reports and one rewriting persona writes | the matching rule the description is read by, and which gate in a walk convenes which viewpoint | [Skills](04-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Agent construct | one agent, equipped by the book, and a reviewer that reads what it did not write | MUST |
| the foundation's Actors, Lenses and Panels construct | the viewpoint set is closed by a rule, and a reviewer blocks only where its own file says it may | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a brief edit needs an install and a fresh window before a convening can read it | MUST |
| `RD.DEVEX.WORKSPACE.118` | a lens is a restatement, and the book wins wherever the two disagree | MUST |
| [RD.DEVEX.004](../../registers/decisions.md) | a read-only promise is bound only where the brief declares `tools`; elsewhere it is prose | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs restates check` (or `spn-devex restates check`, once installed)
