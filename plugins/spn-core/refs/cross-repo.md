<!-- spn:restates
{
  "chapters": [
    {
      "path": "CONCEPT.md",
      "seen": "ddc8bfaa"
    },
    {
      "path": "docs/03-capabilities/04-devex/09-utils.md",
      "seen": "a5138715"
    },
    {
      "path": "docs/03-capabilities/04-devex/11-workspace.md",
      "section": "The agent is updated first, and reloaded before anything runs",
      "seen": "ba41b93f"
    }
  ],
  "rows": [
    "RD.DEVEX.020",
    "RD.DEVEX.044",
    "RD.DEVEX.048",
    "RD.DEVEX.049"
  ]
}
-->

# Cross-Repo Work — Stack-Agnostic

How an agent works across more than one repository on a SaaS Plane estate, and where a rule belongs so every agent sees it. Apply it in any stack and to any repo pair. Source of truth: the foundation's `CONCEPT.md` — `#### DevEx Workspace`, and **THE MACHINE'S OWN LAYOUT** for the env seat. Also `03-capabilities/04-devex/09-utils.md` **§ The env seat**, `03-capabilities/04-devex/11-workspace.md` **§ The agent is updated first, and reloaded before anything runs**, and decisions RD.DEVEX.020, RD.DEVEX.044, RD.DEVEX.048 and RD.DEVEX.049. Where this restatement and those disagree, the sources win and this file is regenerated.

## One window, laws by declaration

A session opens on the **workspace folder** — the discovered set of sibling checkouts — and works across every repo in it. **The rule set binding a file derives from the governing manifests above it, never from where the session started.** `sprepo.json` names the world and, for an `APPS` repo, the stack claim. `spkind.json` names an apps node. An estate node is found by its `spinfrapkg.json`, with the type at `src/spestate.json`.

Follow this discipline, per file touched:

1. **Resolve the law first.** Before editing a file, know which repo governs it — load that repo's `CLAUDE.md` and its generated `.claude/saasplane/rules.md` if you have not already this session, and follow those for those files.
2. **Never carry one repo's conventions into another's files.** A convention right in one repo is frequently wrong in the next: one repo bans implementation identifiers, another is built from them. The manifest decides, not the file you edited last.
3. **Doors hold everywhere.** A skill, rule or hook that declares a repo type or stack claim activates only where its declaration matches. An infra skill in a web repo refuses by name.

Read across freely, in every direction — it needs no ceremony.

## The machine seat — `~/.spnenv`

**One file on the machine holds every SaaS Plane value, and that file is `~/.spnenv`** (decision RD.DEVEX.048; the chapter is DevEx Utils § *The env seat*). It sits **outside `~/.spnutils`** on purpose. `rm -rf ~/.spnutils/*` is an allowed reset, and the developer's typed credentials are the one thing on the machine nobody can regenerate.

`spnutils` reads it **directly**, so nothing has to be exported to reach a process.

### Four regions, one writer each

The order is not a preference. Read a file top to bottom and this is what you find:

| # | Region | Writer | What you may do |
| --- | --- | --- | --- |
| 1 | `spnutils:producer` | derived | read it. **A partner's file does not have it** |
| 2 | `spnutils:managed` | derived | read it. A run rewrites it whole, so nothing typed inside survives |
| 3 | `spnutils:dev` | **the developer, entirely** | **nothing.** Never read between these markers, never write, never reorder |
| 4 | `spnutils:keep` | you write the key; the developer writes the value | add a key here |

**`producer` leads so a partner's file is a truncation.** Theirs starts at `managed` and runs `managed` → `dev` → `keep`. A missing `producer` region in a partner's file is correct, never a fault to repair.

**`dev` sits above `keep` because the file is plain shell.** It runs top to bottom, so a key the developer defines once resolves in the values below it. That is why a `keep` value may reference a `dev` key and never the reverse.

### You add the key. You never invent the value

**`spnutils` derives no key.** It provisions the file's shape — the markers, the producer region, the managed region's default setup — and lays the keep region out. Which keys the keep region holds is yours.

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

