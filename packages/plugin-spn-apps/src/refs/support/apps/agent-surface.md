<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/01-apps/08-agent-surface.md",
      "seen": "c68ccf85"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/08-agent-surface/",
      "seen": "68b30940"
    }
  ]
}
-->

# The generated agent surface — symbols and labels

Source of truth: the foundation's **Generated Agent Surface** construct chapter, and the **Agent Surface** capability chapters — symbols, labels, validators and barrel.

Install a package and its source stays behind. You still owe whoever works against it — including you, in a later session, on a package you did not write — what exists, what each thing is for, what calling it costs, and what must not be touched. A node answers with a small set of generated artifacts, each derived from a declaration and its comment, never hand-edited afterward.

## The one rule that governs all four

**If a fact is derivable from what a developer wrote, it is derived — and then it is never hand-edited.** The source plus a regeneration is the only edit path. Read the generated artifact to decide what exists; never hand-add an entry to it yourself, and never treat an edit inside it as a fix — your fix belongs upstream, on the source it was derived from.

- **Generated at build, carried in the package.** The artifact travels inside the archive it describes, so the artifact and the code are the same version by construction. Never regenerate one yourself from an installed package — regenerating a description from installed output is inferring a surface, not reading one.
- **Generation never fails a build.** A source file that cannot be read costs its own entries and nothing else. The one thing the generator refuses to do is emit something that fails its own schema — an invalid artifact reaching a consumer is worse than no artifact at all.
- **Correctness is a count.** What was published and what the artifact describes are the same set, every entry exactly once. A mismatch is a defect the generator reports about itself; it is never something you are expected to notice by reading the surface by eye.
- **A generated file protects its hand-earned regions.** Where a document or a barrel has room for something a developer wrote, that room is marked, and the generator owns everything outside the markers and nothing inside them.

A hand-written index is correct the day it is written and wrong the day the code moves on without it — and it fails silently: a consumer finds out by writing code against something no longer true. Deriving it moves that failure to build time, in front of whoever caused it.

## The symbol index: what to decide a call from

**The bar: write a correct call to any published symbol using the index alone, without opening a source file.** *Correct* means more than compiling — the right symbol, the right arguments, the right permission, the right failure handling, and knowing the thing is not deprecated. Before you write a call against an installed package, read its entry in the merged symbol index rather than guessing from the name or reading past the barrel into its source.

Three kinds of fact, and only two are carried:

| Kind of fact | Example | Carried in the index |
| --- | --- | --- |
| Index | this operation exists, and this is its name | yes |
| Governance | it demands this permission, raises these codes, answers this route | yes |
| Shape | this command has these members | no — referenced by name |

Shape already has regenerated, authoritative sources — the validators, the published types, the interface document. A fourth copy would be the one nobody updates. The index gets a reader to the name; the name is then looked up wherever it is authoritative.

### One package, one flat list

A package's `symbols` array is **exactly its published surface** — no nesting, no layer wrapper, no file paths. A symbol is imported by package and symbol name, so the file it was written in is never part of the answer, and a barrel cannot re-export two identical names, so the list cannot collide.

```ts
export interface SPKindSymbol {
  name: string; group: string; role: SPKindSymbolRoleType;
  internal: boolean; deprecated: boolean;
  intent: string | null; description: string | null;
  signature: string | null;
  roleMeta: SPKindSymbolRoleMeta | null;
  seam: SPKindSymbolSeam | null;
}
```

| Field | Carries | Absent is |
| --- | --- | --- |
| `name` | the exported name; a member is written `Owner.member` | — |
| `group` | the published source folder it came from — the join to the capability document explaining it | — |
| `role` | what kind of thing this is, from the closed role set | — |
| `internal` | exported and reachable, while the layer model says do not call it | `false` |
| `deprecated` | still published, no longer the way | `false` |
| `intent` · `description` | harvested from the declaration's own doc comment — the opening sentence, and the same comment at full length | `null` |
| `signature` | the stack-rendered shape — the only field a stack spells its own way | `null` |
| `roleMeta` | what the role owes beyond the common facts, polymorphic by the role itself | `null` |
| `seam` | how to compose it correctly, present only where a real choice sits behind the capability | `null` |

