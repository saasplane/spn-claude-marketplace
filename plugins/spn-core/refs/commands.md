# Command Vocabulary — Stack-Agnostic

Two command vocabularies belong to the platform rather than to any stack: the **`spnutils` commands** and the **DevEx stage skills**. Both mean the same thing in every repo and every language. What *runs* when you invoke one is the stack's business, and it is the only part that differs.

**The command never forks; only its realization does.** A stack joins by realizing this vocabulary, not by extending it. So an agent that knows these commands can operate any SaaS Plane repo, including one built on a stack it has never seen. A second stack changes no command: the groups are the platform's vocabulary, the stack adapters its realizations.

## `spnutils` — the foundation CLI

One CLI serves every stack. The group says *what kind of thing changes*, which is what keeps the boundary stable as commands are added — a new command joins a group rather than minting one:

| Group | Changes | Never |
| --- | --- | --- |
| `repo` | the repository and its remote — creation, convergence to the standard, agent wiring | the content of code, tests, or docs |
| `apps` | the apps domain's nodes — scaffolds, generated sources, conformance, release | repo settings or the estate |
| `infra` | the estate — layers, apps, config, estate packages; **local is the default realization, `--cloud` is asked for by name** | committed code |
| `workspace` | the level above the repository — the floor's permission tiers, the plugin union, the machine env seat, and `.spndevex/` | anything inside a repository |

<!-- spn:generated commands — do not edit inside these markers; `commands-ref.ts` writes it -->
Rendered from `spnutils 1.2.68` — the **released** CLI, which is what a partner holds.
Surface `4f84135ac03d`. A release that adds no command leaves that unchanged and owes no regeneration.

#### `apps`

| Command | Does | Options |
| --- | --- | --- |
| `apps build` | Build one node, the way its kind builds | `--package <package>` · `--json` |
| `apps check` | Typecheck, then lint | `--package <package>` · `--json` |
| `apps clean` | Remove what a build and an install left behind | `--package <package>` · `--json` |
| `apps codegen` | Generate from a published surface | `--package <package>` · `--json` |
| `apps dev` | Run this node from source, watching it | `--package <package>` · `--json` · `--mode <mode>` |
| `apps format` | Write the formatting and the fixable rules | `--package <package>` · `--json` |
| `apps gen-barrel` | Generate the package's barrel — its public surface | `--package <package>` |
| `apps gen-labels` | Generate the label manifest (scans translate() call sites -> dist/generated/spn-labels.json) | `--package <package>` |
| `apps gen-symbols` | Generate the symbol index (public surface -> dist/generated/spn-symbols.json) | `--package <package>` |
| `apps gen-validators` | Generate contract state validators | `--package <package>` |
| `apps migrate` | Move this node's migration history — a task, never a run mode | `--package <package>` · `--json` |
| `apps release` | Publish every releasable project in this repository, at one version (lockstep) — the scope is the repository, never one package | `--dry-run` · `--approved` · `--json` |
| `apps scaffold` | Scaffold a SaaS Plane artifact — a repository, or a project of a declared kind | `--usecase <usecase>` · `--code <code>` · `--scope <scope>` · `--support-version <version>` · `--app <folder>` · `--name <name>` · `--stack <stack>` · `--organization <ref>` · `--platform <ref>` |
| `apps start` | Run what the build produced | `--package <package>` · `--json` · `--mode <mode>` |
| `apps stop` | Stop what dev or start left running | `--package <package>` · `--json` |
| `apps test` | Run one tier this node owes or carries, and write what it proved | `--package <package>` · `--json` |
| `apps validate` | Check a target against what its kind requires | `--usecase <usecase>` · `--app <folder>` · `--json` |

#### `infra`

