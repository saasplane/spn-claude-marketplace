<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/01-core/01-tenancy.md",
      "seen": "edae27e8"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/01-tenancy/",
      "seen": "2d3c831b"
    }
  ]
}
-->

# Tenancy

The platform already gives you one organization tree every customer shape fits into, the account as the isolation boundary, the membership a person acts through, and the offer an organization type carries. Read this before you model a customer hierarchy, a role, or a "what can this org type see" flag of your own — the platform already answers all three, and building a parallel answer is the adoption risk this file exists to close.

## The tree a platform sells into

Every business entity on the platform is one node in one hierarchical tree. When you model a customer, you place it on this tree — there is no separate customer table and no separate user table sitting beside it. A customer is a node, and a person acts as a **membership** in exactly one node at a time.

```ts
export enum OrgType {
  PLATFORM = 'PLATFORM',                        // the product estate a company operates, and a tenant of itself
  ACCOUNT = 'ACCOUNT',                          // a customer the platform bills — the isolation boundary
  ACCOUNT_ENTERPRISE = 'ACCOUNT_ENTERPRISE',    // a business customer of an account
  ACCOUNT_CONSUMER = 'ACCOUNT_CONSUMER',        // an individual customer of an account, or a household
  PLATFORM_ENTERPRISE = 'PLATFORM_ENTERPRISE',  // a business customer of the platform itself
  PLATFORM_CONSUMER = 'PLATFORM_CONSUMER',      // an individual customer of the platform itself
}
```

`PLATFORM` sits alone at the root — the platform owner, itself a tenant of the tree it operates. Below it, `ACCOUNT` is the billable customer, and `ACCOUNT_ENTERPRISE` / `ACCOUNT_CONSUMER` are that customer's own downstream businesses and consumers. `PLATFORM_ENTERPRISE` and `PLATFORM_CONSUMER` are the same two shapes reached directly from the platform, for a marketplace's sellers and shoppers.

| Organization type | Employs people | Has a customer tier |
| --- | --- | --- |
| `PLATFORM` | yes | yes — `PLATFORM_ENTERPRISE` · `PLATFORM_CONSUMER` |
| `ACCOUNT` | yes | yes — `ACCOUNT_ENTERPRISE` · `ACCOUNT_CONSUMER` |
| `PLATFORM_ENTERPRISE` · `ACCOUNT_ENTERPRISE` | yes | no |
| `PLATFORM_CONSUMER` · `ACCOUNT_CONSUMER` | no — one person, or a household | no |

**The developer picks a business archetype by choosing which of these six to activate, never by building a second model.** B2C activates `ACCOUNT` alone, as a household. B2B activates the same `ACCOUNT` as a company. B2B2C adds `ACCOUNT_CONSUMER`; B2B2B adds `ACCOUNT_ENTERPRISE`; a marketplace activates `PLATFORM_ENTERPRISE` and `PLATFORM_CONSUMER` instead. Nothing forks to express any of them, and a platform that adds a second archetype later migrates nothing — it turns on a tier that already existed in the tree. Activation itself is not a code branch: it is a cell the developer fills on the platform console (see Enablement, below), naming the customer tiers an organization type may open beneath it. When you scaffold a new customer shape, look for the tier here before you propose a new table.

Read an archetype label from the platform outward, never the other way — MUST. `B2B2B` and `B2B2C` are always platform → business → that business's own businesses or consumers, never read from the customer's own seat. `ACCOUNT_ENTERPRISE` is a downstream business of an `ACCOUNT`, not a peer of it, and you get the tree wrong if you read the label from the customer's chair.

## The account is the isolation boundary

`Account` and `Organization` name the same node from two directions: **organization** is the structural word, **account** is what that node is called when the point is billing and data ownership. The account is where isolation actually holds — data belongs to one account, is queried within one, and crosses to another only through an explicit, audited surface, never a join a query planner is free to take.

Before you write a query, a cache key or a lock name, check what it names. Key it to a node's identity, never to its position in the tree — MUST NOT. A merge, a split or a rename of a real customer is then an ordinary write instead of a migration, because nothing anywhere holds "the third child of node X" as a fact worth keeping.

Above the tree sit two things that are not nodes in it, and worth keeping straight because a partner's own naming tends to collapse them:

| Layer | What it is |
| --- | --- |
| Company | The legal entity — owns the cloud estate, employs the people, holds the intellectual property. It may operate more than one platform. |
| Platform | The product estate that company operates — one brand, one domain, one organization tree, one compliance posture. It is not one deployable; it composes applications. |

Every platform is a tenant of itself: the `PLATFORM` organization occupies an ordinary node in the same tree as every customer. That is what lets administrative work pass through the same authorization and audit machinery as a customer's own work, rather than needing a separately secured path.

## A person is one identity, many memberships

