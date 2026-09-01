---
name: report
description: Produce a report or an approach document into a node's artifacts pocket - a repo audit, a change plan, a surface diff, a traceability matrix, an estate plan, a release note, an incident record, or a drift report. Use when the user asks what a repo looks like today, what a change would touch, what drifted, or asks for the reasoning behind a design to be written up. Never run unasked. Stack-agnostic; the stack plugin supplies the commands each template reads from.
---

# report — an answer to a question at a moment

**A report is written on request and never on initiative.** A report produced to fill a slot is an answer to a question nobody had, and it costs the reader the time to work out that they did not need it. If nobody asked, do not write one.

## The templates

| Template | Answers | Lifecycle |
| --- | --- | --- |
| `REPO_AUDIT` | what this repository looks like against the standards, today | superseded |
| `CHANGE_PLAN` | what a proposed change would touch, and in what order | superseded |
| `SURFACE_DIFF` | what changed in a published surface between two versions | superseded |
| `TRACEABILITY_MATRIX` | which behavior rows have proof, and where | superseded |
| `ESTATE_PLAN` | what a change needs provisioned, configured, or promoted | superseded |
| `RELEASE_NOTE` | what shipped in one release | **kept** |
| `INCIDENT_RECORD` | what happened, what was done, what changed because of it | **kept** |
| `DRIFT_REPORT` | where the code and the documents disagree | superseded |

- **`superseded`** — replaced in place by the next run of the same template, so a node never accumulates six audits nobody will re-read.
- **`kept`** — dated in its filename and never overwritten, because the value is the record of that particular moment.

## Where it lands

`<node>/docs/artifacts/reports/<template-slug>.html` — or `<template-slug>-<date>.html` where the template is `kept`.

- **The artifacts pocket is earned.** A node that has never authored anything has no pocket; creating one is part of writing the first report into it.
- **Nested folders are allowed here and nowhere else in a pocket**, and sub-folders carry **no `README.md`** — the pocket's own README says what the pocket holds.
- **A report is not the pocket's only authored kind, and the neighbours are easy to confuse.** A report answers a question **at a moment** and carries an as-of; an **approach document** argues a design — options weighed, one chosen — at `docs/artifacts/approaches/<topic>-approach.html`, replaced in place while `Open` holds a card; an **overview** expands one `CONCEPT.md` section to reading depth at `docs/artifacts/overviews/<section>-overview.html`. The suffix set is closed (decisions RD.DOCS.039 · RD.DOCS.040). If what you are writing has no as-of, it is not a report — route it before writing.
- **An approach document's `How` has two halves.** It says what is built and how it stays true, then names **what re-aligns** — every document the reasoning obliges, with its owner and state. A contradicted artifact appears there as *a register row names which side is wrong*, never as an edit. An empty table means the design obliges no document, which is rare, or that you stopped early.

## Format

**Reports and approach documents are HTML; everything in a seat is Markdown.** The split is by reader. A seat is read by a person *and* parsed by tooling, so it stays in the format both handle. An artifact here is read by a person only — often someone outside the repository, often on a screen where a wide table needs to scroll on its own — so it gets a format that can carry a diagram, a stepper, and a sticky outline.

Every report opens with the same three things, in this order:

1. **The question**, in one sentence — what was asked, not what was found.
2. **The answer**, in one paragraph — the finding a reader who stops here should leave with.
3. **When and against what** — the commit, the version, or the date the answer is true of. A report with no as-of is a report that cannot be superseded, because nobody can tell which is newer.

Then the body, and it obeys the corpus rules that apply everywhere: no changelog prose, no live counts outside a table that *is* the count, and no claim of a status the underlying documents deny.

## Voice

**A report is prose, and it takes the one voice** (decisions RD.DOCS.031 · RD.DOCS.043). Write it to the person who asked: second person, present tense, around fifteen words a sentence. Define each house term where it first appears. Keep MUST wherever a sentence is normative; force lives in the exact term, never in a dense sentence. The tables stay records — a finding row, a count, a matrix keep their form and are never warmed. HTML is no exemption. Load `refs/doc-sets.md` § One voice before writing. The `spn-core` doc-check hook measures the page as you write it. A sentence past thirty words is a finding, and so is a page that never says *you*.

## How to produce one

1. **Confirm the template and the node.** Which of the templates, and whose pocket it lands in. If the request does not name a node and the repository holds more than one, ask — never infer from the last file touched.
2. **Read the sources, not summaries of them.** An audit that reports what the docs claim rather than what the tree contains is worthless; the point of the report is the difference between the two.
3. **Run what can be run.** Where a template's answer is derivable from a command — validation, codegen freshness, test results — run it and report what it returned, including its failures. A number you did not obtain is stated as *not measured*, never estimated.
4. **Say what you did not look at.** Every report closes with its own coverage boundary, so a clean result is never mistaken for a scope it did not have.
5. **Offer the follow-up, do not take it.** A report that finds problems ends by naming what would fix them; it does not fix them, and it does not create tasks or decision entries — it drafts one and a person decides.

## What this skill never does

- **Never write into a seat.** Reports live in a pocket. A finding that belongs in a standard is a decision entry someone else makes.
- **Never generate on a schedule or a hunch.** On request only.
- **Never overwrite a `kept` report**, and never leave two live copies of a `superseded` one.
- **Never soften a result.** A repository that fails its own standards is reported as failing, with the specific rows; a report whose job is to be reassuring has no job.
