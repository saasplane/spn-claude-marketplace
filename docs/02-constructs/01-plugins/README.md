<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-plugins",
  "title": "Plugins",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "summary": "The Plugins domain's constructs — what each thing is, what it is made of, and what it refuses."
}
-->

# Plugins

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

The model for **Plugins**. One file per construct, in an order where nothing appears before something it depends on.

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
what a plugin is, how the set a workspace loads is derived from its claim, and how one is published and installed

| Construct | What it is |
| --- | --- |
| [The Plugin — Delivery Unit of the Marketplace](plugin-set.md) | What a plugin is made of, how the marketplace lists one, and how installing it puts bytes into a session — the container every hook, skill, ref and agent brief lives inside. |
<!-- /spn:generated -->
