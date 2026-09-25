---
name: day-zero
description: Walk an empty folder to a platform running locally - the door first, then the workspace, then a workstream that holds the estate answers, then the acts that make the estate repo, wire it, scaffold and release its packages, create the platform repo with its concept, name the provider keys the partner fills, bring both estate layers up and run the stack. Asks the identity, legal, hosting, cloud, owner, region, archetype, domain, stack and twin coordinates one at a time, and derives the tiers, the surfaces and both repository names rather than asking for them. Use when the workspace holds no sprepo.json at all, when someone is starting a new organization or platform from nothing, or when the session orientation reports day-0 mode. Interactive by design - you ask, they answer, and no act runs on an answer nobody gave. Stack-agnostic.
---

# day-zero — an empty folder becomes two repositories

Scan the workspace root, find no `sprepo.json` anywhere, and you are on day zero. You have no code to pattern-match against, and that is the condition this walk is written for. What you do have is the standards, the published packages, and the shape every platform here already takes.

**Nothing in this walk is hand-made except the estate repository itself.** Every other file arrives from a command. If you find yourself opening an editor to create a manifest, stop. A command owns that file, and hand-writing it starts a workspace out of standard on day one.

## Act 0 is a door, and a no is a real answer

**Open by asking whether they want to start a new platform.** One question, and then you wait. The orientation screen already puts that question on the table, so you are continuing it rather than opening a new one.

A *no* is an answer, not a stall. Nothing is created, the folder stays empty, and the session stays in day-0 mode for whenever they come back. A *yes* starts at act 1 and runs the acts in order.

**Never run act 1 on a maybe.** Minting a workspace is cheap to do and awkward to explain to somebody who only asked what this was.

## The acts, and their order is forced rather than chosen

Two repositories come out of this, and the estate one comes first. It carries a package for the organization and one for the platform.

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
| 0 | The door | — you ask | An act nobody agreed to is an act nobody can undo |
| 1 | Mint the workspace | `spnutils workspace init` | The floor has to exist before a session has any guidance at all. It also mints `.spndevex/`, so it comes before the workstream |
| 2 | Open the workstream | — `mkdir`, then write the arc | The answers need a home on disk before the first one is given |
| 3 | The estate questions, one at a time | — you ask, they answer | Each answer is written into the arc as it arrives |
| 4 | Read the coordinates back and get a yes | — you ask | The coordinates are agreed once, in one place, before any name derives from them |
| 5 | Make the estate repository | — a ground act | `repo create` refuses by name until the organization layer has run. This is the one hand-made repository |
| 6 | Wire it | `spnutils repo agent-sync` | Without it the session has no `declare`, no `plan-review`, no `release` |
| 7 | The two estate packages, organization first | `spnutils infra scaffold`, then `declare` | The platform package names the organization it belongs to |
| 8 | Release them and stage the pins | `spnutils infra release --local` | The platform repo pins a version, and it cannot pin a working tree |
| 9 | The platform repository | `repo create`, then `apps scaffold repo` | The scaffold takes both pins as arguments, so act 8 has to have happened |
| 10 | Its concept, then its projects | the `ideate` skill, then `apps scaffold <kind>` | The concept decides which kinds exist. Scaffolding first is deciding by accident |
| 11 | The provider keys | — you name them, they fill `~/.spnenv` | The provider registry fails fast at boot when a type or key is missing. A walk that ends in a running stack cannot defer this |
| 12 | Bring the estate up | `spnutils infra organization up`, then `infra platform up` | The platform layer reads what the organization layer wrote |
| 13 | Run the stack, and say what they should see | the stack plugin's run skill | This is the acceptance. Day zero ends on a platform that answers, not on a filled arc |
| 14 | Close the workstream | — move the folder to `closed/` | Both repositories exist and the concept is agreed, so the folder is a receipt |

