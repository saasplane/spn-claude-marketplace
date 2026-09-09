---
name: day-zero
description: Walk an empty folder to two working repositories - the estate questions first, then the acts that mint the workspace, make the estate repo, wire it, scaffold and release its packages, and create the platform repo with its concept. Use when the workspace holds no sprepo.json at all, when someone is starting a new organization or platform from nothing, or when the session orientation reports day-0 mode. Interactive by design - you ask, they answer, and no act runs on an answer nobody gave. Stack-agnostic.
---

# day-zero — an empty folder becomes two repositories

Scan the workspace root, find no `sprepo.json` anywhere, and you are on day zero. You have no code to pattern-match against, and that is the condition this walk is written for. What you do have is the standards, the published packages, and the shape every platform here already takes.

**Nothing in this walk is hand-made except the estate repository itself.** Every other file arrives from a verb. If you find yourself opening an editor to create a manifest, stop. A verb owns that file, and hand-writing it starts a workspace out of standard on day one.

## First the estate questions, and they come before any concept

Get these wrong and you rename accounts, package scopes and every code prefix after the code exists. So ask them first, one at a time, and wait for each answer.

| # | What you ask | What their answer decides |
| --- | --- | --- |
| 1 | The organization's code, its name, and the mail domain | Every account address, the package scope, the repository names, the estate's root |
| 2 | One platform or several, and the code for each | The estate nodes, the isolation units, and every `{APP}_` prefix |
| 3 | Which service domains the product needs | The app set and the module set — and whether an existing module already answers |
| 4 | The stack | Which apps plugin binds the platform repo, and which scaffolds run |
| 5 | Which platform here is the closest twin | Whether a mechanism transfers, or whether they are genuinely inventing one |

- **Ask one question and stop.** A numbered list of all of them arrives as a form, and a form gets one careless pass.
- **Never fill an answer in for them.** A code you invented becomes the account address, the scope and the prefix, and it is expensive to take back.
- **Question 5 is the one people skip, and it earns the most.** A closest twin tells you which mechanisms transfer wholesale. Where this is the first platform they have built, there is no twin, and saying so beats inventing one.
- **Record the answers where the walk can find them again** — the intake worksheet in `refs/platform-worksheet.md` is that seat, and it lands as the concept's coordinates section.

## Then the repositories, and their order is forced rather than chosen

Two repositories, and the estate one comes first. It carries a package for the organization and one for the platform.

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
| 1 | Mint the workspace | `spnutils workspace init` | The floor has to exist before a session has any guidance at all |
| 2 | Make the estate repository | — a ground act | `repo create` refuses by name until the organization layer has run. This is the one hand-made repository |
| 3 | Wire it | `spnutils repo agent-sync` | Without it the session has no `declare`, no `plan-review`, no `release` |
| 4 | The two estate packages, organization first | `spnutils infra scaffold`, then `declare` | The platform package names the organization it belongs to |
| 5 | Release them and stage the pins | `spnutils infra release --local` | The platform repo pins a version, and it cannot pin a working tree |
| 6 | The platform repository | `repo create`, then `apps scaffold repo` | The scaffold takes both pins as arguments, so act 5 has to have happened |
| 7 | Its concept, then its projects | the `ideate` skill, then `apps scaffold <kind>` | The concept decides which kinds exist. Scaffolding first is deciding by accident |

- **Act 3 is where day zero used to stop.** A partner's first repository is an estate repo, it carries no `package.json`, and that is precisely the case the wiring verb refused. If you meet that refusal, say so plainly and name it as the known blocker rather than working around it by hand.
- **A partner holds no marketplace checkout, and nothing has to be said about it.** The mode follows from where they are standing, so the same verb wires the published source. Their plugins resolve from the published marketplace, and the book reaches them as a published rendering rather than a path they can open.
- **Act 1 also writes the machine seat, `~/.spnenv`.** The verb writes the file's **shape** — its markers, its managed defaults and an empty keep region. **It derives no key**, so a fresh partner file has nothing to fill in yet. A key arrives later, when you build what needs it, and you ask them for the value. Their own keys go in `spnutils:dev`, which no run reads or writes. Never print a value back — `refs/cross-repo.md` § The machine seat carries the rule.
- **Act 7 is a conversation, not a generation.** Hand it to `ideate`, which agrees one block at a time. A concept you drafted whole is a concept nobody agreed to.
- **Stop at the end of each act and say what it produced.** The developer is watching a workspace appear out of nothing, and a silent run of the whole walk gives them nothing to correct.

## Where they stand, read from the ground

Day zero is not a switch. It is the first rung of a ladder, and you work out which rung they are on by reading the workspace rather than by asking. What you offer next depends on that answer, so a partner in week one and a partner in month six get different sessions.

| Rung | What the ground shows | What you offer next |
| --- | --- | --- |
| 0 · empty | No `sprepo.json` anywhere | The estate questions, then the acts above |
| 1 · estate only | One `INFRA` repo. Packages present, nothing released | Finish the organization package, then the platform one, then release and stage the pins |
| 2 · repos, no concept | An `APPS` repo exists. No `CONCEPT.md` at its root | `ideate` — boundary, domains, surfaces, one agreed block at a time |
| 3 · concept, few projects | `CONCEPT.md` present. Very few `spkind.json` below it | `new` — the projects the concept implies, each kind from the closed set |
| 4 · building | Apps and modules present, suites running | The contract-first loop, and the review gate each contract change opens |
| 5 · never run locally | Code present. No local estate state, nothing pinned | `provision` — the layers in order, and what each one owns |
| 6 · running, not deployed | Local green. No cloud environment answers | The cloud walk, phase by phase |

Two cheap signals carry most of this. Whether `CONCEPT.md` exists separates rungs 1 and 2, and whether the platform repo pins a version or a path tells you if anything has been released. Both are one file read.

One more signal shapes your tone rather than your offer. Count the folders in `.spndevex/workstreams/closed/` and you know whether this workspace has finished anything before. An empty archive means explain more; a full one means get out of the way.

## Open with a greeting, and end with a door

A session that opens with a status dump greets nobody. Greet them, then show the ground, then leave one open question — never a menu of options. They arrive with something in mind, and a leading question picks their subject for them.

> Welcome to SaaS Plane — this folder is minted and completely empty. A clean start.
>
> Nothing to read yet, so the shape comes first. When you are ready there are estate questions, and your answers name every account, package and prefix that follows.
>
> How can I help?

## What this skill never does

- **Never invent an organization code, a platform code, or a domain name.** Those are theirs, and every later name derives from them.
- **Never run an act whose input nobody supplied.** A default you chose quietly is the hardest kind of decision to find later.
- **Never hand-write a manifest, a settings file or a scaffolded folder.** The verb that owns it writes it, and a hand-made copy drifts from the standard on the day it is created.
- **Never skip act 1.** A workspace nobody minted has no permission floor, so the session guiding the rest of the walk is the one session with no guidance.
