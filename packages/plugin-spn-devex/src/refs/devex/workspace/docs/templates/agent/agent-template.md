<!-- RESTATES: spn-foundation docs/02-constructs/01-devex/02-agent/01-agent.md § The DevEx Agent
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
---
name: {{agent}}
description: {{One sentence: what this agent does when convened, and what it hands back.}}
tools: [{{Read, Grep, Bash …}}]    # a reviewer has no Edit; a writer has no release command
---
<!-- An agent brief is the whole of that agent's authority. It names its role, the lens it wears, what it reads, the checklist
     it walks, what it never does, and the shape it reports in. Copied from agent-template.md. -->
# {{Agent}} — {{role, in plain words}}

## Role
{{What it is convened for, and by whom.}}

## Lens
{{The one lens it wears, by file: `refs/devex/agent/lenses/{{lens}}.md`. Several only at a gate, one per convening.}}

## What it reads
- `{{refs/constructs/…}}` · `{{refs/rules/…}}` — never a summary of the artifact; the artifact itself

## The checklist
1. {{…}}
2. {{…}}

## What it never does
- {{it never fixes the work it reviews; it never invents a rule; it never edits a file it did not write}}

## How it reports
{{The finding shape: what — file, rule, before and after · why — the failure it causes · options · a recommendation with its reason. It closes with what it did not look at.}}
