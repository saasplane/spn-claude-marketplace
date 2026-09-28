<!-- spn:doc
{
  "id": "provider-set",
  "variant": "construct",
  "title": "Providers — How a Plugin Is Extended Per Instance",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set", "skill-set", "ref-set", "checks"],
  "summary": "How a plugin admits a second stack or a second cloud without a gate being edited — the two halves a provider contributes, the rule that decides whether it contributes a skills half at all, and the line between what a provider states and what it does.",
  "keywords": ["provider", "instance", "stack", "cloud", "gate", "plugin", "extension"]
}
-->

# Providers — How a Plugin Is Extended Per Instance

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

A plugin that knows its stack by name is a plugin the second stack cannot join. The knowledge has to sit somewhere, so the question is never whether a plugin holds it but **which part of the plugin is allowed to**. A provider is the answer: one folder per instance, holding everything that varies, so that adding an instance is adding a folder rather than editing a gate.

## Overview

The thing to check first is whether any gate names an instance. A gate that spells `ts` or `aws` has already decided which realization it serves, and the second one arrives as a special case of the first. Every gate reads the instance from the nearest `sprepo.json` and dispatches; nothing else about the instance reaches it.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| an instance | `providers/<instance>/` | one realization a plugin serves — a stack (`ts`), or a cloud (`aws`, `gcp`, `local`) |
| a gate | `skills/<verb>/SKILL.md` · `scripts/checks/<subject>.ts` | the instance-free half: it resolves the instance and dispatches, and states no rule about any one of them |
| the skills half | `providers/<instance>/skills/<skill>/` | what a skill loads when it is working in this instance — a procedure |
| the scripts half | `providers/<instance>/scripts/checks/` | what a gate runs for this instance — the parse and the rules it carries |
| the contract | `refs/<domain>/…/providers/<instance>/` | what is **true** of this instance, restating a construct for a reader |

## Model

**A provider mirrors the plugin's own folder names.** A plugin holds `skills/` and `scripts/`; a provider contributes to both under the same two names. That is the whole of the shape, and it is why plugging one in needs no explanation: the folders a contributor must fill are the ones they have already read.

```dg
{ "kind": "map",
  "caption": "The gate never spells an instance, so the arrow into a provider folder is resolved rather than typed.",
  "boxes": [
    { "id": "a", "label": "sprepo.json", "note": "the repository's own claim — the stack, or the cloud" },
    { "id": "b", "label": "the gate", "note": "a skill or a check that states no rule about any instance" },
    { "id": "c", "label": "providers/<instance>/", "note": "the skills half, the scripts half, or only one of them" },
    { "id": "d", "label": "the answer", "note": "the steps a skill loads, or the verdict a check returns" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "read by" },
    { "from": "b", "to": "c", "label": "dispatches into" },
    { "from": "c", "to": "d", "label": "produces" }
  ] }
```

**Everything that varies by instance lives under `providers/`, and nothing else does.** The organizing axis is *what changes*, not *what kind of file it is* — which is why a provider folder holds markdown and TypeScript side by side while every other folder in a plugin holds one kind. That mixing is the price of the axis, and it is paid deliberately.

**`refs/` is not part of the mirror.** It restates the foundation book, and the book has a providers construct of its own, so the contract entries sit where a construct puts them. The line is that `refs/` **states** and `providers/` **executes**: a reader opens the first, a gate dispatches into the second.

**A provider contributes only the halves it has something to put in, and an absence carries information.** A folder standing empty to look complete teaches a reader that the realization works. One that is missing says what is true.

## Parts

### A gate never names an instance

The instance is read from the nearest `sprepo.json`, never typed on a command and never guessed from a file extension. A gate that could name an instance is a gate somebody edits to add the next one, and the edit is the thing this construct exists to remove.

### The two halves, and what each holds

The skills half holds a **procedure** — what to do, in order, when working in this instance. The scripts half holds a **parse and its rules** — what this instance's text looks like and what is true of it. A rule is an implementation detail of the check that runs it and lives beside it, not in a shared registry above it.

### A private rule sits behind an underscore

Where a subject's gate is one door and several rules stand behind it, the rules go under a folder whose name opens with an underscore and the door stays the only file at the top. A reader listing the folder then sees the subjects a gate dispatches over, and nothing that is only reachable through one of them.

### A skills half is earned by changing the authoring stack

The test is not whether an instance has a procedure yet; it is whether the instance **changes the language the work is written in**. Where the instance *is* the stack, it always does. Where the instance is a cloud and every rendering is written in the same engine against the same declaration, it never does — and that provider carries a scripts half alone. The asymmetry is a fact about the two domains rather than a gap in one of them.

### A shared rule body is a factory, not a rule

Where two instances genuinely need one rule, what they share is a function parameterized by each instance's own values, and it lives with the plugin's other shared code. It is not a rule folder: the moment a rule folder exists, rules drift into it that only one instance ever needed.

### Adding an instance

Add `providers/<instance>/`, with a `skills/` half for what a skill loads and a `scripts/` half for what a gate runs, mirroring the folders those gates already have. No gate changes, and a listing of the folder is the coverage.

## Boundary

**A provider never states a rule the domain owns.** What is true of every realization belongs to the gate's own domain documents; a provider says only how that truth looks here. **A provider folder carries no `SKILL.md`**, because skill discovery keys on that filename and a provider holds the material a skill loads rather than a skill of its own. **A provider is not a release unit**: it ships inside its plugin, at the plugin's version.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the folder a realization contributes, the two halves, and the rule that decides whether a skills half exists | what a skill is, how it is matched, and what its frontmatter declares | [Skills](04-skills.md) |
| that a gate resolves the instance and states no rule about any one of them | how a check is composed into a moment, and the verdict it returns | [Hooks](02-hooks.md) · [Scripts](05-scripts.md) |
| that what is **true** of an instance is restated in `refs/` rather than executed | the block a restatement carries, and the drift run that re-reads it | [Refs](06-refs.md) |
| that a provider ships inside its plugin at the plugin's version | the manifest, the marketplace entry and the installed copy | [The Plugin](01-plugin.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.AGENT.025` | a folder per skill value and a value per folder, so a gate's own folder set is closed and a provider cannot add to it | MUST |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what makes `sprepo.json` the one place an instance is read from | MUST |
| the apps plugin's subject registry | *until a parser exists there is no folder for it* — a realization that is absent says so, and a stub that answers teaches you it works | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs docs coherence` (or `spn-devex docs coherence`, once installed)
