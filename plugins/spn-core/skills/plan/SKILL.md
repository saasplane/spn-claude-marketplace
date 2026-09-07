---
name: plan
description: Turn a requirement into a design the platform's own vocabulary can carry, before any code exists. Use when someone describes something they want built, changed, or investigated and no design has been agreed - classifying the requirement, finding what already covers it, naming the module that owns it, and sketching the contract. Stack-agnostic; the stack plugin supplies the scaffolding commands that follow.
---

# plan — a requirement becomes a design

**Exit criterion: the work can be described entirely in platform vocabulary, and one module owns it.** Until both hold, planning is not finished and implementation must not start.

## First, resolve the layer — before anything below

Planning is one verb (`DEVEX_PLAN`) and it lives only here. What changes by node is *reference
material*, never the verb, so resolve the node and load its layers before applying a single rule:

1. **Find the node's law** — the nearest `sprepo.json` above the file names the **world**
   (`FOUNDATION` · `APPS` · `INFRA`) and the **stack claim**. The node's own manifest
   (`spkind.json`, or `spinfrapkg.json` + `src/spestate.json`) names the node.
2. **Load, in order, whichever exist:**

   | Layer | File | Carries |
   | --- | --- | --- |
   | voice + doc grammar | `refs/doc-sets.md` in **spn-core** | the seats, and **the one voice** (below) — load this whenever the output is a document |
   | domain | `refs/plan.md` in the matching **`spn-<domain>`** plugin | which seats take the rows, what "breaking" means there |
   | instance | `refs/plan.md` in **`spn-<domain>-<stack>`** | how the stack spells a contract, a service, a migration |

3. **Where a layer disagrees with this file, the more specific layer wins** — it is closer to the
   node. Where a layer disagrees with the book, the book wins and the layer is regenerated.

**There is no per-domain `plan` skill, and adding one is a defect** — the book's `SPSkillType` is
closed, and a folder whose derived value (`{DOMAIN}_{SKILL}`) is not in it fails conformance.

## Step 0 — classify the nature of the work

**Design nothing until you have named where this work enters.** The nature of the work decides the altitude, and the altitude decides which document must change first. Skip this and you patch at the lowest rung, then discover the construct three rounds later.

| Nature of the work | Enter at | Highest thing that must re-align |
| --- | --- | --- |
| A new project or platform | the concept | nothing above it — the concept **is** the top |
| A new capability inside a module | the module's construct | the module's own seats |
| A **new concept** inside a module | where it fits in the construct, before any mechanics | the module's construct section |
| A concept spanning modules | the repo's `CONCEPT.md`, and the book where it states a rule | `CONCEPT.md` **and** a register row |

**The answer is a path, not a category: if you cannot name the highest document that must change, you have not classified yet.** Everything below that document is implementation. Everything above it is untouched by what you build.

### Both ends, and the ladder between them

Ask both directions together, because they cost different things. **Upward** is what governs the concept. **Downward** is what it is built on, and every rung down buys a release.

| Direction | The question | The ladder | What it costs |
| --- | --- | --- | --- |
| **Upward** | what is the **highest document** that must change? | the module's seats → the module's construct → the repo's `CONCEPT.md` → the owning foundation chapter, plus a register row | rows, a chapter, a handover. No release |
| **Downward** | what is the **lowest shared package** it reaches? | the module → the stack's shared packages, in dependency order → the shared contract package | a release and a pin bump in every consumer — and every other platform on the stack inherits it, asked for or not |

**A design is not classified until both ends are named**, and the span between them is the real blast radius. The downward question is your modularity check: the lower a change reaches, the more products it commits.

**The altitude is discovered, so escalate rather than absorb.** Work you entered at module level often turns out to need the rung above. Settle the higher document first — documents lead code, and a row written against a construct that is about to move is written twice.

**The foundation rung holds constructs, never internals** — a promise, a boundary, a vocabulary. The repo that builds it holds the realization. One test separates them while you write: would this sentence still be true on a second stack and a second platform? Name a table, a package or a code, and it is not foundation material.

**The top rung is not one document.** The foundation holds a construct per subject, so say *which* construct owns the concept. Escalate without asking, and you write into the wrong chapter.

