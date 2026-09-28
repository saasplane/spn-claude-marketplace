# What these refs are, and how they are arranged

**A ref is a self-contained leaf.** You are holding the plugins and not the book, so everything a ref restates is written out here — and each says at the top which chapter it restates and the version it was read at.

## Only domain folders live here

**`refs/` holds one folder per book domain and nothing else.** A folder under a domain is a group, and a file under a group is named for a construct the book states.

**A construct that needs more than one file becomes a folder named for it**, and expands inside. That is why `workspace/docs/` and `utils/spnutils/` are folders: one holds the doc-set grammar split three ways, the other separates what is written from what is generated.

**A folder's `README.md` is that folder's own subject** — the group's, or the construct's where the folder is a construct.

| Domain | Holds |
| --- | --- |
| [`devex/function/`](devex/function/) | the eight stages, in the order they read |
| [`devex/agent/`](devex/agent/) | what a plugin is, what a skill is, and the eleven lenses |
| [`devex/utils/`](devex/utils/) | the CLI — what it is, and every command it answers |
| [`devex/workspace/`](devex/workspace/) | the workspace, the workstream, what a repository declares, and the doc rules |

## What is authored, and what is not

**Almost everything here is authored**, read from a chapter and written for you, stamped with the version it was read at. A drift check compares those stamps against the book and reports what moved.

**One file is generated**: `devex/utils/spnutils/commands.md`, from the released CLI. A command added to the binary changes no document, so no stamp would move and nothing would report a hand-written list going stale.

**And one folder is copied byte for byte** — `workspace/docs/templates/`, because a template is the thing you copy rather than a thing you restate.