That distinction is the whole rule, and it is narrower than the one this reference used to state. The tool's own verb reads every value in the file on every `sync`, because preserving the developer's regions requires reading them. So *do not read it* was never true, and stating it did not stop the thing it was written to stop.

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

### Two cautions before you run a workspace verb

- **The tool never writes a shell profile.** `~/.zshenv` and its siblings stay the developer's. Sourcing `~/.spnenv` from a profile is their line to add, and it trades away the exposure this file avoids: every value exported to every process. **You never edit a shell profile yourself.**
- **`workspace init` in a scratch folder rewrites the real `~/.spnenv`.** Point `HOME` at a temp directory before you run `init` or `sync` for a demo.

### A run manages only what it can observe

A run writes what it can see, and it stops there. **It never deletes a key because it failed to see what that key describes.** Staleness is reported by `workspace status`, and never repaired by deletion.

**Retiring a key is not deleting it.** A value in the keep region may be the only copy on the machine, so a run carries what it finds and stops writing it back.


## The workspace's working state — `.spndevex/`

The workspace folder carries two dot-homes: `.claude/` (settings — the marketplace, the plugin union, the permission floor) and `.spndevex/` — the agent's working state. **State and settings, never rules**: a rule filed there has two homes, and the copy nobody updates is the one an agent reads.

**The container is a workstream, and it is named for its subject.** One folder holds everything a subject needs: the argument you read, the arcs the agent executes, and the brief behind every delegated run. Its name is a number and the subject; its parent folder is its state.

```
.spndevex/
  workstreams/
    backlog/
      {NNN}-{subject}/                    prepared, blocked, or not picked up yet
    open/
      {NNN}-{subject}/                    being worked now
        {subject}-approach.html           yours: the argument, iterated while you read it
        arcs/                             the agent's: steps, target, acceptance, depth
        orders/                           one brief per delegated execution, and its report
        notes/                            scratch, scoped to this subject
    closed/
      {NNN}-{subject}/                    the whole folder, once its plan is accounted for
  orders/
  README.md
```

**A workstream is never a Claude Code session.** Claude Code owns the window, and `SessionStart` is its hook. A workstream is a scope of work, and it outlives every window you open on it.

**The number is an identity, never a priority.** You assign it once, in creation order, and nothing reuses or renumbers it. It rides along when the folder moves state, so a number reads the same wherever it sits. **A workstream holds one or more arcs**, and how many is the subject's business while you are planning. **A scope arriving mid-execution gets a new arc, always**, because an arc under execution is being read as a brief.

| The state | Holds | You arrive by |
| --- | --- | --- |
| `backlog/` | prepared, blocked, or not picked up yet | opening it there, which is where most work starts |
| `open/` | what is being worked now | `mv` from `backlog/` — no ceremony, and no gate fires |
| `closed/` | a subject whose split plan is accounted for | `mv` from `open/`, and the close gate below decides it |

| Inside a workstream | Written for | Lives | Ends as |
| --- | --- | --- | --- |
| the approach page | **you** — argued, corrected, re-read | while the subject is open | split by scope into repo documents, then kept as a receipt |
| an arc | the agent — steps, target repo, acceptance, depth | until its steps tick | closed through the sweep |
| an order | the agent — one delegated execution | until the child reports back | the report is appended, and it stays as the audit trail |

**There is no workstream file, and adding one is a defect.** The folder name is the subject, its parent is the state, and the approach page already tracks the arcs. Anything a status file would hold is expressed by the tree, so a second copy only gives it somewhere to fall out of date. **The window is not tracked either** — Claude Code owns window identity, and a subject outlives any window.

**A subject with an arc and no approach page is a valid shape**, not a gap. Nobody has argued it yet.

