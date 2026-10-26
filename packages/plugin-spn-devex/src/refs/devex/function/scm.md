<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/01-function/02-scm.md",
      "seen": "e0f5cfde"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/02-scm.md",
      "seen": "e034aa49"
    }
  ]
}
-->

# Source Control — Stack-Agnostic

What a repository declares about itself, the branches every repository carries, how a change moves up and what stops it, the delivery path every repository carries, and the shape of a repo task. Apply this in any stack and in any repository. Source of truth: the foundation's `02-constructs/01-devex/01-function/02-scm.md` and `04-capabilities/01-devex/01-function/02-scm.md`. Where this restatement and those disagree, the sources win and this file is regenerated.

## The stages, and where this one sits

Engineering work moves through eight DevEx stages: `BOOTSTRAP · SCM · IDEATE · DEVELOP · TEST · PROVISION · DELIVER · OPERATE`. `SCM` is the second, and it comes right after `BOOTSTRAP` because every stage after it assumes the repository already exists and is already standard. A repository is standardized the moment it exists — branches, protections, team access and agent wiring are applied when it is created, never after the first review goes wrong.

**A SaaS Plane stage and a DevEx stage are different words for different things, and both survive in this book.** A SaaS Plane stage is a link in the chain that builds and ships a platform — the foundation, the support packages, a product's own modules, a partner's work, the launchpad. A DevEx stage is a phase of engineering work, and `SCM` is one of the eight. Write both in full where either could be read.

Everything mechanical here is a command. One command creates a repository and brings it to the standard, and running it again on a repository that is already correct changes nothing. You never answer "is this repository set up properly?" by reading a wiki page — you run the command and read what it reports.

## What a repository declares about itself

A repository carries exactly one manifest at its root, `sprepo.json`, and nothing else identifies it. Everything beneath the root is a node — a package, an application, an estate declaration — and every node declares what it is in its own manifest. **Roots are never nodes.** You never find a second `sprepo.json` further down.

The manifest names the repository's **world**, and a world is defined by what it grants, never by what it lacks.

| World | What it is | What its nodes declare |
| --- | --- | --- |
| `FOUNDATION` | states the standards — the book, and the providers that realize it | nothing; the root itself is the corpus |
| `APPS` | realizes the standards as one repository holding a stack's projects | `spkind.json`, one of the declared kinds |
| `INFRA` | provisions for the stacks — an estate, or the shared material behind one | `spestate.json`, one of the estate types |
| `GENERAL` | no nodes and one docs tree; it answers to no stack | nothing beneath it declares a kind |

**A repository with no manifest is a finding, never a state you infer around.** Treat a missing `sprepo.json` as a gap to close, not as a blank you fill in with a guess about what the repository probably is. Absence is the right signal in exactly one place: a repository you were not given is genuinely not there. It is the wrong signal for a repository sitting in your workspace with an opinion about itself.

### The other manifests, and the one that only looks like one of them

Three files carry identity, each read by exactly one system: `sprepo.json` at the repository root, `spkind.json` at an apps node's root, `spestate.json` at an estate node's root. **No system reads another system's file.**

`spinfrapkg.json` shares the naming family and is easy to mistake for a fourth. It is not one. The release and reference-resolution machinery reads it and nothing else does, and it never decides what a node is — it says what an artifact publishes.

### What an apps repository claims, and what it is coupled to

Only an `APPS` repository carries a non-null `config`. Every other world writes `config: null`, because there is nothing there for a claim to be about.

```jsonc
{
  "type": "APPS",
  "name": "Platform",
  "config": {
    "mtype": "APPS",
    "stack": "TS",
    "infra": {
      "organization": { "package": "@spn/infra-organization", "version": "1.2.0" },
      "platform":     { "package": "@spn/infra-platform-dmo", "version": "0.3.0" }
    }
  }
}
```

