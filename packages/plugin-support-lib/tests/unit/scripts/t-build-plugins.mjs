// The plugins build, `scripts/build-plugins.mjs`, run in a temporary checkout with a stub esbuild, never the real one.
// It builds on the esbuild version `pnpm-lock.yaml` pins, or it does not build: two checkouts holding two versions
// would write two sets of bundles from the same sources.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "../../../../..");
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A checkout holding the build script, a lockfile pinning 0.25.12, one plugin to bundle, and an esbuild of the version given. */
function checkout(installed) {
  const root = mkdtempSync(join(tmpdir(), "build-plugins-"));
  for (const file of ["scripts/build-plugins.mjs", "scripts/lib/source-hash.mjs"]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(REPO, file), join(root, file));
  }
  writeFileSync(join(root, "package.json"), '{ "name": "fixture", "type": "module" }\n');
  writeFileSync(join(root, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\n\nimporters:\n\n  .:\n    devDependencies:\n      esbuild:\n        specifier: 0.25.12\n        version: 0.25.12\n");
  // One plugin with an entry to bundle, so a build that goes on has something to build.
  mkdirSync(join(root, "packages", "plugin-spn-devex", "src", "scripts"), { recursive: true });
  writeFileSync(join(root, "packages", "plugin-spn-devex", "src", "scripts", "cli.ts"), "export {};\n");
  mkdirSync(join(root, "packages", "plugin-support-lib", "src", "lib"), { recursive: true });
  const stub = join(root, "node_modules", "esbuild");
  mkdirSync(stub, { recursive: true });
  writeFileSync(join(stub, "package.json"), `{ "name": "esbuild", "version": "${installed}", "type": "module", "main": "index.js" }\n`);
  writeFileSync(join(stub, "index.js"), `export const version = "${installed}";\nexport const build = async () => ({ metafile: { outputs: {} } });\n`);
  return root;
}
const build = (root) => spawnSync(process.execPath, [join(root, "scripts", "build-plugins.mjs")], { cwd: root, encoding: "utf8" });

console.log("=== the build runs on the esbuild the lockfile pins");
{
  const root = checkout("0.24.2");
  try {
    const result = build(root);
    ok("[MKT.SCRIPTS.210] another version installed: the build exits 2", result.status === 2, `${result.status} ${result.stderr}`);
    ok("[MKT.SCRIPTS.210] and it names the installed version, the pinned one and the install that fixes it",
      result.stderr.includes("esbuild 0.24.2 is installed and the lockfile pins 0.25.12") && result.stderr.includes("pnpm install --frozen-lockfile"), result.stderr);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
{
  const root = checkout("0.25.12");
  try {
    const result = build(root);
    ok("[MKT.SCRIPTS.210] the pinned version installed: the build goes on and exits 0", result.status === 0, `${result.status} ${result.stderr} ${result.stdout}`);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — build plugins` : `\n  all ${total} passed — build plugins`);
process.exit(failed ? 1 : 0);
