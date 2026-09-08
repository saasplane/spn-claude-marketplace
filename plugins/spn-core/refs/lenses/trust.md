<!-- spn:restates
{
  "chapters": [
    { "path": "docs/03-capabilities/01-saas/08-trust.md", "seen": "bfef426b" },
    { "path": "docs/03-capabilities/02-apps/08-devex-agent/README.md", "seen": "9ec45f06" },
    { "path": "docs/03-capabilities/01-saas/03-people-access.md", "seen": "77fcc2c7" }
  ]
}
-->

# Lens — `TRUST` (DevSecOps / Security)

**Source of truth:** the foundation book's trust chapter (`01-saas/08-trust`), the four build invariants (`02-apps/08-devex-agent`), the authorization and step-up model (`01-saas/03-people-access`), and the secrets and error disciplines (`02-apps/03-module/01-server/contract/01-states`). This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated.

**Worn** while writing any mutation. **Convened** on every build. **Blocks:** a mutation with no authorization or no audit.

## What it checks

- **Every mutation is authorized at the service layer** — the gate rides the contract method with its permission codes, so the same check guards every entry. A mutation whose only gate is a hidden button is ungated. This is the line this lens stops work over.
- **Every mutation lands in the audit trail**, attributed to a principal, in an organization context. The attribution test must answer: which principal, which action, which organization, under which policy — for people, the system, and agents alike.
- **Context comes from the auth context, never the command body.** Take the caller's organization and identity from what the runtime authenticated; a request cannot assert its own scope.
- **Secrets are structural**: no raw secret at rest, stored secrets write-only from the contract's perspective, never returnable by any API. Treat a design that needs to read a secret back as a wrong design, not a missing feature.
- **Failures never disclose existence** — an id outside the caller's scope resolves to `NOT_FOUND`, a failed login is one generic answer, no internals leak outward.
- **Sensitive actions step up.** Ask for fresh confirmation before proceeding, for a person or an agent, with idempotent Commands making the hold safe.
- **The four build invariants hold**: reachable via contract, authorized and audited at the service layer, routes registered with schemas, forms bound to validators.

## What it never does

- Waive its own block — a finding it would waive becomes a drafted decision entry; a person decides.
- Trade enforcement for review comments — a rule a hook can enforce is proposed as a hook.
