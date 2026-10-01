<!-- spn:doc
{"id": "spn-devex-capabilities-checks", "variant": "capability", "title": "Scripts in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["checks"], "summary": "The stack-agnostic checks the dispatcher composes, the tools reached by their own path, and the library both read — including the renderer, the drawer and the figure checker that produce every page in the workspace.", "keywords": ["script", "check", "tool", "audit", "drift", "render"]}
-->

# Scripts in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Scripts`

Everything this plugin can execute sits under `packages/plugin-spn-devex/src/scripts/`. A file under `checks/` is composed by the call moment's dispatcher and returns a verdict. A file under `commands/<group>/<action>.ts` is dispatched by `cli.ts` as `spn-devex <group> <action>`, one file per action, each exporting `{ describe, run }`. A file under `lib/` is what more than one of the others reads. Two habits run through the whole folder. **Each file names, in its header, the chapter it restates**, so the rule has one home. And **each reads the smallest slice its question needs** — the sweep-everything shape once cost three quarters of every millisecond hooks had spent.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| An arc's status word | `packages/plugin-spn-devex/src/scripts/checks/arc-status.ts` | refuses an arc written with a status word nothing can act on |
| What the code says about itself | `packages/plugin-spn-devex/src/scripts/checks/comment-check.ts` | refuses a history word, a `//` where JSDoc is owed, a comment repeating its line, a guess |
| The questions a fragment cannot answer | `packages/plugin-spn-devex/src/scripts/checks/corpus.ts` | asks the corpus questions nobody would otherwise ask until they typed a command |
| Confirmed execution | `packages/plugin-spn-devex/src/scripts/checks/confirmed.ts` | warns on an edit with no recorded go, and never on a read |
| The document bars | `packages/plugin-spn-devex/src/scripts/checks/doc-check.ts` | measures prose against what a script can measure |
| The machine seat | `packages/plugin-spn-devex/src/scripts/checks/env-seat.ts` | refuses a command that would render `~/.spnenv` |
| The governing mirror | `packages/plugin-spn-devex/src/scripts/checks/mirror.ts` | names the capability document an edit belongs to |
| A publish nobody asked for | `packages/plugin-spn-devex/src/scripts/checks/publish.ts` | reminds, on a publish of a page, that nothing is published unless the developer asks, and names the full path to hand over instead; never refuses |
| A release nobody agreed to | `packages/plugin-spn-devex/src/scripts/checks/release-go.ts` | refuses the bump that cannot be taken back without a recorded go |
| The two workstream gates | `packages/plugin-spn-devex/src/scripts/checks/split-plan.ts` | the documents-first warning, the close refusal, and the parser both read |
| A source edit during a test run | `packages/plugin-spn-devex/src/scripts/checks/test-run.ts` | refuses a write under `src` or `tests` while a test run for that repository has a start file |
| The workstream's Cycles | `packages/plugin-spn-devex/src/scripts/commands/docs/cycles.ts` | prints an approach page's Cycles table read from its arcs, each row with its arc file and its previews, and with `--write` puts the parts the arcs decide into the page, run as `spn-devex docs cycles` |
| What a workstream cost | `packages/plugin-spn-devex/src/scripts/commands/workspace/tokens.ts` | tokens per workstream, arc and order, joining hook telemetry to the session's transcripts, run as `spn-devex workspace tokens` |
| The corpus commands | `packages/plugin-spn-devex/src/scripts/commands/docs/` | `audit` · `face` · `page` · `status` · `topics` · `parity` · `figure`, one file per action, run as `spn-devex docs <action>` |
| The corpus against itself | `packages/plugin-spn-devex/src/scripts/commands/docs/coherence.ts` | the questions answered only across documents, run as `spn-devex docs coherence` |
| The book comparison | `packages/plugin-spn-devex/src/scripts/commands/restates/check.ts` | each restatement re-hashed against the chapter it names, run as `spn-devex restates check` |
| The partner proof | `packages/plugin-spn-devex/src/scripts/commands/plugin/partner.ts` | every script run against a plugins-only repository, run as `spn-devex plugin partner` |
| The prose triage | `packages/plugin-spn-devex/src/scripts/commands/docs/prose.ts` | the paragraphs worth a rewrite, found by pattern, run as `spn-devex docs prose` |
| The book's templates | `packages/plugin-spn-devex/src/scripts/commands/restates/files.ts` | copies the shapes every repository writes to, so a partner has them, run as `spn-devex restates files` |
| A figure as a browser draws it | `packages/plugin-spn-devex/src/scripts/commands/docs/figure.ts` | the second reading of a drawing, beside the geometric one, run as `spn-devex docs figure` |
| The row writer | `packages/plugin-spn-devex/src/scripts/commands/behaviours/stamp.ts` | the one writer of `Status` and `Updated at`, in every repository, from the one run it is told to read, run as `spn-devex behaviours stamp <run> <repo>` |
| The proof check | `packages/plugin-spn-devex/src/scripts/checks/behaviour-proof.ts` | every `SUCCESS` row against the run its `Updated at` cites, also reachable as `spn-devex behaviours check` |
| The tests measurement | `packages/plugin-spn-devex/src/scripts/commands/behaviours/coverage.ts` | every row as the stamp wrote it, the runs each tier's rows cite, and the rows grouped by domain, printed or handed over as `--json`, run as `spn-devex behaviours coverage`; it opens no run file; a `MANUAL` row counts in none of the numbers and is listed as `manual` instead; a case that names an unknown id, or sits at another level than its row, is listed as a finding |
| The coverage measurement | `packages/plugin-spn-devex/src/scripts/commands/coverage/measure.ts` | how much of a repository is written, built and proved, and the gaps between them, per package, per app, per domain and for the repository, printed or handed over as `--json`, run as `spn-devex coverage measure`; a `MANUAL` row counts in none of the numbers and is listed as `manual` at each level |
| The report refresh | `packages/plugin-spn-devex/src/scripts/commands/report/refresh.ts` | measures a `coverage` or a `tests` report again and writes the numbers into its page, run as `spn-devex report refresh <page>` |
| What is built | `packages/plugin-spn-devex/src/scripts/commands/coverage/_join.ts` | the seat table, the Where section, each chapter joined to its construct, and the domain a behaviour belongs to — the one join both measurements read Built from |
| The id check | `packages/plugin-spn-devex/src/scripts/commands/behaviours/ids.ts` | every contract, component and journey case in a repository, read from the test source, and the ones with no behaviour id in their title or an enclosing `describe`, or in the literal table a data-built title reads (its own file or one it imports); strict, so it exits 1 while any case has none |
| What a register and a run are | `packages/plugin-support-lib/src/lib/register.ts`, `packages/plugin-support-lib/src/lib/runs.ts` | the headings a register carries, each column found by its heading, a behaviour id with a first part of two to seven letters, and the files of one named run, `tests/.output/<tier>/runs/<run>.json` and every `<run>.<phase>.json`, read one way — shared with `spn-apps`, so it lives in the plain support folder rather than one plugin |
| The tiers each kind owes | `packages/plugin-support-lib/src/lib/kinds.ts` | the book's table of kind and owed tier, restated because a plugin imports nothing |
| The library both callers read | `packages/plugin-spn-devex/src/scripts/lib/` | `render.ts` produces a page · `draw.ts` draws a figure · `figures.ts` checks one · `restates.ts` parses a stamp |

## Follows the pattern

- The four folders, the fast path, the grade, and the line between refusing and reporting — [Scripts](../../../02-constructs/01-devex/05-scripts.md)
- The verdict, the composition, the always-zero exit — [Hooks in spn-devex](02-hooks.md)
- The citation a header carries — [Refs](../../../02-constructs/01-devex/06-refs.md)
- What a page is made of — the foundation's `04-docs/05-artifacts.md`
- The one-entry, `<group> <action>` shape `commands/` dispatches by — the foundation's `04-plugins/02-shape.md`

## Special handling

### One entry, `<group> <action>`, dispatches every command

**Why** — *sixteen tools reached by sixteen separate paths is a vocabulary that grows by one every time somebody adds a tool*, and a partner has no way to list what exists short of reading the folder. The foundation's `04-plugins/02-shape.md` states the alternative: one entry, `<group> <action>`, `help --json` listing every action as data.
**What** — `cli.ts` lazily imports `commands/<group>/<action>.ts`, one file per action, each exporting `{ describe, run }`. This plugin's groups: `docs` (`audit` · `face` · `page` · `status` · `topics` · `parity` · `prose` · `coherence` · `figure` · `cycles`) · `restates`, one action per `spn:restates` block kind — `docs` · `files` · `decisions` (the foundation's decision `RD.DEVEX.AGENT.072`) — plus `check`, running all three · `behaviours` (`stamp` · `check` · `coverage` · `ids`) · `coverage` (`measure`) · `report` (`refresh`) · `plugin` (`partner` · `paths` · `build` · `timings`) · `workspace` (`tokens`). No `tools/` folder survives: every path that once named one now names a command.
**How** — a command is printed as `spn-devex docs audit`, never as a bare path — a file under `commands/` is reachable, or it is not there, and nothing outside that folder is dispatched. The entry ends only after its output is written, so `--json` sent through a pipe arrives whole, past 65,536 bytes too.

