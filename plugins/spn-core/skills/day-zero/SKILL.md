---
name: day-zero
description: Walk an empty folder to two working repositories - the door first, then the workspace, then a workstream that holds the estate answers, then the acts that make the estate repo, wire it, scaffold and release its packages, and create the platform repo with its concept. Use when the workspace holds no sprepo.json at all, when someone is starting a new organization or platform from nothing, or when the session orientation reports day-0 mode. Interactive by design - you ask, they answer, and no act runs on an answer nobody gave. Stack-agnostic.
---

# day-zero — an empty folder becomes two repositories

Scan the workspace root, find no `sprepo.json` anywhere, and you are on day zero. You have no code to pattern-match against, and that is the condition this walk is written for. What you do have is the standards, the published packages, and the shape every platform here already takes.

**Nothing in this walk is hand-made except the estate repository itself.** Every other file arrives from a verb. If you find yourself opening an editor to create a manifest, stop. A verb owns that file, and hand-writing it starts a workspace out of standard on day one.

## Act 0 is a door, and a no is a real answer

**Open by asking whether they want to start a new platform.** One question, and then you wait. The orientation screen already puts that question on the table, so you are continuing it rather than opening a new one.

A *no* is an answer, not a stall. Nothing is created, the folder stays empty, and the session stays in day-0 mode for whenever they come back. A *yes* starts at act 1 and runs the acts in order.

**Never run act 1 on a maybe.** Minting a workspace is cheap to do and awkward to explain to somebody who only asked what this was.

## The eleven acts, and their order is forced rather than chosen

Two repositories come out of this, and the estate one comes first. It carries a package for the organization and one for the platform.

```
{org}-infra/                        sprepo.json  { type: INFRA }
  packages/infra-organization/        spinfrapkg.json
  packages/infra-platform-{spc}/      spinfrapkg.json

{org}-{platform}-ts/                sprepo.json  { type: APPS, stack: TS,
                                        infra: { organization: pkg@ver,
                                                 platform:     pkg@ver } }
```

| # | The act | The verb | Why it sits here and not later |
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

- **Act 6 is where day zero used to stop.** A partner's first repository is an estate repo, it carries no `package.json`, and that is precisely the case the wiring verb refused. If you meet that refusal, say so plainly and name it as the known blocker rather than working around it by hand.
- **A partner holds no marketplace checkout, and nothing has to be said about it.** The mode follows from where they are standing, so the same verb wires the published source. Their plugins resolve from the published marketplace, and the book reaches them as a published rendering rather than a path they can open.
- **Act 1 also writes the machine seat, `~/.spnenv`.** The verb writes the file's **shape** — its markers, its managed defaults and an empty keep region. **It derives no key**, so a fresh partner file has nothing to fill in yet. A key arrives later, when you build what needs it, and you ask them for the value. Their own keys go in `spnutils:dev`, which no run reads or writes. Never print a value back — `refs/cross-repo.md` § The machine seat carries the rule.
- **Act 10 is a conversation, not a generation.** Hand it to `ideate`, which agrees one block at a time. A concept you drafted whole is a concept nobody agreed to.
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
| 2 | One platform or several, and the code for each | — not yet asked | The estate nodes, the isolation units, and every `{APP}_` prefix |
| 3 | Which service domains the product needs | — not yet asked | The app set and the module set |
| 4 | The stack | — not yet asked | Which apps plugin binds the platform repo, and which scaffolds run |
| 5 | Which platform here is the closest twin | — not yet asked | Whether a mechanism transfers, or whether they are inventing one |

## What day zero does not ask

Archetypes and tier activation, the surfaces at launch, regions and setups, compliance
targets and the launch providers are all real decisions, and none of them is needed to
create two repositories. `refs/platform-worksheet.md` holds every one of those rows.
They are settled inside the concept at act 10 and in the declarations after it, so this
table is complete at five rather than short of thirty.

## Steps

| # | What | How you would know it works |
| --- | --- | --- |
| 1 | The five coordinates, asked one at a time and written down as each arrives | every row above carries an answer |
| 2 | The coordinates read back and agreed | the log carries the go |
| 3 | The estate repository, wired, with both packages released and pinned | `spnutils workspace status` lists an INFRA member |
| 4 | The platform repository, scaffolded against both pins | `workspace status` lists an APPS member |
| 5 | Its concept, agreed one block at a time | `CONCEPT.md` exists at its root and carries the coordinates |

