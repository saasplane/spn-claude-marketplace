<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "6f182673"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/05-report.md",
      "seen": "22036f11"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The masthead, and the opening",
      "seen": "25162f20"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "Reports and templates",
      "seen": "5f842b5a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The header — two lines, six fields, produced from the block",
      "seen": "be7657de"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "Nothing is published unless the developer asks",
      "seen": "500e5386"
    }
  ]
}
-->
---
name: report
description: Write one of the five reports on a repository — coverage (how much is written, built and proved), tests (what the tests have proved), audit (is it set up the way the standard says), code (where the source departs from the stack's standards) or docs (where the documents depart from the docs standards) — into its docs/artifacts/reports/ folder. Use when the user asks where a repository stands, how finished it is, what is proved or unproved, whether it is set up right, or what breaks the standards. Never run unasked, and never publish the page unless asked. Stack-agnostic; the domain plugin supplies the commands a code or audit report runs.
---

# report — where one repository stands, at one moment

**Read [`refs/devex/workspace/workstream.md`](../../refs/devex/workspace/workstream.md) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, and how a reply closes.

**A report measures one repository against one question, at one moment** (decision `RD.DEVEX.WORKSPACE.149`). It has two readers. A leader reads it to learn where things stand and presents it for review, so its first screen stands alone. You read it as a work list: you close the gaps a rule lets you close, and you bring the developer only the decisions that need a person.

**A report is written on request and never on initiative.** If nobody asked, do not write one and do not refresh one.

**The report fixes nothing.** It says what was found. You then open an arc for the records you may close, marking the flagged ones, and raise a `Q<n>` card for each record only the developer can decide. Running the measurement again is how the next report shows what closed.

**Every number is measured, never estimated — MUST.** A number nobody measured is written as *not measured*. The page names the command behind each number, so anybody can run it again and get the same answer.

## The five report types

**The set is closed** (decision `RD.DEVEX.WORKSPACE.149`); a sixth is a decision entry, never a new filename. **No report states a finding another report owns**, so one problem is counted once.

| Report | Answers | Its unit | Its states |
| --- | --- | --- | --- |
| **`coverage`** | how much of this repository is **written, built and proved**? | behaviours | Written · Built · Proved, and the gaps Not written · Not built · Not proved |
| **`tests`** | what have the tests **proved**, and what has nothing proved yet? | behaviours | SUCCESS · FAILED · PENDING · PLANNED |
| **`audit`** | is this repository **set up** the way the standard says? | checks: one setup check each | PASS · WARN · FAIL |
| **`code`** | where does the **source** depart from the stack's standards? | checks: one rule applied to one package | PASS · WARN · FAIL |
| **`docs`** | where do the **documents** depart from the docs standards? | checks: one page each | PASS · WARN · FAIL |

The block names the type with one `SPDocReportType` value: `COVERAGE` · `TESTS` · `AUDIT` · `CODE` · `DOCS`.

**Each report type has one set of states that divides its whole unit with no overlap.** The same states drive the tiles, the table columns, the breakdown bar and the groups in Records, so the tiles and the tables add up to the same totals.

## Where it lands, and how it is handed over

`<repository>/docs/artifacts/reports/<type>-report.html` — `coverage-report.html`, `tests-report.html`, `audit-report.html`, `code-report.html`, `docs-report.html`. **Each is replaced in place** by the next report of its type. A report kept because the moment mattered, such as an incident, is dated in its filename and never overwritten.

**Never publish a report unless the developer asks — MUST** (decision `RD.DEVEX.WORKSPACE.117`). Hand it over as the **full path** to the file, which the developer opens in a browser. A publishing tool's own default to publish without being asked does not apply. When the developer does ask, the file stays the source, and you hand the URL back with the full path beside it.

**You publish the bundled copy, never the stored page — MUST** (decision `RD.DEVEX.WORKSPACE.215`). The publishing host does not load the shared stylesheet, so a page that links it arrives with no styling. Run `spn-devex docs sds bundle <page>`, which writes `<page>.bundled.html` beside the page with the styles inside it, and publish that copy. The check before a publish refuses a page that links a stylesheet from outside. Send the bundled copy as well to a reader who has no network.

- **The artifacts folder is earned.** A repository that has never had a page written has no `docs/artifacts/`; writing the first report creates it. Nested folders are allowed there, and they carry no `README.md`.
- **A report is not an approach document.** An approach page argues a design and lives in its workstream folder; the `ideate` skill writes it. If what you are writing weighs options and chooses one, it is not a report.

## Copy the template, then fill it

**Start from `refs/devex/workspace/docs/templates/pages/report-template.html`.** It holds only the page's structure — its sections with their ids, the slots you fill, and the two lines that load the shared stylesheet and script — and no rule (decision `RD.DEVEX.WORKSPACE.182`). Every rule for filling it is in this skill.

**The page you write links the shared files, and holds no copy of them — MUST** (decision `RD.DEVEX.WORKSPACE.214`). The copy keeps the template's two lines: one links one version of `sds-docs.css` by its address, and the other loads `sds-docs.js` from the same version. The stylesheet gives the report its forms in both themes. The script shows the Generated time and builds the outline. A report needs no style of its own: every form it uses is in the shared stylesheet. A `style` attribute stays only where the template has one, such as the width of a column.

**Keep the template's class names, and every one opens with `sds-`** (decision `RD.DEVEX.WORKSPACE.216`). A class the shared stylesheet does not hold has no form, so never invent one. A result takes one of the status classes: `sds-success`, `sds-warning` or `sds-error` (decision `RD.DEVEX.WORKSPACE.217`).

**A report is written by you, not produced by a command.** No tool renders it. You run the measuring commands, decide what is worth saying, and fill the template — which is how a report can name a fault no check could.

## The header

```text
Type: Report | For: <roles>
Repo: <folder name> | Commit: <short hash> | Generated: <time>
```

- **Title**: the report's name, such as *Coverage report*.
- **Subtitle**: the question, naming the repository by its folder name — *How much of spn-support-ts is written, built and proved?*
- **Description**: one paragraph saying what was counted, **with no number**, and when you would read it.
- **Generated** is `generatedAt`, a date and a time with its offset (`2026-09-30T12:57+05:30`), in a `<time class="sds-local" datetime="…">` element whose text is the same value; the shared script shows it in the reader's own time zone.
- **No status, and no comparison with an earlier report — MUST** (decision `RD.DEVEX.WORKSPACE.192`). A report is a snapshot, and Generated says when its numbers were true. `docs audit` refuses a report that carries a status.
- **The metadata block** carries `id`, `variant` (`report`), `reportType`, `title`, `repository`, `generatedAt`, `summary` and `keywords`. A `tests` report also carries `measuredAt`, the newest `Updated at` among the rows it read, stated in Measured and never in the header. Where no row cites a run, the block leaves `measuredAt` out and Measured says that no run is stamped; `docs audit` refuses the key written as `null`.

**Each report type has one approved Subtitle**, copied word for word with `{repo}` replaced by the repository's folder name:

| Report | Subtitle |
| --- | --- |
| `coverage` | *How much of {repo} is written, built and proved?* |
| `tests` | *Which of the things {repo} promises are checked by a test that passed?* |
| `audit` | *Is {repo} set up the way the standard says?* |
| `code` | *Where does {repo}'s source depart from the stack's standards?* |
| `docs` | *Where do {repo}'s documents depart from the docs standards?* |

The approved masthead, the poor examples and the check before you save a masthead are in `refs/devex/workspace/docs/doc-sets.md` § Every page opens on a masthead of three levels. **Show any other Title or Subtitle to the developer before you write it** (decisions `RD.DEVEX.WORKSPACE.182` · `RD.DEVEX.WORKSPACE.187`).

## The five sections, always in this order — MUST

Each section's `id` is `s0` to `s4` in page order.

| # | Section | Answers | Holds |
| --- | --- | --- | --- |
| 1 | **Summary** | where do we stand? | a verdict · three or four tiles · one breakdown bar · **Top gaps**, three lines |
| 2 | **Findings** | the facts, by axis | the report type's own axis tables first, then **Repository → Apps → Packages** |
| 3 | **Records** | what exactly do I fix? | list items in folded groups by cause |
| 4 | **Measured** | how were these numbers produced? | **Scope**, **Measure again** and **Not looked at**, shown; the **Method** table, folded |
| 5 | **Recommendations** | what closes the gaps? | **The agent closes these** · **The agent closes these and flags them** · **Needs you** |

Records and Recommendations are left out only when there is nothing to put in them.

### Summary — it stands alone as a slide

Every section fits about one screen, and Records is folded so it never swamps the page.

- **The verdict** is short sentences with one fact each, the first under about twenty words. It answers the Subtitle with the headline number and its unit, and says how many items need the developer: *All 21 design topics are built. Tests prove 318 of 324 behaviours. 1 item needs your decision.* It names the unit in plain words, so the count is never met before the thing counted.
- **The terms line** is at most one short paragraph under the verdict, of two or three sentences: the words the tiles use, each explained, and one real member quoted from what was measured. On the audit, code and docs reports it says once what PASS, WARN and FAIL mean.
- **The tiles** are three or four of the report type's own measures. The title says what is counted (*Pages passed*). The big number carries its total (*119 / 149*): the first number bold, ` / 149` lighter, in the page's sans font. The share sits on the same line, right-aligned, smaller, in the mono font (*80%*), with the bar directly below. A count with no total shows its title and its number only: no total, no share and no bar. **A tile's bar is green only for a measure that is done**; a tile that counts a gap takes the gap or failure colour, and every other tile the accent. **No donut, no pie, and no Needs you tile**: that count is in the verdict and heads the Needs you group.
- **The breakdown bar** is one stacked bar split by the report type's states, each segment as wide as its share. A state at 0 stays in the legend and leaves the bar, and a segment above 0 keeps a small minimum width so it can always be seen. **Colour is never the only signal**: the legend names every state with its number, stripes mark the states colour alone cannot tell apart, and each segment carries its count as a tooltip.
- **Top gaps** are the three largest gaps, worst first, one line each, and each line names its count, its unit and where it sits. Where fewer than three exist, the next finding fills the slot.

### Findings — one axis per table

- **The report type's own axis tables come first** (per type, below).
- **Then Repository → Apps → Packages**, headed by those plain nouns, with no *By*. The docs report has no owner tables.
- **Repository has one row per domain** — the folders under `02-constructs/` and `03-behaviors/` — **in the docs tree's order**, then the whole-repository row, then the total. It is not sorted worst first. It has **no Project type column and no design topics column**: its columns are Name, then the report type's counts, and a column only a project can have is left out or shows —.
- **Apps and Packages share the same columns.** Apps has one row per app and no module rows; a module's behaviours and checks count in its app, and a module-level gap shows in Records. **Only the code report keeps module rows**, because each module has violations of its own.
- **The owner tables carry only the report type's states.** Anything else lives in an axis table or in Records.
- **A name cell has two levels, never three — MUST**: a bold title, and at most one second line in `<span class="sds-sub-line">`. The second line starts with the project type, never a column, and joins a second fact with ` - ` (`SUPPORT_WEB - unit · component`). **A second line describes; it never counts.** A project's name is the bold title, never a `code` chip.
- **Every table is worst row first**, except the tables in the docs tree's order, and has a **total row**, marks its gap cells, and carries **one sentence naming its units**. A gap cell holds a number above 0 in a gap column, or a state that is not done, and a failing cell carries the stronger mark. Under the owner tables, one sentence states **the totals rule**: each table totals its own level, and anything that spans several owners is counted in each owner and once at repository level.
- **Tables with the same columns have the same widths — MUST.** Each is a `table.sds-grid` with a `<colgroup>`: name and text columns first, counts last. Count columns are one fixed width per report — coverage `7rem`, tests `5.5rem`, audit and code `5.5rem`, docs `7.5rem` — and the name column takes the rest. Text tables keep percent widths: the docs Rules table 64 · 18 · 18, Measure again 30 · 22 · 28 · 20, Recommendations 6 · 46 · 24 · 24. **A column heading never wraps.** A grid's minimum width is its count columns plus `12rem`.

### Records — list items, never a table — MUST

- **One `<details class="sds-record-group">` per cause**, closed on screen, worst group first — every FAIL group before every WARN group, and FAILED before PENDING before PLANNED on the tests report — and within one grade the larger group first. **Level 1 is the cause**, the thing one fix closes. **Level 2 is where it happens**, added when a group holds more than about twenty items. Items are worst first, and every item is listed, with none cut.
- **The group's summary line**: the cause in the Findings' own words · the count with its unit · the worst state · the Decided by mix, leaving out a decider at 0 — *Naming · 175 · WARN · Agent 150 · Developer 25*.
- **An item** (`<li class="sds-record">`) is a state dot, the location in code type, one plain sentence, and a small second line. The dot is filled in the failure colour for the worst state, filled in the gap colour for the middle one, and an empty ring for the least, so its shape carries the grade as well as its colour; the grade is also its accessible name.
- **Every item has a stable id** `<KIND>.<GROUP>.<nnn>` (`CODE.HIST.047`), a **Decided by** value with its reason, and the data attributes `data-id`, `data-rule`, `data-severity`, `data-decider` (`agent`, `agent-flagged` or `developer`) and `data-location`, so you can read the list back without parsing sentences.
- **Every group prints open.**
- **One item per file inside a group** (`RD.DEVEX.WORKSPACE.208`). Where one cause occurs many times in one file, the item names the file once, with the count and the first line it occurs on. Never one item per occurrence.
- **One list.** The page and the data file it is built from flag the same records.

### Measured — shows three things and folds one

- **Scope**: one sentence saying what was read — which trees and packages, and whether the working tree was clean — and the run-time window where it differs from Generated. It never repeats what the header carries, and a `tests` report names its `measuredAt` here.
- **Measure again**: the one or two commands that rerun the measurement, then one sentence giving the digest to compare, or saying there is no digest and why.
- **Not looked at**: what was out of scope, what could not be read, and so what a clean result does not prove. Never left out: a report never says a thing is fine because it did not look.
- **Method**: Step · Read from · Command · Result, one row per step in the order it ran, folded under *How each number was produced* — closed on screen, open in print. Read from is a path, Command is the exact command, and Result is its number with its unit. A count no command prints is worked out in a step of its own that says how. Further scope facts, such as the tools and their versions, follow the table as a list.
- Under the table, one paragraph states the rule that set each record's Decided by (§ Who decides, below), and one says how each project's behaviours, pages or checks were attributed to it.

### Recommendations — three groups, by who decides — MUST

The first two groups are a table of **# · Recommendation · Closes · Done when**:

| Column | Holds |
| --- | --- |
| **#** | the order to do them in: a FAIL fix first, then the fix that closes the most |
| **Recommendation** | a verb first, the command or the file, then a **Why:** line naming the rule that allows it |
| **Closes** | the gap, how much of it, its unit and the record ids, then an **Owner:** line naming a role, a package or a path |
| **Done when** | a condition a person can check, usually what this report reads when it is run again |

**No Decided by column and no Effort column**: the group heading says who decides, and Closes says what an action is worth.

**Needs you is short cards**, headed with its count (*Needs you: 4 records, in 4 decisions*). Each card has a heading naming the decision as a question, then *What*, *Why it needs you* and the *Options*, and a closing line with the option you would take. **You copy each card unchanged to a `Q<n>` card on the arc's page**, so write it as a card from the start (`refs/devex/workspace/docs/decision-cards.md`).

## Who decides — MUST

Every record and every recommendation says who decides it, by one rule:

| Decided by | When |
| --- | --- |
| **Agent** | the fix is local, a rule states the answer, and no consumer or shared system changes |
| **Agent, flagged** | you can make the fix, but it changes behaviour, a published file, or code people copy, so the developer sees it in review |
| **Developer** | the book does not decide it or contradicts itself, a consumer breaks, or the fix touches a release or shared infrastructure |

**Each report type starts from these rules**, and a case they do not cover is judged by the table above. Decide first what the book, the plugin references and the lenses settle (`RD.DEVEX.WORKSPACE.193`); Developer is for what they leave open.

| Report | You close it | You close it and flag it | The developer decides |
| --- | --- | --- | --- |
| Coverage | a Where row for a built seat; a path that resolves to nothing | retiering or rewriting a row no case can prove | removing a construct; changing what a row promises |
| Tests | writing a missing case; fixing a flaky wait | retiering a row | a product gap, such as a screen that does not exist |
| Audit | a self-dependency, which is no finding where the package's own source imports the package by its name; a missing `envs/` | removing a duplicate `project.json` | the release model; plugin version policy |
| Code | history comments; unawaited promises; label-key case | naming inside one package | renaming a published export; a rule the book has not settled |
| Docs | restamping a status the rows deny; writing a glossary term as code | adding a persona the rows name | a new persona; a contradiction in the book |

## Plain words — MUST

Developers and leaders who have not learned the book's words read a report, so it uses plain ones. The book's term stays only in `code`, where a reader would search for it — a folder or file name, or a value such as `APP_WEB`.

| The book says | A report writes |
| --- | --- |
| seat | docs folder (`03-behaviors/`) |
| construct, construct page | design topic (a page under `02-constructs/`) |
| kind | project type (`APP_WEB`) |
| derive, add up to | worked out from |
| realize | implement |
| pocket | folder |
| behaviour row | behaviour, defined once as *something the code promises to do* |
| case, test case | test |
| owed tier | a test level the project type owes |

- A word is defined only when the page has to use it, in one short clause.
- **No sentence narrates the page's own order** (*the layers come first, then …*). A section opens with its first table, or with at most one plain sentence saying what it answers.
- Tables keep their column names — PASS, WARN, FAIL, the status values, Written, Built, Proved — and the prose around them uses the plain words.
- **Define the unit before you count it.** *This repository writes down 58 things it should be able to do* comes before *16 are tested*, because a reader cannot picture a count of something they have not met.
- **Quote one real member of whatever you counted**, taken from what you measured.
- **Name a set by what its members do, never by their labels**: *the ones that check a screen, a published interface, several pieces working together, or a whole journey*, rather than a list of tier names.
- **The test**: a reader who has never opened the book finishes the Summary knowing what the number means.

## Each report type

### Coverage — how much is written, built and proved?

| Part | What you write |
| --- | --- |
| **Measure** | `spn-devex coverage measure <repo> --json`. Put its `digest` in Measure again. Stamp `generatedAt` with the `measuredAt` it returns; the block carries no `measuredAt` key |
| **Tiles** | **Written** (a count, no bar) · **Built** x / y (behaviours whose design topic is built, of behaviours written) · **Proved** x / y (of behaviours written) · **Not written** (a count only: files and folders in `src/` no document names) |
| **Breakdown bar** | behaviours: proved · not proved |
| **Findings** | **Repository** by domain, plus the whole-repository row: Name · Written · Built · Proved · Not written (— for a domain) · Not built · Not proved → **Apps** → **Packages**: Name · Written · Built · Proved · Not written · Not built · Not proved |
| **Records** | level 1 the gap — Not written · Not built · Not proved · Not proved: whole repository · Ids used twice; level 2 the package or app. An item is a path, a seat or a row id, and the gap |

**Every side counts behaviours, so the numbers compare directly** (decision `RD.DEVEX.WORKSPACE.191`). A design topic is built when its capability chapter exists and every path its `## Where` table names resolves in `src/`; each of its behaviours then counts as built. **A whole-repository behaviour has no design topic, so it is never built**, even when a test proves it. Not built is Written minus Built, and Not proved is Written minus Proved. Not written counts files and folders in `src/` that no Where row names, so it is never Written subtracted from anything.

**A `MANUAL` row counts in none of the numbers — MUST.** A person proves it by following the repository's *Check in a Browser* guide, and no run records it, so counted as written it would read as *Not proved* and open a gap that is not there. The command already leaves it out of Written, Built and Proved at every level and lists it per level as `manual: [{ id, file }]`. Show it in two places: **one line under Findings** — *N behaviours are proved by hand, in Check in a Browser* — and a Records group **Proved by hand** that lists each with the guide's check that names it. A manual row no check in the guide names is listed there as a gap. **The report rolls up and never lists a behaviour**; the tests report keeps each one, so link it for the detail. A count says how much, never how well.

### Tests — what have the tests proved?

| Part | What you write |
| --- | --- |
| **Measure** | `spn-devex behaviours coverage show <repo> --json`, its `digest`, and `measuredAt` — the newest `Updated at` among the rows it read, which can be older than the page. Where the command returns `measuredAt` as `null`, no row cites a run: leave the key out of the block and say so in Measured |
| **Tiles** | **SUCCESS · FAILED · PENDING · PLANNED**, each x / y of all written behaviours, with a one-line key under the breakdown bar: SUCCESS, the run the behaviour cites, at its own test level, passed; FAILED; PENDING, the test exists and was skipped or has not run; PLANNED, no test names it |
| **Breakdown bar** | behaviours: SUCCESS · FAILED · PENDING · PLANNED |
| **Findings** | **By tier**: Tier · Runs · Written · Built · SUCCESS · FAILED · PENDING · PLANNED, from the command's `tiers` · **Repository** by domain → **Apps** → **Packages**: Name · Written · Built · SUCCESS · FAILED · PENDING · PLANNED |
| **Records** | level 1 the status — FAILED → PENDING → PLANNED; level 2 the tier. An item is the row id, its claim, its tier, its status and the run it cites |

**The tests report reads the stamped rows only**: each row's `Status`, and the run its `Updated at` names. It opens no run file, so what it counts is what the stamp wrote; the command's `tiers[].runs` lists the runs each tier's rows cite, and *Runs* is their count. **The statuses sum to Written**, and Built counts behaviours whose design topic is built, the same as the coverage report. **A `MANUAL` row counts in none of the numbers — MUST**, so the four statuses still add up to Written: the command lists them as `manual` per domain and in total, and you show them as the coverage report does, in one line under Findings and the Records group **Proved by hand**. By tier has no *Last run* column: when each tier ran is stated under Measured. An Apps or Packages name cell's second line is the project type, then ` - `, then the tiers its stamped rows name, never a count. **A run speaks for the tiers it ran and no others**: a behaviour whose tier did not run is unproved, not failing.

### Audit — is the repository set up the way the standard says?

| Part | What you write |
| --- | --- |
| **Measure** | `spnutils apps validate repo`, `spnutils apps validate`, `spnutils apps validate package <name>`, and the plugin list (`claude plugin list --json`, from the workspace root). No digest: there is no single command |
| **Tiles** | Checks passed · **Apps clean** · **Packages clean** · Plugins current. *Clean* means no WARN and no FAIL |
| **Breakdown bar** | checks: PASS · WARN · FAIL |
| **Findings** | **By area**: Area · Checks · PASS · WARN · FAIL · **Plugins**: Plugin · Declared · Installed · Source · State · **Repository → Apps → Packages**: Name · Checks · PASS · WARN · FAIL |
| **Records** | level 1 the area, level 2 the check. An item is the check, the file, and what was expected against what was found |

**The audit is about setup only — MUST**: the repository and project manifests, build, tool and release configuration, dependencies and versions, environment files, and the agent's plugins. **It never reports a finding another report owns**: a test a project owes is the tests report's, what a page says — a file it names, a file name it gives — is the docs report's, and what source does, such as a command's own defect, is the code report's. A check that a configuration exists stays in the audit; what a document calls it belongs to the docs report. A failing module check counts in its app and is a record named by the module's folder.

### Code — where does the source depart from the stack's standards?

| Part | What you write |
| --- | --- |
| **Measure** | `spnutils apps check <package>` for every project, the scans behind each rule, and what was sampled rather than read in full. No digest |
| **Unit and states** | one check is one rule applied to one package, where the rule applies. **Lint is one check per package**: PASS with no warnings, WARN with warnings, FAIL with errors. A violation is FAIL when it changes behaviour or breaks consumers, WARN when it is a name, a layout or a comment. Never HIGH, MEDIUM or LOW |
| **Tiles** | Checks passed · **Apps clean** · **Packages clean** · FAIL violations. *Clean* means no WARN and no FAIL in this report, and an app is clean only when its modules are too |
| **Breakdown bar** | checks: PASS · WARN · FAIL |
| **Findings** | **By layer**: Layer · Checks · PASS · WARN · FAIL · **By rule group**: Group · Checks · PASS · WARN · FAIL · **Repository → Apps → Packages**: Name · Checks · PASS · WARN · FAIL, with one row per module under Apps. No *By rule* table: Records lists every rule under its group |
| **Records** | level 1 the rule group, level 2 the rule. An item is `file:line`, what the code does, and what the rule wants |

**Rule groups** are the stack standard's own files: Naming (02) · Structure (03) · Lifecycle (04) · Code patterns (05) · Service (06) · Data (07) · Web (08) · Errors and output (09) · Configuration (10) · Generation (11) · Toolchain (12) · Libraries (14) · **Lint**. Tests (13), kinds (01) and conformance (15) belong to the tests and audit reports. **Layers** are the book's: Frame · Contract · App · Entry · Migrations · Feature folders. `src/generated/**`, `_shadcn/**` and `tests/` are not judged.

### Docs — where do the documents depart from the docs standards?

| Part | What you write |
| --- | --- |
| **Measure** | `spn-devex docs audit check <repo>/docs`, `spn-devex docs parity check <repo>`, `spn-devex docs topics check <repo>`, and `spn-devex docs status check <repo>/docs/02-constructs` — **the action is `check`, never `write`**, which would rewrite the pages. No digest |
| **Unit and states** | one check is one page. FAIL is a page with a RULE finding, WARN a page with SOFT findings only; the page says so once, because RULE and SOFT are the command's own words |
| **Tiles** | Pages passed · Docs folders complete · Design topics done |
| **Breakdown bar** | pages: PASS · WARN · FAIL |
| **Findings** | **Standard by docs folder**: Docs folder · Pages · PASS · WARN · FAIL · **Status by docs folder**: Docs folder · Pages · DONE · IMPLEMENTING · PLANNING · No status — both in the docs tree's order (`01-purpose` → `02-constructs` → `03-behaviors` → `04-capabilities` → `05-guides` → `registers` → `artifacts` → `README.md`), not worst first · **Rules**: Rule · State · Pages. **No Repository, Apps or Packages tables** |
| **Records** | level 1 the rule, FAIL rules first; level 2 the docs folder. An item is `page:line` and the finding |

**A construct page counts at the status its behaviours work out to, and every other page at the status it states**; a report states none. A construct page stating another status than its behaviours work out to is the FAIL finding *status contradicts rows*. `docs audit` runs the same status check on each construct page it reads and writes nothing, so count that finding once.

## How it looks

- **Worst first everywhere, green only for what is done, and every number carries its unit.**
- **Charts are static SVG or plain markup written into the page**, which the shared stylesheet styles, with no script and no library. They read in both themes and they print. No pie chart, donut, Pareto chart or status grid, and every value a chart draws is also written as a number beside it.
- **At phone width, `40rem` and below, there is no sideways page scroll**; a wide table scrolls inside its own box, and the side gutter is `16px` rather than the `8px` every page has above that width.
- **In print**, page 1 holds the header and the Summary, every later section starts a new page, the rail is hidden, Records prints open, and the page prints in the light theme with its colours kept.

## Voice

**A report takes the one voice** (decisions `RD.DEVEX.WORKSPACE.096` · `RD.DEVEX.WORKSPACE.106`), with the plain words above: second person where you address the reader, present tense, short sentences. The tables stay records and are never warmed. Load `refs/devex/workspace/docs/doc-sets.md` § One voice before writing. The `spn-devex` doc-check hook measures the page as you write it.

## How to write one

1. **Confirm the report type and the repository.** If the request names no repository and the workspace holds more than one, ask — never infer from the last file touched.
2. **Run the measuring commands** for the type, from a clean working tree, and keep what each printed. Record the commit you read.
3. **Read the sources, not summaries of them.** The point of a report is the difference between what the tree contains and what the docs claim.
4. **Copy the template** to `docs/artifacts/reports/<type>-report.html` and fill the header, then the five sections in order, from what you measured.
5. **Set Decided by on every record**, by § Who decides, and write the Needs you cards.
6. **Check the page**: `spn-devex docs audit check <the page>` reads clean, and every number on it traces to a Method row.
7. **Hand it over as the full path.** Say the verdict in one line. Then open an arc for the records you may close, and raise the Needs you cards as `Q<n>` cards on its page. Publish nothing unless the developer asks.

## Bring the numbers of an existing page current

**`spn-devex report refresh write <page>` measures a `coverage` or a `tests` report again and writes the numbers into the page.** Run it when a developer asks for the report to be brought current (decision `RD.DEVEX.WORKSPACE.212`). A release, a close or a finished run is not a reason to run it. Stamping the rows stays part of every run, whether or not a page exists.

- **What it writes**: the tiles, the breakdown bar and its legend, the count cells of the Findings tables, the digest, and `generatedAt`. On a `tests` report it also writes `measuredAt`, and leaves the key out where no run is stamped.
- **What it leaves to you**: every sentence. Read the verdict, the terms line, Top gaps, Records and Recommendations against the new numbers, and set Commit in the header to the commit you measured.
- **It prints each row it could not place**, on a line that starts with `!`: a project or a domain the page has no row for, with its counts, and a row on the page that the measurement does not return. Write or remove those rows yourself, from the counts the line gives.
- **A page whose digest already matches is left as it is.**
- **An `audit`, `code` or `docs` report is refused by name.** Each is measured by several commands and a reading, so write it again by the steps above.

## What this skill never does

- **Never write outside `docs/artifacts/reports/`.** A finding that belongs in a standard is a decision entry someone else makes.
- **Never generate on a schedule or a hunch.** On request only.
- **Never leave two live copies of one type.** The report is replaced in place.
- **Never fix what it finds.** The arc and the cards do that, after the report.
- **Never soften a result.** A repository that fails its own standards is reported as failing, with the specific records.
- **Never publish unless asked.**
