<!-- spn:doc
{
  "id": "spn-claude-marketplace-constructs-spn-apps-ts",
  "title": "spn-apps-ts — The TypeScript Stack Domain",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "summary": "The model behind the apps world made concrete for TypeScript — the write-time rules only this stack has, the tools that read its own registers, the verbs that build in it, and the planning layer it ships for a verb it does not own."
}
-->

# spn-apps-ts — The TypeScript Stack Domain

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

The model for everything that can only be said about one stack. One file per construct, in an order where nothing appears before something it depends on.

Each construct here is the stack-concrete form of one in the core domain, so read its counterpart there first. The shape a check takes, what a tool is, and how a skill is matched are all settled in the core domain and are not restated in this one.

<!-- spn:generated domain — do not edit inside these markers; `docs.ts face` writes it -->
**The TypeScript stack plugin.** It holds what only a stack can say: a check whose rule is true of one stack and nowhere else, a tool over that stack's own register, and the verbs that can only be said in its own words. **A verb that is stack-agnostic stays in `spn-core` and reaches a concrete step through a ref here**, rather than being copied.

| Construct | What it is |
| --- | --- |
| [Stack Checks — A Stack's Own Rules at Write Time](01-stack-checks.md) | A check whose rule is true of one stack and nowhere else — read against the source as the pending write would leave it, asking whether this edit introduces the pattern, and refusing only where the model behind the rule is settled. |
| [Stack Tools — Commands Over a Stack's Own Register](02-stack-tools.md) | A tool that reads or writes one stack's own declarations — the register found by its header rather than by a path, the two cells a run owns against the cells a person decides, and coverage measured against published actions rather than routes. |
| [Stack Skills — A Stack's Own Verbs](03-stack-skills.md) | The verbs that can only be said in one stack's own words — what makes a verb stack-concrete, why one of them divides into ordered steps, why a mode is an argument, and the verb that is deliberately absent here. |
| [Stack Refs — The Layer a Stack-Agnostic Verb Loads](04-stack-refs.md) | Reference material a stack ships for a verb it does not own — how a stack-agnostic verb reaches a concrete step without being copied, why the file has no trigger of its own, and where the rows a design produces are written. |
<!-- /spn:generated -->
