<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/01-core/03-surfaces.md",
      "seen": "f0167c70"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/03-surfaces/",
      "seen": "7b823ad7"
    }
  ]
}
-->

# Surfaces

What the platform already gives you: an application catalog of rows on four app scopes, a site row that turns a host into an organization and an application, the coordinates a running instance carries, the namespaces that divide who owns a service, and a ladder public routes charge for arriving on. Do not add a `?tenant=` parameter, a frontend-parsed subdomain, or a bespoke rate limiter — the platform already resolves a request before any handler runs, and a parallel resolution is a second place that can disagree with the first.

## What a surface is

A surface is defined by **who reaches it**, never by its technology. An operator console and a customer portal differ in what may be reached, what is shown on failure, and what is logged — that is the whole difference. The API is a surface under the same rules: a capability reachable through the UI but not the API is an accident, and the reverse is a security finding.

## The app catalog: rows on four app scopes

An application is a row on one app scope. There are four app scopes, they are closed, and the core branches on them. What a platform builds on top is rows: it adds an application by adding a row, and no catalog of seven is released with the platform.

```ts
export enum AppScopeType {
  IDENTITY = 'IDENTITY',      // the shared hub — serves no org category, and is where signing in happens
  PLATFORM = 'PLATFORM',      // the platform's own console
  ENTERPRISE = 'ENTERPRISE',  // a door for the categories of the enterprise org type
  CONSUMER = 'CONSUMER',      // a door for the categories of the consumer org type
}
```

An app is a sign-in surface and nothing else. It owns its permission set, and an org category names the app that serves it, so the link runs one way and an app lists no categories. The categories an app serves are found by reading the categories that name it, and they all sit on the app scope's org type. The account console, a merchant's portal and a shopper's storefront are three apps, two of them on `ENTERPRISE` and one on `CONSUMER`. A host such as `api`, `auth` or `www` is a host and not an app, so it has no row.

`PLATFORM`, `ENTERPRISE` and `CONSUMER` each match an org type, and `IDENTITY` is the one that does not. The identity application serves no category of its own — generic self-service, never a governed business surface — and it is where authentication always happens. A business application hands a visitor off carrying its site, and gets back a session bound to what that site resolved. **A permission is per app. An enablement is per organization**: its category's cell, narrowed by every org above it. The app catalog decides what a person may do inside a surface they can already reach, and enablement (in the tenancy model) decides whether their organization is offered that surface at all.

## Org app sites: routing as data

A host is only ever a string a caller sends. The **org app site** is the one row of data that turns it into something meaningful:

```ts
export interface OrgAppSite {
  id: CDTString;            // the site itself — what a caller names, and what a minted session records
  host: CDTString;          // the address a browser or a client asks for; unique across the platform
  appId: CDTString;         // the application this host opens, which fixes the app scope it serves
  orgId: CDTString | null;  // the ANCHOR organization; null is a shared site, resolved by the application's app scope
  isActive: CDTBoolean;     // whether the host answers at all
}
```

Never read the anchor as the bound organization — MUST NOT. A site anchored to one organization resolves handles within it and its descendants; a shared site has no anchor at all, and resolves across every organization a person belongs to at the application's app scope, pausing for an explicit choice when more than one matches. The organization a session ends up bound to is whichever the person picked or turned out to belong to — that is why the fields are separate.

You resolve a request in two reads and no code: the host finds the site's application, its anchor and its branding; the site then carries that context into sign-in, where the server — never the client — resolves it to the organization, application and scope a session will bind to. A caller sends a host and nothing else about itself, which is what makes the site behave like a registered client identifier: nothing a caller asserts can put it on an organization its site does not name.

**A new customer touchpoint is a row somebody adds, never a release somebody ships.** If the developer wants to onboard an organization onto its own branded domain, add that organization's org app site, a row naming the host, the application, and the owning organization — no code changes, and no deploy. The host serves because the running platform writes its route — which environment and application it opens — through the edge seam, and never a DNS record (`RULE.SUPPORT.INFRA.105` · MUST · skill:spn-infra/run); deactivating the site deletes every host's route.

