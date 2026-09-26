<!-- spn:doc
{
  "id": "spn-claude-marketplace-behaviors-spn-infra",
  "title": "spn-infra — What It Promises",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The promises the estate plugin makes, one file of rows beside each construct that states them, at the same path and the same number.",
  "keywords": ["behaviors", "promises", "spn-infra", "rows", "register", "tier"]
}
-->

# spn-infra — What It Promises

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

Each file here holds the rows of one construct, and it sits at the same path and the same number as the construct that states them.

**A row is declared here and proven by a run.** The plugins' own suites are this repository's runner, and a case whose title carries a row's id becomes that row's result. Every row reads `PLANNED` because nothing has been claimed yet.

**An id is never changed.** A row's id is a promise somebody already made, and a test title carries it.

| File | The construct it proves |
| --- | --- |
| [04-scripts.md](04-scripts.md) | The estate guard — one script wired to every write |
| [03-skills.md](03-skills.md) | Estate skills — the skills that change an estate |
| [05-refs.md](05-refs.md) | Estate refs — the estate's vocabulary, restated as cards |
