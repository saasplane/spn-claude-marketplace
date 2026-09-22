<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/README.md", "seen": "bb9243a0" },
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md", "seen": "3bcf359b" },
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md", "seen": "0229e250" },
    { "path": "docs/02-constructs/01-devex/04-workspace/04-docs.md", "seen": "5d904408" },
    { "path": "CONCEPT.md", "seen": "3e6cde1c" }
  ]
}
-->

# Doc sets — the shape a repository carries

**Source of truth:** the corpus standard (`04-capabilities/01-devex/04-workspace/04-docs/`), with The Docs Tree construct (`02-constructs/01-devex/04-workspace/04-docs.md`) as the standing one-page view. The repository's `CONCEPT.md` sits above both as an outline: it names the domains and areas a tree divides by, and states no rule of its own. Read this file as a restatement of those chapters, adding none of its own. **The book governs**, so where the three disagree the standard wins and this file is regenerated.

**A repository has ONE docs tree, and it sits at the repository root.** Its seats divide by the
domains the repository's own concept names, never by the packages it ships (decision RD.DOCS.001). A
node — an app, a package, a module — carries a `README.md` saying what it is and linking into the
seats it realizes, and carries no seats of its own.

The reason is the question each seat asks. *What can a person do* is answered by the platform rather
than by one of its packages: somebody signing in meets a server module, a web module and the
application hosting all three, and no package owns that sentence. A package is how delivery is
divided, which is a different question from how understanding is divided.

Three things follow, and you meet each of them in the first week: one place to look, found by domain
rather than by package name; renaming, splitting or absorbing a package moves **no argument**,
because its chapters are named for the constructs it realizes, so what moves is a folder name rather
than a page's subject; and a behaviour that crosses packages finally has a home — the domain that
would have to change if the behaviour changed. The cost is honest and small: a package extracted
into another repository takes its chapters with it as a move, and the domain list has to follow the
concept, which invariant 1 checks.

> [!IMPORTANT]
> **A node you open carries `README.md` and no docs tree.** That README is the index: about
> twenty-five lines saying what the node is, and links into the seats it realizes. It is the only
> thing that knows where the node documents itself, because a path cannot say it —
> `packages/module-server-iam-ts` documents itself at
> `docs/04-capabilities/01-iam/module-server-iam-ts/`. It also carries a **generated index of its
> own source folders**, one line each, naming the chapter that covers it, so standing in the package
> you can still see which of its folders nobody has written about. **Read it before looking for a
> chapter**, and write what you add into the repository's one tree rather than beside the code.

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
| capability chapter | `04-capabilities/<domain>/<package>/`, carrying the number of the **construct** it realizes | what this package does that the pattern does not | `develop` | the construct or the package moves |
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
- **Number what is ordered; never number what is named.** The seats, the area and domain levels, and
  every construct file with the behaviour and capability files carrying its number, are numbered.
  `README.md`, `data-model.md`, `schema.sql`, `personas.md`, `registers/`, `artifacts/`,
  `templates/` and **every package folder in the capabilities seat** are not — a package folder's
  name must stay identical to the package it is named for.
- **One level holds numbered folders or numbered files, never both.** A file browser sorts every
  folder above every file, so a mixed level hides the reading order at the one place a reader lands.
- **Below a domain there are only files.** A construct sits at most three levels under its seat — the
  area, the domain where an area has domains, then the file. The capabilities seat in a built
  repository is the one place a fourth level is right, and that level is the package.

## A seat is never absent

Where a repository has nothing of its own to say in a seat, the face **states what the seat would
hold** and **cites the repository that owns the answer** — a partner repository references the
platform's constructs rather than copying them. That face is *generated*, because a citation is
derivable (decision RD.DOCS.017).

A missing seat and an empty seat read identically from outside. Making the seat present and the
answer a citation turns absence into a statement with an owner.

## The capabilities seat hangs by domain, then package, then construct

A capability document is a **chapter**: one per construct per package that realizes it, carrying the
construct's own number. A chapter named for a source folder rather than for a construct breaks the
numbering, because then nothing says which construct is documented and which is not.

