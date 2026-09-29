<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/05-apps.md",
      "seen": "70f98148"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/05-apps/",
      "seen": "d2d6364e"
    }
  ]
}
-->

# Estate apps — a row is a grant, and exposure is declared

**Source of truth:** the foundation book's `docs/02-constructs/02-support/02-infra/05-apps.md` and `docs/04-capabilities/02-support/02-infra/05-apps/`. Read this card as the restatement; the book governs.

## An application runs because a row grants it — MUST

There is no file in a code repository that asks the estate for what an application needs. **A grant belongs where it is reviewed, so an application's existence in the cloud is one row of its platform's own declaration** — and the row is not a description of something that already exists, it is the permission for it to (`RD.SUPPORT.INFRA.026`).

Two independent statements have to agree before anything runs, made in two different repositories by two different reviews: a code node's kind manifest claims that it is code of a certain shape, and the estate row grants that shape a place to run. **A deployment needs both.** A code change alone can never open production access, and something running with no row behind it is a finding, never a fact.

**Only a server application and a web application earn rows.** An installed utility has no estate footprint at all, and an application-owned module's needs travel with the application that hosts it.

## The row

```ts
export interface SPEstateApp {
  kindCode: CDTString;                     // the token the code node declares for itself
  repo: CDTString;                         // one of the repositories the platform declared
  space: CDTString | null;                 // a binding: which data world; absent is the platform's
  serviceDomain: CDTString | null;         // a binding: which face; absent is the platform domain
  resources: SPEstateAppResources | null;  // a claim: absent is the baseline, nothing claimed
  deployments: SPEstateAppDeployment[];    // the scheduled units this application runs
}
```

**Names derive, engines are declared once elsewhere, and everything else is refused by shape.** No hostname, no schema, no topic, no prefix and no secret name ever appears in a row — the name grammar owns the hostnames, the migrations own the schemas and topics, the coordinates own the prefixes.

## A binding names something; a claim asks for something — MUST tell them apart

The two kinds of key on a row look alike and behave differently, and telling them apart is what keeps a review honest.

| | A binding (`space`, `serviceDomain`) | A claim (`resources`) |
| --- | --- | --- |
| Says | *use the row the platform already declared* | *I would like this capability* |
| The estate may | nothing to decline — the row exists or the binding is refused | decide whether to stand it |
| Absent means | the platform's own world, or the platform domain | the baseline, nothing claimed |

A code the platform never declared is refused when the declaration is checked. A face bound on a row that registers no host is refused as one nothing would read. **Reading a claim as a binding makes a missing dependency look like a typo; reading a binding as a claim makes a plan quietly create a second copy of something the estate already had.**

**The claim vocabulary today holds one capability: `hostname`** — whether an application manages tenant custom domains. Claiming it buys a scoped identity that may request certificates and edit the environment's web delivery, the one integration whose credential never exists as a value because the workload acts as itself. It is true for the application that owns identity and for no other. **A workload that did not claim a capability holds no grant for it**, so a permission problem surfaces because a declaration was missing rather than because a role was guessed too narrow.

## Every deployment declares the same four facts

```ts
export interface SPEstateAppDeployment {
  mtype: SPEstateAppDeploymentType;  // API, WEB or PROCESSOR
  deploymentCode: CDTString;         // which deployment of its application this one is — never derived
  ns: SPEstateNamespaceType;         // the blast-radius group it lands in
  expose: SPEstateExposeType;        // how far its inbound surface reaches
}
```

**A deployment's shape decides what it adds, never what it may omit — MUST.** These four sit on the shared shape rather than on each variant because all of them are asked of every kind: putting the namespace and the exposure on each variant instead is how a web deployment once ended up with neither, because nothing asked it. A new shape cannot arrive carrying an exemption.

**`deploymentCode` is mandatory and never derived — MUST.** It is the token that tells one deployment of an application from another in the internal host grammar, in every resource name, and in the configuration path. A nullable field would make that path conditional, and a conditional path cannot be enumerated — the estate stands one configuration seat per deployment, so it has to know how many there are and what each is called from the declaration alone. `(app, deploymentCode)` is unique, refused at resolve by name if not. Scaffolding writes the shape's own word (`api`, `web`, `processor`), so a single-deployment application reads exactly as it would without the field.

**Every scheduled deployment of one application belongs to one blast-radius group** (`ns`, `SPEstateNamespaceType`: `PRD` · `PLT` · `VND`) — one identity, one configuration root, written on every row rather than inferred.

## Exposure is declared, and the namespace is its ceiling — MUST

Which edge a deployment answers on, which zone it sits in, and whether it stands on the public attack surface at all is **one declared fact**, never inferred (`RD.SUPPORT.INFRA.103`).

