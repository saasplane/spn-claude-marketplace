---
name: plan
description: Turn a requirement into a design the platform's own vocabulary can carry, before any code exists. Use when someone describes something they want built, changed, or investigated and no design has been agreed - classifying the requirement, finding what already covers it, naming the module that owns it, and sketching the contract. Stack-agnostic; the stack plugin supplies the scaffolding commands that follow.
---

# plan — a requirement becomes a design

**Exit criterion: the work can be described entirely in platform vocabulary, and one module owns it.** Until both hold, planning is not finished and implementation must not start.

## Classify before you design

Most architecture pain is a component that never said what kind of thing it was. Before shaping anything, settle:

- **What is being added** — a new capability, a change to an existing one, or a correction. A correction rarely needs a design; a new capability always does.
- **Where it runs** — server, web, or universal. This decides the kind, and the kind decides structure, toolchain, and packaging. It is not a later detail.
- **Who owns it** — the module whose contract will carry it. A requirement that names no owning module is not yet a design.
- **How it is entered** — request, queue message, command line, scheduled, or agent tool call. Each is an entry over the same contract, never a separate implementation.

## Find what already covers it

**Reuse before minting.** In order, and stopping at the first hit:

1. **The installed symbol index** — what every installed package publishes. Read it before assuming an API does not exist; this is the fastest way to discover the requirement is already served.
2. **The owning module's contract** — an existing command or a new optional field frequently covers a requirement that looked new.
3. **Shared contract primitives** — a get, a bulk get, a key lookup, an active toggle. Minting a bespoke command for a single id is the most common avoidable addition.

A duplicate capability costs more than a missing one: it splits behaviour across two implementations that drift.

## Shape the design

- **Behaviours first.** State what an actor can do, in one line each, in language the person asking would recognise. Each becomes something provable later; a behaviour nobody can prove is a wish.
- **Contract second.** One method, one command in, one state out. Sketch the names, not the fields — the shape is settled when the contract is written, not in the plan.
- **Say what changes at each layer.** Contract, implementation, entry, storage, and what a caller must do differently. A design that touches storage without saying so is incomplete.
- **Name the failure cases** as error codes, not prose. Which are the caller's fault, which are the system's — that distinction decides the response class and cannot be retrofitted cheaply.

## The lines that hold

- **A structural addition needs a recorded decision.** Where the platform's own documented structure has a ceiling — a new top-level chapter, a new module, a new kind — the plan produces a decision entry, not a fait accompli.
- **Contracts are the only cross-module surface.** If the design requires reaching another module's internals or its storage, the design is wrong, not the rule.
- **Additive by default.** A breaking change is a planned, versioned event with a migration path. If the plan contains one, that is the headline, not a footnote.
- **Do not plan the implementation.** Naming files, choosing loop structures, or writing pseudo-code here is wasted — the standards decide most of it, and the plan should say *what* and *where*, never *how*.

## The approach document

**Source of truth:** the foundation book's artifacts standard (`docs/03-capabilities/05-docs/05-artifacts.md`, "The approach document" section). This section digests it for use at the moment of writing and adds no rule of its own; where the two disagree, the book wins and this file is regenerated.

When a design is big enough that someone will read it more than once — a new artifact, a contract that other teams build against, a standard the tooling will enforce — the plan becomes a document with a fixed shape. **Why → What → How → Open → Deferred.** Nothing else, and in that order.

**Open with a Terms block when the document needs one.** A design that coins or leans on concepts a reader may not already hold — a *lens*, a *panel*, a name the book has not settled yet — defines them in a small block **before Why**: one line per term, five to eight terms at most, so the reader has the vocabulary before the argument. A document that introduces nothing new skips the block entirely — it exists to give context, never to pad.

It is **one self-contained HTML page named `<topic>-approach.html`** — one file per topic, replaced in place as it iterates, never a second copy in another format. HTML because these documents carry tables, samples and comparisons that a reader scans rather than reads, and because a single file travels: it opens anywhere, needs nothing installed, and cannot drift from a companion version of itself.

