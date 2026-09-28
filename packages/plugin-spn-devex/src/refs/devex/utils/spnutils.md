<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/03-utils/01-spnutils.md", "seen": "6a1d075c" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md", "seen": "fcc9f0f9" }
  ]
}
-->

# spnutils — What the Command Surface Gives You

**Source of truth:** the foundation's `02-constructs/01-devex/03-utils/01-spnutils.md` for why the
CLI exists and what it may never be asked to do, and `04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md`
for every command's own signature. Where this ref and those disagree, the book wins and this file is
rewritten.

## Why one CLI

Three layers carry every piece of work: **deterministic** (mechanical — scaffold, validate,
generate, stand an estate up, release), **judgment** (needs reading and weighing — this agent),
**memory** (what was decided and why — the documents). The test that assigns a capability to one of
the three: would two competent people produce the same output? If yes, it belongs in `spnutils`. If
no, it belongs to judgment. A command the CLI lacks is a finding against the tool, never a gap you
work around by hand.

**`spnutils` is a declared contract.** The foundation states the signatures; the Support repository
realizes them. A realization may extend the contract and may never narrow it.

## Four groups, one per subject, each with its own door

| Group | Changes | Door — which repos it runs in |
| --- | --- | --- |
| `workspace` | the folder your day runs in | anywhere — needs no repository at all |
| `repo` | the repository and its remote (branches, protections, agent wiring) — never code, tests or docs | any repository |
| `apps` | the apps domain's nodes — scaffolds, generated sources, a tier's run, release | repositories declaring the apps world |
| `infra` | the estate — layers, apps, config, estate packages | authoring in estate repositories; realization wherever a declaration resolves |

**A command exists where its subject lives, and refuses by name everywhere else.** The repository's
own `sprepo.json` is the door; nobody types which set applies. One command per domain *mints* the
claim (`apps scaffold repo`, `infra scaffold repo`) and every other command reads it back.
`workspace` is the deliberate exception with no door, because minting the folder is what you do
before any repository exists to declare one.

**A refusal is one sentence; a crash is every frame.** Ask for something the tool will not do and
you get the sentence alone. Something broke, and you get the whole trace — that split is what tells
you whether to read the message or go hunting for a bug.

## `scaffold` and `validate` read one profile, and cannot disagree

Scaffold writes a node's tree; validate reads it back — the same selector on both sides (a kind, an
app-owned module, the repo), and each selector names what follows it. **One profile per kind serves
both commands**, so adding a check to the profile is how scaffold and validate learn it at once — two
readers of one table cannot drift, two tables always will.

**Scaffold derives what it can and leaves the rest unfilled** rather than inventing a platform code,
an org name, a region. A placeholder is a state, not an error: a value that validates is a value you
ship, and `validate` is the half that names what you still owe.

```text
spnutils apps scaffold repo --stack <stack> --organization <package[@version]> [--platform <package[@version]>]
spnutils apps scaffold <kind> [-u --usecase <name>] [-c --code <CODE>]
spnutils apps scaffold app-module --app <folder> [-u --usecase] [-c --code]
spnutils apps validate [repo | app-module | <kind>] [-u --usecase <name>] [-a --app <folder>] [--json]

spnutils infra scaffold repo | organization <ORG> | platform <SPC> | module <code>
spnutils infra validate [repo | organization | platform | module] [--json]
```

## `workspace` — the folder your day runs in

```text
spnutils workspace init            mint the floor: marketplace, plugin union, permission tiers
spnutils workspace agent-sync      re-converge the floor, then repo agent-sync in every member
spnutils workspace status [--json] the orientation — members, wiring, what each owes, open workstreams
spnutils workspace timings [--on|--off]   what the agent's own machinery costs; off until asked
```

**There is no command for opening a scope of work.** A workstream is a folder in one of three
states; you make the folder, `status` lists what is open, and a write-time check holds the close
gate. A command refusing to move a folder is theatre — the agent can move the folder anyway.

## `repo` — the repository and its remote

```text
spnutils repo create <name> [--from <org-package>[@version]]
spnutils repo agent-sync
```

`repo` means repository-level change — branches, protections, team access, agent wiring. Never the
**content** of code, tests or documents, which is `apps`'s.

**A `∗`-door command reads SPN manifests and nothing else — MUST.** Its wiring has three parts: the
core half (`sprepo.json`) reads no stack's file and always runs; the node inventory (`spkind.json` /
`spinfrapkg.json`) is a per-world question, always run, keyed by the world rather than a stack; the
stack half runs only where the claim names that stack. A `∗`-door command reaching past those three
is broken rather than fussy.

