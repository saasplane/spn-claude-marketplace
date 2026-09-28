<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/02-ground.md", "seen": "d1ccbf27" }
  ]
}
-->
# Ground — nothing is brought to a machine

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/02-ground.md`. Read this as the restatement; that node governs.

**The ground layer validates the things a company brings by hand and discovers their coordinates.** On a machine there is nothing to validate, because nothing is brought. The declaration states the same fact: the `local` provider entry carries no `mtype` ([packages](../../packages.md)).

## What the cloud brings, and local does not

**[The AWS ground runbook](../aws/02-ground.md) lists the acts no tool can perform for you** — signing up with a provider, securing a root user, proving a mailbox routes, holding a domain, owning a repository organization. Each produces one value recorded into the organization declaration.

**A developer machine produces none of those values.** There is no account id to transcribe, no email pattern to decide, and no registrar delegation to make. So the ground layer has no local rendering, and the layer table reads a dash for it ([blueprints](../../blueprints.md)).

## What a machine does need

**A container engine, the repository, and the declaration with its pins.** Those are the working conditions of any checkout, not brought things the estate records.

**Everything else the machine needs, the layers themselves converge.** The certificate authority, the trust prompt and the shared ingress belong to [the organization layer](06-organization.md), and they come to exist when you run it.

**A machine setup performed outside the layer system is a defect**, not a shortcut. It is how trust drifts: a hand-made certificate or a hand-edited hosts entry survives a teardown and then contradicts the next apply.

## Why the empty answer is a ruling

**Ground exists to make brought things checkable.** Give it a machine and the set it would check is empty, so a local ground step could only report success about nothing. Writing one would teach a reader that the layer had been satisfied when it had no subject.

**Estate caution still applies on a laptop.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
