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
| MKT.SCRIPTS.189 | Web developer | read one repository's unit with `--repo <name or path>` on `unit show` or `unit find`, or see which other members carry a name from the workspace's root | `--repo` reads only the repository named, by a member's name or a path inside it, and the line says `--repo` named it; at the root, a name several members carry prints one line naming the others; a value that names no repository is a usage fault that lists the members | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.190 | Web developer | open a unit's own `.tsx` with a Read | A note beside the Read names `spn-surface unit show <the file's name>` and says to read the source only for what it leaves out; the Read goes ahead | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.191 | Web developer | read a unit's test or story, a file outside a unit's folder, or search the source | No note, and nothing is refused | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.555 | Web developer | lay a unit's set out with `layout.js` | The set's versions take the cells of the layout in the section's shared plugin data: in each table every row group crosses every column group, the column groups stand side by side, and the stack's default stands at the top left | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.556 | Web developer | make a unit's cases with `cases.js` | Each case is an instance of the default version with the boolean, text or swap property it names set, tied to its layer; a case no property reaches is named in `problems` and not drawn | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.557 | Web developer | change or read a set whose header still carries layout clauses, or whose section holds no layout | Every script of the design skill reads a set's layout from its section's plugin data and never from a header's text: a header's clauses lay nothing out, and a section with no layout is reported and left as it is | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.599 | Web developer | have a page refused for a colour or a class a unit forbids | `check page` refuses a hex colour in a drawing, with its line, and a `className` on a design-system unit; a drawing in tokens and `currentColor`, and the same unit without the class, pass | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.600 | Web developer | have a page refused for an icon the app's set does not hold | `check page` refuses an icon name the app's set does not hold and a drawing offered as an icon with other paths; an icon the set holds passes | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.601 | Web developer | have a hero scene only where a hero has one | `check page` refuses a scene in a split hero and a hero scene on a feature that is no hero; a scene in a backdrop hero passes | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.602 | Web developer | have a section keep one emphasis | `check page` refuses a primary band and a highlight in one section, and passes one emphasis | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.603 | Web developer | have a sheet only on a feature's media | `check page` refuses a sheet on a section's media and passes one on the feature's media | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.604 | Web developer | have a drawing as wide as the content | `check page` refuses a drawing 480 wide under the words in a 1120 section and passes one as wide as the content | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.605 | Web developer | have a module's folders hold assets and entry only | `check module` refuses a folder beside `assets/` and `entry/` and an `assets` folder holding folders and files; `assets/` and `entry/` with folders by kind passes | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.598 | Web developer | find `check page`, `check module` and `language write` in the CLI's list | The surface CLI lists `check page`, `check module` and `language write` | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.606 | Web developer | have `language write` say what it did in one line | It prints one OK line naming the construct and the data it filled the figures from, and exits 0 | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.607 | Web developer | have `language write` fill each marked block with its table | Each marked block of the design-language construct holds its table of elements and styles, read from the data | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.608 | Web developer | keep the author's words when `language write` fills the blocks | The words outside the marked blocks are unchanged | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.609 | Web developer | have a second `language write` change nothing | A second run on a filled construct leaves the file as it was | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.610 | Web developer | be refused by name when the data has no rows for a block | `language write` is refused naming the data and the block, exits 1, and the block stays as written | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.611 | Web developer | read each case of a unit as a tree | `spn-surface unit show <Unit>` prints each case's tree in the render's form, `{ "unit", "props" }`, under its sentence, and `--json` gives it as `tree` | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.612 | Web developer | check a module with no design-language data file read | `spn-surface check module` reads no `design-language.json`, so a file off any schema neither passes nor fails it | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.615 | Web developer | fill a design-language construct from its own data | `language write` reads the construct's fenced `json` block whose top key is `language`, and refuses a construct with none, naming it and the heading `### The language as data` | POSITIVE | UNIT | PLANNED | — |
