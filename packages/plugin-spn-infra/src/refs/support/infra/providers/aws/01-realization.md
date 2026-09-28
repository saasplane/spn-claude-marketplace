<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/01-realization.md", "seen": "d25a3dd7" }
  ]
}
-->
# Realization — what AWS renders today, and what it binds

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/01-realization.md`. Read this as the restatement; that node governs.

**The AWS provider renders one estate declaration into real cloud accounts.** It is a realization of the design, never a second design. It reads the same manifests the local provider reads, and adds only the choices AWS itself makes concrete.

## What is real today, and what is not

**Today the estate reaches AWS through the manual-minimum path.** The steps in [`02-ground.md`](02-ground.md) walk a person from zero to a working control center by hand, and they stay deliberately small.

**The automated realization is planned rather than built.** `spnutils infra <layer> --cloud` will drive the blueprint layers from the declarations. Until it exists, every cloud change is a human act that a runbook records.

**So do not tell a partner that a cloud `up` will work.** It is a planned surface, and the honest answer is the runbook.

## The layers, and the state of each

| Layer | What it renders | State |
| --- | --- | --- |
| `GROUND` | validates what the company brought, and discovers its coordinates | 🔮 planned |
| `ORGANIZATION` | the AWS Organization, its OUs, accounts, guardrails and the output store | 🔮 planned |
| `PLATFORM` | one platform's estate — accounts, runners, zones, certificates, observability | 🔮 planned |
| `ENVIRONMENT` | one environment — the network, then the resources, then the compute, in that order | 🔮 planned |
| `DEPLOYMENTS` | what actually runs. **Apps register through `infra app`, and never get a layer noun of their own** | 🔮 planned |

## What AWS binds

**A cloud realization binds the estate to things that outlive any single run**, and those bindings are what a local realization has none of.

| Binding | What it is | Established by |
| --- | --- | --- |
| Accounts | the management account and the platform's member accounts, each reached by id rather than by name | [`06-organization.md`](06-organization.md) |
| Root guardrails | tag and control policies at the organization root, so no member account can opt out of them | [`06-organization.md`](06-organization.md) |
| Registry pairs | the image registry and the package registry in the control center, read by every workload account | [`07-platform.md`](07-platform.md) |
| Zones | the public zone for the platform's domain and its `internal.` counterpart, each with one wildcard certificate | [`07-platform.md`](07-platform.md) |
| Tenant edge | one distribution answering `*.{spd}` for every environment, and the one route store every distribution reads | [`07-platform.md`](07-platform.md) |

**Each of these values is discovered rather than typed.** The run that creates a binding publishes it to the parameter registry, and later runs read it from there. The exception is the short list of values [`02-ground.md`](02-ground.md) records, which exist before any tool does.

## What holds whatever the tooling is

**The manifests are the only declaration.** Nothing is configured by editing a console and writing it down afterwards. Where a runbook makes something by hand, **the runbook that did it is what records it**.

**Naming, addressing and tag grammar belong to the design chapters, not to AWS.** This folder applies them and does not decide them. A rule here that contradicts a design chapter is a defect in this folder.

## Before you run anything

**A provisioning run always names its own mode.** `up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default. A cloud `--apply` also takes `--approve`. **Estate caution stands**: `tofu apply` and `tofu destroy` are never hand-run, against any account.
