<!-- spn:doc
{
  "id": "behaviors-estate-hooks",
  "variant": "behaviors",
  "title": "Behaviors — Hooks",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "summary": "What the wiring promises: every write read before it lands, nothing paid for any other call, a command that works wherever the plugin was installed, and a rule change that needs no reinstall.",
  "keywords": ["hook", "PreToolUse", "matcher", "plugin root", "timeout", "rows"]
}
-->

# Behaviors — Hooks

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

[Hooks](../../02-constructs/03-infra/02-hooks.md) makes the promises below. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.HOOKS.21 | DevSecOps / Security | have every write and every edit read before it lands | One entry at the moment before a call runs, which is the only moment a call can still be refused | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.22 | DevOps / SRE | pay nothing for a call that is not a write | The matcher narrows the moment before the command runs, so no process starts for a read or a search | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.23 | Partner / integrator | run the same wiring wherever the plugin was installed | The command is written against the plugin root rather than against any checkout | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.24 | DevOps / SRE | change what a rule refuses without reinstalling the plugin | The wiring names a script, and an edit to that script is live on its next run | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.25 | Architect | find when a refusal fires in one file and what it says in another | `hooks/` holds the wiring alone, and code sits under `scripts/` | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.26 | DevSecOps / Security | be sure a slow first run is not quietly given up on | The declared allowance covers a run that imports each cloud's validators before it answers | NEGATIVE | UNIT | PLANNED | — |
