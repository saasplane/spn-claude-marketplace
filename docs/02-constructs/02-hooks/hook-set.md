<!-- spn:doc
{
  "id": "hook-set",
  "variant": "construct",
  "parentId": "concept",
  "title": "The Hook — Code the Runtime Calls For You",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "What a hook is — code wired to a runtime event or run by name, what it may return, and the line between refusing a call and only reporting on it.",
  "keywords": ["hook", "event", "verdict", "grade", "check", "tool", "deny", "note"]
}
-->

# The Hook — Code the Runtime Calls For You

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

A rule that lives only in a document is read once, trusted from memory, and eventually broken by someone who never opened that document. A hook is this repository's answer: code the runtime itself calls, at a moment it chooses, so the rule is checked again on every single call rather than remembered by whoever happens to be writing. This construct names what a hook is made of and what it is allowed to say back.

## Terms — the words this construct needs

| Term | Contract term | What it means here |
| --- | --- | --- |
| a hook | `EventHook` | code wired in a plugin's `hooks.json` to fire when the runtime reaches a named moment — `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop` |
| a check | `Verdict` | what one piece of logic decided about a single call: `deny` (refuse it), `note` (say something and let it through), or nothing at all |
| a tool | `NamedInstrument` | code under a plugin's `hooks/tools/`, run by an agent invoking its path directly rather than fired by an event |

## Boundary — what it owns, and what it refuses

If the question is *when does this run, and what may it say back*, it belongs here. If the question is *which rule is being enforced*, that rule's own chapter owns the answer, and the hook's source names it rather than repeating it.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the four events a hook may wire to, and the `Verdict` shape every one of them returns | which rule a given check enforces — the chapter that rule belongs to states it | `the foundation's 04-devex/10-delivery.md` |
| composing many checks into one answer, so one call pays one process rather than five | restating the rule it checks in its own words, beyond naming the chapter it came from | [The Ref](../04-refs/ref-set.md) |

## Model — the shape, in one picture

One call reaches a dispatcher, the dispatcher asks every check that applies, and the first refusal wins.
```dg
{ "kind": "map",
  "boxes": [
    { "id": "call", "label": "a tool call", "note": "Read, Write, Edit, Bash — whatever the event matches" },
    { "id": "dispatch", "label": "the dispatcher", "note": "one process; asks each check that applies, cheapest first" },
    { "id": "check", "label": "a check", "note": "reads the call, returns deny · note · nothing" },
    { "id": "verdict", "label": "the verdict", "note": "first deny wins; notes add up; nothing means silence" }
  ],
  "links": [
    { "from": "call", "to": "dispatch", "label": "PreToolUse fires" },
    { "from": "dispatch", "to": "check", "label": "asks in order" },
    { "from": "check", "to": "verdict", "label": "returns" }
  ] }
```
A check that throws is skipped rather than failing the whole call — one broken rule must never take every other rule in the chain down with it. The dispatcher itself never refuses anything on its own account; it only carries what the checks decided.

## Parts — each piece, named once

### The four events
`hooks.json` wires a script to a named moment: `SessionStart` (the window opens), `PreToolUse` (before a tool call runs — the one place a call can still be refused), `PostToolUse` (after a Bash call finishes), and `Stop` (the turn is about to end). Only `PreToolUse` can carry a `deny`; the other three can only speak, because by the time they fire the act they might object to has already happened. *Where:* `plugins/*/hooks/events/`, wired by `plugins/*/hooks/hooks.json`

### The verdict
`{ deny?: string; note?: string } | null`. A `deny` is read as the reason a call is refused; a `note` is read alongside a call that is allowed; `null` means the check had nothing to say. A dispatcher combining several checks keeps the first `deny` and joins every `note`, because a refusal is an answer and advice is not exclusive. *Where:* `plugins/spn-core/hooks/lib/payload.ts`

### The checks a dispatcher composes
Each check is its own file under `hooks/checks/`, naming what it `applies` to, what fields it `needs` from the call, and a `run` function returning a `Verdict`. The dispatcher in `hooks/events/pretooluse.ts` imports every one of them and calls each in turn — cheapest test first — rather than launching a separate process per check. *Where:* `plugins/*/hooks/checks/`

### A tool
Not every piece of hook code is wired to an event. Code under `hooks/tools/` is run by name — a partner or an agent invokes its path directly, such as an audit or a drift check — and it may report its own findings graded `RULE` (refuses, by exit code) or `SOFT` (reports only), the same refuse-or-report line a `Verdict` draws for an event hook. *Where:* `plugins/*/hooks/tools/`

## Relations — what it needs

| Needs | For |
| --- | --- |
| [The Plugin](../01-plugins/plugin-set.md) | the folder and the `hooks.json` a hook is wired inside |
| [The Ref](../04-refs/ref-set.md) | the citation a check's own header names, so a rule change in the book is found rather than drifted past |

## Binds — what holds it, and where it lives today

| Rule | What it decides | Weight |
| --- | --- | --- |
| `the foundation's 04-devex/10-delivery.md` § When an edit becomes behaviour | a hook script is the one instrument that reloads on its next run, with no fresh window owed | MUST |
| `RD.DEVEX.019` | every hook restates a chapter of the book and adds no rule of its own | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-claude-marketplace | spn-core · spn-apps-ts · spn-infra | the event wiring in each plugin's `hooks.json`, and the checks and tools it fires | planned |

## Proof — how you check it

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/02-hooks/hook-set.md` | gate | the metadata block, the tag line and the outline hold the shape this construct names |

Try it: `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/02-hooks/hook-set.md`