### The questions, in the order you ask them

| # | Question | What a good answer looks like |
| --- | --- | --- |
| 1 | What is the nature of this work? | a row of the table above, not a feeling |
| 2 | What is the highest document that must change? | a path, and the reason it is the highest |
| 3 | What is the lowest shared package it reaches? | a package name, and what its release obliges |
| 4 | What is this concept's twin, and does its mechanism transfer? | an existing construct, named |
| 5 | Which layer promise does this test? | the promise stated, then kept or deliberately changed |
| 6 | What varies later? | the change you can already foresee, and whether the shape survives it |

Question four is not a search for prior art. **Prior art asks whether a thing exists; the twin asks what your concept most resembles**, and whether that thing's mechanism carries over.

**A plan naming no altitude and no highest document is incomplete**, and you say so rather than designing anyway.

## Classify before you design

**This runs inside the altitude you named, never instead of it.** Most architecture pain is a component that never said what kind of thing it was. Before shaping anything, settle:

- **What is being added** — a new capability, a change to an existing one, or a correction. A correction rarely needs a design; a new capability always does.
- **Where it runs** — server, web, or universal. This decides the kind, and the kind decides structure, toolchain, and packaging. It is not a later detail.
- **Who owns it** — the module whose contract will carry it. A requirement that names no owning module is not yet a design.
- **How it is entered** — request, queue message, command line, scheduled, or agent tool call. Each is an entry over the same contract, never a separate implementation.
- **What varies the answer** — whether the rule changes per person, per organization type, or per plan. Those are a permission, an enablement and billing, and none substitutes for another. Settle it here and the gate writes itself later; leave it and you bake a product decision into code. `refs/permission-vs-enablement.md` carries the question and the traps this estate actually hit.

## Find what already covers it

**Reuse before minting.** In order, and stopping at the first hit:

1. **The installed symbol index** — what every installed package publishes. Read it before assuming an API does not exist; this is the fastest way to discover the requirement is already served.
2. **The owning module's contract** — an existing command or a new optional field frequently covers a requirement that looked new.
3. **Shared contract primitives** — a get, a bulk get, a key lookup, an active toggle. Minting a bespoke command for a single id is the most common avoidable addition.

A duplicate capability costs more than a missing one: it splits behavior across two implementations that drift.

## Shape the design

- **Behaviors first.** State what an actor can do, in one line each, in language the person asking would recognize. Each becomes something provable later; a behavior nobody can prove is a wish.
- **Contract second.** One method, one command in, one state out. Sketch the names, not the fields — the shape is settled when the contract is written, not in the plan.
- **Say what changes at each layer.** Contract, implementation, entry, storage, and what a caller must do differently. A design that touches storage without saying so is incomplete.
- **Name the failure cases** as error codes, not prose. Which are the caller's fault, which are the system's — that distinction decides the response class and cannot be retrofitted cheaply.

## The lines that hold

- **A structural addition needs a recorded decision.** Where the platform's own documented structure has a ceiling — a new top-level chapter, a new module, a new kind — the plan produces a decision entry, not a fait accompli.
- **Contracts are the only cross-module surface.** If the design requires reaching another module's internals or its storage, the design is wrong, not the rule.
- **Additive by default.** A breaking change is a planned, versioned event with a migration path. If the plan contains one, that is the headline, not a footnote.
- **Do not plan the implementation.** Naming files, choosing loop structures, or writing pseudo-code here is wasted — the standards decide most of it, and the plan should say *what* and *where*, never *how*.

## The approach document

**Write it in the corpus voice — this is where documents get it wrong.** The corpus speaks
**one voice, the warm learning register** (decisions RD.DOCS.031 · RD.DOCS.043). Second person,
present tense, active; around fifteen words a sentence, one idea each; momentum over ceremony.
The numbers are the rule: few sentences past twenty-five words, none past thirty, and *you*
present. **HTML is not an exemption** — an approach page takes the voice exactly as a seat does,
and the `spn-core` doc-check hook measures it. When a sentence fails, make one of three moves —
**split it · say *you* · define the term** — and never shorten it. Two rules decide most edits:

