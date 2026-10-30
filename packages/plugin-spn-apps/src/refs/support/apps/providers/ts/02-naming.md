<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-apps/10-providers/ts/02-naming.md",
      "seen": "d1882e93"
    }
  ]
}
-->
# Naming — every layer a name lives in

**Source of truth:** the foundation's `10-providers/ts/02-naming.md`. Read this as the restatement; that chapter governs.

**Names are how you find things**, so the same thing must always be spelled the same way. You grep for a class, sort a folder, scan an import list, and every one of those acts depends on it.

**Pick one casing per layer and never mix them.**

| Layer | Convention |
| --- | --- |
| JSON — contracts, API bodies, JSONB, events, config | `camelCase` keys |
| TypeScript | `camelCase` values · `PascalCase` types and classes · `UPPER_SNAKE_CASE` constants |
| SQL (PostgreSQL) | `snake_case`, module-prefixed |
| API paths | `kebab-case`, singular — the grammar is the book's route chapter |

**Design outside in**: data contracts and APIs first, application code second, persistence last.

## Files

| What | Pattern | Example |
| --- | --- | --- |
| React component | PascalCase, one main component per file | `DSButton.tsx` |
| Hook | camelCase, the file name matches the hook exactly | `useIsMounted.ts` |
| Module file with several exports | kebab-case, lowercase | `data-field.ts` |
| Single-export file | PascalCase for a class or component, camelCase for a hook or singleton | `SPCoreError.ts` · `iamModule.ts` |
| Folder | kebab-case | `data-entry/` |
| Private path | a leading `_` on the kebab name | `_table/` |

**Group plain functions into a module file rather than giving each one a file.** A class, a React component, a hook or a module singleton gets a file each, named exactly after the export.

### These filenames carry a contract about their contents

| File | May export | Must never export |
| --- | --- | --- |
| `interface.ts` | interfaces, type aliases, and closed-vocabulary `Type` enums | classes, consts, functions |
| `constants.ts` | `UPPER_SNAKE_CASE` consts, and the types describing them | classes, functions, including arrow-function consts |
| `utils.ts` | pure functions, and the types describing their inputs and outputs | classes, mutable module state, import-time side effects |

**The value of these names is that you know what you are getting without opening the file.** One exported function destroys that, because from then on you have to check. Move a file that grows behaviour to a kebab-case module file, and leave the declarations behind.

**Declaring a type is not what classifies a file.** Any file may carry the interfaces and enums it needs. What decides the name is the count and kind of a file's *value* exports.

**`utils` says what the code is, never what it is about**, so it works at either level: a `utils.ts` beside the feature it serves, or a `utils/` folder of domain-named module files. Pure is the whole contract — inputs in, value out, nothing held and nothing outside the function touched but the shared `app` object. A util may read `app.config` and log through `app.providers.logger`, because every app has both. A helper that needs state is a class with a file of its own. The `utils/` folder of a support area has a wider contract: a function there may also read a file, run a command or read the environment.

### `index.ts` does not mean one thing

| In a… | `src/index.ts` is | Hand-edited |
| --- | --- | --- |
| package | the barrel — `export *` over the public surface | never; regenerate with `spnutils apps gen-barrel <package>` |
| app | boot code that starts the process | yes |
| CLI | the shebang `bin` entry that registers the commands | yes |

**The exception is `CLIENT_API`**, whose barrel sits over a generated tree and is maintained by hand.

### When a third party owns the name

**A framework that reads a path by convention owns that path.** Leave `vite.config.ts`, `*.stories.tsx`, `.storybook/` and `jest.config.cjs` alone. Apply our rules to anything we import by a path we chose, including the setup files those tools point at by explicit path.

**The boundary is who chooses the name, not which folder it sits in.** "It sits near framework code" is not a reason; "the tool globs this exact pattern" is.

## Code

**Classes are PascalCase, with a prefix saying where they come from** — `SP` for the framework, `DS` for design-system components, `UTL` for utilities, and the module code for a platform module.

**The `I` prefix is not universal.**

