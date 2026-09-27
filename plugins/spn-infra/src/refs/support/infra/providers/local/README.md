<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/README.md", "seen": "748562fa" }
  ]
}
-->
# Local — the estate on one machine

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/README.md`. Read this as the restatement; that node governs.

**Local is the realized provider.** A full platform runs on a developer's machine before it runs anywhere else — that is the local-first rule, and it is why local is the default target rather than a simulation of the real one.

## Every entry is answered

| | |
| --- | --- |
| [`01-realization.md`](01-realization.md) | what local is, and what it binds |
| [`02-ground.md`](02-ground.md) | what is brought by hand — nothing |
| [`03-session.md`](03-session.md) | how a run authenticates |
| [`04-addressing.md`](04-addressing.md) | how names and addresses are computed |
| [`05-tagging.md`](05-tagging.md) | how coordinates are rendered — they are not |
| [`06-organization.md`](06-organization.md) | the organization layer |
| [`07-platform.md`](07-platform.md) | the platform layer |
| [`08-environment.md`](08-environment.md) | the environment layer — refused by name |
| [`09-deployments.md`](09-deployments.md) | what actually runs |
| [`10-library.md`](10-library.md) | what the blueprint library ships |
| [`11-conformance.md`](11-conformance.md) | what local must prove |

**Where an entry is negative it says why.** Nothing is tagged on a machine, because a laptop has no billing boundary for a tag to answer for. And the environment layer is refused by name rather than emulated.

## Realization is a target, not a command group

**There is one estate surface and local is its default.** `--cloud` is the target that provisions real accounts, and it is asked for by name. **There is no separate local command to learn**, so what you run on your machine is the command you will run against the estate.

| Layer | What it is, locally | Command |
| --- | --- | --- |
| Organization | the machine's trust bootstrap — the local certificate authority, its one trust prompt, the shared ingress | `spnutils infra organization up` |
| Platform | the platform's container group from the pinned declaration — the engines, plus each installed module's local rendering | `spnutils infra platform up` |
| Environment | **nothing** — the machine is one environment, so no local form exists and targeting it is refused by name | — |
| Deployments | the apps in dev mode — schemas, certificates, a hosts entry, the ingress vhost | `spnutils infra app up` |

**The environment row is a prohibition, not a gap.** Read a dash as a ruling.

## What is absent, and why absent beats stubbed

**Accounts, guardrails and the trust graph do not exist locally — absent, not stubbed.** A local estate does not pretend to have them.

**That is what makes local worth trusting.** A stub answers, so you learn nothing about which guardrail you are relying on until the cloud run refuses you. An absence fails immediately and names itself.

## The boundary

**The local provider provisions infrastructure state, never code.**

**And it never becomes a place to declare a resource the manifests do not know.** A thing that exists only locally is a thing that cannot be promoted, and a promotion path that quietly drops something is worse than one that refuses it.

## Estate caution still applies here

**`up` and `down` each take exactly one of `--plan` or `--apply`, with no default.** Cloud mutation goes through the CLI's own doors. `tofu apply` and `tofu destroy` are never hand-run — the habit is the same on a laptop, because the habit is what carries to the estate.
