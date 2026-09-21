<!-- spn:doc
{
  "id": "spn-claude-marketplace-artifacts",
  "title": "Artifacts — What This Repository Authors",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "IMPLEMENTING",
  "summary": "The pocket of this repository: the construct pages produced from the model's seat files, and the reports somebody asked for.",
  "keywords": ["artifacts", "pocket", "constructs", "reports", "marketplace", "plugins"]
}
-->

# Artifacts — What This Repository Authors

`For: Architect · Engineering leader` · `Status: 🚧 IMPLEMENTING`

You consult a pocket; you never read it through. That is why it carries no number, and why it sits outside the five seats the 📖 walk crosses in order.

**The folder set is fixed**: `overviews/`, `constructs/`, `reports/` and nothing else. A folder here is earned, so this pocket carries only what this repository actually authors — it holds no `overviews/` yet, because nothing has needed the model's face expanded beyond what `CONCEPT.md` states.

## Constructs

One page per construct, **produced from its seat file and never edited by hand**. Edit the seat under [`02-constructs/`](../02-constructs/README.md) and produce the page again; a page that disagrees with its seat is a defect the audit reports.

| Page | States |
| --- | --- |
| [Plugin Set](constructs/01-spn-core/01-plugin-set-construct.html) | what a plugin is, and what the set of them covers |
| [Hook Set](constructs/01-spn-core/02-hook-set-construct.html) | what a hook is, and when each fires |
| [Skill Set](constructs/01-spn-core/07-skill-set-construct.html) | what a skill is, and what invoking one does |
| [Ref Set](constructs/01-spn-core/08-ref-set-construct.html) | what a ref restates, and from which chapter |
| [Agent Set](constructs/01-spn-core/10-agent-set-construct.html) | what an agent is, and which lens each carries |

## Reports

A report answers a question at a moment. It is **superseded** by the next run of the same template, or **kept** and dated in its filename where the particular answer is worth holding onto.

| Report | Answers | Lifecycle |
| --- | --- | --- |
| [Docs audit](reports/docs-audit.md) | what this repository's docs tree holds, and what it owes | superseded on the next run |

## What does not live here

**An argument does not live here.** An approach document belongs to the workstream that argues it, under `.spndevex/workstreams/`, and it closes with that workstream. The pocket holds what the repository states and what somebody measured; where a design was weighed is the workstream's record.

**Nor does a source a seat depends on.** Nothing in a pocket may be depended on — that is what makes a stale report safe to leave standing. A fact a seat needs lives in that seat.

**Nor the plugins themselves.** They are the repository's work, not a description of it: [`plugins/`](../../plugins/) at the root is where they are authored and delivered.
