<!-- spn:doc
{
  "id": "apps-hooks",
  "variant": "construct",
  "title": "Hooks — One Moment, Because Every Rule Here Is About a File",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["apps-plugin", "hook-set"],
  "summary": "This plugin wires exactly one moment of a session — the point where a file is about to change — because every rule it holds is about what a file contains.",
  "keywords": ["hook", "hooks.json", "PreToolUse", "matcher", "entry", "dispatch"]
}
-->

# Hooks — One Moment, Because Every Rule Here Is About a File

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

This plugin wires exactly one moment of a session — the point where a file is about to change — because every rule it holds is about what a file contains. Read this page to see why one moment is enough here, and which calls that one moment covers. It explains the single wired entry and how its dispatcher decides what to run.

## Overview

The core plugin wires several moments across a wide set of tools, because its rules are about how a session behaves — what it opened, what it ran, what it is about to say. **This plugin's rules are all about text**, so it claims the moment a write is about to happen and nothing else. Reading a file, running a command or ending a turn cannot introduce a pattern in a contract, a service or a test, so a hook there would cost a start-up and answer nothing.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the wiring | `hooks.json` | the single file declaring what this plugin claims, at which moment, with which command and which timeout |
| a call about to run | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| the matcher | `Write\|Edit` | the tool names this entry narrows to, so nothing else in a session reaches the chain at all |
| the entry | — | one declaration behind which every rule runs, rather than one declaration per rule |
| the dispatcher | `pretooluse.ts` | the single process the entry names, which resolves what to run and joins the answers |
| a subject | `SUBJECT_NAMES` | one grouping of rules the dispatcher asks about a write, resolved per call rather than listed |

## Model

One moment, narrowed to two tool names, behind one command — and what that command runs is decided per call from the repository's own declaration.

```dg
{ "kind": "map",
  "caption": "The declaration is read per write, so one installed plugin serves whatever stack the node claims.",
  "boxes": [
    { "id": "a", "label": "a write about to run", "note": "a Write or an Edit, and no other tool" },
    { "id": "b", "label": "the one entry", "note": "hooks.json — one command, one timeout" },
    { "id": "c", "label": "the dispatcher", "note": "reads the nearest sprepo.json and resolves the subjects" },
    { "id": "d", "label": "a verdict", "note": "a refusal, advice, or silence" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "matched by" },
    { "from": "b", "to": "c", "label": "runs" },
    { "from": "c", "to": "d", "label": "returns" }
  ] }
```

## Parts

### One moment, and why the others are not claimed

The moment a call is about to run is the only one that can still stop it, and a rule about a file's contents has nothing to say at any other. A moment claimed for the sake of symmetry is an interpreter start-up on every call in a session, paid for an answer nobody asked for.

### The matcher is the first and cheapest filter

The entry narrows to the two tool names that change a file. Everything else a session does never reaches this plugin at all, which is a filter the harness applies before any process of this plugin's starts.

### One entry, and the saving that comes from it

Several entries are several interpreter start-ups on every write, whatever language the scripts are written in, and on one measured edit the start-ups cost more than ten times the checking. So the wiring declares one entry and the dispatcher runs everything behind it. The saving lives in the registration rather than in the scripts.

### The timeout is the plugin's promise back to the session

The entry declares how long the whole chain may take. A gate that can hang is a gate somebody removes, so the budget is stated in the wiring rather than trusted to the scripts underneath it.

### What runs is resolved per write, never listed

The dispatcher does not hold a fixed set of rules. It reads the stack from the nearest `sprepo.json` and asks the provider for that stack, so one installed plugin serves whatever a node declares and a second stack joins by adding a folder. A repository declaring a stack this plugin ships nothing for is left alone rather than refused.

### The wiring names the plugin root, never a checkout

The command is written against the installed folder rather than against a path in this repository, so the entry works wherever the plugin was installed.

## Boundary

This page answers what this plugin wires and why it wires one moment. It does not answer what a hook is — the moments a session offers, the payload a hook is handed, the verdict it returns rather than prints, and the rule that a hook always exits zero are [Hooks](../01-devex/02-hooks.md). It does not answer what any rule behind the entry decides either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| which moment this plugin claims, the tools it narrows to, and the single entry behind it | the payload, the verdict, the always-zero exit and the moments themselves | [Hooks](../01-devex/02-hooks.md) |
| that what runs is resolved from the repository's own declaration | the rules that are resolved to, and what each of them decides | [Scripts](04-scripts.md) · [Providers](06-providers.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what makes its manifest the one place a stack is read from | MUST |
| `RD.DEVEX.FUNCTION.035` | a rule reaches a write-time hook only where review would be too late | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a hook script is live on its next run, and the wiring file is not | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | a hook is the Event kind of script, run from a committed bundle a staleness test keeps current | MUST |

Try it: `node packages/plugin-spn-apps/tests/run.mjs`
