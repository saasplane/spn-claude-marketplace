# Step: env — where a key goes in an APPS · TS node

**The stack's half of the docs step.** Closing the doc set is the same work in any language and is stated once, in the **spn-devex** plugin's `refs/doc-sets.md`. What a TypeScript repository's env files look like is not, and it is here.

A new module env variable (`{CODE}_{MOD}_*`) is documented where it lives: **the package's own `README.md`**, in its configuration matrix (depth in `docs/05-guides/README.md`). It is configuration rather than a contract term, so it goes in neither the data model nor a `Terms` table. It is also documented in the app's `envs/local.env`, under the module's banner comment. Committed env files carry **no secret values** — secrets appear empty with a required-in-shell annotation. Keep the env file's header key list in sync with what migrations actually read.

## Where a key goes — one order, in every env file

An env file is read top to bottom by somebody looking for one key, so the groups run in the order the thing itself is built. **Each group is named by what it IS**, which is what lets a family nobody has invented yet still have an obvious home:

| | Group | What belongs in it |
| --- | --- | --- |
| 1 | `{CODE}_PLATFORM_` | what this node **belongs to**. A platform app has one; a standalone app does not, and that absence is correct rather than a gap |
| 2 | `{CODE}_RESOURCE_` | what it **consumes** — database, cache, queue, storage. One banner per resource |
| 3 | the entries | what it **publishes** — `{CODE}_API_`, and a queue or CLI entry where the node has one |
| 4 | `{CODE}_HEALTH_` · `{CODE}_LOG_` · `{CODE}_AUTH_` | what every process **carries** whatever it serves — the providers and the app's own configuration |
| 5 | `{CODE}_{MOD}_` | one block per module the app composes |

Group 4 is not part of group 3, and the distinction is load-bearing: a processor with no API entry still answers a probe, still logs and still authenticates — the entry table starts `HEALTH` in `QUEUE` mode — so filing any of the three under `API` would tie them to a surface they do not depend on.

**Every sub-level carries its own banner**, in the shape the resource blocks already use — `# Resource: cache — …`, `# Entry: API — …`, `# Module: USER`. A key added with no banner above it is a key the next reader has to guess the owner of.

**A port and an endpoint are different facts**, and both are owed: `{CODE}_API_PORT` says how the app **binds**, `{CODE}_API_ENDPOINTS` says where a consumer **reaches** it. A bind host cannot stand in for an endpoint — `0.0.0.0` is nowhere anything can call — and an endpoint is **published, never composed**: a reader building `{env}-{label}.{base}` is a second place knowing the host grammar. The exception is a surface that is never published at all, such as health, which is always reached on the loopback at `{CODE}_HEALTH_PORT`.
