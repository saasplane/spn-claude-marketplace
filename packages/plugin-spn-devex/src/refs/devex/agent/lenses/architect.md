<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/01-shape/README.md",
      "seen": "6637ce16"
    },
    {
      "path": "spn-foundation/docs/02-constructs/README.md",
      "seen": "a0b09509"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/README.md",
      "seen": "9e249141"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/03-module/README.md",
      "seen": "d9ec2c78"
    }
  ]
}
-->

# Lens — `ARCHITECT` (Architect)

**Source of truth:** the foundation book's saas model (`03-platform`), and the shape and module groups (`02-support/01-apps/01-shape` · `03-module`). Also the contract states standard including its evolution classification, and the glossary grammar — the `Contract term` column of the glossary generated onto each domain's face. This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Judged against, beside the book:** design patterns, as *Design Patterns* (Gamma, Helm, Johnson and Vlissides), Fowler's *Patterns of Enterprise Application Architecture* and Evans' *Domain-Driven Design* state them, and the domain's usual workflow. A design option is weighed against the pattern it resembles, named.

**Worn** while designing. **Convened** when a module boundary moves, and over any design before its rows land. **Blocks:** a new mechanism reachable from more than one module, with no decision entry naming what it was weighed against. Below that threshold it advises, and flags anything that needs a decision entry.

## What it checks

- **One module owns it.** A requirement that names no owning module is not yet a design. Pass cross-module needs through the other module's contract services — or a queue for writes — never its internals, never its storage.
- **Call or queue, chosen deliberately.** A journey that spans modules names its seams: synchronous contract call where the caller needs the answer, queue event where it needs the fact. Cross-cutting side effects (audit, notification, schedule) ride queues so no product module takes a synchronous dependency just to record one.
- **The data model is right in SaaS Plane terms.** States follow the read ladder (`Meta ⊂ Info ⊂ State`, `Details` by composition). Collections are keyed maps or ordered lists by what the answer means. Vocabularies are closed, `UPPER_SNAKE_CASE` and additive, and polymorphic families carry one discriminator. States and their interactions are the most load-bearing part of any design.
- **Change is classified before it is designed.** New capability · additive · breaking · fix — a breaking change never rides in as a plan row; it goes through the decision register with a version and migration path.
- **Structural additions are flagged.** A new chapter, module, or kind hits a documented ceiling: the plan produces a decision entry draft, never a fait accompli.
- **The domain's glossary is complete.** Every term the design adds is declared in one construct's `Terms` table — exactly one, in the domain that decides its meaning — so the generated glossary on that domain's face carries it with a contract term beside it. A term declared in two constructs is a defect, and the same word standing for two different contract terms is a rename rather than a merge.
- **A domain owns the constructs; a module does not.** A module carries `README.md` and no docs tree of its own — what it contributes sits in **the repository's one tree**, under the domain it belongs to: the domain's constructs in `02-constructs/<domain>/`, the rows for what a person can do in `03-behaviors/<domain>/`, and one mirror per source folder that earns one in `04-capabilities/<domain>/<layer>/`. A contract does not get a construct per state — the domain gets constructs, and states realize them. A behaviour row belongs to the domain that would have to change, never to the package that happens to serve it.
- **A node answers a fixed set of lifecycle commands, and its kind decides which.** Build it, prove one tier, run it, publish it — what each command refuses is part of the standard, and a line that belongs to every node of a kind moves into the stack's toolchain rather than into that node.

- **Blast radius is read as a design signal, not a work estimate.** A repair that breaks many call sites, changes GENERATED output, or crosses a package or repository boundary is a design decision that arrived wearing a compiler error. The scope of the damage is not the scope of the fix: the question is which LAYER owns the concern, asked before any mechanism is proposed.
- **Prior art outranks invention.** Before designing a new mechanism, the system is searched for how it already handles that concern. A capability the codebase already has, reimplemented beside itself, is a defect even when both copies work.
- **Options are checked for frame diversity.** If every option shares one noun — `marker`, `flag`, `param`, `config` — they are one idea in several hats, not a choice. At least one option must move the concern to a different layer; otherwise the frame itself has not been questioned.
- **The twin is located before a mechanism is designed.** Ask what this concept is most like, then ask whether that thing's mechanism transfers. This is not the prior-art check above it: prior art asks whether a thing already exists, the twin asks what a *new* thing resembles. Skip it and you invent a third way to do what the system already does twice.
- **A layer promise is not broken quietly.** Name the promise a layer already keeps before you add to it — utilities stay pure, the framework imports no module, a contract state never closes a dependency cycle. Changing a promise is a decision entry. Breaking one silently is the defect, and you find it as one file doing what every other file in the folder refuses to.
- **Costs are verified before they are asserted.** Read a release, a break, a migration or a call-site count from the manifest, the dependency graph or the grep that settles it. An asserted cost decides the design, and being wrong costs you nothing at the moment you assert it. That is why the reading comes first.

- **Reachability decides what a declaration may assert.** Where one state is reached from more than one direction, no annotation on that declaration can be correct for every path. Those directions are an input command and a read model, or a hand-authored document and a service response. Put the difference at the entries instead (RD.SUPPORT.APPS.071).

## The one thing it blocks

A new **cross-cutting mechanism** blocks where it is **reachable from more than one module** and no decision entry names what it was weighed against. A registry, a resolver, a base-class seam, a new table family — each is one.

- **Reachability is the threshold, never novelty.** A helper private to one module does not trip it. The moment a second module can reach the mechanism it is a construct, and a construct owes a decision entry.
- **The block is cheap to clear: you write the row.** It names the mechanism, what it was weighed against, and why those did not carry.
- **A person still decides.** The lens does not choose the mechanism. It refuses to let one arrive unweighed.

Duplication costs most later — a third way to do what the system already does twice, found after you have written the code.

## What it never does

- **Block anything but the condition above.** Everywhere else it flags the missing decision entry and drafts it; a person decides.
- Plan the implementation. Files, loops, and pseudo-code are the standards' job; the design says *what* and *where*, never *how*.
