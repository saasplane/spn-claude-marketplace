<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/03-structure.md",
      "seen": "683253b2"
    }
  ]
}
-->
# Structure — the folders a repository, a project and a `src/` have

**Source of truth:** the foundation's `10-providers/ts/03-structure.md`. Read this as the restatement; that chapter governs.

**Stand at the root of any TypeScript repository here and you already know where everything is.** That predictability is what the layout buys, and it is standardized at the repository, the project root and the `src/` interior. Only the innermost varies with the kind.

## The repository

**Every stack repository is an nx monorepo over pnpm workspaces**, with these root folders:

| Folder | Holds |
| --- | --- |
| `docs/` | the repository's one docs tree |
| `apps/` | executables — service apps, web apps, the CLI |
| `packages/` | pluggables — libraries that only ever run inside something else's process |
| `tests/` | repository-level end-to-end suites only |

**The axis is pluggable against executable, not published against unpublished.** Publishability is a separate fact carried by the kind. The CLI lives in `apps/` and still publishes; a service app lives there and ships an image nothing installs. Read what a project publishes from its kind, never from its folder.

**A new folder needs no registration.** `pnpm-workspace.yaml` globs `packages/*` and `apps/*`, and nx discovers a project from the `nx` block in its `package.json`.

**Every unit and integration test lives inside its owning project.** The root `tests/` is for suites that cross projects.

**The root `tsconfig.json` compiles no sources of its own**, and Rollup configuration is per package with no root config.

## The project root

**A project owns its own `tsconfig.json`, its lint, test and build configuration, and its `README.md`.** It never carries a `docs/` of its own, because the repository has one.

```
packages/<name>/
├── src/                → source
├── tests/              → unit/ · integration/ · helpers/ · fixtures/ · setup/
├── dist/               → build output, gitignored
├── package.json
├── tsconfig.json       → plus tsconfig.build.json and tsconfig.test.json
├── eslint.config.cjs
├── jest.config.ts      → web packages use vitest.config.ts instead
└── rollup.config.js    → the web design system builds with Vite
```

**Tests live in a top-level `tests/` folder and never beside `src/`.** Which tiers a kind owes is `13-tests.md`; the folder layout is this chapter's.

**An application adds two things**: an `envs/` folder of per-environment non-secret files, and its platform declaration row. A package has neither.

## The `src/` interior

### The contract, app and entry triad

**A node that exposes a contract surface is built from the contract, app and entry layers under `src/`.**

| Layer | Holds | Visible to |
| --- | --- | --- |
| `contract/` | states, service interfaces, validators, constants — contract types only, no logic | everyone |
| `app/` | services, repositories, entities, support classes, utils | this module, except `entities/` and `utils/` |
| `entry/` | transport adapters that a host mounts — `api`, `queue`, `cli` on the server, `ui` on the web | nothing; it is mounted, not consumed |

**Leave a layer a node does not need absent, never empty.** A module wiring file set sits at the package root, beside a `migrations/` folder where the module owns storage.

**What each layer folder may hold is a rule, not a habit.**

- **`app/services/`, `app/repositories/` and `app/entities/` hold classes only** — one class per file, named after the class. A helper one class needs is a private method; a helper several need goes to `app/utils/` or an installed support package.
- **`app/support/` is the internal toolkit of a module or an app, organized by area and then by kind of file.** It is the one area of `app/` organized by feature before role. An area is a kebab-case folder named with a full word, and no file sits directly in `support/`. The kinds are `module/README.md` in this plugin; each has a TypeScript form:
  - **A manager or a simple class** is one class in a file named for it, at the top of its area: `ingress/IngressManager.ts`, `kind/KindManifestStore.ts`. The file exports that class and nothing else. A simple class holds values through its `constructor` and uses them across its methods.
  - **A provider** is `providers/<Area>Provider<Vendor>.ts`, and it implements the seam's interface: `ingress/providers/IngressProviderNginx.ts`. Build it with `new` where the knowledge to pick it is: in a manager or in the service itself.
  - **A util** sits in `utils/<subject>.ts`, a kebab-case module file with several exports: `ingress/utils/registration.ts`. A function in it may read a file, run a command or read the environment. A helper that only that file uses stays a private function of that file. A util never calls a service or a manager, and never builds a provider. So a util file never imports a class file. Of the files in its own `src/`, it imports only other util files, an `interface.ts`, a `constants.ts` and the contract. A util may read the shared `app` object of `@saasplane/support-ts`, or the app's typed reference to it: `app.config`, and a provider the app set up at boot, such as `app.providers.logger`. It never reaches a service or a manager through that object.
  - **Never write a class with no `constructor`, no `extends` and no `implements`, that holds only functions.** It is a group of static functions, so it is a util module: one `utils/<subject>.ts` file that holds its functions, the private ones too.
  - **The area's types** sit in its `interface.ts`, and a seam's interface sits there with them.
  - **The area's constants** sit in its `constants.ts`.

  How each of these is named is `02-naming.md`, under *Support classes and seams*.
