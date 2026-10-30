<!-- spn:doc
{
  "id": "surface-refs",
  "variant": "construct",
  "title": "Refs — The Surface Book, Restated Inside the Plugin",
  "subtitle": "The foundation book's Surface rules, carried inside this plugin for a reader with no other copy.",
  "lenses": ["UX", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["ref-set"],
  "summary": "Refs carries, inside this plugin, the Surface rules a partner needs but has no checkout to read: the standards, the patterns, the architecture of the design system, its library and its delivery, and the specs a page starts from.",
  "keywords": ["ref", "restatement", "surface", "stamp", "patterns", "specs"]
}
-->

# Refs — The Surface Book, Restated Inside the Plugin

`For: UX designer · Architect` · `Status: 🔮 PLANNING`

Refs carries, inside this plugin, the Surface rules a partner needs but has no checkout to read. Read this page to see what the folder holds, how it is arranged, and how a copy that has fallen behind the book is reported. It explains the folder and leaves each rule to the ref that states it.

## Overview

Two rules keep the folder honest. **A ref states and never executes**: it says what is true of a surface, and anything a skill performs lives elsewhere. And **a ref restates and adds nothing**: the book governs, the copy carries, and the copy says which version of the book it was read at, so a copy that has fallen behind can be reported rather than believed.

This construct realizes the book's `01-devex/02-agent/04-plugins`.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a ref | `refs/` | a self-contained markdown leaf restating a chapter of the book, written out rather than linked to |
| a domain folder | `support/` | one folder per book domain, and the only kind of folder this tree holds at its top |
| a group | `surface/` | a folder under a domain; a file under it is named for a construct the book states |
| the stamp | `spn:restates` | the block at the top naming each chapter this file restates and the hash last read from it |
| a spec copy | `app-patterns/` · `site-patterns/` | a folder of skeleton specs, byte-identical to the book's, which a page starts from |
| the snapshot | `construct.snapshot.json` | the CONSTRUCT snapshot written from the book of each release, which `unit show` reads |
| drift | — | the state where a stamped hash no longer matches the chapter, which is what a run reports |

## Model

The book is the source. A ref is the copy that travels with the plugin, arranged so its shape tells a reader where to look before they have read anything.

```dg
{ "kind": "map",
  "caption": "The reader holds the plugin and not the book, so the copy is complete and says which version it copied.",
  "boxes": [
    { "id": "a", "label": "the book", "note": "the foundation's own chapters — the source that governs" },
    { "id": "b", "label": "a ref", "note": "a self-contained leaf, complete without the book beside it" },
    { "id": "c", "label": "the stamp", "note": "each chapter it restates, and the hash last read there" },
    { "id": "d", "label": "a drift run", "note": "compares the hash and reports a copy that fell behind" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "restated as" },
    { "from": "b", "to": "c", "label": "carries" },
    { "from": "c", "to": "d", "label": "read by" }
  ] }
```

## Parts

### One folder holds the whole domain, one file to a construct

`refs/support/surface/` holds the standards of content and interaction, the patterns, the architecture of the design system with its names, layouts and widgets, the providers a design system needs, and the library and showcase deliveries. The path is the one the book's domain has, so a reader who knows the book finds the ref.

### The specs are copies, owned by the book

The app patterns and the site patterns each have a folder of skeleton specs. They are byte-identical to the book's, an index in each folder lists them with the hash of their contents, and `restates files` writes and checks them. A builder changes a spec in the book, and the export carries it.

### The CONSTRUCT snapshot sits beside the refs

`refs/support/surface/construct.snapshot.json` is the CONSTRUCT snapshot, written from the book alone with `spnutils apps surface construct --out` for each release of the plugin. It holds every unit's props, its usage, its cases, the index by value of each choice table and the units their place sizes, and its `source.readFrom` names the book's release it was written from. It is the one snapshot a repository holds, because it carries nothing of a machine. `unit show` reads it, with the restated tables beside it, and reads nothing else outside the plugin but the symbol index of the repository it runs in, or, from a workspace's root, of each repository in it, for a unit the snapshot does not hold.

### The stack-specific half is the apps plugin's

How a block is built in TypeScript, and the layout of a web module, belong to the stack, so those refs sit in the apps plugin and a ref here points at them by name rather than by link.

### A ref that fell behind says so

Every ref carries the chapters it restates and the hash last read from each. A drift run compares them and reports a ref whose chapter has moved.

## Boundary

This page answers what this plugin carries from the book and how it is arranged. It does not answer what a ref is — the stamp, the drift run and the rule that a ref restates and adds nothing are [Refs](../01-devex/06-refs.md). It does not answer what any Surface rule says.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| which Surface chapters this plugin restates, and the folder they sit in | the stamp's grammar and the drift run | [Refs](../01-devex/06-refs.md) |
| that the spec folders are copies the book owns | how a stack builds a block | [Refs](../03-apps/05-refs.md) |
| the CONSTRUCT snapshot the plugin carries, beside the refs | what a snapshot holds, and how it is written | the book's design library chapter |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RULE.DEVEX.WORKSPACE.118` | a ref that carries a rule it does not own is a restatement, and says so under a stamp | MUST |
| the foundation's plugins construct § The shape of a plugin, and its `04-plugins/02-shape.md` | `refs/` holds one folder per book domain | MUST |

Try it: `spn-devex restates check`
