<!-- spn:doc
{
  "id": "spn-claude-marketplace-docs",
  "title": "Docs — spn-claude-marketplace",
  "lenses": ["ARCHITECT"],
  "status": "PLANNING",
  "summary": "The docs tree of spn-claude-marketplace — its five seats, and what each answers."
}
-->

# Docs — spn-claude-marketplace

`For: Architect` · `Status: 🔮 PLANNING`

The public marketplace that delivers the instruments of the SaaS Plane agent. The foundation states the rules; this repository carries the machinery that reads them — and `plugins/` is source, so the capabilities seat mirrors it folder for folder.

## The map

**The numbers are the argument** — Why → What → How, and *What* has three parts. Read the folder names top to bottom and you have read the framework.

| Seat | Answers |
| --- | --- |
| [01-purpose/](01-purpose/README.md) | **Why** — why this repository exists — the problem it ends, the payoff of solving that once, what you get, and who it is for |
| [02-constructs/](02-constructs/README.md) | **What** — the model — the things this repository is about, and the word for each |
| [03-behaviors/](03-behaviors/README.md) | **What** — what a person can do, in the consumer's own words |
| [04-capabilities/](04-capabilities/README.md) | **What** — what must exist for those behaviours to be possible |
| [05-guides/](05-guides/README.md) | **How** — how to use what was realized |

Two folders sit beside the seats. They are **pockets**: you look something up in a pocket rather than read it from start to end, which is why the pockets carry no number. `registers/` holds this repository's own rules and decisions, and [`artifacts/`](artifacts/README.md) holds its overview and construct pages and the reports somebody asked for.

