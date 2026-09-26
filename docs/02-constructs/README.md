<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs",
  "title": "Constructs — The Model This Repository Is About",
  "lenses": ["ARCHITECT", "SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The model this repository is about — one file per construct under the domains its concept names, each domain's face carrying the dictionary of its own terms."
}
-->

# Constructs — The Model This Repository Is About

`For: Architect · Backend developer · Web developer` · `Status: 🔮 PLANNING`

This seat is the model: one file per construct, saying what a thing is, what it is made of, what it depends on, and what it refuses. The behaviours seat and the capabilities seat are both written in these words — one in the consumer's spelling, one in the contract's — so neither can be written until the words exist here.

| Domain | What it holds |
| --- | --- |
| [spn-devex](01-devex/README.md) | The plugin every repository loads: the delivery folder, the code the runtime calls, the commands run by name, the page production, and the skills, restatements, viewpoints and personas a session reads |
| [spn-apps](02-apps/README.md) | The apps world made concrete for TypeScript: the write-time rules only this stack has, the tools over its own registers, its skills, and the planning layer it ships |
| [spn-infra](03-infra/README.md) | The estate world: the single guard standing between an edit and an estate file, the skills that change what an estate is, and the cards holding its vocabulary |

**The dictionary is on each domain's face, not here.** One row per term — the word a consumer uses, the term the contract uses, and what it means — with the term linked to the construct that declares it, generated from that domain's own `Terms` tables. It sits on the domain because that is where a term is decided, and a reader looking a word up is already in the domain that gives it meaning. A term defined twice in one domain is invariant 2's finding.
