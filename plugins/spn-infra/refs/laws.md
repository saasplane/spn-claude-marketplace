# The estate laws — the refusal card

**Source of truth:** the foundation's `CONCEPT.md` (Estate Manifest · Estate Packages · Estate Modules · Estate Config). This card digests; the book governs. Each law names its checkable defect — raise the defect before doing anything else.

## 1 · Machines write the environment global only

The estate's keys — the `{SPC}_ORG_*` · `{SPC}_PLATFORM_*` · `{SPC}_RESOURCE_*` families (RD.INFRA.043) — land in `/environments/{env}/global` and nowhere else. The app plane `/environments/{env}/{kindcode}` is **dev-authored only; nothing lands there by machine**.

> Defect: a machine write outside the environment global — the writer split broke, and a team's value can be silently replaced by an apply.

## 2 · No secrets, no ARNs, no account ids — ever, at any path

Nothing long-lived exists to store. Every provider-assigned value is **discovered** by the tool holding the credential and recorded as resolved state; a value copied from a console is a defect, and that includes the ones a day-zero runbook would have transcribed. Credentials live in the config plane's stores, whose only readers are the apply and the deploy — never in a manifest, an env file, or a doc.

> Defect: a credential in a manifest or env file — the plane was bypassed, and the value now lives wherever that file went. An ARN or account id anywhere — an identifier was typed, and the estate stopped being reproducible.

## 3 · A person writes choices — and nothing else

A manifest carries **coordinates and intent**: codes, regions, `networkIndex` values (append-only, never reused), environments, sizes, hosting, deploy triggers, rows. Everything else is either **derived** (names, addresses) or **discovered** (identifiers) — written by tools, reviewed by nobody, regenerable at any moment.

> Defect: a derived name or discovered identifier typed into a reviewed file — it will drift the first time the derivation runs.

## 4 · Provider strings live only inside a cloud entry

The provider region is spelled in exactly one place — the cloud entry's `regions` mapping (`{ "code": "in", "region": "ap-south-1" }`); capacity classes only in its `profiles`. A region name or instance class anywhere else makes the estate unportable by spelling.

> Defect: a provider string outside a cloud entry — a derivation was bypassed, already drifting.

## 5 · Plan is the review

Review plans from the checkout — unpublished changes must plan. Merge publishes the immutable version; **an apply fetches the published version and applies *that*, never a checkout**. Pins bump by editing the manifest; versions are typed by a human; estate publishes run from CI once the pipelines stand.

> Defect: an apply that ran from a checkout — the version that ran has no name, and resolved state cannot record it.

## 6 · The module tri-law

> **Additive in its own space — always. Mutating platform ground — never. Needing to — a blueprint feature, not a module power.**

A module composes the baseline's library — publishing a fact, minting a database, a host, a managed resource — and the library is scoped by the caller's identity: names and keys compose from the module's purpose code, so an off-grammar name is impossible even deliberately. Nothing alters a platform schema, joins a default group, overwrites an engine's published fact, or enters another module's space. Detach = the reverse of the module's tagged footprint, **data refused** — like every stateful teardown.

> Defect: a module rendering reaching platform ground — that need travels as a declaration change, reviewed at the platform's own altitude, never as module code.
