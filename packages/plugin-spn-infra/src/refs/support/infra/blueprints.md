<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/03-blueprints.md",
      "seen": "ede1c5df"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/03-blueprints/",
      "seen": "1a2ca85d"
    }
  ]
}
-->

# Estate blueprints — the five layers, the tree, and what proves a change

**Source of truth:** the foundation book's `docs/02-constructs/02-support/02-infra/03-blueprints.md` and `docs/04-capabilities/02-support/02-infra/03-blueprints/`. Read this card as the restatement; the book governs.

This card is provider-agnostic. The estate ships as one plugin, and a cloud is a folder inside it — a specific cloud's own account rendering, region codes and console mechanics live in that cloud's own provider ref, never here. Everything below is true of every cloud a company might bind, and of the local realization.

## What a blueprint is

A blueprint is published code, written by SaaS Plane and never by the company running it — the same relationship a support package has to an application (decision `RD.SUPPORT.INFRA.013`). **You never write the code that stands an estate up — you give it a declaration, and it runs in a fixed order.** The execution engine is SaaS Plane's own choice, made once. The resource vocabulary is closed, because nothing can provision a type with no blueprint behind it. And a company parameterizes rather than writes, which is what makes an estate reproducible by someone who has never seen it.

> A layer is an input shape, an output shape, and the components it creates.

**A layer reads only the published outputs of the layer beneath it — MUST.** Nothing reaches sideways to a neighbour, and nothing reaches down past its neighbour to the layer below that. That is what lets one layer be re-run on its own: everything it needs already exists as a written-down fact rather than something it has to go and discover.

The command surface **resolves and drives**; the blueprint library **creates**. It reads the manifests, derives the coordinates, resolves the parameters, invokes the layer's library, and writes the library's outputs back as resolved state. **The command surface holds no provider knowledge, exactly as it holds no stack knowledge — MUST.** That is what lets one surface serve every provider a company might bind, and it is why a new provider is a library rather than a tool release.

## The five layers

| # | Layer noun | Level | Stands up |
| --- | --- | --- | --- |
| 0 | `GROUND` | company | nothing — it checks what was brought and discovers its coordinates |
| 1 | `ORGANIZATION` | company | provider accounts, root guardrails, billing boundaries, and the output store as its first act |
| 2 | `PLATFORM` | product | the product's containers, its two workload accounts, its control accounts and the trust graph between them, its policies, its zone — and what SaaS Plane installs into them: scanners, the runner fleet, and one observability stack per workload |
| 3 | `ENVIRONMENT` | environment | in order — the network, then the resources that sit in it, then the compute beside them, then under `CLUSTER` the engines on that compute, and last each world's users and published facts |
| 4 | `DEPLOYMENTS` | environment | what actually runs |

**These five are the model's layer nouns — `GROUND`, never `BOOTSTRAP`.** `GROUND` has no principals of its own and rides the `organization` command noun; `DEPLOYMENTS` rides the `environment` command noun the same way, so the command surface speaks three nouns for five layers.

**Ordering inside a layer is not a boundary.** `PLATFORM` builds its containers before its accounts before its policies; `ENVIRONMENT` builds its network before the resources that sit in it before the compute beside them before the engines on it. A sequence earns a boundary only where the two sides differ in blast radius or in cadence (`RD.SUPPORT.INFRA.024`). Everything inside one environment goes up together and comes down together.

**Under `CLUSTER`, the engines step is its own — never folded into resources or compute.** It cannot ride the resources step, which runs before any cluster exists; it cannot ride the compute step, because an engine holds data and an environment operation may remove compute while it refuses data — putting an engine there would put data where the removable part is; and it cannot ride the world rendering, because a world mints its users inside a running engine and publishes the engine's address, so the engine must already stand. The step reads the same declaration the resources step reads, and under `MANAGED` it stands nothing, because the provider's own services are the resources step's.

