<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/03-utils/01-spnutils.md",
      "seen": "26753702"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "seen": "af67eaa5"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.WORKSPACE.180",
      "seen": "f5c6cb20"
    },
    {
      "repo": "spn-foundation",
      "row": "RD.DEVEX.UTILS.072",
      "seen": "eb25b0de"
    }
  ]
}
-->

# spnutils — What the Command Surface Gives You

**Source of truth:** the foundation's `02-constructs/01-devex/03-utils/01-spnutils.md` for why the
CLI exists and what it may never be asked to do, and `04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md`
for every command's own signature. Where this ref and those disagree, the book wins and this file is
rewritten.

## The commands you run are listed in each repository, not here

**This file lists no command by hand.** A list typed here drifts from the program the day a command
gains an argument. Each repository's generated `.claude/saasplane/rules.md` carries § *Commands you
run here*: the `spnutils` commands that repository's world and stack use, each with its arguments,
read from the command tree itself (`RD.DEVEX.WORKSPACE.180`). `repo agent-sync` rewrites it, so it
matches the installed release. Read it before you run a command in a repository.

- **For every command, and every option**, run `spnutils help --json` or `spnutils <command> --help`.
  Both answer from the assembled program, never from source text.
- **`<x>` is required and `[x]` is optional**, in `rules.md` and in `help` alike.
- **A command this file names in prose is an example of the grammar**, never its signature. The
  signature is whatever `help` prints.

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

## `workspace` — the folder your day runs in

`workspace` mints the folder, keeps its settings and plugins current, reports what is open, and
turns the agent's own timing on or off. It needs no repository, so its commands are the one group a
repository's `rules.md` does not list: `spnutils help --json` names them.

**Each line `timings` records names the work it was spent on — MUST.** While recording is on, every
hook check and every plugin command appends one line to `.spndevex/.debug/telemetry/hooks.jsonl`, and
so does each Bash command the agent runs through a program the filter names (by default `spnutils`,
the plugin CLIs, `nx`, `git` and `docker`; `.spndevex/.debug/telemetry/filter.json` adds or removes
programs). The line carries `script` (the program or plugin), `group`, `subgroup` and `action` (up to
three levels, null where unused), `args` (what was typed after the action, with a secret-looking
option's value written as `***`), `event`, `tool`, `ms`, `exit`, `at` in UTC ending in `Z`, `repo` and
`pid`, then the `workstream`, `arc` and `order` read from the paths the tool call touches, and the
`agent` when the hook's input carries one. A Bash call that ran more than one program writes one line,
named for the first program the filter picks, with `programs`, the count it ran. **The tags carry forward**: per session and agent, the last tagged call's tags are kept
beside the log, a call that touches no workstream path inherits them, and a call that names other work
replaces them. A report in the plugin, not in `spnutils`, joins those lines to the Claude Code
transcripts by `session` and prints the tokens spent per workstream, arc and order.

**There is no command for opening a scope of work.** A workstream is a folder in one of three
states; you make the folder, `status` lists what is open, and a write-time check holds the close
gate. A command refusing to move a folder is theatre — the agent can move the folder anyway.

## `repo` — the repository and its remote

`repo` means repository-level change — branches, protections, team access, agent wiring. Never the
**content** of code, tests or documents, which is `apps`'s.

**A `∗`-door command reads SPN manifests and nothing else — MUST.** Its wiring has three parts: the
core half (`sprepo.json`) reads no stack's file and always runs; the node inventory (`spkind.json` /
`spinfrapkg.json`) is a per-world question, always run, keyed by the world rather than a stack; the
stack half runs only where the claim names that stack. A `∗`-door command reaching past those three
is broken rather than fussy.

## `apps` — the apps domain's nodes

The `gen-*` chain is never hand-edited: validators are what the API enforces, symbols and labels are
what the agents read. `apps release` publishes every releasable project at one version, lockstep,
routed by each package's own scope.

