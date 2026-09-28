<!-- spn:doc
{
  "id": "behaviors-estate-guard",
  "variant": "behaviors",
  "title": "Behaviors — Scripts",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "summary": "What the scripts tree promises: a leak caught before the file exists, a refusal only where a key names what it holds, a provider string allowed in the place that sanctions it, a call allowed wherever the input cannot be read, and a cloud that joins by adding a folder.",
  "keywords": ["scripts", "secret", "account id", "dist", "region", "rows"]
}
-->

# Behaviors — Scripts

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

[Scripts](../../02-constructs/03-infra/04-scripts.md) makes these promises. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.SCRIPTS.36 | DevSecOps / Security | have an estate leak caught before the file exists | The write is refused at the moment it would land, with the law named in the message | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.37 | DevOps / SRE | keep working when the gate cannot read its input | No parser, unreadable input or no file path all end in silence with the call allowed | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.38 | DevOps / SRE | edit a file that already carries a fault without being refused for it | The text this call would add is judged, rather than the file on disk | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.39 | DevOps / SRE | be refused a hand edit under a build output folder | The path alone decides, before any text is read, and the message names the source folder | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.40 | DevOps / SRE | write a plain number without it being read as an account | A key spelled as an account identifier is needed; a loose number is left alone | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.41 | DevOps / SRE | reference a credential by variable rather than pinning one | A quoted literal of real length on a credential-named key is refused; a reference is not | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.42 | DevOps / SRE | spell a provider region in the entry that sanctions it | The sanctioned homes are removed from the text first, and only the remainder is searched | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.43 | DevSecOps / Security | see the run end cleanly whatever it decided | A refusal is the printed decision, and every path exits zero | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.44 | DevOps / SRE | keep the remaining rules when one of them throws | Each rule is asked on its own and a fault is skipped, so a single fault cannot take the chain down | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.45 | Architect | add a cloud without editing the gate | The gate reads which provider folders exist rather than naming any cloud | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.46 | DevSecOps / Security | be caught spelling one cloud's region while the declaration names another | Every cloud's validators run rather than only the declared one's | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.47 | Partner / integrator | install this plugin on its own and still have the gate work | The event and timing helpers are this plugin's own copies, so nothing is resolved out of a sibling | POSITIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.61 | Quality engineer | be refused at write time for filing a test under the wrong tier folder | A case-like file outside the tier folder its extension belongs to is denied, naming the tier it should sit under — proven in `tests/unit/scripts/lib/t-test-tree-shape.mjs` | NEGATIVE | UNIT | PLANNED | — |
| MKT.SCRIPTS.62 | DevOps / SRE | write the one sanctioned test ARN without being denied | An ARN naming the placeholder account `000000000000` is allowed only inside a `*.tftest.hcl` file; the same ARN elsewhere, or any other account inside a test file, is denied — proven in `tests/unit/scripts/lib/laws/t-estate.mjs` | POSITIVE | UNIT | PLANNED | — |

## Retired ids

An id is a promise somebody already made, so a promise re-issued under a new construct name leaves its old id behind rather than carrying it. These ids are retired and name nothing.

| Retired | Re-issued as |
| --- | --- |
| `MKT.GUARD.01` – `MKT.GUARD.08` | `MKT.SCRIPTS.36` – `MKT.SCRIPTS.43` |
