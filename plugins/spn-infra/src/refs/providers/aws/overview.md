<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/providers/infra/cloud/aws/README.md", "seen": "fc00795a" }
  ]
}
-->
# The estate on AWS — what exists, and what is planned

**Source of truth:** the foundation's `providers/infra/cloud/aws/README.md`. Read this as the restatement; that node governs.

**Read this before you touch anything on AWS**, because what you can do here today is narrower than the model suggests and the difference is not visible from the declaration.

## What is real today, and what is not

**Today the estate reaches AWS through the manual-minimum path.** The runbooks in this folder walk a person from zero to a working control center by hand, and they stay deliberately small — the smallest set of hand-made things the automation will later assume.

**The automated realization is planned, not built.** `spnutils infra <layer> --cloud` will drive the layers below. Every one of them is 🔮.

| Layer | What it owns | State |
| --- | --- | --- |
| `GROUND` | validates what the company brought and discovers its coordinates | 🔮 planned |
| `ORGANIZATION` | the AWS Organization, its OUs, accounts, guardrails and the output store | 🔮 planned |
| `PLATFORM` | one platform's estate — accounts, runners, zones, certificates, observability | 🔮 planned |
| `ENVIRONMENT` | one environment — the network, then the resources, then the compute, in that order | 🔮 planned |
| `DEPLOYMENTS` | what actually runs. **Apps register through `infra app`, and never get a layer noun of their own** | 🔮 planned |

**So do not tell a partner that a cloud `up` will work.** It is a planned surface, and the honest answer is the runbook.

## What holds whatever the tooling is

**The manifests are the only declaration.** Nothing is configured by editing a console and writing it down afterwards. Where the runbooks make something by hand, **the runbook that did it is what records it** — that is the whole reason they are written as runbooks rather than as notes.

**Naming, addressing and tag grammar belong to the design chapters, not to AWS.** This node applies them; it does not decide them. A rule you find here that contradicts a design chapter is a defect in this node.

**Estate caution stands.** Cloud mutation goes through the CLI's own doors. `tofu apply` and `tofu destroy` are never hand-run, on any cloud, at any layer.
