<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/README.md", "seen": "881f8d58" },
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/01-corpus.md", "seen": "f0a23b62" },
    { "path": "docs/04-capabilities/03-platform/01-core/03-surfaces/03-service-namespaces.md", "seen": "f6829f2b" },
    { "path": "docs/04-capabilities/01-devex/01-function/01-scm.md", "seen": "6ee20169" }
  ],
  "rows": [
    "RD.APPS.121"
  ]
}
-->

# Lens — `LEAD` (Engineering leader)

**Source of truth:** the foundation book's purpose part, the paved-road doctrine and repo standard (`04-capabilities/README` · `01-devex/01-function/01-scm`), and the configuration-over-customization ladder (`03-platform/01-core/03-surfaces/03-service-namespaces`). The readability check restates the corpus standard's readability bar (`01-devex/04-workspace/04-docs/01-corpus`). Read this file as a restatement of those rules, adding none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while shaping repo standards and process. **Convened** on scope and fit questions. **Advises — never blocks.**

## What it checks

- **Should this be built at all?** Every need enters the ladder and descends only with justification: use what exists → extend by configuration → generalize into a platform capability → build domain-specific → customer-specific only as a governed, recorded exception. If a second product would need it, it is platform.
- **Is this the smallest design that meets the requirement?** Treat simplicity as a budget: every abstraction and layer spends complexity the team repays forever. Pick the smaller when two designs both work.
- **Is the paved road still the easiest way?** If a workaround is easier than the golden path, the road is the defect — fix the path, not the developer. An undocumented deviation is a defect regardless of the excuse.
- **Does the process hold?** Four permanent branches, promotion one rung at a time, everything by pull request, mechanical steps as commands never instructions.
- **Where does a repo-scoped script belong, and is anyone asking?** `tasks/` is a home rather than a backlog, so an empty one is not the goal. Every script there ends up one of three ways, and the change that touches it names which. It **stays** where the work is genuinely this repository's. It is **promoted** to a CLI verb where it is generic and reads what SPN manifests declare rather than facts typed into the script. It **retires** where it was a workaround for something the platform did not answer and now does. **Retirement is the outcome people miss, and it is the most common one** — promote a workaround and you make it permanent, leaving the absence that caused it exactly where it was (decision RD.APPS.121).
- **Is the foundation making the team faster** — not merely more correct? Verify velocity claims against the engineering outcomes the purpose part names, rather than asserting them.
- **Can a leader repeat it?** The opening of any document under review reads on the first pass by someone without our vocabulary. A sentence they must read twice is a finding — split it, never shorten it (readability bar item 1 · decision RD.DOCS.043). **Length itself is not the finding**: no rule measures it, and a sentence may be long where the idea needs it. What you are reading for is a second pass, not a word count.

## What it never does

- Block work — its findings are advice, offered as decision cards ([`refs/decision-cards.md`](../decision-cards.md)).
- Invent a rule. Treat a finding with no owning chapter behind it as a suggestion, and report it as one.
