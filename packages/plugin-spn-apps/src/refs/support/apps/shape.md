<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/02-support/02-apps/01-shape.md",
      "seen": "dea108e0"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-apps/01-shape/",
      "seen": "17320694"
    }
  ]
}
-->

# What a node is, and what its kind decides

Before you touch a node's folders, find its kind. A node declares one fact about itself — its **kind** — and you derive everything else from it rather than typing it a second time: the runtime, the folders, what it publishes, which test tiers it owes, and which commands it answers.

## Terms

| Term | Contract term | What it means |
| --- | --- | --- |
| Node | — | a package or an application inside a repository, declaring in its own manifest what it is; a repository root is never a node |
| Kind | `SPKindType` | the one fact a node declares, and the source everything else about it derives from |
| Family | `SPKindFamilyType` | the first token of a kind's name — `TOOLCHAIN` · `SUPPORT` · `MODULE` · `APP` · `CLIENT` |
| Runtime | `SPKindRuntimeType` | where code runs — `SERVER` · `WEB` · `UNIVERSAL` — implied by the kind, never declared on its own |
| Stack | `SPKindStackType` | the language ecosystem a node is built in; a stack declares which runtimes it joins, and kinds exist only for the runtimes it covers |
| Kind manifest | `SPKind` | the file `spkind.json` at a node's root, the only file the kind system reads |
| Kind config | `SPKindConfig` | the per-kind extra the manifest carries — `null` where a kind needs none |
| Mnemonic | `code` | the 2–4 letter word a module declares, inherited by every class, permission and configuration key it owns |
| App code | `code` | the word an application declares, naming the code the estate's own rows grant a place to run |
| Layer | — | one of `contract`, `app`, `entry` — the three standard folders a contract-publishing node is built from |
| Util | — | a function that takes input and gives output, needing only its input and the app's global object in order to run |
| App-owned module | — | a module living inside an application's own folder instead of as its own project, carrying the same kind, layers and documents as the packaged form |

## The ten kinds

When you scaffold or classify a node, you pick exactly one of ten kinds — one family paired with one runtime. The set is closed: you never add, rename or drop one from inside a stack, and you grow it only by writing a decision-register entry that names a genuine new combination. If the stack you are working in covers fewer runtimes, expect fewer kinds available to you there — that is coverage, never a second vocabulary you have to reconcile.

| Kind | Family · runtime | What it is for | Name pattern |
| --- | --- | --- | --- |
| `TOOLCHAIN` | TOOLCHAIN · universal | shared build, lint and test configuration, consumed by path rather than imported | `toolchain-{stack}` |
| `SUPPORT_UNIVERSAL` | SUPPORT · universal | a domain-free capability that needs nothing a single runtime alone provides | `support{-usecase}-{stack}` |
| `SUPPORT_SERVER` | SUPPORT · server | a domain-free capability, server-only | `support-server{-usecase}-{stack}` |
| `SUPPORT_WEB` | SUPPORT · web | a domain-free capability, browser-only | `support-web{-usecase}-{stack}` |
| `MODULE_SERVER` | MODULE · server | one business domain, packaged so more than one application can reuse it | `module-server-{mnemonic}-{stack}` |
| `MODULE_WEB` | MODULE · web | the same domain's UI, packaged the same way | `module-web-{mnemonic}-{stack}` |
| `APP_SERVER` | APP · server | a deployable backend service | `service-{usecase}-{stack}` |
| `APP_WEB` | APP · web | a deployable web application | `web-{usecase}-{stack}` |
| `APP_UTILITY` | APP · server | an installed tool serving an operator — runs on the server runtime despite being named for how it is delivered | `utility{-usecase}-{stack}` |
| `CLIENT_API` | CLIENT · universal | a generated client mirroring one service's published surface | `client-{usecase}-api-{stack}` |

Read the name against two conventions before you trust it. A project **leads with its family token**, except the `APP` family, which you will find named by delivery form (`service-` · `web-` · `utility-`), and `UNIVERSAL`, the unmarked runtime — so a universal support package is simply `support-`. Never type `{stack}` yourself; tooling appends it. A kind is spelled `FAMILY_RUNTIME`, family first, and a spelling the grammar does not produce fails validation as an unknown value (`RULE.SUPPORT.APPS.022` · MUST · skill:spn-apps/implement).

