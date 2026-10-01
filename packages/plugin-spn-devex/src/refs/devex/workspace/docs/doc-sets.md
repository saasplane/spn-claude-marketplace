<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/README.md",
      "seen": "a835892a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "seen": "f79c0389"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The masthead, and the opening",
      "seen": "de892b27"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The outline is fixed for an argument and borrowed for an explanation",
      "seen": "2c6b68b6"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md",
      "seen": "e85593fb"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/02-document.md",
      "seen": "811b3bf2"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/04-docs.md",
      "seen": "b700130e"
    },
    {
      "path": "spn-foundation/CONCEPT.md",
      "seen": "b91357a5"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.143",
      "seen": "449130e9"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.182",
      "seen": "926c1ff2"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.187",
      "seen": "126e2b90"
    }
  ]
}
-->

# Doc sets — the shape a repository carries

**Source of truth:** the corpus standard (`04-capabilities/01-devex/04-workspace/04-docs/`), with The Docs Tree construct (`02-constructs/01-devex/04-workspace/04-docs.md`) as the standing one-page view. The repository's `CONCEPT.md` sits above both as an outline: it names the domains and areas a tree divides by, and states no rule of its own. Read this file as a restatement of those chapters, adding none of its own. **The book governs**, so where the three disagree the standard wins and this file is regenerated.

**A repository has ONE docs tree, and it sits at the repository root.** Its seats divide by the
domains the repository's own concept names, never by the packages it ships (decision RD.DEVEX.WORKSPACE.070). A
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
| `README.md` | **node** root — package, app, module | this node in a paragraph, and links into the seats it realizes. About twenty-five lines, and **none of the house words** (RD.DEVEX.WORKSPACE.088 · RD.DEVEX.WORKSPACE.125) | scaffold, then by hand | the node's identity moves |
| `docs/README.md` | the repository's one docs tree | the tree's face — the seats, and the map | generated map, hand-written identity | the file set changes |
| seat face | `01-purpose` · `02-constructs` · `03-behaviors` · `04-capabilities` · `05-guides` | the fixed answer, distilled, plus the map below it | `FRAME`, then `develop` | the answer moves |
| domain folder | beneath a seat, named for a domain the **concept** names | that domain's share of the seat's answer | `plan` lands rows, `develop` proves them | rows land or change |
| capability chapter | `04-capabilities/<domain>/<package>/`, carrying the number of the **construct** it realizes | what this package does that the pattern does not | `develop` | the construct or the package moves |
| `registers/` | pocket, **governing nodes only** | the node's own rules and decision log | on a decision | a rule is decided |
| `artifacts/` | pocket, **authoring nodes only** | what the node authors — a moment captured | on request, never on initiative | someone asks |
| **intent comment** | every contract method and exported component | why this exists, in one line, harvested into the symbol index | `develop` (decision RD.SUPPORT.APPS.006) | the symbol's intent moves |

**Three rules resolve almost every case.**

- **Altitude decides, not topic.** The same subject is legitimately stated at several altitudes — a concept states the module's boundary, a seat face states what it does, an area file states how. Repeating one altitude at another is the defect; carrying a subject up and down the altitudes is the design.
- **A repo has one concept; a node has none.** However many packages a repo grows, ideating one of them lands as sections of the repo's concept. A `CONCEPT.md` beside a package manifest is always wrong.
- **Structure is fixed, depth is earned.** Seats exist from day one and a seat holding only its face is the compact state. Everything below a seat — a second file, a folder, a child node — exists only when there is content a reader would otherwise wade past.

## Before the shape — `CONCEPT.md`

**A concept belongs to a repo root, never to a node** (decision RD.DEVEX.WORKSPACE.080) — nodes carry `README.md` alone. The repo's `CONCEPT.md` sits at the repository root and states what the repo *is* — its boundary, the sections its shape calls for, the shape drawn, and the open questions.

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
  `README.md`, `data-model.md`, `surface-map.md`, `route-map.md`, `schema.sql`, `personas.md`, `registers/`, `artifacts/`,
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
derivable (decision RD.DEVEX.WORKSPACE.085).

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
├── module-server-iam-ts/
│   ├── README.md               the package face: the constructs it realizes, and those it does not
│   ├── data-model.md           contract term → table and column
│   ├── schema.sql              the tables this half owns, authoritative
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
  ask it (decision RD.DEVEX.WORKSPACE.138).
- **`data-model.md` sits beside the migrations it mirrors** — in the realizing package that owns
  `src/migrations` — and never in a half that stores nothing (decision RD.DEVEX.WORKSPACE.134). A capability is
  realized by halves and only the server half stores, so that is still one data model per domain: a
  domain has one migrations folder, and placement follows storage. It holds what a migration knows —
  which contract term is stored in which table and column — and defines no term, because the words
  are the constructs' own. **A domain that stores nothing writes none at all.**
- **A data model has three sections, in order**: `## Tables` (one row per table: `Table · Stores · The rule it keeps`), `## Indexes` (one row per index: `Index · Why it exists`, saying plainly when no query reads it), and an optional `## Seeds and order`. **A web half's `surface-map.md`** has one section per folder under `ui/`, each one table: `Surface · Kind · Contract term · What it is for`, where `Kind` is `page` · `component` · `widget` · `hook` and a surface is what the package's barrel exports. A wrong heading row is an outline finding.
- **`schema.sql` sits beside the `data-model.md` it is the authoritative form of**, in the
  capabilities seat and not in a pocket: migrations mirror it verbatim, and a repository with nine
  storage-owning domains has nine of them (`Q88`, 2026-09-18). One pocket cannot hold nine files of
  one name, and neither can one domain folder hold both halves' realizations.
- **Excluded by construction**: a private segment (anything under a `_`-prefixed path), a generated
  folder, build output, and `migrations/`. A migration's useful content is seeding and ordering,
  which is vocabulary and belongs to the data model (decision RD.DEVEX.WORKSPACE.086).

Which makes the seat checkable in every direction:

| Defect | What it means |
| --- | --- |
| a construct with no behaviours file at its own path | nothing can roll its status up, and the rows that would prove it are missing |
| a chapter naming a construct that does not exist | it describes something that no longer exists |
| a package the repository declares with no folder under `04-capabilities/` | the code grew a subject nobody wrote a topic for |
| a `04-capabilities/` folder naming no declared package | a chapter sits inside a package this repository does not have |
| a source folder the node's generated index shows no chapter for | a folder is documented by nobody, and now somebody notices |
| a `data-model.md` in a package with no `src/migrations` | a half that stores nothing wrote down storage |
| a domain folder holding a `data-model.md` beside its package folders | the file sits above the half that owns it |
| a pattern explained inside a chapter | the stack's standard was copied, and the copy is the stale one |

### A repository may have no `src/`, and the grammar still holds

Every rule above is written against `src/` because that is where almost every repository keeps its
source — but a repository declaring `GENERAL` has no nodes, and may have no `src/` and no `tests/`
at all. The marketplace's source is `packages/plugin-<name>/`; another general repository's is
whatever it is. **The grammar is untouched**: the seats are the same five, a chapter is still numbered as its
construct, and a construct with no behaviours file at its own path is still a finding.

**What changes in a general repository is only what a cell RESOLVES TO**, and the reason is the same
every time — nothing there derives from a node's kind, because there are no nodes:

| | What still holds | What it resolves to |
| --- | --- | --- |
| a **capability chapter's folder** | it names a package the repository declares, and every declared package carries one | a **plugin** is what it resolves to here, read from the marketplace's own declaration rather than from a manifest — a plugin is a package with no `spkind.json` of its own |
| a **behaviour** row | the id, `Who`, `Does`, `Sees` and `Type` | **`Tier` derives from a node's kind, and there is none** — so the row carries the repository's own runner or `—`, and `Status` stays `PLANNED` unless that runner writes it. Nothing owes a tier it cannot have |
| the **source-folder index** | it is generated, never a list somebody maintains | it has **no node to sit on**, because a node's own `README.md` is where it is generated. That is honest rather than a gap: a folder no chapter covers is still reported against the whole tree, which is where that finding belongs |

**The id is never relaxed.** A behaviour with no id cannot be cited, proven later, or found twice —
and a repository that cannot run a tier today may ship a runner tomorrow (`RD.DEVEX.WORKSPACE.176`).

## What each seat holds

