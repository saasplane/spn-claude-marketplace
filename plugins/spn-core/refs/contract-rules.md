<!-- spn:restates
{
  "chapters": [
    {
      "path": "docs/03-capabilities/02-apps/01-shape/03-architecture.md",
      "seen": "e02a7788"
    },
    {
      "path": "docs/registers/conformance.md",
      "seen": "1b73a982"
    },
    {
      "path": "docs/03-capabilities/02-apps/03-module/01-server/01-contract/01-states.md",
      "seen": "172d3ddc"
    }
  ]
}
-->

# Contract Review Rules — Stack-Agnostic

Use these rules as the review gate for any SaaS Plane contract surface, in any stack. Source of truth: the foundation book, `docs/03-capabilities/02-apps/03-module/01-server/01-contract/01-states.md` (constructs), `docs/03-capabilities/02-apps/01-shape/03-architecture.md` (evolution and the generation chain), and `docs/registers/conformance.md` in `spn-foundation`. Apply these to every API change; a rule that fails blocks the change until it is fixed or recorded as a versioned, planned exception.

## The chain

A contract is a chain of six constructs: **Contract** → **Services** → **Methods** → **Command** / **State** → **Events**. **Contract** is one per module — the public behavioral surface of one domain boundary. **Services** are cohesive capability groups; the execution boundary for policy and transactional integrity. **Methods** are one action each, **Command** is intent in, **State** is outcome out, and **Events** are side-effect records. Nothing outside the contract is public.

## States and commands discipline

- **One method = one Command in, one State out.** Never two inputs, never a bare scalar out, never a shape that varies by code path.
- **Commands are forward-compatible and idempotent.** New optional fields may be added; a server accepts commands from older clients unchanged. Retrying the same command yields the same outcome — writes crossing a network boundary carry an idempotency key.
- **Context the runtime already authenticated never rides the command body.** The caller's organization and the caller's own identity come from the auth context. (Deliberate system-path exceptions — where the full actor rides the command — are documented at the contract, not assumed.)

- **A command carries the caller's intent only — never the entity's stored configuration shape.** Server-derived data (masked displays, provider selection, minted secrets and their parameters) is computed server-side and never appears on a command. A client stubbing placeholder values for such fields is the signal the command shape is wrong. Where the input varies by variant, the command family itself is discriminated, each variant carrying only that operation's fields. Shapes designed as pure write input (input types; authored configurations whose secrets ride the write-only half) may embed.
- **States are backward-compatible.** Once published, a field is never removed, retyped, or repurposed. New optional fields may be added at any time. Keep one consistent shape for success, failure, and effects.
- **Events are immutable, minimal, append-only.** Past-tense names (`<Concern>Event`); identifiers, timestamps, type, correlation — never a snapshot, which is wrong the moment its source changes. Write corrections as new events. The queue carries events only — never commands, never states.
- **Enums are stable and additive.** New values may be added; existing values are never renamed or reused; consumers tolerate unknown values from a newer producer.
- **Reuse shared command primitives** (get, bulk get, key lookup, active toggle) before minting a bespoke command for a single id or field.
- **Constants have their own surface at the contract root.** Put contract-grade literals — manifest and artifact file names, markers, error codes, fixed maps — in a dedicated constants file beside the states, never inside a states file. A validator never consumes one: states carry shapes and enums only. The import edge runs one way: constants may read the states' enums, and a states file never reads back. The contract carries no logic anywhere: resolution, derivation and predicates belong to the layer that realizes the contract, never the layer that states it.

## The error model

- Every error is a **structured state**: a stable namespaced machine code (`ERROR.STD.*` or `ERROR.<MOD>.<NAME>`), a message, and a public structured `data` object. Codes are contract constants, never invented at a call site.
- **Category → HTTP status is mapped exactly once.** Services never write raw status numbers; two services cannot report the same condition differently.
- **Retryability is classified, not guessed** — clients branch on code and category, never message text.
- **Anti-enumeration:** an id outside the caller's scope resolves to NOT_FOUND, never UNAUTHORIZED; a failed login is one generic UNAUTHENTICATED regardless of whether the handle exists or which factor failed. Existence itself is the secret.
- **Nothing internal goes outward:** no stack traces, no internal field names, no secrets in `data`.

## Secrets discipline

**Rule zero: nothing retrievable that is secret.** A secret that is never stored cannot leak; a secret that cannot be read back cannot be exfiltrated through the API.

- Keep passwords only as memory-hard hashes — never encrypted, never reversible.
- **Delivered one-time codes are challenge-based:** the challenge stores only a hash of the code, verification atomically checks and burns it, and no delivered code is ever kept as a credential.
- Recovery/backup codes: minted server-side, revealed exactly once at creation in a dedicated response state, persisted only as hashes; each burns on use; regenerating a set invalidates the old one.
- Passkeys: only verified public material persists — never the raw attestation.
- Session tokens: refresh rotation with hashed storage — every refresh burns the old token; a leaked token dies on next use. Follow the same hash-only rule for device-trust secrets.
- **Storage ≠ retrievability — write-only internals.** Some secrets must be stored to be used (authenticator seeds, raw delivery targets, BYOK provider keys). For these, every contract read returns a **masked** state. Unmasked access exists only as an internal server-side capability — never registered as a route — consumed solely by the delivery or verification path. **A secret that must be stored MUST NOT be returnable by any API.** A design that requires reading a secret back out is a wrong design.

## Evolution and versioning

- **Additive by default.** New optional command fields, new state fields, new enum values, new events, new methods — an additive change must not break any existing consumer.
- **Breaking** = removing/renaming a field, changing a type, changing the meaning of a published field or code, tightening validation on an existing command field.
- Treat a breaking change as a **planned, versioned event**: announced ahead, shipped alongside the old version, documented with a migration path, removed only after consumers move. Semantic versioning governs every contract artifact; compatibility is enforced in CI, not remembered.

## The generation chain

The hand-written contract states are the **only** hand-written artifact of the API surface. Validators, the published API spec, the API client, and agent tool schemas are all generated — and generated files are never edited; regeneration is the only edit path. There is no second hand-written client.

## Boundary rule

**Pass cross-module calls through contracts, never internals.** This is what makes the monolith/microservice choice reversible: callers depend on the contract, not the deployment.

## The review card

| # | Check |
| --- | --- |
| 1 | One Command in, one State out per method |
| 2 | Commands idempotent + forward-compatible; auth context never in the body |
| 2a | Commands carry intent only — no stored config shapes, no client-stubbed server-derived fields |
| 3 | States single-object + backward-compatible |
| 4 | Events immutable, minimal, past-tense, append-only; queue carries events only |
| 5 | Errors: namespaced codes, category mapped once, structured public `data` |
| 6 | Anti-enumeration: scope failures reveal nothing |
| 7 | No stack traces / internal names / secrets outward |
| 8 | Change is additive — or versioned with a migration path |
| 9 | No hand edits to generated artifacts |
| 10 | No cross-module reach past a contract |
| 11 | No raw secret at rest; no stored secret returnable by any API; OTPs challenge-based; reveal-once flows use dedicated states |
