# Cross-Repo Work — Stack-Agnostic

How an agent works across more than one repository on a SaaS Plane estate, and where a rule belongs so every agent sees it. Apply it in any stack and to any repo pair. Source of truth: the foundation's `CONCEPT.md` (`#### DevEx Workspace`) and decision RD.DEVEX.020 — where this digest and those disagree, the sources win and this file is regenerated.

## One window, laws by declaration

A session opens on the **workspace folder** — the discovered set of sibling checkouts — and works across every repo in it. **The rule set binding a file derives from the governing manifests above it, never from where the session started.** `sprepo.json` names the world and, for an `APPS` repo, the stack claim. `spkind.json` names an apps node. An estate node is found by its `spinfrapkg.json`, with the type at `src/spestate.json`.

Follow this discipline, per file touched:

1. **Resolve the law first.** Before editing a file, know which repo governs it — load that repo's `CLAUDE.md` and its generated `.claude/saasplane/rules.md` if you have not already this session, and follow those for those files.
2. **Never carry one repo's conventions into another's files.** A convention right in one repo is frequently wrong in the next: one repo bans implementation identifiers, another is built from them. The manifest decides, not the file you edited last.
3. **Doors hold everywhere.** A skill, rule or hook that declares a repo type or stack claim activates only where its declaration matches. An infra skill in a web repo refuses by name.

Read across freely, in every direction — it needs no ceremony.

## The machine seat — `~/.spnenv`

