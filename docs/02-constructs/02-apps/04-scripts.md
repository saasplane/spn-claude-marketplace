<!-- spn:doc
{
  "id": "stack-checks",
  "variant": "construct",
  "title": "Scripts — The Code This Plugin Runs",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "dependsOn": ["apps-hooks", "checks"],
  "summary": "Everything under this plugin's scripts folder — the gate that resolves a write to the declared stack without naming one, the process behind the single wired entry, the shared code both sides read, and the commands run by name over an apps repository's own registers.",
  "keywords": ["gate", "subject", "dispatcher", "register", "action", "coverage"]
}
-->

# Scripts — The Code This Plugin Runs

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

Everything this plugin executes sits in one folder, and the folder divides by what calls each file. The wiring calls one of them. The gate is asked by that one. Some are run by a person or an agent typing their path. The rest are libraries the others read.

## Overview

Two decisions shape the whole folder. **Nothing here names a stack** — the gate reads the declaration and resolves into a provider, so the code that knows a language sits outside this folder entirely. And **a tool writes only what a run found** — part of a behaviour row is somebody's decision, and a tool writing over that would turn a declaration into a guess.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the gate | `subjectsFor` | the stack-free half: it reads the node's declaration and hands the write to the provider for it |
| a subject | `SUBJECT_NAMES` | one grouping of rules a write is asked about, cheapest first |
| the dispatcher | `pretooluse.ts` | the single process behind the wired entry, which keeps the first refusal and joins the advice |
| the resulting text | `resultingText` | the source as the pending write would leave it, which is what a rule actually reads |
| masking | `mask` | blanking comments and string bodies before searching, so a word inside a quote is never read as code |
| a register | `HEADINGS` | any table carrying the behaviour headings in order, wherever in a repository it sits |
| a row | `cellsOf` | one behaviour: who does what, what they see, its kind, the tier that proves it, its status and when that was found |
| the tier | `tier` | the rung a row is proven at; a run matches itself against this and leaves the other rungs alone |
| the results file | — | what a test runner wrote about one run, read by behaviour id and by tier |
| an action | `@SPAPIRouteCommand` | one published thing a caller can perform, found by its declaration rather than by a folder shape |
| a hand-checked row | `MANUAL` | a row a person proves, which no run ever writes over |

## Model

The folder has two halves that never meet. One is reached by the wiring and answers about a single write. The other is reached by its own path and answers about a whole repository.

```dg
{ "kind": "map",
  "caption": "The wired half answers about one write; the commanded half answers about a repository, and neither reads the other.",
  "boxes": [
    { "id": "a", "label": "the wired half", "note": "events/ and checks/ — one process per write" },
    { "id": "b", "label": "the gate", "note": "reads the declaration, resolves into the provider for it" },
    { "id": "c", "label": "the commanded half", "note": "tools/ — run by its own path, over one repository" },
    { "id": "d", "label": "the shared half", "note": "lib/ — the payload, the reading, the register, the hash" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "asks" },
    { "from": "a", "to": "d", "label": "reads" },
    { "from": "c", "to": "d", "label": "reads" }
  ] }
```

## Parts

### The gate names no stack, and that is what it is for

The file that names the subjects reads the stack from the nearest `sprepo.json` and imports the provider's own half by a path composed from that declaration. The import is composed rather than written, because a written one would be this file naming a stack — the one thing it may not do. A second stack joins by adding a folder and nothing here changes.

### A repository the plugin has no provider for is left alone

A gate that refused what it cannot classify would refuse far more than it was asked to, and a stub that answered would teach a reader the realization works. So a declaration this plugin ships no folder for resolves to no subject, silently.

### The subjects are ordered by what they cost

A subject that reads one file is asked before a subject that walks a tree, and a refusal above stops the walk below. Which rules apply is decided by the path and the node's kind rather than by the subject's name.

### One process behind the entry

The wiring declares one entry and this file runs everything behind it, keeping the first refusal and joining the advice. Separate entries are separate interpreter start-ups whatever language the scripts are written in, and on one measured edit the start-ups cost more than ten times the checking itself.

### The payload shape is copied, never imported

A plugin never depends on another plugin's internals. The two install separately and version separately, and a partner may hold one without the other on disk at all, so an import across them would work in this checkout and break in every install. This plugin keeps its own copy, named exactly as the core plugin names the same job, so learning one teaches you both.

