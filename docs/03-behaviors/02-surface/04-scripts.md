<!-- spn:doc
{
  "id": "behaviors-surface-scripts",
  "variant": "behaviors",
  "title": "Behaviors — Scripts",
  "lenses": ["WEB_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "What this plugin's scripts promise: one process behind the wired entry, a check that can run alone and answers as it does in the chain, and helpers that live once in the shared folder.",
  "keywords": ["dispatcher", "check", "mask", "bundle", "rows"]
}
-->

# Behaviors — Scripts

`For: Web developer · Architect` · `Status: 🔮 PLANNING`

The table below lists the promises [Scripts](../../02-constructs/02-surface/04-scripts.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.SCRIPTS.182 | Web developer | run the connector check by hand and get the verdict the chain gives | The check exports one verdict function and runs alone on a payload from stdin | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.183 | Architect | find the masker, the resulting text and the stack read in one place | They are one copy each in the shared support folder, and each plugin that reads them bundles them in | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.184 | Web developer | type the plugin's name and see the commands it ships | The entry prints the grammar under the plugin's own name, lists `check scan`, `unit find` and `unit show`, and refuses an unknown group by name | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.185 | Web developer | look a unit up with `spn-surface unit show <Unit>` before writing its props | Its props with their values, defaults and the library's word, its usage, its cases from the top with the rule each rests on, and its index by value; its second line names the book's release, and for a core unit it reads nothing outside the plugin. A unit beyond the core gives its package, its props with their defaults, values and descriptions, and the core block its name points to, from the symbol index of the repository it runs in, or, from a workspace's root, of each repository in it, which the line names | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.186 | Web developer | ask `unit show` for a unit neither the snapshot nor the symbol index of the repository or the workspace it runs in holds, or for none | An unknown name is refused with the three closest units of both, a missing name is a usage fault, a release with no snapshot says so, and a workspace whose repositories hold no index says that rather than that there is none here | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.187 | Web developer | find the unit a task needs with `spn-surface unit find <words>`, from a repository or a workspace's root | The units whose name or line carries the words, best first: a module's unit by its name, with its package, the repository it came from and the core block whose cases it leaves to, and a core unit by its line; a word matches by its first five letters | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.188 | Web developer | ask `unit find` with no words, or with words no unit carries | No words is a usage fault; words no unit's name or line carries exit 1 and say so | NEGATIVE | UNIT | PLANNED | — |