## `apps` — the apps domain's nodes

```text
spnutils apps gen-validators | gen-barrel | gen-labels | gen-symbols  [package]
spnutils apps codegen api-client <package>     regenerates from the service's LIVE document
spnutils apps build | check | format | clean  <package> [--json]
spnutils apps test <tier> <package> [--json]
spnutils apps dev | start | stop  <package> [--mode <mode>] [--json]
spnutils apps migrate <up|down|list|pending|status|generate> <package>
spnutils apps release [version] [--dry-run] [-y --approved] [--json]
```

The `gen-*` chain is never hand-edited: validators are what the API enforces, symbols and labels are
what the agents read. `apps release` publishes every releasable project at one version, lockstep,
routed by each package's own scope.

**`spnutils` never reads or writes a document — MUST** (`RD.DEVEX.UTILS.071`). `apps test` runs a tier and
writes the run artifact and nothing else; what that run means for the documents — stamping `Status`
and `Updated at`, the join and proof checks, coverage — is the agent's own work, through plugin
scripts.

## `infra` — the estate

Layer nouns are the vocabulary: `organization` · `platform` · `environment` · `app`. **There is no
whole-estate command**, because *all layers* of an unstated subject is a context nothing can resolve.

```text
spnutils infra organization | platform  plan | up | down | status  [--cloud] [--approve] […]
spnutils infra environment  plan | up | down | status  <env> --cloud  [--approve]
spnutils infra app up | down  [-p <package>] [--clean]
spnutils infra domain register <host...> --app <app> | unregister <host>
spnutils infra config set | get | list | export | import | diff | render  […]
spnutils infra test [<package>]
spnutils infra release <package> [<version>] [--local] [--dry-run] [-y --approved] [--json]
```

**Every provisioning run names its mode, and there is no default.** `up`/`down` take exactly one of
`--plan`/`--apply` (or the flag pair the local form uses); naming neither or both is refused. A
command that plans when you forget a flag is a command doing another command's job. A rehearsal
reaches no account; a cloud apply also takes `--approve` and refuses by name when it cannot reach the
account the estate **declared** — nothing in the driver names a vendor.

## `login` and `help`

```text
spnutils login          one sign-in: cloud session plus a short-lived token per registry endpoint
spnutils help [--json]  every runnable command; --json gives it as data — path, intent, signature, args, options
spnutils -v              this build, and the standards range it implements
```

`login` is declared, not yet realized — a conformance finding against the realization, recorded
rather than dropped. Every installed tool answers `help` from the **assembled program**, never from
source text, so an approximation cannot sneak in as a reading of the code.

## The derivation laws

**Nothing contextual is typed.** The stack comes from the repository's claim, the estate from its
pins or tree, the registry and package scope from the declared organization, the target node from
the folder you stand in. A flag may override; naming neither refuses by name, and a silent default
never exists.

**A mutation is reviewable or it does not exist.** Pins bump by editing a manifest — the one-line
diff is the whole review. A second stack changes no command: the groups are the platform's
vocabulary, stack adapters are its realizations.

## The env seat — `~/.spnenv`

The second machine path, holding your own values, sitting **outside** `~/.spnutils` on purpose — a
routine `rm -rf ~/.spnutils/*` is an allowed reset, and your typed credentials are the one thing on
the machine nobody can regenerate. Four regions, one writer each, read top to bottom:

| # | Region | Writer | Holds |
| --- | --- | --- | --- |
| 1 | `producer` | derived | what only a producer workspace has — absent from a partner's file |
| 2 | `managed` | derived | the local dev CA block, the module-facts pattern |
| 3 | `dev` | **you, entirely** | your own keys — no run reads or writes between these markers |
| 4 | `keep` | agent writes the key, you supply the value | every key a piece of built work needs |

`spnutils` provisions the shape and derives no key. A value is never printed and never logged — a
run reports a key name and whether it is set, nothing more.

## The two machine paths under `~/.spnutils`

Everything the local realization writes is addressed by coordinate — the organization alone at
organization level, organization and platform together at platform level — so two platforms share
one laptop without evicting each other's registration. The exceptions are the genuinely
machine-singleton pieces: the trust root and the shared `:443` proxy, each named for the machine and
never for an organization. Everything under `cache/` may be deleted at any time at the cost of
recomputing it; nothing else there should be.

## What this ref leaves to the book

Every command's exact flag-by-flag signature and the reasoning behind it live in the capability
chapter this ref restates — read that when a command refuses you and the sentence alone is not
enough. The judgment layer's own shape (this agent, its skills, its lenses) is a different chapter,
[Agent Plugins](../agent/plugins.md).
