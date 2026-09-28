<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/05-tagging.md", "seen": "03519486" }
  ]
}
-->
# Tagging — nothing is tagged on a machine

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/05-tagging.md`. Read this as the restatement; that node governs.

**Nothing the local provider stands up carries a tag.** No container, certificate, host record or schema receives the mandatory block a cloud rendering stamps on every resource.

## What to do instead

**The coordinates still exist, and they still name every container.** Tags are the one sanctioned duplication in the model: the same coordinates a name composes, restated for the planes that filter but cannot parse. Locally the name itself is the answer, because you can read it.

**When you want the resolved picture rather than a single name, ask the tool.** `spnutils infra show` resolves the declaration reaching the folder you are standing in and says where each layer came from. `spnutils infra logs` reaches the same realization by service.

## Why this is a ruling rather than an absence

**A tag answers what somebody else asks about a resource** — whose is this, what is it for, and what data does it hold. Those are questions asked of a shared account, by an auditor, an incident responder or a finance lead who cannot ask the owner.

**A machine has no shared account and no billing boundary.** It has one owner, who is sitting in front of it. There is no tag policy to deny an untagged create, no rule to detect drift, and no findings account for either to report into.

**So rendering the block locally would claim a property local does not hold.** The value would be present and nothing would ever check it, which is the stubbed form the estate refuses everywhere.

**What is absent is the rendering, never the coordinates.** The day the same declaration is applied with `--cloud`, the apply stamps the full derived set as provider default tags, from the same values that named the containers on your machine.
