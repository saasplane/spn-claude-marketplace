<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md",
      "seen": "efbbe76f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The masthead, and the opening",
      "seen": "ee951acf"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "How ends in Cycles, and the arcs are the state",
      "seen": "adce1608"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "Reports and templates",
      "seen": "001421d8"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The header — two lines, six fields, produced from the block",
      "seen": "ba60f8f3"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The coverage report — written, built and proved",
      "seen": "c4cb305e"
    }
  ]
}
-->
---
name: report
description: Produce a report or an approach document into a node's artifacts pocket - a repo audit, a change plan, a surface diff, a traceability matrix, an estate plan, a release note, an incident record, or a drift report. Use when the user asks what a repo looks like today, what a change would touch, what drifted, or asks for the reasoning behind a design to be written up. Never run unasked. Stack-agnostic; the domain plugin supplies the commands each template reads from.
---

# report — an answer to a question at a moment

**Read [`refs/devex/workspace/workstream.md`](../../refs/devex/workspace/workstream.md) before acting.** It holds the loop this skill runs inside: how a prompt is read, where a new ask goes, what a prompt does to a running arc, and how a reply closes.

**A report is written on request and never on initiative.** A report produced to fill a slot is an answer to a question nobody had. It costs the reader the time to work out that they did not need it. If nobody asked, do not write one.

## The templates

| Report | Answers | Read against |
| --- | --- | --- |
| **`audit`** | is this repository **wired** the way the standard says — its plugin set and versions, its `sprepo.json` and `spkind.json`, its configuration files, and what has drifted from what it declares | the repository standard and the repository's own manifests |
| **`code`** | where the **source** departs from the stack's standards — naming, structure, the patterns a kind owes | the stack's provider files |
| **`docs`** | where the **corpus** departs from the docs standards — a missing seat, a page off its template, a term used two ways | the docs chapters |
| **`tests`** | what the tests have **proved**, and what nothing has proved yet | the behaviour rows, joined to what the last run reported |
| **`coverage`** | how much of the repository is **written, built and proved**, and the gaps between the three | the behaviour rows, each capability chapter's `## Where` table checked against `src/`, and the `tests` report |

**All five are superseded** — the next one replaces it in place, so a pocket never holds six audits nobody will re-read. The set is closed (decision `RD.DEVEX.WORKSPACE.149`); a sixth kind is a decision entry rather than a new filename.


## Where it lands

`<node>/docs/artifacts/reports/<kind>-report.html` — `audit-report.html`, `code-report.html`, `docs-report.html`, `tests-report.html`, `coverage-report.html`. The suffix is the page kind and the name is what it measures, so the folder reads without this skill.

- **The artifacts pocket is earned.** A node that has never authored anything has no pocket; creating one is part of writing the first report into it.
- **Nested folders are allowed here and nowhere else in a pocket**, and sub-folders carry **no `README.md`** — the pocket's own README says what the pocket holds.
- **A report is not the pocket's only authored kind, and the neighbours are easy to confuse.** A report answers a question **at a moment** and carries an as-of. An **approach document** argues a design — options weighed, one chosen — and lives in the workstream that argues it, `.spndevex/workstreams/<state>/<NNN>-<subject>/<subject>-approach.html`, never in a pocket. It is replaced in place while `Open` holds a card. An **overview** expands one `CONCEPT.md` section to reading depth at `docs/artifacts/overviews/<section>-overview.html`. The suffix set is closed (decisions RD.DEVEX.WORKSPACE.102 · RD.DEVEX.WORKSPACE.103). If what you are writing has no as-of, it is not a report — route it before writing.
- **An approach document's `How` ends in Cycles, and the arcs are the state.** `How` shows what each repository's files will say, one subsection per repository and kind of change, and its last subsection is *Cycles*: one row per arc, with Arc · What it does · Status, read from the arcs rather than typed. `spn-devex docs cycles` prints those rows. A table typed a second time on the page is wrong the first time an arc moves.
- **The split plan is the arcs' step rows, never a table on the page.** Each row carries Repo · Altitude · What · Mechanism · Acceptance · State, and the Repo column is the scope: filter by repository and you have what its documents and code must take. The page itself never moves into a repository; it closes with its workstream.
- **The `State` column is read by a gate, so fill it.** Closing a workstream refuses while any row is one nobody decided, is still `in progress`, or is `◐ stopped`; `landed`, `carried` and `deferred` all pass. The check is *accounted for*, never *finished*, so parking work is a recorded act rather than a blocked one.

