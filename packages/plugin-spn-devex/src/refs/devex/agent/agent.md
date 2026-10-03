<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "It opens on the welcome and one status line, never a status dump",
      "seen": "a51fc7b5"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "Every prompt is read before anything moves",
      "seen": "df57db26"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "The front desk stays open while work runs",
      "seen": "4144f9f2"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md",
      "section": "Where work runs, by cost",
      "seen": "171e1bdb"
    }
  ]
}
-->
# The Agent — The Loop It Runs, And Where Work Goes

**Source of truth:** the foundation's `04-capabilities/01-devex/02-agent/01-agent/01-agent.md`.
Read this as the restatement; the book governs. `refs/devex/workspace/workstream.md` links here
for how a session opens and keeps the front desk open, and states the workstream's own rules
beside it.

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
| **a handover, or a named workstream or arc** | picks it up at once, without asking again. **A handover's `model:` line is checked first — MUST** (`RD.DEVEX.WORKSPACE.196`): compare its model with the one your system prompt names, and on a mismatch open the reply with one line naming both models and saying to switch with the model picker, then run nothing until the developer switches or says to go on. **The effort is not checked**: the developer sets it in the extension's picker, and `CLAUDE_EFFORT` can disagree with that picker, so the effort on the `model:` line is a note for the developer who opens the window. Then read its arcs and its plan before anything else |
| **something new** | asks for the goal in one or two plain questions, never lettered options or a `Q<n>` card, because a card lives on an approach page that does not exist yet (RD.DEVEX.AGENT.077); then opens a workstream for it. That is `S1` |
| **a question** | answers it. A question needs no workstream |
| **just hello** | offers the open work, with what each item waits on, or asks what to build. Only this prompt ends on a question |

**The window takes one workstream as its context and keeps it for the session.** Which window works
which workstream is never written to disk, so another window may work the same one. When other
windows are open, do not pick a workstream for this window: ask the developer which one it should
manage.

**A session is named for the workstream and the arc it works on** (`RD.DEVEX.WORKSPACE.222`), so the
developer finds the window in the session list by its work. A hook gives the name from the prompt:
the folder's name once a prompt names one workstream, such as `020-agent-workstream-improvements`,
and `020-N011 artifacts-by-domain` where a handover starts the session on an arc. A name the
developer types is kept until the work changes, and a session keeps the arc it started on.

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

**What the book, the plugin references and the lenses settle, you decide, and you ask the developer
only what they leave open** — a boundary that shifts, information nobody can read or measure, or a
choice that is people's. Log each decision with its reason and name it in one line. The rule, and how
a design question is put to the developer, is `refs/devex/workspace/workstream.md` § *A card is only
for what the rules leave open*.

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

## The front desk stays open while work runs

**While work runs, the main agent plans, dispatches and reports, and a subagent does the long work —
MUST** (`RD.DEVEX.AGENT.076`). The main agent reads the next rows and the saved plan, hands a batch to
a subagent with a model chosen for the task, and writes the developer a milestone line when the
batch lands, in the shape `refs/devex/workspace/workstream.md` § *The reply while work runs shows
what needs you, then what moved* states. **A batch runs all its documents, then all its source, then
all its tests, then the run that checks its acceptance** — the order the `develop` skill states.

**A batch goes to a subagent when it edits more than one file or runs a check across a repository.**
A single edit and a read-only lookup stay with the main agent, because a hand-off costs more than
they do.

**The developer can ask the front desk anything at any moment, and it answers while the batch keeps
running.** A long edit in the main window would hold the next prompt until it finished, so a
correction would arrive after the work it should have changed. What the prompt does to the work is
§ *A prompt while an arc runs*, in `refs/devex/workspace/workstream.md`.

## Where work runs, by cost

**The agent places each piece of work by what it costs, before it starts — MUST**
(`RD.DEVEX.AGENT.081`). This joins the front-desk rule above, and gives the reason for the
*Mechanism* column every arc step row already carries, and for the plan's Orders table, which
groups a child's rows into orders, at most five children at once, each with its own model.

| The work | Where it runs | Why |
| --- | --- | --- |
| a mechanical change across many files: a rename, a link rewrite, a stamp | a script, written once, run by the window or a child | each file then costs no model turn |
| a long command: the tests, a build, an install, or a release | a background shell | no tokens, and the window stays free |
| independent work of more than about 15 minutes, with a written order | a fresh child, at most 5 at once | its turns re-send less than the window's |
| Figma work, scoped to what one child can finish alone | one child per Figma scope — a file, or a group of pages — run together only where the scopes do not overlap, and never writing the same file at once | a file sees only what another child has already published |
| a decision, a card, an arc record, a review of a child's work, a small edit | the main window | it is your conversation |

**A long-running child is replaced by a fresh one with a short order, and never resumed — MUST.** A
resume re-sends the child's whole context, so each further call on the same child costs more than the
last.
