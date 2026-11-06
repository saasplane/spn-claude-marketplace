# Planning in an APPS · TS node

**This skill carries the stack's half of `DEVEX_IDEATE`, and nothing more.** How a requirement becomes `🔮 planned` rows, what a row holds and where the seats are is the skill's own — stated once, in `spn-devex`, which reads this file when the node's `sprepo.json` declares `TS`. **There is no `APPS_PLAN`**: `RULE.DEVEX.FUNCTION.062` folded planning into `ideate`, and the skill set is closed.

What is here is only what a different language would answer differently.

## Locating ownership

**Which module owns a capability is read from three places, in this order.** The workspace module map; the **installed `@saasplane/module-server-*` packages**, which is what this repository actually composes rather than what it could; and `.claude/saasplane/rules.md` where the repository has one.

Where no module owns it, this is a scaffolding conversation before it is a planning one — and the ladder is **use → configure → generalize into the platform → build domain-specific**. Descend only with a reason written down.

## The layers a requirement lands in

**A server module is five seats and a web module is three layers, and each row of a plan names the layer it lands in and the refs read for it.** The refs are named by plugin and path as the work map names them (`devex agent/work-map.md`), so the map's code rows resolve for a partner.

| Side | Layer | Holds | Refs read |
| --- | --- | --- | --- |
| server | Contract | states (Commands, States, Events, constants) and the service interfaces | `apps providers/ts/02-naming.md` · `module/README.md` · `providers/ts/05-code.md` |
| server | App | services own every guarantee, repositories own storage | `apps providers/ts/06-service.md` · `providers/ts/07-data.md` |
| server | Entry | HTTP controllers and queue listeners: parse, delegate to a contract service, render | `apps module/README.md` · `providers/ts/09-errors.md` |
| server | Config and Migrations | the module's typed config, and append-only timestamped schema and seed migrations | `apps providers/ts/07-data.md` · `providers/ts/10-configuration.md` |
| web | Contract | the states and the generated client the module's hooks call | `apps module/README.md` · `providers/ts/08-web.md` |
| web | App | the module's local service, only where the thin form is not enough | `apps providers/ts/08-web.md` · `module/README.md` |
| web | Entry (`ui`) | pages, containers, components and hooks, the transport being a person | `apps providers/ts/08-web.md` · `module/README.md` |

## Where markdown may not go

**No markdown inside `packages/` or `apps/`**, beyond the node's own front door — its `README.md` — and the repository's own tree. A `docs/` folder inside a package is drift, not a local convenience: the repository has one docs tree and a node has none, so a second one is a second answer that will disagree.
