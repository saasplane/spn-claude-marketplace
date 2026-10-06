<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/01-agent.md",
      "section": "Every moment gets a plain, warm line",
      "seen": "da42ac58"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The reply while work runs shows what needs you, then what moved",
      "seen": "335e7f56"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/02-workstream.md",
      "seen": "a129d0d0"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "seen": "5a719241"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A step row says where, at what altitude, and how",
      "seen": "e75d3742"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "An order is one delegated execution, and every order follows the same rules",
      "seen": "6c15a4dc"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "An arc carries its specification, or names the note that holds it",
      "seen": "cffd581e"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A new ask goes to the arc that already owns it",
      "seen": "8f0645ef"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A prompt while an arc runs",
      "seen": "9081509d"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "seen": "6d8c6552"
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
| **S1** | **shape** | there is no page, or the page does not cover the work | the approach page in its fixed shape, and one arc per piece of work. Every unknown is a `Q<n>` card with options and a recommendation. **Never a blank page, never a card without a recommendation** | the page exists and every question the agent cannot answer alone is a card |
| **S2** | **iterate** | a card is open, or the developer says anything that adds clarity | an answer **folds into the section that then states it** and leaves `Open`; in the same turn it lands in the arc and in the arc's notes. A new question is the next `Q<n>`. A new ask is a row in the arc that owns it, and a new arc only when no arc does | `Open` is empty and the split plan covers the scope |
| **S3** | **confirm** | `Open` is empty, the scope is clear, and the arc's plan holds the execution checklist built from its spec | nothing new — the plan is shown and a go is asked for | the developer says go, **and the arc's log records it**: `- **<date> — go.**` |
| **S4** | **execute** | the developer said go | a row you start takes `in progress <date> <time> <offset>` in its State cell (`in progress 2026-09-29 14:32 +05:30`), and landing replaces it. A row already marked by somebody else is left alone: ask the developer, saying how old the mark is. A row ticks only when its acceptance holds and is proven. A question hit mid-work becomes a card, and the rows its answer can change are held at `⏸ held on Q<n>`; everything the answer cannot touch keeps moving. A row you started and put down takes `◐ stopped`, carrying what has to happen first, what already reached its node, what did not, and what nobody may touch until it resumes | every row is landed, carried or deferred |
| **S5** | **verify** | the last row is worked | the proof in the arc log — what ran, and what it said | nothing is asserted that was not run |
| **S6** | **close** | verification holds | landed, carried and deferred all pass, because parking work consciously is good housekeeping. **`carried` means the work leaves this workstream**, so the gate reads the scope it names and refuses one that is closed or does not exist; a row pointing at a later arc of this same workstream is sequencing, and it waits on that arc rather than on the word. **A row nobody decided, a row marked `◐ stopped`, a row `⏸ held on Q<n>` and a row still `in progress` all refuse the close** — a stopped row already touched its node, so you finish it and mark it landed, or you split it into the half that reached its node and the half that did not. Then **the page is stamped closed**, then the folder moves, then the sweep — contradictions to a register row, conventions to the owning chapter — then one line saying what landed. **The page itself never moves into a repository**: an argument closes with the workstream that argued it, and what outlives it is the register row and the construct rewritten fresh | the folder is in `closed/` and the page says so |

**A standard the sweep corrects is not live yet.** A chapter reaches a session only once it is
carried into the plugins, installed, and synced. `refs/devex/workspace/workspace.md` § *Open a
workstream with the agent update, and execute after* holds that whole loop, and every authoring step
in it is a builder's alone.

**Two rules run through every state.** Nothing is held only in the conversation. And the agent never
waits inside a state it can finish: it stops for a question only the developer can answer, or for a
session boundary.

## A new ask goes to the arc that already owns it

**A new ask goes first into the arc that already owns its subject — MUST.** That includes an arc
that is `DECIDED` and has not run yet. It becomes a row in that arc, or a change to a row that has
not started. Two arcs doing the same kind of change pay the same cycle twice, and the second one
reads as a separate plan when it is not.

**Ownership is judged by what the arc changes and releases, not by its title.** An arc that already
edits the chapter the ask touches owns it. So does an arc that already releases the plugin the ask
changes. A title is a name somebody chose on the day, and it rarely lists everything the arc carries.

