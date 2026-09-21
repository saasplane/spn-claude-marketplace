<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs",
  "title": "Constructs — The Model This Repository Is About",
  "lenses": ["ARCHITECT", "SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The model this repository is about — one file per construct under the domains its concept names, and the generated dictionary as the seat's face."
}
-->

# Constructs — The Model This Repository Is About

`For: Architect · Backend developer · Web developer` · `Status: 🔮 PLANNING`

This seat is the model: one file per construct, saying what a thing is, what it is made of, what it depends on, and what it refuses. The behaviours seat and the capabilities seat are both written in these words — one in the consumer's spelling, one in the contract's — so neither can be written until the words exist here.

| Domain | What it holds |
| --- | --- |
| [spn-core](01-spn-core/README.md) | The plugin every repository loads: the delivery folder, the code the runtime calls, the commands run by name, the page production, and the skills, restatements, viewpoints and personas a session reads |
| [spn-apps-ts](02-spn-apps-ts/README.md) | The apps world made concrete for TypeScript: the write-time rules only this stack has, the tools over its own registers, its verbs, and the planning layer it ships |
| [spn-infra](03-spn-infra/README.md) | The estate world: the single guard standing between an edit and an estate file, the verbs that change what an estate is, and the cards holding its vocabulary |

**The face below is the dictionary**, and it is generated. One row per term: the word a consumer uses, the term the contract uses, where it is stored, and the construct it comes from. Each column has exactly one source, which is what makes the generation possible.

## The dictionary

