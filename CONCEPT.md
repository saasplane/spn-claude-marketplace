# spn-claude-marketplace — Concept

The public marketplace the SaaS Plane agent instruments are delivered from. **The foundation states;
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
it here, before you publish.

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

**That is what keeps the division by plugin from splitting a concept in three.** The risk in
dividing by delivery is that a reader with a general question has to guess which plugin answers it.
It does not arise, because the general answer is never in a domain plugin — it is in the one every
repository loads.

### apps

**The TypeScript domain plugin.** It holds what only a stack can say: a check whose rule is true of one stack and nowhere else, a tool over that stack's own register, and
the skills that can only be said in its own words. **A skill that is stack-agnostic stays in
`spn-devex` and reaches a concrete step through a ref here**, rather than being copied.

### infra

**The estate plugin** holds what changes an estate: one shell script standing between an estate edit and the file it would write, the skills that change
what an estate is, and the estate's own vocabulary restated for a reader who may never open the
book.

### The five instrument kinds are a shape, not a seat

**Plugin · hook · skill · ref · agent are what an instrument can be**, and every one of them is
defined once, in `spn-devex`. They are a vocabulary the three domains are written in rather than a
division of the tree — which is why you will find *the hook set* as a chapter under `spn-devex` and
never as a folder of its own.

## The world it declares   `DRAFT`

**This repository declares `GENERAL` in `sprepo.json`, which is a world with no stack in it.** A
manifest declares which world a repository belongs to — `FOUNDATION`, `APPS`, `INFRA` or `GENERAL` —
and a public marketplace is the last of those: it ships no application, no package a service depends
on, and no estate declaration. It holds one docs tree and no nodes at all, so the `apps` and `infra`
commands refuse it by name.

So a tool you run here must tolerate the absence of nodes rather than refuse the repository, and if
one refuses you, that is the tool's defect and not this repository's. **A docs tree is keyed to the
tree, never to a manifest** (`Q107`, 2026-09-20).

## `plugins/` is source   `DRAFT`

The capabilities seat mirrors it folder for folder, because that is what a capabilities seat is: one
document per source folder that earns one, named for the folder it governs. When you add a checker
and write no mirror for it, you have added a surface nobody documented, and invariant 4 is what
tells you so.

**What the book covers and what it does not.** The book names some of these checkers where a rule
cites one — and four of them, `contract-cycle`, `prose-triage`, `restate-drift` and `partner-shape`,
it does not name at all. Naming is not documenting: the rule belongs to the book and the
implementation belongs here.

<!-- spn:generated constructs — do not edit inside these markers; `docs.ts face` writes it -->
**devex**

- **The Plugin — Delivery Unit of the Marketplace** — The folder that carries a standard from this repository into a running session — its manifest, its entry in the marketplace list, the installed copy a session actually reads, and the version field that says which bytes those are.
- **Hooks — Code the Runtime Calls on Your Behalf** — Code a plugin wires to the moments a session offers — the file that declares the wiring, the four moments and the authority each one carries, the payload a hook is handed, the verdict it returns rather than prints, and the exit code that is always zero.
- **Refs — A Chapter, Restated and Stamped** — A markdown restatement of one or more chapters, carrying a hash of the exact text it last read, so a chapter that moves is reported rather than quietly outrun — and the three ways a restatement can fail to be comparable at all.
- **Agents — The Personas a Session Convenes, and the Lenses They Are Handed** — A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the reviewing viewpoint a parameterized brief is handed, and the one condition that viewpoint may block on.
- **Skills — A Stage's Steps, Loaded on Match** — A named unit of work a session can be asked for — a folder, a description matched against the work at hand, the instructions loaded once it matches, and the rule that a skill carries steps and never a rule of its own.
- **Scripts — The Code a Plugin Ships, Wired or Reached by Name** — The folder a plugin keeps its code in — the check a moment composes, the tool a person reaches by its own path, the shared library both read, and the rule that one question is decided by one file whichever of the two asks it.
- **Providers — How a Plugin Is Extended Per Instance** — How a plugin admits a second stack or a second cloud without a gate being edited — the two halves a provider contributes, the rule that decides whether it contributes a skills half at all, and the line between what a provider states and what it does.
- **Tests — The Tier, the Mirror, and a Runner That Walks** — The folder a plugin proves itself from — the tier that says what kind of proof a suite is, the mirror that says what it is proof of, the runner that finds every suite by walking rather than by a list, and the two tiers deliberately left absent.

