<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/08-environment.md", "seen": "8042744b" }
  ]
}
-->
# Environment — derived already, rendered nowhere

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/08-environment.md`. Read this as the restatement; that node governs.

**Nothing renders an environment on Google Cloud.** There is no network, no data service, no cluster, and no DNS or certificate binding produced here.

**What to do instead.** Read [blueprints](../../blueprints.md) for what an environment is, and [AWS environment](../aws/08-environment.md) for the cloud rendering being written. A machine offers no substitute: it is one environment, so pointing the environment layer at the [local realization](../local/08-environment.md) is refused by name.

**Why this is a ruling rather than an absence.** An environment is derived entirely from its coordinates, so there is no Google Cloud environment design waiting to be agreed. A partial rendering would produce an environment missing invariants nobody agreed to drop.

## What is true today

**Everything that decides an environment is already declared and names no cloud.** `{region}` and `{setup}` resolve against the organization declaration to a workload container, a template from the catalog, and a size. Two runs from the same declarations describe the same environment.

**The layers that govern it hold everywhere**: invariants always, the template from the catalog, and size as the only knob a company turns.

**The order inside the layer is the model's too** — the network, then the resources that sit in it, then the compute beside them. A provider chooses the objects, never the sequence.

**So a partner declaring environments today is declaring them for any cloud.**
