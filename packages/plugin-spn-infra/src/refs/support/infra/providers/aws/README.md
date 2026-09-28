<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/README.md", "seen": "bfc02af2" }
  ]
}
-->
# The estate on AWS — the folder, entry by entry

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/README.md`. Read this as the restatement; that node governs.

**Read this before you tell anybody what AWS can do today.** What is reachable here is narrower than the model suggests, and the difference is not visible from the declaration. [`01-realization.md`](01-realization.md) says exactly how narrow.

## The entries, and what each answers here

Every provider folder answers the same questions under the same file names, so this list is the coverage.

| Entry | What it answers here |
| --- | --- |
| [`01-realization.md`](01-realization.md) | what the AWS provider is, what it binds, and the state of each layer |
| [`02-ground.md`](02-ground.md) | the manual minimum — the steps no tool can do on your behalf |
| [`03-session.md`](03-session.md) | how a run authenticates, and what the credential check expects |
| [`04-addressing.md`](04-addressing.md) | computed addresses, the two-VPC layout, and the flat name grammar |
| [`05-tagging.md`](05-tagging.md) | the mandatory tag set, how it is derived, and how it is enforced |
| [`06-organization.md`](06-organization.md) | rendering the organization layer |
| [`07-platform.md`](07-platform.md) | rendering the platform layer — the control center |
| [`08-environment.md`](08-environment.md) | rendering one environment |
| [`09-deployments.md`](09-deployments.md) | what actually runs, and why it has no layer command |
| [`10-library.md`](10-library.md) | what the AWS half of the blueprint library ships |
| [`11-conformance.md`](11-conformance.md) | what this provider would have to prove |

**An entry with no capability still says three things**: what is not here, what to do instead, and why that is a ruling rather than an absence. Read it as a finished answer.
