// `plugin partner` — proves every hook survives a repo carrying only what a partner has. This case
// is about `pluginRoot`'s own folder resolution, which is the part most likely to silently break: it
// must find a plugin's `src/<folder>` whether the checkout names the folder by the plugin's bare
// `name` (a partner's installed cache) or by `plugin-<name>` (this checkout's own `packages/`) — the
// bug this test would have caught: after the `plugins/` → `packages/plugin-spn-*` move, every hook
// in the real sweep read `not found`, because only the bare-name spelling was tried.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "commands", "plugin", "partner.ts");
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== plugin partner — the real sweep, against this checkout");
{
  // The integration proof: every hook this plugin and spn-apps ship survives a fixture holding only
  // what a partner has. Run from the real checkout, because a fixture cannot fabricate the plugin
  // tree this check exists to sweep.
  let out = "", code = 0;
  try { out = execFileSync("node", [TOOL], { encoding: "utf8", cwd: PLUGIN }); }
  catch (e) { out = String(e.stdout ?? ""); code = e.status ?? 1; }
  ok("every declared hook is found and none crashes in the fixture",
    code === 0 && out.includes("hook run(s) — every one survives a repo with no foundation"), out.slice(-400));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin partner` : `\n  all ${total} passed — plugin partner`);
process.exit(failed ? 1 : 0);