### A source file is read with the write already applied

Reading what is on disk reports faults somebody else wrote and misses the one arriving now. So comments and string bodies are masked, the caller's pending text is laid over the file, and every rule reads that. The reading is shared rather than private to one rule, and it happens once per write rather than once per rule.

### The stamp is computed here, and must agree with the other copy byte for byte

The hash behind a restatement's `seen` value is spelled once per plugin, because a plugin is installed alone and cannot read another plugin's files. Two plugins computing it differently would report drift against each other for files that agree, and a finding that is wrong teaches people to stop reading the run. A case in this plugin's own suite hashes a fixture with both copies and fails if they differ.

### A register is found by its header, never by a path

A documents tree that moves must break no tool, and reading the header is the only way to be right in the layout a repository has today and in the one that follows it. So any table whose headings are the behaviour headings is a register. The headings and the row test are one exported pair read by every tool that touches a register, because two tools parsing a table differently means one writes rows the other cannot see.

### Two cells are the run's and the rest are a person's

The kind of behaviour and the tier that proves it are decisions somebody made. The status and the moment it was found are what the last run saw. The two were one cell until they disagreed quietly, and a row whose case had stopped running still read as proven. The writer touches those two and copies every other cell through untouched.

### A run speaks only for the tiers it ran

A partial run that reset a whole register would make every status swing on every run, and nobody could read a red as new. So a run updates the rows declaring a tier it covered and leaves the rest exactly as it found them. That is why the tier is a person's cell to declare: it is what a run matches itself against, and a hand-checked row is never written over.

### It reads the run's own artifact, never a specification

A status derived from a specification reports a case that exists as a case that ran. Crossing a route with a surface, or scanning a source tree for case titles, cannot see a case that was skipped or filtered out. So the writer reads the file the runner produced, and a row whose case never reached the runner says so.

### Coverage is measured against actions, not routes

A route says where a screen lives and nothing about what can be done there. One settings route can carry several actions behind it, and counting routes reports that screen as covered while most of them have never been performed. Every published action is an interaction, whether a person performs it through a browser or another system performs it through the generated client, so the action surface is what a register is measured against.

### An action is found by its declaration, never by a folder

A glob naming one stack's folder shape missed a whole module whose home was an application rather than a package. The declaration itself is what makes something an action, so looking for the declaration needs no folder shape and finds a module wherever it is kept.

### A generator writes a list nobody could keep by hand

A published set moves every release, so a hand-written list of it is stale the day after it is written and nothing reports that. One tool reads what the support repository publishes and writes the table, under a citation naming the command that produced it — so re-running the command is how a reader checks it. What it leaves out is the point: a package a partner cannot depend on is not something to list.

## Boundary

This page answers what sits in this plugin's scripts folder and what each part may decide. It does not answer the frame a check runs in — the payload, the verdict, the composition and the always-zero exit are [Hooks](../01-devex/02-hooks.md) and [The Check](../01-devex/05-scripts.md), and this plugin follows that shape rather than inventing one. It does not answer any rule about a language, because no such rule lives here.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| resolving a write to the declared stack, the subject order, and the single process behind the entry | the payload, the verdict, the dispatcher's shape, and the exit code | [Hooks](../01-devex/02-hooks.md) |
| finding a register by its header, the cells a run owns, and measuring coverage against the published action surface | that a tool is invoked by its own path and grades what it finds | [The Check](../01-devex/05-scripts.md) |
| that nothing here names a stack | every rule that reads a language's own syntax, and the parse that feeds it | [Providers](06-providers.md) |
| that a run speaks only for the tiers it covered | what a behaviour row must contain, and the grammar of its id | the foundation's document chapter |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.008` | a behaviour row's shape, its id grammar, and that a test title carries the id | MUST |
| `RD.APPS.035` | which rung proves which behaviour, and that status is synced from a run rather than typed | MUST |
| `RD.DEVEX.035` | a rule reaches a write-time hook only where review would be too late | MUST |
| `RD.GOV.024` | a repository answers to the world it declares, which is what the gate reads the stack from | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a script here is live on its next run, so an edit lands without an install | MUST |

Try it: `node plugins/spn-apps/tests/run.mjs`