**apps**

- **The Plugin — What spn-apps Is, and When a Session Loads It** — The delivery unit of the apps domain — the identity its manifest claims, the description that is matched against the work at hand, the world a repository declares to earn it, and the version rule it shares with every other plugin in this marketplace.
- **Hooks — One Moment, Because Every Rule Here Is About a File** — What this plugin wires and why it wires so little — one moment, narrowed to the calls that change a file, behind a single entry whose dispatcher resolves what to run from the repository's own declaration rather than from a list.
- **Skills — The Commands an Apps Repository Answers To** — The skills the apps domain ships — what makes one belong to this domain, why the longest of them divides into ordered steps it does not hold itself, why a mode is an argument rather than a second folder, and the skill that is deliberately absent.
- **Scripts — The Code This Plugin Runs** — Everything under this plugin's scripts folder — the gate that resolves a write to the declared stack without naming one, the process behind the single wired entry, the shared code both sides read, and the commands run by name over an apps repository's own registers.
- **Refs — The Book, Restated Inside the Plugin** — What this plugin restates from the foundation book and how the folder is arranged — one folder per book domain mirroring the constructs it names, a leaf that is self-contained because the reader holds no book, the stamp that makes a stale copy visible, and the one file a command writes.
- **Providers — Where the Stack Is Allowed to Be Named** — The one folder in this plugin that knows a language — both halves, because for this domain the instance is the stack itself; the procedure a skill loads, the parse and the private rules a gate resolves into, and the folder named for the skill rather than for the plugin that ships it.
- **Tests — The Stack's Own Folders, Without the Stack's Framework** — How this plugin proves itself — the tier first and the mirror second, an absent tier that says so by being absent, a runner that walks rather than lists, and the rule that nothing may count its own depth.

**infra**

- **Plugin — spn-infra as a Delivery Unit** — The folder that carries the estate standard into a session — the manifest that names it, the description that decides whether a session loads it, and the version rule it shares with its two siblings.
- **Hooks — One Moment, Every Write** — The single wiring entry this plugin declares — the one moment it claims, the two calls it narrows to, the command it names against the plugin root, and why an estate plugin needs no other moment.
- **Skills — The Doors an Estate Is Changed Through** — The skills an estate repository answers to — changing what the estate is, reading a rendering before it is approved, authoring a module end to end, and publishing a package — and the boundary every one of them restates rather than works around.
- **Scripts — The Write-Time Gate and What Runs It** — The three folders under this plugin's scripts tree — the dispatcher wired to every write, the gate that resolves which subjects judge it, and the rule bodies they run — the narrow set of things they know about, and the direction they fail in when the input cannot be read.
- **Refs — The Estate's Vocabulary, Restated as Cards** — The estate's own words, restated for a reader who may never open the book — which file declares what, which layer owns which act, how a name is composed from coordinates, the laws a declaration must hold to, and what each cloud's vocabulary is.
- **Providers — One Folder per Cloud, Scripts Half Only** — What this plugin puts in the providers construct — a scripts half per cloud and no skills half at all — why the authoring stack decides that, and how a cloud joins by adding a folder nothing has to be told about.
- **Tests — The Tier, the Mirror, and a Runner That Walks** — How this plugin proves its own gate — a tree named by tier and then by what a suite proves, a runner that walks rather than globs, a harness that finds the plugin root instead of counting it, and the absences that say what does not run here.
<!-- /spn:generated -->