**Every key is always present.** JSON has no `undefined`; absence is `null` for a value and empty for a collection, never a key that sometimes goes missing.

`intent`, `description` and `seam` are harvested mechanically from the declaration's own comment: the first line is `intent`, everything up to the first tag is `description`, and the `@seam*` tags become `seam`. None of it is authored into the artifact by hand.

### The role set is closed

A role that cannot be filtered on is a role that does not exist, so the set stays worth having only while it is small and identical across every stack:

```
SERVICE · IMPLEMENTATION · OPERATION · MANAGER · STATE · COMMAND · EVENT · ENUM · ERROR · PERMISSION
ENTITY · REPOSITORY
API · QUEUE · CLI
PAGE · COMPONENT · WIDGET · HOOK
UTIL · TYPE · CONFIG
```

| Group | Roles | Decided by |
| --- | --- | --- |
| The contract — what a consumer may call | `SERVICE` `OPERATION` `STATE` `COMMAND` `EVENT` `ENUM` `ERROR` `PERMISSION` | shape, then name — an enum named in the error or permission vocabulary takes that role; every other closed vocabulary is `ENUM` |
| The implementation | `IMPLEMENTATION` `MANAGER` `ENTITY` `REPOSITORY` | shape, then a name suffix; `REPOSITORY` is always internal |
| Transports — mounted by a host, never called by a consumer | `API` `QUEUE` `CLI` | the entry folder the symbol sits under — not the class suffix, which differs by stack |
| The web surface | `PAGE` `COMPONENT` `WIDGET` `HOOK` | shape, and path for `PAGE` — structurally a component, position alone says it is a destination |
| A library's own exports | `UTIL` `TYPE` `CONFIG` | shape, and last — where nothing more specific claimed it |

`ERROR` and `PERMISSION` are split out of `ENUM` for the reason `COMMAND` and `EVENT` are split out of `STATE`: filtering on *what can go wrong here* or *what may be required* takes one role rather than a naming convention held in memory.

Four signals classify a symbol, each deciding a different thing: **shape** decides `role`; the **top-level folder** decides `group`; **path** decides `internal`, because two identical shapes differ only by location; and **kind** decides how the path is read — a module's `app/` is its implementation, a support package's `app/` is the framework its consumers extend.

**`group` is the first published path segment under the source root, normalized** — a layer name for a module, a capability folder's own name for a support package. It is a plain string, not a closed list. A symbol at the source root belongs to the node's frame; a private segment publishes nothing and produces no group; a re-exported symbol keeps the group of the file that **defines** it, never the barrel's — a barrel is an address, not an owner.

**`internal` is the measure of a gap, not a second privacy mechanism.** A kind carrying module layers keeps `app/` out of the published index, with entities and utils excepted. A package excludes what it does not publish through a private path segment, an unexported declaration, or a private member — `internal` marks the case where something is published while the layer model says otherwise. A package whose barrel is correct emits none of it.

### What a role owes beyond the common facts

`roleMeta` carries what the role needs and nothing every other row has to carry empty — a `mtype` discriminator names the role itself:

| Role | `roleMeta` carries |
| --- | --- |
| `ENUM` · `ERROR` · `PERMISSION` | `values`: member name → its value and, where the name is not the meaning, its description |
| `ENTITY` | `joinKeys` — enough for a declared cross-schema read, never enough to rebuild the table |
| `OPERATION` | `errors` it can raise, the `authz` reference that gates it (`null` if ungated), and `http` as method-and-path in one string (`null` off the API transport) |

A future role's needs arrive as one more `roleMeta` variant, never as a key every other symbol's row carries empty.

**`seam` rides the symbol only where a real choice sits behind the capability** — an engine, a vendor, a mode, a policy a consumer supplies. A capability group holding two implementations and no seam is a choice nothing explains, and the generator reports it. `seam.provenBy` is derived from a test's own title citing the symbol, never authored by hand — a renamed or deleted test changes the answer instead of leaving a stale claim standing.