| What the interface is | Pattern | Example |
| --- | --- | --- |
| a class interface — service or provider | `I` + PascalCase | `ISPAuthProvider` |
| React component props | `I` + component + `Props` | `IDSButtonProps` |
| a group of a component's props | `I` + component + group + `Props`, built from the owner's props with `Omit` or `Pick` | `IDSFeatureGridSectionContainerHeadingProps` |
| a props shape many units share, which no component owns | `I` + what it is, with no `Props` and no `Config`: neither a component nor a unit's `config` prop owns it | `IDSFrameSurface`, `IDSGridColumns`, `IDSGrid` |
| an entity or contract shape | PascalCase, no `I` | `User` |
| a constructor config | `{Class}Config`, no `I` | `SPHttpClientAxiosConfig` |
| an input command | `{Action}{Entity}Command` | `CreateUserCommand` |

### Decorators

**A decorator is named for the concern it carries, in `SP` + `PascalCase`, never for the check it runs or the word *Require*** (`RULE.SUPPORT.APPS.227` · MUST · skill:spn-apps/implement): `@SPTransaction`, `@SPReauth`, `@SPCachePurge`. Its documentation says whether it **guards**, refusing the call before the method runs, as `@SPAuthorize` and `@SPReauth` do, or **wraps**, running the method inside something, as `@SPTransaction` and `@SPCachePurge` do, because the name does not say. `@SPAuthorize` keeps its name.

### Units of a web module

**Every unit of a web module ends in the word for where it is placed or what it is, and only a plain component needs none** (`RULE.SUPPORT.APPS.202` · MUST · skill:spn-apps/implement), amended by (`RULE.SUPPORT.SURFACE.229` · MUST · skill:spn-surface/design). A reader then knows what a unit is from its name, before opening its file.

| Unit | Its name | Example |
| --- | --- | --- |
| a page | ends in `Page` | `RoleListPage` |
| a container | ends in `Container` | `RoleListContainer` |
| a widget | ends in `Widget` | `RoleMembersWidget` |
| a dialog | ends in `Dialog` | `RoleInviteDialog` |
| a form | ends in `Form` | `RoleForm` |
| a unit that follows a common pattern | ends in the word of the pattern | `UserAutocomplete`, `RoleAutocomplete` |
| one step of a flow of several | ends in `Step`, and is a `DSForm` | `ForgotPasswordStep` |
| the content of an entry | ends in `Entry`, drawn with the overlay's parts and opened by `DSEntryOverlay` | `DocFileUploadEntry` |
| a record's item line | the state's name, then `Item` | `RoleItem` |
| a hook | starts with `use` | `useRoleList` |
| a plain component | no suffix and no prefix is needed | `RoleBadge` |

**A unit that chooses records ends in `Autocomplete`, and a record never takes a `Select`, which is an enum's alone** (`RULE.SUPPORT.SURFACE.307` · GUIDE). `Picker` is for a value of one kind with a control of its own: a colour, a date, a time, an image. A unit that is one design-system block made specific ends in that block's word: `Dialog`, `Sheet`, `Drawer`, `Popover`, `Menu`, `Select`, `Autocomplete`, `Card`, `Picker`, `Item`, `Step` or `Entry` (`RULE.SUPPORT.APPS.207` · MUST · skill:spn-apps/implement). `Step` is one step of a flow of several, such as signing in, and is a `DSForm`: `ForgotPasswordStep`. `Entry` is the content of an entry, drawn with the overlay's parts and opened by `DSEntryOverlay`: `DocFileUploadEntry`, which `DocFileUploadDialog` opens. A word only two components use, such as `Part` or `Value`, stays a plain component's name. **A unit made from a block writes what its data decides and leaves the rest to that block's choice table:** a badge for a state writes its word and its colour, and its place gives its size and variant, as `DSBadge`'s table says; a dialog writes its content, and its extent comes from what it holds. Its comment says what it shows, and never a rule of the block's table. **A badge shows one enum or one state's record, and a select shows one enum; each takes that enum's or that state's name exactly,** with `Badge` or `Select` after it: `JobRunStatusTypeBadge`, `OrgTypeBadge`, `NtfBlacklistReasonTypeSelect`, and `EntTagDefinitionBadge`, which takes an `EntTagDefinition` and draws its name in its colour (`RULE.SUPPORT.APPS.206` · MUST · skill:spn-apps/implement). A badge that shows a record takes the record whole, never the fields it draws one by one. **A unit that takes a state as its data takes the state's name:** `NtfTemplateForm`, `EntTagAssignmentsWidget`, `Captcha` (which takes `CaptchaConfig`). Any other unit is named freely, and a module code in it is in capitals: `useNTFManageableChannels`.

