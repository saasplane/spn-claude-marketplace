<!-- spn:doc
{"id": "spn-surface-capabilities-scripts", "variant": "capability", "title": "Scripts in spn-surface", "lenses": ["WEB_DEV", "ARCHITECT"], "status": "PLANNING", "realizes": ["surface-scripts"], "summary": "Everything this plugin executes — the process behind the wired entry, the connector check, the Surface check, the command line that scans Surface code, and the shared helpers it imports.", "keywords": ["dispatcher", "check", "cli", "support-lib"]}
-->

# Scripts in spn-surface

`For: Web developer · Architect` · `Status: 🔮 PLANNING` · `Realizes: Scripts`

Today the plugin runs two checks, one on a connector script and one on Surface code, and the helpers it needs are shared with the apps plugin rather than copied: the masker, the resulting text of a write and the stack read each have one copy in the shared support folder.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The dispatcher | `packages/plugin-spn-surface/src/scripts/events/pretooluse.ts` | one process behind the entry: keeps the first refusal, joins the advice |
| The connector check | `packages/plugin-spn-surface/src/scripts/checks/figma-connector.ts` | a `use_figma` script read before the call: the unsupported APIs, a page assignment, a notice and a close are refused, and the rest is noted |
| The Surface check | `packages/plugin-spn-surface/src/scripts/checks/subjects.ts` and `packages/plugin-spn-surface/src/providers/ts/scripts/checks/surface.ts` | a `.tsx` write in a web node's `src/` is read by its stack's reader and answered with the notes this write added; the notes are listed in [Hooks in spn-surface](02-hooks.md) |
| The entry | `packages/plugin-spn-surface/src/scripts/cli.ts` | the one command line, dispatching `<group> [<subject>] <action>` to the files under `commands/`; one group is shipped, `check` |
| The scan command | `packages/plugin-spn-surface/src/scripts/commands/check/scan.ts` | `spn-surface check scan [<path>…]` reads whole files, not a write, and prints every Surface note with its line and a count by note; it finds the stack from the first path and calls that stack's reader |
| The launcher and the tiers | `packages/plugin-spn-surface/src/bin/spn-surface` and `packages/plugin-spn-surface/src/tiers.json` | the plugin's bare name on the Bash path, and the permission tier of each group the entry ships, `check` being allowed |
| How a source file is read | `packages/plugin-support-lib/src/lib/source.ts` | masking, and the source as the pending write would leave it; one copy in the shared support folder, imported by this plugin and by spn-apps |
| The stack read | `packages/plugin-support-lib/src/lib/stack.ts` | walks to the nearest `sprepo.json` and returns the declared stack, or nothing; one copy in the shared support folder |
| The payload and verdict shapes | `packages/plugin-support-lib/src/lib/payload.ts` | one copy in the shared support folder, bundled into every plugin that reads a hook payload |
| What a run cost | `packages/plugin-support-lib/src/lib/timing.ts` | written only while the developer has asked for it, and never able to fail a gate |

## Follows the pattern

- The kinds of script, the bundle and the staleness case — [Scripts](../../../02-constructs/01-devex/05-scripts.md)
- The same dispatcher frame with subjects resolved per write — [Scripts in spn-apps](../../03-apps/plugin-spn-apps/04-scripts.md)

## Special handling

### The shared helpers have one copy

**Why** — *a helper two plugins copy is two helpers able to drift*, and a plugin may not read a neighbour's file.
**What** — the masker, the resulting text and the stack read are proven once in the shared folder's own suites, and each plugin imports them by relative path.
**How** — the build copies what a plugin imports into its own bundle, so an installed plugin needs nothing outside its `src/`. `packages/plugin-support-lib/src/lib/`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | the shared support folder | the helpers named above, bundled in | a plugin is a unit of distribution and carries its own libraries |
| publishes | every session that holds the connector | a verdict on each script before it runs | the connector refuses after the call, and this refuses before it |