| Command | Does | Options |
| --- | --- | --- |
| `infra app down` | Deregister an app | `--package <package>` · `--clean` |
| `infra app up` | Bootstrap an app: its schemas, certs, /etc/hosts, ingress vhost — the app derived from the cwd | `--package <package>` |
| `infra config diff` | Compare two environments' answered keys — a peer baseline, never a truth claim | `--json` |
| `infra config export` | ONE prefix as a plain JSON object — authored values, references unexpanded. A working file, never a committed one. | `--scope <scope>` · `--env <env>` · `--app <kindcode>` |
| `infra config get` | Read one key at a prefix | `--scope <scope>` · `--env <env>` · `--app <kindcode>` |
| `infra config import` | Bulk upsert one prefix from a plain object, each key through set's guards — deleting nothing | `--dry-run` · `--approve` · `--scope <scope>` · `--env <env>` · `--app <kindcode>` |
| `infra config list` | Read the app plane at a prefix | `--json` · `--scope <scope>` · `--env <env>` · `--app <kindcode>` |
| `infra config render` | The composed environment exactly as the deploy materializes it, secrets masked — table or --json, never an executable form | `--json` |
| `infra config set` | Write keys into the app plane at the derived prefix | `--scope <scope>` · `--env <env>` · `--app <kindcode>` |
| `infra domain register` | Proxy one or more hosts to a local dev server — TLS (local CA), /etc/hosts, ingress vhost | `--port <port>` · `--app <kind-code>` · `--deployment <code>` · `--unit <name>` · `--cors` · `--no-websocket` |
| `infra domain unregister` | Remove a registered unit (ingress vhost, /etc/hosts block) — by --code, or by a single host | `--unit <name>` · `--clean` |
| `infra environment down` | Take the environment layer down. Say --plan or --apply. A layer operation never destroys a stateful resource — --clean is how you ask for that, separately. | `--cloud` · `--local` · `--plan` · `--apply` · `--approve` · `--clean` |
| `infra environment status` | What is running | `--cloud` · `--local` · `--json` |
| `infra environment up` | Stand the environment layer up — locally by default. Say --plan or --apply. | `--cloud` · `--local` · `--plan` · `--apply` · `--approve` · `--json` |
| `infra logs` | Tail the realization's logs (optionally one service) | `--cloud` · `--local` |
| `infra organization down` | Take the organization layer down. Say --plan or --apply. A layer operation never destroys a stateful resource — --clean is how you ask for that, separately. | `--cloud` · `--local` · `--plan` · `--apply` · `--approve` · `--clean` |
| `infra organization status` | What is running | `--cloud` · `--local` · `--json` |
| `infra organization trust-ca` | Trust the machine CA in the system keychain — what `up` does as part of the local trust bootstrap | `--force` |
| `infra organization up` | Stand the organization layer up — locally by default. Say --plan or --apply. | `--cloud` · `--local` · `--plan` · `--apply` · `--approve` · `--json` · `--reset-certs` |
| `infra platform down` | Take the platform layer down. Say --plan or --apply. A layer operation never destroys a stateful resource — --clean is how you ask for that, separately. | `--cloud` · `--local` · `--plan` · `--apply` · `--approve` · `--clean` |
| `infra platform status` | What is running | `--cloud` · `--local` · `--json` |
| `infra platform up` | Stand the platform layer up — locally by default. Say --plan or --apply. | `--cloud` · `--local` · `--plan` · `--apply` · `--approve` · `--json` |
| `infra release` | Build then publish: validate, test, stage dist/ (spinfrapkg.json + src/), publish the dist whole to the organization's registry pair — or with --local, into this machine's store | `--package <package>` · `--dry-run` · `--local` · `--approved` · `--json` |
| `infra scaffold module` | A lifecycle module node — identity-only manifest, renderings derived from its tree | `--name <name>` |
| `infra scaffold organization` | The organization node — at most one per repo | `--name <name>` |
| `infra scaffold platform` | A platform node | `--name <name>` |
| `infra scaffold repo` | Mint the checkout as the org's estate repo — the cwd, and what it is called | `--name <name>` |
| `infra show` | Resolve the declaration that reaches this folder and say where it came from — including PINNED @ version per layer | `--json` |
| `infra test` | The render harness — each node's tests/run.sh, where one exists; its exit code is the verdict | `--package <package>` |
| `infra validate` | Check a target against what its type requires | `--json` |

#### `repo`

| Command | Does | Options |
| --- | --- | --- |
| `repo agent-sync` | Converges this repo for SaaS Plane agents: the marketplace registration, the plugins its sprepo.json implies, the managed CLAUDE.md block and the generated rules beside it, and any installed plugin that has drifted from the marketplace. One path, whether the repo was wired before or not | — |
| `repo create` | Create the repository in the bound SCM if absent, then converge it — branches, protections, team access | `--from <ref>` |

#### `workspace`

