<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/04-plugins.md",
      "seen": "0f97511c"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md",
      "seen": "491f4358"
    }
  ]
}
-->

# Agent Plugins — What You Are Holding

What a plugin is, the four kinds of file inside one, the `spn:restates` stamp, and the difference between a BUILDER checkout and a PARTNER install. Read this first if you are working out what the folder in front of you actually is. Source of truth: the foundation's `02-constructs/01-devex/02-agent/04-plugins.md` and `04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md`. Where this restatement and those disagree, the sources win and this file is regenerated.

## What a plugin is

**A rule an agent cannot load is a rule it cannot follow, however well the rule is written.** The book states standards and runs nothing. A plugin is the unit that turns a standard into bytes a session actually reads: one folder, one small manifest, one row in a public listing, carrying every hook, skill, reference file and reviewer brief the agent uses.

**Configuration and behaviour are two steps apart, never one.** The plugins are authored and delivered in one public repository — `spn-claude-marketplace` — and publishing them is pushing it; there is no build step between source and surface, and none may be added. You never type a plugin name: the set a repository loads is **derived** from what that repository declares about itself. And nothing you edit is live until an install runs.

**Three separate things carry a plugin from an author's edit to your session**, and confusing any two of them is where an afternoon goes:

| Thing | What it is |
| --- | --- |
| the plugin folder | the substance — the files themselves |
| its manifest and the marketplace listing | how it is named and found |
| the plugin cache | what a session actually reads |

An edit to the folder changes nothing about the cache until an install copies one into the other.

**Every file in a plugin restates chapters of the book and adds no rule of its own.** That is what makes publishing the whole marketplace safe: a restatement that hid its chapter's substance would not be one. Where a restatement and its chapter disagree, **the chapter wins and the restatement is regenerated — never the other way round.** That direction is the whole reason a copy is safe to keep at all.

## The four kinds of file inside a plugin

**Claude Code loads four of them.** Each answers a different question — *when does this reach the session*:

| Kind | What it is | When it reaches you |
| --- | --- | --- |
| **Hook** (`hooks/hooks.json`) | code the runtime calls on a named event, or runs by name | on that event, once installed |
| **Skill** (`skills/`) | a name, a description your ask is matched against, and the steps loaded once matched | when your ask matches it |
| **Agent brief** (`agents/`) | a reviewer or worker the session can convene, with the authority it carries once it runs | when the session convenes it |
| **Manifest** (`.claude-plugin/`) | the plugin's own name, version and description | at install time |

**`scripts/` and `refs/` are ours, not Claude Code's.** They sit in folders the runtime ignores. `scripts/` holds the code a hook or a tool runs. `refs/` holds this file and every one like it — a markdown restatement of one or more chapters.

**Nothing loads a ref on its own.** A ref reaches a session only when a skill names it. A file sitting in `refs/` that no skill cites is dead weight nobody will ever read in a session, whatever its content says.

**A hook either refuses a call or reports on it, and the difference is declared rather than emergent.** A refusal stops the tool call and says which rule it met; a report warns and lets the call through. A check that could refuse but only warns is a decision somebody made, and it belongs in the hook rather than in a habit.

**A ref is the only layer a consumer actually has.** The book is not loaded in a session, and a partner holds no checkout of it. So a ref carries the actionable substance itself and cites its chapter **by name**, never by a path that resolves only for somebody holding both trees.

## How a plugin's command is typed

**Every command reads the same way** (`RD.DEVEX.AGENT.078`): `spn-<plugin> <group> [<subject>] <action> [<path>…] [options]`. The last word before the path is a verb, and you always type it.

**A command is typed by the plugin's own name**, because the plugin ships a launcher under that name in `bin/`, and no one types a path to the entry file. A plugin with a command line declares the tier of each command group in `tiers.json`, and the delivery chapter states how `spnutils` turns that into rules.

| Part | The rule | Example |
| --- | --- | --- |
| **Action** | `check` reads and reports. `write` changes files. `show` prints. A subject may have a verb of its own, such as `measure` or `report`. A command with more than one action has no default. | `spn-devex docs face check` |
| **Path** | It says what the action acts on, and it may be a folder inside a repository or one file. A check of the whole corpus still reads everything and reports only the findings under the path. | `spn-devex docs audit check docs/artifacts` |
| **Filter** | An option named for what it selects: `--variant` for documents, `--block` for a generated block, `--finding` for a kind of finding. | `--finding link` |

