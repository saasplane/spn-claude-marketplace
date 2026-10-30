<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/01-workspace.md",
      "seen": "14d06850"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/02-workstream.md",
      "seen": "79b3c27a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md",
      "seen": "68c1e693"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "The agent is updated first, and reloaded before anything runs",
      "seen": "c0ba7e1b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "An arc's status is one of six, stored or worked out",
      "seen": "656a5e70"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A landed arc is never reopened",
      "seen": "14638107"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md",
      "section": "Two dot-homes",
      "seen": "5a817634"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md",
      "section": "The state file has a node for each owner",
      "seen": "f2a8cb33"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md",
      "section": "The worktree set",
      "seen": "b74a817b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/03-utils/01-spnutils/02-delivery.md",
      "section": "When an edit becomes behaviour",
      "seen": "b1bdbbce"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md",
      "section": "Restatement discipline",
      "seen": "2586b987"
    }
  ],
  "decisions": [
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.WORKSPACE.058",
      "seen": "9875bea1"
    },
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.WORKSPACE.261",
      "seen": "d9b77fe5"
    },
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.WORKSPACE.020",
      "seen": "3661c8a9"
    },
    {
      "repo": "spn-foundation",
      "row": "DEC.DEVEX.UTILS.044",
      "seen": "9814cdcb"
    },
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.UTILS.048",
      "seen": "32c30358"
    },
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.AGENT.049",
      "seen": "6dce9417"
    },
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.WORKSPACE.118",
      "seen": "baf42b07"
    },
    {
      "repo": "spn-foundation",
      "row": "RULE.DEVEX.WORKSPACE.324",
      "seen": "fe694315"
    }
  ]
}
-->

# Cross-Repo Work — Stack-Agnostic

How an agent works across more than one repository on a SaaS Plane estate, and where a rule belongs so every agent sees it. Apply it in any stack and to any repo pair. Source of truth: the foundation's `02-constructs/01-devex/04-workspace/01-workspace.md` and `02-constructs/01-devex/04-workspace/02-workstream.md` — the workspace itself, and the scope of work inside it. The machine seat is `04-capabilities/01-devex/03-utils/01-spnutils/01-utils.md` **§ The machine's own layout** and **§ The env seat**, and `04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md` **§ The agent is updated first, and reloaded before anything runs**. The state file is `04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md` **§ The state file has a node for each owner**. Then `04-capabilities/01-devex/03-utils/01-spnutils/02-delivery.md` **§ When an edit becomes behaviour**, and `04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` **§ Restatement discipline**. The decisions are RULE.DEVEX.WORKSPACE.020, DEC.DEVEX.UTILS.044, RULE.DEVEX.UTILS.048, RULE.DEVEX.AGENT.049, RULE.DEVEX.WORKSPACE.118 and RULE.DEVEX.WORKSPACE.324. Where this restatement and those disagree, the sources win and this file is regenerated.

## One window, laws by declaration

A session opens on the **workspace folder** — the discovered set of sibling checkouts — and works across every repo in it. **The rule set binding a file derives from the governing manifests above it, never from where the session started.** `sprepo.json` names the world and, for an `APPS` repo, the stack claim. `spkind.json` names an apps node. An estate node is found by its `spinfrapkg.json`, with the type at `src/spestate.json`.

Follow this discipline, per file touched:

1. **Resolve the law first.** Before editing a file, know which repo governs it. That repo's `CLAUDE.md` loads the first time you work there and brings its concept, its docs map and its inventory; open the seat the task needs from the map.
2. **Never carry one repo's conventions into another's files.** A convention right in one repo is frequently wrong in the next: one repo bans implementation identifiers, another is built from them. The manifest decides, not the file you edited last.
3. **Doors hold everywhere.** A skill, rule or hook that declares a repo type or stack claim activates only where its declaration matches. An infra skill in a web repo refuses by name.
4. **Never touch `~/.claude`.** A workspace wires itself through its own `.claude/`, and the machine's other Claude work stays untouched.

Read across freely, in every direction — it needs no ceremony.

## The machine seat — `~/.spnenv`

**One file on the machine holds every SaaS Plane value, and that file is `~/.spnenv`** (rule RULE.DEVEX.UTILS.048; the chapter is DevEx Utils § *The env seat*). It sits **outside `~/.saasplane`** on purpose. `rm -rf ~/.saasplane/*` is an allowed reset, and the developer's typed credentials are the one thing on the machine nobody can regenerate.

`spnutils` reads it **directly**, so nothing has to be exported to reach a process.

### Five regions, one writer each

The order is not a preference. Read a file top to bottom and this is what you find:

| # | Region | Writer | What you may do |
| --- | --- | --- | --- |
| 1 | `spnutils:producer` | derived | read it. It holds `SPN_DEVEX_AGENT_WORKSPACE`. **A partner's file does not have it** |
| 2 | `spnutils:devex` | `spnutils` writes each key once, when it is missing; the developer writes the value | test whether a token is set. It holds `SPN_DEVEX_AGENT_GITHUB_TOKEN` (`repo create`, `repo promote` and `repo backmerge`) and `SPN_DEVEX_AGENT_FIGMA_TOKEN` (`surface library --figma`) |
| 3 | `spnutils:managed` | derived | read it. A run rewrites it whole, so nothing typed inside survives |
| 4 | `spnutils:dev` | **the developer, entirely** | **nothing.** Never read between these markers, never write, never reorder |
| 5 | `spnutils:keep` | you write the key; the developer writes the value | add a key here |

**`producer` leads so a partner's file is a truncation.** Theirs starts at `devex` and runs `devex` → `managed` → `dev` → `keep`. A missing `producer` region in a partner's file is correct, never a fault to repair.

**The seat holds only what a partner or a builder configures.** The `devex` region is in every file, because a partner signs in to GitHub and Figma too. A variable only a test sets is not configuration: never add one to the seat or name it in a doc. The tool reads each token through the seat's reader: a value exported for the run wins, as a pipeline exports its own, and the seat answers otherwise. `GITHUB_ACCESS_TOKEN` is read by nothing, so an old one exported in a shell no longer reaches `repo create`, `repo promote` or `repo backmerge`.

**When `spnutils` first writes the `devex` region, it carries a token's value from wherever the key already sits**, the `dev` region included. That is the one time a run reads inside `dev`, and it writes nothing there; it reports the old line by key name, and deleting it is the developer's.

