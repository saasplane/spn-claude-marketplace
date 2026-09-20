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

One document per source folder that earns one, named for the folder it governs and carrying that folder's seams. **This repository declares `GENERAL`, so it has no `src/` at all** — its source root is `plugins/`, named above on this face's own block rather than assumed, so the Map below reads real folders instead of one that does not exist.

Two things under `plugins/` earn no mirror here on purpose. Each plugin's `.claude-plugin/plugin.json`, and the repository's own root `.claude-plugin/marketplace.json`, are the plugin construct's own shape — see [The Plugin](../02-constructs/01-plugins/plugin-set.md) rather than a second statement of the same fields here. And a `hooks/tests/` folder, where one exists, is proof rather than capability surface: its own suite is what a mirror's `Proven by` column cites, never a mirror of its own.

<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->
| File | Governs | Carries | Status |
| --- | --- | --- | --- |
| [spn-apps-ts/hooks/checks.md](spn-apps-ts/hooks/checks.md) | `plugins/spn-apps-ts/hooks/checks/` | The TS-stack write-time checks: enablement grammar, an unanchored host assertion, three coverage warnings, a read-verb naming rule, an await-vs-.then() rule, and a journey assertion missing its why — composed by one dispatcher, pretooluse.ts. | 🔮 |
| [spn-apps-ts/hooks/lib.md](spn-apps-ts/hooks/lib.md) | `plugins/spn-apps-ts/hooks/lib/` | The shared code the TS-stack checks and tools import: the same payload/Verdict shape spn-core defines, the behaviour-register contract both tools read and write, and the source-reading helpers a write-time check needs. | 🔮 |
| [spn-apps-ts/hooks/tools.md](spn-apps-ts/hooks/tools.md) | `plugins/spn-apps-ts/hooks/tools/` | The two commands run by name against a TS-stack repository: the published action surface and what claims it, and the writer that puts a run's own finding into a behaviour row's Status and Updated at cells. | 🔮 |
| [spn-apps-ts/refs.md](spn-apps-ts/refs.md) | `plugins/spn-apps-ts/refs/` | The one file this plugin restates on its own: the PLAN stage's TS · APPS layer, loaded by spn-core's plan skill rather than duplicated inside it. | 🔮 |
| [spn-apps-ts/skills.md](spn-apps-ts/skills.md) | `plugins/spn-apps-ts/skills/` | The five TS-stack verb skills — new, implement, review, run, verify — realizing the apps command group's build steps for a SaaS Plane TypeScript repository. | 🔮 |
| [spn-core/agents.md](spn-core/agents.md) | `plugins/spn-core/agents/` | The four agent briefs spn-core ships — one fixed engineering persona, one lens-parameterized reviewer, and the rewrite/review pair this workstream itself convenes. | 🔮 |
| [spn-core/hooks/checks.md](spn-core/hooks/checks.md) | `plugins/spn-core/hooks/checks/` | The individual rules pretooluse.ts composes — each one a check restating one chapter of the foundation book, returning a Verdict rather than printing and exiting on its own. | 🔮 |
| [spn-core/hooks/events.md](spn-core/hooks/events.md) | `plugins/spn-core/hooks/events/` | The four scripts wired in spn-core's hooks.json, one per runtime moment the Claude Code harness calls into: SessionStart, PreToolUse, PostToolUse, Stop. | 🔮 |
| [spn-core/hooks/lib.md](spn-core/hooks/lib.md) | `plugins/spn-core/hooks/lib/` | The shared code every event, check and tool imports rather than reimplements — the payload and Verdict shapes, the figure drawer, the page renderer, the restates-block parser, and the timing writer. | 🔮 |
| [spn-core/hooks/tools.md](spn-core/hooks/tools.md) | `plugins/spn-core/hooks/tools/` | The five commands run by name rather than fired by an event — the corpus audit, the cross-repo drift check, the corpus-against-itself check, the partner-shape proof, and the prose triage. | 🔮 |
| [spn-core/refs.md](spn-core/refs.md) | `plugins/spn-core/refs/` | spn-core's own restatements — the stack-agnostic vocabulary, the corpus standard, the cross-repo protocol, the review lenses — each a markdown file a consumer with no book checkout can still read in full. | 🔮 |
| [spn-core/skills.md](spn-core/skills.md) | `plugins/spn-core/skills/` | The eleven stack-agnostic skills spn-core ships, one folder per DevEx-stage verb, each a SKILL.md a session loads once its description matches the ask. | 🔮 |
| [spn-infra/hooks.md](spn-infra/hooks.md) | `plugins/spn-infra/hooks/` | One shell script, wired to every Write and Edit, denying the five ways an estate write can leak a secret or a discovered identifier — conservative by design: unsure means allow. | 🔮 |
| [spn-infra/refs.md](spn-infra/refs.md) | `plugins/spn-infra/refs/` | The estate's own restated vocabulary: the manifest and locator quick reference, the layer-noun and door card, the name and DNS grammar, and the estate laws a module or a declaration must hold to. | 🔮 |
| [spn-infra/skills.md](spn-infra/skills.md) | `plugins/spn-infra/skills/` | The four estate verb skills — declare, plan-review, module-author, release — realizing the infra command group's layer model for a SaaS Plane estate repository. | 🔮 |
<!-- /spn:generated -->
