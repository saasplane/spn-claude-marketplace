<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/02-constructs/03-platform/02-modules/07-audit-log.md",
      "seen": "a77676b0"
    },
    {
      "path": "spn-foundation/docs/04-capabilities/03-platform/02-modules/07-audit-log/",
      "seen": "3d10bd7b"
    }
  ]
}
-->
# Audit log — a record is never edited

**Source of truth:** the foundation's `02-constructs/03-platform/02-modules/07-audit-log.md` and its capability chapters. Read this as the restatement; the book governs.

## The property everything follows from

**A record is never edited.** There is no update and no delete. The record carries who created it and nothing that could change afterwards — because evidence that can be revised is not evidence.

**The actor's name is captured at the moment of the event and kept.** Looking it up later would show who that person is *now*, which is a different claim from who did this thing then.

## Writing is reached only through the queue seam

**Never by a direct call.** A trail that can be written synchronously is a trail whose absence can be caused by the caller failing, and it is a trail whose write can be skipped under load.

## Three outcomes that look alike and are not

| | What it means | What it points at |
| --- | --- | --- |
| `FAILURE` | the thing was attempted and did not succeed | the operation |
| `DENIED` | the thing was refused before it was attempted | authorization |
| `ERROR` | something broke while attempting it | the system |

**Collapsing them loses the question each one answers.** A dashboard counting all three together cannot tell a permission problem from an outage.

## When you reach for it

**Anything somebody may later have to prove happened.** Application logs are for operating the system; this is for answering a question somebody has to be able to prove the answer to.