**`dev` sits above `keep` because the file is plain shell.** It runs top to bottom, so a key the developer defines once resolves in the values below it. That is why a `keep` value may reference a `dev` key and never the reverse.

### You add the key. You never invent the value

**`spnutils` derives no key from a declaration.** It provisions the file's shape — the markers, the producer region, the devex region's missing keys, the managed region's default setup — and lays the keep region out. Which keys the keep region holds is yours.

So the loop is:

1. You build what needs the key — an app gains config, a module publishes a fact.
2. You add the key to `spnutils:keep`, in the right subsection, with an empty value.
3. **You ask the developer for the value.** You never write one, never guess one, and never copy one from another key.

**A key nobody needed is worse than a missing one.** It leaves a prompt for a value nobody will supply, and an empty key reads as a gap somebody has to investigate.

### Where a key goes, and what its heading is

Group by the key's own shape: the segments between the platform code and the trailing role name. A subsection is a `# Heading`, its keys, then a blank line.

```text
# Resource DB App Postgresql
DMO_RESOURCE_DB_APP_POSTGRESQL_PASSWORD_MIGRATION=
DMO_RESOURCE_DB_APP_POSTGRESQL_PASSWORD_RO=
DMO_RESOURCE_DB_APP_POSTGRESQL_PASSWORD_RW=

# Platform Owner
DMO_PLATFORM_OWNER_EMAIL=
```

**A note about a key goes on the line above it, never beside it.** A trailing comment is part of the value's line, and a parser reading the value has to strip it. A comment above travels with the key when the region is re-rendered.

**You group only what you wrote.** A key the developer typed keeps its place, its order and its own comments. Never sort it into a heading you derived — the name you invent is a guess, and it ages badly the day the key stops meaning what its prefix suggested.

### A reference is `${VAR}`, and nothing executes

A value may reference another by name. The grammar is **shared with the cloud secret store**, so read one and you know both:

| Rule | |
| --- | --- |
| **braces are required** | `${VAR}`, never `$VAR` |
| lookup only | no command substitution, no shell. A hostile line in a hand-edited file executes nothing |
| resolved **upward** | values parsed above the line, then the process environment |
| every occurrence | a value may hold more than one reference |
| shell quoting holds | `"${VAR}"` expands; `'${VAR}'` stays literal |
| `$(...)`, backticks and `${VAR:-x}` | left literal |
| an unresolvable reference | **reported**, never left in the value as text |

### Never render a region

**You may read this file. You may not print one.**

That distinction is the whole rule, and it is narrower than the one this reference used to state. The tool's own command reads every value in the file on every `sync`, because preserving the developer's regions requires reading them. So *do not read it* was never true, and stating it did not stop the thing it was written to stop.

**What actually protects the developer is the output.** Render **key names and set-state**, or a diff of key names. A value reaches a terminal only when the developer asks for that one value by name.

```bash
# wrong — expands to the value when set
printf '%s\n' "${v:-MISSING}"
# wrong — renders a region, values and all
sed -n '72,89p' ~/.spnenv
# right — reports presence only
if [[ -n ${(P)k} ]]; then echo "set"; else echo "MISSING"; fi
```

Here is why it is absolute. A transcript outlives the session that wrote it. A printed credential is exposed from that moment, and rotation is the only repair. **This has happened here twice.** Once a presence test expanded its own values. Once a session printed a region of the real file to check a migration, and five live credentials went into a transcript — hours after arguing the rule at length. Write the command so the value has nowhere to go.

### Namespace by platform code, never by workspace

Keys carry the platform code as their prefix — `DMO_`, `LPD_`, `SAS_` — and a module fact reads `{SPC}_{MODULE}_{FACT}`. **That prefix is the whole anti-overlap mechanism**, and it is why one machine-wide file is the right shape.

**So you answer a collision with the prefix, never with a file or a region per workspace.** Segmenting by workspace is the obvious fix and it is the wrong one — two people reached for it in a single day. The same platform turns up under more than one workspace.

A developer's own key keeps its prefix too. `DMO_MY_THING` belongs to DMO because of its name, never because of where it sits — which is why living in `spnutils:dev` costs it nothing.

### Two cautions before you run a workspace command

- **The tool never writes a shell profile.** `~/.zshenv` and its siblings stay the developer's. Sourcing `~/.spnenv` from a profile is their line to add, and it trades away the exposure this file avoids: every value exported to every process. **You never edit a shell profile yourself.**
- **`workspace init` in a scratch folder rewrites the real `~/.spnenv`.** Point `HOME` at a temp directory before you run `init` or `agent-sync` for a demo. The command is `workspace agent-sync` — the floor, then `repo agent-sync` in every discovered member.

### A run manages only what it can observe

A run writes what it can see, and it stops there. **It never deletes a key because it failed to see what that key describes.** Staleness is reported by `workspace status`, and never repaired by deletion.

**Retiring a key is not deleting it.** A value in the keep region may be the only copy on the machine, so a run carries what it finds and stops writing it back.


## The workspace's working state — `.spndevex/`

The workspace folder carries two dot-homes: `.claude/` (settings — the marketplace, the plugin union, the permission floor) and `.spndevex/` — the agent's working state. **State and settings, never rules**: a rule filed there has two homes, and the copy nobody updates is the one an agent reads.

**While a workstream is open, the folder also carries its worktree set, which is no home and no member (RULE.DEVEX.WORKSPACE.315).** A workstream works in a folder of its own, so two workstreams never share a checkout and a main checkout never holds work. The set is the folder `.worktrees/<NNN>-<subject>/` in the workspace root — MUST. `spnutils workspace worktree add <NNN>` fetches every member and makes it, and a `--repo` option adds one repository more. A fix that production or one environment needs is cut from that branch: `--from <branch>` cuts the workstream's branch from `main`, `uat` or `qa` in place of `develop`, and writes `branch.<name>.spnBase` for it.

| In the set | What it is |
| --- | --- |
| a worktree, for each repository the workstream's rows name | on `feat/<NNN>-<subject>`, cut from a fresh `origin/develop` |
| a link, for each other member | to the member's main checkout, so a sibling path such as `../spn-infra` still resolves |
| `.spndevex` | a link to the workspace's one store, so every window reads the same workstreams |
| `.claude/settings.json` | written by the writer `workspace init` uses |