**A type registered with `LOOKUP` owes its web module two exports** (`RULE.SUPPORT.APPS.223` · MUST · skill:spn-apps/implement): its `<State>Autocomplete`, and the option source that Autocomplete uses, as the hook `use<State>OptionSource()`, which returns `IDSDataOptionSource` of the record. A form field, a filter bar and the custom-field form all choose that record through the same two, and the custom-field form turns a field's source code (`IAM_ROLE`) into that hook, so no picker of a record is written twice. The hook is a hook file like any other: one hook in `useRoleOptionSource.ts`, in the module's `hooks/<area>/`, beside the `components/<area>/` folder that holds `RoleAutocomplete.tsx`.

**A record's item line is `<State>Item`, and its words and facts come from `prepare<State>ItemProps()` in the module's `utils/<state>.ts`** (`RULE.SUPPORT.APPS.218` · MUST · skill:spn-apps/implement). `RoleItem` draws a role, as `RoleAutocomplete` chooses one, and it sits beside it, in `components/<area>/RoleItem.tsx`. The function takes the record, the place's `IDSItemPlacementProps` and `translate`, and returns the props of `DSItem`; the Item draws what it returns, and a card's head or row spreads the same props, so the two show one line. The function lives in the utils file so the component file keeps its single export: `prepareRoleItemProps` in `utils/role.ts`.

**A form's own state is `I<what it edits>FormState`** (`RULE.SUPPORT.APPS.220` · MUST · skill:spn-apps/implement): `IRoleFormState`, `IOrgAuthPolicyFormState`. It is the shape a form holds while a person fills it in, and its fields take the command's own types. The name says which unit holds it, the form, as `IRoleFormProps` does, and keeps the word *state* apart from a contract state, which is a record the server returns. `EntryState` and `Draft` are not used.

**A suffix names where a unit is placed: `App`, `Layout`, `Container`, `Widget`.** A widget stands beside others or in a sidebar, inside a container or not. A block built for one task and placed nowhere in particular is a component and carries none, as the design system's `DSDataTable` does. **The list of pattern words is not closed.** A module that follows a pattern the stack already names uses that name. A plain component is raw: it has no layer to say. The props interface follows the unit's name, as `IRoleListContainerProps`.

**A module's route keys are one enum, and its routes are one constant. Proposed** (`RULE.SUPPORT.APPS.203` · MUST · skill:spn-apps/implement). The enum is `<MOD>RouteType`. Each key is in capitals and matches its value, and each value begins with the module's code: `IAMRouteType.ROLE_DETAIL = 'IAM_ROLE_DETAIL'`. The list is the constant `<MOD>_ROUTES`, typed `ISPRoute[]`. The developer has not seen this choice.

### Support classes and seams

**A class under `app/support/` tells you which area its file is in.** The kinds of file are `module/README.md` in this plugin; this is how TypeScript names them.

| What is named | Pattern | Example |
| --- | --- | --- |
| a support class | the area, then the subject, then the kind | `KindManifestStore`, `IngressCertificateManager` |
| a provider | the same, ending with its vendor or its stack | `IngressProviderNginx`, `AppsProviderTS` |
| a seam's interface | `I`, then the area, then `Provider`; the seam's subject follows the area where an area has more than one seam | `IIngressProvider`, `IDeployReleaseStoreProvider` |
| an exported type | the area, then the subject | `KindProfile`, `TSNodeIdentifier` |
| an area's prefix | the area's name, or the short code the area declares where its name is long | `TS` for `typescript/`, `LInfra` for `local-infra/` |
| the prefix of a sub-area | the sub-area's own name, in the singular, never the parent's before it | `resources/` gives `ResourceManager` |
| a util file | kebab-case, named for its subject, with no prefix | `utils/platform-slot.ts` |

**Name the file of a class exactly after the class**: `ingress/IngressManager.ts`. A util file takes no prefix, because the folder already says the area. `interface.ts` and `constants.ts` take none for the same reason.

**In a module, the module code is the prefix.** The area follows it only where the module's support holds more than one area: `<MOD><Area><Subject><Kind>`.

**Build a class with `new`; a `static` method never stands in for a function.** A function a class file would export goes to the area's `utils/`.