Two different things live in that block, and confusing them is the mistake you will see most often. The **stack claim** says which toolchain the repository builds in; the organization's own declaration is what grants it. The **couplings** are package references — the organization reference is always required, and the platform reference is a coupling, never a grant. Naming a platform does not gain the right to deploy; deploy rights stay in the platform's own rows, where they are reviewed. Write `"platform": null` when nothing here deploys, and the meaning is exact.

**There is no demand file.** Nowhere in a code repository do you write what the estate must give you — a grant belongs where it is reviewed. A package reference follows one grammar everywhere: a name starting with `@` is published and `version` is required; anything else is a path to a sibling checkout and `version` is `null`. A path reference resolves only where the sibling checkout exists, which is every workspace and deliberately not a pipeline.

## The branches every repository carries

Every repository uses the same four permanent branches. Work flows strictly upward, and only by pull request. `spnutils repo create` sets up all four and their rules in every repository, and nothing declares which of them a team uses: no manifest key and no estate field. The path is chosen at each promotion, so `develop` to `main`, `develop` to `qa` to `main`, `develop` to `uat` to `main` and `develop` to `qa` to `uat` to `main` are all supported. A branch a team does not use stays, protected, and nothing passes through it.

```text
feat/NNN-subject · fix/* · chore/*  ──►  develop  ──►  qa  ──►  uat  ──►  main
      a promotion goes from a permanent branch to any permanent branch above it, and skips none of the checks
      hotfix/<subject>  ── cut from main, or uat or qa ──►  a pull request back into its source
      back-merge: main ──► uat ──► qa ──► develop   (into each branch below the fix, in order)
```

| Branch | Role | Gate owner | Deploys to |
| --- | --- | --- | --- |
| `develop` | integration, and the default branch | Engineering | the environment row that claims it as a branch trigger |
| `qa` | engineering and test verification | Quality engineering | whatever environment claims it, if the platform declares one |
| `uat` | business acceptance | Business | the environment row that claims it, if the platform declares one |
| `main` | the release line | Release approval | never by a merge — a production environment promotes an approved release tag from a lower one |

**`main` is the one branch that surprises people.** Nothing deploys to production because a merge arrived there. A merge into `main` produces a release line, and a production environment promotes an approved release tag from an environment that already runs it — that is the difference between a branch being the trigger and a branch being the record.

### How a change moves up

1. Open the worktree set. `spnutils workspace worktree add <NNN>` cuts the workstream's branch, `feat/<NNN>-<subject>`, from a fresh `origin/develop` in each repository the workstream's rows name. The set lives at `.worktrees/<NNN>-<subject>/` in the workspace, and the main checkouts stay on `develop`.
2. Commit on the workstream's branch. Every arc of the workstream commits there, by path. A commit on `develop`, `qa`, `uat` or `main` is refused.
3. Rebase and push. The branch rebases onto `origin/develop` before every push. The agent's push is checked for the offline test tiers of each node it carries.
4. Open the pull request into `develop`. The first push opens one pull request for the repository, and it stays open for the workstream. At least one approval is required, and new commits dismiss stale approvals. Every check the repository's world requires runs on the pull request, and it cannot merge while one fails.
5. Merge, and let the environment that watches `develop` take it. The pull request is rebase-merged each time an arc lands a group of rows, so each row's commit stays as it was written. The environment that watches `develop` is named in the estate's declaration, never in your repository.
6. Choose the path, and promote with one command. `spnutils repo promote <to> [--from <branch>]` opens one pull request from `<from>` to `<to>` and merges it by a merge commit once its required checks are met. `<to>` is `qa`, `uat` or `main`, and `--from` is `develop` unless you name another permanent branch below `<to>`. So `develop` to `main` is `repo promote main`; `develop` to `qa` to `main` is `repo promote qa`, then `repo promote main --from qa`; the paths through `uat` run the same way. Quality engineering holds the `qa` gate and the business decides at `uat`, for the teams whose path goes through them. A promotion reruns no check, because its head is a commit that passed its checks on `develop`, and the command checks that the files merged equal that tested commit. The agent names the path before it promotes, and asks which branch a change goes to when you have not said, because where a change goes is a release decision and it is the developer's.
7. Cut a release from `main`, and promote the built artifact into production from the environment that proved it. A release is cut only from a clean tree at `origin/main`.
8. Remove the set. `spnutils workspace worktree remove <NNN>` removes the worktree set once the work is on origin.

