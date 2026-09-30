<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/05-test.md",
      "seen": "020faf26"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/05-test.md",
      "seen": "765f6a12"
    }
  ]
}
-->
# Test — the proof half of a contract the documents already made

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/05-test.md` and `04-capabilities/01-devex/01-function/05-test.md`. Read this as the restatement; the book governs.

## Testing is not a quality check added after the build

**Every behaviour row carries an id, and a test cites that id.** So the suite is not a second opinion about the code — it is the evidence for a claim the documents already made.

**A claim with no proof is visible.** That is the point of the id: an unproven row is findable rather than merely absent.

**A failing test names the row it breaks**, so a red run says which promise stopped being true rather than which function threw.

**Status is found rather than asserted.** Nobody types that a behaviour works; the run decides it.

**A run is named by whoever starts it, and leaves its answer in a file of that name**: `tests/.output/<tier>/runs/<run>.json`, or `<run>.<phase>.json` for a journey phase. The name is required and the caller chooses it. A reused name replaces that one file, and each tier keeps its 20 newest. The stamp is told which run to read, and writes each row's `Updated at` as the time and the run's name, so a row names the run that proved it.

**The tier decides which cases carry the id** (`RD.DEVEX.FUNCTION.064`). Every contract, component and journey case carries one, and so does every integration case proving a guarantee and every unit case proving a `UNIT` row. A case over a private rule names the rule instead.

**A row's tier equals the tier of the case that proves it.** A run writes only the rows that declare the tier it ran, so a row naming one tier, whose only case runs at another, never reads as proven.

## The tier is derived, not debated

**A node's kind fixes its consumer, and the consumer fixes the tier.** Where a test goes is not a preference.

**Pick by what would break.** If what could go wrong is the unit's own logic, it is a unit case. If it is the seam to something real, it is integration.

**A node may double a seam it owns, and nothing else.** That single rule decides where a case lives: a case reaching for a double of somebody else's seam belongs in the other node.

**A dash in the tier map is a ruling, not a gap.** A kind that owns no journey tier is prohibited from having one, not merely unusual.

## Two distinctions people collapse

**Static gates are not tests.** A linter, a type-check and a write-time refusal all prove something, and none of them is evidence for a behaviour row. Counting them as tests inflates a number nobody can act on.

**Harness, fixture and helper are kept apart.** A harness runs cases, a fixture is data, a helper is shared code. Merging them makes a failure in one read as a failure in another.

## Reading a result honestly

**A skipped case proves nothing.** Read the count, not the colour — and remember that a run whose service was unreachable skips silently.

**A full-repository run fixes what keeps a row unproved before it writes the report**: a row whose tier is not its case's tier, a runner that wrote no run file, a case its tier binds that carries no id, and a red case. What the run cannot fix is named in the report with the reason.

**Run the tier that owns the rule you changed.** A change to a refusal needs the tier where refusals actually run; the cheaper tiers pass straight over it.

**Data, isolation, and what a case may destroy** are decided before the case is written, because a case that destroys shared state fails the next run rather than its own.
