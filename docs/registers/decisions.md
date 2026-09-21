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

**Where a document here and the plugin source disagree, the source wins.** The source is `plugins/` — the three manifests, the wiring files, the hooks, the skills, the refs, the lenses and the agent briefs. A row below names which side was wrong.

| # | Decision | Why | Date |
| --- | --- | --- | --- |
| MD1 | **A Terms table names the spelling the source carries, never an invented type name.** The constructs seat once named `PluginManifest`, `MarketplaceEntry`, `PluginInstall`, `EventHook`, `NamedInstrument`, `SkillFrontmatter`, `SkillDescription`, `SkillStep`, `RestatesBlock`, `DriftFinding`, `AgentBrief`, `AgentDescription` and `LensFile`. None of the thirteen exists anywhere under `plugins/`. Only `Verdict` and `Citation` did. A contract term is now a real symbol, a real file name, a real field, or an em dash | The document side was wrong. The dictionary is generated from these cells, so an invented name becomes a word the whole corpus appears to share. A reader greps it and finds nothing, and cannot tell a stale name from a wrong one. Real spellings also make the cell checkable: `Verdict`, `Payload`, `Check`, `Grade`, `Citation`, `Spec` and `Link` are all declared in the source | 2026-09 |
| MD2 | **The dispatcher refuses on its own account.** Before it asks any check, `dispatch` asks whether a path this call would write belongs to a generator. A generated validator, a build output folder, a generated route lock, and a file whose header says a tool wrote it are all refused there. The constructs seat said the dispatcher only carries what the checks decided | The document side was wrong. The guard was folded into the dispatcher so one process carries every refusal. Reading the seat literally, a person looking for that rule would search `hooks/checks/` and find nothing. The refusal is also the cheapest one in the chain, which is why it runs before the list rather than inside it | 2026-09 |
| MD3 | **Four of the eleven core refs carry no stamp, and one carries a marker nothing reads.** `blocks.md`, `commands.md`, `decision-cards.md` and `intent.md` have no `spn:restates` block. `blocks.md` opens with `spn:ref`, which no tool in the repository parses. The construct page now says a ref may be unstamped, and names that as one of the ways a restatement stops being comparable | The source side is the fact and the document was over-claiming. Saying every ref is stamped reads as a guarantee, and a reader then trusts a drift run to have covered files it never saw. Naming the gap is what makes it fixable. Each of the four either earns a block, or is reported by the drift run as unstamped | 2026-09 |
| MD4 | **A brief's read-only promise is bound only where it declares `tools`.** `spn-prose-reviewer` and `spn-prose-rewriter` declare the field, so their permissions are bound. `spn-panel` and `spn-engineer` declare neither `model` nor `tools`, so each inherits every tool the session holds. The constructs seat said the permission sits in each brief's frontmatter | The document side was wrong, and the difference matters most for the reviewer. A panel that must never edit is asked not to, rather than prevented. Stating it plainly lets somebody decide whether to bind the field or to keep the inheritance on purpose. Either way, a reader can now tell the two kinds apart | 2026-09 |
| MD5 | **The delivery chapter is cited as `02-delivery.md`, at `04-capabilities/01-devex/03-utils/01-spnutils/`.** Every page here once cited `04-devex/10-delivery.md`. No file sits at that path in the book today. Both sections these pages depend on are present under the new path | The document side was wrong. A citation that resolves to nothing is worse than no citation. A reader assumes the chapter moved and gives up. Or assumes it was deleted, and writes the rule again locally. The two sections cited are *When an edit becomes behaviour* and *The set a repo gets is derived from its own claim* | 2026-09 |
| MD6 | **The manifest is the current description, and the marketplace entry is the copy.** The `spn-core` entry in `.claude-plugin/marketplace.json` and the description in `plugins/spn-core/.claude-plugin/plugin.json` differ today. The entry describes the machine seat with a never-print rule and two regions. The manifest describes a never-render rule, four marked regions, and a reference grammar | The source side wins by rule, and the entry is the stale copy. Nothing generates the marketplace file, which is deliberate: a generator would need a second list able to disagree with this one. The price is that the two can drift, and they have. The fix belongs to the window that owns `plugins/`, so the conflict is recorded here rather than corrected | 2026-09 |
