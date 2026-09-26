<!-- spn:doc
{
  "id": "stack-refs",
  "variant": "construct",
  "title": "Refs — The Book, Restated Inside the Plugin",
  "lenses": ["SERVER_DEV", "ARCHITECT"],
  "status": "PLANNING",
  "dependsOn": ["ref-set"],
  "summary": "What this plugin restates from the foundation book and how the folder is arranged — one folder per book domain mirroring the constructs it names, a leaf that is self-contained because the reader holds no book, the stamp that makes a stale copy visible, and the one file a command writes.",
  "keywords": ["ref", "restatement", "domain", "stamp", "leaf", "generated"]
}
-->

# Refs — The Book, Restated Inside the Plugin

`For: Backend developer · Architect` · `Status: 🔮 PLANNING`

A plugin is installed on its own. A partner holding it has no checkout of the foundation book beside it, so a rule the plugin needs has to be written out inside the plugin — carried, not cited. This folder is that carrying, and it exists only because of what a reader does not have.

## Overview

Two rules keep the folder honest. **A ref states and never executes** — it says what is true of an apps node, and anything a skill performs lives elsewhere. And **a ref restates and adds nothing** — the book governs, the copy carries, and the copy says which version of the book it was read at, so a copy that has fallen behind can be reported rather than believed.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a ref | `refs/` | a self-contained markdown leaf restating a chapter of the book, written out rather than linked to |
| a domain folder | — | one folder per book domain, and the only kind of folder this tree holds at its top |
| a group | — | a folder under a domain; a file under it is named for a construct the book states |
| the face | `README.md` | a folder's own subject, which is what makes a folder a subject rather than a bucket |
| the stamp | `spn:restates` | the block at the top naming each chapter this file restates and the hash last read from it |
| drift | — | the state where a stamped hash no longer matches the chapter, which is what a run reports |
| a stack entry | `providers/<stack>/` | what is **true** of one stack — its kinds, naming, generation, tests and conformance |

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

### The tree holds domain folders and nothing else

The top of this folder is one folder per book domain. A folder under a domain is a group, a file under a group is named for a construct the book states, and a construct needing more than one file becomes a folder named for it. Nothing else is allowed a place, which is what keeps the arrangement readable without a map. *Where:* `plugins/spn-apps/src/refs/README.md`

### A folder's face is that folder's own subject

Every folder carries a face, and the face is about the folder rather than a listing of what is inside it. A folder whose face is an index is a folder nobody can tell the subject of. *Where:* `plugins/spn-apps/src/refs/support/apps/providers/README.md`

### What this plugin restates, and in which domains

One domain carries what a node is and everything it is built from — its shape, its packages, its modules, its resources, its apps, its tests, its comments, its agent surface and what it ships. A second carries the platform a partner adopts rather than rebuilds: tenancy, identity, surfaces, data and trust, lifecycle. A third carries one entry per module that ships, so the folder listing is the list. *Where:* `plugins/spn-apps/src/refs/support/apps/` · `plugins/spn-apps/src/refs/platform/core/` · `plugins/spn-apps/src/refs/platform/modules/`

### A stack sits inside the domain, not beside it

This plugin is the apps domain, and a stack is a realization of that domain rather than a domain of its own. So the stack entries sit under the domain folder, one folder per stack, and every stack answers the same questions under the same file names — which makes the folder listing the coverage. A stack with no capability for one of those questions writes the file anyway and says what to do instead. *Where:* `plugins/spn-apps/src/refs/support/apps/providers/ts/README.md`

### A ref states what is true; it never says what to do

The stack entries say what a kind is, how a name is formed, what generation produces, which tiers a node owes and what conformance means. The procedure a skill walks in that stack is not here, because a ref restates a construct and a procedure restates none. *Where:* `plugins/spn-apps/src/refs/support/apps/providers/ts/15-conformance.md` · [Providers](06-providers.md)

### A leaf is self-contained, because the reader has no book

A ref does not link into the foundation and expect a reader to follow it. Everything it restates is written out, under a stamp naming the version it was read at. That is the cost of being installable alone, and it is paid deliberately. *Where:* the `spn:restates` block at the top of `plugins/spn-apps/src/refs/support/apps/shape.md`

### One file is written by a command, and says so

The list of published packages a node may depend on moves every release, so a hand-written one is stale the day after it is written and nothing reports it. That file carries a citation naming the command that produced it, and re-running the command is how a reader checks it. There is no construct per package, so nothing in the book lists them and a hand-written list would be wrong at the next release. *Where:* `plugins/spn-apps/src/refs/support/apps/providers/ts/14-libraries.md` · `plugins/spn-apps/src/scripts/tools/library-catalogue.ts`

### The module list is not generated, because the folder is the list

One entry per module that ships means the listing already answers *which modules are there*. A generator over it would produce a second answer able to disagree with the first. *Where:* `plugins/spn-apps/src/refs/platform/modules/README.md`

## Boundary

This page answers what this plugin restates and how the folder is arranged. It does not answer how a restatement is stamped, parsed or compared — the block, the hash and the drift comparison are [The Ref](../01-devex/06-refs.md). It does not answer what any chapter of the book says, because the book says it.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| which domains this plugin carries, and that the top of the tree holds domain folders alone | the block, the stamp, the hash and the drift comparison | [The Ref](../01-devex/06-refs.md) |
| that a stack entry states what is true of a stack | the procedure a skill walks in that stack, and the rules a gate runs against it | [Providers](06-providers.md) |
| that one file here is written by a command and carries the citation saying so | what that command reads, and what it leaves out | [Scripts](04-scripts.md) |
| that a ref carries the book rather than citing it | what the book says | the foundation's own chapters |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DOCS.055` | a file carrying a rule it does not own is a restatement, and says so under the restates command | MUST |
| `RD.DEVEX.019` | the plugins are authored and delivered in one public repository, so the corpus is restatements that add no rule of their own | MUST |
| `RD.GOV.024` | a repository answers to the world it declares, which is what makes a stack a claim rather than something detected | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a ref is readable only after an install, so an edit here is not live in the open session | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-apps` | the apps domain restated for a reader holding no book — what a node is, the platform it adopts, the modules that ship, and what each stack is | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/src/scripts/tools/restate-drift.ts` | gate | every ref's stamp still matches the chapters it names, so no copy has fallen behind the book unnoticed |
| `node plugins/spn-devex/src/scripts/tools/coherence.ts` | gate | every rule a ref cites resolves to a row, and every plugin path it names is on disk |

Try it: `node plugins/spn-devex/src/scripts/tools/restate-drift.ts`