### A check says which of its rules it carries

**Why** — the comments group grades every rule on its page as a finding, and this check carries only the ones a fragment can decide. A reader who has to work out the coverage will assume it is complete, and the finding that is missing is the one they stop looking for.

**What** — the file's own header lists the chapter's whole set and marks each finding `here` or `NOT here` with the reason. The ones that are absent wait on the package's declaration set, which only the symbol index answers, or on judgement the chapter itself grades SOFT.

**How** — the header is read beside the chapter, and the withdrawn finding names what it refused wrongly when it was tried. `packages/plugin-spn-devex/src/scripts/checks/comment-check.ts`.

### A pattern is narrowed against the corpus before it ships

**Why** — a check that is wrong occasionally is not merely noisy. An agent handed a false refusal does not argue with it; it rewrites the sentence, and the sentence was right.

**What** — every pattern in the comments check was measured against 1,707 files under `src/` in the two TypeScript stacks, and each narrowing is written beside the pattern with the live sentence it protects: *a flag used to decide which branch runs*, *a renamed test changes the answer*, *a CLI that appears to hang*.

**How** — the same sentences are the untouched half of the suite, named with the file they came from, so nobody re-broadens a pattern without meeting them. `packages/plugin-spn-devex/tests/unit/scripts/checks/t-comment-check.mjs`.

