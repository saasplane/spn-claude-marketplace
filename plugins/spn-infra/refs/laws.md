<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/02-infra/06-modules.md", "section": "The rungs, and what a path may be", "seen": "24b787b2" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/02-packages/01-manifests.md", "section": "Intent and resolved state", "seen": "86359c7a" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/02-packages/01-manifests.md", "section": "Providers are a pattern, at both scopes", "seen": "b599d3fa" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/02-packages/01-manifests.md", "section": "One packages declaration; the registry derives", "seen": "0f079b44" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/02-infra/04-resources/02-vendors.md", "section": "The blueprint is also a library, and a module's world is its own", "seen": "31aec928" }
  ]
}
-->

# The estate laws — the refusal card

**Source of truth:** the foundation's `docs/02-constructs/02-support/02-infra/06-modules.md`, `docs/04-capabilities/02-support/02-infra/02-packages/01-manifests.md` and `docs/04-capabilities/02-support/02-infra/04-resources/02-vendors.md`. Read this card as a restatement; the book governs. Look for the checkable defect each law names, and raise it before doing anything else.

## 1 · Machines write the environment rung only

The estate's keys — the `{SPC}_ORG_*` · `{SPC}_PLATFORM_*` · `{SPC}_RESOURCE_*` families (RD.INFRA.043) — land in the environment rung and nowhere else. **Every rung ends in the same leaf segment, `vars`** (RD.INFRA.054), because an application carries a seat per deployment beneath it and a path cannot be both a value and a parent of values:

```text
/organization/vars
/platform/vars
/environments/{env}/vars
/environments/{env}/spaces/{code}/vars
/environments/{env}/modules/{code}/vars
/environments/{env}/apps/{app}/vars
/environments/{env}/apps/{app}/deployments/{deployment}/vars
```

The app plane — an application's own rung and the deployment seats beneath it — is **dev-authored; nothing lands there by machine**, with one composed exception: the deploy render supplies the published health-port default into the composition (RD.INFRA.048).

> Defect: a machine write outside the environment rung, or into the app plane past the render's composed defaults — the writer split broke, and a team's value can be silently replaced by an apply.

## 2 · No secrets, no ARNs, no account ids — ever, at any path

Nothing long-lived exists to store. Every provider-assigned value is **discovered** by the tool holding the credential and recorded as resolved state. A value copied from a console is a defect, and that includes the ones a day-zero runbook would have transcribed. Keep credentials in the config plane's stores, whose only readers are the apply and the deploy — never in a manifest, an env file, or a doc.

> Defect: a credential in a manifest or env file — the plane was bypassed, and the value now lives wherever that file went. An ARN or account id anywhere — an identifier was typed, and the estate stopped being reproducible.

## 3 · A person writes choices — and nothing else

Put **coordinates and intent** in a manifest: codes, regions, address index values (append-only, never reused), environments, sizes, hosting, deploy triggers, rows. Everything else is either **derived** (names, addresses) or **discovered** (identifiers) — written by tools, reviewed by nobody, regenerable at any moment.

An environment states its `setup` and its `region` and stops there. It declares **neither its composed `{env}` name nor the cloud provider's own region string** (RD.INFRA.098): a stored copy of a computed value is a second source for one fact, and a published estate carrying `env: "in-prod"` beside `setup: "dev"` resolved as production with nothing to object.

> Defect: a derived name or discovered identifier typed into a reviewed file — it will drift the first time the derivation runs.

## 4 · Provider strings live only inside a cloud entry

Write the provider region in exactly one place — the cloud entry's `regions` mapping (`{ "code": "in", "region": "ap-south-1" }`); capacity classes only in its `profiles`. A region name or instance class anywhere else makes the estate unportable by spelling.

> Defect: a provider string outside a cloud entry — a derivation was bypassed, already drifting.

## 5 · Plan is the review

Review plans from the checkout — unpublished changes must plan. Merge publishes the immutable version; **an apply fetches the published version and applies *that*, never a checkout**. Edit the manifest to bump a pin; versions are typed by a human; estate publishes run from CI once the pipelines stand.

> Defect: an apply that ran from a checkout — the version that ran has no name, and resolved state cannot record it.

## 6 · The module tri-law

> **Additive in its own space — always. Mutating platform ground — never. Needing to — a blueprint feature, not a module power.**

A module composes the baseline's library — publishing a fact, minting a database, a host, a managed resource. The library is scoped by the caller's identity: names and keys compose from the module's purpose code. So an off-grammar name is impossible even deliberately. Nothing alters a platform schema, joins a default group, overwrites an engine's published fact, or enters another module's world. Detach = the reverse of the module's tagged footprint, **data refused** — like every stateful teardown. Any consumer still referencing a detached fact fails by name at the next render.

> Defect: a module rendering reaching platform ground — that need travels as a declaration change, reviewed at the platform's own altitude, never as module code.
