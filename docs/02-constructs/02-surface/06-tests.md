<!-- spn:doc
{
  "id": "surface-tests",
  "variant": "construct",
  "title": "Tests — The Plugin's Own Folders, Without a Framework",
  "subtitle": "How this plugin proves the check and the scripts it ships.",
  "lenses": ["QA", "WEB_DEV"],
  "status": "PLANNING",
  "dependsOn": ["surface-scripts"],
  "summary": "This plugin ships a rule that runs on a person's design file, so it owes proof of its own: one tier, mirrored on its source, behind a runner that walks and judges on an exit code.",
  "keywords": ["tests", "tier", "mirror", "runner", "harness", "bundle"]
}
-->

# Tests — The Plugin's Own Folders, Without a Framework

`For: Quality engineer · Web developer` · `Status: 🔮 PLANNING`

This plugin ships a rule that runs on a person's design file, so it owes proof of its own. Read this page to see how the proof is arranged: one tier, mirrored on the source, behind a runner that walks the folder and judges each suite on its exit code.

## Overview

A test sits at the path of the file it proves, under `tests/unit/`, and a suite is a file named `t-<name>.mjs`. The runner finds every suite by walking, so a new suite runs the day it exists. **The design skill's scripts are proven here too**, because they ship in this plugin and are read by the Figma connector.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a suite | `t-<name>.mjs` | one file proving one thing, named for what it proves rather than for where it sits |
| the runner | `run.mjs` | the one command that finds every suite and reports the verdict of each |
| the harness | `harness.mjs` | what a suite is written against: the plugin root, found once |
| the mirror | — | the path under a tier, which is the source file's own path inside the plugin |
| the tier | `unit/` | what kind of proof this is, which is the first thing a folder name answers |

## Model

The runner walks the tier, runs each suite in its own process, and reads the exit code as the verdict.

```dg
{ "kind": "map",
  "caption": "The exit code is the verdict; the summary line only says how many cases there were.",
  "boxes": [
    { "id": "a", "label": "the runner", "note": "tests/run.mjs walks the tier" },
    { "id": "b", "label": "a suite", "note": "t-<name>.mjs at its source file's path" },
    { "id": "c", "label": "the harness", "note": "the plugin root, found and never counted" },
    { "id": "d", "label": "the verdict", "note": "the exit code, one line per suite" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "runs" },
    { "from": "b", "to": "c", "label": "is written against" },
    { "from": "b", "to": "d", "label": "ends in" }
  ] }
```

## Parts

### The mirror puts a test where its source is

A test for `scripts/checks/figma-connector.ts` sits at `tests/unit/scripts/checks/t-figma-connector.mjs`. Moving a source file moves its test with it.

### A suite is proven against the bundle as well as the source

The bundle-parity suite runs the committed bundle and the source over the same recorded calls and requires the same answer, and the staleness suite refuses a bundle older than its sources, so a hook never runs a rule nobody wrote.

### The launcher and the tiers file are held to the code

The launcher answers as the entry does from any folder, and the tiers file names exactly the groups the plugin ships.

### The runner judges on an exit code

A suite that prints a passing line and exits non-zero is red, and one that passes in different words is green. The runner never reads text to decide.

## Boundary

This page answers how this plugin proves itself. It does not answer what a test tier is for a project the plugin governs — that is the foundation's test chapter, and [Tests](../03-apps/07-tests.md) states the stack's side of it.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the folder this plugin's suites sit in, the mirror and the runner | the tiers a project owes | the foundation's test chapter |
| the harness and the cases for the bundle | how a stack names its test folders | [Tests](../03-apps/07-tests.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | a hook is run from a committed bundle a staleness test keeps current | MUST |

Try it: `node packages/plugin-spn-surface/tests/run.mjs`
