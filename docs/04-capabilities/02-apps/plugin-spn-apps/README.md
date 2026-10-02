<!-- spn:doc
{"id": "spn-apps-capabilities", "variant": "capability", "title": "Capabilities — spn-apps", "lenses": ["SERVER_DEV", "WEB_DEV"], "status": "DONE", "summary": "The four constructs of the TypeScript stack domain, one chapter each: the write-time checks, the two register tools, the five skills, and the single planning layer a stack-agnostic skill loads.", "keywords": ["spn-apps", "capabilities", "checks", "tools", "skills", "refs"]}
-->

# Capabilities — spn-apps

`For: Backend developer · Web developer` · `Status: ✅ DONE`

`spn-apps` is the apps world made concrete for TypeScript. It carries no agent briefs and no lenses, because a persona and a reviewing viewpoint are stack-agnostic and live once in `spn-devex`. What it does carry is everything that can only be said about this stack: the patterns its contract, service and test layers must hold to, the tools that read its behaviour registers, the five skills that build in it, and the one planning layer the stack-agnostic planning skill reads. The absence that shapes the set is planning itself, which is a `spn-devex` skill and never duplicated here.

| Chapter | What it carries |
| --- | --- |
| [01 — Stack Checks](04-scripts.md) | Six write-time checks behind one dispatcher, reading a source file with the pending write already applied |
| [02 — Stack Tools](04-scripts.md) | The writer of two cells in a behaviour row, the join and proof checks over the rows, and the tests measurement |
| [03 — Stack Skills](03-skills.md) | Five skills, one of them divided into seven ordered steps in contract-first order |
| [04 — Stack Refs](05-refs.md) | One file: the planning layer for an `APPS` and TypeScript node |

## The rest of the domain

| Construct | Realized by |
| --- | --- |
| Plugin · Hook · Loop Events · Checks · Tools · Pages · Skill · Ref · Lenses · Agent | [spn-devex](../../01-devex/plugin-spn-devex/README.md) |
| Estate Guard · Estate Skills · Estate Refs | [spn-infra](../../03-infra/plugin-spn-infra/README.md) |

Source folders, one per chapter: `.claude-plugin/plugin.json` for Plugin · `hooks/hooks.json` for Hooks · `skills/` for Skills · `scripts/` for Scripts — the gate, plus the `lib/` and `tools/` beside it · `refs/` for Refs · `providers/ts/` for Providers, both halves · `tests/` for Tests. This plugin ships no `agents/`, and the absence is the statement.

<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-plugin.md](01-plugin.md) | `apps-plugin` | How this domain's delivery unit is realized — the manifest that claims its name and describes what it carries, the marketplace entry that names its folder, and the version it shares with every other plugin here. | ✅ |
| [02-hooks.md](02-hooks.md) | `apps-hooks` | One PreToolUse entry narrowed to the calls that change a file, behind which a single process resolves what to run from the repository's own declaration — and the measurement that made one entry the design rather than several. | ✅ |
| [03-skills.md](03-skills.md) | `stack-skills` | The skills an apps repository answers to — one folder each, one stage each, the build loop that classifies before it sequences and reads its steps from the provider for the declared stack, the design skill that holds its one step, and the deliberate absence where deciding what a node is would be. | ✅ |
| [04-scripts.md](04-scripts.md) | `stack-checks` | Everything this plugin executes — the gate that resolves a write to the declared stack without naming one, the single process behind the wired entry, the shared reading and hashing both halves use, and the commands run by name over an apps repository's own registers. | ✅ |
| [05-refs.md](05-refs.md) | `stack-refs` | What this plugin carries from the foundation book — one folder per book domain, a leaf complete enough to read with no book beside it, one folder per stack answering the same questions under the same file names, and the one file a command writes. | ✅ |
| [06-providers.md](06-providers.md) | `apps-providers` | One folder for the stack this domain serves, carrying both halves — the build steps and the material a core skill loads, and the two doors whose private rules read this stack's own syntax. | ✅ |
| [07-tests.md](07-tests.md) | `apps-tests` | How this plugin proves itself — one tier, mirrored exactly on its own source, behind a runner that walks and judges on an exit code, and a harness that drives the real scripts against a throwaway tree without counting a single depth. | ✅ |
<!-- /spn:generated -->
