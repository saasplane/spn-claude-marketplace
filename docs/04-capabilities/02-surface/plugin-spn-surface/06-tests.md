<!-- spn:doc
{"id": "spn-surface-capabilities-tests", "variant": "capability", "title": "Tests in spn-surface", "lenses": ["QA", "WEB_DEV"], "status": "PLANNING", "realizes": ["surface-tests"], "summary": "How this plugin proves itself — one tier, mirrored on its own source, behind a runner that walks and judges on an exit code.", "keywords": ["tests", "mirror", "runner", "harness"]}
-->

# Tests in spn-surface

`For: Quality engineer · Web developer` · `Status: 🔮 PLANNING` · `Realizes: Tests`

This plugin ships a rule that runs on a person's design file and a skill whose scripts the connector runs, so it owes proof of its own.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The runner | `packages/plugin-spn-surface/tests/run.mjs` | finds every `t-*.mjs` under the folder and judges each on its exit code |
| The harness | `packages/plugin-spn-surface/tests/helpers/harness.mjs` | the plugin root, found once |
| The connector check | `packages/plugin-spn-surface/tests/unit/scripts/checks/t-figma-connector.mjs` | each refusal with its sentence, each note, and the calls that are left alone |
| The design skill's scripts | `packages/plugin-spn-surface/tests/unit/skills/design/` | the scripts that read, align, lay out and update a Figma page |
| The bundle | `packages/plugin-spn-surface/tests/unit/t-bundle-parity.mjs` and `t-dist-current.mjs` | the bundle answers what the source answers, and is not older than its sources |
| The launcher | `packages/plugin-spn-surface/tests/unit/t-launcher.mjs` | the launcher and the tiers file held to the code |

## Follows the pattern

- The tiers a project owes and how its tests are named — the foundation's test chapter
- The same frame for the apps plugin — [Tests in spn-apps](../../03-apps/plugin-spn-apps/07-tests.md)

## Special handling

### A case runs the real process against a throwaway tree

**Why** — *what a session gets is what a process wrote to its output*, not what a function returns when called directly.
**What** — a case sends a real payload on standard input and reads the decision and the reason back out.
**How** — `packages/plugin-spn-surface/tests/unit/scripts/checks/t-figma-connector.mjs`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | this plugin's own scripts | the dispatcher, the check and the entry each suite proves | the plugin's own code owes proof like anything else |
| publishes | this repository's own gates | a verdict a release can be judged on | a plugin that holds others to rules owes proof of its own |
