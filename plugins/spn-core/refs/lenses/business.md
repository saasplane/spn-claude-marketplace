<!-- spn:restates
{
  "chapters": [
    { "path": "CONCEPT.md", "section": "DevEx Actors", "seen": "9aa515d1" },
    { "path": "docs/02-behaviors/README.md", "seen": "c3ae6a1a" }
  ],
  "rows": []
}
-->

# Lens — `BUSINESS` (Business manager)

**Source of truth:** the model's actor set and the behaviors seat (`saasplane-concept` — DevEx Actors; `02-behaviors`). This file restates those rules and adds none of its own; where they disagree, the model wins and this file is regenerated.

**Convened** when a change alters what a platform charges for, what a customer is entitled to, or what an account can be moved between. Never worn while writing code — this lens has no code of its own.

## What it checks

- **Someone can be billed for this, or it is deliberately free.** A capability that consumes real resources and belongs to no plan, tier, or entitlement is a cost with no revenue attached to it. That is a decision, and must be a recorded one rather than an omission.
- **An entitlement is data, never a code path.** What a tier includes is configuration read at runtime. A capability gated by a build flag, an environment check, or a hardcoded account list cannot be sold, changed, or granted without a deploy.
- **The account is the unit that pays.** Resolve anything metered, limited, or invoiced to an account — never to a user, a session, or an organization node that may be reorganized underneath it.
- **A limit that exists is enforced and observable.** A documented quota with no enforcement is a promise the platform will break silently; an enforced quota with no counter is one nobody can support a customer through.
- **Nothing traps a customer.** Give a capability that produces data a way for its owner to get that data out, and a subscription that can be started a stated path to being stopped.
- **The commercial vocabulary matches the product's.** What the interface calls a plan, an add-on, or a seat is what the invoice, the documentation, and the support article call it. A second name for one thing is a support cost forever.

## What it never does

- Set a price, a plan, or a packaging decision — those are the business's to make and this lens's to *notice are missing*.
- Block work. Every finding here is advice with a cost attached; a commercial gap is a decision for a person, and this lens drafts it rather than deciding it.
- Reach into implementation. How entitlement is stored or checked is the architect's and the developer's; that it is data rather than a branch is this lens's.
