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

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
**The stack-agnostic plugin, and the one every repository loads.** It holds what is true of every plugin: what an instrument of each of the five kinds is, the events a hook may run on, the grades it may return, and how the set a workspace loads is derived from that workspace's own claim.

| Construct | What it is |
| --- | --- |
| [The Plugin — Delivery Unit of the Marketplace](01-plugin-set.md) | The folder that carries a standard from this repository into a running session — its manifest, its entry in the marketplace list, the installed copy a session actually reads, and the version field that says which bytes those are. |
| [The Hook — Code the Runtime Calls on Your Behalf](02-hook-set.md) | Code a plugin wires to a moment the runtime reaches — the file that declares the wiring, the payload it is handed, the verdict it returns rather than prints, and the exit code that is always zero. |
| [Loop Events — The Moments a Session Offers a Hook](03-loop-events.md) | The named moments in a session a plugin can wire code to — the window opening, a call about to run, a shell command that finished, a turn about to end — and why only one of them may refuse anything. |
| [The Check — One Rule, Asked on Every Call](04-checks.md) | One rule a script can decide about a single call — the fast path that says whether it could have an opinion, the smallest slice it reads to answer, the chapter it names instead of restating, and the line between refusing a call and only speaking about it. |
| [The Tool — A Command Run by Its Own Path](05-tools.md) | Code a plugin ships that nothing wires — invoked by a person, a skill or another tool, answering with graded findings and an exit code, and degrading to silence wherever the input it needs is absent. |
| [The Page — Produced From a Seat File, Never Typed](06-pages.md) | The HTML a reader opens, produced from the markdown an author writes — the block vocabulary that markdown is written in, the drawer that measures every figure from its own text, the checker that treats a connector as a claim, and the comparison that catches a hand edit. |
| [The Skill — A Stage's Steps, Loaded on Match](07-skill-set.md) | A named unit of work a session can be asked for — a folder, a description matched against the work at hand, the instructions loaded once it matches, and the rule that a skill carries steps and never a rule of its own. |
| [The Ref — A Chapter, Restated and Stamped](08-ref-set.md) | A markdown restatement of one or more chapters, carrying a hash of the exact text it last read, so a chapter that moves is reported rather than quietly outrun — and the three ways a restatement can fail to be comparable at all. |
| [The Lens — One Reviewing Viewpoint, Written Down](09-lenses.md) | One engineering function's judgment stated as a file — what it checks, the one condition it may block on, everything below that which it can only advise, and why the same values also name the audience a document declares. |
| [The Agent — A Persona a Session Can Convene](10-agent-set.md) | A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the difference between a fixed voice and one parameterized by a viewpoint, and where the permission to write actually comes from. |
<!-- /spn:generated -->

<!-- spn:generated dictionary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | What it means |
| --- | --- | --- |
| **The Plugin** | | |
| [a plugin](01-plugin-set.md) | `plugin.json` | one folder under `plugins/`, named for what it serves, carrying `.claude-plugin/plugin.json` and any mix of instrument kinds |
| [an instrument](01-plugin-set.md) | — | one piece a plugin folder may hold — a hook, a skill, a ref, a lens or an agent brief; a plugin holds any mix and owes none |
| [the marketplace](01-plugin-set.md) | `marketplace.json` | the one file at `.claude-plugin/marketplace.json` naming every plugin this repository ships, and the folder each one lives in |
| [the plugin root](01-plugin-set.md) | `CLAUDE_PLUGIN_ROOT` | the installed folder a session reads, and the base every wired command path is written against |
| [the version](01-plugin-set.md) | `version` | the field in a manifest saying which bytes are published; the count moves after a release, never before |
| **The Hook** | | |
| [a hook](02-hook-set.md) | `hooks.json` | a script a plugin wires to a named moment, declared with a matcher, a command and a timeout |
| [a verdict](02-hook-set.md) | `Verdict` | what a hook decided: `deny` refuses the call, `note` is advice the turn reads, and nothing at all is silence |
| [the call](02-hook-set.md) | `ToolInput` | the fields inside that payload a hook actually reads — a file path, a shell command, the content or replacement text a write carries |
| [the dispatcher](02-hook-set.md) | `dispatch` | one process that asks every check applying to a call, keeps the first refusal, and joins the advice |
| [the payload](02-hook-set.md) | `Payload` | what the harness hands a hook on standard input: the tool's name, the call's own fields, the working folder, the session |
| **Loop Events** | | |
| [a call about to run](03-loop-events.md) | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| [a command that finished](03-loop-events.md) | `PostToolUse` | the moment after a shell command has run, when its own text and its result can both be read |
| [a matcher](03-loop-events.md) | `matcher` | the names a moment is narrowed to, so a script runs only for the calls it could have an opinion about |
| [a moment](03-loop-events.md) | `hooks` | a named point in a session the harness stops at and runs whatever a plugin wired there |
| [a turn about to end](03-loop-events.md) | `Stop` | the moment before a reply is handed back, when a warning is still useful and a refusal is not |
| [the window opening](03-loop-events.md) | `SessionStart` | the moment a session begins, resumes or is cleared; its output is the first screen a developer sees |
| **The Check** | | |
| [a check](04-checks.md) | `Check` | one file that reads a call and returns a verdict, named for the rule it enforces |
| [a refusal](04-checks.md) | `deny` | the call is stopped, with the reason a reader is given |
| [advice](04-checks.md) | `note` | the call goes through and the turn is told something; advice from several checks is joined |
| [the fast path](04-checks.md) | `applies` | a test on the path or the shell command alone, deciding whether this check could have an opinion at all |
| [what it reads](04-checks.md) | `needs` | which fields of a call a check requires; a call carrying none of them never reaches it |
| **The Tool** | | |
| [a finding](05-tools.md) | `Finding` | one thing a run found: which check raised it, its grade, the file, and what a reader should do |
| [a job](05-tools.md) | — | one named unit of work inside a tool, such as `audit`, `page`, `topics` or `coverage` |
| [a tool](05-tools.md) | — | a file under a plugin's `hooks/tools/`, named for what it measures, and wired to no moment |
| [silence](05-tools.md) | — | the answer where the input a question needs is absent, which is a fact about the repository rather than a finding about it |
| [the exit code](05-tools.md) | — | the count of refusals; a report alone leaves a run green |
| [the grade](05-tools.md) | `Grade` | how a finding is weighted, whether a tool raised it or a check running as a sweep did — `RULE` refuses and `SOFT` reports |
| **The Page** | | |
| [a block](06-pages.md) | — | one piece a section is made of — a paragraph, a table, a list, a fenced literal, a rule callout or a figure — each typed in plain markdown |
| [a connector](06-pages.md) | `Link` | a line from one box to another, which is a claim that the two touch and is checked as one |
| [a figure spec](06-pages.md) | `dg` | a fenced block holding strict JSON, which is a figure's single source |
| [a generated region](06-pages.md) | `spn:generated` | a part of a face written by a tool, bounded by markers that say so; the prose around it belongs to the author |
| [a seat file](06-pages.md) | — | the markdown an author writes, carrying its metadata block; the only file in this pair a person edits |
| [the drawer](06-pages.md) | `Spec` | the code turning one spec into inline drawing, measuring every box from its own text |
| **The Skill** | | |
| [a mode](07-skill-set.md) | — | an argument a skill's description names, so one folder answers several close asks rather than two folders competing |
| [a skill](07-skill-set.md) | `SKILL.md` | one folder under a plugin's `skills/`, named for its stage, holding the file a session loads |
| [a step](07-skill-set.md) | `steps/` | one file inside a skill, read only when the skill's own instructions sequence it |
| [the listing](07-skill-set.md) | — | every installed skill's name and description, one line each; this is what a session holds in full |
| [the name](07-skill-set.md) | `name` | the value a person types to ask for the skill directly, and the folder's own bare name |
| [the trigger](07-skill-set.md) | `description` | the sentence matched against the work at hand, which decides whether the file is loaded at all |
| **The Ref** | | |
| [a ref](08-ref-set.md) | — | a markdown file under a plugin's `refs/`, restating part of the foundation book for a reader who cannot open it |
| [a source line](08-ref-set.md) | — | a file's own prose naming what it restates; it is read beside the block, and an omission from the block is a finding |
| [a stamp](08-ref-set.md) | `Citation` | one entry of the block — a chapter's path, an optional section, and the hash last read there |
| [drift](08-ref-set.md) | — | a stamp whose hash no longer matches the chapter's text today |
| [the block](08-ref-set.md) | `spn:restates` | a comment at the top of that file, holding strict JSON, naming what the file restates |
| [the hash](08-ref-set.md) | `seen` | eight characters over the cited text, with trailing spaces and surrounding blank lines removed |
| **The Lens** | | |
| [a lens](09-lenses.md) | `lenses/` | one file naming what a single engineering function checks when it reads work |
| [convened](09-lenses.md) | — | a context that did not write the work reading it through one lens and reporting what it found |
| [the audience](09-lenses.md) | `lenses` | the field in a document's metadata block, drawn from that same closed set |
| [the block condition](09-lenses.md) | — | the one thing a lens may refuse on; everything the file finds below that is advice and says so |
| [the lens register](09-lenses.md) | `LENS_LABEL` | the closed set of values, and the reader label each one renders as on a document's own header |
| [worn](09-lenses.md) | — | the agent loading a lens for itself while it writes, so the work is right the first time |
| **The Agent** | | |
| [a brief](10-agent-set.md) | `agents/` | a markdown file naming a persona a session can convene by name |
| [a parameterized brief](10-agent-set.md) | — | a brief holding a procedure and no subject matter, handed a viewpoint name at the moment it is convened |
| [the bound model](10-agent-set.md) | `model` | an optional field choosing which model runs the persona |
| [the bound tools](10-agent-set.md) | `tools` | an optional field narrowing what the persona may call; leaving it out grants everything the session has |
<!-- /spn:generated -->
