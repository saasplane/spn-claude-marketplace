<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/03-platform/01-core/04-data-and-trust.md", "seen": "1fb3216d" },
    { "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/04-data-and-trust/", "seen": "02b2a63a" }
  ]
}
-->

# Data and Trust

What the platform already gives you: an ownership rule for every piece of data, a classification taxonomy that dictates handling, an authorization check that runs before every mutation, and an append-only trail that records the result either way. Do not add a second permission check inside a service body, a bespoke audit table, or your own sensitivity tagging scheme — call the platform's, and read this before you decide where a new store's data lives.

## Every piece of data has exactly one owner

The owner of a piece of data is a node on the tenancy tree — nothing else, and no second scheme layered over it.

| Level | Holds | Follows |
| --- | --- | --- |
| the platform's own | operational and compliance data belonging to the root organization | the platform |
| an account's | everything a customer organization creates — business records, documents, usage | the account, and its descendants |
| a person's | an identity's own profile, preferences and consent | the person, across every organization they act in |

When you query, query inside one owner's level; that needs no reference at all. The moment a read crosses levels — an audit process reading account data, a support tool reading a person's profile — it becomes a **cross-schema reference**, and it MUST go through a governed surface the caller reaches for on purpose, never a join a query planner is free to take on its own.

Personal data follows the person rather than any organization — that is what lets a data-subject request follow somebody wherever they went, while every action they took is still recorded against the organization they acted in at the time.

## Classification

Every store you create carries a classification that dictates its handling — encryption, retention guidance, and whether it must stay inside its region:

```ts
export enum DataSensitivityType {
  PUBLIC = 'PUBLIC',              // openly publishable
  INTERNAL = 'INTERNAL',          // for people inside the organization holding it
  CONFIDENTIAL = 'CONFIDENTIAL',  // limited within that, and damaging if it left
  RESTRICTED = 'RESTRICTED',      // the tightest handling a severity alone can ask for
  PII = 'PII',                    // personal data — an obligation, not a severity
  PHI = 'PHI',                    // health data — a different obligation, and a different regulator
}
```

`PII` and `PHI` are levels of their own rather than shades of `RESTRICTED` — that is the whole reason the list is not four long. Write the handling rule for the obligation the data carries, not for a severity you guessed at, and a reader will not have to guess which "restricted" things carry which regulatory duty.

Classify at the level of one field, not one table — that is what lets an export redact a sensitive field while still shipping the ordinary one beside it, and what lets a deletion request remove a health note without destroying the record's audit history around it.

## Authorization runs before every mutation, every time

Every mutation is authorized against the acting principal's granted roles, and the check runs every time, not once at sign-in. **Least privilege follows directly**: a principal reaches exactly what its roles say, with no ambient capability and no path around the check.

Put the authorization check **before** the service runs, never after — MUST. A refused mutation must never touch storage at all. Which roles and permission codes exist is the tenancy model's to state; write the check so it reads that resolution rather than reimplementing it.

## The trail is evidence, not a claim

Every authorized mutation, and every attempt at one, lands on one append-only trail. Its contract has no update and no delete — a record you can edit is not evidence, it is a claim wearing the shape of one. Do not build an audit table your own module can update; write into the shared trail instead, fire-and-forget or through the idempotent queue seam.

The trail exists so one sentence is always answerable from evidence rather than reconstructed after the fact: *which principal performed which action, in which organization, under which policy — and was it allowed?* Read that sentence as the acceptance test for every capability you build on this foundation.

A record names its actor explicitly rather than having the trail derive one from the request — some of the most important records are written where there is no session to read from: a failed sign-in before anybody is authenticated, a security event about somebody else, a scheduled job with no person behind it. An identity's own self-service happens in no organization at all, so a record like that carries no organization and no membership, rather than an invented one.

An audit record captures four facets, and when you write one, fill in what you actually know rather than reach for a placeholder:

| Facet | Fields |
| --- | --- |
| Actor | principal, identity, display name — including pre-auth and system actors |
| Surface | app, app site, session, device, IP address, user agent, request id |
| Event | category, action, name, severity |
| Subject | entity type and id the action touched |

