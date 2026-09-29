<!-- spn:doc
{
  "id": "{{slug}}",
  "variant": "construct",
  "title": "{{NAME}}",
  "lenses": ["{{LENS}}"],
  "status": "PLANNING",
  "dependsOn": ["{{id}}"],
  "subtitle": "{{THE SUBTITLE, one plain sentence: the promise, what is true for you once this thing exists — \"Your work stays together in one folder, even after you close the window you started it in.\"}}",
  "summary": "{{The Description's first sentence, word for word.}}"
}
-->
<!-- RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The four page kinds · § The masthead, and the opening · § A construct's status is derived, never typed · 03-tree.md § What — constructs: the model, read in order
     This file carries rules it does not own. The chapter above is the source of truth.
     A rule change is edited there first, then here, in the same change. Never add a rule here.
     restate-drift.ts reports this copy when its source moves. -->
<!-- THE ONLY FILE AN AGENT AUTHORS for a construct. `docs.ts page` produces the HTML page from it — one block per
     `##`, no block is forced and none is numbered. The block keeps eight keys: `id`, `variant`, `title`, `lenses`,
     `status`, `dependsOn`, `subtitle`, `summary`. `subtitle` is the page's Subtitle, the construct's one-line promise; `docs page`
     renders it under the h1, and it is plain language, like the Description. `dependsOn` is the reading order and the only record of what this construct
     needs; the domain face renders it. `status` is rolled up by `docs.ts status` from the behaviour rows at this
     construct's own path — `03-behaviors/<same relative path>` — and is never typed. IN A `FOUNDATION` REPOSITORY THERE
     IS NO `status` KEY AND NO `Status:` CHIP: those rows are promises, and a promise has no proof state. -->
# {{NAME — the subject in full, so the title stands alone: Estate Shape, not Shape; Kind Manifest, not Manifest.}}

`For: {{Actor}} · {{Actor}}` · `Status: 🔮 PLANNING`

{{THE DESCRIPTION, one paragraph and the only one above Overview: what this thing is, in everyday words; why you would read this page; then at most two short sentences on how the page runs — "A workstream is a folder that holds one piece of work, from the first idea until you close it. Read this before you start a change that will take more than one working session. The page explains how the folder is named, how it moves between waiting, open and closed, and what is checked before you can close it." It is held to 05-artifacts.md § The masthead, and the opening, and construct-template.html's masthead comment carries the poor examples and the check to run before you save. The promise is the block's `subtitle`, never this paragraph. Anything that argues belongs in Overview below.}}

## Overview
<!-- WHY THIS CONSTRUCT EXISTS. What went wrong without it, what it changes, and what a reader should expect to
     believe by the end of the page. This is where the orientation that used to sit above the first heading now
     lives, including "if this is your first … " and what a reader has to unlearn.
     It argues. It does not describe the shape — that is the Model, and repeating it here is how two descriptions of
     one thing start to disagree. -->
{{The problem, in the reader's own terms, before any SaaS Plane word is used to solve it.}}

{{What changes because this construct exists, and what a reader should believe by the end of this page.}}

{{FOR A FIRST-TIME READER — "If this is your first …": no earlier reading assumed, what to unlearn, and the two or three sentences to keep if they read nothing else.}}

## Terms
<!-- Second, because the Model uses these words and the Overview does not. A Term is a word SaaS Plane gives a
     meaning to — a contract term, or a word of its own such as estate or ring. A word every engineer already knows
     is not a Term, even when the page uses it.
     ONE DECLARATION PER TERM, PER REPOSITORY (Q249): this table declares only what THIS construct introduces, which
     is the construct whose own contract declares the symbol. A word another domain's contract owns is linked from
     Boundary and declared here by nobody.
     The glossary is generated from this table, so it is three columns, and a row that points somewhere else
     instead of explaining is not a definition. Rows are in the order a newcomer meets the words. -->
| Term | Contract term | What it means |
| --- | --- | --- |
| {{The word, capitalised}} | `{{ContractTerm}}` | {{one plain sentence}} |

## Model
<!-- WHAT IT IS. The whole shape before any piece of it: the general form, then its parts, then its kinds. A figure
     where seeing is faster than reading; none where it is not. It describes. The reason it exists is the Overview's,
     and a Model that argues is saying something twice. -->
{{Opens with its own overview: what you are looking at, in prose first.}}

```dg
{ "kind": "map",
  "boxes": [{ "id": "a", "label": "{{part}}", "note": "{{what it is}}" },
            { "id": "b", "label": "{{part}}" }],
  "links": [{ "from": "a", "to": "b", "label": "{{what flows}}" }] }
```

## Parts
<!-- THE DETAIL OF THE WHAT. One subsection per piece the Model named, in the order a reader needs them — so a
     reader who has read the Model already knows what these headings will be. Each part is explained in full where
     nothing else covers it, and stops where another construct continues: name that construct once and link it.
     A part that grows is not cut; it is a longer part. A part a reader meets on its own, with its own actor, is a
     construct of its own — a judgement about the concept, never a line count. -->
### {{Part — named exactly as the Model named it}}
{{…}}

### {{Part}}
{{…}}

## Boundary
<!-- AFTER the parts: a reader judges an edge only once they have seen the shape. Prose, in plain words — what this
     page does not answer, and where that is answered. This is also where a term another domain owns is linked
     (Q249), so a reader who meets the word here can reach the one construct that declares it. -->
{{This page answers {{the question it answers}}. It does not answer {{the neighbouring question}} — that is [{{construct}}]({{path}}.md), and you read it next when {{the situation}}.}}

## Binds
<!-- ONE TABLE: the rules that hold this construct, each with what it decides and how much it binds. A rule stated
     elsewhere is cited here and never restated. NO REALIZATION TABLE: which package builds this is the capability
     chapter's answer, inside that package, and `04-capabilities/<domain>/<package>/` is the claim a check reads.
     In a repository that realizes a book construct, name the book's path in the Overview as a code span — never a
     link, and never an id, because an id is repo-local. -->
| Rule | What it decides | Weight |
| --- | --- | --- |
| `{{chapter or RD.X.NNN}}` | {{…}} | MUST |

Try it: `{{one command a partner can run}}`
