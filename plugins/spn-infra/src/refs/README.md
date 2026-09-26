# What these refs are, and how they are arranged

**A ref is a self-contained leaf.** You are holding the plugin and not the book, so everything it restates is written out here, stamped with the version it was read at.

## Only domain folders live here

**`refs/` holds one folder per book domain and nothing else.** A folder under a domain is a group; a file under a group is named for a construct the book states; **a construct needing more than one file becomes a folder named for it** — which is why `shape/` and `providers/` are folders.

**A folder's `README.md` is that folder's own subject.** [`support/infra/README.md`](support/infra/README.md) is the estate laws, because those are the rules the whole group obeys and they belong to no single construct.

| Holds | |
| --- | --- |
| [`support/infra/`](support/infra/) | the estate — shape, packages, blueprints, resources, apps, modules, trust, operate, what it ships, and the providers that render it |

## The clouds are inside, and so is the machine

**`support/infra/providers/` holds one folder per provider**, and the machine is one of them rather than a special case. It answers more of the contract today than either cloud does.

**Every provider answers the same questions under the same file names.** A provider with no capability writes the file and says what to do instead — and a refusal is a ruling rather than a gap. The machine is one environment, so pointing an environment command at it is refused by name.

## Estate caution, wherever you are

**Cloud mutation goes through the CLI's own doors.** `tofu apply` and `tofu destroy` are never hand-run, on any cloud, at any layer — and the habit holds on a laptop, because the habit is what carries to the estate.

**`up` and `down` each take exactly one of `--plan` or `--apply`, and there is no default.** A command that plans when you forget a flag is a command doing another command's job.

## What is generated

**Nothing here.** Every file is authored and stamped.
