# SaaS Plane — Claude Plugin Marketplace

The agent plugins for building on [SaaS Plane](https://saasplane.dev) — the way of working, installable. This repository is both the **source** and the **marketplace**: publishing is pushing it.

## Install

```
/plugin marketplace add <org>/spn-claude-marketplace
```

Then enable what your repository needs (or let `spnutils repo agent-init` derive it from `sprepo.json`):

| Plugin | Serves | Enable in |
| --- | --- | --- |
| `spn-core` | the stage skills, the SPN engineer persona, the review panel and its ten lenses, contract and comment rules, the cross-repo protocol | every repo |
| `spn-apps-ts` | the TypeScript stack's verb skills — plan · new · implement · review · run · verify — and their step files | `APPS` repos claiming `TS` |
| `spn-infra` | the estate verb skills, manifest and naming references, the estate laws, the secrets/ARN deny hook | `INFRA` repos |

The plugins carry the standards in full — they are digests of the SaaS Plane foundation book and add no rule of their own. What *runs* — the `@saasplane` packages, the platform modules, the blueprint library — is delivered separately through granted registries.

## Layout

```
.claude-plugin/marketplace.json   # the one manifest — hand-kept
plugins/spn-core/                 # source, edited in place
plugins/spn-apps-ts/
plugins/spn-infra/
```

No build step exists. A change is: edit → reload your agent window → test → push.