The tree hangs **by domain, then by the package, then by the construct**:

```text
04-capabilities/01-iam/
├── README.md                   the domain face: its packages, and what each realizes
├── data-model.md               contract term → table and column, once for the domain
├── schema.sql                  the tables this domain owns, authoritative
├── module-server-iam-ts/
│   ├── README.md               the package face: the constructs it realizes, and those it does not
│   ├── 01-organization-tree.md
│   └── 04-sign-in.md        →  the server half of the Sign-in construct
└── module-web-iam-ts/
    ├── README.md
    └── 04-sign-in.md        →  the web half of the same construct, same number
```

**The folder carries the package's name**, never a layer name standing in for it. `01-server/` was
exact only while a domain had one server package, and it stopped being exact the moment a domain had
two. A package that realizes nothing of a construct has no chapter for it, and its face says so — so
what you meet is a declaration rather than a gap you have to investigate.

- **The code mirror survives, and it moved to the node.** Every node's `README.md` carries a
  generated list of its source folders with the chapter covering each, so *is this folder
  documented* is still a table rather than a hunt — asked where a developer is standing when they
  ask it (decision RD.DOCS.078).
- **`data-model.md` sits at the domain's root and never once per package** (decision RD.DOCS.074). A
  domain has one data model however many packages realize it, so a domain's server and web packages
  carry neither it nor the schema. It holds what a migration knows — which contract term is stored
  in which table and column — and defines no term, because the words are the constructs' own.
- **`schema.sql` sits beside the `data-model.md` it is the authoritative form of**, in the
  capabilities seat and not in a pocket: migrations mirror it verbatim, the dictionary reads a
  term's storage through it, and a repository with nine storage-owning domains has nine of them
  (`Q88`, 2026-09-18). One pocket cannot hold nine files of one name.
- **Excluded by construction**: a private segment (anything under a `_`-prefixed path), a generated
  folder, build output, and `migrations/`. A migration's useful content is seeding and ordering,
  which is vocabulary and belongs to the data model (decision RD.DOCS.018).

Which makes the seat checkable in every direction:

| Defect | What it means |
| --- | --- |
| a construct a package realizes with no chapter for it | the package builds something nobody wrote a topic for |
| a chapter naming a construct that does not exist | it describes something that no longer exists |
| a package holding code that realizes no construct | the code grew a subject the model never got |
| a construct no package realizes | the model grew a subject nothing builds |
| a source folder the node's generated index shows no chapter for | a folder is documented by nobody, and now somebody notices |
| a `data-model.md` under a package rather than a domain | a domain's tables were written down twice |
| a pattern explained inside a chapter | the stack's standard was copied, and the copy is the stale one |

### A repository may have no `src/`, and the grammar still holds

Every rule above is written against `src/` because that is where almost every repository keeps its
source — but a repository declaring `GENERAL` has no nodes, and may have no `src/` and no `tests/`
at all. The marketplace's source is `plugins/<name>/`; another general repository's is whatever it
is. **The grammar is untouched**: the seats are the same five, a chapter is still numbered as its
construct, and a construct nothing realizes is still a finding.

**What changes in a general repository is only what a cell RESOLVES TO**, and the reason is the same
every time — nothing there derives from a node's kind, because there are no nodes:

| | What still holds | What it resolves to |
| --- | --- | --- |
| a **realization** row | every construct has at least one, and the dependencies stay acyclic | it names **a folder or a file**, never a node. The index reads the repository's own top-level folders, so *plugins* or *hooks* resolves where *a node named hooks* could not |
| a **behaviour** row | the id, `Who`, `Does`, `Sees` and `Type` | **`Tier` derives from a node's kind, and there is none** — so the row carries the repository's own runner or `—`, and `Status` stays `PLANNED` unless that runner writes it. Nothing owes a tier it cannot have |
| the **source-folder index** | it is generated, never a list somebody maintains | it has **no node to sit on**, because a node's own `README.md` is where it is generated. That is honest rather than a gap: a folder no chapter covers is still reported against the whole tree, which is where that finding belongs |

