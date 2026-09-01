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

| Folder | Holds | Retires by |
| --- | --- | --- |
| `arcs/` | one file per cross-repo change: ordered steps, each with target repo, outcome, acceptance, depth | the **close sweep** — contradictions become register rows, discovered conventions go to their owning chapters — then the file moves to `arcs/closed/` |
| `orders/` | the brief for a repo **outside** this workspace, or owned by someone else | executed → its arc's step ticks and the file moves to `arcs/closed/`; superseded → same move, marked |
| `notes/` | scratch — drafts, worksheets, session state | graduates into a real home (a register row, a chapter, a repo's docs) or is pruned |

At session start, surface what is stale — an arc untouched across sittings, an order nobody ran. Nothing has its permanent home in `.spndevex/`: everything there is on its way somewhere, and anything that stops moving is a decision nobody took.

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
