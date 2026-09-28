<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/04-addressing.md", "seen": "d35f181e" }
  ]
}
-->
# Addressing — the formula computes the same here

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/04-addressing.md`. Read this as the restatement; that node governs.

**Nothing states which network objects a computed block becomes on Google Cloud.** There is no network, subnet, routing or endpoint rendering here.

**What to do instead.** Read [`naming.md`](../../shape/naming.md) for the rule that addresses and names are computed, and [AWS addressing](../aws/04-addressing.md) for the only worked rendering of it. Take the arithmetic from there and none of the object names.

**Why this is a ruling rather than an absence.** The formula does not belong to AWS. Addresses derive from append-only whole numbers declared once, and that arithmetic names no vendor, so the same declaration would compute the same blocks here. A second copy of the formula written here would drift from both.

## What is true today

**The write-time gate already carries this cloud's region spelling.** A provider region has one sanctioned home in a declaration — the cloud entry's `region` mapping — and the estate laws refuse it anywhere else, using Google's own pattern. So a Google region typed into a manifest is refused now.

**That refusal is aimed at the person most likely to need it.** Somebody moving an estate between clouds is exactly who types the other cloud's region out of habit.

**The governance coordinate is not the provider region, on any cloud.** `{region}` carries the jurisdiction data may live in, and the mapping to a provider region is declared once in the organization declaration.