| Seat | Holds | Reads as |
| --- | --- | --- |
| `README.md` | identity and orientation | what this repository is, and the map of what sits under it |
| `01-purpose` | why the repository exists | explains and persuades. Carries **no rules** — normative language here is a defect. It answers four questions — the problem it ends, the payoff of solving that once, what you get, and who it is for — and the check reads for the four answers, never for a file count |
| `02-constructs` | the model — one file per construct, under a folder per domain | contract terms: what a thing is, what it is made of, what it depends on, what it refuses. **A construct never appears before one it depends on**, and the face carries the order, generated from the declared dependencies and the concept's own sequence |
| `03-behaviors` | what a person can do — **one file of rows per topic**, beside the construct of the same number, with `personas.md` | in the foundation a **promise**: `Id · Who · Does · Sees · Type`, `Type` reading `PROMISE`, and **no status at all**, because this book ships no code that could write one. In a built repository the row is **proven** and carries the same cells plus `Where`, `Tier`, `Status` and `Updated at`, with a `Names` cell naming the promise it fulfils. `Updated at` is the instant the run finished, in UTC, then ` · ` and the run's name — `2026-09-30T18:54:19Z · full-1001` — and the proof check reads the run it names. Written in the consumer's own words. **A behaviour belongs to the domain that would have to change if the behaviour changed**, which is what its id's prefix names |
| `04-capabilities` | what must exist for that to be possible — in this book the standard for one topic; in a built repository **one chapter per construct per package that realizes it** | engineering content in the one voice (RD.DEVEX.WORKSPACE.106), and **normative wherever a consumer can violate the statement** — the sequence, the guard, the reason a rule exists (RD.DEVEX.WORKSPACE.098 · RD.DEVEX.WORKSPACE.133; see the altitude note below) |
| `05-guides` | how to use what was realized | task-shaped — install, mount, configure, run. It carries no id and nothing tests it; the face is the adoption path in phases, each naming the guides it takes |
| `registers/` | the repository's own rules and decisions | lookup material, consulted rather than read start to end |
| `artifacts/` | the overview and construct pages, and deliberate reports | authored source of truth. Nested folders allowed here and nowhere else; sub-folders carry no README |

**A domain face carries its glossary, and it is generated.** One table, three columns — the word a
consumer uses, the term the contract uses, and what it means — joined from every construct `Terms`
table in that domain, with the term linked to the construct that declares it. A `Terms` table of two
columns cannot be generated from, and the audit reports it.

**The glossary sits on the domain, not on the seat face.** A repository-wide table ran to 573 rows in the
foundation and 347 in the platform, where a domain's is twelve to a hundred and twenty-two — and a
term written twice in one domain sits in adjacent rows rather than two hundred apart. The seat face
keeps the domain table it already carries and no glossary.

**There is no *where it is stored* column.** It was joined from the domain's `data-model.md` and
named a table in none of 252 rows measured; deleting it repaired the defect that no correction to
the files could. Storage is read in the data model itself, which is grouped by table and says which
constraint matters and why each index exists.

**A domain's overview is its face in HTML**: it links into `artifacts/constructs/<domain>/` and
carries the same glossary. Extra reading paths beneath it carry none.

**The invariants between the seats hold this shape up, and the folders are only where they land.** A
domain folder exists only where the concept names that domain. The glossary is generated, never
typed. Every noun in a behaviour row resolves to the glossary. Every
`04-capabilities/<domain>/<package>/` folder names a package the repository declares, and every
declared package carries one. Every `SUCCESS` row resolves to a case and every cited id exists — a
promise carries no status, and a proven row names a promise that exists. A construct's dependencies
are acyclic and agree with the reading order. **`03-behaviors/` mirrors `02-constructs/` file for
file, both ways**, which is what a rolled-up status reads and what pairs a construct with its rows.
That pairing is of PATHS and never of rows: a behaviours file with no rows is honest wherever the
product is not built. The two youngest report SOFT, because a new check ships SOFT first. The
glossary one decides whether the shape was worth adopting — a hand-maintained glossary moves drift
rather than removing it.

**A capability chapter is the spec the code it names realizes** (decisions RD.DEVEX.WORKSPACE.098 · RD.DEVEX.WORKSPACE.133). It is **one chapter per construct per package that realizes it**, under the construct's own domain and carrying its number — `01-iam/module-server-iam-ts/04-sign-in.md`. The per-group mirror it replaced — `cache.md`, `contract.md`, `app.md`, `entry.md`, `ui-*.md` and siblings — is retired: a package's folders are not the reader's question, and 98 of those mirrors ran to 5,000 words restating a pattern the stack's standard already states once. **A chapter has four sections and nothing else**, each one there because something would otherwise be copied into it:

| Section | Holds |
| --- | --- |
| **Where** | a short table: each part of the construct, the place it lives in this package, and what that place is |
| **Follows the pattern** | one line per pattern that applies unchanged, each linking the stack's standard |
| **Special handling** | one entry per method, flow or rule the construct forces off the pattern — **why**, then **what**, then **how**, with one place in the code. This is the chapter's substance, and a chapter with nothing here should not have been written |
| **Between modules** | what this package takes from other modules for this construct, and what it publishes to them |

**The Where table is the only place a chapter declares code** (decision RD.DEVEX.WORKSPACE.191). A path named anywhere else declares nothing. A row names a seat: a file, or a folder that is one seat of its kind, and a seat folder covers its whole tree. `src/` itself declares nothing, and neither does a layer folder that holds many seats, such as `src/app/` or `src/ui/components/`. Each kind reads its Where paths from one folder: a web module from its `entry/ui/` folder, so a path begins `pages/`, `hooks/` or `components/`, and every other kind from its own folder, so a path begins `src/`. The stack states the seats per kind. Generated code is never a seat. A seat no Where row names is *Not written* in the coverage report, and never counted as built.

**Why comes before what**, because a reader given the rule can predict the handling. **Three things are deliberately absent**: no line-by-line walk, which the code's own comments carry; no proof rows, which are the behaviours seat's; and no known gaps, which live in the workstream's split plan and the behaviour row's status. **A chapter stays under 800 words**, and that is a consequence rather than a cap — everything long has a better home above it. The two altitudes bind different people: the book's standard binds everyone building anything, and a chapter binds whoever maintains this package. So the test is one statement at a time: **does it bind someone?** If yes it takes `MUST`/`MUST NOT`/`MAY`; if it binds nobody it is commentary — advice, rationale, a trade-off note — and stays prose. **A capability chapter is normatively dense by design.**

**The spec treatment reaches chapters only.** A seat face is a **map** of what the repository contains — *where does what live*, not *what must this code do*. So is the `04-capabilities/README.md` face, which routes, and so is `data-model.md`, which is a glossary. The seat's job differs by what is being documented: a chapter of a construct yields a spec, an index or an orientation yields a map. **Seat tables are in scope for modality; record tables are not** — glossaries, behavior-row tables, data models, registries and proof-gap tables keep their form. Modality comes from the page, never from a sweeper.

**`group` is the source axis; `area` is the top division of a seat.** A group is a published top-level source folder, and it is now the **symbol index's** vocabulary alone — the capabilities seat stopped sharing it the moment a chapter became named for a construct, and what carries the source-folder axis is the generated index on a node's own `README.md` (decision RD.DEVEX.WORKSPACE.138). An **area** is a folder, and the same areas divide all three *What* seats alike, so one number names the model, the rows and the standard of one thing. **The foundation has four — `01-devex` · `02-support` · `03-platform` · `04-launchpad` — and it is the only repository that divides this way** (decision RD.DEVEX.WORKSPACE.131); every other repository divides by domain with no area above it. Three rules bound the level: the concept names the areas, every seat that divides by domain divides the same way or none does, and **an area with no sub-areas holds its topic files directly** rather than a single child folder. **An area is a folder**, and `RD.DEVEX.WORKSPACE.084` states it as one.

## The artifacts pocket — concept, overview, construct page

The pocket holds what the node **authors** rather than derives, and its three authored kinds sit at three altitudes of one progression (decision RD.DEVEX.WORKSPACE.102). **Each is earned separately, and none generates the next.**

| Kind | Path | Holds | Earned when |
| --- | --- | --- | --- |
| **Concept** | `CONCEPT.md`, the repository root | the whole model, once — shape, never depth | the repo exists |
| **Overview** | `artifacts/overviews/<source>-overview.html` | one source expanded to reading depth, one level down | the fixed set below names it |
| **Construct page** | `artifacts/constructs/<domain>/<slug>-construct.html` | one construct at reading depth, produced from its seat file | a construct exists |

