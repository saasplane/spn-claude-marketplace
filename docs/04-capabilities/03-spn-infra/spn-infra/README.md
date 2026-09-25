<!-- spn:doc
{"id": "spn-infra-capabilities", "variant": "capability", "title": "Capabilities — spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "summary": "The three constructs of the estate domain, one chapter each: the single guard script wired to every write, the four estate skills, and the four cards that hold the estate's vocabulary.", "keywords": ["spn-infra", "capabilities", "guard", "skills", "refs", "estate"]}
-->

# Capabilities — spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE`

`spn-infra` is the estate world's plugin: one for every estate repository, whatever cloud sits behind it. It is the smallest of the three. Its hook surface is a single shell script rather than a divided tree, it ships no tools and no agent briefs, and its four refs are cards rather than a library. What holds the three chapters together is a boundary the estate itself sets. Nothing here mutates a cloud: the guard refuses, the cards explain, and each skill names the tool's command that does the work through the tool's own doors.

| Chapter | What it carries |
| --- | --- |
| [01 — Estate Guard](01-estate-guard.md) | One script, five clauses, and a direction of failure that allows the call when it cannot understand the input |
| [02 — Estate Skills](02-estate-skills.md) | Four skills: declaring what the estate is, reading a plan, authoring a module, publishing a package |
| [03 — Estate Refs](03-estate-refs.md) | Four cards: the manifests, the layers and doors, the naming grammar, and the laws |

## The rest of the domain

| Construct | Realized by |
| --- | --- |
| Plugin · Hook · Loop Events · Checks · Tools · Pages · Skill · Ref · Lenses · Agent | [spn-devex](../../01-spn-devex/spn-devex/README.md) |
| Stack Checks · Stack Tools · Stack Skills · Stack Refs | [spn-apps-ts](../../02-spn-apps-ts/spn-apps-ts/README.md) |

Source folders: `hooks/hooks.json` and `hooks/scripts/` for Estate Guard · `skills/` for Estate Skills · `refs/` for Estate Refs. This plugin has no `hooks/checks/`, no `hooks/lib/`, no `hooks/tools/` and no `hooks/tests/`; `.claude-plugin/plugin.json` belongs to the Plugin chapter in `spn-devex`.

<!-- spn:generated map — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-estate-guard.md](01-estate-guard.md) | `estate-guard` | A dispatcher wired to every write, running seven named rules over what an estate edit would add, denying the ways one leaks a secret or pins something a driver should discover, and allowing the call on anything it cannot read. | ✅ |
| [02-estate-skills.md](02-estate-skills.md) | `estate-skills` | Four skills for an estate repository — declaring what the estate is, reading a plan before it is approved, authoring a module end to end, and publishing a package — none of which mutates a cloud itself. | ✅ |
| [03-estate-refs.md](03-estate-refs.md) | `estate-refs` | Four cards restating the estate's own vocabulary — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to. | ✅ |
<!-- /spn:generated -->
