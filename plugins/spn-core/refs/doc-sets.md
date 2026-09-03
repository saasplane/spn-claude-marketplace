# Doc sets — the shape every node carries

**Source of truth:** the corpus standard (`03-capabilities/05-docs/`), with the concept's Node Docs section (`CONCEPT.md`, at the repository root) as the standing one-page view. Read this file as a digest of those rules, adding none of its own. **The book governs**; the concept holds the last agreed idea and is updated on request, so where the three disagree the standard wins and this file is regenerated.

**Every node carries the same shape at every kind** — four seats and two pockets. Only the capabilities seat has a file set that varies, and it varies because it is *derived* rather than chosen.

## Every surface, one map

Documentation is not one place. Resolve which surface a change belongs to **before writing a word** — the commonest documentation defect is correct content on the wrong surface, and editing cannot repair it.

| Surface | Sits at | Says | Written by | Moves when |
| --- | --- | --- | --- | --- |
| `CONCEPT.md` | **repository root**, beside `sprepo.json` | what the repo **is** — boundary, domains, surfaces, refusals | `ideate`, one agreed block at a time | the shape moves |
| `README.md` | repository root | how to get in — identity, children map, doc map | scaffold, then by hand | the children change |
| `README.md` | **node** root — package, app, module | this node in a paragraph, and where its docs are | scaffold, then by hand | the node's identity moves |
| `docs/README.md` | node doc tree | the **node doc** — children with statuses, the doc map | generated map, hand-written identity | the file set changes |
| seat face | `01-purpose` · `02-behaviors` · `03-capabilities` · `04-guides` | the fixed answer, distilled, plus the map below it | `FRAME`, then `develop` | the answer moves |
| area file | beneath a seat, flat and named for the group it governs | the depth the face distils | `plan` lands rows, `develop` proves them | rows land or change |
| child node | beneath a seat, answering a narrower question | its own README and seats | scaffold | a node is added |
| `registers/` | pocket, **governing nodes only** | the node's own rules and decision log | on a decision | a rule is decided |
| `artifacts/` | pocket, **authoring nodes only** | what the node authors — a moment captured | on request, never on initiative | someone asks |
| **intent comment** | every contract method and exported component | why this exists, in one line, harvested into the symbol index | `develop` (decision RD.APPS.006) | the symbol's intent moves |

**Three rules resolve almost every case.**

- **Altitude decides, not topic.** The same subject is legitimately stated at several altitudes — a concept states the module's boundary, a seat face states what it does, an area file states how. Repeating one altitude at another is the defect; carrying a subject up and down the altitudes is the design.
- **A repo has one concept; a node has none.** However many packages a repo grows, ideating one of them lands as sections of the repo's concept. A `CONCEPT.md` beside a package manifest is always wrong.
- **Structure is fixed, depth is earned.** Seats exist from day one and a seat holding only its face is the compact state. Everything below a seat — a second file, a folder, a child node — exists only when there is content a reader would otherwise wade past.

## Before the shape — `CONCEPT.md`

**A concept belongs to a repo root, never to a node** (decision RD.DOCS.012) — nodes carry `README.md` alone. The repo's `CONCEPT.md` sits at the repository root and states what the repo *is* — its boundary, the sections its shape calls for, the shape drawn, and the open questions.

- **A root marker, not a corpus document.** No metadata block, no tag line — found by its fixed name, walked by no validator.
- **It links only to the repo's `artifacts/` and to external sources — nothing else.** A concept sits above what realizes it, so it never links to a seat, a chapter, or a `README`. Cite a decision by id, never by link.
- **Sections carry status inline** — `DRAFT` · `AGREED` · `REALIZED`. **`FRAME` reads only `AGREED` sections**, which is the gate that stops undecided scope reaching the seats.
- It is produced by the **`ideate` skill** and never deleted once realized: the concept stays the standing one-page view, and the seats hold the depth. Ideating a node lands as sections of its repo's concept, never as a file at the node.
- **Scaffolding a node never creates a concept.** Ask whether the repo's concept needs a section or an edited boundary when a package, app or module is added — never offer the node a concept of its own. This is the most likely wrong turn on a growing repo, because the node feels like the thing being decided.

