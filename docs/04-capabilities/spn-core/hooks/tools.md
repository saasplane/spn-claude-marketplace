<!-- spn:doc
{
  "id": "cap-spn-core-hooks-tools",
  "title": "Tools — spn-core/hooks/tools/",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The five commands run by name rather than fired by an event — the corpus audit, the cross-repo drift check, the corpus-against-itself check, the partner-shape proof, and the prose triage."
}
-->

# Tools — spn-core/hooks/tools/

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

Nothing here is wired in `hooks.json`. Each file is invoked by its own path — by a person, by another check, or by this workstream's own finishing gate — and each prints its findings and returns an exit code rather than a `Verdict`.

| File | Run as | Provides | Proven by |
| --- | --- | --- | --- |
| `docs.ts` | `docs.ts audit\|status\|face <path>` | every document check this workstream runs — the metadata block, the outline, the tag line, `Binds`, dictionary and capability-map generation | `hooks/tests/t-docs.mjs` |
| `coherence.ts` | `coherence.ts <repo>` | the corpus checked against itself, inside one repository — two documents stating opposite rules, which a form check cannot see | none dedicated yet — read by inspection |
| `restate-drift.ts` | `restate-drift.ts [path/to/spn-foundation]` | the one check that crosses the marketplace/book boundary — every plugin document's `spn:restates` block re-hashed against the chapter it names | the port's own hash-the-whole-corpus comparison, described in its header |
| `partner-shape.ts` | `partner-shape.ts` | proves every hook still runs in a repository holding only the plugins — the book absent, never required | none dedicated yet — read by inspection |
| `prose-triage.ts` | `prose-triage.ts <repo>` | the paragraphs worth a rewrite pass, found by six of the nine faults workstream 008 names, out of every prose sentence in the workspace | none dedicated yet — read by inspection |

**Does not do.** `coherence.ts` and `restate-drift.ts` ask two different questions that look alike: one compares a repository's documents against each other, the other compares the marketplace's restatements against a book handed to it — no repository holds both trees, so neither can stand in for the other.
