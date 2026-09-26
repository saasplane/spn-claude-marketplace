<!-- spn:doc
{
  "id": "apps-hooks",
  "variant": "construct",
  "title": "Hooks — One Moment, Because Every Rule Here Is About a File",
  "lenses": ["ARCHITECT", "SERVER_DEV"],
  "status": "PLANNING",
  "dependsOn": ["apps-plugin", "hook-set"],
  "summary": "What this plugin wires and why it wires so little — one moment, narrowed to the calls that change a file, behind a single entry whose dispatcher resolves what to run from the repository's own declaration rather than from a list.",
  "keywords": ["hook", "hooks.json", "PreToolUse", "matcher", "entry", "dispatch"]
}
-->

# Hooks — One Moment, Because Every Rule Here Is About a File

`For: Architect · Backend developer` · `Status: 🔮 PLANNING`

A plugin's wiring says which moments of a session it has an opinion about. This one has an opinion about exactly one, and the narrowness is the point: every rule this domain holds is about what a file contains, so the only moment worth claiming is the one where a file is about to change.

## Overview

The core plugin wires several moments across a wide set of tools, because its rules are about how a session behaves — what it opened, what it ran, what it is about to say. **This plugin's rules are all about text**, so it claims the moment a write is about to happen and nothing else. Reading a file, running a command or ending a turn cannot introduce a pattern in a contract, a service or a test, so a hook there would cost a start-up and answer nothing.

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

The moment a call is about to run is the only one that can still stop it, and a rule about a file's contents has nothing to say at any other. A moment claimed for the sake of symmetry is an interpreter start-up on every call in a session, paid for an answer nobody asked for. *Where:* `plugins/spn-apps/src/hooks/hooks.json`

### The matcher is the first and cheapest filter

The entry narrows to the two tool names that change a file. Everything else a session does never reaches this plugin at all, which is a filter the harness applies before any process of this plugin's starts. *Where:* the `matcher` field of `plugins/spn-apps/src/hooks/hooks.json`

### One entry, and the saving that comes from it

Several entries are several interpreter start-ups on every write, whatever language the scripts are written in, and on one measured edit the start-ups cost more than ten times the checking. So the wiring declares one entry and the dispatcher runs everything behind it. The saving lives in the registration rather than in the scripts. *Where:* `plugins/spn-apps/src/hooks/hooks.json` · `plugins/spn-apps/src/scripts/events/pretooluse.ts`

### The timeout is the plugin's promise back to the session

The entry declares how long the whole chain may take. A gate that can hang is a gate somebody removes, so the budget is stated in the wiring rather than trusted to the scripts underneath it. *Where:* the `timeout` field of `plugins/spn-apps/src/hooks/hooks.json`

### What runs is resolved per write, never listed

The dispatcher does not hold a fixed set of rules. It reads the stack from the nearest `sprepo.json` and asks the provider for that stack, so one installed plugin serves whatever a node declares and a second stack joins by adding a folder. A repository declaring a stack this plugin ships nothing for is left alone rather than refused. *Where:* `plugins/spn-apps/src/scripts/checks/subjects.ts`

### The wiring names the plugin root, never a checkout

The command is written against the installed folder rather than against a path in this repository, so the entry works wherever the plugin was installed. *Where:* the `command` field of `plugins/spn-apps/src/hooks/hooks.json`

## Boundary

This page answers what this plugin wires and why it wires one moment. It does not answer what a hook is — the moments a session offers, the payload a hook is handed, the verdict it returns rather than prints, and the rule that a hook always exits zero are [Hooks](../01-devex/02-hooks.md). It does not answer what any rule behind the entry decides either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| which moment this plugin claims, the tools it narrows to, and the single entry behind it | the payload, the verdict, the always-zero exit and the moments themselves | [Hooks](../01-devex/02-hooks.md) |
| that what runs is resolved from the repository's own declaration | the rules that are resolved to, and what each of them decides | [Scripts](04-scripts.md) · [Providers](06-providers.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.GOV.024` | a repository answers to the world it declares, which is what makes its manifest the one place a stack is read from | MUST |
| `RD.DEVEX.035` | a rule reaches a write-time hook only where review would be too late | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a hook script is live on its next run, and the wiring file is not | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-apps` | one `PreToolUse` entry narrowed to writes, and the dispatcher that resolves its subjects per call | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/src/scripts/tools/partner-shape.ts` | gate | the entry this plugin declares is found and runs against a repository holding nothing but the plugins |
| `node plugins/spn-apps/tests/run.mjs` | suite | the dispatcher classifies a real manifest, resolves the subjects behind it, and returns one answer for a write |

Try it: `node plugins/spn-apps/tests/run.mjs`
