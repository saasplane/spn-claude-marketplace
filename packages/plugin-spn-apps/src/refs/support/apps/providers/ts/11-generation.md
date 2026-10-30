<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/02-apps/10-providers/ts/11-generation.md",
      "seen": "060533b4"
    }
  ]
}
-->
# Generation — what is generated, and which command regenerates it

**Source of truth:** the foundation's `10-providers/ts/11-generation.md`. Read this as the restatement; that chapter governs.

**Read this before you write anything**, because what is generated decides what you may not edit.

**A generated file is never hand-edited. Change the source it is derived from, then re-run its generator.** This is the one rule that governs everything below, and it has no exception — a hand edit survives until the next generation and then disappears, taking whatever it was fixing with it. A manifest is a declared input, not a generated output, so it carries no `spn-` prefix and is edited by hand: `sprepo.json`, `spkind.json`, `spinfrapkg.json` and `src/spestate.json`.

| Generator | Re-run it when | It writes |
| --- | --- | --- |
| `spnutils apps gen-validators <package>` | anything under `contract/states/` changed | the matching schemas under `contract/validators/` |
| `spnutils apps gen-validators <package>` | anything under `contract/services/` changed | each contract interface's methods as data under `contract/methods/` |
| `spnutils apps gen-barrel <package>` | the package's public surface changed | the barrel — what the package exports |
| `spnutils apps gen-labels <package>` | a `translate()` call site was added or moved | the label manifest |
| `spnutils apps gen-symbols <package>` | the public surface changed | the symbol index |
| `spnutils apps codegen <target> <package>` | a service's published API changed | the typed client for it |
| `spnutils repo agent-sync` | the repository's own manifests changed | the agent wiring |

**`contract/methods/` follows `contract/services/` file for file**, as `validators/` follows `states/`. Each file holds one object, typed `SPServiceMethods<I<MOD><Entity>Service>`, that lists the methods of one contract interface and the two validators of each: what goes in and what comes out. The command reads each method's signature and names the validators `validators/` exports for it; a method that is not one command in and one state out is refused, naming the method. It writes inside `src/contract/` and nowhere else — **MUST**; the `remote/` folder and the managers are written by hand. The object is what both ends of a call between services read: the runtime manager hands it to the API entry, the remote manager hands it to the proxy, and the type refuses an object that misses a method or names one the interface does not have. Never hand-edit `contract/methods/**`; edit `contract/services/**` and re-run `gen-validators`.

**Run `gen-validators` and `gen-barrel` before you commit**, not at the end of the day. A stale validator does not fail quietly — it takes the service down at boot, and the failure names a schema rather than the edit that caused it.

**`gen-validators` records each state's base, so the published specification keeps the read ladder** (`RULE.SUPPORT.APPS.219`). A schema built with `.merge()` no longer says what it was merged from, so without one more fact the specification could only write every level flat. The generator writes `export const RoleInfoSchemaBase = RoleMetaSchema;` beside the schema.

- **A state that extends exactly one interface gets `<State>SchemaBase`, set to its base's schema.** A variant of a polymorphic family names its morph base: `<Variant>SchemaBase = <Base>MorphBaseSchema`. A state with no `extends`, or with more than one, gets none.
- **The name does not end in `Schema`**, so the schema registry passes over it and the specification never makes it a component.
- **The service hands the bases to the specification beside the schemas.** The specification writes each level as `allOf` of its base's reference and its own fields, leaves every component open and closes each level where it is used.
- **The client receives levels as extensions.** The generated types read `RoleInfo = RoleMeta & {…}`, with the same fields as before. A variant composes on a morph base that holds fields, and stays flat where the base holds none besides `mtype`. The order is the one every contract change takes: run `gen-validators`, start the service, then regenerate the client from the running service.

**Declaration order matters inside a state file.** A contract union is a base carrying the discriminant plus variants that extend it, never a union alias, and the file that declares the base is read before the files that extend it.

**The stack is never typed on an `apps` command.** The node's own manifest declares it, and a flag that repeats a declaration is a second source for it.

**The API client is the one generation somebody types**, because it needs the service running to read its published surface. Each client names the service it is the client of: the command loads the node's own `openapi-ts.config.ts` and fetches the address its `input` names, or the one passed after the target as `--url <address>`. It names no service, port or variable of its own, so a client with neither is refused. Everything else is derived from files already on disk.
