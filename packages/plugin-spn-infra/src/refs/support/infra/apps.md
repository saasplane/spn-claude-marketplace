<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-infra/05-apps.md",
      "seen": "80d31878"
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
  space: CDTString | null;                 // a binding: which space holds its data; absent is the platform's resources
  platform: CDTBoolean | null;             // a binding: the platform's settings beside its space's; absent is false
  serviceDomain: CDTString | null;         // a binding: which face; absent is the platform domain
  grants: SPEstateAppGrantType[] | null;   // the cloud services its runtime may call as itself; absent is none
  deployments: SPEstateAppDeployment[];    // the scheduled units this application runs
}
```

**Names derive, engines are declared once elsewhere, and everything else is refused by shape.** No hostname, no schema, no topic, no prefix and no secret name ever appears in a row — the name grammar owns the hostnames, the migrations own the schemas and topics, the coordinates own the prefixes.

## A row reads in two parts: bindings and grants — MUST tell them apart

The optional keys on a row are of two kinds, and telling them apart is what keeps a review honest.

| | A binding (`space`, `platform`, `serviceDomain`) | A grant (`grants`) |
| --- | --- | --- |
| Says | which settings the deployment is given, and which face it answers on | which cloud services the runtime may call as itself |
| Names | a row the platform already declared | a value from a closed list in the contract |
| Absent means | the platform's resources, and the platform domain | no grant |

A code the platform never declared is refused when the declaration is checked. A face bound on a row that registers no host is refused as one nothing would read. **Reading a grant as a binding makes a missing dependency look like a typo; reading a binding as a grant makes a plan quietly create a second copy of something the estate already had.**

### What an application's row says about its settings

A space and an application are two separate rows. The space owns no application. An application says on its own row what it needs, in three choices (`RD.SUPPORT.INFRA.113`):

| The application needs | Its row | What its deployment is given |
| --- | --- | --- |
| the platform | no `space` key | the platform's settings, `{SPC}_…` |
| a space only | `"space": "sas"` | the space's settings, `{SPC}_{SPACE}_…` |
| the platform and a space | `"space": "sas"` and `"platform": true` | both sets, each under its own prefix |

- **Nothing is merged and nothing is given a second name.** The deployment loads the settings of both layers as they are; the application opens the connections it wants from each.
- **`platform` is written only as `true`, and only on a row that names a space.** The rules refuse it on a row with no `space`, on a web application, and as `"platform": false` — an application that does not want the platform leaves the key out.
- **The key is not a grant.** It says which settings the deployment is given. A grant says what the runtime may call as itself.
- **An application that keeps the platform also holds the settings of the platform's database.** A module's data is still reached through that module's contract; the rule holds it, because the settings no longer do.

These are the last three of the four shapes a platform is built in on the server (`../../apps/shape.md`).

### What the runtime may call as itself — `grants`

A database, a cache and a queue are reached with a user and a password, which arrive as settings. Two cloud services are reached another way: the runtime calls them as itself, with no credential, because the blueprint grants its role the right. A row lists them in `grants` (`RD.SUPPORT.INFRA.110`).

| Grant | What the runtime may do |
| --- | --- |
| `SEAL` | use the environment's key for stored secrets, so the application seals secrets of its own in its own rows |
| `EDGE` | bind a tenant's own domain: request its certificate and write its route |

- **Each value comes from a closed list in the contract** (`SPEstateAppGrantType`). A manifest that names anything else is refused; a further cloud service is one more value.
- **A grant is not restricted by `space`.** An application that lists one is granted it, on the platform or in a space.
- **A workload that lists no grant holds none**, so a permission problem surfaces because a declaration was missing rather than because a role was guessed too narrow. `EDGE` is true for the application that owns identity and for no other.
- **A service lists `SEAL` only when a module it mounts stores secrets.** A service that holds that module remotely receives the opened value from it and never touches the seal.

On a machine the seal is a fixed key in the settings and nothing is granted.

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
| `PRIVATE` | answers on the internal zone | a workload in the cluster, and an operator arriving through the platform's own ranges |
| `INTERNAL` | answers inside the cluster only, and has no route | another workload in the cluster |

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
  remotePort: CDTInt | null;       // the remote listener's port; null serves no contract to other services
  gateway: SPEstateAppDeploymentGateway | null;  // what it asks of its route; null takes the gateway's defaults
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

**Every port a deployment declares sits inside the five hundred local ports its platform declares — MUST** (`RD.SUPPORT.INFRA.062`). The offsets count from the range's first port.

| The port | Its part of the range | Rule |
| --- | --- | --- |
| an API's `port` | `+100`–`149` | in app-row order from `+100` |
| its `healthPort` | `+150`–`199` | the service's port plus 50 |
| its `remotePort` | `+200`–`249` | the service's port plus 100 |
| a web deployment's `port` | `+300`–`399` | in app-row order from `+300` |

`spnutils infra validate` refuses a port outside the range, and a port in the wrong part of it. A deployment's `port` and its `remotePort` are also the ports it listens on in the cloud, so each is chosen once. **Its `healthPort` is a machine's number, and a cloud does not read it.** In a cloud the health listener's port is the setting `{SPC}_HEALTH_PORT`, and it is `8010` unless a team wrote another number (`RD.SUPPORT.INFRA.048`). The key sits under the prefix the service starts with, which for a service in a space is the space's whole prefix. The deploy render supplies `8010` where nobody wrote one, writes the number into what the pod is given, and points the pod's probes at it.

### A remote port is always private

A service that serves its modules' contracts to the other services of its platform declares a **remote port** on its API deployment (`RD.SUPPORT.INFRA.114`).

- **A remote port is always `PRIVATE` — MUST.** `expose` describes the main port; the remote listener's reach is a rule and not a field a row can choose, so a wrong value can never put it on the internet.
- **An application has at most one deployment that declares a remote port — MUST**, so its code names one remote address.
- **A deployment with no remote port serves no contract to others.** A monolith declares none.

| Exposure | Answers on | From the cluster | From a machine over the VPN | From the internet |
| --- | --- | --- | --- | --- |
| `PUBLIC` | the internet | yes | yes | yes |
| `PRIVATE`, and every remote port | the internal zone | yes | yes | no |
| `INTERNAL` | the cluster only, no route | yes | no | no |

**The estate publishes each remote address to the services that call it**, naming a service by its application's `kindCode`, because two applications may each have a deployment called `api`.

| Setting | Published at | What it is |
| --- | --- | --- |
| `{SPC}_API_REMOTE_PORT` | the deployment's own path | the remote listener's port, from `remotePort` |
| `{SPC}_REMOTE_SERVICE_{NAME}_ENDPOINTS` | the environment's path | the remote address of the application whose `kindCode` is `{NAME}` |
| `{SPC}_REMOTE_CREDENTIAL_*` | the environment's path | how a calling service proves itself: the provider's kind, and for the cluster's token its file, what it must be for, this platform's namespaces and the cluster's issuer |

**In a cloud a remote port is reached at `https://{env}-{app}-remote.internal.{spd}`**, where `{app}` is the application's `kindCode`. The host sits in the platform domain's internal zone, whatever service domain the application's own hosts answer on. That address, with its scheme, is the published value, and a pod and an operator's machine use the same one.

