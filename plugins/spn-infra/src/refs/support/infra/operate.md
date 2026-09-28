<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/02-infra/08-operate.md", "seen": "6a07cb06" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/08-operate/", "seen": "8a1e26e2" }
  ]
}
-->

# Operate — what a running estate owes

A running estate owes what a deployment must derive rather than have authored, what it must expose to be observable, what it must refuse, and what recovery looks like when the declaration and the running estate disagree. Nobody writes a deployment by hand, one artifact is built once and promoted forward, and a difference between what is declared and what is running is reported rather than corrected quietly in either direction.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Trigger | `SPEstateDeploy` | what starts a deployment into one environment: a branch, an approved tag, or a person |
| Promotion | `SPEstateDeployTagApproval.promotesFrom` | moving an already-proven artifact to the next environment, skipping no rung |
| Health listener | — | the separate port a long-running process answers probes on, never the serving port |
| Hostname seam | — | the one door that makes a hostname serve: it issues the certificate and binds it at the edge |
| Web releases store | — | an environment's own store of immutable web releases, with one mutable configuration document |
| Declared state | — | what the manifests say should exist |
| Actual state | — | what the provider holds right now |
| Drift | — | a difference between declared and actual, reported rather than corrected without a decision |
| Reconciliation loop | — | a controller that reads desired state continuously; it changes who acts, never what is deployed |

## Nothing about a deployment is authored

Every field a deployment needs already lives somewhere a person reviewed. If you are about to write one of these by hand, stop — it is derived.

| Where it comes from | What it contributes |
| --- | --- |
| the code node's kind | the claim: which code this folder is |
| the platform's application row | the grant: its deployments, each typed `API` · `WEB` · `PROCESSOR` |
| the deployment's own row (`ns`, `expose`) | its namespace and its exposure — both **declared**, not derived |
| the environment | the workload's posture, and the capacity its size resolves to |

**A deployment type is the estate's word, mapped to a stack's run modes by that stack's adapter — one artifact, every way in.** An `API` serves behind an edge. A `PROCESSOR` consumes with no inbound surface at all. A `WEB` row ships a bundle with no process. Promotion moves them together, because they are one digest — an API and its processor can never version-skew against each other.

**There is no values file per environment.** A file per environment is a place for two environments to drift apart, so nothing of that shape exists to drift.

## Namespace is a blast radius; exposure is declared with the namespace as its ceiling

A namespace is never an organizational boundary — teams do not get namespaces, service namespaces do.

| `ns` | Holds |
| --- | --- |
| `PRD` | the adopting team's own business logic |
| `PLT` | the shared modules every product service builds on |
| `VND` | third-party software the estate runs itself |

**Exposure is declared on the deployment's own row, and the namespace is its ceiling — MUST, never derived from `(mtype, ns)`.**

| `SPEstateExposeType` | Answers on |
| --- | --- |
| `PUBLIC` | the internet — the product namespace only |
| `PRIVATE` | the internal zone, reachable by an operator arriving through the platform's own ranges |
| `INTERNAL` | inside the cluster only, with no ingress standing for it at all |

Only `PRD` may declare `PUBLIC` — a `PLT` or `VND` deployment claiming `PUBLIC` **MUST** be refused at resolve, by name, before any plan runs. A `PROCESSOR` has no inbound surface to name, so `INTERNAL` is the only value that describes one; a processor declaring anything else **MUST** likewise be refused. Naming the exposure this way is what makes the old failure unwritable rather than merely checked-against: a service can no longer land on the internet quietly because of where it happened to sit, because `PUBLIC` is a value someone has to type on the one namespace where it is legal.

A service domain is a separate, explicit choice inside whichever exposure the row already declared. A public surface lands on `{env}-{app}.{domain}`; an internal one lands under `internal.{domain}`. A binding is supplied explicitly or not at all — a driver that stops passing one **MUST** be named as awaiting its input, never resolved quietly to no ingress or to the platform domain.

## Health is a contract, never a configuration

A long-running process serves its liveness and readiness surfaces from a **separate health listener**, on its own port, in every long-running run mode. It is never a route on the serving port, and a one-shot run mode serves no probes at all. The blueprint renders the probes from the deployment's posture — nothing about them is declared on the application.

**Liveness is never lag.** A process that is slow is not a process that is dead, and confusing the two restarts exactly what was already struggling. Readiness reports reachability, not throughput: a consumer that is connected and behind its queue is still ready, because a probe derived from how busy something is removes a service for being busy rather than for being broken. A resource that answers a request is reachable even when it refuses one — only a transport failure is not. A permanent misconfiguration (a wrong credential, an absent bucket) **MUST** fail at boot, not at a probe; anything a probe reports forever is a pod withdrawn from service that nothing will ever heal, so a crash stays visible and a quiet unready state does not stay invisible.

## Build once, promote a digest

An artifact is built exactly once, from one commit, and the same digest is what reaches production.

**A rebuild is a new artifact, and a new artifact invalidates every test that ran against the old one — MUST NOT rebuild per environment.** Tags are labels applied to a digest over time; they never change what the artifact is. So *what is running in production* gets a one-word answer, and that word traces to one commit, one build, one test run and one approval — the same chain the trust model states.

## Promotion is declared, not worked out

Because a setup name is a label and nothing derives from it, no central table could map a branch to an environment. **Each environment declares its own trigger.**

| Trigger | What starts the deployment |
| --- | --- |
| a branch | a merge into the named branch |
| an approved tag | an approved release, naming the environment the digest must already be running in |
| a person | somebody starts it |