**A concept is not an artifact.** It sits at the repository root beside `README.md`, a scaffold marker written before `docs/` exists and read by somebody who may never open the tree. It is listed here because it is the first altitude of the progression, not because the pocket holds it.

**`constructs/` mirrors the constructs seat folder for folder**, with `<slug>-construct.html` beside each `<slug>.md` and **no `README.md` anywhere inside it**. That is what lets the audit pair a page with its seat file by path alone, rather than by an index somebody maintains.

**Four page kinds cover everything somebody writes by hand**, and each answers one reader: an **approach** for the person deciding, a **hub** for the person arriving, an **overview** for the person taking one reading path, and a **construct** for the person building against the model. Only the approach carries cards, and only the approach lives outside the pocket.

**An argument does not live here.** An approach document belongs to **the workstream that argues it**, in the workspace's planning centre, and it closes with that workstream. The pocket holds what the repository *states* and what somebody *measured*; where a design was weighed is the workstream's record. A pocket that also held the arguments made the two impossible to tell apart, which is how a stale argument came to be read as a statement of today.

**Two more kinds of page are produced by a command, and nobody writes them by hand** (decisions RD.DEVEX.WORKSPACE.218 and RD.DEVEX.WORKSPACE.219). Each is produced from its source and equals that source, as a construct page does.

| Kind | Path | Produced by | Produced from |
| --- | --- | --- | --- |
| **Guide page** | `artifacts/guides/<name>-guide.html` | `docs guide <guide.md>` | the guide's markdown in `05-guides/`, and `guide-template.html` |
| **The index of artifacts** | `artifacts/index.html` | `docs index <repository>` | the pages on disk, and `artifact-index-template.html` |

**Every repository has its getting-started guide and its test-and-verify guide as a page.** A newcomer needs these before any other guide: the first says how to start, and the second says how to check that a change works. Every other guide stays markdown, unless a developer asks for it as a page. A guide page is stages, and a stage is steps. A step holds why, the command and what you see, in that order. The stylesheet numbers the steps, so nobody types a number. A guide page has no status. Where `docs guide` finds no step in a guide, it reports the guide and writes nothing.

**The index opens every page of a repository from one place.** A tree of the pages sits on the left, in the groups Docs, Guides and Reports, and a group that holds nothing is left out. The pages open in tabs on the right. The index has no masthead and no header line, because it is a frame around other pages. `docs index` refuses a repository that has no `docs/artifacts`. The hub stays the page you read first: it explains the model, and the index is where you look for one file among all of them.

**The folder set is fixed, and adding one is a decision**: `overviews/`, `constructs/`, `guides/`, `reports/` and nothing else, beside the one `index.html`. A `resources/` folder for *what a document was written from* is refused by name: every such file is a file some seat needs, and **nothing in a pocket may be depended on** (decision RD.DEVEX.WORKSPACE.138).

### A construct page has six sections, in one order

**A construct page is produced, never authored.** What an author writes is the seat file, `02-constructs/<domain>/<name>.md` — the metadata block with its dependencies, the six sections, and each figure as a fenced specification. The page is produced from that, and **a page edited by hand is a defect**, because the next production overwrites it and the audit checks that a page equals what production would produce.

| Section | Goes in | Never |
| --- | --- | --- |
| **Overview** | why this construct exists: the problem in the reader's own terms, what changes because it exists, and what a first-time reader has to unlearn | describing the shape — that is the `Model`, and two descriptions of one thing disagree eventually |
| **Terms** | the words this construct gives a meaning to: the word a person uses, the contract term, and what it means | a word every engineer already knows; a row that points somewhere else instead of explaining |
| **Model** | what it is: what you are looking at, in prose first — the general shape, then its parts, then its kinds — with a figure where seeing is faster | a field list standing in for an explanation; an argument, which is the `Overview`'s |
| **Parts** | the detail of the what: one subsection per piece the `Model` named, in that order — what it is, why it exists, and the facts that shape it | a *Where:* line — which package builds it is answered by that package's own capability chapter; a heading the `Model` did not lead the reader to expect |
| **Boundary** | in plain prose: what this page does not answer, where that is answered, and when you go there | an edge stated before the reader has seen the shape |
| **Binds** | one table: the rules that hold it, each with what it decides and how much it binds | a rule repeated; a claim about which package builds it, or a state typed anywhere |

**A term appears in exactly one `Terms` table in a repository — MUST.** One source means one source per *term*, not per table, so the same word defined in two constructs is two sources whichever is read first.

**The owner is decided by the contract, never by reading order and never by which chapter reaches the word first.** The construct whose own contract declares the type owns the term; every other chapter that needs it points at that construct rather than repeating a definition that will drift.

**Nothing new is needed to carry the pointer, because `Boundary` already does** — it is the section that says what this page does not answer and where that is answered.

**The three sections that carry the argument divide by question** — `Overview` answers why, `Model` answers what, and `Parts` carries the detail of that what, one subsection per piece the `Model` named. **`Terms` comes second because the `Model` uses those words and the `Overview` does not**, and **`Boundary` comes after the parts** because a reader can judge an edge only once they have seen the shape. **The opening above the first heading is the masthead, and nothing else**: the Title, the Subtitle and the Description the next subsection states. Everything that argues moves into `Overview`. `Relations` is retired: the metadata block's `dependsOn` already carries what it listed, one way and machine-readable, and a section restating a declared field is a second copy that drifts.

**A construct types no proof — MUST** (decision RD.DEVEX.WORKSPACE.132). What proves it is the behaviour rows at its own path: `02-constructs/<domain>/<name>.md` is proved by `03-behaviors/<domain>/<name>.md` and by nothing else. A row's `Status` is written by the run that proved it, so never write one. In this book the rows are promises and carry no status at all. What a run proved is read in the repository's `tests` report.

**A construct's status is rolled up from those same rows, and never typed.** Nothing started, or no rows at all, is 🔮 `PLANNING`. Every row `SUCCESS` and carrying a `Tier` is ✅ `DONE`. Anything between the two is 🚧 `IMPLEMENTING`. `MANUAL` counts as started and never as proven, because no run writes it. **A construct in a `FOUNDATION` repository carries no `status` key and no `Status:` chip** — its rows are promises, and a promise has no proof state. Where the mirrored behaviours file is missing altogether, the derivation reports it rather than stamping 🔮 `PLANNING`: no rows means nothing ran, and no file means nothing was measured.

**There is no length cap on a page and none on a part.** What decides whether a part should become a construct of its own is a judgement about the concept — does a reader meet this on its own, with its own actor? — never a line count.

### Every page opens on a masthead of three levels

**Every page kind has a masthead of three levels — the Title, the Subtitle and the Description, in
that order — MUST** (decision RD.DEVEX.WORKSPACE.187). The Title names the page. The Subtitle says in
one sentence what the thing is, or what the page decides. The Description is the opening: one
paragraph that explains the page in everyday words. **The page's `summary` field is the
Description's first sentence, word for word**, so search, an index and the agent read the sentence
a reader meets first.

| Level | Where it sits | Carries |
| --- | --- | --- |
| **Title** | the `h1` | what the page is called. A construct's is its own name, in full — *Estate Shape*, never *Shape*. An overview's is its benefit line |
| **Subtitle** | `p.sds-subtitle`, directly under the `h1`. In a construct seat it is the `subtitle` field of the `spn:doc` block, which `docs page` renders | one sentence, in plain language |
| **Description** | one `p.sds-standfirst`, directly under the Subtitle, and nothing after it in the masthead. In a construct seat it is the first lead paragraph, which `docs page` renders as the standfirst | the opening, one paragraph, in plain language |

**What each level holds depends on the page kind:**

| Page kind | Title | Subtitle (one plain sentence) | Description (one paragraph) |
| --- | --- | --- | --- |
| **hub** (`concept-overview.html`) | the benefit line | the what line | what the plane is · why read this page first · how it is laid out |
| **repository overview** | the repository's benefit line | the repository's what line | what this repository holds · why read on · how it is laid out |
| **concept overview** (`concept-*-overview.html`) | the area's benefit line | the area's what line | what this area covers · why read on · what the pages below cover |
| **construct** | the construct's name | its one-line promise | what it is · why read this page · how the page runs |
| **report** | its name, such as *Coverage report* | the question it answers, naming the repository by its folder name | what was counted, with no number · when to read it |
| **approach** | the page's name | the decision it plans | what changes · why read it · how the page runs |
| **preview** | the preview's name | what you are asked to decide from the page | what the page shows · why look at it · how the page runs |

