<!-- spn:doc
{"id": "spn-surface-capabilities-plugin", "variant": "capability", "title": "Plugin in spn-surface", "lenses": ["ARCHITECT", "UX"], "status": "PLANNING", "realizes": ["surface-plugin"], "summary": "How this domain's delivery unit is realized — the manifest that claims its name and describes what it carries, the marketplace entry that names its folder, and the version its first release publishes.", "keywords": ["plugin", "manifest", "version", "description"]}
-->

# Plugin in spn-surface

`For: Architect · UX designer` · `Status: 🔮 PLANNING` · `Realizes: Plugin`

`spn-surface` is one folder under `packages/`, and everything the Surface domain ships sits inside it. **Its description is its own**, because it is what a session matches the work at hand against, and material nothing matches is material nothing reaches.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The manifest | `packages/plugin-spn-surface/src/.claude-plugin/plugin.json` | the name, the version, the description and the author |
| The description | the `description` field of that manifest | the Surface domain stated before any stack is chosen, matched against the work at hand |
| The version | the `version` field of that manifest | `0.1.0`, the number the first release publishes |
| The marketplace entry | .claude-plugin/marketplace.json | the name, the source folder, and a description a listing can show without opening the folder; it sits second, in domain order |
| What the folder holds | `packages/plugin-spn-surface/src/` | wiring, one skill, scripts, refs and tests — and no agents |
| What a wired path names | `packages/plugin-spn-surface/src/hooks/hooks.json` | a command written against `CLAUDE_PLUGIN_ROOT`, so it resolves inside the installed copy rather than in this checkout |

## Follows the pattern

- The manifest's shape, the marketplace list, the installed copy and the plugin root — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)
- The same three files for the apps domain — [Plugin in spn-apps](../../03-apps/plugin-spn-apps/01-plugin.md)
- The Node shape this folder realizes — the foundation's `04-plugins/02-shape.md`

## Special handling

### The build wiring lists this plugin

**Why** — *the one build command bundles every plugin, and one that is missing from its list is never built*
**What** — `scripts/build-plugins.mjs` names `plugin-spn-surface` in its list of plugins, so `node scripts/build-plugins.mjs` builds all four and `node scripts/build-plugins.mjs plugin-spn-surface` builds this one alone.
**How** — the bundle lands in `src/dist/`, committed, and a staleness case refuses a bundle older than its sources. `scripts/build-plugins.mjs`.

### This plugin ships no agents, and the absence is deliberate

**Why** — *a persona and a reviewing viewpoint answer to no stack*. Duplicating them per domain would put the same brief in four folders able to disagree.
**What** — the agent briefs and the lenses they are handed live once, in the core plugin, where the UX and UI lenses are.
**How** — there is no folder standing empty here to look complete. A missing folder says what is true; an empty one teaches a reader it works.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the derivation of which plugin set a repository is entitled to load | a workspace never types a plugin name |
| takes | spn-claude-marketplace | the marketplace entry naming this folder | the plugins install as one set |
| publishes | every repository that builds a page | everything the folders below it carry | a standard that cannot be loaded cannot be followed |
