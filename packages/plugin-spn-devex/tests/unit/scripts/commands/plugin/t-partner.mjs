// `plugin partner` — proves every hook survives a repo carrying only what a partner has. This case
// is about `pluginRoot`'s own folder resolution, which is the part most likely to silently break: it
// must find a plugin's `src/<folder>` whether the checkout names the folder by the plugin's bare
// `name` (a partner's installed cache) or by `plugin-<name>` (this checkout's own `packages/`) — a
// resolver that tries only one spelling reads every hook in the real sweep as `not found`.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { declared, HOOK_SCRIPT } from "../../../../../src/scripts/commands/plugin/partner.ts";

const TOOL = join(PLUGIN, "src", "scripts", "commands", "plugin", "partner.ts");
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== plugin partner — declared()'s regex matches today's hooks.json shape");
{
  // KNOWN-BAD FIRST. No plugin's `hooks.json` writes a command in this shape — a bare
  // `/hooks/<Event>/<script>` segment — so a regex that matched it would be matching nothing any
  // real file carries. Kept as the known-bad: a pattern broadened without meaning to would start
  // matching it, and a pattern narrowed wrong would still miss the two shapes every plugin ships.
  const unshippedShape = 'node "${CLAUDE_PLUGIN_ROOT}"/hooks/PreToolUse/pretooluse.py';
  ok("a bare hooks/<Event>/<script> segment is not matched",
    [...unshippedShape.matchAll(HOOK_SCRIPT)].length === 0);

  const sourceShape = 'node "${CLAUDE_PLUGIN_ROOT}"/scripts/events/pretooluse.ts';
  ok("today's source shape (scripts/events/*.ts) is matched, naming the script",
    [...sourceShape.matchAll(HOOK_SCRIPT)].map((m) => m[1]).join() === "pretooluse.ts");

  const bundledShape = 'node "${CLAUDE_PLUGIN_ROOT}"/dist/events/pretooluse.mjs';
  ok("today's bundled shape (dist/events/*.mjs) is matched, naming the script",
    [...bundledShape.matchAll(HOOK_SCRIPT)].map((m) => m[1]).join() === "pretooluse.mjs");

  // THE REGRESSION THIS WHOLE FIX WAS FOUND OVER: `declared()` also climbed one folder short to find
  // `packages/` and read `hooks/hooks.json` instead of `src/hooks/hooks.json`, so even a correct
  // regex found zero files to match against. Proven against the real checkout, because a fixture
  // cannot fabricate the sibling-plugin tree this walk exists to cross.
  const found = declared();
  ok("declared() finds at least one real hook across the sibling plugins, not zero",
    found.length > 0, JSON.stringify(found.slice(0, 5)));
  ok("a found entry names a bare plugin (spn-devex), never its packages/ folder name",
    found.every(([plugin]) => !plugin.startsWith("plugin-")), JSON.stringify(found.slice(0, 5)));
}

console.log("\n=== plugin partner — the real sweep, against this checkout");
{
  // The integration proof: every hook this plugin and spn-apps ship survives a fixture holding only
  // what a partner has. Run from the real checkout, because a fixture cannot fabricate the plugin
  // tree this check exists to sweep.
  let out = "", code = 0;
  try { out = execFileSync("node", [TOOL], { encoding: "utf8", cwd: PLUGIN }); }
  catch (e) { out = String(e.stdout ?? ""); code = e.status ?? 1; }
  ok("every declared hook is found and none crashes in the fixture",
    code === 0 && out.includes("hook run(s) — every one survives a repo with no foundation"), out.slice(-400));
  ok("and the declared count is now non-zero, printed in the summary",
    code === 0 && !/^0 declared script/m.test(out), out.slice(-400));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin partner` : `\n  all ${total} passed — plugin partner`);
process.exit(failed ? 1 : 0);
