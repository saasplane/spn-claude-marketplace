<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/02-ground.md", "seen": "c00da836" }
  ]
}
-->
# The manual minimum — the five things no software can make for you

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/02-ground.md`. Read this as the restatement; that node governs.

**The command surface is `spnutils infra <layer> … --cloud`**, with the layer nouns `organization` · `platform` · `environment`. The runbook behind this predates that surface and names `cinfra`, which never shipped, along with a three-step split of `org` · `cc` · `env`. **Read the steps; ignore the old command names wherever you meet them.**

## Why there is a manual minimum at all

**An estate is built from the outside in, and at the outside is a company that has already bought and signed for things.** No software can create a cloud account for somebody who has no cloud account, open a code host for somebody who has none, or make a domain theirs. The five steps below are exactly that set — **the smallest number of hand-made things everything after this assumes.**

**Keeping it small is the design.** Every hand-made thing is a thing nobody can re-create from a declaration, so the list is a cost paid forever rather than once.

## The five

| | Step | What it settles |
| --- | --- | --- |
| **M1** | Create the management account | the root of the account tree everything else hangs from |
| **M2** | Secure the root, and create the bootstrap access profile | the credential the first automated run holds — and the last time anybody uses root |
| **M3** | Decide account email aliasing | how every generated account's address is delivered, before any account exists to need one |
| **M4** | Create the repository organization and a temporary token | somewhere for code to live, and a credential that is deliberately temporary |
| **M5** | Decide the registrant and the nameserver delegation | whether the domain's registrar or the estate's zone answers, which cannot be changed quietly later |

**M2 and M4 both create a credential you intend to destroy.** The bootstrap profile is replaced once identity is stood up, and the M4 token is retired by OIDC when the control center comes up. **A temporary credential that is still there a month later is the finding.**

**Record what you did in the runbook that did it.** Nothing here is derivable from a declaration afterwards, so an unrecorded manual step is a fact that exists only in somebody's memory.
