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

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
**The estate plugin** holds what changes an estate: one shell script standing between an estate edit and the file it would write, the skills that change what an estate is, and the estate's own vocabulary restated for a reader who may never open the book.

| Construct | What it is |
| --- | --- |
| [The Estate Guard — Named Rules Wired to Every Write](01-estate-guard.md) | A dispatcher and its named rules standing between an estate edit and the file it would write — the narrow set of things they know about, the text they judge, and the direction they fail in when the input cannot be read. |
| [Estate Skills — The Skills That Change an Estate](02-estate-skills.md) | The skills an estate repository answers to — changing what the estate is, reading a rendering before it is approved, authoring a module end to end, and publishing a package — and the boundary every one of them restates rather than works around. |
| [Estate Refs — The Estate's Vocabulary, Restated as Cards](03-estate-refs.md) | The estate's own words, restated for a reader who may never open the book — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to. |
<!-- /spn:generated -->

<!-- spn:generated dictionary — do not edit inside these markers; `docs.ts face` writes it -->
## Glossary

| Term | Contract term | What it means |
| --- | --- | --- |
| **The Estate Guard** | | |
| [a rule](01-estate-guard.md) | `checks/estate-violations.ts` | one thing the guard knows how to recognise, carrying its own name and its own refusal message |
| [a sanctioned home](01-estate-guard.md) | `region` | the place a provider's own string is legitimate, which is removed from the text before that rule searches |
| [allowing](01-estate-guard.md) | — | the answer to anything the guard cannot read: no decision, and the ordinary permission flow continues |
| [the estate manifest](01-estate-guard.md) | `spestate.json` | the declaration file where one rule applies and nowhere else |
| [the guard](01-estate-guard.md) | `events/pretooluse.ts` | this plugin's hook entry point: one dispatcher, wired to writes and edits |
| [the new text](01-estate-guard.md) | `content` · `new_string` | what this call would add — a write's content, or an edit's replacement — which is what the rules read |
| **Estate Skills** | | |
| [a module](02-estate-skills.md) | `spinfrapkg.json` | a piece the platform actually runs, attached at a step of the estate's own lifecycle |
| [a pin flip](02-estate-skills.md) | — | pointing a consumer at a published version, which is the last act of authoring a module |
| [a rendering](02-estate-skills.md) | — | what a declaration would produce if applied, read while changing it is still cheap |
| [an approval](02-estate-skills.md) | — | the moment after which the estate has changed and the question becomes a repair |
| [an estate skill](02-estate-skills.md) | `SKILL.md` | one folder under this plugin's `skills/`, named for a command of the group an estate answers to |
| [declaring](02-estate-skills.md) | — | changing what the estate says it is, as an edit to a manifest rather than to a rendering |
| **Estate Refs** | | |
| [a card](03-estate-refs.md) | `refs/` | one markdown file restating one subject of the estate model, in full, under a stamp |
| [a coordinate](03-estate-refs.md) | — | one part a resource name is composed from, drawn from a closed vocabulary |
| [a law](03-estate-refs.md) | — | one thing a declaration must never do, written with the checkable defect it names |
| [a layer](03-estate-refs.md) | — | one band of the estate, with the same commands as every other and a fixed place in the order |
| [the manifests](03-estate-refs.md) | `spestate.json` · `spinfrapkg.json` | the files that mark an estate node and name what kind it is |
| [the path locator](03-estate-refs.md) | — | how a node is resolved from wherever you are standing, rather than guessed from a folder name |
<!-- /spn:generated -->
