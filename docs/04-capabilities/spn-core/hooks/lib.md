<!-- spn:doc
{
  "id": "cap-spn-core-hooks-lib",
  "title": "Lib — spn-core/hooks/lib/",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The shared code every event, check and tool imports rather than reimplements — the payload and Verdict shapes, the figure drawer, the page renderer, the restates-block parser, and the timing writer."
}
-->

# Lib — spn-core/hooks/lib/

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Nothing here returns a `Verdict` or prints a finding on its own — it is imported by the files that do, so a rule about parsing a payload or hashing a citation is written once and read the same way everywhere it is used.

| File | Provides | Proven by |
| --- | --- | --- |
| `payload.ts` | the `Payload`/`Verdict` types, `readPayload`/`emit`, and the two filesystem walks (`workspaceRoot`, `read`) every event and check shares | exercised through every check's own test |
| `restates.ts` | the `spn:restates` block: parsing, the hash a citation compares against, and the undeclared/unstamped/unread classification | exercised through `restate-drift.ts`'s own comparison |
| `draw.ts` | the `.dg` figure drawer — turns a fenced spec into the SVG a construct's Model section renders | `hooks/tests/t-draw.mjs` |
| `figures.ts` | checks a rendered `<svg>` figure's own claims — every connector actually reaches a box, entities render intelligibly | exercised through `docs.ts`'s own use of it |
| `render.ts` | turns a seat file's markdown and its `spn:doc` block into the produced HTML page — the header, the tag line, the blocks | exercised through `docs.ts page` and `checkProduced` |
| `timing.ts` | writes what a run cost, only while the developer has asked for it, under a fixed size cap | none dedicated yet — read by inspection |

**Does not do.** No file here reads a call's own path or command — that is what a check in `checks/` or a tool in `tools/` is for. This folder answers *how*, never *whether*.