**Name the smallest path the work needs, and run `check` before `write`.** A `write` with no path refuses, so a write never reaches a file nobody named. With no path, `check` and `show` take the repository you are in, and they refuse at a workspace root, where several repositories sit side by side.

**Read the exit.** For `check` and `write`, exit 1 means a rule finding. Exit 2 means the command was typed wrongly, and the refusal prints the usage to type. `spn-<plugin> help` lists every command with its actions.

## The `spn:restates` stamp

**A stamp lives here and nowhere else, and it cites another repository — never this one** (`RD.DEVEX.AGENT.073`). Both halves follow from what a restatement is for: it exists because a rule lives in the book and is repeated here, where the book cannot be read, and the `seen` hash is what makes that gap reportable. **A file citing its own repository has no gap to report** — both halves move in the same commit — so the stamp has no work to do and the hash stops matching the file with nobody to notice. Do not stamp a generated ref against the generator that writes it: say which command produces the file, in prose, and let a reader re-run it.

**The stamp is a comment block at the top of a ref, and it is the one place a restatement declares what it stands on.** You write one without reading any tool's source:

```jsonc
<!-- spn:restates
{
  // Documents the ref REWRITES in its own words. You read the chapter and restate it.
  "docs": [
    { "path": "spn-foundation/CONCEPT.md", "section": "Kind Tests", "seen": "3f9c1e7a" },
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/06-tests/README.md", "seen": "b204d81c" }
  ],

  // Files you COPY rather than rewrite — a template, a schema, a sample.
  // A path may name a FOLDER, and then the hash covers every file's path and contents,
  // so an addition, a removal, a rename and an edit all move the same stamp.
  "files": [
    { "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/templates/", "seen": "c41b90d2" }
  ],

  // Register rows the ref carries the ruling of. `repo` names the workspace member carrying the
  // register — every register lives at that repo's fixed `docs/registers/decisions.md` — `row` is
  // the decision id, and `seen` hashes that row's own line, never the whole register.
  "decisions": [
    { "repo": "spn-foundation", "row": "RD.SUPPORT.APPS.086", "seen": "79c8a6ab" }
  ]
}
-->
```

**The block carries exactly three kinds, and they are three different obligations — never treat them as one list.**

| Kind | What you do with the source | So the copy is |
| --- | --- | --- |
| `docs` | **rewrite** the chapter in your own words | different wording, same rules — pasting a chapter has shipped the book |
| `files` | **copy** the file | byte-identical. A template is used as-is; an improved copy is a different template, silently |
| `decisions` | **re-read** the row, then update the ref and restamp | moves when that one row's own line is rewritten |

A moved `docs` entry means somebody rewrites a paragraph. A moved `files` entry means somebody copies a file again. A `decisions` entry moves when the row it names is rewritten — never when an unrelated row in the same register changes. Collapsing them tells you that something changed and not what you owe.

**A fourth kind, `commands`, was tried and dropped (2026-09-28).** The idea was a citation that re-ran a command and took its output — the way `utils/spnutils.md` once rendered `spnutils help --json` into a generated region. The command surface has one source, the book, and a ref restates that source the same way it restates anything else: through `docs`, in its own words. A second generator for facts `docs` already covers was a second source of truth for no reader.

**A path starts at the repository**, so it resolves from the workspace rather than from whichever checkout you happen to be standing in — a `decisions` citation names its repository the same way, through `repo` rather than a path, because every register sits at that repository's own fixed `docs/registers/decisions.md`. **A citation that does not resolve is broken, never skipped** — the check reports it rather than passing over an address it cannot resolve.

**`section` is optional, and it decides what the hash covers.** Name one and the stamp covers that heading's own text; leave it out and it covers the whole file. A citation is exactly as precise as the sentence it replaces, so a long chapter does not re-stamp every ref that cites one paragraph of it. **Each citation carries its own `seen`, not one stamp per block** — a block citing an eight-thousand-line concept and a hundred-line section would otherwise re-stamp the second every time the first moved, which is usually a wrong finding and teaches you to stop reading the run.

**Compute every `seen` yourself; never invent one.** A wrong hash reports agreement that was never checked. A file's hash, a folder's hash and a decision row's hash come from different functions — `seenHash` for a file, `treeHash` for a folder, `rowHash` for one row's own line in a register — all in the marketplace's own `restates.ts` library. `restates decisions write <ref>` computes and writes a `decisions` citation's `seen` for you, once you have re-read the row and corrected any disagreement in the ref's own text.

