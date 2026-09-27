<!-- spn:doc
{
  "id": "estate-guard",
  "variant": "construct",
  "title": "Scripts — The Write-Time Gate and What Runs It",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "dependsOn": ["checks", "estate-hooks"],
  "summary": "The three folders under this plugin's scripts tree — the dispatcher wired to every write, the gate that resolves which subjects judge it, and the rule bodies they run — the narrow set of things they know about, and the direction they fail in when the input cannot be read.",
  "keywords": ["scripts", "dispatcher", "subject", "rule", "secret", "allow"]
}
-->

# Scripts — The Write-Time Gate and What Runs It

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

An estate declaration says what infrastructure should exist. Things that must never appear in one — a credential, an identifier a tool discovers for itself, a provider's own string outside the entry that sanctions it — are cheap to catch at the moment somebody writes them and expensive to find later. This plugin's scripts tree is that catch: a dispatcher the wiring calls, a gate that works out which subjects have an opinion about the file, and a set of named rule bodies with nothing else between them and the text.

## Overview

Read the direction it fails in before you read anything else. **When the gate does not understand its input, it allows the call.** A gate refusing whatever it cannot parse would deny far more than the things it actually knows about, and people would route around it, which leaves an estate with no gate at all.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the dispatcher | `scripts/events/pretooluse.ts` | this plugin's hook entry point: one process, run for every write and every edit |
| the gate | `scripts/checks/subjects.ts` | what resolves which subjects judge this call, and the one file that knows a provider folder exists |
| a subject | `rendering` · `manifest` | one kind of file with one parse — built output, or a declaration somebody edits |
| a rule | `scripts/lib/<name>.ts` | one thing the gate knows how to recognise, carrying its own name and its own refusal message |
| the new text | `content` · `new_string` | what this call would add — a write's content, or an edit's replacement — which is what the rules read |
| the estate manifest | `spestate.json` | the declaration file where one rule applies and nowhere else |
| a sanctioned home | `region` | the place a provider's own string is legitimate, which is removed from the text before that rule searches |
| allowing | — | the answer to anything the gate cannot read: no decision, and the ordinary permission flow continues |

## Model

Three folders, three jobs, and the order they run in is the order a person meets them. The dispatcher is called; it asks the gate which subjects apply; each subject runs the rule bodies that have an opinion about this path.

```dg
{ "kind": "map",
  "caption": "The rule bodies are cloud-free and the parse is not, which is why the two sit in different folders.",
  "boxes": [
    { "id": "a", "label": "events/", "note": "the dispatcher the wiring names — reads the call, keeps the first refusal" },
    { "id": "b", "label": "checks/", "note": "the gate — resolves which subjects judge this write" },
    { "id": "c", "label": "providers/", "note": "one cloud's parse of a subject, outside this folder" },
    { "id": "d", "label": "lib/", "note": "the rule bodies, each named, each with its own refusal" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "asks" },
    { "from": "b", "to": "c", "label": "dispatches into" },
    { "from": "c", "to": "d", "label": "runs" }
  ] }
```

**The path is read before any text**, because one refusal needs nothing else: built output is refused whatever it would contain. Then the text this call would add is taken, and each remaining subject is asked about it in turn, the first denial ending the run.

A rule that fails is skipped rather than fatal: a gate that crashes the chain removes every other gate with it, which is worse than any single miss. The helpers the dispatcher reads its event and records its timings through are **this plugin's own copies**. A plugin is installed on its own and a partner may hold one without the others, so a sibling's file cannot be a dependency — reaching for one means resolving it at runtime, and a resolve that misses has to return the pass-through, which is silence wearing the shape of success.

## Parts

### Three folders, and what decides which one a file goes in

`events/` holds what the wiring calls, and there is one such file because there is one wired moment. `checks/` holds the gate, which knows which subjects exist and how to reach a provider's parse of each. `lib/` holds everything more than one of them needs: the rule bodies, the event shape, the timing recorder. **The axis is what the file is for, not what it is about**, which is why a rule about secrets and a rule about built output sit side by side. *Where:* `plugins/spn-infra/src/scripts/`

### Unsure means allow, and every exit is zero

Unreadable input, or a call naming no file, ends the run in silence with the call allowed. A refusal prints the documented decision and still exits zero, because a hook that fails loudly takes every other gate down with it. The dispatcher returns as soon as it finds no file path, and the whole run is wrapped so nothing reaches the harness as a failure. *Where:* `plugins/spn-infra/src/scripts/events/pretooluse.ts`

### It reads the text the call would add, not the file

A refusal must be about what is being written. Judging the file on disk would refuse an edit to a file that already carries the fault and miss the fault arriving now. So a write's content or an edit's replacement is taken, whichever is present, and where there is no new text only the subject that reads the path alone can run. *Where:* `plugins/spn-infra/src/scripts/checks/subjects.ts`, `written()`

