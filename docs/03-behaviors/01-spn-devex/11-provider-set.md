<!-- spn:doc
{
  "id": "behaviors-provider-set",
  "variant": "behaviors",
  "title": "Behaviors — The Provider",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "summary": "What a provider promises: a second realization joins by adding a folder rather than editing a gate, an absent half says something true, and a rule sits beside the check that runs it.",
  "keywords": ["provider", "instance", "gate", "stack", "cloud", "rows"]
}
-->

# Behaviors — The Provider

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

The table below lists the promises [The Provider](../../02-constructs/01-spn-devex/11-provider-set.md) makes. A row says what somebody can do and what they see when it works.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.PROVIDER.01 | Architect | add a second stack or cloud without editing a gate | The new realization is a folder under `providers/`, and every gate resolves into it unchanged | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDER.02 | Architect | tell which instance a session is working in without being told | Each gate reads it from the nearest `sprepo.json`, so no command carries it and no extension implies it | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDER.03 | Engineering leader | read a provider folder and know what kind of thing each part is | The halves carry the plugin's own folder names, so `skills/` is what a skill loads and `scripts/` is what a gate runs | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDER.04 | Architect | tell a realization that is absent from one that is unfinished | A provider contributes only the halves it has something to put in, and the missing folder is the statement | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDER.05 | Backend developer | find the rule a refusal came from without leaving the provider | A rule lives inside the check that runs it, so the parse and its rules are read together | POSITIVE | UNIT | PLANNED | — |
| MKT.PROVIDER.06 | Architect | keep a domain folder a mirror of the constructs it restates | Material a skill loads is refused a place in `refs/`, because it restates no construct | NEGATIVE | UNIT | PLANNED | — |
| MKT.PROVIDER.07 | DevSecOps / Security | be sure a provider folder cannot register a skill of its own | No `SKILL.md` sits under `providers/`, and discovery keys on that filename | NEGATIVE | UNIT | PLANNED | — |
