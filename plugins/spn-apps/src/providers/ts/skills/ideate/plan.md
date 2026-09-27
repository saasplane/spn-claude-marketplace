# Planning in an APPS · TS node

**This skill carries the stack's half of `DEVEX_IDEATE`, and nothing more.** How a requirement becomes `🔮 planned` rows, what a row holds and where the seats are is the skill's own — stated once, in `spn-devex`, which reads this file when the node's `sprepo.json` declares `TS`. **There is no `APPS_PLAN`**: `RD.DEVEX.062` folded planning into `ideate`, and the skill set is closed.

What is here is only what a different language would answer differently.

## Locating ownership

**Which module owns a capability is read from three places, in this order.** The workspace module map; the **installed `@saasplane/module-server-*` packages**, which is what this repository actually composes rather than what it could; and `.claude/saasplane/rules.md` where the repository has one.

Where no module owns it, this is a scaffolding conversation before it is a planning one — and the ladder is **use → configure → generalize into the platform → build domain-specific**. Descend only with a reason written down.

## Where markdown may not go

**No markdown inside `packages/` or `apps/`**, beyond the node's own front door — its `README.md` — and the repository's own tree. A `docs/` folder inside a package is drift, not a local convenience: the repository has one docs tree and a node has none, so a second one is a second answer that will disagree.
