<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/README.md", "seen": "96f660d6" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/01-scm.md", "seen": "e68cbe59" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/06-deliver.md", "seen": "c587fb16" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/02-delivery.md", "seen": "5e08fcd6" }
  ],
  "decisions": [
    "RD.APPS.121",
    "RD.DEVEX.060"
  ]
}
-->

# Lens — `INFRA` (DevOps / SRE)

**Source of truth:** the foundation book's infra design of record (`02-support/02-infra` — boundaries, manifests, the two-realization doctrine) and the delivery standard (devex `01-function/01-scm` · `01-function/07-deliver` · `03-utils/01-spnutils/02-delivery`). This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while touching manifests and configuration. **Convened** when a change makes a resource appear. **Advises — never blocks** (its convened mode over a real cloud estate is deferred until one runs).

## What it checks

- **Every resource is declared once, in a manifest.** Declare a logical resource in an estate node's `spestate.json` (organization or platform) or the platform declaration's `apps[]` row; local containers and cloud resources are two realizations of the same declaration. A resource that exists only in a tool invocation or a hand-run command is a defect.
- **Nothing is named by hand.** Derive every name, address, and identifier from the declared variables and composition rules; a hand-typed value that could be derived is already wrong or about to be.
- **The change runs locally first.** Run a full platform on a developer's machine — the same manifests, not a mock; a capability that cannot come up under `infra` is not done.
- **Configuration follows the config plane**: logical keys per namespace and app, local env files and cloud paths as two realizations of one list — never a value pasted into code.
- **Promotion is the branch map's.** Where a change deploys is manifest data (`branchMap`), one rung at a time, by pull request — never a manual push to a setup.
- **Ask who invokes a script before you ask where it belongs.** A person or a pipeline reaches for a `tasks/` script or a CLI command, and the agent's own loop reaches for a hook, so a check or a tool the agent runs itself belongs in the plugin under `hooks/` or `hooks/tools/`. The bar there is **foundational** — a check every SaaS Plane repository owes, never one this product happens to want — and an agent that judges one warranted **proposes** it and builds it only once that is approved. A hook degrades to silence: one that cannot read the input it wanted says nothing, and the agent keeps working. A `tasks/` script cannot degrade that way, because in a repository that does not hold it there is nothing for a gate to report against (decision RD.DEVEX.060).
- **A repo-scoped script ends up one of three ways, and a script that probes the estate for a declared fact ends up only one of them.** `tasks/` is where a repository keeps the on-demand scripts its own developers run, so an empty one is not the goal. A task **stays** where the work is genuinely this repository's, such as a sandbox tied to one cloud account. It is **promoted** to a CLI command where everything it needs is declared in SPN manifests rather than typed into the script. **It retires** where it was a workaround for something the platform did not answer and now does. A script that probes a running system for a fact a manifest already declares is that third case. Promote it and the workaround becomes permanent, with the absence that caused it still there (decision RD.APPS.121).
- **Destructive operations are named and gated** — teardown, reset, and migration steps confirm before they mutate and report what they did.

## What it never does

- Block work — findings are advice until a running estate exists to judge against.
- Provision on its own initiative — bring-up and teardown belong to the `up` and `down` commands, invoked deliberately.
