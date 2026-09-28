<!-- spn:doc
{
  "id": "stack-skills",
  "variant": "construct",
  "title": "Skills — The Commands an Apps Repository Answers To",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "dependsOn": ["skill-set"],
  "summary": "The skills the apps domain ships — what makes one belong to this domain, why the longest of them divides into ordered steps it does not hold itself, why a mode is an argument rather than a second folder, and the skill that is deliberately absent.",
  "keywords": ["skill", "steps", "mode", "classification", "stage", "absence"]
}
-->

# Skills — The Commands an Apps Repository Answers To

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

A skill belongs to this domain when the work it describes is work on an apps node: scaffolding a project, building a capability, running the suites, proving a package, publishing the repository. Each of those is a different walk, and each lives in one folder under this plugin's `skills/`.

## Overview

The thing to check first is that **a skill here names no stack**. The steps of a build differ in every language, so the skill states the order and reads the step files from the provider the node's own `sprepo.json` declares. The second thing is the absence: **planning is not a skill of this domain.** The book's skill set is closed and folded planning into a stack-agnostic skill, so shipping one here would add a value the standard does not have, and two skills would then compete for the same ask.

This construct realizes the book's `01-devex/02-agent/02-skills`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a skill | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group this domain answers to |
| the value | `APPS_{SKILL}` | the name the enum carries for that folder, its domain prefix derived from the plugin's own claim |
| the stage | `RD.DEVEX.017` | the one stage a skill serves, which is what makes the applicable standards derivable from the skill that was invoked |
| a mode | — | an argument a skill's own description names, so one folder answers several close asks |
| a step | `steps/` | one file of a longer walk, read only when the skill's own router names it |
| the classification | — | the first thing the router does: deciding which layers an ask actually touches |
| the closing gate | — | the review a skill hands its own work to, named in its description so the hand-off happens without being asked for |

## Model

The ask is matched to a skill, the skill is narrowed by a mode, and the longest skill sequences steps it reads from the provider for the node's own stack.

```dg
{ "kind": "map",
  "caption": "The skill names the step and its order; the provider holds the file, so the walk is concrete without the skill naming a stack.",
  "boxes": [
    { "id": "a", "label": "the ask", "note": "build, scaffold, run, prove, review, publish — in your own words" },
    { "id": "b", "label": "the skill", "note": "one folder under skills/, chosen by its own description" },
    { "id": "c", "label": "the mode", "note": "an argument the description names, never a second skill" },
    { "id": "d", "label": "the steps", "note": "named and ordered here, read from the provider for the declared stack" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "matched to" },
    { "from": "b", "to": "c", "label": "narrowed by" },
    { "from": "c", "to": "d", "label": "sequences" }
  ] }
```

## Parts

### One skill divides into steps, and the order is the rule

The contract comes first, and everything downstream is generated from it or written against it. A service written before its state is a service that will be rewritten. So the build skill is the only folder here that sequences steps at all, the order is fixed, and each step is read before that layer's code is written rather than after.

### The skill names the step; the provider holds it

A step file is written in a language, so it cannot live in a skill that serves every stack this domain may grow. The skill states the step names, their order and what each one settles, and composes the path `providers/{stack}/skills/implement/steps/{step}.md` from the nearest `sprepo.json`. A step file the declared stack does not ship is a step that stack does not walk, and nothing here stubs one.

### The router classifies before it sequences

The build skill first decides whether the ask touches the back end alone, the front end alone, or both, and that classification decides which steps apply. Sequencing every step for every ask would make the smallest change cost the largest walk.

### A mode is an argument, not a second folder

Two folders with almost the same description compete for the same match, and the matching gets worse as the pair grows. So a skill answering several close asks takes a mode, names its modes in the sentence a session matches against, and says which neighbouring skill an adjacent ask belongs to instead. A destructive mode says it is destructive in that same sentence rather than in the body it loads afterwards.

### Each skill declares the one stage it serves

A skill and a stage are separate closed sets mapped many to one, and the mapping is what makes *which standards apply to this request* derivable from the skill that was invoked. Scaffolding answers to the repository stage, proving answers to the test stage, and the build loop's skills answer to the develop stage. Flattening them derives nothing.

### A skill carries a stamp, so a chapter it fell behind can say so

A skill is prose the agent loads, and prose drifts from the book silently because nothing compares it. Every skill here opens with a block naming the chapters it restates and the hash last read from each, so a drift run reads a skill exactly as it reads a ref.

### The closing gate belongs to the skill

A contract change reviewed at the end of a session is reviewed by the context that wrote it. So the build skill closes with the suites and then hands the change to the review skill in its contract mode, and the hand-off is named in the description, so it happens even when nobody asks for it.

### The absent skill, and where its material lives

Deciding what a node is belongs to a skill that is the same in every world, and it lives once in the core plugin. What this plugin supplies is the part of that walk only a stack can answer, and it sits under the provider for that stack rather than under `skills/`.

## Boundary

This page answers which skills this domain ships and how they are shaped. It does not answer what a skill is — the frontmatter, the matching against a listing, and the rule that a skill carries steps and never a rule of its own are [The Skill](../01-devex/04-skills.md). It does not answer what any step file says either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the skills this domain answers to, the step order behind the longest of them, and the modes each one takes | the frontmatter, the listing, the matching and the step mechanism | [The Skill](../01-devex/04-skills.md) |
| that a skill names a step and never a stack | the step files themselves, and which stack ships which of them | [Providers](06-providers.md) |
| that deciding what a node is belongs to a skill this plugin does not ship | that skill, and the walk it runs | [The Skill](../01-devex/04-skills.md) |
| that a skill hands its own work to a review at its close | what that review checks, and which viewpoint it convenes | [Agents](../01-devex/03-agents.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.025` | one folder per skill value and one value per folder, the prefix derived from the shipping plugin's own claim | MUST |
| `RD.DEVEX.017` | each skill declares the one stage it serves, so the standards that apply are derivable from the skill | MUST |
| `RD.DEVEX.062` | planning folds into a stack-agnostic skill, which is why this domain ships none | MUST |
| `RD.DOCS.055` | a skill that carries a rule it does not own is a restatement, and says so under a stamp | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a skill edit is loadable only after an install and a fresh window | MUST |

Try it: `node plugins/spn-devex/src/scripts/tools/restate-drift.ts`
