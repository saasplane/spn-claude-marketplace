<!-- spn:doc
{"id": "spn-devex-capabilities-plugin-set", "variant": "capability", "title": "Plugin in spn-devex", "lenses": ["ARCHITECT", "LEAD"], "status": "DONE", "realizes": ["plugin-set"], "summary": "One manifest, one marketplace row, and the only plugin of the three that carries all five instrument kinds — with a version field that names what is published rather than what is being worked on.", "keywords": ["plugin", "manifest", "marketplace", "version", "cache", "install"]}
-->

# Plugin in spn-devex

`For: Architect · Engineering leader` · `Status: ✅ DONE` · `Realizes: Plugin`

`spn-devex` realizes every part of the construct: the manifest, the marketplace row that names its folder, and the install that copies it into a session's cache. It is also the widest of the three plugins, holding all five instrument kinds — hooks, skills, refs, lenses and agent briefs — so the folder is where a reader learns what a full plugin looks like. Two things are worth knowing before you open it. **The version field names what is published**, so the number you read is the last release rather than the working tree. And **the description in the manifest is matched, not browsed**: it is long on purpose, because a session decides from those words whether to load the plugin's instruments at all.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The manifest | `plugins/spn-devex/.claude-plugin/plugin.json` | `name`, `version`, `description`, `author` |
| The marketplace entry | `.claude-plugin/marketplace.json` | the repository's own list; the `spn-devex` row names `./plugins/spn-devex` |
| The instrument tree | `plugins/spn-devex/hooks/` · `skills/` · `refs/` · `agents/` | what the folder delivers once installed |

## Follows the pattern

- What a plugin is made of, and what a cache keyed by name and version means — [The Plugin](../../../02-constructs/01-spn-devex/01-plugin-set.md)
- Which plugins a repository is entitled to load — the foundation's `02-delivery.md`

## Special handling

### The version is moved after the release, never before

**Why** — *a cache directory is keyed by the plugin's name and its manifest version*. A plugin edited without moving the number installs over its own published bytes, and nothing on screen says which copy is running.
**What** — `spn-devex` ships at the version its manifest already carries, and the first edit after that release sets the next one. So the field answers *what does the cache hold*, not *what am I building*.
**How** — the number is a hand edit to one field, reviewed like any other line. Read `plugins/spn-devex/.claude-plugin/plugin.json`, then the repository's own `CLAUDE.md` § The count moves after the release.

### Three plugins at three versions, on purpose

**Why** — *`RD.APPS.034` rules lockstep versioning inside an `APPS` repository, and this repository declares `GENERAL`*. Read the wrong rule here and three different numbers look like a defect to be fixed.
**What** — each plugin folder counts on its own, following the Claude marketplace's convention of one version per plugin. `spn-devex` moves when `spn-devex` changes, and the other two do not move with it.
**How** — there is no shared version file and nothing derives one number from another. The three manifests are the three answers: `plugins/*/.claude-plugin/plugin.json`.

### The marketplace file is written by hand and by nothing else

**Why** — *the marketplace row is the only place all three plugins are known together*. A generator would need a source, and the source would be a second list that could disagree with this one.
**What** — `.claude-plugin/marketplace.json` carries one entry per plugin: the name, the relative `source` folder, and a description a listing can show without opening the folder. Nothing writes it.
**How** — the row's `source` is the path an install reads, so a renamed folder is a renamed row in the same edit. Read `.claude-plugin/marketplace.json`.

### An edit changes nothing until the plugin is installed again

**Why** — *a session reads the cache, not the checkout*. The exception is a hook script, which is read from disk on its next run; `hooks.json`, a skill and an agent brief are not.
**What** — changing a `SKILL.md` or the event wiring here has no effect on a running window until the plugin is installed again, and some of it waits for a fresh window after that.
**How** — the instruments and their reload behaviour are the other constructs' subject; what the plugin owns is the boundary. Read the foundation's `02-delivery.md` § When an edit becomes behaviour.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| publishes | spn-apps-ts · spn-infra | the payload and verdict shape, the command vocabulary and the stage skills each stack plugin realizes | a stack plugin supplies the layer, never the vocabulary |
| publishes | every consuming repository | the whole instrument tree, once installed from the marketplace row | the repository's own manifest decides the set; a workspace never types a plugin name |
| takes | spn-foundation | the chapters its refs, hooks and skills restate | a plugin adds no rule of its own |
