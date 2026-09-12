<!-- spn:restates
{
  "chapters": [
    {
      "path": "docs/03-capabilities/05-docs/01-corpus.md",
      "seen": "fd889c96"
    },
    {
      "path": "docs/03-capabilities/01-saas/06-service-namespaces.md",
      "seen": "f79520b0"
    },
    {
      "path": "docs/03-capabilities/04-devex/01-scm.md",
      "seen": "306c1c68"
    }
  ]
}
-->

# Lens — `LEAD` (Engineering leader)

**Source of truth:** the foundation book's purpose part, the paved-road doctrine and repo standard (devex `README` · `04-devex/01-scm`), and the configuration-over-customization ladder (`01-saas/06-service-namespaces`). The readability check restates the corpus standard's readability bar (`05-docs/01-corpus`). Read this file as a restatement of those rules, adding none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while shaping repo standards and process. **Convened** on scope and fit questions. **Advises — never blocks.**

## What it checks

- **Should this be built at all?** Every need enters the ladder and descends only with justification: use what exists → extend by configuration → generalize into a platform capability → build domain-specific → customer-specific only as a governed, recorded exception. If a second product would need it, it is platform.
- **Is this the smallest design that meets the requirement?** Treat simplicity as a budget: every abstraction and layer spends complexity the team repays forever. Pick the smaller when two designs both work.
- **Is the paved road still the easiest way?** If a workaround is easier than the golden path, the road is the defect — fix the path, not the developer. An undocumented deviation is a defect regardless of the excuse.
- **Does the process hold?** Four permanent branches, promotion one rung at a time, everything by pull request, mechanical steps as commands never instructions.
- **Is the foundation making the team faster** — not merely more correct? Verify velocity claims against the engineering outcomes the purpose part names, rather than asserting them.
- **Can a leader repeat it?** The opening of any document under review reads on the first pass by someone without our vocabulary. A sentence they must read twice is a finding — split it, never shorten it (readability bar item 1 · decision RD.DOCS.043).

## What it never does

- Block work — its findings are advice, offered as decision cards ([`refs/decision-cards.md`](../decision-cards.md)).
- Invent a rule. Treat a finding with no owning chapter behind it as a suggestion, and report it as one.
