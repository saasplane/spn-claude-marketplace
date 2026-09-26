<!-- spn:doc
{"id": "spn-apps-capabilities-refs", "variant": "capability", "title": "Refs in spn-apps", "lenses": ["SERVER_DEV", "ARCHITECT"], "status": "DONE", "realizes": ["stack-refs"], "summary": "What this plugin carries from the foundation book — one folder per book domain, a leaf complete enough to read with no book beside it, one folder per stack answering the same questions under the same file names, and the one file a command writes.", "keywords": ["ref", "restatement", "domain", "stamp", "stack", "generated"]}
-->

# Refs in spn-apps

`For: Backend developer · Architect` · `Status: ✅ DONE` · `Realizes: Refs`

A partner holding this plugin has no checkout of the foundation book beside it, so a rule the plugin needs is carried rather than cited. **A ref is a self-contained leaf**: everything it restates is written out, under a stamp naming the version it was read at. And **a ref states rather than performs** — the procedure a skill walks in a given stack is not here, because a ref restates a construct and a procedure restates none.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| How the folder is arranged | `plugins/spn-apps/src/refs/README.md` | one folder per book domain, and what a group and a file under it mean |
| What a node is | `plugins/spn-apps/src/refs/support/apps/` | shape, packages, modules, resources, apps, tests, comments, the agent surface, what it ships |
| The platform a partner adopts | `plugins/spn-apps/src/refs/platform/core/` | tenancy, identity, surfaces, data and trust, lifecycle |
| The modules that ship | `plugins/spn-apps/src/refs/platform/modules/` | one entry per module, so the folder listing is the list |
| What a stack is allowed to be | `plugins/spn-apps/src/refs/support/apps/providers/README.md` | read before adding a second stack, and before assuming a tool can work out which one it is in |
| What this stack does | `plugins/spn-apps/src/refs/support/apps/providers/ts/` | a face plus the numbered entries, from kinds through conformance |
| The generated table | `plugins/spn-apps/src/refs/support/apps/providers/ts/14-libraries.md` | the published packages a node may depend on, written by a command |
| A stamp | the `spn:restates` block at the top of `plugins/spn-apps/src/refs/support/apps/shape.md` | each chapter restated, and the hash last read from it |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [The Ref](../../../02-constructs/01-devex/06-refs.md)
- How a ref is stamped, parsed and compared — [Ref in spn-devex](../../01-devex/spn-devex/06-refs.md)

## Special handling

### The tree holds domain folders and nothing else

**Why** — *a folder that is neither a domain nor a group inside one is a folder nobody can place*. This tree once held a procedure, which restates no construct and belonged under the provider instead.
**What** — the top is one folder per book domain. A folder under a domain is a group, a file under a group is named for a construct the book states, and a construct needing more than one file becomes a folder named for it.
**How** — every folder carries a face, and the face is about the folder rather than a listing of it. `plugins/spn-apps/src/refs/README.md`.

### A stack sits inside the domain, not beside it

**Why** — *this plugin is the apps domain, and a stack is a realization of that domain*. A plugin per stack would have been a domain name with a stack's name in it.
**What** — the stack entries sit under the apps domain folder, one folder per stack.
**How** — every stack answers the same questions under the same file names, so the folder listing is the coverage, and a stack with no capability for one of them writes the file anyway and says what to do instead. `plugins/spn-apps/src/refs/support/apps/providers/README.md`.

### A stack is claimed, never detected

**Why** — *a repository's language is not something a tool works out by looking at the files*. It is a claim the repository states about itself, and the organization's own declaration grants it.
**What** — the stack face states this before any entry describes what the stack does, so a reader meets the rule before the detail.
**How** — the same claim is what every gate in this plugin reads. `plugins/spn-apps/src/refs/support/apps/providers/README.md`.

### One file is generated, and the rest are not

**Why** — *a published set moves every release*, so a hand-written list of packages is stale the day after it is written and nothing reports that. There is no construct per package either, so nothing in the book lists them.
**What** — the package table is written by a command and carries the citation naming it. Re-running the command is how a reader checks it.
**How** — the module list stays hand-kept, because there is one entry per module and the folder is therefore already the list. A generator over it would produce a second answer able to disagree with the first. `plugins/spn-apps/src/refs/support/apps/providers/ts/14-libraries.md`.

### A leaf is complete, which is the cost of being installable alone

**Why** — *the reader holds the plugin and not the book*, so a link into the foundation is a link nobody can follow.
**What** — everything a ref restates is written out here, under a stamp naming each chapter and the hash last read from it.
**How** — a drift run compares those hashes, so a copy that fell behind is reported rather than believed. `plugins/spn-apps/src/refs/support/apps/shape.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the chapters each ref restates, each stamped with the version it was read at | the book governs and this folder is the copy |
| takes | this plugin's own scripts | the command that writes the package table | a list nobody could keep by hand is written by something that can |
| publishes | every repository declaring the apps world | the standards, readable with no book on the machine | a rule a reader cannot reach is a rule nobody follows |
| publishes | this plugin's own skills and providers | the facts their procedures cite rather than restate | a rule has one home, and a procedure points at it |
