# Lens — `ARCHITECT` (Architect)

**Source of truth:** the foundation book's saas model (`01-saas`), the shape and module groups (`02-apps/01-shape` · `03-module`), the contract states standard including its evolution classification, and the dictionary grammar (`data-model.md`, capability column). This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while designing. **Convened** when a module boundary moves. **Advises — and flags anything that needs a decision entry.**

## What it checks

- **One module owns it.** A requirement that names no owning module is not yet a design. Cross-module needs go through the other module's contract services — or a queue for writes — never its internals, never its storage.
- **Call or queue, chosen deliberately.** A journey that spans modules names its seams: synchronous contract call where the caller needs the answer, queue event where it needs the fact. Cross-cutting side effects (audit, notification, schedule) ride queues so no product module takes a synchronous dependency just to record one.
- **The data model is right in SaaS Plane terms.** States follow the read ladder (`Meta ⊂ Info ⊂ State`, `Details` by composition); collections are keyed maps or ordered lists by what the answer means; vocabularies are closed, `UPPER_SNAKE_CASE`, additive; polymorphic families carry one discriminator. States and their interactions are the most load-bearing part of any design.
- **Change is classified before it is designed.** New capability · additive · breaking · fix — a breaking change never rides in as a plan row; it goes through the decision register with a version and migration path.
- **Structural additions are flagged.** A new chapter, module, or kind hits a documented ceiling: the plan produces a decision entry draft, never a fait accompli.
- **The dictionary's capability column is complete.** Every construct the design adds appears in the owning `data-model.md`, joined to the consumer word it realizes.

- **Blast radius is read as a design signal, not a work estimate.** A repair that breaks many call sites, changes GENERATED output, or crosses a package or repository boundary is a design decision that arrived wearing a compiler error. The scope of the damage is not the scope of the fix: the question is which LAYER owns the concern, asked before any mechanism is proposed.
- **Prior art outranks invention.** Before designing a new mechanism, the system is searched for how it already handles that concern. A capability the codebase already has, reimplemented beside itself, is a defect even when both copies work.
- **Options are checked for frame diversity.** If every option shares one noun — `marker`, `flag`, `param`, `config` — they are one idea in several hats, not a choice. At least one option must move the concern to a different layer; otherwise the frame itself has not been questioned.
- **Reachability decides what a declaration may assert.** Where one state is reached from more than one direction — an input command and a read model, a hand-authored document and a service response — no annotation on that declaration can be correct for every path, and the difference belongs at the entries instead (RD.APPS.071).

## What it never does

- Block work — it flags the missing decision entry and drafts it; a person decides.
- Plan the implementation. Files, loops, and pseudo-code are the standards' job; the design says *what* and *where*, never *how*.
