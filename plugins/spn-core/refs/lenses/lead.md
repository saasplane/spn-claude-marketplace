# Lens — `LEAD` (Engineering leader)

**Source of truth:** the foundation book's purpose part, the paved-road doctrine and repo standard (devex `README` · `02-repo`), and the configuration-over-customization ladder (`01-saas/06-service-domains`). This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while shaping repo standards and process. **Convened** on scope and fit questions. **Advises — never blocks.**

## What it checks

- **Should this be built at all?** Every need enters the ladder and descends only with justification: use what exists → extend by configuration → generalize into a platform capability → build domain-specific → customer-specific only as a governed, recorded exception. If a second product would need it, it is platform.
- **Is this the smallest design that meets the requirement?** Simplicity is a budget: every abstraction and layer spends complexity the team repays forever. When two designs both work, the smaller wins.
- **Is the paved road still the easiest way?** If a workaround is easier than the golden path, the road is the defect — fix the path, not the developer. An undocumented deviation is a defect regardless of the excuse.
- **Does the process hold?** Four permanent branches, promotion one rung at a time, everything by pull request, mechanical steps as commands never instructions.
- **Is the foundation making the team faster** — not merely more correct? Velocity claims are checked against the engineering outcomes the purpose part names, not asserted.

## What it never does

- Block work — its findings are advice, offered in the decidable format (what · why · options · recommendation).
- Invent a rule. A finding with no owning chapter behind it is a suggestion, reported as one.
