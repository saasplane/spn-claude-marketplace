<!-- spn:doc
{
  "id": "stack-checks",
  "variant": "construct",
  "title": "Stack Checks — A Stack's Own Rules at Write Time",
  "lenses": ["SERVER_DEV", "WEB_DEV"],
  "status": "PLANNING",
  "dependsOn": ["checks"],
  "summary": "A check whose rule is true of one stack and nowhere else — read against the source as the pending write would leave it, asking whether this edit introduces the pattern, and refusing only where the model behind the rule is settled.",
  "keywords": ["stack", "check", "mask", "pending write", "introduced", "warning"]
}
-->

# Stack Checks — A Stack's Own Rules at Write Time

`For: Backend developer · Web developer` · `Status: 🔮 PLANNING`

Some rules are true everywhere. How a contract is named, how a service sequences its work, what an assertion in a browser test must compare — those are true of one stack and meaningless in another. A stack check is where such a rule lives: a file in the stack's own plugin, wired to the moments where that stack's code is written.

## Overview

Two things separate a stack check from a stack-agnostic one. Its header names a chapter of that stack's own provider standard rather than a general one, because anything general enough to hold everywhere belongs in the core plugin instead. And it asks whether **this edit** introduces the pattern rather than whether the file already carries it, which is what makes a refusal fair on a file somebody else wrote.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| a stack check | `CHECK` | one file naming a pattern in how this stack writes its own layers, with the verdict it gives |
| masking | `mask` | blanking comments and string bodies before searching, so a word inside a quote is never read as code |
| the resulting text | `resultingText` | the source as the pending write would leave it, which is what the search actually runs on |
| introduced | `introduced` | whether the pattern sits inside the text this edit adds, rather than somewhere the file already had |
| the watch | `watched` | the paths a check could have an opinion about, decided from the path alone |
| the dispatcher | `dispatch` | this plugin's own composition of its checks into one process, in the shape the core plugin uses |

## Model

A write is read as the file would be after it lands, then searched, and only a pattern the edit itself brings in is answered for.

```dg
{ "kind": "map",
  "caption": "The middle step overlays the pending write, so only the pattern this edit introduces is answered for.",
  "boxes": [
    { "id": "a", "label": "a Write or an Edit", "note": "the only two calls this plugin's wiring matches" },
    { "id": "b", "label": "the source as it would be", "note": "comments masked, the pending write overlaid" },
    { "id": "c", "label": "the check", "note": "does this edit introduce the pattern, not does the file have it" },
    { "id": "d", "label": "the verdict", "note": "a refusal where the rule is settled, a warning where it is not" }
  ],
  "links": [
    { "from": "a", "to": "b", "label": "read as" },
    { "from": "b", "to": "c", "label": "searched by" },
    { "from": "c", "to": "d", "label": "returns" }
  ] }
```

The reading in the middle is shared code, so every check in this plugin sees the same text and none of them pays to build it twice.

## Parts

### One entry, and the saving that comes from it

The wiring declares one entry matching writes and edits, and the dispatcher imports every check behind it. The registration is where the saving lives rather than the porting: separate entries are separate interpreter start-ups whatever language the scripts are written in, and on one measured edit the start-ups cost more than ten times the checking. *Where:* `plugins/spn-apps-ts/hooks/hooks.json`, `plugins/spn-apps-ts/hooks/checks/pretooluse.ts`

### The payload shape is copied, never imported

A plugin never depends on another plugin's internals. The two install separately and version separately, so an import across them would break on a version difference nobody chose. This plugin keeps its own copy of the payload and verdict shapes, named exactly as the core plugin names the same job, so learning one teaches you both. *Where:* `plugins/spn-apps-ts/hooks/lib/payload.ts`

### A source file is read with the write already applied

Reading what is on disk reports faults somebody else wrote and misses the one arriving now. So comments and string bodies are masked, the caller's pending text is laid over the file, and the search runs on that. The helpers doing it are shared rather than private to one check, because four checks reaching into a fifth is four extra module loads for one job. *Where:* `plugins/spn-apps-ts/hooks/lib/source.ts`

### Refusals where the model is settled, warnings where it is not

A refusal on a rule still being designed teaches people to work around the hook. So the rules with a settled model and a named exception refuse, and the findings whose model belongs to an open arc warn and under-report on purpose. The file carrying the unsettled ones marks the function to replace when that model lands, and keeps its trigger and its message meanwhile. *Where:* `plugins/spn-apps-ts/hooks/checks/coverage.ts`

### A check exists because a green run was lying

A pattern loose enough to match inside a longer string is a check that cannot fail. One matched a redirect address sitting inside a provider's own consent URL, so a browser journey agreed it was home while the screen was still the vendor's. The rule now compares a parsed host for equality, or anchors its pattern, and fires only where the literal looks like a host and the statement is about navigation. *Where:* `plugins/spn-apps-ts/hooks/checks/host-assertion.ts`

### A check names the ref its refusal cites

Where the reasoning behind a refusal is stack-agnostic, the message points at the core plugin's own card rather than restating it. The check is the part a script can catch; the card is the part a person has to read. *Where:* `plugins/spn-apps-ts/hooks/checks/enablement-grammar.ts`

## Boundary

This page answers what makes a check belong to a stack rather than to every repository. It does not answer the frame a check sits in — the payload, the verdict, the composition and the always-zero exit are [The Hook](../01-spn-devex/02-hook-set.md), and this plugin follows that shape rather than inventing one. It does not answer what a stack-agnostic check is either.

| Owns | Refuses | Who owns that instead |
| --- | --- | --- |
| reading a source file as the pending write would leave it, and answering only for what this edit introduces | the payload, the verdict, the dispatcher's shape, and the exit code | [The Hook](../01-spn-devex/02-hook-set.md) |
| the line between refusing a settled rule and warning about an unsettled one | a rule true in every repository whatever it is built with | [The Check](../01-spn-devex/04-checks.md) |
| that a refusal cites the card holding its reasoning | what that card says | [Stack Refs](04-stack-refs.md) · [The Ref](../01-spn-devex/08-ref-set.md) |

## Binds

| Rule | What it decides | Weight |
| --- | --- | --- |
| `RD.DEVEX.019` | a check restates a chapter of the provider standard and adds no rule of its own | MUST |
| `RD.PLATFORM.033` | the enablement grammar the refusals in this folder are written against | MUST |
| the foundation's `02-delivery.md` § When an edit becomes behaviour | a check is a hook script, so an edit here is live on its next run | MUST |

| Repo | Node | What it realizes | State |
| --- | --- | --- | --- |
| spn-foundation | `01-devex/02-agent/04-plugins` | the foundation construct this one realizes | planned |
| spn-claude-marketplace | `spn-apps-ts` | the write-time checks for the TypeScript stack, the dispatcher behind one entry, and the shared reading of a source file | planned |

## Proof

| Check | Kind | What a green run shows |
| --- | --- | --- |
| `node plugins/spn-devex/hooks/tools/partner-shape.ts` | gate | every check in this plugin runs against a repository holding nothing but the plugins, and none of them crashes on a file it was not written for |

Try it: `node plugins/spn-devex/hooks/tools/partner-shape.ts`
