<!-- spn:restates
{
  "docs": [
    { "path": "spn-foundation/providers/apps/ts/07-codegen.md", "seen": "014e1711" },
    { "path": "spn-foundation/providers/apps/ts/08-toolchain.md", "seen": "f594929e" },
    { "path": "spn-foundation/providers/apps/ts/11-tests.md", "seen": "d946b6af" },
    { "path": "spn-foundation/providers/apps/ts/04-errors-logging.md", "seen": "61a77347" },
    { "path": "spn-foundation/providers/apps/ts/10-web-patterns.md", "seen": "4782098e" }
  ]
}
-->
# Patterns in an APPS · TS node — generation, toolchain, tests, errors, web

**Source of truth:** the foundation's TypeScript provider set — `07-codegen.md`, `08-toolchain.md`, `11-tests.md`, `04-errors-logging.md` and `10-web-patterns.md`. Read this as the restatement; those chapters govern, and where the two disagree this file is regenerated.

**Five of the provider set's fifteen chapters are restated here, and ten are not.** The ten carry naming, structure, code patterns, service patterns, database patterns and configuration — every one of which a step file in the `implement` skill already walks you through at the moment you need it. A ref for those would be a second home for instructions you are already holding.

**These five are different because you need them before you write anything.** What is generated decides what you may not edit. The toolchain decides where a file goes and which config reads it. The tier map decides where a test lives. The error model and the web shape decide what the code looks like when you get there.

## What is generated, and what that forbids

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

## The toolchain — where a file goes, and which config reads it

**The TypeScript config layers, and a package never restates what a layer above it already said.** The kind's base config comes from the toolchain package; the package's own `tsconfig.json` extends it; `tsconfig.build.json`, `tsconfig.test.json` and `tsconfig.integration.json` are overlays for what each of those does differently. **A setting copied down a layer is the copy that drifts.**

**The test overlay is chosen by runner, not by kind.** Two packages of different kinds running the same runner share an overlay; one package running two runners has two.

**The per-tier targets are inferred, never declared** — a package gains a tier by having that tier's folder, not by writing a target for it.

**A package declares one script per command it answers, and nothing else.** An identical script list in every package was the older rule and it is replaced: a script for a tier the package does not have is a command that can only fail.

**A cached target names its inputs, and `default` alone is not enough.** A target with no dependency input ignores its dependencies entirely, so it replays a cached result after the thing it depends on changed. Probe a cache key with a real content change, never by touching a file.

**Root scripts are the repository's and are a different surface from a node's commands.** Reach for `spnutils apps check · test · format` before any `npx` or `pnpm` invocation.

## Tests — the tier map decides where a case lives

**A node owns the tiers its kind names, and a dash in the tier map is a ruling rather than a gap.** `APP_SERVER` owns no journey tier, and that is a prohibition — a journey case written there is in the wrong node, not merely in an unusual one.

| Tier | Runner | What it proves |
| --- | --- | --- |
| unit | Jest on the server, Vitest on the web | one unit, nothing real behind it |
| component | Playwright CT | one component rendered, in a browser |
| contract | the generated client against a live service | that the published surface is what the client believes |
| integration | Testcontainers | the node against a real resource it fronts |
| journey | Playwright against a running stack | a path a person takes, end to end |

**A node may double a seam it owns, and nothing else.** That one rule decides where a case belongs: a case reaching for a double of somebody else's seam is a case in the wrong node.

**Only Jest typechecks as it runs.** A type error that Jest would catch passes silently under the other runners, so a server package's red is not reproducible by running the web suite.

**An integration case skips itself when its service is unreachable**, and a skipped case proves nothing. Read the count, not the colour — and remember that `--reporter=line` drops the artifacts that say *which* case skipped.

**Run the tier that owns the rule you changed.** A change to a refusal needs the integration tier; unit passes straight over it.

## Errors and logging

**Prefer throwing over logging.** A thrown error carries its own context to somebody who can act on it; a logged one is read later by somebody who cannot.

**Never put a secret or an internal field name in an error's `data`.** The error crosses the boundary to a caller, and everything in it is published by the act of throwing.

**Use the logger provider in application code**, never the console. The provider is what makes a log routable, levelled and suppressible.

**The four levels, and how to choose.** `error` is the odd one out — it means somebody must act. `warn` means something was wrong and the work continued. `info` is the shape of what happened, `debug` the detail behind it: if a line would be noise on every run in production, it is `debug`.

**A module's error helpers belong to that module**, and the standard codes are the platform's. A module inventing a code that already exists gives one condition two names.

## Web — the canonical shape

**One canonical component shape, written so the next one is written the same way.** Read the chapter as the standard rather than as a catalogue: it is not a list of components you may use, it is the shape yours must take.

**The wrapper is the public API.** A generated primitive is never hand-edited and never exported directly — the wrapper around it is what the rest of the application sees, and what absorbs a regeneration.

**`ui/boot/` is the design system booting itself, not the application's boot.** They are two different acts and confusing them puts application state inside a library.

**Every web app declares the same scripts, and `preview` is not among them** — it was `start` under another name and is retired. **The test bundle is a flavour of `build`, never a second script.**

**The dev server accepts the host the estate serves it on**, because the name a browser reaches it by comes from the estate's coordinates rather than from localhost.

**A stylesheet's asset paths are relative to the stylesheet**, not to the page that loads it.
