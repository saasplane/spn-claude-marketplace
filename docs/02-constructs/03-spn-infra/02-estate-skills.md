<!-- spn:doc
{
  "id": "estate-skills",
  "variant": "construct",
  "title": "Estate Skills — The Skills That Change an Estate",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["skill-set"],
  "summary": "The skills an estate repository answers to — changing what the estate is, reading a rendering before it is approved, authoring a module end to end, and publishing a package — and the boundary every one of them restates rather than works around.",
  "keywords": ["skill", "declare", "plan", "module", "release", "door"]
}
-->

# Estate Skills — The Skills That Change an Estate

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

An estate is changed by editing what it declares itself to be, and then by letting a tool render and apply that declaration. The skills here cover that walk: saying what the estate is, reading what a change would render before anybody approves it, writing a new piece for the estate to run, and publishing a piece that is finished.

## Overview

They share one boundary, and each of them restates it. **No skill here changes a cloud.** Each names the tool's command that does, and the caution the workspace states everywhere — a cloud is changed only through the tool's own doors — is repeated rather than worked around.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| an estate skill | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group an estate answers to |
| declaring | — | changing what the estate says it is, as an edit to a manifest rather than to a rendering |
| a rendering | — | what a declaration would produce if applied, read while changing it is still cheap |
| an approval | — | the moment after which the estate has changed and the question becomes a repair |
| a module | `spinfrapkg.json` | a piece the platform actually runs, attached at a step of the estate's own lifecycle |
| a pin flip | — | pointing a consumer at a published version, which is the last act of authoring a module |

## Model

Each skill is a different point on one walk, and the last box is the same for all of them.

```dg
{ "kind": "map",
  "caption": "Every skill ends at the tool's command, because a cloud is changed only through the tool's own doors.",
  "boxes": [
    { "id": "a", "label": "the ask", "note": "change what the estate is, or publish what it runs" },
    { "id": "b", "label": "the skill", "note": "one of the four folders, chosen by its own description" },
    { "id": "c", "label": "the manifest edit", "note": "one line per choice, validated and read as a diff" },
    { "id": "d", "label": "the tool's command", "note": "the only door a cloud is changed through" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "matched to" },
    { "from": "b", "to": "c", "label": "reviewed as" },
    { "from": "c", "to": "d", "label": "handed to" }
  ] }
```

None of these folders divides into steps: each walk is short enough that one file holds it.

## Parts

### Declaring is a manifest edit, reviewed line by line

A change to what the estate is should read as one line per choice. A diff mixing rendered output with declared intent hides the decision inside the consequence. So the declaring skill changes the manifest, validates it, and shows the difference in that shape. Authoring a new package and publishing one are explicitly not this skill, and its description names both neighbours so a wrong ask lands in the right folder. *Where:* `plugins/spn-infra/skills/declare/SKILL.md`

### A rendering is read before anything is approved

Approval is the last moment a wrong rendering is cheap. After it, the estate has changed. So one skill states what a rendering must name and what it must never contain, and it also answers the narrower question of whether a declaration change produced exactly what was intended and nothing more. It is convened before any approval, never after. *Where:* `plugins/spn-infra/skills/plan-review/SKILL.md`

### Authoring a module names what is not a module

A vendor reached over the network is application configuration behind a seam, and the estate never sees it. Treating one as a module builds infrastructure for something that does not exist. So the authoring skill covers a piece the platform actually runs, and rules the networked case out in the sentence a session matches against. It walks the whole path in one file, from the first scaffold to the pin flip. *Where:* `plugins/spn-infra/skills/module-author/SKILL.md`

### The version is a reviewed edit, and the tool's command does the rest

A version typed into a build script is a second place the number lives. The package manifest is the one place. So the publishing skill edits that field as a reviewed change and then runs the release command, which stages and publishes. The same skill covers repointing a bespoke script at the release command, so the second place stops existing. *Where:* `plugins/spn-infra/skills/release/SKILL.md`

### A skill names the card, and the card holds the words

None of these files defines the estate's vocabulary. Each names the card that does — which file declares what, which layer owns which act, how a name is composed — so a skill sequences the work and the card holds the words. *Where:* `plugins/spn-infra/refs/`

## Boundary

This page answers which skills an estate repository answers to and what each one does. It does not answer what a skill is — the frontmatter, the matching and the rule that a skill carries steps and never a rule are [The Skill](../01-spn-core/07-skill-set.md). It does not answer the vocabulary these skills use either, and it does not answer what happens at write time when an edit would break a law.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the skills an estate answers to, and that none of them changes a cloud itself | the frontmatter, the listing and the matching every skill shares | [The Skill](../01-spn-core/07-skill-set.md) |
| that a declaration change is read as one line per choice, before any approval | the manifest, layer, naming and law vocabulary each skill uses | [Estate Refs](03-estate-refs.md) |
| that publishing is a reviewed version edit followed by the release command | what is refused at the moment an estate file is written | [The Estate Guard](01-estate-guard.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Skills construct | the skill set is closed, and a skill's value spells the domain of the plugin that ships it | MUST |
| `RD.DEVEX.020` | a cloud is changed only through the tool's own doors, and never by hand | MUST |
| `RD.DEVEX.019` | every skill here restates a chapter and adds no rule of its own | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/02-skills` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-infra` | the skills an estate repository answers to, each naming the tool's command that does the work | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/restate-drift.ts` | gate | every card these skills name still reads as the chapters it stamps read today |

Try it: `node plugins/spn-core/hooks/tools/restate-drift.ts`
