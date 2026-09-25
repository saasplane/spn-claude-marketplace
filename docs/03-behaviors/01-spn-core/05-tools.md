<!-- spn:doc
{
  "id": "behaviors-tools",
  "variant": "behaviors",
  "title": "Behaviors — The Tool",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "What a tool promises: one answer whether a rule is asked at write time or in a sweep, a folder accepted wherever a file is, silence where the input is absent, and an exit code carrying only the refusals.",
  "keywords": ["tool", "job", "silence", "exit code", "partner", "rows"]
}
-->

# Behaviors — The Tool

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

This page lists the promises [The Tool](../../02-constructs/01-spn-devex/05-tools.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.TOOL.01 | Backend developer | get the same answer from a rule at write time and in a sweep | One file holds the rule, and both callers import it rather than reimplementing it | POSITIVE | UNIT | PLANNED | — |
| MKT.TOOL.02 | Architect | hand a job a folder wherever it would take a file | A folder means every document under it, and a path that is not there is named rather than read | POSITIVE | UNIT | PLANNED | — |
| MKT.TOOL.03 | Partner / integrator | run a tool in a repository holding no book at all | The question with no input prints one line and exits clean, rather than crashing | NEGATIVE | UNIT | PLANNED | — |
| MKT.TOOL.04 | Backend developer | read a run as a list and a pipeline read it as a number | Every finding carries its grade, and only the refusals are counted into the exit code | POSITIVE | UNIT | PLANNED | — |
| MKT.TOOL.05 | Partner / integrator | prove every hook still works in a repository carrying only the plugins | A repository of that shape is built, every script is run against it, and a crash is the only failure | POSITIVE | UNIT | PLANNED | — |
| MKT.TOOL.06 | Editor | get the paragraphs worth a rewrite rather than a whole corpus | The candidates a pattern can recognise are reported, and a ledger lets a long sweep resume | POSITIVE | UNIT | PLANNED | — |
| MKT.TOOL.07 | Quality engineer | have this repository's own rows written from its own suites | The run's results file is read, and only the cells a run owns are written | POSITIVE | UNIT | PLANNED | — |