**The id is never relaxed.** A behaviour with no id cannot be cited, proven later, or found twice —
and a repository that cannot run a tier today may ship a runner tomorrow (`RD.GOV.024`).

## What each seat holds

| Seat | Holds | Reads as |
| --- | --- | --- |
| `README.md` | identity and orientation | what this repository is, and the map of what sits under it |
| `01-purpose` | why the repository exists | explains and persuades. Carries **no rules** — normative language here is a defect. It answers four questions — the problem it ends, the payoff of solving that once, what you get, and who it is for — and the check reads for the four answers, never for a file count |
| `02-constructs` | the model — one file per construct, under a folder per domain | contract terms: what a thing is, what it is made of, what it depends on, what it refuses. **A construct never appears before one it depends on**, and the face carries the order, generated from the declared dependencies and the concept's own sequence |
| `03-behaviors` | what a person can do — **one file of rows per topic**, beside the construct of the same number, with `personas.md` | in the foundation a **promise**: `Id · Who · Does · Sees · Type`, `Type` reading `PROMISE`, and **no status at all**, because this book ships no code that could write one. In a built repository the row is **proven** and carries the same cells plus `Where`, `Tier`, `Status` and `Updated at`, with a `Names` cell naming the promise it fulfils. Written in the consumer's own words. **A behaviour belongs to the domain that would have to change if the behaviour changed**, which is what its id's prefix names |
| `04-capabilities` | what must exist for that to be possible — in this book the standard for one topic; in a built repository **one chapter per construct per package that realizes it** | engineering content in the one voice (RD.DOCS.043), and **normative wherever a consumer can violate the statement** — the sequence, the guard, the reason a rule exists (RD.DOCS.034 · RD.DOCS.073; see the altitude note below) |
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
noun in a behaviour row resolves to the dictionary. Every construct has a chapter in every package
that realizes it, every chapter names a construct that exists, and every package holding code
realizes at least one construct. Every proven row resolves to a case and every cited id exists — a
promise carries no status, and a proven row names a promise that exists. Every construct has at
least one realization row, and its dependencies are acyclic and agree with the reading order. Each
is a RULE, and invariant 2 is the one that decides whether the shape was worth
adopting — a hand-maintained dictionary moves drift rather than removing it.

**A capability chapter is the spec the code it names realizes** (decisions RD.DOCS.034 · RD.DOCS.073). It is **one chapter per construct per package that realizes it**, under the construct's own domain and carrying its number — `01-iam/module-server-iam-ts/04-sign-in.md`. The per-group mirror it replaced — `cache.md`, `contract.md`, `app.md`, `entry.md`, `ui-*.md` and siblings — is retired: a package's folders are not the reader's question, and 98 of those mirrors ran to 5,000 words restating a pattern the stack's standard already states once. **A chapter has four sections and nothing else**, each one there because something would otherwise be copied into it:

| Section | Holds |
| --- | --- |
| **Where** | a short table: each part of the construct, the place it lives in this package, and what that place is |
| **Follows the pattern** | one line per pattern that applies unchanged, each linking the stack's standard |
| **Special handling** | one entry per method, flow or rule the construct forces off the pattern — **why**, then **what**, then **how**, with one place in the code. This is the chapter's substance, and a chapter with nothing here should not have been written |
| **Between modules** | what this package takes from other modules for this construct, and what it publishes to them |

**Why comes before what**, because a reader given the rule can predict the handling. **Three things are deliberately absent**: no line-by-line walk, which the code's own comments carry; no proof rows, which are the behaviours seat's; and no known gaps, which live in the workstream's split plan and the behaviour row's status. **A chapter stays under 800 words**, and that is a consequence rather than a cap — everything long has a better home above it. The two altitudes bind different people: the book's standard binds everyone building anything, and a chapter binds whoever maintains this package. So the test is one statement at a time: **does it bind someone?** If yes it takes `MUST`/`MUST NOT`/`MAY`; if it binds nobody it is commentary — advice, rationale, a trade-off note — and stays prose. **A capability chapter is normatively dense by design.**

