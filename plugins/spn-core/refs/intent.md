# Documentation That Generates — Stack-Agnostic

A doc comment on a published declaration is not a note to the next reader of that file. It is **harvested** — into the symbol index an agent decides from, into the interface document, into the API client, and into the tool definitions an agent calls. One comment, several surfaces, none of them written by hand.

That makes the comment an **interface**, and it earns the same discipline as one: written once, in the caller's terms, and never restated somewhere it can drift.

## The intent line

**The first sentence of a declaration's doc comment is its published description.** Everything after it stays where it is.

- **One sentence.** Write it in the present tense, ending with a period.
- **Say what a caller achieves**, never how the implementation works. *"Renews a certificate approaching expiry"* — not *"loops the provider API until the status flips"*.
- **Never restates the signature.** A reader already has the name and the types; a line that says *"Creates a group"* above `createGroup` has spent a line saying nothing.
- **No preamble.** Not *"This function…"*, not *"Helper that…"*.

```
/** Mints a time-limited URL so a caller can reach the object without credentials. */
/** Reports whether a key is present, without transferring its contents. */
```

## The contract says WHAT; an implementation says how it realizes it

**A description is never written twice — but an implementation is not a repetition, it is a different fact.** The contract states the outcome a caller gets. The class behind it states *with what*, and that is precisely what a caller choosing between two of them needs.

```
contract    /** Stores a value under a key for a bounded lifetime. */
Redis       /** Redis realization — SETEX with the configured lifetime. */
in-memory   /** In-process map, cleared on restart — for tests and local runs. */
```

So: **describe an implementation only when the realization is a fact worth knowing** — the vendor it talks to, the mechanism it uses, the trade it makes. Where a contract has exactly one implementation and the realization adds nothing, say nothing; the contract already answered.

**Transport adapters are the exception that stays silent.** A controller, a listener or a command-line adapter over a contract method adds no fact — it moves the same operation across a boundary. The contract described the operation; the route or the topic describes the boundary; a sentence in between would only restate one of them.

If a description is worth writing in two places with the *same* content, that is the signal it belongs in one place further up.

## Never name what the package does not depend on

A published package is read by people and agents who have **only that package**. So a comment must resolve using nothing but what the package itself declares.

Out, always:

- **Storage identifiers** — table names, column names, schema names.
- **Codes owned by another package** — permission codes, error codes, module mnemonics.
- **Enum values from a package this one does not depend on.**
- **Anything from a repository the reader has no access to.**

Write the fact in the package's own terms when it genuinely matters. Say *"the platform's currency reference data"* rather than a table name, and *"the value the server persists"* rather than a column.

## Constraints live in the same comment, as tags

A contract member's doc comment carries two things, and they do different jobs. The **prose** is read by people and agents. The **tags** are read by the validator generator, which turns them into the runtime schema.

```
/** The name shown to other members. @minLength(1) @maxLength(80) */
displayName: CDTString;
```

- **A tag is not a comment about validation — it IS the validation.** The generated validator is derived from it, so the constraint is declared once and enforced automatically. Never restate it as a hand-written check in the implementation, and never describe it in prose. A prose line like *"must be at least one character"* is a second copy that drifts the moment the tag changes.
- **Tags never reach the description.** The harvester stops at the first tag, whether it opens a line or trails the prose. So a member can carry both without the constraint leaking into what a reader sees.
- **Put prose first, tags after.** They may share the line; the order is what keeps both readable.
- A member with only a constraint needs no prose at all — `/** @minLength(1) */` is a complete comment when the name already says what the value is.

## Keep the rest out of the first sentence

Elaborate as much as you like — it simply must not be the opening sentence, because the opening sentence is what travels.

- Put the reasoning **after a blank line**. It stays in the file and never reaches a generated surface.
- **No long prose where the code already shows it.** A comment that narrates the next three lines is a maintenance cost with no reader.
- **The only comments worth keeping state a constraint the code cannot show** — an ordering that matters, a bound that is not obvious, a deliberate deviation.
- **No changelog.** Not *"previously"*, not *"changed to"*.

## What each surface takes

One comment, four readers. Knowing which reader takes what stops you writing a description in the wrong place:

| Surface | Takes | From |
| --- | --- | --- |
| **Capability** | `intent` on every symbol, and the long form beside it | the declaration's own comment |
| **Interface document** | the description on each operation, request body, response and **property** | the Command state and its members, the result state |
| **Generated client** | the doc comment on each generated function | whatever the interface document carried |
| **Agent tools** | the tool description · each input field's description | whatever the interface document carried — so, the Command and **its members** |

Look again at the last row — it is the one people miss. An agent calling a tool is shown the **input fields**, so a Command's member comments are what tell it *what to put in them*. A perfectly described operation with undescribed Command members is a tool an agent can find and cannot fill.

**The path is a state's comment, not an operation's.** A description reaches the interface document by riding the schema the validator generator builds. So what an operation says about itself in the document is what its **Command state** said. Each property description is what that member's comment said. A comment above the contract method still becomes the capability `intent`, and it is still the sentence someone reads in the source. It simply is not the one a caller sees in the document. **Write the Command and its members as if a stranger will read them, because that is exactly who does.**

## Per symbol — where the line goes and what it says

**Describe it here** means: this is the declaration that carries the comment. Everything downstream inherits.

