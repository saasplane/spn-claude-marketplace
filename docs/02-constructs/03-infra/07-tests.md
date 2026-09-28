<!-- spn:doc
{
  "id": "estate-tests",
  "variant": "construct",
  "title": "Tests — The Tier, the Mirror, and a Runner That Walks",
  "lenses": ["INFRA", "QA"],
  "status": "PLANNING",
  "dependsOn": ["tests", "estate-guard", "estate-providers"],
  "summary": "How this plugin proves its own gate — a tree named by tier and then by what a suite proves, a runner that walks rather than globs, a harness that finds the plugin root instead of counting it, and the absences that say what does not run here.",
  "keywords": ["test", "tier", "mirror", "runner", "harness", "suite"]
}
-->

# Tests — The Tier, the Mirror, and a Runner That Walks

`For: DevOps / SRE · Quality engineer` · `Status: 🔮 PLANNING`

A gate nobody proves is a gate nobody can trust to be narrow. This plugin's refusals are regular expressions over text somebody is about to write, and a rule that is one character too greedy refuses correct files until somebody turns the whole gate off. So each rule is proven against what it must refuse **and** against what it must let through, and the tree those proofs sit in is arranged so that moving a source file moves its test with it.

## Overview

**The tier comes first and the mirror second.** `unit/` answers *what kind of proof is this*, and the path under it answers *of what* by repeating the source file's own path. That order is what lets a second tier be added later without a collision: an integration suite for a file that already has a unit suite lands at the same path under a different tier.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the tree | `tests/` | this plugin's proofs, at the plugin root and never beside the source they prove |
| a tier | `unit/` | what kind of proof a suite is, which is the first thing the path says |
| the mirror | `unit/<source path>` | the rest of the path, repeating the path of the file being proven |
| a suite | `t-<subject>.mjs` | one file of cases, named for what it proves rather than for where it sits |
| the runner | `tests/run.mjs` | one command for every suite; it walks the tree rather than reading a list |
| the harness | `tests/helpers/harness.mjs` | what drives a real process per case and reads the verdict back |
| the plugin root | `PLUGIN` | found once by the harness, so no suite counts folders to reach the code |

## Model

Two fixed folders and one file, and the shape of the path carries the meaning.

```dg
{ "kind": "map",
  "caption": "The runner walks, so a suite is discovered by where a source file sits rather than by a list.",
  "boxes": [
    { "id": "a", "label": "run.mjs", "note": "walks the whole tree and runs every suite it finds" },
    { "id": "b", "label": "helpers/", "note": "the harness — one real process per case, and the plugin root" },
    { "id": "c", "label": "unit/", "note": "the tier, which is the first thing the path says" },
    { "id": "d", "label": "unit/<source path>", "note": "the mirror — the suite sits at its source's own path" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "loaded by each suite" },
    { "from": "a", "to": "c", "label": "walks into" },
    { "from": "c", "to": "d", "label": "the rest of the path" }
  ] }
```

**The folder names are the stack's own convention and the framework is deliberately not adopted.** The convention names a framework per runtime; these suites drive a real hook process through standard input and assert on what it writes back, so a framework here would wrap a subprocess harness in another harness. The folders are the convention; the runner stays plain.

## Parts

### What is proven, and both sides of every rule

One suite proves the estate laws — what each rule refuses, what it allows, and where the credential length boundary sits, stated as cases so nobody re-derives it from a regular expression. Another proves the subject resolution: each cloud's own spellings refused, each cloud's sanctioned homes still allowed, and the case that matters most — a region belonging to the **other** cloud caught as well, because a write-time gate cannot know which cloud the estate will resolve to.

### The suite is proven load-bearing, not merely green

A passing suite proves the code does what the suite says; it does not prove the suite would notice if the code stopped. So the discovery was tested by moving the Google provider folder aside: exactly the two Google cases went red and every other case stayed green, and restoring the folder returned the whole run. That is the difference between a suite that reads the tree and a suite that agrees with it.

### The runner walks, and it judges on the exit code

`run.mjs` finds every suite by walking the tree and taking each file whose name marks it as one, so a suite is discovered by where its source sits rather than by being added to a list. It reads each suite's own exit code as the verdict and uses the printed summary only for the count, because a suite that exits non-zero while printing a cheerful last line would otherwise read as green. Standard error is discarded rather than inherited, so a fixture's warnings do not appear in the run as this run's findings.

### Nothing counts folders to find the code

Moving the suites once broke every one of them at the same moment, because each computed its own depth back to the plugin. So the harness exports the plugin root, found once; the runner walks; and a suite states only what it proves. **A suite that types a depth is a suite the next move breaks**, and nothing here types one.

### A case runs the real process and reads the real verdict

The harness writes a hook event to a fresh process on standard input and parses the decision back out, so what a case proves is what the harness would see rather than what a function returns. A case states the decision it expects and, for a refusal, a fragment the message must carry — which is how a rule that fires for the wrong reason is caught rather than counted as a pass.

### What is absent, and the absence is the statement

There is no `integration/` folder and no `setup/` folder. Nothing runs at that tier in this plugin, and the runner needs no fixture stood up before it starts. **An empty folder would teach a reader that the tier works**, so neither exists, which is the same rule a cloud with no validator follows.

### The payload a case replays sits beside the suites, once per event

`tests/fixtures/payloads/pretooluse/` holds one recorded call for the one event this plugin wires, and a suite reads it rather than constructing its own. A payload is an input, never a generated answer, so a stale one is a fixture problem and never a passing case that stopped proving anything.

### Two more cases prove the bundle, not one file

`unit/t-dist-current.mjs` and `unit/t-bundle-parity.mjs` sit at the tree's root rather than under any one mirror, because each proves a property of the whole plugin: the first recomputes a bundle's declared sources against the banner esbuild wrote into it, and the second runs a recorded payload through the source and through the committed bundle and asserts the two agree. Both call the one shared harness the foundation's plugins realization states, `packages/plugin-support-lib/tests/helpers/`, so the build and the check can never quietly disagree. This plugin ships no `commands/`, but `hooks.json` still runs a built `dist/events/pretooluse.mjs`, so it owes both cases exactly as its two siblings do.

## Boundary

This page answers where a proof of this plugin lives, what the path means, and what the runner and the harness each do. It does not answer what a tier is or what a passing suite does and does not mean — that is the foundation's test standard, restated for the agent's loop by [Tests](../01-devex/08-tests.md). It does not answer what any rule refuses.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the tier-then-mirror path, the walking runner, and the absences | what a tier means and what a passing suite proves | [Tests](../01-devex/08-tests.md) |
| that a case drives a real process and reads a real verdict | the rules a case asserts about, and the direction they fail in | [Scripts](04-scripts.md) |
| that moving a cloud folder is how the discovery is proven load-bearing | what a cloud folder holds, and what a missing one states | [Providers](06-providers.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Test construct § The test tree | which tier a proof belongs to, and that a tier names a kind of proof rather than a folder of convenience | MUST |
| `RD.DEVEX.UTILS.019` | a suite proves a rule stated elsewhere and states none of its own | MUST |
| the apps plugin's subject registry | *until a parser exists there is no folder for it* — which is why no tier stands empty here | MUST |
| the foundation's `04-plugins/02-shape.md` | the staleness case, the parity case, the payload fixture, and the shared harness every plugin's tests owe once it builds | MUST |

Try it: `node packages/plugin-spn-infra/tests/run.mjs`