- **Scope belongs to the developer, and you only ever propose.** A workstream holds as much as they want it to hold. Widening is the default; splitting is the exception you raise, and never a folder you open on your own initiative.
- **One release train at a time.** That is mechanical and it holds. Any number of arcs in one workstream is their judgement, and you do not overrule it.
- **Closing a window costs nothing. Closing a scope is a check.** Moving `open/x` to `closed/x` is the one deliberate act in the loop, and the close gate below decides whether it may happen.
- **A close ends the session, and names the scope that runs next.** The number never chooses it, so the close says which open scope to run and why, what it freed for the others, and what it carried to whom.
- **A stop is a handover too.** Where you cannot finish, the question becomes the next `Q<n>` card and every row's state is written down. The prompt the next window starts from is recorded, because no file otherwise holds it.
- **The handover goes in the arc and in the reply, as markdown**, and **the prompt itself is a fenced code block**. A fence carries a copy control; a blockquote reads the same and cannot be copied in one action.
- **Execution starts when the page, the arc and the notes are all current**, never when the one you touched last is.

When a window opens, surface what is stale — a subject untouched across sittings, an order nobody ran. Nothing has its permanent home in `.spndevex/`: everything there is on its way somewhere, and anything that stops moving is a decision nobody took.

### When work earns a workstream

**Three tells, and any one is enough.** Work earns a workstream when it needs an argument before it can be built, when it crosses more than one repo, or when it outlives one sitting. Everything else is just work you do, and a workstream minted for a one-file change is overhead nobody reads.

| It earns one when the work… | Because |
| --- | --- |
| needs an **argument before it is built** | the reasoning needs a page, and that page needs a home while you correct it |
| **crosses more than one repo** | the split plan is the only thing holding the halves in order |
| **outlives one sitting** | the next window finds it by reading, never by remembering |

**A new workstream takes the next free number across all three states.** Read `backlog/`, `open/` and `closed/` together, take the number after the highest, and never reuse one.

### Which state a new workstream starts in

**The starting state is a conversation, never a default.** The developer may simply say *backlog* or *open*. When they do not, **you propose one and say why**. You never pick silently, and you never leave it as an open question either. Scope belongs to the developer and you only ever propose — decision RD.DEVEX.038 — so they confirm or override your reason in one word.

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

**A workstream opens with the agent update and the reload — MUST** (RD.DEVEX.049). Your own surfaces improve as the work does, so the update is never the closing act. A workstream that executes first spends its whole scope acting on the surfaces the last one left behind.

**Agent setup is three repositories, never one.** The foundation states the rule, `spnutils` realizes the floor and the verbs, and the marketplace restates it. A pass that edits the plugins and stops has changed a restatement and left its source standing. That is how a rule ends up somewhere a partner can never read it.

**Nothing you edit is live before the install.** You read the installed plugin cache, so changing the concept, the chapters, the registers, the providers and the plugins leaves changed files and unchanged behaviour. Skills, agent briefs, reference files and `hooks.json` need a fresh window on top of the install. A hook **script** is the one exception, and it reloads on its next run.

### The producer sweep — steps 1 to 4 are ours, and a partner performs none of them

**Producer only.** These four edit the foundation, the deterministic tool and the plugin source. A partner holds none of the three, and extends by adding rather than by editing what they installed.

| Step | What it covers | Live yet? |
| --- | --- | --- |
| 1 | the concept, then the chapters that carry it | no |
| 2 | the registers — the decision row, and the instrument that reaches it | no |
| 3 | the provider seats, then the deterministic tool where a verb or the floor changes | no |
| 4 | the plugins, which restate all of it | no |

### The reload — both modes run these, and the order is load-bearing

| Step | What it covers | Live yet? |
| --- | --- | --- |
| 5 | **install** — uninstall and install at project scope, sequentially, from the workspace root | scripts only |
| 6 | the **per-repo refresh and the workspace sync**, which re-mint what a session start reads | no |
| 7 | a **fresh window** | yes |

**Step 6 comes before step 7, and reversing them costs you a second reload.** The per-repo refresh writes each repo's generated rule file and its managed `CLAUDE.md` block; the workspace sync re-mints the floor's permission tiers. **All three are read at session start**, so a window opened before them loads the previous generation.

**Reloading in the middle means reloading twice**, and a half-reloaded session is one where you cannot tell which surface answered. Do every edit, then install once, then sync, then take one fresh window.

### A partner's form of this rule, which is shorter

