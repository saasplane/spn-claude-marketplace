<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/README.md", "seen": "13d462c3" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md", "seen": "db625a2f" },
    { "path": "spn-foundation/providers/apps/ts/README.md", "seen": "0da8309f" },
    { "path": "spn-foundation/providers/apps/ts/03-code-patterns.md", "seen": "56ef9a7f" }
  ]
}
-->

# Planning in an APPS · TS node — the layer the `plan` skill loads

**Read this as reference material, not a skill.** The skill is `DEVEX_IDEATE`, and it lives once, in
`spn-devex`. There is no `APPS_PLAN` — the book's `SPDevExAgentSkillType` is closed and does not carry one
(devex README § Skills and plugins). The `plan` skill resolves the node's world and stack claim
from the nearest `sprepo.json`, then loads this file for the APPS · TS specifics below.

**Source of truth:** the foundation book's docs domain — its face and the tree grammar in `docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md` — and the apps provider set. Read this card as a restatement; the book governs.


Pick the mode from the argument (`design` | `docs` | `decision`); if none was given, infer it from the request and say which you picked.

**Planning is spec-first (foundation decision RD.DEVEX.007): the design is written INTO the owning docs as `🔮 planned` rows — never to a scratch file, never to a `tasks/` tree.** Implementation later flips statuses instead of reconciling documents.

## Mode: design — requirement → 🔮 rows in the owning docs

