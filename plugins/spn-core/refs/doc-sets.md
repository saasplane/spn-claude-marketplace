<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/01-foundation/02-docs/README.md", "seen": "b4c00037" },
    { "path": "docs/04-capabilities/01-foundation/02-docs/05-artifacts.md", "seen": "ccca6840" },
    { "path": "docs/04-capabilities/01-foundation/02-docs/03-tree.md", "seen": "562ad713" },
    { "path": "CONCEPT.md", "seen": "9a52a641" }
  ]
}
-->

# Doc sets — the shape a repository carries

**Source of truth:** the corpus standard (`04-capabilities/01-foundation/02-docs/`), with the concept's Node Docs section (`CONCEPT.md`, at the repository root) as the standing one-page view. Read this file as a restatement of those rules, adding none of its own. **The book governs**; the concept holds the last agreed idea and is updated on request, so where the three disagree the standard wins and this file is regenerated.

**A repository has ONE docs tree, and it sits at the repository root.** Its seats divide by the
domains the repository's own concept names, never by the packages it ships (decision RD.DOCS.001). A
node — an app, a package, a module — carries a `README.md` saying what it is and linking into the
seats it realizes, and carries no seats of its own.

The reason is the question each seat asks. *What can a person do* is answered by the platform rather
than by one of its packages: somebody signing in meets a server module, a web module and the
application hosting all three, and no package owns that sentence. A package is how delivery is
divided, which is a different question from how understanding is divided.

Three things follow, and you meet each of them in the first week: one place to look, found by domain
rather than by package name; renaming, splitting or absorbing a package moves no documentation; and
a behaviour that crosses packages finally has a home — the domain that would have to change if the
behaviour changed.

> [!IMPORTANT]
> **A node you open carries `README.md` and no docs tree.** That README is the index: about
> twenty-five lines saying what the node is, and links into the seats it realizes. It is the only
> thing that knows where the node documents itself, because a path cannot say it —
> `packages/module-server-iam-ts` documents itself at `docs/04-capabilities/01-iam/01-server/`.
> **Read it before looking for a mirror**, and write what you add into the repository's one tree
> rather than beside the code.

## Every surface, one map

Documentation is not one place. Resolve which surface a change belongs to **before writing a word** — the commonest documentation defect is correct content on the wrong surface, and editing cannot repair it.