### Refusing beats an allowlist of safe reads

**Why** — *a value in the machine seat is never printed or logged*. Three surfaces said so and a session broke it anyway, putting five live credentials into a transcript.
**What** — every route that would render the file is refused, rather than the safe ones listed. One pipeline prints key names and the next prints every value, and telling those apart in a shell string is guesswork.
**How** — the whole command is read, so even a heredoc quoting the path is refused, and the message names the door instead. `packages/plugin-spn-devex/src/scripts/checks/env-seat.ts`.

### A fragment cannot see a corpus, so one check reads the tree

**Why** — *every other check under `checks/` reads the fragment being written*, and a fragment cannot show that a page names a folder deleted last week or that a produced page stopped matching its seat. Until this file existed, the only time anybody asked a corpus question was when a person typed the command.
**What** — it asks a few of those questions at the moment an edit lands, so a corpus reporting itself green is caught by a run rather than by a sweep somebody remembered to do.
**How** — it declares the input it needs as data and stats the binary rather than running it, because a check that spawns the CLI would fail on every machine without one. `packages/plugin-spn-devex/src/scripts/checks/corpus.ts`.

### A warning that repeats is a warning nobody reads

**Why** — *one turn writes many files, often into one folder*. A line printed on every write teaches you to skip it, and the time it mattered goes past unread.
**What** — the confirmed-execution warning speaks once per session, the mirror note once per mirror per session.
**How** — both remember what they said under `.spndevex/.debug/`, where the workspace keeps what its machinery says about itself. `packages/plugin-spn-devex/src/scripts/checks/confirmed.ts` and `packages/plugin-spn-devex/src/scripts/checks/mirror.ts`.

### The mirror check never refuses

**Why** — *the seams a mirror carries are prose*, and whether an edit changed one is a reading rather than a match. A gate there would be guessing.
**What** — it names the document governing the folder you are editing, and nothing else. Where no row governs it, it stays silent: that gap is the audit's, over the whole tree.
**How** — the longest governing folder wins, so a deep edit is never sent to the shallower mirror. `packages/plugin-spn-devex/src/scripts/checks/mirror.ts`.

