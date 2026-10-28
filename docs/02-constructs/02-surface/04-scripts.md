<!-- spn:doc
{
  "id": "surface-scripts",
  "variant": "construct",
  "title": "Scripts — The Code This Plugin Runs",
  "subtitle": "Every file this plugin runs, sorted by what calls it.",
  "lenses": ["WEB_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["surface-hooks", "checks"],
  "summary": "Scripts holds everything this plugin executes, divided by what calls each file: the entry the wiring names, the check it asks, the command line a person types, and the libraries the others read from the shared support folder.",
  "keywords": ["dispatcher", "check", "cli", "support-lib", "mask", "bundle"]
}
-->

# Scripts — The Code This Plugin Runs

`For: Web developer · Architect` · `Status: 🔮 PLANNING`

Scripts holds everything this plugin executes, divided by what calls each file: the entry the wiring names, the check it asks, the command line a person types, and the libraries the others read from the shared support folder. Read this page to see what runs, what reads what, and which files this plugin does not own.

## Overview

Today the plugin runs one check. **The command line ships two commands**: `check scan`, which reads Surface code whole for every note the check gives, and `unit show`, which prints one unit from the CONSTRUCT snapshot the plugin carries, or a unit beyond the core from the symbol index of the repository it runs in, or, from a workspace's root, of each repository in it. The entry refuses an unknown group by name, and a command added later is a file under `commands/` and reachable as soon as it exists. The helpers a check needs, the masker that blanks comments and strings, the text a pending write would leave, and the stack of the repository that owns a path, live in the shared support folder and are bundled into each plugin that reads them, so no plugin reads a neighbour's file.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| the dispatcher | `pretooluse.ts` | the single process behind the wired entry, which keeps the first refusal and joins the advice |
| a check | `figma-connector.ts` | one rule, in its own file, that returns a verdict and can also run alone |
| masking | `mask` | blanking comments and string bodies before searching, so a word inside a quote is never read as code |
| the resulting text | `resultingText` | the source as the pending write would leave it, which is what a rule actually reads |
| the entry | `cli.ts` | the one command line the plugin ships, dispatching by group and action |
| the unit lookup | `unit show` | one unit's props, values, defaults, usage, cases with their rules and index by value, read from the snapshot beside the refs; a unit beyond the core, its props from the repository's symbol index and the core block its name points to |
| the bundle | `dist/` | the committed build a hook runs, kept current by a staleness test |

## Model

A call reaches the dispatcher through the wiring; the dispatcher asks the check; the check reads the library; the library is copied into the bundle.

```dg
{ "kind": "map",
  "caption": "The shared helpers are imported by relative path and bundled in, so an installed plugin needs nothing outside its own folder.",
  "boxes": [
    { "id": "a", "label": "the wiring", "note": "hooks.json names dist/events/pretooluse.mjs" },
    { "id": "b", "label": "the dispatcher", "note": "events/pretooluse.ts" },
    { "id": "c", "label": "a check", "note": "checks/figma-connector.ts" },
    { "id": "d", "label": "the shared library", "note": "plugin-support-lib: payload, timing, source" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "runs" },
    { "from": "b", "to": "c", "label": "asks" },
    { "from": "c", "to": "d", "label": "reads" }
  ] }
```

## Parts

### The dispatcher runs the chain and never takes it down

The first refusal wins and stops the chain, because a refusal is an answer. Warnings accumulate, because two pieces of advice are better than one. A check that throws is skipped, never fatal.

### A check keeps its own file and can run alone

Each check exports a verdict function and can be run by hand against a payload on stdin, so a verdict from the dispatcher is the verdict the check gives alone.

### The timer is the shared one, bundled in

The dispatcher records its run through the shared timing library, which writes only while the developer has asked for it and can never fail a gate.

### The shared helpers have one copy

The masker, the resulting text and the stack read are one copy each in the shared support folder, proven there once. This plugin imports them by relative path; the build copies them into its own bundle.

### The command line is typed by its bare name

A launcher under `bin/` puts the plugin's entry on the Bash tool's path while the plugin is enabled, and `tiers.json` declares the permission tier of each command group: `check` and `unit`, both allowed.

### The unit lookup reads the plugin, and the repository's index for a unit beyond the core

`spn-surface unit show <Unit>` prints one unit for the agent that designs or builds a page. Its props, its usage, its index by value and the units their place sizes come from `refs/support/surface/construct.snapshot.json`, the CONSTRUCT snapshot written from the book of each release. Its cases come from the unit's restated table in `architecture-components.md` or `architecture-widgets.md`, because the snapshot keeps only the cases that draw the unit, and a case such as *not a sheet: a DSDialog* draws nothing. A partner holds the plugin and not the book, so the command never opens the book, a sibling checkout or the machine's home folder. Its second line names the book's release the snapshot was written from. A unit the snapshot does not hold, the design system's own or a module's, has no table in the book, so its props and their descriptions carry its use: the command reads them from the symbol index of the repository it runs in, `.claude/saasplane/spn-symbols.json` found from the working folder upwards, else each package's own `dist/generated/spn-symbols.json` under `packages/*` and `apps/*`, and never from source. **A fresh window starts at the workspace root, which is no repository**, so there it reads the merged index of each member instead — a member is a child folder with a `sprepo.json`, and they are read in name order — and the line it prints names the member. A name several members carry comes from the first whose entry carries props, because a member may pin a release of a package whose index was written before props were read from the code. It then names the core block the unit's last word points to, whose table decides what the props do not (`RD.SUPPORT.APPS.207`). Source and bundle sit three folders under the plugin's `src/`, so one relative path serves both.

## Boundary

This page answers what this plugin runs and what it reads from the shared folder. It does not answer what a script is — the kinds, the bundle and the staleness case are [Scripts](../01-devex/05-scripts.md). It does not answer what the connector accepts.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| the dispatcher, the checks it asks and the entry this plugin ships | the kinds of script, the bundle rule and the entry's grammar | [Scripts](../01-devex/05-scripts.md) |
| which shared helpers this plugin imports | the helpers' own proof, which sits with the shared folder | [Scripts](../01-devex/05-scripts.md) |
| the connector check's refusals and notes | which APIs the connector supports | [Hooks](02-hooks.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.FUNCTION.035` | a rule reaches a write-time hook only where review would be too late | MUST |
| `RD.DEVEX.AGENT.066` | a gate never names an instance | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | source beside a committed build, one command entry, a shared folder never installed on its own | MUST |

Try it: `node scripts/build-plugins.mjs plugin-spn-surface`
