<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/06-organization.md", "seen": "edf11f52" }
  ]
}
-->
# Organization — the tree is mapped and not built

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/06-organization.md`. Read this as the restatement; that node governs.

**Nothing builds the governance tree on Google Cloud.** No container, no account, no guardrail policy and no identity is created here.

**What to do instead.** Read [blueprints](../../blueprints.md) for the tree the `ORGANIZATION` layer stands up, and [AWS organization](../aws/06-organization.md) for the realization being written. A company needing a governed cloud organization today builds it on the cloud that has one.

**Why this is a ruling rather than an absence.** An unimplemented layer is absent, never stubbed. A partial organization layer here would create some of the tree and report success, and the guardrails you believed you had would be the ones that were never attached.

## What is true today

**The rendering of every logical node on this cloud is already written down.** The governance tree is logical and cloud-agnostic, and `RD.INFRA.029` maps it: a world node is a folder, a leaf is a project, and the organization node sits above them all.

**A rendering may add grouping its own policy mechanics want, and the logical tree never widens for it.** So that mapping is a contract rather than a sketch, and a Google Cloud realization would be judged against it.

**The code that makes the tree exist is what is missing.** Given credentials, the same hierarchy should come to exist on whichever provider the declaration names.
