# What these refs are, and how they are arranged

**A ref is a self-contained leaf.** You are holding the plugins and not the book, so everything a ref restates is written out here — and each says at the top which chapter it restates and the version it was read at.

## Only domain folders live here

**`refs/` holds one folder per book domain and nothing else.** A folder under a domain is a group, and a file under a group is named for a construct the book states.

**A construct that needs more than one file becomes a folder named for it**, and expands inside. That is why `workspace/docs/` is a folder: the doc-set grammar splits three ways plus a copied templates set, and each part earns its own ref. Every other construct here — `utils/spnutils.md` among them — is one file, because it does not expand that way.

**A folder's `README.md` is that folder's own subject** — the group's, or the construct's where the folder is a construct.

| Domain | Holds |
| --- | --- |
| [`devex/function/`](devex/function/) | the eight stages, in the order they read |
| [`devex/agent/`](devex/agent/) | what a plugin is, what a skill is, and the lenses |
| [`devex/utils/`](devex/utils/) | the CLI — what it is, and every command it answers |
| [`devex/workspace/`](devex/workspace/) | the workspace, the workstream, what a repository declares, and the doc rules |

## What is authored, and what is not

**Everything here is authored** — read from a chapter and rewritten in this ref's own words, stamped with the version it was read at. A drift check compares those stamps against the book and reports what moved.

**One folder is copied byte for byte** — `workspace/docs/templates/`, because a template is the thing you copy rather than a thing you restate.

**No file here is generated from a running tool.** A `commands.md` rendered from `spnutils help --json` was tried and dropped (2026-09-28): the command surface has one source, the book, and `utils/spnutils.md` restates it the same way any other ref restates its chapter — through `docs`, in its own words — rather than adding a second generator for the same facts.
