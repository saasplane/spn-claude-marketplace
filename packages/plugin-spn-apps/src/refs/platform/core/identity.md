<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/01-core/02-identity.md",
      "seen": "7e08ccfc"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/02-identity/",
      "seen": "5b96947c"
    }
  ]
}
-->

# Identity

What the platform already gives you: one sign-in hub for every application, a session bound to exactly one place, and a stored decision that says whether a given surface may create an organization at all. Do not build a login screen, a second identity store, or a signup flag of your own — the platform already answers who a caller is, and a parallel answer is a second place a credential gets handled.

## The habit to unlearn

The client never says who it is. A caller names one registered **app site** — a host bound to an application — and the server resolves everything else from it: the namespace a handle is looked up in, the organization a session will bind to, the branding a screen renders, and where to return. Nothing on the sign-in path is asserted by the caller. If a request could name its own organization, the platform would have to trust a claim it cannot verify; a named site is a registered fact it already holds.

## Identity scope: what "the same person" means

An identity lives in exactly one **scope**, and handle uniqueness is scoped to it rather than to the platform as a whole. The same email address can be five different people across five scopes, and never two people in one.

```ts
export enum IdentityScopeType {
  GLOBAL = 'GLOBAL',                            // one person across the platform and every account
  ACCOUNT_CONSUMER = 'ACCOUNT_CONSUMER',        // one account's own consumer customers
  ACCOUNT_ENTERPRISE = 'ACCOUNT_ENTERPRISE',    // one account's own business customers
  PLATFORM_CONSUMER = 'PLATFORM_CONSUMER',      // the marketplace's shoppers
  PLATFORM_ENTERPRISE = 'PLATFORM_ENTERPRISE',  // the marketplace's sellers
}
```

`GLOBAL` is shared by the identity portal, the platform's own console, and every account's workspace — one person across the platform and every account they belong to. The four `ACCOUNT_*` and `PLATFORM_*` scopes are each their own namespace: two accounts can both have `jane@example.com` as a consumer, and those are two identities, invisible to each other. The scope is chosen by the server from the app site a visitor arrived on — never by the caller.

Never let a client assert its own scope, organization, or pool — MUST NOT. When you write a pre-authentication call, carry a single app-site id and let the server resolve it to the organization, application and scope a session will bind to.

## One hub, and a callback everywhere else

Hand every sign-in to the identity module, and mount at most one route of your own: the callback that receives a completed sign-in — MUST. Do not build a login screen inside a business application — that is a second place a credential is handled, a second place a policy is interpreted, and a second thing to fix when either changes.

The methods behind the hub are legs of one surface:

| Method | How it works |
| --- | --- |
| Password | verified against the credential stored for the identity the site's scope resolves |
| OTP (one-time code) | requested for a handle, proved in a second call; issued and delivered in the same shape whether or not the handle exists, so the response never says who has an account |
| Passkey | a device-held credential, proved through the browser's own ceremony — a **first** credential, never a second factor |
| Provider (SSO / social) | one pair of calls serving a directory and a public brand alike; the provider row says which it is |

```ts
export enum IdentityAuthLoginMethodType {
  PASSWORD = 'PASSWORD',  // a secret the person knows
  OTP = 'OTP',            // a one-time code sent to an address they hold
  PASSKEY = 'PASSKEY',    // a device-held credential — a FIRST credential, never a second factor
  SOCIAL = 'SOCIAL',      // a curated public brand vouches for the address
  SSO = 'SSO',            // the organization's own directory vouches for the person
}

export enum MFAFactorType {
  TOTP = 'TOTP',                    // a code from an authenticator application
  SMS_OTP = 'SMS_OTP',              // a code sent to a telephone number
  EMAIL_OTP = 'EMAIL_OTP',          // a code sent to an email address
  RECOVERY_CODE = 'RECOVERY_CODE',  // a single-use code issued in advance, for when the others cannot be reached
}
```