**A class with no `constructor`, no `extends` and no `implements`, that holds only functions, is a util module.** Write it as one `utils/<subject>.ts` file that holds its functions, the private ones too, and never as a class.

**A util's function may read a file, run a command or read the environment.** It never calls a service or a manager, and never builds a provider. So a util file imports no class file from its own `src/`. It may read the shared `app` object: `app.config`, and a provider set up at boot, such as `app.providers.logger`.

**Build a provider where the knowledge to pick it is**: in a manager that owns the seam, or in the service itself. A service that processes a file reads the file's MIME type and builds `ParserProviderCSV` or `ParserProviderJSON`, both behind `IParserProvider`. The type arrives with the call, so nothing at boot could have picked the parser.

**Enums are PascalCase with a `Type` suffix, always.** In `contract/states/` the enum key is `UPPER_SNAKE_CASE` matching its string value, never a PascalCase key. Values are strings, never numeric.

**Functions and methods are camelCase and start with an action verb** — get, set, create, update, delete, validate. A function that computes or derives a value takes the `prepare*` prefix.

**Write helpers under `app/utils/`, or under a support area's `utils/`, as exported `const` arrow functions, verb first.** A never-returning throw or assert helper must stay a `function` declaration, because TypeScript applies never-returning narrowing only to declarations.

### The privacy markers, and why they are not interchangeable

| Marker | Position | Applies to | Means |
| --- | --- | --- | --- |
| `_` | prefix | folders, files, functions, methods | private to its parent |
| `Internal` | suffix | a symbol beside its public sibling in the same file | the ungated twin of a public member |

**The underscore is the mechanism, not a label** — the generated barrel skips every path holding one, at any depth. **The `Internal` suffix keeps a pair adjacent** wherever names are sorted, so you see both and pick deliberately.

### CSS custom properties

**An app or a module prefixes every CSS custom property it defines with its own code, and the design system's variables stay unprefixed** (`RULE.SUPPORT.APPS.208` · MUST · skill:spn-apps/implement). The showcase's brand tokens are `--wds-surface` and `--wds-gradient-warm`; a partner's app names its own `--<app code>-…` and a module `--<module code>-…`, so nothing an app or a module defines meets a name of the design system, whose paint tokens `--surface-fill`, `--surface-translucent-fill` and `--surface-blur` are unprefixed. An app names its own classes with its code too, such as `wds-card-promo`.

### Acronyms and codes

**An acronym keeps every letter capitalized in a type, class or file name** — `SPIntegrationSMSTwilio`, never `SPIntegrationSmsTwilio`. Give it a lowercase tail in a camelCase identifier — `smsProvider`, `getSignedUrl`.

**Treat a trailing acronym as a word: `Id` and `Ids`, never `ID` or `IDs`.**

**A module code stays fully uppercase** in class names, type names, init functions and file names — `MDMRuntimeModuleManager`, `initJOBModule`. The lowercase singleton instance is the only exception. **A state carries no module code in capitals** — `NtfTemplate`, `EntComment`, `Org`, `CaptchaConfig`; the module's own word in Pascal case (`Ntf`, `Ent`, `Doc`, `Job`) is part of a state's name where the module names its states so. A module code in capitals stands only on a constant (`IAMErrorCodeType`, `NTFEntityType`), a service (`INTFTemplateService`) and the module's internal classes (`IAMRoleController`) (`RULE.SUPPORT.APPS.205` · MUST · skill:spn-apps/implement).

**A server module's wiring names** carry its code and kind. At the package root: `interface.ts` holds `SPModule<CODE>` (extends `SPServiceAppRuntimeModule`) and `SPModule<CODE>Config` (extends `SPServiceAppRuntimeModuleConfig`); `<CODE>RuntimeModuleManager.ts` holds class `<CODE>RuntimeModuleManager` (extends `SPServiceAppRuntimeModuleManager`); `index.ts` is the main door and re-exports only. The `remote/` folder is the second door, written by hand: `remote/interface.ts` holds `SPModule<CODE>Remote` (extends `SPServiceAppRemoteModule`), one member under `services.contract` for each contract interface, importing nothing from the module's own `interface.ts`; `remote/<CODE>RemoteModuleManager.ts` holds class `<CODE>RemoteModuleManager` (extends `SPServiceAppRemoteModuleManager`); `remote/<code>Module.ts` holds `<code>Module`, typed `SPModule<CODE>Remote`; `remote/index.ts` exports `contract/` and those three files.