- **`contract/services/` files each export one `I<MOD><Entity>Service` interface** and carry no logic.
- **`entry/` transports are classes** — controllers, listeners — thin and delegating, never free functions and never where business logic lives.

### Interiors that differ

- **A `MODULE_WEB` carries `entry/ui/{components, hooks, pages, utils}`**, plus `entry/ui/widgets/` where it ships embeddable units. `contract/` and `app/` are siblings only where the module owns client-side logic.
- **A `SUPPORT_WEB` puts `ui/` at the source root**, because there the UI is the published surface rather than a module's adapter to it.
- **A support package with no contract surface groups by feature folder** — `app/`, `http/`, `log/`, `utils/`. Those groups are the library's own to name.
- **A `CLIENT_API` holds `src/generated/`, never hand-edited, plus a hand-maintained root barrel** over it.
- **`src/assets/` sits beside `entry/`, never inside it.** Files reached by URL at runtime belong in the project's `public/`.

### Inside an application

```
apps/<app>-ts/src/
├── index.ts(x)          → bootstrap, never a barrel
├── interface.ts         → app config and module typing
├── <CODE>AppManager.ts  → builds providers and modules
├── <code>App.ts         → the typed app reference
└── modules/             → one folder per domain; everything else lives here
```

**Bootstrap files sit at the top of `src/`, and everything else is a module.** A service app's modules mirror the package triad. A web app's shell is `modules/boot/`, holding the router, the app root, session and auth hooks, client construction and the shell's own screens — never at the source root.

**Every application declares its own `interface.ts`**, and the app-structure names follow the app-code grammar: `<CODE>App`, `<CODE>AppConfig`, `<CODE>AppManager`, and the typed singleton `<code>App`. Codes are unique, so these names never collide the way descriptive ones do. Consuming a shared type directly in the entry point leaves the app with no extension point.

## The one barrel

**Only the package root gets an `index.ts` barrel**, and `spnutils apps gen-barrel` writes it. Never add a barrel-only `index.ts` inside a subfolder.

| Cost of an interim barrel | What happens |
| --- | --- |
| import cycles | a sibling reaching a neighbour through the folder barrel imports a module that imports them all |
| an ambiguous public surface | published to no one, importable by everyone — so "is this part of the API" has no single answer |
| a drifting generated barrel | `gen-barrel` sweeps the subfolder file in as any other, so the same symbols are re-exported twice by two paths |

**A subfolder `index.ts` is fine only when it holds functional code** rather than re-exports.

**Never run `gen-barrel` against an app or the CLI.** Against the CLI it would overwrite the `bin` entry; against an app it is a silent no-op that reports success and changes nothing.

## Private paths

**A leading `_` marks a folder or file private to its parent**, and the generated barrel skips it. Privacy is inherited, so everything below a marked folder is out at any depth, and a symbol another package needs must not live under one.

**The exclusion reads an underscore anywhere in the path.** With kebab-case folders and files the marker is the only underscore there is.

## Side effects

**No package declares a `sideEffects` field**, so bundlers assume every module may have one. A blanket `"sideEffects": false` would let a bundler drop the design system's CSS imports. Scope it instead: `{ "sideEffects": ["*.css"] }`.

