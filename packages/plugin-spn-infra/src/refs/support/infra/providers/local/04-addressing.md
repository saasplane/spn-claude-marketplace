<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/04-addressing.md",
      "seen": "c5ad1ab9"
    }
  ]
}
-->
# Addressing — the same grammar, one environment wide

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/04-addressing.md`. Read this as the restatement; that node governs.

**Every name here composes from coordinates, exactly as it does in the cloud.** What changes is which coordinates are in scope and what the name resolves to. The grammar itself is [`naming.md`](../../shape/naming.md)'s, and this page states only its local rendering.

## There is no environment token

**Locally no `{env}` token exists in any name, because the machine is one environment and the local domain is the pin** (`RD.SUPPORT.INFRA.052`). A cloud service hostname reads `{env}-{world}-{service}`; the same service locally reads `{world}-{service}.{lc-domain}`.

**The world token still names what the service belongs to** — the platform's `{spc}`, a resource space's code, or a module's code. A module's namespace is the estate's and its service names are its own: `{module}-{service}.{lc-domain}` (`RD.SUPPORT.INFRA.056`).

## Hosts resolve to loopback, and the port carries the transport

**Every local host resolves to `127.0.0.1`**, answered by the resolver the organization layer installs for every local domain and `lc-test`, so no host needs an `/etc/hosts` line, nothing is proxied and no engine protocol is intercepted. **A host the running platform creates carries no environment prefix here** — `acme.lc-spndemo.app`, never `in-dev-acme…`. Engines are named like every other service, and the port stays the transport distinguisher — `dmo-database.lc-spndemo.app:9100` (`RD.SUPPORT.INFRA.079`).

## Each platform declares its own hundred ports

**A platform declares the hundred local ports it owns, and writes both ends: `providers.local.ports: { first, last }`, where `last` is `first + 99`** (`RD.SUPPORT.INFRA.062`). Every port the platform binds on a machine sits inside that range, so two platforms stood on one laptop never reach for the same port. The sample platform `dmo` declares `9100`–`9199`, and `lpd` declares `9200`–`9299`.

| Offset from `first` | What binds there |
| --- | --- |
| `+00`–`14` | the platform's own engines: database `+0`, cache `+1`, queue `+2` and its console `+3`, storage `+4` and its console `+5` |
| `+15`–`29` | the modules and vendors the platform declares, one port each in module-row order from `+15` |
| `+30`–`39` | the services the platform's app rows declare, in app-row order from `+30` |
| `+40`–`49` | each service's health listener, at its service's port plus ten |
| `+50`–`69` | the web apps the platform's app rows declare, in app-row order from `+50` |
| `+70`–`99` | the resource spaces, ten ports each: space *i* (counting from zero, in declaration order) starts at `+70 + 10 × i` and repeats the engine offsets above, so a platform stands at most three spaces |

**A space's ports derive, and so do a module's** — from `first`, the position in the declaration, and the table above. A space's local `spaces` entry may override one, and the override must sit inside the range, in its own part of it. **`network.index` says nothing about local ports**: it places the platform in the cloud address plan only.

**`spnutils infra validate` refuses** a declared port outside the platform's range, a declared port in the wrong part of the range, and two platforms of one estate repository whose ranges overlap. **A new platform's hundred is chosen when it is scaffolded:** `spnutils infra scaffold platform <SPC> --ports <first>` writes both ends, and refuses a `first` that is not a multiple of 100 or whose hundred overlaps a platform the repository already declares.

## A declared domain and its local rendering join both ways

**Each declared domain gets one `{lc-domain}`, its own certificates from the machine's root CA, and an answer from the local resolver** (`RD.SUPPORT.INFRA.087` · `RD.SUPPORT.INFRA.106`). A declared domain with no local rendering is refused, and so is a local rendering of a domain the platform never declared.

## The tenancy fixtures

**A grammar cannot be tested; only a host that resolves can.** So the local realization derives numbered hosts for every surface a customer organization owns — `{app}{n}.{lc-domain}`, a surface coded `{root}-{suffix}` composed as `{root}{n}-{suffix}` — and a custom-domain half under `{spd-hyphenated}.lc-test` — `account1.spndemo-app.lc-test` — which the machine's resolver answers, so no fixture needs a hosts line (`RD.SUPPORT.INFRA.082` · `RD.SUPPORT.INFRA.106`).

**The fixtures are derived and declared nowhere.** They stand at platform up, converge as applications register, and are removed whole at platform down. A surface no customer organization owns gets none.
