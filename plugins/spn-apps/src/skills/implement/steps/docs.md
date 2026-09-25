# Step: docs — the doc set closes the change

Docs are the contract; code is the implementation; tests are the proof. The change is not done until the owning module's doc set reflects it — and most of that happens **during** the earlier steps, not here. This step is the closing sweep: flip statuses, verify nothing was skipped.

**Before writing behavior rows or dictionary terms**, apply the **spn-devex** plugin's `refs/doc-sets.md`. It carries the node grammar in full, and the node's declared kind fixes its consumer. That consumer in turn fixes the actor voice, how areas group, and which test tier proves a row. For a `MODULE_SERVER` the consumer is the composing app. Rows read *"a composing app can…"*, areas are named for capability, and proof is contract-tier with the id in the test title.

**A REPOSITORY HAS ONE DOCS TREE AND A NODE HAS NONE** (foundation decisions RD.DOCS.001 · RD.DOCS.021). The tree sits at the repository root with five numbered seats — `docs/01-purpose/` · `docs/02-constructs/` · `docs/03-behaviors/` · `docs/04-capabilities/` · `docs/05-guides/` — and two unnumbered pockets, `docs/registers/` and `docs/artifacts/`. Each seat opens with the `README.md` that is its face.

**The seats divide by the domains the repository's concept names, never by the packages it ships.** So a module you are changing does not have a seat: it has a domain, and what you write lands in that domain's folder inside the one tree. The node itself carries `README.md` — about twenty-five lines saying what it is, and linking into the seats it realizes. **Find the node's capability face through that README**, which is the only thing that knows where the node documents itself: a path cannot say it, because `packages/module-server-iam-ts` documents itself at `docs/04-capabilities/01-iam/01-server/`.

You never meet an absent seat. Where a repository has nothing of its own to say, the face states what the seat would hold and cites the repository that owns the answer. Never write a `docs/` folder inside a package or an app — if you find one, it is drift; hand it to the `plan` skill in its `docs` mode.

## Writing a seat from scratch

Use the tables below to close a *change*. Writing a seat that does not exist yet is a different job, and it is where doc sets go wrong — the shape gets copied and the substance does not.

**Copy a worked node rather than re-deriving.** Open one whose seats are complete and follow it exactly: the metadata block, the face's shape, the depth of an area file. Re-deriving the format from the standard produces something that passes a reading and fails a diff.

### The two voices, and the line between them

| | `03-behaviors/` | `04-capabilities/` |
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
| contract | New/changed states, commands and enums land as **terms in the construct's `Terms` table** under `docs/02-constructs/<domain>/` — a term is written in exactly one construct and the domain's dictionary is generated from it. A closed vocabulary states its members there as a fenced contract block. Storage goes to the server package's `data-model.md`, face rows to `README.md` (flip the plan's `🔮` to `🚧`); every `I*Service` method gets its one-line **intent comment** as it is written |
| service | Interactions rows in `docs/04-capabilities/` (cache, queue, audit implications); permission rows if the authz surface grew |
| entry | Nothing extra — routes are generated surface (OpenAPI), never hand-documented |
| ui | Component intent comments; the UI package's behaviors cite the domain ids they realize |
| test | Behavior rows gain their proof; contract-tier test titles embed the behavior id (`<MOD>.<CAP>.<NN>`) |

## The closing sweep (this step)

| Seat or pocket | Close it by |
| --- | --- |
| `docs/03-behaviors/<domain>/` | The area file for the domain your change touched. A behaviour belongs to the domain that would have to change if the behaviour changed, which is what its id's prefix names — never to the package that happens to realize it. A row is eight cells, and what a run found is written by the run rather than typed |
| `docs/04-capabilities/<domain>/<layer>/` | The node's own face and the code mirror for every `src/` folder that earns one — `contract.md` · `app.md` · `entry.md` for a `MODULE_SERVER`, the `ui` mirrors for a `MODULE_WEB`. A source folder that appeared or went gains or loses its mirror in the same change. The face's Map is **generated**, so never hand-write a row in it |
| `docs/05-guides/README.md` | Only if install, mount, or configuration changed — this face **is** the getting-started, and it is written for a reader with no checkout of this repo. If it is generated, edit only inside `<!-- spnutils:keep:begin -->` / `<!-- spnutils:keep:end -->` (foundation decision RD.DOCS.009) |
| `docs/02-constructs/<domain>/` | The construct, if your change altered what a thing IS — what it is made of, what it depends on, or what it refuses. The dictionary is generated from each construct's `Terms` table, so a term is edited there and nowhere else |
| `docs/01-purpose/README.md` | Only if the REPOSITORY's reason to exist shifted, which a module change almost never does |
| `docs/04-capabilities/<domain>/<server package>/schema.sql` | Any entity/column/index change landed here **first** (or simultaneously), ported **verbatim** into that package's `src/migrations/` — spec and migrations must never disagree. It sits beside the `data-model.md` it is the authoritative form of, in the package that owns the migrations, and NOT in a pocket: nothing in a pocket may be depended on (`Q88`, `RD.DOCS.074`) |
| `docs/README.md` | The repository's own face — only if a seat was added or a domain's name changed |
| `README.md` (package root) | The npm front door, not the node doc and not a mirror — only if identity, install, or key exports changed |
| App-owned modules | **The module inherits its host application's domain and layer, and adds its own name** — `apps/web-www-ts/src/modules/onboarding/` documents itself at `docs/04-capabilities/10-surfaces/www/onboarding/`. It is never adopted on its own, so wiring, composition and running it land in the repository's `docs/05-guides/`, which you update when the registration entry or what it commits the host to changed |
| `registers/conformance.md` | When a requirement's status moves — same PR |