### The traceability matrix reads the rows, and never derives them

**The behaviour rows ARE the obligation** (decision `RD.SUPPORT.APPS.081`). A row says what a persona can do; a case proves it by
naming the row's id in its title; after a run the agent's row writer stamps `Status` and `Updated at` into the row. So this report **reads two
things and joins them** — the rows in `docs/03-behaviors/`, and what the last run of each tier actually reported.

**It never works the obligation out for itself.** An earlier model derived what a screen owed from the shape of its path,
which reported a screen as covered while most of what can be done there had never been performed. Deriving is the fault
this report exists downstream of.

**A run speaks for the tiers it ran and no others.** Say which tiers the numbers cover, in the report, every time. A row
whose tier did not run is **unproved, not failing**, and those are different findings needing different work.

**A question lives next door and is not this one.** *Did the suite go green?* is the run itself, and folding it into this
report is how a percentage gets back in.

**The numbers come from one command.** Run `spn-devex behaviours coverage <repo> --json` and write `tests-report.html` from
what it returns. Put its `digest` in the page, so the next run can tell whether the page is current. **The runs it read can
be older than the page**, so the block carries two times: `generatedAt`, the moment you write the page, and `measuredAt`,
the newest run the command read, which it returns as `measuredAt`. The header shows `generatedAt`. The run's time is
stated in *What was measured*, never in the header.

### The coverage report rolls up, and never lists a row

**It answers one plain question: how much of this repository is finished?** It answers from the sides written, built and proved, and the gaps between them are what a reader acts on (decision `RD.DEVEX.WORKSPACE.191`).

**The numbers come from one command, and you write the page.** Run `spn-devex coverage measure <repo> --json` and write `coverage-report.html` from what it returns, beside `tests-report.html`. The command never writes the page. Stamp the block's `generatedAt` with the `measuredAt` it returns: a coverage report is written in the sitting that reads the tree, so the two are one moment. The block carries no `measuredAt` key; only a `tests` report does. Put its `digest` in the page, so the next run can tell whether the page is current.

**Name the unit beside every number, because the sides count different things.** Written counts behaviour rows and constructs. Built counts constructs, never rows: a construct is built in a package when its capability chapter there exists and every `## Where` path resolves. Proved counts rows at `SUCCESS` at their own tier. *Stated, not built* counts constructs, *built, not stated* counts seats in `src/`, and *built, not proved* counts rows. Never set a count of rows beside a count of constructs as if they were one scale.

**The page has these sections, in this order**, the shape the developer approved for N120:

1. **Summary** — define a behaviour and the sides in plain words before any number. Then give the repository's three sides as `.sides` tiles from the report template. Each tile is a `.side` with its label, a big number, its unit in `.of`, and a `.bar` whose width is the share: Written is 100% ("324 behaviour rows, in 21 constructs"), Built is constructs of constructs ("of 21 constructs"), and Proved is rows of rows ("of 324 rows"). One sentence after the tiles names the gaps.
2. **What was measured** — one row per side and per gap: what it is counted from, and the command that measured it.
3. **Findings** — the repository first, then one table by package and one by app. Each table reads Level (or Package, or App) · Kind · Written · Built · Proved · Not built · Not proved · Not stated, one number to a cell, with a gap above 0 marked `no`. The column names stay short, so one sentence under the tables names each unit: Written, Proved and Not proved count behaviour rows; Built and Not built count constructs; Not stated counts seats in `src/`. A package's rows are the rows of the constructs its chapters realize, so a construct two packages realize is counted in both and once for the repository. Say so under the table.
4. **What to do** — one row per gap: where it is largest, and what closes it. A path that resolves to nothing is closed by building it or correcting the chapter. A seat no row names is closed by the chapter or the Where row that states it. A row that is not proved is closed by the case that proves it.
5. **What this did not look at** — a count says how much, never how well. Line coverage is printed by each run and is not counted here.

**Never list rows or seats one by one.** The `tests` report keeps every row and every case, so link it for the proved detail. The measurement's lists of paths and seats are for you, to choose what the What to do section names first. They are not a table on the page.