**A module's two managers are named as a pair — MUST.** `<CODE>RuntimeModuleManager` mounts the module and `<CODE>RemoteModuleManager` holds it by its contract; no other manager name exists for a module. The whole family, one base and its two kinds on each row:

| | Base | Mounted | Remote |
| --- | --- | --- | --- |
| the manager | `SPServiceAppModuleManager` | `SPServiceAppRuntimeModuleManager` | `SPServiceAppRemoteModuleManager` |
| the module | `SPAppModule` | `SPAppModuleRuntime`, `SPServiceAppRuntimeModule` | `SPAppModuleRemote`, `SPServiceAppRemoteModule` |
| the config | `SPAppModuleConfig` | `SPServiceAppRuntimeModuleConfig` | `SPServiceAppRemoteModuleConfig` |
| a line of the module list | `SPServiceAppBootModule` | `SPServiceAppRuntimeBootModule` | `SPServiceAppRemoteBootModule` |
| one module's own | | `IAMRuntimeModuleManager`, `SPModuleIAM` | `IAMRemoteModuleManager`, `SPModuleIAMRemote` |

The field that tells the two kinds apart is `moduleType`, of `SPAppModuleType` (`RUNTIME` · `REMOTE`); a module's type is not a contract state, so the field takes the plain name and not `mtype`. The generated `contract/methods/I<MOD><Entity>Service.ts` holds const `I<MOD><Entity>ServiceMethods`, typed `SPServiceMethods<I<MOD><Entity>Service>`, written by `spnutils apps gen-validators` and never hand-edited; the folder follows `services/` file for file. A second service imports `@saasplane/module-server-iam-ts/remote` for a module held remotely.

**Two spellings of one acronym make a symbol unsearchable.** That is the reason behind all of the above.

**Constants are `UPPER_SNAKE_CASE` with a descriptive prefix.** Module-specific immutable id literals live in the module's `contract/constants.ts` and are append-only.

## Contract names

**State levels model one entity at escalating richness**: `<Entity>Meta` inside `<Entity>Info` inside `<Entity>`, one extension chain where each level adds only. `<Entity>Details` sits above the chain and is built by composition, never by `extends`.

**Every entity has the full state.** Meta, Info and Details are each optional and named only where the entity genuinely has that level. Never invent one to complete a set.

**Nest a display dependency's Meta instead of its raw id.** A scope id stays an id, and a command still carries raw ids.

**Wrappers**: `<Entity>s` and `<Entity>Metas` are keyed maps; `<Entity>List` is ordered.

**Commands are `<Method>Command`, and you reuse the `SP*` primitives first** — `SPGetCommand`, `SPNoCommand`, `SPGetCodeCommand`, `SPGetBulkCommand` — rather than authoring a bespoke command for one id or field. Commands take ids, never codes. Drop `orgId` and the caller's own `identityId`, which come from the auth context.

**A write command carries only the caller's inputs, never the entity's stored config carrier.** Where the input varies by variant, discriminate the command itself.

**Events are `<Concern>Event`, named in the past tense.** Write-only secrets sit in a state under `internal`.

### Polymorphism

**A family is a base interface plus an `mtype` discriminator with `extends` variants, never a multi-type union.** Keep the inner discriminator field spelled `mtype`.

**A discriminator on an entity is named for its host noun** — `<noun>Type` in the state, `<noun>_type` as the column — never a bare `type`.

**The variance carrier is `<Host><Role>` and its variants are `<Host><Role><Variant>`.** `Role` is usually `Config`, otherwise the role's own word.

### Service interfaces and validators

**Write a contract service interface as `I<MOD><Entity>Service`**, with fixed verbs create, update, get, search and delete, plus `verify`, `consume`, `reset` and `check` where the domain needs them.

| Verb | Asks for |
| --- | --- |
| `get<X>` · `get<X>By<Parent>` | one, by id or another key |
| `get<X><Level>s` | many, by an id list — returns the keyed map |
| `getAll<X>List` | every row — closed reference sets only, never tenant-grown data |
| `get<X>List` · `get<X>ListBy<Scope>` | every row a scope holds |
| `search<X>s` | the matching page, filtered and ordered |

