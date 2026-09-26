<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/02-scm.md", "seen": "e83f0012" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/02-scm.md", "seen": "4735c219" }
  ]
}
-->

# Source Control — Stack-Agnostic

What a repository declares about itself, the branches every repository carries, how a change moves up and what stops it, and the shape of a repo task. Apply this in any stack and in any repository. Source of truth: the foundation's `02-constructs/01-devex/01-function/02-scm.md` and `04-capabilities/01-devex/01-function/02-scm.md`. Where this restatement and those disagree, the sources win and this file is regenerated.

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

Every repository uses the same four permanent branches. Work flows strictly upward, and only by pull request.

```text
feat/* · fix/* · chore/*  ──►  develop  ──►  qa  ──►  uat  ──►  main
                                                               ▲
                                              hotfix/*  ───────┘
                                    main ──► uat ──► develop   (back-merge)
```

| Branch | Role | Gate owner | Deploys to |
| --- | --- | --- | --- |
| `develop` | integration, and the default branch | Engineering | the environment row that claims it as a branch trigger |
| `qa` | engineering and test verification | Quality engineering | whatever environment claims it, if the platform declares one |
| `uat` | business acceptance | Business | the environment row that claims it, if the platform declares one |
| `main` | the release line | Release approval | never by a merge — a production environment promotes an approved release tag from a lower one |

**`main` is the one branch that surprises people.** Nothing deploys to production because a merge arrived there. A merge into `main` produces a release line, and a production environment promotes an approved release tag from an environment that already runs it — that is the difference between a branch being the trigger and a branch being the record.

### How a change moves up

1. Branch from `develop` — `feat/` for new behaviour, `fix/` for a defect, `chore/` for work that changes no behaviour.
2. Open a pull request into `develop`. At least one approval is required, and new commits dismiss stale approvals.
3. Merge, and let the environment that watches `develop` take it — that environment is named in the estate's declaration, never in your repository.
4. Promote to `qa`; quality engineering holds that gate.
5. Promote to `uat`; the business decides acceptance.
6. Promote to `main`, which reaches the release line.
7. Cut a release, and promote the built artifact into production from the environment that proved it.

**A change reaches `main` only through `qa` and `uat`, one rung at a time — MUST.** There is no path to production that skips a rung, and no exception for urgency: an urgent change travels the same rungs, faster.

### The protection rules

These are not conventions a team agrees to follow. They are protection rules the repository host enforces on every branch, applied as state a command converges rather than as a habit somebody remembers.

- Every change **MUST** arrive by pull request, with at least one approval, and new commits **MUST** dismiss stale approvals. There are no direct pushes.
- Promotion **MUST** move one rung at a time.
- A permanent branch **MUST NOT** be deleted or force-pushed. `main` additionally requires linear history.
- A `hotfix/*` branch **MUST** branch from `main`, merge back into `main`, and then be back-merged down through `uat` to `develop`. Skip the back-merge and the next change promoted from `develop` quietly removes the fix — the outage returns with no sign of why.

**Two access tiers exist, and nothing between them.** `git-admin` grants write access and the ability to bypass the protection rules, for emergencies only, and the bypass is visible. `git-dev` grants write access with no bypass at all, for everyone doing ordinary work. A middle tier would be a way to be partly exempt, which is a state nobody can reason about during an incident.

### A hotfix travels the same rungs, faster

1. Branch from `main`, because that is what production came from.
2. Fix, review, and merge back into `main` under the same approval rule as everything else.
3. Cut the release and promote it, the same way an ordinary release reaches production.
4. Back-merge `main` into `uat`, and `uat` into `develop`, so the lower branches hold the fix.

**Step four is the one people skip.** Speed here comes from a smaller batch, never from fewer gates.

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

**The release tag is the only record of the version.** Cutting a release edits no file. In the tree, manifests carry a placeholder version and internal dependencies use the workspace protocol; the release stamps the real number into the published artifact at publish time. A working tree reads as a development version, and a source manifest still holding a real version stops the run before anything is built.

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

### A task has three possible fates

Read `tasks/` as a home, not a backlog. An empty `tasks/` is not the goal.

| Fate | When | What you do |
| --- | --- | --- |
| it stays | the work is genuinely this repository's — a sandbox tied to one account, a sequence only this product needs | leave it, and keep its header current |
| it is promoted | it is generic, and everything it needs is declared in SaaS Plane manifests rather than typed into the script | it becomes a command, and the task is deleted in the same change |
| it retires | it works around a gap the platform itself now answers | delete it, and say in the change which answer replaced it |

**Retirement is the fate people miss most often.** A script that reads source code to work out what a test run covered, or probes a running system for a fact a manifest already declares, is not waiting to be promoted — it is a symptom. Promoting it makes the workaround permanent and leaves the platform's gap in place. The test that separates promotion from retirement is what the script has to know: a tool reading SaaS Plane's own declarations is generic and can be promoted; one reading a product's paths, vocabulary or screens belongs to that product and either stays or retires.

## Standardization is a command

```text
spnutils repo create <name> [--from <org-package>[@version]]
```

Creates the repository in the bound repository host if it does not exist, and brings it to the standard — branches, protections, team access. Safe to run again: a repository already at the standard is unchanged, and one that has drifted is brought back. It takes its organization context from the current repository's pin, or from `--from` when starting outside one, and it refuses by name before the organization layer of the estate has been created.

```text
spnutils repo agent-sync
```

Reads `sprepo.json` and converges the agent wiring that world implies: marketplace registration, the plugin set, the managed instruction block, the generated rules beside it, and the permission tiers. One path covers a checkout that was never wired and one that has drifted. Nothing is written into your machine-wide agent settings.

**The `repo` command group means repository-level change, never the content of code, tests or documents — MUST.** That includes both provider-side things (branches, teams, protection rules) and working-tree-side things (skeletons, settings, agent wiring). The stage is named `SCM`; the command group is named `repo`, and the group is wider than the stage on purpose.

## What breaks if you skip this

| If you… | Then |
| --- | --- |
| skip a rung on promotion | the protection rules refuse the merge — there is no urgency exception |
| rebuild an artifact per environment | the new artifact invalidates every test the old one passed, and "what is running in production" stops tracing to one build |
| write a config claim in a `FOUNDATION`, `INFRA` or `GENERAL` repository | there is nothing for the claim to be about — write `null` instead |
| reconstruct a repo task's steps instead of invoking it | you bypass every gate inside it |
| promote a task that reads a product's own paths or vocabulary | the CLI now knows one product's addresses, which is exactly the boundary the shared tool exists to hold |
| create a repo task on your own initiative | it has no owner's decision behind it — propose it first |
