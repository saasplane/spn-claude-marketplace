<!-- spn:doc
{
  "id": "estate-plugin",
  "variant": "construct",
  "title": "Plugin — spn-infra as a Delivery Unit",
  "subtitle": "The one folder that carries this repository's infrastructure rules into a working session.",
  "lenses": ["INFRA", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["plugin-set"],
  "summary": "This plugin carries this repository's estate standard — the rules for the infrastructure a product runs on — into a session that is working on one, in one folder.",
  "keywords": ["plugin", "manifest", "version", "lockstep", "description", "INFRA"]
}
-->

# Plugin — spn-infra as a Delivery Unit

`For: DevOps / SRE · Architect` · `Status: 🔮 PLANNING`

This plugin carries this repository's estate standard — the rules for the infrastructure a product runs on — into a session that is working on one, in one folder. Read this page to see what this plugin claims about itself and when a session loads it. It explains the manifest, the marketplace entry, and the version rule it shares with its two sibling plugins.

## Overview

A rule an agent never loads is a rule nobody follows. `spn-infra` carries one manifest, one entry in the marketplace list, and a set of construct folders beneath it, and every other page of this domain names something inside that container.

Two things about the manifest pull in opposite directions, and both are deliberate. **The version is the set's and the identity is this plugin's own.** The number moves with its two siblings whether or not anything here changed, so a reader comparing three numbers never has to wonder whether a release half-landed. The description belongs to `spn-infra` alone, and it is what a session matches against when it decides whether to load the plugin at all.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the manifest | `plugin.json` | `.claude-plugin/plugin.json` inside this plugin's own folder, carrying its name, version, description and author |
| the name | `spn-infra` | what the marketplace entry and every install refer to this folder by |
| the description | `description` | the sentence a session matches the work at hand against; it decides whether this plugin is loaded |
| the version | `version` | which published bytes a session is reading, shared with the other two plugins |
| an INFRA repository | `sprepo.json` | a repository whose declared world is `INFRA` — the estate repository, and the blueprint repository beside it |
| the plugin root | `CLAUDE_PLUGIN_ROOT` | the installed copy a session reads, and the base every wired command is written against |

## Model

A session never reads this checkout. It reads an installed copy, found by the plugin's name together with the version its manifest carries, and it loads that copy only where the repository it is standing in declares the world this plugin serves.

```dg
{ "kind": "map",
  "caption": "The declared world decides the load; the version decides which bytes are loaded.",
  "boxes": [
    { "id": "a", "label": "the marketplace entry", "note": "names this plugin and the folder holding it" },
    { "id": "b", "label": "plugin.json", "note": "name, version, description — the plugin's own claim" },
    { "id": "c", "label": "the installed copy", "note": "found by name and version together" },
    { "id": "d", "label": "an INFRA repository", "note": "its own sprepo.json decides this plugin is loaded" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "points at" },
    { "from": "b", "to": "c", "label": "an install copies it" },
    { "from": "c", "to": "d", "label": "loaded into" }
  ] }
```

## Parts

### The three plugins carry one number, and every release moves all three

**A reader cannot tell three version numbers apart.** The plugins install as one set, by one command, and a session loads whichever of them its repository declares. Faced with three different numbers there is no way to tell from the outside whether that is three deliberate versions or one release that half-landed. So the three move together, and a plugin with nothing changed in it is released anyway at the new number. The cost is releasing an unchanged plugin, which costs nothing.

### The number names what is published, not what somebody is working on

**The release happens at the version the plugins already carry, and the count moves afterwards.** A published version ships, and the first edit after it increments the patch — for all three, not for the one that was touched. That is what makes a stale cache findable: a cache directory is keyed by version, so a plugin edited without an increment installs over its own published bytes and nothing tells a reader which of the two is running.

### The description is this plugin's own, and it decides the load

**A description is matched, not browsed.** It states in full what the plugin carries — the estate skills, the cards that hold the estate's vocabulary, the per-cloud material, and the refusal a write meets — because a session compares it against the work at hand rather than reading it for pleasure. The marketplace entry carries a second description for a listing to show, and the manifest is the current one wherever the two disagree.

### It loads where a repository declares INFRA

**The world is read from the repository, never typed by a workspace.** A repository declaring `INFRA` gets this plugin, and that covers both the estate repository and the blueprint repository beside it, because both are edited under the estate's laws. A repository declaring another world never loads it, which is why the guard can be narrow: it only ever meets files that belong to an estate.

### What this plugin holds, and what it leaves out

`spn-infra` ships `hooks/`, `skills/`, `scripts/`, `refs/`, `providers/` and `tests/`. **It ships no `agents/` folder, and the absence is the statement**: an agent brief convenes a reviewer over a change, and the estate's own review happens against a rendering through the tool's doors rather than against a diff. Each of the folders it does ship is named by its own page here.

## Boundary

This page answers what carries the estate standard into a session and which bytes a session reads. It does not answer what a plugin is in general — the manifest shape, the marketplace file and the installed copy are [The Plugin](../01-devex/01-plugin.md). It does not answer what any construct inside this folder holds.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| this plugin's identity, its description, and that it loads where a repository declares `INFRA` | the shape of a manifest, a marketplace entry, and what an installed copy is | [The Plugin](../01-devex/01-plugin.md) |
| that the version is the set's and moves after a release | which moments this plugin wires, and what the wiring declares | [Hooks](02-hooks.md) |
| that no `agents/` folder is shipped | what the folders it does ship hold | [Skills](03-skills.md) · [Scripts](04-scripts.md) · [Refs](05-refs.md) · [Providers](06-providers.md) · [Tests](07-tests.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| [RD.DEVEX.006](../../registers/decisions.md) | the manifest is the current description, and a marketplace entry disagreeing with it is the stale side | MUST |
| `RD.DEVEX.WORKSPACE.176` | a repository answers to the world it declares, which is what decides this plugin is loaded at all | MUST |
| the foundation's `02-delivery.md` § The set a repo gets is derived from its own claim | a workspace never types a plugin name; the set comes from the consuming repository's own manifest | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | source beside a committed build, one command entry, a shared folder never installed on its own | MUST |

Try it: `node packages/plugin-spn-devex/src/dist/cli.mjs plugin partner` (or `spn-devex plugin partner`, once installed)
