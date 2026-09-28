<!-- spn:doc
{
  "id": "apps-tests",
  "variant": "construct",
  "title": "Tests — The Stack's Own Folders, Without the Stack's Framework",
  "lenses": ["QA", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["stack-checks", "apps-providers"],
  "summary": "How this plugin proves itself — the tier first and the mirror second, an absent tier that says so by being absent, a runner that walks rather than lists, and the rule that nothing may count its own depth.",
  "keywords": ["tests", "tier", "mirror", "runner", "harness", "discovery"]
}
-->

# Tests — The Stack's Own Folders, Without the Stack's Framework

`For: Quality engineer · Backend developer` · `Status: 🔮 PLANNING`

This plugin ships rules that other people's repositories are held to, so it owes proof of its own. The folder that carries that proof follows the same convention this domain's provider asks of every node it governs — with one deliberate exception, stated below.

## Overview

**The folders are the convention and the framework is not.** The stack's own test step puts a project's suites at its root, divided by tier, never beside the source — and that is followed here exactly. What is not followed is the choice of runner. These suites drive real hook processes through standard input and read what those processes write back, so a framework would wrap a subprocess harness inside another harness and buy nothing.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the tier | `unit/` | what kind of proof this is, which is the first thing a folder name answers |
| the mirror | — | the path under a tier, which is the source file's own path inside the plugin |
| a suite | `t-<name>.mjs` | one file proving one thing, named for what it proves rather than for where it sits |
| the runner | `run.mjs` | the one command that finds every suite and reports the verdict of each |
| the harness | `harness.mjs` | what a suite is written against: a throwaway tree, one case, and the plugin root found once |
| discovery | `checkPath` | finding the file a case names by searching the provider folders, rather than typing its path |

## Model

The tier comes first and the mirror second, because the tier answers *what kind of proof is this* and the mirror answers *of what*.

```dg
{ "kind": "map",
  "caption": "Tier before mirror: a second kind of proof for the same file lands beside the first without colliding with it.",
  "boxes": [
    { "id": "a", "label": "the runner", "note": "walks the folder and finds every suite under it" },
    { "id": "b", "label": "the tier", "note": "the first folder — what kind of proof this is" },
    { "id": "c", "label": "the mirror", "note": "under it, the source file's own path inside the plugin" },
    { "id": "d", "label": "a suite", "note": "written against the harness, naming what it proves" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "walks into" },
    { "from": "b", "to": "c", "label": "holds" },
    { "from": "c", "to": "d", "label": "holds" }
  ] }
```

## Parts

### The tier is the first folder, and the mirror sits under it

Putting the mirror first would leave nowhere to file a second kind of proof for the same file. With the tier first, a wired proof of something a unit suite already covers lands under its own tier at the same path, and neither collides with the other.

### A tier with nothing in it has no folder

There is no folder for a tier this plugin proves nothing at, and none for a setup the runner does not need. This is the same rule the gate already states about a realization that is absent: an empty folder teaches a reader that the thing works, where a missing one says what is true.

### The mirror is exact, so a rule and its proof move together

A suite sits at the path its subject sits at inside the plugin. A rule under a provider's private folder has its suite under the same provider's private folder, and a script under the shared folder has its suite under the shared folder. A runner that globbed one flat folder made a rule's proof, a structural proof and a tool's proof indistinguishable, and it is why moving a rule used to move its proof nowhere.

### The runner walks, and judges on the exit code

The suites are found by walking rather than by a list, so a new one is picked up by existing. The verdict is each suite's exit code, and the summary line only says how many cases there were: judging on the printed text alone read a suite that fails while printing a cheerful summary as green, and a suite that passes in different words as red. A runner that can disagree with its own suites proves nothing.

### A suite's own error output is discarded

A suite exercising a gate prints that gate's findings, and inheriting them would put a fixture's warnings into this run's summary as though they were real. So the runner captures what a suite decided and drops what it wrote to the error stream.

### Nothing counts its own depth

The suites sit at many depths because the mirror puts them there, so a relative hop from a suite to the plugin root would be a constant every move has to update — the defect the mirror exists to remove rather than introduce. The plugin root is found once and exported, the runner walks, and the search for a rule walks whatever folders a provider ships. Moving the suites once already broke all of them at the same moment, each having computed its own depth.

### A case names the rule, never its folder

The harness searches every provider folder for the file a case names, rather than looking in a folder it was told about. A harness that knew which stack to look in would be the one place in this plugin naming an instance. So a rule that moves between subjects or between providers breaks no suite, and a case stays about the rule.

### A case runs the real process against a throwaway tree

The harness writes a temporary tree, sends a real payload to the real script on standard input, and reads what came back — so what is proven is what a session would actually get, rather than what a function returns when called directly. The trees are removed when the run ends.

## Boundary

This page answers how this plugin proves itself and how the folder is arranged. It does not answer which tier proves which behaviour in a repository this plugin governs — the ladder and the derivation are the foundation's, and this domain's test step restates them. It does not answer what any rule decides either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the tier-before-mirror order, the exact mirror, and the rule that nothing counts its own depth | which tier proves which behaviour in a governed repository | the foundation's test standard, restated in [Providers](06-providers.md) |
| that the runner walks and judges on an exit code | what each suite asserts, and the rule it is about | [Providers](06-providers.md) · [Scripts](04-scripts.md) |
| that the folders follow the stack's convention while the runner does not | the stack's own test framework, and when a governed node must use it | [Refs](05-refs.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.APPS.035` | the tier ladder, and that a test title carries the behaviour id it proves | MUST |
| `RD.DEVEX.008` | a behaviour row's shape and its id grammar, which is what a suite's title joins to | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a suite is run from this checkout, so it proves the source rather than an installed copy | MUST |

Try it: `node plugins/spn-apps/tests/run.mjs`
