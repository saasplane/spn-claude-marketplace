<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/09-errors.md",
      "seen": "ed75d8fb"
    }
  ]
}
-->
# Errors — how an error is raised, and how a log is written

**Source of truth:** the foundation's `10-providers/ts/09-errors.md`. Read this as the restatement; that chapter governs.

**Prefer throwing over logging.** A thrown error carries its own context to somebody who can act on it; a logged one is read later by somebody who cannot.

**Never put a secret or an internal field name in an error's data.** The error crosses the boundary to a caller, and everything in it is published by the act of throwing.

**Use the logger provider in application code**, never the console. The provider is what makes a log routable, levelled and suppressible.

**The levels, and how to choose.** `error` is the odd one out — it means somebody must act. `warn` means something was wrong and the work continued. `info` is the shape of what happened, `debug` the detail behind it: if a line would be noise on every run in production, it is `debug`.

**A module's error helpers belong to that module**, and the standard codes are the platform's. A module inventing a code that already exists gives one condition two names.