**The spec treatment reaches chapters only.** A seat face is a **map** of what the repository contains — *where does what live*, not *what must this code do*. So is the `04-capabilities/README.md` face, which routes, and so is `data-model.md`, which is a dictionary. The seat's job differs by what is being documented: a chapter of a construct yields a spec, an index or an orientation yields a map. **Seat tables are in scope for modality; record tables are not** — dictionaries, behavior-row tables, data models, registries and proof-gap tables keep their form. Modality comes from the page, never from a sweeper.

**`group` is the source axis; `area` is the top division of a seat.** A group is a published top-level source folder, and it is now the **symbol index's** vocabulary alone — the capabilities seat stopped sharing it the moment a chapter became named for a construct, and what carries the source-folder axis is the generated index on a node's own `README.md` (decision RD.DOCS.078). An **area** is a folder, and the same areas divide all three *What* seats alike, so one number names the model, the rows and the standard of one thing. **The foundation has four — `01-devex` · `02-support` · `03-platform` · `04-launchpad` — and it is the only repository that divides this way** (decision RD.DOCS.071, retiring RD.DOCS.063); every other repository divides by domain with no area above it. Three rules bound the level: the concept names the areas, every seat that divides by domain divides the same way or none does, and **an area with no sub-areas holds its topic files directly** rather than a single child folder. The older half of [RD.DOCS.016](../../../../spn-foundation/docs/registers/decisions.md) — that an area names an outcome and never a folder — was written when the behaviours seat alone had areas, and is superseded.

## The artifacts pocket — concept, overview, construct page

The pocket holds what the node **authors** rather than derives, and its three authored kinds sit at three altitudes of one progression (decision RD.DOCS.039). **Each is earned separately, and none generates the next.**

| Kind | Path | Holds | Earned when |
| --- | --- | --- | --- |
| **Concept** | `CONCEPT.md`, the repository root | the whole model, once — shape, never depth | the repo exists |
| **Overview** | `artifacts/overviews/<source>-overview.html` | one source expanded to reading depth, one level down | the fixed set below names it |
| **Construct page** | `artifacts/constructs/<domain>/<slug>-construct.html` | one construct at reading depth, produced from its seat file | a construct exists |

**A concept is not an artifact.** It sits at the repository root beside `README.md`, a scaffold marker written before `docs/` exists and read by somebody who may never open the tree. It is listed here because it is the first altitude of the progression, not because the pocket holds it.

**`constructs/` mirrors the constructs seat folder for folder**, with `<slug>-construct.html` beside each `<slug>.md` and **no `README.md` anywhere inside it**. That is what lets the audit pair a page with its seat file by path alone, rather than by an index somebody maintains.

**Four page kinds cover everything somebody writes by hand**, and each answers one reader: an **approach** for the person deciding, a **hub** for the person arriving, an **overview** for the person taking one reading path, and a **construct** for the person building against the model. Only the approach carries cards, and only the approach lives outside the pocket.

**An argument does not live here.** An approach document belongs to **the workstream that argues it**, in the workspace's planning centre, and it closes with that workstream. The pocket holds what the repository *states* and what somebody *measured*; where a design was weighed is the workstream's record. A pocket that also held the arguments made the two impossible to tell apart, which is how a stale argument came to be read as a statement of today.

**The folder set is fixed, and adding one is a decision**: `overviews/`, `constructs/`, `reports/` and nothing else. A `resources/` folder for *what a document was written from* is refused by name: every such file is a file some seat needs, and **nothing in a pocket may be depended on** (decision RD.DOCS.078).

### A construct page has six sections, in one order

**A construct page is produced, never authored.** What an author writes is the seat file, `02-constructs/<domain>/<name>.md` — the metadata block with its dependencies, the six sections, and each figure as a fenced specification. The page is produced from that, and **a page edited by hand is a defect**, because the next production overwrites it and the audit checks that a page equals what production would produce.

