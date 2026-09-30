<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Stopping in the middle is a handover · § The reload is the one stop you do not choose
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- The handover: written into the arc's log AND given in the reply as a fenced block (02-workstream/01-workstream.md, MUST).
     A window change the agent chooses is offered as the last line of a reply, and the block is given when the developer
     says yes; a forced stop gives it at once.
     Nine lowercase labels, in this order. Every value starts in the column `do not touch:` sets; a value longer than
     about 100 characters wraps, and each continuation line is indented to the value column. No blank lines inside.
     The window that picks this up compares its own model with `model:` before it acts, so name an exact model. -->
```text
continue:     workstream `{{NNN-subject}}`, arc `N{{n}}`, row {{k}}, in a `{{repository}}` window
              — or, after a plugin reload — open workstream `{{next NNN-subject}}`;
              `{{NNN-subject}}` N{{n}} waits on it
model:        {{an exact model, such as Opus 5.5}}, effort {{high · medium}}
read first:   `{{absolute path}}/arcs/N{{n}}-….md` (fields, and row {{k}}),
              `{{absolute path}}/notes/N{{n}}/plan.md` (§ Traps, § Commands, row {{k}}), then
              `{{the order or seat file being changed}}`
pins:         {{repo}} {{short sha}} · {{repo}} {{short sha}} · {{package}} {{version}} released;
              re-run the plan's stale check first — `git -C {{repo}} log {{sha}}..HEAD -- {{paths}}`
state:        rows {{…}} ✅ landed; row {{c}} ◐ stopped — done {{…}}, not done {{…}};
              row {{h}} ⏸ held on Q{{n}}; rows {{…}} not started
live now:     {{what is installed and live}} · waits for the window:
              {{what only a new window reads}} — or "no reload"
done when:    Commands row `{{name}}` → {{Green after}}
do not touch: {{files or cycles this window must leave alone}}
open:         Q{{n}} on `{{approach page}}` — {{one line}} — or "none"
```
