<!-- spn:doc
{"id": "spn-infra-capabilities", "variant": "capability", "title": "Capabilities — spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "summary": "The three constructs of the estate domain, one chapter each: the single guard script wired to every write, the four estate skills, and the four cards that hold the estate's vocabulary.", "keywords": ["spn-infra", "capabilities", "guard", "skills", "refs", "estate"]}
-->

# Capabilities — spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE`

`spn-infra` is the estate world's plugin: one for every estate repository, whatever cloud sits behind it. It is the smallest of the three. Its hook surface is a single shell script rather than a divided tree, it ships no tools and no agent briefs, and its four refs are cards rather than a library. What holds the three chapters together is a boundary the estate itself sets. Nothing here mutates a cloud: the guard refuses, the cards explain, and each skill names the tool's command that does the work through the tool's own doors.

| Chapter | What it carries |
| --- | --- |
| [01 — Estate Guard](04-scripts.md) | One script, five clauses, and a direction of failure that allows the call when it cannot understand the input |
| [02 — Estate Skills](03-skills.md) | Four skills: declaring what the estate is, reading a plan, authoring a module, publishing a package |
| [03 — Estate Refs](05-refs.md) | Four cards: the manifests, the layers and doors, the naming grammar, and the laws |

## The rest of the domain

| Construct | Realized by |
| --- | --- |
| Plugin · Hook · Loop Events · Checks · Tools · Pages · Skill · Ref · Lenses · Agent | [spn-devex](../../01-devex/spn-devex/README.md) |
| Stack Checks · Stack Tools · Stack Skills · Stack Refs | [spn-apps](../../02-apps/spn-apps/README.md) |

Source folders, one per chapter: `.claude-plugin/plugin.json` for Plugin · `hooks/hooks.json` for Hooks · `skills/` for Skills · `scripts/` for Scripts — the gate, and the `lib/` holding every rule body because each is cloud-free · `refs/` for Refs · `providers/{aws,gcp}/` for Providers, a scripts half only · `tests/` for Tests. This plugin ships no `agents/` and no `scripts/tools/`, and each absence says so.

<!-- spn:generated contents — do not edit inside these markers; `docs.ts face` writes it -->
| Chapter | Realizes | Carries | Status |
| --- | --- | --- | --- |
| [01-plugin.md](01-plugin.md) | `estate-plugin` | The estate plugin as a delivery unit — the manifest that names it, the description a session matches against, the version it carries in step with its two siblings, and the construct folders it ships. | ✅ |
| [02-hooks.md](02-hooks.md) | `estate-hooks` | One wiring entry: the moment before a call runs, narrowed to writes and edits, naming this plugin's dispatcher against the plugin root, with an allowance generous enough for a cold run. | ✅ |
| [03-skills.md](03-skills.md) | `estate-skills` | The skills an estate repository answers to — standing a node up, declaring what the estate is, reading a plan before it is approved, running a layer, proving it, and publishing a package — none of which mutates a cloud | ✅ |
| [04-scripts.md](04-scripts.md) | `estate-guard` | A dispatcher wired to every write, a gate that discovers which clouds judge it, and named rule bodies over what an estate edit would add — denying the ways one leaks a secret or pins something a driver should discover, and allowing the call on anything it cannot read. | ✅ |
| [05-refs.md](05-refs.md) | `estate-refs` | The cards restating the estate's own vocabulary — which file declares what, which layer owns which act, how a name is composed from coordinates, the laws a declaration must hold to, and what each cloud calls the things the model names. | ✅ |
| [06-providers.md](06-providers.md) | `estate-providers` | One folder per cloud, each holding a scripts half and no skills half — the validators a gate dispatches into, the spellings that belong to each cloud, and why the authoring stack rather than the instance decides which halves a provider has. | ✅ |
| [07-tests.md](07-tests.md) | `estate-tests` | How this plugin proves its own gate — a tree filed by tier and then by what a suite proves, a runner that walks, a harness that drives a real process and finds the plugin root once, and the tiers that deliberately do not exist. | ✅ |
<!-- /spn:generated -->
