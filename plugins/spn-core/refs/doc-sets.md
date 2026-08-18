# Doc sets — the shape every node carries

**Source of truth:** the corpus standard (`03-capabilities/05-docs/`), with the concept's Node Docs section (`CONCEPT.md`, at the repository root) as the standing one-page view. This file digests those rules and adds none of its own. **The book governs**; the concept holds the last agreed idea and is updated on request, so where the three disagree the standard wins and this file is regenerated.

**Every node carries the same shape at every kind** — four seats and two pockets. Only the capabilities seat has a file set that varies, and it varies because it is *derived* rather than chosen.

## Before the shape — `CONCEPT.md`

**A concept belongs to a repo root, never to a node** (decision RD.DOCS.012) — nodes carry `README.md` alone. The repo's `CONCEPT.md` sits at the repository root and states what the repo *is* — its boundary, the sections its shape calls for, the shape drawn, and the open questions.

- **A root marker, not a corpus document.** No metadata block, no tag line — found by its fixed name, walked by no validator.
- **It links only to the repo's `artifacts/` and to external sources — nothing else.** A concept sits above what realizes it, so it never links to a seat, a chapter, or a `README`. Cite a decision by id, never by link.
- **Sections carry status inline** — `DRAFT` · `AGREED` · `REALIZED`. **`FRAME` reads only `AGREED` sections**, which is the gate that stops undecided scope reaching the seats.
- It is produced by the **`ideate` skill** and never deleted once realized: the concept stays the standing one-page view, and the seats hold the depth. Ideating a node lands as sections of its repo's concept, never as a file at the node.

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
- **Every folder opens with `README.md`** — never `INDEX.md`. A seat's README is its **face**: the complete distilled answer plus the map of what sits below it, never a bare table of contents.
- **A seat holding nothing but its face is the compact state, not a defect.**
- **Pockets are earned**: `registers/` on governing nodes only, `artifacts/` only where the node authors something.

## A seat is never absent

Where a node has nothing of its own to say in a seat, the face **states what the seat would hold and cites the node that owns the answer** — and that face is *generated*, because a citation is derivable (decision RD.DOCS.017).

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

- **Named for the group it governs**, path joined by `-`, flat inside the seat, never numbered — and it is the same key the symbol index carries, so a symbol resolves to the document that explains it.
- **Depth is earned by size and named by the code**: `app.md` becomes `app-services.md` only when it outgrows a section *and* `app/services/` exists. A document never splits by class, entity or feature.
- **Excluded by construction**: a private segment (anything under a `_`-prefixed path), a generated folder, build output, and `migrations/` — whose useful content is seeding and ordering, which is vocabulary and belongs to the data model (decision RD.DOCS.018).
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
| `03-capabilities` | what it carries | normative and engineering-voiced — the sequence, the guard, the reason a rule exists |
| `04-guides` | how to use it | task-shaped — install, mount, configure, run. The face **is** the getting-started, for a reader with no checkout |
| `registers/` | the node's own rules and decisions | lookup material, consulted rather than read start to end |
| `artifacts/` | `schema.sql`, reports, approach documents | authored source of truth. Nested folders allowed here and nowhere else; sub-folders carry no README |

**`group` is the source axis; `area` is the story axis** (decision RD.DOCS.016). A group is a published top-level source folder — shared vocabulary between the symbol index and the capabilities seat. An area divides the behaviours seat and names an outcome, never a folder.

## Metadata

Every document opens with an invisible block holding **strict JSON**, marked `spn:doc`, followed by the title and a tag line rendered from it (decision RD.DOCS.014).

