<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/01-bootstrap.md", "seen": "98d7690f" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/01-bootstrap.md", "seen": "af018421" },
    { "path": "spn-foundation/docs/05-guides/README.md", "seen": "9c97f7cb" }
  ]
}
-->

# Bootstrap — Empty Folder to First Feature

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/01-bootstrap.md` and `04-capabilities/01-devex/01-function/01-bootstrap.md` for the stage, and the guides seat (`docs/05-guides/`) for the walk itself. This file restates them for use inside a wired workspace and adds nothing; where the two disagree, the book wins and this file is regenerated.

Follow this walk from nothing to a first feature in flight. Every step names the command that carries it; statuses are honest — ✅ runs today, 🚧 the command is still being built.

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
*not checked* on a machine without it, so an install that skipped it still works. **The browser you
install here is for the rendering checks, not for automation**: `spnutils` provisions its own Chrome
under `~/.spnutils/browser/chrome`, because Chrome refuses automation on the default one, and you
install nothing for that.

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

## The pages you write, and where their shapes come from

**You do not have the foundation book, and you do not need it.** The shapes every repository uses
ship with these plugins, beside this file:

| What you are writing | Its shape |
| --- | --- |
| an approach page, to argue a piece of work | [`templates/workstream/approach-template.html`](../workspace/docs/templates/workstream/approach-template.html) |
| a question you cannot answer alone | [`refs/decision-cards.md`](../workspace/docs/decision-cards.md) — it is a card, and a card is `div.open` wrapping an `h4` whose id is its number |
| a construct, a domain face, an overview | [`refs/doc-sets.md`](../workspace/docs/doc-sets.md) |
| the markdown and figures inside any of them | [`refs/blocks.md`](../workspace/docs/blocks.md) |

**Copy the template rather than writing a page from memory.** It carries the section order, the card
shape and the furniture every check reads, and a page assembled by hand is a page that passes review
and fails a gate.

**If a shape you need is not here, that is a defect in these plugins and not a licence to invent
one.** Say so, and it gets restated — the book owns the rule, and this ref set is how it reaches you.
