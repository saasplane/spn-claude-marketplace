<!-- spn:doc
{
  "id": "behaviors-apps-providers",
  "variant": "behaviors",
  "title": "Behaviors — Providers",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "What this domain's provider promises: a stack joining by a folder, a rule found beside the door that runs it, a file read once per write, a refusal that names the card holding its reasoning, and a warning where the model behind a rule is still open.",
  "keywords": ["provider", "stack", "subject", "door", "private", "rows"]
}
-->

# Behaviors — Providers

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

The table below lists the promises [Providers](../../02-constructs/02-apps/06-providers.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.PROVIDERS.08 | Architect | add a second stack by adding a folder | Both halves mirror the plugin's own folder names, and no gate is edited | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.09 | Backend developer | walk a build step written for this node's own language | The step files sit under the provider for the declared stack, one per layer | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.10 | Architect | have a core-plugin skill load this stack's own half | A provider folder is named for the skill that loads it, not for the plugin that ships it | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.11 | Backend developer | see the doors when listing a checks folder, and nothing else | A rule is private to its subject, behind an underscore folder, and nothing outside imports into it | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.12 | Backend developer | edit a file somebody else wrote without being refused for their pattern | Only a pattern the pending write brings in is answered for | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.13 | Backend developer | write the name of a pattern inside a comment or a string safely | Comments and string bodies are blanked before the search runs | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.14 | Backend developer | be refused an enablement code that is not prefixed by its own module | The refusal names the code, the module it belongs to, and the card carrying the reasoning | NEGATIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.15 | Backend developer | be refused a read method returning a list type under a plural name | The suggested name is given, and a keyed map, a write method and a search are left alone | NEGATIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.16 | Backend developer | be refused a contract state write that would close a dependency cycle | The refusal explains that a loop resolves to nothing at start-up, and names the one release valve | NEGATIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.17 | Web developer | be refused a navigation assertion whose host pattern could match inside a longer address | The host is compared as a parsed host, or the pattern is anchored | NEGATIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.18 | Quality engineer | be warned rather than refused where the model behind a rule is still open | The coverage findings warn, and the file marks what to replace when the model lands | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.19 | Backend developer | find the one home of a rule that is written in two places | The header names the command-line tool's own file, and the instruction to change it there first | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.31 | Backend developer | be refused an exclude that gives no reason | The check denies a new `coveragePathIgnorePatterns` or `coverage.exclude` entry with no comment beside it | NEGATIVE | UNIT | PLANNED | — |
| MKT.PROVIDERS.32 | Web developer | be warned of a journey assertion written over several lines with a trailing comma and no message | The trailing comma is not counted as a message, so the assertion gets the note a bare assertion gets | NEGATIVE | UNIT | PLANNED | — |

## Retired ids

**A promise is re-issued under the construct that now makes it, and the id it used to carry is never reused.** The floor is gone: coverage is measured and reported, never enforced, and no ratchet raises a number nobody checked (`RD.SUPPORT.APPS.133`, amended 2026-09-29).

| Retired | Re-issued as |
| --- | --- |
| `MKT.PROVIDERS.28` · `MKT.PROVIDERS.29` · `MKT.PROVIDERS.30` | none — the floor script, the raise and the write-time refusal are deleted; `MKT.PROVIDERS.31` above, the exclude's reason, is what survives |
