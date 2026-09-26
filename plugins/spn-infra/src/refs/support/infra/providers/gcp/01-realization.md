<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/01-realization.md", "seen": "6f0d6f45" }
  ]
}
-->
# Realization — Google Cloud is named and not rendered

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/01-realization.md`. Read this as the restatement; that node governs.

**No Google Cloud realization exists, and none is being designed.** Nothing turns an estate declaration into folders, projects, networks or compute here.

**What to do instead.** Develop against the [local realization](../local/01-realization.md), which renders the same declaration on your own machine. [AWS](../aws/01-realization.md) carries the only cloud realization being written. An estate that must run on Google Cloud today has no supported path, and saying so plainly is the answer.

**Why this is a ruling rather than an absence.** An unimplemented layer is absent, never stubbed. A partial rendering placed here would accept a call, do nothing, and report that the run worked.

## What is true today

**The cloud vocabulary already admits this provider.** `SPEstateCloudType` names Google Cloud beside the other admitted clouds, so a declaration can say this provider fills the cloud port.

**What a cloud provider binds is decided by the model, never by the provider.** The organization binds the account that pays and governs, and each platform binds its own container inside it. A Google Cloud realization would bind exactly those, at exactly those scopes.

**So the missing piece is the rendering, and only the rendering.** Nothing a partner declares today is shaped by this folder being empty.
