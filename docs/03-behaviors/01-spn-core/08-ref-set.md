<!-- spn:doc
{
  "id": "behaviors-ref-set",
  "variant": "behaviors",
  "title": "Behaviors — The Ref",
  "lenses": ["VOICE", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "What a restatement promises: a chapter readable with no book checkout, a stamp as precise as the sentence it replaces, a report when the chapter moves, and a source named in prose that cannot be left out of the block.",
  "keywords": ["ref", "stamp", "hash", "drift", "undeclared", "rows"]
}
-->

# Behaviors — The Ref

`For: Editor · Architect` · `Status: 🔮 PLANNING`

[The Ref](../../02-constructs/01-spn-core/08-ref-set.md) makes the promises below. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.REF.01 | Partner / integrator | read a standard in full with no book checkout | The restatement carries the chapter's content, and the chapter is cited by name | POSITIVE | UNIT | PLANNED | — |
| MKT.REF.02 | Editor | be told when a chapter a copy depends on has moved | The stamp is re-read against the chapter today, and a difference is reported per citation | NEGATIVE | UNIT | PLANNED | — |
| MKT.REF.03 | Editor | cite one section without being re-flagged by the rest of a large file | A stamp naming a section hashes that section alone | POSITIVE | UNIT | PLANNED | — |
| MKT.REF.04 | Editor | reformat a file's trailing space without tripping the comparison | Trailing spaces and surrounding blank lines are removed before the hash is taken | POSITIVE | UNIT | PLANNED | — |
| MKT.REF.05 | Architect | reorder a list of rules and have the comparison notice | A reordering changes the hash, because a reordered list may now be restated wrongly | NEGATIVE | UNIT | PLANNED | — |
| MKT.REF.06 | Editor | be caught naming a source in prose and leaving it out of the block | The file's own source line is read and compared against what the block declares | NEGATIVE | UNIT | PLANNED | — |
| MKT.REF.07 | Architect | tell an unstamped file from one that fell behind | Undeclared, unstamped and unread are reported as different findings | POSITIVE | UNIT | PLANNED | — |
| MKT.REF.08 | Backend developer | have both comparisons read a block the same way | One parser is a library file, and neither check owns it | POSITIVE | UNIT | PLANNED | — |
