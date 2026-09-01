# Step: docs — the doc set closes the change

Docs are the contract; code is the implementation; tests are the proof. The change is not done until the owning module's doc set reflects it — and most of that happens **during** the earlier steps, not here. This step is the closing sweep: flip statuses, verify nothing was skipped.

**Before writing behavior rows or dictionary terms**, apply the **spn-core** plugin's `refs/doc-sets.md`. It carries the node grammar in full, and the node's declared kind fixes its consumer. That consumer in turn fixes the actor voice, how areas group, and which test tier proves a row. For a `MODULE_SERVER` the consumer is the composing app. Rows read *"a composing app can…"*, areas are named for capability, and proof is contract-tier with the id in the test title.

**The seats are folders, numbered, at every altitude** (foundation decision RD.DOCS.008): `docs/01-purpose/` · `docs/02-behaviors/` · `docs/03-capabilities/` · `docs/04-guides/`. Each opens with the `README.md` that is its face, and the unnumbered pockets are `docs/registers/` and `docs/artifacts/`. A seat is absent only where the node cannot answer its question at all — a generated API client has no `02-behaviors/`, an app-owned module has no `04-guides/`. Never write into a `docs/capabilities.md` or a `docs/guides/getting-started.md` — if you find one, it is drift; hand it to the `plan` skill in its `docs` mode.

## Writing a seat from scratch

Use the tables below to close a *change*. Writing a seat that does not exist yet is a different job, and it is where doc sets go wrong — the shape gets copied and the substance does not.

**Copy a worked node rather than re-deriving.** Open one whose seats are complete and follow it exactly: the metadata block, the face's shape, the depth of an area file. Re-deriving the format from the standard produces something that passes a reading and fails a diff.

### The two voices, and the line between them

| | `02-behaviors/` | `03-capabilities/` |
| --- | --- | --- |
| Is | a **story** — an actor reaching an outcome | a **flow** — the sequence, the guard, the reason a rule exists |
| Shape | `Title · Goal · Description · Acceptance`, and MAY carry `Attachments` | a seam entry per published thing |
| May name | contract states, enums, permission codes, error codes, the service methods a consumer calls | anything in the code |
| **Never** names | a table, a column, SQL, an error helper, an internal method, any realization | — |

A realization detail in a behaviors area file is a **defect**, not a stylistic slip: the flow it belongs to is a capabilities area file. The dictionary (`data-model.md`) is what binds the two — one table, `Consumer` · `Capability` · `Description`, one line per term, bilingual where consumer-facing. A blank `Capability` is a defect, because a product word with nothing behind it is a promise nothing keeps.

### A capabilities mirror is named for the folder it governs

Its path joined by `-`, flat inside the seat, **never numbered**: `contract/` → `contract.md`, `ui/pages/` → `ui-pages.md`, `ui/components/auth/` → `ui-components-auth.md`. Underscore-prefixed folders (`_shadcn`, `_internal`) are private and earn no mirror. Which folders are mirrored is decided by the node's **kind**, not by preference.

Each mirror explains its symbols **by role**. Explain a service method as pseudologic — the guard, the order, what it refuses. Explain a contract state by its boundary and relations, **never its attribute list**. Explain a component by its capability, primary props and pseudo-logic; a hook by the seam it owns; a route by what it exposes and returns. Pseudologic borrows the vocabulary of what the node depends on, so the chain reads foundation standard → support capability → module capability.

### The seam entry — six parts, the last two load-bearing

`Guarantee` · `Placement` · `From context` · `Does not do` · **`The phrase`** · **`Proven by`**

- **A refusal is a form.** Where a node departs from a seam's published phrase, name the phrase it is **not** using and why. These are often the most useful entries in a mirror.
- **`Proven by` names a real test path you have opened, or says plainly that none exists.** Never a plausible-looking one. Write partial proof as partial — *what* runs and *what* does not. This single rule is what earns the format; without it the other five are decoration.

## Re-auditing a seat you did not write

**A `✅` is a claim about a test, and it decays silently.** The flip rule below fires on a change; nothing re-examines a row that was *born* `✅` when its seat was scaffolded. So a seat can carry a wall of `✅` and prove none of it, and no later sweep will notice.

When you touch a node's docs at all, re-derive its statuses rather than trusting them:

1. For each `✅` row, find the test whose **title** carries its id (`<MOD>.<CAP>.<NN>`). Foundation decision RD.DEVEX.008: every `✅` behavior cites at least one test.
2. No such test → the row is `🚧`. Demote it, and say in the face's proof paragraph what is unproven and why.
3. Name what the passing rows are proven **against**, where that is narrower than the row reads — a stubbed decorator, a single actor, an assertion that cannot distinguish two outcomes.

A demotion is not a regression; it is the register becoming true. A seat whose statuses have never been re-derived is the normal case, not the exception.

## Never write a tally