**`spnutils` never reads or writes a document — MUST** (`RD.DEVEX.UTILS.071`). `apps test <tier> <run>
<package>` runs a tier and writes that run's file, `tests/.output/<tier>/runs/<run>.json`, and nothing
else; `infra test <run> [package]` does the same for the estate. **The caller names every run, and the
name is required**: build one while you work, such as `full-1001`, and give every tier of one sitting
the same name. A reused name replaces that one file, and each tier keeps its 20 newest. What that run
means for the documents is the agent's own work, through plugin scripts: `spn-devex behaviours stamp
<run> <repo>` reads only that run's files and writes `Status` and `Updated at` as `<time> · <run>`,
the proof check reads each row against the run it cites, and coverage and the reports read the stamped
rows only.

## `infra` — the estate

Layer nouns are the vocabulary: `organization` · `platform` · `environment` · `app`. **There is no
whole-estate command**, because *all layers* of an unstated subject is a context nothing can resolve.

**A command names its platform as an argument, always and first — never through the environment**
(`RD.DEVEX.UTILS.072`). Every platform-scoped command takes `<spc>` straight after its verb:
`infra platform <verb> <spc>`, `infra environment <verb> <spc> <env>`, and the same for `config`,
`show`, `logs`, `web` and `domain register`. The organization layer takes none, because a repository
has at most one organization. In an apps repository the `<spc>` is checked against the
`sprepo.json` pin, and one that differs is refused. No environment entry selects a platform.

**Every provisioning run names its mode, and there is no default.** `up`/`down` take exactly one of
`--plan`/`--apply` (or the flag pair the local form uses); naming neither or both is refused. A
command that plans when you forget a flag is a command doing another command's job. A rehearsal
reaches no account; a cloud apply also takes `--approve` and refuses by name when it cannot reach the
account the estate **declared** — nothing in the driver names a vendor.

## `login` and `help`

`login` is one sign-in: a cloud session plus a short-lived token per registry endpoint. `help`
lists every runnable command, and `--json` gives each one as data: its path, intent, signature,
arguments and options. `-v` prints this build and the standards range it implements.

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

**What you have there, by top-level folder.** Read this before you look for any of it in source.

| Path under `~/.spnutils` | Holds |
| --- | --- |
| `certs/` | the machine's trust root, and each platform's certificates under `{org}/{spc}/` |
| `ingress/` | the shared proxy and the machine resolver: compose file, `nginx/conf.d/` with a vhost for each registered app |
| `platforms/{org}/{spc}/` | the rendered platform stack, its app registry, its routes, its spaces and its modules |
| `estate/{org}/{spc}/` | resolved state, and the engine's working data for each layer |
| `registry/` | the machine store: every estate package released with `--local` |
| `cache/` | copies that can be fetched again, such as the engine's providers |
| `browser/chrome/` | the automation browser profile: the machine's own, and deliberately not the developer's Chrome |

**The browser profile is yours to drive, and the developer's Chrome never is.** Chrome refuses
automation on a person's default profile, so `infra organization up` provisions this separate one. It
holds live credentials for real accounts: never commit it, copy it or print from it.

**Look at a page you built before you hand it over.** Load it from disk in this profile, in light and
in dark, and read what the browser computed: failed requests, console errors, sideways scroll, and a
screenshot. Open it with Playwright's `chromium.launchPersistentContext` on `~/.spnutils/browser/chrome`,
with `channel: 'chrome'` and `headless: true`, from a repository that has `@playwright/test`. Starting
Chrome by hand with a profile of your own hangs. Open a published page only when the developer asks.

## What this ref leaves to the book

Every command's exact signature is `help`'s, and the repository's `rules.md` lists the ones used
there. The reasoning behind each command lives in the capability chapter this ref restates — read
that when a command refuses you and the sentence alone is not enough. The judgment layer's own shape (this agent, its skills, its lenses) is a different chapter,
[Agent Plugins](../agent/plugins.md).
