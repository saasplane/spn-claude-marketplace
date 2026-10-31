<!-- spn:doc
{
  "id": "behaviors-surface-hooks",
  "variant": "behaviors",
  "title": "Behaviors — Hooks",
  "lenses": ["ARCHITECT", "UX"],
  "status": "PLANNING",
  "summary": "What this plugin's wiring promises: nothing paid for at a moment that cannot put a bad script into the connector, one entry for the whole chain, and a script refused before the call rather than after it.",
  "keywords": ["hook", "matcher", "entry", "connector", "rows"]
}
-->

# Behaviors — Hooks

`For: Architect · UX designer` · `Status: 🔮 PLANNING`

The table below lists the promises [Hooks](../../02-constructs/02-surface/02-hooks.md) makes. A row says what somebody can do and what they see when they do it.

Every row below is declared and none is claimed: a run writes the last two cells.

| Id | Who | Does | Sees | Type | Tier | Status | Updated at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MKT.HOOKS.79 | Web developer | draw in a window without paying for this plugin on any other call | The wiring claims the connector's script runner and no other tool, and the harness applies that first | POSITIVE | UNIT | PLANNED | — |
| MKT.HOOKS.80 | Web developer | be told before the call that the connector will not take a script | A script calling an unsupported API or throwing there is refused with the sentence that says what to do instead | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.81 | Architect | trust the entry to survive a check that fails | A check that throws is skipped and the call goes on, so one broken rule never removes the others | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.143 | Web developer | be told when a design page makes how a prop is used a rule | A MUST, a "never" or a refusal attached to a prop's use in a Surface ref, a design-system page or a check is noted as guidance with cases, and the write goes on | NEGATIVE | UNIT | PLANNED | — |
