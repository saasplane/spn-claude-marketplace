# Decision cards — the one shape for anything a person must decide

A decision card exists so someone can **decide without re-doing the analysis**. It is not a
status update, not a summary, and not a list of things you did not get to.

**This file is the single home for the shape.** It is cited by `agents/spn-engineer.md`,
`skills/ideate/SKILL.md` and `refs/lenses/lead.md` rather than restated in any of them — a
rule with two homes is a rule where the copy nobody updates is the one an agent reads.

## When this applies

Any time a person owes a decision, and always in full when they ask for one:

> *"show open questions"* · *"show open cards"* · *"what's open"* · *"what needs deciding"*

Also: an `ideate` Open section, an arc's open cards, an approach document's `Open`, a review
that surfaced a choice, and the end of any piece of work that leaves something undecided.

**Two open items are two cards.** A sentence beginning *"two things I did not act on"* is the
exact failure this shape prevents.

## The parts

| Part | What it carries |
| --- | --- |
| **Number + summary** | Numbered so a reply can say *"B on 3"* without quoting anything back. The summary names the **choice**, not the topic — *"Where the voice rule lives"*, never *"About the voice rule"* |
| **What** | The change, concretely: the file, the rule, the before → after. Written so someone who was not in the session can pick it up cold — what it is, what state it is in now, what was already tried and rejected |
| **Why it matters** | What it costs to leave as is: the failure it causes, who hits it, and when. Never *"for consistency"* |
| **Options** | A markdown **table**. A / B / C, each with its real trade-off. **"Leave it" is a real option** whenever it is viable |
| **→ Recommendation** | One option named, with **the reasoning that picked it** — not just the letter. Say what argues against it where something real does |
| **Preview** | When the decision is a shape — an outline, a tree, a sample, a code fragment — a compact example inline. A reader who must ask *"show me"* was handed an undecidable card |

## The options table

Always a table. Always lettered. The trade-off in its own column. A prose paragraph of
alternatives cannot be scanned, and cannot be answered by reference.

```markdown
| | Option | Trade-off |
| --- | --- | --- |
| **A** | What would be done | What it costs and what it buys |
| **B** | The real alternative | Why somebody would pick this instead |
```

**The `| --- |` separator row is required.** Without it the block renders as literal text
rather than a table — the most common way this shape is got wrong.

- **Every option must be one somebody would actually pick.** A padded option that exists to
  make the preferred one look obvious is dishonest, and a reader who spots it stops trusting
  the rest of the card.
- **Trade-offs are concrete or absent.** *"Simpler"* is not a trade-off; *"one file to change
  instead of twenty, at the cost of a second name for one concept"* is.
- **State the trade-off, not the verdict.** *"Costs a release"* is a trade-off; *"worse"* is
  the recommendation leaking upward into the table.

## Deferral

A card deliberately not answered is **deferred with a trigger** — the event that brings it
back. *"Later"* is not a trigger. *"The first consumer outside this repo"*, *"the next time
anyone touches the emitter"*, *"when a partner has hundreds of domains"* are: somebody will
notice them happening.

A deferred card keeps **all** its parts. It is deferred, not abbreviated — the person who
meets the trigger reads it cold, months later, and must not have to reconstruct it.

## Tone

**Write to a colleague, not as a system.** Full sentences in **What** and **Why**; tables only
where things are genuinely being compared. Plain words beat impressive ones. Name the cost in
the same breath as the recommendation rather than burying it in a caveat.

A wall of clipped fragments and nested tables is not dense, it is unreadable — it makes the
reader reconstruct the sentences you declined to write. **Length is not the variable**: a
longer description does not make a decision easier, the parts do.

**Never close your own question.** You draft options and recommend; a person decides.
