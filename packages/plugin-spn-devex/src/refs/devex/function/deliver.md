<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/07-deliver.md",
      "seen": "8ba89a36"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/07-deliver.md",
      "seen": "1d377250"
    }
  ]
}
-->
# Deliver — a version is stamped, never chosen

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/07-deliver.md` and `04-capabilities/01-devex/01-function/07-deliver.md`. Read this as the restatement; the book governs.

## Two things have to arrive

**A change has to reach the setup that runs it**, and **the standards themselves have to reach the seat where somebody works.** Both are delivery, and the same rules hold for each — a standard that ships differently from the code is a standard that is a version behind.

## The thing to unlearn

**A version is not a number somebody chooses.** It is stamped by the process, from a tree that has already passed its gates. A number chosen by hand is a claim nobody verified.

**The count moves after the release, never before.** You release at the version the artifact carries, and the first edit after it increments. So the number names **what is published**, not what you are working on — which is what makes a stale cache findable.

## The gates, cheapest first

**Cheapest first is the whole ordering rule.** A gate that takes a second and can fail runs before one that takes ten minutes, because the only thing a late failure buys is a longer wait for the same answer.

**A release runs from a clean tree.** The release train stages everything it finds, so a release run while another session holds uncommitted work publishes that work.

## What travels, and what never does

| Travels | Never travels |
| --- | --- |
| the built artifact, whole | a secret, at any path |
| the manifest that names it | a credential a pipeline could fetch instead |
| the pinned references it resolves | a path into a sibling checkout |

**A path reference resolves only where the sibling checkout exists** — every machine in the standard workspace layout, and deliberately not CI. The day a pipeline needs it is the day it must be published.

## The boundary

**Deliver publishes; it does not operate.** Watching what you shipped is `operate`.
