# Cross-Repo Work — Stack-Agnostic

How an agent works across more than one repository on a SaaS Plane estate, and where a rule belongs so every agent sees it. Apply it in any stack and to any repo pair. Source of truth: the foundation's `CONCEPT.md` (`#### DevEx Workspace`) and decision RD.DEVEX.020 — where this digest and those disagree, the sources win and this file is regenerated.

## One window, laws by declaration

A session opens on the **workspace folder** — the discovered set of sibling checkouts — and works across every repo in it. **The rule set binding a file derives from the governing manifests above it, never from where the session started.** `sprepo.json` names the world and, for an `APPS` repo, the stack claim. `spkind.json` names an apps node. An estate node is found by its `spinfrapkg.json`, with the type at `src/spestate.json`.

Follow this discipline, per file touched:

1. **Resolve the law first.** Before editing a file, know which repo governs it — load that repo's `CLAUDE.md` and its generated `.claude/saasplane/rules.md` if you have not already this session, and follow those for those files.
2. **Never carry one repo's conventions into another's files.** A convention right in one repo is frequently wrong in the next: one repo bans implementation identifiers, another is built from them. The manifest decides, not the file you edited last.
3. **Doors hold everywhere.** A skill, rule or hook that declares a repo type or stack claim activates only where its declaration matches. An infra skill in a web repo refuses by name.

Read across freely, in every direction — it needs no ceremony.

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
