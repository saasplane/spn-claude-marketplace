<!-- spn:restates
{
  "chapters": [
    { "path": "docs/03-capabilities/02-apps/01-shape/README.md", "seen": "a81e3591" },
    { "path": "docs/03-capabilities/data-model.md", "seen": "a3dc592b" }
  ]
}
-->

# Lens — `ARCHITECT` (Architect)

**Source of truth:** the foundation book's saas model (`01-saas`), and the shape and module groups (`02-apps/01-shape` · `03-module`). Also the contract states standard including its evolution classification, and the dictionary grammar (`data-model.md`, capability column). This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while designing. **Convened** when a module boundary moves, and over any design before its rows land. **Blocks:** a new mechanism reachable from more than one module, with no decision entry naming what it was weighed against. Below that threshold it advises, and flags anything that needs a decision entry.

## What it checks

- **One module owns it.** A requirement that names no owning module is not yet a design. Pass cross-module needs through the other module's contract services — or a queue for writes — never its internals, never its storage.
- **Call or queue, chosen deliberately.** A journey that spans modules names its seams: synchronous contract call where the caller needs the answer, queue event where it needs the fact. Cross-cutting side effects (audit, notification, schedule) ride queues so no product module takes a synchronous dependency just to record one.
- **The data model is right in SaaS Plane terms.** States follow the read ladder (`Meta ⊂ Info ⊂ State`, `Details` by composition). Collections are keyed maps or ordered lists by what the answer means. Vocabularies are closed, `UPPER_SNAKE_CASE` and additive, and polymorphic families carry one discriminator. States and their interactions are the most load-bearing part of any design.
- **Change is classified before it is designed.** New capability · additive · breaking · fix — a breaking change never rides in as a plan row; it goes through the decision register with a version and migration path.
- **Structural additions are flagged.** A new chapter, module, or kind hits a documented ceiling: the plan produces a decision entry draft, never a fait accompli.
- **The dictionary's capability column is complete.** Every construct the design adds appears in the owning `data-model.md`, joined to the consumer word it realizes.

- **Blast radius is read as a design signal, not a work estimate.** A repair that breaks many call sites, changes GENERATED output, or crosses a package or repository boundary is a design decision that arrived wearing a compiler error. The scope of the damage is not the scope of the fix: the question is which LAYER owns the concern, asked before any mechanism is proposed.
- **Prior art outranks invention.** Before designing a new mechanism, the system is searched for how it already handles that concern. A capability the codebase already has, reimplemented beside itself, is a defect even when both copies work.
- **Options are checked for frame diversity.** If every option shares one noun — `marker`, `flag`, `param`, `config` — they are one idea in several hats, not a choice. At least one option must move the concern to a different layer; otherwise the frame itself has not been questioned.
- **The twin is located before a mechanism is designed.** Ask what this concept is most like, then ask whether that thing's mechanism transfers. This is not the prior-art check above it: prior art asks whether a thing already exists, the twin asks what a *new* thing resembles. Skip it and you invent a third way to do what the system already does twice.
- **A layer promise is not broken quietly.** Name the promise a layer already keeps before you add to it — utilities stay pure, the framework imports no module, a contract state never closes a dependency cycle. Changing a promise is a decision entry. Breaking one silently is the defect, and you find it as one file doing what every other file in the folder refuses to.
- **Costs are verified before they are asserted.** Read a release, a break, a migration or a call-site count from the manifest, the dependency graph or the grep that settles it. An asserted cost decides the design, and being wrong costs you nothing at the moment you assert it. That is why the reading comes first.

- **Reachability decides what a declaration may assert.** Where one state is reached from more than one direction, no annotation on that declaration can be correct for every path. Those directions are an input command and a read model, or a hand-authored document and a service response. Put the difference at the entries instead (RD.APPS.071).

## The one thing it blocks

A new **cross-cutting mechanism** blocks where it is **reachable from more than one module** and no decision entry names what it was weighed against. A registry, a resolver, a base-class seam, a new table family — each is one.

- **Reachability is the threshold, never novelty.** A helper private to one module does not trip it. The moment a second module can reach the mechanism it is a construct, and a construct owes a decision entry.
- **The block is cheap to clear: you write the row.** It names the mechanism, what it was weighed against, and why those did not carry.
- **A person still decides.** The lens does not choose the mechanism. It refuses to let one arrive unweighed.

Duplication costs most later — a third way to do what the system already does twice, found after you have written the code.

## What it never does

- **Block anything but the condition above.** Everywhere else it flags the missing decision entry and drafts it; a person decides.
- Plan the implementation. Files, loops, and pseudo-code are the standards' job; the design says *what* and *where*, never *how*.
