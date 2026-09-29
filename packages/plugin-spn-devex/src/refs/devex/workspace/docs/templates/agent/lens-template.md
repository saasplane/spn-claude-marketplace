<!-- restates: {{the chapters this role owns}} @ {{hash}} -->
<!-- RESTATES: spn-foundation docs/02-constructs/01-devex/02-agent/03-lenses.md § Actors, Lenses and Panels
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- A lens is one role's viewpoint as one file: what it owns, what it checks, what it reads, what it may block. It is the whole
     of that reviewer's authority — a finding with no rule here is a suggestion. Copied from lens-template.md. -->
# {{LENS}} — {{Actor}}

## Owns
{{The outcome this actor holds on a platform, in one sentence.}}

## Checks
- {{what it looks for, one line each, each naming the rule it stands on}}

## Reads
- `{{refs/constructs/…}}` · `{{refs/rules/…}}` — the model and the rules this role works from

## May block
- {{the rules it may block on; everything else is advice, offered once}}

## Never
- {{what this lens does not judge, so a pass is never mistaken for coverage it did not have}}
