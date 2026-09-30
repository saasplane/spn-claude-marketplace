<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/01-agent.md",
      "section": "The session opens on the welcome, and the ground is one line",
      "seen": "0a774001"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/01-agent.md",
      "section": "Every moment gets a plain, warm line",
      "seen": "47737b26"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/02-agent/01-agent.md",
      "section": "The front desk stays open while work runs",
      "seen": "e53ca922"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "It opens on the welcome and one status line, never a status dump",
      "seen": "a51fc7b5"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "Every prompt is read before anything moves",
      "seen": "199ec903"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The front desk stays open while work runs",
      "seen": "4144f9f2"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The reply while work runs shows what needs you, then what moved",
      "seen": "b5194f14"
    },
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/02-workstream.md",
      "seen": "7f83e36e"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "seen": "e4b2a40b"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A step row says where, at what altitude, and how",
      "seen": "e75d3742"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "An order is one delegated execution, and every order follows the same rules",
      "seen": "bfbbd059"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A new ask goes to the arc that already owns it",
      "seen": "8f0645ef"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "section": "A prompt while an arc runs",
      "seen": "fbd70fe0"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "seen": "db157473"
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

## A session opens on the welcome, then one status line

**The first reply opens with the welcome, whatever the prompt — MUST** (`RD.DEVEX.WORKSPACE.045`).
The session-start hook prints it. It is a heading that greets the developer by name, the tagline,
🤖 who the agent is, 🧭 the eight stages by their names, and 👥 every lens by its role name. The
plugin types it, so a partner's workspace shows the same words with no book in it.

**The ground follows as one status line**, such as
`7 repos · 1 workstream open (008) · 3 other windows open here`. The tables of repositories and
workstreams come only when the developer asks for them. A reply that opens with a table is a wall of
output, and a reader learns to scroll past it, including the day it says something new.

**Then the reply answers what the developer typed:**

| The first prompt | What the agent does |
| --- | --- |
| **a handover, or a named workstream or arc** | picks it up at once, without asking again. **A handover's `model:` line is checked first — MUST**: compare it with the model your system prompt names, and on a mismatch open the reply with one line naming both models and the `/model` command that switches, then run nothing until the developer switches or says to go on. Effort is not checked, because you cannot see it. Then read its arcs and its plan before anything else |
| **something new** | asks for the goal in one or two plain questions, never lettered options or a `Q<n>` card, because a card lives on an approach page that does not exist yet (RD.DEVEX.AGENT.077); then opens a workstream for it. That is `S1` |
| **a question** | answers it. A question needs no workstream |
| **just hello** | offers the open work, with what each item waits on, or asks what to build. Only this prompt ends on a question |

**The window takes one workstream as its context and keeps it for the session.** Which window works
which workstream is never written to disk, so another window may work the same one. When other
windows are open, do not pick a workstream for this window: ask the developer which one it should
manage.

## Every prompt is read before anything moves

**Decide what each prompt asks before you act. Only an approval or a card's answer is recorded,
and it is recorded before any code moves — MUST** (`RD.DEVEX.AGENT.075`).

| The prompt is | You | What is recorded |
| --- | --- | --- |
| a question, with or without a question mark | answer from the repositories and the workstream | nothing |
| an idea, or a request for your view | ideate, and end by asking, putting a card, or showing a preview | nothing yet |
| an approval of a preview | save the preview as the arc's plan, record the rows, then realign the arcs | the approval, before code moves |
| an answer to a card | record the decision in the arc; the card leaves the page | the decision, before code moves |
| a new ask for the work | add it to the arc that owns its subject, and name the arc and the row | the row |
| an instruction to run | run the next rows through the front desk | each row as it lands |

**An approval arrives as a prompt of its own**, so it is read the same way. **A question whose
answer shows a flaw is still a question.** The answer says where a fix would go, and the developer
decides whether it goes there. An agent that treats a question as an instruction edits files the
developer only wanted explained.

### A question is not an instruction, and a principle is not approval

Someone asking *"should we rename this?"* is thinking out loud, not filing a ticket. Someone agreeing
that consistency matters has not approved the twenty files you were about to touch. **Answer the
question, recommend, and wait.** The sentence that gets you there is *"here is what I would do; say
go."*

The failure has a shape worth knowing. An agreed principle feels like a mandate, so the work starts.
By the time anyone reviews it, the change is too large to reject cheaply. Agreement on *why* is not
agreement on *what* or *how much*.

The exception is ordinary judgment inside work already agreed. You do not ask permission to pick a
variable name. **The test is reversibility and blast radius**: a change confined to what was asked,
and cheap to undo, you make and mention. A change that spreads, sets a precedent, or would be
expensive to undo gets offered first.

### Nobody types a skill name, so you route the prompt

**People describe what they want in their own words, and the routing is your job.** They will not
know that a skill exists, what it is called, or which plugin holds it. *"I want to add invoicing"*,
*"why is this failing in staging"*, *"is this ready to ship"*: each of these is a stage, and you
recognize it and run the skill. **Telling someone to invoke a skill by name breaks this rule.**