An **identity** is one person, held once, independent of any organization. A **principal** is that person's membership in exactly one organization, and it — never the identity — is what an authorization check and an audit record name.

```ts
export interface Principal {
  id: CDTString;           // the membership itself — what an authorization check and an audit record name
  orgId: CDTString;        // the one organization this membership acts in
  identityId: CDTString;   // the person behind it; one person holds one membership per organization
  displayName: CDTString;  // what this person is called inside this organization
  isActive: CDTBoolean;    // whether the membership may act; withdrawing it leaves the person untouched
}
```

"A platform user" and "an account user" are not two kinds of user — they are principals in organizations of different types, held by the same identity. A person who belongs to three organizations holds three principals and switches between them; they are never three different people, and no single row anywhere claims to be "the" user.

When you write an authorization check or an audit record, attribute it to a principal, never to an identity — MUST. Move the organization off the membership and onto the identity, and a person can belong to one organization only; drop it, and an audit record has nothing to attribute an action to.

A **machine principal** is a principal with no person behind it. Every organization is seeded at creation with a default **system principal** — the platform's one well-known system identity, holding that organization's own non-human role. Provisioning, notifications and scheduled jobs run as that principal, so automation passes the same authorization gate a person passes, and attributes to a real membership in the organization where it ran. If you are building background or scheduled work, run it as this principal — do not build a second, ungoverned path for platform-run work to act.

## Roles bundle permissions; code never checks a role

| Role kind | Who may change it | What it is for |
| --- | --- | --- |
| `SYSTEM` | nobody — seeded at the organization's creation | the owner, user and non-human grants every organization gets; shown starred, never editable |
| `DEFAULT` | the platform, centrally | shared cumulative tiers every organization inherits |
| `CUSTOM` | that organization's own administrators | one organization's own role, scoped to it alone |

```ts
export enum RoleType {
  SYSTEM = 'SYSTEM',    // seeded at the organization's creation; visible, and never editable
  DEFAULT = 'DEFAULT',  // shared cumulative tiers every organization inherits, changed centrally
  CUSTOM = 'CUSTOM',    // one organization's own role, scoped to it alone
}
```

Permissions are grouped into families exposing cumulative tiers — typically `VIEW ⊂ MANAGE ⊂ ADMIN` — so a check tests one code rather than a list, and a higher tier always implies the lower ones. **Groups** bundle roles once, so one membership in a group can carry several roles at once, and onboarding a team is one membership rather than N separate grants.

When you write a service-layer gate, check the caller's permission code, never a role name — MUST. Administrators reason in roles; you check whether the caller's permission set carries the code the method declares. A check written against a role breaks the moment somebody creates a custom role that should have worked.

Write the gate once, at the contract service method — MUST. Every transport that reaches the capability — HTTP controller, queue consumer, scheduled invocation, in-process caller — then inherits the same guard from that one declaration. A gate on one entry point only protects that one entry point; the second transport somebody adds later is the one most likely to ship unguarded. A control the browser hides is a courtesy; the server refusing the call is the guard.

**Denial is the default.** A permission nobody declared is refused, not quietly allowed.

Some questions are per-record rather than per-capability — *who may edit this one document*. Those are answered by relationship tuples `(entity, relation, subject)` — ReBAC — read at the same authorization point as the permission check, where the subject is a principal, a group or a role. RBAC gates the capability; ReBAC gates the object; neither substitutes for the other.

## Enablement: what a type is offered, never what a person may do

A permission answers what a person may do. An **enablement** answers which screens a person's organization *type* is offered at all — a capability area's screens, and the create, update and delete behind them. The two refuse independently: a person can hold every permission in a family and still find a screen missing, because their organization's type was never offered that area, and no grant puts it back.

```ts
export interface EnablementDefinition {
  code: CDTString;                 // `{MOD}_MANAGE_{NOUN}` — the owning module's mnemonic, the verb and the area
  module: CDTString;               // the module that registered it, and the only owner of what it means
  fieldConfig: SPDataFieldConfig;  // the field descriptor — a switch or a selection, with its options
  orgTypes: OrgType[];             // the ceiling: every organization type this may ever be set for
  isActive: CDTBoolean;            // whether the definition takes part in the effective read at all
}

export interface EffectiveEnablement {
  orgType: OrgType;                    // the organization type the values were resolved for
  values: EffectiveEnablementValue[];  // one value per active definition whose ceiling includes that type
}

export interface EffectiveEnablementValue {
  code: CDTString;               // the definition's code, which is the name a gate asks for
  fieldValue: SPDataFieldValue;  // the authored value; on when a switch is true or a selection is not empty
}
```

