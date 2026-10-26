<!-- spn:doc
{
  "id": "apps-providers",
  "variant": "construct",
  "title": "Providers — Where the Stack Is Allowed to Be Named",
  "subtitle": "The one folder where a language may be named at all.",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["provider-set", "stack-skills", "stack-checks"],
  "summary": "Providers is the one folder in this plugin allowed to name a language, holding everything that varies with the language a project is written in, one folder per stack.",
  "keywords": ["provider", "instance", "stack", "steps", "subject", "private"]
}
-->

# Providers — Where the Stack Is Allowed to Be Named

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

Providers is the one folder in this plugin allowed to name a language, holding everything that varies with the language a project is written in, one folder per stack. Read this page before you add a second stack, or when you want to know why adding one means adding a folder rather than editing a gate. It explains why this domain's provider always carries both halves, and how a skill and a gate each reach into it.

## Overview

**This domain's provider carries both halves, and it always will.** A provider earns a half that a skill loads when the instance changes the language the work is written in — and here the instance *is* the stack, so writing a contract, a service and an entry is a different procedure in a different language every time. That is a fact about this domain rather than a stage it is passing through.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| an instance | `providers/<instance>/` | one realization this plugin serves, which in this domain is a stack |
| the claim | `config.stack` | what a repository declares about its own stack, and the only place a gate reads one from |
| the skills half | `providers/<stack>/skills/<skill>/` | the procedure a skill loads once it has resolved which stack it is standing in |
| the scripts half | `providers/<stack>/scripts/checks/` | the parse a gate resolves into, and the rules that read what the parse produced |
| a door | `src.ts` · `tests.ts` | the file a gate imports for one subject: it parses once, orders the verdicts, and isolates a rule that throws |
| a private rule | `_<subject>/` | one rule, behind an underscore folder, private to the door standing beside it |

## Model

The gate composes a path from the declaration and imports whatever is there. Nothing about the stack reaches the gate, and nothing about the gate is repeated in the provider.

```dg
{ "kind": "map",
  "caption": "The path is composed from the declaration, which is why a second stack costs a folder and no edit.",
  "boxes": [
    { "id": "a", "label": "the claim", "note": "the stack the nearest sprepo.json declares" },
    { "id": "b", "label": "the composed path", "note": "providers/<stack>/ — never written out in a gate" },
    { "id": "c", "label": "the skills half", "note": "a procedure: what to do, in order, in this stack" },
    { "id": "d", "label": "the scripts half", "note": "a parse, and the private rules that read it" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "composes" },
    { "from": "b", "to": "c", "label": "a skill loads" },
    { "from": "b", "to": "d", "label": "a gate imports" }
  ] }
```

## Parts

### The folder mirrors the plugin's own names

A plugin holds `skills/` and `scripts/`; a provider contributes under the same two names. A contributor filling one has already read the folders it mirrors, so plugging in a stack needs no explanation. It is also why a provider folder holds markdown and TypeScript side by side while every other folder in a plugin holds one kind: the organizing axis here is *what changes*, and that is paid deliberately.

### The build steps are the skills half

The build skill names the steps and their order and holds none of them. Each step file settles one layer for this stack — the contract and its validators, the service shape, the thin entry, the queue listener and its consumption contract, the front end's plug-in points, how each test tier is run, and where an environment key goes in this stack's own files. A step this stack does not ship is a step this stack does not walk.

### A folder is named for the skill, not for the plugin that ships it

One folder here serves a skill that lives in the core plugin: the part of deciding what a node is that only a language can answer — how ownership of a capability is read from what the repository actually composes, and where markdown may not go. It sits under the skill's own name, because what a reader needs to know is which skill loads it. This is the material that proves the shape works across plugins at all.

### The subjects are two, and they line up with the paths the rules watch

A write is asked about its source and about its tests, and nothing else. A third subject for contracts was a grouping that overlapped the first on every contract file: every contract rule watches a path under `src/`, so a contract file was read and masked twice, at write time, where a person is waiting. Which rules apply is decided by the path and the node's kind, never by a subject's name.

### A door parses once, orders the answers, and survives a rule that throws

The file a gate imports is the only file in the subject that reads the source: it builds the resulting text once per write rather than once per rule. It keeps the first refusal, because a person fixes one thing at a time and several refusals for one edit read as a broken gate. It collects every note, because advice is advice and several pieces can be true at once. And it skips a rule that throws rather than losing the whole subject with it.

### A rule is private to the door beside it

A rule is an implementation detail of the check that runs it, not an entry in a shared registry, so it sits behind an underscore folder named for its own subject. A listing of the checks folder therefore shows the doors and nothing else, and what a door runs is read by opening the folder beside it. Nothing outside a private folder imports into it.

### What the source subject refuses

Its rules read this stack's own syntax: an enablement code that is not prefixed by the module owning it, a read method returning a list type under a plural name, a chained continuation where the stack's own standard asks for a sequenced wait, and a contract state that would close a dependency cycle. Each names the chapter or the card holding its reasoning rather than restating it, because a check is the part a script can catch and a card is the part a person has to read.

### One rule is written twice on purpose, and says where the other copy is

The cycle rule is also in the command-line tool, and this copy exists because the failure it prevents lands at boot: a loop resolves to nothing at start-up, so the application comes up broken rather than failing to build, and a check that runs at review time runs after the damage. The header names the tool's own file as the single home of the rule, with the instruction that a change is made there first and here second, in the same change.

### What the tests subject refuses, and what it only warns about

A journey assertion whose host pattern could match inside a longer address is refused, because a pattern loose enough to match inside a string is a check that cannot fail — one agreed a browser was home while the screen was still a vendor's consent page. An assertion with nothing explaining an absence is refused for the same reason. The coverage findings warn instead, and under-report on purpose, because the model behind them belongs to an open argument and a refusal on an unsettled rule teaches people to work around the gate.

### Adding a stack

Add a folder named for the stack, with a skills half for what a skill loads and a scripts half for what a gate imports, mirroring the folders those gates already have. No gate changes, and a listing of this folder is the coverage.

## Boundary

This page answers what this domain's provider contributes and how it is arranged. It does not answer what a provider is — the two halves, the naming mirror, the rule that a gate never names an instance, and the line between what a provider states and what it does are [The Provider](../01-devex/07-providers.md). It does not answer what a step file says either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| both halves for the stacks this domain serves, the subjects, and the private rules behind each door | the shape itself, the resolution rule, and the *only the halves you have* rule | [The Provider](../01-devex/07-providers.md) |
| the parse, the verdict order and the isolation of a rule that throws | the gate that resolves into this folder, and the process it runs in | [Scripts](04-scripts.md) · [Hooks](02-hooks.md) |
| the procedure a skill loads in this stack | which skills exist, what each one is for, and the order they name | [Skills](03-skills.md) |
| that a stack entry stating what is *true* is not a procedure | those entries, and the domain folder holding them | [Refs](05-refs.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what makes its manifest the one place a stack is read from | MUST |
| `RD.DEVEX.AGENT.025` | a folder per skill value and a value per folder, so a provider folder carries material and never a skill of its own | MUST |
| `RD.DEVEX.FUNCTION.035` | a rule reaches a write-time hook only where review would be too late, which is why the cycle rule is here as well as in the command-line tool | MUST |
| `RD.PLATFORM.CORE.033` | the enablement grammar the source subject's refusals are written against | MUST |

Try it: `node packages/plugin-spn-apps/tests/run.mjs`
