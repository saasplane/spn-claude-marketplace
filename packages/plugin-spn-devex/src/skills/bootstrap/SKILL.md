---
name: bootstrap
description: Open the door of an empty workspace and lay a partner's whole foundation out - three paths (start a new platform, join an existing one, just look around); for a new platform a few questions in chat, then the foundation workstream written whole from the layout data with every round, section and arc Pending, the ground's accounts checked, and each answer recorded once; at its go the acts that bring the organization up, make and release the estate, create the platform repo and its skeletons, name the provider keys and run the stack; for a joiner one question, then the workspace, the clones, the sign-ins, the running stack and an onboarding read. Use when the workspace holds no sprepo.json at all, when someone is starting a new organization or platform from nothing, when a new developer is joining a team's platform from a fresh workspace, or when the session orientation reports day-0 mode. Interactive by design - you ask, they answer, and no act runs on an answer nobody gave. Stack-agnostic.
---
<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "00d468e8"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/01-bootstrap.md",
      "seen": "ccd7faef"
    }
  ]
}
-->

# bootstrap — an empty folder becomes a partner's foundation

**Read [`refs/devex/workspace/workstream.md`](../../refs/devex/workspace/workstream.md) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes. **Read [`refs/devex/function/bootstrap.md`](../../refs/devex/function/bootstrap.md) too**: it restates the door, the ground, the foundation workstream and the joining path this walk carries out.

Scan the workspace root, find no `sprepo.json` anywhere, and you are on day zero. You have no code to pattern-match against, and that is the condition this walk is written for. What you do have is the standards, the published packages, the shape every platform here already takes, and **the layout data**, `refs/devex/workspace/foundation-layout.json`, which is the whole foundation workstream's shape.

**The person types the install, `spnutils workspace init <name>`, and nothing else.** They installed the toolchain and `spnutils`, signed in to GitHub and the registry, ran `workspace init` in an empty folder and opened VS Code with Claude Code there. From here every skill and every `spnutils` command is yours to run (`RULE.DEVEX.FUNCTION.105` · MUST · skill:spn-devex/bootstrap). Never ask them to type one.

**Nothing in this walk is hand-made except the folders and the git remotes.** Every other file arrives from a command. If you find yourself opening an editor to create a manifest, stop. A command owns that file, and hand-writing it starts a workspace out of standard on day one.

## The door — three paths

**Open on the door, and wait for the answer.** The orientation screen already puts the question on the table, so you are continuing it rather than opening a new one.

