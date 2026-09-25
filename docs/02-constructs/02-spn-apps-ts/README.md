<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-apps-ts",
  "title": "spn-apps-ts — The TypeScript Stack Domain",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The model behind the apps world made concrete for TypeScript — the write-time rules only this stack has, the tools that read its own registers, the skills that build in it, and the planning layer it ships for a skill it does not own."
}
-->

# spn-apps-ts — The TypeScript Stack Domain

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

The model for everything that can only be said about one stack. One file per construct, in an order where nothing appears before something it depends on.

Each construct here is the stack-concrete form of one in the core domain, so read its counterpart there first. The shape a check takes, what a tool is, and how a skill is matched are all settled in the core domain and are not restated in this one.

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
**The TypeScript stack plugin.** It holds what only a stack can say: a check whose rule is true of one stack and nowhere else, a tool over that stack's own register, and the skills that can only be said in its own words. **A skill that is stack-agnostic stays in `spn-devex` and reaches a concrete step through a ref here**, rather than being copied.

| Construct | What it is |
| --- | --- |
| [Stack Checks — A Stack's Own Rules at Write Time](01-stack-checks.md) | A check whose rule is true of one stack and nowhere else — read against the source as the pending write would leave it, asking whether this edit introduces the pattern, and refusing only where the model behind the rule is settled. |
| [Stack Tools — Commands Over a Stack's Own Register](02-stack-tools.md) | A tool that reads or writes one stack's own declarations — the register found by its header rather than by a path, the two cells a run owns against the cells a person decides, and coverage measured against published actions rather than routes. |
| [Stack Skills — The Five a Stack Ships](03-stack-skills.md) | The skills that can only be said in one stack's own words — what makes a skill stack-concrete, why one of them divides into ordered steps, why a mode is an argument, and the skill that is deliberately absent here. |
| [Stack Refs — The Layer a Stack-Agnostic Skill Loads](04-stack-refs.md) | Reference material a stack ships for a skill it does not own — how a stack-agnostic skill reaches a concrete step without being copied, why the file has no trigger of its own, and where the rows a design produces are written. |
<!-- /spn:generated -->

<!-- spn:generated dictionary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | What it means |
| --- | --- | --- |
| **Stack Checks** | | |
| [a stack check](01-stack-checks.md) | `CHECK` | one file naming a pattern in how this stack writes its own layers, with the verdict it gives |
| [introduced](01-stack-checks.md) | `introduced` | whether the pattern sits inside the text this edit adds, rather than somewhere the file already had |
| [masking](01-stack-checks.md) | `mask` | blanking comments and string bodies before searching, so a word inside a quote is never read as code |
| [the dispatcher](01-stack-checks.md) | `dispatch` | this plugin's own composition of its checks into one process, in the shape the core plugin uses |
| [the resulting text](01-stack-checks.md) | `resultingText` | the source as the pending write would leave it, which is what the search actually runs on |
| [the watch](01-stack-checks.md) | `watched` | the paths a check could have an opinion about, decided from the path alone |
| **Stack Tools** | | |
| [a hand-checked row](02-stack-tools.md) | `MANUAL` | a row a person proves, which no run ever writes over |
| [a register](02-stack-tools.md) | `HEADINGS` | any table carrying the behaviour headings in order, wherever in a repository it sits |
| [a row](02-stack-tools.md) | `cellsOf` | one behaviour: who does what, what they see, its kind, the tier that proves it, its status and when that was found |
| [an action](02-stack-tools.md) | `@SPAPIRouteCommand` | one published thing a caller can perform, found by its declaration rather than by a folder shape |
| [the results file](02-stack-tools.md) | — | what a test runner wrote about one run, read by behaviour id and by tier |
| [the tier](02-stack-tools.md) | `tier` | the rung a row is proven at; a run matches itself against this and leaves the other rungs alone |
| **Stack Skills** | | |
| [a mode](03-stack-skills.md) | — | an argument a skill's own description names, so one folder answers several close asks |
| [a stack skill](03-stack-skills.md) | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group this stack answers to |
| [a step](03-stack-skills.md) | `steps/` | one file of a longer walk, read only when the skill's own router names it |
| [the classification](03-stack-skills.md) | — | the first thing the router does: deciding which layers an ask actually touches |
| [the closing gate](03-stack-skills.md) | — | the review a skill hands its own work to, named in its description so the hand-off happens without being asked for |
| [the contract-first order](03-stack-skills.md) | — | the fixed order the steps run in, because everything downstream is generated from the contract or written against it |
| **Stack Refs** | | |
| [a planned row](04-stack-refs.md) | — | what a design lands as: a row in the seat that will later be flipped, rather than an entry in a scratch file |
| [a stack ref](04-stack-refs.md) | `refs/` | a markdown file a stack's plugin ships for a skill living in another plugin |
| [the claim](04-stack-refs.md) | `sprepo.json` | what a repository declares about its own world and stack, which is what selects the layer |
| [the layer](04-stack-refs.md) | — | the part of a walk that cannot be stack-agnostic: which seats a row lands in, and what each row must carry |
| [the stamp](04-stack-refs.md) | `spn:restates` | the block at the top, naming the chapters this file restates and the hash last read from each |
<!-- /spn:generated -->
