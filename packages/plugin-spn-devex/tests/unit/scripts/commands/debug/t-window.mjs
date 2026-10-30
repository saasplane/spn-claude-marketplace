// `debug window show <session|this>` and `debug window sweep` — the notes one window keeps in its folder, and the
// removal of each window folder nobody has written to for 14 days (RULE.DEVEX.WORKSPACE.322, .323).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug window` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "window", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-window-")));
const sessions = join(root, ".spndevex", ".debug", "sessions");
const put = (path, body, daysAgo = 0) => {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, body);
  if (daysAgo) { const when = new Date(Date.now() - daysAgo * 24 * 3600 * 1000); utimesSync(path, when, when); }
};
try {
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  put(join(sessions, "abc-1", "window.json"), JSON.stringify({ workstreams: ["031-compliance"] }));
  put(join(sessions, "abc-1", "tags.json"), JSON.stringify({ main: { workstream: "031-compliance", arc: "N008" } }));
  put(join(sessions, "abc-1", "mirror"), "plain words\n");
  put(join(sessions, "abc-1", "pending", "toolu_1.json"), JSON.stringify({ at: 1, background: false, found: [] }));

  console.log("=== show <session>");
  const shown = typed(root, "show", "abc-1");
  ok("it prints each note of the window's folder, by its path from it", shown.code === 0 && /window abc-1 — 4 note\(s\)/.test(shown.out)
    && /window\.json \(\d+ bytes\)/.test(shown.out) && /pending\/toolu_1\.json/.test(shown.out) && /plain words/.test(shown.out), shown.out);
  const data = JSON.parse(typed(root, "show", "abc-1", "--json").out);
  ok("the data form holds the notes, a json note parsed", data.session === "abc-1" && data.notes.length === 4
    && data.notes.find((one) => one.name === "window.json").content.workstreams[0] === "031-compliance"
    && data.notes.find((one) => one.name === "mirror").content === "plain words\n", JSON.stringify(data));
  const lost = typed(root, "show", "nobody");
  ok("a window with no folder is said, with exit 1", lost.code === 1 && lost.out.includes("no folder for window `nobody`"), lost.out);

  console.log("\n=== show this");
  const bare = typed(root, "show", "this");
  ok("with no start file for this command it is refused and names `debug window show <session>`", bare.code === 2
    && bare.out.includes("`debug window show <session>`") && bare.out.includes("usage: spn-devex debug window show <session|this> [--json]"), bare.out);
  const start = (subgroup, args) => JSON.stringify({ at: Date.now(), background: false, found: [{ script: "spn-devex", group: "debug", subgroup, action: "show", args, repo: null }] });
  put(join(sessions, "abc-1", "pending", "toolu_cost.json"), start("cost", "this"));
  ok("a start file of another command is not this one", typed(root, "show", "this").code === 2);
  put(join(sessions, "abc-1", "pending", "toolu_me.json"), start("window", "this"));
  const mine = JSON.parse(typed(root, "show", "this", "--json").out);
  ok("with one, this is the window whose folder holds it", mine.session === "abc-1" && mine.notes.length === 6, JSON.stringify(mine.notes.map((one) => one.name)));
  put(join(sessions, "xyz-2", "window.json"), "{}");
  put(join(sessions, "xyz-2", "pending", "toolu_newer.json"), start("window", "this --json"), 0);
  const later = new Date(Date.now() + 60_000);
  utimesSync(join(sessions, "xyz-2", "pending", "toolu_newer.json"), later, later);
  ok("the newest start file wins", JSON.parse(typed(root, "show", "this", "--json").out).session === "xyz-2");

  console.log("\n=== sweep");
  put(join(sessions, "old-1", "stop.json"), "{}", 20);
  put(join(sessions, "old-1", "pending", "t.json"), "{}", 30);
  put(join(sessions, "mixed-1", "name.json"), "{}", 40);
  put(join(sessions, "mixed-1", "tags.json"), "{}", 1);
  const swept = typed(root, "sweep");
  ok("it removes the folder whose newest write is past 14 days and prints its id", swept.code === 0 && swept.out.trim() === "removed old-1", swept.out);
  ok("and leaves a folder with one recent write, and the recent ones", !existsSync(join(sessions, "old-1")) && existsSync(join(sessions, "mixed-1")) && existsSync(join(sessions, "abc-1")));
  ok("a second sweep has nothing to remove", typed(root, "sweep").out.trim() === "nothing to remove");

  console.log("\n=== the words");
  const USAGE = "usage: spn-devex debug window show <session|this> [--json]\n       spn-devex debug window sweep\n";
  const option = typed(root, "show", "abc-1", "--tail");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2 and the usage line", option.code === 2
    && option.out === "usage: spn-devex debug window show <session|this> [--json]\n`debug window show` does not take `--tail`.\n", option.out);
  const second = typed(root, "show", "abc-1", "--json", "--all");
  ok("a second option is refused too", second.code === 2 && second.out.includes("does not take `--all`"), second.out);
  const missing = typed(root, "show");
  ok("a missing window is refused with the usage line", missing.code === 2 && missing.out.startsWith("usage: spn-devex debug window show") && missing.out.includes("takes one window"), missing.out);
  const json = typed(root, "sweep", "--json");
  ok("`sweep` takes no option, not even --json", json.code === 2 && json.out.includes("does not take `--json`"), json.out);
  const word = typed(root, "sweep", "abc-1");
  ok("and no word", word.code === 2 && word.out.includes("takes nothing after it"), word.out);
  const bareWord = typed(root);
  ok("with no action the entry lists both and says an action is owed", bareWord.code === 2 && bareWord.out.startsWith(USAGE) && bareWord.out.includes("`debug window` needs an action."), bareWord.out);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug window` : `\n  all ${total} passed — debug window`);
process.exit(failed ? 1 : 0);
