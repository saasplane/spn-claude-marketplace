<!-- spn:doc
{
  "id": "cap-spn-apps-ts-refs",
  "title": "Refs — spn-apps-ts/refs/",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The one file this plugin restates on its own: the PLAN stage's TS · APPS layer, loaded by spn-core's plan skill rather than duplicated inside it."
}
-->

# Refs — spn-apps-ts/refs/

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

| File | Restates |
| --- | --- |
| `plan.md` | the `PLAN` stage's step for the `APPS · TS` combination — read by `spn-core`'s `plan` skill rather than copied into it, so a stack-agnostic verb still reaches a stack-concrete step |

**Does not do.** This folder carries no command vocabulary, no contract rules and no cross-repo protocol — those are `spn-core`'s, restated once and read by every stack's plugin rather than by this one alone.