```markdown
<!-- spn:doc
{
  "version": 1,
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
- **There is no `part` and no `altitude`.** Everything else is derived: the **seat** from the path and the **kind** from the node's manifest — the voice is one (RD.DOCS.031); the seat decides what a document carries, never its temperature.
- `id` is identity and **never changes**, however the path does. The path is only its current address.
- **Status is the state of what the document governs, never of the prose**: `IMPLEMENTED` ✅ · `IN_PROGRESS` 🚧 · `PLANNED` 🔮.

## One voice — the warm learning register

The corpus speaks one voice (decision RD.DOCS.031, superseding the two-voice split): **every document is written for someone learning, while law keeps its force in every rule.** Writing or reviewing any doc, apply:

1. **Teach in build-up order** — show the thing, name it, then state its rule; the rule lands as the conclusion of something the reader now understands.
2. **Talk to the reader** — second person, present tense, active voice; momentum over ceremony.
3. **Every rule keeps its teeth** — exact terms, exact constraints, MUST-grammar wherever a statement is normative. Precision is part of the kindness.
4. **The plain substrate** — one idea per sentence; the rule stated literally before any story; no load-bearing metaphors, parables, aphorism-led paragraphs, or personification; bold marks rules and terms, never emphasis; house terms glossed on first use per chapter.
5. **The warmth budget** — at most one light aside per section, never inside a rule's own sentence; *conversational and friendly without being frivolous*.
6. **Personas choose content, never temperature** — capabilities speak to engineers, behaviors to product personas; the lens picks the examples.
7. **The register governs prose, never records** — behavior rows, decision/glossary rows, every table and diagram, contract blocks, and code samples keep their form untouched. A warmed record is a defect.
8. **The depth guarantee** — a rewrite changes how sentences are written, never what the corpus contains: every fact, constraint, edge case, table, and diagram survives; rewrites may add examples, never remove substance.

The labeled on-ramp form (`**What this is about:**` blocks) is retired — its content folds into a natural opening paragraph. Rollout is progressive by tranches; existing prose is compliant until its tranche; new text complies from day one.

## Documents lead code

Work runs `FRAME` → `DESIGN` → `BUILD` → `PROVE`, and each pass is the next one's contract (decision RD.DOCS.013).

| Pass | Convened | Produces | Leaves |
| --- | --- | --- | --- |
| **Frame** | `PRODUCT` · `BUSINESS` · `ARCHITECT` · devs · `QA` | purpose, behaviour rows and stories, personas, the consumer half of the data model | rows at 🔮 |
| **Design** | `ARCHITECT` · devs · `QA` — product steps out | the capability documents, `schema.sql`, the capability half of the data model | documents at 🔮/🚧 |
| **Build** | devs | the code those documents describe, and the guides face once it runs | rows at 🚧 |
| **Prove** | `QA` | tests whose titles carry the behaviour ids | rows flip to ✅ |

So a document routinely exists **before** the thing it describes, carrying 🔮 and reading as a design note rather than a fact. Iteration re-enters at **Frame** and reads the existing documents and code back, so a revision revises rather than re-derives.

**Drift runs both ways.** Where implementation exists, read it and validate against it — but do not assume it wins. A conflict between a document and running code is a **decision entry naming which one is wrong**, never a silent edit in either direction.

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

**What lands here:** a document conflicting with running code — **drift runs both ways**, so the entry names which side is wrong before either is touched; a recorded deviation from a paved path; a proposed new chapter, because the outline is frozen. **Never a silent edit in either direction.**

**You draft a row; a person decides it.** The Agent never resolves a decision on its own initiative.

## What you never do

- **Never invent structure the grammar does not grant.** A new chapter, part, or domain is a decision recorded in a register (see above); anything smaller becomes a section in a document that already exists. Seats and pockets are not chapters — they appear whenever the grammar calls for them.
- **Never restate another document's rule.** Introduce it in a sentence and link. A copy is the thing that will still say the old rule a year from now.
- **Never write a changelog.** Documents state present truth — no *previously*, no *we used to*. Git history is the history.
- **Never write a live count.** A document states a status, never a tally; a number in prose is correct until the next addition and then silently wrong.
- **Never hand-write a generated face**, or edit inside a generated region. The source plus a regeneration is the only edit path.
