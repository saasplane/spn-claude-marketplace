<!-- spn:doc
{
  "id": "hook-set",
  "variant": "construct",
  "title": "Hooks — Code the Runtime Calls on Your Behalf",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "Code a plugin wires to the moments a session offers — the file that declares the wiring, the four moments and the authority each one carries, the payload a hook is handed, the verdict it returns rather than prints, and the exit code that is always zero.",
  "keywords": ["hook", "hooks.json", "moment", "payload", "verdict", "dispatcher"]
}
-->

# Hooks — Code the Runtime Calls on Your Behalf

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

A rule that lives only in a document is read once, trusted from memory, and eventually broken by somebody who never opened that document. A hook is the answer this repository ships: code the runtime itself calls, at a moment it chooses, so the rule is asked again on every single call. This page names the whole frame — the moments a session offers, the wiring that claims one, the shapes a hook is handed and gives back, and the promises every hook here keeps.

## Overview

One sentence carries the model: **the moment decides the authority**. A call about to run is the only place a call can still be stopped. Every other moment arrives after the thing it might have objected to has already happened, so all it can do is speak.

Two more promises come from one failure. A verdict was once printed and parsed back, and a refusal that did not parse was dropped in silence — one check fired a hundred and forty-seven times and changed nothing. So a check now **returns** what it decided, and the dispatcher reads the object. And a hook **always exits zero**, because a hook that crashes takes every other gate beside it down with it.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a hook | `hooks.json` | a script a plugin wires to a named moment, declared with a matcher, a command and a timeout |
| a moment | `hooks` | a named point in a session the harness stops at and runs whatever a plugin wired there |
| the window opening | `SessionStart` | the moment a session begins, resumes or is cleared; its output is the first screen a developer sees |
| a call about to run | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| a command that finished | `PostToolUse` | the moment after a shell command has run, when its own text and its result can both be read |
| a turn about to end | `Stop` | the moment before a reply is handed back, when a warning is still useful and a refusal is not |
| a matcher | `matcher` | the names a moment is narrowed to, so a script runs only for the calls it could have an opinion about |
| the payload | `Payload` | what the harness hands a hook on standard input: the tool's name, the call's own fields, the working folder, the session |
| the call | `ToolInput` | the fields inside that payload a hook actually reads — a file path, a shell command, the content or replacement text a write carries |
| a verdict | `Verdict` | what a hook decided: `deny` refuses the call, `note` is advice the turn reads, and nothing at all is silence |
| the dispatcher | `dispatch` | one process that asks every check applying to a call, keeps the first refusal, and joins the advice |

## Model

The moments run in the order a session meets them. Nothing chains one to the next: each is offered independently, and a plugin wires the ones it has something to say at.

```dg
{ "kind": "map",
  "caption": "Only the call moment sits before the act, so every later moment can speak and never refuse.",
  "boxes": [
    { "id": "a", "label": "the window opens", "note": "SessionStart — the ground is read and printed" },
    { "id": "b", "label": "a call is about to run", "note": "PreToolUse — the one moment a call can be refused" },
    { "id": "c", "label": "a command finished", "note": "PostToolUse — the act has already happened" },
    { "id": "d", "label": "the turn is ending", "note": "Stop — warnings only, because the turn is written" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "then" },
    { "from": "b", "to": "c", "label": "then" },
    { "from": "c", "to": "d", "label": "then" }
  ] }
```

`spn-devex` is the only plugin here that wires more than one moment. It wires all four, one script each, and none of those scripts is reached any other way. `spn-apps` and `spn-infra` each wire the call moment alone and put their own gates behind it.

## Parts

### The wiring file

`hooks.json` inside a plugin's `hooks/` folder is the whole declaration, and it is the only file that folder holds. Each moment carries an optional matcher naming which tool calls reach it, a command written against `CLAUDE_PLUGIN_ROOT`, and a timeout. One entry per moment is the rule that pays: five separate entries once matched a single edit, and each one paid an interpreter start-up before reading a byte.

### The window opening

