<!-- spn:doc
{
  "id": "estate-providers",
  "variant": "construct",
  "title": "Providers — One Folder per Cloud, Scripts Half Only",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["provider-set", "estate-guard"],
  "summary": "This plugin serves every cloud an estate can run on, and everything that varies between clouds sits in one folder per cloud under Providers.",
  "keywords": ["provider", "cloud", "aws", "gcp", "scripts half", "discovery"]
}
-->

# Providers — One Folder per Cloud, Scripts Half Only

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

This plugin serves every cloud an estate can run on, and everything that varies between clouds sits in one folder per cloud under `providers/`. Read this page before you add a new cloud, or when you want to know why these folders hold only scripts. It explains why adding a cloud means adding a folder rather than editing a gate, and what decides whether a folder also carries a skills half.

## Overview

**A skills half is earned by changing the authoring stack.** In the apps domain the instance *is* the stack, so a provider there always changes the language the work is written in and always carries a procedure. Here the instance is the cloud, and the cloud does not change what an author writes: an estate declaration is provider-neutral, and every rendering is written against OpenTofu whichever cloud it will reach. So the walk is the same on every cloud, and **this plugin is not expected to grow a skills half**. The asymmetry is a fact about the two domains rather than a gap in one of them.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a cloud | `providers/<cloud>/` | one realization this plugin serves — the folder is the whole registration |
| the scripts half | `providers/<cloud>/scripts/checks/` | what the gate runs for this cloud: one validator per subject |
| a subject | `manifest` · `rendering` | one kind of file with one parse, named the same way in every cloud's folder |
| a skills half | `providers/<instance>/skills/` | what a skill loads when working in this instance — a procedure, which no cloud here has |
| the vocabulary | `refs/support/infra/providers/<cloud>/` | what this cloud calls things, restated as a fact rather than run as code |
| discovery | `instances()` | the gate reading which folders exist, rather than a list of clouds written anywhere |

## Model

The folder is the registration. Nothing names a cloud: the gate reads which folders the providers tree holds, and for each subject it imports that cloud's validator if the cloud ships one.

```dg
{ "kind": "map",
  "caption": "Nothing between the gate and a cloud's parse is a list somebody has to keep current.",
  "boxes": [
    { "id": "a", "label": "the gate", "note": "names no cloud; reads the folder instead" },
    { "id": "b", "label": "providers/<cloud>/", "note": "the folder is the whole registration" },
    { "id": "c", "label": "scripts/checks/<subject>.ts", "note": "this cloud's parse and its own spellings" },
    { "id": "d", "label": "the rule bodies", "note": "shared, cloud-free, and handed this cloud's patterns" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "discovers" },
    { "from": "b", "to": "c", "label": "holds" },
    { "from": "c", "to": "d", "label": "runs" }
  ] }
```

**A provider mirrors the plugin's own folder names**, so a contributor filling one is filling folders they have already read. **And it contributes only the halves it has something to put in**: a folder standing empty to look complete teaches a reader that the realization works, while one that is missing says what is true.

## Parts

### The clouds this plugin ships a parse for

`providers/aws/` and `providers/gcp/` each hold `scripts/checks/manifest.ts` and `scripts/checks/rendering.ts`. **The rule is the domain's and the parse is the provider's**: a rule says *an account id is never pinned*, which holds on every cloud, while what a region or an instance class looks like belongs to the cloud and to nothing else. Each validator reads the text once and hands it to every rule that applies, so four rules are not four passes over the same text.

### A cloud with no folder is a cloud with no parse, and it says so

`local` has no folder here. Its vocabulary is restated in the refs tree like every other cloud's, because those words are true whether or not code reads them — but no validator ships for it, and the absence is the statement rather than an oversight. A stub folder answering with silence would teach a reader that the write-time check works there.

### The vocabulary is a fact, so it lives in refs rather than here

What differs between clouds is what they call things, and a name is a fact. Each cloud's words are restated subject by subject under the refs tree, where a reader looking something up and a skill citing it both find them in one place. **`providers/` executes and `refs/` states**, and that line is what keeps a cloud's spellings out of a folder a gate dispatches into.

### The gate discovers the clouds and runs every one of them

The gate lists no cloud. It reads the folders the providers tree holds, sorted so the order is stable, and imports each one's validator per subject; a cloud shipping nothing for a subject simply contributes nothing there. **And it runs every cloud's validators rather than the declared one.** Running only the declared cloud's patterns would let an AWS region into a declaration whose cloud entry says Google — the mistake somebody makes while moving an estate between clouds, and the moment the gate is most worth having. A write-time gate cannot read a resolved estate anyway, because there may not be one yet.

### A shared rule body is a factory, not a rule

Where every cloud needs one rule, what they share is the judgement and what differs is the pattern. The provider-string rule is written as a function each cloud's validator feeds its own spellings to, and it lives with the plugin's other shared code rather than inside any cloud's folder. Inlining it would put one copy of the same rule in each cloud, which is the duplication the factory exists to prevent.

### Adding a cloud

Add `providers/<cloud>/scripts/checks/`, with a validator per subject it has an opinion about, and restate that cloud's vocabulary in the refs tree. No gate changes, no import list changes, and a listing of the folder is the coverage.

## Boundary

This page answers what this plugin puts in a provider folder and why the halves are what they are. It does not answer what a provider is — the two halves, the rule that a gate never names an instance, and the test a skills half has to pass are [Providers](../01-devex/07-providers.md). It does not answer what the shared rule bodies say, and it does not answer what each cloud's words mean.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| that a cloud carries a scripts half alone, and why the authoring stack decides it | the two halves, the dispatch rule, and what a provider may never hold | [Providers](../01-devex/07-providers.md) |
| that a cloud's parse and its own spellings sit in its own folder | the gate that discovers the folders, and the shared rule bodies it runs | [Scripts](04-scripts.md) |
| that a cloud with no validator says so by having no folder | that cloud's vocabulary, which is restated whether or not code reads it | [Refs](05-refs.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what makes `sprepo.json` the one place an instance is read from | MUST |
| `RD.DEVEX.UTILS.019` | a provider folder restates nothing and states no rule the domain owns | MUST |
| the apps plugin's subject registry | *until a parser exists there is no folder for it* — a realization that is absent says so, and a stub that answers teaches you it works | MUST |

Try it: `node packages/plugin-spn-infra/tests/run.mjs`