| Section | Answers | Written as |
| --- | --- | --- |
| **Why** | what problem this solves, and the bar the answer must clear | the bar as one sentence a reader can hold; the cost of the current situation, in specifics |
| **What** | the decision — the shape, the fields, the vocabulary | **real values, never invented ones** — sampled from the actual codebase, so the reader is checking a description against reality rather than judging a sketch |
| **How** | how it is produced and how it stays true | including **how an agent is configured to follow it** — a standard that lives only in a document is one nobody applies at the moment of writing |
| **Open** | the questions that **block** — the design is not settled until each is answered | **one card each, in the decidable layout below** — never a paragraph the reader has to mine for the question answer first |
| **Deferred** | what was consciously **parked** — understood, decided against doing now | each with *why not now* and *what would bring it back*, so it is a decision rather than a backlog |

### Writing into a doc set

Planning lands as rows and terms in the owning node's seats, so **resolve the node before writing any of them** — `refs/doc-sets.md` carries the procedure. In one line: the declared **kind** fixes the **consumer**, and the consumer fixes the **actor voice**, the **area grouping**, and the **proof tier**. Guessing the actor is the one defect editing cannot repair, because it puts the row on the wrong node.

### Draw the shape in What and How

Where a section's subject **is** a shape — a boundary, a nesting set, a pipeline, a lifecycle, a set of arrangements — draw it; `What` and `How` are where those subjects live. Skip it where the subject is a judgment rather than a structure. Three rules: **draw the argument, not the chapter** (the owning chapter's diagrams are reference; yours makes a claim visible — a restatement is a diagram that could be copied unchanged); **inline SVG using the page's own colour variables**, so it works in light and dark and the page still travels as one file; and **never draw what does not exist** — every box is something the book names, because a shape invented to balance a picture becomes a claim the reader believes.

**Compose from the grammar, never by eye** — four primitives on one grid, so every diagram in the corpus reads as one system:

```text
Shape      a leaf box, one label (+ a quieter second line)
           heights S 44 · M 64 · L 84 — content stretches WIDTH, never padding or type
           padding 14 horizontal · label centred · second line 19 below the first

Container  a box holding shapes plus its own heading
           padding 20 · heading 24 from the top edge · radius 6 · stroke 1.5
           nest at most two deep

Connector  1.6 stroke, matching 7×7 head, ≥36 visible shaft
           connects box EDGES, never text — accent for primary flow, ok for async

Note       free text outside boxes — 16 from any box edge, wraps at 20 leading

Grid       canvas 760 · margin 24 · content 712
           columns: 2-up 344 · 3-up 221 · 4-up 160 — always gap 24
           rows: +20 between siblings · 36 between groups · 28 around a container
                 32 around a horizontal rule
           type: title 13/650 · label 12 · sub and note 11 — no fourth size
```

Colour carries role, not decoration — neutral `--card`/`--rule` · emphasis `--accent-soft`/`--accent` · derived or async `--ok-soft`/`--ok` · terminal `--gap-soft`/`--gap` · inactive `fill:none` + dashed `--rule`. **One emphasis per diagram**: if everything is highlighted, the highlight teaches nothing.

**A flow runs one way** — pick left-to-right or top-to-bottom and hold it for the whole diagram, so the reader never works out which way time moves. Left-to-right for pipelines with short stages; top-to-bottom for layers, where each row is a stratum. Only a **flowchart** may branch (a decision fanning into cases, or parallel arrangements side by side), and its branches still leave and rejoin along the one axis. Arrows pointing three directions describe a system nobody has finished thinking about.

### Every open item is decidable in one read

An open item exists to be **decided**, so it is written for the person deciding — not as narrative they must extract a question from. **One card per item, always these four parts, always this order:**

```text
<Item> — one line naming the decision, not the topic

What        the change, concretely: the file, the rule, the before → after
Why         what it costs to leave as is — the failure it causes, not "for consistency"
Options     A / B / C, one line each, with the real trade-off on each
            → Recommendation: <one>, because <the reason it wins>
Preview     when the decision is a shape — an outline, a file tree, a sample row, a code
            fragment — a compact preview of the recommendation, inline in the card
```

