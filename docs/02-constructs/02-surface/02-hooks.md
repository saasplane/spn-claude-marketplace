<!-- spn:doc
{
  "id": "surface-hooks",
  "variant": "construct",
  "title": "Hooks — One Moment, For the Connector's Script",
  "subtitle": "One moment wired, because the one rule here is about a script about to run.",
  "lenses": ["ARCHITECT", "UX"],
  "status": "PLANNING",
  "dependsOn": ["surface-plugin", "hook-set"],
  "summary": "This plugin wires exactly one moment of a session, the point where the Figma connector is about to run a script, and one tool, because its one rule is about what that script says.",
  "keywords": ["hook", "hooks.json", "PreToolUse", "matcher", "entry", "connector"]
}
-->

# Hooks — One Moment, For the Connector's Script

`For: Architect · UX designer` · `Status: 🔮 PLANNING`

This plugin wires exactly one moment of a session, the point where the Figma connector is about to run a script, and one tool, because its one rule is about what that script says. Read this page to see why one moment and one tool are enough here, and what the entry does with a call. It explains the single wired entry and its dispatcher.

## Overview

A script handed to the connector runs against a person's design file. The connector refuses some of what it is given and throws on the rest, and either answer arrives after the call. **A rule that reads the script before the call is the only one that can save the call**, so this plugin claims that moment, narrowed to the connector's script runner, and nothing else. Reading a file, running a command or ending a turn cannot put a bad script into the connector.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the wiring | `hooks.json` | the single file declaring what this plugin claims, at which moment, with which command and which timeout |
| a call about to run | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| the matcher | `mcp__figma__use_figma` | the one tool name this entry narrows to, so nothing else in a session reaches the chain at all |
| the entry | — | one declaration behind which every rule runs, rather than one declaration per rule |
| the dispatcher | `pretooluse.ts` | the single process the entry names, which hands the call to the check that reads it and returns the verdict |
| the connector check | `figma-connector.ts` | the rule that reads a `use_figma` script before the connector runs it |

## Model

One moment, narrowed to one tool name, behind one command.

```dg
{ "kind": "map",
  "caption": "The matcher is applied by the harness first, so a session that never draws in Figma never starts this plugin's process.",
  "boxes": [
    { "id": "a", "label": "a connector call about to run", "note": "mcp__figma__use_figma, and no other tool" },
    { "id": "b", "label": "the one entry", "note": "hooks.json — one command, one timeout" },
    { "id": "c", "label": "the dispatcher", "note": "hands the call to the connector check" },
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

The moment a call is about to run is the only one that can still stop it, and a rule about a script's text has nothing to say at any other. A moment claimed for the sake of symmetry is an interpreter start-up on every call in a session, paid for an answer nobody asked for.

### The matcher is the first and cheapest filter

The entry narrows to the connector's script runner. Every other call a session makes never reaches this plugin at all, which is a filter the harness applies before any process of this plugin's starts.

### The check refuses only what the text shows

The connector check blanks comment and string bodies, then refuses a script that calls an API the connector does not support or one that throws there. It notes, and lets the call go, what the text cannot settle: a second page switch, and a call that passes no `skillNames`. It reads no file, calls no network and runs no command.

### A check that throws is skipped, never fatal

A gate that crashes the chain removes every other gate with it, which is worse than any single miss. The dispatcher treats a check that throws as silence.

### The wiring names the plugin root, never a checkout

The command is written against the installed folder rather than against a path in this repository, so the entry works wherever the plugin was installed.

## Boundary

This page answers what this plugin wires and why it wires one moment. It does not answer what a hook is — the moments a session offers, the payload a hook is handed, the verdict it returns rather than prints, and the rule that a hook always exits zero are [Hooks](../01-devex/02-hooks.md). It does not answer what the connector accepts either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| which moment this plugin claims, the tool it narrows to, and the single entry behind it | the payload, the verdict, the always-zero exit and the moments themselves | [Hooks](../01-devex/02-hooks.md) |
| that a connector script is read before the call | which APIs the connector supports, and how its work is carried out | the foundation's Figma connector chapter |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.FUNCTION.035` | a rule reaches a write-time hook only where review would be too late | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a hook script is live on its next run, and the wiring file is not | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | a hook is the Event kind of script, run from a committed bundle a staleness test keeps current | MUST |

Try it: `node packages/plugin-spn-surface/tests/run.mjs`
