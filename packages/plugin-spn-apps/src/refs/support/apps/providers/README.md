<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-apps/10-providers.md",
      "seen": "a948f6f1"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-apps/10-providers/",
      "seen": "105a1958"
    }
  ]
}
-->
# Apps providers — what a stack is, and what it may never do

**Source of truth:** the foundation's `02-constructs/02-support/02-apps/10-providers.md` and its capability chapters. Read this as the restatement; the book governs.

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

**Every stack carries the seven rules of a call between services.** A server module has two faces, its contract and its implementation; the contract face loads without the implementation; a module offers a runtime manager and a remote manager from one base; a module's inner services are reachable in the same process only; each contract interface has its methods as data, produced and never written; one service calls another's contract through the API entry's remote route, with the caller's signed passport and the calling service's own credential; and only the identity module says whose token it is. Whether a stack publishes the contract face as a second door of one package or as a package of its own is that stack's choice.

**A stack names the units of a web module in its own form.** In TypeScript every unit of a web module ends in the word for where it is placed or what it is, and only a plain component needs none (`RD.SUPPORT.APPS.202`, amended by `RD.SUPPORT.SURFACE.229`). A module's route keys as one enum and its routes as one constant are proposed (`RD.SUPPORT.APPS.203`). A unit with many props groups them in named interfaces built from the owner's props with `Omit` or `Pick` (`RD.SUPPORT.APPS.213`), and a props shape shared by many units that is a unit of its own is held as one attribute and named with no `Props` (`RD.SUPPORT.APPS.215`). Its units of a web module also follow the naming of states, enums and design-system blocks (`RD.SUPPORT.APPS.205`, `RD.SUPPORT.APPS.206`, `RD.SUPPORT.APPS.207`). [`ts/02-naming.md`](ts/02-naming.md) states both, and [`ts/08-web.md`](ts/08-web.md) names a route, an overlay with an address and the provider a partner mounts.

**A stack declares which runtimes it realizes**, and answers *out of coverage* for a kind it does not have — rather than quietly skipping it. **No stack may answer *what kinds exist* differently from any other.**

## What to ask of a new stack

**What would it have to supply, and what may it never redefine?** If the answer to the second is *nothing*, the new stack is a second model rather than a second realization.
