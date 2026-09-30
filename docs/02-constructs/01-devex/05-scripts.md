<!-- spn:doc
{
  "id": "checks",
  "variant": "construct",
  "title": "Scripts — The Code a Plugin Ships, Wired or Reached by Name",
  "subtitle": "Every file a plugin can run lives in one folder, sorted by what calls it.",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["hook-set"],
  "summary": "Scripts is the one folder that holds everything a plugin can execute — the checks a hook composes, the tools a person reaches by typing their path, and the library code both sides read.",
  "keywords": ["script", "check", "tool", "applies", "finding", "grade"]
}
-->

# Scripts — The Code a Plugin Ships, Wired or Reached by Name

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Scripts is the one folder that holds everything a plugin can execute — the checks a hook composes, the tools a person reaches by typing their path, and the library code both sides read. Read this page before you add a new script, or when you are not sure whether a rule belongs in a hook or in a tool. It explains how each kind is reached and the two habits every file in the folder keeps.

## Overview

Two habits run through the whole folder. The first is that **a script names the chapter it restates** in its own header, so the rule has exactly one home and a change is made there first. The second is that **a script reads the smallest slice its question needs**. Reading everything on every call once cost three quarters of every millisecond the hooks had spent, and a gate that makes a session slow is a gate somebody eventually removes.

Sharing one decision between a write-time check and a sweep is the habit that decides the folder's shape. **A rule answered one way while a file is written and another way in a sweep is two rules**, so the code that decides lives once and both callers import it.

This construct realizes the book's `01-devex/02-agent/01-agent`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a script | `scripts/` | one file a plugin ships under `checks/`, `events/`, `tools/` or `lib/`, named for what it decides or measures |
| a check | `Check` | a file a moment's dispatcher composes: it reads one call and returns a verdict |
| the fast path | `applies` | a test on the path or the shell command alone, deciding whether this check could have an opinion at all |
| what it reads | `needs` | which fields of a call a check requires; a call carrying none of them never reaches it |
| a refusal | `deny` | the call is stopped, with the reason a reader is given |
| advice | `note` | the call goes through and the turn is told something; advice from several checks is joined |
| a tool | — | a file under `tools/` that nothing wires, reached by naming its own path |
| a finding | `Finding` | one thing a run found: which question raised it, its grade, the file, and what a reader should do |
| the grade | `Grade` | how a finding is weighted — `RULE` refuses and `SOFT` reports |
| the exit code | — | the count of refusals; a report alone leaves a run green |
| a job | — | one named unit of work inside a tool, such as `audit`, `page`, `topics` or `parity` |
| silence | — | the answer where the input a question needs is absent, which is a fact about the repository rather than a finding about it |

## Model

There are two ways into this folder and one body of code behind them. A moment reaches a check; a person or a skill reaches a tool. What either one asks is decided in the same place.

```dg
{ "kind": "map",
  "caption": "One rule, two callers, so a write-time answer and a sweep answer cannot disagree.",
  "boxes": [
    { "id": "a", "label": "a call or a command", "note": "a moment's dispatch, or a path somebody typed" },
    { "id": "b", "label": "the script", "note": "one file under checks, events, tools or lib" },
    { "id": "c", "label": "the rule", "note": "decided once; both callers import the same code" },
    { "id": "d", "label": "the answer", "note": "a verdict on a call; graded findings and an exit code on a run" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "reaches" },
    { "from": "b", "to": "c", "label": "asks" },
    { "from": "c", "to": "d", "label": "returns" }
  ] }
```

A refusal ends a chain, because anything said after an answer is noise. Advice does not end it, because two useful things are worth more than one.

## Parts

### The four folders, and what reaches each

`checks/` holds the files a moment's dispatcher composes. `events/` holds one file per moment, which is the only code the wiring names. `tools/` holds the files nothing wires, reached by typing a path. `lib/` holds what more than one of the others reads and what none of them owns. The whole tree sits under `scripts/`, and the plugin's `hooks/` folder holds the wiring file alone.

### A check is a file, and its header names its source

Each check sits in its own file under `scripts/checks/` and opens with a line naming the chapter or register row of the foundation book it restates. That line carries no hash and nothing compares it, and that is deliberate: it tells a reader where the rule lives, and the rule is that a change is made in the chapter first and here second, in the same change.

### Refusing a whole route beats listing the safe ones

Where a value must never be rendered, every route that would render it is refused rather than the safe routes listed. One pipeline prints key names and the next prints every value, and telling those apart inside a shell string is guesswork. The whole command is read, so even a quoted path inside a here-document is caught, and the message names the door to use instead.

### Some checks speak and never refuse

Where deciding needs a reading rather than a match, a gate would be guessing. The check that names which document governs the folder you are editing does that and nothing else, and where no row governs a folder it stays silent — that gap belongs to a sweep over the whole tree rather than to one write. And a warning that repeats is a warning nobody reads: one turn writes many files, often into one folder, so a speaking check remembers what it already said and says it once, keeping that memory in the workspace's own folder for what its machinery says about itself.

### A fragment cannot answer a question about a tree