When you are unsure which kind fits, ask the same three questions the vocabulary is built from: is it imported, or does it run; does it hold state while running; does it stay up or finish and exit. Embeddable kinds are libraries something imports and that never start on their own (`TOOLCHAIN`, `SUPPORT_*`, `MODULE_*`, `CLIENT_API`). Runnable kinds are applications a process starts (`APP_SERVER`, `APP_WEB`, `APP_UTILITY`) — the same code can run to completion or stay resident, and you decide which one it is at deployment, never by how you wrote it.

If you scaffold an `APP_UTILITY`, make sure it answers `help` and `help --json` in the one contract shape every stack emits — command path, intent, signature, arguments, options — assembled from the running program, never from its source text.

## What a kind implies

Once you know the kind, do not re-derive what it already tells you. Look it up instead.

### Runtime and layer applicability

Every node you build from `contract` / `app` / `entry` follows the same three layers at both runtimes:

| Layer | What it holds | Visible to |
| --- | --- | --- |
| **contract** | states, service interfaces, constants, generated validators — published whole | everyone: the only layer another module, an entry, or a client ever sees |
| **app** | services, repositories, entities, support, utils — private except `entities/` and `utils/` | this module only |
| **entry** | transport adapters (`api`, `queue`, `cli` on the server; `ui` on the web) — mounted by a host, never called directly | nothing — it is mounted, not consumed |

**Leave a layer a node does not need absent, never empty.** A module with no client-side rule carries `entry/` alone, and you add the other two only the day a rule earns them. When you write an entry, keep logic out of it in every topology — standalone, interactive, or distributed — it only parses input, calls a contract service, and renders what comes back; **never let anything cross a runtime boundary except contract-typed data**.

### Publish shape

**Check what a kind publishes before you reach for `release`, `dev`, or `start` — it decides which of the three you get, and the answer is exactly complementary: a kind either publishes an artifact other code consumes, or it publishes nothing and is deployed to serve people, never both.**

| Kind publishes | `release` | `dev` / `start` |
| --- | --- | --- |
| yes — `TOOLCHAIN`, `SUPPORT_*`, `MODULE_*`, `CLIENT_API` | exists | refused: the kind declares no such mode |
| no — `APP_*` | refused: `release` is the repository's command, never a node's | exists, once built |

If you invoke `release` on a node, expect a refusal — versioning is lockstep within a repository: every publishable project releases at one version, the source carries a placeholder, and the real number is stamped at publish. A node's own release line is the repository's per-package step; do not invoke it alone.

**Every published package carries the repository's licence notice, and the notices of code it ships from others** (`RULE.SUPPORT.APPS.214` · MUST · skill:spn-apps/implement). The release writes the repository's `LICENSE` into every package it publishes, and the repository's `THIRD-PARTY-NOTICES.md` into each package whose folder a `Where:` line of that file names. It verifies both as it verifies the version, and refuses a repository with publishable packages and no `LICENSE`, or a `Where:` path that is no folder.

### Test tiers

You are offered a tier when its **kind owes it**, or when the **node itself carries it** — you are refused only when neither holds:

| Kind owes it | Node carries it | `test <tier>` |
| --- | --- | --- |
| yes | yes | runs it |
| no | yes | runs it |
| yes | no | reports the tier owed and unwritten |
| no | no | refused: not supported for this kind |

If you carry a tier the kind never owed, that is correct, not a breach — never delete it to match the floor.

### The command grammar

**Write one line per command, never one line per variant.** Pass a tier, a flavour, or a serving mode as an argument to the one command — `test unit`, `dev --mode API` — never invent a second command to spell it. If you find a second spelling of a command in a node's manifest, treat it as a defect: it hides whether the node lacks the command or merely names it differently. Reach for `dev` to run from source and watch it; reach for `start` to run what was built; give a one-shot task (a migration, a generation step) its own command rather than folding it into a serving mode. When you are deciding whether a line belongs in a node's own manifest or in the stack's shared toolchain, apply one test: **a line moves when the kind decides something about it** — the runner, the configuration, what ships.

## `spkind.json` — the one declaration

Look for `spkind.json` at a node's own root — it is the only file the kind system reads, and it exists because two kinds of node have nowhere else to declare themselves: a module living inside an application has no project manifest of its own, and a project in a stack whose ecosystem carries no such manifest has nowhere to put it either.