A blueprint library is arranged the way the driver reads it: the seam first, then the provider, then the layer, then the step inside that layer. A second cloud arrives as a sibling folder rather than a change to every path.

## The governance tree

The tree is logical and free of any provider's words — stated once in the name grammar, rendered by each provider in that provider's own containers. A branch attaches policy; a leaf is named for the world it belongs to and the job it does, so a flat account list reads correctly even without the tree beside it.

```text
{org}-root                        the company root — a container, never an account
├── {org}-mgmt                    pays, governs, and runs no workloads at all
├── {org}-internal                the company's own teams' world — never customer-facing
│   ├── {org}-internal-cc         company instruments: the package registry, base images
│   ├── {org}-internal-log        the log archive — append-only, no operator may delete
│   ├── {org}-internal-audit      the read seat: aggregators, findings, the auditor's account
│   └── {org}-internal-{purpose}  one per team need, on first need — sealed, budget-capped
└── {org}-{spc}                   one world per product
    ├── {org}-{spc}-cc            the actor, the runners, the registry, the zones, the certificates
    ├── {org}-{spc}-gov           evidence — it deploys nothing
    ├── {org}-{spc}-np            one network and cluster per region; environments share them
    ├── {org}-{spc}-prod          one network and cluster per environment; pinned to its region
    └── {org}-{spc}-stg           outside data, conditioned; no environments live here
```

