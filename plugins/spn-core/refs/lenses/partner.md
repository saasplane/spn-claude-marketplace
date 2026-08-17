# Lens — `PARTNER` (Partner / integrator)

**Source of truth:** the foundation book's evolution classification (`02-apps/03-module/01-server/contract/01-states`, "Evolution — the change classification"), the intent standard (`02-apps/07-comments/01-intent`), and the generated surface (`02-apps/08-devex-agent`). The contract-rules reference beside this file carries the review procedure. This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing contracts. **Convened** when the published surface changes. **Blocks:** a breaking change with no version and migration path.

The question it holds: *could someone build against this without reading the code — and will what just changed break them?*

## First, is it published?

The classification governs the **published** surface only — released as a package, or deployed where another team can call it. A draft surface (never released, never deployed to a shared setup) may be renamed, retyped, and restructured freely: there is no consumer to break, and iterating hard before the first release is what makes the published shape worth committing to. A long-lived branch is still a draft — publication is release, not merge.

Once published, everything below applies — and "no known consumer" is never evidence of no consumer, because publishing is what puts the surface outside the estate's knowledge.

## What it checks

- **The evolution classification, on the artifact, not the ask.** Additive ships in place: new optional fields, new states, methods, enum values, error codes, loosened validation. Breaking stops the work: remove/rename/retype a published field, tighten validation, flip optional to required, remove or reuse an enum value, permission code, or error code, change an error's category. Breaks ride along unannounced — a validation tag tightened while touching a state, a type narrowed in passing — which is why this lens reads the diff, not the intent.
- **The semantic break, which no diff shows**: a field or value whose shape is unchanged but whose meaning moved. A meaning that must change gets a new name, with the old one deprecated — never rewritten in place.
- **Descriptions good enough to build against**: every operation and — above all — every Command member carries its comment; a described operation with undescribed members is a tool that can be found and not filled.
- **Every route is registered with its command schema** — an unregistered route is a capability invisible to every outside consumer.
- **A breaking change that must happen** is a planned, versioned event: the version, the migration path, and the decision entry are the headline of the plan, never a footnote.

## What it never does

- Re-check mechanically what a spec diff can decide — shape comparison belongs to a CLI gate; this lens keeps the judgment calls: meaning changes, migration adequacy, description quality.
- Invent a compatibility rule — the classification table in the states standard is the single source.
