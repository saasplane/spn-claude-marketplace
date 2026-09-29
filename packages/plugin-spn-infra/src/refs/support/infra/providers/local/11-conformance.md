<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/11-conformance.md",
      "seen": "664f765b"
    }
  ]
}
-->
# Conformance — what a local pass speaks for

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/11-conformance.md`. Read this as the restatement; that node governs.

**An estate change is proven at the tier that would catch it**, and the tiers are the apps ladder's own — `UNIT`, `CONTRACT` and `INTEGRATION` — with the build and a stand-up beside them ([blueprints](../../blueprints.md)). Local is not exempt from any of them, and it is the only target a stand-up has actually run against.

## What each tier means here

| Rung | Against a machine |
| --- | --- |
| the build — a static gate | the declaration parses and the trees are shaped as the layer system expects — `spnutils infra validate` |
| `UNIT` | a derivation the blueprints compute, such as the router function, runs against stubbed input and answers each case |
| `CONTRACT` | each layer declares its input and output schema, each declaration holds its shape, and the repository's own rules hold |
| `INTEGRATION` | each module validates against the providers it pins, and a plan-only render matches what its consumer expects, reaching nothing |
| stand-up — not a harness tier | the layers provision on the machine and their published outputs are real — `spnutils infra <layer> up` |

**The build is a static gate and never proof**, the same way a type check is not a test. It says the declaration is well-formed, which every broken estate change also was.

## What only a local run proves

**A grammar cannot be tested; only a host that resolves can.** The tenancy fixtures exist for that, and the custom-domain half is the one property nothing else establishes, because it is the only name outside the estate's own zone (`RD.SUPPORT.INFRA.082`).

**The two-way join between a declared domain and its local rendering** is proven by the Support repository's own unit cases (`RD.SUPPORT.INFRA.087`).

**A space's ports are derived by the CLI and written out by hand in the blueprint package's acceptance fixture** (`RD.SUPPORT.INFRA.062`). The acceptance run compares that fixture's render with the Support sample's committed environment file, which the CLI rendered, so a change to the layout of a platform's hundred ports shows up as a difference there rather than on a laptop.

## What exists today, and what a pass does not say

**The harness that runs today belongs to the blueprint package**, not to this provider: it format-checks and validates each module, then runs its contract, acceptance and routing scripts, the acceptance run diffing a rendered local environment against a sample application's committed environment file. It prints one case line per case — `ok|not ok|skip <TIER> <ID> <title>` — through `helpers/case.sh`, and `spnutils infra test` turns those lines into the run artifact. A platform or module declaration's own `INTEGRATION` runs beside it under `tofu test`, planning the pinned blueprints with mock providers, so it too says nothing about a real account. **There is no separate local conformance suite beyond that.**

**A stand-up speaks for the target it ran against and for no other.** A green local run is evidence about local. It says nothing about accounts, guardrails, the trust graph, network isolation or tag policy, because none of those is here to test.

**So a run names the tier it ran and what it found.** Where a target has never been applied against, say that the tiers pass and the stand-up has not run. Do not say the layer works.

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
