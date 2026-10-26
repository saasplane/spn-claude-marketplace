// `.claude-plugin/plugin.json` — the manifest names only what the plugin ships. `plugin paths` reads
// the skills, the refs and the hooks and never the manifest, so a description that names a missing
// ref is caught here: each `refs/`, `skills/`, `scripts/`, `agents/` or `hooks/` path the
// description names resolves to a file or a folder under the plugin's `src/`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN } from "../helpers/harness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A path a description names: one of the plugin's own folders, then a path beneath it. */
const NAMED_PATH = /(?:refs|skills|scripts|agents|hooks|bin)\/[A-Za-z0-9_.\/-]+/g;

/** Every plugin path a description names, with the punctuation that ends its sentence removed. */
const pathsNamed = (description) =>
  [...new Set([...description.matchAll(NAMED_PATH)].map((found) => found[0].replace(/[.,;:]+$/, "")))];

/** The named paths that resolve to nothing under a plugin's `src/`. */
const missingUnder = (root, description) => pathsNamed(description).filter((one) => !existsSync(join(root, one)));

const ROOT = join(PLUGIN, "src");
const manifest = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf8"));

console.log("=== the manifest — its description names only what the plugin ships");
{
  const bad = "It carries refs/permission-vs-enablement.md, and refs/cross-repo.md states when work earns a workstream.";
  ok("[MKT.SCRIPTS.91] known-bad: a description that names a ref the plugin does not ship is caught, path by path",
    JSON.stringify(missingUnder(ROOT, bad)) === '["refs/permission-vs-enablement.md","refs/cross-repo.md"]', JSON.stringify(missingUnder(ROOT, bad)));
  const good = "The loop is in refs/devex/workspace/workstream.md, and the report skill is skills/report/SKILL.md.";
  ok("[MKT.SCRIPTS.91] a description that names files the plugin ships draws nothing", missingUnder(ROOT, good).length === 0, JSON.stringify(missingUnder(ROOT, good)));

  const missing = missingUnder(ROOT, manifest.description);
  ok("[MKT.SCRIPTS.91] every path this plugin's own description names is a file the plugin ships", missing.length === 0, `missing: ${missing.join(" · ")}`);
  ok("the description still names at least one of its refs, so the case reads something", pathsNamed(manifest.description).length > 0,
    JSON.stringify(pathsNamed(manifest.description)));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — manifest` : `\n  all ${total} passed — manifest`);
process.exit(failed ? 1 : 0);
