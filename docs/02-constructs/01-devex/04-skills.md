<!-- spn:doc
{
  "id": "skill-set",
  "variant": "construct",
  "title": "Skills — A Stage's Steps, Loaded on Match",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "A named unit of work a session can be asked for — a folder, a description matched against the work at hand, the instructions loaded once it matches, and the rule that a skill carries steps and never a rule of its own.",
  "keywords": ["skill", "SKILL.md", "description", "match", "steps", "stage"]
}
-->

# Skills — A Stage's Steps, Loaded on Match

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

Loading every rule this repository knows into every turn would drown the turn that needed one of them. A skill is how the loading is narrowed instead: a name, a sentence saying when it applies, and the instructions for doing that one thing, read only once the work at hand matches the sentence. This page names that shape.

## Overview

The sentence is the part people write wrongly. A description here is matched against what you are doing, never browsed by a person, so it states the class of ask it answers and the words a developer actually types. A description written as a catalogue entry is a skill that never fires.

This construct realizes the book's `01-devex/02-agent/02-skills`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a skill | `SKILL.md` | one folder under a plugin's `skills/`, named for its stage, holding the file a session loads |
| the name | `name` | the value a person types to ask for the skill directly, and the folder's own bare name |
| the trigger | `description` | the sentence matched against the work at hand, which decides whether the file is loaded at all |
| the listing | — | every installed skill's name and description, one line each; this is what a session holds in full |
| a step | `steps/` | one file a skill's own instructions sequence, read only when they name it |
| a mode | — | an argument a skill's description names, so one folder answers several close asks rather than two folders competing |

## Model

The listing is cheap to hold because it is one line per skill. Everything expensive is read only after a match.

```dg
{ "kind": "map",
  "caption": "The listing is the only part held in full; everything after it is read only on a match.",
  "boxes": [
    { "id": "a", "label": "the work at hand", "note": "what this turn is trying to do, in your own words" },
    { "id": "b", "label": "the listing", "note": "every installed skill's name and description, one line each" },
    { "id": "c", "label": "SKILL.md", "note": "loaded only once a description matches the work" },
    { "id": "d", "label": "a step file", "note": "read only when the skill sequences it" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "matched against" },
    { "from": "b", "to": "c", "label": "loads" },
    { "from": "c", "to": "d", "label": "sequences" }
  ] }
```

A large skill therefore costs nothing on a turn that never needed it, which is what lets a skill be as long as its work actually is.

## Parts

### The file a session loads

A frontmatter block naming `name` and `description`, then instructions in markdown. The frontmatter carries those two fields and nothing more for a stack-agnostic skill. Everything a session decides about whether to read the file is decided from those first lines.

### A skill that outgrows one file

A skill whose walk is long enough keeps its own file as the router — it classifies the ask and names which files to read in which order — and puts each part of the walk in its own step file. The router is read on every match; a step is read only once the router names it. No stack-agnostic skill here needs one, and one domain skill does.

### A mode is an argument, never a second skill

Two skills with almost the same description compete for the same match, and the matching gets worse as the pair grows. So a skill that answers several close asks takes a mode as an argument, names its modes in the description, and says which neighbouring skill an adjacent ask belongs to instead. A destructive mode says so in the sentence a session matches against, rather than only in the body loaded afterwards.

### Loaded, not run

A skill is prose an agent reads and then follows, never a script the runtime executes. It is a document selected the way code is dispatched — by a match at the top rather than by a person opening the right file by hand.

### A skill carries steps, and never a rule

The moment a skill states a rule stated nowhere else, it has become a second source nothing audits. A skill names the chapter or the card that holds the rule and sequences the work around it. Where a step file does carry rules, it carries them under the same stamp a ref carries, so a drift run reads a step exactly as it reads a ref.

### A step that varies by instance lives with the instance

Where a stack-agnostic skill needs a concrete step, the skill stays in one place and the step files sit under the provider folder for the realization that changes them. Copying the skill into each stack would put one rule in two folders, drifting, with nothing comparing them. The gate reads the realization from the repository's own manifest and resolves into that folder.

### Some skills ask rather than read

A few answers cannot be derived from the ground, because they are decisions rather than readings. A skill of that kind works one agreed block at a time and runs no act on an answer nobody gave, and its description says so.

## Boundary

This page answers what a skill is, how it is selected, and what it may contain. It does not answer which skills exist for a given world — the stack-agnostic set is realized by the core plugin, and each domain's own set by that domain's plugin. It does not answer what a persona or a reviewing viewpoint is either, although both are selected the same way.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the frontmatter a skill declares, the matching, the step folder, and the mode argument | the list of skills a given world offers, and what each one does | the skills chapter of [the apps domain](../02-apps/README.md) or [the infra domain](../03-infra/README.md) |
| that a skill carries steps and never a rule of its own | where the rule a skill carries actually lives | [Refs](06-refs.md) |
| that a skill is loaded and followed rather than executed | a persona convened by name, which is selected the same way and is a different thing | [Agents](03-agents.md) |
| that a concrete step belongs to the realization that changes it | the folder shape a realization contributes, and how a gate resolves into it | [Providers](07-providers.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Skills construct | a skill is a named unit of work, and its value spells the domain of the plugin that ships it | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a skill edit is loadable only after an install and a fresh window | MUST |
| `RD.DEVEX.UTILS.019` | a skill restates a chapter's steps and adds no rule of its own | MUST |
| `RD.DEVEX.AGENT.025` | a folder per skill value and a value per folder, so the set a gate dispatches over is closed | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs restates check` (or `spn-devex restates check`, once installed)
