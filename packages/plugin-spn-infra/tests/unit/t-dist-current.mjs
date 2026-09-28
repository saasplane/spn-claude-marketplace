// The staleness case (`N101` step 4, `02-shape.md` § Tests mirror the source): every bundle this
// plugin ships must be newer than the sources it was built from. `hooks.json` now runs
// `dist/events/pretooluse.mjs` directly — a bundle whose banner disagrees with the source hash is
// a hook running rules nobody wrote.
//
// spn-infra ships no `cli.ts` (it has no `commands/` to dispatch), so its one bundle is
// `dist/events/pretooluse.mjs` — the file this suite checks.
import { join } from "node:path";
import { staleness } from "../../../plugin-support-lib/tests/helpers/staleness.mjs";

const PLUGIN = join(import.meta.dirname, "..", "..");
const SUPPORT_LIB = join(PLUGIN, "..", "plugin-support-lib");
const BUNDLES = [join(PLUGIN, "src", "dist", "events", "pretooluse.mjs")];

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== dist current — every bundle this plugin ships matches its own source hash");
const result = staleness(PLUGIN, SUPPORT_LIB, BUNDLES);
ok("dist/events/pretooluse.mjs carries the plugin's current source hash", result.current === true,
  JSON.stringify(result));

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-dist-current` : `\n  all ${total} passed — t-dist-current`);
process.exit(failed ? 1 : 0);
