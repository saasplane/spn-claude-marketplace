<!-- spn:doc
{"id": "spn-apps-capabilities-hooks", "variant": "capability", "title": "Hooks in spn-apps", "lenses": ["ARCHITECT", "SERVER_DEV"], "status": "DONE", "realizes": ["apps-hooks"], "summary": "One PreToolUse entry narrowed to the calls that change a file, behind which a single process resolves what to run from the repository's own declaration — and the measurement that made one entry the design rather than several.", "keywords": ["hook", "hooks.json", "PreToolUse", "entry", "dispatcher", "timeout"]}
-->

# Hooks in spn-apps

`For: Architect · Backend developer` · `Status: ✅ DONE` · `Realizes: Hooks`

The wiring of this plugin is one file declaring one entry. It claims the moment a call is about to run, narrowed to the two tools that change a file, and names one command. **Every rule this plugin holds is about what a file contains**, so there is no other moment worth claiming: reading a file, running a command or ending a turn cannot introduce a pattern in a contract, a service or a test.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `packages/plugin-spn-apps/src/hooks/hooks.json` | one `PreToolUse` entry, its matcher, its command and its time budget |
| The moment | the `PreToolUse` key of that file | the only moment that may refuse a call, and the only one this plugin claims |
| The matcher | the `matcher` field of that entry | the two tool names that change a file, and nothing else |
| The command | the `command` field of that entry | the one process, addressed through the plugin root rather than through this checkout |
| The dispatcher | `packages/plugin-spn-apps/src/scripts/events/pretooluse.ts` | runs everything behind the entry, keeps the first refusal, joins the advice |
| What it resolves | `packages/plugin-spn-apps/src/scripts/checks/subjects.ts` | the subjects for the stack the nearest manifest declares |

## Follows the pattern

- The moments a session offers, the payload, the verdict and the always-zero exit — [Hooks](../../../02-constructs/01-devex/02-hooks.md)
- The same frame across several moments and a wider tool set — [Hooks in spn-devex](../../01-devex/plugin-spn-devex/02-hooks.md)

## Special handling

### One entry, because the start-ups were nine parts in ten of the cost

**Why** — *separate entries are separate interpreter start-ups on every write*. Measured on 19 September 2026, one ordinary edit cost 1,123 ms across eight entries, of which 1,040 ms was starting programs. The checking itself was about 83 ms.
**What** — the wiring declares one entry, and one process runs the whole chain. Porting the scripts to another language alone would not have collected the saving, because eight entries are still eight start-ups.
**How** — the dispatcher asks each subject that applies and returns one answer. `packages/plugin-spn-apps/src/scripts/events/pretooluse.ts`.

### A hook runs a committed bundle, not its source

**Why** — *a fresh process pays for start-up on every call, and type-stripping a TypeScript source is the largest piece of it* — the foundation's `04-plugins/02-shape.md` § *Why a hook runs a bundle* states the general case and the measurements it rests on.
**What** — `hooks.json` names `dist/events/*.mjs`, never `scripts/events/*.ts`. Measured on this machine, 2026-09-28: `PreToolUse` fell from 50 ms to 23 ms.
**How** — `pnpm build:plugins` at the marketplace root rebuilds every plugin once; `pnpm build:plugins:watch` rebuilds on every source change while editing a hook; `spn-devex plugin build` runs the same script from inside any plugin checkout. An edit to a hook's source is not live until the next rebuild — `tests/unit/t-dist-current.mjs` refuses a bundle older than its sources, so an unrebuilt edit fails the suite by name rather than running silently stale. `packages/plugin-spn-apps/src/hooks/hooks.json`.

### The narrowest wiring this plugin could have

**Why** — *a moment claimed for symmetry is a start-up paid on every call in a session*, for an answer nobody asked for.
**What** — one moment, narrowed to `Write` and `Edit`. Everything else a session does never reaches this plugin at all.
**How** — the harness applies the matcher before any process of this plugin's starts, so the filter is free. `packages/plugin-spn-apps/src/hooks/hooks.json`.

### The budget is declared in the wiring, not trusted to the scripts

**Why** — *a gate that can hang is a gate somebody removes*.
**What** — the entry states how long the whole chain may take.
**How** — the `timeout` field carries it, beside the command it applies to. Same file.

### What runs is resolved per write, never listed

**Why** — *a plugin that listed its rules would need editing for a second stack*, which is the edit the provider shape exists to remove.
**What** — the dispatcher asks a gate that reads the stack from the nearest manifest and imports the provider's own half by a path composed from that declaration.
**How** — a repository declaring a stack this plugin ships no folder for resolves to no subject and is left alone rather than refused. `packages/plugin-spn-apps/src/scripts/checks/subjects.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex | the payload and verdict shapes, copied rather than imported | the plugins install and version separately |
| takes | a repository's own manifest | the stack the subjects are resolved for | a gate never names an instance |
| publishes | every repository declaring the apps world | one refusal or one piece of advice per write, within a stated budget | the rule is asked on every call rather than remembered |
