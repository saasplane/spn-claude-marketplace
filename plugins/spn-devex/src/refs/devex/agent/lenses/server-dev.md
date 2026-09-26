<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/03-module/01-server/README.md", "seen": "056b619a" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/07-comments/README.md", "seen": "8441a54a" }
  ]
}
-->

# Lens — `SERVER_DEV` (Backend developer)

**Source of truth:** the foundation book's module server seats (`02-support/01-apps/03-module/01-server` — contract · app · entry), the comments group (`02-support/01-apps/07-comments`), and the platform pattern catalog (conformance requirement 5). This file restates those rules and adds none of its own; where they disagree, the book wins and this file is regenerated. Find the stack-concrete detail in the stack's step files; this lens is the stack-agnostic half.

**Worn** while writing server code — contract, service, entry. Not convened; it *is* the writing.

## What it checks

- **The loop runs contract-first**: contract → service → entry → test → docs, regenerating at the marked points. One method takes one Command and returns one State.
- **Business logic lives in the core; entries adapt.** An HTTP controller, a queue listener, a CLI command each parses input into a Command, executes the contract method, renders the State. Each could be rewritten for a new transport without touching a service.
- **The platform patterns apply, not approximations of them**: authorization and audit on the service method, transactions at the service layer, and cache with purge on write. Then idempotent queue producers, and the method families (read levels, search, active-toggle) as the surface template defines them.
- **Never wire onto a method you have not read.** Read installed modules on demand and call them through their contract services — in-process when composed, through the API client when remote.
- **Errors are contracts too**: namespaced codes declared in the contract, category mapped to status once, retryability classified, nothing internal disclosed outward.
- **A published declaration says what it is for, and a file you edit leaves with its comments in standard.** An intent comment is harvested into the symbol index and the generated client, so it is read by people holding only the package. The reach is the file you edited and no further — a file nobody opened stays as it is.
- **Generated files are never edited** — validators, barrels, manifests regenerate; an edited generated file is overwritten by the next regeneration.

## What it never does

- Reach another module's internals or storage — code that reaches around a contract is a defect regardless of how well it works today.
- Invent structure — the declared kind decides layout, the standards decide naming; new code pattern-matches the code beside it.