| Section | Goes in | Never |
| --- | --- | --- |
| **Terms** | the words this construct gives a meaning to: the word a person uses, the contract term, and what it means | a word every engineer already knows; a row that points somewhere else instead of explaining |
| **Model** | what you are looking at, in prose first — the general shape, then its parts, then its kinds — with a figure where seeing is faster | a field list standing in for an explanation |
| **Parts** | one subsection per part: what it is, why it exists, and the facts that shape it | a *Where:* line — where a thing lives is the `Binds` table's job |
| **Boundary** | in plain prose: what this page does not answer, where that is answered, and when you go there | an edge stated before the reader has seen the shape |
| **Binds** | two tables: the rules that hold it, and where it lives today | a rule repeated; a state typed anywhere else |
| **Proof** | the checks a person can run — or nothing | a behaviour row typed by hand |

**Terms comes first because the model uses those words**, and **Boundary comes after the parts** because a reader can judge an edge only once they have seen the shape. `Relations` is retired: the metadata block's `dependsOn` already carries what it listed, one way and machine-readable, and a section restating a declared field is a second copy that drifts.

**Proof is joined from the register, never typed** (decision RD.DOCS.072). Every behaviour row naming this construct is read from the behaviours seat when the page is produced and rendered with its tier and the status the last run wrote, and the footer names the register version it read. In this book the joined rows are promises, which carry no status. **So the seat file's `Proof` holds typed checks or nothing at all**, and an empty `Proof` is a correct page rather than an incomplete one. **A `Proof` row names a command somebody else can run** — a `spnutils` command, a stack's own test target, a gate the plugins carry — and **a file name is never a command**, because a row naming a `.spec.ts` reads as verified and cannot be acted on. A script the repository carries is accepted while no verb runs it, and the exemption ends the moment a verb exists.

**A construct's status is derived, never typed.** No realization row, or every row planned, is 🔮 `PLANNING`; any row partial or done but not all done, **or** `Proof` empty, is 🚧 `IMPLEMENTING`; every row done **and** `Proof` naming a check is ✅ `DONE`. A page may not carry 🚧 or ✅ until its realization rows resolve — and a row resolves only when its `Node` cell names a node, a plugin or a repository the workspace can be asked about. A command, a folder or a house word is not one of the three.

**There is no length cap on a page and none on a part.** What decides whether a part should become a construct of its own is a judgement about the concept — does a reader meet this on its own, with its own actor? — never a line count.

### The templates sit beside the chapters, in `templates/`

Every page somebody writes by hand is copied from a template, and the templates live in the docs domain's own `templates/` folder — beside the chapters whose rules they carry, so a rule change and its restatement are one diff apart. **A seat may hold that one folder that is not documents.** It is unnumbered, because you consult a template rather than reading the set in order, and it is excluded from the document checks **by the folder rather than per file**: a per-file exemption is a hole, and a named folder is a rule. **Each template declares the chapter it restates**, at the top of the file.

| Folder | Holds | Shapes |
| --- | --- | --- |
| `templates/pages/` | `overview-template.html` · `construct-template.html` · `report-shell.md` | the page kinds a repository has — concept, overview, construct — and the report |
| `templates/seat-files/` | `construct-seat-template.md` · `schema-template.sql` | what an author writes *inside* a seat: the markdown a construct page is produced from, and the authoritative data model |
| `templates/workstream/` | `approach-template.html` · `arc-template.md` · `order-template.md` · `handover-template.md` | the workstream's own files. **The approach document is here because an argument is a workstream's**, never a repository's |
| `templates/agent/` | `skill-template.md` · `agent-template.md` · `lens-template.md` · `ref-template.md` · `hook-template.py` | the agent's own files — hand-written too, and a kind with no template gets written from the last one its author happened to see |

