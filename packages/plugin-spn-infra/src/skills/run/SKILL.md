<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "636d41f6"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/04-develop.md",
      "seen": "18cab28c"
    }
  ]
}
-->
---
name: run
description: Realize the estate - bring a layer up, take it down, read its status, and register an app into the local realization. Use when the ask is to start, stop, restart or check the local stack, to stand a cloud layer up, or to bootstrap an app's schemas, certificates and ingress. Not for reading a plan back before an apply (review skill) and not for the validate and test gates (verify skill).
---

# run — layers as nouns, local by default

**The layers are nouns and they come up in order** — `organization` → `platform` → `environment`, with `app` registered on top of a running local platform. A lower layer missing is the usual reason a higher one will not start. The estate model behind these commands is `refs/support/infra/shape.md`, in this plugin; read it rather than reasoning from the command names.

## Two flags decide everything

- **`--local` is the default; `--cloud` is never implicit.** The target that provisions real accounts must be named.
- **Every `up` and `down` names its mode, and there is no default** (RD.SUPPORT.INFRA.094). Say exactly one of `--plan` or `--apply`. Naming neither, or both, is refused. A command that plans when you forget a flag is a command doing another command's job.
- **A cloud apply also takes `--approve`** — deliberately not the default.

Run `--plan` first, hand the output to the `review` skill, and only then `--apply`.

## The commands

```text
spnutils infra organization up   [--cloud] --plan|--apply [--approve] [--json] [--reset-certs]
spnutils infra organization down [--cloud] --plan|--apply [--approve] [--clean]
spnutils infra organization status [--cloud] [--json]
spnutils infra organization trust-ca

spnutils infra platform up   <spc> [--cloud] --plan|--apply [--approve] [--json]
spnutils infra platform down <spc> [--cloud] --plan|--apply [--approve] [--clean]
spnutils infra platform status <spc> [--cloud] [--json]

spnutils infra environment up   <spc> <env> --cloud --plan|--apply [--approve] [--json]
spnutils infra environment down <spc> <env> --cloud --plan|--apply [--approve] [--clean]
spnutils infra environment status <spc> <env> --cloud [--json]

spnutils infra app up   <package>
spnutils infra app down <package> [--clean]
```

**A platform-scoped command names its platform first, as an argument** (`RD.DEVEX.UTILS.072`): `<spc>` comes straight after the verb, and `<env>` after it. No environment entry selects a platform. The organization layer takes none, because a repository has at most one organization. In an apps repository the `<spc>` is checked against the `sprepo.json` pin, and one that differs is refused.

| Noun | Locally | In the cloud |
| --- | --- | --- |
| `organization` | the machine's trust bootstrap — the CA, its one trust prompt, the shared ingress | accounts, root guardrails, registry pairs, zones |
| `platform` | the container group — engines plus each module's local rendering; converges the org-local prerequisites first | containers, workload accounts, policies, zone, instruments |
| `environment` | **no local form exists** — the machine is one environment, and targeting it locally is refused by name | network → resources → compute, in order |
| `app` | the app's derived converge — schemas, certificates, a hosts entry, the ingress vhost | — deploys ride the pipeline |

`--reset-certs` belongs to the local `organization up` and is for one situation: the machine CA was lost. `trust-ca` trusts that CA in the system keychain on its own — what `up` already does as part of its bootstrap.

## Down never takes the data

**A layer operation never destroys a stateful resource.** `down` removes network and compute and refuses the data. Destroying data is a separate act: `--clean` takes the volumes and the rendered stack locally, and the stateful resources in the cloud. Run it only on an explicit instruction against a named target — never as part of a restart, and never to clear a failure you have not diagnosed.

`app down --clean` is the narrow form: it also removes the app's certificates.

## Reading what is running

```text
spnutils infra show <spc> [--json]                  # which declaration reaches here, and PINNED @ version per layer
spnutils infra platform status <spc> [--cloud]      # what is running; organization status takes no <spc>
spnutils infra logs <spc> [service] [--cloud]       # tail the realization, optionally one service
```

When a layer will not come up, `show` first: a path ref that resolves on one machine and not in CI, or a pin that is not what you thought, explains more failures than the logs do.

## Never

**`tofu apply` and `tofu destroy` are never hand-run.** Cloud mutation goes through these commands, which carry the plan gate, the approval gate and the tag set. A hand-run apply has none of them.

## Hand-off

`review` for the plan's verdict before any apply; `verify` for the validate and test gates; `implement` when the run revealed a declaration that is wrong.
