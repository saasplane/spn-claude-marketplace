<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Stopping in the middle is a handover · § The reload is the one stop you do not choose
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- The handover: written into the arc's log AND given in the reply as a fenced block (02-workstream/01-workstream.md, MUST).
     A window change the agent chooses is offered as the last line of a reply, and the block is given when the developer
     says yes; a forced stop gives it at once. -->
```text
Continue workstream `{{NNN-subject}}`, arc `N{{n}}`, row {{k}}, in a `{{repository}}` window.
    — or, after a plugin reload — Open workstream `{{next NNN-subject}}`; `{{NNN-subject}}` N{{n}} waits on it.
Model: {{Opus 5 · Sonnet 5}}.
Read first: `{{absolute path}}/arcs/N{{n}}-….md` (fields, and row {{k}}), `{{absolute path}}/notes/N{{n}}/plan.md`
  (§ Traps, § Commands, row {{k}}), then `{{the order or seat file being changed}}`.
Pins: re-run the plan's stale check first — `git -C {{repo}} log {{sha}}..HEAD -- {{paths}}`.
State: rows {{…}} ✅ landed; row {{c}} ◐ stopped — done {{…}}, not done {{…}}; row {{h}} ⏸ held on Q{{n}}; rows {{…}} not started.
Live now / waits for the window: {{what is installed and live · what only a new window reads — or "no reload"}}.
Done when: Commands row `{{name}}` → {{Green after}}.
Do not touch: {{files or cycles this window must leave alone}}.
Open: Q{{n}} on `{{approach page}}` — {{one line}} — or "none".
```
