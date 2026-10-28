# What these refs are, and how they are arranged

**A ref is a self-contained leaf.** You are holding the plugin and not the book, so everything it restates is written out here, stamped with the version it was read at.

## Only domain folders live here

**`refs/` holds one folder per book domain and nothing else.** A folder under a domain is a group; a file under a group is named for a construct the book states; **a construct needing more than one file becomes a folder named for it.**

**A folder's `README.md` is that folder's own subject.**

| Domain | Holds |
| --- | --- |
| [`support/surface/`](support/surface/) | what a person sees and touches, stated before any stack is chosen — the standards of content and interaction, the patterns, the names, the architecture of the design system, its library and its delivery, and the specs a page starts from |

## Where the stack begins

**How a block is built in a stack, and where a web module's files sit, are the stack's, and no Surface ref names them.** spn-apps points into this plugin, at its entry ref `support/surface/README.md`, and this plugin names nothing in spn-apps: a pointer runs only toward a plugin the same world always loads, and never back.

## What is copied

**Two folders of specs**: [`support/surface/app-patterns/`](support/surface/app-patterns/) and [`support/surface/site-patterns/`](support/surface/site-patterns/), byte-identical to the book's, each with an index written by `restates files write`. The book owns every file in them.