- **The set holds no `CLAUDE.md` — MUST NOT.** A window in the set reads the workspace's own as an ancestor, and a second copy would load the same text twice on every turn.
- **The set is not a member — MUST.** A member is a folder directly under the root holding `sprepo.json` or `.git`, and `.worktrees/` holds neither. So `workspace status` and the plugin list the same members with or without a set, and the leading dot keeps the folder out of every reader that skips one.
- **The set needs no new permission.** The workspace's settings already allow reads and edits under the root.
- **The main checkouts stay on `develop`, fetched, and the agent never commits in one — MUST.** A release is the one time a main checkout is switched to `main`.
- **`spnutils workspace worktree remove <NNN>` removes the set and refuses work that is not on origin — MUST.** It refuses while any worktree holds a commit that is not on origin or a change that is not committed. Once the repository's pull requests are merged, it deletes the branch on origin too.
- **The set is removed before its workstream closes, and a set left behind is named at session start — MUST** (`RULE.DEVEX.WORKSPACE.325`). The close gate refuses while the set is on disk, and the session's status line names each set whose workstream is in `closed/`, or whose name no workstream folder carries, with the command that removes it.

**The folder is a git repository with no remote, and that is what makes a mistake survivable.** `workspace init` starts its history; the record keeps its own versions locally and is never pushed anywhere. So a script that rewrote an arc wrongly can be read back with `git -C .spndevex diff`, and a line somebody deleted is still there in the last commit. **Nothing else tracks this folder** — it sits above every checkout, so without that repository there is no yesterday to ask about. Its `.gitignore` carries two lines, `.debug/` and `.state.*`, so neither the machinery's notes nor the state file's lock and temporary file reach the history, and a re-run of `workspace init` adds a line it finds missing. `state.json` is in the history on purpose: a record of when telemetry was on is worth having beside the cost figures it explains. No command commits, so a change to it is in whatever commit is made there next.

**The container is a workstream, and it is named for its subject.** One folder holds everything a subject needs: the argument you read, the arcs the agent executes, and the brief behind every delegated run. Its name is a number and the subject; its parent folder is its state.

```
.spndevex/
  state.json                              what the commands record, a node for each owner: workspace, workstreams, debug
  workstreams/
    backlog/
      {NNN}-{subject}/                    prepared, blocked, or not picked up yet
    open/
      {NNN}-{subject}/                    being worked now
        approach.html                     yours: the argument, with the progress and Open blocks the commands write
        suggestions.jsonl                 each suggestion, from raised to decided, parked or dropped
        questions.jsonl                   each question card, open, answered or withdrawn
        arcs/
          N<nnn>/
            state.json                    the arc's header and every row
            log.jsonl                     one line per event
            facts.jsonl                   each fact read, pinned to its commit
            sheet.json                    the arc's change sheet: one entry for each file operation, written by the `workstream sheet` commands
            <subject>.md                  the arc's name: its goal, its status and its links, written by the commands
        notes/
          N<nnn>/                         one arc's work order: at most these six entries, each made when the arc needs it
            preview.html                  the arc's one preview, where something must be seen or worded to decide
            samples/                      real files of the kind the work produces, each in its own format
            plan.md                       what a row needs beside it: the traps, a set, a move table
            orders/                       one brief per delegated execution, named by its row, and its report
            scripts/                      what a mechanical row runs
            work/                         what the work leaves behind: a view's whole words, a proof's output, a baseline
    closed/
      {NNN}-{subject}/                    the whole folder, once its plan is accounted for
  .debug/                                 what the agent's own machinery says about itself
    sessions/<session-id>/                one folder for each window; swept 14 days after its newest write
    workspace/                            what spans windows: filter.json
    telemetry/                            hooks.jsonl and usage.jsonl; a log past 20 MB is renamed <name>.1.jsonl
  migrations.jsonl                        the plugin migrations this workspace has applied, one line each
  README.md
```

