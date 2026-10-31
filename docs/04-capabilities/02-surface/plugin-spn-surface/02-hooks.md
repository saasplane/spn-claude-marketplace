<!-- spn:doc
{"id": "spn-surface-capabilities-hooks", "variant": "capability", "title": "Hooks in spn-surface", "lenses": ["ARCHITECT", "UX"], "status": "PLANNING", "realizes": ["surface-hooks"], "summary": "One PreToolUse entry for the Figma connector's script runner and for a write to Surface code, behind which one process reads the script or the file before the call.", "keywords": ["hook", "hooks.json", "PreToolUse", "connector", "dispatcher"]}
-->

# Hooks in spn-surface

`For: Architect · UX designer` · `Status: 🔮 PLANNING` · `Realizes: Hooks`

The wiring of this plugin is one file declaring one entry. It claims the moment a call is about to run, for the Figma connector's script runner and for a write of a file, and names one command. **The rules this plugin holds are about what a connector script says and what a Surface file shows**, so there is no other moment worth claiming.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `packages/plugin-spn-surface/src/hooks/hooks.json` | one `PreToolUse` entry, its matcher, its command and its time budget |
| The matcher | the `matcher` field of that entry | `mcp__figma__use_figma`, `Write`, `Edit` and `Read`, and nothing else |
| The command | the `command` field of that entry | the one process, addressed through the plugin root rather than through this checkout |
| The dispatcher | `packages/plugin-spn-surface/src/scripts/events/pretooluse.ts` | hands a connector call to the connector check and a `.tsx` write to the Surface check, keeps the verdict, and never lets a check that throws take the chain down |
| The connector check | `packages/plugin-spn-surface/src/scripts/checks/figma-connector.ts` | refuses a `use_figma` script that calls an API the connector does not support or one that throws there, and notes a second page switch and a missing `skillNames` |
| The Surface check's gate | `packages/plugin-spn-surface/src/scripts/checks/subjects.ts` | decides that a write is a `.tsx` file in a web node's `src/`, reads the stack the node's `sprepo.json` declares, and loads that stack's reader; a stack with no reader answers nothing |
| The Surface reader | `packages/plugin-spn-surface/src/providers/ts/scripts/checks/surface.ts` | reads the file as the write would leave it, and gives back only the notes the write added, so an edit beside an old slip says nothing about it |
| The tag reader | `packages/plugin-spn-surface/src/providers/ts/scripts/checks/_surface/jsx.ts` | finds the JSX tags of a file and their attributes, in code, strings, template literals and JSX, and keeps the branches of a condition each tag stands in |
| The notes | `packages/plugin-spn-surface/src/providers/ts/scripts/checks/_surface/notes.ts` | the ten notes on a `.tsx` file below, each naming its book row and the fix |
| The design-guidance note | `packages/plugin-spn-surface/src/scripts/checks/design-guidance.ts` | the eleventh note: reads a Surface ref, a design-system page or a check source, and notes a MUST, a "never" or a refusal attached to how a prop is used |

## The Surface notes

Ten of the notes read named design-system tags and literal values in a `.tsx` file, and stay silent where the deciding fact is not written in the file: a colour from a lookup, a variant left to the place, props that arrive by a spread.

| Note | What it says | Book row |
| --- | --- | --- |
| `badge-kind-look` | an `OUTLINE` badge in a hue other than `DEFAULT` names a kind, and a kind draws `OUTLINE` in `DEFAULT` | `RULE.SUPPORT.SURFACE.368`, `.369` |
| `badge-solid` | a badge is `SOLID` only over a picture | `RULE.SUPPORT.SURFACE.374`, `.378` |
| `custom-no-colour` | `CUSTOM` on a badge needs its `customColor`, and on a button or a mark it draws `DEFAULT` | `RULE.SUPPORT.SURFACE.382`, `.384`, `.385` |
| `button-one-solid` | a view holds one `SOLID` button, its main action, the branches of a condition apart | `RULE.SUPPORT.SURFACE.370` |
| `header-one-main` | a header shows one `PRIMARY` button | `RULE.SUPPORT.SURFACE.390` |
| `header-error-beside-main` | beside a `PRIMARY`, an `ERROR` button in a header is a secondary and takes `DEFAULT` | `RULE.SUPPORT.SURFACE.384`, `.390` |
| `header-secondaries` | a header shows one or two secondary buttons, and the rest stand behind "⋯" | `RULE.SUPPORT.SURFACE.390` |
| `state-hue-table` | a state's hue written in the file differs from the hue table | `RULE.SUPPORT.SURFACE.369` |
| `container-in-container` | a container takes no container or card inside it | `RULE.SUPPORT.APPS.147`, `RULE.SUPPORT.SURFACE.263` |
| `hand-set-look` | a design-system unit takes its colour, padding, radius and gap from its props and the theme, never from a class | `RULE.SUPPORT.APPS.150` |
| `design-guidance` | a MUST, a "never" or a refusal attached to how a prop is used is noted, never refused: a design rule about a prop is guidance, with its cases | `RULE.SUPPORT.SURFACE.398` |

**Every note is advice, and none refuses a write** (`RULE.DEVEX.AGENT.107`). One note is held back from ever refusing: `button-one-solid`. A showcase draws every variant of a button on purpose, so two written `SOLID` buttons in one file can be correct, and the scan of our apps finds that one false note. The other nine notes on a `.tsx` file are held back only until a scan finds no note on correct code. `design-guidance` is advice by design: it names the better way, and the choice stays with whoever writes the page.

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
**What** — one moment, narrowed to the connector's `use_figma` and to a write, an edit or a read of a file; a write that is not a `.tsx` file in a web node's `src/` leaves the dispatcher on a test of its path before anything is read. Every other call a session makes never reaches this plugin at all.
**How** — the harness applies the matcher before any process of this plugin's starts, so the filter is free. `packages/plugin-spn-surface/src/hooks/hooks.json`.

### The connector check refuses only what the text shows

**Why** — *a word inside a comment or a string is not a call*.
**What** — comment and string bodies are blanked before the script is read, a refusal names the API and what to do instead, and what the text cannot settle is a note that lets the call go.
**How** — `packages/plugin-spn-surface/src/scripts/checks/figma-connector.ts`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-devex | the payload and verdict shapes, imported from the shared support folder | the plugins install and version separately |
| publishes | every session that holds the Figma connector | one refusal or one piece of advice per script, within a stated budget | the rule is asked on every call rather than remembered |
| publishes | every session that writes Surface code | the notes a write added, as advice | a slip is cheapest to fix at the moment it is written |
