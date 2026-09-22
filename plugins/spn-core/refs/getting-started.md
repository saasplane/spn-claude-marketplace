<!-- spn:restates
{
  "chapters": [
    { "path": "docs/05-guides/README.md", "seen": "cf2482d4" }
  ]
}
-->

# Getting Started — Empty Repository to First Feature

**Source of truth:** the foundation book's guides seat (`docs/05-guides/` — its face *is* the day-zero guide). This file restates it for use inside a wired repository and adds nothing; where the two disagree, the book wins and this file is regenerated.

Follow this walk from nothing to a first feature in flight. Every step names the command or verb that carries it; statuses are honest — ✅ runs today, 🚧 the verb is still being built.

**Before step 1, the machine**, in the order one thing depends on the next: **node** at the version
the repositories pin, a version manager that reads that pin (`fnm` or `nvm`), **pnpm**, a **container
runtime** — the local estate is real containers rather than mocks — then a **browser**, and the CLI
last, **because it is what turns the rest on**: step 3 is `repo agent-sync`, which wires the agent to
the versions actually installed, so whatever is on the machine when the CLI arrives is what the agent
gets. **`spnutils --version` answering is the whole test**, and if
it does, step 1 is already done.

**The version is not written here**, because a number in prose goes out of date the first time
somebody bumps it. `.nvmrc` and the `engines` field carry it, and a version manager reads the file.

**The browser is `npm install -g playwright` then `npx playwright install chromium`**, and it goes in
before the CLI: it serves the checks that render a page rather than reading its source. Those report
*not checked* on a machine without it, so an install that skipped it still works. This is **not** the
automation profile: `spnutils` provisions its
own Chrome under `~/.spnutils/browser/chrome`, and you install nothing for that.

| # | Step | Runs | Status |
| --- | --- | --- | --- |
| 1 | Install the CLI | `spnutils` | ✅ |
| 2 | Create the repository and converge it — branches, protections, team access | `spnutils repo create` | ✅ |
| 3 | Wire the agent — plugins, managed instructions, version-matched rules | `spnutils repo agent-sync` | ✅ |
| 4 | Settle the platform's coordinates — the intake worksheet, landing as the concept's coordinates section | the `ideate` skill | ✅ |
| 5 | Decide what the platform is — `CONCEPT.md`: boundary, domains, surfaces; the scaffold at the next step reads it | the `ideate` skill | 🚧 |
| 6 | Create the monorepo and its `sprepo.json` — the stack claim and the infra couplings | the `new` skill, for a platform | 🚧 |
| 7 | Bring the platform up locally | `infra organization up` · `infra platform up` | ✅ |
| 8 | Create the first app and register it | the `new` skill · `infra app up` | 🚧 |
| 9 | First feature — plan, then build | the `plan` skill → the `implement` skill | 🚧 |
| 10 | Refresh the wiring after upgrades | `spnutils repo agent-sync` | ✅ |

Three things worth knowing on day one:

- **The agent arrives equipped.** After step 3 it holds the persona, the skills, and rules matched to what is actually installed. It reads contract surfaces on demand instead of remembering them.
- **Docs are not paperwork after the fact** — planning *produces* rows in the owning module's `docs/03-behaviors/README.md`; building flips their statuses. There is never a second record to reconcile.
- **A full platform runs on your machine** — not a mock; the same manifests that drive your laptop will drive the cloud.
