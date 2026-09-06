---
name: new
description: Scaffold SaaS Plane TS artifacts. Use when the user wants to create something new - a workspace root (repo), a project of one of the supported kinds (toolchain, support-universal, support-server, support-web, module-server, module-web, app-server, app-web, app-utility, client-api), or an app-owned module inside an existing app. Takes a kebab-case target naming what to scaffold.
---

# new — scaffold by target

Every node declares exactly **one kind**, in `spkind.json` at its root — `{ "kind": "<kind>", "config": null }`. The `config` field carries the mnemonic for module kinds and the app code for app kinds. Everything derivable from the kind (runtime, toolchain profile, structure profile) is never declared again. Scaffolds write the kind automatically; a project without it is unfinished.

**Never invent layout.** `spnutils apps scaffold` writes the structure the kind requires, and `spnutils apps validate` reports where a project disagrees with its own kind. Run the scaffold, then the validator, rather than hand-building a folder tree. The stack is never typed: it comes from the repo's claim in `sprepo.json`. Where a workspace already holds a project of the same kind, match it; where it does not, the kind registry's structure profile is the authority. Keep tests under `tests/`, always — never in `src/`.

## Target: repo

A new platform monorepo — the workspace root, which declares `sprepo.json` `{ type: APPS }` with the stack claim and the infra couplings (roots are never nodes, so the root carries `sprepo.json` alone). **Run the intake worksheet first** — `refs/platform-worksheet.md` in the **spn-core plugin** (cross-plugin pointer; it ships alongside this plugin from the `saasplane` marketplace). Every worksheet row must be filled before anything is created; the manifests are typed from it.

Then:

1. **Create the repository**: `spnutils repo create <name>` — creates it in the bound SCM if absent, then converges it to the standard (branches, protections, team access). Idempotent.
2. **Mint the workspace**: `spnutils apps scaffold repo --stack ts --organization <package[@version]> [--platform <package[@version]>]`. It writes `sprepo.json` with the stack claim and couplings — the organization coupling is never optional, and `platform: null` means nothing deploys. Then it writes the workspace skeleton: `apps/` · `packages/` · `docs/` (the workspace doc set — same shape as every other node, below) · `tests/` + `package.json`, `pnpm-workspace.yaml`, `nx.json`. No `tasks/` tree — designs live in the docs as 🔮 rows (foundation decision RD.DEVEX.007). pnpm only, never npm/yarn; Nx discovers projects from each `package.json`'s `nx` block.
3. **Agent wiring**: `spnutils repo agent-init` (alias `ai`; `--local [path]` is **producer-only** — it targets a marketplace checkout a partner does not hold, and writes `.claude/settings.local.json` instead). It registers the `saasplane` marketplace, enables `spn-core@saasplane` + `spn-apps-ts@saasplane`, maintains the managed `CLAUDE.md` block, and generates `.claude/saasplane/rules.md`.
4. **Local infra**: `spnutils infra organization up` (once per machine) → `spnutils infra platform up` — see the `run` skill local mode.

## Target: one of the supported kinds