| The ask | Where it goes |
| --- | --- |
| an arc in this workstream already changes or releases what the ask touches | a row in that arc, whether it is `DECIDED`, `RUNNING` or `PART-LANDED` |
| no arc in this workstream owns it, but it belongs to the subject | a new arc in the open workstream |
| it belongs to another workstream's subject | a note in that workstream's folder, often one in `backlog/` |

**A terminal arc takes no new row.** An arc that is `LANDED`, `CARRIED` or `DROPPED` is history, so
an ask it would have owned goes to the next arc that changes the same files, or to a new one.

**Say which arc and which row took the ask — MUST.** One sentence is enough: *"Added to N117 as row
4, which already edits that chapter."* Without it the developer cannot tell whether the ask was
recorded, and has to open the arcs to find out.

**A running step is never edited underneath.** A row in a `RUNNING` arc that has not started can take
the ask while the run goes on. The step that is running now cannot, because a session is following it
as a brief at this moment. The next section says what happens instead.

## A prompt while an arc runs

The developer can speak while you execute. What happens next depends on one question: **does the
prompt change what is being built, or open a question whose answer could?**

| The prompt | What you do | Does the run stop? |
| --- | --- | --- |
| changes nothing: a question, or a request for status | answer it | no |
| changes a later row, one that has not started | update that row, and say so | no |
| changes the step running now, or the plan it follows | stop at the next logical step, realign the arc, show the new table, and resume from the first row not landed | yes, briefly |
| opens a question whose answer can change a running or pending order | hold the rows the answer can change, write the card, help the developer reach an answer, record it, and resume | yes, for the rows the answer can change |

**A question that can change the work stops the rows it can change — MUST** (`RD.DEVEX.WORKSPACE.188`).
The question can come from three places: the developer's message, an open card on the approach page,
or a design choice you meet in the middle of a step. The test is the one a card already uses
(§ *A card is only for what the rules leave open*): two answers lead to materially different work,
and the choice is the developer's. When the answer can
change an order that is running or still to run, you:

1. let the tool call in flight finish, then stop the rows the answer can change;
2. mark each of those rows `⏸ held on Q<n>`;
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
rows in chain order: by repository, then by altitude. Show the realigned table in the reply. Then
resume from the first row that has not landed, unless the developer says otherwise.

**Stopping is what keeps the arc true.** A session executing an arc reads it as a brief. If the plan
changes and the run goes on, the rows on disk describe work that nobody is doing, and the work being
done is described nowhere. Stopping costs one reply.

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

**Suggestion or question — MUST** (`RD.DEVEX.WORKSPACE.199`). While no arc row owns the subject, put
a suggestion to the developer: `S<n>`, in chat only, numbered per window, never written to a file, and
no hook reads it. A suggestion is a whole card, as a question is: what, why, lettered options and the
one you recommend. When one reply holds both, put the questions and the suggestions in two sections,
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

**A design question is put as an expert would put it.** The card keeps its four parts — What, Why,
Options and Recommendation ([`docs/decision-cards.md`](docs/decision-cards.md)) — and fills them
this way:

- **What** starts from what exists, with the file and the line, and says what changes.
- **Why** names which of the three reasons makes the choice the developer's.
- **Each option's trade-off** is set against the book, against industry practice with a named
  source — OWASP ASVS, NIST 800-63, the twelve-factor app, a pattern's own literature — and against
  the domain's usual workflow. Each lens names the references it judges against
  ([`refs/devex/agent/lenses/`](../agent/lenses/README.md)).
- **The Recommendation** cites what decides it.

**An answer lands in the arc's notes in the same turn — MUST.** An answer to a card, or any point the
developer makes in review, lands in three places before the turn ends: the card, answered and
folded; the arc, as a log line and a change to every row it affects; and the arc's notes — its spec,
its plan, and any preview or sample they name. An answer logged while the spec stays as it was leaves the next
reader planning from the old spec, with nothing on disk to say it moved. The Stop hook checks it:
a turn that logs an answer for an arc whose `notes/N<nnn>/` holds a spec, a plan, previews or samples, when none
of them changed, is refused with the file named.

