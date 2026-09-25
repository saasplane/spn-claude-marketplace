<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/06-jobs.md", "seen": "6441f835" },
    { "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/06-jobs/", "seen": "18a32133" }
  ]
}
-->
# Jobs — a schedule is not an entry

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/06-jobs.md` and its capability chapters. Read this as the restatement; the book governs.

## The thing to notice first

**A schedule renders nothing and serves nobody.** It fires, and it calls something that already exists. That is why a schedule is not an entry layer: an entry adapts a way *in*, and nothing comes in here.

**So the work a schedule triggers is ordinary work**, reachable by other means too. A job that can only be run by its schedule is a job nobody can re-run after it fails.

## Giving up has two names, on purpose

**`FAILED` and `TIMEOUT` are both giving up, and they are separate deliberately.** One means the work decided it could not finish; the other means nobody decided anything and the clock ran out. They point at different problems and they are fixed differently.

## What a run record is for

**The value of a run record is mostly in the negative case.** A successful run tells you little you could not assume. A failed one is the only account of what happened, so it is written even when nothing was produced.

## When you reach for it

**Anything that happens on a clock rather than because somebody asked.**
