<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/README.md",
      "seen": "e0e8fec6"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/01-corpus.md",
      "seen": "4bdb182f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/03-surfaces/03-service-namespaces.md",
      "seen": "46ea464f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/02-scm.md",
      "seen": "6e0b1a03"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.SUPPORT.APPS.121",
      "seen": "89aabef8"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.FUNCTION.060",
      "seen": "b3753049"
    }
  ]
}
-->

# Lens — `LEAD` (Engineering leader)

**Source of truth:** the foundation book's purpose part, the paved-road doctrine and repo standard (`04-capabilities/README` · `01-devex/01-function/02-scm`), and the configuration-over-customization ladder (`03-platform/01-core/03-surfaces/03-service-namespaces`). The readability check restates the corpus standard's readability bar (`01-devex/04-workspace/04-docs/01-corpus`). Read this file as a restatement of those rules, adding none of its own; where they disagree, the book wins and this file is regenerated.

**Judged against, beside the book:** the four DORA delivery measures (deployment frequency, lead time for changes, change failure rate, time to restore) for what a process change costs, and the domain's usual workflow for scope. A process option is weighed against the measure it moves.

**Worn** while shaping repo standards and process. **Convened** on scope and fit questions. **Speaks as a view** where direction, boundaries or ownership are decided. **Advises — never blocks.**

## What it checks

- **Is this the right work, in the right order among other work, at the right size?** The lead orders pieces of work against each other and judges how large one should be (`RD.DEVEX.AGENT.087`). The order of the steps inside one piece of work is the `ARCHITECT` lens's, so two lenses never order the same thing.

- **Should this be built at all?** Every need enters the ladder and descends only with justification: use what exists → extend by configuration → generalize into a platform capability → build domain-specific → customer-specific only as a governed, recorded exception. If a second product would need it, it is platform.
- **Is this the smallest design that meets the requirement?** Treat simplicity as a budget: every abstraction and layer spends complexity the team repays forever. Pick the smaller when two designs both work.
- **Is the paved road still the easiest way?** If a workaround is easier than the golden path, the road is the defect — fix the path, not the developer. An undocumented deviation is a defect regardless of the excuse.
- **Does the process hold?** Four permanent branches, promotion one rung at a time, everything by pull request, mechanical steps as commands never instructions.
- **Where does a repo-scoped script belong, and is anyone asking?** Ask who invokes it before you ask what it must know. A person or a pipeline reaches for a `tasks/` script or a CLI command, and the agent's own loop reaches for a hook, so a check or a tool the agent runs belongs in the plugin under `hooks/` or `hooks/tools/`. The bar there is foundational: a check every SaaS Plane repository owes, never one this product happens to want, and an agent that judges one warranted proposes it and builds it only once that is approved (decision RD.DEVEX.FUNCTION.060). `tasks/` is a home rather than a backlog, so an empty one is not the goal. Every script there ends up one of three ways, and the change that touches it names which. It **stays** where the work is genuinely this repository's. It is **promoted** to a CLI command where it is generic and reads what SPN manifests declare rather than facts typed into the script. It **retires** where it was a workaround for something the platform did not answer and now does. **Retirement is the outcome people miss, and it is the most common one** — promote a workaround and you make it permanent, leaving the absence that caused it exactly where it was (decision RD.SUPPORT.APPS.121).
- **Is the foundation making the team faster** — not merely more correct? Verify velocity claims against the engineering outcomes the purpose part names, rather than asserting them.
- **Can a leader repeat it?** The opening of any document under review reads on the first pass by someone without our vocabulary. A sentence they must read twice is a finding — split it, never shorten it (readability bar item 1 · decision RD.DEVEX.WORKSPACE.106). **Length itself is not the finding**: no rule measures it, and a sentence may be long where the idea needs it. What you are reading for is a second pass, not a word count.

## What it never does

- Block work — its findings are advice, offered as decision cards ([`refs/devex/workspace/docs/decision-cards.md`](../../workspace/docs/decision-cards.md)).
- Invent a rule. Treat a finding with no owning chapter behind it as a suggestion, and report it as one.
