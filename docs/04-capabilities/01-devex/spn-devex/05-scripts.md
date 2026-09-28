<!-- spn:doc
{"id": "spn-devex-capabilities-checks", "variant": "capability", "title": "Scripts in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["checks"], "summary": "The stack-agnostic checks the dispatcher composes, the tools reached by their own path, and the library both read — including the renderer, the drawer and the figure checker that produce every page in the workspace.", "keywords": ["script", "check", "tool", "audit", "drift", "render"]}
-->

# Scripts in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Scripts`

Everything this plugin can execute sits under `plugins/spn-devex/src/scripts/`. A file under `checks/` is composed by the call moment's dispatcher and returns a verdict. A file under `tools/` is wired to nothing and reached by naming its path; it prints graded findings and an exit code that carries only the refusals. A file under `lib/` is what more than one of the others reads. Two habits run through the whole folder. **Each file names, in its header, the chapter it restates**, so the rule has one home. And **each reads the smallest slice its question needs** — the sweep-everything shape once cost three quarters of every millisecond hooks had spent.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| An arc's status word | `plugins/spn-devex/src/scripts/checks/arc-status.ts` | refuses an arc written with a status word nothing can act on |
| What the code says about itself | `plugins/spn-devex/src/scripts/checks/comment-check.ts` | refuses a history word, a `//` where JSDoc is owed, a comment repeating its line, a guess |
| The questions a fragment cannot answer | `plugins/spn-devex/src/scripts/checks/corpus.ts` | asks the corpus questions nobody would otherwise ask until they typed a command |
| Confirmed execution | `plugins/spn-devex/src/scripts/checks/confirmed.ts` | warns on an edit with no recorded go |
| The document bars | `plugins/spn-devex/src/scripts/checks/doc-check.ts` | measures prose against what a script can measure |
| The machine seat | `plugins/spn-devex/src/scripts/checks/env-seat.ts` | refuses a command that would render `~/.spnenv` |
| The governing mirror | `plugins/spn-devex/src/scripts/checks/mirror.ts` | names the capability document an edit belongs to |
| A release nobody agreed to | `plugins/spn-devex/src/scripts/checks/release-go.ts` | refuses the bump that cannot be taken back without a recorded go |
| The two workstream gates | `plugins/spn-devex/src/scripts/checks/split-plan.ts` | the documents-first warning, the close refusal, and the parser both read |
| The corpus tool | `plugins/spn-devex/src/scripts/tools/docs.ts` | `audit` · `face` · `page` · `status` · `topics` · `coverage`, and `figures` |
| The corpus against itself | `plugins/spn-devex/src/scripts/tools/coherence.ts` | the questions answered only across documents |
| The book comparison | `plugins/spn-devex/src/scripts/tools/restate-drift.ts` | each restatement re-hashed against the chapter it names |
| The partner proof | `plugins/spn-devex/src/scripts/tools/partner-shape.ts` | every script run against a plugins-only repository |
| The prose triage | `plugins/spn-devex/src/scripts/tools/prose-triage.ts` | the paragraphs worth a rewrite, found by pattern |
| The command surface | `plugins/spn-devex/src/scripts/tools/commands-ref.ts` | renders what the CLI says about itself into a ref |
| The book's templates | `plugins/spn-devex/src/scripts/tools/templates-export.ts` | copies the shapes every repository writes to, so a partner has them |
| A figure as a browser draws it | `plugins/spn-devex/src/scripts/tools/figure-render.ts` | the second reading of a drawing, beside the geometric one |
| The row writer | `plugins/spn-devex/src/scripts/tools/behaviour-rows.ts` | the one writer of `Status` and `Updated at`, in every repository, from a run's own artifact |
| The proof check | `plugins/spn-devex/src/scripts/checks/behaviour-proof.ts` | every `SUCCESS` row against the last run of its own tier |
| The tests measurement | `plugins/spn-devex/src/scripts/tools/behaviour-coverage.ts` | every row joined to the last run of its tier, printed or handed over as `--json` |
| What a register and a run are | `plugins/spn-devex/src/scripts/lib/register.ts`, `plugins/spn-devex/src/scripts/lib/runs.ts` | the headings a register carries, each column found by its heading, and every `spn-tests.json` read one way |
| The tiers each kind owes | `plugins/spn-devex/src/scripts/lib/kinds.ts` | the book's table of kind and owed tier, restated because a plugin imports nothing |
| The library both callers read | `plugins/spn-devex/src/scripts/lib/` | `render.ts` produces a page · `draw.ts` draws a figure · `figures.ts` checks one · `restates.ts` parses a stamp |

## Follows the pattern

- The four folders, the fast path, the grade, and the line between refusing and reporting — [Scripts](../../../02-constructs/01-devex/05-scripts.md)
- The verdict, the composition, the always-zero exit — [Hooks in spn-devex](02-hooks.md)
- The citation a header carries — [Refs](../../../02-constructs/01-devex/06-refs.md)
- What a page is made of — the foundation's `04-docs/05-artifacts.md`

## Special handling

### A check says which of its rules it carries

**Why** — the comments group grades every rule on its page as a finding, and this check carries only the ones a fragment can decide. A reader who has to work out the coverage will assume it is complete, and the finding that is missing is the one they stop looking for.

**What** — the file's own header lists the chapter's whole set and marks each finding `here` or `NOT here` with the reason. The ones that are absent wait on the package's declaration set, which only the symbol index answers, or on judgement the chapter itself grades SOFT.

**How** — the header is read beside the chapter, and the withdrawn finding names what it refused wrongly when it was tried. `plugins/spn-devex/src/scripts/checks/comment-check.ts`.

### A pattern is narrowed against the corpus before it ships

**Why** — a check that is wrong occasionally is not merely noisy. An agent handed a false refusal does not argue with it; it rewrites the sentence, and the sentence was right.

**What** — every pattern in the comments check was measured against 1,707 files under `src/` in the two TypeScript stacks, and each narrowing is written beside the pattern with the live sentence it protects: *a flag used to decide which branch runs*, *a renamed test changes the answer*, *a CLI that appears to hang*.

**How** — the same sentences are the untouched half of the suite, named with the file they came from, so nobody re-broadens a pattern without meeting them. `plugins/spn-devex/tests/unit/scripts/checks/t-comment-check.mjs`.

### Refusing beats an allowlist of safe reads

**Why** — *a value in the machine seat is never printed or logged*. Three surfaces said so and a session broke it anyway, putting five live credentials into a transcript.
**What** — every route that would render the file is refused, rather than the safe ones listed. One pipeline prints key names and the next prints every value, and telling those apart in a shell string is guesswork.
**How** — the whole command is read, so even a heredoc quoting the path is refused, and the message names the door instead. `plugins/spn-devex/src/scripts/checks/env-seat.ts`.

### A fragment cannot see a corpus, so one check reads the tree

**Why** — *every other check under `checks/` reads the fragment being written*, and a fragment cannot show that a page names a folder deleted last week or that a produced page stopped matching its seat. Until this file existed, the only time anybody asked a corpus question was when a person typed the command.
**What** — it asks a few of those questions at the moment an edit lands, so a corpus reporting itself green is caught by a run rather than by a sweep somebody remembered to do.
**How** — it declares the input it needs as data and stats the binary rather than running it, because a check that spawns the CLI would fail on every machine without one. `plugins/spn-devex/src/scripts/checks/corpus.ts`.

### A warning that repeats is a warning nobody reads

**Why** — *one turn writes many files, often into one folder*. A line printed on every write teaches you to skip it, and the time it mattered goes past unread.
**What** — the confirmed-execution warning speaks once per session, the mirror note once per mirror per session.
**How** — both remember what they said under `.spndevex/.debug/`, where the workspace keeps what its machinery says about itself. `plugins/spn-devex/src/scripts/checks/confirmed.ts` and `plugins/spn-devex/src/scripts/checks/mirror.ts`.

### The mirror check never refuses

**Why** — *the seams a mirror carries are prose*, and whether an edit changed one is a reading rather than a match. A gate there would be guessing.
**What** — it names the document governing the folder you are editing, and nothing else. Where no row governs it, it stays silent: that gap is the audit's, over the whole tree.
**How** — the longest governing folder wins, so a deep edit is never sent to the shallower mirror. `plugins/spn-devex/src/scripts/checks/mirror.ts`.

### The workstream gates ask for accounting, not completion

**Why** — *closing a scope with work pending is good housekeeping*. What must not happen is a row nobody decided.
**What** — landed, carried and deferred all pass, and only an undecided row refuses. There is no override: recording the deferral is the way through. The other gate in the same file warns when an approach page is written into a pocket while rows sit unlanded.
**How** — the split plan is the approach page's `How` tables read by their scope column, and the dispatcher registers the two gates separately so anybody measuring the cost can tell which one swept the workspace. `plugins/spn-devex/src/scripts/checks/split-plan.ts`.

### The document check is calibrated to the rule, never to the corpus

**Why** — *a bar set from the corpus average moves every time the corpus does*, so a sweep would approve whatever the corpus already is.
**What** — the numbers come from the register row: an average past eighteen words a sentence reports, and past twenty-four refuses, as does any sentence past thirty. Records are exempt, because a row is never warmed.
**How** — headings, tables, code and front matter come out before scoring. `plugins/spn-devex/src/scripts/checks/doc-check.ts`.

### One file serves the write-time check and the on-demand tool

**Why** — *a rule answered one way at write time and another in a sweep is two rules*. A produced page writes its headings as HTML and its seat file writes them as markdown.
**What** — `docs.ts` holds every document check the corpus runs and reads both spellings. Reading only the HTML once reported every hand-written construct as missing all six sections it carried.
**How** — fences are blanked first, so an example in a code block is content. `plugins/spn-devex/src/scripts/tools/docs.ts`.

### Coherence compares documents; drift crosses a boundary

**Why** — *the coherence tool must run in any repository*, and every question it asks compares documents inside one. No repository holds the plugins and the book together.
**What** — coherence asks the cross-document questions: a closed vocabulary saying different things, a row carrying more than one ruling, two documents ruling one subject without citing each other, a count written into a growing set, a face skipping a section of its concept, and a restatement fallen behind. Drift asks the last one alone, against a book it is handed.
**How** — both read one parser, so the block cannot be read two ways. `plugins/spn-devex/src/scripts/tools/coherence.ts`, `plugins/spn-devex/src/scripts/tools/restate-drift.ts`, and `plugins/spn-devex/src/scripts/lib/restates.ts`.

### A partner holds no book, and silence is the contract

**Why** — *what the foundation publishes is the corrected restatement, never the checker*. A script that crashes on a missing input shows a partner a broken agent rather than a missing file.
**What** — the proof builds a repository carrying only what a partner has and runs every script against it. A crash is a failure; a finding is not, because findings are that repository's business.
**How** — it picks an interpreter from each script's extension, so it works through a port. Run it after touching any script, and before any release. `plugins/spn-devex/src/scripts/tools/partner-shape.ts`.

### The triage reports candidates, and some faults are left to a reader

**Why** — *handing a whole corpus to a rewriting pass is the expensive way to do it*, and most of it needs no change.
**What** — the prose faults a pattern can recognise are reported with their paragraphs. A compressed claim, a rule with no action, and a merely dull abstraction cannot be told from good prose by a pattern, so they are not guessed at.
**How** — code, tables, headings and front matter come out before scoring, and a ledger of hashes lets a long sweep resume. `plugins/spn-devex/src/scripts/tools/prose-triage.ts`.

### A generator may spawn the CLI; a check never may

**Why** — *a check runs on every write, on every machine* — including one where the CLI is not installed, where spawning it would fail the gate for a reason that has nothing to do with the rule.
**What** — one tool renders the CLI's own help into a ref so an agent holds the command surface without asking, and it exists precisely because of that dependency. A check states the need as data instead and stats the binary.
**How** — the generator declares what it needs and writes into a bounded region of the ref, leaving the argument above that region to a person. `plugins/spn-devex/src/scripts/tools/commands-ref.ts`.

### One writer stamps every repository's rows

**Why** — *rows are domain-neutral*. A stack repository, an estate repository and this one all carry registers, and `spnutils` writes the run artifact and never a row (the book's RD.DEVEX.071). One writer here serves all of them, so two writers can never disagree about a row's width or its rules.
**What** — only `Status` and `Updated at` are written. A run speaks for the tiers it ran, and a result counts for a row only at the row's own `Tier`. `Updated at` is the newest run that named the row. `MANUAL` is never written over and a `PROMISE` row is never stamped. Rows nothing named are left alone unless `--reach repository` says the artifacts are the whole of their tiers; then they go back to `PLANNED`. `--results <file>` names the artifact to read, and without it every `spn-tests.json` under the root is read.
**How** — a column is found by its heading, so an eight-, nine- or ten-cell register is stamped alike and keeps its width, and a file is rewritten only where a row changed. This repository's own runner, `plugins/spn-devex/tests/run.mjs`, calls it with its one artifact. `plugins/spn-devex/src/scripts/tools/behaviour-rows.ts`, proven in `plugins/spn-devex/tests/unit/scripts/tools/t-behaviour-rows.mjs`.

### The proof and the measurement read the rows the writer stamps

**Why** — *a case that exists is not a case that ran*, and a report is written by the agent and produced by no command (RD.DOCS.089).
**What** — the proof check refuses a `SUCCESS` row the last run of its tier contradicts, never judging a tier no run spoke for or a `MANUAL` row. The measurement joins every row to the last run of its tier, lists every tier the repository owes with a reason where it did not run, and hands the result over as `--json`; an unchanged tree measures to the same bytes. A foundation repository gets an absence and no report.
**How** — both read the one register grammar and the one artifact reader the writer reads. `plugins/spn-devex/src/scripts/checks/behaviour-proof.ts` and `plugins/spn-devex/src/scripts/tools/behaviour-coverage.ts`, proven in `plugins/spn-devex/tests/unit/scripts/checks/t-behaviour-proof.mjs` and `plugins/spn-devex/tests/unit/scripts/tools/t-behaviour-coverage.mjs`.

### A page is produced here, and its shape is stated in the book

**Why** — *a page a person edited is a second source of truth*, and the edit survives until the next production run silently overwrites it. What a page is made of is not this folder's to decide either: the block vocabulary, the figure grammar and the furniture are the foundation's, and where the two disagree the chapter wins.
**What** — `page` produces, `face` writes the generated regions of a face, `figures` measures every drawing, and `audit` re-renders the seat file with the same link rewriter and refuses any difference with one message: edit the seat file and produce it again. The renderer is a few hundred lines with no dependency, because a partner installs nothing to read a document. Every box in a figure is measured from its own text, so a connector lands on an edge and a label fits by construction, and the checker reads the drawn result rather than the specification — a figure authored as drawing by hand is exactly the one nothing measured.
**How** — the pocket mirrors the seat folder for folder, so the pair is found by path alone; each relative link is re-expressed against the page's own location as it is written; and a page's behaviour rows are joined from the register beside it rather than typed into the seat file. Read `plugins/spn-devex/src/scripts/tools/docs.ts`, then `plugins/spn-devex/src/scripts/lib/render.ts`, `plugins/spn-devex/src/scripts/lib/draw.ts` and `plugins/spn-devex/src/scripts/lib/figures.ts`, against `spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters and rows each header cites, the page templates, and the text a drift run re-hashes | the chapter rules, and a script is the copy that can fire |
| takes | spn-devex's events | the payload reader, and the dispatcher that composes the checks | parsing a call is written once |
| publishes | spn-devex's events | the split-plan parser, the cards and the arc rows | the close line and the turn-end warnings read one plan |
| publishes | every author in the workspace | the block vocabulary a seat file is written in, and the page production that reads it | the author types blocks, never HTML |
| publishes | every repository | the audit, the face generation, the page production | one instrument, run everywhere |
