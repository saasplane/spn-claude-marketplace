---
name: check
description: Prove or disprove a claim about what a SaaS Plane codebase actually does. Use when the ask is a statement that could be true or false - "verify platform accounts have MFA enabled in migrations", "check that org deletion cascades", "is rate limiting applied to OTP sends", "did we ever implement X". Runs no build and no tests; it locates evidence and reports a verdict with citations. Stack-agnostic.
---

# check — prove a claim against the code

The ask is a **proposition**, not a target. The job is to find out whether the codebase actually does the thing, and to show the reader where you looked.

**This skill runs nothing.** No build, no test suite, no local stack. If the answer needs something executed, say so and hand to `verify` — do not quietly start running gates.

## First: is this a check, or a verify?

Developers say *verify* for both, so decide by the **object of the sentence**, never by the verb:

| The object is… | It is a… | Example |
| --- | --- | --- |
| a statement that could be true or false | **check** — this skill | *"verify accounts have MFA enabled in migrations"* |
| a thing to run gates against | **verify** | *"verify this package"* · *"clean reset and verify"* |
| both, or neither clearly | **ask** | *"verify the auth work"* — the change, or a claim about it? |

A claim usually names a behaviour, a rule, a state of the data, or a past decision. A target names a package, an app, or nothing at all. When it is genuinely ambiguous, ask which is wanted rather than guessing — the two produce completely different work.

## Where the evidence lives

Search by **layer**, in the order that decides the answer fastest. The layer model is the same in every stack, so this order holds regardless of language:

1. **Contract** — is it even expressible? A claim about something a caller can request is settled first by whether a command, a field, or an enum value exists for it. If the contract cannot say it, nothing below can do it.
2. **Migrations and schema** — claims about *stored state, defaults, and constraints* are settled here and nowhere else. A default written in application code is not the same fact as a column default, and a seeded row is not the same fact as a constraint.
3. **Service layer** — the rule itself: the authorization gate, the branch, the validation, the ordering. This is where "is it enforced" is answered.
4. **Entry layer** — whether it is reachable, and under what route, verb, or listener.
5. **Tests** — a passing test naming the behaviour is the strongest single piece of evidence, because it is executable and maintained. Its absence is not disproof, but it is worth reporting.
6. **The symbol index and generated surfaces** — the fastest way to learn whether a symbol exists at all before hunting for its implementation.

Not every claim touches every layer. Read the claim and go where it actually lives.

## Rules of evidence

- **A name is not proof.** A function called `enforceMfa`, a flag called `mfaEnabled`, a constant called `RATE_LIMIT` — each tells you someone intended something. Follow it to the code that acts on it. Naming is the single most common way a check produces a confident wrong answer.
- **A default is not the same as a guarantee.** "Enabled by default" and "cannot be disabled" are different claims; say which one you proved.
- **Configuration is not enforcement.** A value that is read but never branched on is dead, and a gate that exists but is never applied to the path in question does not cover it.
- **Prefer the authority for the kind of claim.** Stored state → the migration. Enforcement → the service. Reachability → the entry. Behaviour → the test. Do not settle a schema claim from application code.
- **Absence of evidence is a finding, not a verdict.** Report where you looked and did not find it — that is what lets the reader judge whether you looked in the right place.

## Report

Lead with the verdict, then the evidence, then the gaps:

| Verdict | Means |
| --- | --- |
| **proven** | evidence found at the layer that decides it, cited |
| **partial** | true under some conditions, or at one layer and not another — state precisely which |
| **not proven** | searched the deciding layers, found nothing. Say where you searched |
| **contradicted** | the code does something different from the claim — the most valuable outcome, so state it plainly |

Cite as `path:line` for every load-bearing piece of evidence, quote the few lines that carry the fact, and close with **what you did not check** and what would settle it — frequently "running the suite", which is `verify`'s job, not this one.

Never soften a *contradicted* into a *partial*. A claim that turns out to be false is the finding the developer most needs.
