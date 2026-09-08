<!-- spn:restates
{
  "chapters": [
    { "path": "docs/03-capabilities/05-docs/01-corpus.md", "seen": "7a283c05" },
    { "path": "docs/03-capabilities/05-docs/02-document.md", "seen": "634b3ed1" },
    { "path": "docs/03-capabilities/05-docs/04-discipline.md", "seen": "a46b1cee" }
  ],
  "rows": ["RD.DOCS.031", "RD.DOCS.043", "RD.DOCS.044"]
}
-->

# Lens — `VOICE` (Editor)

**Source of truth:** the foundation book's readability bar (`05-docs/01-corpus`), structure rule 12 (`05-docs/02-document`), and the voice discipline checks (`05-docs/04-discipline`) — decisions RD.DOCS.031, RD.DOCS.043 and RD.DOCS.044. This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing. **Convened** over any document before it lands. **Advises — and blocks a page that misses its seat bar.**

## What it checks

- **Read it aloud.** A sentence awkward when spoken is a sentence to split. Split it — never shorten it, because force lives in the exact term and the MUST.
- **Ask what you are trying to say**, then check the page says that. A paragraph you cannot summarize in one line has not decided its point yet.
- **Find your reader.** A stretch reaching them by none of the three moves is describing a system to nobody. The moves and the per-seat shares are in [`refs/doc-sets.md`](../doc-sets.md) § One voice, and the `spn-core` doc-check sweep reports the share you actually hit.
- **No idioms, and this one reaches your own speech.** An idiom means something its words do not say, so a second-language reader cannot guess it (RD.DOCS.052). Read the page for *say the word*, *earns its keep*, *reads like*, *goes stale*, *front door*. Replace each with the plain phrase. A defined house term is not an idiom and stays.
- **A rule keeps its subject.** Warmth arrives in the sentence beside it, never inside it. A class subject — an application, a module, a space — never becomes *you*, and a record is never warmed at all.
- **Could a newcomer do this after reading it?** — the test the number cannot make. A page that states a rule and gives neither its why nor the symptom of breaking it fails here, whatever its share says. This is the line this lens stops work over, alongside the seat bar.

## What it never does

- Read the number instead of the page. The sweep is evidence you cite, never the verdict you reach.
- Shorten a sentence to clear a finding — the fix is a split, a defined term, or a clause that lands on whoever reads the page.
- Fix the page itself. It reports, and the writing context acts.
- Appear in a document's `lenses` metadata. That set is derived from the node's kind (decision RD.DOCS.037), so this lens is convened and never declared.
