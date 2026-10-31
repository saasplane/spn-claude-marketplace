<!-- spn:doc
{
  "id": "behaviors-apps-hooks",
  "variant": "behaviors",
  "title": "Behaviors — Hooks",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "What this plugin's wiring promises: nothing paid for at a moment that cannot introduce a pattern, one interpreter start-up for the whole chain, a stated time budget, and what runs resolved from the repository's own declaration.",
  "keywords": ["hook", "moment", "matcher", "entry", "timeout", "rows"]
}
-->

# Behaviors — Hooks

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

The table below lists the promises [Hooks](../../02-constructs/03-apps/02-hooks.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.HOOKS.15 | Backend developer | read a file or run a command without paying for this plugin at all | The wiring claims the moment a write is about to happen, and no other | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.16 | Backend developer | have a call filtered out before any process of this plugin's starts | The entry narrows to the tool names that change a file, and the harness applies that first | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.17 | Backend developer | pay one interpreter start-up for this plugin's whole chain | The wiring declares one entry, and one process runs everything behind it | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.18 | Engineering leader | know the longest a write can wait on this plugin | The budget for the whole chain is declared in the wiring rather than trusted to the scripts | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.19 | Architect | have one installed plugin serve whatever stack a node declares | The dispatcher resolves its subjects per write from the nearest manifest rather than holding a list | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.20 | Backend developer | install this plugin anywhere and still have its entry resolve | The wired command is written against the plugin root, never against a path in this repository | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.29 | Engineering leader | trust a hook reflects the source that was last checked in | `hooks.json` runs the committed `dist/events/pretooluse.mjs`, and a bundle older than its declared sources is refused by `tests/unit/t-dist-current.mjs` | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.141 | Backend developer | have a name that departs from the naming chapter caught as it is written | In any `.ts` file under `src/`, a method with no leading verb, a boolean that does not read yes or no, an enum type not ending in `_type` or a reference column not named `<table>_id` is refused with the name it should take | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.142 | Web developer | be told when a style is forced onto a design-system unit in an app | A forced `!` utility, or a colour or spacing set by hand, on a design-system unit is noted with the app's stylesheet and the surface context as the better way, and the write goes on | NEGATIVE | UNIT | PLANNED | — |
