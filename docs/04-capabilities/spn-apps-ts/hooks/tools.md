<!-- spn:doc
{
  "id": "cap-spn-apps-ts-hooks-tools",
  "title": "Tools — spn-apps-ts/hooks/tools/",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The two commands run by name against a TS-stack repository: the published action surface and what claims it, and the writer that puts a run's own finding into a behaviour row's Status and Updated at cells."
}
-->

# Tools — spn-apps-ts/hooks/tools/

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

Neither file here is wired to an event. Each is run by its own path, against one TS-stack repository, and each reads or writes the behaviour register `lib/register.ts` defines.

| File | Run as | Provides | Proven by |
| --- | --- | --- | --- |
| `action-coverage.ts` | `action-coverage.ts [--report] [root]` | every published API action, matched against what claims it — a person through a browser, or a caller through the entry layer | `hooks/tests/t-action-coverage.mjs` |
| `behaviour-rows.ts` | `behaviour-rows.ts [--write] [--reach repository] [root]` | writes only `Status` and `Updated at` — what the last run found, and when — never `Type` or `Tier`, which a person declares by hand | `hooks/tests/t-behaviour-rows.mjs` |

**Does not do.** Neither tool writes a row's `Who`, `Does`, `Sees`, `Type` or `Tier` — those six cells are declared by a person before a case exists, and a tool overwriting them would turn a declaration into a guess.