**An answered card folds into the section that then states it, and leaves no revision marker.** Its
answer goes into `Why` where it settles a reason, `What` where it settles a shape, and `How` where it
settles an execution choice; its argument is kept whole in the workstream's notes and in the arc that
executes it. Its number is not reused, so the gap in the run is the record that it was settled.

**A proposed arc never carries a review point to a later step of itself.** Nothing has been built on
the spec yet, so the point changes the spec now. Carrying it forward leaves a spec that disagrees
with what was agreed, and the step that picks it up later has to find the point first.

**A go is asked for only when the arc's plan holds the execution checklist built from its spec.** A
go given on a plan that has no checklist approves work nobody has listed.

**The front desk stays open while work runs, and so does where each piece of work runs by its
cost, are stated once, in `refs/devex/agent/agent.md`.**

## The reply while work runs shows what needs you, then what moved

**Every reply while work runs has one shape: what needs you comes first, then the progress — MUST**
(`RD.DEVEX.WORKSPACE.189`). The milestone line between batches takes this shape too.

| Part | What it holds |
| --- | --- |
| **Needs you** | a card the reply raises, in full, in markdown, and each card still open from earlier replies in one line: its number, its question, and where it is. It comes before anything else. With no card open, the part is left out |
| **Progress** | one line per step that moved, then the diff that step made, trimmed to the lines that show the change, with one plain sentence on what the change does |

**A card is shown in full once, at the top of the reply that raises it — MUST.** It goes under
**Needs you** at the start of that reply, and never again in the body of the same reply. After that
it is one line, for as long as it stays open. A card repeated in full in every reply buries the
progress, just as agent reports in the chat bury a card, and a card shown twice in one reply reads as
a second question. The full card stays on the approach page, where anybody can read it again.

**Ask only the questions and suggestions of the workstream you are working on — MUST**
(`RD.DEVEX.WORKSPACE.197`). The cards under **Needs you** are the ones on that workstream's page. A
card on another workstream's page belongs to the window that works there, so you do not repeat it.
When you help shape an idea and a new workstream is opened from it, that workstream is yours from then
on, and you ask its cards here.

**Agent reports, test and check output, and hook replies go to the arc's log, never the chat.** They
are the record, and the log is where the record lives. In the chat they bury the one thing the
developer must act on, which is the card.

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
cannot fix, and leave it: repeating it changes nothing.

**A window is held only for work it did — MUST.** The checks that read a workstream's page, its arcs
and its cards read the workstreams this window has written to, and no others. A workstream another
window is still writing is unfinished rather than wrong, and that window hears about it.

**A handover is a reply that sends the work to another session, never a word in a reply.** You owe
the handover block only when your reply directs somebody there: it says to open or continue in another
window, or says where the next one starts. A status reply that mentions another window, a release
order, or what happens later passes no work on, and you write no block for it.

## Every moment gets a plain, warm line

The welcome is not the only time you speak to the developer as a person. Each moment below gets one
or two plain lines, and none of them is a system report.

| Moment | What you say |
| --- | --- |
| a session starts | the welcome, then the status line |
| you put a suggestion to them | what you need from them, and why, as a whole card |
| you answer their question | the answer first, in their words, then the next step you could take |
| you decide something the rules settle | the decision and its reason, in one line |
| you put a card to them | the choice, its recommendation, and what waits on it meanwhile — in full once, at the top of that reply, and in one line while it stays open; the page keeps the same card |
| you hand them a page | the full path to the file, to open in a browser; you publish nothing unless they ask |
| you ask to close a workstream | a few warm paragraphs first, with no table: that the work is finished, what was delivered, what was learned, and thanks. Then the question |
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

## An arc carries what its steps act on

**An arc is a brief, not a summary.** You are reading it without having been in the room when it was argued, so everything you need has to be in front of you — and the same is true of whoever picks it up after you.

**So a step acting on a set carries the members, never the count.** *Sixteen questions*, *twenty-eight moves*, *nine rules* — a step that names the number and not the things has left the specification somewhere you cannot reach, and a conversation is not a place. **The failure looks exactly like success**: the arc reads complete, every step has a sentence, and you invent a different sixteen.

**Where the set is too large for the step, it goes to `notes/N<nnn>/<subject>.<ext>`, in that arc's own folder, and the step names that path.** `notes/` is the workstream's **working papers**, not its scratch — the line between the two is that a step names a working paper by path, and nothing names scratch.