Every check under `checks/` reads the fragment being written, and a fragment cannot show that a page names a folder deleted last week or that a produced page stopped matching its seat. Those are corpus questions, and one check exists to ask a few of them without waiting for somebody to type a command.

### The workspace gates ask for accounting, not completion

Closing a scope with work still pending is good housekeeping. What must not happen is a row nobody decided. So the close gate passes landed, carried and deferred alike, and refuses only the undecided row, and there is no override because recording the deferral is the way through. Two of the workspace gates read the same table for different reasons, so they live in one file and the dispatcher registers each separately. Naming them apart matters: one sweeps the workspace and the other reads a single path, and anybody measuring the cost needs to know which.

### The bars a check measures come from a rule, never from the corpus

A bar set from what the corpus already averages moves every time the corpus does, so a sweep would approve whatever is already there. The document check takes its numbers from the register row that states them, and takes headings, tables, code and metadata out of the text before measuring what is left.

### A tool is reached by name, and grades what it finds

Nothing matches a tool against the work you are doing, so you reach one by naming its path. It reads the repository it was pointed at and answers with both a list and a number: findings a person reads, each carrying its grade, and an exit code a pipeline reads that counts only the refusals. That is why the grade is part of a finding rather than a judgement made at the end.

### One file serves the write-time check and the sweep

A rule answered one way while a file is written and another way in a sweep is two rules. The practical consequence is that the same file must read a document in both of its spellings — the markdown an author writes and the HTML a page is produced as — because reading only one of them once reported every hand-written page as missing every section it carried.

### A job, not a flag

A tool with more than one job gives each job a name and a path argument, and a path is a file or a folder in every one of them. Given a folder, a job means every document under it, which is what anybody typing one meant.

### Two questions that look alike and are not

Comparing documents inside one repository and comparing a restatement against a book in another repository are different questions with different inputs, and no repository holds both trees. So they are two tools, and both read one parser, because writing the parser twice would be the defect the instrument exists to catch.

### Silence where the input is absent

A partner holds the plugins and neither the book nor its registers. A question whose input is missing answers with one line and a clean exit, because a crash on a repository the tool was not written for shows a partner a broken agent rather than a missing file.

### A tool that proves the other scripts

One tool builds a repository carrying only what a partner has, runs every wired script and every other tool against it, and reports. A crash is a failure there; a finding is not, because findings are that repository's own business. It picks an interpreter from each script's own extension, so a ported script is exercised the same way its predecessor was.

### A tool that reports candidates rather than verdicts

Handing a whole corpus to a rewriting pass is the expensive way to improve it, and most of the corpus needs no change. So the prose triage reports the paragraphs a pattern can recognise, with a ledger of what it has already scored so a long sweep can resume, and it leaves the faults no pattern can tell from good prose to a reader.

### A tool that writes rather than reports

One tool here writes. It reads the files of the one run it is told to read and puts what the run found into the cells a run owns, leaving every other cell exactly as it was. It exists because this repository declares no stack, so no stack runner writes its rows, and only the plugins' own suites know.

### A tool produces the pages, and the page's own shape belongs to the book

An author writes markdown and a reader opens HTML, and the whole of what sits between the two is a job of the documents tool: `page` produces, `face` writes the generated regions of a face, `figures` measures every drawing, and `audit` produces a page again and compares it byte for byte, so a hand edit is found rather than inherited. What the tool must not decide is what a page is made of. **The block vocabulary, the figure grammar and the furniture a page carries are the foundation's**, stated in `spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md` with the templates beside it, and this folder only realizes them. Where the two disagree, the chapter wins.

## Boundary

This page answers what a script is, how each kind is reached, and what it answers with. It does not answer how checks are composed, what the payload is, or why the exit code is always zero — that is [Hooks](02-hooks.md). It does not answer what the rules themselves say either: each file's header names the chapter that states its rule, and that chapter is where a change is made.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the four folders, the shape of one check, the shape of one tool, and the grade a finding carries | the composition, the payload, the dispatcher's own guard, and the exit code a moment's script ends on | [Hooks](02-hooks.md) |
| the line between refusing a call and only speaking about it | which rule a given script enforces, and what that rule says | the foundation chapter each header names |
| that a page is produced from its seat file and compared against it | what a page is made of — the blocks, the figure grammar and the furniture | the foundation's `05-artifacts.md` |
| that a stack-agnostic question belongs here | a question true only of one stack, or only of an estate | the scripts chapter of [the apps domain](../02-apps/README.md) or [the infra domain](../03-infra/README.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.UTILS.019` | a script restates a chapter and adds no rule of its own | MUST |
| `RD.DEVEX.WORKSPACE.118` | a file carrying a rule it does not own is a restatement, and it names its source | MUST |
| `RD.DEVEX.WORKSPACE.176` | this repository is served with docs commands alone, which is why its own rows are written by a tool the plugins ship | MUST |
| the foundation's `02-delivery.md` § What it makes checkable | which standards are expected to be answered by a script rather than by a reader | MUST |
| the foundation's `05-artifacts.md` § The blocks · § The figures | what a produced page is made of, which this folder renders and never decides | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | the four kinds of script, the `<group> <action>` shape `commands/` dispatches by, one command entry | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs plugin partner` (or `spn-devex plugin partner`, once installed)
