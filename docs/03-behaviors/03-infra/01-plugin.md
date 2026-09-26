<!-- spn:doc
{
  "id": "behaviors-estate-plugin",
  "variant": "behaviors",
  "title": "Behaviors — Plugin",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "summary": "What delivery promises for the estate plugin: one number across the three, a version that names the published bytes, a load decided by the repository's own declaration, and a folder that ships no agent brief.",
  "keywords": ["plugin", "version", "lockstep", "install", "INFRA", "rows"]
}
-->

# Behaviors — Plugin

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

[Plugin](../../02-constructs/03-infra/01-plugin.md) makes the promises below. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.PLUGIN.13 | DevOps / SRE | read one number and know whether the whole set is current | The three plugins carry the same version, and a release moves all three whether or not each one changed | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.14 | Architect | tell published bytes apart from bytes somebody is working on | The version names what is published, and the count moves after a release rather than before | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.15 | DevOps / SRE | find a stale installed copy instead of running it unknowingly | A cache directory is keyed by version, so bytes edited without an increment are findable | NEGATIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.16 | Partner / integrator | have the estate plugin loaded without naming it anywhere | The repository's own declared world decides the set, and a workspace types no plugin name | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.17 | DevOps / SRE | work in the blueprint repository under the same estate laws | A declared world of `INFRA` covers the estate repository and the blueprint repository alike | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.18 | Architect | read one description saying in full what the plugin carries | The manifest description is matched against the work at hand, and it is the current side wherever the marketplace entry disagrees | POSITIVE | UNIT | PLANNED | — |
| MKT.PLUGIN.19 | Architect | find no agent brief here and know the absence is deliberate | This plugin ships no `agents/` folder, and nothing stands in its place | NEGATIVE | UNIT | PLANNED | — |
