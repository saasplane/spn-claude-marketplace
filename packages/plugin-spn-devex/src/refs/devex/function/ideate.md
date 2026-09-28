<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/03-ideate.md",
      "seen": "2983688b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/03-ideate.md",
      "seen": "ec8a7e0d"
    }
  ]
}
-->

# Ideate — Stack-Agnostic

What the `IDEATE` stage decides, where the decision lives, what a decided section means, how a requirement is classified once the shape holds, how far a change reaches in both directions, the question that stops a mechanism being invented beside one that already works, and what a design lands as. Apply this in any stack and in any repository. Source of truth: the foundation's `02-constructs/01-devex/01-function/03-ideate.md` and `04-capabilities/01-devex/01-function/03-ideate.md`. Where this restatement and those disagree, the sources win and this file is regenerated.

## Where this stage sits, and why it runs second

The DevEx stages are eight: `BOOTSTRAP · SCM · IDEATE · DEVELOP · TEST · PROVISION · DELIVER · OPERATE`. `IDEATE` runs after `SCM`, because a node needs a root before it has a concept to put there. There is no separate `PLAN` stage — `IDEATE` covers both deciding what a node is and designing a requirement inside that shape.

**The phase has one exit condition, and nothing here is finished until both halves hold.** The work can be described entirely in the platform's own vocabulary, and one node owns it. A requirement arrives in a customer's words, a support ticket's, or an incident's, and turning it into the platform's words means finding which domain already has a word for it — or finding out that nothing does, which is itself an answer: the shape is decided first, before anything is designed against it.

## One phase, two kinds of work — know which you are doing

| | Decides | Produces | Changes |
| --- | --- | --- | --- |
| **Deciding the shape** | what this node **is** — boundary, domains, surfaces, shape | `CONCEPT.md`, and the node's shape drawn | the **shape** |
| **Designing inside it** | how a requirement becomes a design the docs already carry | behaviour rows and capability documents | the **content** inside that shape |

**One test tells you which you are doing.** A requirement arrives. If it fits a domain that already exists, you are designing inside the shape that holds. If answering it means adding a domain, moving a boundary or splitting a module, the concept changes first, and the design follows in the same phase.

**A feature that quietly redraws a boundary while it is being designed is the failure this stage exists to catch.** Review does not catch it — each individual change looks reasonable. What catches it is noticing that the concept no longer describes the thing.

**A repository has one concept, however many nodes it grows.** `CONCEPT.md` belongs to the repository root, never to a node — adding a package, an application or a module changes *sections* of the repository's concept. A concept file beside a node manifest is always wrong; this is the likeliest wrong turn on a growing repository, because the new node feels like the thing being decided.

## Designing runs in a fixed order

1. **Classify the nature of the work**, which decides the altitude the work enters at.
2. **Name both ends** — the highest document that must change, and the lowest shared package the change reaches.
3. **Ask the twin**, before any mechanism is proposed.
4. **Find what already covers it**, stopping at the first hit.
5. **Shape the design** — behaviours first, contract second, and what changes at each layer.
6. **Record what the design decided**, where the choice is one others depend on.

**The design is spec-first, so it produces no document beside the docs.** It lands as planned rows in the owning node's behaviours and capabilities seats. Implementation later flips a status rather than reconciling two texts — a planned row is a design note, not a claim, and reading a seat tells you what is designed as well as what is running.

## Classify the altitude before you classify the change

You classify twice, and the order matters. First the **nature of the work**, which decides where you enter. Then the size of the change — new capability, additive, breaking, or fix — which runs inside the altitude you already chose. Reverse the two and you patch at the lowest rung, then meet the construct three rounds later.

| Nature of the work | Enter at | The highest thing that must re-align |
| --- | --- | --- |
| a new project or platform | the concept | nothing above it — the concept is the top |
| a new capability inside a module | that module's construct | the module's own seats |
| a new idea inside a module | where it fits in the construct, before any mechanics | the module's construct section |
| an idea spanning modules | the repository's concept, and this book where it states a rule | the concept, and a register row |

**The answer is a path, not a category.** If you cannot name the highest document that must change, you have not classified the work yet. Everything below that document is implementation; everything above it is untouched by what gets built.