### The gate discovers the clouds and deliberately runs every one

The gate names no cloud. It reads which folders the providers tree holds and imports each one's validator for each subject, so a third cloud joins by adding a folder rather than by editing an import list. **And it runs all of them, not the declared one.** A write-time gate cannot read a resolved estate — there may not be one yet — and running only the declared cloud's patterns would let an AWS region into a declaration whose cloud entry says Google, which is the mistake somebody makes while moving an estate between clouds and the moment the gate is most worth having. The cost is a handful of regular expressions against text already in memory. *Where:* the same file, `instances()` and `subjects()`

### The rule bodies sit flat, because every one of them is cloud-free

*An account id is never pinned* is true on every cloud, and so is *no secrets at any path*, and so is *built output is not source*. Those rule bodies name no cloud anywhere in them. The provider-string rule is the exception, and it varies in its **patterns** rather than in its judgement — *a provider string lives only inside a cloud entry* holds everywhere, while what a region looks like is that cloud's business — so it is written as a factory each cloud feeds its own spellings to. **There is no rules folder**, because the moment one exists, rules drift into it that only one cloud ever needed. *Where:* `plugins/spn-infra/src/scripts/lib/no-secrets.ts` · `no-pinned-account.ts` · `build-output-is-not-source.ts` · `provider-strings.ts` · `laws.ts`

### An identifier is refused where a key names it

A bare run of digits is not evidence of anything, and refusing every one of them would block timestamps, sizes and identifiers with nothing to do with an account. So the rule fires where a key spelled as an account identifier is assigned a value of the right shape, and leaves a loose number alone. The credential rule is shaped the same way: it needs a credential-named key assigned a quoted literal of real length, and ignores a reference to a variable. Both sides of the length boundary are stated as test cases, so nobody re-derives the threshold from a regular expression. *Where:* `plugins/spn-infra/src/scripts/lib/no-pinned-account.ts` · `no-secrets.ts`

### One rule reads only the estate manifest

A provider's own region string is legitimate in a small number of places — the region mapping on a cloud entry, and a profile's capacity keys. Searching for such strings everywhere would refuse documentation and test fixtures. So the rule fires only on a file named as an estate manifest, removes the sanctioned homes from the text first, and searches what is left. *Where:* `plugins/spn-infra/src/scripts/lib/provider-strings.ts`

### Every refusal names the card that explains it

A denial and its reasoning are one hop apart: the sentence every refusal carries points at the laws card this plugin ships, so a reader who has just been refused can reach the rule without searching for it. The sentence is written once and quoted by every rule, because copies of a law drift and a person then meets a different account of it depending on which file they happened to touch. *Where:* `plugins/spn-infra/src/scripts/lib/laws.ts` · `plugins/spn-infra/src/refs/support/infra/README.md`

## Boundary

This page answers what the scripts tree holds, what it refuses, what it reads to decide, and what it does when it cannot decide. It does not answer the frame it sits in — the moments, the decision shape and the always-zero exit are [Hooks](../01-devex/02-hooks.md), and the entry that wires this dispatcher is [Hooks](02-hooks.md). It does not answer what one cloud's text looks like, and it does not answer what the estate laws say.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the three folders, the subjects, the rule bodies, and that anything unrecognised is allowed | the moment this is wired to, the matcher and the timeout | [Hooks](02-hooks.md) |
| that the gate names no cloud and discovers them instead | what one cloud's regions and instance classes actually look like | [Providers](06-providers.md) |
| that a refusal names the card carrying its reasoning | what the estate laws actually say, and which one a rule is catching | [Refs](05-refs.md) |
| that an estate leak is caught at write time | how an estate is changed on purpose, and through which door | [Skills](03-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | the scripts restate the estate laws and add no rule of their own | MUST |
| `RD.INFRA.026` | which manifest declares an estate node, and therefore which file the manifest rule applies to | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a script is a hook's body, so an edit to it is live on its next run | MUST |
| `MD8` | a plugin carries its own libraries and never reaches into a sibling at runtime | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-infra` | the whole of this plugin's script surface: one dispatcher, the gate that resolves its subjects, the rule bodies, and the direction it fails in | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-infra/tests/run.mjs` | test | what each rule refuses, what it allows, that both sides of the credential length boundary are where the rules say, and that each cloud's spellings are caught whichever cloud the declaration names |
| `node plugins/spn-devex/src/scripts/tools/partner-shape.ts` | gate | the dispatcher runs against a repository holding nothing but the plugins, allows what it cannot read, and exits zero either way |

Try it: `node plugins/spn-infra/tests/run.mjs`
