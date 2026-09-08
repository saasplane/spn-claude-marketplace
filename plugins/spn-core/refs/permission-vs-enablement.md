# Permission or enablement — the first question

**For the agent adding a module, a state or a gate**, in any stack. You reach this file at the moment you write the gate, not afterwards. Get the answer wrong and you bake a product decision into code, gate a read, or mint a verb nobody else uses. All three have happened in this estate, and each one is named below with the file it happened in.

Source of truth: the foundation book's people-and-access chapter and decisions RD.SAAS.033 · RD.SAAS.034 in `spn-foundation`. This file restates them for use at the seat and adds no rule of its own. Where the two disagree, the book wins and this file is regenerated.

## The first question

Ask what the answer varies by. That one question separates the three axes.

| Does the answer vary… | Then it is |
| --- | --- |
| per **person** inside one organization | a **permission** |
| per **organization type**, the same for everyone inside it | an **enablement** |
| per **plan or subscription** | **neither** — that is billing, a separate axis that composes with org type and never overloads it |
| …and does it gate a **read**? | then it is **never** an enablement |

Two of these rows carry a trap. A plan feature looks like an org type when the estate has one plan, so you fold it into the enablement and the two dimensions become one. And a read gated by an offer refuses a module doing work on an organization's behalf. That module still stores the file, writes the audit row and sends the notification, whoever the customer is.

**A permission and an enablement never substitute for each other.** A permission is app-specific and says who may act. An enablement is cross-cutting and says what the caller's organization type is offered at all. A gate passes when both hold.

## If it is an enablement

### Two answers means two codes

Apply one operational test: **can you name a type whose answers differ?** Name one and you have two codes. Name none and you have one.

Never widen an existing code to carry a second meaning. That is how a cell stops answering the question its console label asks, and no reader can tell which half is off.

The test is not a count. IAM owns eight of the estate's codes, because IAM owns the organization record and every org-shaped question lands there. An earlier heuristic said four or more codes on one module means permissions in disguise. It was drawn from a sample of similar modules and does not hold.

### The grammar is one form

```
{MOD}_MANAGE_{NOUN}        the offer. boolean names the area; selection names the options
{MOD}_{FAMILY}_{TIER}      a permission, for contrast
```

`MANAGE` in the second position is what tells an enablement from a permission. Hold it and a reader classifies any code on sight.

- **A boolean names the area.** `IAM_MANAGE_MEMBERS` — on or off.
- **A selection names the options.** `NTF_MANAGE_CHANNELS` — a list of channels, narrowed per type.
- Name a selection after its area and the console shows *Customization* holding a list of entity types. Whoever flips that cell cannot tell what they are choosing.
- **There is no amount form.** Seats, storage caps and retention limits are billing's, on the axis that composes with org type. A quota written as an enablement puts a plan decision in a cell the console cannot price.

The code's first segment is its owning module's prefix, always. That is what keeps two modules' codes from colliding in one catalog.

### Placement

| Put the term | When |
| --- | --- |
| on the **gate** | that gate's methods are cohesive — every one of them is the same offer |
| in the **service body** | the gate is shared with unrelated methods, or the answer is a value (`assertAllows`) |

`IAM.CONFIG_MANAGE` covers twenty unrelated methods, so the app-site and policy terms sit in the bodies of the six writes that need them. Put the term on that gate instead and you refuse eighteen methods nobody meant to gate.

A value-checked code needs a matching narrowing on the surface. Where the body calls `assertAllows`, the picker offers only the keys the cell carries — otherwise the screen offers a choice the API refuses.

### The ceiling answers one question

The ceiling is the list of organization types a definition may be set for. It answers **could this question ever sensibly apply to this type**, and nothing else.

The ceiling is not an exemption mechanism. A type inside the ceiling with the answer `false` is governed and off. A type outside the ceiling was never asked. Reaching for the ceiling to grant something is the move that makes one column mean two things.

### `PLATFORM` is governed like every other type

`PLATFORM` sits in every ceiling where the question applies, with an authored row of its own. Most of its answers are `true`, and `true` is a value rather than an exemption.

**Never write an exemption branch.** A resolver that answers on for one type carries a rule the console cannot show and the seed cannot state. The master gets one protection, and it is a refusal in `updateOrgTypeEnablement`. A `PLATFORM` boolean cannot be set to false. Provisioning runs with platform authority, so turning one off bricks onboarding.

The rare type genuinely outside a ceiling is outside because the question does not apply. `PRJ_MANAGE_PROJECTS` excludes `PLATFORM` because the platform has no project screens.

### `[]` means nothing granted, never resolution failed

Every consumer session legitimately carries an empty list. So an empty list can never be a failure default.

Code defending against an absent list turns a mint bug into *nothing is enabled*. Every gated write is then refused estate-wide. It fails closed, and it reaches you as a permissions puzzle rather than an error. Type the field required and let the type work. Where a malformed principal is genuinely reachable, throw.

