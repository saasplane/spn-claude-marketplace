<!-- spn:doc
{
  "id": "plugin-set",
  "variant": "construct",
  "parentId": "concept",
  "title": "The Plugin — Delivery Unit of the Marketplace",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "dependsOn": [],
  "summary": "What a plugin is made of, how the marketplace lists one, and how installing it puts bytes into a session — the container every hook, skill, ref and agent brief lives inside.",
  "keywords": ["plugin", "marketplace", "manifest", "install", "cache", "claim"]
}
-->

# The Plugin — Delivery Unit of the Marketplace

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

A rule an agent cannot load is a rule it cannot follow, however well it is written. The plugin is the unit that gets a rule from this repository into a running session — one folder, one manifest, one row in the marketplace's own list. Every hook, skill, ref and agent brief in this repository lives inside one, so this construct names the container before the other four name what sits in it.

## Terms — the words this construct needs

| Term | Contract term | What it means here |
| --- | --- | --- |
| a plugin | `PluginManifest` | one folder under `plugins/`, named by what it serves, carrying `.claude-plugin/plugin.json` and any mix of the four instrument kinds |
| the marketplace | `MarketplaceEntry` | one row of the repository's own `.claude-plugin/marketplace.json`, naming a plugin's folder and its description |
| installing | `PluginInstall` | copying a plugin's folder into a session's own plugin cache, keyed by the plugin's name and the version its manifest carries |

## Boundary — what it owns, and what it refuses

If the question is about the container itself — the manifest, the marketplace row, the installed cache — it belongs here. If it is about one thing living inside that container, it belongs to that thing's own construct instead.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the shape of `plugin.json` and of one `marketplace.json` row | which plugin set a given repository is entitled to load, and what stays granted rather than published | `the foundation's 04-devex/10-delivery.md` |
| the version a `plugin.json` carries, and what a cache keyed by it means | which instrument kind may sit inside a plugin folder, and what each one is | [The Hook](../02-hooks/hook-set.md) · [The Skill](../03-skills/skill-set.md) · [The Ref](../04-refs/ref-set.md) · [The Agent](../05-agents/agent-set.md) |

## Model — the shape, in one picture

Three things, read left to right: what names a plugin, what a plugin is, and where its bytes end up once loaded.
```dg
{ "kind": "map",
  "boxes": [
    { "id": "mp", "label": "marketplace.json", "note": "one row per plugin — name, source folder, description" },
    { "id": "pj", "label": "plugin.json", "note": "inside the plugin's own folder — name, version, author" },
    { "id": "cache", "label": "plugin cache", "note": "keyed by name and version, one copy per install" }
  ],
  "links": [
    { "from": "mp", "to": "pj", "label": "names the folder" },
    { "from": "pj", "to": "cache", "label": "install copies it in" }
  ] }
```
`marketplace.json` is the repository's own hand-kept index — the only file that knows all three plugins exist. `plugin.json` is a plugin's own claim about itself, read at install time. The cache is what a session actually reads, which is why an edit to either file changes nothing until an install runs again.

## Parts — each piece, named once

### The manifest — `plugin.json`
Each plugin folder carries one, at `.claude-plugin/plugin.json`: a `name`, a `version`, a `description`, and an `author`. The version names what is published, not what you are working on — this repository releases at the version a plugin carries, then moves the number, so the field always answers *what does the cache hold* rather than *what is in the working tree*. *Where:* `plugins/*/. claude-plugin/plugin.json`

### The marketplace entry
One file at the repository root, `.claude-plugin/marketplace.json`, carries a `plugins` array. Each entry names a plugin, the relative `source` folder that holds it, and a description a listing can show without opening the folder. This repository is the only writer of that file — nothing generates it. *Where:* `.claude-plugin/marketplace.json`

### Install and the cache
Installing reads a marketplace entry, copies that plugin's folder, and stores it under a cache path keyed by the plugin's name and its manifest version. A version that has not moved since the last install is a version whose cache entry an edit can silently sit behind — the reason the manifest's version field matters as much as its content. *Where:* the session's own plugin cache, outside this repository.

## Relations — what it needs

| Needs | For |
| --- | --- |
| `the foundation's 04-devex/10-delivery.md` § The set a repo gets is derived from its own claim | the rule this construct never restates: which plugins a given repository's own manifest entitles it to load |

## Binds — what holds it, and where it lives today

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | the plugins are authored and delivered from this one public repository, and publishing is pushing it | MUST |
| `the foundation's 04-devex/10-delivery.md` § The set a repo gets is derived from its own claim | a workspace never types a plugin name; the set comes from the consuming repo's own manifest | MUST |
| `RD.GOV.024` | a repository with no nodes still declares a world and still earns a docs tree, which is why this repository's own model is written down here at all | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-claude-marketplace | spn-core · spn-apps-ts · spn-infra | one `plugin.json` and one instrument tree each, listed once in `.claude-plugin/marketplace.json` | planned |

## Proof — how you check it

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/01-plugins/plugin-set.md` | gate | the metadata block, the tag line and the outline hold the shape this construct names |

Try it: `node plugins/spn-core/hooks/tools/docs.ts audit docs/02-constructs/01-plugins/plugin-set.md`
