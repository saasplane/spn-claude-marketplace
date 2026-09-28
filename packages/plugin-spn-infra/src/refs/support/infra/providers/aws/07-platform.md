<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/07-platform.md", "seen": "c82e3a1f" }
  ]
}
-->
# Platform up — the shared things every environment borrows

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/07-platform.md`. Read this as the restatement; that node governs.

**The command is `spnutils infra platform up --cloud`.** The runbook behind this names `cinfra cc up`, which never shipped.

## What this layer owns

**The things an environment needs and should not each own a copy of.** Registries, state storage, the parameter registry, the zones and the certificates all live once, in the control center, and every environment reads them. **An environment that built its own would be an environment nobody could move.**

## The acts, in order

| | Act | What it settles |
| --- | --- | --- |
| 1 | Networking | the control account's own network, on the row the platform's address space reserves for its hub |
| 2 | Artifact registries | the pair the organization's `packages.scopes` declares — one public, one private |
| 3 | State storage and the parameter registry | where a rendering's state and the estate's resolved values live. **These are the estate's memory; losing them is worse than losing a resource** |
| 4 | The session act | a pipeline authenticating as itself rather than holding a secret somebody made. **Stated in full in [`03-session.md`](03-session.md)**, and not repeated here |
| 5 | DNS zones, delegation and certificates; the tenant edge | the public zone and its `internal.` counterpart, associated with every environment's VPCs; one distribution with the alias `*.{spd}`, the `*` record and one route store (`RD.SUPPORT.INFRA.104`) |
| 6 | Shared tooling and the discovered outputs | what the platform declared, then every discovered value published for later runs to read |

**State locking is the property to check, not the storage.** Two concurrent applies must be impossible rather than discouraged, and the state replicates into the account that observes, which cannot change infrastructure.

**The zones are hosted here and nowhere else.** An environment does not own a zone; it owns names inside one. That is what keeps the flat single-level wildcard possible, and it is why adding an environment or an app issues no certificate.

**The tenant edge serves every environment's tenant hosts from here.** Its function reads `sites/{host}` → `{env, app}`, then `releases/{env}/{app}`, and switches the origin to that environment's store; a miss answers 404. The runtime's write grant covers `sites/` and the deploy's covers `releases/`, and the store has no condition key that could enforce that split, so each writer's code keeps it. **Not yet proven on an account**: the origin switch across environments and one store read by several distributions.

**The delegation cutover is the one human step in this layer.** Recreate every record the domain already serves inside the new zone and diff it, apply the zone's nameserver set at the registrar, confirm resolvers and mail, then record the date and the diff as evidence.

## What it does not own

**No environment resource is created here, and no customer data.** If a run in this layer is making a database, the layer boundary has moved and the declaration is what needs fixing. Holding no product data is also what keeps the control account outside the data-residency boundary that the region coordinate draws.

## Before you run it

**Estate caution stands.** `up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default. A cloud `--apply` also takes `--approve`, and `tofu apply` and `tofu destroy` are never hand-run.