## The three plugins, and how they divide

Plugins are named `spn-devex` plus `spn-<domain>`, mirroring the providers tree, and an instance suffix is earned only where instances differ in what the agent authors.

| Plugin | Domain | Carries |
| --- | --- | --- |
| `spn-devex` | the foundation itself, stack-agnostic | the stack-agnostic skills, the engineer persona and the reviewer, the lens files, the doc rules, the cross-repository protocol, and the hooks that guard generated files, check every document, print the session's orientation and hold the two write-time gates |
| `spn-apps` | the apps domain, TypeScript instance | the stack commands, the build-loop step files, the TypeScript standards restated, and the write-time checks specific to that stack |
| `spn-infra` | the estate, every provider | the estate commands, the manifest and layer references, the estate laws, and the hook that refuses secrets, account identifiers and hand edits to built output |

**There are three plugins, one per domain, and the set is closed.** `spn-devex` installs in every repository. `spn-apps` acts on the nodes an apps repository declares. `spn-infra` acts on the estate.

**A stack or a cloud is a `providers/<name>/` folder inside the plugin that owns its domain — `spn-apps`'s `providers/ts/`, `spn-infra`'s `providers/aws/` — never a plugin of its own.** The domain is the plugin, and the stack or provider is a folder beneath it.

**The reason is that a domain's rules are the stable half and a stack's spelling is the volatile half.** Writing TypeScript and writing Python are different acts, so each needs its own parser and its own steps — but the rule they are checking is the same rule, and stating it once means a second stack joins by adding a folder rather than by copying a plugin. Authoring an estate declaration is the same act on every cloud, because the declaration is provider-agnostic, so a new cloud is a blueprint library and a provider folder with no skill of its own.

**A plugin per stack would put one rule in as many homes as there are stacks**, and the copies drift one at a time — which is the defect the whole restatement discipline exists to stop.

## The listing, the manifest, and what a version means

Two files name a plugin, and they answer different questions.

```jsonc
// .claude-plugin/marketplace.json — one file at the marketplace root, hand-kept
{ "name": "saasplane",
  "owner":   { "name": "SaaS Plane" },
  "plugins": [ { "name": "spn-devex", "source": "./packages/plugin-spn-devex", "description": "…" } ] }

// packages/plugin-spn-devex/src/.claude-plugin/plugin.json — inside the plugin's own folder
{ "name": "spn-devex", "version": "0.7.2", "description": "…", "author": { "name": "SaaS Plane" } }
```

The listing is the only file that knows all three plugins exist, and nothing generates it. The manifest is a plugin's own claim about itself, read at install time.

**A version names what is published, never what you are working on — MUST.** The marketplace releases at the version its plugins carry, and only then moves the number. **That is what makes a stale cache findable** — a cache directory is keyed by name and version, so a plugin edited without moving the number installs over its own published bytes, and nothing tells you which copy you are running.

## Two install modes, and the place you are standing decides

| The source reads | You are | What that means |
| --- | --- | --- |
| a directory and a path | a **BUILDER** | the marketplace is the checkout beside your other repositories, and its files are yours to edit |
| a repository reference | a **PARTNER** | the marketplace is the published repository, installed rather than authored |

**Unset means PARTNER, and that is the point.** It is the answer somebody gets by doing nothing, so nothing has to be set on anybody's behalf.

**The two modes differ in what you may edit and in nothing else.** A partner's workspace is a full workspace, worked the same way — its repositories carry their own concept, their own documents, their own code and their own tests. What it does not hold is the book and the marketplace, so the book is cited by name and the plugins arrive installed.

**A partner reports a standard that is wrong or missing; they never edit the plugin they installed — MUST.** That edit sits in one plugin cache, reaches nobody else, and the next install replaces it. The ask crosses upward instead, as a written request, because a rule you cannot get from a plugin or a package is a gap in what the foundation publishes — and naming it is how it closes.

**On a partner workspace the install fetches over the network**, and what it fetches is executable: hooks and the scripts behind them. The workspace floor allows that without asking, because the act writes a plugin cache and the workspace's own settings rather than publishing anything.

## The set a repository gets is derived from its own claim

You never type a plugin name. The wiring command reads the repository's own manifest and derives the set from the world it declares.

| What the repository declares | The set it loads |
| --- | --- |
| the foundation world | `spn-devex` |
| the apps world, with a stack claim | `spn-devex` and that stack's plugin |
| the estate world | `spn-devex` and `spn-infra` |
| a general world, or no manifest at all | `spn-devex` alone |

