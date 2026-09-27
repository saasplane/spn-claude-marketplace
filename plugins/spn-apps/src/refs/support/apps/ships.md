<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/01-apps/09-ships.md", "seen": "5cf366f2" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/09-ships/", "seen": "8b4fdde4" }
  ]
}
-->

# What a Support stage owes a consumer

Source of truth: the foundation's **What a Stack Ships** construct chapter, and its **Ships** capability chapter.

Everything built on this plane stands on a Support stage — every platform, every partner, reaching it only through published versions. This file states what you can rely on from it, what you never rely on, and what a Support stage owes back: the capability set and the fixed direction between its parts, how conformance is answered, and how a release is allowed to break something.

| Term | Means |
| --- | --- |
| Capability | one job a Support stage owes, whatever language it is written in and however many packages realize it |
| Conformance answer | a stage's own written statement, per requirement, of met, partly met with the gap named, or not met with the reason |
| Coverage | which runtimes a stack joins, declared before it answers a single requirement |
| Pin | the exact version a consumer records in its own manifest and advances on purpose, never a range it tracks |
| Reference application | the one application every published capability is proven against, built from nothing private to them |
| Rule | the platform-neutral requirement a foundation capability chapter states, naming no concrete identifier |
| Rendering | what a rule becomes in one stack — its real folders, file names, generators and patterns |

## The capability set, and the direction it runs

A Support stage ships **capabilities with boundaries**, never a bag of packages. How many packages realize one capability is the stack's own decision; that the boundary exists is not. A bag of packages leaves you reading names to guess what is available, and leaves a responsibility free to move between packages without anybody noticing it moved.

| Capability | Carries | Runtime |
| --- | --- | --- |
| Contract | the value space — the data types every state is built from, and the validation that keeps them honest | universal |
| Core | what every runtime needs regardless of language feature — errors, logging, identifiers, pure helpers | universal |
| Server | the resource seams and the capability groups that front them | server |
| Framework | the application shell — boot, module registration, entry mounting | server |
| Web | the session seam, browser storage and the client transport | web |
| Design system | the published visual surface — components, tokens, theming | web |
| Toolchain | the configuration every project in the stack builds against | universal |
| Command surface | the deterministic instrument a developer types — scaffold, validate, generate, provision | server |

**The dependency direction is fixed and acyclic:** Contract → Core → {Server, Web} → {Framework, Design system}. Toolchain and Command surface sit outside the chain — a project reaches for them at build time, not at run time, and nothing above depends on them. A capability reaching upward would make the stack impossible to publish in parts.

**The framework is listed apart from the other capabilities for two reasons.** Its interior is layers rather than capability groups, because it publishes a surface consumers implement against rather than call; and every application depends on it without choosing to, the same way it never chooses Contract or Core directly. Look for the compatibility promise specifically in the folder consumers extend, never in a sibling utility folder beside it.

**None of them carries a business domain.** The moment one knows about an account or an order, it is a platform module sitting in the wrong repository — treat a domain fact inside a Support package as a defect to report, not a pattern to follow. A stack that ships only one runtime still owes the whole chain up to whichever half it covers — a server-only stack owes no Design system to anybody, and expecting one there is a mistake about coverage, not a gap to fill.

## What you may rely on, and what stays interior

**The published surface is the whole promise, and the barrel is its edge.** What a package exports through its barrel is the compatibility contract; what it keeps inside is free to change on any release. A symbol reachable only by reaching past the barrel carries no promise at all — which is exactly what makes internal restructuring free, and exactly why you never import past a barrel, whatever currently sits there and however convenient it looks.

Rely on: the published surface (the barrel, the symbol index, the generated interface document and client), the pinned version recorded in the manifest, and the conformance answer written in the stack's own repository against that pinned version. Never rely on: an internal helper, an unexported type, a private folder, or a version range that might resolve differently tomorrow than it did today.

Conformance is claimed at three levels, each checkable against something that already exists. A **node** conforms when it declares a kind, carries the shape that kind requires, and its documents derive from what it publishes. A **repository** conforms when every node in it conforms, its folders are the ones its own world names, and nothing sits outside them. A **stack** conforms when its provider set answers every obligation, for every runtime it declares. Check the level the question is actually about — a node passing its own shape check says nothing about whether the repository around it conforms, and a repository conforming says nothing about whether one node inside it still needs work.

