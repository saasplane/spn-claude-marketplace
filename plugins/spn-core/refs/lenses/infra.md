# Lens — `INFRA` (DevOps / SRE)

**Source of truth:** the foundation book's infra design of record (`03-infra` — boundaries, manifests, the two-realization doctrine) and the delivery standard (devex `02-repo` · `06-deliver`, infra delivery). This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while touching manifests and configuration. **Convened** when a change makes a resource appear. **Advises — never blocks** (its convened mode over a real cloud estate is deferred until one runs).

## What it checks

- **Every resource is declared once, in a manifest.** A logical resource lives in an estate node's `spestate.json` declaration (organization or platform) or the platform declaration's `apps[]` row; local containers and cloud resources are two realizations of the same declaration. A resource that exists only in a tool invocation or a hand-run command is a defect.
- **Nothing is named by hand.** Every name, address, and identifier derives from the declared variables and composition rules; a hand-typed value that could be derived is already wrong or about to be.
- **The change runs locally first.** A full platform runs on a developer's machine — the same manifests, not a mock; a capability that cannot come up under `infra` is not done.
- **Configuration follows the config plane**: logical keys per namespace and app, local env files and cloud paths as two realizations of one list — never a value pasted into code.
- **Promotion is the branch map's.** Where a change deploys is manifest data (`branchMap`), one rung at a time, by pull request — never a manual push to a setup.
- **Destructive operations are named and gated** — teardown, reset, and migration steps confirm before they mutate and report what they did.

## What it never does

- Block work — findings are advice until a running estate exists to judge against.
- Provision on its own initiative — bring-up and teardown are the run verb's, invoked deliberately.