- **The register governs prose, never records.** Chapter bodies, section narrative and an Open
  card's argument take the voice. Tables, diagrams, behavior rows, glossary and decision rows,
  contract blocks and code samples keep their form untouched — **a warmed record is a defect**.
- **Never write a set's cardinality into prose** (decision RD.GOV.008) — *"the five nouns"*,
  *"the twenty decisions"*. Name the set by its rule instead. A count in prose goes stale silently
  the day the set grows, and the prose that lied is never the prose anyone re-reads. The exception
  is a closed set whose count carries a ruling.

The masthead **names its audience** — an artifact has no seat, so its content is decided by who
reads it, and an artifact written for everyone is read carefully by nobody. `refs/doc-sets.md`
carries the register in full; load it before writing.

**Source of truth:** the foundation book's artifacts standard (`docs/03-capabilities/05-docs/05-artifacts.md`, "The approach document" section). This section digests it for use at the moment of writing and adds no rule of its own; where the two disagree, the book wins and this file is regenerated.

When a design is big enough that someone will read it more than once, the plan becomes a document with a fixed shape. Such a design is a new artifact, a contract that other teams build against, or a standard the tooling will enforce. **Why → What → How → Open → Deferred.** Nothing else, and in that order.

**Open with a Terms block when the document needs one.** A design sometimes coins or leans on concepts a reader may not already hold — a *lens*, a *panel*, a name the book has not settled yet. Define them in a small block **before Why**: one line per term, five to eight terms at most. The reader then has the vocabulary before the argument. A document that introduces nothing new skips the block entirely — it exists to give context, never to pad.

**Route before you write — an argument or an expansion?** The pocket holds both, the suffix names which, and the set is closed (decisions RD.DOCS.039 · RD.DOCS.040). One question decides it: **were options weighed and one chosen?**

| Answer | Kind | Path | Shape |
| --- | --- | --- | --- |
| **yes** — a design was argued, a cost accepted | approach | `artifacts/approaches/<topic>-approach.html` | `Terms? → Why → What → How → Open → Deferred` |
| **no** — a concept section expanded so it can be read | overview | `artifacts/overviews/<section>-overview.html` | the section's own shape, at reading depth |

A document with no options, no recommendation and no accepted cost is an **overview** whichever folder holds it. Filing it as an argument costs a reader the signal that says whether anything is still open.

Two rules separate them once you are writing:

- **The outline is fixed for an argument and borrowed for an explanation.** An approach takes the sections below, always, in order. An overview takes **the headings of what it expands, in that thing's order**, and invents none the source does not have. It carries **no `Open` and no `Deferred`** — those are an argument's organs, and a question found while writing one is an approach waiting to be offered, or a register row.
- **Depth follows from where else the detail lives.** An overview compresses everything, because the source holds the depth. An approach compresses the **mechanics** and expands the **reasoning**. The mechanics are concepts and boundaries, never an inventory of rules the owning chapters carry. The reasoning expands because a register row records what was decided and never the options that lost.

`concept-overview.html` is the concept's readable HTML face, one per repo; a `<section>-overview.html` expands one section and the section names it back. Everything below in this section governs the **approach** document.

**Where the page lives decides whether it may be published** (decision RD.DOCS.054). An open page
sits in `.spndevex/`, which is in no repository, so it reaches one machine and nobody else. A
settled page sits in a repository pocket, where the git host already shares it.

| The page is | Reaches | So |
| --- | --- | --- |
| open, still argued | one machine | it **may be published** for review, on the developer's say-so |
| settled, in a repository | anyone who pulls | **never publish it** |

- **Ask before publishing, every time.** The page leaves the machine, and what it carries is the
  developer's to judge. Never publish one unasked.
- **Never publish a page that is already in a repository.** Every relative link would have to
  become absolute, and the foundation's pocket alone carries 122 of them with 39 pointing at a
  sibling page. That is a second corpus disagreeing with the first.
- **The file is the source.** A published page is a rendering, so read the file rather than the
  page — which is also what keeps it cheap.
- **Retire the published copy when the page settles** into a repository.
- **Never publish a credential, real personal data, or a private repository name.**

