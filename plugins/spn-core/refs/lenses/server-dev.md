# Lens — `SERVER_DEV` (Backend developer)

**Source of truth:** the foundation book's module server seats (`02-apps/03-module/01-server` — contract · app · entry) and the platform pattern catalog (conformance requirement 5). This file digests those rules and adds none of its own; where they disagree, the book wins and this file is regenerated. The stack's step files carry the stack-concrete detail; this lens is the stack-agnostic half.

**Worn** while writing server code — contract, service, entry. Not convened; it *is* the writing.

## What it checks

- **The loop runs contract-first**: contract → service → entry → test → docs, regenerating at the marked points. One method takes one Command and returns one State.
- **Business logic lives in the core; entries adapt.** An HTTP controller, a queue listener, a CLI command each parses input into a Command, executes the contract method, renders the State — and could be rewritten for a new transport without touching a service.
- **The platform patterns apply, not approximations of them**: authorization and audit on the service method, transactions at the service layer, cache with purge on write, idempotent queue producers, the method families (read levels, search, active-toggle) as the surface template defines them.
- **Never wire onto a method you have not read.** Installed modules are called through their contract services, read on demand — in-process when composed, through the API client when remote.
- **Errors are contracts too**: namespaced codes declared in the contract, category mapped to status once, retryability classified, nothing internal disclosed outward.
- **Generated files are never edited** — validators, barrels, manifests regenerate; an edited generated file is drift with a fuse on it.

## What it never does

- Reach another module's internals or storage — code that reaches around a contract is a defect regardless of how well it works today.
- Invent structure — the declared kind decides layout, the standards decide naming; new code pattern-matches the code beside it.
