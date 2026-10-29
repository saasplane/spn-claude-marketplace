<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/01-agent.md",
      "section": "Every moment gets a plain, warm line",
      "seen": "644f26c5"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The reply while work runs shows what needs you, then what moved",
      "seen": "873b5641"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/02-workstream.md",
      "seen": "646b9091"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "seen": "ea963cff"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A step row says where, at what altitude, and how",
      "seen": "49858691"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "An order is one delegated execution, and every order follows the same rules",
      "seen": "8bac539a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "An arc carries its specification, or names the note that holds it",
      "seen": "4d7f1f7a"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "Placing something new",
      "seen": "7acf6b59"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A prompt while an arc runs",
      "seen": "96afb252"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "seen": "8d5c6f56"
    }
  ]
}
-->
# The Workstream Loop — What The Agent Does, And When

How a session decides what to do: how it opens, how it reads each prompt, the states a workstream
moves through, what each one writes before it moves on, and how a reply closes. Every skill reads
this file before it acts. Stack-agnostic. Source of truth: the foundation's
`02-constructs/01-devex/02-agent/01-agent.md` and
`04-capabilities/01-devex/02-agent/01-agent/01-agent.md` for the loop a session runs and the reply
it gives while work runs,
`02-constructs/01-devex/04-workspace/02-workstream.md` and
`04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md` for the workstream itself, and
`04-docs/05-artifacts.md` for what it writes.

**How a session opens on the welcome, reads every prompt before it moves, and keeps the front desk
open while work runs is stated once, in `refs/devex/agent/agent.md`.** This file states the
workstream's own rules beside it, and links there rather than repeating it.

## The seven states

The agent is always in exactly one, and the state is decided by what is on disk plus what the
developer just said. **Each state names what gets written before it moves on**, because a session's
context ends with the session and the files do not.

| # | State | It begins when | It writes, before anything else | It leaves when |
| --- | --- | --- | --- | --- |
| **S0** | **orient** | a session opens, or a subject is named | nothing yet — it reports the workstream, its state, its open cards, and what it is about to do | you and the developer look at the same workstream |
| **S1** | **shape** | there is no page, or the page does not cover the work | the approach page in its fixed shape, each arc it plans `PROPOSED` with a goal and a preview section the developer can read, and one line in `How` for each arc still expected. Every unknown is a `Q<n>` card with options, the views that spoke, and a recommendation. **Never a blank page, never a card without a recommendation** | the page exists and every question the agent cannot answer alone is a card |
| **S2** | **iterate** | a card is open, or the developer says anything that adds clarity | an answer **folds into the section that then states it** and leaves `Open`. A new question is the next `Q<n>`. Anything new is placed as § *Placing something new* says | `Open` is empty and the split plan covers the scope |
| **S3** | **confirm** | an arc's preview shows what the developer decides, and `Open` holds no card its build rests on | nothing new — the preview is shown, and a go is asked for on the arcs it names | the developer says go, **and the go is its own write, carrying their words**: `workstream arc edit <arc> --status DECIDED --note "<the developer's words>"` (`RD.DEVEX.WORKSPACE.278`) |
| **S4** | **execute** | the developer said go | `workstream rows show <workstream> --ready --parallel` names the rows that can run; a row you start is set `running` with `workstream row state <arc> <row> running`, and its log line says since when. A row already running under somebody else is left alone: ask the developer, saying how old its log line is. A child's report is folded in with `workstream report write`, and a row lands only when its acceptance holds and is proven. A question hit mid-work becomes a card (`workstream question raise`), and the rows its answer can change wait on it in `blockedBy`; everything the answer cannot touch keeps moving. A row you started and put down is set `stopped`, its log line carrying what has to happen first, what already reached its node, what did not, and what nobody may touch until it resumes | every row is landed, carried or deferred |
| **S5** | **sweep** | the rows are done | what the work owes the standards: a contradiction as a register row, a convention in its owning chapter | nothing the work owes the standards is left in the conversation |
| **S6** | **close** | every row is landed, carried or deferred | landed, carried and deferred all pass, because parking work consciously is good housekeeping. **`carried` means the work leaves this workstream**, so the gate reads the scope it names and refuses one that is closed or does not exist; a row pointing at a later arc of this same workstream is sequencing, and it waits on that arc rather than on the word. **A row waiting, ready, running or stopped refuses the close** — a stopped row already touched its node, so you finish it and mark it landed, or you split it into the half that reached its node and the half that did not. Then **the page is stamped closed**, then the folder moves, then one line saying what landed. **The page itself never moves into a repository**: an argument closes with the workstream that argued it, and what outlives it is the register row and the construct rewritten fresh | the folder is in `closed/` and the page says so |

**A standard the sweep corrects is not live yet.** A chapter reaches a session only once it is
carried into the plugins, installed, and synced. `refs/devex/workspace/workspace.md` § *Open a
workstream with the agent update, and execute after* holds that whole loop, and every authoring step
in it is a builder's alone.

**Two rules run through every state.** Nothing is held only in the conversation. And the agent never
waits inside a state it can finish: it stops for a question only the developer can answer, or for a
session boundary.

## The workstream is kept as data, and every file has one owner

**The developer reads one page, `approach.html`, and you run the rest as data — MUST**
(`RD.DEVEX.WORKSPACE.249`). Each arc keeps its rows in a small JSON file that only commands write; its
preview, its samples, its plan and its orders are files only you write. So a window learns where the
work stands from a few lines, a hand-back updates one file, and the order of the work and its
conflicts are declared once.

| Owner | Files |
| --- | --- |
| **you, by hand** | `approach.html`; each arc's `notes/N<nnn>/preview.html`, `samples/`, `plan.md`, `orders/`, `scripts/` and `work/` |
| **the `spn-devex workstream` commands** | `suggestions.jsonl` and `questions.jsonl`; each arc's `arcs/N<nnn>/state.json`, `log.jsonl`, `facts.jsonl` and its name file `<subject>.md`; the `progress` and `open` blocks inside the pages |

**A file a command owns is never edited by hand**: the PreToolUse hook refuses a direct write to it, an
edit that touches a `progress` or `open` block, and a hand edit of an arc's `data-arc-stamp`. A page you
write may hold a region a command writes, and then the region's owner is the command. A generated kind
is added only with the developer's approval, and these two have it. The folder is drawn in
[`workspace.md`](workspace.md).

