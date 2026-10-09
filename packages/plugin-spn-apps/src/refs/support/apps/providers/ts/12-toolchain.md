<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/12-toolchain.md",
      "seen": "df44800e"
    }
  ]
}
-->
# Toolchain — what builds, links and lints it

**Source of truth:** the foundation's `10-providers/ts/12-toolchain.md`. Read this as the restatement; that chapter governs.

**Read this before you write anything**, because the toolchain decides where a file goes and which configuration reads it.

**The TypeScript config layers, and a package never restates what a layer above it already said.** The kind's base config comes from the toolchain package; the package's own `tsconfig.json` extends it; `tsconfig.build.json`, `tsconfig.test.json` and `tsconfig.integration.json` are overlays for what each of those does differently. **A setting copied down a layer is the copy that drifts.**

**The test overlay is chosen by runner, not by kind.** Two packages of different kinds running the same runner share an overlay; one package running two runners has two.

**The per-tier targets are inferred, never declared** — a package gains a tier by having that tier's folder, not by writing a target for it.

**A `MODULE_SERVER` package has a second door, and the toolchain builds and publishes it with no setting in the package.** The rollup factory returns a second configuration when `src/remote/index.ts` exists, writing `dist/remote/index.esm.js`, `dist/remote/index.cjs` and `dist/remote/index.d.ts` beside the main output; the package's `rollup.config.js` stays one line. `spn-postbuild` writes `exports['./remote']` beside `exports['.']`, with `types` first, and refuses a manifest that names a file the build did not make. The check holds that `src/contract/` and `src/remote/` import nothing from the rest of the module. A door has one form in both manifests, a subpath of `exports`: the source manifest names `.`, `./remote` and `./package.json`, each pointing at source, and `spn-postbuild` replaces them with the built files and refuses a module that has `src/remote/index.ts` and does not name it. A service run from source loads its modules as ES modules and resolves `@saasplane/module-server-iam-ts/remote` from the manifest, reading no folder. The small folder `remote/package.json`, whose entry is `../src/remote/index.ts`, stays for the type checker of the server kinds, which resolves a subpath by folder.

**A package declares one script per command it answers, and nothing else.** An identical script list in every package was the older rule and it is replaced: a script for a tier the package does not have is a command that can only fail.

**A cached target names its inputs, and `default` alone is not enough.** A target with no dependency input ignores its dependencies entirely, so it replays a cached result after the thing it depends on changed. Probe a cache key with a real content change, never by touching a file.

**A kind, tier, phase or mutation scope is named from `@saasplane/toolchain-ts/contract`, never typed as a string.** The toolchain declares the five vocabularies once, as frozen enums; the CLI restates them as TypeScript enums and a drift test holds the two together.

**Root scripts are the repository's and are a different surface from a node's commands.** Reach for `spnutils apps check · test · format` before any `npx` or `pnpm` invocation.