## The shape

```text
<node>/docs/
├── README.md              the node doc — what this is, its children, the doc map
├── 01-purpose/            WHY — why it exists
├── 02-behaviors/          WHAT, as usecase — what its consumer can do
├── 03-capabilities/       WHAT, as blueprint — what it carries
├── 04-guides/             HOW — how to use what was realized
├── registers/             POCKET — the node's own rules and decisions
└── artifacts/             POCKET — what the node authors
```

- **Seats are numbered** because they are read in order; **pockets are never numbered** because they are consulted.
- **Open every folder with `README.md`** — never `INDEX.md`. A seat's README is its **face**: the complete distilled answer plus the map of what sits below it, never a bare table of contents.
- **A seat holding nothing but its face is the compact state, not a defect.**
- **Pockets are earned**: `registers/` on governing nodes only, `artifacts/` only where the node authors something.

## A seat is never absent

Where a node has nothing of its own to say in a seat, the face **states what the seat would hold**. It also **cites the node that owns the answer**. And that face is *generated*, because a citation is derivable (decision RD.DOCS.017).

| Kind | Seat | Cites |
| --- | --- | --- |
| `CLIENT_API` | `02-behaviors` · `03-capabilities` | the service that generates it |
| an app-owned module | `04-guides` | the host app that composes it |
| any kind | `04-guides` | install, mount and configure, read off the manifest and scripts |

A missing seat and an empty seat read identically from outside. Making the seat present and the answer a citation turns absence into a statement with an owner.

## The capabilities seat is derived

**One document per published source group** (decision RD.DOCS.015). What a node publishes is what its kind decides:

| Kind | Its capability documents |
| --- | --- |
| `FOUNDATION` (repo root) | its own structure, by subject — **authored, the only one that is** |
| `APPS` (repo root) | `apps` · `packages` · `tasks` · `tests` — only those it has |
| `TOOLCHAIN` | one per published configuration group |
| `SUPPORT_UNIVERSAL` · `SUPPORT_SERVER` | one per published group |
| `SUPPORT_WEB` | one per published group, with `ui` expanded |
| `MODULE_SERVER` · `MODULE_WEB` · `APP_UTILITY` | `contract` · `app` · `entry` |
| `APP_SERVER` · `APP_WEB` | `composition` |
| `CLIENT_API` | none — a generated surface, documented by its service |

- **Named for the group it governs**, path joined by `-`, flat inside the seat, never numbered. That name is the same key the symbol index carries, so a symbol resolves to the document that explains it.
- **Depth is earned by size and named by the code**: `app.md` becomes `app-services.md` only when it outgrows a section *and* `app/services/` exists. A document never splits by class, entity or feature.
- **Excluded by construction**: a private segment (anything under a `_`-prefixed path), a generated folder, build output, and `migrations/`. A migration's useful content is seeding and ordering, which is vocabulary and belongs to the data model (decision RD.DOCS.018).
- **The face and `data-model.md` are always present**, at every kind, including where the rule produces no capability documents at all.

Which makes the seat checkable in both directions:

| Defect | What it means |
| --- | --- |
| a published group with no document | the surface is undocumented |
| a document naming no group | it describes something that no longer exists |
| a document for a private or generated folder | the interior leaked into the published surface |
| a split with no matching subfolder | depth was invented rather than earned |

## What each seat holds