- **Act 6 is where day zero used to stop.** A partner's first repository is an estate repo, it carries no `package.json`, and that is precisely the case the wiring command refused. If you meet that refusal, say so plainly and name it as the known blocker rather than working around it by hand.
- **A partner holds no marketplace checkout, and nothing has to be said about it.** The mode follows from where they are standing, so the same command wires the published source. Their plugins resolve from the published marketplace, and the book reaches them as a published rendering rather than a path they can open.
- **Act 1 also writes the machine seat, `~/.spnenv`.** The command writes the file's **shape** — its markers, its managed defaults and an empty keep region. **It derives no key**, so a fresh partner file has nothing to fill in yet. A key arrives later, when you build what needs it, and you ask them for the value. Their own keys go in `spnutils:dev`, which no run reads or writes. Never print a value back — `refs/cross-repo.md` § The machine seat carries the rule.
- **Act 10 is a conversation, not a generation.** Hand it to `ideate`, which agrees one block at a time. A concept you drafted whole is a concept nobody agreed to.
- **Acts 11 to 13 are the acceptance, and they are what day zero is for.** A partner who has never seen this estate finishes the walk, runs the local stack, and sees the default SaaS Plane platform answer. Anything short of that is a form somebody filled in.
- **Acts 12 and 13 go through the CLI's own doors.** `infra organization up` and `infra platform up` are the commands, and `tofu apply` is never hand-run, locally or anywhere else.
- **Stop at the end of each act and say what it produced.** The developer is watching a workspace appear out of nothing, and a silent run of the whole walk gives them nothing to correct.

## Act 2 — the workstream that holds the answers

The five answers name every account address, package scope, repository name and code prefix, and they name them permanently. Until act 10 writes `CONCEPT.md` there is no repository to keep them in, so **the workstream is the seat**, and it is opened before the first question is asked.

**Read the number, never type one.** `spnutils workspace status` prints a line reading `next free number NNN`. That is the number. A partner's folder may already hold work, numbers are assigned once and never reused, and a hardcoded `001` collides the first time somebody has done anything here before.

**The subject is `new-platform`.** It names the work. `setup` names a phase of a tool's life and would be the wrong noun for a folder that outlives the tool.

```
.spndevex/workstreams/open/{NNN}-new-platform/
  arcs/
    N1-estate-coordinates.md        the estate questions, and each answer as it arrives
```

It opens in `open/` because nothing blocks it — the developer is in front of you and the questions are the work.

### The answers go in the arc, and the walk mints no approach page

An approach page argues. The routing test in `refs/doc-sets.md` is one question — *were options weighed and one chosen?* — and on day zero nothing is weighed. The developer is telling you their organization's code, not choosing between two. So the coordinates are a record, and a record belongs in the arc.

Two further reasons hold in a partner's folder, where this walk almost always runs:

- **An approach page is hand-written HTML with a fixed shape** — a masthead naming its audience, a folding outline, and a `How` section carrying both its halves. The shape lives in a template inside `spn-foundation`, which a partner never checks out, and `docs.ts page` produces construct pages only. There is nothing for a partner to copy.
- **A `.md` file under `.spndevex/` is state rather than corpus**, so `doc-check` leaves it alone. Nothing stands between the sentence the developer just said and the file it lands in.

`refs/cross-repo.md` already blesses this shape: a subject with an arc and no approach page is valid, not a gap. **Where the developer asks for the argument written up, that is an ordinary page in an ordinary sitting** — offer it after act 4, and never let the walk wait on it.

### The arc the walk writes

Write this file at act 2, before the first question. Every answer cell starts as `— not yet asked`, and the date is today's.

````md
# N1 — The estate coordinates

Status: **OPEN — day zero, {date}.**
Repos: none yet. This arc runs before any repository exists.

## Why this arc exists

Five answers name every account address, package scope, repository name and code prefix
in this estate, and they name them permanently. This file is where they live until
`CONCEPT.md` exists to carry them. Nothing here is held in a conversation.

## The coordinates

