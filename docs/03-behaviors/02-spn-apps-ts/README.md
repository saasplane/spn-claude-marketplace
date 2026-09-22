<!-- spn:doc
{
  "id": "spn-claude-marketplace-behaviors-spn-apps-ts",
  "title": "spn-apps-ts — What It Promises",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The promises the TypeScript stack plugin makes, one file of rows beside each construct that states them, at the same path and the same number.",
  "keywords": ["behaviors", "promises", "spn-apps-ts", "rows", "register", "tier"]
}
-->

# spn-apps-ts — What It Promises

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

Each file here holds the rows of one construct, and it sits at the same path and the same number as the construct that states them.

**A row is declared here and proven by a run.** The plugins' own suites are this repository's runner, and a case whose title carries a row's id becomes that row's result. Every row reads `PLANNED` because nothing has been claimed yet.

**An id is never changed.** A row's id is a promise somebody already made, and a test title carries it.

| File | The construct it proves |
| --- | --- |
| [01-stack-checks.md](01-stack-checks.md) | Stack checks — a stack's own rules at write time |
| [02-stack-tools.md](02-stack-tools.md) | Stack tools — commands over a stack's own register |
| [03-stack-skills.md](03-stack-skills.md) | Stack skills — a stack's own skills |
| [04-stack-refs.md](04-stack-refs.md) | Stack refs — the layer a stack-agnostic skill loads |