**Every level is plain language — MUST** (decisions RD.DEVEX.WORKSPACE.182 and
RD.DEVEX.WORKSPACE.187). A reader lands on the page without knowing yet whether it is the one they
need, and reads the Subtitle before the Description.

- **Everyday words, in short sentences with one idea each.**
- **No numbers, no slogan, and no figure of speech.** A figure of speech cannot be worked out from
  its words by somebody reading English as a second language.
- **No book word unless the same sentence explains it**: *behaviour*, *construct*, *lens*, *kind*,
  *node*, *seat*, *tier*, *arc*, *estate* and *ring*.
- **The argument goes in the first section**, below the first heading.

**The Description is one paragraph, in the standfirst's place — MUST.** The first sentence says what
the page is about, in everyday words. The second says why you would read it. At most two short
sentences follow, on how the page is laid out, and there is no second paragraph. **A report's
Description carries no number**: the count moves to `Summary` and to the `summary` field.

**The one exception is the foundation's hub, whose Title and Subtitle are
RD.DEVEX.WORKSPACE.143's, word for word.** No other page copies that pair's style, and the
Description under it still says in everyday words what SaaS Plane is.

**Write the Title and the Subtitle of every page kind yourself, and keep them current as the page
grows — MUST** (`RD.DEVEX.WORKSPACE.205`). Read the kind's row, hold your draft against the approved
example and the poor ones for that kind, run the check below, and name the change to the developer in
one line. Do not ask them to approve one. A Subtitle that exists today moves into place only if it
already passes the plain rule; otherwise write it again. A preview page's Title is the preview's name,
and its Subtitle says what the developer is asked to decide from the page.

**An approach page's masthead carries no project shorthand either** — an arc number, a question
number or a release name, such as *N116* or *R2*, that the same sentence does not explain. The
workstream's number that opens its `h1` comes from the folder's name, and it is not part of the
Title: the Title is the page's name, the same words as the rail title.

**A page template holds only its structure — MUST** (decision RD.DEVEX.WORKSPACE.182).
Its sections in order with their ids, the slots an author fills (`{{…}}`), the blocks it may reach
for, the two lines that load the shared stylesheet and script, and one comment at the top naming the
chapter sections that govern it. **The
rules for filling it are stated here and in the chapter, never in the template** — what each level
holds, the approved mastheads, the poor examples and the check before saving. A rule written into a
template is a second copy that a reader takes for that kind's rule alone.

**The approved mastheads, one for each page kind.** Hold a new masthead against the one for its
kind: a good example beside a poor one shows the difference faster than the rule states it.

| Page kind | Title | Subtitle | Description |
| --- | --- | --- | --- |
| **construct** — the workstream | *The Workstream* | *Your work stays together in one folder, even after you close the window you started it in.* | *A workstream is a folder that holds one piece of work, from the first idea until you close it. Read this before you start a change that will take more than one working session. The page explains how the folder is named, how it moves between waiting, open and closed, and what is checked before you can close it.* |
| **hub** — the foundation's | *Your team's time belongs to your product.* | *The AI-native, DevEx-first Foundation for Building and Launching Secure, Scalable, Compliance-ready SaaS Platforms.* | *SaaS Plane is a set of standards, tools and code libraries for building software that customers use over the internet. Read this page first to see how the parts fit together before you open any of them. Each area below links to the page that explains it in full.* |
| **concept overview** — `concept-devex-agent-overview.html` | *The agent is a member of the team, not a tool beside it.* | *The SaaS Plane DevEx Agent: what it is, what you can ask it to do, and how it works in your folder.* | *This page explains the coding agent that works with you in this workspace. Read it before you install the agent or ask it for anything. The pages below cover how a session opens, the skills it runs, and the roles it looks through.* |
| **repository overview** — `spn-support-ts` | *Every app starts from the same shape.* | *The TypeScript backbone every SaaS Plane app is built on.* | *This repository holds the TypeScript libraries and the command-line tool that every SaaS Plane application is built from. Read this page to find the part you need before you open its code. Each area below links to its own page.* |
| **approach** — `plain-language-approach.html` | *Plain Language* | *Decides how every page in the book opens, and how the agent talks to you.* | *This page plans a change to how the book's pages open and to what the agent says when you open a new window. Read it before you review the work it lists. Why comes first, then what changes, then how the work runs.* |
| **report** — the tests report of `spn-support-ts` | *Tests report* | *Which of the things spn-support-ts promises are checked by a test that passed?* | *This report shows which of the things this repository promises to do are checked by a test that passed, and which are not yet. Read it before a release, or when you want to know what is still unproven.* |

**The poor examples, one for each level.** Each fails for the reason beside it.

| Page kind | Level | Poor example | Why it fails |
| --- | --- | --- | --- |
| construct | Title | *Work That Outlives the Window* | a slogan in place of the construct's name |
| construct | Subtitle | *A scope of work, not a window: the log records, and the page decides.* | a figure of speech, and it promises nothing a new reader can use |
| construct | Description | *Arcs, orders and samples sit together here until the close gate passes.* | it opens with a book word (arc) that nothing explains, and it never says why you would read on |
| hub | Title | *Ship at warp speed.* | a slogan and a figure of speech, and it names no gain a reader can check |
| hub | Subtitle | *One plane, zero plumbing, infinite scale.* | figures of speech, and it never says what the thing is |
| hub | Description | *Four areas and twelve domains, each a node with its own seats.* | it opens with a count, and two book words (node, seat) that nothing explains |
| overview | Title | *Agents, reimagined.* | a slogan, and it names no gain a reader can check |
| overview | Subtitle | *The agent wears the lens, and the workspace wears the window.* | a figure of speech, and a book word (lens) that nothing explains |
| overview | Description | *Seven nodes share one window, and every seat has the same shape.* | it opens with a count, and two book words (node, seat) that nothing explains |
| approach | Title | *Say It Straight* | a slogan in place of the page's name |
| approach | Subtitle | *N116 pays one cycle: R2 ships the loop, and every seat follows.* | project shorthand and a figure of speech, and it never names the decision |
| approach | Description | *Nine arcs rewrite every seat's opening before the release.* | it opens with a count, and two book words (arc, seat) that nothing explains |
| report | Title | *Proof or It Did Not Happen* | a slogan in place of the report's name and subject |
| report | Subtitle | *Where the rubber meets the road for every promise.* | a figure of speech, and it asks no question |
| report | Description | *72 of the 119 behaviours are proven at their tier.* | it opens with a count, and two book words (behaviour, tier) that nothing explains |

**Before you save a masthead, check it in this order.**

1. The Description's first sentence says what the page is about in everyday words. On a report, it
   says what was counted; on an approach, what changes.
2. Its second sentence says why, or when, you would read the page.
3. No book word appears in any level unless the same sentence explains it, and on an approach no
   project shorthand either.
4. No level carries a number. A report's counts are in its Summary, and the workstream number that
   opens an approach's `h1` is not part of its Title.
5. The Subtitle is one plain sentence. On a report it is a question that names the repository by its
   folder name, on an approach it names the decision the page plans, on a preview it names what you
   are asked to decide, and on the foundation's hub it
   is `RD.DEVEX.WORKSPACE.143`'s, word for word.
6. Read the three levels aloud once, and rewrite any sentence you stumble on.

### The templates sit beside the chapters, in `templates/`

Every page somebody writes by hand is copied from a template, and the templates live in the docs domain's own `templates/` folder — beside the chapters that state their rules. **A template holds a page's shape — its sections, its slots and the two lines that load the shared stylesheet and script — and no rule**, so a rule is stated in one place only. **A seat may hold that one folder that is not documents.** It is unnumbered, because you consult a template rather than reading the set in order, and it is excluded from the document checks **by the folder rather than per file**: a per-file exemption is a hole, and a named folder is a rule. **Each template names the chapter sections that govern it**, at the top of the file; a change to a template's shape is edited in the template, and `restates files` reports a plugin copy that has fallen behind it.