| # | The question | The answer | What it decides |
| --- | --- | --- | --- |
| 1 | The organization's code, its name, and the mail domain | — not yet asked | Every account address, the package scope, the repository names, the estate's root |
| 2 | The legal entity — registered name and address | — not yet asked | `legal.name` and `legal.address` on the organization |
| 3 | The hosting account the repositories are created under | — not yet asked | `providers.scm.org` and `providers.scm.mtype` |
| 4 | The cloud, its home region, and each region's cloud region | — not yet asked | `providers.cloud.mtype`, `.home`, `.regions[].region` |
| 5 | One platform or several, the code and name for each, and its domain | — not yet asked | The estate nodes, the isolation units, and every `{APP}_` prefix |
| 6 | The platform's first human — email and name | — not yet asked | `owner.*` on the platform |
| 7 | The region they launch in, and where each Account's data must stay | — not yet asked | `regions[].code`, and the residency answer |
| 8 | Which archetypes they launch with | — not yet asked | The tiers, and through them every surface |
| 9 | Which service domains the product needs | — not yet asked | The app set and the module set |
| 10 | Whether they want a public marketing site at launch | — not yet asked | Whether `www` is scaffolded |
| 11 | The stack | — not yet asked | Which apps plugin binds the platform repo, and which scaffolds run |
| 12 | Which platform here is the closest twin | — not yet asked | Whether a mechanism transfers, or whether they are inventing one |

## What follows from the answers

Filled at act 4, before anything is created, and read back for a yes.

| It derives | The value |
| --- | --- |
| The tiers | — not yet derived |
| The surface set | — not yet derived |
| The estate repository | — not yet derived |
| The platform repository | — not yet derived |
| The environment | — not yet derived |

## What day zero does not ask

Compliance targets, the setup catalog beyond `dev`, and every environment after the
first are real decisions, and none of them is needed to reach a running platform.
`refs/platform-worksheet.md` holds those rows. They are settled inside the concept at
act 10 and in the declarations after it.

The vendor integrations are not in this table either, and for a different reason: they
are keys rather than coordinates. They are asked at act 11 and they never come near a
file the estate tracks.

## Steps

| # | What | How you would know it works |
| --- | --- | --- |
| 1 | The coordinates, asked one at a time and written down as each arrives | every row above carries an answer |
| 2 | The coordinates and what derives from them, read back and agreed | the log carries the go |
| 3 | The estate repository, wired, with both packages released and pinned | `spnutils workspace status` lists an INFRA member |
| 4 | The platform repository, scaffolded against both pins | `workspace status` lists an APPS member |
| 5 | Its concept, agreed one block at a time | `CONCEPT.md` exists at its root and carries the coordinates |
| 6 | The provider keys named, and the machine seat filled | `workspace status` reports each key as set |
| 7 | The estate up, both layers | the organization and platform layers report their state |
| 8 | The stack running, and the platform answering | they open the surface and it responds |

## Log

- **{date} — opened.** Day zero. The workspace was minted and this arc opened before the
  first question was asked.
````

## Act 3 — the estate questions

Get these wrong and you rename accounts, package scopes and every code prefix after the code exists. So ask them first, one at a time, and wait for each answer.

**Most of what the scaffold needs is derived rather than asked.** Your job is to know the whole inventory and ask only the part nobody can work out. The two tables below are that split, and the second one is the longer of the two on purpose.

### What you ask