### The workstream gates ask for accounting, not completion

**Why** — *closing a scope with work pending is good housekeeping*. What must not happen is a row nobody decided.
**What** — landed, carried and deferred all pass, and only an undecided row refuses. There is no override: recording the deferral is the way through. The other gate in the same file warns when an approach page is written into a pocket while rows sit unlanded. A tick with no date and no landed word reads as pending, so a cell such as `✅ the arc is written` does not pass as landed. A carry that writes its date before the arrow, as in `↷ carried 2026-10-01 → N006 row 1`, still names its successor.
**How** — the split plan is read from the arcs' own step tables — `Repo` is the scope column and `State` is the state — and an approach page's older `How` tables, carrying a `Scope` column, are read the same way for a workstream argued before that shape. A row is split on each pipe that has no backslash before it, as `doc-check` and `docs cycles` split it, so an escaped pipe stays inside its cell. The report run by hand as `node split-plan.ts [path]` prints each workstream's tally, and the Stop hook reads the same tally for an arc that lands. The dispatcher registers the two gates separately so anybody measuring the cost can tell which one swept the workspace. `packages/plugin-spn-devex/src/scripts/checks/split-plan.ts`.

### Cycles is read from the arcs, and `--write` puts it on the page

**Why** — *a page a person typed drifts from the arcs it is meant to summarise*, and the close gate already reads the arcs for `split-plan.ts` — a second, hand-kept table would state the same fact twice.
**What** — `docs cycles <workstream>` reads every file under the workstream's `arcs/` folder. For each arc it takes its heading, its status word, the sentence that follows the status (or its `Decides` field where none follows), and the rows of its `## Previews` table. It prints the table an approach page's Cycles subsection carries: one row per arc, `Arc · What it does · Status · Previews`, in the order of the arc numbers. The Arc cell holds the arc's name and a link to its file, `arcs/<file>`. The Previews cell holds one line per preview or sample: a link to the file, its kind, and its state, which is `proposed` or `decided`. An arc whose Previews section reads `None.`, or that has no such section, prints a dash. A Previews row whose File cell holds no link is printed as a `!` line that names the row. With no option the command writes no file. With `--write` it writes the parts of the page that the arcs decide (the book's RD.DEVEX.WORKSPACE.204): the header's status, the Cycles table, and the heading of `Open`. A page that is already current is not written, so a second `--write` leaves the file's bytes and its time as they are. `doc-check` compares the page's table and its header's status with this same reading when the whole page is written.
**How** — the longest status word is matched first, so `PART-LANDED` is never read as `LANDED`, and an arc whose status the set does not know is still printed, named by its file, rather than guessed at. An arc number is read as the file name writes it, with one, two or three digits. An arc writes a preview's link from its own folder, `arcs/`, and the command states the same link from the workstream folder, where the page sits. `doc-check` matches each row to its arc by the arc number, so the page may list the arcs in the order they run. It compares the row's name, its file link, its line, its status and its Previews cell with the arc. A page in `open/` or `backlog/` whose table has no Previews column is told to run `spn-devex docs cycles`; a page in `closed/` keeps the table it closed with, and only its rows and statuses are compared. `--write` replaces one table, one status badge and one heading, each exactly once. It finds the table as `cyclesRule` does, by the last `h3` named Cycles inside How. A page with no such `h3` is refused with exit 1 and no write. The badge is written with its class, its glyph and its word. The heading of `Open` reads `Open — Q<n> · Q<n>`, each open card by its number, or `Open — no card is open`. The header's status follows the arcs: `PLANNING` while no arc is past `DECIDED`, `IMPLEMENTING` once an arc runs or has landed, and `DONE` when the workstream closes. A page whose header disagrees with its arcs gets a finding that names both words and the command. `--write` adds no new kind of generated marker to the page. `packages/plugin-spn-devex/src/scripts/commands/docs/cycles.ts` and `cyclesRule` in `packages/plugin-spn-devex/src/scripts/checks/doc-check.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/docs/t-cycles.mjs` and `packages/plugin-spn-devex/tests/unit/scripts/checks/t-doc-check.mjs`.

### Tokens are joined by session, because a reply names no path

