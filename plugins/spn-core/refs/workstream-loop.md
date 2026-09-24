<!-- spn:restates
{
  "chapters": [
    { "path": "docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md", "seen": "3d6943e5" },
    { "path": "docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md", "seen": "a548541e" }
  ]
}
-->
# The Workstream Loop — What The Agent Does, And When

How a session decides what to do: the states a workstream moves through, what each one writes before
it moves on, and the order anything unreviewed is taken in. Stack-agnostic. Source of truth: the
foundation's `04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md` and `01-devex/04-workspace/04-docs/05-artifacts.md`.

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
| **S4** | **execute** | the developer said go | a row ticks only when its acceptance holds and is proven. A question hit mid-work becomes a card; everything not waiting on it keeps moving. A row you started and put down takes `◐ stopped`, carrying what has to happen first, what already reached its node, what did not, and what nobody may touch until it resumes | every row is landed, carried or deferred |
| **S5** | **verify** | the last row is worked | the proof in the arc log — what ran, and what it said | nothing is asserted that was not run |
| **S6** | **close** | verification holds | landed, carried and deferred all pass, because parking work consciously is good housekeeping. **`carried` means the work leaves this workstream**, so the gate reads the scope it names and refuses one that is closed or does not exist; a row pointing at a later arc of this same workstream is sequencing, and it waits on that arc rather than on the word. **A row nobody decided and a row marked `◐ stopped` both refuse the close** — a stopped row already touched its node, so you finish it and mark it landed, or you split it into the half that reached its node and the half that did not. Then **the page is stamped closed**, then the folder moves, then the sweep — contradictions to a register row, conventions to the owning chapter — then one line saying what landed. **The page itself never moves into a repository**: an argument closes with the workstream that argued it, and what outlives it is the register row and the construct rewritten fresh | the folder is in `closed/` and the page says so |

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

## Anything the developer has not reviewed: preview, confirm, record, then code

| Step | What it is |
| --- | --- |
| **preview** | build only enough to show the thing — real output, a sample entry, a before and after. Say plainly that nothing is committed to |
| **confirm** | the choices in a table, each with a recommendation. They decide from the thing rather than from a description |
| **record** | the build row, and any `What re-aligns` row it obliges |
| **code** | only now, and against the row |

**A preview costs nothing to throw away.** Code written first makes the decision feel already taken,
and it turns a question into a fait accompli.

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
| every row accounted for, and the page stamped, before a close | `split-plan.ts --gate close` |
| what landed, said out loud | `closed.ts`, after the folder moves |
| what the agent's own machinery costs | `timing.ts`, on every hook run |
| a repository write with no go on record | `confirmed.ts`, on the first such write in a window |