The cluster gives every application an identity and writes a token marked for remote calls into each pod; the receiving service checks it first. On a machine each service listens on one more local port, nothing is added to the local ingress, and the local address is plain HTTP on the service's own host and remote port.

### Two load balancers and two gateways

An environment has one pair for each reach, however many services it holds (`RD.SUPPORT.INFRA.115`). A deployment is a route on a gateway and has no load balancer of its own.

| Exposure | Load balancer | Gateway, inside the cluster | Registered as |
| --- | --- | --- | --- |
| `PUBLIC` | one, facing the internet | the public gateway | a route for its host |
| `PRIVATE` | one, internal, admitting the operator ranges and the cluster's own nodes | the private gateway | a route for its internal host |
| a remote port | the internal one | the private gateway | a route, always, whatever `expose` is |
| `INTERNAL` | none | none | no route; other workloads use its service address |

- **The two gateways are kept apart**, so a wrong route cannot make a private surface answer on the internet.
- **HTTPS ends at the load balancer**, with the zone's certificate, for both reaches.
- **A service in the cluster reaches a remote port by the same private HTTPS host an operator's machine uses.**
- **One cluster serves one environment**, with three namespaces named for what they hold: `prd`, `plt` and `vnd`.
- **`MANAGED` and `CLUSTER` say who runs a data engine** and do not change this.

**The estate tells each listener how many proxies stand in front of it**, because a service finds the caller's address by counting back from the right of the forwarded-address header (`RD.SUPPORT.APPS.176`):

| Setting | Value | The proxies it counts |
| --- | --- | --- |
| `{SPC}_API_TRUSTED_PROXIES` | `2` for a deployment that has a route | the load balancer, then the gateway |
| `{SPC}_API_TRUSTED_PROXIES` | `0` for an `INTERNAL` deployment | none |
| `{SPC}_API_REMOTE_TRUSTED_PROXIES` | `3` for every deployment that declares a remote port | the calling service, the internal load balancer, then the private gateway |

