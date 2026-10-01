<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "section": "The approach document — a workstream's, never a repository's",
      "seen": "bb4e1a02"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A card is only for what the rules leave open",
      "seen": "46840166"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The reply while work runs shows what needs you, then what moved",
      "seen": "335e7f56"
    }
  ]
}
-->
# Decision cards — the shape, and where it is defined

**The book owns this grammar.** It is stated in the foundation's
`docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md`, under *The approach document — a workstream's, never a repository's* → `Open`, and
several of its clauses are **MUST**. This file exists because the plugins ship without the
book beside them. It restates the grammar for an agent that cannot open that chapter, and it
must be kept in step with it. **When the two disagree, the book wins.**

## It governs conversation, not just documents

The chapter is explicit, and this is the clause most often missed:

> *Open items put to a person in chat follow this layout exactly as a document's Open section
> does — **MUST**. That covers a status reply, an answer to "what's left?", and a pending-work
> report at any moment.*

**Every phrasing below is one question.** *"open items"* — the book's own wording —
· *"what's left?"* · *"open questions"* · *"open cards"* · *"what's open"* · *"what's pending"*
· *"where are we"*. The list is illustrative, not exhaustive: **anything asking what is
outstanding is this question.** None is a lighter version of another, and none earns a looser
answer. Each gets the full shape, every part, for every item, exactly as a document's `Open`
section does.

The phrasing does not choose the shape; **what the person must do** chooses it:

| They must… | Answer with |
| --- | --- |
| **decide** something before work continues | decision cards — one per open item, full shape |
| **know what is still coming** — agreed, merely unfinished | a checklist — one line per item, in the order they will be done |
| **do nothing** — finished, nothing open | a plain confirmation. Say what changed and stop |

A reply to *"what's left?"* often carries both. Then it carries both, **separated** — never
mixed into one paragraph, because a question buried in a status update is a question nobody
answers. And never invent a card to look thorough: a manufactured question costs real
attention and teaches the reader to skim the ones that matter.

## A card is only for what the rules leave open

**Decide what the book, the plugin references and the lenses settle, and put a card only for what
they leave open — MUST** (`RD.DEVEX.WORKSPACE.193`). Before raising a card, read what exists: the
code, the book, the plugin references, the lenses and the arcs. What they settle, you decide: log the
decision and its reason in the arc, and name it to the developer in one line. A question the book
already answers costs the developer's attention for nothing.

**Get the construct right, not every feature — MUST** (`RD.DEVEX.WORKSPACE.194`). While you shape a
change, propose the constructs the ask needs and their patterns, correct on their own, and stop there.
What they make possible later is one line, *later, not now*, never a construct or an option of its own.

**Suggestion or question — MUST** (`RD.DEVEX.WORKSPACE.199`). While no arc row owns the subject, put a
suggestion, `S<n>`: in chat only, numbered per window, never written to a file, and read by no hook. A
suggestion is a whole card, with the same parts as the card below: what, why, a lettered options table
and the one you recommend. When one reply holds both, the questions and the suggestions sit in two
sections, each with its own cards. Once the answer settles the shape, the arc row
is written, and anything still open becomes the page's next `Q<n>` card, in the shape below.

**A question reaches the developer for one of three reasons, and for no other:**

| Reason | What it covers |
| --- | --- |
| **a boundary shifts** | the scope of an arc or a workstream, a published contract or interface, the security or trust posture, deleting data, cost or infrastructure, what a user sees |
| **information is missing** | a fact that no reading and no measurement can supply |
| **the choice is people's** | priority, taste, business direction |

## The card

| Part | What it carries |
| --- | --- |
| **Number + summary** | Numbered **`Q<n>`**, and the numbering is **stable across the whole exchange** — Q3 is Q3 in the question, the discussion, the answer and the page that later states it. One prefix, because a corpus that has used `O1`, `D1`, bare `1` and a trailing `card D58` costs the reader a guess before they can reply. An `S<n>` suggestion put in chat before an arc row exists has a card's parts, is not a page card, and never reaches a page. The summary names the **choice**, not the topic |
| **What** | The change concretely — the file, the rule, the before → after, in names and counts, not adjectives. It starts from what exists, with the file and the line |
| **Why** | Which of the three reasons makes the choice the developer's, and what it costs to leave as is: the failure it causes. Never *"for consistency"* |
| **Options** | A **table**: lettered, trade-off in its own column. *"Leave it"* is a real option wherever viable, with its cost stated |
| **→ Recommendation** | One option, carrying the reason it wins, and citing what decides it |
| **Preview** | Where the decision is a shape — an outline, a tree, a sample row, a code fragment — inline. A reader who must ask *"show me"* was handed an undecidable card |