| Path | What you do next | What it creates |
| --- | --- | --- |
| Start a new platform | the few chat questions, then the foundation workstream written whole | the foundation workstream |
| Join an existing platform | one question, then [the joining path](#the-joining-path) | the joining workstream, the clones, the local stack |
| Just look around | answer what they ask, and show the book and the orientation | nothing |

**Only the first two paths create anything.** Looking around leaves the folder as it is, and the session stays in day-0 mode for whenever they come back. **Never take a path on a maybe.** Minting a workspace is cheap to do and awkward to explain to somebody who only asked what this was.

## The ground — checked, never decided

The ground is what must exist before you can create a repository or stand an estate up, and that no tool can create for them. **You check each item and never decide it** (`RULE.DEVEX.FUNCTION.106` · MUST · skill:spn-devex/bootstrap). The layout data's `ground` lists them, each with its check and what it blocks; they are the Ground section of the foundation workstream's ideate preview.

- **An item turns Done only when its check passes.** `gh auth status`, `spnutils workspace status`, a registry read as the person, `spnutils workspace env show` for the keys. Their word that it is done is not the check.
- **A cloud read waits for their yes at that step.** The cloud account, Organizations, the quota case and the identity seat are read only, each on the developer's approval at that step, and no AWS read happens before it. Ask each time.
- **The go waits only on the items marked `GO`.** A platform runs locally on day 0, so a founder with no domain or cloud account yet finishes the foundation, and the `CLOUD` items carry to the cloud walk in the follow-ups arc.
- **The decisions stay in the rounds.** The domain's name, the cloud and the region are answers in round 6; the ground only says whether what was decided exists yet.

## A new platform — the foundation workstream, written whole

### The chat questions, before anything is written

Ask the layout data's `questions`, one at a time: the path, the workspace's name (where `.spndevex/` is not already the workspace's), who the platform is for (customers outside the company, or the company itself), and the product in one sentence. **These are the only questions asked before the workstream exists**, because the workstream is where every later answer is kept.

- **The workspace's name** is lower-case letters, digits and hyphens, starting with a letter, at most 40 characters, such as `saasplane` or `acme-platform`. Where `.spndevex/` is not yet the workspace's, run `spnutils workspace init <name>` with it; init writes it to the `workspace` node of `.spndevex/state.json` and also writes the saasplane env's **shape**, deriving no key. Where `.spndevex/` is already the workspace's, init has run, and you never run it again.

### Write the workstream from the layout data

**Read the number, never type one.** `spnutils workspace status` prints `next free number NNN`. The subject is `foundation`.

```
.spndevex/workstreams/open/{NNN}-foundation/
  approach.html                     the page, from the plugin's template: masthead, Why, What, Plan, Open
  arcs/
    ideate/                         the flow: its layout.json holds every section, and the answers
      layout.json                   written by `workstream layout write`, changed only by the layout commands
    N001/ … N006/                   the decide-only arcs, each opened from the layout data
    follow-ups/                     one workstream per module after the go, the design language rounds, the cloud walk
  notes/
    ideate/arc.html                 the Ground, the flow round by round, the read-back
    N001/ … N006/arc.html       each arc's tree of where it lands
```

Write these in order, before the founder is asked anything more (`RULE.DEVEX.FUNCTION.108` · MUST · skill:spn-devex/bootstrap):

1. **The page.** Copy `refs/devex/workspace/docs/templates/workstream/approach-template.html` to `approach.html`. Its masthead reads `{NNN} - Foundation`; its Why quotes the product sentence; its What has one entry per arc.
2. **The role arcs**, `spn-devex workstream arc edit {NNN}/ideate` and `spn-devex workstream arc edit {NNN}/follow-ups`.
3. **The sections**, with what the chat questions told as Known:

   ```sh
   spn-devex workstream layout write {NNN} --known "1.1=<who it is for, in their words>" --known "1.2=<the product sentence>"
   ```

   Every other section is written `PENDING` with its Needed and its Waits on. The command prints one `arc edit` line for each arc of the layout data.
4. **The arcs**, by the lines it printed, each with `{NNN}` in place of `<workstream>`. Each `--note` says the layout opened it, which is the ideate arc's proposal (`RULE.DEVEX.WORKSPACE.539` · MUST · skill:spn-devex/bootstrap). None of them is empty, because every section names what it waits on.
5. **The previews.** The ideate preview holds the Ground table and the flow round by round, each section with Known, Needed and Waits on; each arc's preview holds its tree of where it lands, each leaf `— not yet decided`. Copy `arc-template.html` for each and take out every slot they do not fill.
6. **The Plan rows and the stamps**: `spn-devex docs cycles write {NNN}`, then `spn-devex workstream arc stamp write {NNN}/<arc>` for each arc. `spn-devex workstream state check {NNN}` then reads no finding.

**The layout is read-only.** The rounds, sections, views and arcs come from the data, never from you; a change to them is a change to the book and the plugins (`RULE.DEVEX.WORKSPACE.540` · MUST · skill:spn-devex/bootstrap). A part that does not apply is struck, not deleted.

### The rounds, one section at a time

| Round | Starts with · joins when | Sections |
| --- | --- | --- |
| 1 · Vision and phases | STRATEGY, PRODUCT, BUSINESS, LEAD · DATA, ARCHITECT, GROWTH, FINANCE | who it is for, the long-term vision, growth stages (Prove · Repeat · Grow · Scale, in their unit), phases, the data and its processing, seams and hard-to-undo choices |
| 2 · Domains | PRODUCT, ARCHITECT, DATA · TRUST, PARTNER, AI | domains and subdomains, what each owns, regulated data, outside services, each domain against the modules |
| 3 · Product shape | BUSINESS, PRODUCT, TRUST · SALES, SUPPORT, GROWTH | business models, categories, apps and pools (derived), each category's arrival |
| 4 · Surface shape | UX, UI, PRODUCT · MARKETING, VOICE, WEB_DEV, PARTNER | delivery per audience, page kinds per app, a public site or none, the brand |
| 5 · Runtime shape | ARCHITECT, SERVER_DEV, INFRA · TRUST, FINANCE, PARTNER, AI | modules, services, workloads, stores with messaging and secrets, sizes |
| 6 · Estate shape | INFRA, TRUST, ARCHITECT · FINANCE, LEAD | organization and hosting, cloud and regions, domains and environments, teams and owners |
| Read-back | LEAD, ARCHITECT | the hard-to-undo list first, then every decision, then what the skeletons will be |

**Vision comes first, as the founder tells it.** Take the next section whose Waits on is answered, in the round's order, and bring the views the round starts with; a view that joins comes in when the section's question reaches it. No round convenes all of them.

**Record each answer once, the moment it is given** (`RULE.DEVEX.WORKSPACE.541` · MUST · skill:spn-devex/bootstrap):

```sh
spn-devex workstream layout answer {NNN} 1.4,3.1 --said "<their words, as they gave them>"
spn-devex workstream layout decide {NNN} 1.4,3.1          # on their yes
spn-devex workstream layout strike {NNN} 4.3 --said "<their words>"   # a part that does not apply
spn-devex workstream layout change {NNN} D002 --said "<their new words>"   # reopens every section citing D002
```

Name every section the answer fills, across rounds and arcs, so it is cited where it lands and never typed twice. Bring the section's preview current in the same step. A window that closes picks up at the next Pending section: `spn-devex workstream layout show {NNN}` says where.

**Unfold the partner's idea in the order their own words lead** (`RULE.DEVEX.FUNCTION.098` · MUST · skill:spn-devex/ideate). Each step waits for the one before it:

1. **The idea, in their words**, quoted, and what it proves for them.
2. **The trade before the constructs.** The actors in the trade's own words, then the modules and the states by name, then the day-zero flow, and only then the cut of how deep the first version goes. Fields come when they ask for them, and each category's journey asks them once the category tree is derived.
3. **The existing twin before a new construct.** Each part names the construct the book or the platform already holds for it, and a new construct is proposed only where none fits.
4. **Several modules are planned with a split test and one table.** The test says why the modules split where they do, and one module table holds the set, which the developer decides and names.
5. **Open asks stay few.** A *settled so far* table holds what is agreed, and no more than three asks are open at once.
6. **Each new term is defined once,** where it first appears, and used the same way after.
7. **The preview follows their spine,** the order in which they told the idea, and not the order of the book's chapters.

**The foundation decides the shape and leaves each module's inside to the next workstreams.** Round 2 settles high-level domains and subdomains; a module's states, contract, schema and journeys are its own workstream's, which the follow-ups arc names.

**The brand is asked in section 4.4**, colour, greys, typefaces, references and media kinds, and every answer may be *not yet*. The read-back then names the brand, or *the design system's own look until you have one*. Each app's design language row lists its page kinds (`SITE` for public pages, `APP` for signed-in pages), and the scaffold writes the app's theme setting from it.

## Round 6 and round 3 — the estate and product questions

Get these wrong and you rename accounts, package scopes and every code prefix after the code exists. They are the sections of round 6 (6.1 to 6.3) and round 3 (3.1), plus the stack and the closest twin, which the estate arc N006 and the runtime arc N004 record. Ask them one at a time, and record each with `layout answer` as it arrives.

**Most of what the scaffold needs is derived rather than asked.** Your job is to know the whole inventory and ask only the part nobody can work out. The two tables below are that split, and the second one is the longer of the two on purpose.

### What you ask

| # | What you ask | Section | What their answer decides |
| --- | --- | --- | --- |
| 1 | The organization's code, its name, and the mail domain | 6.1 | Every account address, the package scope, the repository names, the estate's root |
| 2 | The legal entity — its registered name and address | 6.1 | `legal.name` and `legal.address` on the organization, and the public trust page later |
| 3 | The hosting account the repositories are created under | 6.1 | `providers.scm.org` and `providers.scm.mtype` on the platform manifest |
| 4 | The cloud, its home region, and which cloud region each estate region maps to | 6.2 | `providers.cloud.mtype`, `.home` and `.regions[].region` on the organization |
| 5 | One platform or several, the code and the name for each, and its domain | 6.3 | The estate nodes, the isolation units, and every `{APP}_` prefix |
| 6 | The platform's first human — email, first name, last name, display name | 6.3 | `owner.*` on the platform, and who the first account belongs to |
| 7 | The region they launch in, and where each Account's data must stay | 6.2 | `regions[].code`, and the residency answer the compliance envelope reads |
| 8 | Which business models the partner sells — **more than one is allowed** | 3.1 | The category tree, and through it the pools, categories and apps the partner's product module declares |
| 9 | Which service domains the product needs | 2.1 | The app set and the module set — and whether an existing module already answers |
| 10 | Whether they want a public marketing site at launch | 4.3 | Whether `www` is scaffolded |
| 11 | The stack | 5.1 | Which apps plugin binds the platform repo, and which scaffolds run |
| 12 | Which platform here is the closest twin | 2.5 | Whether a mechanism transfers, or whether they are genuinely inventing one |

### Section 6.4 — the shape questions

The repositories the go makes follow these answers, so they are asked before anything is made, and each is recorded as it arrives.

| Section | The questions |
| --- | --- |
| 6.4 | The shape questions, at most three, one at a time, each with its reason: (1) *How many teams will build on the platform?* One team keeps the platform's concept in the platform's own docs; several teams need a book of their own first. (2) *Will any team build its own services or app libraries in its own repository?* Each becomes a repository that joins when the team starts, and is known to the others by its published client. (3) *Do you keep infra material of your own beside the estate?* It becomes an infra support repository, made before the estate |

### What you derive, and must never ask

| It derives | From | The rule |
| --- | --- | --- |
| The category tree the platform declares | the business models | the table below, unioned, duplicates collapsed |
| The apps, and so the surface set | the categories | one app per category that signs in, plus the `IDENTITY` app. `www` is a host the estate deploys, never an app row |
| Both repository names | `{org}`, `{spc}` and the stack | `{org}-infra` and `{org}-{spc}-{stack}` |
| `apps[].repo` and `apps[].kindCode` | the surfaces | declared data, which is why the read-back reads the names back |
| `modules[].code`, `.layer`, `.after` | the service domains | the module set the domains imply |
| `networkIndex` and `network.index` | position | `0` for the first |
| `blueprint.package` and `.version` | the published blueprints | the current pin |
| The setup, and so the environment | nothing — it is defaulted | `dev`, giving one environment named `{region}-dev` |

- **The setup is safe to default and the region is not.** `uat`, `stg` and `prod` are catalog rows added when somebody needs them, so starting at one costs nothing. A region is a residency answer with legal weight, and it is written into the manifests.
- **The business model question is the one that must accept several answers.** A platform may sell B2B and B2B2C together, and a single-select control would make that unanswerable. A set of one is the ordinary answer rather than an edge case.

### Business model to categories, which is the derivation everything else hangs off

The answer is a category tree. Each model is made from categories and the apps that open them, and no category is added for a model, since an app is the door one audience signs in through and a model is the choice of which doors are open.

| Business model | Categories it declares | Apps it opens |
| --- | --- | --- |
| B2C | Platform → Account, one person's organization | account |
| B2B | Platform → Account | account |
| B2B2C | Platform → Account → Account Consumer | account, account-consumer |
| B2B2B | Platform → Account → Account Enterprise | account, account-enterprise |
| Marketplace | Platform → Merchant and Shopper | merchant, shopper |

`Platform` always exists, so it is never in the table and never asked about.

**Take the union and collapse the duplicates.** B2B with B2B2C and B2B2B declares `Account` once, then `Account Consumer` and `Account Enterprise` beside it.

**The answer writes the partner's product module.** A platform has one app-owned product module, named by the platform's code, and it declares the pools, categories and apps the partner sells. Write it with only those, so nothing is switched off afterwards and no migration closes a door. Each app carries its kind code and its platform site's subdomain, and every declared app opens at the first run. `IDENTITY` joins them, because business apps never implement login. `www` is a host, not an app, so the product module declares no row for it; it is scaffolded only when they asked for a marketing site. Adding a model later adds a category and an app to the product module.

**Marketplace composes on a different axis from the rest.** Every other model declares categories under the customer's own account. Marketplace declares merchants and shoppers beneath the platform itself. Choosing it beside B2B is not a contradiction, and it is what produces the widest set of apps.

### Each category's journey, section 3.3

**Walk each derived category through its arrival, one question at a time, and record each answer before the next.** The questions are not coordinates, and the partner answers in their own words. `Platform` is never asked about. Where a category has no people of its own, say so and go on. The fuller journey — fields, roles, notices and screens — is the module's own workstream's, after the go.

| What you ask of each category | What the answer lands as |
| --- | --- |
| How they arrive: register themselves, are invited or are created by the parent; vetted or not | the registration door and the vetting (migration) |
| Who joins it, and with which roles by default | default roles, an IAM contribution (migration) |
| How they sign in | policy defaults (migration); provider secrets (estate config); an org's own policy (console) |

**The answer decides where it lands, by the rule of the ideate chapter.** What the product's code, flows or tests rely on is a migration contribution, the same in every environment. What differs per environment is the estate's declaration. A tenant's own choice is the console, at runtime.

### How to ask

- **Ask one question and stop.** A numbered list of all of them arrives as a form, and a form gets one careless pass.
- **Record each answer before you ask the next one**, with `layout answer`. Answers written at the end are the same lost window as answers written nowhere, because the window can close partway through.
- **Never fill an answer in for them.** A code you invented becomes the account address, the scope and the prefix, and it is expensive to take back. The legal entity, the owner's name and the cloud region are the ones an agent is most tempted to guess.
- **The cloud region mapping is a choice, not a derivation.** `ap-south-1` does not follow from `in` by any rule this estate states. Somebody decided it, so somebody has to say it.
- **The closest twin is the one people skip, and it earns the most.** A twin tells you which mechanisms transfer wholesale. Where this is their first platform there is no twin, and saying so beats inventing one.

## The read-back, and the go

Show every section as it now stands, and then show what you derived. This is the last cheap moment: after the go the organization code is in a repository name, and soon after in a published package.

**Read back in this order.**

| What | Why it is in the read-back |
| --- | --- |
| The hard-to-undo list, from 1.6 | Each item costs a migration or a rename once code stands on it |
| The answers, as given | They correct their own typing before anything derives from it |
| **The two repository names** | They are declared data rather than convenience, and a rename moves every path a pin resolves against |
| The recommended repositories | From 6.4, read back before any repository is made: one team, the estate then the platform, the platform's concept in its docs; several teams, their own book (FOUNDATION) first, then the estate and the platform, each team's service repository joining when the team starts; own infra material, an infra support repository before the estate. A repository added after day zero is placed by the workspace map from its own files, with no new bootstrap |
| **The app set, and the categories it came from** | A wrong business model shows up here as a missing app, which is cheap, rather than at boot, which is not |
| The brand, or the design system's own look | The first apps wear it, so they say plainly which |
| What the skeletons will be | A module's package with its seats and no states, an app's shell with its layout and theme, the estate's rows |

**The names are derived and read back, never typed.** `{spc}` is permanent — three lowercase letters, never renamed — and the repository name inherits that permanence. Showing it is how a wrong `{spc}` gets caught while it still costs nothing.

**The go is refused while a section is Pending or out of date** (`RULE.DEVEX.WORKSPACE.542` · MUST · skill:spn-devex/execute). Run `spn-devex workstream layout check {NNN}`; it names each section still `PENDING`, and each citing a decision newer than itself, and `workstream go write` refuses the same way. Once it passes and the founder says yes, record the go on each arc with `spn-devex workstream arc edit {NNN}/<arc> --status DECIDED --note "<their words>"`, then follow the `execute` skill: the change sheets are written from N001 to N006 and the plan derives the running order itself, estate packages and pins first.

## The go's acts, and their order is forced rather than chosen

The repositories come from the answers, not always two. The usual shape, one team and no infra material of its own, makes two, and the estate one comes first. It carries a package for the organization and one for the platform.

```
{org}-infra/                        sprepo.json  { type: INFRA }
  packages/infra-organization/        spinfrapkg.json
  packages/infra-platform-{spc}/      spinfrapkg.json

{org}-{platform}-ts/                sprepo.json  { type: APPS, stack: TS,
                                        infra: { organization: pkg@ver,
                                                 platform:     pkg@ver } }
```

| # | The act | The command | Why it sits here and not later |
| --- | --- | --- | --- |
| 5 | Bring the organization up, then make the estate folder and mint it | `spnutils infra organization up`, then `mkdir <org>-infra`, `git init` and `spnutils infra scaffold repo` inside it | The book's utils chapter runs the organization layer once, before any `repo create`, and `repo create` refuses by name until it has. The estate repository exists only as a folder until act 7 has written its organization node |
| 6 | Wire it | `spnutils repo agent-sync` | Without it the session has no `implement`, no `review`, no `release` |
| 7 | The two estate packages, organization first, then the estate repository created and pushed | `spnutils infra scaffold`, then `implement` to fill `providers.scm.org` and the rest, then `spnutils repo create <org>-infra` from inside the folder, `git remote add origin`, `git push` | The platform package names the organization it belongs to. `repo create` reads the GitHub organization from the organization node that reaches the folder, refuses before the node exists or while `providers.scm.org` is empty, and refuses when that GitHub organization does not exist. It opens no checkout, so the folder is the repository and `origin` is added by hand |
| 8 | Release them and stage the pins | `spnutils infra release --local` | The platform repo pins a version, and it cannot pin a working tree |
| 9 | The platform repository | a new folder and `git init`, then `repo create <org>-<spc>-<stack> --from <organization package>@<version>`, then `apps scaffold repo` | The scaffold takes both pins as arguments, so act 8 has to have happened. The pin it writes does not exist yet when `repo create` runs, so the command takes `--from`, the estate node answering which organization's SCM (`package@version` or a path) |
| 10 | Its concept, then its skeletons | `CONCEPT.md` from N001's decisions, then `apps scaffold <kind>` once for each module and app the arcs decided | The concept decides which kinds exist. Scaffolding first is deciding by accident. A module is scaffolded one at a time with the existing scaffold |
| 11 | The provider keys | — you name them, they fill `~/.spnenv` | The provider registry fails fast at boot when a type or key is missing. A walk that ends in a running stack cannot defer this |
| 12 | Bring the platform up | `spnutils infra platform up <spc>` | The platform layer reads what the organization layer wrote at act 5 |
| 13 | Run the stack, and say what they should see | the domain plugin's run skill | This is the acceptance. The go ends on a platform that answers, not on a filled page |

- **Act 6 is where day zero used to stop.** A partner's first repository is an estate repo, it carries no `package.json`, and that is precisely the case the wiring command refused. If you meet that refusal, say so plainly and name it as the known blocker rather than working around it by hand.
- **A partner holds no marketplace checkout, and nothing has to be said about it.** The mode follows from where they are standing, so the same command wires the published source. Their plugins resolve from the published marketplace, and the book reaches them as a published rendering rather than a path they can open.
- **Acts 11 to 13 are the acceptance.** A partner who has never seen this estate finishes the go, runs the local stack, and sees their platform's skeleton answer. Anything short of that is a form somebody filled in.
- **Acts 5, 12 and 13 go through the CLI's own doors.** `infra organization up` and `infra platform up <spc>` are the commands, and `tofu apply` is never hand-run, locally or anywhere else.
- **Stop at the end of each act and say what it produced.** The developer is watching a workspace appear out of nothing, and a silent run of the whole go gives them nothing to correct.

## Act 11 — the provider keys, and the pause while they are filled

**This act is a hard stop, not a nicety.** The provider registry fails fast at boot when a type or a key is missing, so a go that ends in a running stack has to have asked for them.

`workspace init` wrote the saasplane env's **shape** and derived no key, by design. The values are theirs.

**What you do here, in order.**

1. **Name the keys the platform will look for**, from section 2.4's outside services, and say what each one is for. Email, SMS and storage are the families that stop a boot.
2. **Say what breaks without each one** — plainly, so they can decide which they need today and which can wait.
3. **Point them at the saasplane env** and stop. Their own keys go in the `spnutils:dev` region, which no run reads or writes.
4. **Wait.** Then confirm the values with `spnutils workspace env show`, which prints a value nobody typed and shows every typed value as set or unset. The ground's `keys` item turns Done on it.

- **Never print a value back, and never read a region of that file onto the screen.** A transcript outlives the session that wrote it, and a printed credential is exposed from that moment. `refs/devex/workspace/workspace.md` § The saasplane env carries the rule.
- **Confirm presence, never content.** The status command answers *is it set* without answering *what is it*, which is the only question you need.
- **A key they choose to skip is an answer.** Say which family will refuse to boot, and let them decide. Do not fill one in, and do not invent a test value.

## Act 12 — bring the platform up

The organization layer is already up from act 5, and the platform layer reads what it wrote.

```
spnutils infra platform up <spc>
```

`<spc>` is the platform's code, from section 6.3, and it comes straight after the verb (`RULE.DEVEX.UTILS.072` · MUST · skill:spn-devex/develop). No environment entry selects a platform.

- **The CLI's own doors, always.** `tofu apply` and `tofu destroy` are never hand-run — not in the cloud, and not locally either.
- **Stop after each and say what it produced.** A partner watching an estate appear has no way to tell a slow layer from a stuck one unless you say.
- **A refusal here is information, not a blocker to work around.** Name what refused and what it was reading, and stop. An estate brought up by hand is an estate nothing can reason about afterwards.

## Act 13 — run it, and say what they should see

**Act 13 is the acceptance the go exists for.** Hand the run to the domain plugin's run skill, which owns how a platform of that stack starts.

Then say, in plain words, what they are looking at:

- **Which surface to open**, by name, and what answering looks like.
- **What the platform does now** — sign-in through `IDENTITY`, and the consoles their business models opened, each in its brand or the design system's own look.
- **What is deliberately empty.** A skeleton has no business logic and a fresh platform has no data, so an empty console is the correct result rather than a failure.

## Closing the foundation workstream

**It closes when the platform runs and they have seen it answer**, and the follow-ups arc names the next workstreams: one per module, the design language rounds on the running apps, and the cloud walk with the ground's `CLOUD` items. Close it through the workspace chapter's close gate, and say in one line what landed: the two repository names, the two package versions, the surfaces that came up, and where the decisions now live. **The decisions outlive the workstream inside `CONCEPT.md` and the constructs**, which the go writes, so closing loses nothing.

## The joining path

**Ask one question: where the team lives** — its GitHub organization, or its estate repository (`RULE.DEVEX.FUNCTION.107` · MUST · skill:spn-devex/bootstrap). Then, stopping after each step to say what it produced:

1. **Mint the workspace** where `.spndevex/` is not yet the workspace's, with the name they gave, and open a joining workstream, `{NNN}-joining`, with its role arcs.
2. **Clone the repositories the estate declares**, each beside the others, and wire each with `spnutils repo agent-sync`, then `spnutils workspace agent-sync`.
3. **Walk the sign-ins and the keys**: GitHub and the registry as the ground checks them, then the provider keys the team keeps, named and filled as act 11 says.
4. **Bring the local stack up from the pinned versions**, `spnutils infra organization up`, then `spnutils infra platform up <spc>`, and run it with the domain plugin's run skill.
5. **Close on an onboarding read**: the vision, the concept, what is built, and where the newcomer's first task sits. Then close the joining workstream.

**It asks no estate question and creates nothing beyond the local workspace.** Nothing is created in GitHub or in a cloud, and nothing is decided: the team's foundation already holds every answer.

## Where they stand, read from the ground

Day zero is not a switch. It is the first rung of a ladder, and you work out which rung they are on by reading the workspace rather than by asking.

| Rung | What the ground shows | What you offer next |
| --- | --- | --- |
| 0 · empty | No `sprepo.json` anywhere, no open foundation workstream | The door |
| 0b · foundation open | An `open/{NNN}-foundation` folder with sections still Pending | The next Pending section, from `layout show`; never question one again |
| 1 · estate only | One `INFRA` repo. Packages present, nothing released | Finish the organization package, then the platform one, then release and stage the pins |
| 2 · repos, no concept | An `APPS` repo exists. No `CONCEPT.md` at its root | `ideate` — boundary, domains, surfaces, one agreed block at a time |
| 3 · concept, few projects | `CONCEPT.md` present. Very few `spkind.json` below it | `new` — the projects the concept implies, each kind from the closed set |
| 4 · building | Apps and modules present, suites running | The contract-first loop, and the review gate each contract change opens |
| 5 · never run locally | Code present. No local estate state, nothing pinned | `provision` — the layers in order, and what each one owns |
| 6 · running, not deployed | Local green. No cloud environment answers | The cloud walk, phase by phase — which is where a finished foundation leaves them |

Two cheap signals carry most of this. Whether `CONCEPT.md` exists separates rungs 1 and 2, and whether the platform repo pins a version or a path tells you if anything has been released. Both are one file read.

Count the folders in `.spndevex/workstreams/closed/` and you know whether this workspace has finished anything before. An empty archive means explain more; a full one means get out of the way.

## Open with a greeting, and end with the door

A session that opens with a status dump greets nobody. Greet them, then show the ground, then leave one open question — never a menu of options beyond the door's three paths.

> Welcome to SaaS Plane — your workspace is set up, and it holds no repository yet. A clean start.
>
> Are you starting a new platform, joining a team that already has one, or just looking around? If you are starting one, I ask a few questions here, then lay the whole foundation out as one workstream, every decision marked as still to answer, and we go through them together; we finish with your platform running locally. If you are joining, tell me where your team lives and I set the rest up. Looking around creates nothing.

That is the door a partner meets: they ran `spnutils workspace init <name>` before they opened the window, because the floor it writes is what brings the plugins here. In a folder nobody minted, which is a builder's case with the plugins at user scope, the door says the folder is empty and offers to mint the workspace as well.

## What this skill never does

- **Never invent an organization code, a platform code, or a domain name.** Those are theirs, and every later name derives from them.
- **Never invent a legal entity, an owner's name, or a cloud region.** These are the three an agent reaches for when it wants to be helpful, and all three end up in a manifest somebody signs.
- **Never ask them to type a skill or a `spnutils` command after the install and `workspace init`.** Running them is yours.
- **Never mark a ground item Done on their word, and never read a cloud account before their yes at that step.**
- **Never print a provider key back, and never read the saasplane env onto the screen.** Confirm that a key is set; never confirm what it is.
- **Never run an act whose input nobody supplied, and never start the go while `layout check` refuses.** A default you chose quietly is the hardest kind of decision to find later.
- **Never hand-write a manifest, a settings file, a scaffolded folder or a file under `arcs/`.** The command that owns it writes it, and a hand-made copy drifts from the standard on the day it is created.
- **Never add, drop or reorder a round, section or arc of the layout.** Strike a part by the founder's words; change the shape only through the book and the plugins.
- **Never ask a question before the workstream exists**, beyond the door's chat questions. An answer given to a session with nowhere to put it is an answer the next window cannot read.

## The rules this step holds

<!-- Generated by the plugins build from `spn-devex/src/refs/rules.json`. Change the book, never these lines. -->

- **Bootstrap opens on a door with three paths — start a new platform, join an existing platform, or just look around — and only the first two create anything; after the one install and `spnutils workspace init`, every skill and every `spnutils` command is the agent's to run** (`RULE.DEVEX.FUNCTION.105` · MUST · skill:spn-devex/bootstrap)
- **The accounts and sign-ins no tool can create are the foundation workstream's Ground section, each item with the check that says it is already done; the agent checks the ground and never decides it, an item turns Done only when its check passes, and a check that reads a cloud account runs only with the developer's approval at that step** (`RULE.DEVEX.FUNCTION.106` · MUST · skill:spn-devex/bootstrap)
- **The joining path asks one question, where the team lives — its GitHub organization or its estate repository — then mints the workspace, clones and wires the repositories the estate declares, walks the sign-ins and the team's provider keys, runs the local stack from the pinned versions, and closes on an onboarding read; it asks no estate question and creates nothing beyond the local workspace** (`RULE.DEVEX.FUNCTION.107` · MUST · skill:spn-devex/bootstrap)
- **A new platform's first workstream is written whole from bootstrap's layout data after a few questions in chat — the path, the workspace's name, who the platform is for and the product in one sentence — so every round, section and arc is on the page from the first minute, each section Pending with what it knows, needs and waits on** (`RULE.DEVEX.FUNCTION.108` · MUST · skill:spn-devex/bootstrap)
- **A session opens on generated orientation read from the workspace and never typed, and an empty workspace is asked the estate questions instead of being read** (`RULE.DEVEX.WORKSPACE.045` · MUST · skill:spn-devex/bootstrap)
- **An arc is created when its work starts, or with every one of its sections naming what it waits on; a workstream written from a layout opens all its arcs at once, and none of them is empty, because each section says what it still needs and what it waits for** (`RULE.DEVEX.WORKSPACE.539` · MUST · skill:spn-devex/bootstrap)
- **The layout data is the workstream's structure, kept in the plugin as data and read-only: its rounds, each round's sections and subsections, the views that start a round and the views that join it, the arcs, and the tree of where each arc lands; a change to it is a change to the book and the plugins, never to one workstream** (`RULE.DEVEX.WORKSPACE.540` · MUST · skill:spn-devex/bootstrap)
- **An answer is recorded once, as a decision in the founder's words with its day, and every section that uses it cites that decision; a changed answer reopens every section that cites it, marking each `PROPOSED` again** (`RULE.DEVEX.WORKSPACE.541` · MUST · skill:spn-devex/bootstrap)