**Ask both directions — they cost differently.**

| Direction | The question | What it costs |
| --- | --- | --- |
| upward | what is the highest document that must change? | rows, a chapter, and a handover where it reaches the book. No release |
| downward | what is the lowest shared package the change reaches? | a release and a pin bump in every consumer — and every other platform on the stack inherits it, asked for or not |

**A design is not classified until both ends are named.** The downward question is the modularity check: the lower a change reaches, the more products it commits to it.

**The altitude is discovered, so escalate rather than absorb.** Work entered at module level routinely turns out to need the rung above — settle the higher document first, because a row written against a construct that is about to move is a row written twice. The top rung is not one document either: this book holds a construct per subject, so name *which* construct owns the idea before you climb into it, or the writing lands in the wrong chapter.

**This book's rung holds constructs, never internals** — a promise, a boundary, a vocabulary. One test separates the two: would this sentence still be true on a second stack and a second platform? Name a table, a package or a code, and the sentence belongs to the repository that realizes it.

## The twin question stops a third mechanism beside two that work

**The twin is narrower than "does this already exist."** It asks: what does this new idea most resemble, and does that thing's mechanism transfer? Answering it can replace several invented mechanisms with none — a resolver registered on the framework, a table overloaded to carry a second decision, a new store built where an existing chain already resolves the same question are each a mechanism somebody invented beside one that already worked.

**A layer promise is what makes the check concrete.** Name the promise a layer already keeps before anything is added to that layer. Breaking one silently is the defect this question exists to catch; breaking one deliberately is a decision, and a decision is a register row.

## Find what already covers it, stopping at the first hit

1. **The installed symbol index** — what every installed package publishes. Read it before assuming an interface does not exist; this is the fastest way to discover the requirement is already served.
2. **The owning module's contract** — an existing command, or a new optional field on one, frequently covers a requirement that looked new.
3. **The shared contract primitives** — a get, a bulk get, a key lookup, an active toggle. Minting a bespoke command for a single identifier is the most common avoidable addition.

**A duplicate capability costs more than a missing one**, because two implementations of one behaviour drift apart and both keep passing their own tests.

## What a design has to settle before it is a design

| Question | Why it cannot wait |
| --- | --- |
| what is being added — a new capability, a change to one, or a correction | a correction rarely needs a design and a new capability always does |
| where it runs — server, web, or neither | it decides the kind, and the kind decides structure, toolchain and packaging |
| who owns it — the module whose contract will carry it | a requirement naming no owning module is not yet a design |
| how it is entered — a request, a queued message, a command line, a schedule, an agent call | each is an entry over one contract, never a separate implementation |
| what varies the answer — the person, the organization type, or the plan | those are a permission, an enablement and billing, and none substitutes for another |

The last row is the one that silently bakes a product decision into code. Settle it here and the gate writes itself later.

## What the design lands as

**Behaviours first.** State what an actor can do, one line each, in language the person who asked would recognise. Each becomes something provable later — a behaviour nobody can prove is a wish.

**The contract second.** One method, one command in, one state out. Sketch the names, not the fields — the shape is settled when the contract is written, not in the design.

**What changes at each layer, including storage.** A design that touches storage without saying so is incomplete.

**The failure cases, as error codes rather than prose.** Which are the caller's fault and which are the system's decides the response class, and it cannot be retrofitted cheaply.

- **A structural addition needs a recorded decision.** Where the platform's own documented structure has a ceiling — a new top-level chapter, a new module, a new kind — the design produces a register row, never a fait accompli.
- **Contracts are the only cross-module surface.** If the design needs another module's internals or its storage, the design is wrong, not the rule.
- **Additive by default.** A breaking change is a planned, versioned event with a migration path — if the design contains one, that is the headline, never a footnote.
- **The phase does not design the implementation.** Naming files, choosing loop structures or writing pseudo-code here is wasted, because the standards decide most of it. A design says *what* and *where*, never *how*.

## A decided section, and what a status means

Each section carries its status beside its heading, and the person reviewing it sets that status. **You never set one yourself.**