## Custom domains

An organization can bind its own domain to a site instead of using the platform's shared one. The domain is globally unique and first come, first served, and the binding moves through the same state machine carried in the Identity ref (`OrgAppSiteDomainStatusType` — `PENDING` → `ISSUING` → `ACTIVE`, or `REMOVING` / `FAILED`), behind the edge seam, which issues, binds and routes. An `ACTIVE` domain serves through its route, the customer's own DNS points it at the platform, and teardown runs unroute, unbind, revoke, delete.

## The coordinates an instance runs under

| Coordinate | Axis | Answers |
| --- | --- | --- |
| Region | governance | Where may data live? — declared once for the platform, never composed by hand |
| Setup | purpose | What is this instance for? — a free label; nothing is derived from it, not posture, not policy, not caution |
| Environment | provisioning | `{region}-{setup}` — the unit that is actually provisioned, named, monitored and costed |
| Workload | isolation | `NP` or `PROD` — the blast-radius boundary, and the only source of posture |

**Two environments are structurally identical and differ only in the coordinates they declare.** Any two environments hold the same components; a difference that cannot be expressed as workload, size or hosting is a design fault, not a case for a special environment. **Nothing crosses** — data, credentials and identity never span two environments.

A **workload** is neither geography nor purpose. Availability, backup retention and deletion protection all read from it, never from the setup label — a mistake in a non-production environment cannot reach a production one by construction. A customer-dedicated installation is an ordinary setup row with its own label and a `PROD` workload, provisioned by the same machinery as everything else — dedicated is a row, never a special architecture.

These four coordinates are estate declarations, read from the platform's own manifest, not platform contract terms — do not branch a module on one directly.

## Three namespaces, divided by who owns a service

| Namespace | Is | Owned by |
| --- | --- | --- |
| Product | the business logic that differentiates this platform | the adopting team |
| Platform | the shared standard library every product service builds on | SaaS Plane |
| Vendor | an external capability consumed behind a governed seam | shared — engineering integrates, the vendor operates |

The namespace token a scheduled deployment declares is a **blast-radius and exposure boundary, never an organizational one** — teams do not get namespaces. A vendor is reached only through a seam it does not define, which is what makes it replaceable without a rewrite when it fails. A service namespace is not a service domain: a service domain is an additional DNS apex the estate manages, with its own zones and certificates — nothing about a namespace decides DNS, and nothing about a domain decides ownership.

The platform namespace's core is nine shipped modules — MDM, IAM, ORG, CMP, DOC, ENT, NTF, JOB, LNG — each a strict module with its own contract, implementation, entries and migrations, independently removable, each declaring its own upstream dependencies. **One test draws the boundary between platform and product: if a second product would need it, it is platform.**

When you meet a new need, enter it at the cheapest rung, and descend only with justification — MUST:

1. Use an existing platform capability as it ships.
2. Extend it via configuration — auth policies, custom fields, tags, templates, providers.
3. Generalize it into the platform's standard library, if the need recurs.
4. Build it as an app-owned module, only when the capability is genuinely domain-specific.
5. Write customer-specific code, only as a named, governed exception.

If you catch yourself skipping a rung, price it honestly before you write the code — that is usually a need nobody priced honestly.

### Providers: vendor access as configuration

Every core external integration is a configured provider record owned by an organization, not code. That covers email, SMS, WhatsApp, storage, payments and model providers. The first run gives the platform one `DEFAULT` provider of each category. Email, SMS and storage are required, so platform setup fails fast if their type or keys are missing. Any org may register its own provider for a category (bring-your-own-key), and its traffic uses that one instead of the platform default. The caller names the org to start from, and the resolver walks up from it to the nearest org with a provider of that category, then to the platform's. Credentials are write-only. Normal reads return masked records, and only the server-side delivery path can read them unmasked, through internal-only methods.

