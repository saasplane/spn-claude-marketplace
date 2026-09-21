<!-- spn:doc
{
  "id": "agent-set",
  "variant": "construct",
  "title": "The Agent — A Persona a Session Can Convene",
  "lenses": ["LEAD", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set", "lenses"],
  "summary": "A named persona a session can call mid-turn — the frontmatter that decides when it answers, the authority its own file grants it, the difference between a fixed voice and one parameterized by a viewpoint, and where the permission to write actually comes from.",
  "keywords": ["agent", "brief", "persona", "panel", "authority", "tools"]
}
-->

# The Agent — A Persona a Session Can Convene

`For: Engineering leader · Architect` · `Status: 🔮 PLANNING`

The context that wrote a change has already agreed with every reason it gave itself. A brief is how a second, independent read arrives without opening a second window: a persona with its own name, convened mid-turn, carrying only what its own file grants it. This page names what that file is made of.

The thing to check first in any brief is its authority — what this persona may decide, and whether it may write anything at all. Some of that authority is bound by the frontmatter and some of it is only stated in the prose, and the two are not the same promise.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a brief | `agents/` | a markdown file naming a persona a session can convene by name |
| the name | `name` | what a caller types to convene this persona |
| the trigger | `description` | the sentence deciding when this persona rather than the session's own voice should answer |
| the bound model | `model` | an optional field choosing which model runs the persona |
| the bound tools | `tools` | an optional field narrowing what the persona may call; leaving it out grants everything the session has |
| a parameterized brief | — | a brief holding a procedure and no subject matter, handed a viewpoint name at the moment it is convened |

## Model

A session names a persona. The brief decides what that persona may do, and the answer it gives back is shaped by that authority rather than by the caller's request.

```dg
{ "kind": "map",
  "boxes": [
    { "id": "a", "label": "a session", "note": "convenes a persona by name, in the middle of a turn" },
    { "id": "b", "label": "the brief", "note": "a name, a description, and sometimes a model and tools" },
    { "id": "c", "label": "the authority", "note": "what this persona may decide, and whether it may write" },
    { "id": "d", "label": "the answer", "note": "a report for a reviewer; an edit for the one rewriter" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "convenes" },
    { "from": "b", "to": "c", "label": "states" },
    { "from": "c", "to": "d", "label": "bounds" }
  ] }
```

Most briefs are a fixed persona and read the same way on every convening. One is parameterized: it is handed a viewpoint name and reads that file before it says anything.

## Parts

### The frontmatter

`name` and `description`, read the same way a skill's are: the description is matched against the moment rather than browsed, and it decides whether this persona takes the reply. Two more fields are optional. `model` chooses which model runs the persona, and `tools` narrows what it may call. Leaving `tools` out grants every tool the session itself has. *Where:* the first lines of `plugins/spn-core/agents/spn-prose-rewriter.md`

### Where a read-only promise is actually bound

A brief declaring `tools` is bound by it: the permission is a fact about the convening rather than an instruction the persona is asked to follow. A brief that declares no `tools` inherits everything the session has, and its promise not to write is prose. Both kinds exist here, and telling them apart matters when a reviewer's independence is what the brief is for. *Where:* compare the frontmatter of `plugins/spn-core/agents/spn-prose-reviewer.md` with that of `plugins/spn-core/agents/spn-panel.md`

### A fixed persona

A brief with no argument is one voice, always: an engineering lead, a prose rewriter, a prose reviewer. Its whole authority is the words in its own file, read the same way each time it is called. *Where:* `plugins/spn-core/agents/spn-engineer.md`

### A parameterized reviewer

One brief here takes a viewpoint name as part of what it is convened over. It reads that viewpoint's own file before anything else, and that file — rather than the brief — states what this convening may refuse and what it may only advise. The brief's own description lists the names a caller may pass, which is also what makes them discoverable. *Where:* `plugins/spn-core/agents/spn-panel.md`

### A reviewer that edits has stopped reviewing

Where a persona both finds a problem and fixes it, the finding and the fix arrive together and nobody can weigh one without the other. So the reviewing briefs report, the engineering brief advises, and exactly one brief is permitted to write — over the paragraphs it was handed, never over a whole file. *Where:* `plugins/spn-core/agents/spn-prose-rewriter.md`

### A brief points at a rule and never invents one

A persona stating a rule with no chapter behind it has produced a suggestion wearing the clothes of a finding, and the next reader cannot tell which they are holding. Each brief names where its standard lives: the reviewing brief's standard is the viewpoint file, and that file's standard is the book. *Where:* `plugins/spn-core/agents/spn-engineer.md`

## Boundary

This page answers what a brief is, how a persona is convened, and where its authority comes from. It does not answer what any viewpoint checks — that is [The Lens](09-lenses.md), and a parameterized brief is worth nothing without it. It does not answer what a skill is either, although a brief and a skill are selected by the same kind of sentence.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the frontmatter a brief declares, and the difference between an authority bound by a field and one stated in prose | what a reviewing viewpoint checks, and the one condition it may refuse on | [The Lens](09-lenses.md) |
| that a reviewing persona reports and one rewriting persona writes | the matching rule the description is read by, which a skill shares | [The Skill](07-skill-set.md) |
| that a brief cites a rule and never invents one | where that rule lives, and whether the copy has fallen behind | [The Ref](08-ref-set.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's DevEx Agent construct | one agent, equipped by the book, and a reviewer that reads what it did not write | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a brief edit needs an install and a fresh window before a convening can read it | MUST |
| [MD4](../../registers/decisions.md) | a read-only promise is bound only where the brief declares `tools`; elsewhere it is prose | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/01-agent` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-core` | the briefs a session convenes, of which one is parameterized by a viewpoint and one may write | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/restate-drift.ts` | gate | every viewpoint a brief can be handed still reads as the chapters it stamps read today |

Try it: `node plugins/spn-core/hooks/tools/restate-drift.ts`
