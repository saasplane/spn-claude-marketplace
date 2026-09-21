<!-- spn:doc
{"id": "spn-infra-capabilities-estate-refs", "variant": "capability", "title": "Estate Refs in spn-infra", "lenses": ["INFRA", "ARCHITECT"], "status": "DONE", "realizes": ["estate-refs"], "summary": "Four cards restating the estate's own vocabulary — which file declares what, which layer owns which act, how a name is composed from coordinates, and the laws a declaration must hold to.", "keywords": ["ref", "manifest", "layer", "naming", "laws", "coordinates"]}
-->

# Estate Refs in spn-infra

`For: DevOps / SRE · Architect` · `Status: ✅ DONE` · `Realizes: Estate Refs`

Four markdown files sit under `plugins/spn-infra/refs/`: `manifests`, `layers-doors`, `naming` and `laws`. Each restates part of the foundation's estate model for a reader who may never open the book, and each says so in its own opening line. The one thing that runs through all four is what they do not hold. **Every value in these files is grammar, never a real one.** No environment, region or account of any organization appears here; the sample platform used in the examples exists to show the shape.

## Where

| Part of the construct | Lives in | What it is |
| --- | --- | --- |
| Which file declares what | `plugins/spn-infra/refs/manifests.md` | the two files per node, and how a node is found from where you stand |
| Which layer owns which act | `plugins/spn-infra/refs/layers-doors.md` | the layer nouns, their four verbs, and the order they start in |
| How a name is composed | `plugins/spn-infra/refs/naming.md` | the resource name grammar and the published vocabulary |
| What must never happen | `plugins/spn-infra/refs/laws.md` | the estate laws, written as a refusal card |

## Follows the pattern

- The `spn:restates` block, the stamp and what drift means — [The Ref](../../../02-constructs/04-refs/ref-set.md)
- How a ref is stamped, parsed and compared — [Ref in spn-core](../../01-spn-core/spn-core/08-ref-set.md)

## Special handling

### The laws card is written to be read before anything else

**Why** — *a law is only useful at the moment somebody is about to break it*. A list of principles read afterwards explains a mistake rather than preventing one.
**What** — the laws card asks the reader to look for the checkable defect each law names and to raise it before doing anything else. Each law is numbered and states its own defect.
**How** — the guard script's refusal messages point back at this card, so a denial and its reasoning are one hop apart. `plugins/spn-infra/refs/laws.md`.

### A node is found by its manifest, never by its folder name

**Why** — *the family-first folder name is checked against the manifest, not trusted as one*. Inferring a node's type from where it sits is how a package comes to be treated as something it is not.
**What** — the card states the two files every estate node carries and which of the two answers which question: one marks the root, the other names the type.
**How** — the path locator in the same card is what resolves a node from the current directory. `plugins/spn-infra/refs/manifests.md`.

### A name that cannot be composed from coordinates is a defect

**Why** — *a name derived from a label carries a meaning nobody can read back*. The posture of an environment comes from its workload value alone, and never from the word in its setup name.
**What** — the naming card gives the grammar and the closed vocabulary each part is drawn from, and states plainly that the provider's own region is a mapping on a cloud entry rather than a coordinate.
**How** — the examples all use one sample platform, so no real coordinate appears. `plugins/spn-infra/refs/naming.md`.

### The layers are read in order, and the order explains most failures

**Why** — *a lower layer that is missing is the usual reason a higher one will not start*, and that is a diagnosis rather than a rule.
**What** — the card lists the layer nouns, gives each the same four verbs, and states the order they come up in.
**How** — it names the tool verb that realizes each act, so the card can be read beside a command that is already running. `plugins/spn-infra/refs/layers-doors.md`.

## Between modules

| Direction | With | What | Why |
| --- | --- | --- | --- |
| takes | spn-foundation | the estate sections of the concept each card restates, stamped per file | the book governs and the card is the copy |
| publishes | spn-infra's skills | the manifest, layer, naming and law vocabulary each verb uses | a skill sequences the work and the card holds the words |
| publishes | spn-infra's guard | the laws its five refusals cite by name | the script catches the part a script can catch |
| publishes | a partner | four cards readable with no book checkout | the book is cited by name and never required |
