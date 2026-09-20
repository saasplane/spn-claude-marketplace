<!-- spn:doc
{
  "id": "spn-claude-marketplace-docs-audit",
  "title": "Docs Audit — spn-claude-marketplace",
  "lenses": ["ARCHITECT", "VOICE"],
  "status": "DONE",
  "summary": "What this repository's corpus looks like on 2026-09-20, measured against the landed standard — its seats, what each domain owes, the arguments still in its pocket, the pages off the standard, and the paragraphs a language pass would read."
}
-->

# Docs Audit — spn-claude-marketplace

`For: Architect · Editor` · `Status: ✅ DONE`

Measured 2026-09-20. **Nothing here was fixed while it was counted** — a scan that edits as it goes cannot be trusted as a measure, so this verb writes one file and touches nothing else.

## The seats

| Seat | Face | Documents |
| --- | --- | --- |
| `01-purpose` | ✅ | 1 |
| `02-constructs` | ✅ | 6 |
| `03-behaviors` | ✅ | 1 |
| `04-capabilities` | ✅ | 1 |
| `05-guides` | ✅ | 1 |

**No node carries a docs tree.** The repository has one, and every node carries `README.md` alone.

## What each domain owes

A domain owes what its concept section lists, and has what sits under it. A domain the concept does not name is invariant 1's finding.

| Domain | Named by the concept | Constructs written | Lines the concept lists |
| --- | --- | --- | --- |
| `01-plugins` | ✅ | 0 | 0 |
| `02-hooks` | ✅ | 0 | 0 |
| `03-skills` | ✅ | 0 | 0 |
| `04-refs` | ✅ | 0 | 0 |
| `05-agents` | ✅ | 0 | 0 |

> [!NOTE]
> **Read a 0 in the last column as *unmeasured*, never as *owes nothing*.** A concept is given its one line per construct by `docs.ts face`, and it can only write that once the constructs exist. Until then the column reports the concept's own bullet lists, which most concepts do not yet carry.

## The arguments still in the pocket

None.

## Pages off the standard

**Clean over 12 page(s).**

## The paragraphs a language pass would read

1 candidate paragraph(s) in 1 file(s), out of 4 scanned.

| File | Flagged | Paragraphs |
| --- | --- | --- |
| `docs/01-purpose/README.md` | 1 | 4 |

> [!NOTE]
> **Three of the nine faults are not here, and that is deliberate.** A compressed claim, a rule with no action, and an abstraction that is merely dull cannot be told from good prose by a pattern. The flagged set is where a pass starts, never the whole job.

## What this report does not measure

| Not measured | Why | What would measure it |
| --- | --- | --- |
| Comments owed per package | the symbol index is a per-package build this verb does not run | `spnutils apps gen-symbols -p <pkg>` |
| Whether a written construct is TRUE | a count cannot read | the two-per-wave read |
| The constructs a concept has not listed | see the note above | `docs.ts face`, once the constructs exist |
