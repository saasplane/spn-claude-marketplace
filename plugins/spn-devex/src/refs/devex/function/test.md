<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/05-test.md", "seen": "8f8c3d72" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/05-test.md", "seen": "2f7905be" }
  ]
}
-->
# Test — the proof half of a contract the documents already made

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/05-test.md` and `04-capabilities/01-devex/01-function/05-test.md`. Read this as the restatement; the book governs.

## Testing is not a gate bolted on the end

**Every behaviour row carries an id, and a test cites that id.** So the suite is not a second opinion about the code — it is the evidence for a claim the documents already made.

**A claim with no proof is visible.** That is the point of the id: an unproven row is findable rather than merely absent.

**A failing test names the row it breaks**, so a red run says which promise stopped being true rather than which function threw.

**Status is found rather than asserted.** Nobody types that a behaviour works; the run decides it.

## The tier is derived, not debated

**A node's kind fixes its consumer, and the consumer fixes the tier.** Where a test goes is not a preference.

**Pick by what would break.** If the thing that could go wrong is the unit's own logic, it is a unit case. If it is the seam to something real, it is integration.

**A node may double a seam it owns, and nothing else.** That single rule decides where a case lives: a case reaching for a double of somebody else's seam belongs in the other node.

**A dash in the tier map is a ruling, not a gap.** A kind that owns no journey tier is prohibited from having one, not merely unusual.

## Two distinctions people collapse

**Static gates are not tests.** A linter, a type-check and a write-time refusal all prove something, and none of them is evidence for a behaviour row. Counting them as tests inflates a number nobody can act on.

**Harness, fixture and helper are kept apart.** A harness runs cases, a fixture is data, a helper is shared code. Merging them makes a failure in one read as a failure in another.

## Reading a result honestly

**A skipped case proves nothing.** Read the count, not the colour — and remember that a run whose service was unreachable skips silently.

**Run the tier that owns the rule you changed.** A change to a refusal needs the tier where refusals actually run; the cheaper tiers pass straight over it.

**Data, isolation, and what a case may destroy** are decided before the case is written, because a case that destroys shared state fails the next run rather than its own.
