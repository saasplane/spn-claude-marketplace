<!-- spn:doc
{
  "id": "tools",
  "variant": "construct",
  "title": "The Tool — A Command Run by Its Own Path",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["hook-set"],
  "summary": "Code a plugin ships that nothing wires — invoked by a person, a skill or another tool, answering with graded findings and an exit code, and degrading to silence wherever the input it needs is absent.",
  "keywords": ["tool", "invoke", "finding", "grade", "exit code", "silence"]
}
-->

# The Tool — A Command Run by Its Own Path

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Not every rule is worth asking on every keystroke. Some answers need a whole tree, some need two repositories side by side, and some are wanted only when somebody asks. A tool is how a plugin ships that kind of code: a file nothing wires, invoked by its own path, which reads what it was pointed at and prints what it found.

## Overview

A tool and a check draw the same line between refusing and reporting, and they draw it in different currency. A check answers one call with a verdict. A tool answers one run with findings, each graded, and an exit code that counts only the refusals.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a tool | — | a file under a plugin's `hooks/tools/`, named for what it measures, and wired to no moment |
| a finding | `Finding` | one thing a run found: which check raised it, its grade, the file, and what a reader should do |
| the grade | `Grade` | how a finding is weighted, whether a tool raised it or a check running as a sweep did — `RULE` refuses and `SOFT` reports |
| the exit code | — | the count of refusals; a report alone leaves a run green |
| a job | — | one named unit of work inside a tool, such as `audit`, `page`, `topics` or `coverage` |
| silence | — | the answer where the input a question needs is absent, which is a fact about the repository rather than a finding about it |

## Model

Nothing matches a tool against the work you are doing, so you reach one by naming it. A person, a skill or another tool names its path, the tool reads the repository it was pointed at, and you get both a list and a number.

```dg
{ "kind": "map",
  "caption": "The findings a person reads and the exit code a pipeline reads come from one list, and only the refusals are counted.",
  "boxes": [
    { "id": "a", "label": "a person or a skill", "note": "nothing wires a tool; it is invoked by its own path" },
    { "id": "b", "label": "the tool", "note": "a file under hooks/tools/, run against a repository" },
    { "id": "c", "label": "the findings", "note": "each graded RULE or SOFT, printed one per line" },
    { "id": "d", "label": "the exit code", "note": "the refusals alone; a report is not a failure" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "invokes" },
    { "from": "b", "to": "c", "label": "prints" },
    { "from": "c", "to": "d", "label": "counted into" }
  ] }
```

The exit code is what a pipeline reads and the findings are what a person reads, and the two must agree about which is which. That is the whole reason the grade is part of a finding rather than a judgement made at the end.

## Parts

### One file serves the write-time check and the sweep

A rule answered one way while a file is written and another way in a sweep is two rules. So the code that decides lives once, and both callers import it. The practical consequence is that the same file must read a document in both of its spellings — the markdown an author writes and the HTML a page is produced as — because reading only one of them once reported every hand-written page as missing every section it carried. *Where:* `plugins/spn-devex/hooks/tools/docs.ts`

### A job, not a flag

A tool with more than one job gives each job a name and a path argument, and a path is a file or a folder in every one of them. Given a folder, a job means every document under it, which is what anybody typing one meant. *Where:* `plugins/spn-devex/hooks/tools/docs.ts`

### Two questions that look alike and are not

Comparing documents inside one repository and comparing a restatement against a book in another repository are different questions with different inputs, and no repository holds both trees. So they are two tools, and both read one parser, because writing the parser twice would be the defect the instrument exists to catch. *Where:* `plugins/spn-devex/hooks/tools/coherence.ts`, `plugins/spn-devex/hooks/tools/restate-drift.ts`

### Silence where the input is absent

A partner holds the plugins and neither the book nor its registers. A question whose input is missing answers with one line and a clean exit, because a crash on a repository the tool was not written for shows a partner a broken agent rather than a missing file. *Where:* `plugins/spn-devex/hooks/tools/restate-drift.ts`, `plugins/spn-devex/hooks/tools/coherence.ts`

### A tool that proves the other tools

One tool builds a repository carrying only what a partner has, runs every hook and script against it, and reports. A crash is a failure there; a finding is not, because findings are that repository's own business. It picks an interpreter from each script's own extension, so a ported script is exercised the same way its predecessor was. *Where:* `plugins/spn-devex/hooks/tools/partner-shape.ts`

### A tool that reports candidates rather than verdicts

Handing a whole corpus to a rewriting pass is the expensive way to improve it, and most of the corpus needs no change. So the prose triage reports the paragraphs a pattern can recognise, with a ledger of what it has already scored so a long sweep can resume, and it leaves the faults no pattern can tell from good prose to a reader. *Where:* `plugins/spn-devex/hooks/tools/prose-triage.ts`

### A tool that writes rather than reports

One tool here writes. It reads a run's own results file and puts what the run found into the cells a run owns, leaving every other cell exactly as it was. It exists because this repository declares no stack, so no stack runner writes its rows, and only the plugins' own suites know. *Where:* `plugins/spn-devex/hooks/tools/behaviour-status.mjs`

## Boundary

This page answers what a tool is, how it is reached, and what it answers with. It does not answer what a hook is or how a verdict is composed — that is [The Hook](02-hook-set.md). It does not answer the page production either: producing and checking a page is a subject of its own, and the jobs that do it are named on that page.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| that a tool is invoked by its own path, grades its findings, and counts only refusals into its exit code | code wired to a moment, and the verdict shape it returns | [The Hook](02-hook-set.md) · [Loop Events](03-loop-events.md) |
| that a question with no input answers with silence rather than a crash | what a produced page is, and how a figure is drawn and checked | [The Page](06-pages.md) |
| the stack-agnostic tools | a tool that reads one stack's own declarations or registers | [Stack Tools](../02-spn-apps/02-stack-tools.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | a tool restates a chapter and adds no rule of its own | MUST |
| `RD.GOV.024` | this repository is served with docs commands alone, which is why its own rows are written by a tool the plugins ship | MUST |
| the foundation's `02-delivery.md` § What it makes checkable | which standards a tool is expected to answer rather than a reader | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-devex` | the stack-agnostic tools — the corpus audit, the corpus against itself, the drift comparison, the partner proof, the prose triage and this repository's own row writer | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/hooks/tools/partner-shape.ts` | gate | every tool runs against a repository holding nothing but the plugin, and answers with silence where its input is absent |
| `node plugins/spn-devex/hooks/tools/coherence.ts` | gate | no two documents in this repository state opposite rules, and every stamped restatement still reads as its chapter does |

Try it: `node plugins/spn-devex/hooks/tools/coherence.ts`
