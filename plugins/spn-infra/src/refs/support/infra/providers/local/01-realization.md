<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/01-realization.md", "seen": "5cfdf4c3" }
  ]
}
-->
# Realization — what local is, and what it binds

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/01-realization.md`. Read this as the restatement; that node governs.

**Local realizes the design of record on one developer machine.** It consumes the same manifests a cloud provider consumes, so it is a realization rather than a second design.

**Local is the realized provider.** A full platform runs locally before it runs anywhere else, which is the local-first rule. Local answers more of the provider contract today than either cloud does.

## Realization is a target, not a command group

**There is one estate surface, and local is its default.** The target that provisions real accounts is `--cloud`, and it is the one asked for by name (`RD.INFRA.018`). There is no separate local command to learn, so what you run on your machine is the command you will run against the estate.

## What it binds

**Local binds nothing, and that is why it names no account.** A `providers` block holds `scm`, `cloud` and `local`; `scm` and `cloud` carry an `mtype`, and `local` never does, because nothing is brought ([packages](../../packages.md)). `LOCAL` never appears in a provider list — it is a command target, never a manifest value.

**What the local entry does carry is a footprint**: the platform's declared domains, its resource worlds, and its modules with their port overrides.

## What each layer renders

| Layer | Realized as | Brought up by |
| --- | --- | --- |
| Organization | the machine's trust bootstrap — the local certificate authority, its one trust prompt, the local resolver, the shared ingress | `spnutils infra organization up` |
| Platform | the platform's container group from the pinned declaration — the engines, plus each installed module's local rendering | `spnutils infra platform up` |
| Environment | **nothing** — the machine is one environment, so no local form exists and targeting it is refused by name | — |
| Deployments | the applications in dev mode — schemas, certificates, the ingress vhost | `spnutils infra app up` |

**Read the environment row as a prohibition rather than a gap.** [`08-environment.md`](08-environment.md) states the refusal.

**Accounts, guardrails and the trust graph are absent, not stubbed.** A local estate does not pretend to have them, so you know precisely which guarantees you hold.

## The boundary

**The local provider provisions infrastructure state, never code.** And it never becomes a place to declare a resource the manifests do not know (`RD.INFRA.001`). A thing that exists only on one machine cannot be promoted.

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default. Cloud mutation goes through the CLI's own doors, and `tofu apply` or `tofu destroy` is never hand-run.