Reads of the trail are organization-scoped from the caller's own authorization context — a partner integrating a compliance or support tool reads through that same scoping, never a raw table.

## Retention and privacy are policies, not constants

Retention and privacy are not platform-wide constants — they are one organization's own **data policy**, layered over a platform default per tenancy tier:

| Layer | Scope |
| --- | --- |
| Platform default (one per tenancy tier) | seeded by the platform; complete — every section populated |
| Organization override (one per organization) | partial — an unset section inherits the tier default |

| Section | Setting | Meaning |
| --- | --- | --- |
| retention | `userDataDays` | active-user personal data retention; `0` = keep indefinitely |
| retention | `inactiveUserDays` | deactivate/purge after this much inactivity; `0` = never |
| retention | `auditLogsDays` | audit-log retention |
| retention | `deletedUserDays` | grace window between soft-delete and hard-delete |
| privacy | `allowDataExport` | permit data-subject export |
| privacy | `allowDataDeletion` | permit hard erasure |
| privacy | `anonymizeOnDeletion` | anonymize in place instead of hard-deleting |

Read the **effective policy** — the section-by-section merge of the two layers — never the seeded defaults directly; that is what lets a platform default evolve without drifting away from what every organization actually reads.

**Unlike an auth policy, a data policy resolves whole: the nearest layer holding one wins entirely, and it does not merge attribute by attribute.** Retention has no agreed direction — longer is stricter for an audit obligation, shorter for a privacy one — so merging two organizations' answers would produce a promise neither of them made. If you are writing a purge job or a data-subject flow, consult the effective policy every time rather than a constant you hard-coded once; the policy store and merge are implemented, but enforcement is a per-module responsibility, so until your module consults it, the policy is advisory for the data your module owns.

## Disclosure

Nothing sensitive is stored where a caller can read it, and nothing is decided there — a control the browser hides is a courtesy, the server refusing the call is the guard. When you write an error path, disclose only what to do next, never what the platform is made of — MUST NOT leak a stack detail, an internal identifier, or anything that turns an error message into a reconnaissance tool.

Every guarantee on this page carries a test identified by a behaviour id, so a trust claim is never just a sentence nobody checked — write your own guarantees the same way, with a case that proves them, so a guarantee that stops holding shows up as a red test rather than a paragraph that quietly became false.

## The five pre-ship questions

Before you ship a new capability, answer all five — a design that cannot answer one of them is not finished:

| # | Question | Answered by |
| --- | --- | --- |
| 1 | Tenancy & isolation — which organization owns each record, and how is the account boundary held? | the tenancy model |
| 2 | Residency — which `{env}` does the data live in, and does it stay in its region? | the classification and the environment coordinate |
| 3 | Least privilege — which principals, holding which roles, can reach it, and provably no one else? | the tenancy model's roles and permissions |
| 4 | Auditability — does every access answer the auditability test? | the append-only trail |
| 5 | Contract-reachability — is the capability reachable only through its declared contract? | the surfaces model |

Retrofitting an answer under deadline is what happens to a capability that shipped without asking these first.

## What this replaces

| If you are about to build | Stop — the platform already has it |
| --- | --- |
| a second permission check inside a service body, beside the declared gate | one gate, declared once on the contract service method |
| a custom `audit_events` table your own module writes and updates | the shared append-only trail, written fire-and-forget or through the queue seam |
| a home-grown "sensitivity" enum per module | `DataSensitivityType`, applied at the field |
| a per-module retention constant | the organization's effective data policy, read fresh each time |
| an error response that echoes an internal exception message | a disclosure-safe failure — tell the caller what to do, never what broke |

## Left out

The residency worked example (an insurance platform's CSV export walked through all five pre-ship questions) is left out — it is a teaching illustration in the capability chapter, not a rule you would cite. The schema-change discipline (append-only, forward-compatible, because both versions run during a deploy) is left out of this file; it belongs beside the migration tooling a module author actually runs, not beside the ownership model.
