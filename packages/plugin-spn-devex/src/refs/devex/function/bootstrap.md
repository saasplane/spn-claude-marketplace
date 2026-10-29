<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/01-bootstrap.md",
      "seen": "0ada37d2"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/01-bootstrap.md",
      "seen": "ada95ffb"
    },
    {
      "path": "spn-foundation/docs/05-guides/README.md",
      "seen": "837ce036"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "seen": "68c1e693"
    }
  ]
}
-->

# Bootstrap — Empty Folder to First Feature

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/01-bootstrap.md` and `04-capabilities/01-devex/01-function/01-bootstrap.md` for the stage, the guides seat (`docs/05-guides/`) for the walk itself, and `04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md` for `workspace init <name>`. This file restates them for use inside a wired workspace and adds nothing; where the two disagree, the book wins and this file is regenerated.

Follow this walk from an empty folder to one sample platform answering on the laptop, then a first feature in flight. Every step names the command or skill that carries it; statuses are honest — ✅ runs today, 🚧 the step works but by hand, or with the agent improvising more than it should. No cloud account is needed: AWS is only for standing environments in the cloud, and that walk comes later.

**Before step 1, the machine**, in the order one thing depends on the next: **node** at the version
the repositories pin, a version manager that reads that pin (`fnm` or `nvm`), **pnpm**, **OpenTofu**
(`tofu`, never `terraform` — every infra node is OpenTofu, and its tests plan with `tofu test`),
**`jq`** — an infra node's contract cases read its declaration with it — a **container runtime** —
the local estate is real containers rather than mocks — then a **browser**, **VS Code with the Claude
extension**, and the CLI last, **because it is what turns the rest on**: step 2 is `workspace init <name>`,
which wires the agent to the versions actually installed, so whatever is on the machine when the CLI
arrives is what the agent gets. **`tofu -v` reporting OpenTofu, `jq --version` answering and
`spnutils --version` answering are the whole test**, and if all three do, the machine is ready.

**Before step 1, the accounts and tokens.** A **GitHub organization** the two repositories are created
under, which must exist before `repo create` runs and which the organization node's `providers.scm.org` names, and a **fine-grained token** for it kept in the machine seat as `SPN_DEVEX_AGENT_GITHUB_TOKEN`,
in the `spnutils:devex` region. `repo create` reads it. Its repository permissions are Administration,
Contents and Pull requests read and write and Actions read; its organization permission is Members read
and write. **Read access to the `@saasplane` packages' registry** is granted, not public: ask SaaS Plane for it. A Figma token is
needed only to work on the design library.

**The version is not written here**, because a number in prose goes out of date the first time
somebody bumps it. `.nvmrc` and the `engines` field carry it, and a version manager reads the file.

**The browser is `npm install -g playwright` then `npx playwright install chromium`**, and it goes in
before the CLI: it serves the checks that render a page rather than reading its source. Those report
*not checked* on a machine without it, so an install that skipped it still works. **The browser you
install here is for the rendering checks, not for automation**: `spnutils` provisions its own Chrome
under `~/.saasplane/state/browser/chrome`, because Chrome refuses automation on the default one, and you
install nothing for that.

**Part 1 · Your workspace**

| # | Step | Where | Runs | Status |
| --- | --- | --- | --- | --- |
| 1 | Install the CLI | Terminal | `npm install -g @saasplane/utility-ts` | ✅ |
| 2 | Mint the workspace and name it — marketplace, plugin union, permission tiers, `~/.spnenv`, `.spndevex/` with its `state.json`; every repository inside wired. The name is lower-case letters, digits and hyphens, given once | Terminal | `spnutils workspace init <name>` | ✅ |
| 3 | Open the folder in VS Code and Claude | Terminal · Claude in VS Code | `code .` | ✅ |
| 4 | Read the orientation, and fill the GitHub token in the machine seat | Terminal | `spnutils workspace status` | ✅ |

**Part 2 · Your estate** (the infra repository)

| # | Step | Where | Runs | Status |
| --- | --- | --- | --- | --- |
| 5 | Settle the coordinates, one question at a time, and read them back for a yes | Claude in VS Code | the `bootstrap` skill | 🚧 |
| 6 | Bring the organization up — the machine's trust bootstrap, before any repository | Terminal | `spnutils infra organization up --apply` | ✅ |
| 7 | Make the estate folder `<org>-infra`, start git in it, mint it as the estate and wire it; nothing is created in GitHub yet, because `repo create` reads the organization node | Terminal | `mkdir <org>-infra` · `git init` · `spnutils infra scaffold repo` · `spnutils workspace agent-sync` | ✅ |
| 8 | Scaffold the organization node, then the platform node | Claude in VS Code (writes) · Terminal (runs) | `spnutils infra scaffold organization <org>` · `spnutils infra scaffold platform <spc> --ports <first>` | ✅ |
| 9 | Fill what only the developer knows, the GitHub organization in `providers.scm.org` first, then validate | Claude in VS Code · Terminal | `spnutils infra validate` | ✅ |
| 10 | Create the estate repository from inside the folder — branches, protections, team access — then add it as `origin` and push; it opens no checkout and refuses when the GitHub organization does not exist | Terminal, led by the agent | `spnutils repo create <org>-infra` · `git remote add origin <url>` · `git push` | ✅ |
| 11 | Release both into the machine store, organization first | Terminal | `spnutils infra release <package> --local` | ✅ |

**Part 3 · Your platform** (the apps repository)

| # | Step | Where | Runs | Status |
| --- | --- | --- | --- | --- |
| 12 | Create the platform repository from a new folder beside the estate; no pin exists yet, so the command takes `--from`, the estate node answering which organization's SCM (`package@version` or a path), then add `origin` and push | Terminal, led by the agent | `spnutils repo create <org>-<spc>-<stack> --from <organization package>@<version>` | ✅ |
| 13 | Scaffold it against both pins, then wire | Claude in VS Code (asks) · Terminal (runs) | the `new` skill → `spnutils apps scaffold repo --stack <stack> --organization <ref> --platform <ref>` | 🚧 |
| 14 | Decide what the platform is — `CONCEPT.md`: boundary, domains, surfaces, one agreed block at a time | Claude in VS Code | the `ideate` skill | 🚧 |
| 15 | Scaffold the projects the concept implies | Claude in VS Code (asks) · Terminal (runs) | the `new` skill → `spnutils apps scaffold kind <kind>` | 🚧 |
| 16 | Name the provider keys; the developer fills the machine seat; confirm by name, never by value | Claude in VS Code · Terminal | `spnutils workspace status` | 🚧 |
| 17 | Bring the platform up locally | Terminal | `spnutils infra platform up <spc> --apply` | ✅ |
| 18 | Register each app | Terminal, led by the agent | `spnutils infra app up <package>` | ✅ |
| 19 | Run it, and say what should be seen — each app on `https://{label}.{local domain}` (label: the app row's `subdomains` entry; domain: `providers.local.domains.platform.domain`, `lc-spndemo.app` for the sample `dmo`), served on 443 with nothing added to `/etc/hosts`; the first sign-in at `https://identity.{local domain}/login`, landing on the identity dashboard; an empty console | Claude in VS Code | the `run` skill | 🚧 |