Foundation decision RD.GOV.009: a document states a **status**, never a count. Not *nine of twenty-one seats*, not *twelve services*, not *three rows remain*. Counts are stale the moment they are written and they read as measurement while measuring nothing. Where a count is genuinely the point, it is a dated snapshot of a problem, never a running total.

## Update as you go (what each step already did)

| During step | The doc move |
| --- | --- |
| contract | New/changed states, commands, enums land in `docs/03-capabilities/` — face rows in `README.md`, terms in `data-model.md` (bilingual) (flip the plan's `🔮` to `🚧`); every `I*Service` method gets its one-line **intent comment** as it is written |
| service | Interactions rows in `docs/03-capabilities/` (cache, queue, audit implications); permission rows if the authz surface grew |
| entry | Nothing extra — routes are generated surface (OpenAPI), never hand-documented |
| ui | Component intent comments; the UI package's behaviors cite the domain ids they realize |
| test | Behavior rows gain their proof; contract-tier test titles embed the behavior id (`<MOD>.<CAP>.<NN>`) |

## The closing sweep (this step)

| Seat or pocket | Close it by |
| --- | --- |
| `docs/02-behaviors/README.md` | Flip implemented rows `🔮/🚧 → ✅` in the face — only where the proof test exists; a row with no test stays 🚧. Where the face maps area files, the story in `01-<area>.md` moves with it |
| `docs/03-capabilities/` | Face + `data-model.md` terms current with the code, **and the code mirror for every `src/` seat the node's kind mirrors** — `contract.md` · `app.md` · `entry.md` for a `MODULE_SERVER`, the `ui` seat expanded for a `MODULE_WEB`. A seat that gained or lost a folder gains or loses its mirror in the same change |
| `docs/04-guides/README.md` | Only if install, mount, or configuration changed — this face **is** the getting-started, and it is written for a reader with no checkout of this repo. If it is generated, edit only inside `<!-- spnutils:keep:begin -->` / `<!-- spnutils:keep:end -->` (foundation decision RD.DOCS.009) |
| `docs/01-purpose/README.md` | Only if the module's boundary itself shifted |
| `docs/artifacts/resources/schema.sql` | Any entity/column/index change landed here **first** (or simultaneously), ported **verbatim** into `src/migrations/` — spec and migrations must never disagree |
| `docs/README.md` | The node doc — only if the doc map or the node's identity changed |
| `README.md` (package root) | The npm front door, not the node doc and not a mirror — only if identity, install, or key exports changed |
| App-owned modules | The same seats **minus `04-guides/`**, inside `src/modules/<mod>/docs/` (UI under its `ui/` code seat) — the module is never adopted on its own, so wiring, composition, and running it all land in the **host app's** `docs/04-guides/`, which you update when the registration entry or what it commits the host to changed |
| Workspace `docs/` | `03-capabilities/` for structure changes; `02-behaviors/` for new workspace-level abilities; `registers/conformance.md` when a requirement's status moves — same PR |

Rules:

- **Do not add other markdown files inside `packages/` or `apps/`** — extend the seats. No per-module summaries, no standalone status-tracking `.md`, no `tasks/` trees anywhere.
- **Never hand-edit the 📖 strip** at the foot of a seat document — it is derived from the node's doc map and regenerated whenever the node's file set changes (foundation decision RD.DOCS.007). Adding or removing a file is what makes every strip in that node stale, not just the new one's.
- **Never invent entities or columns in prose** — align with `docs/artifacts/resources/schema.sql` or update it first.
- **Written fresh** — docs state present truth; no changelog prose, no "previously"; git history is the history.
- **Regenerate, don't restate**: `spnutils apps gen-symbols -p <pkg>` refreshes the machine twin (`spn-symbols.json`); the doc seats are the human twin. Intent lives in the code and is harvested — never typed twice (foundation decision RD.APPS.006).

## Env documentation

A new module env variable (`{CODE}_{MOD}_*`) is documented where it lives: the module's `docs/03-capabilities/data-model.md` env terms (depth in `docs/04-guides/README.md`). It is also documented in the app's `envs/local.env`, under the module's banner comment. Committed env files carry **no secret values** — secrets appear empty with a required-in-shell annotation. Keep the env file's header key list in sync with what migrations actually read.

## Status honesty

Anything the docs claim must match what runs: ✅ implemented = running reality, 🚧 in progress = being built, 🔮 planned = design only. Never let this change's plan wording survive as fact wording after the code lands — and never upgrade a status the code doesn't back.

## Contract-visible changes

If the public contract surface changed, the generated artifacts already carry the truth (validators, OpenAPI, API client). The contract-surface rows in `docs/03-capabilities/` are the human projection of the same change. Update them in the same PR — the version-coupling rule: the spec changes in the same PR as the API it describes. **Do not hand-write a sample of the new call anywhere** (foundation decision RD.DOCS.011). The generated client and the contract tests are the worked example, and a prose copy of a payload is stale the first time a field moves.