**A repository with no claim gets `spn-devex` and never a stack's.** Hand such a repository a stack's skills and you have offered commands whose door is not there — the command exists in the session and refuses the moment it runs.

**A repository may narrow this further and may never widen it.**

## Nothing you edit is live before the install

| Act | What is live afterwards |
| --- | --- |
| editing the concept, a chapter, a register, a provider seat or a plugin file | **nothing** |
| releasing the deterministic tool, where a command or the floor changed | the new command surface, once released |
| the workspace-wide sync — installs or refreshes every plugin whose installed copy differs from its source, then re-mints both wiring levels | hook **scripts** only |
| a fresh window | skills, agent briefs, reference files, the hook wiring, the generated rule files, and the floor |

A session reads the installed cache, so changed files and unchanged behaviour is the normal state until the sync runs. **A hook script is the one exception**, and reloads on its next run because the wiring already points at it.

**The install and the two wiring levels are one act, not three.** The sync compares each installed plugin against its source, replaces the ones that differ, and names the file that drove each replacement; then it writes every repository's generated rule file and managed instruction block, and re-mints the floor. All of it is read at session start, so a window opened first loads the previous generation and you owe a second one.

**Replacing a plugin by hand before that sync costs you the one answer worth having.** The comparison happens *before* the replacement, when the installed copy is still what the live session actually loaded — which is what makes it an answer about this window rather than a guess. Take that moment away and the sync can only report that everything is current, which is true and tells you nothing.

**The tool is released before the plugins are synced — MUST.** The plugins restate a tool the session runs, and the installed command surface is the last released one rather than the checkout — a plugin naming a command that has not shipped is a rule nobody can follow.

**Reloading in the middle means reloading twice**, and a half-reloaded session is one where you cannot tell which copy answered. Do every edit, release the tool if it moved, sync once, then take one fresh window.

**A session cannot adopt its own new wiring, so the tool that changed it owes the handover — MUST.** The session that installs a plugin or re-mints a wiring level is the one session that will not read the result, and it is also the only one that knows what changed and why. A handover that reports only the fact is the failure this rule exists to prevent — told that the plugins updated, the next window starts from nothing and re-derives the work that produced the change. Carry the work itself, so the next window continues rather than restarts.

**The sitting that changed the wiring finishes it before it offers a handover — MUST** (`RD.DEVEX.AGENT.059`). A handover can be complete and still point at wiring nobody installed, and the next window then opens on the previous generation.

**A partner's form of this is shorter and the order is identical**: check whether a newer version is published, install it, run the syncs, take a fresh window.

## What a hook runs, and where its cache lives

**A hook runs a committed, pre-built bundle, never its source — MUST.** Every hook call starts a fresh process, and stripping a TypeScript source of its types on every one of those starts costs more than the check inside the hook ever does. Building once, at commit time, moves that cost out of the path a session pays on every tool call — the plugin's own tests refuse a bundle older than its sources, so an edit made without a rebuild is caught in the plugin's own suite rather than discovered later from a session quietly running an older version of itself.

**A plugin's cache lives in the machine store, keyed by content, and never in the shared workspace folder — MUST.** `.spndevex/` is shared by every parallel window and every workstream, so a mutable file written there is overwritten by whichever window finishes second, and neither session did anything wrong — they only disagree about which verdict is current. A cache kept in the machine store and keyed by content sidesteps the race rather than resolving it: two windows either compute the identical verdict or never touch the same key at all.

## What breaks if you skip this

| If you… | Then |
| --- | --- |
| edit a ref and expect it live this session | nothing changed — you read the installed cache, not the checkout |
| paste a chapter's own wording into a `docs` restatement | you have shipped the book instead of restating it — restating means the same rules in different words, and different words are what a restatement is for |
| reword a `files` copy to read better | the improved copy is a different template, and nobody knows it diverged |
| guess a `seen` hash instead of computing it | the block reports agreement that was never checked |
| cite a chapter by path from a partner's ref | it resolves only for somebody holding both trees, so a partner's session gets a broken link |
| edit an installed plugin cache directly as a partner | the fix reaches nobody else and disappears at the next install |
| sync the plugins before releasing the tool that changed | the plugins restate a command surface the session cannot run |
| replace a plugin by hand before running the workspace sync | you lose the one comparison that could tell you what actually changed |
| type a plugin name into a repository's wiring instead of letting it derive | the repository stops correcting itself when its declared world changes |
