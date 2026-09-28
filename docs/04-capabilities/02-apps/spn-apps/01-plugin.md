<!-- spn:doc
{"id": "spn-apps-capabilities-plugin", "variant": "capability", "title": "Plugin in spn-apps", "lenses": ["ARCHITECT", "LEAD"], "status": "DONE", "realizes": ["apps-plugin"], "summary": "How this domain's delivery unit is realized — the manifest that claims its name and describes what it carries, the marketplace entry that names its folder, and the version it shares with every other plugin here.", "keywords": ["plugin", "manifest", "marketplace", "version", "description"]}
-->

# Plugin in spn-apps

`For: Architect · Engineering leader` · `Status: ✅ DONE` · `Realizes: Plugin`

`spn-apps` is one folder under `plugins/`, and everything this domain ships sits inside it. Two facts about that folder pull in opposite directions and both matter. **Its description is its own**, because it is what a session matches the work at hand against, and material nothing matches is material nothing reaches. **Its version is not its own**: every plugin in this marketplace carries the same number, and a release moves all of them together.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The manifest | `plugins/spn-apps/src/.claude-plugin/plugin.json` | the name, the version, the description and the author |
| The description | the `description` field of that manifest | the apps domain stated before any language is chosen, matched against the work at hand |
| The version | the `version` field of that manifest | the number saying which bytes are published, shared with the other plugins |
| The marketplace entry | `.claude-plugin/marketplace.json` | the name, the source folder, and a description a listing can show without opening the folder |
| What the folder holds | `plugins/spn-apps/src/` | wiring, skills, scripts, refs, providers and tests — and no agents |
| What a wired path names | `plugins/spn-apps/src/hooks/hooks.json` | a command written against `CLAUDE_PLUGIN_ROOT`, so it resolves inside the installed copy rather than in this checkout |

## Follows the pattern

- The manifest's shape, the marketplace list, the installed copy and the plugin root — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)
- How the same three files behave for the widest of the plugins — [Plugin in spn-devex](../../01-devex/spn-devex/01-plugin.md)

## Special handling

### The description is long deliberately, because it is matched rather than read

**Why** — *a session reaches a plugin's material by matching this text against the work at hand*. A short description reads better and matches less, and material nothing matches is material nothing reaches.
**What** — the description states what this plugin carries: the contract model a module publishes, the rules a contract state follows, and the worksheet a partner fills in to decide which shipped modules they adopt.
**How** — it names those things in the words somebody would use for the work, rather than in the words the folder structure uses. `plugins/spn-apps/src/.claude-plugin/plugin.json`.

### The version is shared, and the marketplace's own rule is why

**Why** — *a reader cannot tell three numbers apart*. The plugins install as one set by one command, so differing numbers cannot be told from one release that half-landed — which is exactly what it looked like on 2026-09-22, when one plugin was declared at a new version and the workspace was running the previous one for all three.
**What** — every plugin here carries the same number, and a plugin with no change in it is released anyway at the new number. The cost is releasing something that did not change, which costs nothing.
**How** — the number is written into each manifest rather than stamped at publish, because that is what a Claude marketplace reads. The marketplace's own `CLAUDE.md` § Versioning states the rule.

### The count moves after the release

**Why** — *a cache directory is keyed by version*, so a plugin edited without an increment installs over its own published bytes and nothing tells a reader which of the two is running.
**What** — the release happens at the number the manifests already carry, and the first edit after it moves the number. The field names what is published.
**How** — this is the whole of what makes a stale cache findable, and it is why an edit in this checkout is never yet a change in behaviour.

### This plugin ships no agents, and the absence is deliberate

**Why** — *a persona and a reviewing viewpoint answer to no stack*. Duplicating them per domain would put the same brief in three folders able to disagree.
**What** — the agent briefs and the lenses they are handed live once, in the core plugin.
**How** — there is no folder standing empty here to look complete. A missing folder says what is true; an empty one teaches a reader it works.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the derivation of which plugin set a repository is entitled to load | a workspace never types a plugin name |
| takes | spn-claude-marketplace | the lockstep version rule and the marketplace entry naming this folder | the plugins install as one set |
| publishes | every repository declaring the apps world | everything the folders below it carry | a standard that cannot be loaded cannot be followed |
