<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/providers/infra/cloud/aws/guides/01-organization.md", "seen": "4ae45eda" }
  ]
}
-->
# Organization up — the account tree, the guardrails, and identity

**Source of truth:** the foundation's `providers/infra/cloud/aws/guides/01-organization.md`. Read this as the restatement; that node governs.

**The command is `spnutils infra organization up --cloud`.** The runbook behind this names `cinfra org up`, which never shipped.

## What this layer owns

**The company, once.** The organization layer is where the account tree, the guardrails on it and the identity that reaches it are created. **Everything above it assumes all three exist**, which is why it runs first and why a half-finished run is worse than none.

## The five acts

| | Act | Why it is here |
| --- | --- | --- |
| 1 | Enable the cloud organization | nothing below can exist until the tree has a root |
| 2 | Raise the account quota | the default quota is smaller than the tree the estate builds, and the raise is not instant — ask early or the run stalls on somebody else's queue |
| 3 | The OU tree and its accounts | the isolation boundaries, created from the declaration's coordinates rather than named by hand |
| 4 | Policies | the guardrails, attached to OUs rather than to accounts, so an account added later inherits them rather than needing them |
| 5 | Identity | who may reach which account, and the end of the bootstrap profile from `M2` |

**A policy attached to an account instead of its OU is the commonest mistake here**, and it fails silently: the account is governed today and the next account beside it is not.

**Identity last, and the bootstrap profile ends when it lands.** Running with the bootstrap credential after identity exists means the thing that was meant to be temporary has become the way in.

## Before you run it

**Every account's email is derived from the aliasing decision made at `M3`.** If that is not settled, the run creates accounts with addresses nobody can receive — and an account you cannot receive mail for is an account you cannot recover.