```ts
export interface SPKind {
  kind: SPKindType;              // the declared value; everything else derives from it
  name: CDTString;                // what a person calls this node — declared, never derived from the folder
  config: SPKindConfig | null;    // the per-kind extra; null where a kind adds nothing
}
```

Write `config` as `null` for `TOOLCHAIN`, every `SUPPORT_*` kind and `CLIENT_API` — never as an empty object. Add the mnemonic for a module; add the app code for an application; for `APP_UTILITY` add a second fact, the standards version range it implements — write it as `null` while none is published yet, never simply omit it.

```jsonc
// an app-owned module — apps/service-sample-ts/src/modules/order/spkind.json
{ "kind": "MODULE_SERVER", "name": "Orders", "config": { "mtype": "MODULE_SERVER", "code": "ORD" } }

// a support package — packages/support-contract-ts/spkind.json
{ "kind": "SUPPORT_UNIVERSAL", "name": "Contract", "config": null }
```

**Never write into the manifest what you can derive.** Not the runtime, the folders, the publish shape, the barrel, or the test tiers — read those off `kind` instead. Not the stack — the node's own toolchain answers that. Not dependencies — the package manager owns them. And no estate configuration: leave ports, entry declarations, and resource sizing in `spestate.json`, owned by the operator and changing on infrastructure's own clock rather than the node's identity clock. `spkind.json` **replaces** any kind key a stack's own project file might otherwise carry, so if you find one duplicated there, remove it — two places declaring one fact is drift waiting to happen.

**Treat the authored manifest as what makes a folder a node at all.** A folder carrying `spkind.json` (or `spestate.json`) is a node you can act on; a folder with neither is only a folder, whatever it contains. A repository's own root carries neither — it declares its world once in `sprepo.json`, and you never treat a root as a node.

**Check the declaration; never infer it.** Compare a node's name and its workspace folder against the declared kind rather than guessing the kind from either. If you find a `MODULE_SERVER` named `service-…`, or sitting among applications, flag it — that is a visible defect the moment you validate it, not an ambiguity to resolve by eye. The manifest's shape is a contract state with a generated validator, so expect a malformed file to fail the way a malformed command does. The one exception you will meet is the readable `name`: its not-blank rule lives in the validation command rather than the generated schema, because a schema refusing a blank name would throw inside the read before the command that reports the omission ever runs.

## The three structure levels

Structure is standardized at three altitudes, and only the innermost changes with the kind you are looking at:

| Level | Scope | Fixed |
| --- | --- | --- |
| **Workspace root** | one repository | the folders a repository composes (`apps/`, `packages/`, `docs/`, `tests/`) and its own manifests |
| **Project root** | one project | which folders sit beside `src/` (`tests/`, `envs/`, `dist/`) and which manifests sit there — never a `docs/` of its own |
| **`src/` interior** | one kind | the groups that kind publishes — the only level that varies by kind |

Check each level on its own — folders are what is standardized, never the files beside them. Flag a folder the kind does not grant as structure invented rather than derived; flag a layer folder that exists and is empty as a layer claimed and not earned; flag a second barrel as a published surface with two answers; flag source sitting beside `src/` as the project root used as an interior.

**Read one privacy marker at every level.** A leading underscore (`_internal/`, `_helpers`, an export beginning with `_`) means *not part of the published surface* — nothing beneath a marked folder is published however deep, and the barrel refuses to export through a marked path segment. Treat privacy by marker as exclusion, never documentation: a marked path produces no symbol, no capability document, nothing you owe a deprecation later. It is a different mechanism from the layer model's privacy, which hides by *position* (`app/`) rather than by *name* — use whichever states your intent more plainly.

### Kind-fixed skeletons versus a library's own groups