One script runs when a session starts, resumes or is cleared, and what it prints is the first screen a developer reads. Nothing in that screen is typed: the script walks the workspace, reads each repository's own manifest for the world and the stack it claims, checks the wiring that claim implies, and lists every workstream in each of its states. A workspace holding no manifest at all is the case where there is nothing to read, and the script then asks instead of reporting, and points at the day-zero skill. Every read is wrapped, because a crash here is a window that opens on a stack trace.

### A call about to run

One script, one matcher, and the whole chain of checks behind it. This is the only moment that may return a refusal, so every gate in the marketplace lives here or nowhere. Its matcher names the calls that could interest a check — reads, writes, edits, shell commands and searches.

### A shell command that finished

One script, matched to shell commands alone. It reads the command that just ran, and when that command actually moved a workstream folder into the closed state, it says what landed, counted from that workstream's own split plan. The congratulation comes after the move rather than before it, because the gate that could have refused the move runs earlier and speaks only to refuse.

### A turn about to end

One script, no matcher. By the time it runs the turn is already written, so a refusal would only lose it. What it does instead is warn: a turn ending while the running arc still has rows nothing blocks, an arc held against no live card, and a reply announcing a new window without the fields a handover owes.

### The payload, and what a hook reads from it

The harness writes the event to standard input as JSON. `readPayload` parses it, and input it cannot parse is not a finding — the hook simply allows the call. What a check then reads is a small part of it: the path a write names, the shell command a call carries, and the text a write would add.

### The verdict is a return value

A check is a function returning `{ deny?, note? }` or nothing. The dispatcher calls it and reads the object, so there is no round trip a refusal can disappear in. A file can still be run on its own, and `emit` then prints the same decision JSON to the same stream. A refusal sets the decision and its reason; advice is set as context the agent reads, because a message put only in the developer's pane is invisible to the agent.

### One process, and the order inside it

The dispatcher imports every check and calls each in turn. Each check declares what it `applies` to, decided from the path or the command alone, and which fields it `needs`, so a call that cannot interest a check never reaches it. The order is a path test, then a file read, then a workspace walk. A check that throws is caught and passed over, and the rest still run.

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

### The dispatcher's own refusal

One guard is not a check in the list. Before the loop starts, the dispatcher asks whether any path this call would write is a file a generator owns — a generated validator, a build output folder, a generated route lock, or a file whose own header says a tool wrote it. That refusal is the dispatcher's own, and it runs first because it is the cheapest one there is and needs nothing read.

### Measuring what a run cost

Every check is timed. Whether any of it reaches disk is a switch the developer sets, and every path swallows its own errors, because a gate failing because timing failed is worse than a number nobody recorded.

### Every moment exits zero

Whatever a script decides, it ends with a zero exit code. A refusal is the documented decision written to standard output, never a failure code. Two of these scripts also run by hand, printing the same text, so they can be read without opening a session at all.

## Boundary

This page answers which moments exist, how a script claims one, what it is handed, and what it may say back. It does not answer which rule any one check enforces: a rule belongs to a chapter of the foundation book, and the check's own header names that chapter rather than restating it.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the moments this marketplace wires, the authority each one carries, and the wiring that claims one | what any individual check looks for, and what it says when it finds it | [Scripts](05-scripts.md), and the scripts chapter of [the apps domain](../02-apps/README.md) or [the infra domain](../03-infra/README.md) |
| the payload, the verdict, the composition of many checks into one answer, and the always-zero exit | a file run by its own path rather than by a moment | [Scripts](05-scripts.md) |
| that a guard the dispatcher runs before the list is still the dispatcher's own refusal | what a split plan is, and which rows a close gate counts | the foundation's workspace construct |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a hook script is the one construct read from disk on its next run, with no fresh window owed | MUST |
| `RD.DEVEX.019` | a hook carries a rule it does not own, and names the chapter that owns it | MUST |
| `RD.DEVEX.020` | the workspace is discovered rather than declared, so the opening screen is read from each repository's own manifest | MUST |
| [MD2](../../registers/decisions.md) | the dispatcher does refuse on its own account, through the generated-file guard it runs before the list | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | a hook is the Event kind of script, run from a committed bundle a staleness test keeps current | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs plugin partner` (or `spn-devex plugin partner`, once installed)
