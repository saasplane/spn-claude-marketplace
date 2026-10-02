<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-apps",
  "title": "spn-apps — The TypeScript Stack Domain",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The model behind the apps world made concrete for TypeScript — the write-time rules only this stack has, the tools that read its own registers, the skills that build in it, and the planning layer it ships for a skill it does not own."
}
-->

# spn-apps — The TypeScript Stack Domain

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

The model for everything that can only be said about one stack. One file per construct, in an order where nothing appears before something it depends on.

Each construct here is the stack-concrete form of one in the core domain, so read its counterpart there first. The shape a check takes, what a tool is, and how a skill is matched are all settled in the core domain and are not restated in this one.

<!-- spn:generated constructs — do not edit inside these markers; `docs.ts face` writes it -->
**The TypeScript domain plugin.** It holds what only a stack can say: a check whose rule is true of one stack and nowhere else, a tool over that stack's own register, and the skills that can only be said in its own words. **A skill that is stack-agnostic stays in `spn-devex` and reaches a concrete step through a ref here**, rather than being copied.

| Construct | What it is |
| --- | --- |
| [The Plugin — What spn-apps Is, and When a Session Loads It](01-plugin.md) | This plugin is the one folder everything in the apps domain ships from, and the folder an install copies whole. |
| [Hooks — One Moment, Because Every Rule Here Is About a File](02-hooks.md) | This plugin wires exactly one moment of a session — the point where a file is about to change — because every rule it holds is about what a file contains. |
| [Skills — The Commands an Apps Repository Answers To](03-skills.md) | A skill belongs to this domain when it describes work on a piece of an apps repository — scaffolding a project, building a capability, running the suites, proving a package, or publishing the repository. |
| [Scripts — The Code This Plugin Runs](04-scripts.md) | Scripts holds everything this plugin executes, divided by what calls each file — the wiring, the gate the wiring asks, the tools a person or agent runs by typing their path, and the libraries the others read. |
| [Refs — The Book, Restated Inside the Plugin](05-refs.md) | Refs carries, inside this plugin, the foundation-book rules a partner needs but has no checkout to read. |
| [Providers — Where the Stack Is Allowed to Be Named](06-providers.md) | Providers is the one folder in this plugin allowed to name a language, holding everything that varies with the language a project is written in, one folder per stack. |
| [Tests — The Stack's Own Folders, Without the Stack's Framework](07-tests.md) | This plugin ships rules that other repositories are held to, so it owes proof of its own, carried in a Tests folder built the same way this domain asks every project it governs to build one. |
<!-- /spn:generated -->