Rules:

- **A node carries `README.md` and nothing else.** No `docs/` folder inside a package or an app, no per-module summaries, no standalone status-tracking `.md`, no `tasks/` trees. What a node documents goes in the repository's one tree, under the domain it realizes.
- **Never hand-edit the 📖 strip** at the foot of a seat document — it is derived from the node's doc map and regenerated whenever the node's file set changes (foundation decision RD.DOCS.007). Adding or removing a file is what makes every strip in that node stale, not just the new one's.
- **Never invent entities or columns in prose** — align with the layer's `schema.sql` or update it first.
- **Written fresh** — docs state present truth; no changelog prose, no "previously"; git history is the history.
- **Regenerate, don't restate**: `spnutils apps gen-symbols <pkg>` refreshes the machine twin (`spn-symbols.json`); the doc seats are the human twin. Intent lives in the code and is harvested — never typed twice (foundation decision RD.APPS.006).

## Env documentation

A new module env variable (`{CODE}_{MOD}_*`) is documented where it lives: **the package's own `README.md`**, in its configuration matrix (depth in `docs/05-guides/README.md`). It is configuration rather than a contract term, so it goes in neither the data model nor a `Terms` table. It is also documented in the app's `envs/local.env`, under the module's banner comment. Committed env files carry **no secret values** — secrets appear empty with a required-in-shell annotation. Keep the env file's header key list in sync with what migrations actually read.

### Where a key goes — one order, in every env file

An env file is read top to bottom by somebody looking for one key, so the groups run in the order the thing itself is built. **Each group is named by what it IS**, which is what lets a family nobody has invented yet still have an obvious home:

| | Group | What belongs in it |
| --- | --- | --- |
| 1 | `{CODE}_PLATFORM_` | what this node **belongs to**. A platform app has one; a standalone app does not, and that absence is correct rather than a gap |
| 2 | `{CODE}_RESOURCE_` | what it **consumes** — database, cache, queue, storage. One banner per resource |
| 3 | the entries | what it **publishes** — `{CODE}_API_`, and a queue or CLI entry where the node has one |
| 4 | `{CODE}_HEALTH_` · `{CODE}_LOG_` · `{CODE}_AUTH_` | what every process **carries** whatever it serves — the providers and the app's own configuration |
| 5 | `{CODE}_{MOD}_` | one block per module the app composes |

Group 4 is not part of group 3, and the distinction is load-bearing: a processor with no API entry still answers a probe, still logs and still authenticates — the entry table starts `HEALTH` in `QUEUE` mode — so filing any of the three under `API` would tie them to a surface they do not depend on.

**Every sub-level carries its own banner**, in the shape the resource blocks already use — `# Resource: cache — …`, `# Entry: API — …`, `# Module: USER`. A key added with no banner above it is a key the next reader has to guess the owner of.

**A port and an endpoint are different facts**, and both are owed: `{CODE}_API_PORT` says how the app **binds**, `{CODE}_API_ENDPOINTS` says where a consumer **reaches** it. A bind host cannot stand in for an endpoint — `0.0.0.0` is nowhere anything can call — and an endpoint is **published, never composed**: a reader building `{env}-{label}.{base}` is a second place knowing the host grammar. The exception is a surface that is never published at all, such as health, which is always reached on the loopback at `{CODE}_HEALTH_PORT`.

## Status honesty

Anything the docs claim must match what runs: ✅ implemented = running reality, 🚧 in progress = being built, 🔮 planned = design only. Never let this change's plan wording survive as fact wording after the code lands — and never upgrade a status the code doesn't back.

## Contract-visible changes

If the public contract surface changed, the generated artifacts already carry the truth (validators, OpenAPI, API client). The contract-surface rows in `docs/04-capabilities/` are the human projection of the same change. Update them in the same PR — the version-coupling rule: the spec changes in the same PR as the API it describes. **Do not hand-write a sample of the new call anywhere** (foundation decision RD.DOCS.011). The generated client and the contract tests are the worked example, and a prose copy of a payload is stale the first time a field moves.
