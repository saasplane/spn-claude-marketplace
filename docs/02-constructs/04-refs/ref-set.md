<!-- spn:doc
{
  "id": "ref-set",
  "variant": "construct",
  "parentId": "concept",
  "title": "The Ref — A Chapter, Restated and Stamped",
  "lenses": ["VOICE", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "What a ref is — a markdown restatement of one or more chapters, carrying a hash of what it last saw, so a chapter that moves is reported rather than quietly outrun.",
  "keywords": ["ref", "restates", "citation", "hash", "drift", "seen"]
}
-->

# The Ref — A Chapter, Restated and Stamped

`For: Editor · Architect` · `Status: 🔮 PLANNING`

A citation nobody checks is a promise nobody keeps: the chapter it names moves on, and the words copied from it quietly stop being true. A ref is this repository's way of keeping that promise — a restatement that carries a hash of the exact text it last read, so a run can say *this chapter moved since I copied it* instead of everyone finding out by accident. This construct names that block and what checks it.

## Terms — the words this construct needs

| Term | Contract term | What it means here |
| --- | --- | --- |
| a ref | `RestatesBlock` | a markdown file under a plugin's `refs/`, restating one or more foundation chapters for a reader who cannot open the book itself |
| the stamp | `Citation` | one entry of the block — a chapter's path, an optional section, and the hash (`seen`) the ref last read there |
| drift | `DriftFinding` | a stamped hash that no longer matches the chapter's current text — the finding that says a ref has fallen behind |

## Boundary — what it owns, and what it refuses

If the question is *does this restatement still say what its chapter says*, it belongs here. If the question is *what does the chapter say*, the chapter answers it, and a ref only ever repeats that answer under a stamp.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the `spn:restates` block — a citation's path, its optional section, and the hash comparing them | a plain `// RESTATES: <chapter>` comment inside a hook or a tool's source file — that names a source but carries no hash, so nothing compares it | [The Hook](../02-hooks/hook-set.md) |
| deciding whether a stamped chapter still reads the same | deciding whether the chapter's rule is correct — a ref only ever restates it | `the foundation's 04-devex/10-delivery.md` |

## Model — the shape, in one picture

A ref's block names a chapter and a hash; a check re-reads that chapter today and compares.
```dg
{ "kind": "map",
  "boxes": [
    { "id": "chapter", "label": "a foundation chapter", "note": "in the sibling spn-foundation checkout" },
    { "id": "block", "label": "spn:restates", "note": "path, optional section, and the hash last seen there" },
    { "id": "check", "label": "restate-drift.ts", "note": "re-hashes the chapter today and compares" },
    { "id": "finding", "label": "DRIFT or clean", "note": "one line per stamp that no longer matches" }
  ],
  "links": [
    { "from": "chapter", "to": "block", "label": "hashed once, at write time" },
    { "from": "block", "to": "check", "label": "read" },
    { "from": "chapter", "to": "check", "label": "re-read" },
    { "from": "check", "to": "finding", "label": "reports" }
  ] }
```
The hash is taken over one section when the block names one, and over the whole file otherwise — a citation is exactly as precise as the sentence it replaces, so a ref that quotes one paragraph is never re-flagged because an unrelated paragraph moved.

## Parts — each piece, named once

### The `spn:restates` block
An HTML comment carrying strict JSON: a `chapters` array of citations (`path`, an optional `section`, and `seen`, an eight-character hash), and an optional `rows` array of decision ids the ref also depends on. It sits at the top of the file, the same position a `spn:doc` block would take in a corpus document — a ref carries this instead, never both. *Where:* the first lines of `plugins/*/refs/*.md`

### The hash
Taken over the cited text with trailing whitespace and surrounding blank lines stripped, so a change nobody would notice reading the page never trips the check — but a reordering does, because a rule list whose order changed is a rule list a ref may now state wrongly. *Where:* `plugins/spn-core/hooks/lib/restates.ts`

### Undeclared, unstamped, unread
A ref can fail three different ways, and they are not the same finding. **Undeclared** is a ref's own prose naming a source its block leaves out — the omission is invisible to any run. **Unstamped** is a file that says what it restates in prose and carries no block at all, so nothing machine-readable exists to compare. **Unread** is a name a check cannot resolve to a file — under-reported rather than hidden. *Where:* `plugins/spn-core/hooks/tools/restate-drift.ts`

## Relations — what it needs

| Needs | For |
| --- | --- |
| [The Plugin](../01-plugins/plugin-set.md) | the `refs/` folder a ref is delivered inside |

## Binds — what holds it, and where it lives today

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | a ref restates a chapter and adds no rule of its own; where the two disagree, the chapter wins and the ref is regenerated | MUST |
| `the foundation's 04-discipline.md` § Restatement discipline | repetition is allowed only as a declared restatement, carrying its source of truth and never a new rule | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-claude-marketplace | spn-core · spn-apps-ts · spn-infra | the `spn:restates` blocks each plugin's `refs/` files carry, checked by `restate-drift.ts` | planned |

## Proof — how you check it

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/04-refs/ref-set.md` | gate | the metadata block, the tag line and the outline hold the shape this construct names |

Try it: `node plugins/spn-core/hooks/tools/restate-drift.ts`
