<!-- spn:doc
{
  "id": "estate-refs",
  "variant": "construct",
  "title": "Estate Refs — The Estate's Vocabulary, Restated as Cards",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["ref-set"],
  "summary": "The estate's own words, restated for a reader who may never open the book — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to.",
  "keywords": ["card", "manifest", "layer", "naming", "laws", "grammar"]
}
-->

# Estate Refs — The Estate's Vocabulary, Restated as Cards

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

An estate is declared in a small vocabulary, and every one of the words is precise. Which file marks a node, which layer owns which act, how a resource name is composed, what a declaration must never contain: get one of them wrong and the mistake is expensive rather than embarrassing. A card is where each of those subjects is restated, in full, for a reader who may never open the foundation book.

A card is a ref, so it carries a stamp and adds no rule of its own. What makes these cards their own construct is what they refuse to hold. **Every value in them is grammar, never a real one.** No environment, region or account of any organization appears, and the sample platform in the examples exists to show the shape.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a card | `refs/` | one markdown file restating one subject of the estate model, in full, under a stamp |
| the manifests | `spestate.json` · `spinfrapkg.json` | the files that mark an estate node and name what kind it is |
| the path locator | — | how a node is resolved from wherever you are standing, rather than guessed from a folder name |
| a layer | — | one band of the estate, with the same commands as every other and a fixed place in the order |
| a coordinate | — | one part a resource name is composed from, drawn from a closed vocabulary |
| a law | — | one thing a declaration must never do, written with the checkable defect it names |

## Model

A card sits between the book and the moment somebody needs a word, and it is reached by name rather than read as a folder.

```dg
{ "kind": "map",
  "caption": "The card is reached by a citation rather than by a folder, so the reader needs no book checkout.",
  "boxes": [
    { "id": "a", "label": "the book", "note": "the estate sections of the foundation's own concept" },
    { "id": "b", "label": "the card", "note": "one subject, restated in full, under a stamp" },
    { "id": "c", "label": "a skill or the guard", "note": "names the card at the moment the words are needed" },
    { "id": "d", "label": "the reader", "note": "reaches the vocabulary with no book checkout at all" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "restated as" },
    { "from": "b", "to": "c", "label": "cited by" },
    { "from": "c", "to": "d", "label": "reaches" }
  ] }
```

## Parts

### The laws card is written to be read first

A law is useful at the moment somebody is about to break it. A list of principles read afterwards explains a mistake rather than preventing one. So the laws card asks a reader to look for the checkable defect each law names and to raise it before doing anything else, and each law is numbered and states its own defect. The guard's refusal messages point back at this card, so a denial and its reasoning are one hop apart. *Where:* `plugins/spn-infra/refs/laws.md`

### A node is found by its manifest, never by its folder name

The folder name is checked against the manifest rather than trusted as one. Inferring a node's kind from where it sits is how a package comes to be treated as something it is not. The card states which files every estate node carries and which of them answers which question, and the path locator in the same card is what resolves a node from where you are standing. *Where:* `plugins/spn-infra/refs/manifests.md`

### The layers are read in order, and the order explains most failures

A lower layer that is missing is the usual reason a higher one will not start, and that is a diagnosis rather than a rule. The card lists the layer nouns, gives each of them the same commands, and states the order they come up in. It names the tool's command realizing each act, so the card can be read beside a command that is already running. *Where:* `plugins/spn-infra/refs/layers-doors.md`

### A name that cannot be composed from coordinates is a defect

A name derived from a label carries a meaning nobody can read back. The posture of an environment comes from the value it declares, never from a word inside its setup name. So the naming card gives the grammar and the closed vocabulary each part is drawn from, and states plainly that a provider's own region is a mapping on a cloud entry rather than a coordinate of the name. *Where:* `plugins/spn-infra/refs/naming.md`

### Every example uses one invented platform

A real coordinate in an example is a real coordinate published in a public repository. So the examples across all of these cards use one sample platform, and the sample exists for no other purpose. *Where:* `plugins/spn-infra/refs/`

## Boundary

This page answers which subjects the estate's cards cover and what a card may contain. It does not answer how a restatement is stamped, parsed or compared — that is [The Ref](../01-spn-core/08-ref-set.md), and these files carry the same block. It does not answer what the estate model itself is: the book states it, and a card is the copy.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the subjects restated here, and that every value in them is grammar rather than a real one | the block, the stamp, the hash and the drift comparison | [The Ref](../01-spn-core/08-ref-set.md) |
| that a refusal's reasoning is one hop from the refusal | what is refused at the moment an estate file is written | [The Estate Guard](01-estate-guard.md) |
| that a card holds the words a skill uses | the skills themselves, and the walk each one sequences | [Estate Skills](02-estate-skills.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DOCS.055` | a card is a restatement, carrying its sources and adding no rule | MUST |
| `RD.INFRA.026` | which manifest declares which kind of estate node, which the manifest card restates | MUST |
| `RD.DEVEX.019` | a card carries rules it does not own and adds none | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-infra` | the cards restating the estate's own vocabulary — the manifests, the layers, the naming grammar and the laws | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/restate-drift.ts` | gate | every card's stamp still matches the sections it names, so none of the copies has fallen behind the book |

Try it: `node plugins/spn-core/hooks/tools/restate-drift.ts`
