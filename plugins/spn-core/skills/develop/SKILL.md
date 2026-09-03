---
name: develop
description: The contract-first build loop - the order work is done in, what each layer may and may not do, and what must be regenerated before anything is committed. Use when implementing a capability, changing an existing one, or judging whether code sits in the right layer. Stack-agnostic; the stack plugin supplies the per-layer step files and the commands.
---

# develop — contract first, every time

**Write the contract before the thing that implements it.** Not as ceremony: the contract is what generates the validators, the specification, the client, and the tool definitions, so writing it first is what makes those derivations possible at all. Code written before its contract has to be retrofitted into one, and the retrofit is where shapes go wrong.

## The loop

1. **Contract** — the states, then the service interface. One method: one command in, one state out. Write the **intent** as you create each surface; it is harvested into what agents read, and an intent added later is an intent nobody wrote.
2. **Regenerate** — the validators derive from the contract states. They are never hand-written and never hand-edited.
3. **Implementation** — the service behind the contract, plus its storage access. Policy, authorization, and transactional integrity live at this boundary and nowhere else.
4. **Entry** — the transport adapter. Parse input into the command, invoke the service, render the state.
5. **Tests** — at the tier that proves the behavior, not the tier that is easiest to write.
6. **Docs and generated surfaces** — update the seat the change touches in the same change, and regenerate everything derived.

Steps 1–3 are ordered by dependency and cannot be reordered. Steps 4–6 can interleave.

## What each layer may do

| Layer | Owns | Must never |
| --- | --- | --- |
| **contract** | the public surface — commands, states, events, enums, the service interface | contain logic, or reference the implementation |
| **app** | the behavior — services, storage access, internal helpers | be reached by another module, directly or through its storage |
| **entry** | adapting one transport | hold business logic of any kind |

**An entry that cannot be rewritten for a different transport without touching a service is a defect.** That is the test — not whether the code looks thin.

**Cross-module calls go through the other module's contract services, never its implementation and never its storage.** Code that reaches around a contract is a defect regardless of how well it works today, because it is the coupling that makes a module impossible to change later.

## Generated artifacts

**Everything derived is regenerated, never edited.** Validators, export indexes, label manifests, symbol indexes, API clients — the source plus a re-run is the only edit path.

**Regenerate before committing**, and before restarting anything that loads the code. A repo whose generated artifacts disagree with their source fails at runtime rather than at review, which is the most expensive place to find it.

Edit the generator or its source when a generated file needs to be different. An edited generated file is overwritten by the next regeneration.

## The lines that hold

- **A gate carries a permission and an enablement, so classify before you declare one.** A permission says which person may act. An enablement says what the caller's organization type is offered at all. Read `refs/permission-vs-enablement.md` before you write the gate. It settles the code's grammar, whether the term sits on the gate or in the service body, and why you never gate a read.
- **Contracts are additive.** A published field is never removed, retyped, or repurposed; new optional fields may be added at any time. A breaking change is a planned, versioned event with a migration path.
- **Errors are contracts too.** Namespaced codes, each mapped once to a response class, retryability classified rather than guessed. A failure never discloses the existence of something the caller could not otherwise see.
- **Reuse the shared primitives** — get, bulk get, key lookup, active toggle — before minting a bespoke command for a single identifier.
- **Read the interface before using it.** Exact values, exact parameter order, optional versus required, nullable versus absent. Never invent an API; if unsure a symbol exists, look it up in the symbol index or the source.
- **Match the code beside you.** New code is written by pattern-matching its neighbors — same layering, same ordering, same naming, same comment density. A one-off that reads better in isolation reads worse in the codebase.
- **Name things so they need no explanation.** A name that requires a comment saying *what* it is, is the wrong name. Rename before annotating; the only comments worth keeping state a constraint the code cannot show.
- **A doc comment on a published declaration is an interface.** It is harvested into the symbol index, the interface document, the API client and the tool definitions an agent calls — one comment, several surfaces, none written by hand. The full rules are in this plugin's `refs/intent.md`. Four of them matter every day. Write **one sentence** as the opening line. Write it **once on the contract**, so implementations and transport adapters inherit rather than restate. **Never name what the package does not depend on** — no table names, no codes from other packages. And write **constraints as tags** in the same comment, never re-described in prose.

## Lenses

Wear per layer: `refs/lenses/server-dev.md` on contract, service, and entry; `refs/lenses/web-dev.md` on ui; `refs/lenses/trust.md` on any mutation; `refs/lenses/partner.md` while writing contract states. At the close, convene the `spn-panel` subagent with `partner` if the published surface changed, and with `trust` if authorization, audit, or secrets moved.

## Finish

A change is not done when it compiles. It is done when three things hold. The derived artifacts are fresh, the behavior is proven at a tier that means something, and the doc seat the change touched says what is now true. Hand to the test and verify skills for the proving.
