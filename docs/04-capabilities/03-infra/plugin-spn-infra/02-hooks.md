<!-- spn:doc
{"id": "spn-infra-capabilities-estate-hooks", "variant": "capability", "title": "Hooks in spn-infra", "lenses": ["INFRA", "TRUST"], "status": "DONE", "realizes": ["estate-hooks"], "summary": "One wiring entry: the moment before a call runs, narrowed to writes and edits, naming this plugin's dispatcher against the plugin root, with an allowance generous enough for a cold run.", "keywords": ["hook", "hooks.json", "PreToolUse", "matcher", "timeout", "plugin root"]}
-->

# Hooks in spn-infra

`For: DevOps / SRE · DevSecOps / Security` · `Status: ✅ DONE` · `Realizes: Hooks`

This plugin's wiring is one entry. Every law it holds is about what a file contains, and the only moment that knowledge can act on is the one before a file is written — so it claims that moment and no other. **The wiring names a script and nothing else**: no rule, no cloud and no file pattern appears in it, which is what lets a rule change be live on its next run while a change to the wiring waits for a reinstall.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The wiring | `packages/plugin-spn-infra/src/hooks/hooks.json` | one `PreToolUse` entry, its matcher, its command and its allowance |
| The command it names | `packages/plugin-spn-infra/src/scripts/events/pretooluse.ts` | the dispatcher, reached through `CLAUDE_PLUGIN_ROOT` rather than through any checkout |
| What the dispatcher resolves | `packages/plugin-spn-infra/src/scripts/checks/subjects.ts` | which subjects judge this write, discovered rather than listed in the wiring |
| The decision it speaks | `packages/plugin-support-lib/src/lib/payload.ts` | the event and verdict shapes, one copy in the shared support folder |
| The proof it fires | `packages/plugin-spn-infra/tests/helpers/harness.mjs` | a real process per case, handed an event and read for its decision |

## Follows the pattern

- The moments, the payload, the verdict returned rather than printed, and the always-zero exit — [Hooks](../../../02-constructs/01-devex/02-hooks.md)
- The plugin that wires four moments across seven tools — [Hooks in spn-devex](../../01-devex/plugin-spn-devex/02-hooks.md)

## Special handling

### One moment, because every law here is about text

**Why** — *a call about to run is the last point a write can still be stopped*. Every later moment arrives after the file exists and can do nothing but comment, and an estate leak found after the fact is expensive.
**What** — one `PreToolUse` entry, and nothing at the window opening, after a command, or before a turn ends. This plugin has nothing to say at any of those.
**How** — the single entry in `packages/plugin-spn-infra/src/hooks/hooks.json`.

### A hook runs a committed bundle, not its source

**Why** — *a fresh process pays for start-up on every call, and type-stripping a TypeScript source is the largest piece of it* — the foundation's `04-plugins/02-shape.md` § *Why a hook runs a bundle* states the general case and the measurements it rests on.
**What** — `hooks.json` names `dist/events/*.mjs`, never `scripts/events/*.ts`. Measured on this machine, 2026-09-28: `PreToolUse` fell from 61 ms to 52 ms — the smaller win of the three plugins, because this hook statically imports less for a bundle to inline than devex's or apps's does.
**How** — `pnpm build:plugins` at the marketplace root rebuilds every plugin once; `pnpm build:plugins:watch` rebuilds on every source change while editing a hook; `spn-devex plugin build` runs the same script from inside any plugin checkout. An edit to a hook's source is not live until the next rebuild — `tests/unit/t-dist-current.mjs` refuses a bundle older than its sources, so an unrebuilt edit fails the suite by name rather than running silently stale. `packages/plugin-spn-infra/src/hooks/hooks.json`.

### The matcher narrows before the command runs

**Why** — *a script deciding for itself whether it cares is a process started for every read and every search*. The narrowing has to happen outside the script to cost nothing.
**What** — the moment is matched to writes and edits, so the harness starts nothing at all for any other call.
**How** — the `matcher` field of the one entry.

### The command is written against the plugin root

**Why** — *a plugin must work wherever it was installed*, and the installed copy sits under a version directory nothing should have to compute.
**What** — the command names `CLAUDE_PLUGIN_ROOT` and the path under it, so the same wiring serves every repository that loads the plugin.
**How** — the `command` field of the one entry; the path it names must not move, or the hook silently stops firing.

### The folder holds the wiring alone

**Why** — *code is filed by what kind of thing it is*, and a wiring file is not code.
**What** — `hooks/` carries `hooks.json` and nothing else. The dispatcher, the gate and the rule bodies live under `scripts/`.
**How** — the wired path leaves the hooks folder immediately, which is why a reader looking for what a refusal says opens the scripts tree. `packages/plugin-spn-infra/src/scripts/`.

### The allowance covers a cold run

**Why** — *a hook the harness gives up on is indistinguishable from a hook that allowed the call*. A timeout is silence, and silence is an allow.
**What** — the declared allowance is large enough that a first run, which imports each cloud's validators, finishes inside it.
**How** — the `timeout` field of the one entry.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | the Claude Code harness | the moment, the matcher vocabulary, and the event handed in on standard input | the shape is the harness's, and this plugin speaks it directly |
| takes | this plugin's scripts | the dispatcher the wiring names, and the verdict it returns | the wiring declares when; the script decides what |
| publishes | every estate repository | one refusal point covering every write and every edit | a leak is caught before the file exists rather than in review |
