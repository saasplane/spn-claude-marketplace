// `debug cost show <target>` — what a target cost, read from `usage.jsonl` alone (RULE.DEVEX.AGENT.082,
// RULE.DEVEX.WORKSPACE.323): the five targets, each reply once, the rotated log and the live one, money from the
// price table and null for a model it lacks, and the window the command runs in found from its start file.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug cost` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "cost", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
const json = (root, target) => JSON.parse(typed(root, "show", target, "--json").out);
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const OPUS = "claude-opus-4-6-20260101", SONNET = "claude-sonnet-5-5";
let seq = 0;
const reply = (extra) => JSON.stringify({ at: "2026-10-10T10:00:00Z", session: "s1", agent: null, workstream: "031-compliance", arc: "N008", order: null, row: "50",
  turn: `m${(seq += 1)}`, model: OPUS, ms: 60000, input: 1000, cache_read: 2000, cache_write: 3000, output: 400, ...extra });

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-cost-")));
try {
  const telemetry = join(root, ".spndevex", ".debug", "telemetry");
  mkdirSync(telemetry, { recursive: true });
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  // The rotated log first: older replies, one of which the live log repeats.
  const repeated = reply({ at: "2026-10-01T08:00:00Z", turn: "rotated-and-live", workstream: "030-older", arc: "N001", row: "1" });
  writeFileSync(join(telemetry, "usage.1.jsonl"), [
    repeated,
    reply({ at: "2026-10-01T09:00:00Z", workstream: "030-older", arc: "N001", row: "2" }),
    "{ not json — a torn line",
  ].join("\n") + "\n");
  const million = { input: 1e6, cache_read: 1e6, cache_write: 1e6, output: 1e6 };
  writeFileSync(join(telemetry, "usage.jsonl"), [
    repeated,
    reply({ turn: "same-reply", order: "39-plugin", ...million }),
    reply({ turn: "same-reply", order: "39-plugin", ...million }),
    reply({ order: "38-layout", row: "49", model: SONNET }),
    reply({ arc: "N009", row: "7", model: "claude-mystery-9" }),
    reply({ workstream: "032-other", arc: "N001", row: "1", session: "s2" }),
    reply({ agent: "agent-aaa", order: "39-plugin", session: "s1", model: SONNET }),
    reply({ agent: "agent-bbb", order: "39-plugin", session: "s1", model: SONNET }),
    reply({ agent: "agent-aaa", order: "39-plugin", session: "s2", model: SONNET }),
  ].join("\n") + "\n");

  console.log("=== all — one line for each workstream");
  {
    const all = json(root, "all");
    const by = Object.fromEntries(all.rows.map((one) => [one.key, one]));
    ok("each workstream is a line, the older one from the rotated log first",
      all.rows.map((one) => one.key).join(" ") === "030-older 031-compliance 032-other", all.rows.map((one) => one.key).join(" "));
    ok("a reply in both logs is counted once, and a reply repeated across lines once", by["030-older"].replies === 2 && by["031-compliance"].replies === 6,
      JSON.stringify([by["030-older"].replies, by["031-compliance"].replies]));
    ok("the torn line is skipped without a crash", all.rows.reduce((sum, one) => sum + one.replies, 0) === 9);
    ok("the earliest time is the first line of the rotated log", all.earliest === "2026-10-01T08:00:00Z", String(all.earliest));
    ok("the output says money is an estimate and dates the prices", all.estimate === true && all.pricesAsOf === "2026-10-06");
    ok("a line carries the four counts, the model time and the model", by["032-other"].input === 1000 && by["032-other"].cacheRead === 2000
      && by["032-other"].cacheWrite === 3000 && by["032-other"].output === 400 && by["032-other"].modelMs === 60000
      && by["032-other"].models.join() === OPUS, JSON.stringify(by["032-other"]));
    ok("money is the table's price of the counts, a date-suffixed id matching its base", Math.abs(by["032-other"].money - (1000 * 5 + 3000 * 6.25 + 2000 * 0.5 + 400 * 25) / 1e6) < 1e-9,
      String(by["032-other"].money));
    ok("a line holding a model the table lacks has money null, never a guess", by["031-compliance"].money === null && by["031-compliance"].models.includes("claude-mystery-9"));
    const printed = typed(root, "show", "all").out;
    ok("the printed table names the unknown money and says the prices are an estimate", /unknown/.test(printed) && /estimate/.test(printed) && /2026-10-01T08:00:00Z/.test(printed), printed);
  }

  console.log("\n=== <workstream> — one line for each arc");
  {
    const ws = json(root, "031-compliance");
    ok("an arc is a line", ws.rows.map((one) => one.key).join(" ") === "N008 N009", ws.rows.map((one) => one.key).join(" "));
    ok("the workstream's number names it too", json(root, "031").rows.length === 2);
    ok("a workstream no line names has no rows", json(root, "099-none").rows.length === 0);
    ok("and the printed form says so", /no usage for `099-none`/.test(typed(root, "show", "099-none").out));
  }

  console.log("\n=== <workstream>/N<nnn> — one line for each row and order");
  {
    const arc = json(root, "031-compliance/N008");
    const keys = arc.rows.map((one) => one.key);
    ok("a row and its order is one line", keys.join(" | ") === "row 50 · order 39-plugin | row 49 · order 38-layout", keys.join(" | "));
    const order39 = arc.rows.find((one) => one.key === "row 50 · order 39-plugin");
    ok("an order's line sums the replies of the window and of its children, once each", order39.replies === 4, String(order39.replies));
    ok("the arc's id is read in either case", json(root, "031-compliance/n008").rows.length === arc.rows.length);
  }

  console.log("\n=== window/<session> — the window and each child");
  {
    const window = json(root, "window/s1");
    ok("the window is the first line and each child its own", window.rows.map((one) => one.key).join(" ") === "window child agent-aaa child agent-bbb",
      window.rows.map((one) => one.key).join(" "));
    ok("another window's replies are not counted", window.rows.find((one) => one.key === "child agent-aaa").replies === 1);
  }

  console.log("\n=== window/this — the window the command runs in");
  {
    const none = typed(root, "show", "window/this");
    ok("with no start file for this command it is refused and names `debug window show <session>`", none.code === 2
      && none.out.includes("`debug window show <session>`") && none.out.includes("usage: spn-devex debug cost show <target> [--json]"), none.out);
    const pending = join(root, ".spndevex", ".debug", "sessions", "s2", "pending");
    mkdirSync(pending, { recursive: true });
    const start = (args) => JSON.stringify({ at: Date.now(), background: false, found: [{ script: "spn-devex", group: "debug", subgroup: "cost", action: "show", args, repo: null }] });
    writeFileSync(join(pending, "toolu_other.json"), start("all"));
    ok("a start file of another command is not this one", typed(root, "show", "window/this").code === 2);
    writeFileSync(join(pending, "toolu_this.json"), start("window/this --json"));
    const found = json(root, "window/this");
    ok("with one, the window is the one whose folder holds it", found.rows.map((one) => one.key).join(" ") === "window child agent-aaa", found.rows.map((one) => one.key).join(" "));
    const newer = join(root, ".spndevex", ".debug", "sessions", "s1", "pending");
    mkdirSync(newer, { recursive: true });
    const later = new Date(Date.now() + 60_000);
    writeFileSync(join(newer, "toolu_newest.json"), start("window/this --json"));
    utimesSync(join(newer, "toolu_newest.json"), later, later);
    ok("the newest of several is the window", json(root, "window/this").rows.map((one) => one.key).join(" ") === "window child agent-aaa child agent-bbb");
  }

  console.log("\n=== <workstream> — the split of a recorded day, from the hooks log alone");
  {
    // One day of one arc: 20 edits, 6 proof runs, 40 workstream commands, 8 refused calls and 3 waits of 20 minutes, each call 30 seconds after the last.
    let clock = Date.parse("2026-10-31T10:00:00Z");
    const stamp = () => new Date(clock).toISOString().slice(0, 19) + "Z";
    const lines = [];
    const base = (row) => ({ ms: 5, exit: null, pid: 1, out: null, session: "d1", agent: null, workstream: "040-split", arc: "N011", order: null, row, repo: null });
    const post = (tool, row, extra = {}) => lines.push({ ...base(row), script: "spn-devex", group: "events", subgroup: null, action: null, args: null, event: "PostToolUse", tool, at: stamp(), verdict: "pass", ...extra });
    const command = (row, entry) => lines.push({ ...base(row), subgroup: null, event: "command", tool: "Bash", at: stamp(), verdict: null, programs: 1, ...entry });
    const step = (seconds) => { clock += seconds * 1000; };
    const wait = () => { step(20 * 60); };
    let n = 0;
    const rowOf = () => ((n += 1) % 2 ? "1" : "2");
    for (let i = 0; i < 20; i += 1) { step(30); post("Edit", rowOf()); }
    for (let i = 0; i < 6; i += 1) { step(30); const row = rowOf(); command(row, { script: "spnutils", group: "test", action: "run", args: "unit" }); post("Bash", row); }
    for (let i = 0; i < 40; i += 1) { step(30); const row = rowOf(); command(row, { script: "spn-devex", group: "workstream", action: "row", args: "show" }); post("Bash", row); if (i % 13 === 12) wait(); }
    for (let i = 0; i < 8; i += 1) { step(30); lines.push({ ...base(rowOf()), script: "spn-devex", group: "events", subgroup: null, action: null, args: null, event: "PreToolUse", tool: "Bash", at: stamp(), verdict: "deny" }); }
    writeFileSync(join(telemetry, "hooks.jsonl"), lines.map((one) => JSON.stringify(one)).join("\n") + "\n");
    const split = json(root, "040-split").split;
    const arc = (split ?? []).find((one) => one.key === "N011");
    const near = (got, want) => got !== undefined && Math.abs(got - want) <= want * 0.1;
    ok("[MKT.HOOKS.321] each arc is split into change, proof, managing, refusals and waiting, calls within 10% of the day", !!arc
      && near(arc.change?.calls, 20) && near(arc.proof?.calls, 6) && near(arc.managing?.calls, 40) && near(arc.refusals?.calls, 8) && near(arc.waiting?.calls, 3), JSON.stringify(arc));
    ok("[MKT.HOOKS.321] and the minutes within 10%, the waits apart from the work", !!arc
      && near(arc.change?.minutes, 10) && near(arc.proof?.minutes, 3) && near(arc.managing?.minutes, 20) && near(arc.refusals?.minutes, 4) && near(arc.waiting?.minutes, 60), JSON.stringify(arc));
    ok("[MKT.HOOKS.321] each row of the arc is split too", (split ?? []).filter((one) => /^N011 · row \d$/.test(one.key)).length === 2, JSON.stringify((split ?? []).map((one) => one.key)));
    const printed = typed(root, "show", "040-split").out;
    ok("[MKT.HOOKS.321] the printed form names the five classes", ["change", "proof", "managing", "refusals", "waiting"].every((word) => printed.includes(word)) && /N011 · row 1/.test(printed), printed);
  }

  console.log("\n=== the words");
  {
    const USAGE = "usage: spn-devex debug cost show <target> [--json]\n";
    const option = typed(root, "show", "all", "--by", "arc");
    ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2 and the usage line", option.code === 2 && option.out === USAGE + "`debug cost show` does not take `--by`.\n", option.out);
    const second = typed(root, "show", "all", "--json", "--since");
    ok("a second option is refused too", second.code === 2 && second.out.includes("does not take `--since`"), second.out);
    const missing = typed(root, "show");
    ok("a missing target is refused with the usage line", missing.code === 2 && missing.out.startsWith(USAGE) && missing.out.includes("takes one target"), missing.out);
    const two = typed(root, "show", "all", "031");
    ok("a second target is refused", two.code === 2 && two.out.includes("takes one target"), two.out);
    const none = typed(root);
    ok("with no action the entry says an action is owed", none.code === 2 && none.out.includes("`debug cost` needs an action."), none.out);
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug cost` : `\n  all ${total} passed — debug cost`);
process.exit(failed ? 1 : 0);