**Why** — *a reply is written before the tool call that follows it*, so nothing on a transcript line says which workstream, arc or order paid for that reply.
**What** — `workspace tokens` reads every tagged line the telemetry log carries, and every transcript the same session wrote — the main window's file and each subagent's file under it — counts each reply once by its `message.id`, and gives a reply the tag of the first tagged line at or after its own moment. A session carrying no tagged line at all is counted as untagged rather than guessed at. The report also prints the model's own time beside the tokens. The time before each transcript line is counted by what the line is. Before a reply it is the model's time, before a tool result it is a tool's time, and before a prompt it is time spent waiting for the developer.
**How** — a workstream filter matches a number or a whole folder name, and `--json` hands over the same tree the printed report shows. The transcript stamps every `user` and `assistant` line in UTC to the millisecond, and no other line is read for time. The model's time, the tools' time and the waiting time add up to the window's span. `packages/plugin-spn-devex/src/scripts/commands/workspace/tokens.ts`.

### A Bash call's time is summed once

**Why** — *a compound call wrote a line for each command inside it, and every line carried the whole call's time*. Read on 2026-10-01, the log's Bash lines summed to 1,952,390 ms, and the calls behind them took 848,654 ms.
**What** — `plugin timings` reads one line for each Bash call. The line is filed under the first program the filter matched, and its `programs` key says how many programs the call ran. So a total by program holds each call's time once. A failed call is counted with its exit code, and its `events › closed` line sits in the log beside it. A line written before `programs` existed is read as it was written.
**How** — the writer is `finishCommand`, and `spnutils workspace timings` reads the same log, so a change to the line's shape is made in the plugin and read in both. `packages/plugin-spn-devex/src/scripts/commands/plugin/timings.ts` and `packages/plugin-spn-devex/src/scripts/lib/bash-timing.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/plugin/t-timings.mjs` and `packages/plugin-spn-devex/tests/unit/scripts/lib/t-bash-timing.mjs`.

### The document check is calibrated to the rule, never to the corpus

**Why** — *a bar set from the corpus average moves every time the corpus does*, so a sweep would approve whatever the corpus already is.
**What** — the numbers come from the register row: an average past eighteen words a sentence reports, and past twenty-four refuses, as does any sentence past thirty. Records are exempt, because a row is never warmed.
**How** — headings, tables, code and front matter come out before scoring. `packages/plugin-spn-devex/src/scripts/checks/doc-check.ts`.

### One file serves the write-time check and the on-demand tool

**Why** — *a rule answered one way at write time and another in a sweep is two rules*. A produced page writes its headings as HTML and its seat file writes them as markdown.
**What** — `commands/docs/_lib.ts` holds the read every document-check action shares, and each reads both spellings. Reading only the HTML once reported every hand-written construct as missing all six sections it carried.
**How** — fences are blanked first, so an example in a code block is content. `packages/plugin-spn-devex/src/scripts/commands/docs/_lib.ts`.

### A preview page is audited against its own template

