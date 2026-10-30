<!-- spn:doc
{
  "id": "spn-claude-marketplace-decisions",
  "title": "Decisions — Marketplace-Scoped",
  "lenses": ["ARCHITECT", "VOICE"],
  "status": "DONE",
  "summary": "The decision register for this repository — choices that bind the marketplace and are not derivable from the foundation book, and every conflict found between a document here and the plugin source.",
  "keywords": ["decisions", "register", "marketplace", "conflict", "plugin source", "drift"]
}
-->

# Decisions — Marketplace-Scoped

`For: Architect · Editor` · `Status: ✅ DONE`

The decision register for `spn-claude-marketplace`. It holds the choices that bind this repository and are not derivable from the foundation book. It also holds every conflict found between a document here and the plugin source.

Foundation-scope decisions live in the book's own register, and an `RD.*` id cited on a page here resolves there. Rows below carry an `MD` id, local to this repository. One line per row; the reasoning lives in this file's git history.

**Where a document here and the plugin source disagree, the source wins.** The source is `packages/` — the three manifests, the wiring files, the hooks, the skills, the refs, the lenses and the agent briefs. A row below names which side was wrong.

## MARKETPLACE.DEVEX

| # | Decision | Why | Date |
| --- | --- | --- | --- |
| DEC.MARKETPLACE.DEVEX.001 | A Terms table names the spelling the source carries, never an invented type name. | The constructs seat named thirteen types, none of which exists under `packages/`; only `Verdict` and `Citation` did. The document side was wrong: the glossary is generated from these cells, so an invented name becomes a word the whole corpus appears to share, and a reader who greps it finds nothing and cannot tell a stale name from a wrong one. Real spellings also make the cell checkable. | 2026-09 |
| DEC.MARKETPLACE.DEVEX.003 | Four of the eleven core refs carry no stamp and one carries a marker nothing reads, and the construct page says a ref may be unstamped. | The source side is the fact and the document was over-claiming: saying every ref is stamped reads as a guarantee, and a reader then trusts a drift run to have covered files it never saw. Naming the gap makes it fixable, since each of the four either earns a block or is reported by the drift run as unstamped. | 2026-09 |
| DEC.MARKETPLACE.DEVEX.006 | The plugin manifest is the current description, and the marketplace entry is the copy. | The `spn-devex` entry and the manifest's description differ, and the source side wins by rule, so the entry is the stale copy. Nothing generates the marketplace file, deliberately, because a generator would need a second list able to disagree with this one; the price is that the two can drift, and they have. The fix belongs to the window that owns `packages/`, so the conflict is recorded rather than corrected. | 2026-09 |
