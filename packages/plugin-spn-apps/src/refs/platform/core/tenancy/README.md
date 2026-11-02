<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/01-core/01-tenancy.md",
      "seen": "1014f397"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/01-core/01-tenancy/",
      "seen": "1f30c24b"
    }
  ]
}
-->

# Tenancy

The platform already gives you one organization tree every customer shape fits into, the account as the isolation boundary, the membership a person acts through, and the offer an organization carries. Read this before you model a customer hierarchy, a role, or a "what can this org type see" flag of your own — the platform already answers all three, and building a parallel answer is the adoption risk this file exists to close.

## The tree a platform sells into

Every business entity on the platform is one node in one hierarchical tree. When you model a customer, you place it on this tree — there is no separate customer table and no separate user table sitting beside it. A customer is a node, and a person acts as a **membership** in exactly one node at a time.

**Three organization types are closed, and categories are data on top of them.** The type is what the core knows and decides security by. A category is a platform's own name for a kind of org, such as Account, Merchant or Shopper. Each category sits on one org type, names its parent category, and names the identity pool its people sign in to.

```ts
export enum OrgType {
  PLATFORM = 'PLATFORM',      // the product estate a company operates, and a tenant of itself
  ENTERPRISE = 'ENTERPRISE',  // an org that employs people, and may sell to orgs beneath it
  CONSUMER = 'CONSUMER',      // one person, or a household; no orgs beneath it
}
```

`PLATFORM` sits alone at the root — the platform owner, itself a tenant of the tree it operates. `ENTERPRISE` sells to orgs beneath it where a category names its category as parent, and `CONSUMER` is one person or a household with nothing beneath it. A partner's categories are rows. This is a tree of categories, as a partner would write it, with each category's org type beside it.

```text
Platform                   PLATFORM
├── Account                ENTERPRISE   sells
│   ├── Account Enterprise ENTERPRISE
│   └── Account Consumer   CONSUMER
├── Merchant               ENTERPRISE
└── Shopper                CONSUMER
```

An org category is a row, not an enum. It carries the closed type and two links, one up and one across.

```ts
export interface OrgCategory {
  code: CDTString;                       // the category's name in data; never changes and is never reused
  orgType: OrgType;                      // the one org type the category sits on
  parentCategoryCode: CDTString | null;  // the category whose orgs sell to this one; null only for the platform's own
  identityPoolCode: CDTString;           // the identity pool the category's people sign in to
}
```

Every rule on this page reads off what a type decides, and nothing more. Everything else is an enablement.

| What a type decides | `PLATFORM` | `ENTERPRISE` | `CONSUMER` |
| --- | --- | --- | --- |
| Employs people | yes | yes | no — one person, or a household |
| Orgs beneath it | yes | yes, if a category names its category as parent | no |
| Its own subdomain | yes | yes | no |
| Its own directory | yes | yes | no — closed in the core |

A consumer org never resolves a directory before sign-in. The core draws that line by org type, because a directory vouches for a membership and is read before anyone signs in. Opening the directory to consumer orgs later is a change to the core that needs no major version.

**The developer picks a business archetype by choosing which categories to name and where each sits, never by building a second model.** B2C names an Account category alone, as a household. B2B names the same Account category as a company. B2B2C adds an Account Consumer category, and B2B2B adds an Account Enterprise category. A marketplace names Merchant and Shopper categories directly beneath the platform instead. Nothing forks to express any of them, and a platform that adds a second archetype later migrates nothing — it names a category the tree already had room for. Naming one is not a code branch: which customer org types an org may open beneath it is the `IAM_MANAGE_CUSTOMER_ORG_TYPES` cell on its category (see Enablement, below). When you scaffold a new customer shape, look for the category here before you propose a new table.

Read an archetype label from the platform outward, never the other way — MUST. `B2B2B` and `B2B2C` are always platform → business → that business's own businesses or consumers, never read from the customer's own seat. An Account Enterprise is a downstream business of an Account, not a peer of it, and you get the tree wrong if you read the label from the customer's chair.