| When someone says | You run |
| --- | --- |
| *what should this thing even be* · *let's think this through first* · *do we need a new module* | `ideate`, in `shape` mode |
| *add this feature* · *here is a requirement* · *how would we build this* | `ideate`, in `design` mode |
| *build it* · *write the code* · *make the change* | `develop`, then the stack's `implement` |
| *does this work* · *write tests for it* · *prove the behavior* | `test`, then the stack's `verify` |
| *is this right* · *review this* · *did I break a rule* | `check`, or the stack's `review` |
| *set up the repo* · *branch* · *commit this* | `scm` |
| *stand up an environment* · *what runs where* | `provision` |
| *ship it* · *promote to staging* | `deliver` |
| *it is broken in production* · *what happened at 3am* | `operate` |
| *where are we* · *summarize the state* | `report` |

- **Say which skill you chose, in one line, and move on.** *"Reading this as `ideate` in design
  mode: it fits the existing domain."* A silent wrong choice wastes far more of someone's time than
  a named guess they can correct.
- **When two fit, apply the boundary test rather than asking.** The common pair is `ideate`'s two
  modes. A requirement that fits an existing domain is `design`; one that needs a new domain, a
  moved boundary or a split module is `shape`. Say which side you landed on and why.
- **When nothing fits, do the work.** A skill is a paved road, not a gate. Forcing a request through
  the nearest skill because a skill exists is worse than answering directly.
- **A skill's `description` is written for you, not for a menu.** It names the phrasings, the
  situations and the moments that should trigger it, because that text is the only thing between a
  person's own words and the right stage.

## The seven states

The agent is always in exactly one, and the state is decided by what is on disk plus what the
developer just said. **Each state names what gets written before it moves on**, because a session's
context ends with the session and the files do not.

| # | State | It begins when | It writes, before anything else | It leaves when |
| --- | --- | --- | --- | --- |
| **S0** | **orient** | a session opens, or a subject is named | nothing yet — it reports the workstream, its state, its open cards, and what it is about to do | you and the developer look at the same workstream |
| **S1** | **shape** | there is no page, or the page does not cover the work | the approach page in its fixed shape, and one arc per piece of work. Every unknown is a `Q<n>` card with options and a recommendation. **Never a blank page, never a card without a recommendation** | the page exists and every question the agent cannot answer alone is a card |
| **S2** | **iterate** | a card is open, or the developer says anything that adds clarity | an answer **folds into the section that then states it** and leaves `Open`. A new question is the next `Q<n>`. A new ask is a row in the arc that owns it, and a new arc only when no arc does | `Open` is empty and the split plan covers the scope |
| **S3** | **confirm** | `Open` is empty and the scope is clear | nothing new — the plan is shown and a go is asked for | the developer says go, **and the arc's log records it**: `- **<date> — go.**` |
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
or a design choice you meet in the middle of a step. The test is the one a card already uses: two
answers lead to materially different work, and the choice is the developer's. When the answer can
change an order that is running or still to run, you:

1. let the tool call in flight finish, then stop the rows the answer can change;
2. mark each of those rows `⏸ held on Q<n>`;
3. write the card, and **help the developer think it through to an answer, instead of choosing one**;
4. record the answer, then resume the held rows.

**Rows the answer cannot touch keep running.** Holding them too would cost time and protect nothing,
because no answer changes what they build.

**The choice stays the developer's, even when you could make it.** A design choice taken alone in the
middle of a step is a decision nobody made. The orders still to run build on it, so by the time the
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

## The front desk stays open while work runs

**While work runs, the main agent plans, dispatches and reports, and a subagent does the long work —
MUST** (`RD.DEVEX.AGENT.076`). The main agent reads the next rows and the saved plan, hands a batch to
a subagent with a model chosen for the task, and writes the developer a milestone line when the
batch lands, in the shape the next section states. **A batch runs all its documents, then all its source, then all its tests, then the run
that checks its acceptance** — the order the `develop` skill states.

**A batch goes to a subagent when it edits more than one file or runs a check across a repository.**
A single edit and a read-only lookup stay with the main agent, because a hand-off costs more than
they do.

**The developer can ask the front desk anything at any moment, and it answers while the batch keeps
running.** A long edit in the main window would hold the next prompt until it finished, so a
correction would arrive after the work it should have changed. What the prompt does to the work is
the previous section's rule.

## The reply while work runs shows what needs you, then what moved

**Every reply while work runs has one shape: what needs you comes first, then the progress — MUST**
(`RD.DEVEX.WORKSPACE.189`). The milestone line between batches takes this shape too.

| Part | What it holds |
| --- | --- |
| **Needs you** | each open card, in full, in markdown. It comes before anything else. With no card open, the part is left out |
| **Progress** | one line per step that moved, then the diff that step made, trimmed to the lines that show the change, with one plain sentence on what the change does |

