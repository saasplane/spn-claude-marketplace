<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/04-addressing.md", "seen": "cc974dff" }
  ]
}
-->
# Networking on AWS — computed addresses, two VPCs, and what may reach what

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/04-addressing.md`, which applies the addressing formula the coordinates chapter owns. Read this as the restatement; that node governs.

**Design of record — nothing is provisioned on AWS yet.** The local realization exists; the cloud one is planned.

## Addresses are computed, never chosen

**A bad IP plan does not break anything for years, which is why none of it is typed.** Two teams pick overlapping ranges, nothing breaks for years, and then the day the networks must connect they cannot — and renumbering a live network is not a task anybody gets to schedule.

```text
apps network   10.(16·P + R).(32·E).0/20
data network   10.(16·P + R).(32·E + 16).0/20
```

**Each platform owns a `/12`**, each platform-and-region pair owns one `/16` row, and **row `R = 15` of every platform is reserved** for its control accounts' hub.

**The slot is a number a person appends, never a lookup on the setup name.** An earlier version mapped `dev` to offset 0 and `uat` to 32, which meant a new setup name needed a new mapping somebody had to agree. Appending an index needs nobody's agreement.

Worked through for `P = 0`, region `in` (`R = 0`):

| `{env}` | `E` | apps network | data network |
| --- | --- | --- | --- |
| `in-dev` | 0 | `10.0.0.0/20` | `10.0.16.0/20` |
| `in-live` | 1 | `10.0.32.0/20` | `10.0.48.0/20` |
| `in-uat` | 2 | `10.0.64.0/20` | `10.0.80.0/20` |

**No CIDR appears in any manifest, ticket or spreadsheet.** Add a region or a platform as an appended index and the addresses follow. **If you are about to write a CIDR down, you have found a defect rather than a task.**

## Two VPCs, and the two rules that carry the security

**Every environment is two VPCs** — apps and data. The split exists so the data plane has **no route to the internet at all**.

```text
apps network   10.0.64.0/20                   in-uat
├─ 10.0.64.0/24    public-a      public ALB, NAT gateway
├─ 10.0.65.0/24    public-b      public ALB, NAT gateway
├─ 10.0.66.0/24    private-a     cluster nodes, workloads
├─ 10.0.67.0/24    private-b     cluster nodes, workloads
├─ 10.0.68.0/24    internal-a    internal ALB
└─ 10.0.69.0/24    internal-b    internal ALB

data network   10.0.80.0/20                   in-uat
├─ 10.0.80.0/24    data-a        database, cache, queue
├─ 10.0.81.0/24    data-b        database, cache, queue
├─ 10.0.82.0/24    endpoints-a   VPC endpoints
└─ 10.0.83.0/24    endpoints-b   VPC endpoints
```

**Public subnets exist only in the apps VPC**, and hold exactly two kinds of thing: public load balancers and NAT gateways. **A workload never gets a public address.**

**The data VPC is private-only** — no public subnet, no internet gateway, no NAT. Creating any of them there is policy-denied rather than discouraged. Reach AWS services from it through VPC endpoints in the endpoints subnets.

**The `/20`s leave headroom on purpose.** More availability zones, or larger tiers, extend the same layout without renumbering anything.

## What may reach what

**An environment needs exactly one route beyond itself on day one**: the apps-to-data peering inside its own pair.

**Environments never talk to each other.** Promotion moves an artifact, not traffic — so a route between `in-uat` and `in-live` is a design error, not a shortcut.

**Prefer pairwise peering while the route count is small.** The trigger to move to a hub is a shared connectivity need — a VPN, central egress inspection, many regions — where peering stops being the cheap answer. Moving early buys complexity nobody is using yet.

**Security groups reference security groups**, never CIDRs. A group is a name that keeps meaning something as addresses change; a CIDR in a rule is the addressing decision leaking back out.

**Deny by default at the edges.**

## DNS

**Two zones, both hosted in the control-center account**: the public one, and `internal.<domain>` associated with every environment's VPCs.

**One flat namespace and one single-level wildcard per zone — never nested wildcards.** Every name is a single label under its zone, so a wildcard covers exactly one level and a reader can tell from the name alone which zone answers it.
