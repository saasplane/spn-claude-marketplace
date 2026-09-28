# The commands, as the released CLI answers them

**Source:** `commands-ref.ts`, reading the **released** `spnutils` — which is what a partner holds rather than what this checkout builds.

**Nothing here is written by hand.** A command added to the binary changes no document, so no hash would move and nothing would report a hand-written list going stale. That is why this one is produced.

<!-- spn:generated commands — do not edit inside these markers; `commands-ref.ts` writes it -->
Rendered from `spnutils 1.2.77` — the **released** CLI, which is what a partner holds.
Surface `d44f5c7f8b04` — the COMMANDS. A release that adds none leaves it unmoved, so the diff is the version line alone.

#### `apps`

| Command | Does | Options |
| --- | --- | --- |
| `apps build` | Build one node, the way its kind builds | `--json` |
| `apps check` | Typecheck, then lint | `--json` |
| `apps clean` | Remove what a build and an install left behind | `--json` |
| `apps codegen` | Generate from a published surface | `--json` |
| `apps dev` | Run this node from source, watching it | `--json` · `--mode <mode>` |
| `apps format` | Write the formatting and the fixable rules | `--json` |
| `apps gen-barrel` | Generate the package's barrel — its public surface | — |
| `apps gen-labels` | Generate the label manifest (scans translate() call sites -> dist/generated/spn-labels.json) | — |
| `apps gen-symbols` | Generate the symbol index (public surface -> dist/generated/spn-symbols.json) | — |
| `apps gen-validators` | Generate contract state validators | — |
| `apps migrate` | Move this node's migration history — a task, never a run mode | `--json` |
| `apps release` | Publish every releasable project in this repository, at one version (lockstep) — the scope is the repository, never one package | `--dry-run` · `--approved` · `--json` |
| `apps scaffold` | Scaffold a SaaS Plane artifact — a repository, or a project of a declared kind | `--usecase <usecase>` · `--code <code>` · `--scope <scope>` · `--support-version <version>` · `--name <name>` · `--stack <stack>` · `--organization <ref>` · `--platform <ref>` |
| `apps start` | Run what the build produced | `--json` · `--mode <mode>` |
| `apps stop` | Stop what dev or start left running | `--json` |
| `apps test` | Run one tier this node owes or carries, and write what it proved | `--json` · `--phase <phase>` |
| `apps validate` | Check a target against what its kind requires | `--usecase <usecase>` · `--json` |

#### `infra`

| Command | Does | Options |
| --- | --- | --- |
| `infra app down` | Deregister an app | `--clean` |
| `infra app up` | Bootstrap an app: its schemas, certs, /etc/hosts, ingress vhost — for the package you name | — |
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
| `infra release` | Build then publish: validate, test, stage dist/ (spinfrapkg.json + src/), publish the dist whole to the organization's registry pair — or with --local, into this machine's store | `--dry-run` · `--local` · `--approved` · `--json` |
| `infra scaffold module` | A lifecycle module node — identity-only manifest, renderings derived from its tree | `--name <name>` |
| `infra scaffold organization` | The organization node — at most one per repo | `--name <name>` |
| `infra scaffold platform` | A platform node | `--name <name>` |
| `infra scaffold repo` | Mint the checkout as the org's estate repo — the cwd, and what it is called | `--name <name>` |
| `infra show` | Resolve the declaration that reaches this folder and say where it came from — including PINNED @ version per layer | `--json` |
| `infra test` | The render harness — each node's tests/run.sh, where one exists; its exit code is the verdict | — |
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
