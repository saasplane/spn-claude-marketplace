<!-- spn:doc
{
  "id": "ref-set",
  "variant": "construct",
  "title": "Refs — A Chapter, Restated and Stamped",
  "lenses": ["VOICE", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "A markdown restatement of one or more chapters, carrying a hash of the exact text it last read, so a chapter that moves is reported rather than quietly outrun — and the three ways a restatement can fail to be comparable at all.",
  "keywords": ["ref", "spn:restates", "seen", "hash", "drift", "unstamped"]
}
-->

# Refs — A Chapter, Restated and Stamped

`For: Editor · Architect` · `Status: 🔮 PLANNING`

A citation nobody checks is a promise nobody keeps. The chapter it names moves on, the words copied from it quietly stop being true, and everybody finds out by accident. A ref is how this repository keeps that promise: a restatement carrying a hash of the exact text it last read, so a run can say *this chapter moved since I copied it*.

## Overview

A ref exists because a reader may hold the plugins and never hold the book. It is a copy, made deliberately, under a stamp. It adds no rule; where a ref and its chapter disagree, the chapter wins and the ref is rewritten.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a ref | — | a markdown file under a plugin's `refs/`, restating part of the foundation book for a reader who cannot open it |
| the block | `spn:restates` | a comment at the top of that file, holding strict JSON, naming what the file restates |
| a stamp | `Citation` | one entry of the block — a chapter's path, an optional section, and the hash last read there |
| the hash | `seen` | eight characters over the cited text, with trailing spaces and surrounding blank lines removed |
| drift | — | a stamp whose hash no longer matches the chapter's text today |
| a source line | — | a file's own prose naming what it restates; it is read beside the block, and an omission from the block is a finding |

## Model

The hash is taken once, when the copy is made. Everything afterwards is a comparison.

```dg
{ "kind": "map",
  "caption": "The stamp stands between the copy and the drift run, which is what lets a run name the chapter that moved.",
  "boxes": [
    { "id": "a", "label": "a chapter", "note": "the rule's one home, in the foundation book" },
    { "id": "b", "label": "the restatement", "note": "the copy a reader with no book checkout can read" },
    { "id": "c", "label": "the stamp", "note": "a path, an optional section, and the hash last seen" },
    { "id": "d", "label": "the drift run", "note": "re-reads the chapter today and compares the hash" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "copied into" },
    { "from": "b", "to": "c", "label": "carries" },
    { "from": "c", "to": "d", "label": "read by" }
  ] }
```

The comparison needs both trees, so it runs where the book is checked out beside the plugins, and answers with one clean line anywhere else.

## Parts

### The folder mirrors the book, and holds nothing else

A ref's path says which part of the book it restates, so `refs/` reads as a map of the chapters a plugin's readers need rather than as a pile of documents. Material that restates no chapter — a procedure a skill loads, a list of steps — is not a ref and does not belong there, whatever it happens to be about.

### The block, and what it holds

A comment carrying strict JSON: a list of chapters, each with a path, an optional section, and its hash; and optionally a list of register rows the file also depends on. It sits at the top of the file, in the position a document's metadata block would take, and a ref carries this rather than that.

### A stamp is as precise as the sentence it replaces

Name a section and the hash covers that heading's own text; name only a path and it covers the whole file. The reason is measurable. One concept file runs to thousands of lines and many restatements cite it, so hashing the whole file re-stamps a viewpoint every time anything else in it moves — and a finding that is usually wrong teaches people to stop reading the run.

### What the hash ignores, and what it does not

Trailing spaces and the blank lines around the cited text are invisible to a reader, so a change to them is not a change to the rule. Everything else counts, a reordering included, because a list of rules whose order changed is a list a restatement may now state wrongly.

### The parser lives once because two checks read it

Comparing the foundation's own restatements inside one repository and comparing this repository's restatements against a book are different questions with the same parser. Writing that parser twice would be the defect this construct exists to stop, inside the instrument meant to catch it. So it is a library file, and neither check owns it.

### A block used to get credit for what it left out

A check that walks only the block can validate only what the file declared, so a source named in the file's own prose and omitted from the block was unreachable rather than unstamped, and both runs printed green over it. The check now reads the file's own source line and compares it against the block. The comparison is loose in one direction only: a name in prose counts as declared when some declared path contains it.

### Three ways a restatement fails, and they are not the same finding

**Undeclared** is prose naming a source the block leaves out, which no run can see. **Unstamped** is a file saying what it restates and carrying no block at all, so nothing machine-readable exists to compare. **Unread** is a name no check can resolve to a file, which is an under-report rather than a hidden fault.

### A source comment is not a stamp

Every script here opens with a line naming the chapter it restates. That line carries no hash, so nothing compares it. It is deliberate, and it means something narrower: a change is made in the chapter first and in the code second, in the same change.

## Boundary

This page answers what a restatement is, where one belongs in the folder, and how it stays honest. It does not answer what any chapter says — the chapter answers that, and a ref only ever repeats it under a stamp. It does not answer how a ref is delivered either, or when a reader loads one: a ref is loaded because something names it, and the thing naming it is a skill, a brief or a check.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the block, the stamp, what the hash covers, and the three ways a restatement stops being comparable | whether the rule being restated is correct | the foundation chapter the stamp names |
| that a bare source comment in code names a chapter and is not a stamp | when a session reads a ref, and what names it | [Skills](04-skills.md) · [Agents](03-agents.md) |
| that a ref adds no rule of its own | a restatement whose subject is one reviewing viewpoint, and the brief handed it | [Agents](03-agents.md) |
| that `refs/` mirrors the book and holds nothing else | where material a skill loads for one realization lives instead | [Providers](07-providers.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DOCS.055` | a file carrying a rule it does not own is a restatement, and the verb is `restates` | MUST |
| the foundation's `04-discipline.md` § Restatement discipline | repetition is allowed only as a declared restatement, carrying its source and never a new rule | MUST |
| [MD3](../../registers/decisions.md) | a ref that carries no block is unstamped, and a marker no tool reads is not a declaration | MUST |

Try it: `node plugins/spn-devex/src/scripts/tools/restate-drift.ts`
