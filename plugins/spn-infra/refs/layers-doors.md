<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md", "seen": "3c7d36f0" },
    { "path": "docs/04-capabilities/02-support/02-infra/03-blueprints/01-layers.md", "seen": "c5af69a1" }
  ]
}
-->

# Layers and doors — the estate verb card

**Source of truth:** the foundation's `docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md` and `docs/04-capabilities/02-support/02-infra/03-blueprints/01-layers.md`. Read this card as the restatement; the book governs. The realization is `spnutils infra …`.

## Layer nouns × verbs

The layers are nouns; each takes `plan · up · down · status`. Start them in order, and a lower layer missing is the usual reason a higher one will not start.

| Noun | Verbs | Locally | In the cloud |
| --- | --- | --- | --- |
| `organization` | plan · up · down · status | the machine's trust bootstrap — the CA, its one trust prompt, the shared ingress; `--reset-certs` after CA loss | accounts, root guardrails, registry pairs, zones |
| `platform` | plan · up · down · status | the platform's container group — engines + each module's local rendering; converges org prerequisites in place | containers, workload accounts, policies, zone, instruments |
| `environment` | plan · up · down · status — `<env>`, **`--cloud` only** | **no local form exists** — the machine is one environment; targeting it locally is refused by name | network → resources → compute, in order |
| `app` | up · down | the app's derived converge — schemas, certificates, a hosts entry, the ingress vhost and a web app's runtime document; app from the cwd, `-p` overrides | — (deploys ride the pipeline) |

**Every provisioning run names its mode, and there is no default** (RD.INFRA.094). `up` and `down` each take exactly one of `--plan` or `--apply`. A verb that plans when you forget a flag is a verb doing another verb's job, and a default would decide the direction of the mistake for you.

Beside the layers: `logs [service]` · `show` (resolution per layer, incl. **PINNED @ version or a path**) · `trust-ca` (trust the machine's own CA — what the local `organization up` does as part of its bootstrap) · `domain register|unregister` (route a host through the local proxy, for testing a customer-owned domain) · the `config` verbs (`set · get · list · export · import · diff · render` — the app plane only, never the ledger) · `scaffold repo|organization|platform|module` · `validate` · `test` · `release`.

## Doors — who may run what, where

The verbs divide by **what is being changed**, never by who runs them. Each group has a door, and the repository's own `sprepo.json` is the door.

| Group | Subject | Door |
| --- | --- | --- |
| `workspace` | the folder your day runs in | anywhere — it needs no repository at all, because minting the folder comes before any repository declares anything |
| `repo` | the repository and its remote | any repository |
| `apps` | the apps domain's nodes | repositories claiming the apps world |
| `infra` | the estate | authoring in `INFRA` repositories; realization wherever a declaration resolves, by tree or by pin |

**Cloud mutation only where the declaration is authored, plus CI.** A code repository never checks the estate out — the declaration arrives pinned, and an app's local values come from its own tree.

## Local is the default; cloud is asked for by name

- `--cloud` is never implicit — the target that provisions real accounts must be named; a cloud apply adds `--approve`.
- Locally an organization's accounts and a platform's guardrails have **no counterpart — absent, not stubbed**. What local realizes fully is everything stateful: same engines, same versions, same schemas, roles and key list.
- Nothing downstream of a declaration learns which target produced it.

## The refusals — every one is a gate, not a bug

| Refusal | Why it holds |
| --- | --- |
| `environment` verbs without `--cloud` | the machine is one environment; no local form exists |
| `up` or `down` naming neither `--plan` nor `--apply` — or both | a provisioning run states its mode; a shape that can express a contradiction leaves somebody to refuse it |
| a cloud apply that cannot reach the account | the check reads the provider the estate **declared** and expects that provider's session variables; nothing in the driver names a vendor |
| a cloud verb with a missing layer below → **named refusal** | in the cloud each layer has its own principals; locally prerequisites converge in place instead |
| an apply that ran from a checkout | an apply fetches the published version and applies *that* — a path ref resolves only where the sibling checkout exists, and deliberately not in CI |
| a whole-estate verb | "all layers" of an unstated subject is a context nothing can resolve |
| `down` on stateful resources | teardown removes network and compute and **refuses its data** — destroying data is a separate act, named and confirmed separately; `--clean` runs only on an explicit instruction against a named target |
| an unknown `${…}` reference at `config diff` or `config render` | one direction, one pass, resolved against the composed rungs — a literal `${…}` reaching a vendor is the failure this stops; credentials themselves never live in files, see `refs/laws.md` |
| a release version already present in the registry pair | a published version is immutable — bump instead, never re-publish; the machine store keeps the same rule |
| an unlisted scope on release | `scopes` routes everything; refused by name |
| a silent default | everything contextual derives — stack from the repo's claim, estate from pins or tree, registry from the organization, project from the cwd; a flag may override, absence of both refuses by name |
| `CLUSTER` hosting under the `PROD` workload | the platform's engine families are managed in production; a module's own workload is pods everywhere |
