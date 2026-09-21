<!-- spn:doc
{
  "id": "estate-guard",
  "variant": "construct",
  "title": "The Estate Guard — One Script Wired to Every Write",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "dependsOn": ["hook-set"],
  "summary": "A single shell script standing between an estate edit and the file it would write — the narrow set of things it knows about, the text it judges, and the direction it fails in when it does not understand its input.",
  "keywords": ["guard", "estate", "secret", "account id", "provider string", "allow"]
}
-->

# The Estate Guard — One Script Wired to Every Write

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

An estate declaration says what infrastructure should exist. Things that must never appear in one — a credential, an identifier a tool discovers for itself, a provider's own string outside the entry that sanctions it — are cheap to catch at the moment somebody writes them and expensive to find later. The estate guard is that catch: one shell script wired to every write and every edit, with nothing else between it and the file.

Read the direction it fails in before you read anything else. **When the guard does not understand its input, it allows the call.** A guard refusing whatever it cannot parse would deny far more than the things it actually knows about, and people would route around it, which leaves an estate with no guard at all.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the guard | `deny-estate-violations.sh` | the whole of this plugin's hook surface: one script, wired to writes and edits |
| a clause | — | one thing the guard knows how to recognise, with its own refusal message |
| the new text | `content` · `new_string` | what this call would add — a write's content, or an edit's replacement — which is what the clauses read |
| the estate manifest | `spestate.json` | the declaration file where one clause applies and nowhere else |
| a sanctioned home | `region` | the place a provider's own string is legitimate, which is removed from the text before that clause searches |
| allowing | — | the answer to anything the guard cannot read: no decision, and the ordinary permission flow continues |

## Model

The path is read first, because one refusal needs nothing else. Then the text this call would add is taken, and each clause is asked about it in turn.

```dg
{ "kind": "map",
  "boxes": [
    { "id": "a", "label": "a Write or an Edit", "note": "the only two calls the wiring matches" },
    { "id": "b", "label": "the path", "note": "build output is refused here, before any text is read" },
    { "id": "c", "label": "the new text", "note": "a Write's content, or an Edit's replacement" },
    { "id": "d", "label": "a clause", "note": "a refusal naming the law, or silence and the call allowed" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "read from" },
    { "from": "b", "to": "c", "label": "then" },
    { "from": "c", "to": "d", "label": "matched by" }
  ] }
```

There is no divided tree of events, checks, tools and shared code here, because the guard is one rule with several clauses and nothing in this plugin has earned a second file.

## Parts

### Unsure means allow, and every exit is zero

No parser on the machine, unreadable input, or a call naming no file all end the script in silence with the call allowed. A refusal prints the documented decision and still exits zero, because a hook that fails loudly takes every other gate down with it. The tests that produce these outcomes sit at the top of the file, each one a single condition followed by an exit. *Where:* `plugins/spn-infra/hooks/scripts/deny-estate-violations.sh`

### It reads the text the call would add, not the file

A refusal must be about what is being written. Judging the file on disk would refuse an edit to a file that already carries the fault and miss the fault arriving now. So a write's content or an edit's replacement is taken, whichever is present, and where there is no new text only the clause that reads the path alone can fire. *Where:* the same script, near the top

### Build output is refused by path alone

The published artifact is staged whole by the release verb. A hand edit under the output folder is lost on the next build, and until then it is what is running. So a path under a build output folder is refused before the text is even read, and the message names the source folder to edit instead. *Where:* the same script, the first clause

### An identifier is refused where a key names it

A bare run of digits is not evidence of anything, and refusing every one of them would block timestamps, sizes and identifiers with nothing to do with an account. So the clause fires where a key spelled as an account identifier is assigned a value of the right shape, and leaves a loose number alone. The credential clause is shaped the same way: it needs a credential-named key assigned a quoted literal of real length, and ignores a reference to a variable. *Where:* the same script, the identifier and credential clauses

### One clause reads only the estate manifest

A provider's own region string is legitimate in a small number of places — the region mapping on a cloud entry, and a profile's capacity keys. Searching for such strings everywhere would refuse documentation and test fixtures. So the clause fires only on a file named as an estate manifest, removes the sanctioned homes from the text first, and searches what is left. *Where:* the same script, the provider-string clause

### Every refusal names the card that explains it

A denial and its reasoning are one hop apart: each message points at the laws card this plugin ships, so a reader who has just been refused can reach the rule without searching for it. *Where:* `plugins/spn-infra/refs/laws.md`

## Boundary

This page answers what the guard refuses, what it reads to decide, and what it does when it cannot decide. It does not answer the frame it sits in — the wiring, the decision shape and the always-zero exit are [The Hook](../01-spn-core/02-hook-set.md), and this script speaks that shape directly rather than importing it. It does not answer what the estate laws say either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the clauses, the text they read, and that anything unrecognised is allowed | the wiring shape, the decision JSON, and the exit code rule | [The Hook](../01-spn-core/02-hook-set.md) |
| that a refusal names the card carrying its reasoning | what the estate laws actually say, and which one a clause is catching | [Estate Refs](03-estate-refs.md) |
| that an estate leak is caught at write time | how an estate is changed on purpose, and through which door | [Estate Skills](02-estate-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | the guard restates the estate laws and adds no rule of its own | MUST |
| `RD.INFRA.026` | which manifest declares an estate node, and therefore which file the manifest clause applies to | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | the guard is a hook script, so an edit to it is live on its next run | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-infra` | the whole of this plugin's hook surface: one wired script, its clauses, and the direction it fails in | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/partner-shape.ts` | gate | the guard runs against a repository holding nothing but the plugins, allows what it cannot read, and exits zero either way |

Try it: `node plugins/spn-core/hooks/tools/partner-shape.ts`
