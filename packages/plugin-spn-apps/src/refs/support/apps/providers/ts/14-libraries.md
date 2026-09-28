<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/14-libraries.md", "seen": "ee6981a8" }
  ]
}
-->
<!-- spn:generated libraries — do not edit inside these markers; `spn-apps library catalogue` writes it -->
# Libraries — the published packages a node may depend on

**Source of truth:** the foundation's `10-providers/ts/14-libraries.md`. **That chapter states the rule and this ref carries the list**, which is the one entry where the book and this folder answer the same question differently. How a package travels in this stack — the scopes, the registry each one publishes to, and why a consumer pins an exact version rather than a range — is the book's. Which packages exist is nobody's to write by hand, because the set moves at every release.

**This table is generated from the support repository's own manifests**, and it moves every release. **9 package(s) are published.**

**A version here names what is published, never what is being worked on.** A release stamps the number and the first edit after it increments, so a number you cannot find published is one that has not been released yet.

| Package | Version | What it is |
| --- | --- | --- |
| `@saasplane/client-sample-api-ts` | `0.0.0` | Typed OpenAPI client SDK for the Sample Service — generated from its live API. |
| `@saasplane/support-contract-ts` | `0.0.0` | The contract primitives and generated validators every SaaS Plane state is built from |
| `@saasplane/support-server-integrations-ts` | `0.0.0` | Domain-agnostic provider integration — the base port, the registry, message types, and the concrete vendor integrations |
| `@saasplane/support-server-service-ts` | `0.0.0` | The SPServiceApp framework for backend services — Fastify, TypeORM, Redis, Kafka and auth, under one boot manager |
| `@saasplane/support-server-ts` | `0.0.0` | Backend infrastructure providers — cache, queue, lock, log and error — for any Node.js environment |
| `@saasplane/support-ts` | `0.0.0` | Core utilities, error handling, HTTP clients and the SPApp base framework — the foundation the runtime frameworks build on |
| `@saasplane/support-web-ds-ts` | `0.0.0` | The React design system — accessible, themeable components and the hooks that drive them |
| `@saasplane/support-web-ts` | `0.0.0` | The SPWebApp framework and the browser utilities beside it — auth, device, storage, logging |
| `@saasplane/toolchain-ts` | `0.0.0` | Shared toolchain configuration for SaaS Plane TypeScript workspaces — tsconfig bases per kind, the flat ESLint config, the Jest preset, the Rollup factory, and the kind-driven build/release lifecycle bins. |

**Depend on a published name, never on a path into a sibling checkout.** A path resolves only for somebody holding both repositories, and a partner holds one.

<!-- /spn:generated -->
