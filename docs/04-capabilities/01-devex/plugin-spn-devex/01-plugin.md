<!-- spn:doc
{"id": "spn-devex-capabilities-plugin-set", "variant": "capability", "title": "Plugin in spn-devex", "lenses": ["ARCHITECT", "LEAD"], "status": "DONE", "realizes": ["plugin-set"], "summary": "One manifest, one marketplace row, and the widest of the three folders — with a version field that names what is published rather than what is being worked on.", "keywords": ["plugin", "manifest", "marketplace", "version", "cache", "install"]}
-->

# Plugin in spn-devex

`For: Architect · Engineering leader` · `Status: ✅ DONE` · `Realizes: Plugin`

`spn-devex` realizes every part of the construct: the manifest, the marketplace row that names its folder, and the install that copies it into a session's cache. It is also the widest of the three plugins, holding every construct of this domain except `providers/`, so the folder is where a reader learns what a full plugin looks like. Two things are worth knowing before you open it. **The version field names what is published**, so the number you read is the last release rather than the working tree. And **the description in the manifest is matched, not browsed**: it is long on purpose, because a session decides from those words whether to load the plugin at all.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The manifest | `packages/plugin-spn-devex/src/.claude-plugin/plugin.json` | `name`, `version`, `description`, `author` |
| The marketplace entry | `.claude-plugin/marketplace.json` | the repository's own list; the `spn-devex` row names `./packages/plugin-spn-devex` |
| What the folder delivers | `packages/plugin-spn-devex/src/` | `hooks/` · `agents/` · `skills/` · `scripts/` · `refs/`, with `tests/` beside them at the plugin's root |
| What a wired path names | `packages/plugin-spn-devex/src/hooks/hooks.json` | a command written against `CLAUDE_PLUGIN_ROOT`, so it resolves inside the installed copy rather than in this checkout |

## Follows the pattern

- What a plugin is made of, and what a cache keyed by name and version means — [The Plugin](../../../02-constructs/01-devex/01-plugin.md)
- Which plugins a repository is entitled to load — the foundation's `02-delivery.md`
- The Node shape this folder realizes — source beside a committed build, one command entry, a shared folder never installed on its own — the foundation's `04-plugins/02-shape.md`

## Special handling

### The folder moved to packages/, and a shared folder now sits beside it

**Why** — *esbuild follows a relative import*, so a helper more than one plugin needs can live once and still end up inside every plugin's own installed copy. Writing it as a package with a name would add machinery — a workspace entry, a second `package.json` — for no reader, so the foundation's `04-plugins/02-shape.md` states it as a plain folder instead, and this plugin is the first to realize that chapter.
**What** — this plugin's source now sits at `packages/plugin-spn-devex/src/`, moved from `packages/plugin-spn-devex/src/`. Three helpers this plugin shared byte-for-byte with `spn-apps` — `kinds.ts`, `register.ts` and `runs.ts` — moved out of this plugin's own `scripts/lib/` into the new `packages/plugin-support-lib/src/lib/`, which carries no `package.json` and no name of its own. This plugin's `payload.ts` and `timing.ts` stayed put rather than joining them: diffed against the copies `spn-apps` and `spn-infra` share, they turned out genuinely different in purpose — this plugin's read the hook's call payload off standard input synchronously and carry the file-walking helpers a dozen of its own checks import, where the shared pair reads it asynchronously and carries a field this plugin's own `emit` never used.
**How** — a source file elsewhere in this plugin that needs a shared helper imports `../../../../plugin-support-lib/src/lib/<name>` by relative path, the same way it would import any other file in the checkout. `packages/plugin-spn-devex/src/`, `packages/plugin-support-lib/src/lib/`.

### A committed build sits beneath the source, reached through one command entry

**Why** — *a hook that pays for type-stripping on every call is a hook somebody eventually stops trusting to be fast*, and a plugin offering sixteen tools by sixteen separate paths is a vocabulary that grows by one every time somebody adds a tool. The foundation's `04-plugins/02-shape.md` states the target every plugin here realizes.
**What** — `src/scripts/` carries one entry, `cli.ts`, dispatching `<group> <action>` to `commands/<group>/<action>.ts` files, and `hooks.json` runs a committed `dist/cli.mjs` and `dist/events/*.mjs` instead of the `.ts` sources. `tests/unit/t-dist-current.mjs` refuses a bundle older than what it was built from, calling the shared harness in `plugin-support-lib`. A hook script stays live on its next run either way; a bundle changes what that means without changing the rule.
**How** — read the standard chapter before reading anything built against it here; a rule this plugin states and the chapter does not is a defect rather than something this plugin does differently.

### The version is moved after the release, never before

**Why** — *a cache directory is keyed by the plugin's name and its manifest version*. A plugin edited without moving the number installs over its own published bytes, and nothing on screen says which copy is running.
**What** — `spn-devex` ships at the version its manifest already carries, and the first edit after that release sets the next one. So the field answers *what does the cache hold*, not *what am I building*.
**How** — the number is a hand edit to one field, reviewed like any other line. Read `packages/plugin-spn-devex/src/.claude-plugin/plugin.json`, then the repository's own `CLAUDE.md` § The count moves after the release.

### Three plugins at three versions, on purpose

**Why** — *`RD.SUPPORT.APPS.034` rules lockstep versioning inside an `APPS` repository, and this repository declares `GENERAL`*. Read the wrong rule here and three different numbers look like a defect to be fixed.
**What** — each plugin folder counts on its own, following the Claude marketplace's convention of one version per plugin. `spn-devex` moves when `spn-devex` changes, and the other two do not move with it.
**How** — there is no shared version file and nothing derives one number from another. The three manifests are the three answers: `packages/plugin-spn-devex/src/.claude-plugin/plugin.json`, and the same path under `packages/plugin-spn-apps/` and `packages/plugin-spn-infra/`.

### The marketplace file is written by hand and by nothing else

**Why** — *the marketplace row is the only place all three plugins are known together*. A generator would need a source, and the source would be a second list that could disagree with this one.
**What** — `.claude-plugin/marketplace.json` carries one entry per plugin: the name, the relative `source` folder, and a description a listing can show without opening the folder. Nothing writes it.
**How** — the row's `source` is the path an install reads, so a renamed folder is a renamed row in the same edit. Read `.claude-plugin/marketplace.json`.

### An edit changes nothing until the plugin is installed again

**Why** — *a session reads the cache, not the checkout*. The exception is a hook script, which is read from disk on its next run; `hooks.json`, a skill and an agent brief are not.
**What** — changing a `SKILL.md` or the event wiring here has no effect on a running window until the plugin is installed again, and some of it waits for a fresh window after that.
**How** — the reload behaviour of each construct is that construct's own subject; what the plugin owns is the boundary. Read the foundation's `02-delivery.md` § When an edit becomes behaviour.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| publishes | spn-apps · spn-infra | the payload and verdict shape, the command vocabulary and the stage skills each domain plugin realizes | a domain plugin supplies the layer, never the vocabulary |
| publishes | every consuming repository | the whole folder, once installed from the marketplace row | the repository's own manifest decides the set; a workspace never types a plugin name |
| takes | spn-foundation | the chapters its refs, scripts and skills restate | a plugin adds no rule of its own |