1. **Restate the requirement** in one paragraph, in the user's own terms.
2. **Classify it**: new capability · additive change to an existing contract · **breaking** change · pure fix. A breaking change (field removed/renamed/retyped, meaning changed, validation tightened) stops here — reroute through the versioning path and record it via `decision` mode. Never let a breaking change ride in as a plan row.
3. **Locate ownership**: which module owns the capability (check the workspace module map, installed `@saasplane/module-server-*` packages, and `.claude/saasplane/rules.md` if present). If no module owns it, this is a `new` scaffold conversation first — and note the configuration-over-customization ladder: use → configure → generalize into platform → build domain-specific; descend only with justification.
4. **Write the design as rows in the repository's own docs tree, under the domain the module belongs to.** There is one docs tree per repository, at the repository root — never one per node — and its seats divide by the domains the repository's own concept names, never by the packages it ships (foundation decision RD.DOCS.001). Read `refs/doc-sets.md` in the **spn-devex** plugin for the full shape; the rows land here:
   - **`docs/02-constructs/<domain>/<NN>-<construct>.md`** — where the ability needs a word the model does not carry yet. A topic a construct does not name may not appear in the other two seats, so the construct is written first, and its `Terms` table carries the consumer's word beside the contract term.
   - **`docs/03-behaviors/<domain>/<NN>-<construct>.md`** — one file of rows per topic, carrying the same number as the construct it belongs to. A row is a record of cells, not a sentence: `Id · Who · Does · Sees · Where · Type · Tier · Status · Updated at · Names`. `Who` is a persona from the repository's own personas table, never a lens; `Does` is the arrangement and the action; `Sees` is what is true when it works and is never empty; `Where` names the app or package that realizes it; `Type` is `POSITIVE` or `NEGATIVE`; `Tier` is declared before any case exists; `Status` is `PLANNED` at birth and the agent writes it afterwards; `Names` holds the foundation promise this row fulfils. The id is `<DOMAIN>.<AREA>.<NN>`, and the domain is the one that would have to change if the behaviour changed.
   - **`docs/04-capabilities/<domain>/<package>/<NN>-<construct>.md`** — one chapter per construct per package that realizes it, numbered as the construct is. A chapter has four sections — **Where** (each part of the construct and the place it lives in this package), **Follows the pattern** (one line per pattern that applies unchanged, linking the stack's standard), **Special handling** (the methods, flows and rules the construct forces off the pattern — why, then what, then how, with one place in the code), and **Between modules** (what this package takes from other modules and what it publishes to them). It stays under 800 words, names no test and claims no status.
   - **`docs/04-capabilities/<domain>/<server package>/data-model.md`** beside its `schema.sql` — in the package that owns `src/migrations`, never at the domain root and never in a half that stores nothing (foundation decision RD.DOCS.074). Still one per domain, because a domain has one migrations folder. It carries which contract term is stored in which table and column, and defines no term: the words are the constructs' `Terms` tables. **A domain that stores nothing writes none.** The contract delta — new and changed states and commands, the read levels the entity needs, enum values and their handling, the queue, cache and audit interactions, and authz tiers (`VIEW`/`MANAGE`/`ADMIN` or authenticated) — belongs in the capability chapter for the construct it changes.
   - **`docs/01-purpose/README.md`** — only if the repository's reason to exist shifts, which a module change almost never does.
   - **`docs/05-guides/README.md`** — only if the design changes how a consumer installs, mounts, or configures the module. An app-owned module contributes no guide of its own; its host app's guide is where that lands.
   - Cross-module needs land under the *other* module's own domain, as contract-level rows (or a request queue for writes) — never as internals.
5. Statuses stay honest: `🔮` rows read as design, and nothing claims to run. Keep the delta small — the rows are the input the `implement` skill reads back.

## Mode: docs — audit and fix the repository's docs tree

Audit the repository's **one** docs tree — the tree every package, app, app-owned module and the
workspace root itself write into — against the tree grammar and fix drift. **A repository has ONE
docs tree, at the repository root, and its seats divide by the domains the repository's own
concept names, never by the packages it ships** (foundation decision RD.DOCS.001). `refs/doc-sets.md`
in the **spn-devex** plugin carries the shape in full; audit against exactly this:

```text
<repository>/docs/
├── README.md              the tree's face — the seats, and the map
├── 01-purpose/            WHY — why this repository exists
├── 02-constructs/         WHAT, the model — one file per topic, under a folder per domain,
│                          numbered in reading order; each domain's face carries its dictionary
├── 03-behaviors/          WHAT, as product — one file of rows per topic, under the same
│                          folders and carrying the same numbers as the constructs, plus
│                          `personas.md` beside them
├── 04-capabilities/       WHAT, as engineering — one chapter per construct per package that
│                          realizes it, hung by domain then by package then by the construct,
│                          each chapter numbered as its construct is; `data-model.md` and
│                          `schema.sql` sit in the package owning src/migrations (RD.DOCS.074)
├── 05-guides/             HOW — README.md IS the getting-started; further guides numbered
│                          (a guide an app-owned module would need lives on its host instead)
├── registers/             pocket — the repository's own rules and decision log
└── artifacts/             pocket — the overview and construct pages, and deliberate reports
```

- **A node carries `README.md` and no seats of its own** (decisions RD.DOCS.001 · RD.DOCS.021) — a
  package, an app, or an app-owned module states what it is and links into the seats it realizes,
  and never carries a `docs/` tree beside it. A node with one is drift: fold its content into the
  repository's tree, under the domain it belongs to, and leave the node a plain `README.md`. **The
  code mirror lives on that README**: a generated index of the node's own source folders, one line
  each, naming the chapter that covers it — so *is this folder documented* is answered where a
  developer is standing when they ask it.
- **Every seat folder carries a `README.md`, pockets included.** A seat holding only its face is the
  compact state, not a defect — a missing seat is drift and gets scaffolded with an honest `🚧`,
  citing the repository that owns the answer where this repository has nothing of its own to say
  (RD.DOCS.017). A `purpose.md`, `capabilities.md`, `behaviors.md`, or `guides/getting-started.md`
  sitting as a file is also drift: fold it into the seat's face.
- **Number what is ordered; never number what is named.** The seats, the domain levels, and every
  construct file with the behaviour and capability files carrying its number take numbers. Never
  numbered: `README.md`, `data-model.md`, `surface-map.md`, `schema.sql`, `personas.md`, the two pockets, and a
  package folder in the capabilities seat — that folder is named for the package it mirrors, and
  the name must stay identical to it.
- **A capability chapter or a guide is absent only where the package truly realizes nothing of that
  construct** — never because there is little to say. A `CLIENT_API`'s generated surface carries no
  chapter, because it is proven by the contract tests of the service that generated it. An
  app-owned module contributes no guide of its own — its host's guide covers running it. The
  owning face must state the absence — a missing chapter or guide entry with no stated reason is a
  defect.
- **Every construct has a chapter in every package that realizes it, every chapter names a
  construct that exists, and every package holding code realizes at least one construct.** All
  three directions are checked, so code nobody wrote a topic for and a topic nothing builds are
  both findings rather than missing files.
- **No markdown inside `packages/` or `apps/` outside the front door and the repository's own
  tree** — extend the seats there instead. No standalone status-tracking `.md`, no `tasks/` trees
  anywhere. Flag and fold in any stray files.
- **Never hand-write or hand-fix the 📖 strip** — it is derived from the tree's doc map and
  regenerated whenever the file set changes (foundation decision RD.DOCS.007). A generated guides
  face keeps only what sits inside `<!-- spnutils:keep:begin -->` / `<!-- spnutils:keep:end -->`
  (RD.DOCS.009); move hand-earned troubleshooting rows inside the block rather than out to a
  register.
- **Keep status honest — drift runs both ways.** Documents lead code (foundation decision
  RD.DOCS.013), so a document may exist before the thing it describes. **The icon is the rendering
  and the word is the value.** A document's own status is `SPDocStatusType` — `DONE` ·
  `IMPLEMENTING` · `PLANNING` — in its `spn:doc` block. A behaviour row's status is
  `SPDocBehaviourStatusType` — `PLANNED` 🔮 · `PENDING` ⏳ · `SUCCESS` ✅ · `FAILED` ❌ · `MANUAL` 👤 —
  written `PLANNED` by hand at birth and by the agent from a run thereafter. Fix any status that
  lets a plan read as fact, and never hand-write a `SUCCESS`. Where a document and the code
  disagree, the document is **not** automatically the stale one: work out which is wrong and record
  it (see `decision` mode). Never silently edit either side to match the other. Present truth, no
  changelog prose — git history is the history.
- Verify each `data-model.md`/`schema.sql` pair at `04-capabilities/<domain>/<server package>/`
  against that package's own `src/migrations/` (must agree — `schema.sql` is the authoritative
  form), each package's capability chapters there against its `contract/services/`, and that every
  `SUCCESS` row in `03-behaviors/<domain>/` resolves to a case that ran. Verify intent comments
  exist on `I*Service` methods and exported components (provider chapter 03-code-patterns §
  Intent comments).