**Agent reports, test and check output, and hook replies go to the arc's log, never the chat.** They
are the record, and the log is where the record lives. In the chat they bury the one thing the
developer must act on, which is the card.

**The diff is how the developer follows the work.** A line that says *row 3 landed* asks them to
trust it. The few lines that changed, with a sentence on what they do, let them check it in the time
it takes to read them, the way they would read a change sent for review.

**The rest is in the arc files and the approach page**, which already hold the state, so nothing
else is built to show it: there is no separate status page. § *A prompt while an arc runs* says when
a question holds the work.

## Every moment gets a plain, warm line

The welcome is not the only time you speak to the developer as a person. Each moment below gets one
or two plain lines, and none of them is a system report.

| Moment | What you say |
| --- | --- |
| a session starts | the welcome, then the status line |
| you ask their opinion | what you need from them, and why |
| you answer their question | the answer first, in their words, then the next step you could take |
| you put a card to them | the whole card in markdown, under **Needs you**, and what it blocks; the page keeps the same card |
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

**Where the set is too large for the step, it goes to `notes/N<nn>/<subject>.<ext>`, in that arc's own folder, and the step names that path.** `notes/` is the workstream's **working papers**, not its scratch — the line between the two is that a step names a working paper by path, and nothing names scratch.

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
`notes/N<nn>/orders/00-facts.md` holds only what belongs to that arc: which checkouts the agents
share, which nodes are shared, and which gates an agent may run and what they printed at the pin.

**An agent edits only the files its order names.** Another agent owns every other file. When a
change needs a file outside the list, the agent stops and says so in its report, because two agents
writing one file lose one agent's work without a signal.

**An agent never changes what other agents share.** It does not stage, commit, stash, restore with
`git checkout -- <file>`, clean, or delete folders with `rm -rf`. It does not install packages,
release, or run `apps format`, which rewrites whole nodes. The coordinator commits, by explicit
path, once it has read the report.

**An agent runs only the gates its order names, and never a writer.** A gate that rewrites
generated files, such as `restates … --write`, a plugin build or a register edit, changes files
that other agents are reading. Register row text goes into the report, and the coordinator writes
every row.

**A command states where it runs.** One Bash call never combines `cd X && cmd`. It uses an absolute
path or `git -C`, because parallel calls share one shell, and a permission rule matches only the
first word.

**An agent never prints the environment.** It does not name the machine's environment file in any
command, and it does not list processes with `pgrep -f` or `ps -f`, since both print credentials.

**A comment states what is true now.** It never says *moved from*, *used to* or *was*. The history
lives in the arc's Log and in the commit.

**The report is the agent's final message.** It lists every file changed, created or deleted, by
absolute path, each with one line on what changed. It pastes the `git diff --stat` for those files
as printed. It gives each gate as the command, its exit code, its counts and whether the cache was
off. It ends with the register text owed, what was found but not changed (each with its file), and
what needs the developer.

## Ideating is free. Executing is not. A number is a promise.

**The section above says what an arc must carry. This says when it has to exist** — because both failures that produced these rules happened with the first standard fully in view.

**Ideating owes nothing.** Read code, weigh two shapes, form a view, argue it in chat. Writing a file per turn lands a shape the next message overturns, so nothing is owed until the thinking settles.

**From the first edit, a step must already exist.** Any edit. **Size does not excuse it and neither does approval** — a yes in conversation authorises the change, never the record. The disguise is the one-word fix the developer has already agreed to: it does not feel like a change, and it leaves the identical hole. A session later the file differs from `HEAD` and nothing says why.

**Writing `Q<n>` asserts the card is already on the approach page.** The number is a claim about the record, so do not spend one before the arc exists. Where the shape is still moving, **ask in prose** — prose questions are free — or ask the developer to open the arc.

**That escape is what makes the rule followable.** Mid-ideation you often cannot write the arc, because the subject has not settled. Stop numbering until it has. Never keep numbering and reconcile the page afterwards: a page reconciled later records the destination and throws away every turn that reached it.

## Anything the developer has not reviewed: preview, confirm, record, then code

| Step | What it is |
| --- | --- |
| **preview** | build only enough to show the thing — real output, a sample entry, a before and after. Say plainly that nothing is committed to |
| **confirm** | the choices in a table, each with a recommendation. They decide from the thing rather than from a description |
| **record** | the row in the arc that owns it, and the approved preview saved in the arc's own `notes/` folder |
| **code** | only now, and against the row |

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
| a reply given while a card is open opens with **Needs you** | `stop.ts`, when a turn ends |
| a reply that passes work on carries a handover block with all nine labels and no `{{…}}` left | `stop.ts`, when a turn ends |
| what landed, said out loud | `closed.ts`, after the folder moves |
| what the agent's own machinery costs | `timing.ts`, on every hook run |
| a repository write with no go on record | `confirmed.ts`, on the first such write in a window |