**The MUST is the same and the procedure is not.** A partner receives the agent setup as a published plugin version, so there is nothing for them to edit and nothing to restate.

| Step | What a partner does |
| --- | --- |
| 1 | check whether a newer plugin version has been published |
| 2 | **install** it — uninstall and install at project scope, sequentially, from the workspace root |
| 3 | the **per-repo refresh and the workspace sync** |
| 4 | a **fresh window** |

**Where the update you need does not exist yet, the ask crosses upward as an order.** A rule you cannot get from a plugin or a package is a gap in what the Foundation publishes, and naming it is how it gets closed. It is never something to work around locally, because a local fix is a rule that exists for one workspace.

**On a partner workspace the install fetches over the network.** Your marketplace source is a repository rather than a folder on this machine, so step 2 downloads and installs executable content — hooks and their scripts — into your session. **The floor allows it without asking**, because it writes the plugin cache and your own settings rather than publishing anything. Stated here so the behaviour is one you chose rather than one you met.

**Run the hook harness after any hook edit**, and read what it says rather than its exit code.

## The two gates a workstream carries

Both read one thing: the **split plan**, which is the approach page's `How` tables read by their **scope** column. You never write a separate plan — you filter by scope, and each repo's rows are what that repo's documents must say.

| Gate | Fires when | Verdict |
| --- | --- | --- |
| **documents first** | you write an approach page into a repo's own pocket while an open workstream's plan still has rows that have not landed | a **warning** naming the workstream. Getting ahead of the plan is sometimes right, so it never refuses |
| **close** | a subject moves into `workstreams/closed/` | a **refusal** while any row is one nobody decided, or one somebody started and put down |
| **answered card** | you write while an approach page still asks a question its arc records as answered | a **warning** naming the card. Fold it into the section that now states it |

**A seat page is where the split lands.** The workstream page is divided by scope into the documents that own each part, so a re-alignment row starts there and lives on the seat page afterwards. The workstream page then keeps it as a receipt.

**The split plan is both `How` tables, not one.** The gate reads any of them carrying a scope column and a state, so the documents a design obliges are held exactly as the pieces you build are. Park one in a note and no gate can see it.

**The close gate checks that work is accounted for, never that it is finished.** Every row reaches one of three states, and all three pass:

| State | Means | Reads as |
| --- | --- | --- |
| `landed` | the content is in the node that owns it | `landed → spn-platform-ts/packages/module-server-iam-ts/docs/…` |
| `carried` | it moves to a named successor scope, which is now open | `carried → captcha-foundation-concept` |
| `deferred` | consciously parked, with an event somebody will notice | `deferred → the first consumer outside this repo` |
| ⬜ | nobody decided. **The gate refuses it** | — |
| `◐ stopped` | begun and put down. **The gate refuses it too** — half an edit sits in the tree and only the agent that stopped knows where | `stopped → Q8 answered · did the chapter · left the row · unsafe decisions.md` |

**A stopped row is finished, or split honestly.** The half that reached its node becomes a landed row, and the half that did not becomes a second row, carried or deferred. Never retype the mark and leave the done half unrecorded.

**There is no override, and none is needed.** If you want to close and defer, say so and the row becomes `deferred` with its trigger. Recording the deferral is how you get through, and a flag would leave no trace where a recorded deferral is exactly what a later scope needs to find.

## An arc is the unit of cross-repo change

Plan one change across repos as an **arc**: ordered steps, each naming its target repo, its outcome, its acceptance, and its **depth**.

| Step is… | Execute |
| --- | --- |
| **shallow** — mechanical once decided | inline, in the workspace window, under the target's law |
| **deep** — needs the repo's full context | **delegate** to a child session rooted in the target repo, the step file as its brief; fold the result back. The developer keeps one window |
| **absent** — the repo is not in this workspace | the step itself is the deliverable: an order in `orders/`, handed to whoever holds that repo |

**The return path is unchanged.** Where work in any repo uncovers something contradicting the foundation, that comes home as a decision-register row. A convention corrected quietly in a sibling is a fork nobody declared.

**The partner boundary crosses upward only as an ask, never as work.** No level takes orders from the level below.

