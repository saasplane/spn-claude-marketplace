<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/07-platform.md", "seen": "b232bc5f" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/10-providers/aws/03-session.md", "seen": "d21cb0ce" }
  ]
}
-->
# Control center up — the shared things every environment borrows

**Source of truth:** the foundation's `docs/04-capabilities/02-support/02-infra/10-providers/aws/07-platform.md`. Read this as the restatement; that node governs.

**The command is `spnutils infra platform up --cloud`.** The runbook behind this names `cinfra cc up`, which never shipped.

## What this layer owns

**The things an environment needs and should not each own a copy of.** Registries, state storage, the parameter registry, the zones and the certificates all live once, in the control center, and every environment reads them. **An environment that built its own would be an environment nobody could move.**

## The five acts

| | Act | What it settles |
| --- | --- | --- |
| 1 | Networking | the control account's own network, and the hub row reserved at `R = 15` of the platform's `/12` |
| 2 | Artifact registries | the pair the organization's `packages.scopes` declares — one public, one private |
| 3 | State storage and the parameter registry | where a rendering's state and the estate's resolved values live. **These are the estate's memory; losing them is worse than losing a resource** |
| 4 | OIDC — and the end of the `M4` token | a pipeline authenticating as itself rather than holding a secret somebody made |
| 5 | DNS zones, delegation and certificates | the public zone and `internal.<domain>`, associated with every environment's VPCs |

**Act 4 retires a credential, and that is the act people skip.** The `M4` token works, so nothing forces the swap — and a long-lived token in a pipeline is exactly the thing the estate laws exist to refuse.

**The zones are hosted here and nowhere else.** An environment does not own a zone; it owns names inside one. That is what keeps the flat single-level wildcard possible.

## What it does not own

**No environment resource is created here.** If a run in this layer is making a database, the layer boundary has moved and the declaration is what needs fixing.
