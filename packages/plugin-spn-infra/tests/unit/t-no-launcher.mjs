// spn-infra has no command line, so it ships no launcher and no tier declaration: a `bin/` here
// would put a name on the Bash tool's path that runs nothing, and a `tiers.json` would declare
// groups that do not exist.
import { existsSync } from "node:fs";
import { join } from "node:path";

const PLUGIN = join(import.meta.dirname, "..", "..");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== spn-infra ships neither a launcher nor a declaration of tiers");
ok("no src/bin/", !existsSync(join(PLUGIN, "src", "bin")));
ok("no src/tiers.json", !existsSync(join(PLUGIN, "src", "tiers.json")));
ok("no src/scripts/cli.ts, which is why", !existsSync(join(PLUGIN, "src", "scripts", "cli.ts")));

console.log(failed ? `\n  ${failed} of ${total} FAILED — no launcher` : `\n  all ${total} passed — no launcher`);
process.exit(failed ? 1 : 0);
