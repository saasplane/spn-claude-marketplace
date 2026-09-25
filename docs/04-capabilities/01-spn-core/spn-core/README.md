<!-- spn:doc
{"id": "spn-devex-capabilities", "variant": "capability", "title": "Capabilities — spn-devex", "lenses": ["ARCHITECT", "SERVER_DEV"], "status": "DONE", "summary": "The ten constructs of the core domain, one chapter each: the plugin that delivers them, the hook frame and the four moments it wires, the checks and tools, the page production, and the skills, refs, lenses and agent briefs a session loads.", "keywords": ["spn-devex", "capabilities", "plugin", "hooks", "skills", "refs", "agents"]}
-->

# Capabilities — spn-devex

`For: Architect · Backend developer` · `Status: ✅ DONE`

`spn-devex` is the stack-agnostic plugin: the one every SaaS Plane repository loads, whatever world it declares. It carries all five instrument kinds — hooks, skills, refs, lenses and agent briefs — and it realizes every construct of this domain, so the ten chapters below are also the complete tour of what a plugin can hold. Two habits show up in every one of them. A rule always belongs to a chapter of the foundation book, and what lives here is the copy that can fire. And nothing refuses on a shape it does not understand: a hook exits zero, a guard allows, and a check that throws is skipped rather than taking the chain down.

| Chapter | What it carries |
| --- | --- |
| [01 — Plugin](01-plugin-set.md) | The manifest, the marketplace row, and the version field that names what is published |
| [02 — Hook](02-hook-set.md) | The wiring, the verdict that is returned rather than printed, and the one process that composes every check |
| [03 — Loop Events](03-loop-events.md) | The four moments: the window opening, a call about to run, a shell command that finished, a turn about to end |
| [04 — Checks](04-checks.md) | Six stack-agnostic checks, each naming the chapter it restates and reading the smallest slice it can |
| [05 — Tools](05-tools.md) | Six commands run by name: the corpus audit, coherence, drift, the partner proof, the prose triage, the row writer |
| [06 — Pages](06-pages.md) | The renderer, the figure drawer, the figure checker, and the rule that a page is never edited by hand |
| [07 — Skill](07-skill-set.md) | Eleven stage skills, one folder each, whose descriptions are written to be matched |
| [08 — Ref](08-ref-set.md) | Eleven restatements, each stamped with the hash of what it last saw |
| [09 — Lenses](09-lenses.md) | Eleven reviewing viewpoints, each naming the one thing it may block |
| [10 — Agent](10-agent-set.md) | Four briefs a session convenes, of which one may write |

## The rest of the domain

Every construct of this domain is realized here. The stack plugins realize their own constructs — see [spn-apps-ts](../../02-spn-apps-ts/spn-apps-ts/README.md) and [spn-infra](../../03-spn-infra/spn-infra/README.md).

Source folders: `hooks/hooks.json` and `hooks/lib/payload.ts` for Hook · `hooks/events/` for Loop Events · `hooks/checks/` for Checks · `hooks/tools/` for Tools · `hooks/lib/render.ts`, `draw.ts` and `figures.ts` for Pages · `skills/` for Skill · `refs/` for Ref · `refs/lenses/` for Lenses · `agents/` for Agent. `hooks/tests/` is proof rather than capability surface, and `.claude-plugin/plugin.json` belongs to the Plugin chapter.

<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-plugin-set.md](01-plugin-set.md) | `plugin-set` | One manifest, one marketplace row, and the only plugin of the three that carries all five instrument kinds — with a version field that names what is published rather than what is being worked on. | ✅ |
| [02-hook-set.md](02-hook-set.md) | `hook-set` | The wiring and the shared shapes every hook in the workspace is built on: a verdict that is returned rather than printed, one process for the whole PreToolUse chain, and an exit code that is always zero. | ✅ |
| [03-loop-events.md](03-loop-events.md) | `loop-events` | The four moments spn-devex wires into — the window opening, a call about to run, a shell command that finished, and a turn about to end — and why only one of them may refuse anything. | ✅ |
| [04-checks.md](04-checks.md) | `checks` | Seven stack-agnostic checks the dispatcher composes, each naming in its own header the chapter it restates, and each carrying a fast path so an ordinary edit pays almost nothing. | ✅ |
| [05-tools.md](05-tools.md) | `tools` | Six commands run by their own path rather than fired by an event — the corpus audit, the corpus against itself, the drift check that crosses into the book, the partner proof, the prose triage, and the writer of the repository's own behaviour rows. | ✅ |
| [06-pages.md](06-pages.md) | `pages` | The renderer that turns a seat file into the page a reader opens, the drawer that measures every figure from its own text, and the checker that treats a connector as a claim. | ✅ |
| [07-skill-set.md](07-skill-set.md) | `skill-set` | Eleven stack-agnostic skills, one folder and one SKILL.md each, whose descriptions are written to be matched against a turn's work rather than browsed by a person. | ✅ |
| [08-ref-set.md](08-ref-set.md) | `ref-set` | Eleven restatements a reader with no book checkout can still read in full, each stamped with the hash of what it last saw, and the one parser two different drift checks share. | ✅ |
| [09-lenses.md](09-lenses.md) | `lenses` | Eleven reviewing viewpoints, each naming the one thing it may block and everything it can only advise, read by name at the moment a panel is convened rather than carried by eleven agents. | ✅ |
| [10-agent-set.md](10-agent-set.md) | `agent-set` | Four briefs a session can convene — one fixed engineering persona, one reviewer parameterized by a lens, and a rewrite and review pair in which only the rewriter is allowed to edit. | ✅ |
<!-- /spn:generated -->
