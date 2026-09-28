// The staleness case (`N101` step 4, `02-shape.md` § Tests mirror the source): every bundle this
// plugin ships must be newer than the sources it was built from. `hooks.json` now runs
// `dist/events/*.mjs` directly, and every skill and ref that runs a command names `dist/cli.mjs` — a
// bundle whose banner disagrees with the source hash is a hook or a command running rules nobody
// wrote.
import { join } from "node:path";
import { staleness } from "../../../plugin-support-lib/tests/helpers/staleness.mjs";

const PLUGIN = join(import.meta.dirname, "..", "..");
const SUPPORT_LIB = join(PLUGIN, "..", "plugin-support-lib");
const DIST = join(PLUGIN, "src", "dist");
const BUNDLES = [
  join(DIST, "cli.mjs"),
  join(DIST, "events", "orientation.mjs"),
  join(DIST, "events", "pretooluse.mjs"),
  join(DIST, "events", "closed.mjs"),
  join(DIST, "events", "stop.mjs"),
];

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== dist current — every bundle this plugin ships matches its own source hash");
const result = staleness(PLUGIN, SUPPORT_LIB, BUNDLES);
ok("cli.mjs and every events/*.mjs carry the plugin's current source hash", result.current === true,
  JSON.stringify(result));
for (const bundle of result.bundles)
  ok(`${bundle.path.slice(PLUGIN.length + 1)} is current`, bundle.current === true, JSON.stringify(bundle));

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-dist-current` : `\n  all ${total} passed — t-dist-current`);
process.exit(failed ? 1 : 0);