| Surface | Sits at | Says | Written by | Moves when |
| --- | --- | --- | --- | --- |
| `CONCEPT.md` | **repository root**, beside `sprepo.json` | what the repo **is** — boundary, domains, surfaces, refusals | `ideate`, one agreed block at a time | the shape moves |
| `README.md` | repository root | how to get in — identity, children map, doc map | scaffold, then by hand | the children change |
| `README.md` | **node** root — package, app, module | this node in a paragraph, and links into the seats it realizes. About twenty-five lines, and **none of the house words** (RD.DOCS.021 · RD.DOCS.062) | scaffold, then by hand | the node's identity moves |
| `docs/README.md` | the repository's one docs tree | the tree's face — the seats, and the map | generated map, hand-written identity | the file set changes |
| seat face | `01-purpose` · `02-constructs` · `03-behaviors` · `04-capabilities` · `05-guides` | the fixed answer, distilled, plus the map below it | `FRAME`, then `develop` | the answer moves |
| domain folder | beneath a seat, named for a domain the **concept** names | that domain's share of the seat's answer | `plan` lands rows, `develop` proves them | rows land or change |
| mirror | `04-capabilities/<domain>/<layer>/`, named for the **source folder** it governs | that folder's seams | `develop` | the source folder moves |
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
<repository>/docs/
├── README.md              the tree's face — the seats, and the map
├── 01-purpose/            WHY — why this repository exists
├── 02-constructs/         WHAT, the model — the things it is about, and the word for each
├── 03-behaviors/          WHAT, as product — what a person can do
├── 04-capabilities/       WHAT, as engineering — what must exist for that to be possible
├── 05-guides/             HOW — how to use what was realized
├── registers/             POCKET — the repository's own rules and decisions
└── artifacts/             POCKET — the overview and construct pages, and deliberate reports
```

**The numbering IS the mental model, so the folder listing teaches it.** The concept's framework runs
**Why → What → How**, and *What* has three parts. One folder answers Why, three answer What in the
order they are written, and one answers How. Read the names top to bottom and you have read the
framework.

**Constructs come first inside *What*, and that is the whole reason the seat exists.** Behaviors and
capabilities are both written in the constructs' words — one in the consumer's spelling, one in the
contract's — so neither can be written until the words exist. Put the model second and each of them
invents the vocabulary it needs, which is how one noun ends up meaning two things.

- **Seats are numbered** because they are read in order; **pockets are never numbered** because they
  are consulted.
- **Open every folder with `README.md`** — never `INDEX.md`. A seat's README is its **face**: the
  complete distilled answer plus the map of what sits below it, never a bare table of contents.
- **A seat holding nothing but its face is the compact state, not a defect.**
- **Number what is ordered; never number what is named.** The seats, the domain levels and the layer
  split (`01-server` · `02-web`) are numbered. `README.md`, `data-model.md`, `schema.sql`,
  `registers/`, `artifacts/` and **every mirror** are not — a mirror's name must stay identical to the
  source folder it governs.

## A seat is never absent

Where a repository has nothing of its own to say in a seat, the face **states what the seat would
hold** and **cites the repository that owns the answer** — a partner repository references the
platform's constructs rather than copying them. That face is *generated*, because a citation is
derivable (decision RD.DOCS.017).

A missing seat and an empty seat read identically from outside. Making the seat present and the
answer a citation turns absence into a statement with an owner.

## The capabilities seat is derived — a mirror per source folder

A capability document is a **mirror**: named for the source folder it governs, carrying that folder's
seams. A capability named for a feature rather than a folder breaks the derivation, because then
nothing says which folder is documented and which is not.

The tree hangs **by domain, then by layer, then by the source folder**:

```text
04-capabilities/01-iam/01-server/
├── README.md              the face: what this module provides, and the Map
├── contract.md         →  src/contract/
├── app/services/session.md · identity.md · org.md · authz.md
├── app/repositories.md →  src/app/repositories/
├── entry.md            →  src/entry/
├── data-model.md          the tables, one line each
└── schema.sql             its authoritative form
```

The face's **Map** declares `File │ Governs │ Carries │ Status`, so what is documented and what is
not is a table rather than a hunt.

- **A mirror is one document per seam family** — the deepest folder a developer would name when
  asked *where does that live*.
- **`schema.sql` sits beside the `data-model.md` it is the authoritative form of**, in the
  capabilities seat and not in a pocket: migrations mirror it verbatim, the dictionary reads a
  term's storage through it, and a repository with nine storage-owning domains has nine of them
  (`Q88`, 2026-09-18). One pocket cannot hold nine files of one name.
- **Excluded by construction**: a private segment (anything under a `_`-prefixed path), a generated
  folder, build output, and `migrations/`. A migration's useful content is seeding and ordering,
  which is vocabulary and belongs to the data model (decision RD.DOCS.018).

Which makes the seat checkable in both directions:

| Defect | What it means |
| --- | --- |
| a source folder with no mirror, and no face naming it | a folder is documented by nobody, and nobody notices |
| a mirror naming no folder | it describes something that no longer exists |
| a mirror for a private or generated folder | the interior leaked into the published surface |
| a split with no matching subfolder | depth was invented rather than earned |

### A repository may have no `src/`, and the rule still holds

**The source root is declared on the capability face, never assumed.** Every rule above is written
against `src/` because that is where almost every repository keeps its source — but a repository
declaring `GENERAL` has no nodes, and may have no `src/` and no `tests/` at all. The marketplace's
source is `plugins/<name>/`; another general repository's is whatever it is.

So the face's block names the root it governs, and the Map is generated against that. **A face that
declares nothing keeps `src`**, which is every repository that has one, so nothing already written
changes. The rule itself is untouched: a mirror is still named for the folder it governs, and a
folder with no mirror is still a finding.

**What changes in a general repository is only what a cell RESOLVES TO**, and the reason is the same
every time — nothing there derives from a node's kind, because there are no nodes:

| | What still holds | What it resolves to |
| --- | --- | --- |
| a **realization** row | every construct has at least one, and the dependencies stay acyclic | it names **a folder or a file**, never a node. The index reads the repository's own top-level folders, so *plugins* or *hooks* resolves where *a node named hooks* could not |
| a **behaviour** row | the id, `Who`, `Does`, `Sees` and `Type` | **`Tier` derives from a node's kind, and there is none** — so the row carries the repository's own runner or `—`, and `Status` stays `PLANNED` unless that runner writes it. Nothing owes a tier it cannot have |
| the **mirror nudge** | — | it stays **silent**, because it fires on an edit under a `src/` folder. That is honest rather than a gap: an undocumented folder is still reported against the whole tree, which is where that finding belongs |

**The id is never relaxed.** A behaviour with no id cannot be cited, proven later, or found twice —
and a repository that cannot run a tier today may ship a runner tomorrow (`RD.GOV.024`).

## What each seat holds

| Seat | Holds | Reads as |
| --- | --- | --- |
| `README.md` | identity and orientation | what this repository is, and the map of what sits under it |
| `01-purpose` | why the repository exists | explains and persuades. Carries **no rules** — normative language here is a defect. It answers four questions — the problem it ends, the payoff of solving that once, what you get, and who it is for — and the check reads for the four answers, never for a file count |
| `02-constructs` | the model — one file per construct, under a folder per domain | contract terms: what a thing is, what it is made of, what it depends on, what it refuses. **A construct never appears before one it depends on**, and the face carries the order, generated from the declared dependencies and the concept's own sequence |
| `03-behaviors` | what a person can do — rows, under a folder per domain | `Id · Who · Does · Sees · Proven`, in the consumer's own words. **A behaviour belongs to the domain that would have to change if the behaviour changed**, which is what its id's prefix names. A row says nothing about which packages realize it |
| `04-capabilities` | what must exist for that to be possible — one **mirror** per source folder that earns one | engineering content in the one voice (RD.DOCS.043), and **normative wherever a consumer can violate the statement** — the sequence, the guard, the reason a rule exists (RD.DOCS.034; see the altitude note below) |
| `05-guides` | how to use what was realized | task-shaped — install, mount, configure, run. It carries no id and nothing tests it; the face is the adoption path in phases, each naming the guides it takes |
| `registers/` | the repository's own rules and decisions | lookup material, consulted rather than read start to end |
| `artifacts/` | the overview and construct pages, and deliberate reports | authored source of truth. Nested folders allowed here and nowhere else; sub-folders carry no README |

**The constructs face is the dictionary, and it is generated.** One table, three columns — the word a
consumer uses, the term the contract uses, and where it is stored. The first two come from each
construct's own `Terms` table, so that table is **three columns wide, not two**; the third comes from
the domain's `data-model.md`, matched on the contract term. A `Terms` table of two columns cannot be
generated from, and the audit reports it.

**Six invariants hold this shape up, and the folders are only where they land.** A domain folder
exists only where the concept names that domain. The dictionary is generated, never typed. Every
noun in a behaviour row resolves to the dictionary. Every source folder has a mirror, or the face
names it and says where its facts live. Every `✅` row is cited by a case, and every cited id exists.
Every construct has at least one realization row, and its dependencies are acyclic and agree with the
reading order. Each is a RULE, and invariant 2 is the one that decides whether the shape was worth
adopting — a hand-maintained dictionary moves drift rather than removing it.

**A capability chapter is the spec the code it names realizes** (decision RD.DOCS.034). It is **one chapter per construct per package that realizes it**, under the construct's own domain and carrying its number — `01-iam/module-server-iam-ts/04-sign-in.md`. The per-group mirror it replaced — `cache.md`, `contract.md`, `app.md`, `entry.md`, `ui-*.md` and siblings — is retired (Q130): a package's folders are not the reader's question, and 98 of those mirrors ran to 5,000 words restating a pattern the stack's standard already states once. A chapter is Where · Follows the pattern · Special handling · Between modules, under 800 words. It **binds two parties**. The implementation is bound by what a `Guarantee` row states, and the consumer by what `Placement` and `Does not do` state. **Both directions are normative.** The test, one statement at a time: **does it bind someone — the implementation or the consumer?** If yes it takes `MUST`/`MUST NOT`/`MAY`; if it binds nobody it is commentary — advice, rationale, a trade-off note — and stays prose. **A capability page is normatively dense by design**, and the seam table's sections are the spec's shape, unchanged.

**The spec treatment reaches chapters only.** A seat face is a **map** of what the repository contains — *where does what live*, not *what must this code do*. So is the `04-capabilities/README.md` face, which routes, and so is `data-model.md`, which is a dictionary. The seat's job differs by what is being documented: a mirror of a source folder yields a spec, an index or an orientation yields a map. **Seat tables are in scope for modality; record tables are not** — dictionaries, behavior-row tables, data models, registries and proof-gap tables keep their form. Modality comes from the page, never from a sweeper.

**`group` is the source axis; `area` is the top division of a seat.** A group is a published top-level source folder — shared vocabulary between the symbol index and the capabilities seat. An **area** is a folder, and the same areas divide all three *What* seats alike, so one number names the model, the rows and the standard of one thing. The foundation has four — `01-devex` · `02-support` · `03-platform` · `04-launchpad`; every other repository divides by domain with no area above it. The older half of [RD.DOCS.016](../../../../spn-foundation/docs/registers/decisions.md) — that an area names an outcome and never a folder — was written when the behaviours seat alone had areas, and is superseded.

## The artifacts pocket — concept, overview, construct page

The pocket holds what the node **authors** rather than derives, and its three authored kinds sit at three altitudes of one progression (decision RD.DOCS.039). **Each is earned separately, and none generates the next.**

| Kind | Path | Holds | Earned when |
| --- | --- | --- | --- |
| **Concept** | `CONCEPT.md`, the repository root | the whole model, once — shape, never depth | the repo exists |
| **Overview** | `artifacts/overviews/<section>-overview.html` | one concept section at reading depth | the section is too big to review where it stands |
| **Construct page** | `artifacts/constructs/<domain>/<slug>-construct.html` | one construct at reading depth, produced from its seat file | a construct exists

**An argument does not live here.** An approach document belongs to **the workstream that argues it**, in the workspace's planning centre, and it closes with that workstream. The pocket holds what the repository *states* and what somebody *measured*; where a design was weighed is the workstream's record. A pocket that also held the arguments made the two impossible to tell apart, which is how a stale argument came to be read as a statement of today.

**The folder set is fixed, and adding one is a decision**: `overviews/`, `constructs/`, `reports/` and nothing else.

**They do not share a lifecycle** (decision RD.DOCS.021). Two describe a moment; one renders something live.

| Kind | Produced | Its relation to today |
| --- | --- | --- |
| **Report** — a measurement | on demand | none. A report of last month is a correct report of last month, and the next run supersedes it |
| **Approach** — an argument | on demand, when a design is argued | none is a defect. **Ahead** leads the code as a concept does, **level** means it landed, **behind** is a correct record of then |
| **Overview** — a face | **maintained.** A workstream changing the model owes it | it **tracks its seat**. Drift from `CONCEPT.md` is a defect, and `coherence.py` reads it |

**A suggestion is recorded before it is executed — MUST.** The developer instructs and corrects while the work runs, and each one is written down before it is acted on. An instruction becomes an arc step or a row on the approach page. A correction becomes a log line and a rewrite of the row it corrects. A question nobody can answer alone becomes an `Open` card, argued in the page rather than in chat. A session's context ends with the session, so anything held only there is work nobody can pick up.

**A row carries its state while the work runs**, so the developer can see what they asked for that has not happened yet:

| State | Means |
| --- | --- |
| ⬜ **raised** | it is written down. Nothing has been built |
| 🚧 **agreed** | the approach is settled and the work is running |
| ✅ **landed** | the content is in the node that owns it |

The three marks above are for work in flight. `landed` · `carried` · `deferred` are what the close sweep asks of every row, and only the first is shared between them.

**Carry the face and the arguments inside the workstream that changes them**, rather than tidying them afterwards. A workstream runs concept → docs → code, so the model moves first and the face moves with it. Leave the face to a later pass and the hub states a model the code has already left. Expansion is earned the same way. Where implementing a workstream shows a section is too big to review in place, the face gains one then — that is when somebody has read it at depth.

**Never rewrite an argument to read as though it had always argued the current shape.** That destroys the only record of what was weighed. A face is the opposite — drifting from its seat is exactly how it goes wrong.

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
- **Keep reports under their own name** in `reports/`. **A source a seat cites is not the pocket's to hold**, and one sentence decides it: **nothing in a pocket may be depended on.** A pocket once carried a `resources/` folder for *what a document was written from* — and every such file was a file some seat needed, so every one was a seat depending on a pocket. It is gone, and a fact a seat needs lives in a seat: the node's *why* in `01-purpose/`, what consuming it observably does in `03-behaviors/`, its *how* in `05-guides/`. The same sentence keeps the templates with the chapters whose rules they restate, and `schema.sql` in the capabilities seat beside the `data-model.md` it is the authoritative form of (`Q88`).
- **Nothing here is validated against current state.** An artifact records a moment, so a checker that flags one for disagreeing with today's tree has misread what it is looking at.

**An approach document is never kept in step with code.** It argues at a moment, so three relations are all legitimate: **ahead**, **level**, and **behind**. **Ahead** is arguing something not built yet — early iteration, leading the code as a concept does. **Behind** is a correct record of what was argued then. A design can reach an empty `Open` long before a line exists, and is complete at that point. **The defect is a silent rewrite** — editing one to read as though it always argued the current shape destroys the only record of what was weighed and rejected. Flag the contradiction; leave the artifact as the moment it was.

### Steward, never manufacture

**Coverage never forces an artifact into existence** (decision RD.DOCS.041). A concept section with no overview and no approach document has not needed one yet — a fact worth reading, not a gap worth filling. Four obligations, none of which generate content:

| Obligation | Fires when | Do |
| --- | --- | --- |
| **Offer** | options were weighed and one chosen — in conversation or in a commit | name the reasoning and offer to record it; never write one unasked |
| **Suggest** | overviews begin citing one another | offer the concept a section-by-section expansion |
| **Steward** | any artifact lands or moves | the index row, the status chip, the home link, the pointer up from the owning node |
| **Flag** | `CONCEPT.md` moves under a document that argued the old shape | report the contradiction, and stop |

**A contradiction is a decision entry naming which one is wrong, never a silent edit in either direction.** The offer trigger stays tight on purpose: *a design was discussed* is too loose and rebuilds slot-filling in a softer form. **Options weighed, one chosen** is the bar.

## Blocks and figures — what a page is made of

**A page is produced, never authored.** You write a **seat file in markdown** and `docs.ts page` renders it. You never name a block, never write a class, and never paste HTML into a seat file. The renderer reads ordinary markdown components and gives each one its form: a table becomes a card, a fenced block with a language becomes a coloured code block, a blockquote becomes the `MUST` callout, a numbered list becomes an ordered list, a ```` ```dg ```` fence becomes a drawn figure.