| # | What you ask | What their answer decides |
| --- | --- | --- |
| 1 | The organization's code, its name, and the mail domain | Every account address, the package scope, the repository names, the estate's root |
| 2 | The legal entity — its registered name and address | `legal.name` and `legal.address` on the organization, and the public trust page later |
| 3 | The hosting account the repositories are created under | `providers.scm.org` and `providers.scm.mtype` on the platform manifest |
| 4 | The cloud, its home region, and which cloud region each estate region maps to | `providers.cloud.mtype`, `.home` and `.regions[].region` on the organization |
| 5 | One platform or several, the code and the name for each, and its domain | The estate nodes, the isolation units, and every `{APP}_` prefix |
| 6 | The platform's first human — email, first name, last name, display name | `owner.*` on the platform, and who the first account belongs to |
| 7 | The region they launch in, and where each Account's data must stay | `regions[].code`, and the residency answer the compliance envelope reads |
| 8 | Which archetypes they launch with — **more than one is allowed** | The tiers, and through them every surface the scaffold creates |
| 9 | Which service domains the product needs | The app set and the module set — and whether an existing module already answers |
| 10 | Whether they want a public marketing site at launch | Whether `www` is scaffolded |
| 11 | The stack | Which apps plugin binds the platform repo, and which scaffolds run |
| 12 | Which platform here is the closest twin | Whether a mechanism transfers, or whether they are genuinely inventing one |

### What you derive, and must never ask

| It derives | From | The rule |
| --- | --- | --- |
| The tiers the platform activates | the archetypes | the table below, unioned, duplicates collapsed |
| The surface set, and so the app set | the tiers | one surface per tier, plus `IDENTITY`, plus `www` if they want one |
| Both repository names | `{org}`, `{spc}` and the stack | `{org}-infra` and `{org}-{spc}-{stack}` |
| `apps[].repo` and `apps[].kindCode` | the surfaces | declared data, which is why act 4 reads the names back |
| `modules[].code`, `.layer`, `.after` | the service domains | the module set the domains imply |
| `networkIndex` and `network.index` | position | `0` for the first |
| `blueprint.package` and `.version` | the published blueprints | the current pin |
| The setup, and so the environment | nothing — it is defaulted | `dev`, giving one environment named `{region}-dev` |

- **The setup is safe to default and the region is not.** `uat`, `stg` and `prod` are catalog rows added when somebody needs them, so starting at one costs nothing. A region is a residency answer with legal weight, and it is written into the manifests.
- **The archetype question is the one that must accept several answers.** A platform may launch B2B and B2B2C together, and a single-select control would make that unanswerable. A set of one is the ordinary answer rather than an edge case.

### Archetype to tiers, which is the derivation everything else hangs off

| Archetype | Tiers it activates |
| --- | --- |
| B2C | `ACCOUNT` — of one, because the Account is the user |
| B2B | `ACCOUNT` — a workspace per client organization |
| B2B2C | `ACCOUNT` + `ACCOUNT_CONSUMER` |
| B2B2B | `ACCOUNT` + `ACCOUNT_ENTERPRISE` |
| Marketplace | `PLATFORM_ENTERPRISE` + `PLATFORM_CONSUMER` |

`PLATFORM` always exists, so it is never in the table and never asked about.

**Take the union and collapse the duplicates.** B2B with B2B2C and B2B2B activates `ACCOUNT` once, then `ACCOUNT_CONSUMER` and `ACCOUNT_ENTERPRISE` beside it. Each tier in the union gets one surface, `IDENTITY` joins them because business apps never implement login, and `www` joins if they asked for one.

**Marketplace composes on a different axis from the rest.** Every other archetype activates tiers of the customer's own organization. Marketplace activates tiers of the operator's root, which is sellers and shoppers on the platform itself. Choosing it beside B2B is not a contradiction, and it is what produces the widest surface set.

### How to ask

- **Ask one question and stop.** A numbered list of all of them arrives as a form, and a form gets one careless pass.
- **Write each answer down before you ask the next one.** Edit that question's row in the arc, replacing the whole line so the match is unambiguous. Answers written at the end are the same lost window as answers written nowhere, because the window can close partway through.
- **Never fill an answer in for them.** A code you invented becomes the account address, the scope and the prefix, and it is expensive to take back. The legal entity, the owner's name and the cloud region are the ones an agent is most tempted to guess.
- **The cloud region mapping is a choice, not a derivation.** `ap-south-1` does not follow from `in` by any rule this estate states. Somebody decided it, so somebody has to say it.
- **The closest twin is the one people skip, and it earns the most.** A twin tells you which mechanisms transfer wholesale. Where this is their first platform there is no twin, and saying so beats inventing one.
- **`refs/platform-worksheet.md` is where the questions come from**, and it is a template rather than a seat. It ships inside the plugin, so nothing can be written into it. Read it for what each row decides and what consumes each answer. Do not restate it here, and do not walk a partner through all seven of its sections — most of it is settled inside the concept at act 10 and in the declarations after that.

