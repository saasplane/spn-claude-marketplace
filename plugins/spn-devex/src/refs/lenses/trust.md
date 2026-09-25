<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/04-data-and-trust/02-trust.md", "seen": "ffc78858" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/08-agent-surface/README.md", "seen": "4a652e95" },
    { "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/01-tenancy/03-people-access.md", "seen": "82d774b8" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/03-module/01-server/01-contract/01-states.md", "seen": "527281ed" }
  ]
}
-->

# Lens — `TRUST` (DevSecOps / Security)

**Source of truth:** the foundation book's trust chapter (`03-platform/01-core/04-data-and-trust/02-trust`), the four build invariants (`02-support/01-apps/08-agent-surface`), the authorization and step-up model (`03-platform/01-core/01-tenancy/03-people-access`), and the secrets and error disciplines (`02-support/01-apps/03-module/01-server/01-contract/01-states`). This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing any mutation. **Convened** on every build. **Blocks:** a mutation with no authorization or no audit.

## What it checks

- **Every mutation is authorized at the service layer** — the gate rides the contract method with its permission codes, so the same check guards every entry. A mutation whose only gate is a hidden button is ungated. This is the line this lens stops work over.
- **Every mutation lands in the audit trail**, attributed to a principal, in an organization context. The attribution test must answer: which principal, which action, which organization, under which policy — for people, the system, and agents alike.
- **Context comes from the auth context, never the command body.** Take the caller's organization and identity from what the runtime authenticated; a request cannot assert its own scope.
- **Secrets are structural**: no raw secret at rest, stored secrets write-only from the contract's perspective, never returnable by any API. Treat a design that needs to read a secret back as a wrong design, not a missing feature.
- **No signing secret has a default.** A service started without one refuses to boot rather than signing with a value somebody could guess (`RD.INFRA.095`). A signing secret rotates behind a fallback that only VERIFIES, so a rotation signs nobody out.
- **A stored token rotates; an unstored one is short-lived and names its use.** A refresh token the server keeps rotates on every use, and presenting an already-rotated one revokes the session. A renewal token the server does not keep is signed, short-lived, and says what it is for — every check refuses a token whose use does not match (`RD.APPS.090` · `RD.APPS.095`). Nothing revokes an unstored token, so ending the session is what ends it.
- **Failures never disclose existence** — an id outside the caller's scope resolves to `NOT_FOUND`, a failed login is one generic answer, no internals leak outward.
- **Sensitive actions step up.** Ask for fresh confirmation before proceeding, for a person or an agent, with idempotent Commands making the hold safe.
- **A fact about the person attaches to the identity; a judgement about it is never stored.** Enrolled factors, verified browsers and the evidence of what was proven now all sit on the IDENTITY, and each organization reads its own policy to decide what counts. So the same authenticator can be accepted by one organization and refused by another, and neither can weaken the other. A caller cannot assert that MFA happened, because there is no claim to make.
- **A verified browser exists only because somebody asked for one.** Ticking *don't ask again* during step-up is the consent, and the row records which factor proved it and when. **A recovery code may never write one** — break-glass must not earn persistence. The skip is proof-based: a returning browser presents the secret it was handed, and a device identifier alone never satisfies it.
- **A session is per app site, and renewed the one way its host allows** (`RD.APPS.090`). A platform surface asks the auth host again; a customer's own domain holds a short-lived signed renewal token; a native app holds a refresh token that rotates.
- **The four build invariants hold**: reachable via contract, authorized and audited at the service layer, routes registered with schemas, forms bound to validators.

## What it never does

- Waive its own block — a finding it would waive becomes a drafted decision entry; a person decides.
- Trade enforcement for review comments — a rule a hook can enforce is proposed as a hook.
