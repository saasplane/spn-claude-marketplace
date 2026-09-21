<!-- spn:doc
{
  "id": "behaviors-plugin-set",
  "variant": "behaviors",
  "title": "Behaviors — The Plugin",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "summary": "What delivery promises: a public marketplace anybody can read, a version that names the published bytes, and an installed copy a session can be told apart from this checkout.",
  "keywords": ["plugin", "marketplace", "version", "install", "behaviors", "rows"]
}
-->

# Behaviors — The Plugin

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

These are the promises [The Plugin](../../02-constructs/01-spn-core/01-plugin-set.md) makes. A row says what somebody can do and what they see when they do it.

The plugins' own suites are the runner for this repository, and a case whose title carries a row's id becomes that row's result. Every row below is declared and none is claimed: the `Status` and `Updated at` cells are written by a run rather than typed here.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.PLUGIN.01 | Partner / integrator | reach every standard the plane ships without being granted anything | The whole marketplace is public, and publishing it is pushing the repository | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.02 | Architect | find every plugin this repository ships from one file | One entry per plugin, naming its folder and its description, at the repository root | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.03 | Engineering leader | tell which published bytes a session is running | An installed copy is found by the plugin's name together with the version its manifest carries | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.04 | Backend developer | move one plugin's version without moving the other two | Each manifest carries its own number, and no file derives one number from another | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.05 | Backend developer | install a plugin and have every wired path still resolve | Each wired command is written against the plugin root rather than against a path in this checkout | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.06 | Architect | be told when a marketplace entry has fallen behind its own manifest | The two descriptions are compared, and the manifest is named as the current side | NEGATIVE | UNIT | PLANNED | — |