A stack answers for a fixed set of things and nothing wider: its coverage, the profile each kind derives, what a source tree looks like for every kind it supports, how the layers are realized and what a published surface is, how the contract chain runs from an authored state to a generated client, how each tier is run and where suites live, how the generated artifacts are emitted, and which skills its agent plugin ships. A question outside that set is not a conformance question, whatever it sounds like.

## The conformance answer belongs to the stack

**The foundation states what a stack must do; it never states whether one particular stack does it.** That answer is the stack's own, written in its own repository, because a claim about a repository is only checkable from inside that repository — prose in the foundation stating a realization would put the realization inside the thing it is supposed to conform to. Look for a stack's conformance answer in that stack's own repository; the foundation book never carries it.

- **The response, never the requirement.** The requirement lives once, in the foundation's register. A stack answers it; it never copies, restates or softens it.
- **An honest answer has three shapes: met, partly met with the gap named, or deliberately not met with the reason stated.** The third is not a failure — it is the most useful of the three, because you can plan against a gap you can see and never against one hidden by silence.
- **Evidence, not intent.** A response cites a path, a command or an artifact you can open — never a sentence promising it is coming. *Met as of this release* is checkable; *met* on its own is not, and reading the second as the first is a mistake to catch rather than make.
- **Coverage is declared, never implied.** A stack states which runtimes it joins before answering a single requirement, so a requirement outside that coverage reads as out of coverage rather than as a blank cell. Read a blank cell as forgotten and a declared exclusion as decided — the two look similar and mean opposite things.
- **The pin moves on purpose.** The response is measured against one version of the provider set, named at the top of it. Bumping that pin is a reviewed change that re-checks every row underneath — never a side effect of an unrelated edit.
- **The response changes in the same change as the thing it describes**, which is what keeps the pin from drifting out from under the code the day after somebody merges.

## The release contract

**Everything downstream depends on a Support stage through published versions.** That makes a release the most load-bearing promise the stage makes.

- **Lockstep within the repository, independent across repositories.** Every publishable project in a repo releases at one version, so *which release is this* has exactly one answer for the whole stack.
- **The placeholder and the stamp.** The version is never stored in source. A manifest carries a placeholder, an internal dependency uses the workspace protocol, and both are rewritten only at the moment of release — what changes on a release is on the registry, not in the tree.
- **Pin, never track.** Record an exact version in a consuming manifest and advance it on purpose; never a range. A range resolves differently on two machines on two different days without anybody touching a file, which turns *what changed* into a question nobody can answer from the manifest alone.
- **A break ships with its way out, in the same release.** A breaking change is a version and a migration path shipped together. The version alone tells a consumer something changed; the path alone tells them nothing changed yet. Either half without the other is half a change, and treat a bumped major with no migration note as unfinished work rather than as done.

A per-package version was tried on this plane and dropped: it bought nothing, and it cost a manifest edit and a merge conflict on every branch for every release. Read a per-package version scheme proposed anywhere in a Support stage as a reintroduction of a cost this plane already paid down, not as a new idea to weigh fresh.

## The reference application proves the parts compose

A stack whose packages each pass their own tests has proven the parts work in isolation, and nothing about whether they work together. **The reference application is one running platform, assembled the way a real consumer would assemble it, from the same published surface a real consumer reaches for.**

- **Nothing private.** The moment it reaches an internal helper, an unexported type, or a private folder, it stops proving anything about a consumer's experience and starts testing the stack against itself.
- **Small on purpose.** Its job is coverage of the seams, not coverage of a product — every line in it should exist because some published capability would otherwise go unproven.
- **The first consumer of every breaking change.** It updates before any real platform meets the same change, so the migration path has already been walked once. If updating it is hard, the migration path that change was supposed to ship with is not finished — and this is where that gets found out cheaply.
- **One sample platform, never a product.** Wherever it needs coordinates — an organization, a domain, a name — it uses the one sample platform and nothing else, kept thin on purpose.

## One capability, described once at each altitude

The same capability is described at four altitudes on its way from an idea to something running. Write each independently and the corpus repeats itself until the copies disagree, and nothing answers *which of these is true*.

