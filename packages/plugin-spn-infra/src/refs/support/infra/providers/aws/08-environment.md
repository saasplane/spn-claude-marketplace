<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/08-environment.md",
      "seen": "4883171e"
    }
  ]
}
-->
# Environment up — network, then resources, then compute

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/08-environment.md`. Read this as the restatement; that node governs.

**The command is `spnutils infra environment up <spc> <env> --cloud`.** The environment layer has **no local form** — the machine is one environment, and targeting it locally is refused by name. The runbook behind this names `cinfra env up`, which never shipped.

## The order is what makes it work

**Network, then resources, then compute.** Each act needs the one before it to exist, and running them out of order does not fail cleanly — it half-succeeds and leaves an environment whose state nobody can read.

| | Act | Depends on |
| --- | --- | --- |
| 1 | Coordinates and CIDRs | the declaration alone — **computed, never chosen** |
| 2 | Networks | act 1's addresses, and the two-VPC layout |
| 3 | Cluster, ingress, namespaces | a network to sit in |
| 4 | Data services, and a role per schema | the data VPC, and its endpoints |
| 5 | DNS and certificates | the control center's zones, which this layer writes names into |

**Act 5 writes no tenant record and no wildcard record.** It stands the environment's own distribution with one exact alias and record per `{env}-{app}` host; a tenant host reaches the platform's tenant edge through the `*` record, and the runtime writes routes, never DNS (`RD.SUPPORT.INFRA.104` · `RD.SUPPORT.INFRA.105`).

**Act 1 computes and does not ask.** If a step here is waiting for somebody to supply a CIDR, the addressing rule has been broken upstream — see [`04-addressing.md`](04-addressing.md).

**A role per schema, not a role per service.** The grant follows the data rather than the caller, so a second service reading the same schema needs no new role and a service reading two schemas holds two.

**Act 4 also creates the key for stored secrets** (`RD.SUPPORT.INFRA.109`). It is a second KMS key in the environment, beside the data key and apart from it, with yearly rotation on. Nothing in `spestate.json` asks for it: every environment has one. **Give it a key policy of its own**, because the provisioning role holds every action in the account and an IAM grant alone would let that role use the key. The policy admits the workload roles of the apps that list the seal, and refuses the provisioning role.

- **Publish the seal block for each app that lists the seal**: `{CODE}_RESOURCE_SEAL_APP_PROVIDER=AWS_KMS` and `{CODE}_RESOURCE_SEAL_APP_AWS_KMS_KEY_ID`, the id read from the key and written in the plain half. Publish no credential for KMS: the workload role answers.
- **Grant that app's workload role two actions on the key, and no others**: making a data key, and unwrapping one. An app that does not list the seal receives no grant.
- **A CloudTrail trail records every call that makes or unwraps a data key**, with the organization and the row the service named, into the log archive the estate already has.

Verify it: the environment holds two keys and the data services use the data key only; the workload role of an app that lists the seal makes and unwraps a data key, while the provisioning role and an app that does not list the seal are refused; and the trail shows those calls. The key, its block and its trail are designed and not stood yet.

## What an environment may reach

**Its own pair, and nothing else.** The apps-to-data peering inside the environment is the only route beyond a VPC on day one.

**Environments never talk to each other.** Promotion moves an artifact, not traffic — so a request to connect `uat` to `live` is a request to break the isolation the account tree exists to provide.

## Before you run it

**Estate caution stands.** `up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default. `tofu apply` and `tofu destroy` are never hand-run.