**The plugin and the CLI carry different sets, because they answer different moments.** `pages/` and `seat-files/` ship in both, since the agent copies one to write a page and `repo create` emits a started hub page. `workstream/` and `agent/` ship in the plugin alone: the CLI creates a workstream folder with `mkdir` and owes no shape, and it never writes a skill. The copies are stamped with the book's hash and exported on release, so a release whose copies disagree with the source fails rather than publishing drift.

**A scaffold beats a template, a template beats a document, and a document beats a conversation.** Where the CLI creates a file, that scaffold *is* the template and none is kept in the book — a seat face, a behaviour file, a capability chapter and the dictionary are all made that way.

**Seven templates carry the page and seat-file shapes**: `hub-template.html` for the one hub a repository has, `overview-template.html` for one reading path, `construct-template.html` for a produced construct page, `approach-template.html` for a workstream's argument, `construct-seat-template.md` for the seat file an author actually writes, `capability-template.md` for one capability chapter, and `blocks-template.html` for nothing at all — it is the **source** of the sample-block section the four page templates carry.

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

**A row you started and put down gets its own mark, and it is `◐ stopped`.** None of the three above fits: `🚧 agreed` says the work has not begun, and a bare cell says nobody decided it, while half an edit already sits in the tree. The mark carries four things, because only the agent who stopped knows any of them — `→` what has to happen before it resumes, `did` what already reached its node, `left` what did not, and `unsafe` what nobody may touch until it resumes.

The marks above are for work in flight. `landed` · `carried` · `deferred` are what the close sweep asks of every row, and only the first is shared between them. **`carried` means the work LEAVES this workstream**, so it names a successor scope that can receive it — another workstream, in `open/` or `backlog/`. A row pointing at a later arc of its own workstream is **sequencing**, not a carry, and it resolves through that arc: landed once the arc lands, pending while it has not. **The close refuses a stopped row**, and that is the one place it differs from deferred: a deferred row was parked before anything was touched, and a stopped one was not. You finish the work and mark the row landed, or you split it in two — the half that reached its node becomes a landed row, and the half that did not becomes a second row, carried or deferred.

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

- **The overview set is fixed: the hub, plus one page per reading path** (decision RD.DOCS.074). A reading path is a run of constructs somebody reads in order to decide one thing, and a domain earns as many pages as it has paths. `concept-overview.html` is the concept's readable HTML face — the whole model, less depth, with the diagrams the root marker cannot carry — and it is **the hub**, one per repository. Beside it, `concept-<domain>-<path>-overview.html` expands one reading path through one domain, and `<journey>-overview.html` expands one journey over the guides seat. **A built repository starts with the hub alone and earns a domain page** when the tiles can no longer carry the path. Forbidden is the third copy: an overview restating another overview, or a section expanded twice under two names.
- **Every construct the pocket holds is linked from the hub — MUST.** Prove it by listing both sets and diffing them, never by scanning the page. A hub section standing over no construct is a **declared gap**, which is the honest kind and what the next workstream picks up; a construct the hub does not link is an orphan.
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

**A block is a visual insert, not a section shape.** Normal prose needs no block. Reach for one when the content is *not* a paragraph, a list or a table — a rule the reader must not skim, a picture, a fixed list of doors, a comparison. **The set is closed**: `MUST` · `CATALOG` · `COMPARISON` · `GLOSSARY` · `CODE` · `DIFF` · `TREE` · `PROSE` · `CARDS` · `NEXT`, plus the figure kinds below, and a new kind is a decision rather than an invention. Every block and every figure kind is written out, in the spelling you actually type, in [`blocks.md`](blocks.md) beside this file — read that before authoring a document with figures in it, and read a page template beside it. **Do not open the HTML blocks template**: it is the *rendered* reference a person opens, it costs about 16,400 tokens, and three quarters of it is stylesheet, inline SVG and script that the renderer and the drawer produce for you (decision RD.DOCS.076). Every `dg` example in the markdown form is executed by the drawer's test suite, so an example you copy draws.

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
at depth in the book's `01-devex/04-workspace/04-docs/01-corpus.md` § What the pattern binds). The voice reaches this book,
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