A value a team writes for either key wins over the published one.

**A deployment's label is never `gateway`, and never ends `-remote` — MUST** (`RD.SUPPORT.INFRA.119`). The estate's rules refuse each and name the row. Each gateway has a host of its own, `{env}-gateway.{spd}` and `{env}-gateway.internal.{spd}`, which every route's host points at. `{env}-{app}-remote` is the host of an application's remote port.

The book says "a gateway" and names no product where it states the rule; the provider's chapter says what is installed (`providers/aws/08-environment.md`).

### What a deployment asks of its route

A deployment that has a route may state limits for it on its own row; the blueprint turns them into the gateway's settings (`RD.SUPPORT.INFRA.116`).

```ts
export interface SPEstateAppDeploymentGateway {
  rateLimit: SPEstateAppDeploymentGatewayRateLimit | null;  // a ceiling on requests from one address, counted in front of every pod
  timeoutSeconds: CDTInt | null;                            // how long one request may take
  maxBodyMegabytes: CDTInt | null;                          // the largest request body accepted
}

export interface SPEstateAppDeploymentGatewayRateLimit {
  max: CDTInt;
  windowSeconds: CDTInt;
}
```

- **The manifest names the need and never the gateway's own field**, so the gateway can be replaced without touching a manifest.
- **Each member left out takes the gateway's default.**
- **The block sits on a deployment that has a route:** an API, or a web deployment that declares a port. It is refused on a web deployment with no port and on one whose `expose` is `INTERNAL`.
- **It applies to the main route.** A remote route takes the gateway's defaults.
- **The rate limit's window is one second, one minute, one hour or one day — MUST** (`RD.SUPPORT.INFRA.118`). `windowSeconds` is `1`, `60`, `3600` or `86400`, because a gateway counts in those four units and no other. The estate's rules refuse any other number and name the row.
- **The count is one count, however many proxy pods a gateway runs.** The gateway keeps it in the environment's own cache (`RD.SUPPORT.INFRA.120`).

The gateway's limit counts calls to the whole deployment from one address and stops a flood before it reaches a pod. A route's own limit is declared in code, counts calls to one route from one caller, and gives a fair share of one costly thing.

### A web firewall on the public load balancer

The internet-facing load balancer of every cluster carries one web firewall, covering every public deployment behind it — MUST (`RD.SUPPORT.INFRA.117`).

- **The blueprint builds it, as it builds the two gateways and the two load balancers.** It stands in every environment, and no estate file declares it: an environment's row holds nothing for it. So no environment can stand an unguarded public load balancer, and two environments never differ in it.
- **It holds three of the cloud's rule groups** (common rules, known bad inputs, address reputation), **and it counts only.** Each match is recorded with the rule's name and the request is let through. Nothing in an estate file makes the firewall refuse a request.
- **One deployment is treated differently by a rule limited to its host**, inside the one firewall.
- **Nothing is attached to the internal load balancer**, and a public web application is not covered, because it is a bundle served from the edge.

## Locally, only the ports are read

**An application on a developer's machine is its own tree, and the estate is not consulted about that — MUST.** Its folder and its kind manifest say it exists; the row governs only what **deploys**. A machine reads two facts from a row: a deployment's declared port, so the local ingress sends the app's host to the port the app listens on, and a declared remote port, so the tool can write that service's remote address into the settings of the services that call it. That separates the two lifecycles twice over: a new environment never needs a code release, and a new commit never touches the estate. Requiring a grant to run locally would put the estate between a developer and their own machine, protecting nothing — there is no shared surface to protect and no cost to bound.

## What it makes checkable

| Defect | What it means |
| --- | --- |
| something deployed with no row | it is running by accident rather than by grant, and the declaration is documentation |
| a grant read as a binding | a missing dependency reads as a typo |
| a binding read as a grant | the plan created a second copy of something the estate already had |
| two deployments of one application declaring a remote port | the application's code has no single remote address to name |
| a deployment labelled `gateway`, or with a label ending `-remote` | it takes a gateway's own record, or answers on another application's private address |
| a gateway rate limit with a window that is not 1, 60, 3600 or 86400 seconds | the manifest declares a limit the gateway cannot count |
| a shape omitting a fact every deployment declares | a new shape arrived carrying an exemption, and reviews stopped reading the same way |
| exposure inferred rather than declared | something is reachable from somewhere nobody chose |
| exposure exceeding its namespace | an application granted itself reach the level above never allowed |
| the estate consulted for a local run | the estate was put between a developer and their own machine, protecting nothing |

Try it: `spnutils infra show dmo` — it lists the applications a platform grants, without reaching any account.
