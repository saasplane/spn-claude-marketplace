<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/05-code.md",
      "seen": "5898a308"
    }
  ]
}
-->
# Code — the patterns a reviewer expects in any file

**Source of truth:** the foundation's `10-providers/ts/05-code.md`. Read this as the restatement; that chapter governs.

**Some rules follow you into every file, whatever the runtime.** These are them: how code leaves a package, how a contract type is shaped, how you sequence asynchronous work, and what a comment is for.

## Exports

**Always a named export — `export const`, `export class`, `export interface`.** A default export has no canonical name, so every importer may spell it differently, and rename refactors and find-all-references both stop working.

**Use an interface for an object shape and a type for a union or intersection.** An interface is what a class can implement and what a declaration can merge into; a union can be neither.

**Never leave a shape inline.** An anonymous nested shape cannot be imported, reused or named in an error message. Extract it and give it a name.

### How code leaves a package

| Rule | Why |
| --- | --- |
| named exports only | a symbol has one spelling |
| one barrel, at the package root | a consumer has exactly one import path per symbol |
| no barrel-only `index.ts` in a subfolder | a second path for one symbol, which `gen-barrel` does not maintain |
| never re-export another package's symbols | forwarding hides which package owns a symbol and leaks its surface through yours |

**The root barrel is generated.** Run `spnutils apps gen-barrel <package>` after adding a file rather than editing it. Importing and using another package's symbols is fine; re-publishing them is not.

**Within one package, import relatively.** Routing through your own barrel works and risks a circular import.

## Module method naming

**Write a utility function as `verb` plus module plus action** — `formatDateISO`, `validateStringEmail`, `filterArrayUnique`. A bare `format` or `parse` collides the moment two utility modules are imported together, and says nothing at the call site.

## Imports

**Keep the groups in this order, separated by a blank line**: Node built-ins, external libraries, internal `@saasplane/*` packages, then relative imports. Consistent order makes an unfamiliar file's dependencies readable at a glance and keeps diffs small.

## Asynchronous work

- **On the server, `await` is how you sequence work.** A `.then()` chain says the same thing at more length, and is a second style in a file whose every other function awaits.
- **An async function returns `Promise<T>`** — the signature declares the resolved type, never a bare `Promise`.
- **Await or return every promise.** A floating promise swallows its rejection, and fire-and-forget must be a visible decision.
- **Logging is asynchronous too**, and logging is not handling: after catching to log, re-throw.

**One exception: a synchronous contract you do not own.** A library that takes a callback and expects nothing back cannot be handed an async function, because the promise it returns is one nobody awaits. Keep the outer function synchronous and put the work in a deliberately unawaited immediate async function, marked with `void`, awaiting inside as the rest of the file does.

**An awaited `.catch()` supplying a fallback is a default, not control flow.** Leave `await response.json().catch(() => null)` where it stands; a `try` block around it is longer and says less.

## Object literals

**Never use shorthand**, at any nesting level — the rule is enforced by lint. An explicit `key: value` makes the wire or database field name visible at the assignment site, so renaming a local variable can never silently rename a serialized key.

**Build a return value as an explicitly typed `const`, then return it.** The annotation makes the compiler check the shape at the construction site rather than only against the inferred return type, and it keeps the value inspectable in a debugger.

**When the value belongs to a polymorphic family, annotate the variant the literal builds** — never the base carrier and never a union. A variant annotation checks the exact shape and says which branch this is; a base annotation would reject the variant's own fields.

**A call argument follows a lighter rule.** Hoist to a named typed `const` when the literal has more than four fields, or contains a nested object or array literal. Keep small flat arguments inline. Hoist our own domain commands and configs; leave a third-party option object inline, because its parameters are already typed by the signature.

## Contract types

**Props and contracts are two families with opposite rules.** Props describe a React call site; a contract describes bytes crossing a process boundary.

| | UI props | Backend contracts |
| --- | --- | --- |
| Name | `I{Component}Props` | PascalCase, no prefix and no suffix |
| Functions | allowed | not serializable |
| Optional `?` | allowed | use `\| null` instead |
| React types | allowed | not allowed |
| Dates | `Date` objects | `CDTDate` |
| Contract data types | not needed | required |

**A contract field is `| null`, never optional** — a wire contract has no absent key.

**Contract data types are the closed set of JSON-representable types.**

| Type | Runtime shape |
| --- | --- |
| `CDTBoolean` | `boolean` |
| `CDTInt` · `CDTLong` · `CDTDecimal` | `number` |
| `CDTString` | `string` |
| `CDTDate` | `string`, `YYYY-MM-DD` |
| `CDTTime` | `string`, `HH:mm:ss` |
| `CDTDateTime` | `string`, ISO with milliseconds and a `Z` |
| `CDTJSON` | `Record<string, unknown>` |

**Every deserialization validates** — on arrival at the API, on a cache hit, from a queue payload, and at boot for configuration.

### Narrowing a polymorphic value

**A family is a base plus `extends` variants and never a union, so TypeScript never narrows it for you.** The idiom is to check `mtype`, then cast to that variant; the enum check is what licenses the cast.

- **The cast sits directly under the check that proves it.** Never a bare cast on an unchecked value, and never inferring the variant from the presence of a field.
- **A value arriving from any medium has already passed its generated family validator**, which accepts only a known `mtype` with its matching shape. The switch routes variants; it does not revalidate.

### Field validation tags

**Attach a constraint to a contract field with a same-line JSDoc tag** — `@min`, `@maxLength`, `@pattern`, `@minItems`. `spnutils apps gen-validators` reads them and emits the matching validator chain, so the contract source stays the one source.

## Comments

**Intent is a JSDoc block; rationale is a line comment.** That is the whole of the rendering, and it is not a style preference — the harvester reads block comments and nothing else, so a published declaration described with `//` has a description that never leaves the file.

**Intent is one line, present tense, saying what the caller achieves.** Write it when the item is created, on a contract service method, an exported UI component, or a CLI command's own description. `spnutils apps gen-symbols` harvests it into the symbol index, and a surface without intent is one an agent must open files to understand.

**Rationale sits above the surprising line, in the smallest scope containing it**, and states the consequence. Worth a line: a vendor quirk worked around, a required ordering, a deliberate trade, a deviation with its reason, a non-obvious absence.

**Never write** narration of the next statement, history prose, commented-out code, an ownerless `TODO`, or a constraint a validation tag already carries. A rationale changes with the line it explains and is deleted when its reason dies.

**A reason a consumer needs is not rationale** — promote it to the intent block. A reason that recurs across files is a decision-register row, cited from the code rather than repeated in it.

**What the comment check refuses on a source write**: a history word, a comment repeating its own line, a guess, a line comment where a block is required, and an intent block naming a table its package does not declare. **What it reports without refusing**: a rationale past three sentences, and a rationale naming a constraint a caller would need.