| Link | Lives in | States | Names |
| --- | --- | --- | --- |
| Rule | the foundation's capability seat | what any node of this kind must do | nothing concrete |
| Rendering | a stack's provider set | what the rule *is* in this stack | real folders, file names, generators, patterns |
| Seam | a capability interface with a choice behind it, harvested into its package's index | the published capability a consumer reaches for | its own surface, guarantee, phrase, proof |
| Flow | a module's own capability document | the pseudologic of one operation | its states, guards, refusals — in the seam's own words |

- **Own, do not restate.** A rule lives at exactly one link. Read a document that explains what a gate *does* as a copy of the seam's own entry, drifting already, rather than as a second source to trust.
- **Name only the seams a node's own dependencies publish** — that turns *is this document allowed to say that* into a check rather than a judgment call, and it is a check worth running before citing a seam a node does not depend on.
- **The phrase is advisory; the citation and the proof are enforced.** Nothing fails when a node reaches for different wording, as long as it cites the right seam and the proof resolves.
- **A refusal is a form.** Where a flow departs from a published phrase, it names the phrase it is not using and why — usually the most valuable sentence in the document, and the one to write rather than skip when a flow genuinely diverges.

## The stage this one sits in

Support is one link in a chain of stages, and everything above is what it owes the links after it. Each stage hands the next a versioned package to install and pin, never source to read into: the foundation states the model, the standards and the agent setup and consumes nothing; Support ships the libraries for building any library or application; Platform ships the modules a SaaS platform composes; a Partner stage ships an organization's own platform; and a hosted control plane sits beside the chain rather than at its end, because the open chain works completely without it.

**Every stage below the foundation owes the same things**, and they are exactly the ones stated above: capabilities whose dependencies run one way, conformance answered in writing per requirement, a release contract, and composition proved by a reference application. Read a partner with several product teams as a Platform stage to them, owing those teams the same obligations — a partner with internal consumers and no written conformance answer, no pin, and no reference application has quietly recreated the problem this chain exists to solve, with nothing downstream able to check it.

The direction is enforced rather than merely stated, and each mechanism fails loudly. Consuming only artifacts means a downstream reach into an upstream repository fails on the first import, because the symbol is not in the installed package — treat that failure as the direction working, not as a bug to route around. Pinning rather than ranging means a build never changes without somebody changing it. And a written conformance answer means a stage cannot assume it conforms because nobody asked: a row reading *not met* sits in the stage's own repository, where its own reviewers see it.

## What is checked mechanically, and what needs judgment

| Checked mechanically | Needs a person's judgment |
| --- | --- |
| a folder against its kind's shape, and a name against its pattern | whether a purpose states a real boundary |
| a capability document against the folder it governs, both directions | whether a story is written in the consumer's words |
| a document naming a seam outside its dependency set | whether a refusal is well-judged |
| a hand edit inside a generated region | whether a decision was the right one |

**Mechanical checks run as commands, on demand and in a pipeline, and they report rather than edit.** Run the command before arguing about whether something conforms — where a check exists, read its output first, and reserve judgment for the column it cannot reach.

The acceptance bar underneath all of it is that a repository's documents and its code stay in step, because a change moves both. A change that moves the code moves the document that governs it, in the same change — and which document that is can be answered by which document names the source folder it governs, never argued about. A document behind its code is a defect, held to the weight of the interface it describes, never something to sweep up later as a chore.

## What this makes checkable

| Defect | What it means |
| --- | --- |
| a package set with no capability boundary | reading names to guess what is available, and a responsibility that moved without anybody noticing |
| a symbol reached past the barrel | a promise that was never made, relied on anyway |
| the foundation claiming a stack conforms | a claim wrong the moment the stack changes, written where nobody who could correct it works |
| a version that means something new | a break that arrives looking like an upgrade |
| an altitude rewritten from scratch instead of citing the one below it | copies that disagree, with no answer to which is true |
| a breaking change shipped without its migration path in the same release | half a change |

Treat each row as a reason to stop and flag rather than a reason to work around — a symbol reached past a barrel compiles today and is exactly the kind of thing that breaks silently on the next release, which is the whole reason the barrel is the edge of the promise and not a suggestion.