**A permanent branch takes a merge only from a permanent branch below it, or from a hotfix, and `main` never from a feature branch — MUST.** The path between them is the team's choice at each promotion, no path skips a check, and there is no exception for urgency: an urgent fix takes its own short path, `hotfix/<subject>`, and never a skipped check.

### The protection rules

Protection rules are not conventions a team agrees to follow. They are protection rules the repository host enforces on every branch, applied as state a command converges rather than as a habit somebody remembers.

- Every change **MUST** arrive by pull request, with at least one approval and its code owner's review, and new commits **MUST** dismiss stale approvals. There are no direct pushes.
- Every check the repository's world requires **MUST** pass before a pull request merges. Each check is bound to GitHub Actions, so only a job can meet it, never a status somebody posts.
- A permanent branch **MUST** take a merge only from a permanent branch below it or from a hotfix, and each promotion goes by the path chosen for it. Which of `qa` and `uat` a change passes through is the developer's release decision.
- Each promotion **MUST** merge by a merge commit, and `main` **MUST** take merge commits from `develop`, `qa`, `uat` or a `hotfix/*`, never from a feature branch.
- A permanent branch **MUST NOT** be deleted or force-pushed.
- A `hotfix/<subject>` **MUST** be cut from `main` for production, or from `uat` or `qa` where only that environment needs the fix, never from `develop`, because `develop` may hold work still in the pipeline. It **MUST** be tested in its own pull request back into the branch it came from, and merged by a merge commit. `spnutils repo backmerge <branch>` **MUST** then merge the fixed branch into each permanent branch below it, in order, down to `develop`, skipping one that already holds the fix. Skip the merge down and the next change promoted from `develop` quietly removes the fix — the outage returns with no sign of why.

**Two access tiers exist, and nothing between them.** `git-admin` grants write access, and may bypass review only by merging a pull request (`bypass_mode: pull_request`), never by pushing; the host records every bypass. `git-dev` grants write access with no bypass at all, for everyone doing ordinary work. **Neither tier bypasses a required check — MUST.** A middle tier would be a way to be partly exempt, which is a state nobody can reason about during an incident.

**Each branch carries two rulesets, because a bypass actor reaches every rule in its ruleset.** `<branch>-protection` holds review and the branch rules (on `main`, that only `develop`, `qa`, `uat` and a `hotfix/*` merge into it), and `git-admin` may bypass it by pull request. `<branch>-checks` holds the required checks and has no bypass actor, so a failing check blocks the merge for every caller, administrators included. Review keeps its bypass because GitHub never lets an author approve their own pull request: with one member, a review nobody may bypass would block every merge. A solo merge still arrives by pull request, passes every check and is recorded, and review becomes real the day a second member joins, with no change to any ruleset.

## The delivery path

Every repository carries three files that make its delivery path evidence: what runs on every change, who reviews what, and how a weakness is reported. `spnutils repo agent-sync` writes all three from the repository's world, each whole and only when its content changes; `spnutils workspace agent-sync` writes them in every member. Each lands through a pull request, and lands before `repo create` requires its checks, so no pull request waits on a check that does not exist yet.

| File | Holds |
| --- | --- |
| `.github/workflows/checks.yml` | one job for each check the world requires, run on a pull request into `develop`, on a pull request whose head is a `hotfix/*` branch, and on a push to `develop`, and on nothing else |
| `.github/CODEOWNERS` | `git-dev` owns every path; `git-admin` owns `.github/`, `SECURITY.md` and `sprepo.json`, the files that decide how code is checked, reviewed and reported |
| `SECURITY.md` | how to report a weakness, what happens next and by when, restating the trust chapter's findings rule |