Never count a passkey as a second factor — MUST NOT. It is a first credential — a person signs in *with* it rather than confirming a sign-in *by* it — so counting it as a second factor would let one credential satisfy both halves of a policy that asked for two. If you are enforcing MFA, remember that a delivered one-time code also proves only a first factor: an organization requiring a second factor still asks for one after an OTP login, because proving control of a mailbox proves only what the address already claimed.

A second factor is a fact about the **person**, not one membership. Enrol an authenticator once, and every organization that person belongs to sees the same factor; whether it counts toward that organization's own policy is each organization's own call.

## What an attempt answers

A sign-in attempt answers with a named state, not a boolean:

```ts
export enum SessionType {
  ACTIVE = 'ACTIVE',                                        // signed in — tokens issued
  ORG_SELECTION_REQUIRED = 'ORG_SELECTION_REQUIRED',        // the identity belongs to several orgs; pick one
  MFA_REQUIRED = 'MFA_REQUIRED',                            // prove a second factor
  MFA_ENROLLMENT_REQUIRED = 'MFA_ENROLLMENT_REQUIRED',      // policy requires one and none is enrolled
  SIGNUP_REQUIRED = 'SIGNUP_REQUIRED',                      // the credential is verified and no account exists
  NO_ACCESS = 'NO_ACCESS',                                  // signed in, and not a member of this site's org
  LOGIN_METHOD_NOT_ACCEPTED = 'LOGIN_METHOD_NOT_ACCEPTED',  // a member, and the org refuses how they signed in
  SIGN_IN_REQUIRED = 'SIGN_IN_REQUIRED',                    // signed in longer ago than this org allows
}
```

Never treat `NO_ACCESS`, `LOGIN_METHOD_NOT_ACCEPTED` or `SIGN_IN_REQUIRED` as errors — MUST NOT. Somebody who is signed in and simply is not a member of this site's organization has done nothing wrong, and answering with an unauthenticated error sends them back to a form that cannot help. Render the state you were handed; do not collapse the eight states into a pass/fail flag.

Pre-auth failures — wrong handle, wrong password, an unlinked social identity — return one deliberately generic unauthenticated error. Sign-in never confirms whether an account exists.

## The organization decides, at every mint

A session's authentication requirement is read from the organization's own policy **at every mint**, never resolved once and cached. A sign-in is proof about a person; what that proof is worth is the organization's question, asked again every time — is this person a member here, is the sign-in fresh enough, does this organization accept how they signed in, and does it want a second factor. Asking once means an organization that tightens its policy has tightened it for sessions that do not exist yet, and for nobody already signed in; asking every time is what makes a policy change take effect the moment it is made.

Two policies are read on the "does this organization accept how they signed in" question, not one: the **surface's**, which decides what the screen offers, and the **bound organization's**, which decides what that organization's own policy permits. They are the same organization on a staff surface and never the same on a customer surface. Reading only the bound organization produces a control that believes it is working — the button disappears from the screen while the endpoint goes on accepting the method.

## A session belongs to one place

Name the membership, the organization, the application, and the site on every session you mint — MUST. A session that names only a person can be carried somewhere it was never granted; naming the place is what makes "where was this used" answerable, and what makes revoking one place possible without revoking a person everywhere.

Two organizations reached from one authentication hold two separate sessions — that is correct, not wasteful. Each carries the permission codes of that membership and the offers of that organization's type, and each expires on its own organization's clock. Signing in to a second organization the same person belongs to is a **switch**, and a switch mints its own session rather than extending the first.

Authorization checks a membership, never an identity — the same person is a different subject in each organization they belong to.

## Custom domains and subdomains

Never give a customer tier a subdomain of its own — MUST NOT. Only an organization that is a **destination** — an account, a marketplace seller — owns one; its own customer tiers ride that subdomain instead. A tier that owned a subdomain would be a second destination inside the first, and the lookup that resolves a visitor would have two answers with nothing to choose between them.

