<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Stopping in the middle is a handover · § The reload is the one stop you do not choose
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- The handover: written into the arc's log AND given in the reply as a fenced block (02-workstream/01-workstream.md).
     A window change the agent chooses is offered as the last line of a reply, and the block is given when the developer
     says yes; a forced stop gives it at once.
     The `open:` line is each open point written as the question, with the options considered named as weighed, never as its
     options, so the window that picks it up weighs them fresh (RULE.DEVEX.AGENT.086).
     The handover's state and next steps are what `spn-devex workstream go show` prints, so this block does not write them;
     it keeps only what the data cannot say. Eight lowercase labels, in this order. Every value starts in the column `do not touch:` sets; a value longer than
     about 100 characters wraps, and each continuation line is indented to the value column. No blank lines inside.
     The window that picks this up compares its own model and effort with `model:` before it acts, so name an exact model and an effort. -->
```text
continue:     workstream `{{NNN-subject}}`, arc `N{{nnn}}`, in a `{{repository}}` window; where it stands: `spn-devex workstream go show N{{nnn}}`
              — or, after a plugin reload — open workstream `{{next NNN-subject}}`;
              `{{NNN-subject}}` N{{nnn}} waits on it
model:        {{an exact model, such as Opus 5.5}}, effort {{low · medium · high · xhigh · max}}
read first:   `{{absolute path}}/approach.html#N{{nnn}}` (the arc), `spn-devex workstream go show {{NNN}}/N{{nnn}}` (the parts and what each waits on),
              `{{absolute path}}/notes/N{{nnn}}/plan.md` (§ Traps, § Commands), then
              `{{the order or seat file being changed}}`
pins:         {{repo}} {{short sha}} · {{repo}} {{short sha}} · {{package}} {{version}} released;
              re-run the plan's stale check first — `git -C {{repo}} log {{sha}}..HEAD -- {{paths}}`
live now:     {{what is installed and live}} · waits for the window:
              {{what only a new window reads}} — or "no reload"
done when:    Commands row `{{name}}` → {{Green after}}
do not touch: {{files or cycles this window must leave alone}}
open:         Q{{n}} on `{{approach page}}` — {{the question, as the developer would answer it}}; weighed: {{each option
              considered, by name}} — or "none"
```
