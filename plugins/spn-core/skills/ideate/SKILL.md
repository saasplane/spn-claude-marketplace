---
name: ideate
description: Decide what a node IS before anything is planned - its boundary, its domains, its surfaces, its architecture - and capture it in the repo's CONCEPT.md at the repository root (a concept belongs to a repo root, never to a node). Use when starting a platform, repo, module, app or package; when someone wants to conceptualize or think something through before building; or when a requirement turns out to need a new domain, a moved boundary, or a split module; or when a node's docs have moved ahead of its concept and someone asks for the concept to be brought up to date. Interactive by design - it works one agreed block at a time and never drafts a whole concept in one pass. Stack-agnostic.
---

# ideate — decide the shape, one agreed section at a time

**Every project that goes wrong slowly went wrong here** — in the twenty minutes nobody spent deciding what the thing is and, harder, what it deliberately is not. The boundary then gets drawn implicitly by the first three features, and moving it later means moving everything built inside it.

Your output is exactly one file: **`CONCEPT.md` at the repository root**, beside `sprepo.json` (decision RD.DOCS.012 — a concept belongs to a repo root, never to a node; nodes carry `README.md` alone, so ideating a node lands as sections of its repo's concept). Never `docs/`. Never code.

## Ideate decides the shape; plan works inside it

| | Decides | Changes |
| --- | --- | --- |
| **ideate** | what this node **is** — boundary, domains, surfaces, architecture | the **shape** |
| **plan** | how a requirement becomes a design the docs carry | the **content** inside that shape |

**The test:** a requirement fits an existing domain → that is `plan`. It needs a new domain, a moved boundary, or a split module → it is **this** skill, and the concept changes before anything is planned.

## Two directions, and the source decides which

| The node has | You are | Where the words come from |
| --- | --- | --- |
| nothing yet | **ideating** — the four gates below | the person, one block at a time |
| seats that already answer it | **harvesting** — summarizing up | the seats, cited |

**Harvesting is not a shortcut past the gates. It is the same loop with a different source.** You read the seats, write the block at concept altitude, and show it before landing it — never a whole section, never several at once.

- **Filling is correct here; inventing still is not.** A harvested block says nothing the seats do not, and it names the chapters it was read from. Where the seats are silent, that part stays `DRAFT` and re-enters the ideating path. Do not close the gap with something plausible because the rest of the block reads complete.
- **Summarize up, do not copy across.** A chapter states depth; a concept states shape. A harvested block carrying a field list, a folder table or a signature has been copied rather than summarized, and is wrong at this altitude.
- **The person still sets the status.** A harvested block is `DRAFT` until they read it. That the seats already say it is not agreement that the concept should.
- **Where sources disagree, stop and say so.** Two seats contradicting each other, or a seat contradicting a standing decision, is a register row — never something you resolve quietly while summarizing. Harvesting is when contradictions surface, because it is the only time anyone reads a whole domain at once.

## The loop — four gates, in order

**You do not draft the whole document and present it.** Each step is a gate: you produce one thing, the person reviews it, and only then do you move on. This is the entire mechanism — a concept produced in one pass is a concept nobody agreed to.

### 1 · Boundary

Shortest, and first. **What this node owns, and what it deliberately does not.** Ask both; write both.

- **The refusal must be as specific as the inclusion.** *"Not payments"* is a boundary; *"we'll keep it focused"* is not.
- Nothing else starts until this is agreed, because every later section inherits it.

### 2 · Outline

Propose the section list **for this kind** — and get the *set* agreed before writing any of it, so nobody writes a section that should not exist.

Every concept opens with what it is, who it serves, and what it will not do. The middle varies:

| Kind | Its middle sections |
| --- | --- |
| `FOUNDATION` (repo) | what it standardizes · what it refuses to standardize · the parts |
| `APPS` (repo) | the domains it will hold · the surfaces · why each project is separate |
| `SUPPORT_*` | the capability offered · the engines behind the seam |
| `MODULE_*` | the outcomes · the seams it may name · what it must not reach |
| `APP_*` | what a person can do with it · what it composes · its run shapes |
| `TOOLCHAIN` · `CLIENT_API` | **none** — neither has anything to ideate. Say so and stop |

### 3 · Section by section

One section: **preview it, wait, then write it.** Never two at once, never the whole thing.

- **Ask; do not fill** — when ideating. A section the person has not decided stays `DRAFT` with three lines. **Inventing plausible detail is the failure mode**, because it reads as agreement and gets built on. When *harvesting*, the seats are the source and filling from them is the job; what stays banned in both directions is writing a sentence no person and no seat has said.
- **Status is theirs to set.** `DRAFT` while being ideated · `AGREED` once reviewed and safe to build against · `REALIZED` once the seats and code carry it. Nothing becomes `AGREED` because it reads well.
- **Draw the shape where the section is a shape.** A repository's projects and their dependencies; a module's seams. Use the approach-document diagram grammar so a concept diagram and an approach diagram read as one system.
- **Stay at concept altitude.** A field list, a table schema, a method signature — all of these mean you have left ideation. Say so and stop.

### 4 · Open

Every unanswered question is a card with **real options and a recommendation**. A card with no options is a status update; a card with no recommendation makes the person do the analysis twice.

- **The stage ends when the questions are answered, not when they run out.**
- **An approach document is made on request, and there are two reasons to ask.** A question too large for an Open card needs somewhere to be argued. A section too big to review in place needs somewhere to be *read* — a concept states shape, so someone wanting the detail behind it is asking for the expansion, not for a longer concept. Either way it lands in the node's `artifacts/approaches/` and the section names it. **Offer; never start one unasked**, and never write one to make a concept look finished. A concept whose sections have none is the normal case, not an incomplete one.
- A question deliberately not answered is **deferred with a trigger** — what would bring it back.

## The lenses you convene

Ideation is where the wrong people in the room costs most: a boundary drawn without the business is renegotiated commercially later.

| Section | Convene |
| --- | --- |
| Boundary · Why | `BUSINESS` · `PRODUCT` · `LEAD` |
| Who · What they can do | `PRODUCT` |
| Domains · Surfaces · The shape | `ARCHITECT` |
| Open | whichever lens the question belongs to |

## The file itself

- **A root marker, not a corpus document.** No metadata block, no tag line — found by its fixed name, like `README.md`. No validator walks it.
- **It links only to the repo's `artifacts/` and to external sources — nothing else.** A concept sits above what realizes it, so it never links to a seat, a chapter, or a `README`. Cite a decision by id, never by link.
- **Sections carry status inline**, beside the heading.
- **It is never deleted once realized.** It stays as the standing one-page view; the seats hold the depth.

## What you hand over, and what you never do

`FRAME` reads **only `AGREED` sections** and writes the seats: `Why` → `01-purpose`, `Who` → `personas.md`, the outcomes → behaviour rows with ids. Those sections then flip to `REALIZED`.

- **Never write into `docs/`.** One file, at the repository root.
- **Never design.** Fields, tables, signatures are `plan` and later.
- **Never close your own questions.** You draft options and a recommendation; a person decides.
- **Never mark a section `AGREED` yourself**, and never proceed past a gate because the previous step looked finished.