| Target | Kind | Runtime | What gets created | Commands after creation |
| --- | --- | --- | --- | --- |
| `repo` | `sprepo.json` `{ type: APPS }` — a repo type, not a kind | — | The workspace root — see **Target: repo** above | — |
| `toolchain` | `TOOLCHAIN` | universal | `packages/toolchain-ts` — the tsconfig bases, flat lint config, test presets, bundler factory, release bins. Publishes **files consumed by path**, so no barrel and no symbol index. Singleton, one per stack | — |
| `support-universal` | `SUPPORT_UNIVERSAL` | universal | Capability-group package under `packages/`, runtime-agnostic (`src/<group>/…`, root barrel) | `spnutils apps gen-barrel -p <pkg>` |
| `support-server` | `SUPPORT_SERVER` | server | Same shape, server-only | `spnutils apps gen-barrel -p <pkg>` |
| `support-web` | `SUPPORT_WEB` | web | Same shape, browser-only; `ui/` sits at the **source root**, because there it is the published surface rather than a module's adapter to it | `spnutils apps gen-barrel -p <pkg>` |
| `module-server` | `MODULE_SERVER` | server | `packages/module-server-<mod>-ts` — the contract/app/entry triad + `migrations/` + module wiring (`interface.ts`, `<mod>Module.ts`, `<MOD>ModuleManager.ts`) + the doc set, with `docs/artifacts/resources/schema.sql` | `spnutils apps gen-validators -p <pkg>` (after states) · `gen-barrel -p <pkg>` |
| `module-web` | `MODULE_WEB` | web | `packages/module-web-<mod>-ts` — `src/entry/ui/{components,hooks,pages,utils}` (the browser is a transport, so the UI is the module's **entry**; `contract/` and `app/` arrive beside it only once the module owns client-side rules), named exports only | `spnutils apps gen-barrel -p <pkg>` |
| `app-server` | `APP_SERVER` | server | `apps/service-<usecase>-ts` — bootstrap `index.ts`, `<CODE>AppManager.ts`, `interface.ts`, `modules/`, `envs/` (`local.env`, `cloud.env` — no secrets), the platform declaration's `apps[]` row | `spnutils infra app up -p <app>` · `pnpm migrate:up` |
| `app-web` | `APP_WEB` | web | `apps/web-<usecase>-ts` — root holds only `index.tsx` · `index.css` · `interface.ts` · `<code>App.ts` · `<CODE>AppManager.ts`; the shell (`AppRouter`, `nav`, app context) lives in `src/modules/boot/ui/`, and vite carries per-module `manualChunks` | `spnutils infra app up -p <app>` |
| `app-utility` | `APP_UTILITY` | server | `apps/utility<-usecase>-ts` — the layers of a module, the frame of an app; `src/index.ts` is the executable a user invokes (`#!/usr/bin/env node`), so **never run `gen-barrel` against it** | — |
| `client-api` | `CLIENT_API` | universal | `packages/client-<usecase>-api-ts` — the **shell** is scaffolded like any kind (manifest, tsconfigs, lint, tests, generator config, hand-written barrel). Only `src/generated/` is emitted, from the running service's published spec; hand edits there are lost by design | `pnpm --filter <app> gen:client` |
| `app-module` | (the module's own) | — | A module folder inside an app — see **Target: app-module** below | |

**Targets are kebab-case, and derived rather than tabled**: a target is its kind lowercased with `_` → `-`, so `MODULE_SERVER` is `module-server`. A superseded spelling is an **unknown** target, never a mapped one (RD.APPS.027) — it fails at the door.

**Two arguments, and they are different facts.** `--usecase` builds the *name*; `--code` is the value `spkind.json`'s config carries. They coincide for modules and diverge for apps — `utility-ts` carries the code `utilities`.

```bash
spnutils apps scaffold module-server -u ord            # code defaults to ORD
spnutils apps scaffold app-server    -u sample -c SPN
spnutils apps scaffold support-server                  # → support-server-ts, the family base
spnutils apps scaffold support-server -u service       # → support-server-service-ts
spnutils apps scaffold client-api     -u sample        # → client-sample-api-ts
```

A kind whose `config` is `null` — `TOOLCHAIN`, `SUPPORT_*`, `CLIENT_API` — **refuses `--code` by name** rather than ignoring it; so does the `repo` target, which is not a kind at all.

**Name grammar** (RD.APPS.037): every project name leads with its family token — `toolchain-{stack}` · `support{-usecase}-{stack}` · `support-server{-usecase}-{stack}` · `support-web{-usecase}-{stack}` · `module-server-{mod}-{stack}` · `module-web-{mod}-{stack}` · `service-{usecase}-{stack}` · `web-{usecase}-{stack}` · `utility{-usecase}-{stack}` · `client-{usecase}-api-{stack}`. The `APP` family is named by delivery form, `UNIVERSAL` is the unmarked runtime, and `{stack}` is appended by tooling and never typed. A downstream platform uses its own npm scope with the same folder grammar. **`domain-` and `ui-` are retired.**

**Versioning** (RD.APPS.034): a scaffolded manifest carries the placeholder `0.0.0` and internal deps use `workspace:*`. The real version is stamped into the artifact at publish and the git tag is the source of truth — never edit a version into source.

### The doc set every scaffold writes

**One shape at every altitude** (foundation decision RD.DOCS.008) — a workspace, an app, a package, and an app-module all get the same tree; only the content branches on kind. Read `refs/doc-sets.md` in the **spn-core** plugin before writing a word of it.

```text
<node>/
├── README.md                  the front door (npm page / repo landing) — NOT the node doc
└── docs/
    ├── README.md              the node doc — identity, children map with statuses, doc map
    ├── 01-purpose/README.md   the face — why it exists
    ├── 02-behaviors/          README.md (the face — every row) + personas.md where several
    │                          personas exist + numbered area files
    ├── 03-capabilities/       README.md (the face) + data-model.md + one document per
    │                          published source group — derived, not chosen (RD.DOCS.015)
    ├── 04-guides/             README.md IS the getting-started; further guides numbered
    ├── registers/README.md    pocket — governing nodes only
    └── artifacts/README.md    pocket — what the node AUTHORS: resources/, reports/, approaches/
```

- **The seats are folders, always, and every folder carries a `README.md`** — pockets included. Never a `purpose.md`, `capabilities.md`, `behaviors.md`, or `guides/getting-started.md` file: a seat holding nothing but its face is the compact state, not a defect.
- **A seat is absent only when the node cannot answer its question at all**, and the node doc says so. Exactly two cases. `CLIENT_API` carries no `02-behaviors/`, because it is proven by the contract tests of the service that generated it. An **app-module** carries no `04-guides/`, because it ships inside its host and the host's guide covers running it.
- **New seats start `🔮`/`🚧`, never `✅`** — a status claims running reality, and nothing runs yet.

## Target: app-module

A product module owned by one app — a scaffold target rather than a workspace project, but **still a node**. It carries its own `spkind.json`, so it is documented, validated and scaffolded exactly like the packaged form (decision RD.APPS.029). Living inside an app is a packaging decision, not a different kind of thing.

- **Backend**: `apps/<service-app>/src/modules/<code>/` mirroring the module skeleton — `spkind.json`, `interface.ts`, `<code>Module.ts`, `<CODE>ModuleManager.ts`, `contract/` (states, services, validators, constants), `app/` (entities, repositories, services, support, utils), `entry/api/controllers/`, `migrations/`. Add **one line** to the app manager's module list to register it.
- **Frontend** (if it has a surface): `apps/<web-app>/src/modules/<code>/entry/ui/` with `components/hooks/pages`, its own vite `manualChunks` claim, literal route strings in `nav.ts` (no URL-helper package).
- **Docs**: `apps/<app>/src/modules/<code>/docs/` — **all four seats, none absent** (decision RD.DOCS.017). Where the module has nothing of its own to say, the seat's face **cites the node that owns the answer** and is generated. An app-owned module's guides face cites the host app, because wiring, composition and running it are the host's to document.
- Commands: `spnutils apps gen-validators -p <app-pkg>` after writing `contract/states/**` (gen-validators applies to apps too); do **not** run `gen-barrel` on apps (their `index.ts` is a bootstrap, not a barrel).

**The scaffold writes the gate table; it cannot answer the question behind it.** Every new module gets an `app/utils/authz.ts` and a seeded permission catalog. Before you fill either, decide what varies the answer — a person, an organization type, or a plan. `refs/permission-vs-enablement.md` in the **spn-core** plugin carries that question, the `{MOD}_MANAGE_{NOUN}` grammar, and the append rule an app-owned module needs when it contributes an option to another module's definition. This plugin's `hooks/scripts/enablement-grammar.py` refuses the checkable mistakes as you write them.

## Depth

The kind registry, structure profiles, and toolchain rules are digested into this plugin and are the authority at the seat. Their owning chapters are the foundation provider set (`providers/apps/ts`: `kinds.md`, 02-structure, 08-toolchain) — cited for provenance, **not as a lookup**. The book is not delivered, so never send anyone there to finish a task. If something you need is missing from the digest, that is a regeneration owed, not a checkout to go find. Read `refs/doc-sets.md` in the **spn-core** plugin for the node grammar in full. After scaffolding, hand off to the `implement` skill.
