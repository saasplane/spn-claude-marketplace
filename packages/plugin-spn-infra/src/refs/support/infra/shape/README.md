<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/01-shape.md",
      "seen": "732aac4e"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "seen": "375d374b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/03-blueprints/01-layers.md",
      "seen": "410fa6af"
    }
  ]
}
-->

# Estate Shape — the words, the edge, the layers and the doors

**Source of truth:** the foundation's `02-constructs/02-support/02-infra/01-shape.md` for what the estate is, and `04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md` with `04-capabilities/02-support/02-infra/03-blueprints/01-layers.md` for the commands that act on it. Read this as the restatement; the book governs. The realization is `spnutils infra …`.

## Four groups of facts, and none borrows from another

A declaration asks four different questions, and each has its own group of facts. **No group ever borrows a value from another** — a posture is never a resource, and a namespace is never a provider. That separation is what lets a check reject a wrong value in one field without reading the rest of the file.

| Group | Answers | Where the detail is |
| --- | --- | --- |
| **Vocabulary** | which values may I write here | the fixed lists below, and each enum in the manifest |
| **The edge** | which of these is mine to bring, and which appears on its own | *What a company brings* below |
| **Coordinates** | where does this sit, and what is it called | [`naming.md`](naming.md) — the codes and the grammar that joins them |
| **Providers** | who actually runs it | [`packages.md`](../packages.md) and the cloud entries in the manifest |

**Each is stable only because of the other three.** The fixed lists are closed because SaaS Plane publishes the code that creates each value — that is the edge. The names compose because the values are short and fixed — that is the vocabulary meeting the coordinates. And the coordinates stay portable because no provider's own spelling is allowed to become one — the edge again, keeping a provider's words out of the model.

## Most fields take one value from a fixed list

**A field that looks like free text usually is not.** A value outside its list is refused before anything runs.

**A fixed list is checked before anything is created**, so a misspelling costs a second rather than half an estate. It is also a promise: SaaS Plane publishes code for each value, so writing one is asking for something that already exists. **Adding a value is a register decision, never a setting somebody switches on.**

**Never count the values in a list.** A list is read by the rule that defines it, not by how many values it holds today (`RD.DEVEX.WORKSPACE.162`), and each list is stated once with every other mention pointing at that statement (`RD.DEVEX.WORKSPACE.165`). A sentence that says *the four postures* stops being true the day a fifth is ruled in.

### What a package is, and which rung a fact sits on

Two lists sit at the top of every declaration, because a declaration has to say two things about itself.

`SPEstateType` says **what kind of package you are holding**, so a tool can pick the right rules before reading a field: `SUPPORT` is the shared baseline every estate reads, `ORGANIZATION` is one company with its providers, regions and billing, `PLATFORM` is one product and the environments it runs, and `MODULE` is an attachable thing. **A `MODULE` carries identity alone and no usage**, because the same module is used differently by every platform that attaches it — putting the usage inside would give one fact as many sources as it has users.

`SPEstateScopeType` says **which rung a fact sits on** — `ORGANIZATION`, `PLATFORM`, `ENVIRONMENT`. Every fact in an estate belongs to exactly one, the coordinates are built from them, and the configuration plane spells its paths the same way, so a path says which rung it belongs to and nothing else.

## What a company brings, and what is created for it

**An estate is built from the outside in.** At the outside is the company, which has already bought and signed for things no software can create for it: **somewhere to keep code, somewhere to run it, and a domain**. Just inside sits the declaration — a few short codes, written once, saying what the company is called, what its products are called, and what its running targets are called. From those codes, published code creates the estate, and the applications deploy on top.

**Nothing points backwards.** What the company brings becomes a provider binding and a set of codes; the fixed lists supply the values those codes may hold; the estate is created from them; the applications run on it. A rule that would need the estate to decide what the company brings is a rule in the wrong place.

## Layer nouns × commands

The layers are nouns; each takes `up · down · status`, and `--plan` on `up` or `down` is the plan. Start them in order, and a lower layer missing is the usual reason a higher one will not start. **A platform-scoped command names its platform first, as an argument** (`RD.DEVEX.UTILS.072`): `infra platform <verb> <spc>`, `infra environment <verb> <spc> <env>`, and the same for `config`, `show`, `logs`, `web` and `domain register`. No environment entry selects a platform. The organization layer takes none, because a repository has at most one organization.