**Why** — *a preview is a page the developer judges before the work is built*, so it carries the same furniture as every other page. Its header says different things from an approach page's, and an audit that reads it as an approach page refuses a page that is correct.
**What** — `docs audit` knows the variant `preview`. A preview's file name ends `-preview.html`, and the name and the variant must agree, as they do for every other page kind. Its header line and its `<h1>` carry the preview's own title, which is the block's `title`. Its header names the arc and the date in its Shown chip, and carries no For chips. Its Status chip reads `PROPOSED` or `DECIDED`, the arc's own words, and the audit does not compare that word with the block's `status`. A file under a workstream's `samples/` folder is a real file in its own format, and a template carries placeholders, so the audit reads neither as a page and counts neither.
**How** — the scripts and the selectors of a preview are compared with `workstream/approach-preview-template.html`, found in the same templates folder as the approach template. `packages/plugin-spn-devex/src/scripts/commands/docs/_lib.ts`, `checkHeader`, `checkFurniture`, `declaredTemplate` and `isAuditedPage`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/docs/t-audit.mjs`.

### The audit runs the status check, and reads only what a figure claims

**Why** — *a check that is wrong gets obeyed*. The page of workstream 020 was reworded so that the audit would stop misreading a tree and a diff, and both sentences had been right. A construct whose status had fallen behind its rows was found only by `docs status --check`, which the audit did not run.
**What** — `docs audit` runs the status check on each construct it reads and writes nothing, so a status that differs from its behaviour rows is an audit finding. A block whose language is `diff` is not read as a figure copied from a file, because a diff shows a change and never matches the file. A tree figure's folder is read from the paragraph directly before the tree, and from no earlier one. A contract term that ends in `Type` and is not an enum is not reported as a closed value with no members. An enum whose comment holds a brace is read whole.
**How** — the status check is `statusFor`, called with its write turned off. The figure checks are `checkCodeFigures` and `checkTreeFigures`, and the vocabulary check reads `TERMS_CONTRACT` and `ENUM_HEAD`. `packages/plugin-spn-devex/src/scripts/commands/docs/_lib.ts` and `packages/plugin-spn-devex/src/scripts/commands/docs/audit.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/docs/t-audit.mjs`.

### `docs face` refuses without a path

**Why** — *`docs face` writes unless `--check` is given*. With no path it took the current folder as its tree, so a run from the workspace root walked every repository and could write into a workstream's notes.
**What** — with no path the command prints its usage line and exits 2, with `--check` or without it. It writes only under the docs tree it is handed.
**How** — `packages/plugin-spn-devex/src/scripts/commands/docs/face.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/docs/t-face.mjs`.

### Coherence compares documents; drift crosses a boundary

**Why** — *the coherence tool must run in any repository*, and every question it asks compares documents inside one. No repository holds the plugins and the book together.
**What** — coherence asks the cross-document questions: a closed vocabulary saying different things, a row carrying more than one ruling, two documents ruling one subject without citing each other, a count written into a growing set, a face skipping a section of its concept, and a restatement fallen behind. Drift asks the last one alone, against a book it is handed.
**How** — both read one parser, so the block cannot be read two ways. `packages/plugin-spn-devex/src/scripts/commands/docs/coherence.ts`, `packages/plugin-spn-devex/src/scripts/commands/restates/check.ts`, and `packages/plugin-spn-devex/src/scripts/lib/restates.ts`.

### A partner holds no book, and silence is the contract

**Why** — *what the foundation publishes is the corrected restatement, never the checker*. A script that crashes on a missing input shows a partner a broken agent rather than a missing file.
**What** — the proof builds a repository carrying only what a partner has and runs every script against it. A crash is a failure; a finding is not, because findings are that repository's business.
**How** — it picks an interpreter from each script's extension, so it works through a port. Run it after touching any script, and before any release. An installed plugin's root holds `dist/`, `scripts/` and `hooks/`, and no `src/` folder. There the proof runs the bundled hooks, so it gives the same answer from the install cache as from a checkout. `packages/plugin-spn-devex/src/scripts/commands/plugin/partner.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/plugin/t-partner.mjs`.

### The plugin's copy of the templates follows the book both ways

**Why** — *a copy the book deleted is a template somebody still copies from*. `restates files --write` copied each template the book holds and removed nothing, so a template the book had deleted stayed in the plugin and was removed by hand.
**What** — `restates files --write` copies each template the book holds and removes each copy the book no longer holds. Without `--write` the command reports an extra copy as drift, and it names itself `spn-devex restates files` in its message.
**How** — `packages/plugin-spn-devex/src/scripts/commands/restates/files.ts`. Its case builds a book folder and a plugin folder of its own, because the workspace's own copy is current.

### The manifest names only what the plugin ships

**Why** — *a description that names a missing ref sends a reader to a file that is not there*. `plugin paths` reads the skills, the refs and the hooks and never the manifest, so it reported clean while the description named refs this plugin does not ship.
**What** — each `refs/`, `skills/`, `scripts/`, `agents/` or `hooks/` path that the manifest's `description` names is a file the plugin ships. A case reads the description and fails on a path that resolves to nothing.
**How** — `packages/plugin-spn-devex/src/.claude-plugin/plugin.json`.

### The triage reports candidates, and some faults are left to a reader

**Why** — *handing a whole corpus to a rewriting pass is the expensive way to do it*, and most of it needs no change.
**What** — the prose faults a pattern can recognise are reported with their paragraphs. A compressed claim, a rule with no action, and a merely dull abstraction cannot be told from good prose by a pattern, so they are not guessed at.
**How** — code, tables, headings and front matter come out before scoring, and a ledger of hashes lets a long sweep resume. Quotation marks written as HTML entities are read as quotation marks, so a phrase a page quotes is not scored as the page's own. `packages/plugin-spn-devex/src/scripts/commands/docs/prose.ts`.

### One writer stamps every repository's rows

**Why** — *rows are domain-neutral*. A stack repository, an estate repository and this one all carry registers, and `spnutils` writes the run's file and never a row (the book's RD.DEVEX.UTILS.071). One writer here serves all of them, so two writers can never disagree about a row's width or its rules.
**What** — only `Status` and `Updated at` are written, from the one run the caller names: `<run>.json` and every `<run>.<phase>.json` under each node's `tests/.output/<tier>/runs/`. A stamp that names no run, or a run that left no file, is refused with the newest runs on disk. A run speaks for the tiers it ran, and a result counts for a row only at the row's own `Tier`. `Updated at` is the newest file of the run that named the row, then ` · ` and the run's name. `MANUAL` is never written over and a `PROMISE` row is never stamped. Rows the run did not name are left alone unless `--reach repository` says the run is the whole of its tiers; then they go back to `PLANNED`.
**How** — a column is found by its heading, so an eight-, nine- or ten-cell register is stamped alike and keeps its width, and a file is rewritten only where a row changed. This repository's own runner, `packages/plugin-spn-devex/tests/run.mjs <run> --write-status`, calls it with the run it just wrote. `packages/plugin-spn-devex/src/scripts/commands/behaviours/stamp.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/behaviours/t-stamp.mjs`.

### The proof and the measurement read the rows the writer stamps

**Why** — *a case that exists is not a case that ran*, and a report is written by the agent and produced by no command (RD.DEVEX.WORKSPACE.149).
**What** — the proof check reads each `SUCCESS` row against the run its `Updated at` cites, and no other run, and refuses the row where that run did not name it, found it failing, or proved it at another tier. A row citing a run whose file is not on disk, or citing no run, is counted and never judged, and neither is a `MANUAL` row. The measurement opens no run file: it reads each row's `Status`, and the run its `Updated at` names. It lists every tier the repository owes, with the runs its rows cite and the nodes that owe it and carry no case, and hands the result over as `--json`; an unchanged tree measures to the same bytes, and `measuredAt` is the newest `Updated at` it read. The measurement also groups the rows by domain, the first folder under `03-behaviors/`, with Written, Built and the four statuses per domain, and puts the behaviours of the seat's own README in a row about the whole repository. Built is read through the coverage measurement's own join, so the two reports never count it two ways. A foundation repository gets an absence and no report. Where no row cites a run, a `tests` report's block leaves `measuredAt` out and its Measured section says that no run is stamped. `docs audit` accepts that block and refuses `null`. The measurement also reads each case title from the test source. It lists a case that names an id no row declares, and a case that sits at another level than its row's `Tier`. Both are findings in the output, and the command still exits 0. An id that more than one row declares is listed with each file that declares it, by this measurement and by `coverage measure`. A node's unit cases are found in `.mjs` files as well as `.ts` and `.tsx`. So a package proven by `.spec.mjs` cases is not listed as owing a level with no case.
**How** — both read the one register grammar the writer reads, and the proof check the one run reader. That grammar returns a repeated id beside the rows, so neither row is dropped in silence. `packages/plugin-spn-devex/src/scripts/checks/behaviour-proof.ts` and `packages/plugin-spn-devex/src/scripts/commands/behaviours/coverage.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/checks/t-behaviour-proof.mjs` and `packages/plugin-spn-devex/tests/unit/scripts/commands/behaviours/t-coverage.mjs`.

### The coverage measurement reads the Where tables against a seat table

**Why** — *a developer asks how much of a repository is finished*, and no single measurement answered it. The foundation's RD.DEVEX.WORKSPACE.191 answers it from three sides and counts the gaps between them. Built is declared by a chapter and then checked against the code, because code read alone would be the code approving itself.
**What** — Written counts behaviour rows and constructs, Built counts constructs and the rows under them, and Proved counts rows at `SUCCESS`, read from the tests measurement's own join and never copied. A row about the whole repository has no construct, so it is never built. A construct is built in a package when its chapter there exists and every path in its `## Where` table resolves. The gaps are counted per package, per app, per domain and for the repository; a domain's *Not built* and *Not proved* are its written rows less its built and its proved ones. *Stated, not built* counts constructs: a construct with rows and no chapter, a chapter with a Where path that resolves to nothing, or a chapter whose rows declare no code. *Built, not stated* counts seats: each seat in `src/` that no Where row names, marked proved when a test mirrors it at its own path or imports it. *Built, not proved* counts rows under a built construct that are not `SUCCESS`.
**How** — a Where path is read from its kind's root: a web module's `entry/ui/` folder, and every other kind's own folder. A bare name in a cell is the sibling of the path before it, and an ellipsis or `*` is a wildcard within one folder. A row names a seat, a path inside one, or an app's module folder, and states every seat in that tree. A row naming `src/` or a layer folder declares nothing and is named, and generated code is never a seat. The seat table is the TypeScript stack's, from the foundation's `10-providers/ts/03-structure.md` § What a Where Row May Name. `packages/plugin-spn-devex/src/scripts/commands/coverage/measure.ts` and `packages/plugin-spn-devex/src/scripts/commands/coverage/_join.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/coverage/t-measure.mjs`.

