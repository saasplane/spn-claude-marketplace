// `plugin partner check` — proves every hook survives a repo carrying only what a partner has. These cases
// are about where the proof finds a plugin's files, which is the part most likely to silently break.
// A checkout keeps each plugin under `packages/plugin-<name>/src/`, with its sources beside its
// bundles. An installed plugin's root holds `dist/`, `scripts/` and `hooks/` and no `src/` folder,
// and there the proof runs the bundled hooks. A resolver that knows one layout reads every hook of
// the other as `not found`.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { declared, HOOK_SCRIPT, main, pluginHomes } from "../../../../../src/scripts/commands/plugin/partner.ts";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
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
  try { out = execFileSync("node", [TOOL, "plugin", "partner", "check"], { encoding: "utf8", cwd: PLUGIN, stdio: "pipe", env: ENV }); }
  catch (e) { out = String(e.stdout ?? ""); code = e.status ?? 1; }
  ok("every declared hook is found and none crashes in the fixture",
    code === 0 && out.includes("hook run(s) — every one survives a repo with no foundation"), out.slice(-400));
  ok("and the declared count is now non-zero, printed in the summary",
    code === 0 && !/^0 declared script/m.test(out), out.slice(-400));
  ok("[MKT.SCRIPTS.172] a command is swept through the entry, by its words, and each one is found",
    out.includes("✔ scripts/cli.ts restates check") && out.includes("✔ scripts/cli.ts docs prose list ."), out.slice(0, 600));

  const typed = (...words) => {
    try { return { out: execFileSync("node", [TOOL, "plugin", "partner", ...words], { encoding: "utf8", cwd: PLUGIN, stdio: "pipe", env: ENV }), code: 0 }; }
    catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
  };
  const USAGE = "usage: spn-devex plugin partner check [--keep]\n";
  ok("[MKT.SCRIPTS.111] with no action the entry prints the usage line and says an action is owed",
    typed().code === 2 && typed().out === USAGE + "`plugin partner` needs an action.\n", typed().out);
  ok("[MKT.SCRIPTS.111] `--keep` alone is no action, and is refused with exit 2", typed("--keep").code === 2 && typed("--keep").out.startsWith(USAGE));
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2",
    typed("check", "--json").code === 2 && typed("check", "--json").out === USAGE + "`plugin partner check` does not take `--json`.\n", typed("check", "--json").out);
  ok("a path is refused with exit 2, because the proof builds its own fixture",
    typed("check", ".").code === 2 && typed("check", ".").out.includes("takes no path"), typed("check", ".").out);
}

console.log("\n=== plugin partner — from an installed plugin, which has no `src/` folder");
{
  const BASE = mkdtempSync(join(tmpdir(), "partner-installed-"));
  const hooksJson = (...scripts) => JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Write", hooks:
    scripts.map((script) => ({ type: "command", command: `node "\${CLAUDE_PLUGIN_ROOT}"/dist/events/${script}` })) }] } });
  let made = 0;
  /** An install cache: `<cache>/saasplane/<plugin>/<version>/…`, from a flat path map. Returns the folder the bundled command runs from. */
  const cache = (files) => {
    made += 1;
    const family = join(BASE, `cache-${made}`, "saasplane");
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(family, path)), { recursive: true });
      writeFileSync(join(family, path), body, "utf8");
    }
    const here = join(family, "spn-devex", "9.9.9", "dist", "commands", "plugin");
    mkdirSync(here, { recursive: true });
    return here;
  };
  /** One run of the proof from `here`, with what it printed. */
  const proof = (here) => {
    const lines = [];
    const realLog = console.log;
    console.log = (...args) => lines.push(args.join(" "));
    let code;
    try { code = main(false, here); } finally { console.log = realLog; }
    return { code, out: lines.join("\n") };
  };
  const QUIET = "process.exit(0);\n";
  const installed = {
    "spn-devex/9.9.9/hooks/hooks.json": hooksJson("pretooluse.mjs", "stop.mjs"),
    "spn-devex/9.9.9/dist/events/pretooluse.mjs": QUIET,
    "spn-devex/9.9.9/dist/events/stop.mjs": QUIET,
    // The source ships too, and cannot run there: its imports name a folder only the checkout has.
    "spn-devex/9.9.9/scripts/events/pretooluse.ts": 'import "../../../../plugin-support-lib/src/lib/payload.ts";\n',
    "spn-apps/9.9.9/hooks/hooks.json": hooksJson("pretooluse.mjs"),
    "spn-apps/9.9.9/dist/events/pretooluse.mjs": QUIET,
    // An older version of a sibling plugin, which is never the one read.
    "spn-apps/9.9.8/hooks/hooks.json": hooksJson("retired.mjs"),
  };
  try {
    const here = cache(installed);
    const homes = pluginHomes(here);
    ok("[MKT.SCRIPTS.90] an installed plugin is found by its version folder, each sibling at the same version",
      homes.map((home) => `${home.name} ${home.root.split("/").slice(-2).join("/")} ${home.installed}`).join(" | ")
        === "spn-apps spn-apps/9.9.9 true | spn-devex spn-devex/9.9.9 true", JSON.stringify(homes));
    const clean = proof(here);
    ok("[MKT.SCRIPTS.90] the proof runs the bundled hooks, and reports that each one survives",
      clean.code === 0 && clean.out.includes("3 hook run(s) — every one survives a repo with no foundation"), clean.out);
    ok("[MKT.SCRIPTS.90] every script a hooks.json declares is found in `dist/`",
      clean.out.includes("3 declared script(s) — every one present") && !clean.out.includes("not found"), clean.out);
    ok("[MKT.SCRIPTS.90] the shipped source is not run there", !clean.out.includes(".ts"), clean.out);

    const crashing = proof(cache({ ...installed, "spn-devex/9.9.9/dist/events/stop.mjs": 'throw new Error("a hook that needs the book");\n' }));
    ok("[MKT.SCRIPTS.90] known-bad: a bundled hook that crashes in the fixture fails the proof, by name",
      crashing.code === 1 && crashing.out.includes("✘ spn-devex dist/events/stop.mjs"), crashing.out);
    const nothing = proof(join(BASE, "holds", "no", "plugin", "at", "all"));
    ok("[MKT.SCRIPTS.90] known-bad: a sweep that finds no plugin fails, and never reports that every hook survives",
      nothing.code === 1 && !nothing.out.includes("every one survives"), nothing.out);
    const undeclared = proof(cache({ ...installed, "spn-apps/9.9.9/hooks/hooks.json": hooksJson("pretooluse.mjs", "ghost.mjs") }));
    ok("[MKT.SCRIPTS.90] known-bad: a hook declared with no bundle behind it fails the proof",
      undeclared.code === 1 && undeclared.out.includes("spn-apps/ghost.mjs — declared, no file"), undeclared.out);
  } finally {
    rmSync(BASE, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin partner` : `\n  all ${total} passed — plugin partner`);
process.exit(failed ? 1 : 0);
