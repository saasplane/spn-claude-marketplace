# Planning in an APPS · TS node — the layer the `plan` skill loads

**Read this as reference material, not a skill.** The verb is `DEVEX_PLAN`, and it lives once, in
`spn-core`. There is no `APPS_PLAN` — the book's `SPSkillType` is closed and does not carry one
(devex README § Skills and plugins). The `plan` skill resolves the node's world and stack claim
from the nearest `sprepo.json`, then loads this file for the APPS · TS specifics below.

**Source of truth:** the foundation book's docs domain and the apps provider set. Read this card as a digest; the book governs.


Pick the mode from the argument (`design` | `docs` | `decision`); if none was given, infer it from the request and say which you picked.

**Planning is spec-first (foundation decision RD.DEVEX.007): the design is written INTO the owning docs as `🔮 planned` rows — never to a scratch file, never to a `tasks/` tree.** Implementation later flips statuses instead of reconciling documents.

## Mode: design — requirement → 🔮 rows in the owning docs

1. **Restate the requirement** in one paragraph, in the user's own terms.
2. **Classify it**: new capability · additive change to an existing contract · **breaking** change · pure fix. A breaking change (field removed/renamed/retyped, meaning changed, validation tightened) stops here — reroute through the versioning path and record it via `decision` mode. Never let a breaking change ride in as a plan row.
3. **Locate ownership**: which module owns the capability (check the workspace module map, installed `@saasplane/module-server-*` packages, and `.claude/saasplane/rules.md` if present). If no module owns it, this is a `new` scaffold conversation first — and note the configuration-over-customization ladder: use → configure → generalize into platform → build domain-specific; descend only with justification.
4. **Write the design as rows in the owning module's doc seats.** The node grammar is uniform — read `refs/doc-sets.md` in the **spn-core** plugin for the full shape; the seats you write into are:
   - **`docs/02-behaviors/README.md`** (the face) — one `«Persona» can «outcome»` row (product voice — cite dictionary terms) per new ability. The subject is a persona from the node's own vocabulary, never a lens; the row carries id `<MOD>.<CAP>.<NN>`, one-line acceptance, and status `🔮`. Where the face already maps area files, the story goes in the owning `01-<area>.md`.
   - **`docs/03-capabilities/README.md`** (face) + **`docs/03-capabilities/data-model.md`** (terms) — the contract delta as named rows, each marked `🔮`. Those rows are new/changed states and commands, with read levels the entity needs and nothing invented. They also carry enum values and their handling, interactions (queues, cache, audit implications), and authz tiers (`VIEW`/`MANAGE`/`ADMIN` or authenticated).
   - **`docs/01-purpose/README.md`** — only if the module's boundary itself shifts.
   - **`docs/04-guides/README.md`** — only if the design changes how a consumer installs, mounts, or configures the module. An app-owned module has no guides seat; its host app's guide is where that lands.
   - Cross-module needs appear on the *other* module's docs only as contract-level rows (or a request queue for writes) — never as internals.
5. Statuses stay honest: `🔮` rows read as design, and nothing claims to run. Keep the delta small — the rows are the input the `implement` skill reads back.

## Mode: docs — audit and fix a doc set

Audit a package's, an app's, an app-owned module's, or the workspace's docs against the node grammar and fix drift. **The shape is identical at every altitude** (foundation decision RD.DOCS.008) — `refs/doc-sets.md` in the **spn-core** plugin carries it in full; audit against exactly this:

```text
<node>/
├── README.md                  front door (npm page / repo landing) — not the node doc
└── docs/
    ├── README.md              node doc — identity, children map with statuses, doc map
    ├── 01-purpose/README.md   why it exists, boundaries
    ├── 02-behaviors/          README.md (the face — every row) + personas.md (only where
    │                          several personas exist) + numbered area files
    ├── 03-capabilities/       README.md (the face) + data-model.md (bilingual contract
    │                          terms) + one document per published top-level source
    │                          group — contract · app · entry. The set is derived, not
    │                          chosen (RD.DOCS.015); depth is earned by size
    ├── 04-guides/             README.md IS the getting-started; further guides numbered
    │                          (absent on an app-owned module — its host's guide covers it)
    ├── registers/             pocket, governing nodes only — README.md + the node's own
    │                          rules and decision log (decisions.md, conformance.md)
    └── artifacts/             pocket — README.md plus three folders and no fourth:
                               resources/ (schema.sql, the **authoritative data model**,
                               ported verbatim into `src/migrations/`), reports/ and
                               approaches/. No sample or flow document (RD.DOCS.011)
```

- **Every folder carries a `README.md`, pockets included; the seats are folders.** A seat holding only its face is the compact state, not a defect — a missing seat is drift and gets scaffolded with an honest `🚧`. A `purpose.md`, `capabilities.md`, `behaviors.md`, or `guides/getting-started.md` sitting as a file is also drift: fold it into the seat's face.
- **Number what is ordered; never number what is named.** The seats and ordered content inside them take numbers. Never numbered: `README.md`, `data-model.md`, `personas.md`, `schema.sql`, the two pockets, and code mirrors (a folder *or* a document named for the code seat it governs).
- **A seat is absent only when the node cannot answer its question at all** — never because it has little to say. Two nodes qualify. A **generated package** (`CLIENT_API`) carries no `02-behaviors/`, because its proof is the contract tests of the service that generated it. An **app-owned module** carries no `04-guides/`, because it is never adopted on its own and its host's guide covers running it. The node doc must state the absence — a missing seat with no stated reason is a defect.
- **No markdown inside `packages/` or `apps/` outside the front door and the doc set** — extend the seats. No standalone status-tracking `.md`, no `tasks/` trees anywhere. Flag and fold in any stray files.
- **Never hand-write or hand-fix the 📖 strip** — it is derived from the node's doc map and regenerated whenever the file set changes (foundation decision RD.DOCS.007). A generated guides face keeps only what sits inside `<!-- spnutils:keep:begin -->` / `<!-- spnutils:keep:end -->` (RD.DOCS.009); move hand-earned troubleshooting rows inside the block rather than out to a register.
- **Keep status honest — drift runs both ways.** Documents lead code (foundation decision RD.DOCS.013), so a document may exist before the thing it describes — it carries `🔮` and reads as a design note. Fix any status that lets a plan read as fact (✅ implemented = running · 🚧 in progress · 🔮 planned). Where a document and the code disagree, the document is **not** automatically the stale one: work out which is wrong and record it (see `decision` mode). Never silently edit either side to match the other. Present truth, no changelog prose — git history is the history.
- Verify `docs/artifacts/resources/schema.sql` against `src/migrations/` (must agree — the spec is authoritative), `docs/03-capabilities/` against `contract/services/`, and that every `✅` row in `docs/02-behaviors/README.md` has its proof. Verify intent comments exist on `I*Service` methods and exported components (provider chapter 03-code-patterns § Intent comments).
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
