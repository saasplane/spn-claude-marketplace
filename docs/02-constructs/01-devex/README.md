<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-devex",
  "title": "spn-devex — The Stack-Agnostic Domain",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "The model behind the plugin every SaaS Plane repository loads — the folder that delivers it, the code the runtime calls, the commands run by name, the page production, and the skills, restatements, viewpoints and personas a session reads."
}
-->

# spn-devex — The Stack-Agnostic Domain

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

The model for the plugin every repository loads, whatever world it declares. One file per construct, in an order where nothing appears before something it depends on.

Read the first two before anything else. The plugin is the container, and the hook is the shape every piece of running code here takes. Everything below them is one kind of thing that container can hold.

<!-- spn:generated constructs — do not edit inside these markers; `docs.ts face` writes it -->
**The stack-agnostic plugin, and the one every repository loads.** It holds what is true of every plugin: what an instrument of each of the five kinds is, the events a hook may run on, the grades it may return, and how the set a workspace loads is derived from that workspace's own claim.

| Construct | What it is |
| --- | --- |
| [The Plugin — Delivery Unit of the Marketplace](01-plugin.md) | The folder that carries a standard from this repository into a running session — its manifest, its entry in the marketplace list, the installed copy a session actually reads, and the version field that says which bytes those are. |
| [Hooks — Code the Runtime Calls on Your Behalf](02-hooks.md) | Code a plugin wires to the moments a session offers — the file that declares the wiring, the four moments and the authority each one carries, the payload a hook is handed, the verdict it returns rather than prints, and the exit code that is always zero. |
| [Refs — A Chapter, Restated and Stamped](06-refs.md) | A markdown restatement of one or more chapters, carrying a hash of the exact text it last read, so a chapter that moves is reported rather than quietly outrun — and the three ways a restatement can fail to be comparable at all. |
| [Agents — The Personas a Session Convenes, and the Lenses They Are Handed](03-agents.md) | A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the reviewing viewpoint a parameterized brief is handed, and the one condition that viewpoint may block on. |
| [Skills — A Stage's Steps, Loaded on Match](04-skills.md) | A named unit of work a session can be asked for — a folder, a description matched against the work at hand, the instructions loaded once it matches, and the rule that a skill carries steps and never a rule of its own. |
| [Scripts — The Code a Plugin Ships, Wired or Reached by Name](05-scripts.md) | The folder a plugin keeps its code in — the check a moment composes, the tool a person reaches by its own path, the shared library both read, and the rule that one question is decided by one file whichever of the two asks it. |
| [Providers — How a Plugin Is Extended Per Instance](07-providers.md) | How a plugin admits a second stack or a second cloud without a gate being edited — the two halves a provider contributes, the rule that decides whether it contributes a skills half at all, and the line between what a provider states and what it does. |
| [Tests — The Tier, the Mirror, and a Runner That Walks](08-tests.md) | The folder a plugin proves itself from — the tier that says what kind of proof a suite is, the mirror that says what it is proof of, the runner that finds every suite by walking rather than by a list, and the two tiers deliberately left absent. |
<!-- /spn:generated -->

<!-- spn:generated glossary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | What it means |
| --- | --- | --- |
| **The Plugin** | | |
| [a construct](01-plugin.md) | — | one folder a plugin may ship: `hooks/`, `agents/`, `skills/`, `scripts/`, `refs/`, `providers/` or `tests/`. A plugin holds any mix and owes none |
| [a plugin](01-plugin.md) | `plugin.json` | one folder under `packages/`, named for what it serves, carrying `.claude-plugin/plugin.json` and any mix of the constructs below it |
| [the marketplace](01-plugin.md) | `marketplace.json` | the one file at `.claude-plugin/marketplace.json` naming every plugin this repository ships, and the folder each one lives in |
| [the plugin root](01-plugin.md) | `CLAUDE_PLUGIN_ROOT` | the installed folder a session reads, and the base every wired command path is written against |
| [the version](01-plugin.md) | `version` | the field in a manifest saying which bytes are published; the count moves after a release, never before |
| **Hooks** | | |
| [a call about to run](02-hooks.md) | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| [a command that finished](02-hooks.md) | `PostToolUse` | the moment after a shell command has run, when its own text and its result can both be read |
| [a hook](02-hooks.md) | `hooks.json` | a script a plugin wires to a named moment, declared with a matcher, a command and a timeout |
| [a matcher](02-hooks.md) | `matcher` | the names a moment is narrowed to, so a script runs only for the calls it could have an opinion about |
| [a moment](02-hooks.md) | `hooks` | a named point in a session the harness stops at and runs whatever a plugin wired there |
| [a turn about to end](02-hooks.md) | `Stop` | the moment before a reply is handed back, when a warning is still useful and a refusal is not |
| [a verdict](02-hooks.md) | `Verdict` | what a hook decided: `deny` refuses the call, `note` is advice the turn reads, and nothing at all is silence |
| [the call](02-hooks.md) | `ToolInput` | the fields inside that payload a hook actually reads — a file path, a shell command, the content or replacement text a write carries |
| [the dispatcher](02-hooks.md) | `dispatch` | one process that asks every check applying to a call, keeps the first refusal, and joins the advice |
| [the payload](02-hooks.md) | `Payload` | what the harness hands a hook on standard input: the tool's name, the call's own fields, the working folder, the session |
| [the window opening](02-hooks.md) | `SessionStart` | the moment a session begins, resumes or is cleared; its output is the first screen a developer sees |
| **Refs** | | |
| [a ref](06-refs.md) | — | a markdown file under a plugin's `refs/`, restating part of the foundation book for a reader who cannot open it |
| [a source line](06-refs.md) | — | a file's own prose naming what it restates; it is read beside the block, and an omission from the block is a finding |
| [a stamp](06-refs.md) | `Citation` | one entry of the block — a chapter's path, an optional section, and the hash last read there |
| [drift](06-refs.md) | — | a stamp whose hash no longer matches the chapter's text today |
| [the block](06-refs.md) | `spn:restates` | a comment at the top of that file, holding strict JSON, naming what the file restates |
| [the hash](06-refs.md) | `seen` | eight characters over the cited text, with trailing spaces and surrounding blank lines removed |
| **Agents** | | |
| [a brief](03-agents.md) | `agents/` | a markdown file naming a persona a session can convene by name |
| [a lens](03-agents.md) | `lenses/` | one file naming what a single engineering function checks when it reads work |
| [a parameterized brief](03-agents.md) | — | a brief holding a procedure and no subject matter, handed a viewpoint name at the moment it is convened |
| [convened](03-agents.md) | — | a context that did not write the work reading it through one lens and reporting what it found |
| [the audience](03-agents.md) | `lenses` | the field in a document's metadata block, drawn from that same closed set |
| [the block condition](03-agents.md) | — | the one thing a lens may refuse on; everything the file finds below that is advice and says so |
| [the bound model](03-agents.md) | `model` | an optional field choosing which model runs the persona |
| [the bound tools](03-agents.md) | `tools` | an optional field narrowing what the persona may call; leaving it out grants everything the session has |
| [the lens register](03-agents.md) | `LENS_LABEL` | the closed set of viewpoint values, and the reader label each one renders as on a document's own header |
| [worn](03-agents.md) | — | the agent loading a lens for itself while it writes, so the work is right the first time |
| **Skills** | | |
| [a mode](04-skills.md) | — | an argument a skill's description names, so one folder answers several close asks rather than two folders competing |
| [a skill](04-skills.md) | `SKILL.md` | one folder under a plugin's `skills/`, named for its stage, holding the file a session loads |
| [a step](04-skills.md) | `steps/` | one file a skill's own instructions sequence, read only when they name it |
| [the listing](04-skills.md) | — | every installed skill's name and description, one line each; this is what a session holds in full |
| [the name](04-skills.md) | `name` | the value a person types to ask for the skill directly, and the folder's own bare name |
| [the trigger](04-skills.md) | `description` | the sentence matched against the work at hand, which decides whether the file is loaded at all |
| **Scripts** | | |
| [a check](05-scripts.md) | `Check` | a file a moment's dispatcher composes: it reads one call and returns a verdict |
| [a finding](05-scripts.md) | `Finding` | one thing a run found: which question raised it, its grade, the file, and what a reader should do |
| [a job](05-scripts.md) | — | one named unit of work inside a tool, such as `audit`, `page`, `topics` or `coverage` |
| [a refusal](05-scripts.md) | `deny` | the call is stopped, with the reason a reader is given |
| [a script](05-scripts.md) | `scripts/` | one file a plugin ships under `checks/`, `events/`, `tools/` or `lib/`, named for what it decides or measures |
| [a tool](05-scripts.md) | — | a file under `tools/` that nothing wires, reached by naming its own path |
| [advice](05-scripts.md) | `note` | the call goes through and the turn is told something; advice from several checks is joined |
| [silence](05-scripts.md) | — | the answer where the input a question needs is absent, which is a fact about the repository rather than a finding about it |
| [the exit code](05-scripts.md) | — | the count of refusals; a report alone leaves a run green |
| [the fast path](05-scripts.md) | `applies` | a test on the path or the shell command alone, deciding whether this check could have an opinion at all |
| [the grade](05-scripts.md) | `Grade` | how a finding is weighted — `RULE` refuses and `SOFT` reports |
| [what it reads](05-scripts.md) | `needs` | which fields of a call a check requires; a call carrying none of them never reaches it |
| **Providers** | | |
| [a gate](07-providers.md) | `skills/<verb>/SKILL.md` · `scripts/checks/<subject>.ts` | the instance-free half: it resolves the instance and dispatches, and states no rule about any one of them |
| [an instance](07-providers.md) | `providers/<instance>/` | one realization a plugin serves — a stack (`ts`), or a cloud (`aws`, `gcp`, `local`) |
| [the contract](07-providers.md) | `refs/<domain>/…/providers/<instance>/` | what is **true** of this instance, restating a construct for a reader |
| [the scripts half](07-providers.md) | `providers/<instance>/scripts/checks/` | what a gate runs for this instance — the parse and the rules it carries |
| [the skills half](07-providers.md) | `providers/<instance>/skills/<skill>/` | what a skill loads when it is working in this instance — a procedure |
| **Tests** | | |
| [a case](08-tests.md) | — | one named assertion inside a suite; a title carrying a behaviour row's id becomes that row's result |
| [a suite](08-tests.md) | `t-<name>.mjs` | one file proving one source file, named for what it proves |
| [the harness](08-tests.md) | `helpers/harness.mjs` | what every suite imports instead of computing: the plugin root, a temporary tree, one case, a script's path |
| [the mirror](08-tests.md) | — | the path under a tier that repeats the source file's own path inside the plugin |
| [the runner](08-tests.md) | `run.mjs` | the file that finds every suite by walking the tree, runs each, and reports |
| [the tier](08-tests.md) | `unit/` · `integration/` | the first folder under `tests/`, saying what kind of proof the suites below it are |
<!-- /spn:generated -->