## Act 4 — read back what they said, and what follows from it

Show every answered row as it now stands, and then show what you derived from it. Ask whether the whole picture is right. This is the last cheap moment: after act 5 the organization code is in a repository name, and after act 8 it is in a published package.

**Read back three things, in this order.**

| What | Why it is in the read-back |
| --- | --- |
| The answers, as given | They correct their own typing before anything derives from it |
| **The two repository names** | They are declared data rather than convenience, and a rename moves every path a pin resolves against |
| **The surface set, and the tiers it came from** | A wrong archetype shows up here as a missing surface, which is cheap, rather than at boot, which is not |

**The names are derived and read back, never typed.** `{spc}` is permanent — three lowercase letters, never renamed — and the repository name inherits that permanence. Showing it is how a wrong `{spc}` gets caught while it still costs nothing.

**A go is written down or it did not happen.** Append it to the arc's log as a dated line, in the shape `refs/workstream-loop.md` carries:

```md
- **2026-09-22 — go.** The coordinates were read back and agreed. Acts 5 to 10 may run.
```

Then say which act runs next, and run it.

## Act 11 — the provider keys, and the pause while they are filled

**This act is a hard stop, not a nicety.** The provider registry fails fast at boot when a type or a key is missing, so a walk that ends in a running stack has to have asked for them. A walk ending at *scaffolded* could have deferred this one. This one cannot.

`workspace init` wrote the machine seat's **shape** at act 1 and derived no key, by design. The values are theirs.

**What you do here, in order.**

1. **Name the keys the platform will look for**, and say what each one is for. Email, SMS and storage are the families that stop a boot.
2. **Say what breaks without each one** — plainly, so they can decide which they need today and which can wait.
3. **Point them at the machine seat** and stop. Their own keys go in the `spnutils:dev` region, which no run reads or writes.
4. **Wait.** Then confirm what is set with `spnutils workspace status`, which reports key names and set-state.

- **Never print a value back, and never read a region of that file onto the screen.** A transcript outlives the session that wrote it, and a printed credential is exposed from that moment. `refs/cross-repo.md` § The machine seat carries the rule.
- **Confirm presence, never content.** The status command answers *is it set* without answering *what is it*, which is the only question you need.
- **A key they choose to skip is an answer.** Say which family will refuse to boot, and let them decide. Do not fill one in, and do not invent a test value.

## Act 12 — bring the estate up

Two commands, in order, because the platform layer reads what the organization layer wrote.

```
spnutils infra organization up
spnutils infra platform up
```

- **The CLI's own doors, always.** `tofu apply` and `tofu destroy` are never hand-run — not in the cloud, and not locally either. This is the same rule act 9's `repo create` already follows, so nothing new is being excused here.
- **Stop after each and say what it produced.** A partner watching an estate appear has no way to tell a slow layer from a stuck one unless you say.
- **A refusal here is information, not a blocker to work around.** Name what refused and what it was reading, and stop. An estate brought up by hand is an estate nothing can reason about afterwards.

## Act 13 — run it, and say what they should see

**Act 13 is the acceptance the whole walk exists for.** Hand the run to the stack plugin's run skill, which owns how a platform of that stack starts.

Then say, in plain words, what they are looking at:

- **Which surface to open**, by name, and what answering looks like.
- **What the default platform does** — sign-in through `IDENTITY`, and the consoles their archetypes activated.
- **What is deliberately empty.** A fresh platform has no data, and an empty console is the correct result rather than a failure.

