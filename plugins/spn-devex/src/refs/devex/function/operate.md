<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/01-devex/01-function/08-operate.md", "seen": "06edbbb1" },
    { "path": "spn-foundation/docs/04-capabilities/01-devex/01-function/08-operate.md", "seen": "29cb6ffd" }
  ]
}
-->
# Operate — watching it, fixing it, and feeding that back

**Source of truth:** the foundation's `02-constructs/01-devex/01-function/08-operate.md` and `04-capabilities/01-devex/01-function/08-operate.md`. Read this as the restatement; the book governs.

## Why it is a phase and not a department

**A capability that works and cannot be watched is a capability nobody can support.** A fix that cannot be applied safely is not a fix.

**The thing to unlearn is that operations is a separate discipline with its own tools and its own record.** Here it feeds the same loop: what an incident taught becomes a document change, a register row or a check — not a runbook nobody else can find.

## What a change owes before it can be operated at all

**Signals, and a way to reach them.** A change that ships with no way to see whether it is working has not finished; it has only stopped.

**An agent reads the same signals a person does.** There is no separate machine-facing view, because a second view is a second thing to keep true.

## The order an incident is handled in

**Stop the harm, then find the cause, then fix it, then write down what it taught.** Reordering these is the commonest way an incident runs long: a cause hunted before the harm is stopped is a cause found late, while the harm continues.

**Closing an incident owes something back.** The loop is only closed when what it taught has landed where the next person will meet it: the owning chapter, a register row, or a check that fires at write time.

## What this phase never does

**It never becomes the place a rule lives.** A rule discovered in an incident belongs in the chapter that owns it. Left in an incident record, it is a rule nobody outside that incident will ever read.

**It never edits built output to make a symptom go away.** That works, ships, and disappears at the next build.
