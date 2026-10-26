<!-- spn:doc
{"id": "spn-surface-capabilities", "variant": "capability", "title": "Capabilities — spn-surface", "lenses": ["UX", "WEB_DEV"], "status": "PLANNING", "summary": "The six constructs of the Surface domain plugin, one chapter each: the plugin, its one hook, its design skill, its scripts, its refs and its tests.", "keywords": ["spn-surface", "capabilities", "hooks", "skills", "refs"]}
-->

# Capabilities — spn-surface

`For: UX designer · Web developer` · `Status: 🔮 PLANNING`

`spn-surface` is what a person sees and touches, made concrete for an agent. It carries no agent briefs and no lenses, because a persona and a reviewing viewpoint are stack-agnostic and live once in `spn-devex`. What it does carry is the Surface refs, the design skill that orders the decisions in them, the one guard that reads a script before the Figma connector runs it, and the proof for each.

## The rest of the domain

| Construct | Realized by |
| --- | --- |
| Plugin · Hook · Loop Events · Checks · Tools · Pages · Skill · Ref · Lenses · Agent | [spn-devex](../../01-devex/plugin-spn-devex/README.md) |
| Stack Checks · Stack Tools · Stack Skills · Stack Refs · Providers | [spn-apps](../../03-apps/plugin-spn-apps/README.md) |
| Estate Guard · Estate Skills · Estate Refs | [spn-infra](../../04-infra/plugin-spn-infra/README.md) |

Source folders, one per chapter: `.claude-plugin/plugin.json` for Plugin · `hooks/hooks.json` for Hooks · `skills/` for Skills · `scripts/` for Scripts · `refs/` for Refs · `tests/` for Tests. This plugin ships no `agents/` and no `providers/`, and the absence is the statement.

<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-plugin.md](01-plugin.md) | `surface-plugin` | How this domain's delivery unit is realized — the manifest that claims its name and describes what it carries, the marketplace entry that names its folder, and the version its first release publishes. | 🔮 |
| [02-hooks.md](02-hooks.md) | `surface-hooks` | One PreToolUse entry narrowed to the Figma connector's script runner, behind which one process reads the script before the call. | 🔮 |
| [03-skills.md](03-skills.md) | `surface-skills` | The one skill a Surface question answers to — the design skill, its stage, and the two steps it reads only where the window holds the connector. | 🔮 |
| [04-scripts.md](04-scripts.md) | `surface-scripts` | Everything this plugin executes — the process behind the wired entry, the connector check, the command line that ships no command, and the shared helpers it imports. | 🔮 |
| [05-refs.md](05-refs.md) | `surface-refs` | What this plugin carries from the foundation book — the Surface standards, patterns, architecture and delivery, and the two folders of specs a page starts from. | 🔮 |
| [06-tests.md](06-tests.md) | `surface-tests` | How this plugin proves itself — one tier, mirrored on its own source, behind a runner that walks and judges on an exit code. | 🔮 |
<!-- /spn:generated -->
