# The lenses — senior teammates, worn while the work is made

**One file for each engineering function and each chair at a partner's leadership table sits beside this one.** Each is a senior teammate's whole brief: whose work it serves, the principles of the SaaS Plane way it carries, what it masters, what it produces to, and what it may block.

**This folder is the `03-lenses` construct, restated.** The construct says what a lens *is* and the shape every file takes; the files say what each one *knows and does*. `refs/devex/agent/way.md` holds the way and the ask router, and it is in every window; a lens file is read only for the task that calls for it. The template every file is copied from is `refs/devex/workspace/docs/templates/agent/lens-template.md`.

## The shape, in its order

Every file takes the same parts, in this order (`RD.DEVEX.AGENT.097`): the real-world title in its heading; **Consumer first**, named before anything else; **Persona**; **Carries**, the principles of the way by number; how it is worn, convened, and whether it blocks; its **Source of truth**; then **Asks it owns**, **Mastery**, **Industry bridge**, **Mentoring** (junior, mid-level, senior), **Behaviour** (notices first, pushes back on, says yes when), **Blind spots**, **By stage** with the decisions it thinks hard about, **Produces to** with the hook or check that holds each chapter, **Gates**, **Sweeps** and **Improves the book**. A file stays within about 150 lines, because it is read whole for one task.

## Decide what they settle, and ask only what they leave open

**The agent decides what the book, the plugin references and the lenses settle — MUST**
(`RD.DEVEX.WORKSPACE.193`). A lens is one of the three, so a finding a lens settles is decided and
logged with its reason, never raised as a card. A card is only for what they leave open: a boundary
that shifts, information nobody can read or measure, or a choice that is people's
(`refs/devex/workspace/workstream.md` § A card is only for what the rules leave open).

**Each lens names the outside sources it is fluent in**, in its *Mastery* part. When a design question does reach the developer, each option's trade-off is set against the book and against the named source of the lens that owns the question — so the card cites a practice by name rather than an opinion. A source's detail is looked up when a case needs it, and never copied into the plugin.

## Built right while it is made, and convened only where judgment decides

**There is no reviewer lens, and no review after the fact** (`RD.DEVEX.AGENT.100`). Quality is held in three layers:

1. **The machine refuses at write time** — the plugin's hooks, lint and type checks, `spnutils apps check`. A rule a machine can check lives there and nowhere else.
2. **The owning lens is worn while producing**, so there is nothing to catch afterwards. Wearing a lens is never a review: the context that drafted something already agrees with its own reasoning.
3. **A fresh reading only at a judgment gate** — the design gate, a change to the published surface, and a release. The lenses that own the decision are convened through `spn-panel`, and `LEAD` picks which. Code is never convened over as a routine.

**Every lens also speaks as a view in a discussion about a shape**, before anything is built (`RD.DEVEX.AGENT.084`). `refs/devex/agent/lenses.md` says which views speak, how many, and when a view is the one agent reading the file and when it is a fresh agent. A view the one agent makes is a worn lens, so it is advice whatever the file says it blocks.

**A sweep finds what no single change shows** (`RD.DEVEX.AGENT.101`). Each file names its sweep, run as a report before a major release or when a lead asks, never per change.

## What a panel may and may not do

**A panel names the consumer and the stage first, then speaks as the lens's persona.** **A panel reports; the writing context acts.** It does not edit, and it does not decide what happens next. **A panel never invents a rule**: a finding with no owning chapter behind it is a suggestion, and it is reported as one.

**Almost nothing blocks.** `QA`, `TRUST`, `PARTNER`, `ARCHITECT` and `VOICE` each carry one block, named in the file, and below its threshold each advises. The voice is checked twice and only one of them blocks: the standing check under every lens advises, and the convened `VOICE` lens blocks a page that misses its seat's share of reach.

## A lens improves the book, and never makes a rule of its own

**A finding with no owning rule becomes a drafted change to the book** — the section and the register row — put to the developer, who decides it. Each file's *Improves the book* part says what such a finding usually is for that lens. Where a partner's industry and the book meet badly, the lens raises it and bends neither: the industry decides what is built and how it is named for its users, and the SaaS Plane way decides how it is built.

## Why they are filed by role

**The set is generated by a rule, never by a count**: one lens per engineering function, and one per seat at the leadership table. A function or a chair added is a lens added, as a register row first.

**The DevEx Agent is not one of them.** It wears each; it is not an actor.

**Actors build; personas use.** A lens is an actor's view, and a persona belongs to the behaviour rows rather than to the lenses.
