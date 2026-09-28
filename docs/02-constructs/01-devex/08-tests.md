<!-- spn:doc
{
  "id": "tests",
  "variant": "construct",
  "title": "Tests — The Tier, the Mirror, and a Runner That Walks",
  "lenses": ["QA", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set", "checks"],
  "summary": "The folder a plugin proves itself from — the tier that says what kind of proof a suite is, the mirror that says what it is proof of, the runner that finds every suite by walking rather than by a list, and the two tiers deliberately left absent.",
  "keywords": ["test", "suite", "tier", "mirror", "runner", "harness"]
}
-->

# Tests — The Tier, the Mirror, and a Runner That Walks

`For: Quality engineer · Backend developer` · `Status: 🔮 PLANNING`

A plugin is code, so it owes proof. What makes that proof its own construct rather than an implementation detail is where the files sit: a reader looking for the suite that covers a script should be able to derive its path from the script's path, without opening anything. This page names the tree that makes that true, and the two rules that keep it true after a move.

## Overview

The tree answers two questions in a fixed order. **The tier comes first and the mirror second**, because the tier answers *what kind of proof is this* and the mirror answers *of what*. Put the mirror first and a second tier for the same file has nowhere to go; put the tier first and an integration suite for a file that already has a unit suite lands at the same path under a different tier, without colliding.

The second promise is about what happens the next time the tree moves. **Nothing here counts a `..` hop.** Moving these suites once broke every one of them at the same moment, because each computed its own depth from where it happened to sit.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a suite | `t-<name>.mjs` | one file proving one source file, named for what it proves |
| the tier | `unit/` · `integration/` | the first folder under `tests/`, saying what kind of proof the suites below it are |
| the mirror | — | the path under a tier that repeats the source file's own path inside the plugin |
| the runner | `run.mjs` | the file that finds every suite by walking the tree, runs each, and reports |
| the harness | `helpers/harness.mjs` | what every suite imports instead of computing: the plugin root, a temporary tree, one case, a script's path |
| a case | — | one named assertion inside a suite; a title carrying a behaviour row's id becomes that row's result |

## Model

A suite's address is derived, never chosen. Read it outward from the folder every plugin's proof sits in.

```dg
{ "kind": "map",
  "caption": "The tier comes first and the mirror second, so a second tier for one file lands beside its suite rather than on it.",
  "boxes": [
    { "id": "a", "label": "tests/", "note": "the root; the runner and the helpers sit here and nowhere else" },
    { "id": "b", "label": "the tier", "note": "unit — what kind of proof the suites below are" },
    { "id": "c", "label": "the mirror", "note": "the source file's own path inside the plugin, repeated" },
    { "id": "d", "label": "the suite", "note": "t-<name>.mjs, reached by a walk and never by a list" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "first" },
    { "from": "b", "to": "c", "label": "then" },
    { "from": "c", "to": "d", "label": "names" }
  ] }
```

The tree sits at the plugin's root rather than beside the source, so a suite is never shipped with the code it proves. That is the authoring stack's own convention, and it is the reason the folder names below are the ones a TypeScript project already uses.

## Parts

### What the folder holds, and the two tiers that are absent

`tests/` holds the runner, a `helpers/` folder for what every suite imports, and one folder per tier. Only `unit/` exists. `integration/` is absent because nothing in these plugins runs at that tier, and `setup/` is absent because the runner needs none. **An absent folder says what is true; a folder standing empty to look complete teaches a reader that the tier works.**

### The mirror repeats the source's own path

Under the tier, a suite sits at the path its source sits at inside the plugin. A check under `src/scripts/checks/` is proven under `unit/scripts/checks/`. A provider's rule is the one place the two paths differ: it lives under `src/providers/<instance>/scripts/checks/_<subject>/` and is proven under `unit/providers/<instance>/checks/_<subject>/`, without the provider's `scripts/` segment. Apart from that, nothing maps one to the other: the path is the map.

### The folders are the convention; the framework is not

The authoring stack's own test step names a framework as well as a tree, and only the tree is adopted here. These suites drive real hook processes through standard input and assert on what comes back out, so a framework would wrap a subprocess harness in another harness and buy nothing. **The runner stays a plain `.mjs` file with no dependency**, which is also what lets a partner run it with nothing installed.

### Nothing counts a `..` hop

A suite that types its own depth is a suite the next move breaks, and every suite broke at once the first time these folders changed. So the plugin root is resolved once, in the harness, and exported; the runner finds the tier by walking down from its own folder; and the helper that resolves a script's path walks whatever folders a provider's `checks/` actually holds. A suite imports those answers and computes none of them.

### A suite is found by a walk, never by a list

The runner walks the tier and runs every file it finds. A list would be a second place a new suite has to be added, and the suite nobody added to it is the one that silently never runs.

### A case that carries a behaviour id becomes that row's result

This repository declares no stack, so no stack runner writes its behaviour rows. The suites are the runner instead: a case whose title carries a row's id writes that row's result into the run's own artifact, and a tool reads the artifact and fills the two cells a run owns. A row no case reached is left saying so.

### What a suite proves is the shipping shape

A suite runs the script the way a moment runs it — as a process, handed a payload on standard input, read back from standard output — rather than importing a function and calling it. A gate that passes when imported and fails when spawned is a gate that has never been proven, and both spellings exist in the folder it is asked about.

## Boundary

This page answers where a suite sits, how it is found, and what it may not compute for itself. It does not answer which tier a given behaviour belongs to, or what a passing suite does and does not mean — the foundation's own test chapter rules that, and it is the source of the tier names used here. It does not answer what the scripts under proof do either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the folder shape, the tier-then-mirror order, the walk, and the rule that no suite computes a depth | which tier a behaviour belongs to, and what a green suite does and does not prove | the foundation's test construct |
| that a suite drives the script as a process rather than importing it | what any one script decides, and the rule it restates | [Scripts](05-scripts.md) |
| that an absent tier states an absence rather than hiding a gap | the same rule applied to a realization's own folders | [Providers](07-providers.md) |
| that a case's title can carry a behaviour row's id | where that row lives, and who writes its status | the behaviours register beside each construct |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's test construct | the tier names, and what a passing suite may be read as saying | MUST |
| the apps provider's `test` step | `tests/` sits at a project's root and never beside the source it proves | MUST |
| `RD.GOV.024` | this repository is served with docs commands alone, which is why the plugins' own suites are its runner | MUST |
| `RD.DEVEX.019` | a suite proves a restatement fires; it states no rule of its own | MUST |

Try it: `node plugins/spn-devex/tests/run.mjs`
