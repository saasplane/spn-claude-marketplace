# SaaS Plane — Claude Plugin Marketplace

The agent plugins for building on [SaaS Plane](https://saasplane.dev) — the way of working, installable. This repository is both the **source** and the **marketplace**: publishing is pushing it.

## Install

```
/plugin marketplace add <org>/spn-claude-marketplace
```

Then enable what your repository needs (or let `spnutils repo agent-init` derive it from `sprepo.json`):

| Plugin | Serves | Enable in |
| --- | --- | --- |
| `spn-core` | the stage skills including `plan`, the day-zero walk, the SPN engineer persona, the review panel and its lenses, contract and comment rules, the cross-repo protocol, the session orientation and its two split-plan gates | every repo |
| `spn-apps-ts` | the TypeScript stack's verb skills — new · implement · review · run · verify — their step files, and the write-time guards over enablement grammar, host assertions and what proves a change | `APPS` repos claiming `TS` |
| `spn-infra` | the estate verb skills, manifest and naming references, the estate laws, the secrets/ARN deny hook | `INFRA` repos |

The plugins carry the standards in full — they restate the SaaS Plane foundation book and add no rule of their own. What *runs* — the `@saasplane` packages, the platform modules, the blueprint library — is delivered separately through granted registries.

## Layout

```
.claude-plugin/marketplace.json   # the one manifest — hand-kept
plugins/spn-core/                 # source, edited in place
plugins/spn-apps-ts/
plugins/spn-infra/
```

No build step exists. A change is: edit → reload your agent window → test → push.

**A change to a hook script is live on its next run.** A skill, an agent, a ref or a change to
`hooks.json` needs an install and a fresh window, so batch those and install once:

```
claude plugin uninstall spn-core@saasplane --scope project
claude plugin install   spn-core@saasplane --scope project
```

`claude plugin update` will not do it. It compares the version in `plugin.json`, so an in-place edit
to a directory-source plugin reports *already at the latest version* and nothing moves.

## Naming

**An agent carries the `spn-` prefix. A skill does not.** So `spn-panel` and `spn-engineer`, beside
`review` and `implement`. The reason is where each name is read. A skill is a slash command you
type, so a prefix is friction and you type `review` rather than `spn-review`. An agent name is
resolved across every installed plugin, so it has to be unambiguous.

**A ref, a hook script and a lens are named for what they hold**, with no prefix — `doc-sets.md`,
`orientation.py`, `qa.md`. Only the agent name leaves this repository's namespace.
