<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/02-infra/09-ships.md", "seen": "503b617d" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/09-ships/", "seen": "7040e56b" }
  ]
}
-->

# Ships — what the estate stage owes a consumer

This is what the estate half of the Support stage must publish to count as shipped, and how you judge whether a given release meets that bar. The estate half is shared by every stack a company runs — a TypeScript platform and a different stack both stand infrastructure up from the same published material — and it is judged by the same rules the per-stack half is.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Group | — | one published folder of capability, the unit the estate half ships |
| Blueprints | — | the group that carries one module per layer, per provider — the estate's equivalent of a support package |
| Provider instance | — | one provider's own realization of a seam: a cloud, a repository host, or a developer's machine |
| Conformance answer | — | the written reply a realization gives to every requirement the foundation states |
| Release contract | — | the promise a consumer relies on: lockstep inside one repository, independent across repositories |
| Pin | `SPRepoPackageRef.version` | the exact version a consumer names, rather than a range it would track |

## The repository, the group, and what sits beside each

The repository is drawn apart from the group it carries, because the repository is the boundary a version and a release apply to, while a group is only what that boundary happens to hold today.

| Piece | What it is |
| --- | --- |
| the estate half's repository | one version for everything inside it |
| a group (Blueprints, today) | one module per layer, per provider |
| the conformance answer | met, partly met, or not met, with the reason, for every requirement |
| the release contract | a consumer pins a version, and never tracks a range |

That separation matters in practice: another group could join later without moving the boundary at all, and neither the conformance answer nor the release contract belongs to Blueprints by name — both apply to whatever the estate half ships, group by group, as the set grows.

## What a group is, and what it is not

The estate half publishes **groups**, one folder per capability, the way a per-stack package does. Blueprints is its first, and it is not necessarily its only one — the estate half's own declaration is typed as the shared support baseline, and that type names the stage, not blueprints by name. Something else earning a place beside Blueprints is additive: it changes nothing about the boundary, the version, or the way a consumer reaches either group.

**A group holds material a driver reads by path — it is never a library an application imports.** There is no runtime inside a group, no language ecosystem, and nothing that could become a dependency of anybody's application code. When you are checking whether something belongs in the estate half, this is the test: does a driver read it by path, or would something import it? Only the first belongs here.

## One repository, every provider beside the others, one version

**A cloud, a repository host and the local target live in one repository and release as one version — MUST.** The estate ships one plugin, and a cloud is a folder inside it: nothing in the estate half is written against one cloud provider by name, and a cloud's own material stays under that provider's own folder rather than leaking into the shared parts.

The layers read each other's published outputs, so a version difference between providers inside the same release would be a defect, not something to manage around. Splitting providers across separate releases forces a consumer to reconstruct which combination of versions was ever actually tested together — one version answers *which release is this* for the whole set, and nothing else has to.

## It belongs to no stack

**There is no runtime and no language ecosystem beneath the estate half — MUST.** Its declaration sits outside the kind system, for the same reason an estate sits outside it: a kind claims code written in a stack, and nothing here is written in one. That is why nothing in it carries a JavaScript package manifest, and why its artifact is a set of files rather than a compiled thing (`RD.INFRA.066`).

A stack claim on the estate half would be a claim about something that does not run, and it would invite a second estate half per stack — exactly the duplication the one-repository rule exists to prevent. If you see a stack-specific assumption creeping into the estate half, that is a defect to name, not a convenience to keep.

## The conformance answer lives in the estate half's own repository

**The estate half answers every requirement the foundation states, in writing, in its own repository — MUST, and never in prose inside the foundation book.**

| The answer | What it means |
| --- | --- |
| met | the requirement holds as of this release |
| partly met | it holds in part, and what is missing is named |
| not met | it is deliberately not met, and the reason is stated |

**Not met is a legitimate answer, and the most useful of the three** — a stated gap can be planned against, and a silent one cannot. The answer changes in the same change as the thing it describes, and it names versions rather than intentions: *met as of this release* is something you can check against a specific tag.

An answer written into the foundation book instead of the estate half's own repository is a defect: it puts a realization inside the standard, read as though the standard itself guaranteed it, in a place the people who could correct it do not work.

## A published version is the whole release contract

**Everything built downstream of the estate half reaches it through a published version — MUST.** This is the most load-bearing promise in the chain, because nothing downstream can see past it to what actually changed.

**Lockstep holds within the repository; independence holds across repositories.** A consumer pins a version and never tracks a range — a range is a build that changes without anybody having changed it, which defeats the whole point of naming a version at all. A breaking change is a version **and** a migration path together; either one alone is half a change, and shipping only the version bump leaves the consumer to reconstruct the migration by trial.

A version that means something different from what it meant last time is a break arriving in the shape of an upgrade — the people it breaks are exactly the ones least able to see why, because nothing in the version number told them to look.

## What it makes checkable

| Defect | What it means |
| --- | --- |
| providers released separately | a consumer has to reconstruct which combination was ever tested together |
| a declaration typed for its current contents rather than for the stage | the next arrival is a rename and a migration instead of an addition |
| a stack claim on the estate half | a claim about something that does not run, and an invitation to one estate half per stack |
| a conformance answer written into the foundation book | a realization sits inside the standard, read as though the standard guaranteed it |
| a version that means something new without saying so | a break arriving in the shape of an upgrade |
| a group that is imported rather than read by path | the estate half acquired a runtime it was never meant to carry |
| a range pinned instead of an exact version | a build that changes without anybody having changed it |
