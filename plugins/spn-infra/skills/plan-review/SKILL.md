---
name: plan-review
description: Reviewing an estate plan (spnutils infra <layer> plan [--cloud]) before any approval - what a plan must name and what it must never contain. Use before any --approve, when a plan output needs a verdict, or when checking that a declaration change renders exactly what was intended and nothing more.
---

# plan-review — the plan is the review

**Review plans from the checkout — unpublished changes must plan; merge publishes; an apply fetches the published version and applies that, never a checkout.** The plan is therefore the one artifact a human judges. Hold it to both lists below and give a named verdict.

## What a plan MUST name

- **Every resource in grammar form** — `{org}[-{spc}][-{env}]-{noun}` (`refs/naming.md`). A name that cannot be composed is a defect, not a style issue.
- **The full 12-tag set on every creation** — deny-on-missing holds; a resource planned without the set will be refused at apply, so flag it now.
- **Where each layer's declaration resolved from** — `infra show`: PINNED @ version, or a path. A cloud plan must show pins.
- **Exactly the declared scope, nothing more.** The organization plan names root + the internal seats (`cc` · `log` · `audit`) + the registry pairs + zones + guardrails — and nothing else. An environment plan builds network → resources → compute, in order. An unexplained extra resource blocks.
- **The engine records** — `{env}-database` · `{env}-cache` · `{env}-queue` into `internal.{spd}` — on an environment plan, pointing at whatever the hosting rendered.

## What a plan must NEVER contain

- **A bare hostname** — the grammar is uniform; PROD keeps `{env}` like every environment.
- **A provider hostname in a published fact** — facts use the engine-record names; the provider endpoint stays behind the record.
- **A secret, an ARN, an account id, or any identifier a person typed** — identifiers are discovered at apply and land in resolved state, never in a plan's inputs.
- **A write to the app plane** — `/environments/{env}/{kindcode}` is dev-authored; blueprints and modules write globals only.
- **An off-grammar or untagged resource** — including anything a module minted outside its own purpose-coded space.
- **A stateful destroy inside an ordinary down** — data destruction is a separate, named, confirmed act.

## Refusals are the gate working

A cloud plan refusing a **path-resolved declaration by name**, or a **missing layer below by name**, is correct behavior — the fix is to publish and pin, or to stand the layer below, never to work around the refusal.

## The verdict

Close with one of two forms, each row citing the plan line and the rule:

```text
APPROVE — every resource composed and tagged; scope exact; resolution pinned per layer.
BLOCK   — <resource / line>: <which rule above>, <what must change before --approve>.
```

Approval itself is a human act — this skill produces the verdict, never the `--approve`.
