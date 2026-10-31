<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/03-utils/01-spnutils.md",
      "seen": "3120cd3e"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "seen": "fb327f9f"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "section": "`infra` — the estate",
      "seen": "32740953"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "section": "The machine's own layout",
      "seen": "3933d067"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md",
      "section": "The state file has a node for each owner",
      "seen": "9950ee87"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "DEC.DEVEX.WORKSPACE.180",
      "seen": "85afe267"
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
gains an argument. Each repository's generated `CLAUDE.md` imports its own context (`DEC.DEVEX.WORKSPACE.180`),
and the generated `.claude/saasplane/rules.md` among those imports carries § *Commands you
run here*: the `spnutils` commands that repository's world and stack use, each with its arguments,
read from the command tree itself. `repo agent-sync` rewrites it, so it
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

`workspace` mints the folder, keeps its settings and plugins current, and reports what is open. It
needs no repository, so its commands are the one group a repository's `rules.md` does not list:
`spnutils help --json` names them. It does not turn the agent's own recording on or off, and it writes
nothing under `.spndevex/.debug/`: that folder is the plugin's. It writes the `workspace` and
`workstreams` nodes of `.spndevex/state.json` and never the plugin's `debug` node, and `workspace
status` reads `debug.telemetry` for its recording line, or `.debug/switches.json` where the file has no
`debug` node yet, and writes nothing to the file.

**`spnutils workspace init [name]` takes the workspace's name as its one argument, and a name is given
once** (`RULE.DEVEX.WORKSPACE.324` · MUST · check:workstream-state · due:036/N008). The name is positional, written to the `workspace` node, and is
lower-case letters, digits and hyphens, starting with a letter, at most 40 characters. A partner runs
init before opening a window, so they type it themselves. Init meets four cases:

| Case | You run | What init does | Exit |
| --- | --- | --- | --- |
| A first run with no name | `spnutils workspace init` in a folder with no `.spndevex/` | Refused before anything is written: *"A new workspace needs a name. Run `spnutils workspace init <name>`, for example `spnutils workspace init saasplane`."* | 1 |
| A re-run with no name | `spnutils workspace init` in the workspace named `saasplane` | Converges as today and keeps the name. Its first line reads `workspace saasplane · /opt/work/saasplane/code`. | 0 |
| A different name | `spnutils workspace init acme` in the workspace named `saasplane` | Refused before anything is written: *"This workspace is named saasplane, and init was given acme. A workspace keeps the name it was given: run init with no name, or with saasplane."* | 1 |
| A workspace made before names | `spnutils workspace init` where `state.json` has no `workspace.name` | Converges as today, and ends with one sentence: *"This workspace has no name yet; give it one with `spnutils workspace init <name>`."* Running that names it, which is the one time a re-run sets a name. | 0 |

**`workspace status` opens with the name, beside the path:**

```text
workspace saasplane · /opt/work/saasplane/code   floor ✅   directory:/opt/work/saasplane/code/spn-claude-marketplace
```

In a workspace made before names, the first line is the path alone, and one line follows the engine:

```text
workspace /opt/work/saasplane/code   floor ✅   directory:/opt/work/saasplane/code/spn-claude-marketplace
engine     OpenTofu v1.12.6
name       none yet — `spnutils workspace init <name>` names this workspace
```

The telemetry line is printed only while the `debug` node's `telemetry` is `true`.

**Each telemetry line names the work it was spent on — MUST.** While the `telemetry` switch is on
(`spn-devex debug switch on telemetry`), every hook check and every plugin command appends one line to
`.spndevex/.debug/telemetry/hooks.jsonl`, and so does each Bash command the agent runs through a program
the filter names (by default `spnutils`, the plugin CLIs, `nx`, `git` and `docker`; a workspace file adds
or removes programs). The line carries `script` (the program or plugin), `group`, `subgroup` and `action`
(up to three levels, null where unused), `args` (what was typed after the action, with a secret-looking
option's value written as `***`), `event`, `tool`, `ms`, `exit`, `at` in UTC ending in `Z`, `repo` and
`pid`, then `verdict` and `out`. `verdict` says what a hook check did: `pass` when it said nothing,
`note` when it added words to the context, `deny` when it refused the call or held the turn, and null for
a command. `out` is the bytes a hook check or a tool call put into the context, null where it put none,
because every later turn reads those bytes again. A Bash call that ran more than one program writes one
line, named for the first program the filter picks, with `programs`, the count it ran. The line also
carries `workstream`, `arc`, `order` and `row`, read from the paths the tool call touches (`row` from the
order a call reads or writes, or else the row the window last moved to `running`), and `agent` when the
hook's input carries one. **The tags carry forward**: per session and agent, the last tagged call's tags
are kept in the window's folder, `.spndevex/.debug/sessions/<session-id>/tags.json`, a call that touches
no workstream path inherits them, and a call that names other work replaces them. **The plugin, not
`spnutils`, reads these lines**: `spn-devex debug hooks show` prints the time per check and per event,
and `spn-devex debug cost show` prints the tokens spent per workstream, per arc and per order from the
usage lines, which count each reply once, keyed by the message id. A window's cost is read from this
telemetry and never from a transcript — MUST (`RULE.DEVEX.AGENT.082` · MUST · check:subagentstop · due:036/N008).

**The permission tiers the floor writes follow a rule of the delivery chapter.** A tier is declared on a
command or on a group of commands, and a plugin declares the tiers of its own command groups. The same
traversal that publishes `help` serves the tiers, so the commands an agent is offered and the commands a
tier classifies cannot disagree.

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
routed by each package's own scope. A dry run runs every tier and lists every failure. A tier whose exact
inputs a past green verdict covers is not run again unless `--run-gates` is given, and the tag names the run
behind each tier (`RULE.SUPPORT.APPS.228` · MUST · skill:spn-apps/implement). `infra release` answers the same way.

`apps surface <operation> [package]` finds where a design library and a stack's design system differ,
with no model reading either one. It is one command with an operation, as `migrate` is, so the tool
keeps four groups. The operations are `construct`, `snapshot`, `library`, `gaps`, `accepted` and `status`,
and the options are `--level`, `--unit`, `--file`, `--book` and `--out`. `construct` writes the CONSTRUCT
snapshot, what the library must draw, from the book: `--book` names the book's folder, and `--out` writes
the same snapshot to a second file as well, such as the copy a plugin carries. `snapshot <package>` writes a
stack's snapshot from its code. `library` takes in the inventory of one library file that the agent prepared elsewhere, and writes
the library's snapshot when the inventories of all five are held. `gaps <package>` compares the two
snapshots and writes the gaps, with `rulesApplied` and `accepted`, and a view of one line for each gap.
`accepted <package>` takes in the differences that have been looked at and accepted, and the next `gaps`
leaves them out and counts them. `status` says what is on the machine and what is missing, and writes
nothing. `library` and `accepted` check the file they take in and copy it into place, and refuse by name
a file that fails the check, writing nothing. Five of the six operations read and write the machine's
folder alone and need no stack. The tool never writes into a repository by itself. The one file it writes
outside its folder is the CONSTRUCT snapshot's second copy, at the path `construct --out` names: that
snapshot is written from the book alone and holds nothing of the machine, so it is the one a repository may
carry, and it differs on every run because it holds when the book was read. In Figma it does one thing: it
reads a library file with the developer's read-only token, and it changes nothing there. Every other file is
under `~/.saasplane/state/surface/`, in folders that say who writes there, and none enters a repository.

**`spnutils` never reads or writes a document** (`RULE.DEVEX.UTILS.071` · MUST · check:behaviour-proof). `apps test <tier> <run>
<package>` runs a tier and writes that run's file, `tests/.output/<tier>/runs/<run>.json`, and nothing
else; `infra test <run> [package]` does the same for the estate. **The caller names every run, and the
name is required**: build one while you work, such as `full-1001`, and give every tier of one sitting
the same name. A reused name replaces that one file, and each tier keeps its 20 newest. A run given
`--phase <phase>` writes `<run>.<phase>.json`, so one name never overwrites itself across phases, and the 20
newest count every file in the tier's folder. What that run
means for the documents is the agent's own work, through plugin scripts:
`spn-devex behaviours stamp write <run> <repo>` reads only that run's files and writes `Status` and
`Updated at` as `<time> · <run>`, and coverage and the reports read the stamped rows only. The run's
name is a label, and nothing checks a row against its run file after the stamp.

## `infra` — the estate

Layer nouns are the vocabulary: `organization` · `platform` · `environment` · `app`. **There is no
whole-estate command**, because *all layers* of an unstated subject is a context nothing can resolve.

**A command names its platform as an argument, always and first — never through the environment**
(`RULE.DEVEX.UTILS.072` · MUST · check:command-shape · due:036/N008). Every platform-scoped command takes `<spc>` straight after its verb:
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
rather than dropped. When it exists, a simulated posture will mint a token shaped like a real one against the
local estate, never stored, marked in every output that names it, and refused by every `--cloud` command.
Every installed tool answers `help` from the **assembled program**, never from
source text, so an approximation cannot sneak in as a reading of the code.

## The derivation laws

**Nothing contextual is typed.** The stack comes from the repository's claim, the estate from its
pins or tree, the registry and package scope from the declared organization, the target node from
the folder you stand in. A flag may override; naming neither refuses by name, and a silent default
never exists.

**A mutation is reviewable or it does not exist.** Pins bump by editing a manifest — the one-line
diff is the whole review. A second stack changes no command: the groups are the platform's
vocabulary, stack adapters are its realizations. Only `apps` dispatches through a stack's adapter;
`workspace`, `repo` and `infra` are the same commands in every stack (`RULE.DEVEX.UTILS.004` · MUST · check:command-shape · due:036/N008).

## The env seat — `~/.spnenv`

The second machine path, holding your own values, sitting **outside** `~/.saasplane` on purpose — a
routine `rm -rf ~/.saasplane/*` is an allowed reset, and your typed credentials are the one thing on
the machine nobody can regenerate. Five regions, one writer each, read top to bottom:

| # | Region | Writer | Holds |
| --- | --- | --- | --- |
| 1 | `producer` | derived | what only a producer workspace has, `SPN_DEVEX_AGENT_WORKSPACE` — absent from a partner's file |
| 2 | `devex` | `spnutils` writes each key once, when missing; you supply the value | the DevEx tooling's tokens, `SPN_DEVEX_AGENT_GITHUB_TOKEN` (for `repo create`, `repo promote` and `repo backmerge`) and `SPN_DEVEX_AGENT_FIGMA_TOKEN` |
| 3 | `managed` | derived | the local dev CA block, the module-facts pattern |
| 4 | `dev` | **you, entirely** | your own keys — no run writes between these markers |
| 5 | `keep` | agent writes the key, you supply the value | every key a piece of built work needs |

A partner's file starts at `devex`. The seat holds only what a partner or a builder configures, so a
variable only a test sets never reaches it. `spnutils` provisions the shape and derives no key from
a declaration; it reads a token through the seat's reader, where a value exported for the run wins
and the seat answers otherwise. A value is never
printed and never logged — a run reports a key name and whether it is set, nothing more.

## The two machine paths under `~/.saasplane`

The machine home is `~/.saasplane/`, made by `spnutils workspace init` with three folders, divided by what
deleting one costs. Everything the local realization writes is addressed by coordinate — the organization
alone at organization level, organization and platform together at platform level — so two platforms share
one laptop without evicting each other's registration. The exceptions are the genuinely machine-singleton
pieces: the trust root and the shared `:443` proxy, each named for the machine and never for an
organization. Everything under `cache/` may be deleted at any time at the cost of recomputing it.

**What you have there, by top-level folder.** Read this before you look for any of it in source.

| Path under `~/.saasplane` | Holds |
| --- | --- |
| `state/` | what is kept: the local estate, the surface comparison, the browser profile, each plugin's own state; deleting it is a reset |
| `cache/` | what can be fetched or computed again; deleting it costs only time |
| `run/` | one record and one log for each server `apps dev` or `start` started on this machine, removed when the server is gone |

**Inside `state/`.**

| Path under `~/.saasplane/state` | Holds |
| --- | --- |
| `infra/certs/` | the machine's trust root, and each platform's certificates under `{org}/{spc}/` |
| `infra/ingress/` | the shared proxy and the machine resolver: compose file, `nginx/conf.d/` with a vhost for each registered app |
| `infra/platforms/{org}/{spc}/` | the rendered platform stack, its app registry, its routes, its spaces and its modules |
| `infra/estate/{org}/{spc}/` | resolved state, and the engine's working data for each layer |
| `infra/registry/` | the machine store: every estate package released with `--local` |
| `infra/engine/` | the engine's working folder |
| `surface/` | the design comparison: the library's inventories and snapshot, and for each package its snapshot, its gaps and its accepted differences, as the delivery library states |
| `browser/chrome/` | the automation browser profile: the machine's own, and deliberately not the developer's Chrome |
| `plugins/{plugin}/` | what one plugin keeps, if it keeps anything |

**Inside `cache/`.** `verdicts/` holds the verdicts of tiers already proven, `opentofu-providers/` the engine's
providers, and `plugins/{plugin}/` what one plugin caches; the DevEx plugin keeps its corpus at
`plugins/spn-devex/corpus/`.

**Each tool writes only its own rooms** (`RULE.DEVEX.UTILS.076` · MUST · check:split-plan). A tool that needs data from another tool's
room asks that tool's command for it and never reads the folder. The one exception is the browser profile,
which the agent drives as a running program.

**A plugin script never runs `spnutils`, and no file sits between them.** It asks one shared module of the
plugin for the folder it needs under `~/.saasplane/`. Where the folder is missing, the script stops with one
line that names the `spnutils` command that makes it, and a hook says nothing: the corpus cache names
`spnutils workspace init`; `docs look` does not stop, prints that the browser profile is missing and names
`spnutils infra organization up --apply`; the stop event stays silent.

**The tool's home folder is the tool's own** (`RULE.DEVEX.UTILS.075` · MUST · check:command-shape · due:036/N008). A developer and an agent are
never asked to add or change a file in `~/.saasplane`. What the tool needs from outside is taken in by a
command, which checks the file and copies it into place, so a file is prepared elsewhere and never left
in the folder by hand.

**The browser profile is yours to drive, and the developer's Chrome never is.** Chrome refuses
automation on a person's default profile, so `infra organization up` provisions this separate one. It
holds live credentials for real accounts: never commit it, copy it or print from it.

**Look at a page you built before you hand it over, through one action of the plugin, and never through
a repository** (`RULE.DEVEX.UTILS.074` · MUST · check:command-shape). The action is `spn-devex docs look <page>`. It loads the page
from disk in this profile, in light and in dark, with the global Playwright, and reports what the browser
computed: failed requests, console errors, sideways scroll, and a screenshot. It reports *not checked*
where no browser is installed. A partner holds the plugin and `spnutils`, and no application repository
does, so never write a script inside the repository you stand in to do it. Starting Chrome by hand with
a profile of your own hangs. Open a published page only when the developer asks.

## What this ref leaves to the book

Every command's exact signature is `help`'s, and the repository's `rules.md` lists the ones used
there. The reasoning behind each command lives in the capability chapter this ref restates — read
that when a command refuses you and the sentence alone is not enough. The judgment layer's own shape (this agent, its skills, its lenses) is a different chapter,
[Agent Plugins](../agent/plugins.md).
