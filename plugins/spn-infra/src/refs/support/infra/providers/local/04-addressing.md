<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/04-addressing.md", "seen": "b1cdd1e1" }
  ]
}
-->
# Addressing — the same grammar, one environment wide

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/04-addressing.md`. Read this as the restatement; that node governs.

**Every name here composes from coordinates, exactly as it does in the cloud.** What changes is which coordinates are in scope and what the name resolves to. The grammar itself is [`naming.md`](../../shape/naming.md)'s, and this page states only its local rendering.

## There is no environment token

**Locally no `{env}` token exists in any name, because the machine is one environment and the local domain is the pin** (`RD.INFRA.052`). A cloud service hostname reads `{env}-{world}-{service}`; the same service locally reads `{world}-{service}.{lc-domain}`.

**The world token still names what the service belongs to** — the platform's `{spc}`, a resource space's code, or a module's code. A module's namespace is the estate's and its service names are its own: `{module}-{service}.{lc-domain}` (`RD.INFRA.056`).

## Hosts resolve to loopback, and the port carries the transport

**Every local host record resolves to `127.0.0.1`**, so nothing is proxied and no engine protocol is intercepted. Engines are named like every other service, and the derived port stays the transport distinguisher — `dmo-database.lc-spndemo.app:9210` (`RD.INFRA.079`).

**A space's engine ports derive** from the platform family's port plus one hundred for each space, the family's own secondary offsets riding along (`RD.INFRA.062`). The formula is realized identically in the blueprints render and in the CLI.

## A declared domain and its local rendering join both ways

**Each declared domain gets one `{lc-domain}`, its own certificates from the machine's root CA, and hosts entries** (`RD.INFRA.087`). A declared domain with no local rendering is refused, and so is a local rendering of a domain the platform never declared.

## The tenancy fixtures

**A grammar cannot be tested; only a host that resolves can.** So the local realization derives numbered hosts for every surface a customer organization owns — `{app}{n}.{lc-domain}`, a surface coded `{root}-{suffix}` composed as `{root}{n}-{suffix}` — and a custom-domain half under `{spd-hyphenated}.test`, reserved by RFC 6761 so it can neither resolve publicly nor shadow a real registration (`RD.INFRA.082`).

**The fixtures are derived and declared nowhere.** They stand at platform up, converge as applications register, and are removed whole at platform down. A surface no customer organization owns gets none.
