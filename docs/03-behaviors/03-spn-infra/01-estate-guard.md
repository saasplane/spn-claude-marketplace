<!-- spn:doc
{
  "id": "behaviors-estate-guard",
  "variant": "behaviors",
  "title": "Behaviors — The Estate Guard",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "summary": "What the guard promises: a leak caught before the file exists, a refusal only where a key names what it holds, a provider string allowed in the place that sanctions it, and a call allowed wherever the guard cannot read its input.",
  "keywords": ["guard", "secret", "account id", "dist", "region", "rows"]
}
-->

# Behaviors — The Estate Guard

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

These are the promises [The Estate Guard](../../02-constructs/03-spn-infra/01-estate-guard.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.GUARD.01 | DevSecOps / Security | have an estate leak caught before the file exists | The write is refused at the moment it would land, with the law named in the message | NEGATIVE | UNIT | PLANNED | — |
| MKT.GUARD.02 | DevOps / SRE | keep working when the guard cannot read its input | No parser, unreadable input or no file path all end in silence with the call allowed | POSITIVE | UNIT | PLANNED | — |
| MKT.GUARD.03 | DevOps / SRE | edit a file that already carries a fault without being refused for it | The text this call would add is judged, rather than the file on disk | POSITIVE | UNIT | PLANNED | — |
| MKT.GUARD.04 | DevOps / SRE | be refused a hand edit under a build output folder | The path alone decides, before any text is read, and the message names the source folder | NEGATIVE | UNIT | PLANNED | — |
| MKT.GUARD.05 | DevOps / SRE | write a plain number without it being read as an account | A key spelled as an account identifier is needed; a loose number is left alone | POSITIVE | UNIT | PLANNED | — |
| MKT.GUARD.06 | DevOps / SRE | reference a credential by variable rather than pinning one | A quoted literal of real length on a credential-named key is refused; a reference is not | NEGATIVE | UNIT | PLANNED | — |
| MKT.GUARD.07 | DevOps / SRE | spell a provider region in the entry that sanctions it | The sanctioned homes are removed from the text first, and only the remainder is searched | POSITIVE | UNIT | PLANNED | — |
| MKT.GUARD.08 | DevSecOps / Security | see the guard end cleanly whatever it decided | A refusal is the printed decision, and every path exits zero | POSITIVE | UNIT | PLANNED | — |
