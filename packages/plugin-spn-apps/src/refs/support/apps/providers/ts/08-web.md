<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/08-web.md", "seen": "b8ee8203" }
  ]
}
-->
# Web — the canonical component, hook and screen

**Source of truth:** the foundation's `10-providers/ts/08-web.md`. Read this as the restatement; that chapter governs.

**One canonical component shape, written so the next one is written the same way.** Read the chapter as the standard rather than as a catalogue: it is not a list of components you may use, it is the shape yours must take.

**The wrapper is the public API.** A generated primitive is never hand-edited and never exported directly — the wrapper around it is what the rest of the application sees, and what absorbs a regeneration.

**The design system's own boot is not the application's boot.** They are two different acts, and confusing them puts application state inside a library.

**Every web app declares the same scripts, and a separate preview script is not among them** — it was the start script under another name and is retired. **The test bundle is a flavour of the build, never a second script.**

**The dev server accepts the host the estate serves it on**, because the name a browser reaches it by comes from the estate's coordinates rather than from localhost.

**A stylesheet's asset paths are relative to the stylesheet**, not to the page that loads it.