**A job's id is the name of the check the rulesets require**, so one list per world answers both the workflow and the ruleset.

| Check | What it runs | `APPS` | `INFRA` | `FOUNDATION` | `GENERAL` |
| --- | --- | --- | --- | --- | --- |
| `test` | the stack's tiers that need no running stack: unit and component in TS; `spnutils infra test` in an estate | runs | runs | — | runs where the root declares a `test` script |
| `lint` | each project's check target, which typechecks and lints, in TS; `tofu fmt -check` in an estate | runs | runs where the repository holds modules | — | — |
| `code-scan` | Semgrep CE with its default rules, failing on any finding | runs | — | — | runs |
| `dependency-scan` | OSV-Scanner over every lockfile in the tree | runs | — | — | runs |
| `secret-scan` | TruffleHog over the commits the change adds | runs | runs | runs | runs |
| `stack-scan` | the local stack of the platform the repository pins, then the contract tier, the live integration cases and the journey tier against it, then ZAP's baseline scan of each app the repository ships | runs | — | — | — |
| `cis-scan` | Checkov's Terraform checks, the CIS AWS Foundations Benchmark's among them, over the modules | — | runs where the repository holds modules | — | — |

- **A check that cannot fail is not written — MUST.** A `FOUNDATION` repository holds no code, so it runs only the secret scan. An `INFRA` repository with no modules gets no `lint` and no `cis-scan`, because a check over nothing passes and proves nothing. An `APPS` repository whose platform names none of its apps gets no `stack-scan`, and keeps every other check.
- **A tier that needs a running stack stays out of `test`.** The contract, integration and journey tiers call running servers, so they run in the `stack-scan` job that stands the local stack, before the scan of the running apps.
- **Every action is pinned by its commit and every image by its digest, with its release written beside it — MUST.** A tag can be moved to other code after it was reviewed, and a commit cannot. `spnutils` is installed at a named release. The workflows a repository already runs — a release, a site deploy, an estate's plan and apply — follow the same rule.
- **`SECURITY.md` names a security address only where an organization reaches the repository.** The workspace sweep passes the estate's organization to the members nothing else connects to it.
- **A plan that enforces no rulesets is named, never hidden.** The files still land and every check still runs and reports, but nothing blocks a merge, so `repo create` names both rulesets as not enforced and the plan as the reason.

### A hotfix takes its own short path

1. Cut `hotfix/<subject>` from the branch that needs the fix: `main` for production, or `uat` or `qa` where only that environment needs it, never `develop`. `spnutils workspace worktree add <NNN> --from <branch>` opens the worktree set on it.
2. Test it in its own pull request back into the branch it came from. The checks workflow runs on it, so every required check of the world runs on a clean runner against the code that is running, stack tiers included.
3. Merge by a merge commit. `main` takes a `hotfix/*` as it takes a promotion from `develop`, `qa` or `uat`, and never a feature branch.
4. Cut the release from `main`, the same way an ordinary release reaches production.
5. Merge down with `spnutils repo backmerge <branch>`, into each permanent branch below the one the fix landed on, in order, down to `develop`, each a pull request merged by a merge commit. A branch that already holds the fix is skipped and said so. The pull request into `develop` runs develop's checks, because the fix beside develop's newer work has not been tested together. A conflict stops the command and comes to the developer.

**Step five is the one people skip.** The agent's push check, on a hotfix branch, reads the range `origin/<base>..HEAD`, where `<base>` is the branch it was cut from. Speed here comes from a smaller batch, never from fewer gates.

### Where each check runs

A check runs at the first step that can run it and at no later one.

