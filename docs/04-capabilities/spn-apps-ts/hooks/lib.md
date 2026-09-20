<!-- spn:doc
{
  "id": "cap-spn-apps-ts-hooks-lib",
  "title": "Lib — spn-apps-ts/hooks/lib/",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The shared code the TS-stack checks and tools import: the same payload/Verdict shape spn-core defines, the behaviour-register contract both tools read and write, and the source-reading helpers a write-time check needs."
}
-->

# Lib — spn-apps-ts/hooks/lib/

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

| File | Provides | Proven by |
| --- | --- | --- |
| `payload.ts` | the same `Payload`/`Verdict` job `spn-core/hooks/lib/payload.ts` names, kept as its own copy so this plugin never depends on another plugin's internals | exercised through every check's own test |
| `register.ts` | what a behaviour register row IS — the headings and the row test — so `behaviour-rows.ts` (writes) and `action-coverage.ts` (reads) cannot disagree about the table's shape | exercised through both tools' own tests |
| `source.ts` | reading a source file the way a check has to: comments and strings masked out, the call's own pending write already applied, so a check can answer *did this edit introduce it* rather than *does this file already have it* | exercised through the checks that import it |

**Does not do.** No file here decides whether a pattern is a defect — that is every check's own job. This folder only makes reading a source file, or reading a behaviour row, the same operation everywhere it happens.
