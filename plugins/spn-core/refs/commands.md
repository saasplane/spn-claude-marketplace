# Command Vocabulary — Stack-Agnostic

Two command vocabularies belong to the platform rather than to any stack: the **`spnutils` verbs** and the **DevEx stage verbs**. Both mean the same thing in every repo and every language. What *runs* when you invoke one is the stack's business, and it is the only part that differs.

**The verb never forks; only its realization does.** A stack joins by realizing this vocabulary, not by extending it — so an agent that knows these verbs can operate any SaaS Plane repo, including one built on a stack it has never seen. A second stack changes no verb: the groups are the platform's vocabulary, the stack adapters its realizations.

## `spnutils` — the foundation CLI

One CLI serves every stack, in **three groups**. The group says *what kind of thing changes*, which is what keeps the boundary stable as verbs are added:

| Group | Changes | Never |
| --- | --- | --- |
| `repo` | the repository and its remote — creation, convergence to the standard, agent wiring | the content of code, tests, or docs |
| `apps` | the apps domain's nodes — scaffolds, generated sources, conformance, release | repo settings or the estate |
| `infra` | the estate — layers, apps, config, estate packages; **local is the default realization, `--cloud` is asked for by name** | committed code |

### `repo` — the repository and its remote (any repo)

| Verb | Does |
| --- | --- |
| `repo create <name> [--from <org-package>[@version]]` | creates the repository in the bound SCM if absent, then converges it to the standard — branches, protections, team access. Org context from the current repo's pin, or `--from` |
| `repo agent-init` (`ai`) `[--local [path]]` | wires the repo for agents from `sprepo.json` — marketplace, plugins, managed CLAUDE block |
| `repo agent-sync` (`as`) | refreshes what init wired, from `sprepo.json` and installed package state |

There is no `setup` and no `teams-init` — those verbs are retired; creation and convergence are one verb, `repo create`, and it is idempotent.

### `apps` — the apps domain's nodes (`APPS` repos)

| Verb | Does |
| --- | --- |
| `apps scaffold repo --stack <stack> --organization <package[@version]> [--platform <package[@version]>]` | mints the checkout as an APPS repo: `sprepo.json` with the stack claim and couplings, then the workspace skeleton |
| `apps scaffold <kind> [-u --usecase <name>] [-c --code <CODE>]` | a project of a declared kind, with the tree the kind prescribes. The target is the kind in **kebab-case** (`module-server`, `app-utility`, `client-api`); `--usecase` builds the name and `--code` carries the `spkind.json` config value |
| `apps scaffold app-module -a --app <folder> [-u] [-c]` | an app-owned module inside an application |
| `apps gen-validators` (`gvl`) `[-p <package>]` | regenerates contract state validators — after any contract/states edit; never hand-edited |
| `apps gen-barrel` (`gbr`) `[-p <package>]` | regenerates the package's barrel — its public surface |
| `apps gen-labels` (`glb`) `[-p <package>]` | regenerates the label manifest from `translate()` call sites |
| `apps gen-symbols` (`gsy`) `[-p <package>]` | regenerates the symbol index — the public surface the agents read |
| `apps validate [-p <package>] [--json]` | reports where a project disagrees with what its own declared kind requires |
| `apps release [version] [-m <msg>] [--dry-run] [-y --approved] [--json]` | publishes every releasable project at one version, lockstep — routed to the `-public` or `-private` registry pair by each package's scope |

**Every scaffolded node declares itself in `spkind.json` at its root** (decision RD.APPS.029) — never a key in `package.json`, because two places declaring one fact is drift waiting to happen and an app-owned module has no package file to carry a key at all.

**The stack is never typed on an `apps` verb** — it comes from the repo's claim in `sprepo.json`. Only `apps scaffold repo` types it, once, at the moment the claim is made. A flag may override a derivable fact; a silent default never exists.

### `infra` — the estate (local by default; `--cloud` by name)

The layers are **nouns** — `organization` · `platform` · `environment` — and each has `plan` · `up` · `down` · `status`:

| Verb | Does |
| --- | --- |
| `infra organization plan\|up\|down\|status [--cloud]` | the organization layer. Locally, `up` converges the machine's trust bootstrap — the CA, its one trust prompt, the shared ingress |
| `infra platform plan\|up\|down\|status [--cloud]` | the platform layer. Locally, `up` converges org-local prerequisites first, then the platform's container group |
| `infra environment plan\|up\|down\|status --env <env> --cloud` | the environment layer — **cloud only**: the machine is one environment, so no local form exists and targeting it is refused by name |
| `infra app up\|down [-p <package>] [--clean]` | the deployments layer locally: schemas, certs, hosts entry, ingress vhost — the app derived from the cwd, reading its `spkind.json` and env against the pinned platform |
| `infra logs [service] [--cloud]` · `infra show [--json]` | tail the realization's logs; resolve the declaration that reaches this folder and say where it came from |
| `infra config set\|get\|list\|export\|import\|diff\|render` | the seven config verbs against the app plane, addressed by `--scope organization\|platform\|environment [--env <env>] [--app <kindcode>]` — never the ledger, which no person opens |
| `infra scaffold repo\|organization\|platform\|module` | an estate node with the tree its type prescribes — the one authored fact per type stated, everything else derived |
| `infra validate [-p] [--json]` · `infra test [-p]` | structure against the type, manifest against the contract; the render harness |
| `infra release [-p] [--local] [--dry-run] [-y --approved] [--json]` | build then publish an estate package to the org's `-public`/`-private` pair by the name's scope — `--local` stages into the machine store (`~/.spnutils/registry`) instead, and the target is chosen, never derived; the semver read from `spinfrapkg.json`'s `version`, bumped by the reviewed edit |

Hosted vendors are **modules** (`infra-module-{code}`) — their local rendering rides the platform layer's container group; there is no separate vendor verb. Cloud mutation runs only where the declaration is authored, plus CI; in the cloud a missing layer below is a named refusal, never an implicit apply.

### The derivation laws bind every verb

**Nothing contextual is typed**: the stack comes from the repo's claim, the estate from its pins or tree, the registry and every package scope from the organization, the target project from the cwd. A flag may override; absence of both refuses by name; a silent default never exists. There is no whole-estate verb. And a mutation is reviewable or it does not exist: pins bump by editing the manifest, versions are typed by a human, estate publishes run from CI alone.

### Skills and command groups are mapped, not matched

A **skill** names what the Agent was asked to do; a **group** names what is being changed. One rarely covers the other exactly, and expecting the two lists to share names would force every pair to match — which they cannot, because `PROVISION` spans two realizations and `apps` serves three skills.

| Skill | Stage | Drives |
| --- | --- | --- |
| `plan` | `PLAN` | — |
| `scm` | `SCM` | `repo` |
| `develop` | `DEVELOP` | `apps` |
| `test` | `TEST` | `apps` |
| `provision` | `PROVISION` | `infra` — both realizations |
| `deliver` | `DELIVER` | `apps` · `infra --cloud` |
| `operate` | `OPERATE` | `infra --cloud` |
| `check` | — | any — proving a claim against the code is something every stage does |

**The `repo` command group is deliberately not renamed to `scm`** (decision RD.DEVEX.013): the group means repo-level change, which is wider than source control — `apps scaffold repo` scaffolds a repository and `repo agent-init` wires the agent, and neither is an SCM operation.

## The project verbs

Six verbs describe everything a developer does with a project, in any stack:

`dev` · `build` · `lint` · `format` · `test` · `release`

The verb is the platform's vocabulary; the command that realizes it belongs to the stack's toolchain and is documented in that stack's provider set and its plugin. **Ask for the verb, then use the repo's realization of it** — never substitute a raw toolchain invocation where the repo defines the verb, because the repo's version carries the flags, the ordering, and the scoping the toolchain call does not.

## Scope is never guessed

Almost every verb is scoped to something — a package on the `apps` verbs, a project on the project verbs, an app on `infra app up` / `infra app down`. **When the request does not name one and the repo holds more than one, ask before running: this app, this package, or all?**

Do not infer the scope from the last file edited, from what the branch changed, from the most prominent project in the repo, or from what was scoped last time. Both wrong answers cost real time: running the whole workspace when one package was meant burns a long build, and running one package when the workspace was meant reports a green that proves nothing about the rest. Where the answer genuinely is *everything*, the caller is the one who says so.

The same applies to anything destructive, only harder — a reset names its target explicitly or it does not run.

## Standing rules for both vocabularies

- **Never invent a verb.** If a verb does not exist, the operation is not part of the vocabulary yet — say so rather than approximating it with something adjacent.
- **Never report a command you did not run**, and never infer one command's result from another's. A passing build says nothing about conformance.
- **Generated outputs are regenerated, never hand-edited.** Everything a `gen-*` verb writes is derived; the only edit path is the source plus a re-run.
- **Run the regenerating verbs before committing.** A repo whose generated artifacts disagree with their source fails at runtime, not at review.
- **Destructive verbs run only on an explicit instruction.** A local stack is frequently shared; a `--clean` wipes state belonging to work that is not yours.
- **Scope by the project's declared kind.** What `build`, `test`, or a reset actually covers follows from the kind a project declares in its manifest — not from the repo it happens to sit in.