| Command | Does | Options |
| --- | --- | --- |
| `workspace agent-sync` | Re-converge the floor, then run repo agent-sync in every discovered member. Reports what drifted rather than fixing it silently | — |
| `workspace init` | Mint this folder as a DevEx workspace: the marketplace, the plugin union, the permission tiers, ~/.spnenv and .spndevex/. Converges on a re-run, and wires every member repo too | — |
| `workspace status` | The orientation — members, the law each carries, its wiring, what it owes, and the workstreams in backlog, open and closed | `--json` |
| `workspace timings` | What the agent's own machinery costs — the hook checks, and the interpreter start beside them. Recording is off until you ask for it | `--on` · `--off` |
<!-- /spn:generated -->

**Every scaffolded node declares itself in `spkind.json` at its root** (decision RD.APPS.029) — never a key in `package.json`. The reason: two places declaring one fact is drift waiting to happen, and an app-owned module has no package file to carry a key at all.

**The stack is never typed on an `apps` command** — it comes from the repo's claim in `sprepo.json`. Only `apps scaffold repo` types it, once, at the moment the claim is made. A flag may override a derivable fact; a silent default never exists.

**`infra` layers are nouns, and local is the default realization.** `--cloud` is asked for by name. Cloud mutation runs only where the declaration is authored, plus CI; in the cloud a missing layer below is a named refusal, never an implicit apply. Hosted vendors are **modules** (`infra-module-{code}`) — their local rendering rides the platform layer's container group, and there is no separate vendor command.

**`repo create` is creation and convergence in one idempotent command.** There is no `setup` and no `teams-init`; both are retired.

### The derivation laws bind every command

**Nothing contextual is typed**: the stack comes from the repo's claim, the estate from its pins or tree. The registry and every package scope come from the organization, the target project from the cwd. A flag may override; absence of both refuses by name; a silent default never exists. There is no whole-estate command. And a mutation is reviewable or it does not exist: pins bump by editing the manifest, versions are typed by a human, estate publishes run from CI alone.

### Skills and command groups are mapped, not matched

A **skill** names what the Agent was asked to do; a **group** names what is being changed. One rarely covers the other exactly, and expecting the two lists to share names would force every pair to match. They cannot, because `PROVISION` spans two realizations and `apps` serves three skills.

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

**The `repo` command group is deliberately not renamed to `scm`** (decision RD.DEVEX.013): the group means repo-level change, which is wider than source control. `apps scaffold repo` scaffolds a repository and `repo agent-sync` wires the agent, and neither is an SCM operation.

## The project commands

Six commands describe everything a developer does with a project, in any stack:

`dev` · `build` · `lint` · `format` · `test` · `release`

The command is the platform's vocabulary; what realizes it belongs to the stack's toolchain and is documented in that stack's provider set and its plugin. **Ask for the command, then use the repo's realization of it** — never substitute a raw toolchain invocation where the repo defines the command. The repo's version carries the flags, the ordering, and the scoping the toolchain call does not.

## Scope is never guessed

Almost every command is scoped to something — a package on the `apps` commands, a project on the project commands, an app on `infra app up` / `infra app down`. **When the request does not name one and the repo holds more than one, ask before running: this app, this package, or all?**

Do not infer the scope from the last file edited, from what the branch changed, from the most prominent project in the repo, or from what was scoped last time. Both wrong answers cost real time. Running the whole workspace when one package was meant burns a long build. Running one package when the workspace was meant reports a green that proves nothing about the rest. Where the answer genuinely is *everything*, the caller is the one who says so.

The same applies to anything destructive, only harder — a reset names its target explicitly or it does not run.

## Standing rules for both vocabularies

- **Never invent a command.** If a command does not exist, the operation is not part of the vocabulary yet — say so rather than approximating it with something adjacent.
- **Never report a command you did not run**, and never infer one command's result from another's. A passing build says nothing about conformance.
- **Regenerate generated outputs, never hand-edit them.** Everything a `gen-*` command writes is derived; the only edit path is the source plus a re-run.
- **Run the regenerating commands before committing.** A repo whose generated artifacts disagree with their source fails at runtime, not at review.
- **Run a destructive command only on an explicit instruction.** A local stack is frequently shared; a `--clean` wipes state belonging to work that is not yours.
- **Take the scope from the project's declared kind.** What `build`, `test`, or a reset actually covers follows from the kind a project declares in its manifest — not from the repo it happens to sit in.
