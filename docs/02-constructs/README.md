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

| Domain | State |
| --- | --- |
| [Plugins](01-plugins/README.md) | 🔮 nothing written yet |
| [Hooks](02-hooks/README.md) | 🔮 nothing written yet |
| [Skills](03-skills/README.md) | 🔮 nothing written yet |
| [Refs](04-refs/README.md) | 🔮 nothing written yet |
| [Agents](05-agents/README.md) | 🔮 nothing written yet |

**The face below is the dictionary**, and it is generated. One row per term: the word a consumer uses, the term the contract uses, where it is stored, and the construct it comes from. Each column has exactly one source, which is what makes the generation possible.

## The dictionary

<!-- spn:generated dictionary — do not edit inside these markers; `docs.ts face` writes it -->
| Term | Contract term | Where it is stored | From |
| --- | --- | --- | --- |
| a check | `Verdict` | — | The Hook — Code the Runtime Calls For You |
| a hook | `EventHook` | — | The Hook — Code the Runtime Calls For You |
| a lens | `LensFile` | — | The Agent — A Persona a Session Can Convene |
| a plugin | `PluginManifest` | — | The Plugin — Delivery Unit of the Marketplace |
| a ref | `RestatesBlock` | — | The Ref — A Chapter, Restated and Stamped |
| a skill | `SkillFrontmatter` | — | The Skill — A Verb's Steps, Loaded on Match |
| a step | `SkillStep` | — | The Skill — A Verb's Steps, Loaded on Match |
| a tool | `NamedInstrument` | — | The Hook — Code the Runtime Calls For You |
| an agent | `AgentBrief` | — | The Agent — A Persona a Session Can Convene |
| drift | `DriftFinding` | — | The Ref — A Chapter, Restated and Stamped |
| installing | `PluginInstall` | — | The Plugin — Delivery Unit of the Marketplace |
| the marketplace | `MarketplaceEntry` | — | The Plugin — Delivery Unit of the Marketplace |
| the stamp | `Citation` | — | The Ref — A Chapter, Restated and Stamped |
| the trigger | `SkillDescription` | — | The Skill — A Verb's Steps, Loaded on Match |
| the trigger | `AgentDescription` | — | The Agent — A Persona a Session Can Convene |
<!-- /spn:generated -->
