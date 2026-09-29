<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/01-devex/04-workspace/02-workstream.md",
      "seen": "7c725ca8"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md",
      "seen": "e1937d2e"
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
      "path": "spn-foundation/docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md",
      "seen": "3487aa0b"
    }
  ]
}
-->
# The Workstream Loop — What The Agent Does, And When

How a session decides what to do: the states a workstream moves through, what each one writes before
it moves on, and the order anything unreviewed is taken in. Stack-agnostic. Source of truth: the
foundation's `02-constructs/01-devex/04-workspace/02-workstream.md` and
`04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md` for the workstream itself, and
`04-docs/05-artifacts.md` for what it writes.

## The four inputs a session opens on

A session begins with one of these, and naming which one it is decides everything after.

| The input | What it means |
| --- | --- |
| **resume a named workstream** | the developer names a subject. Read its page and its arcs before anything else |
| **pick one for me** | report what is open, with what each is waiting on, and let them choose |
| **a prompt handed over** | another session's brief. Find the workstream it belongs to before acting on it |
| **a new scope** | nothing covers this yet. That is `S1` |

## The seven states

The agent is always in exactly one, and the state is decided by what is on disk plus what the
developer just said. **Each state names what gets written before it moves on**, because a session's
context ends with the session and the files do not.

| # | State | It begins when | It writes, before anything else | It leaves when |
| --- | --- | --- | --- | --- |
| **S0** | **orient** | a session opens, or a subject is named | nothing yet — it reports the workstream, its state, its open cards, and what it is about to do | you and the developer look at the same workstream |
| **S1** | **shape** | there is no page, or the page does not cover the work | the approach page in its fixed shape, and one arc per piece of work. Every unknown is a `Q<n>` card with options and a recommendation. **Never a blank page, never a card without a recommendation** | the page exists and every question the agent cannot answer alone is a card |
| **S2** | **iterate** | a card is open, or the developer says anything that adds clarity | an answer **folds into the section that then states it** and leaves `Open`. A new question is the next `Q<n>`. A scope change is rows, and an arc if it is new work | `Open` is empty and the split plan covers the scope |
| **S3** | **confirm** | `Open` is empty and the scope is clear | nothing new — the plan is shown and a go is asked for | the developer says go, **and the arc's log records it**: `- **<date> — go.**` |
| **S4** | **execute** | the developer said go | a row you start takes `in progress <date> <time> <offset>` in its State cell (`in progress 2026-09-29 14:32 +05:30`), and landing replaces it. A row already marked by somebody else is left alone: ask the developer, saying how old the mark is. A row ticks only when its acceptance holds and is proven. A question hit mid-work becomes a card; everything not waiting on it keeps moving. A row you started and put down takes `◐ stopped`, carrying what has to happen first, what already reached its node, what did not, and what nobody may touch until it resumes | every row is landed, carried or deferred |
| **S5** | **verify** | the last row is worked | the proof in the arc log — what ran, and what it said | nothing is asserted that was not run |
| **S6** | **close** | verification holds | landed, carried and deferred all pass, because parking work consciously is good housekeeping. **`carried` means the work leaves this workstream**, so the gate reads the scope it names and refuses one that is closed or does not exist; a row pointing at a later arc of this same workstream is sequencing, and it waits on that arc rather than on the word. **A row nobody decided, a row marked `◐ stopped` and a row still `in progress` all refuse the close** — a stopped row already touched its node, so you finish it and mark it landed, or you split it into the half that reached its node and the half that did not. Then **the page is stamped closed**, then the folder moves, then the sweep — contradictions to a register row, conventions to the owning chapter — then one line saying what landed. **The page itself never moves into a repository**: an argument closes with the workstream that argued it, and what outlives it is the register row and the construct rewritten fresh | the folder is in `closed/` and the page says so |

**A standard the sweep corrects is not live yet.** A chapter reaches a session only once it is
carried into the plugins, installed, and synced. `refs/cross-repo.md` § *Open a workstream with the
agent update* holds that whole loop, and every authoring step in it is a builder's alone.

**Two rules run through every state.** Nothing is held only in the conversation. And the agent never
waits inside a state it can finish: it stops for a question only the developer can answer, or for a
session boundary.

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

**Where the set is too large for the step, it goes to `notes/<arc>-<subject>.<ext>` and the step names that path.** `notes/` is the workstream's **working papers**, not its scratch — the line between the two is that a step names a working paper by path, and nothing names scratch.

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
| `landed` with the commit | it reached its node | passes |
| `carried` with the scope | the work left this workstream | passes |
| `deferred` with the trigger | it waits on a named event | passes |

**The in-progress mark is a claim, and its age is what a second window reads.** Nothing tracks
windows and nothing expires the mark, so a second window never takes the row over on its own: it
asks the developer, saying how old the mark is. A timestamp lets the developer tell a row somebody
is on from one a closed window left behind.

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
| **record** | the build row, and any `What re-aligns` row it obliges |
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

## What each state is held to

Nothing above is enforced by good intentions. Every transition that can be checked is:

| Held | By |
| --- | --- |
| a page keeps its shape, its voice and its two `How` halves | `doc-check.ts`, on every write |
| the outline folds | `doc-check.ts` |
| an answered card does not sit in `Open` | `split-plan.ts`, on every write |
| an arc the page does not cite | `stop.ts`, when a turn ends |
| every row accounted for, and the page stamped, before a close — a row still `in progress` refuses | `split-plan.ts --gate close` |
| a row in progress named with its age, never called runnable | `stop.ts`, when a turn ends |
| what landed, said out loud | `closed.ts`, after the folder moves |
| what the agent's own machinery costs | `timing.ts`, on every hook run |
| a repository write with no go on record | `confirmed.ts`, on the first such write in a window |
