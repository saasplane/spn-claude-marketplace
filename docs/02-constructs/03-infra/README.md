<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-infra",
  "title": "spn-infra — The Estate Domain",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "The model behind the plugin every estate repository loads — the single guard standing between an edit and an estate file, the skills that change what an estate is, and the cards holding the estate's own vocabulary."
}
-->

# spn-infra — The Estate Domain

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

The model for the estate world, whatever cloud sits behind it. One file per construct, in an order where nothing appears before something it depends on.

The estate domain is the smallest of the three domains, and the boundary is what holds it together: nothing here changes a cloud. The guard refuses, the cards explain, and each skill names the tool's command that does the work through the tool's own doors.

<!-- spn:generated constructs — do not edit inside these markers; `docs.ts face` writes it -->
**The estate plugin** holds what changes an estate: one shell script standing between an estate edit and the file it would write, the skills that change what an estate is, and the estate's own vocabulary restated for a reader who may never open the book.

| Construct | What it is |
| --- | --- |
| [Plugin — spn-infra as a Delivery Unit](01-plugin.md) | This plugin carries this repository's estate standard — the rules for the infrastructure a product runs on — into a session that is working on one, in one folder. |
| [Hooks — One Moment, Every Write](02-hooks.md) | This plugin wires exactly one moment of a session — the point just before a write happens — because every rule it holds is about what a file contains. |
| [Skills — The Doors Infrastructure Is Changed Through](03-skills.md) | The skills here are how an estate — the infrastructure a product runs on — gets changed: by editing what it declares itself to be, then letting a tool render and apply that declaration. |
| [Scripts — The Write-Time Gate and What Runs It](04-scripts.md) | Scripts holds the gate that catches what must never appear in an estate declaration — a credential, an identifier a tool should discover for itself, a cloud provider's own string outside the one entry allowed to hold it — before it is written. |
| [Refs — This Domain's Vocabulary, Restated as Cards](05-refs.md) | Refs is where the estate's own vocabulary — the words for the infrastructure a product runs on — is restated in full, as cards, for a reader who may never open the foundation book. |
| [Providers — One Folder per Cloud, Scripts Half Only](06-providers.md) | This plugin serves every cloud an estate can run on, and everything that varies between clouds sits in one folder per cloud under Providers. |
| [Tests — How This Plugin Proves Its Own Gate](07-tests.md) | This plugin proves its own gate — the rules that refuse a file — in a Tests folder arranged so moving a source file moves its test with it. |
<!-- /spn:generated -->

<!-- spn:generated glossary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | What it means |
| --- | --- | --- |
| **Plugin** | | |
| [an INFRA repository](01-plugin.md) | `sprepo.json` | a repository whose declared world is `INFRA` — the estate repository, and the blueprint repository beside it |
| [the description](01-plugin.md) | `description` | the sentence a session matches the work at hand against; it decides whether this plugin is loaded |
| [the manifest](01-plugin.md) | `plugin.json` | `.claude-plugin/plugin.json` inside this plugin's own folder, carrying its name, version, description and author |
| [the name](01-plugin.md) | `spn-infra` | what the marketplace entry and every install refer to this folder by |
| [the plugin root](01-plugin.md) | `CLAUDE_PLUGIN_ROOT` | the installed copy a session reads, and the base every wired command is written against |
| [the version](01-plugin.md) | `version` | which published bytes a session is reading, shared with the other two plugins |
| **Hooks** | | |
| [a call about to run](02-hooks.md) | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| [the command](02-hooks.md) | `command` | what the harness runs, written against the plugin root rather than against any checkout |
| [the matcher](02-hooks.md) | `Write\|Edit` | the calls the moment is narrowed to, so nothing else pays for the hook at all |
| [the plugin root](02-hooks.md) | `CLAUDE_PLUGIN_ROOT` | the installed folder a session reads, which is what makes the wired path portable |
| [the timeout](02-hooks.md) | `timeout` | the seconds the harness allows the command before it gives up on it |
| [the wiring](02-hooks.md) | `hooks.json` | the one file declaring which moments this plugin claims and what it runs at each |
| **Skills** | | |
| [a module](03-skills.md) | `spinfrapkg.json` | a piece the platform actually runs, attached at a step of the estate's own lifecycle |
| [a pin flip](03-skills.md) | — | pointing a consumer at a published version, which is the last act of authoring a module |
| [a rendering](03-skills.md) | — | what a declaration would produce if applied, read while changing it is still cheap |
| [an approval](03-skills.md) | — | the moment after which the estate has changed and the question becomes a repair |
| [an estate skill](03-skills.md) | `SKILL.md` | one folder under this plugin's `skills/`. **The words are the ones the apps domain reads** — `new` · `implement` · `review` · `run` · `verify` · `release` — so a partner working in both domains learns one set of names |
| [declaring](03-skills.md) | — | changing what the estate says it is, as an edit to a manifest rather than to a rendering |
| **Scripts** | | |
| [a rule](04-scripts.md) | `scripts/lib/<name>.ts` | one thing the gate knows how to recognise, carrying its own name and its own refusal message |
| [a sanctioned home](04-scripts.md) | `region` | the place a provider's own string is legitimate, which is removed from the text before that rule searches |
| [a subject](04-scripts.md) | `rendering` · `manifest` | one kind of file with one parse — built output, or a declaration somebody edits |
| [allowing](04-scripts.md) | — | the answer to anything the gate cannot read: no decision, and the ordinary permission flow continues |
| [the dispatcher](04-scripts.md) | `scripts/events/pretooluse.ts` | this plugin's hook entry point: one process, run for every write and every edit |
| [the estate manifest](04-scripts.md) | `spestate.json` | the declaration file where one rule applies and nowhere else |
| [the gate](04-scripts.md) | `scripts/checks/subjects.ts` | what resolves which subjects judge this call, and the one file that knows a provider folder exists |
| [the new text](04-scripts.md) | `content` · `new_string` | what this call would add — a write's content, or an edit's replacement — which is what the rules read |
| **Refs** | | |
| [a card](05-refs.md) | `refs/support/infra/` | one markdown file restating one subject of the estate model, in full, under a stamp |
| [a cloud's vocabulary](05-refs.md) | `refs/support/infra/providers/<cloud>/` | what that cloud calls the things the model names, restated subject by subject |
| [a coordinate](05-refs.md) | — | one part a resource name is composed from, drawn from a closed vocabulary |
| [a law](05-refs.md) | — | one thing a declaration must never do, written with the checkable defect it names |
| [a layer](05-refs.md) | — | one band of the estate, with the same commands as every other and a fixed place in the order |
| [the manifests](05-refs.md) | `spestate.json` · `spinfrapkg.json` | the files that mark an estate node and name what kind it is |
| [the path locator](05-refs.md) | — | how a node is resolved from wherever you are standing, rather than guessed from a folder name |
| **Providers** | | |
| [a cloud](06-providers.md) | `providers/<cloud>/` | one realization this plugin serves — the folder is the whole registration |
| [a skills half](06-providers.md) | `providers/<instance>/skills/` | what a skill loads when working in this instance — a procedure, which no cloud here has |
| [a subject](06-providers.md) | `manifest` · `rendering` | one kind of file with one parse, named the same way in every cloud's folder |
| [discovery](06-providers.md) | `instances()` | the gate reading which folders exist, rather than a list of clouds written anywhere |
| [the scripts half](06-providers.md) | `providers/<cloud>/scripts/checks/` | what the gate runs for this cloud: one validator per subject |
| [the vocabulary](06-providers.md) | `refs/support/infra/providers/<cloud>/` | what this cloud calls things, restated as a fact rather than run as code |
| **Tests** | | |
| [a suite](07-tests.md) | `t-<subject>.mjs` | one file of cases, named for what it proves rather than for where it sits |
| [a tier](07-tests.md) | `unit/` | what kind of proof a suite is, which is the first thing the path says |
| [the harness](07-tests.md) | `tests/helpers/harness.mjs` | what drives a real process per case and reads the verdict back |
| [the mirror](07-tests.md) | `unit/<source path>` | the rest of the path, repeating the path of the file being proven |
| [the plugin root](07-tests.md) | `PLUGIN` | found once by the harness, so no suite counts folders to reach the code |
| [the runner](07-tests.md) | `tests/run.mjs` | one command for every suite; it walks the tree rather than reading a list |
| [the tree](07-tests.md) | `tests/` | this plugin's proofs, at the plugin root and never beside the source they prove |
<!-- /spn:generated -->
