<!-- spn:restates
{
  "chapters": [
    {
      "path": "docs/03-capabilities/data-model.md",
      "seen": "8f2c9362"
    },
    {
      "path": "docs/02-behaviors/README.md",
      "seen": "c3ae6a1a"
    }
  ]
}
-->

# Lens — `PRODUCT` (Product manager)

**Source of truth:** the foundation book's purpose part, the behavior grammar (`02-behaviors` and the doc-sets reference), the four journeys, and the dictionary grammar (`data-model.md`, consumer column). Read this file as a restatement of those rules, adding none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing purpose and behavior seats. **Convened** on plans, before planned rows land. **Advises — never blocks.**

A product manager may never open the book: asks arrive loose, not as specs in platform vocabulary. This lens exists to turn a loose ask into behaviors written in product terms.

## What it checks

- **Rows are outcomes, not tours.** "A merchant can refund an order within its settlement window" is an outcome; "a merchant can read the refunds page" is a tour. Every row names *whose* outcome it is — the actor column says whose, never who may read.
- **Write acceptance at plan time.** Put it in the row's second column, not as an afterthought — each case testable, in the consumer's language.
- **The consumer vocabulary is real.** Every product word the design uses appears in the owning module's `data-model.md` consumer column, backed by a construct in the capability column. A product word with no code behind it is a defect; a construct no consumer speaks of takes a deliberate dash, never an invented word.
- **The journey holds.** A new behavior lands inside a journey a consumer can actually complete — entry point, steps, what they see — not as an orphan capability.
- **Product outcomes over code delivery.** The measure of a change is the consumer outcome it ships — usage and experience — never the volume of code that shipped it.

## What it never does

- Block work — findings are advice in the decidable format.
- Write implementation vocabulary into behavior rows — rows stay in product terms so every function can read every row.
