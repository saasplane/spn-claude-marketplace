<!-- spn:doc
{"id": "spn-surface-capabilities-refs", "variant": "capability", "title": "Refs in spn-surface", "lenses": ["UX", "ARCHITECT"], "status": "PLANNING", "realizes": ["surface-refs"], "summary": "What this plugin carries from the foundation book — the Surface standards, patterns, architecture and delivery, and the two folders of specs a page starts from.", "keywords": ["ref", "restatement", "surface", "specs"]}
-->

# Refs in spn-surface

`For: UX designer · Architect` · `Status: 🔮 PLANNING` · `Realizes: Refs`

A partner holding this plugin has no checkout of the foundation book beside it, so a rule the plugin needs is carried rather than cited. **A ref is a self-contained leaf**: everything it restates is written out, under a stamp naming the version it was read at.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| How the folder is arranged | `packages/plugin-spn-surface/src/refs/README.md` | one folder per book domain, and what a group and a file under it mean |
| The standards | `packages/plugin-spn-surface/src/refs/support/surface/standards-core.md`, `standards-interaction.md`, `standards-patterns.md` | content, interaction and the patterns, by level |
| The patterns | `packages/plugin-spn-surface/src/refs/support/surface/site-patterns.md` and `flow-patterns.md` | the site sections and the flows a page follows |
| The architecture | `packages/plugin-spn-surface/src/refs/support/surface/architecture-*.md` | the design system's core, app, names, layouts, widgets, components and containers |
| The delivery | `packages/plugin-spn-surface/src/refs/support/surface/delivery-library.md`, `delivery-showcase.md`, `providers.md` | the Figma library, the showcase, and what a provider owes |
| A guide for a partner | `packages/plugin-spn-surface/src/refs/support/surface/guide-bring-a-feature.md` | bringing a feature in words, with a design, or with a page to follow, in plain words |
| The specs | `packages/plugin-spn-surface/src/refs/support/surface/app-patterns/` and `site-patterns/` | skeleton specs, byte-identical to the book's, with an index each |
| A stamp | the `spn:restates` block at the top of each ref | each chapter restated, and the hash last read from it |
| The snapshot | `packages/plugin-spn-surface/src/refs/support/surface/construct.snapshot.json` | the CONSTRUCT snapshot of the book each release is cut from, written by `spnutils apps surface construct --out`; `source.readFrom` names the book's commit, and `unit show` reads it |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [The Ref](../../../02-constructs/01-devex/06-refs.md)
- How a ref is stamped, parsed and compared — [Ref in spn-devex](../../01-devex/plugin-spn-devex/06-refs.md)

## Special handling

### The spec folders are written by a command

**Why** — *a spec is the book's, and a hand-made copy drifts*.
**What** — `spn-devex restates files write` copies the book's two spec folders into `refs/support/surface/`, and `restates files check` reports a copy that is behind.
**How** — the command finds the copies in this plugin beside the core plugin in the marketplace. `packages/plugin-spn-devex/src/scripts/commands/restates/files.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the Surface chapters each ref restates | the book governs and the copy carries |
| points at | spn-apps | the refs for how a block is built in TypeScript, by name | the stack's half belongs to the stack |
| publishes | every window that designs or builds a page | the standards a page is held to | a partner has the plugin and not the book |
