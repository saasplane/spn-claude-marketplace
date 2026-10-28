// `debug hooks show` — every hook check's runs, time, notes and refusals, then every event's runs, time and bytes put
// into the context, always both (RD.DEVEX.WORKSPACE.323), read from the rotated log and the live one.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug hooks` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "hooks", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const line = (extra) => JSON.stringify({ script: "spn-devex", group: null, subgroup: null, action: null, args: null, event: "PreToolUse", tool: "Bash", ms: 10, exit: null,
  at: "2026-10-10T10:00:00Z", repo: null, pid: 1, verdict: "pass", out: null, session: "s1", agent: null, ...extra });
const check = (group, action, verdict, ms, out) => line({ group, action, verdict, ms, out });
const whole = (event, verdict, ms, out) => line({ group: "events", action: event.toLowerCase(), event, verdict, ms, out });

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-hooks-")));
try {
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  const none = typed(root, "show");
  ok("with no telemetry it says so and exits 0", none.code === 0 && /no hook telemetry/.test(none.out), none.out);
  const empty = JSON.parse(typed(root, "show", "--json").out);
  ok("and the data form still holds both parts, empty", Array.isArray(empty.checks) && Array.isArray(empty.events) && !empty.checks.length && !empty.events.length);

  const telemetry = join(root, ".spndevex", ".debug", "telemetry");
  mkdirSync(telemetry, { recursive: true });
  writeFileSync(join(telemetry, "hooks.1.jsonl"), [
    check("docs-face", "docs-face", "note", 5, 120),
    whole("PreToolUse", "note", 40, 120),
    "{ torn line",
  ].join("\n") + "\n");
  writeFileSync(join(telemetry, "hooks.jsonl"), [
    check("docs-face", "docs-face", "pass", 3, null),
    check("docs-face", "docs-face", "deny", 4, 300),
    check("split-plan", "close", "note", 20, 50),
    whole("PreToolUse", "deny", 60, 300),
    whole("Stop", "pass", 100, null),
    // A command's line and a command's whole run carry no verdict: they are neither a check nor an event.
    line({ script: "git", group: null, action: "status", event: "command", ms: 900, exit: 0, verdict: null, out: 77 }),
    line({ group: "cli", action: "cli", event: "command", ms: 300, exit: 0, verdict: null }),
  ].join("\n") + "\n");

  console.log("=== the data form");
  const data = JSON.parse(typed(root, "show", "--json").out);
  const docs = data.checks.find((one) => one.group === "docs-face");
  ok("a check is one row over script, group and action, the rotated and the live log both read",
    docs.script === "spn-devex" && docs.action === "docs-face" && docs.runs === 3, JSON.stringify(docs));
  ok("with its time, its notes, its refusals and the bytes it put into the context", docs.ms === 12 && docs.notes === 1 && docs.denies === 1 && docs.out === 420, JSON.stringify(docs));
  ok("a check of another file is its own row", data.checks.find((one) => one.group === "split-plan" && one.action === "close")?.runs === 1);
  ok("the costliest check is first", data.checks[0].group === "split-plan");
  ok("a command's lines are no check", data.checks.length === 2, JSON.stringify(data.checks.map((one) => one.group)));
  const pre = data.events.find((one) => one.event === "PreToolUse");
  ok("an event is one row of its whole runs: runs, time and bytes", pre.runs === 2 && pre.ms === 100 && pre.out === 420, JSON.stringify(pre));
  ok("and the events are listed beside the checks", data.events.length === 2 && data.events.some((one) => one.event === "Stop" && one.out === 0));

  console.log("\n=== the printed form");
  const printed = typed(root, "show").out;
  ok("it prints the checks, then the events, always both", printed.indexOf("Check") >= 0 && printed.indexOf("Event") > printed.indexOf("Check")
    && /spn-devex › docs-face › docs-face/.test(printed) && /PreToolUse/.test(printed) && /Out bytes/.test(printed), printed);

  console.log("\n=== the words");
  const USAGE = "usage: spn-devex debug hooks show [--json]\n";
  const option = typed(root, "show", "--since", "1");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2 and the usage line", option.code === 2 && option.out === USAGE + "`debug hooks show` does not take `--since`.\n", option.out);
  const second = typed(root, "show", "--json", "--top");
  ok("a second option is refused too", second.code === 2 && second.out.includes("does not take `--top`"), second.out);
  const target = typed(root, "show", "all");
  ok("a target is refused", target.code === 2 && target.out.startsWith(USAGE) && target.out.includes("takes no target"), target.out);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug hooks` : `\n  all ${total} passed — debug hooks`);
process.exit(failed ? 1 : 0);
