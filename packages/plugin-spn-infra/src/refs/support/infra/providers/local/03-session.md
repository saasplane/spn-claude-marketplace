<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/03-session.md",
      "seen": "f1c5200d"
    }
  ]
}
-->
# Session — one principal, and no credential to discover

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/03-session.md`. Read this as the restatement; that node governs.

**A local run authenticates nobody, because there is nobody to authenticate against.** The provider entry for local carries no `mtype`, so the check that reads the declared provider and expects that provider's own session values finds nothing to expect.

## One principal owns every layer

**On a machine, the person running the command owns every layer.** That is why a platform stand-up converges its own prerequisites: the trust bootstrap simply comes to exist beneath the container group.

**In the cloud each layer has its own principals**, so a missing layer below is refused by name ([blueprints](../../blueprints.md)). The asymmetry is a property of who holds the credential rather than of how careful the driver is.

## What stands in for a session

**The trust anchor is the machine's own certificate authority, not a session.** One trust root per machine, deliberately unscoped, trusted once. `spnutils infra organization up` establishes it as part of the trust bootstrap, and `spnutils infra trust-ca` performs the trust half on its own.

**A client reaches a local host because that root is in the machine trust store.** Certificates are minted per world and family, so an engine presents a certificate for the name you actually dial (`RD.SUPPORT.INFRA.079`).

## Where a credential is still required

| Act | Needs | Why |
| --- | --- | --- |
| a local `plan` or `up` | nothing | it reaches no account |
| resolving the pinned blueprint or module package | a short-lived registry token from `spnutils login` | the packages come from the organization's own registry pair |
| anything with `--cloud` | the cloud session, and an approval | it mutates real accounts |

**`spnutils login` is declared and not yet realized**, and that gap is recorded as a conformance finding against the tool rather than dropped from its contract.

**Your own typed values sit outside the tool's folder on purpose.** Resetting that folder is an ordinary act, and a credential you typed is the one thing on the machine nobody can regenerate. A value is never printed and never logged; a run reports a key name and whether it is set.

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
