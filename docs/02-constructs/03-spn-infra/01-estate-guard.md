<!-- spn:doc
{
  "id": "estate-guard",
  "variant": "construct",
  "title": "The Estate Guard — Named Rules Wired to Every Write",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "dependsOn": ["hook-set"],
  "summary": "A dispatcher and its named rules standing between an estate edit and the file it would write — the narrow set of things they know about, the text they judge, and the direction they fail in when the input cannot be read.",
  "keywords": ["guard", "estate", "secret", "account id", "provider string", "allow"]
}
-->

# The Estate Guard — Named Rules Wired to Every Write

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

An estate declaration says what infrastructure should exist. Things that must never appear in one — a credential, an identifier a tool discovers for itself, a provider's own string outside the entry that sanctions it — are cheap to catch at the moment somebody writes them and expensive to find later. The estate guard is that catch: a dispatcher wired to every write and every edit, running a set of named rules with nothing else between them and the file.

Read the direction it fails in before you read anything else. **When the guard does not understand its input, it allows the call.** A guard refusing whatever it cannot parse would deny far more than the things it actually knows about, and people would route around it, which leaves an estate with no guard at all.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the guard | `events/pretooluse.ts` | this plugin's hook entry point: one dispatcher, wired to writes and edits |
| a rule | `checks/estate-violations.ts` | one thing the guard knows how to recognise, carrying its own name and its own refusal message |
| the new text | `content` · `new_string` | what this call would add — a write's content, or an edit's replacement — which is what the rules read |
| the estate manifest | `spestate.json` | the declaration file where one rule applies and nowhere else |
| a sanctioned home | `region` | the place a provider's own string is legitimate, which is removed from the text before that rule searches |
| allowing | — | the answer to anything the guard cannot read: no decision, and the ordinary permission flow continues |

## Model

The path is read first, because one refusal needs nothing else. Then the text this call would add is taken, and each rule is asked about it in turn, the first denial ending the run.

```dg
{ "kind": "map",
  "caption": "The path is read before any text, because the build output refusal needs nothing else to decide.",
  "boxes": [
    { "id": "a", "label": "a Write or an Edit", "note": "the only two calls the wiring matches" },
    { "id": "b", "label": "the path", "note": "build output is refused here, before any text is read" },
    { "id": "c", "label": "the new text", "note": "a Write's content, or an Edit's replacement" },
    { "id": "d", "label": "a named rule", "note": "a refusal naming the law, or silence and the call allowed" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "read from" },
    { "from": "b", "to": "c", "label": "then" },
    { "from": "c", "to": "d", "label": "matched by" }
  ] }
```

The rules are held apart from the dispatcher that runs them, in the same `events / checks / lib / tests` arrangement both sibling plugins use. A rule that fails is skipped rather than fatal: a gate that crashes the chain removes every other gate with it, which is worse than any single miss.

The helpers the dispatcher reads its event and records its timings through are **this plugin's own copies**. A plugin is installed on its own and a partner may hold one without the others, so a sibling's file cannot be a dependency — reaching for one means resolving it at runtime, and a resolve that misses has to return the pass-through, which is silence wearing the shape of success.

## Parts

### Unsure means allow, and every exit is zero

Unreadable input, or a call naming no file, ends the run in silence with the call allowed. A refusal prints the documented decision and still exits zero, because a hook that fails loudly takes every other gate down with it. The dispatcher returns as soon as it finds no file path, and the whole run is wrapped so nothing reaches the harness as a failure. *Where:* `plugins/spn-infra/hooks/events/pretooluse.ts`

### It reads the text the call would add, not the file

A refusal must be about what is being written. Judging the file on disk would refuse an edit to a file that already carries the fault and miss the fault arriving now. So a write's content or an edit's replacement is taken, whichever is present, and where there is no new text only the rule that reads the path alone can fire. *Where:* `plugins/spn-infra/hooks/checks/estate-violations.ts`, `written()`

### Build output is refused by path alone

The published artifact is staged whole by the release command. A hand edit under the output folder is lost on the next build, and until then it is what is running. So a path under a build output folder is refused before the text is even read, and the message names the source folder to edit instead. An empty write there is still an edit to something the build owns. *Where:* the same file, `dist-is-build-output`

### An identifier is refused where a key names it

A bare run of digits is not evidence of anything, and refusing every one of them would block timestamps, sizes and identifiers with nothing to do with an account. So the rule fires where a key spelled as an account identifier is assigned a value of the right shape, and leaves a loose number alone. The credential rule is shaped the same way: it needs a credential-named key assigned a quoted literal of real length, and ignores a reference to a variable. Both sides of the length boundary are stated as test cases, so nobody re-derives the threshold from a regular expression. *Where:* the same file, `pinned-account-id` and `literal-credential`

### One rule reads only the estate manifest

A provider's own region string is legitimate in a small number of places — the region mapping on a cloud entry, and a profile's capacity keys. Searching for such strings everywhere would refuse documentation and test fixtures. So the rule fires only on a file named as an estate manifest, removes the sanctioned homes from the text first, and searches what is left. *Where:* the same file, `provider-string-outside-cloud`

### Every refusal names the card that explains it

A denial and its reasoning are one hop apart: each message points at the laws card this plugin ships, so a reader who has just been refused can reach the rule without searching for it. *Where:* `plugins/spn-infra/refs/laws.md`

## Boundary

This page answers what the guard refuses, what it reads to decide, and what it does when it cannot decide. It does not answer the frame it sits in — the wiring, the decision shape and the always-zero exit are [The Hook](../01-spn-core/02-hook-set.md), and this dispatcher speaks that shape directly rather than importing it. It does not answer what the estate laws say either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the rules, the text they read, and that anything unrecognised is allowed | the wiring shape, the decision JSON, and the exit code rule | [The Hook](../01-spn-core/02-hook-set.md) |
| that a refusal names the card carrying its reasoning | what the estate laws actually say, and which one a rule is catching | [Estate Refs](03-estate-refs.md) |
| that an estate leak is caught at write time | how an estate is changed on purpose, and through which door | [Estate Skills](02-estate-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | the guard restates the estate laws and adds no rule of its own | MUST |
| `RD.INFRA.026` | which manifest declares an estate node, and therefore which file the manifest rule applies to | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | the guard is a hook, so an edit to its script is live on its next run while a change to `hooks.json` waits for a reinstall | MUST |
| `MD8` | a plugin carries its own libraries and never reaches into a sibling at runtime | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-infra` | the whole of this plugin's hook surface: one wired dispatcher, its named rules, and the direction it fails in | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-infra/hooks/tests/run.mjs` | test | 21 cases: what each rule refuses, what it allows, and that both sides of the credential length boundary are where the rules say |
| `node plugins/spn-core/hooks/tools/partner-shape.ts` | gate | the guard runs against a repository holding nothing but the plugins, allows what it cannot read, and exits zero either way |

Try it: `node plugins/spn-infra/hooks/tests/run.mjs`
