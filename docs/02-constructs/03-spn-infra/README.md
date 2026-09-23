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

This is the smallest of the three domains, and the boundary is what holds it together: nothing here changes a cloud. The guard refuses, the cards explain, and each skill names the tool's command that does the work through the tool's own doors.

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
**The estate plugin.** It holds what changes an estate: one shell script standing between an estate edit and the file it would write, the skills that change what an estate is, and the estate's own vocabulary restated for a reader who may never open the book.

| Construct | What it is |
| --- | --- |
| [The Estate Guard — Named Rules Wired to Every Write](01-estate-guard.md) | A dispatcher and its named rules standing between an estate edit and the file it would write — the narrow set of things they know about, the text they judge, and the direction they fail in when the input cannot be read. |
| [Estate Skills — The Skills That Change an Estate](02-estate-skills.md) | The skills an estate repository answers to — changing what the estate is, reading a rendering before it is approved, authoring a module end to end, and publishing a package — and the boundary every one of them restates rather than works around. |
| [Estate Refs — The Estate's Vocabulary, Restated as Cards](03-estate-refs.md) | The estate's own words, restated for a reader who may never open the book — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to. |
<!-- /spn:generated -->
