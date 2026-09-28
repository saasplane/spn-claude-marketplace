<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/02-support/01-apps/07-comments.md", "seen": "77e59a2e" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/07-comments/", "seen": "5e933f03" }
  ]
}
-->

# Comments — what publishes, and what stays

Source of truth: the foundation's **Code Comments** construct chapter, and the **Comments** capability chapters — intent and rationale.

One question sorts every comment you write: does it leave the file, or does it stay. A doc comment (`/** … */`) on a published declaration is harvested — turned into the symbol index, the generated interface document, the API client, and the tool definitions an agent calls. A line comment (`//`) is read by whoever opens the file, and by nothing else. Confusing the two is the standard failure: implementation detail leaking into a published description, and the reason a strange line exists written nowhere at all.

## The one line that decides which channel you are in

**A doc comment on a published declaration publishes and reaches a consumer holding only the package. A line comment does not leave the file, however important its content.** Put a `//` above a declaration that needs a description and the harvester cannot see it — the description never travels, and nobody notices until the generated client ships with an empty summary.

| | Intent — harvested | Rationale — resident |
| --- | --- | --- |
| Syntax | doc comment (`/** */`) on the declaration | line comment (`//`), on the line |
| Answers | what a caller achieves | why the code is this way |
| Read by | someone holding only the package | whoever edits this code next |
| Travels to | the symbol index, the interface document, the generated client, agent tool definitions | nowhere |
| Required | every published declaration | only where genuinely surprising |

## Intent: one sentence, in the caller's terms

The first sentence of a declaration's doc comment is its published description, and it is the only place that sentence is written.

- **One sentence, present tense, ending in a period.** Say what a caller achieves — *"Renews a certificate approaching expiry"* — never how it works inside.
- **No preamble.** Not *"This function…"*, not *"Helper that…"*.
- **Never restates the signature.** *"Creates a group"* above `createGroup` spends a line saying nothing a reader does not already have.
- **A missing description is a symbol nobody can select. A wrong one is worse, because it will be acted on.** Where purpose is genuinely unclear, leave it blank and say so — a plausible guess is indistinguishable from knowledge once it is published.

Elaborate as much as you like after a blank line — everything up to the first tag is the description, and it is harvested too, but only the opening sentence is what a reader sees when choosing between forty operations. Omit the long form entirely when one sentence says it all; a second copy of the same sentence under a different key is noise a reader has to look past.

## What a comment must never name

A published package is read by people and agents holding **only that package** — no source, no database, no sibling repository. So an intent comment MUST resolve using nothing but what the package itself declares:

| Never name | Because |
| --- | --- |
| a storage identifier — a table, a column, a schema | a consumer holds a package, not a database |
| a code owned by another package — a permission code, an error code, a module mnemonic | nothing in this package defines it |
| an enum value from a package this one does not depend on | the reader cannot follow the reference |
| anything from a repository the reader has no access to | most readers have none of them |

Write *"the platform's currency reference data,"* never a table name. Write *"the value the server persists,"* never a column. Writing the fact in the package's own terms is not a weaker version of the specific one — it is the only version a consumer can act on, and it is the version to reach for even when the exact table name is right there in the code you are looking at.

## One comment, four surfaces

| Surface | Takes | From |
| --- | --- | --- |
| Symbol index | `intent` on every symbol, `description` beside it | the declaration's own comment |
| Interface document | `description` on every operation, request body, response and **property** | the Command state and its members, and the result state |
| Generated client | the doc comment on each generated function | whatever the interface document carried |
| Agent tools | the tool description, and **each input field's description** | the Command and its members |

The last row is the one people miss. An agent calling a tool is shown its input fields, so a Command's **member** comments are what tell it what to put in them. A perfectly described operation with undescribed members is a tool an agent can find and cannot fill.

**The path is a state's comment, not an operation's.** An operation's description in the generated document is what its Command state's comment said, and each property description is what that member's own comment said. A comment above the contract method still becomes the symbol index's `intent` — the discovery label an agent filters on — but it is not what a caller of the generated API reads. Write the Command and its members as if a stranger will read them, because that is exactly who does.

## Where the comment goes

Describe a symbol on the declaration that **owns** the meaning. Everything downstream inherits, and a second description downstream is the copy that drifts.

| Symbol | Describe it on | Say |
| --- | --- | --- |
| a service | the interface | the domain surface it groups |
| an operation | the contract method | what the caller achieves |
| a Command | the interface, **and each member** | members matter most — they become tool input fields |
| a state | the interface | what the shape represents, not its fields |
| an event | the interface | what happened, past tense |
| an enum | the enum itself | what the vocabulary classifies |
| an error code | **each member** | when it is raised, so a caller can branch |
| a permission code | **each member** | what holding it allows |
| an entity | the class | what it stores — never its columns |
| an implementation of a contract | the class | how it realizes it — the vendor, the mechanism |
| a repository, a controller, a listener | nothing | a transport adapter adds no fact the contract or the route does not already carry |

