<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § What — capabilities: the standard here, a chapter per construct everywhere else · § What a Where row declares
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- A capability chapter is what the architects hand the developers
     so that a construct is implemented with clarity: the places, the patterns that apply unchanged, and the handling
     that is special to this construct. It is not a line-by-line mirror — the code's comments carry the line, the
     behaviours carry the proof, and a pattern is stated once in the stack's standard, never again here.
     A capability states current truth, as a code comment does: what is not built yet lives in the workstream's split plan and in the behaviour row's status, never here.
     One chapter per construct per package that realizes it, numbered as the constructs are:
     04-capabilities/<domain>/<package>/<NN>-<construct>.md. A package that does not realize a construct has no chapter for it,
     and its README says so. -->
<!-- spn:doc
{"id": "<package>-capabilities-<construct>", "variant": "capability", "title": "<Construct> in <package>", "lenses": ["SERVER_DEV"], "status": "DONE", "realizes": ["<construct id>"], "summary": "<One sentence: what this package does for the construct, and the one thing about it that is not the pattern.>", "keywords": []}
-->

# <Construct> in <package>

`For: <Backend|Web> developer` · `Status: ✅ DONE` · `Realizes: <Construct>`

<One paragraph. What of the construct this package realizes — which Parts — and what a developer should know before opening the code: the decisions that are not the pattern. A newcomer reads this and knows where to start.>

## Where

<A table, one row per place the construct lives in this package. Short. This is the map a developer opens the code with, and the only place the chapter declares code: the coverage report checks every path against src/. A row names a file, or a folder that is one seat of the package's kind; src/ or a layer folder declares nothing. A web module's paths start at its entry/ui/ folder. It is written by hand and checked against the code, never generated from it.>

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| <Part> | `src/contract/<file>` | the state and the commands |
| <Part> | `src/app/services/<file>` | the service |
| <Part> | `src/app/repositories/<file>` | the repository |
| <Part> | `src/migrations/<file>` | the tables |

## Follows the pattern

<One line per pattern that applies unchanged, each a link to the stack's standard. Nothing is explained here; the standard explains it once. If everything follows the pattern, this section says so and the chapter is short.>

- <Single get and multi get> — `<link to the stack's construct that states it>`
- <List with paging and filters> — `<link>`
- <Organization-scoped repository> — `<link>`

## Special handling

<The chapter's substance. One subsection per contract method, flow or rule that is handled differently from the pattern or beyond it, because the construct's Model demands it. Each says WHY (the rule of the construct that forces it, named), WHAT is special, and HOW (the mechanism, in prose, with the one place in the code to read). Three to eight of these for a large construct; none for a construct that is pure pattern.>

### <The method or flow>

**Why** — <the construct's rule, by name, and what breaks without it.>
**What** — <one sentence: what happens that the pattern does not do.>
**How** — <the mechanism in prose; the place: `src/app/services/<file>`.>

## Between modules

<What this package takes from other modules for this construct and what it publishes to them: queues, events, shared services, the identity it passes along. A table when there is more than one.>

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | <module> | <what> | <why> |
| publishes | <module> | <what> | <why> |
