<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "efbbe76f"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/03-ideate.md",
      "seen": "9bcedab1"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The masthead, and the opening",
      "seen": "08c0d45d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The outline is fixed for an argument and borrowed for an explanation",
      "seen": "2c6b68b6"
    }
  ]
}
-->
---
name: ideate
description: Decide what a node IS, and design a requirement inside that shape - its boundary, its domains, its surfaces, its architecture, captured in the repo's CONCEPT.md at the repository root (a concept belongs to a repo root, never to a node). Use when starting a platform, repo, module, app or package; when someone wants to conceptualize or think something through before building; or when a requirement turns out to need a new domain, a moved boundary, or a split module; or when a node's docs have moved ahead of its concept and someone asks for the concept to be brought up to date. Interactive by design - it works one agreed block at a time and never drafts a whole concept in one pass. Stack-agnostic.
---

# ideate — decide the shape, one agreed section at a time

**Read [`refs/devex/workspace/workstream.md`](../../refs/devex/workspace/workstream.md) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

A boundary nobody decides still gets drawn: the first three features draw it, implicitly, and by the time anyone notices, moving it means moving everything built inside it. **That is how projects go wrong slowly** — in the twenty minutes nobody spent deciding what the thing is and, harder, what it deliberately is not.

Your output is exactly one file: **`CONCEPT.md` at the repository root**, beside `sprepo.json`. A concept belongs to a repo root, never to a node (decision RD.DEVEX.WORKSPACE.080). Nodes carry `README.md` alone, so ideating a node lands as sections of its repo's concept. Never `docs/`. Never code.

## One skill, three modes — and `plan` is not a fourth

**`PLAN` left the DevEx stages and folded in here** (`RD.DEVEX.FUNCTION.062`). It named an output as if it were a phase, which is why it never had a command surface of its own. **Planning is not a skill, and the absence is the design**: this skill covers both deciding what a node **is** and designing a requirement **inside** that shape.

Pick the mode from the argument — `shape` · `design` · `decision`. Where none was given, infer it from the request and say which you picked.

| Mode | When | What it changes |
| --- | --- | --- |
| **`shape`** | a requirement needs a new domain, a moved boundary, or a split module | `CONCEPT.md` — the boundary, the domains, the surfaces. **The rest of this file is this mode** |
| **`design`** | a requirement fits an existing domain | the owning docs, as `🔮 planned` rows |
| **`decision`** | a deviation from a golden path, a breaking change, or a doc-versus-code conflict | one register row |

### Mode: design — a requirement becomes rows in the docs that own it

**Spec-first, and no interim artifact** (`RD.DEVEX.FUNCTION.007`): the design is written **into the owning docs as `🔮 planned` rows** — never to a scratch file, never to a `tasks/` tree. Implementation later flips statuses instead of reconciling two documents.

1. **Restate the requirement** in one paragraph, in the asker's own words.
2. **Classify it**: new capability · additive change to an existing contract · **breaking** change · pure fix. **A breaking change stops here** — reroute through the versioning path and record it in `decision` mode. A breaking change never rides in as a plan row.
3. **Locate ownership** — which module owns the capability. Where none does, this is a scaffolding conversation first, and the ladder is *use → configure → generalize into the platform → build domain-specific*; descend only with a reason. Then propose **the construct the ask needs, and no more** (`RD.DEVEX.WORKSPACE.194`): its patterns, correct on their own. What it makes possible later is one line, *later, not now*, never a row or an option. Until an arc row owns the subject, put what you need decided as a suggestion in chat, `S<n>`, as a whole card: what, why, lettered options and the one you recommend (`RD.DEVEX.WORKSPACE.199`).
4. **Write the rows**, into the repository's own docs tree, under the domain the module belongs to. **The seats, what each holds and the row grammar are `refs/devex/workspace/docs/doc-sets.md`** — read it there rather than from a copy. Where the node is in a declared stack, that stack's own planning notes are `providers/{stack}/skills/ideate/plan.md` in the domain plugin, and the stack comes from the nearest `sprepo.json`.

### Mode: decision — one register row

A row is `| id | construct | ruling | why | date |`, the id `RD.<DOMAIN>[.<SUBDOMAIN>].<NNN>` — the group named for a folder of the repository's own `docs/02-constructs/` tree, numbered per group. **Ids are never reused and a correct id is never renumbered.**

**The `why` column is the load-bearing one.** A row without it is a rule nobody can re-derive, and the next person to hit the same problem argues it from scratch. Say what the alternative costs, in specifics — never *for consistency*.

Name the register it belongs in: the workspace's own `docs/registers/decisions.md`, or the foundation book's for a foundation-level rule.

### Hand off by naming the next skill

