// One plugin's source hash — the value `scripts/build-plugins.mjs` stamps into every bundle's
// banner, and the value `plugin-support-lib/tests/helpers/staleness.mjs` recomputes to tell a
// current bundle from a stale one. Both call this same function, so the two can never drift apart —
// the whole point of a staleness check is that it reads what the build actually did, not a second
// opinion about it.
//
// `N101` step 2, `spn-foundation` docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md
// § The build a session commits: "Each bundle's banner carries a hash of the sources it was built
// from." That hash is one per PLUGIN, not one per entry — every bundle of a plugin (`cli.mjs` and
// every `events/*.mjs`) carries the same value, because a source edit anywhere under that plugin's
// own `scripts/` makes every one of its bundles stale, not only the bundle that happened to import
// the edited file.
//
// Deterministic on purpose: sorted paths, file bytes, never a modification time — the gate this
// arc names is "same sources → same bytes", and a hash that moved between two runs over an
// unchanged tree would fail it by itself.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set(["dist", "node_modules", ".git"]);

/** Every file under `dir`, sorted, dot-files and `SKIP_DIRS` left out. */
function walkFiles(dir) {
  const out = [];
  const walk = (at) => {
    let entries;
    try { entries = readdirSync(at, { withFileTypes: true }); } catch { return; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith(".")) continue;
      const full = join(at, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

// `plugin-support-lib/src/lib/<name>.ts`, imported by relative path from anywhere in a plugin's own
// `scripts/` tree (the depth of the `../` chain varies with how deep the importing file sits, so the
// match is on the fixed tail every such import shares, never on a fixed prefix).
const SUPPORT_LIB_IMPORT = /plugin-support-lib\/src\/lib\/([A-Za-z0-9_-]+\.ts)/g;

// A shared file's import of its sibling: `./<name>.ts`, as `timing.ts` imports `./docs-tree.ts`.
const SIBLING_IMPORT = /\b(?:from|import)\s*\(?\s*["']\.\/([A-Za-z0-9_-]+\.ts)["']/g;

/**
 * The `plugin-support-lib/src/lib/*.ts` files a plugin's bundle holds: each file its own source
 * imports, and each file those import in turn inside the shared folder. They are named by scanning
 * import specifiers, never by listing the whole shared folder, so a helper another plugin uses alone
 * cannot mark this one stale.
 */
function importedSupportLibFiles(scriptsFiles, supportLibDir) {
  const names = new Set();
  for (const file of scriptsFiles) {
    if (!file.endsWith(".ts")) continue;
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    for (const match of text.matchAll(SUPPORT_LIB_IMPORT)) names.add(match[1]);
  }
  // Each shared file is read once, so two that import each other end the walk.
  const pending = [...names];
  while (pending.length > 0) {
    let text;
    try { text = readFileSync(join(supportLibDir, pending.pop()), "utf8"); } catch { continue; }
    for (const match of text.matchAll(SIBLING_IMPORT)) {
      if (names.has(match[1])) continue;
      names.add(match[1]);
      pending.push(match[1]);
    }
  }
  return [...names].sort().map((name) => join(supportLibDir, name));
}

/**
 * One plugin's source hash: every file under its own `src/scripts/`, plus the
 * `plugin-support-lib/src/lib/*.ts` files that source imports, and the shared files those import.
 *
 * @param pluginDir     a plugin's package folder, e.g. `packages/plugin-spn-devex`
 * @param supportLibDir `packages/plugin-support-lib`
 * @returns a hex sha256, stable across runs for unchanged bytes
 */
export function pluginSourceHash(pluginDir, supportLibDir) {
  const hash = createHash("sha256");
  const scriptsDir = join(pluginDir, "src", "scripts");
  const scriptsFiles = walkFiles(scriptsDir);
  for (const file of scriptsFiles) {
    const bytes = readFileSync(file);
    hash.update(relative(pluginDir, file));
    hash.update("\0");
    hash.update(bytes);
    hash.update("\0");
  }
  const supportLibSrc = join(supportLibDir, "src", "lib");
  const libFiles = importedSupportLibFiles(scriptsFiles, supportLibSrc);
  for (const file of libFiles) {
    let bytes;
    try { bytes = readFileSync(file); } catch { bytes = Buffer.from("absent"); }
    hash.update(relative(supportLibDir, file));
    hash.update("\0");
    hash.update(bytes);
    hash.update("\0");
  }
  return hash.digest("hex");
}

/** The banner text a bundle carries. One line, grep-able, and never includes a build timestamp — two builds of the same sources must produce byte-identical output. */
export function bannerFor(sourceHash) {
  return `// spn-plugin-source-hash: ${sourceHash}\n` +
    `// generated by scripts/build-plugins.mjs — do not hand-edit; a source edit needs a rebuild, not a patch here\n`;
}

/** The hash a bundle's own banner carries, read back from its built bytes — null when the bundle carries no banner at all (never built, or built by something else). */
export const BANNER_HASH_RE = /spn-plugin-source-hash:\s*([0-9a-f]+)/;
export function bundledHash(bundleText) {
  const match = BANNER_HASH_RE.exec(bundleText);
  return match ? match[1] : null;
}
