<!-- spn:doc
{
  "id": "checks",
  "variant": "construct",
  "title": "The Check — One Rule, Asked on Every Call",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["hook-set", "loop-events"],
  "summary": "One rule a script can decide about a single call — the fast path that says whether it could have an opinion, the smallest slice it reads to answer, the chapter it names instead of restating, and the line between refusing a call and only speaking about it.",
  "keywords": ["check", "applies", "fast path", "deny", "note", "restates"]
}
-->

# The Check — One Rule, Asked on Every Call

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

A check is one file that reads a call and says what it thinks about it. The dispatcher composes them, so a check never has to know that other checks exist; it only has to answer for itself. This page names what a check is made of and the two habits every check in this marketplace keeps.

## Overview

The first habit is that **a check names the chapter it restates** in its own header, so the rule has exactly one home and a change is made there first. The second is that **a check reads the smallest slice the call touches**. Reading everything on every call once cost three quarters of every millisecond the hooks had spent, and a gate that makes a session slow is a gate somebody eventually removes.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a check | `Check` | one file that reads a call and returns a verdict, named for the rule it enforces |
| the fast path | `applies` | a test on the path or the shell command alone, deciding whether this check could have an opinion at all |
| what it reads | `needs` | which fields of a call a check requires; a call carrying none of them never reaches it |
| a refusal | `deny` | the call is stopped, with the reason a reader is given |
| advice | `note` | the call goes through and the turn is told something; advice from several checks is joined |

## Model

Every check is asked the same questions in the same order, and the order is what keeps an ordinary edit cheap.

```dg
{ "kind": "map",
  "caption": "The `applies` test stands before any reading, so a call that cannot interest a check costs almost nothing.",
  "boxes": [
    { "id": "a", "label": "the call", "note": "a path, a shell command, or both" },
    { "id": "b", "label": "applies", "note": "could this check have an opinion, from the path alone" },
    { "id": "c", "label": "run", "note": "the smallest slice the call touches is read" },
    { "id": "d", "label": "a verdict", "note": "deny, note, or nothing at all" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "tested by" },
    { "from": "b", "to": "c", "label": "only then" },
    { "from": "c", "to": "d", "label": "returns" }
  ] }
```

A refusal ends the chain, because anything said after an answer is noise. Advice does not end it, because two useful things are worth more than one.

## Parts

### A check is a file, and its header names its source

Each check sits in its own file under `hooks/checks/` and opens with a line naming the chapter of the foundation book it restates. That line carries no hash and nothing compares it, and that is deliberate: it tells a reader where the rule lives, and the rule is that a change is made in the chapter first and here second, in the same change. *Where:* `plugins/spn-core/hooks/checks/`

### Refusing a whole route beats listing the safe ones

Where a value must never be rendered, every route that would render it is refused rather than the safe routes listed. One pipeline prints key names and the next prints every value, and telling those apart inside a shell string is guesswork. The whole command is read, so even a quoted path inside a here-document is caught, and the message names the door to use instead. *Where:* `plugins/spn-core/hooks/checks/env-seat.ts`

### Some questions are about the folder rather than the file

A cycle among state files is a property of the whole folder, not of the file being written. So the check reads the folder with the pending write laid over it, and judges the graph the write would make. The same file runs as a hook and as a sweep over a tree, and a sweep weights what it finds by the grade [The Tool](05-tools.md) declares. *Where:* `plugins/spn-core/hooks/checks/contract-cycle.ts`

### A warning that repeats is a warning nobody reads

One turn writes many files, often into one folder. A line printed on every write teaches a reader to skip it, and the time it mattered goes past unread. So a check that speaks rather than refuses remembers what it already said and says it once, keeping that memory in the workspace's own folder for what its machinery says about itself. *Where:* `plugins/spn-core/hooks/checks/confirmed.ts`, `plugins/spn-core/hooks/checks/mirror.ts`

### Some checks never refuse, on purpose

Where deciding needs a reading rather than a match, a gate would be guessing. The check that names which document governs the folder you are editing does that and nothing else, and where no row governs a folder it stays silent — that gap belongs to a sweep over the whole tree rather than to one write. *Where:* `plugins/spn-core/hooks/checks/mirror.ts`

### A check that asks for accounting, not for completion

Closing a scope with work still pending is good housekeeping. What must not happen is a row nobody decided. So the close gate passes landed, carried and deferred alike, and refuses only the undecided row. There is no override, because recording the deferral is the way through. *Where:* `plugins/spn-core/hooks/checks/split-plan.ts`

### One file can hold more than one gate

Two of the workspace gates read the same table for different reasons, so they live in one file and the dispatcher registers each separately. Naming them apart in the register of checks matters, because one of them sweeps the workspace and the other reads a single path, and anybody measuring the cost needs to know which. *Where:* `plugins/spn-core/hooks/checks/split-plan.ts`

### The bars a check measures come from a rule, never from the corpus

A bar set from what the corpus already averages moves every time the corpus does, so a sweep would approve whatever is already there. The document check takes its numbers from the register row that states them, and takes headings, tables, code and metadata out of the text before measuring what is left. *Where:* `plugins/spn-core/hooks/checks/doc-check.ts`

## Boundary

This page answers what one check is and how it decides. It does not answer how checks are composed, what the payload is, or why the exit code is always zero — that is [The Hook](02-hook-set.md). It does not answer what the rules themselves say either: each check's header names the chapter that states its rule, and that chapter is where a change is made.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the shape of one check: its fast path, what it reads, and the verdict it returns | the composition, the payload, the dispatcher's own guard, and the exit code | [The Hook](02-hook-set.md) |
| the line between refusing a call and only speaking about it | which rule a given check enforces, and what that rule says | the foundation chapter each header names |
| that a stack-agnostic rule belongs here | a rule true only of one stack, or only of an estate | [Stack Checks](../02-spn-apps-ts/01-stack-checks.md) · [The Estate Guard](../03-spn-infra/01-estate-guard.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | a check restates a chapter and adds no rule of its own | MUST |
| `RD.DOCS.055` | a file carrying a rule it does not own is a restatement, and it names its source | MUST |
| the foundation's `02-delivery.md` § What it makes checkable | which standards are expected to be answered by a check rather than by a reader | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/01-agent` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-core` | the stack-agnostic checks the dispatcher composes, each naming its own chapter and carrying its own fast path | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/partner-shape.ts` | gate | every check runs against a repository holding nothing but the plugin, and a missing input produces silence rather than a crash |
| `node plugins/spn-core/hooks/tools/coherence.ts` | gate | no two documents in the repository state opposite rules about what a check decides |

Try it: `node plugins/spn-core/hooks/tools/partner-shape.ts`