An implementation is not a repetition of its contract — it is a different fact. The contract states the outcome; the class states **with what**, which is exactly what a caller choosing between two of them needs. Describe an implementation only when the mechanism is worth knowing. Where a contract has one implementation and the realization adds nothing, say nothing — the contract already answered.

## Required where something decides; optional where a name already carries it

| Required — a missing one is a defect | Optional — write it when it adds something | Never |
| --- | --- | --- |
| a service and each of its operations | a state, a type, a config binding | a repository |
| a component, a hook, a page | an enum whose members explain themselves | a controller, a listener |
| every error code and permission code member | | |
| every Command member — these become tool input fields | | |

A blanket requirement would produce `/** Creates a group. */` over `createGroup` on every method, whether or not it has anything to say. **Filler is worse than absence, because it looks like information.**

## The seam tags: the half of the contract a signature cannot carry

A capability with a **real choice** behind it — an engine, a vendor, a mode, a policy a consumer supplies — carries five more tags after the description:

```
/** Refuses the call unless the principal holds the permission.
 *
 * @seamGuarantee  the method does not execute unless the principal holds it in the app scope
 * @seamPlacement  on the service method, never the controller
 * @seamContext    principal, org, app scope — the caller passes none of it
 * @seamRefusal    it does not scope the data; the org predicate is a separate seam
 * @seamPhrase     "gated on X through the authorize seam" */
```

- **Only a real choice earns them.** A seam with a single permanent answer is ceremony, sending a reader looking for a choice that was never there.
- **`@seamRefusal` names the adjacent capability this one is mistaken for — it MUST NOT restate the description.** Say the same thing in both places and one of them is already stale.
- **You never write what proves a seam.** A test's own title cites the symbol, and the proof is derived from that; a renamed or deleted test changes the answer rather than leaving a claim standing behind it.
- **Tags come last, always.** The description is everything before the first tag, so a tag placed mid-comment silently truncates the description and nothing warns you.

## Constraints are tags, not prose

A contract member's comment also carries tags the validator generator reads:

```
/** The name shown to other members. @minLength(1) @maxLength(80) */
displayName: CDTString;
```

**A tag is not a comment about validation — it IS the validation.** The generated schema is built from it. MUST NOT restate it as prose (*"must be at least one character"* beside the tag is a second copy that drifts) and MUST NOT re-implement it as a hand-written check in the service. Tags never reach the harvested description, whether they open the comment or trail the sentence — a member with only a constraint needs no prose at all when the name already says what the value is.

## Rationale: the comment that stays

The other half answers **why**, not what — the code already shows what. You write it for one reader: whoever edits this line next.

The test is not "is this complex" but **"would a competent reader change this and break something invisible?"**

| Worth it | Not |
| --- | --- |
| a constraint the code cannot express — required ordering, an invariant held elsewhere | a line whose name already says it |
| a deliberate trade — the slower path chosen for a reason, duplication kept on purpose | a restatement of the next statement in English |
| foreign behavior worked around — a vendor quirk, a protocol ambiguity | standard use of a well-known construct |
| a deviation from a standard, with its reason and the trigger to revisit | anything a test asserts more precisely |
| a non-obvious absence — why something expected is deliberately not done | |

State the **consequence**, not the observation: *"reordering these loses the lock"* survives a refactor; *"careful with the order"* does not. Put it immediately above the surprising thing, in the smallest scope that contains it — never collected at the top of a file, where it is read by everyone and applies to nobody.

| Always wrong | Because |
| --- | --- |
| narration of the following lines | doubles the reading cost and drifts on the first edit |
| changelog prose — *"previously…"*, *"changed to fix…"* | history belongs to the change record, not the source |
| commented-out code | a claim that something might come back, held by nobody |
| an ownerless TODO | a note with no owner and no trigger is a wish |
| a constraint already carried by a validation tag | two statements of one rule, and one will be wrong |
| a secret, a credential, or customer data | a comment is source, and source travels further than anyone expects |

**A rationale is changed in the same edit as the line it explains, and deleted the moment its reason dies.** A stale *why* is a false statement in a place readers trust.

Two promotions, both SHOULD:

- **A reason a consumer needs is not a rationale — it is intent.** Promote it to the doc comment, where a caller actually sees it.
- **A reason that recurs across files is one choice nobody recorded.** Write it once in the decision register and let the comments cite it.

Neither side ever carries a history word — not *"moved from"*, not *"renamed"*, not *"it was"*, not *"used to"*, not *"formerly."* A comment states current truth; history lives in the change that made it, not in a comment left standing after.

## A file you edit leaves with its comments in standard

Bringing a source file's comments up to standard is part of editing it — MUST. A published declaration the edit touches carries an intent comment; a description sits where the harvester can read it; nothing in the file narrates its own history. The reach is the file you edited and no further — a defect noticed in another file is recorded as a finding rather than fixed on the way past. A rule that turns every edit into a sweep is a rule people stop following, and the backlog it was meant to drain grows instead.