**Markdown keeps its own grammar and HTML keeps the blocks.** A capability chapter stays markdown and is never produced as a page, so none of this reaches it. The split is stated in the book: `02-document.md` governs markdown, `05-artifacts.md` governs the page.

**A block is a visual insert, not a section shape.** Normal prose needs no block. Reach for one when the content is *not* a paragraph, a list or a table — a rule the reader must not skim, a picture, a fixed list of doors, a comparison. Every block and every figure kind is written out, in the spelling you actually type, in [`blocks.md`](blocks.md) beside this file — read that before authoring a document with figures in it, and read a page template beside it. **Do not open the HTML blocks template**: it is the *rendered* reference a person opens, it costs about 16,400 tokens, and three quarters of it is stylesheet, inline SVG and script that the renderer and the drawer produce for you (Q135, 2026-09-22).

### The figure kinds

Write the specification in a ```` ```dg ```` fence and the drawer computes every coordinate. **Never hand-write SVG for a kind that has a drawer.**

| Kind | Draw it when the reader must see | 
| --- | --- |
| `MAP` | the parts of one thing, where there is no inside and no order |
| `FLOWCHART` | a path one actor walks, with the shapes a flowchart has — a diamond is a choice |
| `SEQUENCE` | a path several actors walk together, when *who said it* is the fact |
| `ENTITIES` | data and how it relates |
| `TREE` · `STATE` · `CODE` · `DIFF` | a hierarchy · a lifecycle · source · a change |
| `SYSTEM` | the architecture of something you build — a server module, a web module, an estate package |

### Drawing a `SYSTEM` figure for a module you are looking at

`SYSTEM` is a constrained `MAP` (decision RD.DOCS.075), and it is the kind you will reach for most when documenting a repository. Derive it from the source rather than from a template:

1. **The container is the module**, and its name is the module's own. Anything outside it is something the module talks to.
2. **Read `entry/` for the doors.** Each door is its own box — `api`, `cli`, `queue` — and each is met by the thing that knocks on it. **Draw the doors the module actually has**: a module with only `api` gets one door, and pretending otherwise draws a fiction.
3. **Read `app/` for the middle layer** — `services` and `repositories`, with `entities` and `utils` beside them.
4. **The layer at the foot is what the module is given or publishes** — `config` (the environment it is started with) for a deployable, `contract` (the surface its siblings import) for a module inside one.
5. **Read the imports for the outward edges, and attribute each to its layer.** This is the load-bearing step, because which layer owns an edge is a claim about the code. A **repository reaches the database and nothing else** — a repository importing a file store is a finding, not a drawing. **Services** reaches the queue, the cache, transactions, the file store and sibling modules.
6. **Give each outside thing the shape of what it is**: a store is a cylinder, a cache a cylinder you can afford to lose, a queue a pipe, an object store a bucket, a client a window, a way in a chevron, a service a plain rectangle.
7. **Draw every starting point, and the edges that close a loop.** A system is entered from more than one place, and some flows come back.

**Worked examples**: `samples/prj-module-system.html` is one derived from real source; the blocks page carries server, web and estate drawn on identical geometry, which is the point of the kind.

### The geometry is checked, so do not tune it by eye

`checkFigures` in `spn-core/hooks/lib/figures.ts` reads every figure on every produced page and reports what it finds. The numbers it holds you to: **24** between unconnected shapes and parallel connector runs · **56** where a connector joins two boxes · **16** padding, leaf and container alike · **36** minimum visible shaft · **8** of clear air between a label and any shape or arrow · a side offers **three** attachment points and a lone arrow takes the middle of its side.

**Hand-placed geometry does not survive these rules.** Drawing one `SYSTEM` figure by hand took more than twenty rounds against the check, and every fault was caught by a rule rather than by eye. Use a `dg` fence.

## Metadata

Every document opens with an invisible block holding **strict JSON**, marked `spn:doc`, followed by the title and a tag line rendered from it (decision RD.DOCS.014).

```markdown
<!-- spn:doc
{
  "id": "kebab-case-unique-id",
  "title": "Human Title",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "DONE",
  "summary": "One sentence — used by agents to select this doc, and by indexes.",
  "keywords": ["five", "to", "ten", "selection", "terms"]
}
-->

