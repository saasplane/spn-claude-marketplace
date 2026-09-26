# What these refs are, and how they are arranged

**A ref is a self-contained leaf.** You are holding the plugin and not the book, so everything it restates is written out here, stamped with the version it was read at.

## Only domain folders live here

**`refs/` holds one folder per book domain and nothing else.** A folder under a domain is a group; a file under a group is named for a construct the book states; **a construct needing more than one file becomes a folder named for it.**

**A folder's `README.md` is that folder's own subject.**

| Domain | Holds |
| --- | --- |
| [`support/apps/`](support/apps/) | what a node is, and everything it is built from — shape, packages, modules, resources, apps, tests, comments, the agent surface, what it ships, and the stacks that realize it |
| [`platform/core/`](platform/core/) | the platform a partner adopts rather than rebuilds — tenancy, identity, surfaces, data and trust, lifecycle |
| [`platform/modules/`](platform/modules/) | one ref per module that ships, and the face says what a module is |

## The stacks are inside, not beside

**`support/apps/providers/` holds one folder per stack.** This plugin is the apps domain, and a stack is a realization of it rather than a domain of its own — which is why there is no `spn-apps-ts`.

**Every stack answers the same questions under the same file names**, and a stack with no capability for one writes the file anyway and says what to do instead. So the folder listing is the coverage.

## What is generated

**One file**: [`support/apps/providers/ts/14-libraries.md`](support/apps/providers/ts/14-libraries.md), the list of published packages a node may depend on. There is no construct per package, so nothing in the book lists them and a hand-written list would be wrong at the next release.

**The module list is not generated**, because there is one ref per module — the folder is the list.
