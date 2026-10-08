<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/08-environment.md",
      "seen": "46ae43a1"
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
| 3 | Cluster, the two gateways and their load balancers, the web firewall, namespaces | a network to sit in |
| 4 | Data services, and generated roles | the data VPC, and its endpoints |
| 5 | DNS and certificates | the control center's zones, which this layer writes names into |

**Act 5 writes no tenant record and no wildcard record.** It stands the environment's own distribution with one exact alias and record per `{env}-{app}` host; a tenant host reaches the platform's tenant edge through the `*` record, and the runtime writes routes, never DNS (`RD.SUPPORT.INFRA.104` · `RD.SUPPORT.INFRA.105`).

**Act 1 computes and does not ask.** If a step here is waiting for somebody to supply a CIDR, the addressing rule has been broken upstream — see [`04-addressing.md`](04-addressing.md).

**The environment's row states its workload, hosting, size and firewall, and every name is derived.** The workload is `PROD` or `NP` and sets the posture. The hosting is `MANAGED` or `CLUSTER` and says who runs the engines; `CLUSTER` is refused under `PROD`. The size is one of `XS`, `SM`, `MD`, `LG` and `XL`. The cluster is `{env}-cluster`, and the second VPC is the data VPC, which has no route out.

**Act 3 stands three namespaces and two gateways, and no deployment has an ingress or a load balancer of its own** (`RD.SUPPORT.INFRA.115`). The namespaces are `prd`, `plt` and `vnd`, and `prd` is the only one that may hold a `PUBLIC` deployment. Each namespace refuses every caller by default and admits only what a rule names.

| | Public | Private |
| --- | --- | --- |
| Load balancer | `{env}-gateway-public`, facing the internet | `{env}-gateway-private`, internal |
| Security group | `{env}-sg-alb-public` | `{env}-sg-alb-internal`, which admits the operator ranges and the nodes' own group on 443 |
| The gateway's own host | `{env}-gateway.{spd}` | `{env}-gateway.internal.{spd}` |
| Accepts routes from | the namespace `prd` of this environment | every namespace of this environment |
| Carries | each `PUBLIC` deployment's main route | each `PRIVATE` deployment's main route, and every remote port's route |

- **The gateway is Envoy Gateway**, installed from its chart at a stated version. A route is the standard Gateway API kind, so a route names no product.
- **Each gateway has a namespace of its own, `gateway-public` and `gateway-private`, with its own proxies and its own `Service`**, and the two share nothing, so a route on the private gateway has no path from the internet. The gateway's controller runs in `kube-system`, and no proxy runs there.
- **A network rule names one caller for each port.** The public gateway's proxies reach the main port of a `PUBLIC` deployment and nothing else. The private gateway's proxies reach the main port of a `PRIVATE` deployment, and every remote port. The cluster's network add-on is told to enforce the rules.
- **Each load balancer is one ingress of class `alb`** that names its gateway's `Service`. HTTPS ends there, on 443 alone, with the workload's wildcard certificates, and plain HTTP goes on to the proxies.
- **A route's host is given a record that points at its gateway's host**, so no route names a load balancer.
- **A deployment's rate limit is one count across a gateway's proxy pods**, kept in the environment's own cache (`RD.SUPPORT.INFRA.120`).

**Act 3 stands the web firewall when the environment's row says `COUNT`** (`RD.SUPPORT.INFRA.117`). It is one regional web ACL, `{env}-gateway-public`, attached to the public load balancer alone, with a default action that allows. It holds `AWSManagedRulesAmazonIpReputationList`, `AWSManagedRulesKnownBadInputsRuleSet` and `AWSManagedRulesCommonRuleSet`, each set to count. Under `NONE` no ACL stands. The compute step has no default for `firewall` and waits for it.

**A role is named `{group}_{purpose}`, with the purpose in full**: `migration`, `rw` and `ro`. `_mig` is refused. The grant matrix is generated once for each world, the platform's own and each space. A space's keys start `{SPC}_{SPACE}_` and the world token in its hosts is `{spc}-{space}` (`RD.SUPPORT.INFRA.112`).

**Every config path ends in `/vars`.** `/config/environments/{env}/vars` holds the environment's published facts, `/config/environments/{env}/spaces/{space}/vars` a space's, and `/config/environments/{env}/apps/{app}/vars` dev-authored keys, which no blueprint writes. A layer's outputs are handed to the layer above by the driver, and nothing is written to a registry of parameters for them.

**The environment publishes what a call between services needs** (`RD.SUPPORT.INFRA.114`). The platform's world writes the credential block once: `{SPC}_REMOTE_CREDENTIAL_PROVIDER=KUBERNETES`, the cluster's issuer, the namespaces `plt,prd,vnd`, the audience `spn-remote` and the token's path. Each deployment that declares a remote port publishes `{SPC}_REMOTE_SERVICE_{NAME}_ENDPOINTS` as `https://{env}-{app}-remote.internal.{spd}`. The world also publishes the gateway's rate limit store in the secret half: `{SPC}_GATEWAY_RATE_LIMIT_STORE_URL`, `_AUTH` and `_TLS`.

**A deployment is placed by its `ns`, its code and its `expose`.** `PUBLIC` is a route on the public gateway, `PRIVATE` a route on the private one, and `INTERNAL` has no route; `NONE` is refused by name. A `gateway` block becomes the route's policy. A remote port gets a second route on the private gateway, whatever `expose` says, a network rule that admits this environment's namespaces and the private gateway's proxies alone, and every pod that is not a web deployment is given a token marked `spn-remote`. Each deployment is rendered `{PREFIX}_API_TRUSTED_PROXIES` (`2` behind a route, `0` for `INTERNAL`) and `{PREFIX}_API_REMOTE_TRUSTED_PROXIES` (`3`).

**Act 4 also creates the key for stored secrets** (`RD.SUPPORT.INFRA.109`). It is a second KMS key in the environment, beside the data key and apart from it, with yearly rotation on. Nothing in `spestate.json` asks for it: every environment has one. **Give it a key policy of its own**, because the provisioning role holds every action in the account and an IAM grant alone would let that role use the key. The policy admits the workload roles of the apps that list the seal, and refuses the provisioning role.

- **Publish the seal block once for each world**: `{CODE}_RESOURCE_SEAL_APP_PROVIDER=AWS_KMS` and `{CODE}_RESOURCE_SEAL_APP_AWS_KMS_KEY_ID`, the id read from the key and written in the plain half. Publish no credential for KMS: the workload role answers.
- **Grant the workload role of an app that lists `SEAL` in its `grants` two actions on the key, and no others**: making a data key, and unwrapping one. An app that does not list it receives no grant.
- **A CloudTrail trail records every call that makes or unwraps a data key**, with the organization and the row the service named, into the log archive the estate already has.

Verify it: the environment holds two keys and the data services use the data key only; the workload role of an app that lists the seal makes and unwraps a data key, while the provisioning role and an app that does not list the seal are refused; and the trail shows those calls. The key, its block and its trail are designed and not stood yet.

## What an environment may reach

**Its own pair, and nothing else.** The apps-to-data peering inside the environment is the only route beyond a VPC on day one.

**Environments never talk to each other.** Promotion moves an artifact, not traffic — so a request to connect `uat` to `live` is a request to break the isolation the account tree exists to provide.

## Before you run it

**Estate caution stands.** `up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default. `tofu apply` and `tofu destroy` are never hand-run.
