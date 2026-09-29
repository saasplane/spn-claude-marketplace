<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/gcp/07-platform.md", "seen": "04d828f8" }
  ]
}
-->
# Platform — the contents are decided and unrendered

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/gcp/07-platform.md`. Read this as the restatement; that node governs.

**Nothing stands up a platform on Google Cloud** — not its workload and control containers, not its trust graph, not its zone and wildcard certificate, and none of the instruments installed beside them.

**What to do instead.** Bring a platform up on the [local realization](../local/07-platform.md) with `spnutils infra platform up <spc>`, which renders its container group on your machine from the pinned declaration. `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.

**Why this is a ruling rather than an absence.** What a platform layer stands up is the model's answer and the same on every cloud. A provider decides only how each part appears, so there is no Google Cloud platform design missing — there is code missing.

## What is true today

**A Google Cloud platform layer would ask a partner for nothing new.** The DNS zone, the artifact registry and the secret store are derived from the cloud binding rather than declared, and the platform's placement inside that binding is the one platform-scoped fact a declaration carries.

**Pipeline execution is installed rather than hosted, on every cloud.** The repository host supplies triggers and gates, and the jobs run on runners this layer stands up inside the estate. A partner on this cloud would add no account and no separate bill for them.

**So the declaration written today is already complete for this layer.** Only the rendering that reads it is absent.
