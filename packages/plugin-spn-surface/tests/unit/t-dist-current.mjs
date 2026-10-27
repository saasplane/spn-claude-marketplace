// The staleness case (`N101` step 4) — every bundle this plugin ships must be newer than the
// sources it was built from. `hooks.json` runs `dist/events/pretooluse.mjs` and never the source,
// so a bundle a rebuild forgot is a rule nobody wrote running in a live session.
//
// The comparison is `plugin-support-lib/tests/helpers/staleness.mjs`, which recomputes this
// plugin's source hash with the same function `scripts/build-plugins.mjs` uses to write each
// bundle's banner — one implementation, so the build and this case can never quietly disagree.
import { PLUGIN } from "../helpers/harness.mjs";
import { resolve } from "node:path";
import { staleness } from "../../../plugin-support-lib/tests/helpers/staleness.mjs";

const SUPPORT_LIB_DIR = resolve(PLUGIN, "..", "plugin-support-lib");
const BUNDLES = [
  resolve(PLUGIN, "src", "dist", "cli.mjs"),
  resolve(PLUGIN, "src", "dist", "events", "pretooluse.mjs"),
];

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const result = staleness(PLUGIN, SUPPORT_LIB_DIR, BUNDLES);

console.log("=== dist — every bundle is current with its sources");

ok("both shipped bundles carry a readable banner",
   result.bundles.every((b) => b.found !== null),
   result.bundles.map((b) => `${b.path}: ${b.found ?? "no banner"}`).join("\n        "));

ok("both bundles' banners match the source hash right now",
   result.current,
   `expected ${result.expected}\n        ` +
     result.bundles.map((b) => `${b.path}: ${b.found} ${b.current ? "(current)" : "(STALE)"}`).join("\n        "));

console.log(failed ? `\n  ${failed} of ${total} FAILED — dist staleness` : `\n  all ${total} passed — dist staleness`);
process.exit(failed ? 1 : 0);
