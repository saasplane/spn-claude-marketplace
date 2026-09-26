<!-- spn:doc
{
  "id": "spn-claude-marketplace-capabilities",
  "title": "Capabilities — spn-claude-marketplace",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "governs": "plugins",
  "summary": "The capabilities seat of spn-claude-marketplace — a mirror per folder that earns one under plugins/, the repository's own source root, since this GENERAL repository has no src/ at all."
}
-->

# Capabilities — spn-claude-marketplace

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

**What** — this seat answers what must exist for those behaviours to be possible.

One document per source folder that earns one, named for the folder it governs and carrying that folder's seams. **This repository declares `GENERAL`, so it has no `src/` at all** — its source root is `plugins/`, named above on this face's own block rather than assumed.

**The Map below does not name a real folder, and this is the generator's defect rather than the tree's.** A chapter realizes a construct; there is no one folder under `plugins/` for it to govern, so a `Governs` cell derived from its path can only invent one. Every cell in the Map resolves to nothing on disk. **The folder each chapter actually covers is named on its own package face**, in the `Source folders` line under the chapter table — [spn-devex](01-devex/spn-devex/README.md), [spn-apps](02-apps/spn-apps/README.md) and [spn-infra](03-infra/spn-infra/README.md). Read those, never the cells below.

Two things under `plugins/` earn no mirror here on purpose. Each plugin's `.claude-plugin/plugin.json`, and the repository's own root `.claude-plugin/marketplace.json`, are the plugin construct's own shape — see [The Plugin](../02-constructs/01-devex/01-plugin.md) rather than a second statement of the same fields here. And a `hooks/tests/` folder, where one exists, is proof rather than capability surface: its own suite is what a mirror's `Proven by` column cites, never a mirror of its own.

<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->
| File | Governs | Carries | Status |
| --- | --- | --- | --- |
| — | — | this layer carries no mirror yet | 🔮 |
<!-- /spn:generated -->