| Status | What it means | What may read it |
| --- | --- | --- |
| `DRAFT` | being argued; three honest lines beat a page of plausible detail | nothing downstream |
| `AGREED` | a person read it and it is safe to build against | `FRAME`, which writes the seats |
| `REALIZED` | the seats and the code carry it, and the section stays as the standing one-page view | everyone, as the summary |

**Nothing becomes `AGREED` because it reads well — MUST.** A section nobody decided stays `DRAFT`. Inventing plausible detail to make it look finished is the failure mode: invented detail reads as agreement and gets built on.

**A concept is never deleted once realized.** Throw it away after the docs are written and the node loses the only page that says what it is — the next person asking "should this belong here?" has nowhere to look.

## Harvesting: same gate, different source

| The node has | The work is | Where the words come from |
| --- | --- | --- |
| nothing yet | ideating | the person, one agreed block at a time |
| seats that already answer it | harvesting | the seats, cited |

**Harvesting never shortcuts the gate.** A harvested block says nothing the seats do not, and it names the chapters it was read from. Where the seats are silent, that part stays `DRAFT`. Two failures belong to harvesting alone: copying across instead of summarizing up (a chapter states depth, a concept states shape — a harvested field list or signature is wrong at this altitude), and resolving a disagreement quietly (two seats that contradict each other become a register row, never a sentence smoothed over).

## When a question or a design outgrows the page

| Were options weighed and one chosen? | The expansion | Where it lives |
| --- | --- | --- |
| yes — a design was argued and a cost accepted | an approach document | the workstream that argues it, under `.spndevex/workstreams/` |
| no — a section was expanded so it can be read | an overview | the node's own artifacts pocket |

A page with no options, no recommendation and no accepted cost is an overview whichever folder holds it. Either way the section names the file and the file names the section back. **An expansion is offered and never started unasked**, and one is never written to make a concept look finished — a concept whose sections have none is the ordinary case.

An argument closes by being consumed: the half that outlives it is a register row, and the construct the decision changed is rewritten fresh. The page itself stays in the workstream and closes with it. A question deliberately left unanswered is deferred with a trigger — what would bring it back; a deferred item with no trigger is a backlog entry, and the next reader relitigates it.

## Who is in the room, and who can still block

| Section | Convene |
| --- | --- |
| the boundary, and why the thing exists | `BUSINESS` · `PRODUCT` · `LEAD` |
| who it serves, and what they can do | `PRODUCT` |
| the domains, the surfaces, the shape | `ARCHITECT` |
| an open question | whichever lens the question belongs to |

**Wearing a lens while drafting is not reviewing through it.** The context that drafted a design contains every justification for it, so it agrees with itself — the architect's lens is convened over the draft as well as worn while writing it, because the reviewer who can still block is the one who did not write the thing.

**The architect's lens blocks on a new mechanism reachable from more than one module**, and the block clears when a register row names what that mechanism was weighed against. Below that threshold the lens advises, and advice declined is dropped.

## What this phase hands on, and what it never does

`FRAME` reads the agreed sections and writes the seats: why becomes the purpose seat, who becomes the personas, and the outcomes become behaviour rows with ids. Those sections then flip to `REALIZED`. The designed rows land in the owning node's behaviours and capabilities seats, and the arcs minted here carry them into develop, test, provision and deliver.

- **Deciding the shape never designs.** A field list, a table, or a method signature belongs to the design work inside this phase, or to develop. A concept that specifies has become a spec nobody agreed to.
- **It never closes its own questions.** You draft options and a recommendation; a person decides.
- **A concept never writes into the docs tree.** Its output is one file at the repository root; the seats it justifies belong to `FRAME`. The planned rows of a design are the only thing this phase puts into a seat.

## What breaks if you skip this

| If you… | Then |
| --- | --- |
| design before naming both ends | you learn the real blast radius after the work is already built, not before |
| propose a mechanism before asking the twin | you invent a third way to do something two mechanisms already do |
| build against a `DRAFT` section | you build on something nobody agreed to, and `FRAME` was never meant to read it |
| put a design in a scratch file instead of the owning node's seats | it is never reconciled, and the next reader cannot find it |
| write a concept that specifies fields and signatures | you have written a spec nobody agreed to, at an altitude that should hold shape only |
| close your own open question | the gate that exists to catch a wrong boundary never fires |
