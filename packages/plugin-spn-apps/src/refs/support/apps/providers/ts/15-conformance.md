<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/15-conformance.md",
      "seen": "11519e04"
    }
  ]
}
-->
# Conformance — what this stack must prove

**Source of truth:** the foundation's `10-providers/ts/15-conformance.md`. Read this as the restatement; that chapter governs.

**A stack repository answers the book's conformance register with a register of its own**, at `docs/registers/conformance.md` — the register pocket, one word at every altitude.

**The response lives in the stack repository so it can change in the same pull request as the API it describes.** A standard living in the repository it governs would stop governing, which is why the standard stays in the book and only the response moves.

**The response is pinned.** Its header names which version of the provider set the claims are measured against, and reading the pin is how you know what a row is claiming.

## The shape of the response

**A header, then one row per requirement.**

- **Implements** — the provider-set path and the version or commit it is measured against.
- **Scope** — which requirements this repository carries. The Support and Platform repositories split them.
- **A row per requirement** — the requirement, a status, and the evidence.

**A row covers each requirement the register names**: the standards set with the web obligations where that runtime is covered, the runtime set and kind registry, the contract chain and error model, the entry set, the platform pattern catalogue, the stack skills and generated rules, the two-realization model, the foundation CLI adapter, the doc sets following the node grammar, the proof tiers per kind, and versioning with the release contract.

## Rules

- **A status is the book's own vocabulary** — implemented, in progress, or planned — under the same honesty rule as any chapter.
- **Evidence is auditable**: a path, a command, or a named artifact in the repository. Never a sentence of intent.
- **A requirement believed inapplicable is never skipped silently.** It becomes a decision-register row, linked from the response.
- **The pin moves deliberately.** Raising the implemented version is a reviewed change that re-audits every row.