`shape` and `design` → `new` where scaffolding is needed, otherwise `implement`. `decision` → done, or `review` where the ruling needs a second reading.

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

**A repo has one concept, however many nodes it grows.** Adding a package, app or module changes *sections* of the repo's concept — a `CONCEPT.md` beside a node manifest is always wrong (decision RD.DEVEX.WORKSPACE.080). When a node is scaffolded, ask whether the concept needs a new section or a moved boundary; never offer the node a concept of its own. This is the likeliest wrong turn on a growing repo, because the node feels like the thing being decided.

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

- **Ask; do not fill** — when ideating. A section the person has not decided stays `DRAFT` with three lines. **Inventing plausible detail is the failure mode**, because it reads as agreement and gets built on. When *harvesting*, the seats are the source and filling from them is the job. What stays banned in both directions is writing a sentence no person and no seat has said.
- **Status is theirs to set.** `DRAFT` while being ideated · `AGREED` once reviewed and safe to build against · `REALIZED` once the seats and code carry it. Nothing becomes `AGREED` because it reads well.
- **Draw the shape where the section is a shape.** A repository's projects and their dependencies; a module's seams. Use the approach-document diagram grammar so a concept diagram and an approach diagram read as one system.
- **Stay at concept altitude.** A field list, a table schema, a method signature — all of these mean you have left ideation. Say so and stop.

### 4 · Open

Every unanswered question is a card with **real options and a recommendation**. A card with no options is a status update; a card with no recommendation makes the person do the analysis twice. **The shape is [`refs/devex/workspace/docs/decision-cards.md`](../../refs/devex/workspace/docs/decision-cards.md)** — the same one every open item uses, here and everywhere else.

- **The stage ends when the questions are answered, not when they run out.**
- **An expansion is made on request, and which kind it is depends on what was asked.** A question too large for an Open card needs somewhere to be **argued** — that is an approach document, `approach.html` in the open workstream's folder, never in a repository. A section too big to review in place needs somewhere to be **read** — that is an overview, `artifacts/overviews/<section>-overview.html`. A concept states shape, so someone wanting the detail is asking for the expansion, not for a longer concept. The routing test is whether options were weighed and one chosen (decisions RD.DEVEX.WORKSPACE.102 · RD.DEVEX.WORKSPACE.103). Either way the section names the file and the file names the section back. **Offer; never start one unasked**, and never write one to make a concept look finished. A concept whose sections have none is the normal case, not an incomplete one.
- **An approach page or an overview opens on a masthead of three levels, and each is plain language — MUST** (decisions RD.DEVEX.WORKSPACE.182 · RD.DEVEX.WORKSPACE.187). Copy the page from its template, which holds only the page's structure and styling. The approved masthead for each kind, a poor example for each level and the check before saving are in [`refs/devex/workspace/docs/doc-sets.md`](../../refs/devex/workspace/docs/doc-sets.md) § Every page opens on a masthead of three levels. An approach page's masthead carries no project shorthand — an arc number, a question number or a release name the sentence does not explain — and the workstream number that opens its `h1` is not part of the Title.

  | Page | Title | Subtitle, one plain sentence | Description, one paragraph |
  | --- | --- | --- | --- |
  | approach | the page's name | the decision it plans | what changes · why read it · how the page runs |
  | preview | the preview's name | what you are asked to decide from the page | what the page shows · why look at it · how the page runs |
  | concept overview | the area's benefit line | the area's what line | what this area covers · why read on · what the pages below cover |

  Plain means everyday words, one idea a sentence, no numbers, no slogan, no figure of speech, and no book word the same sentence does not explain. The argument starts in the first section: for an approach page that is `Why`, then `What`, `How`, `Open` and `Deferred`, with no `Terms` section. **Write the Title and the Subtitle yourself, from the kind's row and its approved example, and keep them current as the page grows** (`RD.DEVEX.WORKSPACE.205`); do not ask the developer to approve one. The foundation hub's Title and Subtitle are the one exemption, fixed by `RD.DEVEX.WORKSPACE.143`.
- A question deliberately not answered is **deferred with a trigger** — what would bring it back.

## The lenses you convene

Ideation is where having the wrong people in the room costs most: a boundary drawn without the business is renegotiated commercially later.

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

`FRAME` reads **only `AGREED` sections** and writes the seats: `Why` → `01-purpose`, `Who` → `personas.md`, the outcomes → behavior rows with ids. Those sections then flip to `REALIZED`.

- **Never write into `docs/`.** One file, at the repository root.
- **Never design.** Fields, tables, signatures are `plan` and later.
- **Never close your own questions.** You draft options and a recommendation; a person decides.
- **Never mark a section `AGREED` yourself**, and never proceed past a gate because the previous step looked finished.