When you add a module, you **declare** — a code, a field descriptor, and a ceiling naming every organization type the question could ever sensibly apply to. You never decide on the module's own authority what a value is; you only say which cell exists. The developer then **authors** one value per type inside that ceiling, on the platform console, seeing every type together. Every type inside a ceiling carries an authored row, `PLATFORM` included: the platform's own answers are values somebody wrote, never an exemption, because there is no exemption mechanism in this construct at all.

The grammar is one form: a code reads `{MOD}_MANAGE_{NOUN}` — the owning module's mnemonic, the verb, and the area. `MANAGE` in second position is what tells an enablement from a permission (`{MOD}_{FAMILY}_{TIER}`). There is no amount form — a quota is a commercial question, answered by a plan rather than an organization type.

Never gate a module by organization type on its own authority — MUST NOT. Enforce the platform's authored enablement instead — that is what keeps a type from meaning one thing in one module and another thing in the next.

Never let an enablement gate cover a read — MUST NOT. Every gated method you write is a create, update or delete. A search into an area a platform was never offered returns an empty list, never a refusal — a consumer with no audit screen still has audit rows written for it, and its files are still stored, because an empty cell hides a screen, never switches a module off.

**An empty effective set means nothing is granted, never that resolution failed.** Plenty of legitimate sessions carry one — a consumer's most of all — so read it as an answer, not an error.

## Who configures what

Two rights decide who configures sign-in and policy, and they are granted independently:

| Ask | If yes, it belongs to |
| --- | --- |
| Is it about people who belong to that organization? | that organization — nobody else knows who belongs |
| Is it about an employer's directory? | that organization, if it employs |
| Does it change what other organizations on this surface see, or how the surface behaves? | the surface's owner |
| Is it a promise made about this organization's records? | the tier that made the promise |
| None of those | the organization's own records and values are its own |

An organization type **that employs people** may bring its own directory, for its own workforce — `PLATFORM`, `ACCOUNT`, and the two `*_ENTERPRISE` types. An organization type **with a customer tier beneath it** — `PLATFORM` and `ACCOUNT` alone — owns the sign-in options its customers see. Holding one right never implies the other, and the developer decides which rights an organization type carries by placing it in this table — never by inferring an answer from a business's size or vertical. Roles, tags, custom fields and message codes are vocabulary the *surface* publishes; every organization on that surface applies them to its own records, but never defines them — one that could define would fork the surface's shape for everyone standing on it.

## The resolution chain

Every upward lookup walks the same three links: the organization, then its **anchor** — the organization that owns the site a person signed in on, an account for its own customer tiers or the platform for everything else — then the platform. What differs is what walking the chain *does*:

| What is resolved | How the chain is read |
| --- | --- |
| a configuration — a provider record, a data policy | **falls back**: the first link holding a row answers, whole |
| a policy attribute — a required factor, a session lifetime | **merges**: every link is read, and the strictest wins |

When you implement a merge across this chain, state the direction per attribute rather than apply one generic rule — MUST. A required factor is required if any layer requires it; a session lifetime is the minimum across layers — writing only "strictest" is how you get session-lifetime merges implemented backwards. Watch for two traps inside the per-attribute case. A **set of permitted things** takes no floor: narrowing it by intersection would make an opt-in member unreachable, so a set replaces rather than narrows. And **an absent limit is the loosest value, not the tightest** — a lifetime of zero means *use the default*, a cap of zero means *unlimited*; read either as a small number and you invert the floor.

A promise about records — retention, privacy — takes no floor at all and **resolves whole**, because retention has no agreed direction: longer is stricter for an audit obligation, shorter for a privacy one. So a data policy stays with the tier that made the promise rather than merging with the tier above it.

**Resolution is three-state at every level.** No row present inherits; a row present overrides; a row present and inactive means *none here*. Deleting a row and disabling it are different acts — one restores the inherited option, the other refuses it outright. **Seeing is not configuring** — an administration screen shows what an organization inherits and what its own owner authored as two separate lists; merging them makes ownership unanswerable exactly where it has to be obvious.

## What this replaces

| If you are about to build | Stop — the platform already has it |
| --- | --- |
| a separate `customers` table beside a `users` table | the organization tree already carries both as one structure |
| a `businessOrConsumer` flag on a tenant row | activate the tier; the same `ACCOUNT` type serves a household and a company |
| a role-name check (`if role === 'admin'`) | check the permission code the method declares |
| a "what can this account type see" boolean sprinkled through modules | declare an enablement definition once, and read `session.enablements` |
| a bespoke merge of parent and child settings | the resolution chain — falls back for configuration, merges per attribute for policy, never both the same way |

## Left out

Operating functions — the Ideate/Build/Grow/Manage vocabulary the capability chapter uses to describe how a SaaS organization staffs itself — is left out. It is a shared language for the company operating the platform, not a construct a partner's code integrates against, and carrying it here would restate an org chart rather than a model.
