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

**The Map below does not name a real folder, and this is the generator's defect rather than the tree's.** A chapter realizes a construct; there is no one folder under `plugins/` for it to govern, so a `Governs` cell derived from its path can only invent one. Every cell in the Map resolves to nothing on disk. **The folder each chapter actually covers is named on its own package face**, in the `Source folders` line under the chapter table — [spn-core](01-spn-core/spn-core/README.md), [spn-apps-ts](02-spn-apps-ts/spn-apps-ts/README.md) and [spn-infra](03-spn-infra/spn-infra/README.md). Read those, never the cells below.

Two things under `plugins/` earn no mirror here on purpose. Each plugin's `.claude-plugin/plugin.json`, and the repository's own root `.claude-plugin/marketplace.json`, are the plugin construct's own shape — see [The Plugin](../02-constructs/01-spn-core/01-plugin-set.md) rather than a second statement of the same fields here. And a `hooks/tests/` folder, where one exists, is proof rather than capability surface: its own suite is what a mirror's `Proven by` column cites, never a mirror of its own.

<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->
| File | Governs | Carries | Status |
| --- | --- | --- | --- |
| [01-spn-core/spn-core/01-plugin-set.md](01-spn-core/spn-core/01-plugin-set.md) | `plugins/01-spn-core/spn-core/01-plugin-set/` | One manifest, one marketplace row, and the only plugin of the three that carries all five instrument kinds — with a version field that names what is published rather than what is being worked on. | ✅ |
| [01-spn-core/spn-core/02-hook-set.md](01-spn-core/spn-core/02-hook-set.md) | `plugins/01-spn-core/spn-core/02-hook-set/` | The wiring and the shared shapes every hook in the workspace is built on: a verdict that is returned rather than printed, one process for the whole PreToolUse chain, and an exit code that is always zero. | ✅ |
| [01-spn-core/spn-core/03-loop-events.md](01-spn-core/spn-core/03-loop-events.md) | `plugins/01-spn-core/spn-core/03-loop-events/` | The four moments spn-core wires into — the window opening, a call about to run, a shell command that finished, and a turn about to end — and why only one of them may refuse anything. | ✅ |
| [01-spn-core/spn-core/04-checks.md](01-spn-core/spn-core/04-checks.md) | `plugins/01-spn-core/spn-core/04-checks/` | Six stack-agnostic checks the dispatcher composes, each naming in its own header the chapter it restates, and each carrying a fast path so an ordinary edit pays almost nothing. | ✅ |
| [01-spn-core/spn-core/05-tools.md](01-spn-core/spn-core/05-tools.md) | `plugins/01-spn-core/spn-core/05-tools/` | Six commands run by their own path rather than fired by an event — the corpus audit, the corpus against itself, the drift check that crosses into the book, the partner proof, the prose triage, and the writer of the repository's own behaviour rows. | ✅ |
| [01-spn-core/spn-core/06-pages.md](01-spn-core/spn-core/06-pages.md) | `plugins/01-spn-core/spn-core/06-pages/` | The renderer that turns a seat file into the page a reader opens, the drawer that measures every figure from its own text, and the checker that treats a connector as a claim. | ✅ |
| [01-spn-core/spn-core/07-skill-set.md](01-spn-core/spn-core/07-skill-set.md) | `plugins/01-spn-core/spn-core/07-skill-set/` | Eleven stack-agnostic verbs, one folder and one SKILL.md each, whose descriptions are written to be matched against a turn's work rather than browsed by a person. | ✅ |
| [01-spn-core/spn-core/08-ref-set.md](01-spn-core/spn-core/08-ref-set.md) | `plugins/01-spn-core/spn-core/08-ref-set/` | Eleven restatements a reader with no book checkout can still read in full, each stamped with the hash of what it last saw, and the one parser two different drift checks share. | ✅ |
| [01-spn-core/spn-core/09-lenses.md](01-spn-core/spn-core/09-lenses.md) | `plugins/01-spn-core/spn-core/09-lenses/` | Eleven reviewing viewpoints, each naming the one thing it may block and everything it can only advise, read by name at the moment a panel is convened rather than carried by eleven agents. | ✅ |
| [01-spn-core/spn-core/10-agent-set.md](01-spn-core/spn-core/10-agent-set.md) | `plugins/01-spn-core/spn-core/10-agent-set/` | Four briefs a session can convene — one fixed engineering persona, one reviewer parameterized by a lens, and a rewrite and review pair in which only the rewriter is allowed to edit. | ✅ |
| [02-spn-apps-ts/spn-apps-ts/01-stack-checks.md](02-spn-apps-ts/spn-apps-ts/01-stack-checks.md) | `plugins/02-spn-apps-ts/spn-apps-ts/01-stack-checks/` | Six write-time checks for the TypeScript stack behind one dispatcher, reading a source file with its comments masked and the pending write already applied, so each can answer whether this edit introduced the pattern. | ✅ |
| [02-spn-apps-ts/spn-apps-ts/02-stack-tools.md](02-spn-apps-ts/spn-apps-ts/02-stack-tools.md) | `plugins/02-spn-apps-ts/spn-apps-ts/02-stack-tools/` | Two commands over one behaviour register — the published action surface measured against what claims it, and the writer that puts what the last run found into two cells and touches nothing else. | ✅ |
| [02-spn-apps-ts/spn-apps-ts/03-stack-skills.md](02-spn-apps-ts/spn-apps-ts/03-stack-skills.md) | `plugins/02-spn-apps-ts/spn-apps-ts/03-stack-skills/` | Five verb skills for a TypeScript repository, one of them large enough to divide into seven ordered step files, and a deliberate absence where planning would be. | ✅ |
| [02-spn-apps-ts/spn-apps-ts/04-stack-refs.md](02-spn-apps-ts/spn-apps-ts/04-stack-refs.md) | `plugins/02-spn-apps-ts/spn-apps-ts/04-stack-refs/` | One file: the planning layer for an APPS and TypeScript node, written as reference material a stack-agnostic skill loads rather than as a skill of its own. | ✅ |
| [03-spn-infra/spn-infra/01-estate-guard.md](03-spn-infra/spn-infra/01-estate-guard.md) | `plugins/03-spn-infra/spn-infra/01-estate-guard/` | One shell script wired to every write, denying the five ways an estate edit leaks a secret or pins something a driver should discover, and allowing the call on anything it does not understand. | ✅ |
| [03-spn-infra/spn-infra/02-estate-skills.md](03-spn-infra/spn-infra/02-estate-skills.md) | `plugins/03-spn-infra/spn-infra/02-estate-skills/` | Four verb skills for an estate repository — declaring what the estate is, reading a plan before it is approved, authoring a module end to end, and publishing a package — none of which mutates a cloud itself. | ✅ |
| [03-spn-infra/spn-infra/03-estate-refs.md](03-spn-infra/spn-infra/03-estate-refs.md) | `plugins/03-spn-infra/spn-infra/03-estate-refs/` | Four cards restating the estate's own vocabulary — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to. | ✅ |
<!-- /spn:generated -->
