<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/11-conformance.md", "seen": "ecc3a668" }
  ]
}
-->
# Conformance — what a local pass speaks for

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/11-conformance.md`. Read this as the restatement; that node governs.

**An estate change is proven at the tier that would catch it**, and the tiers are the estate's own — form, contract, render, acceptance and stand-up ([blueprints](../../blueprints.md)). Local is exempt from none of them, and it is the only target a stand-up has actually run against.

## What each tier means here

| Tier | Against a machine |
| --- | --- |
| form | the declaration parses and the trees are shaped as the layer system expects — `spnutils infra validate` |
| contract | each layer declares its input and output schema, and the repository's own rules hold |
| render | the declaration resolves and a plan comes out, reaching nothing |
| acceptance | the render matches what its consumer expects, compared against that consumer's own declaration |
| stand-up | the layers provision on the machine and their published outputs are real — `spnutils infra <layer> up` |

**Form is a static gate and never proof**, the same way a type check is not a test. It says the declaration is well-formed, which every broken estate change also was.

## What only a local run proves

**A grammar cannot be tested; only a host that resolves can.** The tenancy fixtures exist for that, and the custom-domain half is the one property nothing else establishes, because it is the only name outside the estate's own zone (`RD.INFRA.082`).

**The two-way join between a declared domain and its local rendering** is proven by the Support repository's own unit cases (`RD.INFRA.087`).

**The derived engine ports are reproduced identically in the blueprints render and in the CLI** (`RD.INFRA.062`) — a formula realized twice, so each realization is a check on the other.

## What exists today, and what a pass does not say

**The harness that runs today belongs to the blueprint package**, not to this provider: it format-checks and validates each module, then runs its contract and acceptance scripts, the acceptance run diffing a rendered local environment against a sample application's committed environment file. **There is no separate local conformance suite beyond that.**

**A stand-up speaks for the target it ran against and for no other.** A green local run is evidence about local. It says nothing about accounts, guardrails, the trust graph, network isolation or tag policy, because none of those is here to test.

**So a run names the tier it ran and what it found.** Where a target has never been applied against, say that the tiers below it pass and this one has not run. Do not say the layer works.

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
