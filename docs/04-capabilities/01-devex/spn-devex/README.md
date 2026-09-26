<!-- spn:doc
{"id": "spn-devex-capabilities", "variant": "capability", "title": "Capabilities — spn-devex", "lenses": ["ARCHITECT", "SERVER_DEV"], "status": "DONE", "summary": "The ten constructs of the core domain, one chapter each: the plugin that delivers them, the hook frame and the four moments it wires, the checks and tools, the page production, and the skills, refs, lenses and agent briefs a session loads.", "keywords": ["spn-devex", "capabilities", "plugin", "hooks", "skills", "refs", "agents"]}
-->

# Capabilities — spn-devex

`For: Architect · Backend developer` · `Status: ✅ DONE`

`spn-devex` is the stack-agnostic plugin: the one every SaaS Plane repository loads, whatever world it declares. It carries all five instrument kinds — hooks, skills, refs, lenses and agent briefs — and it realizes every construct of this domain, so the ten chapters below are also the complete tour of what a plugin can hold. Two habits show up in every one of them. A rule always belongs to a chapter of the foundation book, and what lives here is the copy that can fire. And nothing refuses on a shape it does not understand: a hook exits zero, a guard allows, and a check that throws is skipped rather than taking the chain down.

| Chapter | What it carries |
| --- | --- |
| [01 — Plugin](01-plugin.md) | The manifest, the marketplace row, and the version field that names what is published |
| [02 — Hook](02-hooks.md) | The wiring, the verdict that is returned rather than printed, and the one process that composes every check |
| [03 — Loop Events](02-hooks.md) | The four moments: the window opening, a call about to run, a shell command that finished, a turn about to end |
| [04 — Checks](05-scripts.md) | Six stack-agnostic checks, each naming the chapter it restates and reading the smallest slice it can |
| [05 — Tools](05-scripts.md) | Six commands run by name: the corpus audit, coherence, drift, the partner proof, the prose triage, the row writer |
| [06 — Pages](05-scripts.md) | The renderer, the figure drawer, the figure checker, and the rule that a page is never edited by hand |
| [07 — Skill](04-skills.md) | Eleven stage skills, one folder each, whose descriptions are written to be matched |
| [08 — Ref](06-refs.md) | Eleven restatements, each stamped with the hash of what it last saw |
| [09 — Lenses](03-agents.md) | Eleven reviewing viewpoints, each naming the one thing it may block |
| [10 — Agent](03-agents.md) | Four briefs a session convenes, of which one may write |

## The rest of the domain

Every construct of this domain is realized here. The domain plugins realize their own constructs — see [spn-apps](../../02-apps/spn-apps/README.md) and [spn-infra](../../03-infra/spn-infra/README.md).

Source folders, one per chapter: `.claude-plugin/plugin.json` for Plugin · `hooks/hooks.json` for Hooks · `agents/` for Agents, with the viewpoint files they are handed in `refs/devex/agent/lenses/` · `skills/` for Skills · `scripts/` for Scripts — `checks/`, `events/`, `tools/` and the `lib/` they share · `refs/` for Refs · `tests/` for Tests. This plugin carries no `providers/`, because it answers to no stack and no cloud; the Providers chapter states the shape the other two obey.

<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-plugin.md](01-plugin.md) | `plugin-set` | One manifest, one marketplace row, and the widest of the three folders — with a version field that names what is published rather than what is being worked on. | ✅ |
| [02-hooks.md](02-hooks.md) | `hook-set` | The four moments this plugin wires and the shared shapes every hook in the workspace is built on: a verdict that is returned rather than printed, one process for the whole call chain, and an exit code that is always zero. | ✅ |
| [03-agents.md](03-agents.md) | `agent-set` | The briefs a session can convene — one fixed engineering persona, one reviewer parameterized by a viewpoint, a rewrite and review pair in which only the rewriter may edit, and the viewpoint files the parameterized one reads by name. | ✅ |
| [04-skills.md](04-skills.md) | `skill-set` | One folder per stack-agnostic DevEx stage, each holding a single SKILL.md whose description is written to be matched against a turn's work rather than browsed by a person. | ✅ |
| [05-scripts.md](05-scripts.md) | `checks` | The stack-agnostic checks the dispatcher composes, the tools reached by their own path, and the library both read — including the renderer, the drawer and the figure checker that produce every page in the workspace. | ✅ |
| [06-refs.md](06-refs.md) | `ref-set` | Eleven restatements a reader with no book checkout can still read in full, each stamped with the hash of what it last saw, and the one parser two different drift checks share. | ✅ |
| [07-providers.md](07-providers.md) | `provider-set` | How the provider shape is realized across the three plugins — which of them carry provider folders, which halves each carries, and why spn-devex itself carries none. | 🔮 |
| [08-tests.md](08-tests.md) | `tests` | How this plugin proves itself — the tier folders it borrows from the TypeScript convention without its framework, the mirror that files a suite where its source sits, and the rule that no suite may count a path depth. | 🔮 |
<!-- /spn:generated -->
