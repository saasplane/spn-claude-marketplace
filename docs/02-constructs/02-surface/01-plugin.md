<!-- spn:doc
{
  "id": "surface-plugin",
  "variant": "construct",
  "title": "The Plugin — What spn-surface Is, and When a Session Loads It",
  "subtitle": "The one folder that makes spn-surface its own plugin, separate from every other.",
  "lenses": ["ARCHITECT", "UX"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "This plugin is the one folder everything in the Surface domain ships from, and the folder an install copies whole.",
  "keywords": ["plugin", "manifest", "identity", "description", "version", "surface"]
}
-->

# The Plugin — What spn-surface Is, and When a Session Loads It

`For: Architect · UX designer` · `Status: 🔮 PLANNING`

This plugin is the one folder everything in the Surface domain ships from, and the folder an install copies whole. Read this page to see what it claims about itself, who is entitled to load it, and what its version number means. It covers the manifest, the world that earns it, and the version rule it shares with the marketplace's other plugins.

## Overview

Surface is what a person sees and touches, and it is stated before any stack is chosen: the standards of content and interaction, the patterns a page starts from, the names, and the design system with its library and its delivery. A different act needs different instructions, and drawing a page is a different act from wiring a web module, so the plugin that carries it is its own.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the manifest | `plugin.json` | the file at `.claude-plugin/plugin.json` claiming a name, a version, a description and an author |
| the name | `name` | what an install, a marketplace entry and a session all address this folder by |
| the description | `description` | the sentences matched against the work at hand, which is how this plugin's material is reached at all |
| the world | `sprepo.json` | what a repository declares about itself, from which its plugin set is derived |
| the version | `version` | the number saying which bytes are published, `0.1.0` until the first release |

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

The manifest names this folder `spn-surface` and describes the Surface domain before any stack is chosen: the standards of content, interaction, patterns and names, the architecture of the design system, and the one skill, `design`, that states a page as a tree of named blocks. The description is long deliberately, because it is matched against the work at hand rather than browsed by a person, and material nothing matches is material nothing reaches.

### The world decides who gets it

A workspace never types a plugin name. Each repository declares its world in its own manifest, and the set of plugins it is entitled to load is derived from that declaration. The derivation is the foundation's, and this page only says which side of it this plugin sits on: a repository that builds a page loads this plugin beside the apps plugin.

### The version is the number of what is published

The manifest reads `0.1.0`, the version this plugin's first release publishes. The field names what is published rather than what somebody is working on, and a cache directory is keyed by version, so a plugin edited without an increment installs over its own published bytes and nothing tells a reader which of the two is running.

### What this plugin holds, and what it does not

This folder ships wiring, a skill, scripts, refs and tests. It ships no agents, because a persona and a reviewing viewpoint answer to no stack and live once in the core plugin, where the UX and UI lenses are. It ships no providers folder, because it holds no file that names a stack. Each folder it does ship has its own page, and none of them is described here.

## Boundary

This page answers what this plugin claims about itself and what its version means. It does not answer what a plugin is in general — the manifest's shape, the marketplace entry, the installed copy and the plugin root are [The Plugin](../01-devex/01-plugin.md). It does not answer what sits inside any of the folders it ships.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| this plugin's name, its description, and which world earns it | the shape of a manifest, the marketplace list, and what an installed copy is | [The Plugin](../01-devex/01-plugin.md) |
| that the version names what is published | how a release is cut, and what is granted rather than published | the foundation's Agent Plugins construct |
| that this plugin ships no agents | what an agent brief is, and which plugin ships one | [Agents](../01-devex/03-agents.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.UTILS.019` | the plugins are authored and delivered in one public repository, and publishing is pushing it | MUST |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what the plugin set is derived from | MUST |
| the foundation's `02-delivery.md` § The set a repo gets is derived from its own claim | a workspace never types a plugin name | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | source beside a committed build, one command entry, a shared folder never installed on its own | MUST |

Try it: `spn-devex plugin partner check`