Never call a vendor SDK directly from an app-owned module you write — MUST NOT. Switching a vendor is a configuration change on the provider record, never a redeploy.

## A public door pays for arriving a different way

Every authenticated route charges its caller a session. A public door — a registration, a one-time code, a password reset — has nothing to charge, because handing out an identity is exactly what the door is for. That does not make it free to open: it still provisions a tenant and still sends a message somebody pays for, whether or not the caller meant to arrive.

So a public door charges for the **attempt**, on two rungs the route declares for itself, and neither implies the other:

| Rung | What it counts | What a refusal does |
| --- | --- | --- |
| rate limit | how many calls one address may make over a window | refuses outright, with no way back inside the window |
| proof of person | the attempt past which a caller must show they are one | refuses, and hands back the challenge that solves it |

**The first attempts are always free.** A challenge on the very first request costs real sign-ups from legitimate callers and catches nothing a counter would not have caught a moment later.

Never put verification inside the framework layer — MUST NOT. The seam runs between counting and verifying: counting is the same question on every route in every application, so the framework owns it with its own store; verifying calls a vendor the developer chose, so the application owns that. If you declare a rung, you owe it an answer — a route asking for proof of person needs a challenge to hand back, supplied by the application's own authentication handler, the same bargain an authorization declaration already strikes.

Boot-check that a route asking for a protection has one wired — MUST. Write the route so it refuses to boot when the application never wired the protection it asks for, so you find the gap at start-up rather than from an invoice.

Nothing in the challenge exchange is a secret — it carries which vendor and the public material that vendor expects, and a solution names its own kind, because a service that inferred the verifier from whatever is configured right now would reject a solution to a challenge issued a minute before a vendor change.

**A public update proves the caller holds what it acts on, and a public route always declares a limit.** A public command that writes declares `proof: true` — MUST — and its command carries a token that the module checks in its own query on every call; a refusal answers not-found, and the module's refusal test is the evidence. Every PUBLIC route declares a rate limit — MUST — and a call through a route that declares none is refused. The server resolves the site from the request's `Origin`, a browser fact a script can forge, so a command whose `orgAppSiteId` names another site than the request's `Origin` answers not-found. The site narrows what a visitor is shown and never keeps anything secret: it is never the only thing between a visitor and an unpublished or token-guarded row.

**A threshold is set for the crowd behind one address.** Both rungs bucket on the caller's address. If you tune a rung as though somebody were alone behind it, the threshold locks out the building — a whole office, or a mobile carrier's region, reaches a public door through one address.

An unreachable vendor refuses the request — the harsher of the two readings, and the right one, because the operations a captcha guards provision organizations and deliver codes. A deployment with **no** vendor configured is the opposite case and passes callers through, because failing every public door on a deployment that never chose a vendor is not a protection.

## What this replaces

| If you are about to build | Stop — the platform already has it |
| --- | --- |
| a `?tenant=` query parameter or a frontend-parsed subdomain | an org app site naming the host, the app, and the anchor organization |
| a hand-rolled rate limiter on a signup or OTP route | the public-door ladder — a rung the route declares, counted by the framework |
| a direct call to an email/SMS/storage vendor SDK | the org provider registry — a configured record the acting organization or the platform default resolves |
| a special-cased "dedicated instance" deployment | an ordinary environment row with its own setup label and a `PROD` workload |
| a team-scoped "namespace" for access control | namespaces are blast-radius boundaries, never organizational ones — use roles and permissions for access |

## Left out

The full DNS grammar for touchpoints (`{env}-{tenant}.{spd}`, pretty names as site entries, custom domains outside the zone) is left out — it is infra-plane realization detail that an integrator reads off the org app site rather than composes by hand. The nine platform modules' individual dependency graph is left out beyond naming them; a module's own contract is the place to read what it exposes.