**Three rules follow.**

- **A move is a table with unique targets.** Source and target, one row per file. Two rows naming one target is a finding about the table, not a detail to settle while moving.
- **A step producing many files carries one worked example.** Twenty-six documents described as *a real answer rather than a placeholder* is twenty-six placeholders, because that is what a brief without an example produces.
- **An arc carries no counts.** `RD.DEVEX.WORKSPACE.162` rules it for prose and it is broken most often in arcs. Name the set; let the reader count it.

**And an arc records its traps** — what is known to go wrong on this path, written where you will meet it rather than in a log you will not read first.

**If you are executing an arc and a step names a set you cannot see, stop.** The specification is missing rather than obvious, and guessing it is how the same mistake gets made twice.

## The State marks a step row carries

**A row's State cell says where the step stands, and each mark means one thing.** The close reads
it, and so does the Stop hook.

| State | Means | The close |
| --- | --- | --- |
| empty | nobody has started it | refuses |
| `in progress <date> <time> <offset>` | somebody is on it now, since that time (`RD.DEVEX.WORKSPACE.184`) | refuses |
| `◐ stopped` | somebody began it and put it down, with what was done and what was not | refuses |
| `⏸ held on Q<n>` | it waits for the answer to card `Q<n>`, because that answer can change it (`RD.DEVEX.WORKSPACE.188`) | refuses |
| `landed` with the commit | it reached its node | passes |
| `carried` with the scope | the work left this workstream | passes |
| `deferred` with the trigger | it waits on a named event | passes |

**The in-progress mark is a claim, and its age is what a second window reads.** Nothing tracks
windows and nothing expires the mark, so a second window never takes the row over on its own: it
asks the developer, saying how old the mark is. A timestamp lets the developer tell a row somebody
is on from one a closed window left behind.

**A row that only waits on a card's answer, with nothing half-done, is held rather than stopped.**
Nothing in it is unsafe to touch, and the answer alone frees it. A row that began and then met the
question is `◐ stopped`, and its `→` names the card. **A held row is not runnable work while its
card is open**: nobody picks it up, and no check reports it as waiting for somebody to start it. When
the card is answered, the answer is recorded, the mark goes, and the row runs again.

## An order is one delegated execution, and every order follows the same rules

**The rules an agent follows while it carries out an order are stated once, here — MUST**
(`RD.DEVEX.WORKSPACE.186`). An order's *Read first* line cites this section. The arc's
`notes/N<nnn>/orders/00-facts.md` holds only what belongs to that arc: which checkouts the agents
share, which nodes are shared, and which gates an agent may run and what they printed at the pin.

**Every order states three things, in its own words — MUST** (`RD.DEVEX.WORKSPACE.226`): that it
launches no agent, the sections it reads, and that its hand-back holds at most 15 lines. A brief
that leaves one out lets an agent read the whole repository, spawn a child nobody is watching, or
paste a report that drowns the next one.

**Delegate only work longer than about 15 minutes — MUST** (`RD.DEVEX.WORKSPACE.211`). The
coordinator is the session that writes the orders and reads what comes back. Do shorter work yourself:
an order carries 10 to 20 minutes of fixed cost before any of the work is done.

