<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/03-session.md", "seen": "6094bc92" }
  ]
}
-->
# Session — how a run authenticates on AWS

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/03-session.md`. Read this as the restatement; that node governs.

**Every cloud act needs an identity before it can touch an account.** This entry says which identity, where it comes from, and what the tool checks before it proceeds.

## A pipeline authenticates as itself

**A pipeline proves who it is; it does not hold a secret somebody made.** The control center registers the repository provider's OIDC issuer in the platform's control account, and creates the deploy roles a job assumes. Each role's trust is conditioned on **both** the repository and the CI environment.

**A job outside that grant is refused the role**, whatever its workflow file says. That is the property a stored secret cannot have, because a token is valid wherever somebody pastes it.

**A person reaches an account through SSO**, by a named group rather than blanket administration. The control account is the only account holding deploy capability — the governance account observes, the control account acts.

## What the check expects to find

**The credential check reads the provider the estate declared and expects that provider's own session values.** When the estate declares AWS, the check expects an AWS session in the account the coordinates resolve to, and it refuses by naming AWS when there is none. Nothing in the driver names a vendor.

**A rehearsal needs no session at all.** `--plan` answers from the declaration and reaches no account, so the whole cloud walk is rehearsable before an account exists. `--apply` is the mode that needs an identity, and on a cloud realization it also takes `--approve`.

## This act retires the `M4` token

**Establishing OIDC is what retires the `M4` fine-grained token** that [`02-ground.md`](02-ground.md) recorded. The cloud runs switch their repository operations from that token to OIDC, the token is revoked, and the revocation is kept as evidence.

**Revoking the bootstrap token is the act people skip, because the token still works.** Nothing breaks on the day OIDC goes live, so the revocation has no event forcing it. An unrevoked `M4` token is a long-lived credential sitting in the delivery path, which is the thing this design exists to remove.

## What proves it

- A CI job in the repository organization obtains its deploy role through OIDC.
- A CI job **without** the environment grant is refused the role, whatever its workflow file says.
- The `M4` token is revoked, and the revocation is evidenced.
- The OIDC provider's identifier is present in the parameter registry.
