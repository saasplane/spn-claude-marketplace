<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-surface",
  "title": "spn-surface — The Surface Domain",
  "lenses": ["UX", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The model behind what a person sees and touches made concrete for an agent: the one write-time rule over the Figma connector, the design skill, the Surface refs, and the proof the plugin owes."
}
-->

# spn-surface — The Surface Domain

`For: UX designer · Web developer` · `Status: 🔮 PLANNING`

The model for everything a plugin can say about what a person sees and touches before a stack is chosen. One file per construct, in an order where nothing appears before something it depends on.

Each construct here is the Surface form of one in the core domain, so read its counterpart there first. The shape a check takes, what a skill is, and how a ref is stamped are all settled in the core domain and are not restated in this one.

<!-- spn:generated glossary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | Description |
| --- | --- | --- |
| **The Plugin** | | |
| [the description](01-plugin.md) | `description` | the sentences matched against the work at hand, which is how this plugin's material is reached at all |
| [the manifest](01-plugin.md) | `plugin.json` | the file at `.claude-plugin/plugin.json` claiming a name, a version, a description and an author |
| [the name](01-plugin.md) | `name` | what an install, a marketplace entry and a session all address this folder by |
| [the version](01-plugin.md) | `version` | the number saying which bytes are published, `0.1.0` until the first release |
| [the world](01-plugin.md) | `sprepo.json` | what a repository declares about itself, from which its plugin set is derived |
| **Hooks** | | |
| [a call about to run](02-hooks.md) | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| [the connector check](02-hooks.md) | `figma-connector.ts` | the rule that reads a `use_figma` script before the connector runs it |
| [the dispatcher](02-hooks.md) | `pretooluse.ts` | the single process the entry names, which hands the call to the check that reads it and returns the verdict |
| [the entry](02-hooks.md) | — | one declaration behind which every rule runs, rather than one declaration per rule |
| [the matcher](02-hooks.md) | `mcp__figma__use_figma` | the one tool name this entry narrows to, so nothing else in a session reaches the chain at all |
| [the wiring](02-hooks.md) | `hooks.json` | the single file declaring what this plugin claims, at which moment, with which command and which timeout |
| **Skills** | | |
| [a skill](03-skills.md) | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group this domain answers to |
| [a step](03-skills.md) | `steps/` | one file of a longer walk, read only when the skill's own router names it |
| [a tree](03-skills.md) | — | one page as every block by the name the book gives it, with its props, in the order the decisions were taken |
| [the stage](03-skills.md) | `RULE.DEVEX.AGENT.017` | the one stage a skill serves, which is what makes the applicable standards derivable from the skill that was invoked |
| [the value](03-skills.md) | `SURFACE_{SKILL}` | the name the enum carries for that folder, its domain prefix derived from the plugin's own claim |
| **Scripts** | | |
| [a check](04-scripts.md) | `figma-connector.ts` | one rule, in its own file, that returns a verdict and can also run alone |
| [masking](04-scripts.md) | `mask` | blanking comments and string bodies before searching, so a word inside a quote is never read as code |
| [the bundle](04-scripts.md) | `dist/` | the committed build a hook runs, kept current by a staleness test |
| [the dispatcher](04-scripts.md) | `pretooluse.ts` | the single process behind the wired entry, which keeps the first refusal and joins the advice |
| [the entry](04-scripts.md) | `cli.ts` | the one command line the plugin ships, dispatching by group and action |
| [the read advice](04-scripts.md) | `unit-read.ts` | the note beside a `Read` of a unit's own file, naming `unit show` on the file's name |
| [the resulting text](04-scripts.md) | `resultingText` | the source as the pending write would leave it, which is what a rule actually reads |
| [the unit lookup](04-scripts.md) | `unit show` | one unit's props, values, defaults, usage, cases with their rules and index by value, read from the snapshot beside the refs; a unit beyond the core, its props from the repository's symbol index and the core block its name points to |
| [the unit search](04-scripts.md) | `unit find` | the units whose name or line carries a task's words, best first, from the snapshot and the symbol index `unit show` reads, each with its package, its repository and the core block its name points to |
| **Refs** | | |
| [a domain folder](05-refs.md) | `support/` | one folder per book domain, and the only kind of folder this tree holds at its top |
| [a group](05-refs.md) | `surface/` | a folder under a domain; a file under it is named for a construct the book states |
| [a ref](05-refs.md) | `refs/` | a self-contained markdown leaf restating a chapter of the book, written out rather than linked to |
| [a spec copy](05-refs.md) | `app-patterns/` · `site-patterns/` | a folder of skeleton specs, byte-identical to the book's, which a page starts from |
| [drift](05-refs.md) | — | the state where a stamped hash no longer matches the chapter, which is what a run reports |
| [the snapshot](05-refs.md) | `construct.snapshot.json` | the CONSTRUCT snapshot written from the book of each release, which `unit show` reads |
| [the stamp](05-refs.md) | `spn:restates` | the block at the top naming each chapter this file restates and the hash last read from it |
| **Tests** | | |
| [a suite](06-tests.md) | `t-<name>.mjs` | one file proving one thing, named for what it proves rather than for where it sits |
| [the harness](06-tests.md) | `harness.mjs` | what a suite is written against: the plugin root, found once |
| [the mirror](06-tests.md) | — | the path under a tier, which is the source file's own path inside the plugin |
| [the runner](06-tests.md) | `run.mjs` | the one command that finds every suite and reports the verdict of each |
| [the tier](06-tests.md) | `unit/` | what kind of proof this is, which is the first thing a folder name answers |
<!-- /spn:generated -->

<!-- spn:generated constructs — do not edit inside these markers; `docs.ts face` writes it -->
**The stack-agnostic plugin for what a person sees and touches.** It holds the Surface refs (the standards of content and interaction, the patterns, the names, and the design system with its library and its delivery), the specs a page starts from, the `design` skill that states a page as a tree of named blocks, and the one guard that reads a script before the Figma connector runs it. A different act needs different instructions, and drawing a page is not wiring a web module, so it is a plugin of its own beside `spn-apps`.

| Construct | What it is |
| --- | --- |
| [The Plugin — What spn-surface Is, and When a Session Loads It](01-plugin.md) | This plugin is the one folder everything in the Surface domain ships from, and the folder an install copies whole. |
| [Hooks — One Moment, For the Connector's Script](02-hooks.md) | This plugin wires exactly one moment of a session, the point where the Figma connector is about to run a script, and one tool, because its one rule is about what that script says. |
| [Skills — The Command a Surface Question Answers To](03-skills.md) | A skill belongs to this domain when it describes work on what a person sees and touches before any code is written, which today is one skill: design. |
| [Scripts — The Code This Plugin Runs](04-scripts.md) | Scripts holds everything this plugin executes, divided by what calls each file: the entry the wiring names, the check it asks, the command line a person types, and the libraries the others read from the shared support folder. |
| [Refs — The Surface Book, Restated Inside the Plugin](05-refs.md) | Refs carries, inside this plugin, the Surface rules a partner needs but has no checkout to read: the standards, the patterns, the architecture of the design system, its library and its delivery, and the specs a page starts from. |
| [Tests — The Plugin's Own Folders, Without a Framework](06-tests.md) | This plugin ships a rule that runs on a person's design file, so it owes proof of its own: one tier, mirrored on its source, behind a runner that walks and judges on an exit code. |
<!-- /spn:generated -->