**There is no `bulk` verb.** A many-read is the plural of the read level, and a read returning an `<X>List` is named for that type.

**Every contract interface gets one validator named `<Interface>Schema`**, written into `contract/validators/<entity>.ts` by `spnutils apps gen-validators`. The name is derived rather than chosen, which makes `Schema` a reserved interface suffix — a contract interface ending in it fails generation instead of emitting a collision. A state that extends exactly one interface also gets `<Interface>SchemaBase` beside its schema, which names the base its schema was merged from.

### Personal name forms

A field's name says whether it holds a person's data, as `_id` and `_at` say what a field is. A key is personal when it is one of these forms or ends with one, and it is ordinary everywhere else. The set is closed: it grows by a change to this rule in its chapter, never by one field (`RULE.SUPPORT.APPS.225` · MUST · skill:spn-apps/implement).

| Form | Ends a key such as | Holds |
| --- | --- | --- |
| `Email` | `email`, `toEmail`, `externalEmail` | an email address |
| `Phone` | `phone`, `toPhone`, `maskedPhone` | a phone number |
| `Address` | `address`, `ipAddress`, `recipientAddress` | an address that reaches or locates a person: postal, network or contact |
| `BirthDate` | `birthDate` | a date of birth |
| `firstName` · `lastName` · `displayName` | `firstName`, `actorDisplayName` | a person's names |
| `person…`, a prefix | `personCountryCode`, `personTimezone` | a person's own settings |

- **A form ends the key.** `emailVerifiedAt` is a time and `phoneNumberId` an id: a form inside a name says nothing. A plural counts (`toEmails`, `handleAddresses`), and so does the same form in `snake_case` (`ip_address`, `person_country_code`), so a column follows its field.
- **The prefix needs a word after it.** `personTimezone` is personal; a key named `person` is not.
- **A value of a form's kind is personal wherever it sits.** A sender's `fromEmail` and a site's `supportPhone` are hidden from a log line too: hiding an organization's address costs a debugging line, and missing a person's costs a breach notice.
- **`spnutils apps gen-validators` refuses a contract field that ends with a personal word outside the forms**: `surname`, `familyName`, `forename`, `givenName`, `fullName`, `nickname`, `birthday`, `dob`, `dateOfBirth`, `mobile`, `mobileNumber`, `phoneNumber`, `telephone`, `mail`. The refusal names the form to use instead.

**One matcher tests a key against the forms.** It is `isPersonalFieldName`, in `support-ts` (the universal core) in a file of its own, `utils/personal.ts`, so a service, a web app and the generator call the same function. The log redactor, the export, the erasure and `gen-validators` are the four callers. There is no tag, no generated list and no merge at boot.

## Packages

**A package is `@saasplane/{scope}-ts`**, with a kebab-case scope name and the stack suffix. The folder matches the package name without the scope. The name families map onto the kind registry.

## Codes and keys

**Dots are reserved for error codes and label keys; permission codes use underscores.**

| Family | Grammar | Example |
| --- | --- | --- |
| Error code | `ERROR.STD.<NAME>` shared, `ERROR.<MOD>.<NAME>` module-owned | `ERROR.IAM.CHALLENGE_EXPIRED` |
| Permission code | `MOD_FAMILY_TIER`, cumulative `VIEW` then `MANAGE` then `ADMIN` | `IAM_ACCESS_VIEW` |
| Label key | `<SCOPE>[.<SUBSCOPE>].<SNAKE_LABEL>`, stored UPPER | `COMMON.ATTACH_FILE` |

**A permission's enum value carries the module prefix; the enum key stays short** so a gate reads cleanly. The prefix is what guarantees uniqueness when every module seeds into one catalog.

**Each family of label has one key form.** The catalog stores every key in its UPPER form, and `normalizeLabelKey` only fixes case.

| Family | Who writes the key | Written as | Stored as |
| --- | --- | --- | --- |
| A design-system label | the design system, at the call site | lower case: `translate('common.clear', 'Clear')` | `COMMON.CLEAR` |
| A module page's label | the page, at the call site | the stored form: `translate('IAM.ROLE_ACTIVATED', 'Role activated')` | `IAM.ROLE_ACTIVATED` |
| An error's label | nobody: the key is the error code | `ERROR.STD.<NAME>` · `ERROR.<MOD>.<NAME>` | the same |
| An enum value's label | `translateEnumLabel`, from the enum's name and the value | `ENUM.<ENUMNAME>.<VALUE>`, from `translateEnumLabel(translate, 'RoleType', role.roleType)` | `ENUM.ROLETYPE.SYSTEM` |

