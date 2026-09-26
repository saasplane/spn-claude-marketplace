<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/02-skills.md", "seen": "716e5e8e" },
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/04-develop.md", "seen": "1a1125a4" }
  ]
}
-->
---
name: review
description: Read an estate plan or a declaration diff back before anything applies - what a plan must name, what it must never contain, and how a declaration change is presented as one line per choice. Use before any --apply or --approve, when a plan output needs a verdict, or when checking that a declaration change renders exactly what was intended and nothing more.
---

# review — the plan is the review

**Review plans from the checkout — unpublished changes must plan; merge publishes; an apply fetches the published version and applies that, never a checkout.** Treat the plan, therefore, as the one artifact a human judges. A plan comes from `spnutils infra <layer> up --plan` (add `--cloud` for the cloud form, `--json` for a machine-readable one); a teardown's plan comes from `down --plan`. Hold it to both lists below and give a named verdict.

## Mode: a declaration diff

Present a manifest change as **one line per choice** — what was chosen, at which scope, and what will derive from it:

```text
+ environment in-stg (region in, NP, size XS, CLUSTER, deploys from branch develop)
    → derives network spn-dmo-in-stg, namespaces in-stg-*, records in-stg-*.internal.spndemo.app
+ app grant splt: API (PRD, 9120) + PROCESSOR (PRD)
```

Never present a raw JSON dump as the review, and never bury a choice inside a reformat. Check each line against the typed/never-typed split in the `implement` skill — a derived name, a discovered identifier, a secret, an ARN, an account id or a provider string outside a cloud entry is a finding, not a detail. The declaration change rides a pull request (`refs/support/infra/laws.md`, plan-is-the-review).

## Mode: a plan — what it MUST name

- **Every resource in grammar form** — `{org}[-{spc}][-{env}]-{noun}` (`refs/support/infra/naming.md`, in this plugin). A name that cannot be composed is a defect, not a style issue.
- **The full 12-tag set on every creation** — deny-on-missing holds; a resource planned without the set will be refused at apply, so flag it now.
- **Where each layer's declaration resolved from** — `spnutils infra show`: PINNED @ version, or a path. A cloud plan must show pins.
- **Exactly the declared scope, nothing more.** The organization plan names root + the internal seats (`cc` · `log` · `audit`) + the registry pairs + zones + guardrails — and nothing else. An environment plan builds network → resources → compute, in order. An unexplained extra resource blocks.
- **The engine records** — `{env}-database` · `{env}-cache` · `{env}-queue` into `internal.{spd}` — on an environment plan, pointing at whatever the hosting rendered.

## Mode: a plan — what it must NEVER contain

- **A bare hostname** — the grammar is uniform; PROD keeps `{env}` like every environment.
- **A provider hostname in a published fact** — facts use the engine-record names; the provider endpoint stays behind the record.
- **A secret, an ARN, an account id, or any identifier a person typed** — identifiers are discovered at apply and land in resolved state, never in a plan's inputs.
- **A write to the app plane** — `/environments/{env}/{kindcode}` is dev-authored; blueprints and modules write globals only.
- **An off-grammar or untagged resource** — including anything a module minted outside its own purpose-coded space.
- **A stateful destroy inside an ordinary down** — data destruction is a separate, named, confirmed act, asked for with `--clean`.

## Refusals are the gate working

A cloud plan refusing a **path-resolved declaration by name**, or a **missing layer below by name**, is correct behavior. Fix it by publishing and pinning, or by standing the layer below — never by working around the refusal.

## The verdict

Use one of two closing forms, each row citing the plan line and the rule:

```text
APPROVE — every resource composed and tagged; scope exact; resolution pinned per layer.
BLOCK   — <resource / line>: <which rule above>, <what must change before --apply>.
```

Approval itself is a human act — this skill produces the verdict, never the `--apply --approve`.