| Step | What runs | Who runs it |
| --- | --- | --- |
| Commit | the typecheck and lint of the projects the change touches; a commit on a permanent branch is refused | the repository's own commit hook, and the agent's hook for the refusal |
| Push | the offline test tiers of each node the pushed commits touch, on the tree at the pushed commit | the agent's hook on its own push |
| Pull request into `develop` | every required check of the repository's world, on a clean runner | GitHub Actions |
| Pull request from a `hotfix/*` back into its source branch | every required check of the world, on a clean runner, against the code that is running | GitHub Actions |
| Back-merge pull request into `develop` | develop's checks | GitHub Actions |
| Promotion | nothing; the pull request's head already passed its checks on `develop` | `spnutils repo promote` |
| Release | the clean tree, the tree at `origin/main` and the release gate's full pass | the release command |

## Where a branch deploys, and what promotes

**A repository never states where its code runs.** Each environment in the estate's own declaration states what starts a deployment into it, as data rather than as a convention anybody has to remember:

```jsonc
"environments": [
  { "setup": "dev",  "region": "in", "workload": "NP",
    "hosting": "CLUSTER", "deploy": { "mtype": "BRANCH", "branch": "develop" } },
  { "setup": "live", "region": "in", "workload": "PROD",
    "hosting": "MANAGED", "deploy": { "mtype": "TAG_APPROVAL", "promotesFrom": "in-dev" } }
]
```

**A branch may be claimed by at most one environment in a platform.** Without that limit a single merge would fan out to several places and "what is running where" would stop having an answer. A release tag carries no such limit — one approved release reaches every production region at once. A branch no row claims needs no explanation: it gates without deploying, which is ordinary.

**An artifact is built exactly once, from one commit, and the same content is what reaches production — MUST.** Its identity is a digest, a hash of the artifact itself. Tags are labels put on a digest over time; they never change what the artifact is. Promotion moves the digest forward and never rebuilds it — a rebuild is a different artifact even from the same commit, and a different artifact invalidates every test that ran against the old one.

## The version a repository releases

A repository releases as one version, and every project it holds carries that version — repositories release independently of one another. Any two artifacts carrying the same version were built and tested together.

**The release tag is the only record of the version.** Cutting a release edits no file. In the tree, manifests carry a placeholder version and internal dependencies use the workspace protocol; the release stamps the real number into the published artifact at publish time. A working tree reads as a development version, and a source manifest still holding a real version stops the run before anything is built. A release is cut only from `main`, from a clean tree at `origin/main`, the commit it tags.

## Repo tasks — what they are, and what they are not

Some work belongs to one repository and nowhere else: the scripted release its packages need, the sandbox its integration tests expect, the one-off migration a schema change requires. It is not product code, not a test, not generated, and not infrastructure. **A repo task is that operation, declared as a unit so you invoke it rather than reconstruct it.** It lives in `tasks/`, and adding one is a decision the repository's owners make, never a convenience you grant yourself.

| Rule | Weight |
| --- | --- |
| One file per task, named for its verb and its object, reached through one declared `task:<name>` entry point | MUST |
| The task opens with what it is — purpose, invocation, arguments, gates, and what it changes — so a reader or an agent chooses it without reading the body | MUST |
| Gates run before anything changes: build, test and validation first | MUST |
| A destructive step asks for confirmation, with an explicit approval flag as the only way past it, and the run reports what it did | MUST |
| A task can be run again — safe to repeat, or it refuses and says why | SHOULD |
| The repository's own agent instructions name each task and when it applies; an unlisted task is invisible, and an agent that rebuilds a task's steps instead of invoking it has bypassed every gate inside it | MUST |
| A task is created by a person's decision, never an agent's initiative. Propose what you would do, what you would gate on and what you would change, and create it only once that is approved | MUST |

**What a task is not keeps the folder from becoming a catch-all.** Generation belongs to the `apps` command group. Infrastructure belongs to the `infra` group. Standardizing a repository belongs to the `repo` group. The workspace itself belongs to the `workspace` group, which sits above every repository rather than inside one. What remains is the work only this repository has.

