---
name: scm
description: The repository and project standard - what a project must declare, what its declaration decides, and how repos, branches, and wiring are standardized. Use when creating a repo or project, adding a package or app, judging where code belongs, or fixing a project that does not match its own kind. Stack-agnostic; the stack plugin supplies the scaffold and validate commands.
---

# scm — one declaration decides the rest

**Every node declares exactly one kind, in `spkind.json` at its root, and everything derivable from that kind is never declared again.** Runtime, toolchain profile, structure, packaging, and whether the project publishes at all — all follow. A node without a kind is unfinished; a node that restates what its kind already implies has introduced a second source of truth. A folder with `spkind.json` and `docs/` **is** a node — which is how a module living inside an app is validated and scaffolded exactly like the packaged form.

## The kind decides, and it decides once

| Derived from the kind | Never re-declared per project |
| --- | --- |
| **Runtime** — server, web, or universal | where the artifact runs |
| **Structure profile** — the folders the kind requires | the layout |
| **Toolchain profile** — build, lint, test configuration | the tool wiring |
| **Publishing** — whether it ships to a registry at all | the release behavior |

Apps are deployed, not installed, so they publish nothing. A generated API client publishes nothing about itself either — its types are its index. Both absences are deliberate: an empty artifact would claim a surface that does not exist.

Kinds exist only for runtimes a stack actually covers. A stack that covers only the server side has no web kinds, and a requirement outside its coverage is answered *out of coverage*, never silently skipped.

## Never hand-build layout

1. **Scaffold** — the stack's scaffold verb writes the structure the kind requires and sets the manifest key. Copying an existing project by hand reproduces its accidents along with its shape.
2. **Validate** — the stack's validate verb walks every project and reports where one disagrees with what its own declared kind requires. It exits non-zero on findings and changes nothing on disk.
3. **Apply the remedy the finding names.** Each message names the rule *and* its remedy; inventing a different fix is how a workspace ends up with two conventions.

Run validate after any structural change, not only after scaffolding — it is the only mechanical check that a project still is what it says it is.

## Where code goes

The layer model is the same in every stack and every kind:

- **contract** — the module's public surface. The only thing another module may see.
- **app** — the implementation behind it. Invisible across modules, reachable only through the contract.
- **entry** — transport adapters over the contract. One folder per transport, each parsing input into a command, invoking the same service, rendering the returned state.

A package organized by feature rather than by layer — a support library — has no contract layer to implement behind, because its exports *are* its contract. That is a property of what it is for, not an exemption from the model.

**Keep tests in their own tree, never beside the code they test.** A test co-located with an implementation ships with it, or gets excluded by a rule that then has to be maintained.

## Wiring a repo for agents

`agent-init` registers the plugin marketplace, enables the plugins, writes a managed block in the repo's instruction file, and generates the local inventory. `agent-sync` refreshes that wiring afterwards. Neither parses code — both are pure reference refreshes from the manifests and workspace state.

**A stack-agnostic verb reads SPN manifests and nothing else.** `sprepo.json` gives the world and the stack claim, `spkind.json` names an apps node, and `spinfrapkg.json` with `src/spestate.json` names an estate node. Everything a stack invents sits **behind the claim** — a package manifest, a lockfile, an installed-dependency tree. A verb that reaches for one unasked refuses the first repo that does not carry it. The node inventory is a **per-world** question rather than a per-stack one: an estate repo declares its packages too, and it must open with them listed.

**The plugin set is derived from the manifest, never typed.** `FOUNDATION` takes the core plugin, `INFRA` takes core plus the estate plugin, and an `APPS` repo takes core plus the plugin matching its stack claim. A repo with no claim at all falls back to the core plugin alone.

**Do not hand-edit inside the managed markers**, and do not restate a plugin's rules in a repo's instruction file. A repo's own file carries only what is true of that repo alone.

## The workspace, one level above the repo

A repo is wired by `repo`; the folder the repos sit in is minted by `workspace`. They are different levels with different writers, and the workspace level is the one people forget exists.

| Verb | Does | Touches |
| --- | --- | --- |
| `workspace init` | mints the folder — the permission floor, the marketplace, the state directory, the engine check | the workspace root |
| `workspace sync` | brings the floor back to what the members imply | the workspace root |
| `workspace status` | the orientation — members, world, wiring, every workstream, and any split-plan row still unlanded | reads only |

**There is no workstream verb, and adding one is a defect.** Opening a subject is `mkdir`, listing what is open is what `status` already reports, and the close is a gate rather than a command.

### When work earns a workstream

A workstream is `.spndevex/workstreams/{state}/{NNN}-{subject}/`, and its state is the folder it sits in — `backlog/` parked, `open/` being worked, `closed/` accounted for. **It is never a Claude Code session**: Claude Code owns the window, and `SessionStart` is its hook.

**Three tells, and any one is enough.** Work earns a workstream when it needs an argument before it can be built, when it crosses more than one repo, or when it outlives one sitting. Everything else is just work you do, and a workstream minted for a one-file change is overhead nobody reads.

**A new one takes the next free number across all three states.** The number is assigned once in creation order, and nothing reuses or renumbers it.

**The starting state is a conversation, never a default.** The developer may simply say *backlog* or *open*. When they do not, propose one and say why — never silently, and never as an open question.

| Propose | When | The tell |
| --- | --- | --- |
| **`open/`** | it can be started now | nothing blocks it — no unanswered card, no trigger, no workstream it waits on |
| **`backlog/`** | it cannot be started yet | it waits on a trigger, on another workstream, or on questions nobody answered — **and you can name the blocker** |

**Name the blocker, or the proposal is `open/`.** *Feels like later* is not a blocker, and a backlog nobody can explain is where work goes to be forgotten. The developer confirms or overrides in one word, because scope is theirs.

**Moving `backlog/` to `open/` is how work starts.** It needs no ceremony, it is not a close, and no gate fires on it. Read `refs/cross-repo.md` for the full shape, the worked examples, and the two gates a workstream carries.

## The lines that hold

- **One kind per project, declared in the manifest, never inferred from the folder it sits in.**
- **A directory name is not a declaration.** Naming a folder after a kind does not make a project that kind, and validate will say so.
- **Structure is a rule, not a preference.** Where a project deviates, either the project is fixed or the kind's profile changes deliberately — never a local exception that the next reader has to learn.
- **A new kind is a recorded decision**, not an addition someone makes while scaffolding.

## Repo tasks — invoke, never reconstruct

A repository's own operations live in `tasks/` — one file per task, reached through a declared `task:<name>` entry point. Each file opens with what it does, what it gates on, and what it mutates.

- **Read the header and run the task.** Reassembling its steps by hand bypasses every gate inside it — the build, the test, the confirmation before anything is published or provisioned.
- **The repo's own instructions name its tasks.** A task that is not listed there is invisible; if one exists and is unlisted, say so rather than inventing an invocation.
- **Never create a task on your own.** If the work looks like it wants one, say so — what it would do, what it would gate on, what it would mutate — and let the developer decide. A task is a repository's own machinery, and adding one is their call; once approved it belongs to every agent that follows.
- **What generalizes is not a task.** Codegen is `spnutils apps`, local infrastructure is `infra`, repo standardization is `repo`; `tasks/` holds only what this repository alone needs.

## Lenses

Wear `refs/lenses/lead.md` when shaping repo standards and process — the paved road, the branch model, and the ladder are its checks.