| Seat | Holds | Reads as |
| --- | --- | --- |
| `README.md` | identity and orientation | what this node is, and the map of what sits under it |
| `01-purpose` | why the node exists | explains and persuades. Carries **no rules** — normative language here is a defect |
| `02-behaviors` | what its consumer can do | stories: a persona reaching an outcome, in the consumer's own words. `personas.md` where the node has more than one; `01-<area>.md` for depth |
| `03-capabilities` | what it carries | engineering content in the one voice (RD.DOCS.043), and **normative wherever a consumer can violate the statement** — the sequence, the guard, the reason a rule exists (RD.DOCS.034; see the altitude note below) |
| `04-guides` | how to use it | task-shaped — install, mount, configure, run. The face **is** the getting-started, for a reader with no checkout |
| `registers/` | the node's own rules and decisions | lookup material, consulted rather than read start to end |
| `artifacts/` | `schema.sql`, reports, approach documents | authored source of truth. Nested folders allowed here and nowhere else; sub-folders carry no README |

**A code-mirror capability page is the spec its code realizes** (decision RD.DOCS.034). The per-group page mirrors one published source group — `cache.md`, `contract.md`, `app.md`, `entry.md`, `ui-*.md` and siblings. It **binds two parties**. The implementation is bound by what a `Guarantee` row states, and the consumer by what `Placement` and `Does not do` state. **Both directions are normative.** The test, one statement at a time: **does it bind someone — the implementation or the consumer?** If yes it takes `MUST`/`MUST NOT`/`MAY`; if it binds nobody it is commentary — advice, rationale, a trade-off note — and stays prose. **A capability page is normatively dense by design**, and the seam table's sections are the spec's shape, unchanged.

**The spec treatment reaches those pages only.** A repo root's `03-capabilities` is a **map** of what the repository contains — *where does what live*, not *what must this code do*. So is a node's `03-capabilities/README.md` face, which routes, and so is `data-model.md`, which is a dictionary. The seat's job differs by what the node publishes: source groups yield specs, indexes and orientation yield maps. **Seat tables are in scope for modality; record tables are not** — dictionaries, behavior-row tables, data models, registries and proof-gap tables keep their form. Modality comes from the page, never from a sweeper.

**`group` is the source axis; `area` is the story axis** (decision RD.DOCS.016). A group is a published top-level source folder — shared vocabulary between the symbol index and the capabilities seat. An area divides the behaviors seat and names an outcome, never a folder.

## The artifacts pocket — concept, overview, approach

The pocket holds what the node **authors** rather than derives, and its three authored kinds sit at three altitudes of one progression (decision RD.DOCS.039). **Each is earned separately, and none generates the next.**

| Kind | Path | Holds | Earned when |
| --- | --- | --- | --- |
| **Concept** | `CONCEPT.md`, the repository root | the whole model, once — shape, never depth | the repo exists |
| **Overview** | `artifacts/overviews/<section>-overview.html` | one concept section at reading depth | the section is too big to review where it stands |
| **Approach** | `artifacts/approaches/<topic>-approach.html` | one argument — options weighed, one chosen | a design was actually argued |

**The outline is fixed for an argument and borrowed for an explanation.**

| | Outline | Carries `Open` / `Deferred`? |
| --- | --- | --- |
| **Approach** | **fixed** — `Terms?` → `Why` → `What` → `How` → `Open` → `Deferred` | yes — they are the argument's organs |
| **Overview** | **borrowed** — the headings of what it expands, in that thing's order | **no** — a question found while writing one is an approach waiting to be offered, or a register row |

**An overview never invents a heading its source does not have.** Lining the two outlines up is what proves it expanded rather than restated. **A settled approach legitimately lacks `Open`** — the design closed — so a missing `Open` is not a routing signal. The skeleton is: **`Why` + `What` + `How` present means it argues.**

**Depth is decided by where else the detail lives** — the kinds are not *more* and *less* detailed, they are detailed in different places.

| | Compresses | Expands |
| --- | --- | --- |
| **Overview** | everything — the source carries the depth | nothing; reaching the source's depth makes it the second copy the pocket forbids |
| **Approach** | the **mechanics** — concepts and boundaries, never an inventory of rules the chapters own | the **reasoning** — options weighed, costs accepted, the preview that made a choice judgeable |