**Part 4 · Your first feature**

| # | Step | Where | Runs | Status |
| --- | --- | --- | --- | --- |
| 20 | First feature — design, build, prove | Claude in VS Code | the `ideate` skill → the `implement` skill → the `verify` skill | 🚧 |

**Then**

| Step | Where | Runs | Status |
| --- | --- | --- | --- |
| After an upgrade, refresh the wiring | Terminal | `spnutils workspace agent-sync` | ✅ |

The walk ends on the laptop. What an AWS account adds is a separate walk, after this one.

Three things worth knowing on day one:

- **The agent arrives equipped.** After step 2 it holds the persona, the skills, and rules matched to what is actually installed. It reads contract surfaces on demand instead of remembering them.
- **Docs are not paperwork after the fact** — planning *produces* rows in the owning module's `docs/03-behaviors/README.md`; building flips their statuses. There is never a second record to reconcile.
- **A full platform runs on your machine** — not a mock; the same manifests that drive your laptop will drive the cloud.

## The pages you write, and where their shapes come from

**You do not have the foundation book, and you do not need it.** The shapes every repository uses
ship with these plugins, beside this file:

| What you are writing | Its shape |
| --- | --- |
| an approach page, to argue a piece of work | [`templates/workstream/approach-template.html`](../workspace/docs/templates/workstream/approach-template.html) |
| a question you cannot answer alone | [`refs/devex/workspace/docs/decision-cards.md`](../workspace/docs/decision-cards.md) — it is a card, and a card is `div.open` wrapping an `h4` whose id is its number |
| a construct, a domain face, an overview | [`refs/devex/workspace/docs/doc-sets.md`](../workspace/docs/doc-sets.md) |
| the markdown and figures inside any of them | [`refs/devex/workspace/docs/blocks.md`](../workspace/docs/blocks.md) |

**Copy the template rather than writing a page from memory.** It carries the section order, the card
shape and the furniture every check reads, and a page assembled by hand is a page that passes review
and fails a gate.

**If a shape you need is not here, that is a defect in these plugins and not a licence to invent
one.** Say so, and it gets restated — the book owns the rule, and this ref set is how it reaches you.
