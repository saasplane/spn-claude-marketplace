<!-- spn:doc
{
  "id": "spn-claude-marketplace-behaviors",
  "title": "Behaviors — spn-claude-marketplace",
  "lenses": ["PRODUCT", "QA"],
  "status": "PLANNING",
  "summary": "The behaviors seat of spn-claude-marketplace — one file of rows beside each construct, written by the plugins' own suites because this repository declares no stack.",
  "keywords": ["behaviors", "rows", "register", "runner", "tier", "id"]
}
-->

# Behaviors — spn-claude-marketplace

`For: Product manager · Quality engineer` · `Status: 🔮 PLANNING`

**What** — this seat answers what a person can do, in the consumer's own words.

One file of rows sits beside each construct, at the same relative path and the same number. So `03-behaviors/01-spn-devex/04-checks.md` proves `02-constructs/01-spn-devex/04-checks.md`, and a produced page joins its own rows with nothing to look up.

**This repository writes its own rows.** It declares no stack, so the deterministic tool serves it with its docs commands alone and has no runner for it. The plugins' own suites are the runner: a case whose title carries a row's id becomes a result, the results become an artifact in the pocket, and the writer puts what the run found into the `Status` and the `Updated at` cells. Every other cell is a decision somebody made, and nothing writes over those.

**The actor each row names is defined once, in [personas](personas.md).** The people who meet these plugins are engineering functions, so every `Who` cell resolves to one of the lens register's own names and no area invents a word of its own.

**A row here is declared, never claimed.** Each one reads `PLANNED` until a run says otherwise. A row whose tier a run covered and whose case the run never reached reads as pending afterwards, which is the honest answer and the one a reader needs.

| Domain | What it promises |
| --- | --- |
| [spn-devex](01-spn-devex/README.md) | The plugin every repository loads, and everything a session reads from it |
| [spn-apps-ts](02-spn-apps-ts/README.md) | The apps world made concrete for TypeScript |
| [spn-infra](03-spn-infra/README.md) | The estate world, and the boundary none of its skills crosses |