A register row records *what* was decided, never the options that lost or what they would have cost. That is why an approach carries its reasoning in full, and why `Open` cards run deeper than the body around them.

**The suffix names the kind, and the set is closed** (decision RD.DOCS.040). The routing test is one question: *were options weighed and one chosen?* Yes → `-approach`. No → `-overview`. A document with no options, no recommendation and no accepted cost is an overview whichever folder holds it.

- **An overview comes at two sizes.** `concept-overview.html` is the concept's readable HTML face — the whole model, less depth, with the diagrams the root marker cannot carry; a repo has at most one. A `<section>-overview.html` expands **one** section that is too big to review where it stands, and the section names it back. Forbidden is the third copy: an overview restating another overview, or a section expanded twice under two names.
- **Keep reports under their own name** in `reports/`; `resources/` holds what a seat cites — `schema.sql` among them.
- **Nothing here is validated against current state.** An artifact records a moment, so a checker that flags one for disagreeing with today's tree has misread what it is looking at.

**An approach document is never kept in step with code.** It argues at a moment, so three relations are all legitimate: **ahead**, **level**, and **behind**. **Ahead** is arguing something not built yet — early iteration, leading the code as a concept does. **Behind** is a correct record of what was argued then. A design can reach an empty `Open` long before a line exists, and is complete at that point. **The defect is a silent rewrite** — editing one to read as though it always argued the current shape destroys the only record of what was weighed and rejected. Flag the contradiction; leave the artifact as the moment it was.

### Steward, never manufacture

**Coverage never forces an artifact into existence** (decision RD.DOCS.041). A concept section with no overview and no approach document has not needed one yet — a fact worth reading, not a gap worth filling. Four obligations, none of which generate content:

| Obligation | Fires when | Do |
| --- | --- | --- |
| **Offer** | options were weighed and one chosen — in conversation or in a commit | name the reasoning and offer to record it; never write one unasked |
| **Suggest** | overviews and approaches begin citing each other | offer the concept a section-by-section expansion |
| **Steward** | any artifact lands or moves | the index row, the status chip, the home link, the pointer up from the owning node |
| **Flag** | `CONCEPT.md` moves under a document that argued the old shape | report the contradiction, and stop |

**A contradiction is a decision entry naming which one is wrong, never a silent edit in either direction.** The offer trigger stays tight on purpose: *a design was discussed* is too loose and rebuilds slot-filling in a softer form. **Options weighed, one chosen** is the bar.

## Metadata

Every document opens with an invisible block holding **strict JSON**, marked `spn:doc`, followed by the title and a tag line rendered from it (decision RD.DOCS.014).

```markdown
<!-- spn:doc
{
  "id": "kebab-case-unique-id",
  "title": "Human Title",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "IMPLEMENTED",
  "summary": "One sentence — used by agents to select this doc, and by indexes.",
  "keywords": ["five", "to", "ten", "selection", "terms"]
}
-->

# Human Title

`Lenses: Architect · Backend developer` · `Status: ✅ Implemented`
```

