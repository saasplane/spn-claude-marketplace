<!-- spn:doc
{
  "id": "apps-plugin",
  "variant": "construct",
  "title": "The Plugin — What spn-apps Is, and When a Session Loads It",
  "subtitle": "The one folder that makes spn-apps its own plugin, separate from every other.",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "This plugin is the one folder everything in the apps domain ships from, and the folder an install copies whole.",
  "keywords": ["plugin", "manifest", "identity", "description", "version", "lockstep"]
}
-->

# The Plugin — What spn-apps Is, and When a Session Loads It

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

This plugin is the one folder everything in the apps domain ships from, and the folder an install copies whole. Read this page to see what it claims about itself, who is entitled to load it, and what its version number means. It covers the manifest, the world that earns it, and the version rule it shares with the marketplace's other two plugins.

## Overview

Two things about a plugin are worth separating before anything else. **Its identity is its own** — the name and the description, which say what this plugin carries and therefore whether the work at hand has anything to do with it. **Its version is not its own** — every plugin in this marketplace carries the same number, and a release moves all of them together.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the manifest | `plugin.json` | the file at `.claude-plugin/plugin.json` claiming a name, a version, a description and an author |
| the name | `name` | what an install, a marketplace entry and a session all address this folder by |
| the description | `description` | the sentences matched against the work at hand, which is how this plugin's material is reached at all |
| the world | `sprepo.json` | what a repository declares about itself, from which its plugin set is derived |
| the version | `version` | the number saying which bytes are published, shared with the other plugins and moved after a release |

## Model

A repository declares a world; the set of plugins it gets is derived from that declaration; an install copies each one; and a session reads the installed copy rather than this checkout.

```dg
{ "kind": "map",
  "caption": "Nobody types a plugin name into a workspace: the declaration is read and the set follows from it.",
  "boxes": [
    { "id": "a", "label": "a repository's claim", "note": "sprepo.json — the world it answers to" },
    { "id": "b", "label": "the derived set", "note": "which plugins this repository is entitled to load" },
    { "id": "c", "label": "the installed copy", "note": "found by name and by the version the manifest carries" },
    { "id": "d", "label": "a session", "note": "matches the description against the work at hand" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "derives" },
    { "from": "b", "to": "c", "label": "installed as" },
    { "from": "c", "to": "d", "label": "read by" }
  ] }
```

## Parts

### The identity is this plugin's own

The manifest names this folder `spn-apps` and describes the apps domain before any language is chosen: the contract model a module publishes, the rules a contract state follows, and the worksheet a partner fills in to decide which shipped modules they adopt. The description is long deliberately, because it is matched against the work at hand rather than browsed by a person, and material nothing matches is material nothing reaches.

### The world decides who gets it

A workspace never types a plugin name. Each repository declares its world in its own manifest, and the set of plugins it is entitled to load is derived from that declaration — which is why this plugin arrives in a repository that answers to the apps world and nowhere else. The derivation is the foundation's, and this page only says which side of it this plugin sits on.

### The version is shared, and it is not a claim about this folder

Every plugin in this marketplace carries the same number, and a release moves all of them — a plugin with no change in it is released anyway, at the new number. The reason is that a reader cannot tell three numbers apart: the plugins are installed as one set by one command, so differing numbers cannot be told from one release that half-landed. One number answers *are you current?* and several only raise the question.

### The count moves after a release, never before

The release happens at the number a manifest already carries, and the first edit after it moves the number. So the field names **what is published** rather than what somebody is working on. That is also what makes a stale cache findable: a cache directory is keyed by version, so a plugin edited without an increment installs over its own published bytes and nothing tells a reader which of the two is running.

### What this plugin holds, and what it does not

This folder ships wiring, skills, scripts, refs, providers and tests. It ships no agents, because a persona and a reviewing viewpoint answer to no stack and live once in the core plugin — and the absence is a statement rather than a gap. Each folder it does ship has its own page, and none of them is described here.

## Boundary

This page answers what this plugin claims about itself and what its version means. It does not answer what a plugin is in general — the manifest's shape, the marketplace entry, the installed copy and the plugin root are [The Plugin](../01-devex/01-plugin.md). It does not answer what sits inside any of the folders it ships.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| this plugin's name, its description, and which world earns it | the shape of a manifest, the marketplace list, and what an installed copy is | [The Plugin](../01-devex/01-plugin.md) |
| that the version is shared across the marketplace and moves after a release | how a release is cut, and what is granted rather than published | the foundation's Agent Plugins construct |
| that this plugin ships no agents | what an agent brief is, and which plugin ships one | [Agents](../01-devex/03-agents.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.UTILS.019` | the plugins are authored and delivered in one public repository, and publishing is pushing it | MUST |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what the plugin set is derived from | MUST |
| the marketplace's `CLAUDE.md` § Versioning | the plugins move together, at one number, stamped in each manifest because that is what a marketplace reads | MUST |
| the foundation's `02-delivery.md` § The set a repo gets is derived from its own claim | a workspace never types a plugin name | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | source beside a committed build, one command entry, a shared folder never installed on its own | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs plugin partner` (or `spn-devex plugin partner`, once installed)