### An app-owned module owns its own questions

A module owns a question, or it contributes an option to someone else's. The two halves are seeded differently.

| The module… | Seeds |
| --- | --- |
| **owns** the question | its own definition, under its own prefix — the field config, the ceiling and every value |
| **contributes** an option to another module's question | an **append** to that definition's values, from its own migration |

**Append, never set.** Write the value flat and you clobber whatever another module contributed, and the next module clobbers you. Read-modify-write is what lets two app-owned modules land in either order. Address the other module's definition by its code, never by its seed id — a migration stays self-contained.

## What a hook checks, and what it cannot

`spn-apps-ts` carries `hooks/scripts/enablement-grammar.py`. It refuses four shapes at write time:

| # | Refused |
| --- | --- |
| 1 | a code whose prefix is not its own module's |
| 2 | a code whose second segment is not `MANAGE` |
| 3 | a multi-value definition named after a generic area |
| 4 | a hardcoded set of organization types in a service |

**One rule is deliberately not hooked.** *Every gated method is a write* needs the decorator-to-method map, which a write-time hook cannot build from one file. It belongs in the module's own `tests/unit/enablement/authz.spec.ts`, where the gate table and the methods are both in scope. Write that spec when you add the module; a module whose gates nothing checks is the module that breaks the rule silently.

## Three traps, each one real

### 1 · A module gates by org type on its own authority

`packages/module-server-iam-ts/src/app/services/IAMOrgService.ts` in `spn-platform-ts` carried this:

```ts
const SUBDOMAIN_OWNER_ORG_TYPES: ReadonlySet<OrgType> = new Set([
  OrgType.ACCOUNT,
  OrgType.PLATFORM_ENTERPRISE,
]);
// …inside updateOrgSubdomain:
if (!SUBDOMAIN_OWNER_ORG_TYPES.has(org.orgType)) {
  return throwErrorUnAuthorized();
}
```

That set is a product decision — *which organizations may own a subdomain* — written as code. It is the exact shape RD.SAAS.033 forbids. The console cannot show it, a platform operator cannot change it, and the type means one thing here and another in the next module. The comment above it argued the product position at length, which is the tell: an argument about what customers get belongs in a cell.

The fix folded the method under `IAM_MANAGE_APP_SITES` and deleted the set. A product that later sells subdomains to merchants flips a cell instead of buying a release.

### 2 · An enablement term left on a read gate

`apps/service-platform-ts/src/modules/project/app/utils/authz.ts`:

```ts
PROJECT_VIEW: anyOf([P.PROJECT_VIEW, P.PROJECT_MANAGE, P.PROJECT_ADMIN], [E.MANAGE_PROJECTS]),
```

A read gate carrying an offer. Turn the cell off and the organization's existing projects stop resolving — for its own staff, and for any module reading a project on its behalf. The offer governs the screens and the writes behind them; it never stops a record already created from being read.

Note where this one lived. `PRJ` is an **app-owned** module under `apps/…/src/modules/`, not under `packages/module-server-*`, so every sweep that globbed the packages directory missed it. When you sweep gates, glob both trees.

### 3 · A foundation module hardcodes a sample module's identifier

`packages/module-server-ent-ts/src/migrations/1784000007000-ent-setup-authz.ts` seeded its selection like this:

```ts
const EXTENDABLE_ENTITY_TYPES = ['PRJ_PROJECT'];
```

`ENT` is a foundation module and `PRJ_PROJECT` belongs to the sample product module. Naming it there points the dependency the wrong way. The layer everyone builds on now knows one product's vocabulary. A partner's module cannot be added without editing `ENT`.

The fix seeds every cell empty and lets `PRJ` append itself, from `prj-setup-entity-type` running later. The options were never a list in the seed anyway — they resolve live from the entity-type registry, so registering the type is what makes it offerable at all. Only the value is the contributing module's to write.

## The card

| # | Check |
| --- | --- |
| 1 | The answer varies per person → permission; per org type → enablement; per plan → billing |
| 2 | No enablement term on a read gate, ever |
| 3 | You can name a type whose answers differ — otherwise it is one code |
| 4 | The code reads `{MOD}_MANAGE_{NOUN}`, prefixed by its owning module |
| 5 | A boolean names the area; a selection names the options, never the area |
| 6 | No amount form — a quota is billing's |
| 7 | The term sits on a cohesive gate, or in the body where the gate is shared |
| 8 | Every value-checked code has a matching narrowing on the surface |
| 9 | The ceiling says *could this apply*, never *is this granted* |
| 10 | `PLATFORM` carries an authored row wherever the question applies — no exemption branch |
| 11 | `[]` is a legal answer and never a failure default |
| 12 | An owned question gets its own definition; a contributed option is appended, never set |
| 13 | No hardcoded set of organization types in a service |
