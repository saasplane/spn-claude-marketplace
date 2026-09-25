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

**An id is never changed.** A row's id is a promise somebody already made, and a test title carries it.

| File | The construct it proves |
| --- | --- |
| [01-plugin-set.md](01-plugin-set.md) | The plugin — the folder, the list, the version and the installed copy |
| [02-hook-set.md](02-hook-set.md) | The hook — the wiring, the verdict and the always-zero exit |
| [03-loop-events.md](03-loop-events.md) | Loop events — the moments, and what each one may do |
| [04-checks.md](04-checks.md) | The check — one rule, asked on every call |
| [05-tools.md](05-tools.md) | The tool — a command run by its own path |
| [06-pages.md](06-pages.md) | The page — produced from a seat file, never typed |
| [07-skill-set.md](07-skill-set.md) | The skill — a stage's steps, loaded on match |
| [08-ref-set.md](08-ref-set.md) | The ref — a chapter, restated and stamped |
| [09-lenses.md](09-lenses.md) | The lens — one reviewing viewpoint, written down |
| [10-agent-set.md](10-agent-set.md) | The agent — a persona a session can convene |
