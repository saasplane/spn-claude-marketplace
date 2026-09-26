<!-- spn:doc
{"id": "spn-infra-capabilities-estate-refs", "variant": "capability", "title": "Refs in spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "realizes": ["estate-refs"], "summary": "The cards restating the estate's own vocabulary — which file declares what, which layer owns which act, how a name is composed from coordinates, the laws a declaration must hold to, and what each cloud calls the things the model names.", "keywords": ["ref", "manifest", "layer", "naming", "laws", "coordinates"]}
-->

# Refs in spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE` · `Realizes: Refs`

The cards sit under `plugins/spn-infra/src/refs/support/infra/`. Each restates part of the foundation's estate model for a reader who may never open the book, and each says so in its own opening line. The one thing that runs through all of them is what they do not hold. **Every value in these files is grammar, never a real one.** No environment, region or account of any organization appears here; the sample platform used in the examples exists to show the shape.

**The folder mirrors the constructs and holds nothing else.** A procedure belongs to a skill and a parse belongs to a provider, so neither is here: a card states what is true, and something else executes it.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| What must never happen | `plugins/spn-infra/src/refs/support/infra/README.md` | the estate laws, written as a refusal card and cited by every denial |
| Which file declares what | `plugins/spn-infra/src/refs/support/infra/packages.md` | the files per node, and how a node is found from where you stand |
| Which layer owns which act | `plugins/spn-infra/src/refs/support/infra/shape/README.md` | the layer nouns, their commands, and the order they start in |
| How a name is composed | `plugins/spn-infra/src/refs/support/infra/shape/naming.md` | the resource name grammar and the published vocabulary |
| What the estate is made of | `plugins/spn-infra/src/refs/support/infra/blueprints.md` · `resources.md` · `modules.md` · `apps.md` · `ships.md` | the model's own nouns, one card per subject |
| How it is watched and trusted | `plugins/spn-infra/src/refs/support/infra/operate.md` · `trust.md` | what a running estate owes back, and what may never be done to one by hand |
| What each cloud calls things | `plugins/spn-infra/src/refs/support/infra/providers/` | one card per cloud, numbered subject by subject under its own README |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [Refs](../../../02-constructs/01-devex/06-refs.md)
- How a ref is stamped, parsed and compared — [Refs in spn-devex](../../01-devex/spn-devex/06-refs.md)

## Special handling

### The laws card is written to be read before anything else

**Why** — *a law is only useful at the moment somebody is about to break it*. A list of principles read afterwards explains a mistake rather than preventing one.
**What** — the laws card asks the reader to look for the checkable defect each law names and to raise it before doing anything else. Each law is numbered and states its own defect.
**How** — every refusal message quotes one sentence pointing back at this card, so a denial and its reasoning are one hop apart. `plugins/spn-infra/src/refs/support/infra/README.md`.

### A node is found by its manifest, never by its folder name

**Why** — *the family-first folder name is checked against the manifest, not trusted as one*. Inferring a node's type from where it sits is how a package comes to be treated as something it is not.
**What** — the card states the files every estate node carries and which of them answers which question: one marks the root, the other names the type.
**How** — the path locator in the same card is what resolves a node from the current directory. `plugins/spn-infra/src/refs/support/infra/packages.md`.

### A name that cannot be composed from coordinates is a defect

**Why** — *a name derived from a label carries a meaning nobody can read back*. The posture of an environment comes from its workload value alone, and never from the word in its setup name.
**What** — the naming card gives the grammar and the closed vocabulary each part is drawn from, and states plainly that the provider's own region is a mapping on a cloud entry rather than a coordinate.
**How** — the examples all use one sample platform, so no real coordinate appears. `plugins/spn-infra/src/refs/support/infra/shape/naming.md`.

### The layers are read in order, and the order explains most failures

**Why** — *a lower layer that is missing is the usual reason a higher one will not start*, and that is a diagnosis rather than a rule.
**What** — the card lists the layer nouns, gives each the same commands, and states the order they come up in.
**How** — it names the tool's command that realizes each act, so the card can be read beside a command that is already running. `plugins/spn-infra/src/refs/support/infra/shape/README.md`.

### A cloud's vocabulary is a fact, so it is restated rather than run

**Why** — *what differs between clouds is what they call things*, and a name is a fact about a cloud rather than a procedure. A reader looking one up and a skill citing it should find the same file.
**What** — each cloud has a card of its own, numbered subject by subject — realization, ground, session, addressing, tagging, organization, platform, environment, deployments, library, conformance.
**How** — a cloud the plugin ships no validator for still has its entries here, because the words are true whether or not code reads them. `plugins/spn-infra/src/refs/support/infra/providers/local/`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the estate sections of the concept each card restates, stamped per file | the book governs and the card is the copy |
| publishes | spn-infra's skills | the manifest, layer, naming and law vocabulary each skill uses | a skill sequences the work and the card holds the words |
| publishes | spn-infra's scripts | the laws every refusal cites by name | the script catches the part a script can catch |
| publishes | spn-infra's providers | each cloud's own words, beside the parse that reads that cloud's text | the fact is stated in one place and executed in another |
| publishes | a partner | the estate's whole vocabulary, readable with no book checkout | the book is cited by name and never required |
