<!-- spn:doc
{"id": "spn-surface-capabilities-hooks", "variant": "capability", "title": "Hooks in spn-surface", "lenses": ["ARCHITECT", "UX"], "status": "PLANNING", "realizes": ["surface-hooks"], "summary": "One PreToolUse entry narrowed to the Figma connector's script runner, behind which one process reads the script before the call.", "keywords": ["hook", "hooks.json", "PreToolUse", "connector", "dispatcher"]}
-->

# Hooks in spn-surface

`For: Architect · UX designer` · `Status: 🔮 PLANNING` · `Realizes: Hooks`

The wiring of this plugin is one file declaring one entry. It claims the moment a call is about to run, narrowed to the Figma connector's script runner, and names one command. **The one rule this plugin holds is about what a connector script says**, so there is no other moment worth claiming.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `packages/plugin-spn-surface/src/hooks/hooks.json` | one `PreToolUse` entry, its matcher, its command and its time budget |
| The matcher | the `matcher` field of that entry | `mcp__figma__use_figma`, and nothing else |
| The command | the `command` field of that entry | the one process, addressed through the plugin root rather than through this checkout |
| The dispatcher | `packages/plugin-spn-surface/src/scripts/events/pretooluse.ts` | hands the call to the connector check, keeps its verdict, and never lets a check that throws take the chain down |
| The connector check | `packages/plugin-spn-surface/src/scripts/checks/figma-connector.ts` | refuses a `use_figma` script that calls an API the connector does not support or one that throws there, and notes a second page switch and a missing `skillNames` |

## Follows the pattern

- The moments a session offers, the payload, the verdict and the always-zero exit — [Hooks](../../../02-constructs/01-devex/02-hooks.md)
- The same frame across several moments and a wider tool set — [Hooks in spn-devex](../../01-devex/plugin-spn-devex/02-hooks.md)

## Special handling

### A hook runs a committed bundle, not its source

**Why** — *a fresh process pays for start-up on every call, and type-stripping a TypeScript source is the largest piece of it* — the foundation's `04-plugins/02-shape.md` § *Why a hook runs a bundle* states the general case.
**What** — `hooks.json` names `dist/events/*.mjs`, never `scripts/events/*.ts`.
**How** — `node scripts/build-plugins.mjs plugin-spn-surface` rebuilds this plugin; `tests/unit/t-dist-current.mjs` refuses a bundle older than its sources, and `t-bundle-parity.mjs` requires the bundle and the source to answer the same. `packages/plugin-spn-surface/src/hooks/hooks.json`.

### The narrowest wiring this plugin could have

**Why** — *a moment claimed for symmetry is a start-up paid on every call in a session*, for an answer nobody asked for.
**What** — one moment, narrowed to the connector's `use_figma`. Everything else a session does never reaches this plugin at all.
**How** — the harness applies the matcher before any process of this plugin's starts, so the filter is free. `packages/plugin-spn-surface/src/hooks/hooks.json`.

### The check refuses only what the text shows

**Why** — *a word inside a comment or a string is not a call*.
**What** — comment and string bodies are blanked before the script is read, a refusal names the API and what to do instead, and what the text cannot settle is a note that lets the call go.
**How** — `packages/plugin-spn-surface/src/scripts/checks/figma-connector.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex | the payload and verdict shapes, imported from the shared support folder | the plugins install and version separately |
| publishes | every session that holds the Figma connector | one refusal or one piece of advice per script, within a stated budget | the rule is asked on every call rather than remembered |
