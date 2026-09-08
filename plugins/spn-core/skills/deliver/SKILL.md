---
name: deliver
description: How a change reaches a running setup - what must be true before a release, what a version means, and what is never part of the payload. Use when publishing a package, cutting a release, promoting a change, or judging whether work is releasable. Stack-agnostic; the stack plugin supplies the release commands and lifecycle bins.
---

# deliver — what must be true before it ships

**A release is a claim that the artifact and its sources agree.** Everything below exists to make that claim true rather than hopeful.

## The gates, in order

1. **Derived artifacts are fresh.** Regenerate everything a generator owns, then prove nothing changed. **A diff here is the finding.** It means either generated output was hand-edited or a generator was never re-run — and both mean the artifact about to ship disagrees with its source.
2. **Structural conformance passes.** Every project still is what its manifest says it is.
3. **Build, lint, and format are green** for what is being released, at the scope that is being released.
4. **Tests pass at the tier that proves the change** — with the count reported, not the color.
5. **The doc seat the change touched says what is now true.** A status that reads *implemented* for something in progress is the failure this gate exists to catch.

Run the gates cheapest-first so a failure stops the run early. **Never report a gate you did not run**, and never infer one from another.

## What the version means

- **Additive changes are additive.** New optional fields, new enum values, new methods — these do not break a consumer and are versioned accordingly.
- **A breaking change is a planned, versioned event with a migration path.** It is never a silent edit, and it is the headline of the release rather than a line in it.
- **Set the version from the release process, never by hand.** A hand-edited version is a claim nobody checked.
- **What ships is what was built.** Publishing from a working tree that differs from what was verified defeats every gate above it.

## What travels with the package

A published package carries the artifacts that describe it. Generate them at build, so they sit inside the same archive as the code they describe, and therefore cannot drift from their own version. That property is what the rule exists for: an artifact that shipped separately would be a claim about a version rather than a fact of it.

## What is never part of it

- **Secrets, credentials, and internal host names.** Local development values are still values that should not leave the machine.
- **Scratch artifacts** — logs, dumps, screenshots, probe scripts, temporary files.
- **Status-tracking documents.** Progress belongs in the tracker and the history, never in files that ship.
- **Anything a consumer cannot act on** — a reference to a repository they do not have, or a path that only resolves in a full workspace.

## Promotion

A change reaches a running setup by moving through setups, not by being rebuilt for each one. The artifact promoted is the artifact tested; configuration differs per setup, the build does not. Where a setup needs different behavior, that is configuration read at runtime — never a separate build.

## Lenses

Wear `refs/lenses/infra.md` and `refs/lenses/partner.md` — the release gates are where a surface reduction or an unversioned break is caught last and cheapest.

## Finish

Report: which gates ran with their actual output, what version was produced, what changed for a consumer, and — where anything breaks — the migration path in the same message. A release note that omits a breaking change is worse than no release note.