**Hand the page over as something clickable, and name the file rather than the path.** Which form
works depends on where the developer reads it:

| Give | Reads as | Works |
| --- | --- | --- |
| the **published artifact's** https URL | `https://claude.ai/code/artifact/<id>` | wherever the developer reads, and it renders the page rather than its markup |
| a markdown link on the **workspace-relative** path | `[release-confidence-approach.html](.spndevex/workstreams/open/007-.../release-confidence-approach.html)` | in an IDE chat, where it is clickable |
| `file://` plus the absolute path | the session banner prints this under each open workstream | in a terminal, and when pasted into any browser |

**Where the page has been published, the artifact URL is the one that reads.** An editor shows an
HTML file as markup, so a path link hands over source rather than a page. Give the path forms
alongside it, and let the developer pick — asking which they want costs a turn.

**Publishing produces that URL, so give it in the same message.** The publish is what the developer
said yes to; handing back a path afterwards wastes the permission they just gave. Republish the same
file path to keep the URL stable, and give the URL again every time the page changes.

- **Name the file, never the path.** The link text is the file name; the path is the target.
- **Never assume an editor extension, and never configure one.** How a page gets rendered is the
  developer's own setup, and no two are alike. An editor shows an HTML file as markup, and what
  fixes that is theirs to install. **Add no `.vscode/` folder and no editor setting**: a workspace
  that ships one decides for every person who opens it, on a machine you cannot see. Write no
  instruction that only works with an extension present, and never report a link as broken because
  a preview did not appear.
- **Give the link every time the page changes**, in the same message that says what changed. A
  page nobody can reach is a page nobody reads, and the developer is who it was written for. Where
  they say a live preview is open, say what changed and drop the link — it reloads itself.
- **Never open it yourself, and never start a server for it.** `open -a` spawns a window on each
  call. A hand-started server dies with its shell and leaves a dead link, which reads as a missing
  page rather than a stopped process.

It is **one self-contained HTML page named `<topic>-approach.html`** — one file per topic, replaced in place as it iterates, never a second copy in another format. HTML because these documents carry tables, samples and comparisons that a reader scans rather than reads. HTML also because a single file travels: it opens anywhere, needs nothing installed, and cannot drift from a companion version of itself.

| Section | Answers | Written as |
| --- | --- | --- |
| **Why** | what problem this solves, and the bar the answer must clear | the bar as one sentence a reader can hold; the cost of the current situation, in specifics |
| **What** | the decision — the shape, the fields, the vocabulary | **real values, never invented ones** — sampled from the actual codebase, so the reader is checking a description against reality rather than judging a sketch |
| **How** | how it is produced and how it stays true — **in code and in documents** | two tables. **What is built**, including **how an agent is configured to follow it** — a standard that lives only in a document is one nobody applies at the moment of writing. Then **what re-aligns** — every document the reasoning obliges, with its owner and state |
| **Open** | the questions that **block** — the design is not settled until each is answered | **one card each, in the decidable layout below** — never a paragraph the reader has to mine for the question answer first |
| **Deferred** | what was consciously **parked** — understood, decided against doing now | each with *why not now* and *what would bring it back*, so it is a decision rather than a backlog |

#### Where the argument lives while you argue it

**A page in a repo's artifacts pocket is a landing, never a drafting table.** The pocket holds
finished reference material, so an argument still being corrected does not belong there yet.
While a subject is open, its page lives in the workspace's own workstream folder:
`.spndevex/workstreams/open/{NNN}-{subject}/{subject}-approach.html`. You iterate it there, and
it moves into the pocket by scope once the argument is settled. Writing it into a repo early is
how a design ends up committed into a seat while its author is still changing their mind.

**A workstream is a scope of work, never a Claude Code session** — Claude Code owns the window,
and `SessionStart` is its hook. Its state is the folder it sits in: `backlog/` is parked,
`open/` is being worked, and `closed/` is accounted for. The number is assigned once in creation
order, and nothing reuses or renumbers it.

**Work earns a workstream on three tells, and any one is enough.** The work needs an argument
before it can be built, or it crosses more than one repo, or it outlives one sitting. Everything
else is just work you do, and one minted for a one-file change is overhead nobody reads. A new
workstream takes the next free number across all three states.