A branch **MUST** be claimed by at most one environment per platform — otherwise a merge fans out and *what is running where* stops having an answer. A tag carries no such limit, which is how one approved release reaches every production region at once. A tag whose digest is not already running in the environment it promotes from **MUST** be refused: **there is no path to production that skips a rung**, and an urgent fix travels the same rungs, only faster.

## The serving contract is dynamic

Routing is data: a new customer surface is a row, never a release. **A customer's hostname is issued and bound when the request to serve it arrives, through the hostname seam, and never by an apply** (`RD.INFRA.084`). The serving layer's certificate set changes as hosts are bound, not as infrastructure is applied. A customer subdomain rides the declared domain's wildcard certificate; a customer's own domain rides the certificate the seam issued for it.

| Writer | Owns |
| --- | --- |
| provisioning | the infrastructure records and the wildcard certificates |
| the service publisher | one record per exposed deployment |
| the running platform | customer subdomains |

Each writer's scope is disjoint, so nothing races on a name. Provisioning creates the zones, the wildcards and a scoped write role, then stays out of the way. **No infrastructure change per customer, and none per customer-owned domain.** Every declared domain stands its own pair of zones (`RD.INFRA.086`), and the private zone is always the child name, never the apex.

**Observability is not something anybody opts into.** An application is observable because it was deployed — the collectors were installed by a layer, and nothing depends on somebody remembering to wire one in.

## Web delivery is a store and a pointer

A publicly exposed web deployment ships a bundle with no process, so its delivery never moves through the cluster. Every managed environment owns a web releases store of its own:

```text
{app}/releases/{hash}/**     immutable — the whole build, one upload per release
{app}/config.json            the runtime configuration document — the only object that changes
```

| Act | What happens |
| --- | --- |
| **deploy** | copies the release into the environment's own store, verified by hash; writes the configuration document, repoints the distribution, invalidates only what changed |
| **promote** | copies from the environment that proved the release |
| **rollback** | repoints inside the environment's own history, with no other environment involved |

Files that are publicly readable version by riding the release, so a rollback restores exactly the assets that shipped with that build. **Retention is declared, not accumulated** — the store keeps a stated number of releases, so the rollback window is a number somebody wrote down and growth is bounded by it.

The cache contract derives from the tree and is rendered twice, never configured:

```text
/_assets/*   immutable, cached indefinitely   only hashed names can exist there
/*           short lifetime, invalidated      the entry document, public files, the config document
```

**No store spans workloads.** Each environment's edge fronts its own store, in its own account, under its own key — a web release reaches another environment only by promotion, never by a shared origin.

## What exists, what should exist, and where they disagree

Every name derives from coordinates and every layer publishes its outputs, so these three questions have decidable answers rather than opinions.

| State | Is |
| --- | --- |
| declared | what the manifests say should exist |
| resolved | what the estate model computed and discovered, never typed by hand |
| actual | what the provider holds right now |

**Drift is a report, not an investigation, and its resolution runs in exactly one direction: either the declaration is right and the estate is reconciled to it, or the declaration was wrong and changing it is a reviewed act.** A drift silently corrected in the provider console is not resolved — it is hidden. There is no third path where somebody fixes it by hand and moves on.

## The actor may change; the artifact may not

Deployments begin by being **pushed** — one cluster per environment and a handful of environments do not justify installing and upgrading a controller to watch them continuously. That cost is stated honestly: cluster state is only as correct as the last job that succeeded.

At a larger scale, a reconciliation loop reads desired state continuously and notices drift as it happens.

| | Push | Pull |
| --- | --- | --- |
| Who acts | the pipeline job | a controller in the cluster |
| Drift detected | at the next deploy | continuously |
| Cost | none beyond the job | an operator to install, upgrade and watch |

**Moving from one to the other changes the actor, never the artifact** — the same digest, the same derived values, the same scoped identity. Nothing about the manifests, the promotion rules or the trust chain is written against the push model, which is why deferring the move is cheap rather than a debt.

## What you can answer, and what you must report as unknown

Operate an estate from its declarations, never from inference. Answer against **resolved state**, not by reading a provider console and interpreting what you see there. Reconcile documents with what is actually running, and where they disagree, record the conflict rather than editing either side — drift runs in both directions, and the estate is not automatically the correct one.

**What you could not establish, you MUST report as unknown, never fill with a guess presented as fact.** A confident wrong answer about infrastructure is worse than no answer, because it gets acted on.

**Engineering indicators — deployment frequency, lead time, change failure rate, recovery time — are future scope.** A platform whose facts are all derived has the substrate for them, but claiming them today would describe an intention as a capability. Say plainly that they are not available yet rather than approximate one.

## What it makes checkable

| Defect | What it means |
| --- | --- |
| a hand-written deployment | something was configured that should have been derived |
| a per-environment values file | two environments now have somewhere to drift apart |
| a namespace named for a team | a blast-radius boundary was used as an org chart |
| `PUBLIC` exposure outside the `PRD` namespace | the namespace ceiling was bypassed |
| a `PROCESSOR` declaring anything but `INTERNAL` | a fact about the deployment was written as a choice |
| an artifact rebuilt for an environment | the tested artifact is not the shipped one |
| a branch claimed by two environments | a merge fans out and running state has no single answer |
| a tag promoted past a rung it never ran in | the path to production skipped a step |
| a serving layer with an enumerated host list | a customer touchpoint became a release |
| a second mutable object in a web store | the release stopped being immutable, and rollback stopped being a repoint |
| a web store read by another environment's edge | the store boundary broke — no store spans workloads |
| a drift corrected in a provider console | the declaration is no longer the source of truth |
| an estate claim asserted with no source | inference was presented as fact |
