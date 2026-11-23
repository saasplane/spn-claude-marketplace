<!-- RESTATES: spn-foundation docs/02-constructs/01-devex/02-agent/02-skills.md § DevEx Skills · docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § A construct's status is derived, never typed
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
---
name: {{skill}}
description: {{One sentence a person reads in the skill list: what you ask for, and what you get.}}
serves: {{the DevEx stage it serves, or any}}
opens: [{{templates/…}}]            # the template every file it writes is copied from
reads: [{{refs/rules/…}}, {{refs/constructs/…}}]   # the model, then the rules — by path
runs: [{{spnutils …}}, {{hook or check}}]           # the checks it runs before it reports done
---
<!-- A skill is one unit of work. It opens a template and never writes from memory; it names what it reads; it says what
     done means and what it never does. The structural check reads these sections. Copied from skill-template.md. -->
# {{Skill}} — {{what it does, in plain words}}

## When to use it
{{The request that maps to this skill, and the one that does not.}}

## What it reads first
1. `{{refs/constructs/…}}` — the model
2. `{{refs/rules/…}}` — the rules
3. `{{templates/…}}` — the shape of what it writes

## Steps
1. {{…}}
2. {{…}}

## Done when
{{The observable state, and the check that shows it.}}

## What it never does
- {{…}}