- `stages` is the one optional field — only where a document belongs to one DevEx stage, such as a guide.
- **There is no `part` and no `altitude`.** Everything else is derived: the **seat** from the path and the **kind** from the node's manifest. The voice is one (RD.DOCS.031). The seat decides what a document carries, never its temperature.
- **`lenses` are derived from the kind, not authored per page** (decision RD.DOCS.037) — one derivation, two clauses, because runtime says *where code runs* and `lenses` says *who reads it*. A kind you **build on** (support, module, app, client) derives from its declared runtime: `SERVER` → `SERVER_DEV`, `WEB` → `WEB_DEV`, `UNIVERSAL` → both. A kind that **serves building** — `TOOLCHAIN` and `APP_UTILITY`, and only those two — carries both whatever its runtime, because every builder uses it. Read the declared runtime, never parse the name. `ARCHITECT` is added by **seat**, never by kind. A node's doc face (`docs/README.md`) is the orientation page and carries it for every kind, leaf nodes included. The seat faces beneath it (purpose, behaviors, capabilities, guides, artifacts) carry the derived developer lenses alone. `ARCHITECT` there is authorship a scaffold never emits. The other six lenses are authored, never derived. A page MAY narrow the derived set where its subject genuinely serves one runtime, and MUST NOT widen it. **A scaffold template emits the derived set**, which is what makes generated pages compliant by construction.
- `id` is identity and **never changes**, however the path does. The path is only its current address.
- **Status is the state of what the document governs, never of the prose**: `IMPLEMENTED` ✅ · `IN_PROGRESS` 🚧 · `PLANNED` 🔮.

## One voice — the warm learning register

The corpus speaks one voice (decision RD.DOCS.031, sharpened by RD.DOCS.043 and RD.DOCS.044): **every document is written for someone learning, while law keeps its force in every rule.** Writing or reviewing any doc, apply:

1. **Teach in build-up order** — show the thing, name it, then state its rule; the rule lands as the conclusion of something your reader now understands.
2. **Talk to your reader** — second person, present tense, active voice; momentum over ceremony. Three moves get you there, and the sentence decides which one fits (below).
3. **Every rule keeps its teeth** — exact terms, exact constraints, MUST-grammar wherever a statement is normative. Precision is part of the kindness. Force lives in the exact term and the MUST, never in a dense sentence: splitting a normative sentence changes neither (RD.DOCS.043).
4. **The plain substrate** — one idea per sentence, and the rule stated literally before any story. No load-bearing metaphors, parables, aphorism-led paragraphs, or personification. Bold marks rules and terms, never emphasis; house terms glossed on first use per chapter.
5. **The warmth budget** — at most one light aside per section, never inside a rule's own sentence; *conversational and friendly without being frivolous*.
6. **Personas choose content, never temperature** — capabilities speak to engineers, behaviors to product personas; the lens picks the examples.
7. **The register governs prose, never records** — behavior rows, decision/glossary rows, every table and diagram, contract blocks, and code samples keep their form untouched. A warmed record is a defect.
8. **The depth guarantee** — a rewrite changes how sentences are written, never what the corpus contains. Every fact, constraint, edge case, table, and diagram survives; rewrites may add examples, never remove substance.
9. **Artifacts take the voice** (decision RD.DOCS.043) — an approach, an overview and a report take the voice exactly as a seat does. The audience decides the examples and the depth, never the temperature. An HTML page is no exemption.
10. **Register rows take the plain substrate** (decision RD.DOCS.043) — the bold headline first, then one clause a sentence, none past twenty-five words. A decision or glossary row keeps its exact terms and its MUST. No *you* and no aside: a row is still a record.

### Reaching your reader — three moves

**RD.DOCS.031 asked you to talk to your reader and named no mechanism, so RD.DOCS.044 names three.** Third person is not the fault. A third-person sentence carrying nothing for you is.

| Move | Where it belongs | Reads like |
| --- | --- | --- |
| **The beneficiary clause** | the default, and it works in every seat | *A module MUST NOT read `process.env`. That way your config stays in one owning layer.* |
| **The imperative** | guides and procedures, where you are the one acting | *Run the plan before you approve it.* |
| **Second person as the subject** | where the actor really is you | *You never hand-run an apply against the estate.* |

- **Keep the system as the subject, then add the clause.** Say what the fact buys you, in the sentence beside it. The subject never moves, so a rule keeps the party it binds.
- **Never write an imperative on a sentence that names a bound party.** An imperative rebinds the rule from that party to you, which is a different rule. Most of the capabilities seat names a bound party, which is why the clause is the default.
- **A rule is taught, not only stated.** Beside the rule, give the why — or the symptom that shows the rule was broken. A rule with neither is a line you memorize.