| Value (`SPEstateExposeType`) | The deployment | Reached by |
| --- | --- | --- |
| `PUBLIC` | answers on the internet | anybody |
| `PRIVATE` | answers on the internal zone | an operator arriving through the platform's own ranges |
| `INTERNAL` | answers inside the cluster only, and stands no ingress | another workload in the cluster |

**The namespace is the ceiling, not the source — a deployment cannot declare more exposure than the namespace it sits in allows.** A platform or vendor-namespace service claiming `PUBLIC` is refused by name when the declaration is resolved, before any plan runs — widening the attack surface is a change somebody makes deliberately at the level that owns it, never an application granting itself reach because it asked. A background worker declares its exposure too, and anything but `INTERNAL` is refused: having no inbound surface is a fact about a background worker, not a choice it gets to make.

`SPEstateExposeType` is an enum rather than a string because the value crosses three boundaries — declared here, handed to a layer whose own variable validates it, and asserted against in a check — and a bare string would type-check at none of them.

**A binding is supplied explicitly or not at all — MUST, no default at the layer that consumes it** (`RD.SUPPORT.INFRA.089`). A driver that stops passing one is reported as awaiting its input, never resolved quietly to no ingress or to the platform domain — a defaulted variable is the one omission nothing reports. A face binding is a choice **inside** the exposure already declared: it can place a public surface on a different apex, and it never widens how far that surface reaches.

## What each shape adds

```ts
export interface SPEstateAppDeploymentApi extends SPEstateAppDeployment {
  mtype: SPEstateAppDeploymentType.API;
  port: CDTInt;
  healthPort: CDTInt | null;       // the probe's own port, when it differs from the serving port
  websocket: CDTBoolean;
  size: SPEstateSizeType | null;   // null takes the environment's own capacity profile
  subdomains: CDTString[];         // every label it answers on, first is primary
}
```

**The health port is deliberately not the serving port, so a probe is never reachable through the public door.** Nothing local probes yet, so the value is read and carried rather than turned into a host — inventing a surface nobody asked for is worse than carrying a fact.

**Labels are plural**, because one deployment can be reached by more than one name and a second name is not a second deployment — an API answers on its own label and on the authentication host: one process, one port, two names. The first label is the primary; an empty list is refused because it would compose no host at all.

```ts
export interface SPEstateAppDeploymentWeb extends SPEstateAppDeployment {
  mtype: SPEstateAppDeploymentType.WEB;
  port: CDTInt | null;             // null where nothing listens
  subdomains: CDTString[];
}
```

**A publicly exposed web deployment is a bundle** — assets behind an edge, no process of its own, no port, no workload. **A privately exposed one is not** — it is a process serving files behind the internal zone and needs a workload like anything else. A server-rendered application binds a port in every environment exactly as a service does; without a declared port, local port discovery falls back to pattern-matching the application's own configuration, which stops matching the moment the number becomes a constant or the key gets renamed, and the first sign is an error naming nothing.

A background worker (`SPEstateAppDeploymentProcessor`) declares its capacity and nothing else — **the absence of a subdomain is the statement**: it has no inbound surface to name, and resolve refuses anything but `INTERNAL` exposure on it.

**Every port a deployment declares sits inside the hundred local ports its platform declares — MUST** (`RD.SUPPORT.INFRA.062`). An API's `port` sits at `+30`–`39` from the range's first port, in app-row order, and its `healthPort` is that port plus ten, at `+40`–`49`. A web deployment's `port` sits at `+50`–`69`, in app-row order. `spnutils infra validate` refuses a port outside the range, and a port in the wrong part of it. The same number is the port the deployment listens on in the cloud, so it is chosen once.

## Locally, only the port is read

**An application on a developer's machine is its own tree, and the estate is not consulted about that — MUST.** Its folder and its kind manifest say it exists; the row governs only what **deploys**. The one fact a machine reads from a row is a deployment's declared port, so the local ingress sends the app's host to the port the app listens on. That separates the two lifecycles twice over: a new environment never needs a code release, and a new commit never touches the estate. Requiring a grant to run locally would put the estate between a developer and their own machine, protecting nothing — there is no shared surface to protect and no cost to bound.

## What it makes checkable

| Defect | What it means |
| --- | --- |
| something deployed with no row | it is running by accident rather than by grant, and the declaration is documentation |
| a claim read as a binding | a missing dependency reads as a typo |
| a binding read as a claim | the plan created a second copy of something the estate already had |
| a shape omitting a fact every deployment declares | a new shape arrived carrying an exemption, and reviews stopped reading the same way |
| exposure inferred rather than declared | something is reachable from somewhere nobody chose |
| exposure exceeding its namespace | an application granted itself reach the level above never allowed |
| the estate consulted for a local run | the estate was put between a developer and their own machine, protecting nothing |

Try it: `spnutils infra show dmo` — it lists the applications a platform grants, without reaching any account.
