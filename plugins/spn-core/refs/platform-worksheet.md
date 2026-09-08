<!-- spn:restates
{
  "chapters": [
    {
      "path": "CONCEPT.md",
      "seen": "ddc8bfaa"
    },
    {
      "path": "docs/03-capabilities/01-saas/README.md",
      "seen": "3e7085be"
    },
    {
      "path": "docs/02-behaviors/01-decide.md",
      "seen": "aec58547"
    },
    {
      "path": "docs/02-behaviors/02-design.md",
      "seen": "dedc1b3d"
    }
  ]
}
-->

# New-Platform Intake Worksheet

The one-page artifact every new SaaS Plane platform starts from. Fill every row **before** any repository, manifest, or scaffold exists — adoption types these values into manifests, and a manifest is the wrong place to discover a decision was never made. The completed worksheet lands as the **coordinates section of the repository's `CONCEPT.md`**, produced by the `ideate` skill — coordinates settle here; the boundary, domains and surfaces are the concept's own job. Source of truth: the foundation book (`spn-foundation`), `docs/03-capabilities/01-saas/` and `docs/02-behaviors/01-decide.md` / `02-design.md`. SPN Demo (org `spn`, platform `dmo`, domain `spndemo.app`) is the book's sample platform, shown as the example column.

Expect every row to be consumed verbatim by a later step; nothing here is a throwaway answer.

## 1. Platform identity

| Field | What you decide | Example (SPN Demo) | Your platform |
| --- | --- | --- | --- |
| `{spc}` | Platform code — 3 letters, lowercase, **permanent**. Appears in cloud account names, CIDR derivations, config paths; never renamed. Pick it like a stock ticker. | `dmo` | |
| `{spn}` | Brand name — UI and documents only | `SPN Demo` | |
| `{spd}` | Platform domain — roots the public and private DNS zones. The marketing site lives on a **different domain entirely** — a marketing page inside `{spd}` would sit inside the session cookie's scope. | `spndemo.app` (marketing on `spndemo.com`) | |
| `{org}` | Company code (infra plane) — the organization running the platform; a company operating several platforms declares one `{spc}` per platform under one `{org}`. | `spn` | |

## 2. Organizations — archetype as tier activation

One organization tree, six node types; the business shape is a choice of which tiers to activate — activating more later is configuration, not migration. Record where you **launch**, not everywhere you might go.

| Archetype | Activate | Shape |
| --- | --- | --- |
| B2C | `ACCOUNT` (of one) | consumer app; the Account is the user |
| B2B | `ACCOUNT` | workspace per client organization |
| B2B2C | `ACCOUNT` + `ACCOUNT_CONSUMER` | clients serve their own consumers |
| B2B2B | `ACCOUNT` + `ACCOUNT_ENTERPRISE` | clients with divisions / member businesses |
| Marketplace | `PLATFORM_ENTERPRISE` + `PLATFORM_CONSUMER` | sellers and shoppers on the platform itself |

(`PLATFORM` — the root — always exists; the Account is the tenancy boundary for isolation, residency, entitlements, and billing.)

| Field | Your platform |
| --- | --- |
| Archetype(s) at launch | |
| Tiers to activate | |

## 3. Apps and surfaces

Each active tier gets exactly one application surface, plus the shared `IDENTITY` surface (signup, login, self-service — business apps never implement login). Decide which surfaces ship at launch and which consumer touchpoints exist:

| Field | What you decide | Example | Your platform |
| --- | --- | --- | --- |
| Surfaces at launch | Which per-tier apps + `IDENTITY` ship on day 1 | `PLATFORM`, `ACCOUNT`, `IDENTITY`, marketing site | |
| Touchpoints | Marketing (its own domain, never inside `{spd}`), the app hosts (`{env}-{app}.{spd}` — the grammar is uniform, production keeps `{env}` like every other environment), tenant subdomains (`{env}-{tenant}.{spd}` canonical; a pretty name is a site entry), custom domains | `in-prod-acme.spndemo.app`, custom domains allowed | |
| Other channels | Omni-channel gateways (voice, email, WhatsApp, raw API) that resolve into the same org+app context | — | |

## 4. Regions and setups

| Field | What you decide | Example | Your platform |
| --- | --- | --- | --- |
| Regions `{region}` | ISO 3166-1 alpha-2 launch list + residency: where must each Account's data stay? | `in` — client data stays in India | |
| Setups `{setup}` | Lifecycle instances: `dev` · `uat` · `stg` · `prod` (+ `demo`, customer-dedicated as catalog rows) | `dev`, `uat`, `prod` | |
| Environments `{env}` | The provisioning list, `{region}-{setup}` — the only per-environment intent ever declared | `in-dev`, `in-uat`, `in-prod` | |

Workloads (`np` · `stg` · `prod` account isolation) derive from the setup catalog — nobody chooses them per environment. A customer-dedicated installation is a setup-catalog row, not a fork.

## 5. Compliance targets

Name the **program you are running**, not certificates you hold — certification is a milestone of the program. Check every commitment in scope:

| Target | In scope? |
| --- | --- |
| SOC 2 Type II | |
| ISO 27001 | |
| ISO 27701 | |
| GDPR | |
| CCPA | |
| PIPEDA | |
| Other (sector-specific — name it) | |

Compliance is structural from the first deployment — isolation, audit, and residency are never a later edition. A dealbreaker here (an obligation the envelope's design inputs do not cover) must surface **now**.

## 6. Vendor integrations — the system-provider registry

Every external capability is a governed provider behind a typed seam, configured per organization (platform defaults + optional Account bring-your-own-key overrides). Decide the launch providers per category:

| Category | Mandatory at boot? | Platform default provider | BYOK allowed for Accounts? |
| --- | --- | --- | --- |
| Email | Yes | | |
| SMS | Yes | | |
| Storage | Yes | | |
| WhatsApp | No | | |
| Payments | No | | |
| Model providers (LLM / TTS / STT) | No | | |

Rules: no product module ever talks to a vendor SDK directly; credentials are write-only (masked reads, internal-only delivery path); every hard dependency has an articulated exit.

## 7. Stack

| Field | What you decide | Your platform |
| --- | --- | --- |
| Language stack | Which conformant stack — `ts` is the one shipping today | |

## Where each row lands

| Row | Consumed by |
| --- | --- |
| `{spc}` / `{spn}` / `{spd}` / `{org}` | The platform and company manifests on day 1 of adoption; every derived name in the estate |
| Tiers | Tier activation on the organization tree when the platform modules boot |
| Surfaces | The app catalog and app-site routing seeded at platform setup |
| Regions + setups + environments | The region table, setup catalog, and `environments[]` list in the manifests |
| Compliance scope | The compliance-envelope program targets — and the seed of the public trust page |
| Providers | The system-provider registry seeds (email/SMS/storage fail fast at boot if type or keys are missing) |
| Stack | Which support packages and which stack plugin get installed |

## Exit criterion

The worksheet is complete when every row is filled — including the ones that forced a real decision, `{spc}` and residency — and no dealbreaker surfaced. The last requirement is a named owner who carries the worksheet into adoption.
