# Step: contract — states first, everything else derives

The contract triple lives file-for-file per entity: `contract/states/<entity>.ts` (types), `contract/services/I<MOD><Entity>Service.ts` (the interface), `contract/validators/<entity>.ts` (**generated** Zod — never hand-edit). The rules below are the standard; their provenance is the naming, code-patterns and codegen chapters of the foundation book's TypeScript provider set.

**Constants live at `contract/constants.ts`, at the contract root.** Contract-grade literals — seed-row ids, error/permission code values where they are literals, manifest and artifact file names, schema versions, markers, fixed maps — sit in that one file beside the triple, never inside a states file, and a validator never consumes one. The import edge runs one way: `constants.ts` may read the states' enums; a states file never reads back — which is what keeps module initialization order a non-question.

**Intent as you write** (foundation decision RD.APPS.006): every method added to an `I*Service` interface carries a one-line JSDoc intent — present tense, what the caller achieves (`/** Grants the role set to a group, replacing its current assignment. */`). Capability generation harvests it; a method without intent is invisible to agent discovery. Update the owning module's contract-surface rows in `docs/03-capabilities/README.md`, and any new terms in its `data-model.md`, in the same edit session.

**One comment, read at two lengths.** The opening sentence becomes the short label — the capability `intent`, and the sentence someone scans a list by. Everything up to the first `@tag` becomes the long form, which is what `gen-validators` emits as `.describe()` on the schema and so what appears as the description in the interface document and in an agent tool's input fields. Write the sentence that stands alone first, then the paragraph that explains it:

```typescript
/**
 * Creates an org-scoped group for bulk role assignment.
 *
 * The group is empty until members are added, and its name is unique within the org.
 */
createGroup(command: CreateGroupCommand): Promise<Group>;
```

**Where the comment goes, per symbol** — the full table is in the **spn-core** plugin's `refs/intent.md` (cross-plugin pointer; it ships alongside this one from the `saasplane` marketplace). The TypeScript shape of it:

| Symbol | Comment it | Never comment |
| --- | --- | --- |
| `I<Mod><Entity>Service` + each method | the domain surface, and what each call achieves | — |
| `<Verb><Entity>Command` **members** | what a caller puts in each field — these become an agent tool's input descriptions | — |
| `<Entity>` state · `<Concern>Event` | what the shape represents · what happened, past tense | its fields one by one |
| `<Mod>ErrorCodeType` · `<Mod>PermissionType` **members** | when it is raised · what holding it allows | — |
| — | | the service **impl**, the repository, the controller, the listener — each realizes or adapts a contract method that is already described, and a second description drifts |

**A state's comment is the API description.** `gen-validators` carries it onto the schema, and the interface document is built from those schemas — so a `<Verb><Entity>Command`'s comment becomes what its operation says it does, each member's comment becomes that input field's description, and an enum's comment becomes what its vocabulary means. Nothing else reaches a caller: a comment on the service method is read in the source and harvested into the symbol index, but it is the **Command** a stranger actually reads. Regenerate after editing `contract/states/**` and the descriptions travel with it.

**Constraints ride the same comment as tags.** `/** The name shown to other members. @minLength(1) @maxLength(80) */` — the tag IS the validation (`gen-validators` builds the schema from it), so never restate it in prose and never hand-write the equivalent check in the service.

**Never name what the package does not depend on.** No table or column names, no permission or error codes owned by another module, no enum values from a package this one does not import. A consumer installing this package cannot resolve them.

## Command-in / state-out

- Every contract method takes exactly **one** `<Method>Command` and returns a state or wrapper. Reuse the `SP*` primitives before minting a bespoke command: `SPNoCommand`, `SPGetCommand`, `SPGetBulkCommand`, `SPGetCodeCommand`, `SPGetCodeBulkCommand`, `SPUpdateActiveCommand`, `SPResultBoolean`.
- **Commands carry CHAR(26) ids, never codes** (code lookups are read-only `get*ByCode`). `orgId` and the self `identityId` come from the auth context — drop them from post-auth commands.
- **A write command carries only the caller's inputs — never the entity's stored `Config` carrier.** Variant-shaped input discriminates the command itself: base `<Method><Entity>Command` + `mtype`, variants `<Method><Entity>Command<Variant>` carrying only that operation's fields (`CreatePrincipalFactorCommandSMSOTP` = `countryCode` + E.164 `phoneNumber`). Server-derived data (masked displays, provider selection, minted secrets/parameters) never rides on a command — if the client is stubbing `maskedX: ''` or `provider: ''`, the command shape is wrong. Pure write-input shapes (`*Input` types, authored configs with secrets under `internal`) may embed.
- Update commands carry every mutable field as `T | null` — null means "leave unchanged" (null-skip partial update).
- **A contract is JSON on the wire, and every rule below follows from that.** Whatever a contract declares must survive serialisation and arrive intact in a language that is not this one — so the type system a contract uses is the transport's, not TypeScript's. JSON has no functions, no `Date`, no `undefined`, and no class instances; a contract therefore has none either.
- **A contract member's type is one of exactly four things** — a CDT type (`CDTString`, `CDTInt`, `CDTLong`, `CDTDecimal`, `CDTBoolean`, `CDTDate`, `CDTTime`, `CDTDateTime`, `CDTJSON`), a contract **enum**, a **reference to another contract interface**, or an array of one of those. **Never a language primitive** — `string`, `boolean`, `number` are rejected, because a contract crosses languages and a CDT type is what carries the same meaning into each. No functions, no `Date` objects, no React types, no nested object literals, no tuples.
- **Nullable, never optional**: absence is `T | null`, never `?`. JSON has no `undefined`, so a contract cannot promise a key that is sometimes not there — a union of exactly two branches, one of them `null`, is the only optionality that survives serialisation and the crossing to another stack.
- Both rules are **enforced by `gen-validators`**, which refuses to generate rather than emitting a schema that disagrees with the intent — a raw primitive reports *"kindly use CDT Types"* and an optional member reports *"a contract state expresses absence as `| null`, never `?`"*.