**Who invokes a script decides where it lives.** A person or a pipeline reaches for a task or a command; the agent's own loop reaches for a hook, under `hooks/` or `hooks/tools/` in the plugin. Ask that question before you ask what the script needs to know. The rule that a task is created by a person's decision holds for a hook or a tool without change — you propose it, and build only once it is approved.

**A hook may read the book where it exists and may never require it.** Silence on a missing input is the contract: a hook that cannot read what it wanted says nothing, and you keep working. A `tasks/` script cannot degrade that way — it is simply absent from a repository that does not have it, and nothing can report an absence there is nothing to report against.

### A task ends in one of three ways

Read `tasks/` as a home, not a backlog. An empty `tasks/` is not the goal.

| Ending | When | What you do |
| --- | --- | --- |
| it stays | the work is genuinely this repository's — a sandbox tied to one account, a sequence only this product needs | leave it, and keep its header current |
| it is promoted | it is generic, and everything it needs is declared in SaaS Plane manifests rather than typed into the script | it becomes a command, and the task is deleted in the same change |
| it retires | it works around a gap the platform itself now answers | delete it, and say in the change which answer replaced it |

**Retirement is the ending people miss most often.** A script that reads source code to work out what a test run covered, or probes a running system for a fact a manifest already declares, is not waiting to be promoted — it is a symptom. Promoting it makes the workaround permanent and leaves the platform's gap in place. The test that separates promotion from retirement is what the script has to know: a tool reading SaaS Plane's own declarations is generic and can be promoted; one reading a product's paths, vocabulary or screens belongs to that product and either stays or retires.

## Standardization is a command

```text
spnutils repo create <name> [--from <org-package>[@version]]
```

Creates the repository in the bound repository host if it does not exist, and brings it to the standard — branches, protections, the checks its world requires, team access. Safe to run again: a repository already at the standard is unchanged, and one that has drifted is brought back. It takes its organization context from the current repository's pin, or from `--from` when starting outside one, and it refuses by name before the organization layer of the estate has been created. It reads the world from `sprepo.json` on the default branch, and a repository with none gets no checks ruleset, which the command says by name.

```text
spnutils repo agent-sync
```

Reads `sprepo.json` and converges the agent wiring that world implies: marketplace registration, the plugin set, the managed instruction block, the generated rules beside it, the permission tiers, and the three files of the delivery path. One path covers a checkout that was never wired and one that has drifted. Nothing is written into your machine-wide agent settings.

**The two commands never meet, and the order between them matters.** `repo create` works through the host's API and never opens the checkout; `repo agent-sync` writes the checkout and never calls the host. Merge the delivery path's files first, then let `repo create` require their checks — the other order blocks every pull request on a check that does not exist yet.

**The `repo` command group means repository-level change, never the content of code, tests or documents — MUST.** That includes both provider-side things (branches, teams, protection rules) and working-tree-side things (skeletons, settings, agent wiring). The stage is named `SCM`; the command group is named `repo`, and the group is wider than the stage on purpose.

## What breaks if you skip this

| If you… | Then |
| --- | --- |
| promote from a feature branch, or into a branch from one above it | the protection rules refuse the merge — there is no urgency exception |
| merge while a required check is red | the checks ruleset refuses it for every caller — fix the finding, never ask for a bypass |
| pin an action by its tag | the code a reviewer approved can be swapped under the same name — pin it by its commit |
| rebuild an artifact per environment | the new artifact invalidates every test the old one passed, and "what is running in production" stops tracing to one build |
| write a config claim in a `FOUNDATION`, `INFRA` or `GENERAL` repository | there is nothing for the claim to be about — write `null` instead |
| reconstruct a repo task's steps instead of invoking it | you bypass every gate inside it |
| promote a task that reads a product's own paths or vocabulary | the CLI now knows one product's addresses, which is exactly the boundary the shared tool exists to hold |
| create a repo task on your own initiative | it has no owner's decision behind it — propose it first |
