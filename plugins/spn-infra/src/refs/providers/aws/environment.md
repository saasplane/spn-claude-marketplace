<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/providers/infra/cloud/aws/guides/03-environment.md", "seen": "88c43a3b" }
  ]
}
-->
# Environment up — network, then resources, then compute

**Source of truth:** the foundation's `providers/infra/cloud/aws/guides/03-environment.md`. Read this as the restatement; that node governs.

**The command is `spnutils infra environment <env> up --cloud`.** The environment layer has **no local form** — the machine is one environment, and targeting it locally is refused by name. The runbook behind this names `cinfra env up`, which never shipped.

## The order is what makes it work

**Network, then resources, then compute.** Each act needs the one before it to exist, and running them out of order does not fail cleanly — it half-succeeds and leaves an environment whose state nobody can read.

| | Act | Depends on |
| --- | --- | --- |
| 1 | Coordinates and CIDRs | the declaration alone — **computed, never chosen** |
| 2 | Networks | act 1's addresses, and the two-VPC layout |
| 3 | Cluster, ingress, namespaces | a network to sit in |
| 4 | Data services, and a role per schema | the data VPC, and its endpoints |
| 5 | DNS and certificates | the control center's zones, which this layer writes names into |

**Act 1 computes and does not ask.** If a step here is waiting for somebody to supply a CIDR, the addressing rule has been broken upstream — see `networking.md`.

**A role per schema, not a role per service.** The grant follows the data rather than the caller, so a second service reading the same schema needs no new role and a service reading two schemas holds two.

## What an environment may reach

**Its own pair, and nothing else.** The apps-to-data peering inside the environment is the only route beyond a VPC on day one.

**Environments never talk to each other.** Promotion moves an artifact, not traffic — so a request to connect `uat` to `live` is a request to break the isolation the account tree exists to provide.

## Before you run it

**Estate caution stands.** `up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default. `tofu apply` and `tofu destroy` are never hand-run.