Kinds divide in two by how you decide their `src/` interior. Where the **layer model fixes the folder set** (`MODULE_SERVER`, `MODULE_WEB`, `APP_SERVER`, `APP_WEB`, `APP_UTILITY`, `CLIENT_API`), every node of the kind gets the same folders — start a new node from the scaffold's own tree, and treat a scaffold asset as bound by its kind's rules exactly as a built node is. Scaffold a `MODULE_SERVER` with `contract/{states,validators,services,methods}`, `app/{entities,repositories,services,support,utils}`, `entry/api/controllers`, `migrations/`, its second door, and a `tests/` folder per tier it owes. The second door is two folders: `src/remote/`, which holds what another service takes to call the module's contract, and `remote/` at the root, which is the door's own entry. Scaffold a `MODULE_WEB` with only `entry/ui/{components,hooks,pages,utils}` — **the browser is a transport, so you put a web module's surface under an entry** (`RULE.SUPPORT.APPS.031` · MUST · skill:spn-apps/implement). Give `APP_SERVER` and `APP_WEB` the same `modules/` folder at the source root, and add `public/`, `src/assets/styles/` for its stylesheets, and a component harness for the web kind. Build `APP_UTILITY` like a module, entering it only through `entry/cli/`. Scaffold `CLIENT_API` like any package, and leave its `src/` empty until you generate the client into it.

Where the rule is instead **one folder per group** (`TOOLCHAIN`, `SUPPORT_*`), the groups belong to the package and you grow them as it grows — a `TOOLCHAIN` publishes one folder per configuration area (`eslint/`, `jest/`, `vite/`, …) and no barrel at all; a `SUPPORT_*` library publishes one folder per capability it offers (`cache/`, `queue/`, `auth/`, …). Read each tree you find here as an example rather than a standard — the groups are the library's own to name.

### Modules that live inside an application

You may find a module living inside an application's folder instead of shipping as its own project — that is a packaging decision, never a different kind of thing. It still declares the same `MODULE_SERVER` or `MODULE_WEB` kind, carries the same three layers, and owns the same documents as the packaged form. It carries no field that says it is app-owned: a `MODULE_*` node under an `APP_*` node's `src/modules/` is app-owned by where it sits, so resolve its parent before you apply what follows (`RULE.SUPPORT.APPS.057` · MUST · skill:spn-apps/implement). Expect three consequences: its identity is its folder, named for its mnemonic, because a name pattern belongs to a published project and this one publishes nothing; it emits no index of its own surface, because nothing installs it; its proof rides the application's own tests, because a test tree belongs to a project and this is not one. It may depend on packages, and nothing may depend on it. The day a second application wants it, package it: give it a name, its own tests, and a build of its own, while its identifiers and documents travel unchanged.

## The four shapes a platform is built in on the server

A platform's server code takes one of four shapes, and a module is written the same way in all four. The choice is two questions: how many services run, and whose resources each one stands on.

| | Monolith | Microservices, shared platform | Own space, talking with the platform | Independent, space only |
| --- | --- | --- | --- | --- |
| Services | one | several | several | several |
| In the platform's manifest | nothing more | an application row | a row that names a space and keeps the platform | a row that names a space |
| Its own data lives in | the platform's resources | the platform's resources | the space | the space |
| Keys it is given | `{SPC}_…` | `{SPC}_…` | `{SPC}_…` and `{SPC}_{SPACE}_…` | `{SPC}_{SPACE}_…` |
| Reaches a SaaS Plane module by | a direct call in the process | a remote call, or its queue | a remote call, or its queue | it does not |

**A module's data is reached through that module's contract — MUST**, even where a service is given the platform's database settings. A partner's service builds on the SaaS Plane modules and does not repeat them: it asks the identity module whose token this is, calls a module's contract held remotely for an answer now, and publishes to a module's request topic on the platform's queue for work later.

## The four ways a partner builds on the web

On the server the choice is how many services run. On the web it is how much of a SaaS Plane screen a partner takes. A partner builds on the web in one of four ways, and the ways can be mixed in one app, page by page (`RULE.SUPPORT.APPS.180` · MUST · skill:spn-apps/implement). **The four as a set are proposed**: the developer has not confirmed the set by name.

| The way | What the partner takes from a SaaS Plane web module | What the partner writes |
| --- | --- | --- |
| Take the whole page | the page, with every container on it | the address it is mounted on, and its entry in the app's menu |
| Place a container | one or more framed parts of a screen, each complete | a page of their own: its address, what it reads from the address, and the containers it places |
| Place a widget or a smaller piece | the widgets a container is built from, and the hooks that load and save | containers of their own, and the page that places them |
| Build their own | nothing of the module | everything on the page, from the design system and the service's client |

**A web module MUST export its pages, its containers, its widgets, its hooks, and its routes as data** (`RULE.SUPPORT.APPS.181` · MUST · skill:spn-apps/implement). A module that leaves one out takes that way from a partner. The platform's own web modules export pages, widgets and hooks today, and no container yet.