**An enum label's key is built, never written.** A page passes the contract enum's name exactly as declared — `'RoleType'`, never `'roleType'` or a shortened `'role'` — and `buildEnumOptions` takes the same name. **Only a contract enum's value takes an `ENUM.` key**: a code from an open set, such as a module code, or an entity kind, which is also what names a data source, never does. Its label comes from the registry row.

**Scope a label by reuse, not by where it renders.** `common.*` is flat and holds generic vocabulary translated once; a module scope holds module-specific messages and may add a subscope. A `common.*` key mirrors its own English value rather than inventing a semantic name. The second argument is both the English source and the runtime fallback.

**Keep error labels in a separate keyspace keyed by the error code**, not by display text.

### Test selector attributes

**Selectors are hyphenated `data-*` attributes, never underscored.** `data-testid` is the stable kebab-case selector; `data-test-<key>` carries dynamic state, each key kebab-cased. A masked control never emits a value.

**Declare ids in source, never in the test tree.** Each web module exports them from `entry/ui/utils/test-data.ts` as `<CODE>TestDataIdType`, and a test imports the enum. A package cannot import from `tests/`, so a test-owned registry forces the literal to be written twice.

**A reusable control defaults its id rather than fixing it**, because it can appear twice on one screen. A singleton hardcodes.

## SQL

**The grammar is the book's data chapter; this stack instantiates it.** Tables are `{module}_{entity}`, columns `snake_case`, enum types `{module}_{concept}_type` with `UPPER_SNAKE_CASE` values, and indexes `idx_` or `uq_` plus the table and columns.

**Realization types**: primary keys and every `*_id` or `*_by` column are `CHAR(26)` ULIDs, document columns are `JSONB`, timestamps are `TIMESTAMPTZ`, and the polymorphic triple is `entity_type` plus `entity_id` plus an optional `entity_name`.

**JSONB bridges the casing gap.** A `config_json` column carries `camelCase` keys that deserialize straight into a contract type.

## Quick reference

| Item | Pattern | Example |
| --- | --- | --- |
| Class | PascalCase | `UserService` |
| Class interface | `I` + PascalCase | `IUserService` |
| Support class | area + subject + kind | `KindManifestStore` |
| Support provider | area + `Provider` + vendor | `IngressProviderNginx` |
| Seam interface | `I` + area + `Provider` | `IIngressProvider` |
| Props interface | `I` + component + `Props` | `IDSButtonProps` |
| Form state | `I` + what it edits + `FormState` | `IRoleFormState` |
| Props group | `I` + component + group + `Props`, from the owner's props by `Omit` or `Pick` | `IDSFeatureGridSectionContainerHeadingProps` |
| Shared props shape | `I` + what it is, no `Props`, no `Config` | `IDSFrameSurface`, `IDSGridColumns` |
| Web module unit | ends in what it is: `Page`, `Container`, `Widget`, `Dialog`, `Form`, or a pattern's word | `RoleListContainer` |
| Web module plain component | no suffix needed | `RoleBadge` |
| Contract entity | PascalCase, no `I` | `User` |
| State levels | Meta inside Info inside the state, by `extends` | `IdentityMeta` |
| Detail aggregate | `{Entity}Details`, composed | `RoleDetails` |
| Input command | `{Action}{Entity}Command` | `CreateUserCommand` |
| Enum | PascalCase + `Type` | `DSButtonType` |
| Discriminator | `<noun>Type` and `<noun>_type` | `credentialType` |
| Variance carrier | `{Host}{Role}` and `{Host}{Role}{Variant}` | `OrgAuthProviderConfigSAML` |
| Helper | `prepare*` | `prepareServiceAppConfigFromEnv` |
| Id suffix | `Id` / `Ids` | `accountIds` |
| Constant | `UPPER_SNAKE_CASE` | `DS_SIZE_ICON_SIZE_MAP` |
| Package | `@saasplane/{scope}-ts` | `@saasplane/support-server-ts` |
| Generated validator | `{Interface}Schema` | `SPCapabilityIndexSchema` |