| Folder | Holds | Shapes |
| --- | --- | --- |
| `templates/pages/` | `hub-template.html` · `overview-template.html` · `construct-template.html` · `guide-template.html` · `artifact-index-template.html` · `report-template.html` · `blocks-template.html` | the page kinds a repository has — hub, overview, construct, guide and the index of artifacts — and the report; the blocks template shows every block and figure kind rendered |
| `templates/seat-files/` | `construct-seat-template.md` · `schema-template.sql` | what an author writes *inside* a seat: the markdown a construct page is produced from, and the authoritative data model |
| `templates/workstream/` | `approach-template.html` · `approach-preview-template.html` · `arc-template.md` · `order-template.md` · `handover-template.md` | the workstream's own files. **The approach document is here because an argument is a workstream's**, never a repository's |
| `templates/agent/` | `skill-template.md` · `agent-template.md` · `lens-template.md` · `ref-template.md` · `hook-template.ts` | the agent's own files — hand-written too, and a kind with no template gets written from the last one its author happened to see |

**The plugin and the CLI carry different sets, because they answer different moments.** `pages/` and `seat-files/` ship in both, since the agent copies one to write a page and `repo create` emits a started hub page. `workstream/` and `agent/` ship in the plugin alone: the CLI creates a workstream folder with `mkdir` and owes no shape, and it never writes a skill. The copies are stamped with the book's hash and exported on release, so a release whose copies disagree with the source fails rather than publishing drift.

**A scaffold beats a template, a template beats a document, and a document beats a conversation.** Where the CLI creates a file, that scaffold *is* the template and none is kept in the book — a seat face, a behaviour file, a capability chapter and the glossary are all made that way.

**The page templates, and the seat files behind them**: `hub-template.html` for the one hub a repository has, `overview-template.html` for one reading path or the hub of a repository other than the foundation, `construct-template.html` for a produced construct page (`docs page` copies its two lines that load the shared stylesheet and script into every page it produces), `guide-template.html` for a guide page that `docs guide` produces, `artifact-index-template.html` for the index that `docs index` produces, `approach-template.html` for a workstream's argument, `approach-preview-template.html` for a preview page in a workstream, and `report-template.html` for a report — one shell for all five report types. `construct-seat-template.md` is the seat file an author actually writes, and `capability-template.md` one capability chapter. `blocks-template.html` is copied into nothing: it shows every block and every figure kind rendered, and you consult it beside a page template. **A hub has no link above its rail** (decision RD.DEVEX.WORKSPACE.220): it is the root, so no page sits above it for a link to lead back to.

**The rules every page kind shares are stated once, in the chapter, and no template repeats them**: headings carry no count and are never links, numbers are for file names, the book's own words are translated, and a card is a title, a description and a *Read more*. **The book's own words are translated on every page a newcomer reads**: say *the agent's viewpoint*, and note once that the book calls it a lens. A word a first-time reader cannot guess is explained where it first appears, or replaced by the plain word. A count is never an explanation: *the eight phases* tells a newcomer nothing, so say what the phases are. A door is a *Read …* line under the text, naming what it opens in the words the heading already carries — *Read Agent →*. A card that carries an action — a link or a button — keeps it at the card's bottom edge: the cards of one row are as tall as the tallest, so the actions line up however long the text above each one is.

**They do not share a lifecycle** (decision RD.DEVEX.WORKSPACE.088). Two describe a moment; one renders something live.

| Kind | Produced | Its relation to today |
| --- | --- | --- |
| **Report** — a measurement | on demand | none. A report of last month is a correct report of last month, and the next run supersedes it |
| **Approach** — an argument | on demand, when a design is argued | none is a defect. **Ahead** leads the code as a concept does, **level** means it landed, **behind** is a correct record of then |
| **Overview** — a face | **maintained.** A workstream changing the model owes it | it **tracks its seat**. Drift from `CONCEPT.md` is a defect, and `coherence.py` reads it |

**An instruction is recorded before it is executed — MUST.** The developer instructs and corrects while the work runs, and each one is written down before it is acted on. An instruction becomes a step row in the arc that owns it. A correction becomes a log line and a rewrite of the row it corrects. A question nobody can answer alone becomes an `Open` card, argued in the page rather than in chat. A session's context ends with the session, so anything held only there is work nobody can pick up.

**A row's State cell says what it reached while the work runs**, so the developer can see what they asked for that has not happened yet:

| State cell | Means |
| --- | --- |
| empty | the row is written down. Nothing has been built |
| `in progress 2026-09-29 14:32 +05:30` | somebody started the row at that moment and is working on it now |
| `◐ stopped` | somebody began the row and put it down, with what was done and what is unsafe to touch |
| `⏸ held on Q<n>` | the row waits for the answer to card `Q<n>`, because that answer can change it |
| `✅ landed` | the change is in the repository that owns it, with the commit beside the word |
| `↷ carried` | the work moved to another workstream, which is named |
| `⊘ deferred` | the work is parked on purpose, with the event that brings it back |

**A row that starts is marked `in progress` with the date, the time and its offset — MUST**, and landing replaces the mark with `✅ landed` and the commit.

**A row you started and put down gets its own mark, and it is `◐ stopped`.** None of the others fits: `in progress <time>` says somebody is on it now, and a bare cell says nobody has started it, while half an edit already sits in the tree. The mark carries four things, because only the agent who stopped knows any of them — `→` what has to happen before it resumes, `did` what already reached its node, `left` what did not, and `unsafe` what nobody may touch until it resumes.

**A row that only waits on a card's answer, with nothing half-done, is held rather than stopped.** It carries `⏸ held on Q<n>`, because nothing in it is unsafe to touch and the answer alone frees it (decision RD.DEVEX.WORKSPACE.188). A row that began and then met the question is stopped, and its `→` names the card. A held row is not runnable work while its card is open; when the card is answered, the answer is recorded, the mark goes, and the row runs again.

The last three are what the close sweep asks of every row, and an empty row, a row in progress, a stopped row and a held row all refuse the close. **`carried` means the work LEAVES this workstream**, so it names a successor scope that can receive it — another workstream, in `open/` or `backlog/`. A row pointing at a later arc of its own workstream is **sequencing**, not a carry, and it resolves through that arc: landed once the arc lands, pending while it has not. **The close refuses a stopped row**, and that is the one place it differs from deferred: a deferred row was parked before anything was touched, and a stopped one was not. You finish the work and mark the row landed, or you split it in two — the half that reached its node becomes a landed row, and the half that did not becomes a second row, carried or deferred.

**Carry the face and the arguments inside the workstream that changes them**, rather than tidying them afterwards. A workstream runs concept → docs → code, so the model moves first and the face moves with it. Leave the face to a later pass and the hub states a model the code has already left. Expansion is earned the same way. Where implementing a workstream shows a section is too big to review in place, the face gains one then — that is when somebody has read it at depth.

**Never rewrite an argument to read as though it had always argued the current shape.** That destroys the only record of what was weighed. A face is the opposite — drifting from its seat is exactly how it goes wrong.

**The outline is fixed for an argument and borrowed for an explanation.**

| | Outline | Carries `Open` / `Deferred`? |
| --- | --- | --- |
| **Approach** | **fixed** — an opening paragraph, then `Why` → `What` → `How` → `Open` → `Deferred`, nothing else, in that order. There is no `Terms` section: a word the reader may not know is explained in brackets where it first appears | yes — they are the argument's organs |
| **Overview** | **borrowed** — the headings of what it expands, in that thing's order | **no** — a question found while writing one is an approach waiting to be offered, or a register row |

**An overview never invents a heading its source does not have.** Lining the two outlines up is what proves it expanded rather than restated. **A settled approach legitimately lacks `Open`** — the design closed — so a missing `Open` is not a routing signal. The skeleton is: **`Why` + `What` + `How` present means it argues.**

**Depth is decided by where else the detail lives** — the kinds are not *more* and *less* detailed, they are detailed in different places.

| | Compresses | Expands |
| --- | --- | --- |
| **Overview** | everything — the source carries the depth | nothing; reaching the source's depth makes it the second copy the pocket forbids |
| **Approach** | the **mechanics** — concepts and boundaries, never an inventory of rules the chapters own | the **reasoning** — options weighed, costs accepted, the preview that made a choice judgeable |

A register row records *what* was decided, never the options that lost or what they would have cost. That is why an approach carries its reasoning in full, and why `Open` cards run deeper than the body around them.