**A card on the page is an open card, so it carries a recommendation and no `Decision` field.** A
field saying the card is open says nothing, and a field left empty is a blank somebody feels they
should fill. An answered card leaves the page: its answer folds into the section that then states it.

**On the page, a card is a `div.sds-open` wrapping an `h4` whose `id` is its number, and that is the
one shape — MUST** (`RD.DEVEX.WORKSPACE.147`, `RD.DEVEX.WORKSPACE.216`). The markup is
`<div class="sds-open"><h4 id="q<n>">`. The number is lower case in the `id`, and it is written
`Q<n>` for a reader. Each part's label is a `span.sds-key`, the options are a table inside the card,
and the recommendation is a `div.sds-recommended`. A decided card is a `div.sds-card`. The checks
find an open card by this shape and by nothing else. So a card written in another shape makes a page
look as if it has no questions.

**A page that has not moved to the shared stylesheet still holds the earlier names**, `div.open` and
`div.card`, with no prefix. The checks read both forms until every page has moved.

**Options are a table.** Lettered, one row each, the trade-off in its own column. Prose
alternatives cannot be scanned and cannot be answered by reference — and in markdown the
`| --- |` separator row is required, or the block renders as literal text.

**A design question is filled as an expert would fill it.** Each option's trade-off is set against
the book, against industry practice with a named source — OWASP ASVS, NIST 800-63, the twelve-factor
app, a pattern's own literature — and against the domain's usual workflow. Each lens names the
references it judges against (`refs/devex/agent/lenses/`), so the lens that owns the question says
which source to cite.

**Trade-offs are concrete or absent.** *"Simpler"* is not one; *"one file to change instead of
twenty, at the cost of a second name for one concept"* is.

## Self-contained across sittings

A card assumes **no conversation context and no memory of the session that wrote it** — people
decide days later. Each one carries what led to the question — the change, the finding, the
realization that surfaced it. State what is true today, and what happens if nothing is
decided. Name where the decision lands once made: the row, the chapter, the repo.

Leaving that to conversation history is leaving it out.

## Closing a sheet

More than one card closes by showing how to answer by number — *"Q1A, Q2 confirm, Q5–Q9 yes"* —
so the whole sheet settles in one line. An answer that cannot be given by number means the
sheet was not numbered.

**A number is never reused and never restarts.** A card answered earlier in the exchange leaves a
gap, and the gap is the record that it was settled. Renumbering what is left makes the answer you
already gave point at a different question. A reopened card keeps its number and gains a letter —
`Q6` becomes `Q6A`, then `Q6B` — so a log reading *reopened twice, then settled* still resolves.

**A card raised in conversation keeps the number it was given there.** The person has been reading
those numbers, so the page uses them rather than starting a second run.

> Restates `01-devex/04-workspace/04-docs/05-artifacts.md` — *The approach document* → `Open`. Where the two
> disagree, the chapter wins.

## While a card is open

**A row that only waits on a card's answer, with nothing half-done, is held rather than stopped.**
It carries `⏸ held on Q<n>`, because nothing in it is unsafe to touch and the answer alone frees it
(`RD.DEVEX.WORKSPACE.188`). A row that began and then met the question is `◐ stopped`, and its `→`
names the card. Rows the answer cannot change keep running.

**A card is shown in full once, at the top of the reply that raises it — MUST**
(`RD.DEVEX.WORKSPACE.189`). It goes under **Needs you** at the start of that reply, in markdown, and
never again in the body of the same reply. While it stays open, each later reply names it in one line
— its number, its question, and where it is — before the progress. The full card stays on the
approach page. `refs/devex/workspace/workstream.md` § *The reply while work runs shows what needs you,
then what moved* holds that shape.

**The cards named there are those of the workstream you are working on — MUST**
(`RD.DEVEX.WORKSPACE.197`). A card on another workstream's page belongs to the window that works
there. A workstream you open while you help shape an idea is yours from then on.

**An answer lands in the arc's notes in the same turn — MUST** (`RD.DEVEX.WORKSPACE.193`): in the
card, answered and folded; in the arc, as a log line and a change to every row it affects; and in the
arc's notes — its spec, its plan, and any sample they name.

## Deferred

A deferred card keeps every part and adds its **trigger** — what brings it back. *"Later"* is
not a trigger; an event somebody will notice happening is: *the first consumer outside this
repo*, *the next time anyone touches the emitter*.

## Tone

Write to a colleague. Full sentences in **What** and **Why**; tables where things are compared.
A wall of clipped fragments is not dense, it is unreadable — it makes the reader rebuild the
sentences the writer declined to write.

**Never close your own question.** Draft options and recommend; a person decides. A question the
rules settle never becomes a card in the first place: you decide it and log why.
