<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/02-ground.md", "seen": "bc8cb914" }
  ]
}
-->
# Ground — nothing is brought by hand here

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/02-ground.md`. Read this as the restatement; that node governs.

**There is no manual bootstrap for Google Cloud.** Nothing states which account a company creates first here, which mailbox recovers it, or how a domain is delegated.

**What to do instead.** Do not follow [the AWS ground runbook](../aws/02-ground.md) with Google Cloud substituted into it. Its steps record AWS's own account identifiers, its root-user ceremony and its email aliasing pattern. Those values written into a declaration for another cloud are facts nothing will ever read.

**Why this is a ruling rather than an absence.** The `GROUND` layer validates that the brought things are reachable and discovers their coordinates; it stands up nothing ([blueprints](../../blueprints.md)). A provider with no realization has nothing to validate, so an empty ground step here is the correct outcome.

## What is true today

**What a company brings is settled above every provider.** An estate binds somewhere to keep the code and somewhere to run it, and nothing else. The DNS zone, the artifact registry and the secret store are supplied by those bindings rather than asked for.

**So a Google Cloud ground step would ask a partner for no more than the AWS one does.** Only the spelling of the answers would differ — which console the account is created in, and what the provider calls its own containers.

**The test for another brought thing is unchanged.** Something SaaS Plane can create is not a provider, however much it resembles one.
