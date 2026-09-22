<!-- spn:doc
{
  "id": "hook-set",
  "variant": "construct",
  "title": "The Hook — Code the Runtime Calls on Your Behalf",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "Code a plugin wires to a moment the runtime reaches — the file that declares the wiring, the payload it is handed, the verdict it returns rather than prints, and the exit code that is always zero.",
  "keywords": ["hook", "hooks.json", "payload", "verdict", "dispatcher", "exit code"]
}
-->

# The Hook — Code the Runtime Calls on Your Behalf

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

A rule that lives only in a document is read once, trusted from memory, and eventually broken by somebody who never opened that document. A hook is the answer this repository ships: code the runtime itself calls, at a moment it chooses, so the rule is asked again on every single call. This page names the frame — the wiring, the shapes a hook is handed and gives back, and the two promises every hook here keeps.

Both promises come from the same failure. A verdict was once printed and parsed back, and a refusal that did not parse was dropped in silence — one check fired a hundred and forty-seven times and changed nothing. So a check now **returns** what it decided, and the dispatcher reads the object. And a hook **always exits zero**, because a hook that crashes takes every other gate beside it down with it.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a hook | `hooks.json` | a script a plugin wires to a named moment, declared with a matcher, a command and a timeout |
| the payload | `Payload` | what the harness hands a hook on standard input: the tool's name, the call's own fields, the working folder, the session |
| the call | `ToolInput` | the fields inside that payload a hook actually reads — a file path, a shell command, the content or replacement text a write carries |
| a verdict | `Verdict` | what a hook decided: `deny` refuses the call, `note` is advice the turn reads, and nothing at all is silence |
| the dispatcher | `dispatch` | one process that asks every check applying to a call, keeps the first refusal, and joins the advice |
| a tool | — | code under `hooks/tools/`, invoked by its own path rather than wired to a moment; it has its own page |

## Model

One call reaches one process. That process asks each check that could have an opinion, cheapest first, and turns what they said into a single answer.

```dg
{ "kind": "map",
  "caption": "The verdict is returned rather than printed and parsed back, so a refusal cannot be lost.",
  "boxes": [
    { "id": "a", "label": "hooks.json", "note": "one entry per moment — a matcher, a command, a timeout" },
    { "id": "b", "label": "the event", "note": "the harness hands the script its payload on stdin" },
    { "id": "c", "label": "the dispatcher", "note": "one process; it calls each check that applies" },
    { "id": "d", "label": "the verdict", "note": "deny, note, or nothing — returned, then printed once" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "wires" },
    { "from": "b", "to": "c", "label": "runs" },
    { "from": "c", "to": "d", "label": "answers with" }
  ] }
```

The shape is the same in all three plugins, and only the contents differ. `spn-core` wires every moment it can; `spn-apps-ts` wires one and puts six checks behind it; `spn-infra` wires one and puts a shell script behind it.

## Parts

### The wiring file

`hooks.json` inside a plugin's `hooks/` folder is the whole declaration. Each moment carries an optional matcher naming which tool calls reach it, a command written against `CLAUDE_PLUGIN_ROOT`, and a timeout. One entry per moment is the rule that pays: five separate entries once matched a single edit, and each one paid an interpreter start-up before reading a byte. *Where:* `plugins/spn-core/hooks/hooks.json`, `plugins/spn-apps-ts/hooks/hooks.json`, `plugins/spn-infra/hooks/hooks.json`

### The payload, and what a hook reads from it

The harness writes the event to standard input as JSON. `readPayload` parses it, and input it cannot parse is not a finding — the hook simply allows the call. What a check then reads is a small part of it: the path a write names, the shell command a call carries, and the text a write would add. *Where:* `plugins/spn-core/hooks/lib/payload.ts`

### The verdict is a return value

A check is a function returning `{ deny?, note? }` or nothing. The dispatcher calls it and reads the object, so there is no round trip a refusal can disappear in. A file can still be run on its own, and `emit` then prints the same decision JSON to the same stream. A refusal sets the decision and its reason; advice is set as context the agent reads, because a message put only in the developer's pane is invisible to the agent. *Where:* `plugins/spn-core/hooks/lib/payload.ts`

### One process, and the order inside it

The dispatcher imports every check and calls each in turn. Each check declares what it `applies` to, decided from the path or the command alone, and which fields it `needs`, so a call that cannot interest a check never reaches it. The order is a path test, then a file read, then a workspace walk. A check that throws is caught and passed over, and the rest still run. *Where:* `plugins/spn-core/hooks/events/pretooluse.ts`

### The dispatcher's own refusal

One guard is not a check in the list. Before the loop starts, the dispatcher asks whether any path this call would write is a file a generator owns — a generated validator, a build output folder, a generated route lock, or a file whose own header says a tool wrote it. That refusal is the dispatcher's own, and it runs first because it is the cheapest one there is and needs nothing read. *Where:* `plugins/spn-core/hooks/events/pretooluse.ts`, `generatedRefusal`

### Measuring what a run cost

Every check is timed. Whether any of it reaches disk is a switch the developer sets, and every path swallows its own errors, because a gate failing because timing failed is worse than a number nobody recorded. *Where:* `plugins/spn-core/hooks/lib/timing.ts`

## Boundary

This page answers when a hook runs, what it is handed, and what it may say back. It does not answer which moments exist and what each one allows — that is [Loop Events](03-loop-events.md), and you read it next. It does not answer which rule any one check enforces either: a rule belongs to a chapter of the foundation book, and the check's own header names that chapter rather than restating it.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the wiring shape, the payload, the verdict, the composition of many checks into one answer, and the always-zero exit | which moments a plugin may wire to, and what each one is allowed to decide | [Loop Events](03-loop-events.md) |
| that a guard the dispatcher runs before the list is still the dispatcher's own refusal | what any individual check looks for, and what it says when it finds it | [The Check](04-checks.md) · [Stack Checks](../02-spn-apps-ts/01-stack-checks.md) · [The Estate Guard](../03-spn-infra/01-estate-guard.md) |
| that a file run on its own prints the decision the dispatcher would have returned | code run by its own path rather than by an event | [The Tool](05-tools.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a hook script is the one instrument read from disk on its next run, with no fresh window owed | MUST |
| `RD.DEVEX.019` | a hook carries a rule it does not own, and names the chapter that owns it | MUST |
| [MD2](../../registers/decisions.md) | the dispatcher does refuse on its own account, through the generated-file guard it runs before the list | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-core` | the wiring file, the payload and verdict shapes, the dispatcher, and the timing every hook in the workspace is built on | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/partner-shape.ts` | gate | every wired script runs against a repository holding nothing but the plugin, and none of them crashes on an input it was not written for |

Try it: `node plugins/spn-core/hooks/tools/partner-shape.ts`