**The suffix names the kind, and the set is closed** (decision RD.DEVEX.WORKSPACE.103). It is `-overview.html`, `-construct.html`, `-approach.html`, `-report.html`, `-preview.html` and `-guide.html`, and nothing else. A suffix equals the metadata block's `variant`. The index of artifacts is named `index.html`, with no suffix, and its variant is `index`. The routing test is one question: *were options weighed and one chosen?* Yes → `-approach`. No → `-overview`. A document with no options, no recommendation and no accepted cost is an overview whichever folder holds it.

- **The overview set is the hub, one page per domain, and one more for every further reading path** (decision RD.DEVEX.WORKSPACE.154). A reading path is a run of constructs somebody reads in order to decide one thing. **The first page in a domain is owed; every one after it is earned** — a hub with nothing beneath it dead-ends at the first click, so the middle rung exists wherever a domain has construct pages at all. `concept-overview.html` is the concept's readable HTML face, the hub, one per repository; `concept-<domain>-overview.html` is a domain's own face: it gives each of that domain's topics a section of its own, which summarizes the construct and ends in one door to its construct page, and it carries the domain's generated glossary (§ What an overview and a hub hold, section by section).
- **Every construct the pocket holds is linked from the hub — MUST.** Prove it by listing both sets and diffing them, never by scanning the page. A hub section standing over no construct is a **declared gap**, which is the honest kind and what the next workstream picks up; a construct the hub does not link is an orphan.
- **Keep reports under their own name** in `reports/`, as `<kind>-report.html`. What a report is — its report types, its header, its five sections and who decides what it finds — is the foundation's construct *The Report*, and the `report` skill carries how to write one. **There are five kinds and the set is closed**. `audit` asks whether the repository is set up the way the standard says, and never reports a finding another report owns. `code` finds where the source departs from the stack's standards, and `docs` where the corpus departs from the docs standards. `tests` says what the tests have proved and what nothing has proved yet. `coverage` says how much is written, built and proved, per domain, per app, per package and for the repository, and never lists a row (RD.DEVEX.WORKSPACE.191); its numbers come from `spn-devex coverage measure <repo> --json`. A `MANUAL` row, proved by a person following the repository's browser guide, counts in none of the coverage or tests numbers; both reports list it in one Findings line and a Records group, *Proved by hand*. Each one is replaced in place by the next report of its kind, so a pocket never holds six audits nobody will re-read. A report kept because the moment mattered — an incident, or what one release carried — is dated in its filename and never overwritten, and a new kind is a decision entry rather than a new filename. **A report is written by the agent and not produced by a command**: it reads the repository and fills the template, which is how it can name a fault no check could. **A report is written or refreshed only when somebody asks for it** (RD.DEVEX.WORKSPACE.212): a release, a close or a finished run is not a reason, and stamping the rows stays part of every run. **A report fixes nothing itself**: the agent opens an arc for the records it may close and a question card for each the developer decides. **A report is never published unless the developer asks** (RD.DEVEX.WORKSPACE.117); it is handed over as a full path. **A source a seat cites is not the pocket's to hold**, and one sentence decides it: **nothing in a pocket may be depended on.** A pocket once carried a `resources/` folder for *what a document was written from* — and every such file was a file some seat needed, so every one was a seat depending on a pocket. It is gone, and a fact a seat needs lives in a seat: the node's *why* in `01-purpose/`, what consuming it observably does in `03-behaviors/`, its *how* in `05-guides/`. The same sentence keeps the templates with the chapters whose rules they restate, and `schema.sql` in the capabilities seat beside the `data-model.md` it is the authoritative form of (`Q88`).
- **Nothing here is validated against current state.** An artifact records a moment, so a checker that flags one for disagreeing with today's tree has misread what it is looking at.

**An approach document is never kept in step with code.** It argues at a moment, so three relations are all legitimate: **ahead**, **level**, and **behind**. **Ahead** is arguing something not built yet — early iteration, leading the code as a concept does. **Behind** is a correct record of what was argued then. A design can reach an empty `Open` long before a line exists, and is complete at that point. **The defect is a silent rewrite** — editing one to read as though it always argued the current shape destroys the only record of what was weighed and rejected. Flag the contradiction; leave the artifact as the moment it was.

### What an overview and a hub hold, section by section

**An overview is written for somebody new, and that includes the hub.** It assumes no earlier
reading. It says at the start who it is for and what the reader can do after reading it, explains
each word on first use in words the reader already has, and tells a first-time reader what to
unlearn.

**A domain overview runs in one order**:

1. **Overview** — the reading path in a paragraph, and what you can decide after reading it.
2. **One section per topic, in reading order.** Its heading carries the topic's name in full, never
   its number. It holds a summary you can decide from — what the topic is, what it fixes, what you
   would decide there — then a *Decide here* line naming that decision, then one door: a *Read …*
   line that opens the construct page, named by the words the heading carries. The *Decide here*
   line is not a door.
3. **The rules the path shares**, only where a rule is decided on one page and relied on by the
   others: one sentence for the rule, then the check that enforces it.
4. **Glossary** — generated on a domain overview. `docs face` writes it between its markers, three
   columns grouped by construct in the domain's reading order, and nobody types a row inside them.
5. **Where to go next.**

An overview has no status and no cards.

**The hub is the concept at reading depth.** Its Overview takes each promise the Subtitle makes, one
subsection each. The concept's narrative sections follow as they are, each with its figure. Then one
section per area, then Glossary, then Where to go next.

- **An area section explains the area before it hands out any tile** — what the area is, why it
  divides as it does and who reads it — with a figure where seeing is faster. Tiles alone are not a
  section.
- **Each sub-area carries a *How to read it* line for a first-time reader**: the one thing to know or
  unlearn before choosing, then for each reading path what it covers, when you read it and what you
  can decide after it. A sub-area with one reading path ends in one door under its text; one with
  several ends in one tile per path.
- **A hub's Glossary is written by hand, with two columns: *Term* and *What it means*.** The term
  links to the page that defines it. There is no *Contract term* column; the generated three-column
  glossary belongs to each domain (decision RD.DEVEX.WORKSPACE.150).

**The rail is built from the markup.** Every `<section id>` becomes an entry, named from its `h2` up
to the em dash, and every `<h3 id>` inside it an entry under it. A heading with no `id` never reaches
the rail, which is why a template ships every section and subsection with one. **The side gutter is
`8px` on every page, at every width, except a report at phone width (`40rem` and below), which takes
`16px`.**

### Every page links one shared stylesheet, in one version

**Every page links one shared stylesheet and one shared script, and holds no styles of its own —
MUST** (decision RD.DEVEX.WORKSPACE.214). The stylesheet is `sds-docs.css`, and the script is
`sds-docs.js`. Between them they carry the colours in both themes, the outline rail, the fold, the
badges and the link on each heading. A page that holds a copy of its styles keeps the faults of the
day it was written. With one shared file, a fault is fixed once, for every page that links the file.

**A stored page links one version by its address, in two lines.** A stored page is one that sits in a
repository or in a workstream's folder. The stylesheet's line sits at the top of the page, and the
script's line sits at its end.

```html
<link rel="stylesheet" href="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.0.0/sds-docs.css">
<script src="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.0.0/sds-docs.js"></script>
```

- **It holds no `<style>` block and no inline script.** `docs audit` refuses a page that holds either,
  and the check on a page refuses a link to a version that nobody cut.
- **A version is a folder that never changes.** `docs sds cut <version>` writes it, and it refuses a
  version that exists. A change to the styles is a new version, and
  `docs sds repoint <version> <folder>` moves every page under a folder to it.
- **That address is the one hosted address a page may hold.** Every link from one page to another
  stays relative.
- **A stored page needs the network once.** Your browser fetches the shared files the first time you
  open a page of that version.

**A published page carries its version's styles inside it — MUST** (decision
RD.DEVEX.WORKSPACE.215). The publishing host does not load a stylesheet from the version's address,
so a published page that links out arrives with no styling. `docs sds bundle <page>` writes a copy
beside the page, named `<page>.bundled.html`, with the stylesheet and the script inside it. You
publish the copy, and the stored page keeps its two lines. The check before a publish refuses a page
that links a stylesheet from outside, and it names the command. **A page that somebody reads with no
network is bundled the same way**, so send the bundled copy to a reader who is offline.