## Format

**Reports and approach documents are HTML; everything in a seat is Markdown.** The split is by reader. A seat is read by a person *and* parsed by tooling, so it stays in the format both handle. An artifact here is read by a person only — often someone outside the repository, often on a screen where a wide table needs to scroll on its own. So it gets a format that can carry a diagram, a stepper, and a sticky outline.

**Every report opens on a masthead of three levels, and each level is plain language — MUST** (decisions RD.DEVEX.WORKSPACE.182 · RD.DEVEX.WORKSPACE.187). The report template carries the rule in its masthead comment, with a good and a poor example for each level; copy the template and read that comment as you fill it.

1. **The Title** — the report's name and its subject.
2. **The Subtitle** — one plain sentence: the question the report answers, what was asked rather than what was found.
3. **The Description** — one paragraph: what was counted, **with no number**; when you would read it; then at most two short sentences on how the page is laid out. The count arrives before the reader knows what was counted, so it moves to `Summary`, the first section, and to the metadata block's `summary` field.

Plain means everyday words, one idea a sentence, no slogan, no figure of speech, and no book word the same sentence does not explain. **Show a new Title or Subtitle to the developer before you write it**, because both speak for the product.

**A report is a snapshot, so it carries no status — MUST** (decision `RD.DEVEX.WORKSPACE.192`). Its block has no `status` key and its header shows no status chip. The Summary says in a sentence what was found. `docs audit` refuses a report that carries either.

**The header says when and against what, in two lines under the breadcrumb**: `Type: Report | For: …`, then `Generated: … | Commit: …`. `generatedAt` is the moment the page was generated, a date and a time with its offset, such as `2026-09-30T12:57+05:30`. The header keeps it in a `<time class="local" datetime="…">` element, and the template's script shows it in the reader's own time zone and format. Where no script runs, the value shows as written, so write the same value as the element's text. Commit is the short hash of the commit the report read. For an `audit`, `code`, `docs` or `coverage` report the page is generated in the moment it measures. A `tests` report reads runs that can be older, so it also carries `measuredAt`, the newest run it read, stated in *What was measured*. A report with no as-of cannot be superseded, because nobody can tell which is newer.

Then the body, and it obeys the corpus rules that apply everywhere. No changelog prose, no live counts outside a table that *is* the count, and no claim of a status the underlying documents deny.

## Voice

**A report is prose, and it takes the one voice** (decisions RD.DEVEX.WORKSPACE.096 · RD.DEVEX.WORKSPACE.106). Write it to the person who asked: second person, present tense, around fifteen words a sentence. Define each house term where it first appears. Keep MUST wherever a sentence is normative; force lives in the exact term, never in a dense sentence. The tables stay records — a finding row, a count, a matrix keep their form and are never warmed. HTML is no exemption. Load `refs/devex/workspace/docs/doc-sets.md` § One voice and § Every page opens on a masthead of three levels before writing. The `spn-devex` doc-check hook measures the page as you write it. A sentence past thirty words is a finding, and so is a page that never says *you*.

## How to produce one

1. **Confirm the template and the node.** Which of the templates, and whose pocket it lands in. If the request does not name a node and the repository holds more than one, ask — never infer from the last file touched.
2. **Read the sources, not summaries of them.** An audit that reports what the docs claim rather than what the tree contains is worthless; the point of the report is the difference between the two.
3. **Run what can be run.** Where a template's answer is derivable from a command — validation, codegen freshness, test results — run it and report what it returned, including its failures. A number you did not obtain is stated as *not measured*, never estimated.
4. **Say what you did not look at.** Every report closes with its own coverage boundary, so a clean result is never mistaken for a scope it did not have.
5. **Offer the follow-up, do not take it.** A report that finds problems ends by naming what would fix them. It does not fix them, and it does not create tasks or decision entries — it drafts one and a person decides.

## What this skill never does

- **Never write into a seat.** Reports live in a pocket. A finding that belongs in a standard is a decision entry someone else makes.
- **Never generate on a schedule or a hunch.** On request only.
- **Never leave two live copies of one kind.** A report is replaced in place, so the previous one goes in the same change.
- **Never soften a result.** A repository that fails its own standards is reported as failing, with the specific rows; a report whose job is to be reassuring has no job.
