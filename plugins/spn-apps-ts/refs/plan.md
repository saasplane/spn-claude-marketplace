<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/01-foundation/02-docs/README.md", "seen": "b4c00037" },
    { "path": "providers/apps/ts/README.md", "seen": "1b645a3e" },
    { "path": "providers/apps/ts/03-code-patterns.md", "seen": "795882e4" }
  ]
}
-->

# Planning in an APPS · TS node — the layer the `plan` skill loads

**Read this as reference material, not a skill.** The verb is `DEVEX_PLAN`, and it lives once, in
`spn-core`. There is no `APPS_PLAN` — the book's `SPSkillType` is closed and does not carry one
(devex README § Skills and plugins). The `plan` skill resolves the node's world and stack claim
from the nearest `sprepo.json`, then loads this file for the APPS · TS specifics below.

**Source of truth:** the foundation book's docs domain and the apps provider set. Read this card as a restatement; the book governs.


Pick the mode from the argument (`design` | `docs` | `decision`); if none was given, infer it from the request and say which you picked.

**Planning is spec-first (foundation decision RD.DEVEX.007): the design is written INTO the owning docs as `🔮 planned` rows — never to a scratch file, never to a `tasks/` tree.** Implementation later flips statuses instead of reconciling documents.

## Mode: design — requirement → 🔮 rows in the owning docs

1. **Restate the requirement** in one paragraph, in the user's own terms.
2. **Classify it**: new capability · additive change to an existing contract · **breaking** change · pure fix. A breaking change (field removed/renamed/retyped, meaning changed, validation tightened) stops here — reroute through the versioning path and record it via `decision` mode. Never let a breaking change ride in as a plan row.
3. **Locate ownership**: which module owns the capability (check the workspace module map, installed `@saasplane/module-server-*` packages, and `.claude/saasplane/rules.md` if present). If no module owns it, this is a `new` scaffold conversation first — and note the configuration-over-customization ladder: use → configure → generalize into platform → build domain-specific; descend only with justification.
4. **Write the design as rows in the repository's own docs tree, under the domain the module belongs to.** There is one docs tree per repository, at the repository root — never one per node — and its seats divide by the domains the repository's own concept names, never by the packages it ships (foundation decision RD.DOCS.001). Read `refs/doc-sets.md` in the **spn-core** plugin for the full shape; the rows land here:
   - **`docs/03-behaviors/<domain>/README.md`** (the face) — one `«Persona» can «outcome»` row (product voice — cite dictionary terms) per new ability. The subject is a persona from the domain's own vocabulary, never a lens; the row carries id `<MOD>.<CAP>.<NN>`, one-line acceptance, and status `🔮`. Where the face already maps area files, the story goes in the owning area file.
   - **`docs/04-capabilities/<domain>/<layer>/README.md`** (face) + that mirror's `data-model.md` (terms) — the contract delta as named rows, each marked `🔮`, against the mirror for the source folder the module changes. Those rows are new/changed states and commands, with read levels the entity needs and nothing invented. They also carry enum values and their handling, interactions (queues, cache, audit implications), and authz tiers (`VIEW`/`MANAGE`/`ADMIN` or authenticated).
   - **`docs/01-purpose/README.md`** — only if the repository's reason to exist shifts, which a module change almost never does.
   - **`docs/05-guides/README.md`** — only if the design changes how a consumer installs, mounts, or configures the module. An app-owned module contributes no guide of its own; its host app's guide is where that lands.
   - Cross-module needs land under the *other* module's own domain, as contract-level rows (or a request queue for writes) — never as internals.
5. Statuses stay honest: `🔮` rows read as design, and nothing claims to run. Keep the delta small — the rows are the input the `implement` skill reads back.

## Mode: docs — audit and fix the repository's docs tree

Audit the repository's **one** docs tree — the tree every package, app, app-owned module and the
workspace root itself write into — against the tree grammar and fix drift. **A repository has ONE
docs tree, at the repository root, and its seats divide by the domains the repository's own
concept names, never by the packages it ships** (foundation decision RD.DOCS.001). `refs/doc-sets.md`
in the **spn-core** plugin carries the shape in full; audit against exactly this:

```text
<repository>/docs/
├── README.md              the tree's face — the seats, and the map
├── 01-purpose/            WHY — why this repository exists
├── 02-constructs/         WHAT, the model — one file per construct, under a folder per domain;
│                          the face is the generated dictionary
├── 03-behaviors/          WHAT, as product — rows under a folder per domain, in the consumer's
│                          own words, each carrying an id and a status
├── 04-capabilities/       WHAT, as engineering — one **mirror** per source folder that earns
│                          one, hung by domain then by layer then by the source folder;
│                          `data-model.md` and `schema.sql` sit beside the layer that owns
│                          storage. The set is derived, not chosen (RD.DOCS.015); depth is
│                          earned by size
├── 05-guides/             HOW — README.md IS the getting-started; further guides numbered
│                          (a guide an app-owned module would need lives on its host instead)
├── registers/             pocket — the repository's own rules and decision log
└── artifacts/             pocket — the overview and construct pages, and deliberate reports
```

