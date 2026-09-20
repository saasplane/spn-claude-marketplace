<!-- spn:doc
{
  "id": "cap-spn-core-skills",
  "title": "Skills — spn-core/skills/",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "summary": "The eleven stack-agnostic skills spn-core ships, one folder per DevEx-stage verb, each a SKILL.md a session loads once its description matches the ask."
}
-->

# Skills — spn-core/skills/

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

Every folder here is one verb from the stack-agnostic DevEx stage list, never a stack's own build step — those are `spn-apps-ts`'s and `spn-infra`'s to ship. Each holds one `SKILL.md`; none of these divides into a `steps/` folder the way a stack's larger skills do.

| Folder | Loaded when the ask is about | Drives |
| --- | --- | --- |
| `check/` | proving or disproving a claim about what the code does, with no build and no test run | — |
| `day-zero/` | an empty folder holding no `sprepo.json` at all — the estate questions, then the acts that mint both repositories | — |
| `deliver/` | what must be true before a release, and what a version means | `apps` · `infra --cloud` |
| `develop/` | the contract-first build order, and what each layer may not do | `apps` |
| `ideate/` | deciding what a node IS before anything is planned, landing as sections of `CONCEPT.md` | — |
| `operate/` | observing, responding to, and maintaining a running platform | `infra --cloud` |
| `plan/` | turning a requirement into a design the platform's own vocabulary can carry | — |
| `provision/` | how infrastructure appears for local development, layer by layer | `infra`, both realizations |
| `report/` | producing a report or an approach document into a node's artifacts pocket, only on request | — |
| `scm/` | what a repository or project must declare, and how repos and projects are standardized | `repo` |
| `test/` | where a behaviour is proven, at which tier, and what a passing suite does and does not mean | `apps` |

**Does not do.** None of these names a stack's own command. Each states the platform-wide vocabulary — the group in `refs/commands.md` — and hands the stack's plugin the job of realizing it.