Hold a web module to these rules when you write or review one. A rule marked proposed is one the developer has not confirmed, so say so when you apply it.

| Rule | Id | State |
| --- | --- | --- |
| A page is assembled from one or more containers. The page knows the address: the values in its path, its query, and where to go next. It takes no props | `RULE.SUPPORT.APPS.182` | decided |
| A container takes its data, or an id it loads by, as props, and holds no path. A link to a screen of its own module is built from that screen's route, by its key. A link to any other screen is a prop the page passes | `RULE.SUPPORT.APPS.183` | decided |
| An edit container takes an optional callback that runs after a save. With none, it goes where it goes today | `RULE.SUPPORT.APPS.184` | proposed |
| A SaaS Plane container takes data only. It is handed no unit of a partner's | `RULE.SUPPORT.APPS.185` | decided |
| A route is declared once, as data, by the module that owns its page. It is a key and a path. It holds no place in a menu, no older address and no router | `RULE.SUPPORT.APPS.186` | decided |
| A route says which permissions and enablements it needs | `RULE.SUPPORT.APPS.187` | proposed |
| A module ships a default path for each route, and an app may replace a path by its key | `RULE.SUPPORT.APPS.188` | proposed |
| An address is built from a route and its values, by one function, and never written as text. That a missing value is an error is proposed | `RULE.SUPPORT.APPS.189` | decided |
| The menu is the app's own list, and an entry names a route by its key | `RULE.SUPPORT.APPS.190` | decided |
| The entry of the menu in view is the one whose address the current address is at or under. That the longest address wins among several is proposed | `RULE.SUPPORT.APPS.191` | decided |
| The first word of an address is the module's, and an address does not carry its place in the menu | `RULE.SUPPORT.APPS.192` | decided |
| An address that changes answers with a redirect, which is the app's own | `RULE.SUPPORT.APPS.193` | decided |
| The path names the page, and the part after `#` names an overlay any page can have | `RULE.SUPPORT.APPS.194` | decided |
| An overlay is shown through the overlay context, and never placed in the page's own tree | `RULE.SUPPORT.APPS.195` | decided |
| An overlay that has an address is shown while the address matches, and removed when it does not | `RULE.SUPPORT.APPS.196` | proposed |
| The app's navigation seam changes only the part after `#` where an address begins with `#` | `RULE.SUPPORT.APPS.197` | proposed |
| How a screen is shown is the choice of whoever builds the page, and nothing is configured for it | `RULE.SUPPORT.APPS.198` | decided |
| A partner places a SaaS Plane container by mounting one small provider beside the design system's context. It has no router, no layout and no sign-in screen | `RULE.SUPPORT.APPS.199` | decided |
| The provider finds the signed-in person itself, keeps the answer fresh, and tells its containers when nobody is signed in | `RULE.SUPPORT.APPS.200` | decided |
| A page, a container and a hook reach a service through that service's client. A second service means a second client | `RULE.SUPPORT.APPS.201` | decided |
| A web module declares one route name beside its code, and each route says whether it is a page of work or a page of setup. A page of work is at `/<name>/<rest>`, and a page of setup is at `/settings/<name>/<rest>` | `RULE.SUPPORT.APPS.204` | decided |

Four choices beside the provider are proposed: it stands outside the design system's app root, it is not handed the service's client, a container shows its denied state when nobody is signed in, and the provider tells the app once that a sign-in is needed. On a page of groups and their items, the swap of the items for the groups changes the address (`RULE.SUPPORT.SURFACE.079` · MUST · skill:spn-surface/design).

The TypeScript names for these are in `providers/ts/08-web.md` and `providers/ts/02-naming.md` in this plugin. The page chapter's rules are restated in `module/README.md`.

## Boundary

Use this ref for what a node is, how it says so, and what its folders are. Reach for the `support.md` ref in this plugin when the question is what makes a package support rather than a business domain. Reach for the module contract standard when the question is what you author versus what is generated inside `contract/` — states, validators, the client. Reach for the application lifecycle standard when the question is what boot does, in what order, and how a node ships.

## Proof

Run `spnutils apps validate` as the gate: it confirms every node declares a kind the vocabulary holds, and that its name and folder match that declaration. Run `spnutils apps scaffold <kind> <name>` as the convergence check: it should land a new node with exactly the folders its kind grants, and nothing beside them.