### A report's numbers are measured again by a command

**Why** — *a report is written by the agent from a measurement*, and it is stale as soon as a run stamps a row. In workstream 008 each report pass cost about 25 minutes of an agent, and the reports were redone as each fix landed.
**What** — `report refresh <page>` reads the page's block for its report type and its repository, runs that type's measurement, and writes the numbers and the digest into the page. It stamps `generatedAt`, and on a `tests` report `measuredAt`, which it leaves out where no run is stamped. It refreshes a `coverage` report and a `tests` report, because each has one measuring command that returns a digest. An `audit`, `code` or `docs` report is refused by name: each is measured by several commands and a reading. A page whose digest already matches is left as it is, and the command says so.
**How** — the measurements are `coverage measure` and `behaviours coverage`, called as functions and never spawned. The command writes numbers and never a sentence, so the Summary and each finding's words stay the agent's to write. `packages/plugin-spn-devex/src/scripts/commands/report/refresh.ts`, proven in `packages/plugin-spn-devex/tests/unit/scripts/commands/report/t-refresh.mjs`.

### A page is produced here, and its shape is stated in the book

**Why** — *a page a person edited is a second source of truth*, and the edit survives until the next production run silently overwrites it. What a page is made of is not this folder's to decide either: the block vocabulary, the figure grammar and the furniture are the foundation's, and where the two disagree the chapter wins.
**What** — `page` produces, `face` writes the generated regions of a face, `figures` measures every drawing, and `audit` re-renders the seat file with the same link rewriter and refuses any difference with one message: edit the seat file and produce it again. The masthead's Subtitle is the seat's own `subtitle` field, one plain sentence rendered under the title; the produced footer is always empty, because a template's own footer is a note to whoever copies it and never furniture a reader should see. The renderer is a few hundred lines with no dependency, because a partner installs nothing to read a document. Every box in a figure is measured from its own text, so a connector lands on an edge and a label fits by construction, and the checker reads the drawn result rather than the specification — a figure authored as drawing by hand is exactly the one nothing measured.
**How** — the pocket mirrors the seat folder for folder, so the pair is found by path alone; each relative link is re-expressed against the page's own location as it is written; and a page's behaviour rows are joined from the register beside it rather than typed into the seat file. Read `packages/plugin-spn-devex/src/scripts/commands/docs/page.ts`, then `packages/plugin-spn-devex/src/scripts/lib/render.ts`, `packages/plugin-spn-devex/src/scripts/lib/draw.ts` and `packages/plugin-spn-devex/src/scripts/lib/figures.ts`, against `spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters and rows each header cites, the page templates, and the text a drift run re-hashes | the chapter rules, and a script is the copy that can fire |
| takes | spn-devex's events | the payload reader, and the dispatcher that composes the checks | parsing a call is written once |
| publishes | spn-devex's events | the split-plan parser, the cards and the arc rows | the close line and the turn-end warnings read one plan |
| publishes | every author in the workspace | the block vocabulary a seat file is written in, and the page production that reads it | the author types blocks, never HTML |
| publishes | every repository | the audit, the face generation, the page production | one instrument, run everywhere |
