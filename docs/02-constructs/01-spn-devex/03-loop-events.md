<!-- spn:doc
{
  "id": "loop-events",
  "variant": "construct",
  "title": "Loop Events — The Moments a Session Offers a Hook",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["hook-set"],
  "summary": "The named moments in a session a plugin can wire code to — the window opening, a call about to run, a shell command that finished, a turn about to end — and why only one of them may refuse anything.",
  "keywords": ["SessionStart", "PreToolUse", "PostToolUse", "Stop", "moment", "authority"]
}
-->

# Loop Events — The Moments a Session Offers a Hook

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

A hook is code the runtime calls, and a moment is when it calls it. The moments are not interchangeable, because each one arrives at a different point relative to the act it might object to. This page names the moments this marketplace wires, what each one is handed, and what each one is allowed to do about it.

## Overview

One sentence carries the model: **the moment decides the authority**. A call about to run is the only place a call can still be stopped. Every other moment arrives after the thing it might have objected to has already happened, so all it can do is speak.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a moment | `hooks` | a named point in a session the harness stops at and runs whatever a plugin wired there |
| the window opening | `SessionStart` | the moment a session begins, resumes or is cleared; its output is the first screen a developer sees |
| a call about to run | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| a command that finished | `PostToolUse` | the moment after a shell command has run, when its own text and its result can both be read |
| a turn about to end | `Stop` | the moment before a reply is handed back, when a warning is still useful and a refusal is not |
| a matcher | `matcher` | the names a moment is narrowed to, so a script runs only for the calls it could have an opinion about |

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

`spn-devex` is the only plugin here that wires more than one moment. It wires all four, one script each, and none of those scripts is reached any other way.

## Parts

### The window opening

One script runs when a session starts, resumes or is cleared, and what it prints is the first screen a developer reads. Nothing in that screen is typed: the script walks the workspace, reads each repository's own manifest for the world and the stack it claims, checks the wiring that claim implies, and lists every workstream in each of its states. A workspace holding no manifest at all is the case where there is nothing to read, and the script then asks instead of reporting, and points at the day-zero skill. Every read is wrapped, because a crash here is a window that opens on a stack trace. *Where:* `plugins/spn-devex/hooks/events/orientation.ts`

### A call about to run

One script, one matcher, and the whole chain of checks behind it. This is the only moment that may return a refusal, so every gate in the marketplace lives here or nowhere. Its matcher names the calls that could interest a check — reads, writes, edits, shell commands and searches. *Where:* `plugins/spn-devex/hooks/events/pretooluse.ts`

### A shell command that finished

One script, matched to shell commands alone. It reads the command that just ran, and when that command actually moved a workstream folder into the closed state, it says what landed, counted from that workstream's own split plan. The congratulation comes after the move rather than before it, because the gate that could have refused the move runs earlier and speaks only to refuse. *Where:* `plugins/spn-devex/hooks/events/closed.ts`

### A turn about to end

One script, no matcher. By the time it runs the turn is already written, so a refusal would only lose it. What it does instead is warn: a turn ending while the running arc still has rows nothing blocks, an arc held against no live card, and a reply announcing a new window without the fields a handover owes. *Where:* `plugins/spn-devex/hooks/events/stop.ts`

### Every moment exits zero

Whatever a script decides, it ends with a zero exit code. A refusal is the documented decision written to standard output, never a failure code. Two of these scripts also run by hand, printing the same text, so they can be read without opening a session at all. *Where:* `plugins/spn-devex/hooks/events/`

## Boundary

This page answers which moments exist, what each is handed, and what each may do. It does not answer how a script is wired or what shape its answer takes — that is [The Hook](02-hook-set.md), and you read it first. It does not answer what any individual gate looks for either: the checks behind the call moment have their own page.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the moments this marketplace wires, and the authority each one carries | the wiring file, the payload, the verdict shape and the dispatcher | [The Hook](02-hook-set.md) |
| that the first screen of a session is read from the ground rather than typed | what any one check behind the call moment decides | [The Check](04-checks.md) |
| that a closing line is said after the move lands | what a split plan is, and which rows a close gate counts | the foundation's workspace construct |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.020` | the workspace is discovered rather than declared, so the opening screen is read from each repository's own manifest | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a hook script is read from disk on its next run, so a moment's behaviour changes without a fresh window | MUST |
| `RD.DEVEX.019` | every wired script carries a rule it does not own and names the chapter that does | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/01-agent` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-devex` | one script per moment, the only plugin here that wires more than one | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/hooks/tools/partner-shape.ts` | gate | every script a moment names runs against a repository holding nothing but the plugin, and each one ends with a zero exit code |

Try it: `node plugins/spn-devex/hooks/tools/partner-shape.ts`
