<!-- spn:doc
{
  "id": "estate-hooks",
  "variant": "construct",
  "title": "Hooks — One Moment, Every Write",
  "subtitle": "One moment wired, because every rule here is about a file about to be written.",
  "lenses": ["INFRA", "TRUST"],
  "status": "PLANNING",
  "dependsOn": ["hook-set", "estate-plugin"],
  "summary": "This plugin wires exactly one moment of a session — the point just before a write happens — because every rule it holds is about what a file contains.",
  "keywords": ["hook", "hooks.json", "PreToolUse", "matcher", "timeout", "plugin root"]
}
-->

# Hooks — One Moment, Every Write

`For: DevOps / SRE · DevSecOps / Security` · `Status: 🔮 PLANNING`

This plugin wires exactly one moment of a session — the point just before a write happens — because every rule it holds is about what a file contains. Read this page to see why one moment and two calls are enough to cover it. It explains the command this plugin names against the plugin root, and why no other moment is needed.

## Overview

A credential, an identifier a tool discovers for itself, a provider's own string outside the entry that sanctions it, a hand edit to built output — each of these is a property of text somebody is about to write. So the wiring is as narrow as the rules are: one moment, two calls, one command.

**The moment decides the authority, and only one moment can refuse.** A call about to run is the last point at which a write can still be stopped; every later moment arrives after the file exists and can do nothing but comment. An estate leak is cheap to catch at the moment somebody writes it and expensive to find afterwards, so this plugin claims that moment and no other.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the wiring | `hooks.json` | the one file declaring which moments this plugin claims and what it runs at each |
| a call about to run | `PreToolUse` | the moment before a tool call is performed, and the only moment that may refuse one |
| the matcher | `Write\|Edit` | the calls the moment is narrowed to, so nothing else pays for the hook at all |
| the command | `command` | what the harness runs, written against the plugin root rather than against any checkout |
| the plugin root | `CLAUDE_PLUGIN_ROOT` | the installed folder a session reads, which is what makes the wired path portable |
| the timeout | `timeout` | the seconds the harness allows the command before it gives up on it |

## Model

One entry, read from the outside in: a moment, the calls it is narrowed to, and the command those calls reach.

```dg
{ "kind": "map",
  "caption": "One entry, and the narrowing happens before the command runs rather than inside it.",
  "boxes": [
    { "id": "a", "label": "a call about to run", "note": "PreToolUse — the one moment a call can be refused" },
    { "id": "b", "label": "the matcher", "note": "Write or Edit; every other call passes untouched" },
    { "id": "c", "label": "the command", "note": "the dispatcher, named against the plugin root" },
    { "id": "d", "label": "a verdict", "note": "a refusal, or silence and the ordinary flow continues" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "narrowed by" },
    { "from": "b", "to": "c", "label": "runs" },
    { "from": "c", "to": "d", "label": "returns" }
  ] }
```

**The wiring names a script and nothing else.** No rule, no cloud and no file pattern appears in it, so a rule changing is an edit to a script rather than to the wiring — and the difference matters, because an edit to a script is live on its next run while a change to the wiring waits for a reinstall.

## Parts

### One moment, because every law here is about text

`spn-devex` wires five moments across eight tools, and it has reason to: it has something to say when a window opens, when a prompt is sent, after a command has run, and before a turn is handed back. This plugin has nothing to say at any of those. **What it knows is what a file may not contain**, and the only moment that knowledge can act on is the one before a file is written.

### The matcher narrows before the command runs

The moment fires on every tool call, and a script deciding for itself whether it cares would be a process started for every read, every search and every shell command. The matcher is where that cost is refused: the harness starts nothing at all unless the call is a write or an edit.

### The command is written against the plugin root

`${CLAUDE_PLUGIN_ROOT}` is the installed copy, so the same wiring works in every repository that loads the plugin and nothing has to know where the plugin was installed. The path under it — `scripts/events/pretooluse.ts` — is the dispatcher, and the wiring stops there: what that dispatcher runs is discovered rather than declared.

### The folder holds the wiring and nothing else

`hooks/` carries `hooks.json` alone. **Code lives under `scripts/`**, filed by what kind of thing it is, which is why the wired path leaves the hooks folder immediately. A reader looking for what a refusal says opens the scripts tree, and a reader looking for when it fires opens this one file.

### One timeout, and it is generous on purpose

The dispatcher resolves its subjects by reading a folder and importing each cloud's validators, so a first run pays for the imports. The declared allowance is large enough that a cold run finishes inside it, because a hook the harness gives up on is a gate nobody can tell from a gate that allowed the call.

## Boundary

This page answers what this plugin wires and where. It does not answer what a hook is — the moments a session offers, the payload a hook is handed, the verdict it returns rather than prints and the always-zero exit are [Hooks](../01-devex/02-hooks.md), and this plugin's dispatcher speaks that shape directly. It does not answer what the dispatcher decides either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the one entry this plugin declares, its matcher, its command and its timeout | the moments, the payload shape, the verdict shape and the exit code rule | [Hooks](../01-devex/02-hooks.md) |
| that `hooks/` holds the wiring alone | what the wired dispatcher runs, and what each rule refuses | [Scripts](04-scripts.md) |
| that an edit to the wiring waits for a reinstall | what an installed copy is, and which repositories load this plugin | [Plugin](01-plugin.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | an edit to a wired script is live on its next run, while a change to `hooks.json` waits for a reinstall | MUST |
| `RD.DEVEX.UTILS.019` | the wiring names a script and carries no rule of its own | MUST |
| `RD.DEVEX.008` | a plugin carries its own libraries and never reaches into a sibling at runtime, which is why the wired path is under this plugin's own root | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | a hook is the Event kind of script, run from a committed bundle a staleness test keeps current | MUST |

Try it: `node packages/plugin-spn-infra/tests/run.mjs`
