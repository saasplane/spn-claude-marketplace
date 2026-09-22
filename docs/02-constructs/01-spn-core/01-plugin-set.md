<!-- spn:doc
{
  "id": "plugin-set",
  "variant": "construct",
  "title": "The Plugin — Delivery Unit of the Marketplace",
  "lenses": ["ARCHITECT", "LEAD"],
  "status": "PLANNING",
  "dependsOn": [],
  "summary": "The folder that carries a standard from this repository into a running session — its manifest, its entry in the marketplace list, the installed copy a session actually reads, and the version field that says which bytes those are.",
  "keywords": ["plugin", "marketplace", "manifest", "version", "install", "plugin root"]
}
-->

# The Plugin — Delivery Unit of the Marketplace

`For: Architect · Engineering leader` · `Status: 🔮 PLANNING`

A rule an agent cannot load is a rule it cannot follow, however well the rule is written. The plugin is the unit that carries a rule from this repository into a running session: one folder, one small manifest, one entry in a list this repository keeps by hand. Every hook, skill, ref, lens and agent brief here lives inside one, so this page names the container before the other pages name what sits in it.

The part that costs people an afternoon is the last one. A session never reads this checkout. It reads an installed copy, and that copy is found by the plugin's name together with the version its manifest carries. So an edit here is not yet a change in behaviour, and a version that has not moved is a version whose installed copy an edit can sit silently behind.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a plugin | `plugin.json` | one folder under `plugins/`, named for what it serves, carrying `.claude-plugin/plugin.json` and any mix of instrument kinds |
| the marketplace | `marketplace.json` | the one file at `.claude-plugin/marketplace.json` naming every plugin this repository ships, and the folder each one lives in |
| the version | `version` | the field in a manifest saying which bytes are published; the count moves after a release, never before |
| the plugin root | `CLAUDE_PLUGIN_ROOT` | the installed folder a session reads, and the base every wired command path is written against |
| an instrument | — | one piece a plugin folder may hold — a hook, a skill, a ref, a lens or an agent brief; a plugin holds any mix and owes none |

## Model

Three files carry a plugin from an author's edit to the session that reads it, and confusing any two of them is where the afternoon goes. Read them left to right: what names a plugin, what a plugin claims about itself, where its bytes end up, and who reads them there.

```dg
{ "kind": "map",
  "caption": "No arrow reaches a session from this checkout; only the installed copy is ever read.",
  "boxes": [
    { "id": "a", "label": "marketplace.json", "note": "one entry per plugin — its name, its folder, its description" },
    { "id": "b", "label": "plugin.json", "note": "the plugin's own claim — name, version, description, author" },
    { "id": "c", "label": "the plugin root", "note": "the installed copy, found by name and version" },
    { "id": "d", "label": "a session", "note": "reads the installed copy and never this checkout" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "names the folder" },
    { "from": "b", "to": "c", "label": "an install copies it" },
    { "from": "c", "to": "d", "label": "loaded from" }
  ] }
```

The last arrow is the one to remember: a session reads the installed copy, so editing either file changes nothing until an install runs again.

## Parts

### The manifest

Each plugin folder carries one manifest at `.claude-plugin/plugin.json`, holding a `name`, a `version`, a `description` and an `author`. The description is long on purpose. It is matched against the work at hand rather than browsed by a person, so it states in full what the plugin carries. *Where:* `plugins/spn-core/.claude-plugin/plugin.json`, and the same path in the other two folders.

### The version names what is published

This repository releases at the version a plugin already carries, then moves the number. So the field answers *which bytes are installed*, and not *what am I building*. Each plugin counts on its own, following the marketplace's own convention of one version per plugin, and no file derives one number from another. *Where:* the `version` field of each `plugin.json`.

### The marketplace entry

One file at the repository root, `.claude-plugin/marketplace.json`, carries a `plugins` array. Each entry names the plugin, the relative `source` folder holding it, and a description a listing can show without opening the folder. Nothing generates the file: a generator would need a source, and that source would be a second list able to disagree with this one. The price of writing it by hand is that the two descriptions can drift, and one pair has. *Where:* `.claude-plugin/marketplace.json`

### The installed copy, and what a wired path names

Installing reads an entry, copies that plugin's folder, and stores it where a session can read it. Everything a plugin wires names that folder through `CLAUDE_PLUGIN_ROOT` rather than through a path in this checkout, so a plugin works wherever it was installed. *Where:* `plugins/spn-core/hooks/hooks.json`, and the same file in the other two folders.

### What a plugin may hold, and what it owes

A plugin folder holds any mix of instruments and owes none of them. `spn-core` carries every kind, which is why it is the folder to open to see what a full plugin looks like. `spn-infra` carries a single shell script beside its cards, and no tools and no agent briefs. Each kind is named by its own page, and none of them is named here. *Where:* `plugins/`

## Boundary

This page answers what a plugin is made of, how it is listed, and what an installed copy is. It does not answer which plugins a given repository is entitled to load — that is derived from the repository's own manifest, and the foundation's delivery chapter rules it. It also does not answer what any one instrument is: each kind has its own page, and you read the one you need next.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the shape of `plugin.json`, the shape of one `marketplace.json` entry, and what a version field means | which plugin set a repository loads, and what is granted rather than published | the foundation's Agent Plugins construct |
| that an edit is live only after an install, and that a wired path is written against the plugin root | when a particular instrument becomes readable after that install | [The Hook](02-hook-set.md) · [The Skill](07-skill-set.md) · [The Ref](08-ref-set.md) · [The Agent](10-agent-set.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | the plugins are authored and delivered in one public repository, and publishing is pushing it | MUST |
| `RD.GOV.024` | a repository with no nodes still declares a world and still earns a docs tree, which is why this model is written here at all | MUST |
| the foundation's `02-delivery.md` § The set a repo gets is derived from its own claim | a workspace never types a plugin name; the set comes from the consuming repository's own manifest | MUST |
| [MD6](../../registers/decisions.md) | the manifest is the current description, and a marketplace entry that disagrees with it is the stale side | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-core` | the manifest, the marketplace entry and the installed copy, for the widest of the three folders | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/partner-shape.ts` | gate | every plugin the marketplace declares is found from its own entry, and every hook inside it runs against a repository holding nothing but the plugin |

Try it: `node plugins/spn-core/hooks/tools/partner-shape.ts`
