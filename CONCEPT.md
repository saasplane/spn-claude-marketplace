# spn-claude-marketplace — Concept

The public marketplace that delivers the instruments of the SaaS Plane agent. **The foundation states;
this repository delivers.** Every rule here restates a chapter of the foundation book and adds none
of its own — so what is genuinely this repository's is not the rules but the machinery: the code
that reads them, the events it runs on, and the shape each instrument takes.

## Boundary   `DRAFT`

**What it owns.** The instruments themselves, as code and as files a runtime loads: the hooks that
fire on an event, the tools somebody runs by name, the skills that carry a stage's steps, the refs
that restate a chapter, and the agent briefs. It owns how one is shaped, what it may refuse, what it
may never do, and how the set reaches a workspace.

**What it refuses.** Authoring a rule. A rule that is true of every repository belongs in the
foundation book, and a copy here is a second source that will drift — which is why every file that
carries one declares the chapter it restates, and a checker compares them.

**Why it is public while the book is not.** An instrument is loaded by a runtime on your machine,
so you have to be able to reach it without a grant. You cannot reach the book the same way, and that
is the whole reason a ref restates a chapter instead of linking to one.

## Who it serves   `DRAFT`

If you are a **partner**, you hold this repository and not the book, so every citation you meet here
names a chapter rather than linking to one. If you are a **builder**, you hold both, and the drift
checker is yours: it is the only thing in the workspace that reads across the two trees, and you run
it here, before you publish — `node plugins/spn-devex/src/scripts/tools/restate-drift.ts`, which finds
a sibling `spn-foundation` checkout by itself or takes its path as the one argument.

## The domains it holds   `DRAFT`

**This repository is a monorepo of plugins, so it divides by plugin.** A monorepo divides by the
thing it holds many of, and what this one holds many of is Claude plugins for SaaS Plane. Each is a
domain, with a subsection here and one folder of the same name in every *What* seat.

| Domain | Ships | Instruments it carries |
| --- | --- | --- |
| **`spn-devex`** | the stack-agnostic plugin, loaded by every repository | all five kinds — plugins, hooks, skills, refs and agents |
| **`spn-apps`** | the apps domain, stack-agnostic with its stacks inside it | the model an application is built from, the platform a partner adopts, the rules a change must obey, and a parser per stack under `providers/` |
| **`spn-infra`** | the estate plugin | one guard, plus the skills and refs that change an estate |

### devex

**The stack-agnostic plugin, and the one every repository loads.** It holds what is true of every plugin: what an instrument of each of the five kinds is, the events a hook may run on, the grades it may return, and how the set a workspace loads is derived from that workspace's own claim.

**A grammar shared by all three lives here, and the domain plugins restate none of it.**
The same hook grammar governs a check here and one in `spn-apps`, so a question about *what a
hook is* has one answer and one place: `spn-devex`'s hook set. A domain plugin's chapter says what its
own checks decide, never what a check is.

**That is what keeps the division by plugin from splitting one concept across three plugins.**
Dividing by delivery has one risk: a reader with a general question, such as *what is a hook?*, might
have to guess which plugin answers it. That risk does not arise here. A general answer is never in a
domain plugin; it is in the one every repository loads — for the hook, in
[`spn-devex`'s hooks construct](docs/02-constructs/01-devex/02-hooks.md).

#### The five instrument kinds are a shape, not a seat

**Plugin · hook · skill · ref · agent are what an instrument can be**, and every one of them is
defined once, in `spn-devex`. They are a vocabulary the three domains are written in rather than a
division of the tree — which is why you will find *the hook set* as a chapter under `spn-devex` and
never as a folder of its own.

### apps

**The TypeScript domain plugin.** It holds what only a stack can say: a check whose rule is true of one stack and nowhere else, a tool over that stack's own register, and
the skills that can only be said in its own words. **A skill that is stack-agnostic stays in
`spn-devex` and reaches a concrete step through a ref here**, rather than being copied.

### infra

**The estate plugin** holds what changes an estate: one shell script standing between an estate edit and the file it would write, the skills that change
what an estate is, and the estate's own vocabulary restated for a reader who may never open the
book.

## The world it declares   `DRAFT`

**This repository declares `GENERAL` in `sprepo.json`, which is a world with no stack in it.** A
manifest declares which world a repository belongs to — `FOUNDATION`, `APPS`, `INFRA` or `GENERAL` —
and a public marketplace is the last of those: it ships no application, no package a service depends
on, and no estate declaration. It holds one docs tree and no nodes at all, so the `apps` and `infra`
commands refuse it by name.

So a tool you run here must tolerate the absence of nodes rather than refuse the repository, and if
one refuses you, that is the tool's defect and not this repository's. **A tool finds a docs tree by
the `docs/` folder on disk, never by what a manifest declares** (`Q107`, 2026-09-20).

## `plugins/` is source   `DRAFT`

The capabilities seat is one chapter per construct, inside the one folder named for the plugin that
ships it — `01-devex/spn-devex/`, `02-apps/spn-apps/`, `03-infra/spn-infra/`. Here the package **is**
the plugin, so the domain holds exactly one such folder rather than one document per source folder.
When you add a checker and write no chapter for it, you have added a surface nobody documented, and
invariant 4 is what tells you so.

**What the book covers and what it does not.** The book names a checker under `plugins/` only where
one of its rules cites that checker. Four checkers are not named in the book at all:
`contract-cycle`, `prose-triage`, `restate-drift` and `partner-shape`. Naming is not documenting: the rule belongs to the book and the
implementation belongs here.
