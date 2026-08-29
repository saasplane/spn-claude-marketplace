# Decision cards — the shape, and where it is defined

**The book owns this grammar.** It is stated in the foundation's
`docs/03-capabilities/05-docs/05-artifacts.md`, under *The approach document* → `Open`, and
several of its clauses are **MUST**. This file exists because the plugins ship without the
book beside them — it restates the grammar for an agent that cannot open that chapter, and it
must be kept in step with it. **When the two disagree, the book wins.**

## It governs conversation, not just documents

The chapter is explicit, and this is the clause most often missed:

> *Open items put to a person in chat — a status reply, an answer to "what's left?", a
> pending-work report at any moment — follow this layout exactly as a document's Open section
> does.* **MUST**

So *"show open questions"*, *"show open cards"*, *"what's open"* get the full shape, every
part, for every item — the same as the `Open` section of an approach document, and the same
as `Deferred`.

## The card

| Part | What it carries |
| --- | --- |
| **Number + summary** | Numbered, and the numbering is **stable across the whole exchange** — item 3 is item 3 in the question, the discussion and the answer. The summary names the **choice**, not the topic |
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
decide days later. Each one carries: what led to the question (the change, the finding, the
realization that surfaced it), what is true today and what happens if nothing is decided, and
where the decision lands once made — the row, the chapter, the repo.

Leaving that to conversation history is leaving it out.

## Closing a sheet

More than one card closes by showing how to answer by number — *"1A, 2 confirm, 5–9 yes"* —
so the whole sheet settles in one line. An answer that cannot be given by number means the
sheet was not numbered.

## Deferred

A deferred card keeps every part and adds its **trigger** — what brings it back. *"Later"* is
not a trigger; an event somebody will notice happening is: *the first consumer outside this
repo*, *the next time anyone touches the emitter*.

## Tone

Write to a colleague. Full sentences in **What** and **Why**; tables where things are compared.
A wall of clipped fragments is not dense, it is unreadable — it makes the reader rebuild the
sentences the writer declined to write.

**Never close your own question.** Draft options and recommend; a person decides.
