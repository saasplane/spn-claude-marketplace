<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/04-develop.md", "seen": "1a1125a4" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/04-develop.md", "seen": "15172f72" }
  ]
}
-->
# Develop — the contract first, and why that is the opposite of ceremony

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/04-develop.md` and `04-capabilities/01-devex/01-function/04-develop.md`. Read this as the restatement; the book governs.

**The `develop` skill walks the steps. This says what they are for**, so a step you are tempted to skip is one you can judge rather than guess at.

## Why the contract comes first

**Writing the contract first sounds like ceremony and is the opposite.** The contract is what generates the validators, the published specification, and the client other systems call. Write it last and every one of those is hand-made — and hand-made copies of one fact are what drift.

**Layering is not a matter of taste settled per feature.** The layers are a published vocabulary, and what each may reach is fixed.

## What each layer may do, and never do

| Layer | May | Never |
| --- | --- | --- |
| `contract` | declare states, commands and events | reach a database, a queue or another module |
| `app` | hold the logic — authorization, transactions, the repository | be reached from outside its module |
| `entry` | adapt one way in — `api` · `queue` · `cli` on the server, `ui` on the web | hold logic of its own |

**Steps one to three are ordered by dependency and cannot be reordered.** Not a preference — the later steps read what the earlier ones generated.

## The rules that carry the weight

**Authorization is classified before it is written**, not decided while writing the handler. A permission worked out inside a service is a permission nobody can audit from the contract.

**Everything derived is regenerated, never edited.** Change the source and re-run its generator. A hand edit to a generated file works, ships, and disappears at the next generation — taking whatever it was fixing with it.

**A published comment is an interface.** It travels with the symbol to somebody who will never read the implementation, so it is written for them.

## The boundary

**The phase never provisions and never releases.** If you are bringing infrastructure up, you are in `provision`; if you are cutting a version, you are in `deliver`. A develop step that does either has crossed a gate nobody watched.