**Propose the starting state and say why — never pick silently.** Propose `open/` where nothing
blocks it, and `backlog/` where you can name what it waits on: a trigger, another workstream, or
questions nobody answered. **Name the blocker, or the proposal is `open/`** — a backlog nobody
can explain is where work goes to be forgotten. The developer confirms or overrides in one word,
because scope is theirs. `refs/cross-repo.md` carries the worked examples.

**Implementation reopens a workstream, and that is the loop working rather than failing.**
Approval is not a freeze. Building against a settled argument surfaces facts the cards assumed
away, and a fact that changes a **decision** owes a new card before the work continues. A fact
that only changes the **amount of work** does not — it is a row, not a card.

- **Reopen for a decision, never for a surprise.** Discovering the job is bigger is a row moving
  from ⬜ to 🚧. Discovering the model was wrong is a card.
- **Write the card when the fact is found**, not when somebody notices later. A page marked ✅
  while its author keeps arguing is the failure this rule prevents, and the amendment trail is
  what a later reader needs.
- **Record what was withdrawn, and why.** A superseded model that leaves no trace gets
  re-derived by the next person, who has the same reasons for it that you did.
- **The masthead follows the Open section.** Cards outstanding means the page is not ✅, whatever
  it said an hour ago.

**A workspace-level page spans repos, and a seat's page never does.** That is the one difference
between them, and it is one column:

| The page argues | Where it lives | The `How` tables |
| --- | --- | --- |
| one node's design | that node's `docs/artifacts/approaches/` | Piece · Lands as · How you would know · State |
| a change across repos | the open workstream in `.spndevex/` | the same, **plus a `Scope` column** |

**Scope names a node, not a repository.** A row reading `spn-platform-ts` has picked a building
and left the reader looking for a door — that repo holds many apps and packages, each with its own
seats. Write the path.

**That column is the split plan.** You do not write a separate one: filter by scope, and each
repo's rows are what that repo's documents must say. Splitting becomes division rather than
rewriting, which is the whole point of the column.

**Sorted highest scope first, the table is also the order you write in.** The foundation before
the repo, the repo before the seat — and all of it before the code. Approval opens the documents
pass, never the code pass.

Two gates read that column, and `refs/cross-repo.md` states them in full. The **documents-first**
gate warns when you write an approach page into a repo's pocket while an open workstream still
has rows that have not landed. The **close** gate refuses a move into `workstreams/closed/`
while any row is one nobody decided. Moving `backlog/` to `open/` is not a close, so no gate
fires on it. `landed`, `carried` and `deferred` all pass, because the check is *accounted for*
and never *finished*.

#### `How` names what re-aligns

`How` tracks code by habit: what gets built, and what keeps it true. That is half an answer, and the document half is the one you forget. So `How` carries a second table.

| The table | Answers | One row is |
| --- | --- | --- |
| **What is built** | how the thing is produced, and how it stays true | a piece, where it lands, how you would know it works, and its state |
| **What re-aligns** | which documents this reasoning obliges | a document, what re-aligns inside it, who owns it, and its state |

The owner column names what changes each document — the book, the repo that builds it, the plugins, the workspace. A document with no owner is a row nobody picks up.

**A contradicted artifact is a row that says so, never an edit.** Where your reasoning collides with a page arguing the old shape, the row reads *a register row names which side is wrong*. The page stays the correct record of what it argued then.

**An empty `What re-aligns` table means one of two things.** Either the design obliges no document, which is rare and worth saying out loud. Or you stopped early, which is the ordinary case.

**Source of truth:** the book's artifacts standard, `05-artifacts.md` — *`How` has two halves*. This digests it and adds no rule of its own.

### Writing into a doc set

Planning lands as rows and terms in the owning node's seats, so **resolve the node before writing any of them** — `refs/doc-sets.md` carries the procedure. In one line: the declared **kind** fixes the **consumer**, and the consumer fixes the **actor voice**, the **area grouping**, and the **proof tier**. Guessing the actor is the one defect editing cannot repair, because it puts the row on the wrong node.

### Draw the shape in What and How