**An arc's `state.json` holds its header and every row, and a field is added and never repurposed.**
It carries `schemaVersion`; one schema in the plugin validates it, and every write runs it first. The
header is `arc`, `subject`, `title`, `goal`, `status` and its `reason` (for `CARRIED` and `DROPPED`), `wait`
(the developer's words, or `null`), `reviewFixes` (on the review-fixes arc alone), `decides`, `repos`, `cycle`,
`follows`, `model` and `preview`; `schemaVersion` is 2. A row is `id`, `parent`, `title` (the
step's *What*), `kind` (`fix` · `change` · `question`), `repo`, `altitude`, `mechanism`, `acceptance`,
`model`, `blockedBy`, `touches` (`repository:place`), `decisions`, `facts`, `state` (`waiting` until the
step starts, `running` while it runs, with the log line that moved it there saying when, then what it
reached), and what its report
folded in: `proof`, `cost`, `commits`, `order`. **Every row is a build step**: reading and drafting are
planning jobs, which record no step (`RD.DEVEX.WORKSPACE.278`). A step's `state` is `waiting`, `ready`,
`running`, `stopped`, `replaced`, `landed`, `deferred` or `carried`. Steps run in chain order, by repository with the foundation first, then by altitude. After each
write the `row` commands name, in a `note:` line, a build row with no `repo` or no `altitude` and a row out of
chain order; it reports and never refuses (`RD.DEVEX.WORKSPACE.183`).

### The commands

**The `workstream` commands are the only writers of what a script owns — MUST.** Every `show` takes
`--json`. Each write appends its event to the arc's log, refreshes the progress block, and prints any
finding of `state check` for its workstream. The grammar reads at most three words after the plugin's
name, so `workstream arc stamp write` is the group `workstream`, the subject `arc` and the action
`stamp`, and `write` is the first word that action takes.

| Command | What it does, and what it answers |
| --- | --- |
| `state show [<workstream>]` | where everything stands, in a line: `025 · N007 18/19 · 57b running · N010 proposed · 0 open cards · 1 suggestion shaped` |
| `state check [<workstream>] [--facts]` | whether each open and backlog workstream is whole; exits 1 on a finding. `--facts` also names each pinned fact whose source moved, as a note |
| `rows show <workstream>[/<arc>] [--ready] [--parallel] [--tree]` | the rows; the ready ones; of those, the ones whose `touches` do not overlap |
| `arc edit <arc> [--title …] [--goal …] [--status …] [--wait …] [--reason …] [--start] [--review-fixes] [--subject …] [--under …] [--preview …] …` | opens an arc as `PROPOSED` (`--title`, `--subject`, and `--goal`), as many as the plan needs, or changes any field of its header and its stored status, writing the arc's name file with its data; an arc field is written nowhere else. A `--subject` over three words or 24 characters is refused; `--position <n>` sets the arc's place in the planned sequence, which orders the arcs still `DECIDED` or `PROPOSED` on the approach page's sticky card; `--note` writes a log line. `--status` stores the developer's words, `PROPOSED`, `DECIDED`, `CARRIED` or `DROPPED`, and `LANDED` only on the review-fixes arc at the close; every move needs `--note` with their words. The go, `--status DECIDED`, lists each line of the preview that still says proposed. `--wait "<their words>"` holds a decided arc and `--start --note "…"` clears it; `--review-fixes` opens the review-fixes arc, `DECIDED` on their words. A move back to `PROPOSED` stops the arc's running steps. `DROPPED` is refused on an arc never decided. A row's field is refused, and `row edit` is named |
| `row add <arc> "<title>" --repo <repo> --altitude <altitude> [--kind change] [--state ready] [--blocked-by …] [--touches …] [--position …] [--model …] [--note …]` | adds a row, takes the arc's next number and prints it; refused without `--repo` or `--altitude`. A step written `running` or `landed` on an arc not `DECIDED`, or holding a wait, is refused, and a step is never added to an arc that reads `LANDED` |
| `row state <arc> <row> <state> [--note …]` | the everyday call: moves a row to a state, and the log line says from where; a row the arc does not hold is refused, and `row add` is named |
| `row note <arc> <row> "<text>"` | writes one line on a row's log and changes nothing else |
| `row edit <arc> <row> [--title …] [--kind …] [--repo …] [--altitude …] [--model …] [--blocked-by …] [--touches …] [--position …]` | changes the fields of a row the arc holds; a row it does not hold is refused, and `row add` is named |
| `row discard <arc> <row> --note "…"` | takes a waiting, ready or deferred row found invalid or not needed out of `state.json`; its `discarded` log line carries the developer's words and the row's *What* |
| `arc stamp write <arc>` | restamps the arc's *Cycles* row, once its part of the page is current |
| `arc delete <arc> --note "…"` | deletes an arc never decided, both its folders, on the developer's words; an arc ever decided is refused, and becomes `DROPPED` instead |
| `report write <workstream> <notes/N<nnn>/orders/<row>.report.md>` | folds a child's hand-back in from its front matter: state, proof, cost, commits, follow-ups. `ok · N007 18/19 · 57b added · 58 ready` |
| `fact write <arc> --source <repository>/<path>[:<line>] --fact "…"` | one fact, its source's current commit pinned: `f12 · pinned 8b99ae92` |
| `suggestion add <workstream> "<title>" [--preview …]` | raises a suggestion: the next number, raised |
| `suggestion state <workstream> <sN> <state> [--words "…"]` | moves it on: shaped, decided, parked or dropped, with the words beside the move |
| `suggestion edit <workstream> <sN> [--title …] [--preview …]` | changes its title or its preview, never its state |
| `question raise · show · answer · withdraw` | a card from raised to answered; [`docs/decision-cards.md`](docs/decision-cards.md) states them |
| `progress write <workstream>` | regenerates the progress block; every other write calls it |

An arc is typed `<workstream>/N<nnn>`, or `N<nnn>` alone from inside its workstream or where one open or
backlog workstream holds it.

**`state check` reads every open and backlog workstream, and never a closed one.** It validates each
arc's data; an arc with no preview, and no second preview beside the one by its fixed name; the stamp of
each arc's *Cycles* row, a hash of the arc's goal, title and repositories; the arc's own `What` entry,
`N<nnn>-what`, which links its preview, and a `What` entry or a preview that links another arc's preview;
a `{{…}}` slot left in the preview of a decided arc; the cards against
their records; the report of each landed row with an order; and each status against
its steps: a step running on an arc not `DECIDED`, or holding a wait, and a stored `LANDED` arc with a step
not landed. The status it reads is the one owner's, `arcStatus` in the plugin's workstream library, as every
reader's is: the stored words, with `RUNNING` and `LANDED` worked out from the steps. It asks no arc for a preview or a plan, because each is made only where the arc has something to put in it. **The Stop hook runs it
for this window's workstreams, and refuses to end a turn while it fails.** A workstream that still
keeps its arcs as Markdown is named for the one-time move, and the Stop hook waits for that move.

### The life of an arc, and every file it touches

**Every arc is opened and run by one procedure — MUST** (`RD.DEVEX.WORKSPACE.258`). Each step names the
files it writes, and a file a command owns is written only by that command.

| Step | Files it writes |
| --- | --- |
| shape | `suggestions.jsonl`, by command; nothing else moves |
| open the arc, as the plan becomes clear | `state.json`, `log.jsonl` and `<subject>.md`, by command (`arc edit <arc> --title … --subject … --goal …`); the preview from the template and its `What` entry, `N<nnn>-what`; one line in `How`; the *Cycles* row (`docs cycles write`), then `arc stamp write` |
| preview and cards | the preview, filled by planning jobs, which record no step, while the arc reads `PROPOSED`; the cards in `Open`, by `question raise`; each fact read, by `fact write` |
| decide | the developer's go on the preview, written with their words: `arc edit <arc> --status DECIDED --note "<the developer's words>"`, with `--wait` where they said wait; the answers folded into `What` and the preview, and each line the write lists as still saying proposed brought current; the register rows owed |
| plan | the rows, by `row add`, each with its kind, model, `blockedBy` and `touches`; `plan.md` where the arc has traps, a set or a move table; the one line of each new place in the page's `How` |
| run | `orders/<row>.md`, by reference; the reports, folded in by `report write`; samples and shots |
| a comment mid-run | a row, by command; a card if it is a question; when the arc moves, its rows, its log and the page's parts |
| gate | the arc's final re-check row: the whole tiers once; one restart; the walks and the look; the review list |
| release and land | the steps, by command, which work out `LANDED`; the book's rows; the references restated; *Cycles* |
| review fixes | `arc edit <ws>/<arc> --review-fixes --note "<their words>"` at the first fix after a landing; one step per fix, naming the arc it fixes |
| carry, drop, delete | `CARRIED` or `DROPPED` and its reason, by command; an arc never decided, by `arc delete` |
| close the workstream | on the developer's word, after the review links: the review-fixes arc's `LANDED`, by command; the close gate, which refuses an arc `PROPOSED` or `DECIDED`; the folder moves to `closed/` |

**Each fact you read while ideating is written as you read it, pinned to its commit — MUST**
(`RD.DEVEX.WORKSPACE.252`). Read your own knowledge first, then the plugin's references and the book,
then the workspace's repositories, and write each fact with `fact write`. Each shape you show, in chat or
not, becomes a section of the arc's preview. At the go, `state check --facts` and `plan stale` compare
each pinned source with its commit by a `git` log of that file alone, and name what moved, so nothing is
read a second time.

**A workflow runs ready rows in order or side by side, each on its own model, from the same
`blockedBy` and `touches`**, only when the developer asks for it. The ordering costs no model tokens.

**Open and backlog workstreams follow the standard as it moves — MUST** (`RD.DEVEX.WORKSPACE.255`). A
change to the standard brings every open and backlog workstream to it in the same step, its links
rewritten from a move table first, and no old name is kept there. A closed workstream stays as it closed,
and `state check` never reads it. Another workspace — a partner's — receives the same change as the
plugin release's migration, which its first window applies before anything else (`refs/devex/agent/plugins.md`
§ A release carries its migration, and a window applies what is pending first).

### Work is sized by its kind, and fixes gather into a round

**You keep up with whoever you work with, at whatever pace — MUST** (`RD.DEVEX.WORKSPACE.257`). Record
every comment, apply small fixes fast, keep big work in order, and keep the docs and the arc current;
bring the developer only results and real decisions.

| The work | How it runs |
| --- | --- |
| a mechanical row: a one-line fix, a pin move, a rename, a prop swap the brief could list | by you, directly, with its test where behaviour changes, and no order, brief or report |
| judgement work in one area, longer than about 15 minutes | one order in the light form: the files, the one rule, the acceptance |
| a new prop, token, rule or construct | one order in the light form, with a section that names every new construct, the case that fails first for the new behaviour, and the book's row |
| parts in different repositories | separate orders, run side by side; inside one repository, one after another |

**The model follows the kind of work.** Mechanical work runs on the smallest model, only where the order
has nothing to decide; a written order on Sonnet; shaping, cards, previews and reading hand-backs stay
with you on the largest. Every launch names its model, and a fork is refused (`RD.DEVEX.AGENT.104`).
**An order quotes the facts it needs, each with its commit, and points to the rules it follows**
(`RD.DEVEX.WORKSPACE.276`). The log gets one note per milestone (`RD.DEVEX.WORKSPACE.275`), and you offer a
new window from 200k at a clean point, writes the handover unasked at the next clean point past 300k, and always moves past 450k (`RD.DEVEX.AGENT.103`). Between 200k and 300k the offer comes once, and again only after another 50k; past 300k it stays in every reply until the developer moves or says to stay. **The offer tells the
person, in one or two plain sentences in their words beside the handover, why, what is kept and how:**
each reply re-reads the whole window, so a long one makes every reply dearer; the handover and the
workstream's folder carry every open point, so nothing is lost; and a new chat at the workspace root, in
the editor they use, with the handover pasted as its first message, opens the next one. It names no token
count and no *clean point* it does not explain. Staying is fine while the person is away, or when the next
ask is small enough that moving costs more than it saves. **A small fix gets code and its test, and no line in the book.** **A round ends
in one gate:** the whole test tiers, one restart of the showcase or the app, the walks and the look run
once, in the arc's final re-check row before a release, and the look of each batch is shown to the
developer as soon as the batch lands.

**A tool's output stays short, because every later turn reads it again — MUST** (`RD.DEVEX.AGENT.106`). A file over 20 KB is read in parts: search it first, then read the lines needed. A command whose output may pass 10 KB writes to a file, and the agent reads the part it needs. A child's hand-back stays at 15 lines. A hook refuses a `Read` over 20 KB and a command whose output passes 10 KB, each with the form to use instead (`RD.DEVEX.AGENT.111`).

### Once an arc is decided, it runs in three passes per repository

**Once an arc is decided, each repository it touches runs one docs pass, then one code-and-test pass, then the owed tiers once — MUST** (`RD.DEVEX.WORKSPACE.320`). The docs pass writes the book and the node documents. The code-and-test pass writes the source and the specs that prove it. The tiers pass runs, once, the whole tiers the arc owes that repository. Each repository's whole tiers run once as a baseline before its code pass, so a surprise that would have shown at the gate shows first, while the fix is still cheap.

**An order is cut per repository and pass, from the preview's file list, never per row, and it is never researched again.** The preview already names every file the arc changes, so an order is that list for one repository and one pass. A row the preview does not pin is a gap in the ideation: it is fixed in the preview first, and the order is cut after. The alternative is an order per row, which reads the same files again for each row and runs a gate for each.

### A workstream works on one branch per repository

**A workstream commits on one branch in each repository its rows name, `feat/<NNN>-<subject>`, and every arc commits on it by path — MUST** (`RD.DEVEX.WORKSPACE.314`). The branch is cut from a fresh `origin/develop` when the worktree set opens (`refs/devex/workspace/workspace.md` § The workspace's working state), so two arcs of one workstream never need a branch each, and the pull request that carries the work into `develop` is one per repository and not one per arc.

- **One pull request per repository, opened at the first push — MUST.** It stays open for the workstream and targets `develop`. The checks workflow runs on it.
- **The pull request is rebase-merged into `develop` each time an arc lands a group of rows — MUST.** Each row's commit stays as it was written. The branch is not deleted then, because the workstream goes on using it.
- **The branch takes `develop` at three moments, and in each repository the moment touches — MUST** (`RD.DEVEX.FUNCTION.071`). At the start of each pass (§ *Once an arc is decided, it runs in three passes per repository*) the agent fetches, and where `develop` moved it rebases the branch. Before each push and each pull request it rebases again, so the pull request merges clean. Git drops the commits already upstream, so the push carries only what `develop` does not hold. After that rebase the owed tiers run again only where it changed a node's content, because the stamp's content hash already says which, and a node whose content did not change keeps its stamp.
- **A merge into `develop` is told to every open workstream that holds the repository — MUST.** The window that merges writes one line into each open workstream whose set holds that repository, naming what changed. A breaking contract change names its cutover: what must land with it, and in what order. The line is for a window that has not fetched yet, and the window's own *behind `develop`* line below tells it that a rebase is owed. **The line lands as a `note` on the log of each running arc** in those workstreams, written with `workstream arc edit <arc> --note "…"` (the only writer of a log line); a hook reminds the agent after the merge, and the agent writes the line. The line names what changed, a dependency the merge added, and a breaking change's cutover.
- **A window that opens names a branch that is behind `develop` — MUST.** It fetches every member in parallel and says, for each branch behind, how many commits it is behind and that a rebase comes before the next push.
- **A conflict outside the arc's own files stops the agent — MUST.** The developer decides how a conflict in another arc's or another workstream's files resolves, because the agent does not own those files.
- **After a rebase, a merge or a pull from `develop`, the agent re-reads what moved underneath its arcs — MUST** (`RD.DEVEX.WORKSPACE.317`). Two things count and no more: a file that `develop` changed since the old merge base and the branch also changed, and an open arc's pinned fact whose source moved, as `plan stale` names it. The agent re-checks both and tells the developer in one line what moved and what it re-checked. A window with no open arcs and no pinned facts says nothing. The push check keeps owning only stamped runs and is not widened to this, because a re-read is judgement and a stamp is not.
- **One worktree set serves the whole workstream, and its lanes take turns by repository — MUST** (`RD.DEVEX.WORKSPACE.316`). Lanes that touch the same repository run one after another, because they share one branch in one checkout. Lanes in different repositories run side by side. An order names the repository it touches, and two orders that name the same one are not started together.

**A page is checked by its computed values, once, in the arc's final re-check row, and a picture is
taken only where the developer asked to see a look — MUST** (`RD.DEVEX.WORKSPACE.277`). An order runs
no probe and no walk. The row that has to know what a page paints runs
`spn-devex browser probe <url> --select <css>` and reads the computed properties, the attributes of each
ancestor, the stylesheet and selector of each rule that sets a property, and the accessibility tree. An
order that asks for a screenshot cites the developer's ask in a line containing *the developer asked to
see*, or in a quoted ask with its time; a hook refuses an order that asks for one and cites none.

## Placing something new

**One order of questions places anything new, and you stop at the first yes — MUST**
(`RD.DEVEX.WORKSPACE.310`). Read where the workstream stands first: its goal, which arcs landed, which
build, which wait, and each open arc's goal. Then ask, in this order:

1. **Is it a question?** Answer it, and open nothing.
2. **Is it another subject, or outside the goal's domains?** Suggest a workstream, or send it where
   § *How arcs are cut* says.
3. **Does it fall inside an arc that has not landed?** The test is whether that arc's goal already covers
   it. Yes: a step there, or a section of its preview while it is `PROPOSED`.
4. **Does it fix what a landed arc delivered?** The test is whether the landed arc's goal would stay word for
   word as it is. Yes: a step on the review-fixes arc, naming the arc it fixes.
5. **Otherwise it is new scope**: a new arc, `PROPOSED`, named for its domain, with a preview when there is
   something to see. Its package rule still holds: a change in a package another open arc releases is a step
   of that arc.

**A landed arc is never reopened** (`RD.DEVEX.WORKSPACE.261`), because its goal and the developer's review
of it are the record of what was delivered. The review-fixes arc opens at the first *"fix X"* after any arc
lands, `DECIDED` on those words, and takes fixes for every arc of the workstream; it reads `RUNNING` until
the developer's word to close stores its `LANDED`. When the developer agrees an open arc's goal changed, it
goes back to `PROPOSED` and its running steps stop. A closed workstream reopens nothing.

**Say in one line where the new thing went and why** — *"a fix to N006's band buttons, on review fixes:
N006's goal is unchanged"* — so the developer can move it with one word. Never name a step or an order by
its number (`RD.DEVEX.WORKSPACE.312`).

**A running step is never edited underneath.** A step that has not started can take the new thing while
the run goes on. The step running now cannot, because a session is following it as a brief at this moment.
The next section says what happens instead.

### How arcs are cut

**The edge of an arc is what the developer reviews together and what releases together, and the domain
gives it its name — MUST** (`RD.DEVEX.WORKSPACE.309`). Name it for the domain it lands in, as the
repository's own concept names its domains; where a concept names none, ask.

1. A package is released by one arc only. When another arc needs a change in it, the change is a step of
   the arc that releases it, and the work that needs it waits on that release.
2. Each package releases after the last step that changes it. Where a domain does not release on its own,
   the arc lands at its proof.
3. A goal too big to review once is split by when it would be reviewed. If both halves touch one package it
   releases twice, and if that is not worth it the split is wrong.
4. A fix to your machinery, a plugin or the design system outside the goal's domains goes to the workstream
   that owns it, or where the developer says, and the reply links where it went. In a partner's workspace,
   where nobody owns the plugin, it becomes an issue you draft for SaaS Plane's public marketplace repository.

### The kinds of go, and the other words that move things

**Each of the developer's words moves exactly what it names — MUST** (`RD.DEVEX.WORKSPACE.311`).

| Their words | What moves |
| --- | --- |
| **create** | the workstream, its approach page, and `N001` `PROPOSED` (§ *Before a workstream exists*) |
| **go on a preview** | each arc named, from `PROPOSED` to `DECIDED`; building starts |
| **wait** | the arc decided and held: `--wait "<their words>"`, and nothing starts, in this window or the next |
| **start** | the wait clears: `--start --note "<their words>"`, and building starts |
| **an answer** | no status; the answer goes into `What` and the preview |
| **a change** | a step; a status moves only when they agree an arc's goal changed |
| **drop** | an arc never decided is deleted (`arc delete`); one decided before becomes `DROPPED` |
| **move** | `CARRIED`, and its work opens in the other workstream |
| **park** | the folder moves to `backlog/`, with the blocker named |
| **a version** | the release's version |
| **close** | after the review links, the page reads `DONE` and the folder moves to `closed/` |

A go answers only what it names: words that name no arc while several are `PROPOSED` move nothing, and
you ask which arc. Every go is logged with their words, and the reply says in one line what it moved and
what stays open: *N002 decided, building started; Q19 still open.*

## A prompt while an arc runs

The developer can speak while you execute, and **not every prompt is an instruction**
(`RD.DEVEX.WORKSPACE.257`). Read a prompt for what it is before anything moves. What happens next
depends on one question: **does the prompt change what is being built, or open a question whose answer
could?**

Answer a question or a request for status, and talk an idea through and keep it as a suggestion
(`workstream suggestion add`). Place anything else as § *Placing something new* says. A step that has not
started takes the change, and the run goes on. A change to the step running now, or to the plan it follows,
stops the run at the next commit: tell the developer the new plan in words, and resume. A question whose
answer can change the work stops only the steps it can change.

**A question that can change the work stops the rows it can change — MUST** (`RD.DEVEX.WORKSPACE.188`).
The question can come from three places: the developer's message, an open card on the approach page,
or a design choice you meet in the middle of a step. The test is the one a card already uses
(§ *A card is only for what the rules leave open*): two answers lead to materially different work,
and the choice is the developer's. When the answer can
change an order that is running or still to run, you:

1. let the tool call in flight finish, then stop the rows the answer can change;
2. make each of those rows wait on the card: `workstream row edit <arc> <row> --blocked-by q<n>`;
3. write the card, and **help the developer think it through to an answer, instead of choosing one**;
4. record the answer, then resume the held rows.

**Rows the answer cannot touch keep running.** Holding them too would cost time and protect nothing,
because no answer changes what they build.

**The choice stays the developer's when the rules leave it open, even when you could make it.** A
design choice the book, the plugin references and the lenses do not settle, taken alone in the middle
of a step, is a decision nobody made. The orders still to run build on it, so by the time the
developer sees it, undoing it means undoing them too. Helping them reach the answer costs a few
replies. Choosing costs the work built on the choice.

**A `RUNNING` arc that the developer reshapes stops before it goes on — MUST.** Let the tool call in
flight finish, so nothing is left half-written, and do not start the next one. Rewrite the affected
steps in chain order: by repository, then by altitude, and mark a step you replaced `replaced`. Tell the
developer the new plan in words, never by step number. Then resume from the first step that has not
landed, unless the developer says otherwise.

**Stopping is what keeps the arc true.** A session executing an arc reads it as a brief. If the plan
changes and the run goes on, the rows on disk describe work that nobody is doing, and the work being
done is described nowhere. Stopping costs one reply.

**A small fix is acknowledged in one line, so the developer knows it is held without watching a
record.** The line says what was noted and when it runs, such as *Noted: the menu padding goes in the
next batch, after the header change.* Many small comments in a row are collected while something runs and applied
together; when nothing runs, apply each at once.

**A new window resumes the same way.** It reads the approach page, then the arc's rows and log, then
its plan, and runs from the first row not landed. Nothing that landed is done again.

**A change to a later row does not stop the run.** Nobody is reading that row yet, so updating it
changes nothing under anybody's feet. The run reaches it later and follows the new text.

## A card is only for what the rules leave open

**You decide what the book, the plugin references and the lenses settle — MUST**
(`RD.DEVEX.WORKSPACE.193`). While you work any request — shaping, iterating or executing — read what
exists: the code, the book, the plugin references, the lenses and the arcs, and what the request
changes. What they settle, you decide. Log the decision and its reason in the arc, and name it to the
developer in one line. A question the developer must answer costs their attention, and a question the
book already answers costs it for nothing.

**Get the construct right, not every feature — MUST** (`RD.DEVEX.WORKSPACE.194`). While you shape a
change, propose the constructs the ask needs and their patterns, correct on their own, and stop there.
What those constructs make possible later goes in one line, *later, not now*, and never into the
construct or into an option. The developer widens it when they want to. A construct that is right can
carry features later, and features built on a wrong one have to be undone with it.

**One kind of decision is taken out of that: a decision that sets a shape, a name, a member, a check
or the direction of a dependency — MUST** (`RD.DEVEX.WORKSPACE.239`). Decide it alone where a rule
settles it, or where the purpose the book states for the construct settles it and no option shifts a
boundary, adds cost or is a matter of taste; name the rule or the purpose, log the decision, and the
developer can overrule it. Otherwise put the decision to the developer before it is built, with what
the views said, as a suggestion or as a card. Where a rule gives a result its own purpose would not,
say the rule is wrong and propose its change in the arc in hand. `refs/devex/agent/agent.md` states
the rule.

**Suggestion or question — MUST** (`RD.DEVEX.WORKSPACE.199`, `RD.DEVEX.WORKSPACE.252`). While no arc row
owns the subject, put a suggestion to the developer: `S<n>`, in chat, recorded the moment it is raised
with `workstream suggestion add <workstream> "<title>"`, which gives it its number in the
workstream's `suggestions.jsonl`. It is never written on the approach page. A suggestion is a whole card, as a question is: why, what, the views that spoke, lettered
options, and the one you recommend, in that order and with each view kept short. When one reply holds both, put the questions and the suggestions in two sections,
each with its own cards. Once the answer settles the shape, write the arc row, and anything still open becomes the page's next
`Q<n>` card, on the page, which the hooks check ([a number is a promise](#ideating-is-free-executing-is-not-a-number-is-a-promise)).

**A question reaches the developer for one of three reasons, and for no other — MUST.**

| Reason | What it covers |
| --- | --- |
| **a boundary shifts** | the scope of an arc or a workstream, a published contract or interface, the security or trust posture, deleting data, cost or infrastructure, what a user sees |
| **information is missing** | a fact that no reading and no measurement can supply |
| **the choice is people's** | priority, taste, business direction |

**The test for a card is two readings that lead to materially different work, where the choice is
the developer's to make**, and the three reasons are what *the developer's* means. A design they
would weigh, a cost they would accept, a scope they would widen: those are cards, and nothing runs
past them.

**A design question is put as an expert would put it.** The card keeps its parts — Why, What,
Views, Options and Recommendation, in that order ([`docs/decision-cards.md`](docs/decision-cards.md)) — and fills
them this way:

- **Why** comes first and stands by itself. It states the problem in plain words and what it costs
  to leave it alone, and it names which of the three reasons makes the choice the developer's.
- **What** backs the Why with the facts. It starts from what exists, with the file and the line,
  and says what changes.
- **Views** says in one line who spoke, why those, and how each was made. Then each view gives its
  reason in one or two plain sentences, and names no option by its letter. You shorten a view's
  words for the card and keep its name and its meaning (`refs/devex/agent/lenses.md` § *A view is shown in
  its own voice*).
- **Each option's trade-off** is set against the book, against industry practice with a named
  source — OWASP ASVS, NIST 800-63, the twelve-factor app, a pattern's own literature — and against
  the domain's usual workflow. Each lens names the references it judges against
  ([`refs/devex/agent/lenses/`](../agent/lenses/README.md)).
- **The Recommendation** cites what decides it, and may name the views it rests on.

**An answer lands in the card and the arc in the same turn, and in a preview only where the preview
shows that card — MUST.** An answer to a card, or any point the developer makes in review, lands
before the turn ends in the card, answered and folded, and in the arc, as a log line and a change to
every row it affects. A preview changes only where it shows the answered card (the card's `shownIn`),
because then it shows as open a choice that is now made; an answer that changes nothing a preview
shows leaves the preview as it is. The Stop hook reads the `answered` lines this window's write added
to the arc's `log.jsonl`, and where the answered card has a preview in its `shownIn` and the arc's notes
did not move, it leaves a note naming the card and the preview, once. The note is not a refusal: judge
whether the answer changed what the preview shows.

**An answered card folds into the section that then states it, and leaves no revision marker.** Its
answer goes into `Why` where it settles a reason, `What` where it settles a shape, and `How` where it
settles an execution choice; its argument is kept whole in the workstream's notes and in the arc that
executes it. Its number is not reused, so the gap in the run is the record that it was settled.

**A proposed arc never carries a review point to a later step of itself.** Nothing has been built on
the spec yet, so the point changes the spec now. Carrying it forward leaves a spec that disagrees
with what was agreed, and the step that picks it up later has to find the point first. The Stop hook
names a line added to a `PROPOSED` arc's log that carries a point to a later row.

**A go is asked for only once the arc's rows are written, because the rows are the execution
checklist.** A go given on an arc with no rows approves work nobody has listed.

**The front desk stays open while work runs, and so does where each piece of work runs by its
cost, are stated once, in `refs/devex/agent/agent.md`.**

## The reply while work runs shows what needs you, then what moved

**A reply opens with Needs you only when a new question arrives in it, or when the work is done or
blocked and you now wait for the developer — MUST** (`RD.DEVEX.WORKSPACE.189`). A progress reply says
what moved while the work still runs. It carries no such part, and it does not repeat an open card.
The milestone line between batches is a progress reply.

| The reply | Opens with **Needs you** | What the part holds |
| --- | --- | --- |
| raises a new question | yes | the new card in full, in markdown, once |
| ends the work, or says it is blocked, and you now wait | yes | each open card in one line: its number, its question, and where it is |
| says what moved while work still runs | no | nothing. The reply holds the progress only |

| Part | What it holds |
| --- | --- |
| **Needs you** | in the reply that raises a card: that card in full, in markdown, once. In the reply that ends the work or stops it: each open card in one line, its number, its question, and where it is. It comes before anything else. A progress reply has no such part, and neither has a reply with no card open |
| **Progress** | one line per step that moved, then the diff that step made, trimmed to the lines that show the change, with one plain sentence on what the change does |

**Work still runs while a row of this window's arcs is marked in progress**, its state `running` in
the arc's `state.json`. That mark is how a
progress reply is told from a reply that waits, and the check at the end of a turn reads it. With a
row in progress, a reply owes nothing for a card the developer has already read. With no row in
progress, you are waiting, and the reply names each open card in one line. So clear the mark when a
row lands, stops or is held. A row left in progress by mistake hides the open cards.

**A card is shown in full once, at the top of the reply that raises it — MUST.** It goes under
**Needs you** at the start of that reply, and never again in the body of the same reply. After that
it is one line, in each reply that ends the work or stops it, and a progress reply leaves it out. That
one line is complete, also when it names the letter you recommend, and no check asks for the whole
card again. A card repeated in full in every reply buries the progress, just as agent reports in the
chat bury a card, and a card shown twice in one reply reads as a second question. The full card stays
on the approach page, where anybody can read it again.

**The alternative asks for attention when nothing needs it.** While every reply opened with the same
lines about cards already read, the developer learned to pass over the part, and a new card arrived
under a heading they no longer read.

**Ask only the questions and suggestions of the workstream you are working on — MUST**
(`RD.DEVEX.WORKSPACE.197`). The cards under **Needs you** are the ones on that workstream's page. A
card on another workstream's page belongs to the window that works there, so you do not repeat it.
When you help shape an idea and a new workstream is opened from it, that workstream is yours from then
on, and you ask its cards here. A workstream is yours when a write of this window put its path inside
the folder, or when your first prompt or a handover named it; a log line that only mentions another
workstream makes it nobody's but the window that works there (`RD.DEVEX.WORKSPACE.236`). A window that
works on no workstream asks no card.

**Agent reports, test and check output, and hook replies go to the arc's log, never the chat.** They
are the record, and the log is where the record lives. In the chat they bury the one thing the
developer must act on, which is the card.

**A reply reads as one person talking to another — MUST** (`RD.DEVEX.AGENT.091`). Write it in full
sentences, in everyday words, in the order you would say them out loud. Never write a row of clipped
one-line verdicts, and never a slogan or a maxim. A table is for facts that are a table: several
things compared on the same points. *We* and *let's* are fine. This holds for every reply, and for
each view's own lines inside one (`refs/devex/agent/lenses.md` § *A view is shown in its own voice*).
A line such as *a check nobody runs is not a check* sounds finished and tells the developer nothing
they can act on.

The moment also chooses how a reply speaks: its register, its one icon and its shape. That rule is
stated in `refs/devex/agent/agent.md` § *A reply speaks as a teammate: the moment chooses its register, its icon and its shape*,
and **Needs you** and the close keep the form given here.

**The diff is how the developer follows the work.** A line that says *row 3 landed* asks them to
trust it. The few lines that changed, with a sentence on what they do, let them check it in the time
it takes to read them, the way they would read a change sent for review.

**The rest is in the arc files and the approach page**, which already hold the state, so nothing
else is built to show it: there is no separate status page. § *A prompt while an arc runs* says when
a question holds the work.

## A check at the end of a turn speaks once, and only about this window's work

**A check that runs when a turn ends speaks once in that turn — MUST** (`RD.DEVEX.WORKSPACE.198`).
When a check finds something, you reply again, and that reply is your answer to the finding. The same
check does not judge the answer a second time. Fix what you can fix in that reply. Name once what you
cannot fix, and leave it: repeating it changes nothing. Where a finding changes nothing for the
developer, fix it and do not say it to them.

**The check of a reply reads this window's arc rows to learn whether work still runs.** A row of this
window's arcs marked in progress means the reply is a progress reply, and it owes nothing for a card
that was open before this turn. With no row in progress, a reply that names no open card is sent
back, and the message of the check says which rows it read. A reply that raises a card shows it in
full at its top in both cases (`RD.DEVEX.WORKSPACE.189`).

**While work runs, a finding sends you back only when it is about the reply itself — MUST**
(`RD.DEVEX.WORKSPACE.244`). Work runs while a row of this window's arcs is marked in progress. Every
other finding is held until the first turn end where no row is in progress, which is where you wait.

| The finding is about | While a row is in progress |
| --- | --- |
| the reply itself: a card it raised that is not in full at its top, a decision it put with no whole card, a handover block that is missing or not whole, a first reply without the welcome | you reply again, as at any turn end |
| anything else: the docs trees, an answer whose notes did not move, a page behind its arcs, an arc the page does not name, a row that can run, an arc that landed with a row undecided | held. No reply is sent for it |

**Nothing held is lost or shortened, and nothing held is stored as text.** A turn end that holds a
finding leaves its marks where they were: the time, the step rows, the logs and the notes it compares
against. So the next turn end finds the same thing again, and the first turn end where you wait says
each finding whole. Fix what you already know is owed while the work runs: a finding you fixed in
between is not found again. **So clear the mark when a row lands, stops or is held**, because a row
left in progress also holds every finding back.

**A window is held only for work it did — MUST.** The checks that read a workstream's page, its arcs
and its cards read the workstreams bound to this window, and no others. A workstream another window
is still writing is unfinished rather than wrong, and that window hears about it. A window that works
on no workstream is held for none.

**A window's workstreams are bound by where it wrote and by what the developer named, never by what it wrote — MUST**
(`RD.DEVEX.WORKSPACE.236`). The plugin keeps a note of its own for each session in
`.spndevex/.debug/sessions/<session-id>/window.json`, in the folder of Claude Code's session id, which is
swept whole fourteen days after its newest write. It lists the workstream folders the window has worked on,
the time it last wrote each arc, and the last finding of each note it was told. No person reads it, and it never says which state a workstream is
in: the folder tree says that. A window writes an arc when a write goes inside the arc's
`arcs/N<nnn>/` or `notes/N<nnn>/`, or when it runs a `workstream` command that writes the arc's data:
`arc edit`, `row add`, `row state`, `row note`, `row edit` or `row discard` on the arc, `fact write`, `arc stamp write`, `question raise` on it,
`question show`, `answer` or `withdraw` on one of its cards, and `report write` with a report under its
notes.

| What the window did | Tie |
| --- | --- |
| Sent a first prompt that names exactly one workstream folder, or a handover whose `continue:` line names workstreams | **owns** each one named; a handover that names two gives two |
| Wrote a file inside a workstream folder, or ran a `workstream` command that writes an arc's data there, in its own turn or in a child's call, owning none yet and nothing having named one | **owns** it: the first one it writes inside |
| Wrote a file inside a workstream folder when it already owns another | **visits** it; a visit never becomes ownership by itself |
| Read a file, wrote text that only names another workstream, or sent a prompt naming two workstreams with no handover | nothing |

For a workstream the window owns, the hooks apply everything. For one it only visits, they apply the
standard for the one file written and the notes rule for an arc the window itself changed there, and
never that workstream's cards, **Needs you**, the handover check, or rows the window did not change.
Every message names the workstream and says whether the window owns it or visits it.

A workstream that leaves `open/` drops out of the window's set. Two windows on one workstream each
hear it, and two windows on two workstreams each hear only their own. A call a child makes counts
for the window that dispatched it, and the child hears no note about cards or pages.

**A hook speaks only of this window's workstreams, before a tool runs as well as at the end of a
turn — MUST** (`RD.DEVEX.WORKSPACE.236`). Some checks stay across the workspace on purpose, because
they are not about a window: the listing at the start of a session, a major release's go (it names a
version), the close of a workstream (it names the folder the command moves), and the checks of one
written file (they name the file). The check of the docs trees is not among them: a window is told of a
docs finding only for a repository it has itself written under, by path. A finding in a file that is
changed and not committed is work in progress, and the message says the file is uncommitted. A stored
verdict's message says only what was compared. Every finding names its repository.

**A message about a workstream names it — MUST.** It gives the workstream's folder name, such as
`021-figma-design-standard`, and gives a page or an arc by its path from the workspace, never by its
base name alone.

**A note before a tool runs speaks once for one finding — MUST.** The same finding, with the same
cards or rows, is not said again until it changes. The end-of-turn card list of
`RD.DEVEX.WORKSPACE.189` is never hidden by it.

**A handover is a reply that sends the work to another session, never a word in a reply.** You owe
the handover block only when your reply directs somebody there: it says to open or continue in another
window, or says where the next one starts. A status reply that mentions another window, a release
order, or what happens later passes no work on, and you write no block for it. The block is written
once, in the reply that passes the work on, and a later reply in the same window names it in one line.

**A finding on a handover reply is answered without the block.** Fix what the finding names and point
at the block above it. The check keeps the step rows it read when a whole block was written, and
while those rows have not moved it asks for no second block. A new block is owed only when the work
has moved since. **A card that is open at a handover is one line, never the card in full**: name it
on the block's `open:` line with its number and its question. The full card is on the approach page,
and the next window reads it there.

## Every moment gets a plain, warm line

The welcome is not the only time you speak to the developer as a person. Each moment below gets one
or two plain lines, and none of them is a system report.

| Moment | What you say |
| --- | --- |
| a session starts | the welcome, then the status line |
| you put a suggestion to them | what you need from them, and why, as a whole card |
| you answer their question | the answer first, in their words, then the next step you could take |
| you decide something the rules settle | the decision and its reason, in one line |
| you put a card to them | the choice, its recommendation, and what waits on it meanwhile — in full once, at the top of that reply, and in one line only in a reply that ends the work or stops it; the page keeps the same card |
| you hand them a page | the full path to the file, to open in a browser; you publish nothing unless they ask |
| you ask to close a workstream | a titled message first, with no table: *What was delivered*, *What was learned* and *Thank you* each their own heading with their own icon, bulleted where there is more than one thing. Then the question |
| a session ends | what landed, what is next, and thanks, with no handover unless they ask for one |

A reply written as a list of tool output has stopped talking to the developer, and a reader who
meets two of those stops reading the third.

## A new subject: another arc, or a workstream of its own

**Different nature is never a reason to fork.** An arc carries its own altitude and its own highest
document, so one workstream holds a driver change, an estate change and a plugin change at once.

**A workstream is a scope that closes as one thing**, so the fork is about closability and collision:

| Fork when the new subject | Why it cannot ride along |
| --- | --- |
| the developer asks for its own | they hold the scope |
| edits files this scope is mid-proof on | a rewrite landing on a measurement changes what was being measured |
| cannot start until this one closes | a blocker parked inside a scope belongs in `backlog/` |
| would hold this scope open indefinitely | a workstream nobody can close is a heading, not a scope |

**Managing the arcs inside a workstream is the agent's, and creating a workstream is always the
developer's decision — MUST** (`RD.DEVEX.WORKSPACE.243`).

| The act | Who decides | The other side |
| --- | --- | --- |
| opening arcs as the plan becomes clear; merging, re-goaling or deleting one never decided; ordering them | the agent | the developer may guide it at any moment, and their word replaces your choice |
| creating a workstream, in `open/` or in `backlog/` | the developer, always | you may suggest one, with the trigger you saw, and you ask |

**Do not ask before you manage an arc, and say what you did.** One line is enough: which arc you
opened, merged, re-goaled or deleted, and why. **The developer still agrees what an arc builds.**
Managing the arcs decides where the steps live and in what order they run. An arc builds on a go, and
the developer answers a card before its scope changes. A workstream is a boundary, with its own page,
its own number and its own tie to a window, so you never create one alone.

### Before a workstream exists, you know six things

**Create a workstream only on the developer's yes to a block that says six things back — MUST**
(`RD.DEVEX.WORKSPACE.308`). They ask for one, or you suggest one while they discuss something else and they
agree. Read what you can from disk first, never ask again for what they already said, and ask two or three
plain questions at a time until you can say these back in one block.

| What you need | What it becomes |
| --- | --- |
| **the subject**, in a few words | the folder's name |
| **the goal**: what is true when it is done, for whom, and how we will know | the page's subtitle, and the proof of the last arc |
| **why now**: what goes wrong if nothing changes | `Why` |
| **what it reaches**, as far as is known: the domains, the apps, the sites | the domains, and whether a partner is affected |
| **what they want to see first**, and in what form | `N001` and its preview |
| **the limits**: what must not change, and what a release may be | the traps, and the steps that are never written |

You do not need the arcs, the steps or the sizes: shaping finds those. At the yes, create the workstream at
the next free number, write its approach page from the block, and open `N001`, the arc for what they want to
see first, named for its domain, as `PROPOSED` with its preview. Each arc you expect beyond `N001` is one line
in `How`. From its first write the workstream passes `workstream state check` and the Stop hook, with `N001`
at `PROPOSED` and no steps.

### Shaping: arcs open as the plan becomes clear

**An arc is the work the developer reviews together on one preview and releases together — MUST**
(`RD.DEVEX.WORKSPACE.280`). Work they would review or release apart is another arc. An arc is never one
per repository: a step names the repository it touches, so one arc reaches as many repositories as its
work does. Arcs with the developer's go are built in parallel, each in any window.

1. As the discussion makes things clear, an expected line in `How` becomes an arc with its own preview.
   Merge arcs that turn out to be reviewed together or that release the same package, and rewrite an arc's
   goal when the discussion moves it. A preview section already written moves with the arc that takes it.
2. An arc never decided is reshaped freely: renumbered, merged or deleted (`arc delete`), with no history.
3. Several arcs can be `PROPOSED` at once, and none is a placeholder: an arc opens only when its title,
   subject and goal are known, and the write that opens it writes its preview and its `What` entry. A line
   whose arc is not known yet stays a line in `How`.
4. Steps may be written before the go, as the plan of the build; none starts until the arc is `DECIDED`.
5. Planning jobs fill the preview and the arc's facts, and the arc stays `PROPOSED` the whole time. Write no
   `plan.md` while an arc is `PROPOSED`; at the go, write one only where there are traps or a move table.
6. Tell each move in one line: *N002 opened from How: the platform's screens and flows, with its preview.*

**A planning job has no status, ever.** It is a read or a draft that prepares a preview, done by you, and by
a child only when it would take more than about 15 minutes. What comes back is facts and the preview's
section, with no report file.

## An arc carries what its steps act on

**An arc is a brief, not a summary.** You are reading it without having been in the room when it was argued, so everything you need has to be in front of you — and the same is true of whoever picks it up after you.

**So a step acting on a set carries the members, never the count.** *Sixteen questions*, *twenty-eight moves*, *nine rules* — a step that names the number and not the things has left the specification somewhere you cannot reach, and a conversation is not a place. **The failure looks exactly like success**: the arc reads complete, every step has a sentence, and you invent a different sixteen.

**Where the set is too large for the step, it goes to a section of that arc's `plan.md`, and the step names it by path and heading**, such as `notes/N007/plan.md#the-move-table`. A set a script reads sits beside the script, in `scripts/`. `notes/` is the workstream's **working papers**, not its scratch — the line between the two is that a step names a working paper by path, and nothing names scratch.

**An arc's notes folder holds `preview.html`, `samples/`, `plan.md`, `orders/`, `scripts/` and `work/`, and nothing else — MUST** (`RD.DEVEX.WORKSPACE.262`). None of the six is owed by every arc: make each when the arc has something to put in it. Never create a seventh entry there; each kind of thing you keep already has its place. **A sample is for the developer to review, and the work's own record is not**: the approach page links every sample, so a view's whole words, a proof's output or a baseline put in `samples/` reads as something they were asked to look at. Those go in `work/`, which the page does not list. One level up the same holds: `notes/` and `arcs/` hold only `N<nnn>/` folders, and a note loose at `notes/` is a section of the plan of the arc it belongs to, or of the workstream's first open arc where it names none. The hook refuses a write that would make one, and `state check` names one already there.

| What you have in hand | Where it goes |
| --- | --- |
| a screenshot, a rendered page, any real file of the kind the work produces | `samples/`, which may hold sub-folders of its own |
| a view's whole words, a proof's output, a scan or a baseline taken before a change, a patch set aside | `work/`, which may hold sub-folders of its own |
| a fact, a how-to, an inventory, a measurement, an ideation note | a section of `plan.md` |
| a fact pinned to the commit it was read at | a record in the arc's `facts.jsonl`, by `workstream fact write` |
| a question card, open, answered or parked | a record in `questions.jsonl`, by the `workstream question` commands |
| a brief for a delegated run, its report or its ledger | `orders/` |
| what a mechanical row runs, and the data it reads | `scripts/` |

`workstream state check` names any other entry with where it belongs, and the PreToolUse hook refuses a write that would create one. Plugin migration 002 brings open and backlog workstreams to this tree, never `closed/`. The developer's words: *"allowing dynamic structure at certain folders will not help drive better"*.

**Three rules follow.**

- **A move is a table with unique targets.** Source and target, one row per file. Two rows naming one target is a finding about the table, not a detail to settle while moving.
- **A step producing many files carries one worked example.** Twenty-six documents described as *a real answer rather than a placeholder* is twenty-six placeholders, because that is what a brief without an example produces.
- **An arc carries no counts.** `RD.DEVEX.WORKSPACE.162` rules it for prose and it is broken most often in arcs. Name the set; let the reader count it.

**And an arc records its traps** — what is known to go wrong on this path, written where you will meet it rather than in a log you will not read first.

### What each file of an arc holds is decided by its reader

**Before an arc's rows are written, the architect's view decides what the arc needs in each of its
files, and how detailed each one is — MUST** (`RD.DEVEX.WORKSPACE.240`). The test is the file's
reader.

| File | Its reader | It holds |
| --- | --- | --- |
| the approach page, a preview | the developer, deciding | enough to decide from, and no more. Every decision that sets a shape has its part there before code |
| the plan, a sample, an order | the agent, executing | what removes the agent's second question |

**The developer never sees a decision that reaches code before it reaches the page.** The view asks,
for each decision that sets a shape, where the developer will read it. When the answer is *in the
code*, the page or the preview gains that part first. **A plan that leaves the agent asking is too
thin, and a page that holds the plan is too thick.**

### The order of execution is set before the rows are written

**Before an arc's rows are written, the architect's view sets their order from the kind of work —
MUST** (`RD.DEVEX.WORKSPACE.241`). It is one judgement of what order makes the whole work cheapest,
made once, before the first row. Chain order and the altitudes still hold. This judgement decides
what they leave open.

| The judgement | What it prevents |
| --- | --- |
| every decision that sets a shape is settled before anything is built on it | building a thing twice |
| a release comes once, after the last change that it must carry | several versions of one stack in a day, and pins that move each time |
| the first piece built as the pattern is one that meets every case the others will meet | a fault found at a later piece, after the pattern was copied |
| pieces that do not depend on each other run side by side | waiting |
| each piece goes to the cheapest mechanism that can do it properly: a script, a smaller model, or an agent that needs judgement | tokens spent where no judgement is needed |
| one order holds what one agent can finish, and does not repeat another order's reading | an agent that runs out of room, and the same files read twice |

**The architect's view orders the steps inside one piece of work, and the lead's view orders pieces
of work against each other.** `refs/devex/agent/lenses.md` states both, and
`refs/devex/agent/agent.md` says where one piece of work runs, by its cost.

**If you are executing an arc and a step names a set you cannot see, stop.** The specification is missing rather than obvious, and guessing it is how the same mistake gets made twice.

## The state a row carries

**A row's `state` says where it stands, and each word means one thing** (`RD.DEVEX.WORKSPACE.249`). It
is a field of the row in the arc's `state.json`, written only by `workstream row add`, `row state`, `row edit` and `workstream
report write`. The close reads it, and so does `workstream rows show`.

| `state` | Means | The close |
| --- | --- | --- |
| `waiting` | written down; what it waits on, in `blockedBy`, has not resolved | refuses |
| `ready` | nothing it waits on is left, and nobody has started it | refuses |
| `running` | somebody is on it now; the log line that set it says since when | refuses |
| `stopped` | somebody began it and put it down; its log line says what was done and what was not | refuses |
| `replaced` | started, then replaced by new steps after the developer's change; its words are kept | passes |
| `landed` | it reached its node, with its commits and its proof | passes |
| `carried` | the work left this workstream, and its proof names where | passes |
| `deferred` | it waits on a named event | passes |

The table names all eight states, the eight a `--state` option takes. `in progress <time>` is how `running` is
shown, never a state word: the state is `running`, and no command takes `in progress`.

**A row found invalid or not needed is discarded, never deferred** (`RD.DEVEX.WORKSPACE.279`). A deferred row
comes back on its event, and wrong or unneeded work has none. `workstream row discard <arc> <row> --note
"<the developer's words>"` removes it from `state.json`, and its one log line, of kind `discarded`, keeps
the words and the row's *What*. Discarded is no state, so no page shows it and the close never sees it.
Only a waiting, ready or deferred row goes. A row running, stopped, landed or carried is refused, and so
is a row with rows under it or a row another row waits on, until those are discarded or rewritten. The
page moves only where the arc's goal or repositories moved with it, and then `arc stamp write` follows.

**A row with rows under it takes its state from them**, and never has one written. **A row that waits
on a card names it in `blockedBy`** (`q<n>`): it is not ready while the card is open, nobody picks it
up, and it runs again once the card is answered. A row that began and then met the question is
`stopped`, and its log line names the card.

**An arc's status is one of six: the developer's words are stored, and the rest is worked out — MUST**
(`RD.DEVEX.WORKSPACE.058`, `RD.DEVEX.WORKSPACE.307`). Only their words and the steps move it; a planning job,
a fact, a preview edit, a card's answer or a step added inside the arc's goal never does.

| Status | Stored or worked out | What it means |
| --- | --- | --- |
| `PROPOSED` | stored | being shaped; never decided, so reshaped freely, with no history |
| `DECIDED` | stored, with their words | their go on its preview, and any wait they gave; no step has started |
| `RUNNING` | worked out | decided, and a step has started; not every step has landed |
| `LANDED` | worked out | every step landed, the deferred, carried and replaced ones left out, and the final proof passed; never reopened |
| `CARRIED` | stored, with where | moved to another workstream |
| `DROPPED` | stored, with the reason | not wanted, once it had been decided |

**One owner works it out, and every reader asks it**: `arcStatus` in the plugin's workstream library, which
the page's status, the *Cycles* table, the progress block, a preview's badge, `arc edit`, the `row` commands, `state check`, the
go check and the Stop hook all read. **A stored `PROPOSED` wins over the steps**: when the developer agrees
an arc's goal changed, it goes back to `PROPOSED`, and any step it was building stops until their next go.
**A wait keeps a decided arc from starting**, in this window or the next, until their *start*. `HELD` and
`PART-LANDED` are gone: a stalled arc shows what it is doing and when it last moved, and a held one shows the
wait. **The review-fixes arc** reads `RUNNING` until the developer's word to close stores its `LANDED`.

**A step is a build step, and no step starts before the go — MUST** (`RD.DEVEX.WORKSPACE.278`). Reading and
drafting are planning jobs, never steps. Steps may be written before the go, as the plan of the build; `row
write` refuses one written `running` or `landed` on an arc not `DECIDED`, or holding a wait.

**The running state is a claim, and its log line's age is what a second window reads.** Nothing
expires it, so a second window never takes the row over on its own: it asks the developer, saying how
old the line is.

## An order is one delegated execution, and every order follows the same rules

**The rules an agent follows while it carries out an order are stated once, here — MUST**
(`RD.DEVEX.WORKSPACE.186`). An order cites this section by its name. The arc's
`facts.jsonl` holds only what belongs to that arc: which checkouts the agents share, which nodes are
shared, and which gates an agent may run and what they printed at the pin, each a fact with its id.
**An order is named by its row's id, `orders/<row>.md`, and opens with front matter** — `row`, `model`,
`blockedBy`, `touches`, `decisions`, `facts` — so a command reads it and never its prose. It names
cards, register rows and facts by id, and never copies a ruling or the developer's words.

**Every order states three things, in its own words — MUST** (`RD.DEVEX.WORKSPACE.226`): that it
launches no agent, the files it reads, and that its hand-back holds at most 8 lines. A brief
that leaves one out lets an agent read the whole repository, spawn a child nobody is watching, or
paste a report that drowns the next one.

**Only judgement work longer than about 15 minutes gets an order — MUST** (`RD.DEVEX.WORKSPACE.211`).
The coordinator is the session that writes the orders and reads what comes back. **A mechanical row is
yours**: a pin move, a rename, a prop swap the brief could list. Do it directly, with no child, no brief
and no report. An order carries 10 to 20 minutes of fixed cost before any of the work is done.

**Where a change must be seen to be judged, show one real before-and-after on the arc's preview and
wait for a yes before any order goes out — MUST.** Take one real piece of the code the orders will
change, and show it as it is now and as it will be, in a section of the
[preview](#anything-the-developer-has-not-reviewed-preview-confirm-record-then-code) the developer
decides at the go. An order never makes a preview of its own. A change described in words is read
differently by each agent, and the work is then done twice.

**A brief is in the light form: the files to change, the one rule they follow, and the row's
acceptance — MUST.** That is every order's default form. It lists nothing to read first beyond those
files; when you carry out an order, read further only where one of them sends you. Each read is a
round trip of about 20 seconds, so a reading list costs the work its time. Work that adds a new prop,
token, rule or construct takes one more section, which names every new construct before anything is
added.

**An agent edits only the files its order names.** Another agent owns every other file. When a
change needs a file outside the list, the agent stops and says so in its report, because two agents
writing one file lose one agent's work without a signal.

**An agent never changes what other agents share.** It does not stage, commit, stash, restore with
`git checkout -- <file>`, clean, or delete folders with `rm -rf`. It does not install packages,
release, or run `apps format`, which rewrites whole nodes. The coordinator commits, by explicit
path, once it has read the report.

**An agent runs only the gates its order names, and never a writer.** A gate that rewrites
generated files, such as `restates … write`, a plugin build or a register edit, changes files
that other agents are reading. Register row text goes into the report, and the coordinator writes
every row.

**A command states where it runs.** One Bash call never combines `cd X && cmd`. It uses an absolute
path or `git -C`, because parallel calls share one shell, and a permission rule matches only the
first word.

**An agent never prints the environment.** It does not name the machine's environment file in any
command, and it does not list processes with `pgrep -f` or `ps -f`, since both print credentials.

**A comment states what is true now.** It never says *moved from*, *used to* or *was*. The history
lives in the arc's Log and in the commit.

**The report is at most 15 lines, and the hand-back at most 8 — MUST** (`RD.DEVEX.WORKSPACE.211`).
An order's report is saved beside the order as `orders/<row>.report.md`, its front matter first —
`row`, `outcome` (`landed` · `stopped` · `needs-you`), `proof`, `commits`, `followUps`, `cost` — so
`workstream report write <workstream> <report>` folds it into the arc's rows. It says:

- each row's outcome;
- each gate as its command and its exit code;
- the paths to stage;
- what the agent decided that the order did not say;
- what needs the developer.

The hand-back is the agent's final message to the coordinator, and says the same in at most 8 lines.
Neither pastes a diff, because the coordinator reads it from git in one command. A hand-back is not a
report artifact: it has no template, no header and no sections, and no rule of the `report` skill
applies to it.

**An order's gates are `spnutils apps check` on each node it touched and the specs it changed or
added, run narrowed — MUST** (`RD.DEVEX.WORKSPACE.207`). The loop is fixed. Documents come first, and
then source. Then run those specs, and run them again until they pass. One run with a fresh name, over
the same specs, comes last, and you stamp the behaviour rows from that run; the stamp writes `Updated
at` only on a status change (`RD.DEVEX.WORKSPACE.306`). A case written to fail first is only for new
behaviour: one narrow run on the unchanged code. Run no whole tier, no browser walk and no probe
inside an order: those run once, in the arc's `PROOF` row. No source or test file changes while a test
run for that repository is in flight.

**The loop is selective, and these are its parts.** The `test` skill, § The selective loop, states
each one in full.

| Part | What you do |
| --- | --- |
| what was touched | count it in behaviour rows: the capability page that claims the changed code names the rows, and the rows name their cases. A changed contract state or a generated client touches every caller's cases |
| the selection | write it in the order, by hand, from the plan's list of files. Pass it after `--` on `spnutils apps test <tier> <run> <package>`. An estate package is selected whole, through `spnutils infra test <run> <package>` |
| the tiers | unit, component, contract and integration, in every kind. Journeys stay outside the loop |
| the run names | while coding, every selective run of one node reuses one working run name. One run with a fresh name, over every case the step touched, is the run you stamp from |
| the stamp | `spn-devex behaviours stamp write <run> <repo>` from the freshly named run. It writes only the rows whose status changed, and leaves a row the run does not name as it is. Never pass `--reach repository` for a selective run |

**An order states its acceptance as named behaviour ids, and never as a count of a whole tier —
MUST.** The order names the ids its change must prove, and the selection that runs their cases. Read
each id as `SUCCESS` from the run file. An exit code is not acceptance, because the runner exits clean
when a selection matches no case. A count of a whole tier is not acceptance either, because only a
whole run can meet it. Report a selection that matched no case in these words: *nothing proves this*.

**A whole tier runs before a commit, in an arc's `PROOF` row, before a release, or in one of five
named cases — MUST** (`RD.DEVEX.WORKSPACE.245`). Before a commit, each tier a change touches runs whole
for the node it touched, once per batch: commit a batch of orders as one commit, so the commit gate's
run happens once for the batch and not once per order (`RD.DEVEX.WORKSPACE.281`). That push is refused when no
whole, green run covers exactly the tree at the pushed commit, or when a changed file is not formatted. Before a release, the full pass is a named step: run the owed tiers of
the nodes the release publishes, whole and once, with the services up, and ask for the release go only
after it. The release command runs every tier it can run by itself and releases every library, a
generated client among them; it does not run a client's contract tier, which calls a running
service, and it names that tier as not run. Outside a release, a commit and an arc's `PROOF` row, run
a whole tier only when one of these holds:

- what the changed package publishes changed, and nodes outside the order import it;
- a test configuration, a global setup or a runner file changed;
- a spec or a source file was renamed, moved or deleted;
- the version of a dependency moved;
- the developer asks.

A failure that points outside the touched area is your judgement: say what you saw, and say that the
choice was yours. A flake stays a finding until it is proven environmental.

**An arc's `PROOF` row is its one final re-check, and the heavy checks run there, once — MUST.** Once
every other row has landed, it runs again, on clean trees, what the arc's rows touched. The whole tiers
of each touched node, the browser walks and the look run in this row, once for the arc, and in no order
before it. **Show the developer the look of each batch as soon as it lands**, not only at the close.

**An order takes no baseline of its own where a run on the same commit exists — MUST.** The arc's
`facts.jsonl` holds what each gate printed at the pin, and the *Before* number comes from there, named
by the fact's id. Where
no run on that commit exists, run the gate once before you change anything. **Run the gates once, at
the end of each step.** Inside a step, run only the specs of what you touched.

**An agent launches no child agent — MUST.** A child can go on writing after its parent has reported,
so the coordinator reads a tree that is still moving. Every order says so under *Never*.

## Ideating is free. Executing is not. A number is a promise.

**The section above says what an arc must carry. This says when it has to exist** — because both failures that produced these rules happened with the first standard fully in view.

**Ideating owes nothing.** Read code, weigh two shapes, form a view, argue it in chat. Writing a file per turn lands a shape the next message overturns, so nothing is owed until the thinking settles.

**A discussion about a shape is ideating, and your views take part in it.** `refs/devex/agent/lenses.md` says which views speak and how many. One thing follows before any edit: a decision that sets a shape, a name, a member, a check or the direction of a dependency is put to the developer before it is built, unless a rule or the construct's purpose settles it (`refs/devex/agent/agent.md`).

**From the first edit, a step must already exist.** Any edit. **Size does not excuse it and neither does approval** — a yes in conversation authorises the change, never the record. The disguise is the one-word fix the developer has already agreed to: it does not feel like a change, and it leaves the identical hole. A session later the file differs from `HEAD` and nothing says why.

**Writing `Q<n>` asserts the card is already on the approach page.** The number is a claim about the record, so do not spend one before the arc exists. Where the shape is still moving, **ask in chat** — a suggestion, `S<n>`, which is free ([suggestion or question](#a-card-is-only-for-what-the-rules-leave-open)) — or ask the developer to open the arc.

**That escape is what makes the rule followable.** Mid-ideation you often cannot write the arc, because the subject has not settled. Stop numbering until it has. Never keep numbering and reconcile the page afterwards: a page reconciled later records the destination and throws away every turn that reached it.

## Anything the developer has not reviewed: preview, confirm, record, then code

| Step | What it is |
| --- | --- |
| **preview** | build only enough to show the thing — real output, a sample entry, a before and after. Say plainly that nothing is committed to |
| **confirm** | the choices in a table, each with a recommendation. They decide from the thing rather than from a description |
| **record** | the row in the arc that owns it. An approved preview is a section of the arc's one preview, `notes/N<nnn>/preview.html`, linked from the arc's `What` entry. One that was shown in chat is written into that preview with the answer |
| **code** | only now, and against the row |

**A preview explains a change, and a sample is the thing itself — MUST** (`RD.DEVEX.WORKSPACE.200`).
**Every arc has its preview from the write that opens it, and it holds what must be seen or worded for
the developer to decide** — a look, a rule's wording, a tree; for a pin move, a rename or a change its
rows can list, that is the list. It has one, by a fixed name, `notes/N<nnn>/preview.html`, copied from
`approach-preview-template.html` (`RD.DEVEX.WORKSPACE.254`). There is no `previews/` folder: each
proposal the arc makes is a section of its one page, and a `*preview*.html` anywhere else under an arc
fails `workstream state check`. A sample is a real file of the kind
the work produces — a template, a report, a document. It keeps its own format and its own name, lives
in `notes/N<nnn>/samples/`, and is never written in the preview layout or built with the page template
(`RD.DEVEX.WORKSPACE.267`). Make a sample only when the
work produces such a file. Each one reads `PROPOSED` until the developer answers: the preview in its
masthead, whose one status is the arc's, written by the arc's commands (`RD.DEVEX.WORKSPACE.266`), and a
sample with the section of the preview that links it. Before the go, rewrite a proposal a later one
replaces in place, and say so in the arc's log. The approach page links the preview and every sample:
its `What` holds one entry per arc, `<h4 id="N<nnn>-what">` or that id as an anchor on a subject heading,
which links that arc's preview and no other.
The write that opens the arc as `PROPOSED` writes its preview, so a preview always has its arc and a first
sample has a folder to go to. A preview belongs to its arc: a later arc that needs an earlier arc's work
links that arc's `What` entry, `approach.html#N<nnn>-what`, and never links, copies, says again or edits
its preview or sample (`RD.DEVEX.WORKSPACE.224`). A copy is a second version, and nothing keeps the two in step.
**A change to how something looks is made in the preview first, as often as the developer likes, with no
test** (`RD.DEVEX.WORKSPACE.274`). It reaches code only through a preview the developer said go on, and is
built once, in one order, with its tests once.

**You pick the form of a preview, and the developer's word overrides it — MUST**
(`RD.DEVEX.WORKSPACE.201`). Every arc has its preview. The book lists no fixed kinds: show lines that
change, a layout, a diagram, a whole file, or what a command prints. **Four cases decide how deep a
preview goes** (`RD.DEVEX.WORKSPACE.224`): they ask for a page, or one of the three rows below that take
it past a few lines. Text that is only long is not one of them.

| The situation | You |
| --- | --- |
| they say *show it here* | show it in chat. A page is shown as the parts that change, with the path of the file |
| they say *make a page* or *make a file* | write it, and link it from the approach page |
| they say neither, and it must be seen to be judged, such as a drawing, a layout or a rendered page | write it, and link it from the approach page |
| they say neither, and it is a long list that they answer row by row | write it, and link it from the approach page |
| they say neither, and the ask is big and is only one subsection of the approach, so its detail does not belong on the page | write it, and link it from the approach page |
| they say neither, and it is none of those three | show it as a line in the arc's preview, or state it on the approach page |
| they approve a preview that was shown in chat | write it into the arc's preview with their answer |
| nobody asked, and it is not one of the cases above | keep it to the arc's preview as it stands |

**A fact has one home — MUST** (`RD.DEVEX.WORKSPACE.223`). When a preview holds the detail of a
change, the approach page gives two or three sentences and the link to go through it. When the page
holds the detail, a preview links the page and does not say it again. A later preview links an
earlier one. A parked item is stated only in the page's `Deferred`. Before you write a table, a tree
or a list, check whether the page or another preview already holds it; if one does, link it. Two
copies of one fact drift apart, and the developer then reads both to learn which one is current.

**A preview is written once and frozen at the go, and one decision gets one section of it — MUST** (`RD.DEVEX.WORKSPACE.224`, `RD.DEVEX.WORKSPACE.254`). A
preview the developer asked for, or one you wrote, stays a file, decided or not. Never fold it fully
into the page and remove it. Once the developer has said go, it is the record of what they decided:
never rewrite it as rows move, land or are added. Show one decision in one section of the arc's
preview, and never in two sections that each show it in another form.

**A preview shows, and an approach page argues — MUST** (`RD.DEVEX.WORKSPACE.233`). A preview's sections
are *Overview*, *Today*, *Proposed* and *Where it lands*, and an *Open* only for the questions it raises:
the generated `open` block, the approach page's cards rendered from the same records by `workstream
question show`, with a line back to the approach page (`RD.DEVEX.WORKSPACE.253`). *Overview* names the
decision first, what to look at first and what is not final. *Today* shows the thing as it is, and
*Proposed* shows it as it will be, with its options side by side where a decision is still open. *Where
it lands* shows the files that change as one folder tree for each repository, with a link to the approach
page's own `How`. A preview carries no `Why`, `What` or `How` and does not retell how the workstream reached
this point, because the approach page holds that. A question is asked on the approach page, in `Open`,
and its card links the preview that shows the options. **A preview never frames a sample file**: it shows
a thing with the page's own blocks, such as a table, a tree, a figure or a code block, and where the
thing is a real file it links that file in the arc's `samples/` folder.

**A preview's masthead names its arc and shows one status, labelled *Status*, and it is the arc's — MUST**
(`RD.DEVEX.WORKSPACE.266`). It reads Type · Arc · Shown · Status, and the *Arc* fact is a badge `N<nnn>`
right after the type, linking the arc's row on the approach page. The status reads `PROPOSED` while the design is not decided, and once decided the
arc's own status, as the one owner works it out (`DECIDED`, `RUNNING`, `LANDED` …), since every status after `PROPOSED`
implies the design was decided. The badge links `../../approach.html#N<nnn>` with no underline (shared
files `1.8.0`), is read from `state.json`
and is written by every `workstream` write and `docs cycles write`: never type it. Plugin migration 003
writes it into the previews of every open and backlog workstream.

**A sample is the work's own file, never a page built with the page template — MUST**
(`RD.DEVEX.WORKSPACE.267`). It keeps the format the work produces, and does not link the shared stylesheet
and open with a masthead. Many samples are browsed through `samples/index.html`, which opens each one as it
is. `workstream state check` names a sample built with the page template; a sample of a book page the work
produces passes, its masthead's `Type` naming the page kind, such as `Approach`, or its name the book
template it is a review copy of, such as `blocks-template.html`.

**Draw *Where it lands* as one folder tree for each repository — MUST** (`RD.DEVEX.WORKSPACE.238`). A
reviewer understands a change by browsing folders, and a path in a table cell has to be put together in
the head. So never write the section as a table of file paths. Group it by repository, in the order the
work runs. For each repository write one line that names it and says what happens there, and then one
`TREE` block:

- one folder or file on each line, and never two columns of entries
- a note in one column on the right: `new` or `changed`, then what the change is
- a folder with no note only holds what is under it
- a deep path drawn as folders on their own lines, so the note column stays near the names
- in a preview that is still proposed, the folders and the files that are certain, with a sentence that
  says which ones are not known yet

The section is a mix of blocks whose first job is to show the changes. Always draw the tree. After a
repository's tree, add the blocks that show its changes: a diff of one file, code, JSON or a figure. A
table never lists the changes. You decide which changes need a block. Add a block only where the note
beside the entry is not enough to judge the change. Code in such a block is plain with its language tag
and follows its stack's references, as the next two rules say.

**Code shown on a page follows its stack's own standards — MUST** (`RD.DEVEX.WORKSPACE.235`). A code
block in a preview or on an approach page is read as code and copied as code. So it follows the naming
and code chapters of the stack it belongs to, exactly as a file in that stack's repository does. Before
you write such a block, load that stack's naming and code references and write the block to them: for
TypeScript, `refs/support/apps/providers/ts/02-naming.md` and `05-code.md` in the `spn-apps` plugin. A
page in a workstream belongs to no stack, so nothing else brings those references into your session.
Each stage keeps its own words in a sample too: a support interface names no platform word, such as an
organization.

**Write a code block plain, and tag it with its language — MUST** (`RD.DEVEX.WORKSPACE.237`). On a
page you write by hand, a code block is `<pre data-lang="ts">` with the code inside it and nothing else:
no `<span>`, and no colour class. Write `&lt;` for `<` and `&amp;` for `&`, as in any HTML text. The
shared script that every page loads colours the block when the page opens, so you run no step to colour
it. The script knows `ts`, `json`, `yaml`, `sql`, `sh`, `diff` and `md`. A block with no language, such
as a tree or a command's output, is `<pre>` with no tag, and it is never coloured.
`spn-devex docs figure colour <page…>` names a block whose file still carries colour spans. The
script colours code from version `1.4.0` of the shared files, so a page that links an earlier version
shows its code plain.

**A preview holds what the developer judges, and nothing you need — MUST** (`RD.DEVEX.WORKSPACE.210`).
It is written for the person who says yes or no. Show the proposal in its final form, the few rules it
rests on, and the choices asked. Every decision that sets a shape has its part there, or on the approach
page, before any code is written. What you measured, the commit you read, the order of the work and the
plan stay in the arc. The approach page follows the same rule: the section *The approach page stays
current* below states it.

How much a preview shows follows the decision, and not the work it took to reach it.

| The change | The preview shows |
| --- | --- |
| a folder or a set of files is restructured | the final tree, with a comment on each line |
| a new page, message or report | a sample of it |
| a rule changes | the sentence before and after |

Before you write a section, ask whether the developer needs it to answer. A section that only shows
how thorough you were goes into the arc's log.

**A preview outside any workstream uses the same template — MUST** (`RD.DEVEX.WORKSPACE.209`). When
the developer asks for something no workstream owns and it must be shown as a page, copy
`approach-preview-template.html`, name the page `<subject>-preview.html`, and write it into the
session's scratch folder. Leave out the link back to an approach page; the status badge links nothing and reads `PROPOSED` until the developer answers and `DECIDED` after. Hand it over
as its full path. Publish it only when the developer asks, and then give them the link. When a
workstream opens for the work, move the page to its first arc's `notes/N<nnn>/preview.html`.
A sample the page links is a file beside it: publish or move it with the page.

**A plan is optional: an arc keeps `plan.md` only when it has traps, a set or a move table to hold, and it
is written at the go, never while the arc is `PROPOSED` — MUST** (`RD.DEVEX.WORKSPACE.227`). The rows are the
steps, so no row writes a plan. Each fact is pinned in `facts.jsonl` as you read it, so nothing is read a
second time just before the arc runs; it is checked. `git log <commit>..HEAD -- <path>` lists what moved
since the pin, and you re-read only what it names, before each order. The preview is written for the
developer, to approve; a plan, where there is one, is written for you, and it holds nothing the preview or
the rows already say.

**A preview costs nothing to throw away.** Code written first makes the decision feel already taken,
and it turns a question into a fait accompli.

**A major release is agreed while the arc is planned — MUST** (`RD.DEVEX.WORKSPACE.069`). A minor or patch bump is released without asking. A major one is a card answered with the arc's other cards, and the answer is the arc's go, the developer's words in it naming the version (`arc edit <ws>/<arc> --status DECIDED --note "<their words, naming the version>"`), so execution reads the record instead of stopping to ask. `release-go` reads that go as the check of a repository write reads one (§ A go is written down, below), in every open workstream, and the words of the line that moved the arc out of `PROPOSED` must name the version. It refuses a major release no such arc names.

## A go is written down, or it did not happen

A go is the write that stores `DECIDED` on an arc, and it carries the developer's words
(`RD.DEVEX.WORKSPACE.278`):

```sh
spn-devex workstream arc edit N004 --status DECIDED --note "the developer, 24 Oct: 'good to go'"
```

It appends the status line `PROPOSED → DECIDED · the developer, 24 Oct: 'good to go'` to the arc's
`log.jsonl`, and the arc's `state.json` reads `DECIDED`.

**Nothing else counts, because nothing else survives.** A go held in the conversation ends with the
window, and the next session opens on a page it cannot tell from a proposal. **The log gets one note per
milestone, not one per step** (`RD.DEVEX.WORKSPACE.275`): a row that lands or is blocked, an arc that
changes status, a decision of the developer's, and a handover. So the first write into a repository in
a window is checked. An arc holds a go when it stores `DECIDED`, or the close's `LANDED`, and its log holds
the status line that moved it out of `PROPOSED`, with words beside the move. An arc opened straight at
`DECIDED` holds it in its opening line, which carries the developer's words, as the review-fixes arc
does (`RD.DEVEX.WORKSPACE.261`). A move back to `PROPOSED` needs a go again. A `PROPOSED` arc
holds none, and neither does an arc that reached its status with no such line, because a plan you wrote is not
the developer's agreement. The check reads the window's workstreams (`RD.DEVEX.WORKSPACE.236`), or every
open one when the window works on none; where no arc of them holds a go, it warns once in the window,
and its note names the command above. Writing the plan never warns, because that is how a session earns
the go.

## How you work, at every step

**You build in previewable increments, and the increment is small.** A section, a block, a table:
you show it, you wait, you write it, you show the next one. This keeps the cost of being wrong at
one block instead of one document. **The larger the thing you are about to produce, the smaller the
first piece you show.** A finished document presented for approval is a document nobody can cheaply
disagree with, so it gets approved and then quietly resented.

**You do the work that does not depend on the open question.** An unanswered question rarely blocks
everything. Finish what it does not touch, hold the rows it can change, and bring back a
decision, rather than stopping with nothing delivered and a question attached.

**The plugin set may not be all ours** (`RD.DEVEX.AGENT.033`). A partner publishes a plugin of its
own, and it activates by declaration exactly as the platform's plugins do. So read the set you are
given rather than assuming the `spn-*` plugins are its only members. A partner plugin carries skills
and hooks, never a lens: that set is closed, and a new lens arrives as a register row. One rule
decides precedence when both are present: a partner plugin may add a gate, and never removes or
weakens one the platform ships.

**Context is your budget, and you spend it on judgment** (`RD.DEVEX.AGENT.032`). Every request
carries your whole context again, so the same context paid for twice is waste rather than work.
Three habits follow. **One context, many decisions**: where decisions share a context, carry them in
one exchange rather than one each. **Read what you need, not what sits near it**: the window is shared
between what you load and what you reason with, so a wasteful read makes the answer worse and not
only dearer. **Put the work into the generator**: where a template produces the artifact, land the
work in the template once rather than in each artifact forever. A template reproduces its shape
every time, while each generated artifact is a fresh sample that drifts.

**Quality is never the variable.** The saving comes from removing waste, never from doing less or
doing it less carefully. A cheaper answer that is worse breaks the rule rather than keeping it. So
you never trade away the reading that catches a warmed record, a module's own word for its reader, or
a gate that has quietly stopped measuring.

**A rewrite is lossless unless you say otherwise.** When you are asked to shorten, clarify or
restructure, every fact that went in comes out; only the wording changes. Facts vanish during
rewrites because a sentence carrying three ideas is replaced by one carrying two, and nobody notices
the third is gone. Before you finish, check the old version for anything the new one no longer says,
and either restore it or name it.

**You do not tidy what you have not understood.** An example that looks inconsistent, a name that
breaks the pattern, a case that seems redundant: each is more often carrying a point you have not
found than it is a mistake. Ask what it is doing before you tidy it. Tidying deletes meaning with
more confidence than anything else, because it never feels like a change.

**You measure claims rather than estimating them.** *"All the documents are consistent"* is a guess
if you read six of them. Write the check, run it over everything, and report the number it produced.
When the measurement contradicts what you expected, the measurement is the finding, and you report
it as one rather than moving on to whatever did work.

**You name things in the vocabulary that is already there.** Before coining a term, look for the one
the repository already uses. Before writing a title, use the words the thing it describes uses. A new
coinage is a second name for a concept that had one, and every reader now has to learn both.

## The approach page stays current, and part of it is produced

**A workstream's page is named `approach.html`** (`RD.DEVEX.WORKSPACE.204`). The folder carries the
number and the subject, so the file name repeats neither. A workstream that closed under the name
`<subject>-approach.html` keeps it.

**The parts of the page that the arcs and the records decide are produced, never typed — MUST.** They
are the header's status, the places of `How` with their `Arcs:` lines, and the Cycles table, which
`spn-devex docs cycles write <workstream>` writes from the arcs' data; the progress block under the table, which `workstream progress write` writes
and every other `workstream` write refreshes (`RD.DEVEX.WORKSPACE.250`); and `Open` with its heading,
which the `workstream question` commands write from `questions.jsonl`. The table has two columns: Arc,
an item cell with the title, the line and one line of Key: value facts (the preview first, then each sample, by
kind, linked, with no state; a CARRIED or DROPPED reason, or a decided arc's wait, as a fact), and Status, the word as its
badge. Each row carries the arc's number as its id, `id="N<nnn>"`, then `data-arc="arcs/N<nnn>/state.json"`
and the arc's stamp. **`How`'s places come from the rows' `repo`**: each repository the rows name has
its `h3`, which the command adds where `How` has none, and a facts line `Arcs:` naming the arcs whose
rows reach it. The one line under the heading, what changes there and what ships, is yours.

**Every arc has an address on the approach page, `approach.html#N<nnn>`, and every link to an arc points
there — MUST** (`RD.DEVEX.WORKSPACE.263`). The developer: *"no, this is approach.html, let's keep it like
that, such that changing the arc number in the browser quickly opens"*. A preview's masthead links
`../../approach.html#N013`; a plan links the same; an order `../../../approach.html#N013`; a report, a
handover and a command's output name the address. Never link `arcs/N<nnn>/state.json`: it is data for the
commands. Where `What` gives one arc a part of its own, that part's heading carries `id="N<nnn>-what"`.
`docs cycles write` writes the ids, and `state check` names a row without one. The header's status
reads `PLANNING` while no arc is past `DECIDED`, `IMPLEMENTING` once an arc runs or has landed, and
`DONE` when the workstream closes. The heading of `Open` reads `Open — Q<n> · Q<n>`, each open card by
its number. With no card open it reads `Open — no card is open`. The PreToolUse hook refuses an edit
inside the `progress` or `open` block.

**The progress block shows what is built — MUST** (`RD.DEVEX.WORKSPACE.278`). Only build steps are
recorded, so a chip counts its arc's steps, and an arc with no step yet shows its status word, with no bar
to fill. *Overall*'s bar counts steps, and its word is the workstream's own, the one the page's header
shows, so the two never disagree: `PLANNING` until the first step of any arc starts, then `IMPLEMENTING`,
which says *waiting for your review* once every arc has landed, and `DONE` on the word to close. The done
colour appears only when the arc's steps work out `LANDED`.

**The rest of the page is yours to bring current in the same step — MUST** (`RD.DEVEX.WORKSPACE.251`). A
new arc, or an arc whose goal, title or repositories changed, owes the page its `Why`, its `What` and
its `How`, and a Subtitle and a Description that still cover what the page plans. The stamp holds it:
each *Cycles* row carries `data-arc-stamp`, a hash of its arc's goal, its title and its repositories
(its `repos` and each row's `repo`), never of its rows; `workstream state check` fails a stamp behind
them, and the Stop hook refuses to end a turn on it. **Adding a row never puts the page behind.**
Once the page is current, `workstream arc stamp write <arc>` writes the new stamp, and it is the
stamp's only writer. A `What` or `How` subsection that has a preview ends in a *Read the
preview →* line. The subsection says the decision in two or three sentences, and the preview holds
the detail. The page never states a preview's tables, trees or lists a second time, and one section
of the page never repeats another (`RD.DEVEX.WORKSPACE.223`).

**A write that changes an arc's status, or a row's state, refreshes every view of it in the same command —
MUST** (`RD.DEVEX.WORKSPACE.273`). The views are the approach page's status card, its Cycles table and
headings, and the arc preview's Status badge. `workstream arc edit` and the `row` commands (and `report write`) rewrite them across
all the workstream's arcs when `status` or a row's `state` moved, and says each view in its line:
`ok · N015 · status · approach: card, cycles · preview badge`. A `question` write does the same when an answer
moves a status. Never run `docs cycles write` by hand to catch up after a status write. The go's write lists
each line of `notes/N<nnn>/preview.html` whose text says *proposed*, in any case, outside the masthead's status
badge: bring each one current, with the preview's `Open`, in the same turn. Nothing checks those lines, because
which of them is still a proposal is yours to read. A view that disagrees
with the arc's data is a finding of `workstream state check`, naming the arc, the view and the command that
fixes it. What a status leaves in prose, an arc's `What` or its Log line, stays yours.

**The page is written for the developer who decides — MUST** (`RD.DEVEX.WORKSPACE.225`). It holds
what they need to decide, in plain words: the problem, the decision, the options weighed and what
each costs. Keep your own material in the arc and its notes: how you checked a fact, what you first
proposed in chat, the names of your scripts and note files, and full lists of files or names. A
finding says what was found, and a link to the note serves a reader who wants the evidence. You read
the arc, so nothing is lost by keeping it there.

**Every page walks up one step, by the back link at the top of its rail — MUST** (`RD.DEVEX.WORKSPACE.232`).
A preview goes back to its approach page, at the subsection it serves. An approach page is the top of its
workstream's chain, so it has no back link. In its back link and its previous and next doors, a page opens a
page; a link inside the content, *Where to go next* included, may open a markdown file, a sample or a preview.

**The page links one version of the shared stylesheet and script as its base, and holds no copy of
them — MUST** (`RD.DEVEX.WORKSPACE.214`). An approach page and a preview keep the two lines their template
has. One links `sds-docs.css` by the version's address, and the other loads `sds-docs.js` from the
same version. A page that holds a copy of its styles keeps the faults of the day it was written, and
a shared file is fixed once for every page. Use the shared classes first. Where the page has a case
they do not cover, reach for a utility of the standard set, such as `flex` or `text-faint`. Where no
utility fits either, add one `<style>` block of its own after the stylesheet's line; a class it
defines itself takes no `sds-` prefix, and never a utility's name.

**Every class on the page opens with `sds-`** (`RD.DEVEX.WORKSPACE.216`). An open card is a
`div.sds-open` wrapping an `h4` whose `id` is `q<n>`, and its parts are `sds-key` and
`sds-recommended`. A decided card is a `div.sds-card`. The Subtitle is `p.sds-subtitle`, and the
Description is `p.sds-standfirst`. A page that has not moved to the shared stylesheet still holds the
earlier names, with no prefix. The checks read the shared names only, so such a page is moved first.

**You commit the workstream's folder, by path, and you never push it — MUST**
(`RD.DEVEX.WORKSPACE.213`). The commit goes into the git repository that holds `.spndevex`. Commit the
folder at three moments: when an arc lands, when a card is answered, and before a script edits the
approach page. Name the folder in the commit, so it holds that workstream and nothing another window
has written. A page that is not in git exists in one place, and a script that empties it leaves no
copy. This is the coordinator's commit: an agent carrying out an order still commits nothing.

**An arc is named by its number, `N<nnn>`** (`RD.DEVEX.WORKSPACE.203`): three digits, as a workstream's
number has. Its subject, its title (the full phrase that names the cycle) and its goal are fields of its
data. One number names its two folders, `arcs/N<nnn>/` and `notes/N<nnn>/`.

**An arc's subject is one to three words, at most 24 characters, in kebab-case — MUST**
(`RD.DEVEX.WORKSPACE.265`). A noun phrase a reader recognises, such as `layout-model` or `web-stack`,
never a sentence. `arc edit --subject` refuses a longer one and `state check` names one. A long subject
in another workspace is a finding for that workstream's own window, never renamed by guessing.

**Each arc's data folder holds one name file, `arcs/N<nnn>/<subject>.md`, leading with the arc's goal —
MUST** (`RD.DEVEX.WORKSPACE.264`). `goal` is one or two sentences of the outcome once the arc is done, in a
reader's words; set it with `arc edit <arc> --goal "…"`, and `state check` names an arc without one. The
file holds, in order, the title, the goal, the status with its reason, what the arc decides, its repos, and
links to `../../approach.html#N<nnn>`, the preview, the plan and the samples; no rows, no log. `arc edit`,
`report write` and `docs cycles write` write it, and rename it with the subject. Never write it by hand:
the hook refuses it, and `state check` names a hand edit and a second `.md` in the folder.

**A close is a milestone, and you say so before you ask — MUST** (`RD.DEVEX.WORKSPACE.206`). Open with
a titled line that names the workstream as shipped, led by a rocket or a plane rather than a party
icon. Under it, *What was delivered*, *What was learned* and *Thank you* each get their own heading
with their own icon — the first two lead with their icon, *Thank you* trails with 👍 — and each holds
one bullet per distinct thing, or a single line where there is only one thing to say. Measure every
number from the arcs and the close report. Separate the heading and every section with a `&nbsp;`
line, as the welcome does, and never put them in a quote block. Then ask. Before the folder moves, the
page gets its closed masthead and a closing block in the same shape.

## Nothing is published unless the developer asks

**You publish no page unless the developer asks for it — MUST** (`RD.DEVEX.WORKSPACE.117`). That
holds for an approach page, a preview or a sample the developer is reviewing, and a report. A page stays where it
was written, and you hand it over as the **full path** to the file, which the developer opens in a
browser.

| The page is | It lives in | Handed over as |
| --- | --- | --- |
| an approach page, or a proposed preview or sample | the workstream's folder under `.spndevex/workstreams/`, in no repository | its full path |
| a report, or any other page in a repository | the repository's pocket, committed | its full path |

**Publishing is the developer's call, because a published copy is one more thing somebody has to
manage.** Every page sent to the publishing host stays there after the work moves on, and pages
nobody asked for pile up where nobody tidies them. The file on disk is already the page: it opens in a
browser from the filesystem, with no host of its own. It needs the network once, for the shared
styles. **A tool's own default to publish without being asked does not apply here**; this rule
overrides it.

**On this rule, the check on a publish reminds and never refuses**, because it cannot know whether
the developer asked. It states this rule and lets the call go ahead. The same check refuses one
thing, which it can read from the file: a page that links its stylesheet from outside. When the
developer does ask:

- **Publish the bundled copy, never the stored page — MUST** (`RD.DEVEX.WORKSPACE.215`). The
  publishing host does not load the shared stylesheet, so a page that links it arrives with no
  styling. `docs sds bundle <page>` writes `<page>.bundled.html` beside the page, with the styles of
  the page's own version inside it. You publish that copy, and the stored page keeps its two lines.
  Send the bundled copy as well to a reader who has no network.

- **The file is the source, always.** A published page is a rendering. Where the two disagree the
  file wins, and you never read the page back to learn what it says.
- **Say what a published repository page costs.** A page in a repository is already shared by the git
  host, and in a published copy its relative links resolve to nothing.
- **Retire the published copy when the page settles** and moves into a repository. Two copies
  answering differently is the drift the artifacts chapter exists to prevent.
- **Never publish a credential, real personal data, or a private repository name.**
- **Publishing produces a URL, so hand that URL back in the same message, with the full path beside
  it.** Republish the same file to keep the URL stable, and give it again whenever the page changes.

## How a reply closes, every time

**A reply ends in one of three shapes**, chosen by one test: *what does the developer have to do
next?*

| If they must… | Close with |
| --- | --- |
| **decide something** before work continues | **decision cards**, one per open item |
| **know what is still coming** | **a checklist**, one line per item |
| **do nothing**: the work is done and nothing is open | **a plain confirmation.** Say what changed and stop |

**The third shape is the one people skip.** When the work is finished and nothing needs an answer,
do not invent a question to seem thorough, and do not append next steps that are only things you
could imagine doing. A made-up question costs the reader real attention and teaches them to skim the
ones that matter. Two or three sentences and a full stop is a complete reply.

**Never mix the shapes in one paragraph.** A question buried inside a status update is a question
nobody answers.

**When you need an answer, every open item is a decision card.** The shape is defined once, in
[`refs/devex/workspace/docs/decision-cards.md`](docs/decision-cards.md): number and summary, why it
matters, what, the views that spoke, a lettered options table, a recommendation with its reasoning,
and a preview where the decision is a shape, in that order. Follow it whenever a person owes a decision, and in full whenever one asks
to see the open questions or the open cards. A sentence beginning *"two things I did not act on"* is
the exact failure it prevents.

**When you do not, close with a checklist.** Work that is agreed and merely unfinished closes as one
line per item, each naming a thing that will be done and where, in the order you will do them, with
anything already complete marked complete. A reader can then tell what is left, what is next, and
whether anything has stalled.

**Decisions first, then the checklist**, when both exist. The reader answers what blocks you, then
sees what proceeds regardless.

## What each state is held to

Nothing above is enforced by good intentions. Every transition that can be checked is:

| Held | By |
| --- | --- |
| a page keeps its shape and its voice, and its `How` ends in a Cycles table that matches the arcs | `doc-check.ts`, on every write |
| the outline folds | `doc-check.ts` |
| an answered card does not sit in `Open` | `split-plan.ts`, on every write |
| every row accounted for, and the page stamped, before a close — a row still waiting, ready, running or stopped refuses | `split-plan.ts --gate close` |
| a file a script owns, a `progress` or `open` block, and an arc's stamp written only by its command | `workstream-owner.ts`, on every write |
| a card on a page that is its record rendered, and never typed | `questions.ts`, on every write to a page |
| each open and backlog workstream whole: its data, one preview per arc, each arc's `What` entry linking its own preview and no other, each arc's row in Cycles and its stamp current with its goal, title and repositories, an approach page to stand on, a stored `LANDED` arc with every step landed, every card equal to its record, the report of each landed row with an order | `workstream state check`; the Stop hook refuses a turn while it fails for this window's workstream |
| a step started before the go or against a wait, a stored status moved without the developer's words, `RUNNING` written, and a step added to an arc that reads `LANDED` | `workstream arc edit`, `row add` and `row state` refuses it; `workstream state check` names a step running on an arc not `DECIDED` or holding a wait |
| an arc ever decided deleted, or one never decided dropped | `workstream arc delete` and `arc edit`, which name the other |
| a close while an arc is `PROPOSED` or `DECIDED` | `split-plan.ts --gate close` |
| a running row of an arc the window wrote named with the age of its log line, never called runnable | `stop.ts`, when a turn ends |
| a row waiting on a card open in `questions.jsonl` never called runnable | `stop.ts`, when a turn ends |
| a card raised in full once, under **Needs you** at the top of its reply, and named in one line in a reply that ends the work or stops it | `stop.ts`, when a turn ends |
| an answered card shown on a preview (its `shownIn`) whose arc's notes did not move is named once, as a note and not a refusal, and a proposed arc carries no review point to a later row of itself | `stop.ts`, when a turn ends |
| a page published without being asked is met by a reminder, never a refusal | `pretooluse.ts`, on a publish |
| a page that links its stylesheet from outside is refused on a publish, and the refusal names `docs sds bundle` | `pretooluse.ts`, on a publish |
| a reply that passes work on carries a handover block with all nine labels and no `{{…}}` left, once while the step rows have not moved, and names each open card | `stop.ts`, when a turn ends |
| while a row is in progress, only a finding about the reply sends the agent back, and the rest is found again when it waits | `stop.ts`, when a turn ends |
| the short rules are in the agent's context from the first turn | `orientation.ts`, at session start |
| what landed, said out loud | `closed.ts`, after the folder moves |
| what the agent's own machinery costs | `timing.ts`, on every hook run |
| a repository write while no arc of the window's workstreams reads `DECIDED`, `RUNNING` or `LANDED` with the developer's words where it left `PROPOSED`, in a status line or in the opening line of an arc opened at `DECIDED` | `confirmed.ts`, on the first such write in a window |