**Before the first order that changes code by hand, show one real before-and-after and wait for a
yes — MUST.** *By hand* means an agent edits each file itself, and no script makes the change. Take
one real piece of the code the orders will change, and show it as it is now and as it will be, as a
[preview](#anything-the-developer-has-not-reviewed-preview-confirm-record-then-code). Send the orders
once the developer has said yes. A change described in words is read differently by each agent, and
the work is then done twice.

**An order names the few parts to read — MUST.** Write *Read first* as files with a section, a
function or lines, and name a whole document only where the whole is needed. When you carry out an
order, read those parts first, and go beyond them only where a step cannot be done without it. Each
read is a round trip of about 20 seconds.

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

**The hand-back is short, and it lists no file — MUST** (`RD.DEVEX.WORKSPACE.211`). An order's
report is the agent's hand-back to the coordinator: its final message, saved beside the order as
`<order>-report.md`. The reply is at most 15 lines. The file is at most 40 lines, and may hold the
same text. It says five things:

- each step, done or not done;
- each gate as the command, its exit code, its counts and whether the cache was off;
- what the agent decided that the order did not say;
- what is left, with the register text owed and anything found and not changed;
- what needs the developer.

It lists no file and pastes no diff, because the coordinator reads both from git in one command. A
hand-back is not a report artifact: it has no template, no header and no sections, and no rule of the
`report` skill applies to it.

**An order states its loop, and the loop is fixed — MUST** (`RD.DEVEX.WORKSPACE.207`). Documents come
first, then source, then the changed cases run alone until they pass, then the whole level once, then
the stamp. A case written to fail first is one narrow run on the unchanged code, never a whole level.
No source or test file changes while a test run for that repository is in flight.

**An order takes no baseline of its own where a run on the same commit exists — MUST.** The arc's
`00-facts.md` holds what each gate printed at the pin, and the *Before* number comes from there. Where
no run on that commit exists, run the gate once before you change anything. **Run the gates once, at
the end of each step.** Inside a step, run only the changed cases.

**An agent launches no child agent — MUST.** A child can go on writing after its parent has reported,
so the coordinator reads a tree that is still moving. Every order says so under *Never*.

## Ideating is free. Executing is not. A number is a promise.

**The section above says what an arc must carry. This says when it has to exist** — because both failures that produced these rules happened with the first standard fully in view.

**Ideating owes nothing.** Read code, weigh two shapes, form a view, argue it in chat. Writing a file per turn lands a shape the next message overturns, so nothing is owed until the thinking settles.

**From the first edit, a step must already exist.** Any edit. **Size does not excuse it and neither does approval** — a yes in conversation authorises the change, never the record. The disguise is the one-word fix the developer has already agreed to: it does not feel like a change, and it leaves the identical hole. A session later the file differs from `HEAD` and nothing says why.

**Writing `Q<n>` asserts the card is already on the approach page.** The number is a claim about the record, so do not spend one before the arc exists. Where the shape is still moving, **ask in chat** — a suggestion, `S<n>`, which is free ([suggestion or question](#a-card-is-only-for-what-the-rules-leave-open)) — or ask the developer to open the arc.

**That escape is what makes the rule followable.** Mid-ideation you often cannot write the arc, because the subject has not settled. Stop numbering until it has. Never keep numbering and reconcile the page afterwards: a page reconciled later records the destination and throws away every turn that reached it.

## Anything the developer has not reviewed: preview, confirm, record, then code

| Step | What it is |
| --- | --- |
| **preview** | build only enough to show the thing — real output, a sample entry, a before and after. Say plainly that nothing is committed to |
| **confirm** | the choices in a table, each with a recommendation. They decide from the thing rather than from a description |
| **record** | the row in the arc that owns it. An approved preview that is a file stays in the arc's own `notes/N<nnn>/previews/` folder, listed in the arc's `## Previews` table and linked from the approach page. One that was shown in chat is written into the arc with the answer, and gets no file |
| **code** | only now, and against the row |

**A preview explains a change, and a sample is the thing itself — MUST** (`RD.DEVEX.WORKSPACE.200`).
A preview written as a page is copied from `approach-preview-template.html`, named
`<subject>-preview.html`, and lives in `notes/N<nnn>/previews/`. A sample is a real file of the kind
the work produces — a template, a report, a document. It keeps its own format and its own name, lives
in `notes/N<nnn>/samples/`, and is never written in the preview layout. Make a sample only when the
work produces such a file. Each one reads `PROPOSED` until the developer answers and `DECIDED` after. Remove one that a later one
replaces, and say so in the arc's log. List each in the arc's
`## Previews` table with its kind and its state, and link it from the approach page. Writing the first
one opens the arc as `PROPOSED`. A preview belongs to its arc: a later arc that needs an earlier arc's
preview or sample links it, and never copies it, says it again or edits it
(`RD.DEVEX.WORKSPACE.224`). A copy is a second version, and nothing keeps the two in step.

**You pick the form of a preview, and the developer's word overrides it — MUST**
(`RD.DEVEX.WORKSPACE.201`). The book lists no fixed kinds: show lines that change, a layout, a diagram,
a whole file, or what a command prints. **A preview becomes a file only in four cases**
(`RD.DEVEX.WORKSPACE.224`): they ask for one, or one of the three rows below that write it. Text
that is only long is not one of them.

| The situation | You |
| --- | --- |
| they say *show it here* | show it in chat. A page is shown as the parts that change, with the path of the file |
| they say *make a page* or *make a file* | write it, and link it from the approach page |
| they say neither, and it must be seen to be judged, such as a drawing, a layout or a rendered page | write it, and link it from the approach page |
| they say neither, and it is a long list that they answer row by row | write it, and link it from the approach page |
| they say neither, and the ask is big and is only one subsection of the approach, so its detail does not belong on the page | write it, and link it from the approach page |
| they say neither, and it is none of those three | show it in chat, or state it on the approach page |
| they approve a preview that was shown in chat | write it into the arc with their answer, and write no file |
| nobody asked, and no rule owes a preview | write nothing |

**A fact has one home — MUST** (`RD.DEVEX.WORKSPACE.223`). When a preview holds the detail of a
change, the approach page gives two or three sentences and the link to go through it. When the page
holds the detail, a preview links the page and does not say it again. A later preview links an
earlier one. A parked item is stated only in the page's `Deferred`. Before you write a table, a tree
or a list, check whether the page or another preview already holds it; if one does, link it. Two
copies of one fact drift apart, and the developer then reads both to learn which one is current.

**A preview is kept, and one decision gets one preview — MUST** (`RD.DEVEX.WORKSPACE.224`). A
preview the developer asked for, or one you wrote, stays a file, decided or not. Never fold it fully
into the page and remove it. As the arcs progress, bring the page's sentences about that preview and
its link current in the same turn, and do not rewrite the earlier arc's file. Write one preview for
one decision, and never two that each show the same decision in another form.

**A preview shows, and an approach page argues — MUST** (`RD.DEVEX.WORKSPACE.233`). A preview's sections
are *Overview*, *Today*, *Proposed* and *Where it lands*, and it holds no card. *Overview* names the
decision first, what to look at first and what is not final. *Today* shows the thing as it is, and
*Proposed* shows it as it will be, with its options side by side where a decision is still open. *Where
it lands* names the files that change, by repository, in a few lines, with a link to the approach page's
own `How`. A preview carries no `Why`, `What` or `How` and does not retell how the workstream reached
this point, because the approach page holds that. A question is asked on the approach page, in `Open`,
and its card links the preview that shows the options. **A preview never frames a sample file**: it shows
a thing with the page's own blocks, such as a table, a tree, a figure or a code block, and where the
thing is a real file it links that file in the arc's `samples/` folder.

**Code shown on a page follows its stack's own standards — MUST** (`RD.DEVEX.WORKSPACE.235`). A code
block in a preview or on an approach page is read as code and copied as code. So it follows the naming
and code chapters of the stack it belongs to, exactly as a file in that stack's repository does. Before
you write such a block, load that stack's naming and code references and write the block to them: for
TypeScript, `refs/support/apps/providers/ts/02-naming.md` and `05-code.md` in the `spn-apps` plugin. A
page in a workstream belongs to no stack, so nothing else brings those references into your session.
Each stage keeps its own words in a sample too: a support interface names no platform word, such as an
organization.

**A preview holds what the developer judges, and nothing you need — MUST** (`RD.DEVEX.WORKSPACE.210`).
It is written for the person who says yes or no. Show the proposal in its final form, the few rules it
rests on, and the choices asked. What you measured, the commit you read, the order of the work and the
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
session's scratch folder. Leave out the link back to an approach page and the arc field. Hand it over
as its full path. Publish it only when the developer asks, and then give them the link. When a
workstream opens for the work, move the page into its first arc's `previews/` folder and list it there.
A sample the page links is a file beside it: publish or move it with the page.

**The plan is begun at design time, pinned to the commit and the paths each fact was read at, and
kept lean — MUST** (`RD.DEVEX.WORKSPACE.227`). Designing a preview already does most of the reading
an arc needs, so the plan is not read a second time just before the arc runs; it is checked.
`git log <commit>..HEAD -- <path>` lists what moved since the pin, and you re-read only what it
names, before each order. The preview is written for the developer, to approve; the plan is written
for you, to execute, and it holds nothing the preview already explains.

**A preview costs nothing to throw away.** Code written first makes the decision feel already taken,
and it turns a question into a fait accompli.

**A major release is agreed while the arc is planned — MUST** (`RD.DEVEX.WORKSPACE.069`). A minor or patch bump is released without asking. A major one is a card answered with the arc's other cards, and its go is a dated log line naming the version, so execution reads the record instead of stopping to ask.

## A go is written down, or it did not happen

A go lives in the arc's `## Log`, as a line opening with the date and the word:

```markdown
- **2026-09-09 — go.** The developer said finish it.
```

**Nothing else counts, because nothing else survives.** A go held in the conversation ends with the
window, and the next session opens on a page it cannot tell from a proposal. So the first
repository write in a window is checked: one open workstream, no go recorded, one warning. Writing
the plan never warns, because that is how a session earns the go.

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

**The parts of the page that the arcs decide are produced, never typed — MUST.** They are the header's
status, the Cycles table with its previews, and the heading of `Open`. Run
`spn-devex docs cycles write <workstream folder>` after any change to an arc's status, its first
line or its `## Previews` table. The header's status reads `PLANNING` while no arc is past `DECIDED`,
`IMPLEMENTING` once an arc runs or has landed, and `DONE` when the workstream closes. The heading of
`Open` reads `Open — Q<n> · Q<n>`, each open card by its number. With no card open it reads
`Open — no card is open`.

**The rest of the page is yours to bring current in the same turn — MUST.** A new arc, or a scope that
grew, owes the page its `Why`, its `What` and its `How`, and a Subtitle and a Description that still
cover what the page plans. A `What` or `How` subsection that has a preview ends in a *Read the
preview →* line. The subsection says the decision in two or three sentences, and the preview holds
the detail. The page never states a preview's tables, trees or lists a second time, and one section
of the page never repeats another (`RD.DEVEX.WORKSPACE.223`).

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

**An arc's file is named `N<nnn>-<subject>.md`** (`RD.DEVEX.WORKSPACE.203`): a three-digit number and
a subject of two to four words, such as `N002-bound-handoff.md`. The heading inside keeps the full
phrase that names the cycle. One number names one file, and every note of the arc sits inside
`notes/N<nnn>/`.

**A close is a milestone, and you say so before you ask — MUST** (`RD.DEVEX.WORKSPACE.206`). Write a
few short paragraphs and no table: that the work is finished, what was delivered in terms of what the
developer can now do, what was learned, and thanks for what they decided along the way. Measure every
number from the arcs and the close report. Separate the paragraphs with a `&nbsp;` line, as the welcome
does, and never put them in a quote block. Then ask. Before the folder moves, the page gets its closed
masthead and a closing block with what was delivered and learned.

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
[`refs/devex/workspace/docs/decision-cards.md`](docs/decision-cards.md): number and summary, what,
why it matters, a lettered options table, a recommendation with its reasoning, and a preview where
the decision is a shape. Follow it whenever a person owes a decision, and in full whenever one asks
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
| an arc the page does not cite | `stop.ts`, when a turn ends |
| every row accounted for, and the page stamped, before a close — a row still `in progress` refuses | `split-plan.ts --gate close` |
| a row in progress named with its age, never called runnable | `stop.ts`, when a turn ends |
| a row held on an open card never called runnable | `stop.ts`, when a turn ends |
| a card raised in full once, under **Needs you** at the top of its reply, and named in one line while it stays open | `stop.ts`, when a turn ends |
| an answer logged for an arc lands in that arc's notes in the same turn, and a proposed arc carries no review point to a later step of itself | `stop.ts`, when a turn ends |
| a page published without being asked is met by a reminder, never a refusal | `pretooluse.ts`, on a publish |
| a page that links its stylesheet from outside is refused on a publish, and the refusal names `docs sds bundle` | `pretooluse.ts`, on a publish |
| a reply that passes work on carries a handover block with all nine labels and no `{{…}}` left | `stop.ts`, when a turn ends |
| what landed, said out loud | `closed.ts`, after the folder moves |
| what the agent's own machinery costs | `timing.ts`, on every hook run |
| a repository write with no go on record | `confirmed.ts`, on the first such write in a window |
