# Decision cards — the shape, and where it is defined

**The book owns this grammar.** It is stated in the foundation's
`docs/03-capabilities/05-docs/05-artifacts.md`, under *The approach document* → `Open`, and
several of its clauses are **MUST**. This file exists because the plugins ship without the
book beside them. It restates the grammar for an agent that cannot open that chapter, and it
must be kept in step with it. **When the two disagree, the book wins.**

## It governs conversation, not just documents

The chapter is explicit, and this is the clause most often missed:

> *Open items put to a person in chat follow this layout exactly as a document's Open section
> does — **MUST**. That covers a status reply, an answer to "what's left?", and a pending-work
> report at any moment.*

**These are one question, however it is phrased.** *"open items"* — the book's own wording —
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

## The card

| Part | What it carries |
| --- | --- |
| **Number + summary** | Numbered **`Q<n>`**, and the numbering is **stable across the whole exchange** — Q3 is Q3 in the question, the discussion, the answer and the page that later states it. One prefix, because a corpus that has used `O1`, `D1`, bare `1` and a trailing `card D58` costs the reader a guess before they can reply. The summary names the **choice**, not the topic |
| **What** | The change concretely — the file, the rule, the before → after |
| **Why** | What it costs to leave as is: the failure it causes. Never *"for consistency"* |
| **Options** | A **table**: lettered, trade-off in its own column. *"Leave it"* is a real option wherever viable, with its cost stated |
| **→ Recommendation** | One option, carrying the reason it wins |
| **Preview** | Where the decision is a shape — an outline, a tree, a sample row, a code fragment — inline. A reader who must ask *"show me"* was handed an undecidable card |

**Options are a table.** Lettered, one row each, the trade-off in its own column. Prose
alternatives cannot be scanned and cannot be answered by reference — and in markdown the
`| --- |` separator row is required, or the block renders as literal text.

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

> Digested from `05-docs/05-artifacts.md` — *The approach document* → `Open`. Where the two
> disagree, the chapter wins.

## Deferred

A deferred card keeps every part and adds its **trigger** — what brings it back. *"Later"* is
not a trigger; an event somebody will notice happening is: *the first consumer outside this
repo*, *the next time anyone touches the emitter*.

## Tone

Write to a colleague. Full sentences in **What** and **Why**; tables where things are compared.
A wall of clipped fragments is not dense, it is unreadable — it makes the reader rebuild the
sentences the writer declined to write.

**Never close your own question.** Draft options and recommend; a person decides.