- Report what was fixed and what needs a human call.

## Mode: decision — draft a decision-register entry

For a deviation from a golden path, a breaking change, or a doc-vs-code conflict. An undocumented deviation is treated as a defect — this entry is what makes it governed. Draft in chat (do not commit unasked):

A row is `| id | ruling | why | date |`, and the id is `RD.<AREA>.<NNN>` over the closed area set
`GOV · PLATFORM · APPS · INFRA · DEVEX · DOCS`, numbered per area. Ids are never reused or renumbered.

```
| RD.<AREA>.<NNN> | **<the ruling, bolded, in one quotable sentence>** <what it changes
                    concretely> | <why — what the alternative costs, in specifics, never
                    "for consistency"> | <YYYY-MM> |
```

The `why` column is the load-bearing one: a row without it is a rule nobody can re-derive, and
the next person to hit the same problem re-argues it from scratch.

Name the register it belongs in: the workspace's own `docs/registers/decisions.md`, or — for foundation-level rules — the foundation book's `docs/registers/decisions.md` (cross-repo pointer). Once accepted, the row goes into that register directly.

## Hand-off

End every mode by naming the next skill. `design` → the `new` skill (if scaffolding is needed) or the `implement` skill. `docs`/`decision` → done, or the `review` skill if code changed alongside.