### Generated at build, merged on install

The index is generated during the package's own build and travels inside the archive it describes. A consuming repository builds its own merged index by **concatenating** every installed package's entry into one envelope — nothing re-derived, one schema validating the part and the whole.

**Publishing means emitting an index, with no exception.** Every installable kind emits one, including the command-line tool and the API client — the client matters most, since a consumer frequently installs it and nothing else of the service it mirrors. A kind that deploys rather than installs emits nothing; an empty artifact would claim a surface that does not exist.

**Only `signature` is stack-spelled.** Every other field — `role`, `intent`, `seam`, everything riding `roleMeta` — is a platform fact, identical across stacks, which is what lets one merged index hold packages built by different toolchains.

## Labels: the index of what a surface says

Read this beside the symbol index — both are **generated indexes of a surface**: one of what the code offers, one of what it says to a person. Neither is hand-curated.

**Every user-facing string is produced by one translate capability, taking exactly three arguments:**

| Argument | Is | Rule |
| --- | --- | --- |
| key | the label's identity | normalized on the way in, unique in one flat key space, additive forever |
| message | the source-language text, written at the call site | the default a reader sees when no catalog entry exists — never a placeholder, never the key |
| variables | named values interpolated into the message | named, never positional; never pre-formatted into the message by string assembly |

**The manifest is extracted by scanning call sites, never hand-written.** Nobody hand-curates it: a key added by editing the manifest describes a string nothing renders. Keys are normalized at extraction, so one string cannot enter the vocabulary twice under two spellings. Extraction is complete or it is broken — a string the scan cannot see (assembled at runtime, built by concatenation, passed through an indirection) is a defect in the call site, never a limit of the tool to work around with a different call shape.

```ts
export interface SPKindLabel {
  code: string; category: string; fallback: string;
  variables: { name: string; type: SPDataFieldType }[];
}
```

**A miss falls back to the call-site message — never to an empty string, never to the raw key.** A reader shown a key has been shown the platform's interior; a reader shown correct source-language text has been shown the worst case, which is what makes shipping ahead of translation safe. A value inside a sentence is formatted by a locale-aware formatter, never pre-formatted into the message by string assembly — a pre-formatted date has silently chosen a locale for every reader.

| Is a label | Is not |
| --- | --- |
| any string a person reads — actions, headings, empty states, confirmations | an error code or a permission code — a surface renders a label **for** a code, and never translates the code itself |
| the message a surface renders for an error it received | data — a customer's own text is content, not vocabulary |

**The server never localizes.** It returns codes and structured states; the surface holding the reader's language resolves them. There is one localization boundary, at the only place that knows who is reading. Only web kinds emit a label manifest — a server kind renders no label of its own.

## Validators and the barrel, briefly

Two more artifacts sit on the same rule and the same folder, covered at length where they are authored rather than where they are read:

- **A validator is a runtime schema for exactly one contract state** — its members, their types, which are required, its constraints (carried as tags on the state, never restated in prose or re-implemented in the service), and for a polymorphic family, its discriminator resolved to the member's **value**, never its name. It guards every entry point a value can arrive through: an API request, a cache hit, a queue message, configuration at boot, a persisted document. Never hand-edit one — your fix belongs upstream, on the state.
- **The barrel is one export index per package, at the package root — never a second entry point.** A leading underscore on a folder, a file, or a member marks it not part of the published surface, at any depth. The barrel publishes only what the layer model reaches; it cannot publish what the layer model does not. Support packages and module packages carry one; applications, command-line tools and generated API clients do not — an app's entry file is a bootstrap, not a surface, and an API client's surface is the client itself.

## What is not in this index

The index tells you a symbol exists, what it costs, and its name. It does not carry a Command's member shapes, a state's full field list, or a response schema — read those from the validators and the generated interface document by the name the index gave you, rather than expecting them duplicated here. And the doc-comment syntax a symbol's `intent` and `seam` are harvested from — how the comment itself is written — is a different standard, covering the writing rather than the artifact it lands in.