**One file on the machine holds every SaaS Plane value, and that file is `~/.spnenv`** (decision RD.DEVEX.044, and the getting-started walk's phase 07). `spnutils` reads it **directly**. Nothing has to be exported, and no value passes through a shell you can see.

### Never print a value

**Never `echo`, `cat`, `printf`, log, or expand a value from this file.** Test **presence**, never content:

```bash
# wrong — expands to the value when set
printf '%s\n' "${v:-MISSING}"
# right — reports presence only
if [[ -n ${(P)k} ]]; then echo "set"; else echo "MISSING"; fi
```

**Opening the file is printing it.** Read it only when the developer asks, and never to check whether a key is set.

Here is why the rule is absolute. A transcript outlives the session that wrote it. A printed credential is exposed from that moment, even where the file itself was never touched, and rotation is the only repair. This has already happened here. A session wrote a presence test that expanded its values, and an access key and an address landed in a transcript. Write the test so the value has nowhere to go.

### The regions, and who owns each

| Region | Owner | What a run does |
| --- | --- | --- |
| `# spnutils:managed:begin` … `# spnutils:managed:end` | the tool | rewritten on every `workspace init` and `workspace sync` — nothing typed inside survives |
| `# spnutils:keep:begin` … `# spnutils:keep:end` | the developer | the tool adds keys, and **never** edits or removes a value |

### How the keep region reads

Order runs global → workspace → platform → app, so a key sits beside the keys it works with.

1. **Provider credentials first** — the ones carrying no platform prefix.
2. **A group per workspace**, which is a reading header and nothing more.
3. **A section per platform** inside it, headed by the platform code.
4. **A subsection per app or module**, so same-prefix keys sit together.
5. **A `kept` group last**, holding the platforms no workspace declares.

Two keys there are **producer-only**: `SPN_DEVEX_MARKETPLACE_PATH` and `SPN_DEVEX_BLUEPRINT_PATH`. A run writes each one only where the matching checkout is in the workspace, so a partner never sees either. Their own common section is vendor accounts and nothing else.

### Namespace by platform code, never by workspace

Keys carry the platform code as their prefix — `DMO_`, `LPD_`, `SAS_` — and a module fact reads `{SPC}_{MODULE}_{FACT}`. **That prefix is the whole anti-overlap mechanism**, and it is why one machine-wide file is the right shape.

**So you answer a collision with the prefix, never with a file or a region per workspace.** Segmenting by workspace is the obvious fix and it is the wrong one — two people reached for it in a single day. A workspace is a reading header, and the same platform turns up under more than one of them.

### Two cautions before you run a workspace verb

- **The tool never writes a shell profile.** `~/.zshenv` and its siblings stay the developer's. Sourcing `~/.spnenv` from a profile is their line to add, never the tool's, and **you never edit a shell profile yourself**.
- **`workspace init` in a scratch folder rewrites the real `~/.spnenv`.** It derives producer keys from what it can see, so a folder holding no marketplace checkout drops keys. Point `HOME` at a temp directory before you run `init` or `sync` for a demo.

### A run manages only what it can observe

A run writes keys for what it can see, and it stops there. **It never deletes a key because it failed to see the thing that key describes.** Staleness is reported by `workspace status`, and never repaired by deletion.

## The workspace's working state — `.spndevex/`

The workspace folder carries two dot-homes: `.claude/` (settings — the marketplace, the plugin union, the permission floor) and `.spndevex/` — the agent's working state. **State and settings, never rules**: a rule filed there has two homes, and the copy nobody updates is the one an agent reads.

**The container is a workstream, and it is named for its subject.** One folder holds everything a subject needs: the argument you read, the arcs the agent executes, and the brief behind every delegated run. Its name is a number and the subject; its parent folder is its state.

```
.spndevex/
  workstreams/
    backlog/
      003-cloud-day-0/                    prepared, blocked, or not picked up yet
    open/
      007-release-confidence/             being worked now
        release-confidence-approach.html  yours: the argument, iterated while you read it
        arcs/                             the agent's: steps, target, acceptance, depth
        orders/                           one brief per delegated execution, and its report
        notes/                            scratch, scoped to this subject
    closed/
      005-devex-agent/                    the whole folder, once its plan is accounted for
  orders/
  README.md
```

**A workstream is never a Claude Code session.** Claude Code owns the window, and `SessionStart` is its hook. A workstream is a scope of work, and it outlives every window you open on it.

**The number is an identity, never a priority.** You assign it once, in creation order, and nothing reuses or renumbers it. It rides along when the folder moves state, so `007` reads as `007` wherever it sits. **A workstream holds one or more arcs** — `007` holds two today.

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

**There is no workstream file, and adding one is a defect.** The folder name is the subject, its parent is the state, and the approach page already tracks the arcs. Anything a status file would hold is expressed by the tree, so a second copy only gives it somewhere to go stale. **The window is not tracked either** — Claude Code owns window identity, and a subject outlives any window.

**A subject with an arc and no approach page is a valid shape**, not a gap. Nobody has argued it yet.

- **Scope belongs to the developer, and you only ever propose.** A workstream holds as much as they want it to hold. Widening is the default; splitting is the exception you raise, and never a folder you open on your own initiative.
- **One release train at a time.** That is mechanical and it holds. Any number of arcs in one workstream is their judgement, and you do not overrule it.
- **Closing a window costs nothing. Closing a scope is a check.** Moving `open/x` to `closed/x` is the one deliberate act in the loop, and the close gate below decides whether it may happen.

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

Both of today's live workstreams read that way:

- **`003-cloud-day-0` → `backlog/`.** Cards nobody has answered block it, and its rehearsal step wants accounts that do not exist yet. The simulator in `007` is what makes that step rehearsable. Both blockers have names, so parking it is right and reversible.
- **`007-release-confidence` → `open/`.** Nothing blocks it. The developer sequenced it after `devex-agent`, and that one has closed.

**`backlog/` → `open/` is how work starts.** It needs no ceremony, it is not a close, and no gate fires on it.

## The two gates a workstream carries

Both read one thing: the **split plan**, which is the approach page's `How` tables read by their **scope** column. You never write a separate plan — you filter by scope, and each repo's rows are what that repo's documents must say.

| Gate | Fires when | Verdict |
| --- | --- | --- |
| **documents first** | you write an approach page into a repo's own pocket while an open workstream's plan still has rows that have not landed | a **warning** naming the workstream. Getting ahead of the plan is sometimes right, so it never refuses |
| **close** | a subject moves into `workstreams/closed/` | a **refusal** while any row is one nobody decided |

**The close gate checks that work is accounted for, never that it is finished.** Every row reaches one of three states, and all three pass:

| State | Means | Reads as |
| --- | --- | --- |
| `landed` | the content is in the node that owns it | `landed → spn-platform-ts/packages/module-server-iam-ts/docs/…` |
| `carried` | it moves to a named successor scope, which is now open | `carried → captcha-foundation-concept` |
| `deferred` | consciously parked, with an event somebody will notice | `deferred → the first consumer outside this repo` |
| ⬜ | nobody decided. **This is the one the gate refuses** | — |

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
| name `SPN_DEVEX_MARKETPLACE_PATH` or `SPN_DEVEX_BLUEPRINT_PATH` as a value to set | mark both **producer-only** wherever they appear |

**Not every `--local` is producer-only.** `infra release --local` stages a package into the machine store, and that is an ordinary partner act. The flag to mark is the one on `repo agent-init`.

## A consumer repo needs no peer checkout

This is the constraint that decides where every common rule lives. **A product repo built on the platform has exactly one thing: its own checkout, and the packages it installed.** A rule an agent needs there must arrive through a channel that travels:

| Channel | Travels to a consumer? | Carries |
| --- | --- | --- |
| The **plugin**, installed from the marketplace | **yes** | every common rule — foundation doctrine and stack standards alike |
| The repo's own `CLAUDE.md` | yes, it is that repo's file | only what is true of that one repo |
| The **generated inventory** beside it | yes, written locally | what this repo currently *contains*, never a rule |
| A relative path into a sibling checkout | **no** | nothing a consumer can rely on |

**Common rules are carried by the plugin, never by a link into a peer repo.** Cite by name any document that must be cited across repos, and let the plugin carry the substance.

**The rule reaches every file that ships inside a repository, agent instruments included** (decision RD.DOCS.035). A `CLAUDE.md` is walked by no validator, but it travels with its repo and is read where the siblings may be absent — so it cites by name too. **The workspace's own `CLAUDE.md` is the one exception**: the sibling checkouts are its subject, and it ships nowhere. And a repository's instruction file states what is true of that repository, never what other repositories may do.

## Skills are what a consumer acts on; the book is why

Guidance lives in three instrument layers, and they are not interchangeable: the deterministic CLI (installed), the plugin (installed), and the documentation corpus (not installed). **Anything a reader must act on lives in the first two.** A skill that says *"the authority for this is chapter N of the book"* has pushed its reader onto a layer they do not have. The skill carries the actionable substance itself, and cites the book only as provenance, by name. For a consumer, the digest *is* the standard.

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