**The bar is a share, and your seat sets it** (decision RD.DOCS.044). Count the prose sentences landing on you by any of the three moves, then divide by the sentences counted.

| Seat | Sentences that reach you |
| --- | --- |
| overview · approach · report | 30 in a hundred |
| README face | 25 in a hundred |
| chapter · concept | 15 in a hundred, with normative sentences outside the count |
| register row | none — a record is never warmed |

**Watch a share, never a count of occurrences.** Splitting a long sentence is what this standard asks of you, and splitting dilutes a count. So the number to compare before and after is the share.

**Your own instruction surface is in scope** (decision RD.DOCS.031 · RD.DOCS.043 · RD.DOCS.044, stated
at depth in the book's `05-docs/01-corpus.md` § What the pattern binds). The voice reaches this book,
the foundation's provider set, and these plugins — your skills, lenses, agent briefs and reference
digests. Layout is what those trees are free of, never how they read. The bars are identical
everywhere; only the move differs. Say *you* on a page someone reads to learn. Use the **imperative**
on a page you act from, because a passive instruction leaves you working out who acts. And where a
warmer sentence would be less exact about what you must do, keep the sentence and let the page sit
under its share. A repo that merely consumes SaaS Plane keeps its own `providers/` folder out of
scope.

**On that surface, reach is the whole measure** (decision RD.DOCS.048). Two checks count only the
typed word — one fires when a page never says *you*, the other when it says it fewer than once in
twelve sentences. Neither can see an imperative, which is this surface's own move, so both read your
instruction file as silent when it is anything but. On a provider chapter or a plugin instruction
file, neither applies. Your reach share is what the checker measures, and it still binds — a page
that truly reaches nobody is still caught.

**A check reads how a phrase is used, never that it appeared** (decision RD.DOCS.049). You have to
quote the mistake a rule bans, and a domain term is sometimes spelled like an everyday word — *the
reader tier* is a read facade, not your reader. Neither is a breach. Mark a counter-example as one,
in italics or backticks, and the checker reads it as quotation. That is the same courtesy a register
row already gets when it names *you* as a term.

**The share is met honestly or not at all** (decision RD.DOCS.046). Appending a bare `for you` · `to you` · `on you` to a sentence you have otherwise left alone games the counter — it does not meet the share. The check strips the trailing phrase and asks whether what remains still reaches. If it does not, that phrase was carrying the sentence's whole claim on your reader, and it is a finding. It is graded RULE rather than BLOCK. A sentence like `stands them up for you` is real writing that ends the same way. Only you can tell the two apart. **Where a sentence cannot address your reader honestly, leave it as written and let the page sit under its share.** A page at its bar in mechanical prose is worse than one under it in good prose (decision RD.DEVEX.032).

**No external style guide becomes a rule** (decision RD.DOCS.044). The construct is the corpus's own. Keep the reference measurements in the workspace as evidence, and never cite one as authority.

**The measure** (decisions RD.DOCS.043 · RD.DOCS.044). The check reads the rule's numbers, never the corpus's own average. Over prose only: around fifteen words a sentence, few past twenty-five, none past thirty, *you* present, and your seat's share of reach. A sentence past thirty words is a finding. Prose that never says *you* is a finding, and that clause is the floor against silence — the share above is what you aim at. The fix is one of four moves — **split it · say *you* · define the term · land it on your reader** — never a shorter sentence. The `spn-core` doc-check hook measures every watched document, and its sweep prints the rates a tranche moves. Reach is reported SOFT for now: the corpus is swept for length, not yet for reach.

**No document is exempt by age** (decision RD.DOCS.043). The corpus is swept in the row's order: pilot first, then the argued pages, the book, the stack docs, the register rows. Every diff is reviewed and nothing is removed. The labeled on-ramp form (`**What this is about:**` blocks) is retired; its content folds into a natural opening paragraph.

## Documents lead code

Work runs `FRAME` → `DESIGN` → `BUILD` → `PROVE`, and each pass is the next one's contract (decision RD.DOCS.013).

| Pass | Convened | Produces | Leaves |
| --- | --- | --- | --- |
| **Frame** | `PRODUCT` · `BUSINESS` · `ARCHITECT` · devs · `QA` | purpose, behavior rows and stories, personas, the consumer half of the data model | rows at 🔮 |
| **Design** | `ARCHITECT` · devs · `QA` — product steps out | the capability documents, `schema.sql`, the capability half of the data model | documents at 🔮/🚧 |
| **Build** | devs | the code those documents describe, and the guides face once it runs | rows at 🚧 |
| **Prove** | `QA` | tests whose titles carry the behavior ids | rows flip to ✅ |

So a document routinely exists **before** the thing it describes, carrying 🔮 and reading as a design note rather than a fact. Iteration re-enters at **Frame** and reads the existing documents and code back, so a revision revises rather than re-derives.

**Drift runs both ways.** Read the implementation where it exists and validate against it — but do not assume it wins. A conflict between a document and running code is a **decision entry naming which one is wrong**, never a silent edit in either direction.

## The decision register

A **governing node** carries `registers/` and keeps its decisions there. One row per decision, and the register **self-shrinks** — an open item is a card with a recommendation, and the moment it is decided the card compresses to a row.

**Every row carries `RD.<AREA>.<NNN>`** — *register decision*, the capability domain it governs, and a zero-padded sequence within it:

```text
RD.GOV     the node's own shape — principals, outline, standards placement, the register
RD.SAAS    the platform model — tenancy, access, surfaces, service domains, trust
RD.APPS    kinds, structure, layers, the generated surface, proof, delivery
RD.INFRA   the estate, and the stage chain it serves
RD.DEVEX   stages, instruments, the Agent, the plugins
RD.DOCS    the corpus standard — seats, metadata, derivation, artifacts
```

- **The sequence is per area**, so areas grow without colliding. **Ids are never reused and never renumbered** — an id is identity; the section is only its address.
- **Supersession is always written.** Because the number carries no chronology across areas, a superseding row names what it supersedes, by id, in the decision column.
- **Rewrite what you supersede, in place.** A superseded row is not annotated or struck through — it is replaced so it states present truth, and the old wording lives in git history. A standing row that says something no longer true is worse than no row.

**Writing one:**

1. **The decision is a bold sentence, first** — what is now true, never what was considered. A lead that needs the Why column to make sense is not written yet.
2. **The Why column carries the reason it was needed** — the failure the old position caused, or the cost it imposed. Not a restatement of the choice.
3. **Never write a tally.** *Closed at nineteen* is a count that rots; name a set by its rule.

**What lands here:** a document conflicting with running code; a recorded deviation from a paved path; a proposed new chapter, because the outline is frozen. On the first, **drift runs both ways**, so the entry names which side is wrong before either is touched. **Never a silent edit in either direction.**

**You draft a row; a person decides it.** The Agent never resolves a decision on its own initiative.

## What you never do

- **Never invent structure the grammar does not grant.** A new chapter, part, or domain is a decision recorded in a register (see above); anything smaller becomes a section in a document that already exists. Seats and pockets are not chapters — they appear whenever the grammar calls for them.
- **Never restate another document's rule.** Introduce it in a sentence and link. A copy is the thing that will still say the old rule a year from now.
- **Never write a changelog.** Documents state present truth — no *previously*, no *we used to*. Git history is the history.
- **Never write a live count.** A document states a status, never a tally; a number in prose is correct until the next addition and then silently wrong.
- **Never hand-write a generated face**, or edit inside a generated region. The source plus a regeneration is the only edit path.
