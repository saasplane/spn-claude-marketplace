<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/11-conformance.md", "seen": "f0aa42b4" }
  ]
}
-->
# Conformance — what AWS would have to prove, and nothing proves it today

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/11-conformance.md`. Read this as the restatement; that node governs.

## What is not here

**There is no conformance suite for AWS, and nothing proves these claims today.** No automated check runs against an AWS estate, because this provider renders no AWS estate to run one against. The manual-minimum path in [`02-ground.md`](02-ground.md) is walked by a person, and what it produces is evidenced by hand.

## What a suite would have to prove

Each claim below is made by another entry in this folder. A suite is what would turn a claim into a result.

| Claim | Stated by |
| --- | --- |
| A run authenticates through OIDC, a job outside the grant is refused the role, and the `M4` token is revoked | [`03-session.md`](03-session.md) |
| Every CIDR is computed from the declared integers, and no two networks the platform creates overlap | [`04-addressing.md`](04-addressing.md) |
| Every taggable resource carries the mandatory tag set with derived values, and an untagged resource is denied by policy | [`05-tagging.md`](05-tagging.md) |
| The account tree matches the declaration, and root guardrails reach every member account | [`06-organization.md`](06-organization.md) |
| State locking refuses a second concurrent apply, state replicates to the account that observes, and a re-run converges with no changes | [`07-platform.md`](07-platform.md) |
| An environment's names, addresses and bindings are the derived ones, and its per-schema roles are generated rather than shared | [`08-environment.md`](08-environment.md) |

## What to do instead

**Read each entry's own validation checklist in the book.** They are written item by item already, and they are the specification a suite would automate rather than replace. Until a suite exists, a run is conformant when a person has walked its checklist and stored the evidence it names.

**The local provider carries the proof for the rules both realizations share.** Derived naming, an unimplemented layer being absent rather than stubbed, a run naming its own mode — the local suite exercises those today. An AWS suite would repeat them against real accounts rather than restate them.

## Why this is not a gap

**A suite written before the rendering exists tests a guess.** It would assert against resource shapes nobody has created, so every assertion would record an author's expectation instead of a provider's behaviour.

**And it would be worse than no suite, because it would pass.** A green result is read as proof, so a suite proving nothing is a claim the estate cannot back. Saying plainly that nothing proves this yet is the honest form, and it is what the provider contract asks of a provider with no capability.
