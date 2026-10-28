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
| The entry | `packages/plugin-spn-surface/src/scripts/cli.ts` | the one command line, dispatching `<group> [<subject>] <action>` to the files under `commands/`; two groups are shipped, `check` and `unit` |
| The scan command | `packages/plugin-spn-surface/src/scripts/commands/check/scan.ts` | `spn-surface check scan [<path>…]` reads whole files, not a write, and prints every Surface note with its line and a count by note; it finds the stack from the first path and calls that stack's reader |
| The unit search | `packages/plugin-spn-surface/src/scripts/commands/unit/find.ts` | `spn-surface unit find <words…> [--json]` names the units whose name or line carries a task's words, best first, eight at most: the core units of `refs/support/surface/construct.snapshot.json` and the components of the symbol index `unit show` reads, each with its package, the member it came from across a workspace, and the core block its name points to. A word matches by its first five letters and one of three letters or fewer is dropped. Words no unit carries exit 1 |
| The unit lookup | `packages/plugin-spn-surface/src/scripts/commands/unit/show.ts` | `spn-surface unit show <Unit> [--json]` prints one unit: its props from `refs/support/surface/construct.snapshot.json`, its usage, its index by value and whether its place sizes it, and its cases with their rules from the unit's restated table in `architecture-components.md` or `architecture-widgets.md`. A unit the snapshot does not hold it prints from the symbol index of the repository it runs in, `.claude/saasplane/spn-symbols.json` else each package's `dist/generated/spn-symbols.json`, or, from a workspace's root, from the merged index of each repository in it, named on the line: its package, its intent line, its props with their defaults, values and descriptions, and the core block its name's last word points to. It names the closest three units of both for a name neither holds |
| The launcher and the tiers | `packages/plugin-spn-surface/src/bin/spn-surface` and `packages/plugin-spn-surface/src/tiers.json` | the plugin's bare name on the Bash path, and the permission tier of each group the entry ships, `check` and `unit` both allowed |
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

### The unit lookup reads only the plugin's own copy

**Why** — *a partner holds the plugin and not the book*, so a lookup that opened the book, a sibling checkout or the machine's home folder would work for a builder and fail for a partner.
**What** — the props, the usage, the index and the units their place sizes come from the snapshot the plugin carries, and the cases from the restated table beside it, because the snapshot keeps only the cases that draw the unit.
**How** — the source in `scripts/commands/unit/` and the bundle in `dist/commands/unit/` both sit three folders under `src/`, so one relative path finds `refs/support/surface/` from either; a test names a fixture folder through `SPN_SURFACE_UNIT_ROOT`, and the shipped use sets nothing. The bundle-parity suite runs it from an installed copy with an empty home.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | the shared support folder | the helpers named above, bundled in | a plugin is a unit of distribution and carries its own libraries |
| takes | the book, through `spnutils apps surface construct --out` at each release | the CONSTRUCT snapshot `unit show` reads | the plugin carries the book's units without the book |
| publishes | every session that holds the connector | a verdict on each script before it runs | the connector refuses after the call, and this refuses before it |