| Role | Describe it | Say | Example |
| --- | --- | --- | --- |
| `SERVICE` | the interface | the domain surface it groups | `/** Groups, and who belongs to them. */` |
| `OPERATION` | the **contract method** | what the caller achieves | `/** Creates an org-scoped group for bulk role assignment. */` |
| `COMMAND` | the interface, **and each member** | members matter most — they become tool input fields | `/** The name shown to other members. @maxLength(80) */` |
| `STATE` | the interface | what the shape represents, not its fields | `/** One group, with its member count. */` |
| `EVENT` | the interface | what happened, past tense | `/** A group's role assignment changed. */` |
| `ENUM` | the enum; members only where the name is opaque | what the vocabulary classifies | `/** How a value is positioned against its label. */` |
| `ERROR` | the enum; **each member** | when it is raised, so a caller can branch | `/** The verification code expired or was already used. */` |
| `PERMISSION` | the enum; **each member** | what holding it allows | `/** Administers members, roles and groups. */` |
| `ENTITY` | the class | what it stores — never its columns | `/** A group and its org scope. */` |
| implementation of a contract | the class | **how it realizes it** — the vendor, the mechanism | `/** Redis realization — SETEX with the configured lifetime. */` |
| `REPOSITORY` | — | nothing; internal, and the contract already said it | |
| `CONTROLLER` · `LISTENER` | — | nothing; a transport adapter adds no fact the route or topic does not | |
| `CLI_COMMAND` | the `.description()` | what the verb does, as `--help` shows it | `.description('Generate the symbol index')` |
| `COMPONENT` | the exported binding | what a user can do with it | `/** Rename one customer account. */` |
| `HOOK` | the exported binding | what it returns and when it refetches | `/** One system provider, reloading on demand. */` |
| `PAGE` | the exported binding | the screen, in product words | `/** The account list, filtered by org. */` |
| `UTIL` | the exported function | what it computes | `/** Formats a value in its currency's local convention. */` |
| `TYPE` · `CONFIG` | only when the name does not carry it | | |

Two rules that fall out of the table:

- **Never describe a `REPOSITORY`, `CONTROLLER` or `LISTENER` operation.** Each one adapts or implements a contract method that is already described. A second description there is the restatement that drifts.
- **A `COMMAND`'s members earn more care than the Command itself.** The Command's name is usually self-evident; its members are what a caller — or an agent filling a tool call — has to understand.

## Required where something decides; optional elsewhere

A blanket requirement would contradict the rule above it: forced to describe everything, an author writes `/** Creates a group. */` over `createGroup`, and **filler is worse than absence because it looks like information.** So the requirement follows the decision, not the declaration count.

| Required — the gate blocks | Optional — write it when it adds something | Never |
| --- | --- | --- |
| a contract **service** and each of its **operations** | a state, a type, a config binding | a repository |
| a **component**, a **hook**, a **page** | an enum whose members explain themselves | a controller, a listener |
| every **error code** and **permission code** member | | |
| every **Command member** — these become an agent's tool input fields | | |

Read the required column as exactly the set something else has to choose from or fill in. The optional column is where a name already carries the meaning, and a sentence would only repeat it.

A missing description in the required set is a symbol an agent cannot select. A wrong one anywhere is worse — it will be acted on. **Leave it blank and say so** where the purpose is genuinely unclear from the code, rather than writing something plausible.

---

# Rationale — the Comment That Stays

The other half of the standard. An **intent** comment leaves the file; a **rationale** comment never does. Write it for one reader: whoever edits this code next.

Doc-comment syntax is harvested into published surfaces; a line comment is not. **Put a rationale in a line comment** — a note in a doc comment above a published declaration will be published whether or not that was intended.

## When a line is worth it

Not "is this complex?" but **"would a competent reader change this and break something invisible?"**

| Worth it | Not |
| --- | --- |
| A constraint the code cannot express — required ordering, an invariant held elsewhere | A line whose name already says it |
| A deliberate trade — the slower path chosen for a reason, duplication kept on purpose | A restatement of the next statement in English |
| Foreign behavior worked around — a vendor quirk, a protocol ambiguity | Standard use of a well-known construct |
| A deviation from a standard, with its reason and the trigger to revisit | Anything a test asserts more precisely |
| A non-obvious **absence** — why something expected is deliberately not done | |

State the **consequence**, not the observation: *"reordering these loses the lock"* survives a refactor; *"careful with the order"* does not.

## Where it goes

Put it immediately above the surprising thing, in the smallest scope that contains it — never collected in a file header, where it is read by everyone and applies to nobody.

## Always wrong

| Never | Because |
| --- | --- |
| Narration of the following lines | Doubles the reading cost and drifts on the first edit |
| Changelog prose — "previously…", "changed to fix…" | History is in the history |
| Commented-out code | A claim that something might come back, held by nobody |
| An ownerless `TODO` | A note with no owner and no trigger is a wish |
| A constraint already carried by a validation tag | Two statements of one rule, one of which will be wrong |
| A secret, a credential, or customer data | A comment is source, and source travels further than anyone expects |

## Maintenance, and the two promotions

A rationale is **changed in the same edit as the line it explains, and deleted the moment its reason dies**. A stale *why* is a false statement in a place readers trust. A change that invalidates a comment and leaves it standing is an incomplete change.

- A reason a **consumer** needs is not a rationale — promote it to the intent line, where they will actually see it.
- A reason that **recurs** across files is one choice nobody recorded — write it once in the decision register and let the comments cite it.

**Never fill a file with narration to look thorough.** An unnecessary comment is a defect the same way an unnecessary abstraction is.

