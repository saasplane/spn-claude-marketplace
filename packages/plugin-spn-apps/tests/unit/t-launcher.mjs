// The launcher `src/bin/spn-apps` and the declaration `src/tiers.json`, held to the code: the launcher
// answers as `dist/cli.mjs` does and the declared groups are the folders under `commands/`. The cases
// are `plugin-support-lib/tests/helpers/launcher-and-tiers.mjs`, shared with the other plugin that
// has a command line.
import { PLUGIN } from "../helpers/harness.mjs";
import { launcherCases, tiersCases } from "../../../plugin-support-lib/tests/helpers/launcher-and-tiers.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== the launcher runs the entry");
launcherCases(ok, PLUGIN, "spn-apps");

console.log("\n=== tiers.json declares the groups the code ships");
tiersCases(ok, PLUGIN);

console.log(failed ? `\n  ${failed} of ${total} FAILED — launcher and tiers` : `\n  all ${total} passed — launcher and tiers`);
process.exit(failed ? 1 : 0);
