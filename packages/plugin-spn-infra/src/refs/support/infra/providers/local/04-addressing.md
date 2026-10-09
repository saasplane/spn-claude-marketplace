<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/04-addressing.md",
      "seen": "f572cc70"
    }
  ]
}
-->
# Addressing — the same grammar, one environment wide

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/04-addressing.md`. Read this as the restatement; that node governs.

**Every name here composes from coordinates, exactly as it does in the cloud.** What changes is which coordinates are in scope and what the name resolves to. The grammar itself is [`naming.md`](../../shape/naming.md)'s, and this page states only its local rendering.

## There is no environment token

**Locally no `{env}` token exists in any name, because the machine is one environment and the local domain is the pin** (`RD.SUPPORT.INFRA.052`). A cloud service hostname reads `{env}-{world}-{service}`; the same service locally reads `{world}-{service}.{lc-domain}`.

**The world token still names what the service belongs to** — the platform's `{spc}`, a resource space's `{spc}-{space}`, or a module's code. A space's token carries its platform's code in front, as its key prefix does: `dmo-sas-database.lc-spndemo.app` (`RD.SUPPORT.INFRA.112`). A module's namespace is the estate's and its service names are its own: `{module}-{service}.{lc-domain}` (`RD.SUPPORT.INFRA.056`).

## Hosts resolve to loopback, and the port carries the transport

**Every local host resolves to `127.0.0.1`**, answered by the resolver the organization layer installs for every local domain and `lc-test`, so no host needs an `/etc/hosts` line, nothing is proxied and no engine protocol is intercepted. **A host the running platform creates carries no environment prefix here** — `acme.lc-spndemo.app`, never `in-dev-acme…`. Engines are named like every other service, and the port stays the transport distinguisher — `dmo-database.lc-spndemo.app:9000` (`RD.SUPPORT.INFRA.079`).

## Each platform declares its own five hundred ports

**A platform declares the five hundred local ports it owns, and writes both ends: `providers.local.ports: { first, last }`, where `first` is a multiple of 500 and `last` is `first + 499`** (`RD.SUPPORT.INFRA.062`). Every port the platform binds on a machine sits inside that range, so two platforms stood on one laptop never reach for the same port. The sample platform `dmo` declares `9000`–`9499`, and `lpd` declares `9500`–`9999`.

The range is laid out the same way on every platform, in whole hundreds, counted from `first`:

| Offset from `first` | Band | Rule |
| --- | --- | --- |
| `+000`–`099` | engines, ten for each world | the platform at `+000`–`009`; the first space at `+010`, the second at `+020`, and so on; inside each ten, database `+0`, cache `+1`, queue `+2` and its console `+3`, storage `+4` and its console `+5`. The platform and nine spaces |
| `+100`–`149` | services | in app-row order from `+100` |
| `+150`–`199` | health ports | the service's port plus 50 |
| `+200`–`249` | remote ports | the service's port plus 100 |
| `+250`–`299` | kept free | for a fourth port a service may need, at the service's port plus 150 |
| `+300`–`399` | web applications | in app-row order from `+300` |
| `+400`–`449` | modules and vendors | in module-row order from `+400` |
| `+450`–`499` | kept free | not assigned |

On `dmo`: the platform's database `9000`; the space `sas`, its database and cache `9010`, `9011`; the platform's service `api` `9100`, health `9150`, remote `9200`; the sample service `sample-api`, in the space `sas`, `9101`, health `9151`; the observer `9102`, health `9152`; the web applications from `9300`; the module `idp` `9400`.

**A space has no band of its own.** Its ports are engines and nothing else, so they sit with the engines. An application that belongs to a space takes a service's port or a web application's port like any other application. **The layout is about one machine**, where every service shares one address; in the cloud each service has an address of its own, so the number only has to be the same in both places.

**A space's ports derive, and so do a module's** — from `first`, the position in the declaration, and the table above. A space's local `spaces` entry may override one, and the override must sit inside the range, in its own part of it. **A remote port answers plain HTTP on the service's own host**, and nothing is added to the local ingress for it, because no browser calls it: `http://api.lc-spndemo.app:9200`. The tool writes that address into the settings of the services that call it. **`network.index` says nothing about local ports**: it places the platform in the cloud address plan only.

**`spnutils infra validate` refuses** a declared port outside the platform's range, a declared port in the wrong part of the range (a web app's port at `+102`, say, or a remote port that is not its service's port plus 100), and two platforms whose ranges overlap. Each refusal names the port or the two platforms. The overlap check reads the platforms of one estate repository. **A new platform's five hundred is chosen when it is scaffolded:** `spnutils infra scaffold platform <SPC> --ports <first>` writes `first` and `first + 499`, and refuses a `first` that is not a multiple of 500 or whose five hundred overlaps a platform the repository already declares.

## A declared domain and its local rendering join both ways

**Each declared domain gets one `{lc-domain}`, its own certificates from the machine's root CA, and an answer from the local resolver** (`RD.SUPPORT.INFRA.087` · `RD.SUPPORT.INFRA.106`). A declared domain with no local rendering is refused, and so is a local rendering of a domain the platform never declared.

## The tenancy fixtures

**A grammar cannot be tested; only a host that resolves can.** So the local realization derives numbered hosts for every surface a customer organization owns — `{app}{n}.{lc-domain}`, a surface coded `{root}-{suffix}` composed as `{root}{n}-{suffix}` — and a custom-domain half under `{spd-hyphenated}.lc-test` — `account1.spndemo-app.lc-test` — which the machine's resolver answers, so no fixture needs a hosts line (`RD.SUPPORT.INFRA.082` · `RD.SUPPORT.INFRA.106`).

**The fixtures are derived and declared nowhere.** They stand at platform up, converge as applications register, and are removed whole at platform down. A surface no customer organization owns gets none.
