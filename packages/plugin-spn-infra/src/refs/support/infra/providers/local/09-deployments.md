<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/09-deployments.md", "seen": "24c0dc55" }
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
| one vhost file in the shared ingress directory | the proxy the organization layer stood |

**No served host needs an `/etc/hosts` line** — the local resolver answers every local domain and `lc-test`.

**`spnutils infra domain register <host> --app <app>` registers a host with the shared ingress, needs no privilege and never writes `/etc/hosts`**; a host no local resolver answers is refused by name (`RD.INFRA.106`): the vhost, a certificate the wildcard covers or the local CA mints, a reload. `infra domain unregister` removes it. **The local edge provider calls it for every route the running platform writes**, storing the route at `~/.spnutils/platforms/{org}/{spc}/routes/{host}.json`, as the cloud provider calls its vendor — so a tenant signed up locally loads at `https://acme.lc-spndemo.app` with no manual step. **A test picks its own customer domain under `lc-test`**, such as `shop.acme.lc-test`.

## A web release rides the platform's storage engine

**`spnutils infra web deploy <env> <app> --dist <dir>` and `infra web rollback <env> <app> <release>` reach no separate store — they read and write the platform's own storage engine**, the one `platform up` already stands. Two buckets live inside it: `webapps` holds `{app}/releases/{hash}/**`, the immutable copy of a built bundle, and `routes` holds `releases/{env}/{app}`, the local stand-in for the pointer the cloud keeps in its route store. `deploy` refuses by name when the engine is not running, rather than starting the platform itself.

The machine is one environment, so `<env>` is always the same value here. It stays a typed argument rather than a derived one, because the command's signature is shared with the cloud realization, where more than one environment exists.

## What runs, and what does not

**The applications run directly, because there is no local orchestrator.** A deployment is derived, so there would be no manifest for a local cluster to validate.

**`spnutils infra app down` removes what the registration made.** A stateful refusal still guards the application's data on the way down, exactly as it does in an account (`RD.INFRA.024`).

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
