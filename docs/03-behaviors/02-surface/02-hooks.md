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
| MKT.HOOKS.395 | Web developer | be told when a design page writes a prop's use as a rule | `surface-design-wording` notes a MUST, a "never" value or a refusal attached to a prop's usage in a design-system document, and names guidance with cases as the form; the write goes on | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.396 | Web developer | be told when Playground is not the last story of a unit | `surface-story-order` notes a unit whose Playground is not last among its stories or is missing from the `storySort` order, and the write goes on | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.397 | Web developer | be refused a misspelt company or product name | `surface-product-name` refuses `SaasPlane`, `Saas Plane` and `SPN Demo` in visible web or docs text and names `SaaS Plane` | NEGATIVE | UNIT | PLANNED | — |
| MKT.HOOKS.398 | Web developer | be refused a Figma file or theme collection named with a middle dot | `surface-figma-name` refuses a call to the Figma connector that names a library file or a theme collection with a middle dot, and names the `DS <n>-<Name>` form | NEGATIVE | UNIT | PLANNED | — |
