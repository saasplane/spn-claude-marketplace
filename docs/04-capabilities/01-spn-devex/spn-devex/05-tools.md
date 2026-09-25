<!-- spn:doc
{"id": "spn-devex-capabilities-tools", "variant": "capability", "title": "Tools in spn-devex", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["tools"], "summary": "Six commands run by their own path rather than fired by an event — the corpus audit, the corpus against itself, the drift check that crosses into the book, the partner proof, the prose triage, and the writer of the repository's own behaviour rows.", "keywords": ["tool", "audit", "drift", "coherence", "partner", "triage", "exit code"]}
-->

# Tools in spn-devex

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Tools`

Nothing in this folder is wired in `hooks.json`. Each file is invoked by its own path — by a person, a skill, or another tool — and prints findings and an exit code rather than a verdict. The grading is the line a hook draws: **`RULE` refuses and `SOFT` reports**, and the exit code carries only the refusals. Know before you open the folder that **two of these ask questions that look alike and are not**, and no repository holds the trees both would need.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| The corpus audit | `plugins/spn-devex/hooks/tools/docs.ts` | `audit` · `face` · `page` · `status` · `topics` · `coverage` · `figures` |
| The corpus against itself | `plugins/spn-devex/hooks/tools/coherence.ts` | six questions answered only across documents |
| The book comparison | `plugins/spn-devex/hooks/tools/restate-drift.ts` | each restatement re-hashed against the chapter it names |
| The partner proof | `plugins/spn-devex/hooks/tools/partner-shape.ts` | every hook run against a plugins-only repository |
| The prose triage | `plugins/spn-devex/hooks/tools/prose-triage.ts` | the paragraphs worth a rewrite, found by pattern |
| This repository's own rows | `plugins/spn-devex/hooks/tools/behaviour-status.mjs` | writes `Status` and `Updated at` from a run's artifact |

## Follows the pattern

- A tool is run by name and grades its own findings — [The Tool](../../../02-constructs/01-spn-devex/05-tools.md)
- The `spn:restates` block and the hash a citation carries — [The Ref](../../../02-constructs/01-spn-devex/08-ref-set.md)

## Special handling

### One file serves the write-time check and the on-demand tool

**Why** — *a rule answered one way at write time and another in a sweep is two rules*. A produced page writes its headings as HTML and its seat file writes them as markdown.
**What** — `docs.ts` holds every document check the corpus runs and reads both spellings. Reading only the HTML once reported every hand-written construct as missing all six sections it carried.
**How** — fences are blanked first, so an example in a code block is content. `plugins/spn-devex/hooks/tools/docs.ts`.

### Coherence compares documents; drift crosses a boundary

**Why** — *`coherence.ts` must run in any repository*, and every question it asks compares documents inside one. No repository holds the plugins and the book together.
**What** — coherence asks six cross-document questions: a closed vocabulary saying different things, a row carrying more than one ruling, two documents ruling one subject without citing each other, a count written into a growing set, a face skipping a section of its concept, and a restatement fallen behind. Drift asks the last one alone, against a book it is handed.
**How** — both read one parser, so the block cannot be read two ways. `coherence.ts`, `restate-drift.ts`, and `plugins/spn-devex/hooks/lib/restates.ts`.

### A partner holds no book, and silence is the contract

**Why** — *what the foundation publishes is the corrected restatement, never the checker*. A hook that crashes on a missing input shows a partner a broken agent rather than a missing file.
**What** — the proof builds a repository carrying only what a partner has and runs every hook against it. A crash is a failure; a finding is not, because findings are that repository's business.
**How** — it picks an interpreter from each script's extension, so it works through a port. Run it after touching any hook, and before any release. `plugins/spn-devex/hooks/tools/partner-shape.ts`.

### The triage reports candidates, and three faults are left to a reader

**Why** — *handing a whole corpus to a rewriting pass is the expensive way to do it*, and most of it needs no change.
**What** — six of the nine prose faults are found by pattern and reported with their paragraphs. A compressed claim, a rule with no action, and a merely dull abstraction cannot be told from good prose by a pattern, so they are not guessed at.
**How** — code, tables, headings and front matter come out before scoring, and a ledger of hashes lets a long sweep resume. `plugins/spn-devex/hooks/tools/prose-triage.ts`.

### This repository writes its own behaviour rows

**Why** — *`spnutils` serves a `GENERAL` repository with its docs commands only*, so no stack runner writes the rows here. The plugins' own suite knows.
**What** — only `Status` and `Updated at` are written, from the run's results file. A row whose tier no result covered is left as it was, and a row marked `MANUAL` is never written over.
**How** — it reads the artifact shape `spn-apps`'s writer reads, so a stack repository and this one report in one vocabulary. `plugins/spn-devex/hooks/tools/behaviour-status.mjs`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters a drift run re-hashes, and the page templates | the book is read where it exists, never required |
| takes | spn-devex's checks | the card parser and the prose reader | one reading of a card, one of a paragraph |
| publishes | every repository | the audit, the face generation, the page production | one instrument, run everywhere |
