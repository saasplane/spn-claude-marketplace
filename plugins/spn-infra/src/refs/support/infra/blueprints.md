<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/02-infra/03-blueprints.md", "seen": "5d58de6b" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/03-blueprints/", "seen": "7066458b" }
  ]
}
-->

# Estate blueprints — the five layers, the tree, and what proves a change

**Source of truth:** the foundation book's `docs/02-constructs/02-support/02-infra/03-blueprints.md` and `docs/04-capabilities/02-support/02-infra/03-blueprints/`. Read this card as the restatement; the book governs.

This card is provider-agnostic. The estate ships as one plugin, and a cloud is a folder inside it — a specific cloud's own account rendering, region codes and console mechanics live in that cloud's own provider ref, never here. Everything below is true of every cloud a company might bind, and of the local realization.

## What a blueprint is

A blueprint is published code, written by SaaS Plane and never by the company running it — the same relationship a support package has to an application (decision `RD.INFRA.013`). **You never write the code that stands an estate up — you give it a declaration, and it runs in a fixed order.** The execution engine is SaaS Plane's own choice, made once. The resource vocabulary is closed, because nothing can provision a type with no blueprint behind it. And a company parameterizes rather than writes, which is what makes an estate reproducible by someone who has never seen it.

> A layer is an input shape, an output shape, and the components it creates.

**A layer reads only the published outputs of the layer beneath it — MUST.** Nothing reaches sideways to a neighbour, and nothing reaches down past its neighbour to the layer below that. That is what lets one layer be re-run on its own: everything it needs already exists as a written-down fact rather than something it has to go and discover.

The command surface **resolves and drives**; the blueprint library **creates**. It reads the manifests, derives the coordinates, resolves the parameters, invokes the layer's library, and writes the library's outputs back as resolved state. **The command surface holds no provider knowledge, exactly as it holds no stack knowledge — MUST.** That is what lets one surface serve every provider a company might bind, and it is why a new provider is a library rather than a tool release.

## The five layers

| # | Layer noun | Level | Stands up |
| --- | --- | --- | --- |
| 0 | `GROUND` | company | nothing — it checks what was brought and discovers its coordinates |
| 1 | `ORGANIZATION` | company | provider accounts, root guardrails, billing boundaries, and the output store as its first act |
| 2 | `PLATFORM` | product | the product's containers, its two workload accounts, its control accounts and the trust graph between them, its policies, its zone — and what SaaS Plane installs into them: scanners, the runner fleet, and one observability stack per workload |
| 3 | `ENVIRONMENT` | environment | in order — the network, then the resources that sit in it, then the compute beside them |
| 4 | `DEPLOYMENTS` | environment | what actually runs |

**These five are the model's layer nouns — `GROUND`, never `BOOTSTRAP`.** `GROUND` has no principals of its own and rides the `organization` command noun; `DEPLOYMENTS` rides the `environment` command noun the same way, so the command surface speaks three nouns for five layers.

**Ordering inside a layer is not a boundary.** `PLATFORM` builds its containers before its accounts before its policies; `ENVIRONMENT` builds its network before the resources that sit in it before the compute beside them. A sequence earns a boundary only where the two sides differ in blast radius or in cadence (`RD.INFRA.024`). Everything inside one environment goes up together and comes down together.

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

**Two workload accounts, however many regions a product runs in.** One environment lives in exactly one region; a workload holds as many regions as the product declares (`RD.INFRA.017`). An environment owns only its own slices, so it tears down without touching a sibling — by construction, not by care. The shared substrate falls only with a region's last environment.

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

A provider entry always names a real provider. **The local realization binds none of them and stands the same declared resources up as containers — realization is a target a command is pointed at, never a value stored in a manifest** (`RD.INFRA.018`). **Local is the default and cloud is never implicit — the target that creates real accounts is the one somebody has to ask for by name.**

