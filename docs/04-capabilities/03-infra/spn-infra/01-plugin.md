<!-- spn:doc
{"id": "spn-infra-capabilities-estate-plugin", "variant": "capability", "title": "Plugin in spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "realizes": ["estate-plugin"], "summary": "The estate plugin as a delivery unit — the manifest that names it, the description a session matches against, the version it carries in step with its two siblings, and the construct folders it ships.", "keywords": ["plugin", "manifest", "version", "lockstep", "description", "INFRA"]}
-->

# Plugin in spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE` · `Realizes: Plugin`

`spn-infra` is one folder under `plugins/`, carrying a manifest and the construct folders beneath it. It is the smallest of the three plugins and the narrowest in reach: a session loads it only where the repository it is standing in declares the estate world. **The version is the set's and the identity is this plugin's own** — the number moves with its siblings whether or not anything here changed, and the description belongs to this folder alone.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The manifest | `plugins/spn-infra/src/.claude-plugin/plugin.json` | the name, the version, the description a session matches against, and the author |
| The marketplace entry | `.claude-plugin/marketplace.json` | this plugin's entry: its name, the folder holding it, and a description a listing can show |
| The wiring it ships | `plugins/spn-infra/src/hooks/hooks.json` | the one moment it claims, named against the plugin root |
| The skills it ships | `plugins/spn-infra/src/skills/` | one folder per skill, each holding one `SKILL.md` |
| The scripts it ships | `plugins/spn-infra/src/scripts/` | the dispatcher, the gate and the rule bodies |
| The refs it ships | `plugins/spn-infra/src/refs/support/infra/` | the cards restating the estate's vocabulary, including each cloud's own words |
| The providers it ships | `plugins/spn-infra/src/providers/` | one folder per cloud it carries a write-time parse for |
| The tests it ships | `plugins/spn-infra/tests/` | its own proofs, run by one command |

## Follows the pattern

- The manifest shape, the marketplace file and what an installed copy is — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)
- How the widest of the three folders realizes the same shape — [Plugin in spn-devex](../../01-devex/spn-devex/01-plugin.md)
- The Node shape this folder realizes — source beside a committed build, a shared folder never installed on its own — the foundation's `04-plugins/02-shape.md`

## Special handling

### The folder moved to packages/, and this plugin's own payload and timing are gone

**Why** — *the foundation's `04-plugins/02-shape.md` states a shared folder as the way two plugins hold one copy of a helper instead of two that can quietly drift*, and this plugin's `payload.ts` and `timing.ts` were byte-identical to `spn-apps`'s.
**What** — this plugin's source now sits at `packages/plugin-spn-infra/src/`, moved from `plugins/spn-infra/src/`. Both files were deleted from this plugin's own `scripts/lib/`; this plugin now imports the one copy of each from `packages/plugin-support-lib/src/lib/`, which carries no `package.json` and no name of its own. This plugin never held `kinds.ts`, `register.ts` or `runs.ts` — it ships no register-reading tool — so nothing of those three moves for it.
**How** — by relative path, the way this plugin imports any other file in the checkout: `packages/plugin-spn-infra/src/`, `packages/plugin-support-lib/src/lib/`.

### 🔮 Planned, and further off than its two siblings: a committed build, no commands yet

**Why** — the foundation's `04-plugins/02-shape.md` states the target every plugin here is moving to.
**What** — this plugin gains a committed `dist/` that `hooks.json` will run instead of `src/scripts/events/pretooluse.ts`, with a test that refuses a bundle older than what it was built from — the same as its two siblings. **What it does not gain in this pass is a `cli.ts` or a `commands/` folder**: this plugin ships no `tools/` folder today, only the write-time gate, so there is no flat list of tools for a `<group> <action>` entry to replace yet.
**How** — read the standard chapter before reading anything built against it here.

### The three plugins carry one number

**Why** — *a reader cannot tell three version numbers apart*. The plugins install as one set, by one command, and a session loads whichever of them its repository declares; three different numbers leave nobody able to say whether that is three deliberate versions or one release that half-landed.
**What** — the three carry the same version, and a release moves all three. A plugin with nothing changed in it is released anyway, at the new number.
**How** — the number is written into each manifest, because that is what a Claude marketplace reads, and the increment belongs to the set: after a release, the first edit to any of the three moves all three. `plugins/spn-infra/src/.claude-plugin/plugin.json`.

### The number names what is published

**Why** — *a cache directory is keyed by version*. A plugin edited without an increment installs over its own published bytes, and nothing then says which of the two is running.
**What** — the release happens at the version the plugins already carry, and the count moves afterwards. So the field answers *which bytes are installed* rather than *what am I building*.
**How** — the `version` field of the manifest, moved by the first edit after a release rather than before one.

### The description decides whether the plugin is loaded at all

**Why** — *a description is matched against the work at hand, not browsed by a person*. A short one leaves a session guessing, and a session that guesses wrong loads the wrong standard.
**What** — it states in full what this plugin carries: the skills that change an estate, the cards holding the estate's vocabulary and the naming grammar, the per-cloud material, and the refusal a write meets.
**How** — the marketplace entry carries a second description for a listing, and where the two disagree the manifest is the current side. `plugins/spn-infra/src/.claude-plugin/plugin.json`.

### It loads where a repository declares the estate world

**Why** — *the world is read from the repository, never typed by a workspace*. A plugin set somebody types is a set that drifts from what the repository actually is.
**What** — a repository declaring `INFRA` loads this plugin, which covers the estate repository and the blueprint repository beside it, because both are edited under the estate's laws.
**How** — the consuming repository's own `sprepo.json` is what the derivation reads; nothing in this plugin names a repository.

### No agent brief, and the absence is the statement

**Why** — *an agent brief convenes a reviewer over a change*, and the estate's own review happens against a rendering through the tool's doors rather than against a diff.
**What** — this plugin ships no `agents/` folder. Nothing stands in its place, and no empty folder suggests one is coming.
**How** — the review that does happen is a skill, not a brief. `plugins/spn-infra/src/skills/review/SKILL.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | the marketplace | one entry naming this folder and the description a listing shows | the entry is written by hand, because a generator would need a second list able to disagree with this one |
| takes | spn-devex · spn-apps | the version number the set moves together | one number answers *is this current?* and three only raise it |
| takes | a consuming repository | the declared world that decides this plugin is loaded | a repository answers to what it declares, and a workspace types no plugin name |
| publishes | every estate repository | the estate standard, as a folder a session can load | a rule an agent cannot load is a rule nobody follows |
