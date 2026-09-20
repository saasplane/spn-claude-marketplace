<!-- spn:doc
{
  "id": "cap-spn-core-refs",
  "title": "Refs — spn-core/refs/",
  "lenses": ["ARCHITECT", "VOICE"],
  "status": "PLANNING",
  "summary": "spn-core's own restatements — the stack-agnostic vocabulary, the corpus standard, the cross-repo protocol, the review lenses — each a markdown file a consumer with no book checkout can still read in full."
}
-->

# Refs — spn-core/refs/

`For: Architect · Editor` · `Status: 🔮 PLANNING`

Every file directly under `refs/` restates one part of the foundation for a reader who may never open the book. `lenses/` is the same idea at a finer grain — eleven files, one per reviewing viewpoint `spn-panel` can be handed by name — so it sits under this same mirror rather than earning its own.

| File | Restates |
| --- | --- |
| `commands.md` | the `spnutils` command groups and the DevEx stage verbs, stack-agnostic |
| `contract-rules.md` | the contract review rules — compatibility and secrets, stack-agnostic |
| `cross-repo.md` | the cross-repo working protocol — when work earns a workstream, the machine seat (`~/.spnenv`), the producer/partner boundary |
| `decision-cards.md` | the `Open`/`Deferred` card grammar an approach page's cards must carry |
| `doc-sets.md` | the corpus standard itself — the tree, the seats, the six invariants, the one-voice rules — this file's own source |
| `getting-started.md` | the day-zero walk, empty folder to first feature, restating the guides seat's face |
| `intent.md` | the intent-comment convention — one comment, harvested into the symbol index, the interface document, the client and the tool definitions |
| `permission-vs-enablement.md` | the first question before declaring a gate: does the answer vary per person, per organization type, or per plan |
| `platform-worksheet.md` | the new-platform intake worksheet the `ideate` skill's coordinates step reads |
| `workstream-loop.md` | what the agent does and when — the loop a workstream's confirmed-execution rule restates against |
| `lenses/*.md` (11 files) | one reviewing viewpoint each — what it may block, what it can only advise, read by `spn-panel` when convened under that name |

**Does not do.** No file here is loaded on its own initiative — a skill or an agent brief names the one it needs, at the point it needs it, rather than every ref loading into every turn.
