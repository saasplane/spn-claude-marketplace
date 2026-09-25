<!-- spn:doc
{"id": "spn-apps-ts-capabilities", "variant": "capability", "title": "Capabilities — spn-apps-ts", "lenses": ["SERVER_DEV", "WEB_DEV"], "status": "DONE", "summary": "The four constructs of the TypeScript stack domain, one chapter each: the write-time checks, the two register tools, the five skills, and the single planning layer a stack-agnostic skill loads.", "keywords": ["spn-apps-ts", "capabilities", "checks", "tools", "skills", "refs"]}
-->

# Capabilities — spn-apps-ts

`For: Backend developer · Web developer` · `Status: ✅ DONE`

`spn-apps-ts` is the apps world made concrete for TypeScript. It carries no agent briefs and no lenses, because a persona and a reviewing viewpoint are stack-agnostic and live once in `spn-devex`. What it does carry is everything that can only be said about this stack: the patterns its contract, service and test layers must hold to, the tools that read its behaviour registers, the five skills that build in it, and the one planning layer the stack-agnostic planning skill reads. The absence that shapes the set is planning itself, which is a `spn-devex` skill and never duplicated here.

| Chapter | What it carries |
| --- | --- |
| [01 — Stack Checks](01-stack-checks.md) | Six write-time checks behind one dispatcher, reading a source file with the pending write already applied |
| [02 — Stack Tools](02-stack-tools.md) | The action surface measured against what claims it, and the writer of two cells in a behaviour row |
| [03 — Stack Skills](03-stack-skills.md) | Five skills, one of them divided into seven ordered steps in contract-first order |
| [04 — Stack Refs](04-stack-refs.md) | One file: the planning layer for an `APPS` and TypeScript node |

## The rest of the domain

| Construct | Realized by |
| --- | --- |
| Plugin · Hook · Loop Events · Checks · Tools · Pages · Skill · Ref · Lenses · Agent | [spn-devex](../../01-spn-devex/spn-devex/README.md) |
| Estate Guard · Estate Skills · Estate Refs | [spn-infra](../../03-spn-infra/spn-infra/README.md) |

Source folders: `hooks/checks/` for Stack Checks · `hooks/tools/` for Stack Tools · `skills/` for Stack Skills · `refs/` for Stack Refs. `hooks/lib/` is shared code the checks and tools import and is covered in the chapter that uses each file; `hooks/tests/` is proof rather than capability surface; `.claude-plugin/plugin.json` belongs to the Plugin chapter in `spn-devex`.

<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-stack-checks.md](01-stack-checks.md) | `stack-checks` | Six write-time checks for the TypeScript stack behind one dispatcher, reading a source file with its comments masked and the pending write already applied, so each can answer whether this edit introduced the pattern. | ✅ |
| [02-stack-tools.md](02-stack-tools.md) | `stack-tools` | Two commands over one behaviour register — the published action surface measured against what claims it, and the writer that puts what the last run found into two cells and touches nothing else. | ✅ |
| [03-stack-skills.md](03-stack-skills.md) | `stack-skills` | Five skills for a TypeScript repository, one of them large enough to divide into seven ordered step files, and a deliberate absence where planning would be. | ✅ |
| [04-stack-refs.md](04-stack-refs.md) | `stack-refs` | One file: the planning layer for an APPS and TypeScript node, written as reference material a stack-agnostic skill loads rather than as a skill of its own. | ✅ |
<!-- /spn:generated -->
