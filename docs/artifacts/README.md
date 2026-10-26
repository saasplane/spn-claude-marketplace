<!-- spn:doc
{
  "id": "spn-claude-marketplace-artifacts",
  "title": "Artifacts — What This Repository Authors",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "IMPLEMENTING",
  "summary": "The pocket of this repository: the concept hub that gives CONCEPT.md a readable face, the construct pages produced from the model's seat files, and the reports somebody asked for.",
  "keywords": ["artifacts", "pocket", "overview", "hub", "constructs", "reports", "marketplace", "plugins"]
}
-->

# Artifacts — What This Repository Authors

`For: Architect · Engineering leader` · `Status: 🚧 IMPLEMENTING`

You consult a pocket; you never read it through. That is why it carries no number, and why it sits outside the five seats the 📖 walk crosses in order.

**The folder set is fixed**: `docs/`, `guides/`, `reports/` and nothing else, beside the one `index.html`. A folder here is earned, so this pocket carries only what this repository actually authors — today that is the concept hub, one overview per domain, and the construct pages produced from their seat files.

## Overviews

The hub gives [`CONCEPT.md`](../../CONCEPT.md) a readable face. It borrows the concept's own headings, in the concept's own order, and it stops well short of the concept's depth. Below it, each domain has one overview, which takes that domain's constructs in reading order and links each construct page.

| Document | Explains | Status |
| --- | --- | --- |
| [concept-overview](docs/concept-overview.html) | the whole model — what the repository owns and what it refuses, the partner and the builder who hold different halves of it, the five instrument kinds it divides by, and why it declares `GENERAL` | 🚧 |
| [devex-overview](docs/01-devex/devex-overview.html) | `spn-devex`, one folder at a time — what each folder a plugin can ship is for | — |
| [apps-overview](docs/02-apps/apps-overview.html) | `spn-apps`, one folder at a time — and the one folder allowed to name a language | — |
| [infra-overview](docs/03-infra/infra-overview.html) | `spn-infra`, one folder at a time — and the boundary that no folder changes a cloud | — |

There is **one hub per repository**, and it is replaced in place as the concept moves. A hub section with no argument behind it carries a declared gap rather than reading as settled; when one is argued, the argument lands in the workstream that argued it and the section links to it.

## Constructs

One page per construct, **produced from its seat file and never edited by hand**. Edit the seat under [`02-constructs/`](../02-constructs/README.md) and produce the page again; a page that disagrees with its seat is a defect the audit reports.

The pages sit in one folder per domain, mirroring the constructs seat, and each domain's overview links every page in it.

| Folder | Holds the pages for |
| --- | --- |
| [`docs/01-devex/constructs/`](docs/01-devex/constructs/) | `spn-devex` — plugin, hooks, agents, skills, scripts, refs, providers, tests |
| [`docs/02-apps/constructs/`](docs/02-apps/constructs/) | `spn-apps` — plugin, hooks, skills, scripts, refs, providers, tests |
| [`docs/03-infra/constructs/`](docs/03-infra/constructs/) | `spn-infra` — plugin, hooks, skills, scripts, refs, providers, tests |

## Reports

A report answers a question at a moment, and is **replaced in place** by the next one of its kind. There are four, each named for what a reader wants to know (decision `RD.DEVEX.WORKSPACE.149`): **audit** is this repository's wiring, **code** is its source against the stack's standards, **docs** is its corpus against the docs standards, and **tests** is what its tests have proved.

**None is written yet, and that is a fact rather than a gap.** A report is written by the agent on request, never produced by a command — so the pocket holds one when somebody has asked a question, and holds none until then.

## What does not live here

**An argument does not live here.** An approach document belongs to the workstream that argues it, under `.spndevex/workstreams/`, and it closes with that workstream. The pocket holds what the repository states and what somebody measured; where a design was weighed is the workstream's record.

**Nor does a source a seat depends on.** Nothing in a pocket may be depended on — that is what makes a stale report safe to leave standing. A fact a seat needs lives in that seat.

**Nor the plugins themselves.** They are the repository's work, not a description of it: [`packages/`](../../packages/) at the root is where they are authored and delivered, one `plugin-spn-*` folder each.
