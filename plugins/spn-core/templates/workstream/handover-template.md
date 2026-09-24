<!-- The handover: written into the arc's log AND given in the reply as a fenced block (11-workspace.md, MUST). A window
     change the agent chooses is proposed as the last line of a reply and the block is given when the developer says yes;
     a forced stop gives it at once. stop.py warns when a reply says "new window" without a fence, or a fence lacks a field.
     Copied from handover-template.md. -->
<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § Stopping in the middle is a handover
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
```text
Continue workstream `{{NNN-subject}}`, arc `{{N{{n}}-…}}`, step {{k}}, in the `{{repository}}` window.
Model: {{Opus 5 | Sonnet 5}}. Read first: `{{arcs/N{{n}}-….md}}` (the field table and step {{k}}),
then `{{orders/{{repo}}-{{step}}.md}}`, then `{{the seat file or page being changed}}`.
State: rows {{a}}–{{b}} landed; row {{c}} ◐ stopped at {{where}}; nothing else touched.
Done when: {{the observable state, and the command that shows it}}.
Do not touch: {{files or cycles this window must leave alone}}.
Open: {{the card the last window could not answer, or "none"}}.
```
