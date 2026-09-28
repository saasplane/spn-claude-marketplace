<!-- spn:doc
{
  "id": "estate-refs",
  "variant": "construct",
  "title": "Refs — The Estate's Vocabulary, Restated as Cards",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["ref-set"],
  "summary": "The estate's own words, restated for a reader who may never open the book — which file declares what, which layer owns which act, how a name is composed from coordinates, the laws a declaration must hold to, and what each cloud's vocabulary is.",
  "keywords": ["card", "manifest", "layer", "naming", "laws", "grammar"]
}
-->

# Refs — The Estate's Vocabulary, Restated as Cards

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

An estate is declared in a small vocabulary, and every one of the words is precise. Which file marks a node, which layer owns which act, how a resource name is composed, what a declaration must never contain: get one of them wrong and the mistake is expensive rather than embarrassing. A card is where each of those subjects is restated, in full, for a reader who may never open the foundation book.

## Overview

A card is a ref, so it carries a stamp and adds no rule of its own. What makes these cards their own construct is what they refuse to hold. **Every value in them is grammar, never a real one.** No environment, region or account of any organization appears, and the sample platform in the examples exists to show the shape.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a card | `refs/support/infra/` | one markdown file restating one subject of the estate model, in full, under a stamp |
| the manifests | `spestate.json` · `spinfrapkg.json` | the files that mark an estate node and name what kind it is |
| the path locator | — | how a node is resolved from wherever you are standing, rather than guessed from a folder name |
| a layer | — | one band of the estate, with the same commands as every other and a fixed place in the order |
| a coordinate | — | one part a resource name is composed from, drawn from a closed vocabulary |
| a law | — | one thing a declaration must never do, written with the checkable defect it names |
| a cloud's vocabulary | `refs/support/infra/providers/<cloud>/` | what that cloud calls the things the model names, restated subject by subject |

## Model

A card sits between the book and the moment somebody needs a word, and it is reached by name rather than read as a folder.

```dg
{ "kind": "map",
  "caption": "The card is reached by a citation rather than by a folder, so the reader needs no book checkout.",
  "boxes": [
    { "id": "a", "label": "the book", "note": "the estate sections of the foundation's own concept" },
    { "id": "b", "label": "the card", "note": "one subject, restated in full, under a stamp" },
    { "id": "c", "label": "a skill or a refusal", "note": "names the card at the moment the words are needed" },
    { "id": "d", "label": "the reader", "note": "reaches the vocabulary with no book checkout at all" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "restated as" },
    { "from": "b", "to": "c", "label": "cited by" },
    { "from": "c", "to": "d", "label": "reaches" }
  ] }
```

**The folder mirrors the constructs and holds nothing else.** A procedure is a skill's business and a parse is a provider's, so neither lives here: a card **states** what is true, and something else executes it.

## Parts

### The laws card is written to be read first

A law is useful at the moment somebody is about to break it. A list of principles read afterwards explains a mistake rather than preventing one. So the laws card asks a reader to look for the checkable defect each law names and to raise it before doing anything else, and each law is numbered and states its own defect. The refusal messages a write meets point back at this card, so a denial and its reasoning are one hop apart.

### A node is found by its manifest, never by its folder name

The folder name is checked against the manifest rather than trusted as one. Inferring a node's kind from where it sits is how a package comes to be treated as something it is not. The card states which files every estate node carries and which of them answers which question, and the path locator in the same card is what resolves a node from where you are standing.

### The layers are read in order, and the order explains most failures

A lower layer that is missing is the usual reason a higher one will not start, and that is a diagnosis rather than a rule. The card lists the layer nouns, gives each of them the same commands, and states the order they come up in. It names the tool's command realizing each act, so the card can be read beside a command that is already running.

### A name that cannot be composed from coordinates is a defect

A name derived from a label carries a meaning nobody can read back. The posture of an environment comes from the value it declares, never from a word inside its setup name. So the naming card gives the grammar and the closed vocabulary each part is drawn from, and states plainly that a provider's own region is a mapping on a cloud entry rather than a coordinate of the name.

### Each cloud's vocabulary is a fact, so it is restated rather than executed

What differs between clouds is what they call things — how a region is spelled, what an account is named, which service realizes a store. That is a fact about a cloud rather than a procedure, so it sits here, one numbered entry per subject under a card of its own, and both a reader and a skill find it in the same place. A cloud the plugin ships no validator for still has its entries here, because the words are true whether or not anything checks them.

### Every example uses one invented platform

A real coordinate in an example is a real coordinate published in a public repository. So the examples across all of these cards use one sample platform, and the sample exists for no other purpose.

## Boundary

This page answers which subjects the estate's cards cover and what a card may contain. It does not answer how a restatement is stamped, parsed or compared — that is [Refs](../01-devex/06-refs.md), and these files carry the same block. It does not answer what the estate model itself is: the book states it, and a card is the copy.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the subjects restated here, and that every value in them is grammar rather than a real one | the block, the stamp, the hash and the drift comparison | [Refs](../01-devex/06-refs.md) |
| that a cloud's vocabulary is restated as a fact | the code that parses one cloud's text at write time | [Providers](06-providers.md) |
| that a refusal's reasoning is one hop from the refusal | what is refused at the moment an estate file is written | [Scripts](04-scripts.md) |
| that a card holds the words a skill uses | the skills themselves, and the walk each one sequences | [Skills](03-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.WORKSPACE.118` | a card is a restatement, carrying its sources and adding no rule | MUST |
| `RD.SUPPORT.INFRA.026` | which manifest declares which kind of estate node, which the manifest card restates | MUST |
| `RD.DEVEX.UTILS.019` | a card carries rules it does not own and adds none | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs restates check` (or `spn-devex restates check`, once installed)