A session's cookie scope follows the host that minted it — shared across the platform's own surfaces, and held alone by a tenant's own domain. A custom domain moves through a small state machine behind a swappable certificate provider:

```ts
export enum AppSiteDomainStatusType {
  PENDING = 'PENDING',    // requested; waiting on the owner's DNS records
  ISSUING = 'ISSUING',    // the records are visible; the certificate is being issued and deployed
  ACTIVE = 'ACTIVE',      // issued and serving; the domain resolves like a platform-owned host
  REMOVING = 'REMOVING',  // teardown has begun and has not finished
  FAILED = 'FAILED',      // the binding did not complete, and the error is kept for diagnosis
}
```

`REMOVING` exists because teardown is three confirmed calls — unbind, revoke, delete — and the first can succeed while the second fails. Without a state between them, the row would still read active while the edge had already stopped serving it.

## The registration boundary is a stored decision

Whether a surface may create an organization at all is a **stored decision** the developer makes per organization and surface, from a closed vocabulary of two:

```ts
export enum OrgSignupModeType {
  CLOSED = 'CLOSED',  // no registration form here; an invitation or the parent's administrator creates a member
  OPEN = 'OPEN',      // the form renders; a stranger who proves a handle gets an organization and a session
}
```

Never infer the registration boundary from which flow a request arrived on — MUST NOT. Read the stored mode instead: it is one fact somebody can read, change, and audit, where inferring it from the flow means the boundary lives in whichever screen a person arrived through, and two screens eventually disagree.

Refuse a request naming a surface with no stored mode, rather than answering with a silent insert — MUST. Absent means nobody opened this door, and you refuse a request naming it outright, never obliging it quietly.

Two rules keep the boundary from drifting once it exists. **The decision never inherits** — a missing provider record is *no opinion*, so sign-in keeps working when nothing is configured, but a missing registration decision is *nobody decided*, and reaching upward for one would create organizations nobody authorised. And **every way in reads the same mode** — a flow's intent (sign in, or register) is bound at the start exactly as the site is, and the surface's mode is the only gate; a storefront cannot accept an emailed code while refusing the same arrival by provider.

Vetting a registrant is a separate question, already answered by that organization's own verification status — there is no third mode for it. Meeting somebody the surface already knows is an **outcome**, carried as a state the way a sign-in carries its own, never a refusal:

| Registration outcome | Meaning |
| --- | --- |
| `CREATED` | the organization did not exist, and now does |
| `EXISTING_FOUND` | the platform already knew this arrival, and says so rather than refusing |

Only a public provider (social) registers anybody new. A directory (SAML/OIDC) vouches for an organization's own staff — its assertion is a claim to belong somewhere that already exists, never a registration.

## What a console shows follows from the rights

When you build an administration screen, treat a section an organization has no right to as absent, not disabled — MUST. A disabled control advertises a capability and then refuses it, which teaches a customer to ask for something they were never offered; absence says the same thing without the invitation.

A consumer application is not a second identity portal. Self-service is a corner of it, never its spine — the moment it becomes the spine, there are two places a person's identity is managed, and they drift apart.

## What this replaces

| If you are about to build | Stop — the platform already has it |
| --- | --- |
| a login form inside a business application | hand off to the identity hub and mount one callback route |
| a client field naming which organization or tenant a sign-in targets | the app site the caller already named resolves it server-side |
| an "MFA passed" flag the client asserts back to the server | there is no such claim — evidence is server-held and organization-judged |
| a boolean "can this org type sign up here" | `OrgSignupModeType`, stored per organization and surface |
| a second signup screen for "just create my profile" | self-service is a corner of the business app, never a parallel portal |

## Left out

The step-by-step MFA sequence diagram, the full authentication-surface method table (`loginWithPassword`, `requestSessionOTP`, and the rest), and the provider-ownership resolution chain for SSO/social are left out of this file. They are implementation detail behind the states and the stored decisions carried above — an integrator calls the generated client and follows the state it returns, and does not need the ceremony's wire shape to avoid rebuilding it.
