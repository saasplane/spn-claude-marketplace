#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// The one command that builds the shared stylesheet every page loads.
//
//     node scripts/build-styles.mjs            build `sds-docs.css` from `sds-docs.src.css`
//     node scripts/build-styles.mjs --check    build to a scratch file, and exit 1 where it differs
//
// THE SOURCE IS `packages/plugin-spn-devex/src/styles/sds-docs.src.css`, in which our tokens are
// Tailwind's theme and our named classes use its utilities by `@apply`. Tailwind's command-line tool
// builds `sds-docs.css` beside it. The two scripts, `sds-docs.js` and `sds-index.js`, are written by
// hand and are not built.
//
// TAILWIND IS A DEVELOPMENT DEPENDENCY OF THIS REPOSITORY'S ROOT, pinned to one version, beside
// esbuild. It is never a dependency of a plugin: an installed plugin holds the built file and never
// runs the tool.
//
// DETERMINISTIC ON PURPOSE. The tool writes no time into the file, so two builds of one source are
// the same bytes. `--check` is how a test tells a built file that fell behind its source.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const STYLES = join(ROOT, "packages", "plugin-spn-devex", "src", "styles");
const SOURCE = join(STYLES, "sds-docs.src.css");
const BUILT = join(STYLES, "sds-docs.css");
const TOOL = join(ROOT, "node_modules", ".bin", "tailwindcss");

if (!existsSync(TOOL)) {
  console.error("Tailwind's command-line tool is not installed. Run `pnpm install` in the repository's root.");
  process.exit(2);
}

/** Build the source into `target`. The tool runs beside the source, so its own imports resolve. */
function build(target) {
  execFileSync(TOOL, ["-i", SOURCE, "-o", target], { cwd: STYLES, stdio: ["ignore", "pipe", "pipe"] });
}

if (process.argv.includes("--check")) {
  const scratch = mkdtempSync(join(tmpdir(), "sds-build-"));
  const fresh = join(scratch, "sds-docs.css");
  try {
    build(fresh);
    const same = existsSync(BUILT) && readFileSync(BUILT).equals(readFileSync(fresh));
    console.log(same
      ? "sds-docs.css is current: a fresh build writes the same bytes"
      : "sds-docs.css is behind its source: run `node scripts/build-styles.mjs`");
    process.exitCode = same ? 0 : 1;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
} else {
  build(BUILT);
  console.log(`built ${BUILT.slice(ROOT.length + 1)} — ${readFileSync(BUILT).length} bytes`);
}
