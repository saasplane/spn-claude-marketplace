<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/09-deployments.md", "seen": "d2f2daaf" }
  ]
}
-->
# Deployments — running locally, not on this cloud

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/09-deployments.md`. Read this as the restatement; that node governs.

**Nothing places a deployment on Google Cloud.** No digest is promoted here, no namespace holds one, and no edge serves one.

**What to do instead.** Run and deploy on the [local realization](../local/09-deployments.md), which renders the deployments layer on your own machine in dev mode. Applications register through `spnutils infra app up` rather than a layer command of their own, so the surface you use locally is the surface a cloud realization would answer.

**Why this is a ruling rather than an absence.** This is the one provider question that already has a working answer for development, so the gap here blocks nobody from building. What it blocks is serving customers from this cloud, which nothing in the book claims to do.

## What is true today

**Nobody writes a deployment by hand, on any cloud.** A deployment is produced from the kind, the platform's application row, the exposure that row declares within its namespace ceiling, and the environment it lands in ([apps](../../apps.md)).

**A row is a grant rather than a record.** So the question *what is allowed to run here* is answered by the declaration on every provider, and anything running without a row is a finding.

**Health is a contract the application serves rather than configuration a provider supplies.** A Google Cloud rendering would read the same grant rows and the same probes a partner already has.