**Every class and every token of ours opens with `sds-` — MUST** (decision RD.DEVEX.WORKSPACE.216).
One search for `sds-` finds every name of ours in a page, and no name of ours meets a Tailwind
utility. A name is a whole word: `sds-key`, never `sds-k`. A state that a script sets opens with
`is-` or `has-`, such as `sds-is-current`. A result takes a status word. So the Subtitle is
`p.sds-subtitle`, the Description is `p.sds-standfirst`, an open card is `div.sds-open`, and a decided
card is `div.sds-card`. `blocks-template.html` shows every class rendered.

**A status is a set of classes of its own, and never a tone of the palette** (decision
RD.DEVEX.WORKSPACE.217). The statuses are `sds-info`, `sds-success`, `sds-warning` and `sds-error`,
and one of them on a badge or a callout says how a thing stands. The palette's tones are blue,
green, amber, red, violet, cyan, pink, olive, orange and grey. They are for a drawing or a chart,
each is one class such as `sds-tone-violet`, and a tone carries no meaning. A
chart takes its series from violet, cyan, pink and olive first, so that a red line is not read as an
error. **No page declares a token of its own.** A repository that needs other colours asks for a
version of the stylesheet that has them.

### Steward, never manufacture

**Coverage never forces an artifact into existence** (decision RD.DEVEX.WORKSPACE.104). A concept section with no overview and no approach document has not needed one yet — a fact worth reading, not a gap worth filling. Four obligations, none of which generate content:

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

**A block is a visual insert, not a section shape.** Normal prose needs no block. Reach for one when the content is *not* a paragraph, a list or a table — a rule the reader must not skim, a picture, a fixed list of doors, a comparison. **The set is closed**: `MUST` · `CATALOG` · `COMPARISON` · `GLOSSARY` · `CODE` · `DIFF` · `TREE` · `PROSE` · `CARDS` · `NEXT`, plus the figure kinds below, and a new kind is a decision rather than an invention. Every block and every figure kind is written out, in the spelling you actually type, in [`blocks.md`](blocks.md) beside this file — read that before authoring a document with figures in it, and read a page template beside it. **Do not open the HTML blocks template**: it is the *rendered* reference a person opens. It is much larger than the markdown form, and most of it is markup and inline SVG that the renderer and the drawer produce for you (decision RD.DEVEX.WORKSPACE.136). Every `dg` example in the markdown form is executed by the drawer's test suite, so an example you copy draws.

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

`SYSTEM` is a constrained `MAP` (decision RD.DEVEX.WORKSPACE.135), and it is the kind you will reach for most when documenting a repository. Derive it from the source rather than from a template:

1. **The container is the module**, and its name is the module's own. Anything outside it is something the module talks to.
2. **Read `entry/` for the doors.** Each door is its own box — `api`, `cli`, `queue` — and each is met by whatever knocks on it. **Draw the doors the module actually has**: a module with only `api` gets one door, and pretending otherwise draws a fiction.
3. **Read `app/` for the middle layer** — `services` and `repositories`, with `entities` and `utils` beside them.
4. **The layer at the foot is what the module is given or publishes** — `config` (the environment it is started with) for a deployable, `contract` (the surface its siblings import) for a module inside one.
5. **Read the imports for the outward edges, and attribute each to its layer.** This is the load-bearing step, because which layer owns an edge is a claim about the code. A **repository reaches the database and nothing else** — a repository importing a file store is a finding, not a drawing. **Services** reaches the queue, the cache, transactions, the file store and sibling modules.
6. **Give each outside thing the shape of what it is**: a store is a cylinder, a cache a cylinder you can afford to lose, a queue a pipe, an object store a bucket, a client a window, a way in a chevron, a service a plain rectangle.
7. **Draw every starting point, and the edges that close a loop.** A system is entered from more than one place, and some flows come back.

**Worked examples**: `samples/prj-module-system.html` is one derived from real source; the blocks page carries server, web and estate drawn on identical geometry, which is the point of the kind.

### The geometry is checked, so do not tune it by eye

`checkFigures` in `spn-devex/hooks/lib/figures.ts` reads every figure on every produced page and reports what it finds. The numbers it holds you to: **24** between unconnected shapes and parallel connector runs · **56** where a connector joins two boxes · **16** padding, leaf and container alike · **36** minimum visible shaft · **8** of clear air between a label and any shape or arrow · a side offers **three** attachment points and a lone arrow takes the middle of its side.

**Hand-placed geometry does not survive these rules.** Drawing one `SYSTEM` figure by hand took more than twenty rounds against the check, and every fault was caught by a rule rather than by eye. Use a `dg` fence.

## Metadata

Every document opens with an invisible block holding **strict JSON**, marked `spn:doc`, followed by the title and a tag line rendered from it (decision RD.DEVEX.WORKSPACE.082).

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

- `stages` is optional — only where a document belongs to one DevEx stage, such as a guide.
- **A construct's block keeps eight keys and no more**: `id`, `variant`, `title`, `subtitle`, `lenses`, `status`, `dependsOn` and `summary`. `subtitle` is the one plain sentence under the title, and `summary` is the Description's first sentence.
- **A report carries no `status`, and adds `reportType`, `repository` and `generatedAt`** (RD.DEVEX.WORKSPACE.192). `reportType` is one `SPDocReportType` value: `COVERAGE` · `TESTS` · `AUDIT` · `CODE` · `DOCS`. `repository` is the repository it measured, by its folder name, and the header shows it as `Repo:`. A report is a snapshot, so neither its block nor its header carries a status, and it makes no comparison with an earlier report. `generatedAt` is the moment the page was generated, a date and a time with its offset, such as `2026-09-30T12:57+05:30`; the header's second line reads `Repo: … | Commit: … | Generated: …`, with Generated in the reader's own time zone and format. A `tests` report also carries `measuredAt`, the newest `Updated at` among the rows it read, stated in *Measured* and never in the header. No other report carries `measuredAt`. A `tests` report with no stamped run leaves `measuredAt` out of its block, and says in *Measured* that no run is stamped. It never writes `null`.
- **There is no `part` and no `altitude`.** Everything else is derived: the **seat** from the path and the **kind** from the node's manifest. The voice is one (RD.DEVEX.WORKSPACE.096). The seat decides what a document carries, never its temperature.
- **`lenses` are derived from the kind, not authored per page** (decision RD.DEVEX.WORKSPACE.100) — one derivation, two clauses, because runtime says *where code runs* and `lenses` says *who reads it*. A kind you **build on** (support, module, app, client) derives from its declared runtime: `SERVER` → `SERVER_DEV`, `WEB` → `WEB_DEV`, `UNIVERSAL` → both. A kind that **serves building** — `TOOLCHAIN` and `APP_UTILITY`, and only those two — carries both whatever its runtime, because every builder uses it. Read the declared runtime, never parse the name. `ARCHITECT` is added by **seat**, never by kind. A node's doc face (`docs/README.md`) is the orientation page and carries it for every kind, leaf nodes included. The seat faces beneath it (purpose, constructs, behaviors, capabilities, guides, artifacts) carry the derived developer lenses alone. `ARCHITECT` there is authorship a scaffold never emits. The other six lenses are authored, never derived. A page MAY narrow the derived set where its subject genuinely serves one runtime, and MUST NOT widen it. **A scaffold template emits the derived set**, which is what makes generated pages compliant by construction.
- `id` is identity and **never changes**, however the path does. The path is only its current address.
- **Status is the state of what the document governs, never of the prose**: `DONE` ✅ · `IMPLEMENTING` 🚧 · `PLANNING` 🔮. An overview, a construct in a `FOUNDATION` repository and a report carry none.

## One voice — the warm learning register

The corpus speaks one voice (decision RD.DEVEX.WORKSPACE.096, sharpened by RD.DEVEX.WORKSPACE.106 and RD.DEVEX.WORKSPACE.107): **every document is written for someone learning, while law keeps its force in every rule.** Writing or reviewing any doc, apply:

1. **Teach in build-up order** — show the thing, name it, then state its rule; the rule lands as the conclusion of something your reader now understands.
2. **Talk to your reader** — second person, present tense, active voice; momentum over ceremony. Three moves get you there, and the sentence decides which one fits (below).
3. **Every rule keeps its teeth** — exact terms, exact constraints, MUST-grammar wherever a statement is normative. Precision is part of the kindness. Force lives in the exact term and the MUST, never in a dense sentence: splitting a normative sentence changes neither (RD.DEVEX.WORKSPACE.106).
4. **The plain substrate** — one idea per sentence, and the rule stated literally before any story. No load-bearing metaphors, parables, aphorism-led paragraphs, or personification. Bold marks rules and terms, never emphasis; house terms glossed on first use per chapter.
5. **The warmth budget** — at most one light aside per section, never inside a rule's own sentence; *conversational and friendly without being frivolous*.
6. **Personas choose content, never temperature** — capabilities speak to engineers, behaviors to product personas; the lens picks the examples.
7. **The register governs prose, never records** — behavior rows, decision/glossary rows, every table and diagram, contract blocks, and code samples keep their form untouched. A warmed record is a defect.
8. **The depth guarantee** — a rewrite changes how sentences are written, never what the corpus contains. Every fact, constraint, edge case, table, and diagram survives; rewrites may add examples, never remove substance.
9. **Artifacts take the voice** (decision RD.DEVEX.WORKSPACE.106) — an approach, an overview and a report take the voice exactly as a seat does. The audience decides the examples and the depth, never the temperature. An HTML page is no exemption.
10. **Register rows take the plain substrate** (decision RD.DEVEX.WORKSPACE.106) — one clause a sentence, none past twenty-five words, and the decision column is the ruling and nothing else. A decision or glossary row keeps its exact terms and its MUST. No *you* and no aside: a row is still a record.
11. **No idioms** (decision RD.DEVEX.WORKSPACE.115) — an idiom means something its words do not say, so a reader whose first language is not English cannot guess it. Write the plain phrase instead: *ask me to continue*, never *say the word*. A house term the book defines is not an idiom, and `owes`, `carries`, `seat` and `rung` all stay. The fix is the plain phrase, never a shorter sentence. **Plain is not simplified** — a term can be looked up and an idiom cannot, so terms are not the target. One sentence may carry four of them. What must be plain is the language around them, and the exact term, the constraint and the MUST all survive the rewrite untouched.

### Reaching your reader — three moves

**RD.DEVEX.WORKSPACE.096 asked you to talk to your reader and named no mechanism, so RD.DEVEX.WORKSPACE.107 names three.** Third person is not the fault. A third-person sentence carrying nothing for you is.

| Move | Where it belongs | Reads like |
| --- | --- | --- |
| **The beneficiary clause** | the default, and it works in every seat | *A module MUST NOT read `process.env`. That way your config stays in one owning layer.* |
| **The imperative** | guides and procedures, where you are the one acting | *Run the plan before you approve it.* |
| **Second person as the subject** | where the actor really is you | *You never hand-run an apply against the estate.* |

- **Keep the system as the subject, then add the clause.** Say what the fact buys you, in the sentence beside it. The subject never moves, so a rule keeps the party it binds.
- **Never write an imperative on a sentence that names a bound party.** An imperative rebinds the rule from that party to you, which is a different rule. Most of the capabilities seat names a bound party, which is why the clause is the default.
- **A rule is taught, not only stated.** Beside the rule, give the why — or the symptom that shows the rule was broken. A rule with neither is a line you memorize.

**The bar is a share, and your seat sets it** (decision RD.DEVEX.WORKSPACE.107). Count the prose sentences landing on you by any of the three moves, then divide by the sentences counted.

| Seat | Sentences that reach you |
| --- | --- |
| overview · approach · report | 30 in a hundred |
| README face | 25 in a hundred |
| chapter · concept | 15 in a hundred, with normative sentences outside the count |
| register row | none — a record is never warmed |

**Watch a share, never a count of occurrences.** Splitting a long sentence is what this standard asks of you, and splitting dilutes a count. So the number to compare before and after is the share.

**Your own instruction surface is in scope** (decision RD.DEVEX.WORKSPACE.096 · RD.DEVEX.WORKSPACE.106 · RD.DEVEX.WORKSPACE.107, stated
at depth in the book's `01-devex/04-workspace/04-docs/01-corpus.md` § What the pattern binds). The voice reaches this book,
the foundation's provider set, and these plugins — your skills, lenses, agent briefs and reference
restatements. **It also reaches what you say and print at runtime** (decision RD.DEVEX.WORKSPACE.115). A session
banner, a hook's output and your own chat reply are all held to it. Nothing you write escapes
the bar by not being a file. Layout is what those trees are free of, never how they read. The bars are identical
everywhere; only the move differs. Say *you* on a page someone reads to learn. Use the **imperative**
on a page you act from, because a passive instruction leaves you working out who acts. And where a
warmer sentence would be less exact about what you must do, keep the sentence and let the page sit
under its share. A repo that merely consumes SaaS Plane keeps its own `providers/` folder out of
scope.

**On that surface, reach is the whole measure** (decision RD.DEVEX.WORKSPACE.111). Two checks count only the
typed word — one fires when a page never says *you*, the other when it says it fewer than once in
twelve sentences. Neither can see an imperative, which is this surface's own move, so both read your
instruction file as silent when it is anything but. On a provider chapter or a plugin instruction
file, neither applies. Your reach share is what the checker measures, and it still binds — a page
that truly reaches nobody is still caught.

**A check reads how a phrase is used, never that it appeared** (decision RD.DEVEX.WORKSPACE.112). You have to
quote the mistake a rule bans, and a domain term is sometimes spelled like an everyday word — *the
reader tier* is a read facade, not your reader. Neither is a breach. Mark a counter-example as one,
in italics or backticks, and the checker reads it as quotation. That is the same courtesy a register
row already gets when it names *you* as a term.

**The share is met honestly or not at all** (decision RD.DEVEX.WORKSPACE.109). Appending a bare `for you` · `to you` · `on you` to a sentence you have otherwise left alone games the counter — it does not meet the share. The check strips the trailing phrase and asks whether what remains still reaches. If it does not, that phrase was carrying the sentence's whole claim on your reader, and it is a finding. It is graded RULE rather than BLOCK. A sentence like `stands them up for you` is real writing that ends the same way. Only you can tell the two apart. **Where a sentence cannot address your reader honestly, leave it as written and let the page sit under its share.** A page at its bar in mechanical prose is worse than one under it in good prose (decision RD.DEVEX.AGENT.032).

**No external style guide becomes a rule** (decision RD.DEVEX.WORKSPACE.107). The construct is the corpus's own. Keep the reference measurements in the workspace as evidence, and never cite one as authority.

**The measure** (decisions RD.DEVEX.WORKSPACE.106 · RD.DEVEX.WORKSPACE.107). The check reads the rule's numbers, never the corpus's own average. Over prose only: around fifteen words a sentence, few past twenty-five, none past thirty, *you* present, and your seat's share of reach. A sentence past thirty words is a finding. Prose that never says *you* is a finding, and that clause is the floor against silence — the share above is what you aim at. The fix is one of four moves — **split it · say *you* · define the term · land it on your reader** — never a shorter sentence. The `spn-devex` doc-check hook measures every watched document, and its sweep prints the rates a tranche moves. Reach is reported SOFT for now: the corpus is swept for length, not yet for reach.

**No document is exempt by age** (decision RD.DEVEX.WORKSPACE.106). The corpus is swept in the row's order: pilot first, then the argued pages, the book, the stack docs, the register rows. Every diff is reviewed and nothing is removed. The labeled on-ramp form (`**What this is about:**` blocks) is retired; its content folds into a natural opening paragraph.

## Documents lead code

Work runs `FRAME` → `DESIGN` → `BUILD` → `PROVE`, and each pass is the next one's contract (decision RD.DEVEX.WORKSPACE.081).

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

**Every row carries `RD.<DOMAIN>[.<SUBDOMAIN>].<NNN>`** — *register decision*, the group it governs, and a zero-padded sequence within that group. The group is a folder of the repository's own `docs/02-constructs/` tree, written in capitals and without its number — a register never invents a classification of its own.

| Repository | Its construct tree | Its ids | For example |
| --- | --- | --- | --- |
| The foundation | a domain, then a group within the domain | four parts | `RD.DEVEX.AGENT.049`, `RD.SUPPORT.APPS.133` |
| Every other repository | the domain alone | three parts | `RD.IAM.004`, `RD.SERVER.012` |

- **The group stops at the folder, never the construct.** A row's finer address is its own `Construct` column, not a longer id.
- **The sequence is per group**, so groups grow without colliding. **Ids are never reused and a correct id is never renumbered** — a row keeps its id when its section is reordered, when it is superseded, and when it is rewritten.
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