**`workstreams/` and `.debug/` are the only two containers, and `state.json` sits beside them.** `workstreams/` holds one folder per scope of work, `.debug/` holds what the machinery keeps and costs: its notes about each window and its logs, and `state.json` holds what the commands record that the tree cannot show. A leading dot hides `.debug/` from every reader of the workstreams, by a rule the corpus already carries. **`.debug/` holds three containers, and each has one lifetime rule — MUST.** `sessions/<session-id>/` is one folder for each Claude Code window, holding its notes (`name.json`, `window.json` for its bound workstreams, `stop.json` for the Stop baseline and `stop.<agent>.json` for each child's own, so a child and its window never write one file, `confirmed.json`, `mirror` for the mirrors already named to this window, one per line, `tags.json`, `usage-offsets.json` and `pending/`); it is swept whole, 14 days after the folder's newest write, at session start and by `debug window sweep`, and no store prunes on its own. `workspace/` is kept and holds what spans windows, `filter.json`. `telemetry/` holds `hooks.jsonl` and `usage.jsonl`; a log past 20 MB is renamed `<name>.1.jsonl`, replacing the previous one, and starts anew, and a reader reads both. **The plugin is the only writer of `.debug/`.** The switch that starts the recording is not there: it is the `debug` node of `state.json`. Read it with `spn-devex debug cost show`, `debug hooks show`, `debug window show`, `debug window sweep`, `debug switch show|on|off` and `debug store show`. Beside them sits one file, `migrations.jsonl`: the ledger of the plugin migrations applied here, appended to only by `spn-devex plugin migration write` (`refs/devex/agent/plugins.md` § A release carries its migration, and a window applies what is pending first).

**`.spndevex/state.json` is the one file where the workspace's commands record what they need to remember, with one node for each owner — MUST** (RULE.DEVEX.WORKSPACE.324). Only commands write it, and nobody edits it by hand:

```json
{
  "workspace": {
    "name": "saasplane"
  },
  "workstreams": {
    "lastNumber": 35
  },
  "debug": {
    "telemetry": true
  }
}
```

A node joins the file only when the folder tree cannot show its fact — MUST; a new node, or a new key in one, comes with the reason the tree cannot hold it. **Each node has one writer, and a program changes only the nodes in its own column — MUST.** `workspace.name` is spnutils's, written by `workspace init <name>` and read by `workspace status`'s first line. `workstreams.lastNumber` is spnutils's, written when a folder shows a higher number than the record; it is read by spnutils, for the next free number, and by the plugin's workstream commands, which still write none. `debug.telemetry` is the plugin's, written by `debug switch on|off` and read by the plugin's hooks and by `workspace status`'s recording line. spnutils never writes `debug`, and the plugin never writes `workspace` or `workstreams`. A name is lower-case letters, digits and hyphens, starting with a letter, at most 40 characters — MUST.

**A write follows the same five steps in both programs — MUST.** (1) Take the lock: make the folder `.spndevex/.state.lock/`; making a folder either succeeds or fails at once, so only one writer holds it, and a lock older than 30 seconds was left by a program that died and is taken over with one line saying so. (2) Read the whole file again, under the lock. (3) Change its own node and nothing else: every other top-level node is written back exactly as it was read, including one this program does not know, so an older spnutils never drops a `debug` node a newer plugin wrote. (4) Write the result to a temporary file beside it, `.spndevex/.state.json.<pid>.tmp`. (5) Rename the temporary file over `state.json`, and remove the lock. **A read takes no lock**: the rename replaces the file in one step, so a hook reading `debug.telemetry` mid-write sees the old file or the new one, never half of either. A read that fails still answers *off*: a tool never fails because a switch could not be read.

**spnutils and the plugin ship on their own trains, so Support 5.50.0 goes out first and plugins 0.89.0 after it — MUST.** With Support 5.50.0 and plugins 0.88.0, spnutils folds `workstreams/state.json` into its node on its first run and deletes the old file, the higher number winning, and reads `debug.telemetry` when the node is there and `.debug/switches.json` when it is not. With both new, the plugin's migration 008 folds `.debug/switches.json` into `debug` under the lock and deletes the old file, a `debug` node already there winning; from then on the plugin reads and writes the node. With Support 5.49.0 and plugins 0.89.0, the migration refuses and stays pending, with one line: *"Install Support 5.50.0 or later and run `spnutils workspace init <name>`; the switch moves into .spndevex/state.json after that."* Until then the plugin goes on reading and writing `.debug/switches.json`, so the switch is never lost. **The move is one way**: a Support older than 5.50.0, run after the fold, counts from the folders alone and reads telemetry as off.

**A hook keeps its notes in `.debug/` only inside a workspace it found, and a `.spndevex/` holding nothing but `.debug/` is no workspace — MUST.** A hook that made `.spndevex/` to hold its notes would make a workspace out of wherever the window stood, root every later session below it there, and tell a partner's repository under it that it is day 0. So a hook with no workspace writes nothing, and every walk up to the root passes over a `.spndevex/` such a hook left before.

**A workstream is never a Claude Code session.** Claude Code owns the window, and `SessionStart` is its hook. A workstream is a scope of work, and it outlives every window you open on it.

**The number is an identity, never a priority.** You assign it once, in creation order, and nothing reuses or renumbers it. It rides along when the folder moves state, so a number reads the same wherever it sits. **A workstream holds one or more arcs**, and how many is the subject's business. **A new ask goes first into the arc that already owns its subject**, judged by what the arc changes and releases, and a new arc opens only when no arc owns it. Say which arc and which row took the ask. **A running step is never edited underneath**, because a session is following it as a brief.

| The state | Holds | You arrive by |
| --- | --- | --- |
| `backlog/` | prepared, blocked, or not picked up yet | opening it there, which is where most work starts |
| `open/` | what is being worked now | `mv` from `backlog/` — no ceremony, and no gate fires |
| `closed/` | a subject whose split plan is accounted for | `mv` from `open/`, and the close gate below decides it |

| Inside a workstream | Written for | Lives | Ends as |
| --- | --- | --- | --- |
| the approach page | **you** — argued, corrected, re-read | while the subject is open | the argument, kept as a receipt once its arcs have moved the content into the documents that own it |
| an arc | the agent, through the `workstream` commands — rows, each with its repository, its altitude, its check, what it waits on, what it writes and its state | until its rows are accounted for | closed through the sweep |
| an order | the agent — one delegated execution | until the child reports back | the report is appended, and it stays as the audit trail |

**There is no workstream file, and adding one is a defect.** The folder name is the subject, its parent is the state, and each arc's data carries its own rows and status.

**The workstream is kept as data, and every file has one owner** (`RULE.DEVEX.WORKSPACE.249`). The `.jsonl`
files and each arc's folder under `arcs/` are written only by the `spn-devex workstream` commands, and the
PreToolUse hook refuses a direct edit to them. The approach page, the preview, the samples, the plan and the
orders are yours to write by hand, and no command writes them. Two marked regions of the page are the
exception, each with one owner: the progress block and the `Open` block, which the commands write. An arc is
named by its number, `N<nnn>`, and its short subject, its title and its goal are fields of its data; one
number names its two folders, and `notes/` and `arcs/` hold nothing but arc folders. Its address is its row
on the approach page, `approach.html#N<nnn>`, and every link to an arc points there. The commands, the formats and the life of an arc are in [`workstream.md`](workstream.md). Anything a status file would hold is expressed by the tree, so a second copy only gives it somewhere to fall out of date. **The window is never part of the state of the work** — Claude Code owns window identity, and a subject outlives any window. Which workstream a window works on is context the agent holds from the conversation. The plugin keeps a note of its own for hooks, `window.json` in that window's folder under `.debug/sessions/`, and the note never says which state a workstream is in: the folder tree says that.

**A change to how something looks is made in the arc's preview first, as often as the developer likes, and built once in one order after their go** (`RULE.DEVEX.WORKSPACE.274`). A written order runs on Sonnet, shaping, cards and previews stay on the largest model, and every launch names its model (`RULE.DEVEX.AGENT.104`). An order quotes the facts it needs, each with its commit, and points to the rules it follows (`RULE.DEVEX.WORKSPACE.276`). The log gets one note per milestone (`RULE.DEVEX.WORKSPACE.275`).

**Every arc stands on its workstream's approach page** (`RULE.DEVEX.WORKSPACE.263`). Its row in *Cycles* is its address, `approach.html#N<nnn>`, so a subject with an arc and no page is a gap, and `workstream state check` names it. A page that argues nothing yet still carries the masthead and the Cycles row.

- **Scope belongs to the developer, and you only ever propose.** A workstream holds as much as they want it to hold. Widening is the default; splitting is the exception you raise, and never a folder you open on your own initiative.
- **One release train at a time.** That is mechanical and it holds. Any number of arcs in one workstream is their judgement, and you do not overrule it.
- **Closing a window costs nothing. Closing a scope is a check.** Moving `open/x` to `closed/x` is the one deliberate act in the loop, and the close gate below decides whether it may happen.
- **A close ends the session, and names the scope that runs next.** The number never chooses it, so the close says which open scope to run and why, what it freed for the others, and what it carried to whom.
- **A stop is a handover too.** Where you cannot finish, the question becomes the next `Q<n>` card and every row's state is written down. The prompt the next window starts from is recorded, because no file otherwise holds it.
- **The handover goes in the arc and in the reply, as markdown**, and **the prompt itself is a fenced code block** of nine aligned labelled lines, copied from `handover-template.md`. A fence carries a copy control; a blockquote reads the same and cannot be copied in one action.
- **Execution starts when the page, the arc and the notes are all current**, never when the one you touched last is.

When a window opens, surface what is stale — a subject untouched across sittings, an order nobody ran. Nothing has its permanent home in `.spndevex/`: everything there is on its way somewhere, and anything that stops moving is a decision nobody took.

### When work earns a workstream

**Three tells, and any one is enough.** Work earns a workstream when it needs an argument before it can be built, when it crosses more than one repo, or when it outlives one sitting. Everything else is just work you do, and a workstream minted for a one-file change is overhead nobody reads.

| It earns one when the work… | Because |
| --- | --- |
| needs an **argument before it is built** | the reasoning needs a page, and that page needs a home while you correct it |
| **crosses more than one repo** | the split plan is the only thing holding the halves in order |
| **outlives one sitting** | the next window finds it by reading, never by remembering |

**A new workstream takes the next free number across all three states.** Read `backlog/`, `open/` and `closed/` together, and `lastNumber` in the `workstreams` node of `.spndevex/state.json` beside them. Take the number after the higher of the two, and never reuse one. That record is what lets a closed workstream be deleted without its number being given out again.

**The `workstreams` node holds only what the folder tree cannot show — MUST** (`RULE.DEVEX.WORKSPACE.190`). Today that is one key, `lastNumber`: once a closed folder is deleted, no folder carries the highest number any more. A value the tree already shows, such as which state a workstream is in or how many arcs it has, never goes in the node, and a new key is added only with the reason the tree cannot hold it. `spnutils workspace init` and `workspace agent-sync` fold an older `workstreams/state.json` and `workstreams/.last-number` into the node, the higher number winning, and delete the old files.

### Which state a new workstream starts in

**The starting state is a conversation, never a default.** The developer may simply say *backlog* or *open*. When they do not, **you propose one and say why**. You never pick silently, and you never leave it as an open question either. Scope belongs to the developer and you only ever propose — rule RULE.DEVEX.WORKSPACE.038 — so they confirm or override your reason in one word.

| Propose | When | The tell |
| --- | --- | --- |
| **`open/`** | it can be started now | nothing blocks it — no unanswered card, no trigger, no workstream it waits on |
| **`backlog/`** | it cannot be started yet | it waits on a trigger, on another workstream, or on questions nobody answered — **and you can name the blocker** |

**Name the blocker, or the proposal is `open/`.** *Feels like later* is not a blocker. Where you cannot say what would unblock it, the work is available and belongs in `open/`. That rule matters more than the split itself: a backlog nobody can explain is where work goes to be forgotten.

**Two shapes tell you how the rule reads in practice**, and neither names a workstream:

- **A blocker you can name sends it to `backlog/`.** Cards nobody has answered, or a step wanting something that does not exist yet — an account, a released package, another workstream's output. Name it, and parking is right and reversible.
- **A sequencing preference does not.** *After the other one* is an order you chose, not a thing standing in the way, so the work is available and belongs in `open/`.

**Never name a live workstream in a file like this one.** The workspace is discovered rather than declared, so a list here becomes a second answer competing with the folders. Your session's orientation prints the real one at start, read from `.spndevex/` itself.

**`backlog/` → `open/` is how work starts.** It needs no ceremony, it is not a close, and no gate fires on it.

## Open a workstream with the agent update, and execute after

**A workstream opens with the agent update and the reload — MUST** (RULE.DEVEX.AGENT.049). Your own surfaces improve as the work does, so the update is never the closing act. A workstream that executes first spends its whole scope acting on the surfaces the last one left behind.

**Agent setup is three repositories, never one.** The foundation states the rule, `spnutils` realizes the floor and the commands, and the marketplace restates it. A pass that edits the plugins and stops has changed a restatement and left its source standing. That is how a rule ends up somewhere a partner can never read it.

**Nothing you edit is live before the install.** You read the installed plugin cache, so changing the concept, the chapters, the registers, the providers and the plugins leaves changed files and unchanged behaviour. Skills, agent briefs, reference files and `hooks.json` need a fresh window on top of the install. A hook **script** is the one exception, and it reloads on its next run.

**A registration and the file it names change in one act.** A window reads `hooks.json` once, at session start, and keeps calling the files it named then. A `PreToolUse` hook that cannot start refuses every tool, `Write` included, so the window cannot repair itself. Never move or delete a hook file a live window still names: do it in the same act as the install that names its replacement, with no other window open.

### First, settle which mode you are in

**Every authoring step here is a builder's, so answer this before you edit anything.** `SPN_DEVEX_AGENT_WORKSPACE` names the workspace the agent itself is built in, and your mode follows the place you are standing in. The concept rules it, under *The place decides the source* and the `PARTNER MODE` bullets. The key's own behaviour belongs to the `spnutils` repository's instruction file, and nothing here adds to it.

**Run `spnutils workspace status` and read the marketplace source beside the floor.**

| The source reads | You are | The marketplace is |
| --- | --- | --- |
| `directory:` and a path | a **builder** | the checkout beside its siblings, and its files are yours to edit |
| `github:` and a repository | a **partner** | the published repository, installed rather than authored |

**Unset means partner, and that is deliberate.** It is the answer a developer gets by doing nothing, so nothing sets that key for somebody.

**A partner reports a standard that is wrong or missing, and never edits the plugin they installed.** That edit sits in your own plugin cache. It reaches nobody else, and the next install replaces it. So the ask crosses upward as an order, and no file here names a second channel. Where you want one, say that plainly rather than choosing one yourself.

**A partner workspace is a full workspace, and you work it the same way.** Its repositories carry their own concept, their own documents, their own code and their own tests. What it does not hold is the foundation and the marketplace, so the book is cited by name and the plugins arrive installed. Everything else is the same: you read the members, you learn what each repository answers to, and you work its workstreams. So read the workspace you are standing in before you decide anything. Mode tells you which sources you may edit. It never tells you that there is less work to do.

### The loop belongs to the devex agent, and both modes run it

**Every agent runs this loop. Only the AUTHORING steps are a builder's.** Your mode decides which steps you perform, never whether the loop applies to you. A pass that edits a chapter and stops has changed the book and changed nobody's session. So the seven steps above are also the answer to *what else must change*, entered wherever your change belongs.

**A partner's half is short, and skipping it leaves you working from last month's rules.** You take the published update, install it, sync each repository, and then check that a fresh window really loads it. Where a standard is wrong or missing, you report it upward. You never edit the plugin you installed.

| You changed | It starts at | It reaches a session through |
| --- | --- | --- |
| a contradiction, or a new law | the concept, then the chapter carrying it | step 4, and nothing before it |
| a decision worth citing later | a register row, `RD.<DOMAIN>[.<SUBDOMAIN>].<NNN>` | the chapter and the plugins restating it |
| a realization true of one stack | that stack's provider seat | that stack's own plugin |
| a command, a gate, or the floor | the deterministic tool | its release, then step 6 |

**The book is not loaded in a session, and that is why step 4 exists.** You read the installed plugins, so a rule living only in a chapter reaches nobody at all. Carry it into the core plugin where it is stack-agnostic, and into the stack's plugin where it is not — as a skill, a reference card, or a lens bullet.

**A restatement citing a chapter carries a stamp, and that stamp moves when the chapter moves.** Restatement discipline makes a rule change N declared edits: the owning document, plus every registered restatement, in one change. **The owning document changes first, and every restatement follows it** (`RULE.DEVEX.WORKSPACE.229`): every reference a plugin ships restates the book, whatever it holds, so a builder edits the book, then runs `restates docs write` for a prose reference or `restates files write` for a folder restated as files. A restatement edited ahead of its source is undone by the next write from that source. Run `spn-devex restates check` to see which stamps your edit moved: it reads the path it is given, else `spn-foundation` in the workspace it runs in, and names that book on its first line. **It reports and writes nothing for a `docs` or `files` citation**, so you correct each of those `seen` values yourself once you have re-read the source and corrected any disagreement; `restates decisions write <ref>` restamps a `decisions` citation the same way, after the same re-read.

**A citation names a file, a section of a file, or a whole folder** (`RULE.DEVEX.AGENT.072`). The first two answer *did this rule move*. A folder answers the one they cannot — *did the set change* — because a stamp per file reports every edit and says nothing about a file nobody cited. Use it wherever what is restated is **all of them**: the clearest case is what the plugins carry for a partner, who never gets the book, where *the book grew a shape a partner does not have* is the failure the copy exists to prevent.

**A partner receives none of this until the marketplace is published.** Publishing is pushing that repository, and a plugin's installed cache is keyed by its version. So the version bump and the push belong to this loop rather than to whatever follows it. The marketplace's own instruction file rules when that count moves.

### The producer sweep — steps 1 to 4 are ours, and a partner performs none of them

**Producer only.** These four edit the foundation, the deterministic tool and the plugin source. A partner holds none of the three, and extends by adding rather than by editing what they installed.

| Step | What it covers | Live yet? |
| --- | --- | --- |
| 1 | the concept, then the chapters that carry it | no |
| 2 | the registers — the decision row, and the instrument that reaches it | no |
| 3 | the provider seats, then the deterministic tool where a command or the floor changes | no |
| 4 | the plugins, which restate all of it | no |

### The reload — both modes run these, and the order is load-bearing

| Step | What it covers | Live yet? |
| --- | --- | --- |
| 5 | **release `spnutils`, where step 3 changed it** | the new CLI, once released |
| 6 | **`spnutils workspace agent-sync`** — one verb | scripts only |
| 7 | a **fresh window** | yes |

**Step 5 comes first because the plugins restate a tool the session runs.** A plugin naming a command the installed CLI does not carry is a rule nobody can follow, and the CLI reports the last **release** rather than the checkout — so unreleased commits leave every window silently behind. Where step 3 changed only a comment and the generated output is byte-identical, there is nothing to release and saying so is the answer.

**Step 6 is one verb and not two.** `workspace agent-sync` refreshes every plugin whose installed copy differs from the marketplace checkout — uninstall and install at project scope, in the right order — and then re-mints each repo's generated rules, its managed `CLAUDE.md` block, and the floor's permission tiers. It reports one line per plugin: `installed`, `refreshed`, `current`, `unverified` or `unpublished`. A plugin the marketplace does not list yet is `unpublished`, with a note to sync again once it is published, and the rest still install.

**Do not run `claude plugin uninstall` and `install` by hand first.** It is not merely the same thing twice. The installer compares the installed copy against the checkout **before** replacing it, because at that moment the installed copy is what the live window actually loaded — which is the only way to answer *did this window's hooks, agents and skills change*. Uninstalling by hand throws that moment away, and the sync that follows can then only report `current`: true, and useless. Reach for the raw CLI only where `spnutils` itself cannot run.

**Step 6 comes before step 7, and reversing them costs you a second reload.** All of it is read at session start, so a window opened before them loads the previous generation.

**Reloading in the middle means reloading twice**, and a half-reloaded session is one where you cannot tell which surface answered. Do every edit, release the tool if it moved, sync once, then take one fresh window.

### A partner's form of this rule, which is shorter

**The MUST is the same and the procedure is not.** A partner receives the agent setup as a published plugin version, so there is nothing for them to edit and nothing to restate.

| Step | What a partner does |
| --- | --- |
| 1 | check whether a newer plugin version has been published |
| 2 | **`spnutils workspace agent-sync`** — one verb: it installs or refreshes what drifted, then re-mints the rules and the floor |
| 3 | a **fresh window** |

**Where the update you need does not exist yet, the ask crosses upward as an order.** A rule you cannot get from a plugin or a package is a gap in what the Foundation publishes, and naming it is how it gets closed. It is never something to work around locally, because a local fix is a rule that exists for one workspace.

**On a partner workspace the install fetches over the network.** Your marketplace source is a repository rather than a folder on this machine, so step 2 downloads and installs executable content — hooks and their scripts — into your session. **The floor allows it without asking**, because it writes the plugin cache and your own settings rather than publishing anything. Stated here so the behaviour is one you chose rather than one you met.

**Run the hook harness after any hook edit**, and read what it says rather than its exit code.

## The two gates a workstream carries

Both read one thing: the **split plan**, which is the step rows of every arc read by their **Repo** column. You never write a separate plan — you filter by repository, and each repository's rows are what that repository must change.

| Gate | Fires when | Verdict |
| --- | --- | --- |
| **documents first** | you write an approach page into a repo's own pocket while an open workstream's plan still has rows that have not landed | a **warning** naming the workstream. Getting ahead of the plan is sometimes right, so it never refuses |
| **close** | a subject moves into `workstreams/closed/` | a **refusal** while any row is one nobody decided, one somebody started and put down, one held on an open card, or one still marked in progress |
| **answered card** | you write while an approach page still asks a question its arc records as answered | a **warning** naming the card. Fold it into the section that now states it |

**The arcs carry the rows, and the approach page does not.** The page argues the change, and its `How` ends in a *Cycles* table with one row per arc, written from each arc's data, with the generated progress block under it. Each *Cycles* row carries a stamp of its arc's goal, title and repositories, so a check refuses a turn that leaves the page behind an arc proposed or moved to a new goal or repository; adding a row never does, and the places of `How` are produced from the rows' `repo`. Where the page and an arc disagree, the arc is right.

**The close gate reads every step row of every arc as one split plan**, so a documentation row is held exactly as a code row is. Park one in a note beside the page and no gate can see it.

**The close gate checks that work is accounted for, never that it is finished.** Every row reaches one of three states, and all three pass:

| State | Means | Reads as |
| --- | --- | --- |
| `landed` | the content is in the node that owns it | `landed → spn-platform-ts/packages/module-server-iam-ts/docs/…` |
| `carried` | it moves to a named successor scope, which is now open | `carried → captcha-foundation-concept` |
| `deferred` | consciously parked, with an event somebody will notice | `deferred → the first consumer outside this repo` |
| empty | nobody decided. **The gate refuses it** | — |
| `in progress` | somebody is on it now. **The gate refuses it** | `in progress 2026-09-29 14:32 +05:30` |
| `◐ stopped` | begun and put down. **The gate refuses it too** — half an edit sits in the tree and only the agent that stopped knows where | `stopped → Q8 answered · did the chapter · left the row · unsafe decisions.md` |
| `⏸ held on Q<n>` | waits for the answer to card `Q<n>`, because that answer can change it (`RULE.DEVEX.WORKSPACE.188`). **The gate refuses it** | `⏸ held on Q12` |

**A stopped row is finished, or split honestly.** The half that reached its node becomes a landed row, and the half that did not becomes a second row, carried or deferred. Never retype the mark and leave the done half unrecorded.

**There is no override, and none is needed.** If you want to close and defer, say so and the row becomes `deferred` with its trigger. Recording the deferral is how you get through, and a flag would leave no trace where a recorded deferral is exactly what a later scope needs to find.

## An arc is the unit of cross-repo change

Plan one change across repos as an **arc**: ordered rows, one per step, each carrying **Repo · Altitude · What · Mechanism · Acceptance · State**. The rows run in chain order by repository, then by altitude (`DOCS` · `CODE` · `GENERATED` · `RELEASE` · `PROOF`). Each step also has a **depth**, which decides where it runs.

| Step is… | Execute |
| --- | --- |
| **shallow** — mechanical once decided | inline, in the workspace window, under the target's law |
| **deep** — needs the repo's full context | **delegate** to a child session rooted in the target repo, the step file as its brief; fold the result back. The developer keeps one window |
| **absent** — the repo is not in this workspace | the step itself is the deliverable: an order in the arc's `notes/N<nnn>/orders/`, handed to whoever holds that repo |

**The return path is unchanged.** Where work in any repo uncovers something contradicting the foundation, that comes home as a decision-register row. A convention corrected quietly in a sibling is a fork nobody declared.

**The partner boundary crosses upward only as an ask, never as work.** No level takes orders from the level below.

### An arc carries a status, and it is one of six

**The set is closed (`RULE.DEVEX.WORKSPACE.058`), and the developer's words are stored while the rest is
worked out (`RULE.DEVEX.WORKSPACE.307`).** Every check reads the status through one owner, `arcStatus` in the
plugin's workstream library, so no two of them disagree.

| Status | Stored or worked out | Runnable work? | Terminal | Must also carry |
| --- | --- | --- | --- | --- |
| `PROPOSED` | stored: being shaped, and reshaped freely while never decided | **no** — not agreed | no | — |
| `DECIDED` | stored: the developer's go on its preview, and any wait they gave | **yes**, unless it holds a wait | no | the wait, where they gave one |
| `RUNNING` | worked out: decided, and a step has started | **yes** | no | — |
| `LANDED` | worked out: every step landed, the deferred, carried and replaced left out, and the proof passed | no | yes | — |
| `CARRIED` | stored: the remaining work left this workstream | no | yes | where it went |
| `DROPPED` | stored: not wanted, once decided | no | yes | its reason |

**Words that are not statuses**, and each already had a word in the set: `OPEN` and `PREPARED` are
`DECIDED` (or `PROPOSED` where nobody agreed it); `CLOSED`, `CLOSED IN` and `CLOSING` are `LANDED`, or
`CARRIED` where the work moved to another workstream; `IN FLIGHT` and `PART-LANDED` are `RUNNING`, which the
steps work out; `HELD` is `DECIDED` with the developer's words as its wait. The pattern is a word for a
**stage** rather than a word for a **state**.

**No step starts before the go, and reading is never a step — MUST** (`RULE.DEVEX.WORKSPACE.278`). Reading and
drafting are planning jobs, which record no step. Steps may be written before the go; `row add` and `row state` refuse
one written `running` or `landed` on an arc not `DECIDED`, or holding a wait. **The go is its own write, and
it carries the developer's words**: `arc edit <ws>/<arc> --status DECIDED --note "<the developer's words>"`,
logged beside the move. A stored `PROPOSED` wins over the steps: a changed goal stops what was building until
the next go. The review-fixes arc reads `RUNNING` until the word to close stores its `LANDED`.

**The status decides none of these three.** It does not carry **ordering**, which is the plan's
business. It does not describe a **workstream**, whose state is the folder it sits in. It does not
describe the **approach document**, which carries the document status vocabulary instead. Three
altitudes, three vocabularies, and no word shared between them.

**The stored status is written by `arc edit --status`, into the arc's `state.json`.** The plugin's schema
holds the stored set, so `row add` and `row state` refuse a word outside it, `RUNNING` among them, and `workstream state
check` names a `state.json` that holds one. A file at `schemaVersion` 1 is brought to 2 by plugin migration 006.

**A terminal status means the arc is finished, so its unlanded steps are history rather than work.**

### A landed arc is never reopened

**The kind of change decides what moves (`RULE.DEVEX.WORKSPACE.261`).**

| Moment | What moves |
| --- | --- |
| A small decision while building, inside what was agreed | a step; no status moves, and the decision is logged |
| A fix to what a landed arc delivered, its goal unchanged | a step on the review-fixes arc, naming the arc it fixes |
| New scope, which no arc's goal promised | a new arc, `PROPOSED` |
| The developer agrees an open arc's goal changed | the arc back to `PROPOSED`; its running steps stop until their go |
| The workstream is closed | nothing reopens; new scope is a new workstream |

**A step is never added to an arc that reads `LANDED`**: `row add` and `row state` refuse it, and names the review-fixes
arc. A stored `LANDED` arc with a step not landed is named by `workstream state check`, which the Stop hook
runs for this window's workstreams.


## Producer and partner — two shapes of workspace

**A producer workspace holds the marketplace, the blueprint library and the book as checkouts. A partner's holds none of them.** They consume all three as published artifacts. The plugins arrive from `github:saasplane/spn-claude-marketplace`, blueprints from the machine store by pin, and the book as a published rendering. Their workspace is an estate repo plus any number of `APPS` repos, and that is the whole of it.

**Write for the partner, and mark anything only a producer can act on.** An instruction they cannot follow is worse than a missing one, because it reads as a step they somehow skipped.

| Never | Instead |
| --- | --- |
| point at a path inside a sibling checkout — the book's repo included | **cite the book by name**, because a path resolves only for someone holding both checkouts |
| nothing — `repo agent-sync` reads the mode and wires the checkout | nothing — the same command reads the mode and wires the published source |
| name a marketplace PATH as a value to set | name `SPN_DEVEX_AGENT_WORKSPACE`, which names a place rather than a source. Set, and the repos inside it are a **builder**'s; unset — what every partner has — and the marketplace is the published one. Nothing may set it for somebody |

**No variable asks for a rehearsal, and none ever should.** A provisioning run names its own mode on
the command — `--plan` or `--apply`, exactly one, with no default (`RULE.SUPPORT.INFRA.094`). `--plan` reaches
no account, so the cloud walk is rehearsable before any account exists. `SPN_POSTURE` is **retired**:
it asked for a rehearsal through the environment, and a rehearsal is now a mode you type.

**`--local` survives on one command, and it is not an agent one.** `infra release --local` stages a package into the machine store, and that is an ordinary partner act. The wiring commands take no flag at all: `repo agent-sync` has no options and reads the mode from `SPN_DEVEX_AGENT_WORKSPACE` — set, and the marketplace is the checkout beside its siblings; unset, which is what every partner has, and it is the published one. Nothing may set it for somebody.

## A consumer repo needs no peer checkout

One constraint decides where every common rule lives. **A product repo built on the platform has exactly one thing: its own checkout, and the packages it installed.** A rule an agent needs there must arrive through a channel that travels:

| Channel | Travels to a consumer? | Carries |
| --- | --- | --- |
| The **plugin**, installed from the marketplace | **yes** | every common rule — foundation doctrine and stack standards alike |
| The repo's own `CLAUDE.md` | yes, generated in that repo | imports of that repo's concept, docs map and inventory |
| The **generated inventory** beside it | yes, written locally | what this repo currently *contains*, never a rule |
| A relative path into a sibling checkout | **no** | nothing a consumer can rely on |

**Common rules are carried by the plugin, never by a link into a peer repo.** Cite by name any document that must be cited across repos, and let the plugin carry the substance.

**The rule reaches every file that ships inside a repository, agent instruments included** (rule RULE.DEVEX.WORKSPACE.099). A `CLAUDE.md` is walked by no validator, but it travels with its repo and is read where the siblings may be absent — so it cites by name too. The workspace's `CLAUDE.md` is generated too and names no checkout, so it needs no exception. And a repository's instruction file states what is true of that repository, never what other repositories may do.

## Skills are what a consumer acts on; the book is why

Guidance lives in three instrument layers, and they are not interchangeable: the deterministic CLI (installed), the plugin (installed), and the documentation corpus (not installed). **Anything a reader must act on lives in the first two.** A skill that says *"the authority for this is chapter N of the book"* has pushed its reader onto a layer they do not have. The skill carries the actionable substance itself, and cites the book only as provenance, by name. For a consumer, the restatement *is* the standard.

## Where a rule belongs

| The rule is true of… | It lives in | Because |
| --- | --- | --- |
| every repo on the backbone | the core plugin, as a `refs/` card | it must reach a consumer with no peers |
| a stack, in any repo | that stack's plugin skills | same, scoped to the stack that ships it |
| one repo only | that repo's own docs, which its `CLAUDE.md` imports or maps | nobody else can act on it |
| what a repo currently contains | its generated inventory | it is a fact, not a rule, and it changes on install |

**Write nothing into a repo's `CLAUDE.md`: `agent-sync` owns it.** A fact about one repo goes into that repo's docs, and a rule for more than one repo goes into a plugin. A rule written twice drifts.

## What never crosses

- **Conventions.** Naming, layout, comment style, doc grammar — each repo's own, selected by its manifests.
- **Identifiers into a stack-agnostic surface.** A repo that documents capabilities and contracts must not acquire another repo's tables, columns, or framework symbols.
- **Links out of a standalone repo.** A relative path into a sibling is a broken link for everyone outside the workspace; reference by name instead. Dependencies between repos point one way, and that direction is stated by the repos themselves.