## The account is the isolation boundary

`Account` and `Organization` name the same node from two directions: **organization** is the structural word, **account** is what that node is called when the point is billing and data ownership, and it is also the name a platform commonly gives the category of those nodes. The account is where isolation actually holds — data belongs to one account, is queried within one, and crosses to another only through an explicit, audited surface, never a join a query planner is free to take.

Before you write a query, a cache key or a lock name, check what it names. Key it to a node's identity, never to its position in the tree — MUST NOT. A merge, a split or a rename of a real customer is then an ordinary write instead of a migration, because nothing anywhere holds "the third child of node X" as a fact worth keeping.

### The parent is the seller

An org's parent is the org that sells to it (`RULE.PLATFORM.CORE.060` · MUST · skill:spn-apps/implement). The parent brands the sign-in and holds the identity pool its customers sign in to. It is the sender of record on every notification its customers read, and its staff administer the org. The org test decides whether something is an org at all: it is one only if it needs its own members, providers, policies or data boundary.

The tree records only who sells to whom (`RULE.PLATFORM.CORE.061` · MUST · skill:spn-apps/implement). Any other relation between orgs, such as a partnership, a referral or a shared project, belongs to the app and its modules, in their own tables keyed by org id. A category never has itself as an ancestor (`RULE.PLATFORM.CORE.062` · MUST · skill:spn-apps/implement): IAM refuses a category written under itself or under one of its descendants, so every tree is finite.

No module knows how deep the tree is (`RULE.PLATFORM.CORE.063` · MUST · skill:spn-apps/implement). Every walk up the tree reads the org's ancestors, nearest first, and stops at the first one that matches a condition the configuration states. A partner who writes a reseller above an account adds a link to the walk and changes no module.

An org's type, category and parent are written when it is created and never change. Becoming something new means creating a new org through that product's door, and one person then holds a membership in each org. The parent comes from the site the person arrived on, never from a form field, and the platform checks it against the category's parent category.

**Every notification has one sender of record, which is the reader's seller, and every part of an email comes from that sender** (`RULE.PLATFORM.CORE.064` · MUST · skill:spn-apps/implement). For the platform's own staff, the sender is the platform. No action declares a voice of its own. A reader with no org gets mail from the org the message is sent in, the org that reached them.

| The reader | The sender of record |
| --- | --- |
| The platform's staff | the platform |
| An account's staff, a merchant's staff, a shopper | the platform, which sells to each directly |
| An Account's business customer or consumer | the Account |
| A partner's Patient beneath a Clinic | the clinic |

The org that a message is about appears in its body as context only. It never appears in the letterhead or in the legal footer. The wording, the from-name, the sending account, the reply-to and the legal footer are all the sender's own. Where the sender has none of a part, the platform's shipped default takes its place, so the platform's edits to its own mail never reach another org's customers. The sender also owns delivery and suppression: a block is kept by the org a message is sent as, and the same address stays reachable from every other sender.

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

"A platform user" and "an account user" are not two kinds of user — they are principals in organizations of different types or categories, held by the same identity. A person who belongs to three organizations holds three principals and switches between them; they are never three different people, and no single row anywhere claims to be "the" user.

When you write an authorization check or an audit record, attribute it to a principal, never to an identity — MUST. Move the organization off the membership and onto the identity, and a person can belong to one organization only; drop it, and an audit record has nothing to attribute an action to.

A **machine principal** is a principal with no person behind it. Every organization is seeded at creation with a default **system principal** — the platform's one well-known system identity, holding that organization's own non-human role. Provisioning, notifications and scheduled jobs run as that principal, so automation passes the same authorization gate a person passes, and attributes to a real membership in the organization where it ran. If you are building background or scheduled work, run it as this principal — do not build a second, ungoverned path for platform-run work to act.

## Roles bundle permissions; code never checks a role

