<!-- spn:doc
{
  "id": "stack-tools",
  "variant": "construct",
  "title": "Stack Tools — Commands Over a Stack's Own Register",
  "lenses": ["SERVER_DEV", "QA"],
  "status": "PLANNING",
  "dependsOn": ["tools"],
  "summary": "A tool that reads or writes one stack's own declarations — the register found by its header rather than by a path, the two cells a run owns against the cells a person decides, and coverage measured against published actions rather than routes.",
  "keywords": ["register", "behaviour row", "tier", "results file", "action", "coverage"]
}
-->

# Stack Tools — Commands Over a Stack's Own Register

`For: Backend developer · Quality engineer` · `Status: 🔮 PLANNING`

A tool becomes a stack's own when what it reads is a shape only that stack declares. The tools here read one such shape: the behaviour register a repository keeps, and the actions a node publishes. Neither is wired to a moment; each is invoked by its own path against one repository, and neither holds state of its own.

One decision shapes both of them. **Part of a row is somebody's decision and part is what a run found**, and a tool writing over the first part would turn a declaration into a guess. So the shape of a register lives in a third file that both tools import, and the writer touches only the cells a run owns.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a register | `HEADINGS` | any table carrying the behaviour headings in order, wherever in a repository it sits |
| a row | `cellsOf` | one behaviour: who does what, what they see, its kind, the tier that proves it, its status and when that was found |
| the tier | `tier` | the rung a row is proven at; a run matches itself against this and leaves the other rungs alone |
| the results file | — | what a test runner wrote about one run, read by behaviour id and by tier |
| an action | `@SPAPIRouteCommand` | one published thing a caller can perform, found by its declaration rather than by a folder shape |
| a hand-checked row | `MANUAL` | a row a person proves, which no run ever writes over |

## Model

The register is found by what it looks like, its rows are matched against a run by id and tier, and only the cells a run owns are rewritten.

```dg
{ "kind": "map",
  "boxes": [
    { "id": "a", "label": "the register", "note": "any table carrying the headings, wherever it sits" },
    { "id": "b", "label": "a row", "note": "four cells somebody decided, and two a run found" },
    { "id": "c", "label": "the results file", "note": "what the runner wrote, read by id and by tier" },
    { "id": "d", "label": "two cells", "note": "Status and Updated at; every other cell is copied through" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "holds" },
    { "from": "b", "to": "c", "label": "matched against" },
    { "from": "c", "to": "d", "label": "writes" }
  ] }
```

The other tool walks the same registers in the other direction, asking which published action no row claims.

## Parts

### A register is found by its header, never by a path

A documents tree that moves must break neither tool, and reading the header is the only way to be right in the layout a repository has today and in the one that follows it. So any table whose headings are the behaviour headings is a register. The headings and the row test are one exported pair, read by both tools, because two tools parsing a table differently means one writes rows the other cannot see. *Where:* `plugins/spn-apps-ts/hooks/lib/register.ts`

### Two cells are the run's and the rest are a person's

The kind of behaviour and the tier that proves it are decisions somebody made. The status and the moment it was found are what the last run saw. The two were one cell until they disagreed quietly, and a row whose case had stopped running still read as proven. The writer touches those two and copies every other cell through untouched. *Where:* `plugins/spn-apps-ts/hooks/tools/behaviour-rows.ts`

### A run speaks only for the tiers it ran

A partial run that reset the whole register would make every status swing on every run, and nobody could read a red as new. So a run updates the rows declaring a tier it covered and leaves the rest exactly as it found them. That is why the tier is a person's cell to declare: it is what a run matches itself against. *Where:* `plugins/spn-apps-ts/hooks/tools/behaviour-rows.ts`

### It reads the run's own artifact, never a specification

A status derived from a specification reports a case that exists as a case that ran. Crossing a route with a surface, or scanning a source tree for case titles, cannot see a case that was skipped or filtered out. So the writer reads the file the runner produced, and a row whose case never reached the runner says so. *Where:* `plugins/spn-apps-ts/hooks/tools/behaviour-rows.ts`

### Coverage is measured against actions, not routes

A route says where a screen lives and nothing about what can be done there. One settings route can carry several actions behind it, and counting routes reports that screen as covered while most of them have never been performed. Every published action is an interaction, whether a person performs it through a browser or another system performs it through the generated client, so the surface to measure against is the action surface. *Where:* `plugins/spn-apps-ts/hooks/tools/action-coverage.ts`

### An action is found by its declaration, never by a folder

The glob this replaced named one stack's folder shape, and it missed a whole module whose home was an application rather than a package. The declaration itself is what makes something an action, so looking for the declaration needs no folder shape and finds a module wherever it is kept. *Where:* `plugins/spn-apps-ts/hooks/tools/action-coverage.ts`

## Boundary

This page answers what these tools read, what they may write, and why. It does not answer what a tool is in general — that a tool is invoked by its own path, grades its findings and counts only refusals into its exit code is [The Tool](../01-spn-core/05-tools.md). It does not answer what a behaviour row means either; the book states the row grammar, and this plugin only reads and writes it.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| finding a register by its header, the cells a run owns, and measuring coverage against the published action surface | that a tool is invoked by its own path and grades what it finds | [The Tool](../01-spn-core/05-tools.md) |
| that a run speaks only for the tiers it covered, and never writes over a hand-checked row | what a behaviour row must contain, and the grammar of its id | the foundation's document chapter |
| the reading of a stack's own declarations | the same job done for a repository that declares no stack at all | [The Tool](../01-spn-core/05-tools.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.008` | a behaviour row's shape, its id grammar, and that a test title carries the id | MUST |
| `RD.APPS.035` | which rung proves which behaviour, and that status is synced from a run rather than typed | MUST |
| the foundation's `02-document.md` § the behaviour row | the headings a register carries, in the order a tool reads them | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-apps-ts` | the register shape both tools import, the writer of the cells a run owns, and the action surface measured against what claims it | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-core/hooks/tools/partner-shape.ts` | gate | both tools run against a repository holding nothing but the plugins, and answer rather than crash where there is no register to read |

Try it: `node plugins/spn-core/hooks/tools/partner-shape.ts`
