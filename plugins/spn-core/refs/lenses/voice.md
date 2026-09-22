<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/01-corpus.md", "seen": "f0a23b62" },
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/02-document.md", "seen": "c30fe68a" },
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md", "seen": "90c7128d" }
  ],
  "rows": [
    "RD.DOCS.031",
    "RD.DOCS.043",
    "RD.DOCS.044",
    "RD.DOCS.052",
    "RD.DOCS.060",
    "RD.DOCS.062",
    "RD.DOCS.067",
    "RD.DOCS.071",
    "RD.DOCS.072",
    "RD.DEVEX.032"
  ]
}
-->

# Lens — `VOICE` (Editor)

**Source of truth:** the foundation book's readability bar (`01-devex/04-workspace/04-docs/01-corpus`), the document block, its tag line and the behaviour row (`01-devex/04-workspace/04-docs/02-document`), and the voice discipline checks (`01-devex/04-workspace/04-docs/04-discipline`) — decisions RD.DOCS.031, RD.DOCS.043, RD.DOCS.044, RD.DOCS.052, RD.DOCS.060, RD.DOCS.062, RD.DOCS.067, RD.DOCS.071, RD.DOCS.072 and RD.DEVEX.032. This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing. **Convened** over any document before it lands. **Advises — and blocks a page that misses its seat bar.**

## What it checks

- **Read it aloud.** A sentence awkward when spoken is a sentence to split. Split it — never shorten it, because force lives in the exact term and the MUST.
- **Ask what you are trying to say**, then check the page says that. A paragraph you cannot summarize in one line has not decided its point yet.
- **Find your reader.** A stretch reaching them by none of the three moves is describing a system to nobody. The moves and the per-seat shares are in [`refs/doc-sets.md`](../doc-sets.md) § One voice, and the `spn-core` doc-check sweep reports the share you actually hit.
- **No idioms, and this one reaches your own speech.** An idiom means something its words do not say, so a second-language reader cannot guess it (RD.DOCS.052). Read the page for *say the word*, *earns its keep*, *reads like*, *goes stale*, *front door*. Replace each with the plain phrase. A defined house term is not an idiom and stays.
- **A rule keeps its subject.** Warmth arrives in the sentence beside it, never inside it. A class subject — an application, a module, a space — never becomes *you*, and a record is never warmed at all.
- **Precision outranks warmth on a file that instructs** (RD.DEVEX.032). Where a warmer sentence would be even slightly less exact about what your reader must do, leave the sentence as it is. A page at its bar in mechanical prose is worse than a page under it in good prose — and that ranking runs the other way too, so neither half wins by default.
- **NOTHING MEASURES LENGTH, AND NOTHING COUNTS *you*.** Both measures were dropped. A sentence may be long when the idea needs it, and cutting the link between two ideas to make a sentence shorter is the defect the word count was causing. A count of a pronoun cannot see an imperative, so it read every instruction file as silent when it was anything but, and it rewarded sprinkling the word rather than writing to somebody. What is checked instead is the seven rules: the missing why, the undefined term, the idiom, the carried phrase, the dropped reasoning.
- **The house words are for the people who need them, and a node `README.md` uses none of them** (RD.DOCS.062). *Seam*, *mirror*, *realize*, *face* and *construct* are this book's own words. A developer opening a package for the first time should not have to learn five of them to read its first page. So a node README and a behaviour area use none, and a construct or a mirror **defines each one where it is first met**.
- **A construct is prose, and a developer reads it to Parts and stops.** Terms, Model, Parts, Boundary, Binds, Proof, in that order: Terms first because the model uses those words, Boundary after the parts because an edge is judged once the shape is seen. A section is a container; its content is blocks chosen by kind. Binds and Proof are for the architect and the agent.
- **A behaviour row is a record with a shape, and two of its cells are not yours to write** (RD.DOCS.067 · RD.DOCS.079). The row is `Id · Who · Does · Sees · Where · Type · Tier · Status · Updated at`, plus `Names` where it fulfils a promise. **The count is not stated here**: there are three widths and `02-document.md` is the only place that gives them, because a number repeated is a number that will be wrong somewhere. The rest are declared by hand: what the behaviour is, what realizes it (`Where`), whether it states something a person can do, something they are refused or something the standards promise (`Type`), the tier that will prove it (`Tier`), and the foundation promise it fulfils (`Names`). The agent writes `Status` and `Updated at` from a run. Read `Does` for the arrangement and the action in one clause, with no service, no table and no type in it; read `Sees` for the outcome, which is **never empty**. **A status is a reading and never a claim** — the retired `Proven` cell put a claim where a reading belonged, and the word is the value while the icon is only the rendering.
- **A foundation row is a promise of five cells, and a built repository's row carries all ten** (RD.DOCS.071 · RD.DOCS.072). A promise is `Id · Who · Does · Sees · Type`, with `Type` reading `PROMISE` — the generic behaviour of an area that the standards make possible, written in the actor's own words, whether or not anything fulfils it yet. It carries no `Where`, no `Tier`, no `Status` and no `Updated at`, because the foundation ships no code and nothing could ever write them, and **a foundation row claiming a status is refused**. A row in a built repository carries every cell, and its `Names` cell holds the foundation id it delivers. A promise nothing fulfils is not a gap; it is the standard saying what it expects.
- **A register row is a record and stays one** (RD.DOCS.043). One clause a sentence, the decision column carrying the ruling and nothing else, and *you* inside a row is a finding. This is the one place a length rule survives, and it is a shape rather than a count.
- **Could a newcomer do this after reading it?** — the test the number cannot make. A page that states a rule and gives neither its why nor the symptom of breaking it fails here, whatever its share says. This is the line this lens stops work over, alongside the seat bar.

## What it never does

- Read the number instead of the page. The sweep is evidence you cite, never the verdict you reach.
- Shorten a sentence to clear a finding — the fix is a split, a defined term, or a clause that lands on whoever reads the page.
- Fix the page itself. It reports, and the writing context acts.
- Appear in a document's `lenses` metadata. That set is derived from the node's kind (decision RD.DOCS.037), so this lens is convened and never declared.