- **Open is the exception to the document's high-level altitude.** The body compresses because its detail lives in owning chapters; an open item's detail lives nowhere else, and a decision hangs on it — a card carries whatever depth the decision needs, and a reader who must leave the card to decide was handed an incomplete one.
- **Options are mandatory, and so is a recommendation.** A card with no options is a report, not a decision; a card with options but no recommendation makes the reader do the analysis twice. Two options is the normal case — *do it this way* versus *leave it*, with what each costs.
- **Show, don't summarize, when the decision is a shape.** If judging the options requires seeing what one would produce — an outline, a tree, a table layout, a sample row — the card carries a compact preview of the recommendation (and of a rival, where the difference between them is the point). A reviewer who has to ask *"show me what A looks like"* was given a card that was not decidable, and the iteration that follows is the cost of the missing preview.
- **"Do nothing" is a real option** and MUST appear whenever it is genuinely viable, with its cost stated. Half the time it wins.
- **Trade-offs are concrete or absent.** *"Simpler"* is not a trade-off; *"one file to change instead of twenty, at the cost of a second name for one concept"* is.
- **The recommendation carries its reason on the same line.** A reader agreeing with the reason can approve without reading further; a reader disagreeing knows exactly where they diverge.
- **Length is not the variable.** A long description does not make a decision easier and a short one does not make it faster — *description, why, options, recommendation* is what does. Write each part as short as it can be while staying decidable.

- **More than one item → numbered, and stable within the exchange.** A multi-item sheet closes by showing how to answer by number — *"1A, 2 confirm, 5–9 yes"* — so a developer settles the whole sheet in one line. An answer that cannot be given by number is a sheet that was not numbered.
- **A card is self-contained across sittings.** Developers decide days after the work that raised the question; a card assumes no conversation context and no memory of the session that wrote it. Carry what deciding cold needs: the provenance (what raised it, in a line or two), the current state (what is true today, and the cost of not deciding), and where the decision lands once made. Leaving the card for conversation history is leaving the card.

The same layout governs **how pending work is reported back to a developer at any time** — in an approach document, a status summary, a chat reply, or an answer to *"what's left?"* A list of pending items without options is work handed back rather than a decision offered.

### Open blocks; Deferred does not

The distinction is what lets a design finish. **A question is `Open` while answering it could still change the shape.** Once the answer is understood and the choice is simply *not yet* — the cost is known, the design does not depend on it — it moves to `Deferred` and stops holding the document up.

Moving something to `Deferred` is a decision and is written as one: *why not now*, and *what would bring it back*. A deferred item with neither is only a backlog entry, and will be re-litigated by whoever reads it next.

Nothing is deferred while it still changes what gets built. That is the whole test.

### It iterates until Open is empty

The document is the working surface, not a record of the work:

- **A resolved question leaves `Open` and is folded into the section that now answers it.** It does not become a note saying it was resolved — a document that accumulates its own history is one nobody finishes reading.
- **A question that changes the design changes the design.** Rewrite Why, What or How so the document reads as though it was always that way. No revision markers, no "previously", no changelog.
- **A new question found while answering another is added to `Open`.** Discovering one is progress, not failure — writing the samples against real code is what surfaces them, which is why the samples come before the conclusions.

### When `Open` is empty

`Deferred` may still carry items — that is the point of it. Then, in this order:

1. **Implement it.** The design is settled; the code follows.
2. **Record the decision** in the decision register, if it changes a rule or an interface others depend on.
3. **Then, and only then, the document lands in the artifacts pocket** of the node that owns the topic. That pocket holds finished reference material, never work in progress — an approach doc arrives when it describes something true, not while it is still deciding.

A document still carrying **open** questions lives with the work, not in the artifacts pocket. Deferred items travel with it, and are the first thing the next person reads when the topic comes back.

**The document closes with a footer naming its sources** — the chapters and register rows it reasons over — **and the iteration contract**, so a future session can reopen and continue it: new questions land as Open cards, resolutions fold in, the status chip follows the shape.

**The document is the only artifact the design produces.** Not a summary alongside it, not a second copy in another format, not a companion note — those drift, and a reader who finds the stale one has no way to tell. When a rule needs to be *applied* rather than understood, its enforceable form belongs where the work happens: a skill or a reference file the agent already loads. The approach document explains why that rule exists; it never becomes a second place to look it up.

## Lenses

Wear `refs/lenses/architect.md` and `refs/lenses/product.md` while drafting — decomposition and data model from one, consumer outcomes and vocabulary from the other. **Before any 🔮 row lands in the owning docs**, convene the `spn-panel` subagent once per lens with `lead`, `product`, `trust`, and `qa` over the draft; fold findings in, then land the rows.

## Report

The design, in this order: the classification, what already covers part of it, the behaviours, the contract sketch, what changes per layer, the failure cases, and anything that needs a decision recorded. Close with what you are **unsure** about — an unstated assumption is the thing that gets discovered after the code is written.

Then hand to the stack's scaffolding skill, which supplies the commands.