<!-- spn:generated glossary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | What it means |
| --- | --- | --- |
| **The Plugin** | | |
| [the description](01-plugin.md) | `description` | the sentences matched against the work at hand, which is how this plugin's material is reached at all |
| [the manifest](01-plugin.md) | `plugin.json` | the file at `.claude-plugin/plugin.json` claiming a name, a version, a description and an author |
| [the name](01-plugin.md) | `name` | what an install, a marketplace entry and a session all address this folder by |
| [the version](01-plugin.md) | `version` | the number saying which bytes are published, shared with the other plugins and moved after a release |
| [the world](01-plugin.md) | `sprepo.json` | what a repository declares about itself, from which its plugin set is derived |
| **Hooks** | | |
| [a call about to run](02-hooks.md) | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| [a subject](02-hooks.md) | `SUBJECT_NAMES` | one grouping of rules the dispatcher asks about a write, resolved per call rather than listed |
| [the dispatcher](02-hooks.md) | `pretooluse.ts` | the single process the entry names, which resolves what to run and joins the answers |
| [the entry](02-hooks.md) | — | one declaration behind which every rule runs, rather than one declaration per rule |
| [the matcher](02-hooks.md) | `Write\|Edit` | the tool names this entry narrows to, so nothing else in a session reaches the chain at all |
| [the wiring](02-hooks.md) | `hooks.json` | the single file declaring what this plugin claims, at which moment, with which command and which timeout |
| **Skills** | | |
| [a mode](03-skills.md) | — | an argument a skill's own description names, so one folder answers several close asks |
| [a skill](03-skills.md) | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group this domain answers to |
| [a step](03-skills.md) | `steps/` | one file of a longer walk, read only when the skill's own router names it |
| [the classification](03-skills.md) | — | the first thing the router does: deciding which layers an ask actually touches |
| [the closing gate](03-skills.md) | — | the review a skill hands its own work to, named in its description so the hand-off happens without being asked for |
| [the stage](03-skills.md) | `RD.DEVEX.AGENT.017` | the one stage a skill serves, which is what makes the applicable standards derivable from the skill that was invoked |
| [the value](03-skills.md) | `APPS_{SKILL}` | the name the enum carries for that folder, its domain prefix derived from the plugin's own claim |
| **Scripts** | | |
| [a hand-checked row](04-scripts.md) | `MANUAL` | a row a person proves, which no run ever writes over |
| [a register](04-scripts.md) | `HEADINGS` | any table carrying the behaviour headings in order, wherever in a repository it sits |
| [a row](04-scripts.md) | `cellsOf` | one behaviour: who does what, what they see, its kind, the tier that proves it, its status and when that was found |
| [a subject](04-scripts.md) | `SUBJECT_NAMES` | one grouping of rules a write is asked about, cheapest first |
| [an action](04-scripts.md) | `@SPAPIRouteCommand` | one published thing a caller can perform, found by its declaration rather than by a folder shape |
| [masking](04-scripts.md) | `mask` | blanking comments and string bodies before searching, so a word inside a quote is never read as code |
| [the dispatcher](04-scripts.md) | `pretooluse.ts` | the single process behind the wired entry, which keeps the first refusal and joins the advice |
| [the gate](04-scripts.md) | `subjectsFor` | the stack-free half: it reads the node's declaration and hands the write to the provider for it |
| [the resulting text](04-scripts.md) | `resultingText` | the source as the pending write would leave it, which is what a rule actually reads |
| [the results file](04-scripts.md) | — | what a test runner wrote about one run, read by behaviour id and by tier |
| [the tier](04-scripts.md) | `tier` | the rung a row is proven at; a run matches itself against this and leaves the other rungs alone |
| **Refs** | | |
| [a domain folder](05-refs.md) | — | one folder per book domain, and the only kind of folder this tree holds at its top |
| [a group](05-refs.md) | — | a folder under a domain; a file under it is named for a construct the book states |
| [a ref](05-refs.md) | `refs/` | a self-contained markdown leaf restating a chapter of the book, written out rather than linked to |
| [a stack entry](05-refs.md) | `providers/<stack>/` | what is **true** of one stack — its kinds, naming, generation, tests and conformance |
| [drift](05-refs.md) | — | the state where a stamped hash no longer matches the chapter, which is what a run reports |
| [the face](05-refs.md) | `README.md` | a folder's own subject, which is what makes a folder a subject rather than a bucket |
| [the stamp](05-refs.md) | `spn:restates` | the block at the top naming each chapter this file restates and the hash last read from it |
| **Providers** | | |
| [a door](06-providers.md) | `src.ts` · `tests.ts` | the file a gate imports for one subject: it parses once, orders the verdicts, and isolates a rule that throws |
| [a private rule](06-providers.md) | `_<subject>/` | one rule, behind an underscore folder, private to the door standing beside it |
| [an instance](06-providers.md) | `providers/<instance>/` | one realization this plugin serves, which in this domain is a stack |
| [the claim](06-providers.md) | `config.stack` | what a repository declares about its own stack, and the only place a gate reads one from |
| [the scripts half](06-providers.md) | `providers/<stack>/scripts/checks/` | the parse a gate resolves into, and the rules that read what the parse produced |
| [the skills half](06-providers.md) | `providers/<stack>/skills/<skill>/` | the procedure a skill loads once it has resolved which stack it is standing in |
| **Tests** | | |
| [a suite](07-tests.md) | `t-<name>.mjs` | one file proving one thing, named for what it proves rather than for where it sits |
| [discovery](07-tests.md) | `checkPath` | finding the file a case names by searching the provider folders, rather than typing its path |
| [the harness](07-tests.md) | `harness.mjs` | what a suite is written against: a throwaway tree, one case, and the plugin root found once |
| [the mirror](07-tests.md) | — | the path under a tier, which is the source file's own path inside the plugin |
| [the runner](07-tests.md) | `run.mjs` | the one command that finds every suite and reports the verdict of each |
| [the tier](07-tests.md) | `unit/` | what kind of proof this is, which is the first thing a folder name answers |
<!-- /spn:generated -->