| Noun | Commands | Locally | In the cloud |
| --- | --- | --- | --- |
| `organization` | up · down · status | the machine's trust bootstrap — the CA, its one trust prompt, the local resolver, the shared ingress, and the root door that `up` installs once so the resolver's files ask for nothing (RD.DEVEX.UTILS.073); `down --clean` keeps the CA and its trust, so the next `up` asks for nothing, and `up --reset-certs` replaces the CA on purpose | accounts, root guardrails, registry pairs, zones |
| `platform` | up · down · status — `<spc>` | the platform's container group — engines + each module's local rendering + every stored route registered with the ingress; converges org prerequisites in place | containers, workload accounts, policies, zone, instruments, the tenant edge and its route store |
| `environment` | up · down · status — `<spc> <env>`, **`--cloud` only** | **no local form exists** — the machine is one environment; targeting it locally is refused by name | network → resources → compute, in order |
| `app` | up · down | the app's derived converge — schemas, certificates and the ingress vhost; app from the cwd, `-p` overrides | — (deploys ride the pipeline) |

**Every provisioning run names its mode, and there is no default** (RD.SUPPORT.INFRA.094). `up` and `down` each take exactly one of `--plan` or `--apply`. A command that plans when you forget a flag is a command doing another command's job, and a default would decide the direction of the mistake for you.

Beside the layers: `logs <spc> [service]` · `show <spc>` (resolution per layer, incl. **PINNED @ version or a path**) · `trust-ca` (trust the machine's own CA — what the local `organization up` does as part of its bootstrap) · `domain register <spc> <host>|unregister` (register a host with the local proxy, `--app <kind code>`, needing no privilege and writing no `/etc/hosts` — what the local edge provider calls for every route, and what a test calls for its own `lc-test` domain) · the `config` commands (`set · get · list · export · import · diff · render` — the app plane only, never the ledger) · `web deploy|rollback <spc> <env> <app>` (a built bundle into the platform's own storage engine, and a landed release back onto the route — no separate store) · `scaffold repo|organization|platform|module` · `validate` · `test` · `release`.

## Doors — who may run what, where

The commands divide by **what is being changed**, never by who runs them. Each group has a door, and the repository's own `sprepo.json` is the door.

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
| `environment` commands without `--cloud` | the machine is one environment; no local form exists |
| `up` or `down` naming neither `--plan` nor `--apply` — or both | a provisioning run states its mode; a shape that can express a contradiction leaves somebody to refuse it |
| a cloud apply that cannot reach the account | the check reads the provider the estate **declared** and expects that provider's session variables; nothing in the driver names a vendor |
| a cloud command with a missing layer below → **named refusal** | in the cloud each layer has its own principals; locally prerequisites converge in place instead |
| an apply that ran from a checkout | an apply fetches the published version and applies *that* — a path ref resolves only where the sibling checkout exists, and deliberately not in CI |
| a whole-estate command | "all layers" of an unstated subject is a context nothing can resolve |
| an `<spc>` in an apps repository that differs from its `sprepo.json` pin | the platform is named on every platform-scoped command, and the repository already says which one it belongs to (`RD.DEVEX.UTILS.072`) |
| `down` on stateful resources | teardown removes network and compute and **refuses its data** — destroying data is a separate act, named and confirmed separately; `--clean` runs only on an explicit instruction against a named target |
| an unknown `${…}` reference at `config diff` or `config render` | one direction, one pass, resolved against the composed rungs — a literal `${…}` reaching a vendor is the failure this stops; credentials themselves never live in files, see `refs/laws.md` |
| a release version already present in the registry pair | a published version is immutable — bump instead, never re-publish; the machine store keeps the same rule |
| an unlisted scope on release | `scopes` routes everything; refused by name |
| a silent default | everything contextual derives — stack from the repo's claim, estate from pins or tree, registry from the organization, project from the cwd; a flag may override, absence of both refuses by name |
| `CLUSTER` hosting under the `PROD` workload | the platform's engine families are managed in production; a module's own workload is pods everywhere |