# Human Title

`For: Architect · Backend developer` · `Status: ✅ DONE`
```

- `stages` is the one optional field — only where a document belongs to one DevEx stage, such as a guide.
- **There is no `part` and no `altitude`.** Everything else is derived: the **seat** from the path and the **kind** from the node's manifest. The voice is one (RD.DOCS.031). The seat decides what a document carries, never its temperature.
- **`lenses` are derived from the kind, not authored per page** (decision RD.DOCS.037) — one derivation, two clauses, because runtime says *where code runs* and `lenses` says *who reads it*. A kind you **build on** (support, module, app, client) derives from its declared runtime: `SERVER` → `SERVER_DEV`, `WEB` → `WEB_DEV`, `UNIVERSAL` → both. A kind that **serves building** — `TOOLCHAIN` and `APP_UTILITY`, and only those two — carries both whatever its runtime, because every builder uses it. Read the declared runtime, never parse the name. `ARCHITECT` is added by **seat**, never by kind. A node's doc face (`docs/README.md`) is the orientation page and carries it for every kind, leaf nodes included. The seat faces beneath it (purpose, constructs, behaviors, capabilities, guides, artifacts) carry the derived developer lenses alone. `ARCHITECT` there is authorship a scaffold never emits. The other six lenses are authored, never derived. A page MAY narrow the derived set where its subject genuinely serves one runtime, and MUST NOT widen it. **A scaffold template emits the derived set**, which is what makes generated pages compliant by construction.
- `id` is identity and **never changes**, however the path does. The path is only its current address.
- **Status is the state of what the document governs, never of the prose**: `DONE` ✅ · `IMPLEMENTING` 🚧 · `PLANNING` 🔮.

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
10. **Register rows take the plain substrate** (decision RD.DOCS.043) — one clause a sentence, none past twenty-five words, and the decision column is the ruling and nothing else. A decision or glossary row keeps its exact terms and its MUST. No *you* and no aside: a row is still a record.
11. **No idioms** (decision RD.DOCS.052) — an idiom means something its words do not say, so a reader whose first language is not English cannot guess it. Write the plain phrase instead: *ask me to continue*, never *say the word*. A house term the book defines is not an idiom, and `owes`, `carries`, `seat` and `rung` all stay. The fix is the plain phrase, never a shorter sentence. **Plain is not simplified** — a term can be looked up and an idiom cannot, so terms are not the target. One sentence may carry four of them. What must be plain is the language around them, and the exact term, the constraint and the MUST all survive the rewrite untouched.

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
at depth in the book's `01-foundation/02-docs/01-corpus.md` § What the pattern binds). The voice reaches this book,
the foundation's provider set, and these plugins — your skills, lenses, agent briefs and reference
restatements. **It also reaches what you say and print at runtime** (decision RD.DOCS.052). A session
banner, a hook's output and your own chat reply are all held to it. Nothing you write escapes
the bar by not being a file. Layout is what those trees are free of, never how they read. The bars are identical
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
- **A row states present truth, and never names what it replaced.** No supersession clause, no amendment notice, and no pointer to the row that used to answer.
- **Update the row in place, at its own address.** A row is never annotated or struck through — it is rewritten so it states what is true now, and the old wording lives in git history. A standing row that says something no longer true is worse than no row.

**Writing one:**

1. **The decision is a bold sentence, first** — what is now true, never what was considered. A lead that needs the Why column to make sense is not written yet.
2. **The Why column carries the reason it was needed** — the failure the old position caused, or the cost it imposed. Not a restatement of the choice.
3. **Never write a tally.** *Closed at nineteen* is a count that rots; name a set by its rule.

**What lands here:** a document conflicting with running code; a recorded deviation from a paved path; a proposed new chapter, because the outline is frozen. On the first, **drift runs both ways**, so the entry names which side is wrong before either is touched. **Never a silent edit in either direction.**

**You draft a row; a person decides it.** The Agent never resolves a decision on its own initiative.

## What you never do

- **Never invent structure the grammar does not grant.** A new chapter, part, or domain is a decision recorded in a register (see above); anything smaller becomes a section in a document that already exists. Seats and pockets are not chapters — they appear whenever the grammar calls for them.
- **Never restate another document's rule.** Introduce it in a sentence and link. A copy still says the old rule a year from now.
- **Never write a changelog.** Documents state present truth — no *previously*, no *we used to*. Git history is the history.
- **Never write a live count.** A document states a status, never a tally; a number in prose is correct until the next addition and then silently wrong.
- **Never hand-write a generated face**, or edit inside a generated region. The source plus a regeneration is the only edit path.
