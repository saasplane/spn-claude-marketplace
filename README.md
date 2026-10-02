# SaaS Plane — Claude Plugin Marketplace

The agent plugins for building on [SaaS Plane](https://saasplane.dev) — the way of working, installable. This repository is both the **source** and the **marketplace**: publishing is pushing it.

## Install

```
/plugin marketplace add <org>/spn-claude-marketplace
```

Then enable what your repository needs (or let `spnutils repo agent-sync` derive it from `sprepo.json`):

| Plugin | Serves | Enable in |
| --- | --- | --- |
| `spn-devex` | the stage skills including `plan`, the day-zero walk, the SPN engineer persona, the review panel and its lenses, contract and comment rules, the cross-repo protocol, the session orientation and its two split-plan gates | every repo |
| `spn-apps` | the apps skills — new · implement · review · run · verify · release · design — their step files, and the write-time guards over enablement grammar, host assertions and what proves a change | `APPS` repos claiming `TS` |
| `spn-infra` | the estate skills, manifest and naming references, the estate laws, the secrets/ARN deny hook | `INFRA` repos |

The plugins carry the standards in full — they restate the SaaS Plane foundation book and add no rule of their own. What *runs* — the `@saasplane` packages, the platform modules, the blueprint library — is delivered separately through granted registries.

## Layout

```
.claude-plugin/marketplace.json   # the one manifest — hand-kept
package.json                       # the root build: esbuild and Tailwind, dev-only, never installed
scripts/build-plugins.mjs          # bundles each plugin's cli.ts and events/*.ts into dist/
scripts/build-styles.mjs           # builds the shared page stylesheet from its Tailwind source
public/assets/docs/<version>/      # the page styles as served by GitHub Pages; a version never changes
packages/plugin-spn-devex/         # source, edited in place
packages/plugin-spn-apps/
packages/plugin-spn-infra/
packages/plugin-support-lib/       # helpers two or more plugins share — a plain folder, never installed
```

A hook runs the committed `dist/`, never `src/scripts/` directly. **A source edit needs a rebuild
before it is live**:

```
pnpm run build:plugins            # or build:plugins:watch while you work
```

Then reload your agent window → test → push. A change is: edit → rebuild → reload → test → push.

**A skill, an agent, a ref, or a change to `hooks.json` or `dist/` needs an install and a fresh
window**, so batch those and install once:

```
claude plugin uninstall spn-devex@saasplane --scope project
claude plugin install   spn-devex@saasplane --scope project
```

`claude plugin update` will not do it. It compares the version in `plugin.json`, so an in-place edit
to a directory-source plugin reports *already at the latest version* and nothing moves.

## Naming

**An agent carries the `spn-` prefix. A skill does not.** So `spn-panel` and `spn-engineer`, beside
`review` and `implement`. The reason is where each name is read. A skill is a slash command you
type, so a prefix is friction and you type `review` rather than `spn-review`. An agent name is
resolved across every installed plugin, so it has to be unambiguous.

**A ref, a hook script and a lens are named for what they hold**, with no prefix — `doc-sets.md`,
`orientation.ts`, `qa.md`. Only the agent name leaves this repository's namespace.
