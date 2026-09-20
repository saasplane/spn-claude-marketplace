<!-- spn:doc
{
  "id": "cap-spn-core-hooks-checks",
  "title": "Checks — spn-core/hooks/checks/",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The individual rules pretooluse.ts composes — each one a check restating one chapter of the foundation book, returning a Verdict rather than printing and exiting on its own."
}
-->

# Checks — spn-core/hooks/checks/

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Each file names, in its own header, the chapter or ref it restates. None of them decide a rule on their own account — the chapter is the source of truth, and a rule change is made there first. What lives here is the part a script can mechanically catch.

| File | Refuses or reports | Restates | Proven by |
| --- | --- | --- | --- |
| `confirmed.ts` | a session editing an open workstream nobody said go on | `spn-core/refs/workstream-loop.md` § execution is confirmed, never assumed | `hooks/tests/t-confirmed.mjs` |
| `contract-cycle.ts` | a contract-state write that would close a dependency cycle | the layer promise; `RD.DEVEX.035` · `RD.DEVEX.024` | `hooks/tests/t-contract-cycle.mjs` |
| `doc-check.ts` | a document write against the corpus bars a script can measure — audience, Terms, no cardinality in prose, the one voice's rate | the foundation's `02-document.md`, `04-discipline.md`, `05-artifacts.md`, `06-registers.md` | `hooks/tests/t-doc-check.mjs` |
| `env-seat.ts` | rendering `~/.spnenv` to a terminal or a log | the foundation's `01-devex` § the machine seat | `hooks/tests/t-env-seat.mjs` |
| `mirror.ts` | nothing — it only names the one capability document an edit under a node's `src/` should be read against | `03-tree.md` § how deep a mirror goes | `hooks/tests/t-mirror.mjs` |
| `split-plan.ts` | a documents-first gate (an approach page written while rows sit unlanded) and a close gate (`closed/` while a row is undecided) | the foundation's `05-artifacts.md` § the approach document, `11-workspace.md` § the workstream | `hooks/tests/t-split-plan.mjs` |

**Does not do.** No check here reads a workspace's whole history — each reads the one call it was handed and, where it needs more, the smallest slice of the tree that call touches.
