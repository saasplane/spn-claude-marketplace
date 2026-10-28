<!-- spn:doc
{
  "id": "spn-claude-marketplace-behaviors-spn-devex",
  "title": "spn-devex — What It Promises",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "The promises the stack-agnostic plugin makes, one file of rows beside each construct that states them, at the same path and the same number.",
  "keywords": ["behaviors", "promises", "spn-devex", "rows", "register", "tier"]
}
-->

# spn-devex — What It Promises

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

Each file here holds the rows of one construct, and it sits at the same path and the same number as the construct that states them. So a row and the page it belongs to are found from each other by path rather than by search.

**A row is declared here and proven by a run.** The plugins' own suites are this repository's runner, because it declares no stack and no stack runner would serve it. A case whose title carries a row's id becomes that row's result, and the writer puts what the run found into the last two cells. Every row below reads `PLANNED` because nothing has been claimed yet, and a row no case reached will say so after the next run.

**An id is never changed, and never reused.** A row's id is a promise somebody already made, and a test title carries it. Where one construct is folded into another, the promise is re-issued under the construct that now makes it and the old id is struck rather than carried across — each file below names what it retired, and a gap in a sequence is expected.

| File | The construct it proves |
| --- | --- |
| [01-plugin.md](01-plugin.md) | The plugin — the folder, the list, the version and the installed copy |
| [02-hooks.md](02-hooks.md) | Hooks — the moments, the wiring, the verdict and the always-zero exit |
| [03-agents.md](03-agents.md) | Agents — the personas a session convenes, and the viewpoints they are handed |
| [04-skills.md](04-skills.md) | Skills — a stage's steps, loaded on match |
| [05-scripts.md](05-scripts.md) | Scripts — the checks a moment composes, the tools reached by name, and the pages they produce |
| [06-refs.md](06-refs.md) | Refs — a chapter, restated and stamped |
| [07-providers.md](07-providers.md) | Providers — how a plugin is extended per instance |
| [08-tests.md](08-tests.md) | Tests — the tier, the mirror, and a runner that walks |