## The read-level ladder — Meta ⊂ Info ⊂ State (+ Details)

- `<X>Meta` (id, org, code/name, `isActive` — navigable label) ⊂ `<X>Info` (+ description-class fields) ⊂ `<X>` (+ timestamps + resolved audit actors) ⊂ `<X>Details` (State + dependent sub-states for a detail page). Each level `extends` the one below — a level that stops extending breaks mapper reuse and FE substitutability.
- **Skip levels the entity genuinely lacks** (Meta-only catalogs exist); never invent levels.
- Wrappers: `<X>s` / `<X>Metas` / `<X>Infos` wrap `Record<key, X>` under a **named field** (`{ roles: {...} }`, never a bare Record — OpenAPI needs the named shape); `<X>List` wraps `X[]`. Search results: `{ records: X[], total: CDTInt | null }`.
- **Nest a display dependency's Meta instead of its raw id** (`PrincipalMeta.identity: IdentityMeta`); scope ids stay ids (`orgId` is never nested). Commands still carry raw ids.

## Enums, discriminators, polymorphism

- Enums are PascalCase + `Type` suffix; contract enum keys are `UPPER_SNAKE` matching their string values.
- Polymorphism = base interface + **`mtype`** discriminator + `extends` variants — never a multi-type union (`T | null` is fine).
- An entity-level discriminator is named for its host noun — `<noun>Type` (state) / `<noun>_type` (column) — **never a bare `type`**.
- Write-only secrets in a state live under an **`internal`** sub-object (masked to `internal: null` on read — see the service step).
- Events are `<Concern>Event`, past tense — a report, not a request.
- Module error codes: `<MOD>ErrorCodeType` enum with values `ERROR.<MOD>.<NAME>`; permission codes `<MOD>_<FAMILY>_<TIER>` with cumulative tiers VIEW ⊂ MANAGE ⊂ ADMIN.

## Validations — `@tag` JSDoc, compiled by gcz

Constraints ride the contract field as same-line leading JSDoc; `gen-validators` emits the matching Zod chain:

```ts
interface CreateWidgetCommand {
  /** @minLength(1) @maxLength(50) */  name:  CDTString;
  /** @min(0) @max(150) */             age:   CDTInt;
  /** @minItems(1) */                  roles: CDTString[];
}
```

Numeric: `@min` `@max` `@range` `@multipleOf` · string: `@minLength` `@maxLength` `@length` `@pattern("re")` · arrays: `@minItems` `@maxItems`. A tag must match the field type (`@minLength` on `CDTInt` fails gcz). A regex must not contain a literal `*/` — use `[*]/`.

**Declaration order matters**: gcz emits Zod in source order — a type referencing others in the same file goes **after** them (aggregates and composite commands at the bottom). Cross-file references are fine.

## The interface

`I<MOD><Entity>Service` declares **only** the methods FE controllers and other modules call — grouped per entity with section banners, `get<X>Details` after its sub-state methods. Internal cached readers (`get*ByIds`/`ById`) are public-on-class but NOT in the contract (unless a cross-module caller needs them); `_prepare*` mappers never are. Fixed verbs: create/update/get/search/delete (+ verify/consume/reset/check).

## Evolution — draft freely, then commit

**Source of truth:** the foundation book's states standard, "Evolution — the change classification". This digests it and adds no rule of its own.

First ask **one question: is this surface published?** — released as a package, or deployed where another team can call it.

- **Draft** (never released, never deployed to a shared setup): rename, retype, restructure, delete — freely, and keep iterating until the shape is right. A long-lived branch is still a draft; publication is release, not merge. This is where design belongs, and hard iteration here is what makes the published shape worth committing to.
- **Published**: the classification applies in full. Additive ships in place — a new optional field, a new state or method, a new enum value or error code, *loosened* validation. Breaking stops the work and reroutes through the `plan` skill for a version and migration path — removing/renaming/retyping a field, *tightening* validation, flipping optional to required, removing or reusing an enum value, permission code or error code, changing an error's category.

Two traps: a field is published even when **no known consumer calls it** — publishing puts the surface outside the estate's knowledge, so "nothing imports it" is not evidence. And the dangerous class is the **semantic** change — same shape, moved meaning — which no diff catches; a meaning that must change gets a **new name**, with the old one `@deprecated`, never a quiet rewrite.

## Generate

```bash
spnutils apps gen-validators -p <nx-name>   # after ANY contract/states/** edit — validators are generated, never hand-edited
spnutils apps gen-barrel -p <nx-name>   # lib packages that gained/lost files — NEVER apps, NEVER the API client, NEVER the CLI package
```

Validators and states must not drift — the Zod schema is what the API enforces and what the API client sees; a state-only change is invisible at runtime. Keep `export const <Name>Schema` discipline: a validator not exported from its module file never becomes a named schema in the client.
