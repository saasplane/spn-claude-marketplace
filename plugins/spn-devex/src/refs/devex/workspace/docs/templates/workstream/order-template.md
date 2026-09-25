<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The arc — a delegated execution
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
# Handover to {{the repository}} — {{the step}}

**Run this in the repository's own window.** It loads that repository's `CLAUDE.md` and its plugins. The source of every decision below is workstream `{{NNN-subject}}`, arc `{{N{{n}}-….md}}` (steps {{a}} to {{b}}), and the approach page `{{subject}}-approach.html`.

<!-- An order is one delegated execution: the brief half is written before the window opens, the report half when it closes.
     Never widen it mid-execution; a new scope is a new arc. Copied from order-template.md. -->

## The outcome
{{What is true when this order is done, in one paragraph, and the command that shows it.}}

## The rule, as it already stands elsewhere
{{Where the same rule is already enforced, name the file and say: read it whole before writing anything.}}

## Steps
| # | What | How you would know it works |
| --- | --- | --- |
| 1 | {{…}} | {{…}} |

## What this order never does
- {{the boundary: files it does not touch, cycles it does not pay}}

---

## Report — written when the window closes
| What landed | Commit | What did not, and why |
| --- | --- | --- |
| {{…}} | `{{sha}}` | {{…}} |

**Next card:** {{the question this order could not answer, as a Q<n> for the page, or "none"}}
