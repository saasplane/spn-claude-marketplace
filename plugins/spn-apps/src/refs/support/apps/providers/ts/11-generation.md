<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/11-generation.md", "seen": "f16ed547" }
  ]
}
-->
# Generation — what is generated, and which command regenerates it

**Source of truth:** the foundation's `10-providers/ts/11-generation.md`. Read this as the restatement; that chapter governs.

**Read this before you write anything**, because what is generated decides what you may not edit.

**A generated file is never hand-edited. Change the source it is derived from, then re-run its generator.** This is the one rule that governs everything below, and it has no exception — a hand edit survives until the next generation and then disappears, taking whatever it was fixing with it.

| Generator | Re-run it when | It writes |
| --- | --- | --- |
| `spnutils apps gen-validators <package>` | anything under `contract/states/` changed | the matching schemas under `contract/validators/` |
| `spnutils apps gen-barrel <package>` | the package's public surface changed | the barrel — what the package exports |
| `spnutils apps gen-labels <package>` | a `translate()` call site was added or moved | the label manifest |
| `spnutils apps gen-symbols <package>` | the public surface changed | the symbol index |
| `spnutils apps codegen <target> <package>` | a service's published API changed | the typed client for it |
| `spnutils repo agent-sync` | the repository's own manifests changed | the agent wiring |

**Run `gen-validators` and `gen-barrel` before you commit**, not at the end of the day. A stale validator does not fail quietly — it takes the service down at boot, and the failure names a schema rather than the edit that caused it.

**Declaration order matters inside a state file.** A contract union is a base carrying the discriminant plus variants that extend it, never a union alias, and the file that declares the base is read before the files that extend it.

**The stack is never typed on an `apps` command.** The node's own manifest declares it, and a flag that repeats a declaration is a second source for it.

**The API client is the one generation somebody types**, because it needs the service running to read its published surface. Everything else is derived from files already on disk.