## Producer and partner — two shapes of workspace

**A producer workspace holds the marketplace, the blueprint library and the book as checkouts. A partner's holds none of them.** They consume all three as published artifacts. The plugins arrive from `github:saasplane/spn-claude-marketplace`, blueprints from the machine store by pin, and the book as a published rendering. Their workspace is an estate repo plus any number of `APPS` repos, and that is the whole of it.

**Write for the partner, and mark anything only a producer can act on.** An instruction they cannot follow is worse than a missing one, because it reads as a step they somehow skipped.

| Never | Instead |
| --- | --- |
| point at a path inside a sibling checkout — the book's repo included | **cite the book by name**, because a path resolves only for someone holding both checkouts |
| offer `repo agent-init --local`, which registers a marketplace checkout | let the marketplace resolve from GitHub, which is what a partner has |
| name `SPN_DEVEX_MARKETPLACE_PATH` as a value to set | mark it **producer-only** wherever it appears. It is the whole of the `spnutils:producer` region, which a partner's file does not have. `SPN_DEVEX_BLUEPRINT_PATH` is **retired** — a working tree is reached by an `@path` pin, declared per layer in a manifest |

**Not every `--local` is producer-only.** `infra release --local` stages a package into the machine store, and that is an ordinary partner act. The flag to mark is the one on `repo agent-init`.

## A consumer repo needs no peer checkout

One constraint decides where every common rule lives. **A product repo built on the platform has exactly one thing: its own checkout, and the packages it installed.** A rule an agent needs there must arrive through a channel that travels:

| Channel | Travels to a consumer? | Carries |
| --- | --- | --- |
| The **plugin**, installed from the marketplace | **yes** | every common rule — foundation doctrine and stack standards alike |
| The repo's own `CLAUDE.md` | yes, it is that repo's file | only what is true of that one repo |
| The **generated inventory** beside it | yes, written locally | what this repo currently *contains*, never a rule |
| A relative path into a sibling checkout | **no** | nothing a consumer can rely on |

**Common rules are carried by the plugin, never by a link into a peer repo.** Cite by name any document that must be cited across repos, and let the plugin carry the substance.

**The rule reaches every file that ships inside a repository, agent instruments included** (decision RD.DOCS.035). A `CLAUDE.md` is walked by no validator, but it travels with its repo and is read where the siblings may be absent — so it cites by name too. **The workspace's own `CLAUDE.md` is the one exception**: the sibling checkouts are its subject, and it ships nowhere. And a repository's instruction file states what is true of that repository, never what other repositories may do.

## Skills are what a consumer acts on; the book is why

Guidance lives in three instrument layers, and they are not interchangeable: the deterministic CLI (installed), the plugin (installed), and the documentation corpus (not installed). **Anything a reader must act on lives in the first two.** A skill that says *"the authority for this is chapter N of the book"* has pushed its reader onto a layer they do not have. The skill carries the actionable substance itself, and cites the book only as provenance, by name. For a consumer, the restatement *is* the standard.

## Where a rule belongs

| The rule is true of… | It lives in | Because |
| --- | --- | --- |
| every repo on the backbone | the core plugin, as a `refs/` card | it must reach a consumer with no peers |
| a stack, in any repo | that stack's plugin skills | same, scoped to the stack that ships it |
| one repo only | that repo's `CLAUDE.md` | nobody else can act on it |
| what a repo currently contains | its generated inventory | it is a fact, not a rule, and it changes on install |

**Do not restate a plugin rule in a repo's instruction file.** A rule written twice drifts. If a rule seems worth stating in more than one repo, that is the signal it belongs in the plugin instead.

## What never crosses

- **Conventions.** Naming, layout, comment style, doc grammar — each repo's own, selected by its manifests.
- **Identifiers into a stack-agnostic surface.** A repo that documents capabilities and contracts must not acquire another repo's tables, columns, or framework symbols.
- **Links out of a standalone repo.** A relative path into a sibling is a broken link for everyone outside the workspace; reference by name instead. Dependencies between repos point one way, and that direction is stated by the repos themselves.
