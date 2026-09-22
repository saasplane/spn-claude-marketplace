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
**spn-core**

- **The Plugin — Delivery Unit of the Marketplace** — The folder that carries a standard from this repository into a running session — its manifest, its entry in the marketplace list, the installed copy a session actually reads, and the version field that says which bytes those are.
- **The Hook — Code the Runtime Calls on Your Behalf** — Code a plugin wires to a moment the runtime reaches — the file that declares the wiring, the payload it is handed, the verdict it returns rather than prints, and the exit code that is always zero.
- **Loop Events — The Moments a Session Offers a Hook** — The named moments in a session a plugin can wire code to — the window opening, a call about to run, a shell command that finished, a turn about to end — and why only one of them may refuse anything.
- **The Check — One Rule, Asked on Every Call** — One rule a script can decide about a single call — the fast path that says whether it could have an opinion, the smallest slice it reads to answer, the chapter it names instead of restating, and the line between refusing a call and only speaking about it.
- **The Tool — A Command Run by Its Own Path** — Code a plugin ships that nothing wires — invoked by a person, a skill or another tool, answering with graded findings and an exit code, and degrading to silence wherever the input it needs is absent.
- **The Page — Produced From a Seat File, Never Typed** — The HTML a reader opens, produced from the markdown an author writes — the block vocabulary that markdown is written in, the drawer that measures every figure from its own text, the checker that treats a connector as a claim, and the comparison that catches a hand edit.
- **The Skill — A Verb's Steps, Loaded on Match** — A named unit of work a session can be asked for — a folder, a description matched against the work at hand, the instructions loaded once it matches, and the rule that a skill carries steps and never a rule of its own.
- **The Ref — A Chapter, Restated and Stamped** — A markdown restatement of one or more chapters, carrying a hash of the exact text it last read, so a chapter that moves is reported rather than quietly outrun — and the three ways a restatement can fail to be comparable at all.
- **The Lens — One Reviewing Viewpoint, Written Down** — One engineering function's judgment stated as a file — what it checks, the one condition it may block on, everything below that which it can only advise, and why the same values also name the audience a document declares.
- **The Agent — A Persona a Session Can Convene** — A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the difference between a fixed voice and one parameterized by a viewpoint, and where the permission to write actually comes from.

**spn-apps-ts**

- **Stack Checks — A Stack's Own Rules at Write Time** — A check whose rule is true of one stack and nowhere else — read against the source as the pending write would leave it, asking whether this edit introduces the pattern, and refusing only where the model behind the rule is settled.
- **Stack Tools — Commands Over a Stack's Own Register** — A tool that reads or writes one stack's own declarations — the register found by its header rather than by a path, the two cells a run owns against the cells a person decides, and coverage measured against published actions rather than routes.
- **Stack Skills — A Stack's Own Verbs** — The verbs that can only be said in one stack's own words — what makes a verb stack-concrete, why one of them divides into ordered steps, why a mode is an argument, and the verb that is deliberately absent here.
- **Stack Refs — The Layer a Stack-Agnostic Verb Loads** — Reference material a stack ships for a verb it does not own — how a stack-agnostic verb reaches a concrete step without being copied, why the file has no trigger of its own, and where the rows a design produces are written.

**spn-infra**

- **The Estate Guard — One Script Wired to Every Write** — A single shell script standing between an estate edit and the file it would write — the narrow set of things it knows about, the text it judges, and the direction it fails in when it does not understand its input.
- **Estate Skills — The Verbs That Change an Estate** — The verbs an estate repository answers to — changing what the estate is, reading a rendering before it is approved, authoring a module end to end, and publishing a package — and the boundary every one of them restates rather than works around.
- **Estate Refs — The Estate's Vocabulary, Restated as Cards** — The estate's own words, restated for a reader who may never open the book — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to.
<!-- /spn:generated -->
