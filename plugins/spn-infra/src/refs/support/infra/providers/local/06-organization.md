<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/local/06-organization.md", "seen": "4d4d8faf" }
  ]
}
-->
# Organization — the machine's trust bootstrap

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/local/06-organization.md`. Read this as the restatement; that node governs.

**Locally the organization layer is the machine's trust bootstrap.** `spnutils infra organization up` stands the local certificate authority, raises its one trust prompt, installs the local resolver, and starts the shared ingress. Where a cloud rendering stands accounts, guardrails and an output store, this one stands what every platform on the machine will share.

## What it stands

| Thing | What it is |
| --- | --- |
| the certificate authority pair | one trust root per machine, deliberately unscoped, trusted once |
| the trust prompt | the single act that puts that root in the machine trust store; `spnutils infra trust-ca` performs it on its own |
| the local resolver | answers `*.{lc-domain}` and `*.lc-test` with `127.0.0.1` — `*.lc-spndemo.app` for SPN Demo — installed once with one privileged prompt, so no host needs an `/etc/hosts` line (macOS: `dnsmasq` plus a file under `/etc/resolver/`) |
| the shared ingress | the proxy that binds the one secure port and reads one directory of vhost files whole |

**Those singletons are named for the machine and never for a company.** A trust root and a port binding are genuinely singular on a laptop, so scoping either by organization would mean two of them fighting over the same resource.

**A platform's scope therefore lives in the vhost filename rather than in a subdirectory.** The proxy reads one directory whole, and a per-platform folder would move the include pattern and the mount with it.

## The layer below converges on its own

**On a machine one principal owns every layer, so `platform up` converges this one beneath it.** In the cloud each layer has its own principals, so a platform apply meeting a missing organization layer is refused by name ([blueprints](../../blueprints.md)).

## What is not here

**Accounts, guardrails and the trust graph are absent, not stubbed.** A machine has no account tree to build, no policy to deny anything, and no cross-account relationship to deny in one direction.

**That absence is what makes the local target worth trusting.** A stub would answer, and you would learn which guardrail you had been relying on only when the cloud run refused you.

**Estate caution holds here too.** `up` and `down` each take exactly one of `--plan` or `--apply`, with no default, and `tofu apply` or `tofu destroy` is never hand-run.
