<!-- spn:doc
{
  "id": "stack-skills",
  "variant": "construct",
  "title": "Stack Skills — A Stack's Own Verbs",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "dependsOn": ["skill-set"],
  "summary": "The verbs that can only be said in one stack's own words — what makes a verb stack-concrete, why one of them divides into ordered steps, why a mode is an argument, and the verb that is deliberately absent here.",
  "keywords": ["skill", "verb", "steps", "contract-first", "mode", "absence"]
}
-->

# Stack Skills — A Stack's Own Verbs

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

A verb belongs to a stack when the steps behind it name that stack's own commands, layers and file shapes. Scaffolding a project, building a capability, running the suites, proving a package: each of those is a different walk in a different stack, so each lives in the plugin for the stack it describes.

The absence here is as deliberate as anything present. **Planning is not a stack verb.** The book's set of verbs is closed and carries no planning verb for this world, so shipping one would add a value the standard does not have, and two skills would then compete for the same ask. The verb stays in the core plugin, and this plugin supplies only the layer that verb reads.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a stack verb | `SKILL.md` | one folder under this plugin's `skills/`, named for a verb of the command group this stack answers to |
| a mode | — | an argument a verb's own description names, so one folder answers several close asks |
| a step | `steps/` | one file of a longer walk, read only when the skill's own router names it |
| the contract-first order | — | the fixed order the steps run in, because everything downstream is generated from the contract or written against it |
| the classification | — | the first thing the router does: deciding which layers an ask actually touches |
| the closing gate | — | the review a verb hands its own work to, named in its description so the hand-off happens without being asked for |

## Model

The ask is matched to a verb, the verb is narrowed by a mode, and only the longest verb divides further into ordered steps.

```dg
{ "kind": "map",
  "boxes": [
    { "id": "a", "label": "the ask", "note": "build, scaffold, run, prove, review — in your own words" },
    { "id": "b", "label": "the verb", "note": "one of the five folders, chosen by its own description" },
    { "id": "c", "label": "the mode", "note": "an argument the description names, never a second skill" },
    { "id": "d", "label": "the steps", "note": "one skill divides into ordered files; the rest do not" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "matched to" },
    { "from": "b", "to": "c", "label": "narrowed by" },
    { "from": "c", "to": "d", "label": "sequences" }
  ] }
```

## Parts

### One verb divides into steps, and the order is the rule

The contract comes first, and everything downstream is generated from it or written against it. A service written before its state is a service that will be rewritten. So the build verb is the only folder here with a step folder, its steps run in a fixed order, and each one is read before that layer's code is written rather than after. *Where:* `plugins/spn-apps-ts/skills/implement/steps/`

### The router classifies before it sequences

The build verb first decides whether the ask touches the back end alone, the front end alone, or both, and that classification decides which steps apply. Sequencing every step for every ask would make the smallest change cost the largest walk. *Where:* `plugins/spn-apps-ts/skills/implement/SKILL.md`

### A mode is an argument, not a second folder

Two folders with almost the same description compete for the same match, and the matching gets worse as the pair grows. So a verb answering several close asks takes a mode, names its modes in the sentence a session matches against, and says which neighbouring verb an adjacent ask belongs to instead. A destructive mode says it is destructive in that same sentence. *Where:* `plugins/spn-apps-ts/skills/verify/SKILL.md`

### A step carries rules it does not own

A step file is where the next developer copies from, so a rule missing there is a rule that will not be followed, and a rule invented there is a second source. The steps that carry rules carry them under the same stamp a ref carries, and cite their chapters in the text where they do not. *Where:* `plugins/spn-apps-ts/skills/implement/steps/contract.md`, `plugins/spn-apps-ts/skills/implement/steps/service.md`

### The closing gate belongs to the verb

A contract change reviewed at the end of a session is reviewed by the context that wrote it. So the build verb closes with the suites and then hands the change to the review verb in its contract mode, and the hand-off is named in the description, so it happens even when nobody asks for it. *Where:* `plugins/spn-apps-ts/skills/implement/SKILL.md`

### The absent verb, and where its layer lives

Planning stays in the core plugin. What this plugin ships instead is reference material the planning verb reads once it has resolved which stack it is standing in. That keeps one verb, one description and one match, with a concrete step at the end of it. *Where:* `plugins/spn-apps-ts/refs/plan.md`

## Boundary

This page answers what makes a verb this stack's own, and how the verbs here are shaped. It does not answer what a skill is — the frontmatter, the matching against a listing, and the rule that a skill carries steps and never a rule are [The Skill](../01-spn-core/07-skill-set.md). It does not answer what the planning layer says either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the verbs this stack answers to, the step order behind the longest of them, and the modes each one takes | the frontmatter, the listing, the matching and the step mechanism | [The Skill](../01-spn-core/07-skill-set.md) |
| that the planning verb is deliberately absent here | the planning verb itself, and the layer this plugin hands it | [Stack Refs](04-stack-refs.md) |
| that a verb hands its own work to a review at its close | what that review checks, and which viewpoint it convenes | [The Lens](../01-spn-core/09-lenses.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Skills construct | the verb set is closed, and a skill's value spells the domain of the plugin that ships it | MUST |
| `RD.DEVEX.019` | every step restates a chapter of the provider standard and adds no rule of its own | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a skill edit is loadable only after an install and a fresh window | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/02-skills` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-apps-ts` | the verbs for a TypeScript stack repository, the ordered steps behind the build verb, and the deliberate absence where planning would be | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/restate-drift.ts` | gate | every step carrying a stamp still reads as the chapter it names reads today |

Try it: `node plugins/spn-core/hooks/tools/restate-drift.ts`
