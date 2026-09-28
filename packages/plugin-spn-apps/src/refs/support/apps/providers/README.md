<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/01-apps/10-providers.md", "seen": "1f044c41" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/", "seen": "16391da1" }
  ]
}
-->
# Apps providers — what a stack is, and what it may never do

**Source of truth:** the foundation's `02-constructs/02-support/01-apps/10-providers.md` and its capability chapters. Read this as the restatement; the book governs.

**This folder is not [`ts/`](ts/README.md).** Those refs say what TypeScript actually does. This says what *any* stack is allowed to be — read it before adding a second one, and before assuming a tool can work out which stack you are in.

## The two sentences that carry it

**The standards say what the plane says an apps repository is made of.** A stack says **what one language ecosystem does about it**. The first never mentions a language; the second is the concrete half — the real folder names, the real generator, the real test runner.

## A stack is claimed, never detected

**The thing to unlearn is that a repository's language is something a tool works out by looking at the files.** Here it is a **claim** the repository states about itself, and the organization's own declaration is what **grants** it.

| | Where it lives | What it says |
| --- | --- | --- |
| The claim | the repository's own manifest | this repository is written in this stack |
| The grant | the organization's declaration | this company builds in these stacks |

**The organization reference is never optional.** Without it a claim grants itself, which is not a grant.

**The platform reference beside the claim is a coupling, never a grant.** It says which estate this repository is pinned to. It does not say what the repository may be.

**A repository that only builds and never deploys still claims a stack**, because the claim is about what the code *is*, not about where it goes.

## What a stack may never do

**No stack invents, renames or re-scopes a kind, a symbol role, or any other closed value.** The closed vocabularies are the platform's, and a stack that extends one has forked the model while appearing to join it.

**A stack declares which runtimes it realizes**, and answers *out of coverage* for a kind it does not have — rather than quietly skipping it. **No stack may answer *what kinds exist* differently from any other.**

## What to ask of a new stack

**What would it have to supply, and what may it never redefine?** If the answer to the second is *nothing*, the new stack is a second model rather than a second realization.