- **A node carries `README.md` and no seats of its own** (decisions RD.DOCS.001 · RD.DOCS.021) — a
  package, an app, or an app-owned module states what it is and links into the seats it realizes,
  and never carries a `docs/` tree beside it. A node with one is drift: fold its content into the
  repository's tree, under the domain it belongs to, and leave the node a plain `README.md`.
- **Every seat folder carries a `README.md`, pockets included.** A seat holding only its face is the
  compact state, not a defect — a missing seat is drift and gets scaffolded with an honest `🚧`,
  citing the repository that owns the answer where this repository has nothing of its own to say
  (RD.DOCS.017). A `purpose.md`, `capabilities.md`, `behaviors.md`, or `guides/getting-started.md`
  sitting as a file is also drift: fold it into the seat's face.
- **Number what is ordered; never number what is named.** The seats and ordered content inside them
  take numbers. Never numbered: `README.md`, `data-model.md`, `schema.sql`, the two pockets, and
  mirrors (named for the source folder they govern, never for a feature).
- **A capability mirror or a guide is absent only where the source folder truly cannot answer that
  question** — never because there is little to say. A `CLIENT_API`'s generated surface carries no
  mirror, because it is proven by the contract tests of the service that generated it. An
  app-owned module contributes no guide of its own — its host's guide covers running it. The
  owning face must state the absence — a missing mirror or guide entry with no stated reason is a
  defect.
- **No markdown inside `packages/` or `apps/` outside the front door and the repository's own
  tree** — extend the seats there instead. No standalone status-tracking `.md`, no `tasks/` trees
  anywhere. Flag and fold in any stray files.
- **Never hand-write or hand-fix the 📖 strip** — it is derived from the tree's doc map and
  regenerated whenever the file set changes (foundation decision RD.DOCS.007). A generated guides
  face keeps only what sits inside `<!-- spnutils:keep:begin -->` / `<!-- spnutils:keep:end -->`
  (RD.DOCS.009); move hand-earned troubleshooting rows inside the block rather than out to a
  register.
- **Keep status honest — drift runs both ways.** Documents lead code (foundation decision
  RD.DOCS.013), so a document may exist before the thing it describes — it carries `🔮` and reads as
  a design note. Fix any status that lets a plan read as fact (✅ implemented = running · 🚧 in
  progress · 🔮 planned). Where a document and the code disagree, the document is **not**
  automatically the stale one: work out which is wrong and record it (see `decision` mode). Never
  silently edit either side to match the other. Present truth, no changelog prose — git history is
  the history.
- Verify each `data-model.md`/`schema.sql` pair under `04-capabilities/<domain>/<layer>/` against
  `src/migrations/` for the module it mirrors (must agree — `schema.sql` is the authoritative
  form), that module's mirrors there against its `contract/services/`, and that every `✅` row in
  `03-behaviors/<domain>/README.md` has its proof. Verify intent comments exist on `I*Service`
  methods and exported components (provider chapter 03-code-patterns § Intent comments).
- Report what was fixed and what needs a human call.

## Mode: decision — draft a decision-register entry

For a deviation from a golden path, a breaking change, or a doc-vs-code conflict. An undocumented deviation is treated as a defect — this entry is what makes it governed. Draft in chat (do not commit unasked):

A row is `| id | ruling | why | date |`, and the id is `RD.<AREA>.<NNN>` over the closed area set
`GOV · SAAS · APPS · INFRA · DEVEX · DOCS`, numbered per area. Ids are never reused or renumbered.

```
| RD.<AREA>.<NNN> | **<the ruling, bolded, in one quotable sentence>** <what it changes
                    concretely> | <why — what the alternative costs, in specifics, never
                    "for consistency"> | <YYYY-MM> |
```

The `why` column is the load-bearing one: a row without it is a rule nobody can re-derive, and
the next person to hit the same problem re-argues it from scratch.

Name the register it belongs in: the workspace's own `docs/registers/decisions.md`, or — for foundation-level rules — the foundation book's `docs/registers/decisions.md` (cross-repo pointer). Once accepted, the row goes into that register directly.

## Hand-off

End every mode by naming the next verb. `design` → the `new` skill (if scaffolding is needed) or the `implement` skill. `docs`/`decision` → done, or the `review` skill if code changed alongside.