## Log

- **{date} — opened.** Day zero. The workspace was minted and this arc opened before the
  first question was asked.
````

## Act 3 — the estate questions

Get these wrong and you rename accounts, package scopes and every code prefix after the code exists. So ask them first, one at a time, and wait for each answer.

| # | What you ask | What their answer decides |
| --- | --- | --- |
| 1 | The organization's code, its name, and the mail domain | Every account address, the package scope, the repository names, the estate's root |
| 2 | One platform or several, and the code for each | The estate nodes, the isolation units, and every `{APP}_` prefix |
| 3 | Which service domains the product needs | The app set and the module set — and whether an existing module already answers |
| 4 | The stack | Which apps plugin binds the platform repo, and which scaffolds run |
| 5 | Which platform here is the closest twin | Whether a mechanism transfers, or whether they are genuinely inventing one |

- **Ask one question and stop.** A numbered list of all of them arrives as a form, and a form gets one careless pass.
- **Write each answer down before you ask the next one.** Edit that question's row in the arc, replacing the whole line so the match is unambiguous. Five answers written at the end is the same lost window as five answers written nowhere, because the window can close after the third.
- **Never fill an answer in for them.** A code you invented becomes the account address, the scope and the prefix, and it is expensive to take back.
- **Question 5 is the one people skip, and it earns the most.** A closest twin tells you which mechanisms transfer wholesale. Where this is the first platform they have built, there is no twin, and saying so beats inventing one.
- **`refs/platform-worksheet.md` is where the questions come from**, and it is a template rather than a seat. It ships inside the plugin, so nothing can be written into it. Read it for what each row decides and what each answer is later consumed by.

## Act 4 — read the coordinates back

Show the five rows as they now stand and ask whether they are right. This is the last cheap moment: after act 5 the organization code is in a repository name, and after act 8 it is in a published package.

**A go is written down or it did not happen.** Append it to the arc's log as a dated line, in the shape `refs/workstream-loop.md` carries:

```md
- **2026-09-22 — go.** The coordinates were read back and agreed. Acts 5 to 10 may run.
```

Then say which act runs next, and run it.

## Closing the workstream

**It closes when both repositories exist and the concept is agreed** — the end of act 10. That makes it a receipt for day zero rather than a list of things to do, and it is why it closes rather than staying open forever.

Move the whole folder from `open/` to `closed/`, and say in one line what landed: the two repository names, the two package versions, and where the coordinates now live. **The coordinates outlive the workstream inside `CONCEPT.md`**, which act 10 writes, so closing loses nothing.

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
| 6 · running, not deployed | Local green. No cloud environment answers | The cloud walk, phase by phase |

Two cheap signals carry most of this. Whether `CONCEPT.md` exists separates rungs 1 and 2, and whether the platform repo pins a version or a path tells you if anything has been released. Both are one file read.

One more signal shapes your tone rather than your offer. Count the folders in `.spndevex/workstreams/closed/` and you know whether this workspace has finished anything before. An empty archive means explain more; a full one means get out of the way.

**A day-zero walk left half-finished is read from the same ground.** An `open/{NNN}-new-platform` folder means somebody started this before. Read its arc, see which rows carry answers, and resume from the first one that does not — never from question one, and never by asking again for something the file already holds.

## Open with a greeting, and end with a door

A session that opens with a status dump greets nobody. Greet them, then show the ground, then leave one open question — never a menu of options. They arrive with something in mind, and a leading question picks their subject for them.

> Welcome to SaaS Plane — this folder is minted and completely empty. A clean start.
>
> Say yes and I mint the workspace, open a workstream to hold your answers, then ask the estate questions one at a time. Each answer lands in a file as you give it, so nothing rests on this window staying open. Say no and nothing is created.
>
> Would you like to start a new platform?

## What this skill never does

- **Never invent an organization code, a platform code, or a domain name.** Those are theirs, and every later name derives from them.
- **Never run an act whose input nobody supplied.** A default you chose quietly is the hardest kind of decision to find later.
- **Never hand-write a manifest, a settings file or a scaffolded folder.** The verb that owns it writes it, and a hand-made copy drifts from the standard on the day it is created.
- **Never skip act 1.** A workspace nobody minted has no permission floor, so the session guiding the rest of the walk is the one session with no guidance.
- **Never ask a question before the arc exists.** An answer given to a session with nowhere to put it is an answer the next window cannot read.