**Some provider services are singular for a whole company** — one audit trail, one findings aggregator, one delegated security administrator. Those get two seats of their own: evidence lives in the log account (append-only, written by service principals, deletable by no operator), and the designation lives in the audit account (reads the archive, runs nothing — the auditor's one seat). **Whoever is audited never keeps its own evidence** — a product's governance account keeps that product's evidence and nothing wider.

**Org-wide is for streams; running things are per-platform.** An immutable, versioned artifact stream — the package registry, base images — is installed once at organization scope and every platform consumes it by pin: one pipeline, one patch cadence, adoption at each platform's own pace. An instrument that runs **with state** — runners, scanners, observability — is the platform's own; sharing one couples two platforms' postures. A platform asking for its own copy of a stream is asking for a fork.

**A third account holds no environments at all.** Outside data lands in the staging account and is conditioned there before any of it reaches a workload. Workloads **pull** what they are entitled to; the staging account never pushes into them, holds no interactive access, and assumes no role into either workload.

**Two workload accounts, however many regions a product runs in.** One environment lives in exactly one region; a workload holds as many regions as the product declares (`RD.SUPPORT.INFRA.017`). An environment owns only its own slices, so it tears down without touching a sibling — by construction, not by care. The shared substrate falls only with a region's last environment.

## The trust graph

Which account may act on which is a product-level fact, never an environment's business.

```text
control     ──▶  everything     deploys and provisions
prod        ──▶  control        evidence, logs, metrics
np          ──▶  control        the same, and separately
np          ──✗  prod           denied in both directions, always
governance  ◀──  everything     receives only, and can deploy nothing
```

**The account that performs changes never keeps the record of them — MUST NOT.** Collapsing the acting account and the observing account would leave the audit trail in the hands of the thing being audited.

## Isolation and teardown

**Isolation is topology, never policy.** The layer that builds a network builds it so the data plane has no route out. That is not a firewall rule somebody could widen later — it is a fact about routing. Everything a policy can express, a policy can also be edited to allow; a missing route cannot.

**An environment operation never destroys data — MUST NOT.** Taking an environment down removes its network and its compute and **refuses its data**. Destroying data is a separate act, named separately and confirmed separately — however the teardown was reached, including one that names no layer at all.

## Realization is a target, never a value

A provider entry always names a real provider. **The local realization binds none of them and stands the same declared resources up as containers — realization is a target a command is pointed at, never a value stored in a manifest** (`RD.SUPPORT.INFRA.018`). **Local is the default and cloud is never implicit — the target that creates real accounts is the one somebody has to ask for by name.**

| Layer | On a laptop | In the cloud |
| --- | --- | --- |
| `ORGANIZATION` | the machine's trust bootstrap: the CA, its one trust prompt, the local resolver, the shared ingress | accounts, guardrails, the registry, the audit trail |
| `PLATFORM` | the product's container group | containers, workload accounts, policies, zones, runners, observability |
| `ENVIRONMENT` | no local form at all — the machine is one environment, and targeting it is refused by name | network, resources, compute |
| `DEPLOYMENTS` | the applications, run directly | the applications, on the cluster |

**What a layer cannot have locally is absent, never stubbed.** A local estate does not pretend to have accounts, guardrails or a trust graph, and nothing downstream of a declaration ever learns which target produced it. On a laptop one principal owns every layer, so a platform command converges its own prerequisites; in the cloud each layer has its own principals, so a missing layer beneath is refused by name — a platform apply that silently performed a company apply would cross the boundary the governance tree exists to draw.

**There is no orchestrator on a laptop, and that is a decision, not a shortfall.** A deployment is derived, so there is no manifest for a local cluster to check. What local realizes fully is everything that holds state: the same engines at the same versions, the same schemas and roles, the same configuration keys. A local application may attach to a shared environment's resources, and only to one in the non-production workload — a developer's machine sits inside neither the conditioned-data account nor the real-customer-data account.

## An environment is derived — three things may vary

**Only what an environment's own row declares may vary: its workload, its size, and its hosting** (`RD.SUPPORT.INFRA.064`). If a difference between two environments cannot be written as one of those three, it is a defect in the design rather than a case for a special environment.

| Decides | Source |
| --- | --- |
| which components exist at all | the blueprint |
| what is always true of them | the invariants — every environment, no exception |
| what posture each gets | the workload |
| how much capacity | the size, read within the workload |
| where its engines run | the hosting — non-production only |

**Invariants reach every environment, with no exception anywhere — MUST.** Encryption at rest, transport security, no publicly readable data stores, no long-lived credentials, mandatory tagging, audit trails, the application firewall — all of them, from the first apply. There is no *harden it before production* phase, and no template that varies any of it (`RD.SUPPORT.INFRA.014`): anything a template would vary is either a workload concern or a security control that must not be optional anywhere. A control exercised only in production is a control nobody has tested.

**Workload is posture and isolation, not a label.** A product has exactly two workloads, and each is its own account, its own governance, its own place in the trust graph, and its own reliability posture.

| | `NP` | `PROD` |
| --- | --- | --- |
| Data | synthetic | real |
| Availability | a single zone is acceptable | several zones, replicated |
| Backup | short retention | full retention, point-in-time recovery |
| Approval | on merge | an approved release |
| Substrate | shared — one cluster and network per region | separate — its own cluster, network and ingress |

An environment names the workload it belongs to; nothing else about it — not its name, not its size, not who created it — selects posture.

**Size is a profile read inside a workload, never an absolute scale.** A small production database has several zones, is replicated, and can be recovered to a point in time — small, not degraded. A small non-production database is a single instance. Look a profile up as the pair `(workload, size)`; every pair has a rendering.

```text
XS · SM · MD · LG · XL
```

Five rungs rather than three, because a three-rung ladder collapses production-at-launch and production-at-scale into one letter, which is exactly the moment a product needs room to grow. **A size is a profile name, not a number** — what a letter resolves to is a provider rendering, and retuning it changes no declaration anywhere.

**Hosting is where an engine runs, and it is a separate question from size.** A managed service charges for existing rather than for being used, so a non-production environment may declare `CLUSTER` instead and run the same engines as workloads in its own namespace. Size is untouched by the choice: it still resolves to instance classes under `MANAGED`, and to requests, limits and volume sizes under `CLUSTER`.

**`CLUSTER` is refused under `PROD`, and it is never overridden — MUST NOT.** A production environment quietly downgraded to containers is a worse outcome than one that fails to stand up at all. Every environment states its hosting either way — a posture inherited from an absent key is one nobody reviewed.

## What proves an estate change

**A declaration is proven by rendering it against a target, never by calling a function and reading what comes back** (`RD.SUPPORT.INFRA.097`). **The tiers are the apps ladder's own** — `SPTestTierType`, never a second enum that would drift from it (`RD.SUPPORT.INFRA.102`) — and an estate node reuses a tier's name wherever its meaning is the same (`RD.SUPPORT.INFRA.107`).

| Tier | Stands on | Proves | Cannot prove |
| --- | --- | --- | --- |
| `UNIT` | a derivation, rendered once and run with nothing standing | a derivation the blueprints compute alone — a router function, a naming helper — gives the right answer for each input | that the engine renders it |
| `CONTRACT` | the source tree | the node's declared interface holds: a layer's input and output shape, a declaration's shape and the names it publishes, and the repository's own stated rules | that anything resolves |
| `INTEGRATION` | a fixture declaration or the node's own, the provider's own planner under mock providers, and a consumer's committed expectations | a module validates against the providers it pins, and a plan-only render is what its consumer expected | that a provider would accept the plan, or that anything was stood up |

**A node owes the tiers its kind fixes, and no node chooses its own.** The blueprints (`SUPPORT`) owe all three — they derive, declare an interface and render. An `ORGANIZATION`, a `PLATFORM` and a `MODULE` owe `CONTRACT` and `INTEGRATION`: the ground and organization layers render an organization's declaration from a seat of its own; the platform layer renders a platform's declaration once, and the environment and deployments layers again per declared environment; the estate stands a seat for a module's world. A declaration's integration runs under `tofu test`, planning the pinned blueprints with mock providers, and each run's name carries the behaviour id it proves.

**Two rungs sit outside the ladder, on purpose.** The build — the declaration parses, the tree matches its type, the manifest matches its contract — is a static gate, never proof, the same way a type check is not a test; `spnutils infra test <run>` runs it first and it prints no case. A stand-up provisions against a real target and speaks for that target and for no other — never claim a layer works on the strength of a run that never touched the target in question. Where nothing has ever been applied against a target, say plainly that the tiers pass and the stand-up has not run.

**Every estate package keeps its tests in the same tree**: one folder per owed tier under `tests/` — the folder naming the tier, the file's kind naming the engine — so a case sitting in the wrong folder is refused rather than counted. A harness reports cases, never only an exit code: `ok`, `not ok` or `skip`, the tier, the behaviour id, a title, through `helpers/case.sh`; `spnutils infra test <run>` turns the lines into run files, one per tier at `tests/.output/<tier>/runs/<run>.json`, in the shape apps write; the agent stamps the rows from the run it names, and `spnutils infra release` names its own test run `release-<version>`, such as `release-0.4.1`, and refuses a node whose owed tier has no case or a failing one. A pipeline publishes the run file and stops there; it never edits a document to say a run succeeded (`RD.SUPPORT.INFRA.094` — every provisioning run names its own mode, and a rehearsal needs no credential).

## What it makes checkable

| Defect | What it means |
| --- | --- |
| a layer reading another layer's interior | the output contract was bypassed and the order is now implicit |
| provider knowledge in the command surface | a new provider became a tool release |
| a stubbed layer in a local realization | fidelity was claimed rather than declared |
| a machine setup outside the layer system | the organization layer's local rendering was bypassed, and trust will drift |
| a route out of the data plane | isolation became a policy someone can widen |
| an acting account holding the audit record | the trail is curated by what it audits |
| an invariant disabled in one environment | a control exists that nobody has tested |
| a difference expressible as neither workload nor size | a special environment was invented |
| a size letter compared across workloads | an absolute scale was assumed where none exists |
| a component present in one environment and absent in its sibling | parity was broken by omission rather than by declaration |

Try it: `spnutils infra platform up dmo --plan` — a plan reaches no account, so it runs before any cloud credential exists.