| Role kind | Who may change it | What it is for |
| --- | --- | --- |
| `SYSTEM` | nobody — seeded at the organization's creation | the app's three roles, `<APP>_OWNER`, `<APP>_SYSTEM` and `<APP>_USER`, named from the app's code; shown starred, never editable |
| `DEFAULT` | the platform, centrally | a role a module ships in every app that carries the module |
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

Some questions are per-record rather than per-capability — *who may edit this one document*. Those are answered by relationship tuples `(entity, relation, subject)` — ReBAC — read at the same authorization point as the permission check, where the subject is a principal, a group or a role. RBAC gates the capability, and ReBAC gates the object. Neither stands in for the other.

## Enablement: what a type is offered, never what a person may do

A permission answers what a person may do. An **enablement** answers which screens a person's organization is offered at all — a capability area's screens, and the create, update and delete behind them. The two refuse independently: a person can hold every permission in a family and still find a screen missing, because their organization was never offered that area, and no grant puts it back.

```ts
export interface ModuleEnablementDefinition {
  code: CDTString;                 // `{MOD}_MANAGE_{NOUN}` — the owning module's mnemonic, the verb and the area
  module: CDTString;               // the module that registered it, and the only owner of what it means
  fieldType: IAMEnablementFieldType;  // BOOLEAN, NUMBER, SELECT_MULTI or AUTOCOMPLETE_MULTI
  fieldConfig: SPDataFieldConfig;  // the field descriptor — a switch or a selection, with its options
  orgTypes: OrgType[];             // the ceiling: every organization type this may ever be set for
  isActive: CDTBoolean;            // whether the definition takes part in the effective read at all
}

export interface EffectiveEnablement {
  orgId: CDTString;                    // the org the values were resolved for
  values: EffectiveEnablementValue[];  // one value per active definition whose ceiling includes that type
}

export interface EffectiveEnablementValue {
  code: CDTString;               // the definition's code, which is the name a gate asks for
  fieldValue: SPDataFieldValue;  // the authored value; on when a switch is true or a selection is not empty
}
```

When you add a module, you **declare** — a code, a field descriptor, and a ceiling naming every organization type the question could ever sensibly apply to. You never decide on the module's own authority what a value is; you only say which cell exists. IAM fills each cell from the default you state by org type. The platform's product module writes a cell only where a category differs from that default, so the value holds in every environment. A change made on a console holds in that one environment. Every category inside a ceiling carries an authored row, the platform's own included: the platform's answers are values somebody wrote, never an exemption, because there is no exemption mechanism in this construct at all.

The grammar is two forms. An offer reads `{MOD}_MANAGE_{NOUN}`. A limit reads `{MOD}_LIMIT_{NOUN}` and is a `NUMBER` definition, such as `IAM_LIMIT_MEMBERS`. A value of 0 allows none, and an absent code sets no limit. A module checks a limit with `assertWithinLimit` where it creates. `MANAGE` or `LIMIT` in second position is what tells an enablement from a permission (`{MOD}_{FAMILY}_{TIER}`).

Never gate a module by organization type on its own authority — MUST NOT. Enforce the platform's authored enablement instead — that is what keeps a type from meaning one thing in one module and another thing in the next.

Modules know org types and never know categories (`RULE.PLATFORM.CORE.065` · MUST · skill:spn-apps/implement). State a ceiling and a default by org type, and never branch on a category's code: a category is a partner's name, and a module that read it would break the first time a partner renamed one. An answer is read by org, and never by category alone, because an org's parent narrows it.

Never let an enablement gate cover a read — MUST NOT. Every gated method you write is a create, update or delete. A search into an area a platform was never offered returns an empty list, never a refusal — a consumer with no audit screen still has audit rows written for it, and its files are still stored, because an empty cell hides a screen, never switches a module off.

**An empty effective set means nothing is granted, never that resolution failed.** Plenty of legitimate sessions carry one — a consumer's most of all — so read it as an answer, not an error.

## Who configures what

