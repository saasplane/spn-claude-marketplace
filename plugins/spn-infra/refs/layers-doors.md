# Layers and doors — the estate verb card

**Source of truth:** the foundation's `CONCEPT.md` (DevEx Utils · Estate Blueprints). This card digests; the book governs. The realization is `spnutils infra …`.

## Layer nouns × verbs

The layers are nouns; each takes `plan · up · down · status`. They come up in order, and a lower layer missing is the usual reason a higher one will not start.

| Noun | Verbs | Locally | In the cloud |
| --- | --- | --- | --- |
| `organization` | plan · up · down · status | the machine's trust bootstrap — the CA, its one trust prompt, the shared ingress; `--reset-certs` after CA loss | accounts, root guardrails, registry pairs, zones |
| `platform` | plan · up · down · status | the platform's container group — engines + each module's local rendering; converges org prerequisites in place | containers, workload accounts, policies, zone, instruments |
| `environment` | plan · up · down · status — `--env`, **`--cloud` only** | **no local form exists** — the machine is one environment; targeting it locally is refused by name | network → resources → compute, in order |
| `app` | up · down | schemas, roles, cert, hosts entry, ingress vhost — app from the cwd, `-p` overrides | — (deploys ride the pipeline) |

Beside the layers: `logs [service]` · `show` (resolution per layer, incl. **PINNED @ version or a path**) · the `config` verbs (`set · get · list · export · import · diff · render` — the app plane only, never the ledger) · `scaffold repo|organization|platform|module` · `validate` · `test` · `release`.

## Doors — who may run what, where

| Door | Means |
| --- | --- |
| `∗` | any repo — the `repo` verbs |
| `A` | APPS repos — the `apps` verbs, and `infra app up|down` |
| `I` | INFRA repos — estate authoring: scaffold, validate, test, release |
| `E` | wherever a declaration resolves (tree or pin) — the realization verbs |

**Cloud mutation only where the declaration is authored, plus CI.** A code repository never checks the estate out — the declaration arrives pinned, and an app's local values come from its own tree.

## Local is the default; cloud is asked for by name

- `--cloud` is never implicit — the target that provisions real accounts must be named; mutation adds `--approve`.
- Locally an organization's accounts and a platform's guardrails have **no counterpart — absent, not stubbed**; what local realizes fully is everything stateful: same engines, same versions, same schemas, roles and key list.
- Nothing downstream of a declaration learns which target produced it.

## The refusals — every one is a gate, not a bug

| Refusal | Why it holds |
| --- | --- |
| `environment` verbs without `--cloud` | the machine is one environment; no local form exists |
| a cloud verb with a missing layer below → **named refusal** | in the cloud each layer has its own principals; locally prerequisites converge in place instead |
| a cloud verb on a **path-resolved** declaration | an apply must run a published, named version — flip the ref to a pin |
| a whole-estate verb | "all layers" of an unstated subject is a context nothing can resolve |
| `down` on stateful resources | teardown removes network and compute and **refuses its data** — destroying data is a separate act, named and confirmed separately; `--clean` runs only on an explicit instruction against a named target |
| `config set` of a credential pinned in a manifest | credentials never live in files — see `refs/laws.md` |
| a release version already present in the registry pair | a published version is immutable — bump instead, never re-publish |
| an unlisted scope on release | `scopes` routes everything; refused by name |
| a silent default | everything contextual derives — stack from the repo's claim, estate from pins or tree, registry from the organization, project from the cwd; a flag may override, absence of both refuses by name |
| `CLUSTER` hosting under the `PROD` workload | the platform's four engines are managed in production; a module's own workload is pods everywhere |