## What a Where row may name

**A capability chapter's `## Where` table declares the code that realizes its construct**, and `spn-devex coverage measure` checks every path in it against `src/`. A row names a seat: a file, or a folder that is one seat of the kind, and a seat folder covers its tree.

| Kind | A Where path is read from | Its seats |
| --- | --- | --- |
| `MODULE_SERVER` | the package folder, so a path begins `src/` | each file under `src/app/services/`, `src/app/repositories/`, `src/app/entities/`, `src/app/utils/`, `src/entry/api/controllers/`, `src/entry/queue/listeners/` and `src/contract/states/` · each feature folder under `src/app/support/` · the wiring files at the top of `src/` · the folder `src/migrations/` |
| `MODULE_WEB` | its `entry/ui/` folder, so a path begins `pages/`, `hooks/` or `components/` | each feature folder under `pages/`, `hooks/` and `components/` · each folder under `utils/`, and each file directly in it · the folder `routes/` · each widget under `widgets/` |
| `SUPPORT_WEB` | the package folder | each group folder under `src/ui/components/` · the folders `src/ui/boot/`, `core/`, `hooks/`, `managers/`, `utils/` and `widgets/` · `src/assets/` · every other folder directly under `src/` |
| `SUPPORT_SERVER` · `SUPPORT_UNIVERSAL` | the package folder | each file under `src/contract/states/`, or a group folder beneath it · with the `contract` / `app` / `entry` triad, each feature folder under `src/app/` and each transport folder under `src/entry/` · every other folder directly under `src/` |
| `CLIENT_API` | the package folder | `src/index.ts`, the hand-kept barrel, and nothing under `src/generated/` |
| `TOOLCHAIN` | the package folder | each tool folder directly under `src/` |
| `APP_SERVER` · `APP_WEB` | the app folder, so a path begins `src/` | the bootstrap files at the top of `src/` · each module under `src/modules/`, read by its own kind's seats. Naming the module folder whole declares its whole tree |
| `APP_UTILITY` | the app folder | each file under `src/app/services/` and `src/contract/states/` · each feature folder under `src/app/support/` · each transport folder under `src/entry/` · the bootstrap files at the top of `src/` |

**A file row always declares that file. A row naming `src/` or a layer folder, such as `src/app/services/` or `src/ui/components/`, declares nothing**, and the coverage report names it. **Generated code is never a seat**: a `generated/` or `validators/` folder, and a package's generated root barrel. A private folder directly under `src/`, such as a vendored `_shadcn/`, is a seat of its own.

## Where new code goes

| You are adding | It goes to |
| --- | --- |
| a framework-agnostic utility | the universal support package's `utils/` |
| a server-only utility | the server support package's `utils/` |
| a browser-only utility | the web support package's `utils/` |
| a React component, widget or hook | the design-system package's `ui/`, plus a story |
| a domain service in a backend app | that app's `modules/<module>/app/services/`, with its interface in `contract/services/` |
| a framework-level backend addition | the server service support package |
| a new package or app | scaffold it, and declare its kind |

## Proof

**Run `spnutils apps validate`.** It reports where a project disagrees with its own kind, as one of these findings.

| Finding | What it means |
| --- | --- |
| `UNDECLARED` | no `spkind.json`, or a kind the registry does not hold — every other check is skipped, so fix this first |
| `NAMING` | folder, nx project name and package name do not agree, or the project sits in the wrong folder for its kind |
| `TOOLCHAIN` | the tsconfig is missing or extends the wrong base for the kind's runtime |
| `SCOPE` | a command is wired into a project whose kind it does not apply to |
| `LAYER` | an import reaches past another module's `contract/` into its `app/`; entity classes are exempt |
| `FILE_NAMING` | a name claims something its contents do not support — the check reads the file rather than matching the name |

**Two exemptions run throughout.** A generated tree is never judged, because its names come from a generator. What a third party owns is never judged either.

**`validate` is a report rather than a gate.** It exits non-zero so a pipeline can treat it as one, and it changes nothing on disk.