<!-- spn:generated dictionary — do not edit inside these markers; `docs.ts face` writes it -->
| Term | Contract term | Where it is stored | From |
| --- | --- | --- | --- |
| a block | — | — | The Page — Produced From a Seat File, Never Typed |
| a brief | `agents/` | — | The Agent — A Persona a Session Can Convene |
| a call about to run | `PreToolUse` | — | Loop Events — The Moments a Session Offers a Hook |
| a card | `refs/` | — | Estate Refs — The Estate's Vocabulary, Restated as Cards |
| a check | `Check` | — | The Check — One Rule, Asked on Every Call |
| a clause | — | — | The Estate Guard — One Script Wired to Every Write |
| a command that finished | `PostToolUse` | — | Loop Events — The Moments a Session Offers a Hook |
| a connector | `Link` | — | The Page — Produced From a Seat File, Never Typed |
| a coordinate | — | — | Estate Refs — The Estate's Vocabulary, Restated as Cards |
| a figure spec | `dg` | — | The Page — Produced From a Seat File, Never Typed |
| a finding | `Finding` | — | The Tool — A Command Run by Its Own Path |
| a generated region | `spn:generated` | — | The Page — Produced From a Seat File, Never Typed |
| a hand-checked row | `MANUAL` | — | Stack Tools — Commands Over a Stack's Own Register |
| a hook | `hooks.json` | — | The Hook — Code the Runtime Calls on Your Behalf |
| a law | — | — | Estate Refs — The Estate's Vocabulary, Restated as Cards |
| a layer | — | — | Estate Refs — The Estate's Vocabulary, Restated as Cards |
| a lens | `lenses/` | — | The Lens — One Reviewing Viewpoint, Written Down |
| a matcher | `matcher` | — | Loop Events — The Moments a Session Offers a Hook |
| a mode | — | — | The Skill — A Verb's Steps, Loaded on Match |
| a mode | — | — | Stack Skills — A Stack's Own Verbs |
| a mode | — | — | Stack Refs — The Layer a Stack-Agnostic Verb Loads |
| a module | `spinfrapkg.json` | — | Estate Skills — The Verbs That Change an Estate |
| a moment | `hooks` | — | Loop Events — The Moments a Session Offers a Hook |
| a parameterized brief | — | — | The Agent — A Persona a Session Can Convene |
| a pin flip | — | — | Estate Skills — The Verbs That Change an Estate |
| a planned row | — | — | Stack Refs — The Layer a Stack-Agnostic Verb Loads |
| a plugin | `plugin.json` | — | The Plugin — Delivery Unit of the Marketplace |
| a ref | — | — | The Ref — A Chapter, Restated and Stamped |
| a refusal | `deny` | — | The Check — One Rule, Asked on Every Call |
| a register | `HEADINGS` | — | Stack Tools — Commands Over a Stack's Own Register |
| a rendering | — | — | Estate Skills — The Verbs That Change an Estate |
| a row | `cellsOf` | — | Stack Tools — Commands Over a Stack's Own Register |
| a sanctioned home | `region` | — | The Estate Guard — One Script Wired to Every Write |
| a seat file | — | — | The Page — Produced From a Seat File, Never Typed |
| a skill | `SKILL.md` | — | The Skill — A Verb's Steps, Loaded on Match |
| a source line | — | — | The Ref — A Chapter, Restated and Stamped |
| a stack check | `CHECK` | — | Stack Checks — A Stack's Own Rules at Write Time |
| a stack ref | `refs/` | — | Stack Refs — The Layer a Stack-Agnostic Verb Loads |
| a stack verb | `SKILL.md` | — | Stack Skills — A Stack's Own Verbs |
| a stamp | `Citation` | — | The Ref — A Chapter, Restated and Stamped |
| a step | `steps/` | — | The Skill — A Verb's Steps, Loaded on Match |
| a step | `steps/` | — | Stack Skills — A Stack's Own Verbs |
| a tool | — | — | The Hook — Code the Runtime Calls on Your Behalf |
| a tool | — | — | The Tool — A Command Run by Its Own Path |
| a turn about to end | `Stop` | — | Loop Events — The Moments a Session Offers a Hook |
| a verb | — | — | The Tool — A Command Run by Its Own Path |
| a verdict | `Verdict` | — | The Hook — Code the Runtime Calls on Your Behalf |
| advice | `note` | — | The Check — One Rule, Asked on Every Call |
| allowing | — | — | The Estate Guard — One Script Wired to Every Write |
| an action | `@SPAPIRouteCommand` | — | Stack Tools — Commands Over a Stack's Own Register |
| an approval | — | — | Estate Skills — The Verbs That Change an Estate |
| an estate verb | `SKILL.md` | — | Estate Skills — The Verbs That Change an Estate |
| an instrument | — | — | The Plugin — Delivery Unit of the Marketplace |
| convened | — | — | The Lens — One Reviewing Viewpoint, Written Down |
| declaring | — | — | Estate Skills — The Verbs That Change an Estate |
| drift | — | — | The Ref — A Chapter, Restated and Stamped |
| introduced | `introduced` | — | Stack Checks — A Stack's Own Rules at Write Time |
| masking | `mask` | — | Stack Checks — A Stack's Own Rules at Write Time |
| silence | — | — | The Tool — A Command Run by Its Own Path |
| the audience | `lenses` | — | The Lens — One Reviewing Viewpoint, Written Down |
| the block | `spn:restates` | — | The Ref — A Chapter, Restated and Stamped |
| the block condition | — | — | The Lens — One Reviewing Viewpoint, Written Down |
| the bound model | `model` | — | The Agent — A Persona a Session Can Convene |
| the bound tools | `tools` | — | The Agent — A Persona a Session Can Convene |
| the call | `ToolInput` | — | The Hook — Code the Runtime Calls on Your Behalf |
| the claim | `sprepo.json` | — | Stack Refs — The Layer a Stack-Agnostic Verb Loads |
| the classification | — | — | Stack Skills — A Stack's Own Verbs |
| the closing gate | — | — | Stack Skills — A Stack's Own Verbs |
| the contract-first order | — | — | Stack Skills — A Stack's Own Verbs |
| the dispatcher | `dispatch` | — | The Hook — Code the Runtime Calls on Your Behalf |
| the dispatcher | `dispatch` | — | Stack Checks — A Stack's Own Rules at Write Time |
| the drawer | `Spec` | — | The Page — Produced From a Seat File, Never Typed |
| the estate manifest | `spestate.json` | — | The Estate Guard — One Script Wired to Every Write |
| the exit code | — | — | The Tool — A Command Run by Its Own Path |
| the fast path | `applies` | — | The Check — One Rule, Asked on Every Call |
| the grade | `Grade` | — | The Check — One Rule, Asked on Every Call |
| the grade | `Grade` | — | The Tool — A Command Run by Its Own Path |
| the guard | `deny-estate-violations.sh` | — | The Estate Guard — One Script Wired to Every Write |
| the hash | `seen` | — | The Ref — A Chapter, Restated and Stamped |
| the layer | — | — | Stack Refs — The Layer a Stack-Agnostic Verb Loads |
| the lens register | `LENS_LABEL` | — | The Lens — One Reviewing Viewpoint, Written Down |
| the listing | — | — | The Skill — A Verb's Steps, Loaded on Match |
| the manifests | `spestate.json` · `spinfrapkg.json` | — | Estate Refs — The Estate's Vocabulary, Restated as Cards |
| the marketplace | `marketplace.json` | — | The Plugin — Delivery Unit of the Marketplace |
| the name | `name` | — | The Skill — A Verb's Steps, Loaded on Match |
| the name | `name` | — | The Agent — A Persona a Session Can Convene |
| the new text | `content` · `new_string` | — | The Estate Guard — One Script Wired to Every Write |
| the path locator | — | — | Estate Refs — The Estate's Vocabulary, Restated as Cards |
| the payload | `Payload` | — | The Hook — Code the Runtime Calls on Your Behalf |
| the plugin root | `CLAUDE_PLUGIN_ROOT` | — | The Plugin — Delivery Unit of the Marketplace |
| the resulting text | `resultingText` | — | Stack Checks — A Stack's Own Rules at Write Time |
| the results file | — | — | Stack Tools — Commands Over a Stack's Own Register |
| the stamp | `spn:restates` | — | Stack Refs — The Layer a Stack-Agnostic Verb Loads |
| the tier | `tier` | — | Stack Tools — Commands Over a Stack's Own Register |
| the trigger | `description` | — | The Skill — A Verb's Steps, Loaded on Match |
| the trigger | `description` | — | The Agent — A Persona a Session Can Convene |
| the version | `version` | — | The Plugin — Delivery Unit of the Marketplace |
| the watch | `watched` | — | Stack Checks — A Stack's Own Rules at Write Time |
| the window opening | `SessionStart` | — | Loop Events — The Moments a Session Offers a Hook |
| what it reads | `needs` | — | The Check — One Rule, Asked on Every Call |
| worn | — | — | The Lens — One Reviewing Viewpoint, Written Down |
<!-- /spn:generated -->