Two rights decide who configures sign-in and policy, and they are granted independently:

| Ask | If yes, it belongs to |
| --- | --- |
| Is it about people who belong to that organization? | that organization — nobody else knows who belongs |
| Is it about an employer's directory? | that organization, if it employs |
| Does it change what other organizations on this surface see, or how the surface behaves? | the surface's owner |
| Is it a promise made about this organization's records? | the org that made the promise |
| None of those | the organization's own records and values are its own |

An organization type **that employs people** may bring its own directory, for its own workforce — the platform and every enterprise category, which reach the same set of acts. An organization **with orgs beneath it** — the platform, and an enterprise org whose category is another category's parent — owns the sign-in options its customers see. Holding one right never implies the other, and the developer decides which rights an organization type carries by placing it in this table — never by inferring an answer from a business's size or vertical. Roles, tags, custom fields and message codes are vocabulary the *surface* publishes; every organization on that surface applies them to its own records, but never defines them — one that could define would fork the surface's shape for everyone standing on it. Outside identity, ownership decides what an organization may configure and its type never does: a thing scoped to the organization is its to change, for every organization type alike, and a thing the surface shares is refused to every type alike (`RULE.PLATFORM.CORE.028` · GUIDE).

## The resolution chain

Every upward lookup walks the same chain, however deep the tree is: the organization, then each of its ancestors nearest first, and last the platform. Its **anchor** is the nearest ancestor that owns the site a person signed in on, and a lookup stops at the first link that matches a condition the configuration states. A module that walks a shorter chain silently skips the seller a customer organization has no way to configure for itself (`RULE.PLATFORM.CORE.026` · MUST · skill:spn-apps/implement). What differs is what walking the chain *does*:

| What is resolved | How the chain is read |
| --- | --- |
| a configuration — a provider record, a data policy | **falls back**: the first link holding a row answers, whole |
| a policy attribute — a required factor, a session lifetime | **merges**: every link is read, and the strictest wins |

When you implement a merge across this chain, state the direction per attribute rather than apply one generic rule — MUST. A required factor is required if any layer requires it; a session lifetime is the minimum across layers — writing only "strictest" is how you get session-lifetime merges implemented backwards. Watch for two traps inside the per-attribute case. A **set of permitted things** takes no floor: narrowing it by intersection would make an opt-in member unreachable, so a set replaces rather than narrows. And **an absent limit is the loosest value, not the tightest** — a lifetime of zero means *use the default*, a cap of zero means *unlimited*; read either as a small number and you invert the floor.

A promise about records — retention, privacy — takes no floor at all and **resolves whole**, because retention has no agreed direction: longer is stricter for an audit obligation, shorter for a privacy one. So a data policy stays with the org that made the promise rather than merging with the org above it.

**Resolution is three-state at every level.** No row means the org inherits. A row overrides. A row that is present and inactive means *none here*. Deleting a row and disabling it are different acts — one restores the inherited option, the other refuses it outright. **Seeing is not configuring** — an administration screen shows what an organization inherits and what its own owner authored as two separate lists; merging them makes ownership unanswerable exactly where it has to be obvious.

## What this replaces

| If you are about to build | Stop — the platform already has it |
| --- | --- |
| a separate `customers` table beside a `users` table | the organization tree already carries both as one structure |
| a `businessOrConsumer` flag on a tenant row | name the category; the same Account category serves a household and a company |
| a role-name check (`if role === 'admin'`) | check the permission code the method declares |
| a "what can this account type see" boolean sprinkled through modules | declare an enablement definition once, and read `session.enablements` |
| a bespoke merge of parent and child settings | the resolution chain — falls back for configuration, merges per attribute for policy, never both the same way |

## Left out

Operating functions — the Ideate/Build/Grow/Manage vocabulary the capability chapter uses to describe how a SaaS organization staffs itself — is left out. It is a shared language for the company operating the platform, not a construct a partner's code integrates against, and carrying it here would restate an org chart rather than a model.