**Then stop.** Day zero ends here. The first real workstream is theirs to open, and the skeleton is ready for it.

## Closing the workstream

**It closes when the platform runs and they have seen it answer** — the end of act 13. That makes it a receipt for day zero rather than a list of things to do, and it is why it closes rather than staying open forever. A walk that stopped at scaffolded would be closing on a folder nobody had proved.

Move the whole folder from `open/` to `closed/`, and say in one line what landed: the two repository names, the two package versions, the surfaces that came up, and where the coordinates now live. **The coordinates outlive the workstream inside `CONCEPT.md`**, which act 10 writes, so closing loses nothing.

## Where they stand, read from the ground

Day zero is not a switch. It is the first rung of a ladder, and you work out which rung they are on by reading the workspace rather than by asking. What you offer next depends on that answer, so a partner in week one and a partner in month six get different sessions.

| Rung | What the ground shows | What you offer next |
| --- | --- | --- |
| 0 · empty | No `sprepo.json` anywhere | The door, then the acts above |
| 1 · estate only | One `INFRA` repo. Packages present, nothing released | Finish the organization package, then the platform one, then release and stage the pins |
| 2 · repos, no concept | An `APPS` repo exists. No `CONCEPT.md` at its root | `ideate` — boundary, domains, surfaces, one agreed block at a time |
| 3 · concept, few projects | `CONCEPT.md` present. Very few `spkind.json` below it | `new` — the projects the concept implies, each kind from the closed set |
| 4 · building | Apps and modules present, suites running | The contract-first loop, and the review gate each contract change opens |
| 5 · never run locally | Code present. No local estate state, nothing pinned | `provision` — the layers in order, and what each one owns |
| 6 · running, not deployed | Local green. No cloud environment answers | The cloud walk, phase by phase — which is where a finished day zero leaves them |

Two cheap signals carry most of this. Whether `CONCEPT.md` exists separates rungs 1 and 2, and whether the platform repo pins a version or a path tells you if anything has been released. Both are one file read.

One more signal shapes your tone rather than your offer. Count the folders in `.spndevex/workstreams/closed/` and you know whether this workspace has finished anything before. An empty archive means explain more; a full one means get out of the way.

**A day-zero walk left half-finished is read from the same ground.** An `open/{NNN}-new-platform` folder means somebody started this before. Read its arc, see which rows carry answers, and resume from the first one that does not — never from question one, and never by asking again for something the file already holds.

## Open with a greeting, and end with a door

A session that opens with a status dump greets nobody. Greet them, then show the ground, then leave one open question — never a menu of options. They arrive with something in mind, and a leading question picks their subject for them.

> Welcome to SaaS Plane — this folder is minted and completely empty. A clean start.
>
> Say yes and I mint the workspace, open a workstream to hold your answers, then ask the estate questions one at a time. Each answer lands in a file as you give it, so nothing rests on this window staying open. We finish with your platform running locally, and you looking at it. Say no and nothing is created.
>
> Would you like to start a new platform?

## What this skill never does

- **Never invent an organization code, a platform code, or a domain name.** Those are theirs, and every later name derives from them.
- **Never invent a legal entity, an owner's name, or a cloud region.** These are the three an agent reaches for when it wants to be helpful, and all three end up in a manifest somebody signs.
- **Never print a provider key back, and never read the machine seat onto the screen.** Confirm that a key is set; never confirm what it is.
- **Never run an act whose input nobody supplied.** A default you chose quietly is the hardest kind of decision to find later.
- **Never hand-write a manifest, a settings file or a scaffolded folder.** The command that owns it writes it, and a hand-made copy drifts from the standard on the day it is created.
- **Never skip act 1.** A workspace nobody minted has no permission floor, so the session guiding the rest of the walk is the one session with no guidance.
- **Never ask a question before the arc exists.** An answer given to a session with nowhere to put it is an answer the next window cannot read.