| Layer | On a laptop | In the cloud |
| --- | --- | --- |
| `ORGANIZATION` | the machine's trust bootstrap: the CA, its one trust prompt, the shared ingress | accounts, guardrails, the registry, the audit trail |
| `PLATFORM` | the product's container group | containers, workload accounts, policies, zones, runners, observability |
| `ENVIRONMENT` | no local form at all — the machine is one environment, and targeting it is refused by name | network, resources, compute |
| `DEPLOYMENTS` | the applications, run directly | the applications, on the cluster |

**What a layer cannot have locally is absent, never stubbed.** A local estate does not pretend to have accounts, guardrails or a trust graph, and nothing downstream of a declaration ever learns which target produced it. On a laptop one principal owns every layer, so a platform command converges its own prerequisites; in the cloud each layer has its own principals, so a missing layer beneath is refused by name — a platform apply that silently performed a company apply would cross the boundary the governance tree exists to draw.

**There is no orchestrator on a laptop, and that is a decision, not a shortfall.** A deployment is derived, so there is no manifest for a local cluster to check. What local realizes fully is everything that holds state: the same engines at the same versions, the same schemas and roles, the same configuration keys. A local application may attach to a shared environment's resources, and only to one in the non-production workload — a developer's machine sits inside neither the conditioned-data account nor the real-customer-data account.

## An environment is derived — three things may vary

**Only what an environment's own row declares may vary: its workload, its size, and its hosting** (`RD.INFRA.064`). If a difference between two environments cannot be written as one of those three, it is a defect in the design rather than a case for a special environment.

| Decides | Source |
| --- | --- |
| which components exist at all | the blueprint |
| what is always true of them | the invariants — every environment, no exception |
| what posture each gets | the workload |
| how much capacity | the size, read within the workload |
| where its engines run | the hosting — non-production only |

**Invariants reach every environment, with no exception anywhere — MUST.** Encryption at rest, transport security, no publicly readable data stores, no long-lived credentials, mandatory tagging, audit trails, the application firewall — all of them, from the first apply. There is no *harden it before production* phase, and no template that varies any of it (`RD.INFRA.014`): anything a template would vary is either a workload concern or a security control that must not be optional anywhere. A control exercised only in production is a control nobody has tested.

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

**A declaration is proven by rendering it against a target, never by calling a function and reading what comes back** (`RD.INFRA.097`). `SPEstateTierType` names no contract state — the tiers are named by the standard and by each harness (`RD.INFRA.102`).

| Tier | Stands on | Proves | Cannot prove |
| --- | --- | --- | --- |
| `FORM` | the files alone | the declaration parses and its files are shaped the way the layer system expects | anything about whether it describes something real |
| `CONTRACT` | the source tree | every layer declares its input and output shape, and the repository's own stated rules hold | that anything resolves |
| `RENDER` | a fixture declaration and the provider's own planner | a declaration resolves — coordinates derived, parameters resolved, outputs shaped | that a provider would accept the plan |
| `ACCEPTANCE` | a render, and a consumer's committed expectations | the render is what its consumer expected | that anything was stood up |
| `STANDUP` | a real target — local by default, cloud by name | the layer provisions, and its published outputs are real | anything about a target it did not run against |

**Form is a static gate, never proof** — the same way a type check is not a test; it is the one thing every broken estate change also was. **A render is the tier you can afford on every write** — it holds no resources and touches nothing, which is what keeps a stand-up rare. **A stand-up speaks for its target and for no other — never claim a layer works on the strength of a tier that never touched the target in question.** Where nothing has ever been applied against a target, say plainly that the tiers below it pass and this one has not run.

Nothing here asks for a test framework — it asks for a run that names the tier it ran and reports what it found, which a shell script satisfies. A pipeline publishes the run's artifact and stops there; it never edits a document to say a run succeeded (`RD.INFRA.094` — every provisioning run names its own mode, and a rehearsal needs no credential).

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

Try it: `spnutils infra platform plan` — a plan reaches no account, so it runs before any cloud credential exists.
