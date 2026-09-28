<!-- spn:doc
{"id": "spn-devex-capabilities-provider-set", "variant": "capability", "title": "Provider in spn-devex", "lenses": ["ARCHITECT", "LEAD"], "status": "PLANNING", "realizes": ["provider-set"], "summary": "How the provider shape is realized across the three plugins — which of them carry provider folders, which halves each carries, and why spn-devex itself carries none.", "keywords": ["provider", "instance", "gate", "stack", "cloud"]}
-->

# Provider in spn-devex

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING` · `Realizes: Provider`

`spn-devex` defines the shape and carries no provider folder of its own, because it answers to no stack and no cloud. The two domain plugins carry one folder per realization they serve, and each carries only the halves it has something to put in.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The shape itself | this chapter and [The Provider](../../../02-constructs/01-devex/07-providers.md) | stated once, obeyed by every plugin |
| A stack's skills half | `packages/plugin-spn-apps/src/providers/ts/skills/<skill>/` | the step files an apps skill loads when the node is TypeScript |
| A stack's scripts half | `packages/plugin-spn-apps/src/providers/ts/scripts/checks/` | one file per subject, parsing TypeScript and carrying its rules |
| A cloud's scripts half | `packages/plugin-spn-infra/src/providers/<cloud>/scripts/checks/` | one file per subject, parsing that cloud's manifests and renderings |
| The gates | `skills/<verb>/SKILL.md` · `scripts/checks/<subject>.ts` | stack-free in both plugins; they resolve and dispatch |
| A shared rule body | `scripts/lib/` | a factory parameterized by each instance's own values |

## Follows the pattern

- The two halves, the naming mirror and the `refs/` line — [The Provider](../../../02-constructs/01-devex/07-providers.md)
- What a plugin may hold — [Plugin in spn-devex](01-plugin.md)
- How a gate reaches the loop — [Checks in spn-devex](05-scripts.md)

## Special handling

### `spn-devex` carries no providers, and that is what it means to be stack-agnostic

It loads in every repository whatever that repository declares, so it has no instance to vary by. Defining the shape is its whole part in it.

### `spn-apps` carries both halves, because its instance is the stack

Writing a contract, a service and an entry is a different procedure in a different language, so `implement` resolves its step files per stack. The scripts half parses that language once per write and runs every rule the path admits.

### `spn-infra` carries the scripts half alone

Its instance is the cloud, and the authoring stack does not change with it: an estate declaration is provider-neutral and every rendering is written against the same engine. What differs between clouds is the resource vocabulary, which is a **fact** — so it lives in `refs/support/infra/providers/<cloud>/`, where a reader and a skill both find it. No `skills/` half exists, and none is expected to.

### A provider with nothing to contribute has no folder

A realization a plugin serves in its refs may still carry no provider folder at all. That is the same rule the subject registry already states: until a parser exists there is no folder for it, because a folder that answers teaches a reader it works.

### A rule sits inside the check that runs it

The parse reads the resulting text once per write rather than once per rule, orders the verdict so the first refusal wins and advice never outranks one, and isolates a rule that throws instead of losing the subject with it. Those three are the gate's own contribution and are why the two halves are separate files rather than one.

## Between modules

This construct takes the folder names it mirrors from [The Plugin](../../../02-constructs/01-devex/01-plugin.md), and publishes to the two domain plugins the rule their own capability chapters name when they say which halves they carry.
