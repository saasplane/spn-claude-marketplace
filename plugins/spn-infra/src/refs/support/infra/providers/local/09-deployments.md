<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/09-deployments.md", "seen": "f9d7b1d3" }
  ]
}
-->
# Deployments — applications attached to a standing platform

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/09-deployments.md`. Read this as the restatement; that node governs.

**`spnutils infra app up` attaches an application to a platform stack that is already standing.** It is the deployments layer's local rendering, and it runs no containers of its own.

## Registering an application is not a layer

**The layer nouns you type are `organization`, `platform` and `environment`; `app` is not among them** (`RD.DEVEX.051`). Deployments ride the environment noun in the cloud, and locally they are their own command, because an application has to be attached to something already up.

**There is no application-side estate file.** What the command reads comes from the application's own manifest, against the pinned platform declaration. That is what lets a scaffold run before any estate row exists.

## What a registration converges

| Converged | From |
| --- | --- |
| the schemas the application's row declares, and their per-schema roles | the generated grant matrix — the same matrix a cloud apply generates ([resources](../../resources.md)) |
| a leaf certificate pair per served host | the machine's own certificate authority |
| a hosts entry per served host, resolving to loopback | the local domain of the zone the row binds to |
| one vhost file in the shared ingress directory | the proxy the organization layer stood |

**`spnutils infra domain register` routes one or more hosts through the same proxy**, which is how a customer-owned domain is exercised locally.

## What runs, and what does not

**The applications run directly, because there is no local orchestrator.** A deployment is derived, so there would be no manifest for a local cluster to validate.

**`spnutils infra app down` removes what the registration made.** A stateful refusal still guards the application's data on the way down, exactly as it does in an account (`RD.INFRA.024`).

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
