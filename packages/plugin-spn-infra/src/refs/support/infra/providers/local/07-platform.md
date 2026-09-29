<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/07-platform.md",
      "seen": "defc3331"
    }
  ]
}
-->
# Platform — the container group from the pinned declaration

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/07-platform.md`. Read this as the restatement; that node governs.

**`spnutils infra platform up <spc>` stands the platform's container group from the pinned declaration.** Nothing about it is a separate local model: the layer reads the same manifests the cloud layer reads, and the driver executes compose trees where the cloud runs the engine.

## What it stands

**The engines of every resource world, at the same versions the cloud runs.** A world stands its own instance, so a platform and a space bound beside it hold separate engines rather than sharing one ([resources](../../resources.md)). Each family takes a world-marked hostname and a port from the hundred the platform declares, which [`04-addressing.md`](04-addressing.md) states.

**Each installed module's local rendering.** A module package carries its own renderings and the tooling carries none: `src/local/` holds one `docker-compose.yml` and what it mounts, applied by `docker compose` with a `.env` the tooling writes (`RD.SUPPORT.INFRA.078`). The tooling parses neither rendering and names no product on either side.

**A module with no local form is not a defect.** It ships cloud only, and the local stand-up warns by name and continues.

**The tenancy fixtures**, which stand here and are removed whole at platform down.

## What it fully realizes, and what it does not

**Everything stateful is realized fully** — the same engines at the same versions, the same schemas and roles, and the same list of configuration keys. So a missing key is found on your machine rather than in a pipeline ([modules](../../modules.md)).

**There is no orchestrator, and that is a decision rather than a shortfall.** A deployment is derived, so no manifest exists for a local cluster to validate. What it would buy is already zero, and what it costs is the machine's memory and a slower loop.

## Coming down

**`platform up` also registers every stored route with the ingress** — each `~/.spnutils/platforms/{org}/{spc}/routes/{host}.json` the local edge provider kept — so a rebuilt machine serves every tenant it served before (`RD.SUPPORT.INFRA.106`).

**A teardown removes what the platform owns and refuses its data.** Destroying a stateful resource is a separate act, named separately and confirmed separately (`RD.SUPPORT.INFRA.024`). That rule holds on a laptop for the same reason it holds in an account: the habit is what carries.

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