Where a section's subject **is** a shape — a boundary, a nesting set, a pipeline, a lifecycle, a set of arrangements — draw it; `What` and `How` are where those subjects live. Skip it where the subject is a judgment rather than a structure. Three rules. First, **draw the argument, not the chapter**: the owning chapter's diagrams are reference, and yours makes a claim visible. A restatement is a diagram that could be copied unchanged. Second, **inline SVG using the page's own color variables**, so it works in light and dark and the page still travels as one file. Third, **never draw what does not exist** — every box is something the book names, because a shape invented to balance a picture becomes a claim the reader believes.

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

Color carries role, not decoration — neutral `--card`/`--rule` · emphasis `--accent-soft`/`--accent` · derived or async `--ok-soft`/`--ok` · terminal `--gap-soft`/`--gap` · inactive `fill:none` + dashed `--rule`. **One emphasis per diagram**: if everything is highlighted, the highlight teaches nothing.

**A flow runs one way** — pick left-to-right or top-to-bottom and hold it for the whole diagram, so the reader never works out which way time moves. Left-to-right for pipelines with short stages; top-to-bottom for layers, where each row is a stratum. Only a **flowchart** may branch (a decision fanning into cases, or parallel arrangements side by side), and its branches still leave and rejoin along the one axis. Arrows pointing three directions describe a system nobody has finished thinking about.

### Every open item is decidable in one read

An open item exists to be **decided**, so it is written for the person deciding — not as narrative
they must extract a question from.

**The card grammar is owned by `refs/decision-cards.md`. Read it there and do not learn it from
here.** That file carries the four parts and their order, the `Q<n>` numbering, what makes an
option a real option, and how a sheet closes. This skill adds nothing to it. A rule stated in two
places drifts: a summary here once omitted the number, and a session then concluded there was no
numbering rule.

Two things are this skill's own, because they are about where a card sits rather than how it reads:

- **A card belongs in `Open`, and `Open` is what blocks.** The document is not settled while it
  holds one. The status chip reads 🚧 until the section is empty.
- **The same grammar governs how pending work is reported at any time** — a status summary, a chat
  reply, an answer to *"what's left?"* A list of pending items with no options is work handed back
  rather than a decision offered.


### Open blocks; Deferred does not

The distinction is what lets a design finish. **A question is `Open` while answering it could still change the shape.** Once the answer is understood and the choice is simply *not yet*, the item moves to `Deferred` and stops holding the document up. By then the cost is known and the design does not depend on it.

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

**The document closes with a footer naming its sources** — the chapters and register rows it reasons over — **and the iteration contract**. A future session can then reopen and continue it: new questions land as Open cards, resolutions fold in, the status chip follows the shape.

**The document is the only artifact the design produces.** Not a summary alongside it, not a second copy in another format, not a companion note. Those drift, and a reader who finds the stale one has no way to tell. When a rule needs to be *applied* rather than understood, its enforceable form belongs where the work happens: a skill or a reference file the agent already loads. The approach document explains why that rule exists; it never becomes a second place to look it up.

## Lenses

Wear `refs/lenses/architect.md` and `refs/lenses/product.md` while drafting — decomposition and data model from one, consumer outcomes and vocabulary from the other. **Before any 🔮 row lands in the owning docs**, convene the `spn-panel` subagent once per lens with `architect`, `lead`, `product`, `trust`, and `qa` over the draft. Fold findings in, then land the rows.

**Wearing a lens is not reviewing through it.** The context that drafted a design always agrees with it. So `architect` is convened over the result, not only worn while writing it. A design is reviewed by a reader that did not write it, and that reader is the one who can still block. `architect` blocks on a new mechanism reachable from more than one module. The block clears when a decision entry names what it was weighed against.

## Report

The design, in this order: **the altitude, the highest document and the lowest shared package**. Then the classification, what already covers part of it, the behaviors, and the contract sketch. Then what changes per layer, the failure cases, and anything that needs a decision recorded. The first three are paths, and a report that omits them hands back an unclassified design. Close with what you are **unsure** about — an unstated assumption is the thing that gets discovered after the code is written.

Then hand to the stack's scaffolding skill, which supplies the commands.
