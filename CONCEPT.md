# spn-claude-marketplace — Concept

The public marketplace the SaaS Plane agent instruments are delivered from. **The foundation states;
this repository delivers.** Every rule here restates a chapter of the foundation book and adds none
of its own — so what is genuinely this repository's is not the rules but the machinery: the code
that reads them, the events it runs on, and the shape each instrument takes.

## Boundary   `DRAFT`

**What it owns.** The instruments themselves, as code and as files a runtime loads: the hooks that
fire on an event, the tools somebody runs by name, the skills that carry a verb's steps, the refs
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

**It divides by the KIND of instrument, never by the three plugins it ships them in.** A plugin is
how delivery is divided, which is a different question from how understanding is divided. The same
hook grammar governs a check in `spn-core` and one in `spn-apps-ts`, so when you have a question
about hooks you should not first have to work out which plugin answers it.

| Domain | Owns |
| --- | --- |
| **Plugins** | what a plugin is, how the set a workspace loads is derived from its claim, and how one is published and installed |
| **Hooks** | what a hook is — the events it may run on, the grades it may return, what it may refuse and what it may only report |
| **Skills** | what a skill is — a verb's steps, loaded when the work matches, and never a second place a rule lives |
| **Refs** | what a ref is — a restatement of one or more chapters, stamped with what it saw, so a moved chapter is reported rather than discovered |
| **Agents** | the personas and the lenses a review convenes, and what each one is allowed to decide |

## It declares no world   `DRAFT`

**This repository carries no `sprepo.json`, and gains none.** A repository's manifest declares which
world it belongs to — `FOUNDATION`, `APPS` or `INFRA` — and a public marketplace is none of the
three. It ships no application, no package a service depends on, and no estate declaration.

So a tool you run here must tolerate that absence rather than refuse the repository, and if one
refuses you, that is the tool's defect and not this repository's. **A docs tree is keyed to the
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
**plugins**

- **The Plugin — Delivery Unit of the Marketplace** — What a plugin is made of, how the marketplace lists one, and how installing it puts bytes into a session — the container every hook, skill, ref and agent brief lives inside.

**hooks**

- **The Hook — Code the Runtime Calls For You** — What a hook is — code wired to a runtime event or run by name, what it may return, and the line between refusing a call and only reporting on it.

**skills**

- **The Skill — A Verb's Steps, Loaded on Match** — What a skill is — a name and a description a session matches against the work at hand, and the steps it loads once matched — and why a skill never becomes a second place a rule lives.

**refs**

- **The Ref — A Chapter, Restated and Stamped** — What a ref is — a markdown restatement of one or more chapters, carrying a hash of what it last saw, so a chapter that moves is reported rather than quietly outrun.

**agents**

- **The Agent — A Persona a Session Can Convene** — What an agent brief is — a name, a description that decides when it is convened, and the bound authority it carries once it runs, from a fixed persona to a lens picked at the moment of the call.
<!-- /spn:generated -->
