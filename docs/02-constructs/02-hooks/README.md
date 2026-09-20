<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-hooks",
  "title": "Hooks",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "summary": "The Hooks domain's constructs — what each thing is, what it is made of, and what it refuses."
}
-->

# Hooks

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

The model for **Hooks**. One file per construct, in an order where nothing appears before something it depends on.

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
what a hook is — the events it may run on, the grades it may return, what it may refuse and what it may only report

| Construct | What it is |
| --- | --- |
| [The Hook — Code the Runtime Calls For You](hook-set.md) | What a hook is — code wired to a runtime event or run by name, what it may return, and the line between refusing a call and only reporting on it. |
<!-- /spn:generated -->
