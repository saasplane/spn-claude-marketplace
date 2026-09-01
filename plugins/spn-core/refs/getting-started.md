# Getting Started — Empty Repository to First Feature

**Source of truth:** the foundation book's guides seat (`docs/04-guides/` — its face *is* the day-zero guide). This file digests it for use inside a wired repository and adds nothing; where the two disagree, the book wins and this file is regenerated.

Follow this walk from nothing to a first feature in flight. Every step names the command or verb that carries it; statuses are honest — ✅ runs today, 🚧 the verb is still being built.

| # | Step | Runs | Status |
| --- | --- | --- | --- |
| 1 | Install the CLI | `spnutils` | ✅ |
| 2 | Create the repository and converge it — branches, protections, team access | `spnutils repo create` | ✅ |
| 3 | Wire the agent — plugins, managed instructions, version-matched rules | `spnutils repo agent-init` | ✅ |
| 4 | Settle the platform's coordinates — the intake worksheet, landing as the concept's coordinates section | the `ideate` skill | ✅ |
| 5 | Decide what the platform is — `CONCEPT.md`: boundary, domains, surfaces; the scaffold at the next step reads it | the `ideate` skill | 🚧 |
| 6 | Create the monorepo and its `sprepo.json` — the stack claim and the infra couplings | the `new` skill, for a platform | 🚧 |
| 7 | Bring the platform up locally | `infra organization up` · `infra platform up` | ✅ |
| 8 | Create the first app and register it | the `new` skill · `infra app up` | 🚧 |
| 9 | First feature — plan, then build | the `plan` skill → the `implement` skill | 🚧 |
| 10 | Refresh the wiring after upgrades | `spnutils repo agent-sync` | ✅ |

Three things worth knowing on day one:

- **The agent arrives equipped.** After step 3 it holds the persona, the skills, and rules matched to what is actually installed. It reads contract surfaces on demand instead of remembering them.
- **Docs are not paperwork after the fact** — planning *produces* rows in the owning module's `docs/02-behaviors/README.md`; building flips their statuses. There is never a second record to reconcile.
- **A full platform runs on your machine** — not a mock; the same manifests that drive your laptop will drive the cloud.
