// `plugin timings` — the telemetry log read back, grouped by `script` › `group` › `subgroup` ›
// `action`: runs, total, median, p95, slowest and failures per row (RD.DEVEX.WORKSPACE.185, N8 row 2p).
// A Bash call is one line with a `programs` count, so a total by program holds its time once.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { summarize } from "../../../../../src/scripts/commands/plugin/timings.ts";

const TOOL = join(PLUGIN, "src", "scripts", "commands", "plugin", "timings.ts");
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const line = (script, group, subgroup, action, ms, exit = null, at = "2026-10-01T00:00:00Z") =>
  ({ script, group, subgroup, action, args: null, ms, exit, at });

console.log("=== plugin timings — summarize() groups by script › group › subgroup › action");
{
  const spans = [
    line("spnutils", "infra", "platform", "up", 58000, 0),
    line("spnutils", "infra", "platform", "up", 62000, 1),
    line("spnutils", "infra", "platform", "down", 9000, 0),
    line("spnutils", "apps", null, "test", 10, 0),
    line("spnutils", "apps", null, "test", 20, 0),
    line("spnutils", "apps", null, "test", 300, 2),   // one outlier must not drag the median up
    line("spn-devex", "split-plan", null, "close", 0.2),
    line("spn-devex", "split-plan", null, "documents-first", 53),
  ];
  const rows = summarize(spans);
  const key = (row) => [row.script, row.group, row.subgroup, row.action].join(" ");
  const up = rows.find((r) => key(r) === "spnutils infra platform up");
  const test = rows.find((r) => key(r) === "spnutils apps  test");
  ok("each script › group › subgroup › action is its own row", rows.length === 5, JSON.stringify(rows.map(key)));
  ok("two levels apart are two rows (platform up, platform down)", rows.some((r) => key(r) === "spnutils infra platform down"));
  ok("runs and total are carried per row", up.runs === 2 && up.totalMs === 120000, JSON.stringify(up));
  ok("the median of 10, 20, 300 is 20 — the outlier does not move it", test.medianMs === 20, JSON.stringify(test));
  ok("p95 and slowest read the tail", test.p95Ms === 300 && test.slowestMs === 300, JSON.stringify(test));
  ok("failures count a non-zero exit, and a hook check's null exit is no failure",
    up.failures === 1 && test.failures === 1 && rows.filter((r) => r.script === "spn-devex").every((r) => r.failures === 0),
    JSON.stringify(rows));
  ok("the rows of one script sit together, the costliest script first",
    rows.map((r) => r.script).join(",") === "spnutils,spnutils,spnutils,spn-devex,spn-devex", JSON.stringify(rows.map(key)));
  ok("inside a script the costliest row comes first", key(rows[0]) === "spnutils infra platform up", key(rows[0]));
}

console.log("\n=== plugin timings — a Bash call is one line, so its time is summed once");
{
  // The line `finishCommand` writes for `git add x && git commit -m y && spnutils apps check x`.
  const call = { ...line("git", null, null, "add", 900, 0), event: "command", tool: "Bash", programs: 3 };
  const single = { ...line("git", null, null, "add", 100, 0), event: "command", tool: "Bash", programs: 1 };
  const rows = summarize([call, single, line("spn-devex", "events", null, "closed", 40)]);
  const add = rows.find((row) => row.script === "git" && row.action === "add");
  ok("[MKT.SCRIPTS.97] a call that ran three programs is filed once, under the first program", rows.filter((row) => row.script !== "spn-devex").length === 1,
    JSON.stringify(rows));
  ok("[MKT.SCRIPTS.97] so the total by program holds the call's time once", add?.runs === 2 && add?.totalMs === 1000, JSON.stringify(add));
  ok("[MKT.SCRIPTS.97] and the row says how many of its calls ran more than one program", add?.compound === 1, JSON.stringify(add));
  ok("a hook check's row has no such call", rows.find((row) => row.script === "spn-devex")?.compound === 0, JSON.stringify(rows));

  // UNTOUCHED — three lines one call wrote before `programs` existed, each with the whole call's time.
  const old = [line("git", null, null, "add", 900, 0), line("git", null, null, "commit", 900, 0), line("spnutils", "apps", null, "check", 900, 0)];
  const before = summarize(old);
  ok("a line written before `programs` existed is read as it was written", before.length === 3 && before.every((row) => row.totalMs === 900 && row.compound === 0),
    JSON.stringify(before));
}

console.log("\n=== plugin timings — reads a real log on disk, and is quiet with none");
{
  const root = mkdtempSync(join(tmpdir(), "timings-"));
  try {
    const quiet = execFileSync("node", [TOOL, root], { encoding: "utf8" });
    ok("no log at all exits clean and says so", quiet.includes("no telemetry"), quiet);

    const dir = join(root, ".spndevex", ".debug", "telemetry");
    mkdirSync(dir, { recursive: true });
    const lines = [
      JSON.stringify(line("spn-devex", "events", null, "pretooluse", 77)),
      JSON.stringify(line("spn-devex", "events", null, "pretooluse", 28)),
      // A line written before the levels existed still reads, under its script alone.
      JSON.stringify({ script: "docs-audit", ms: 5, at: "2026-09-28T00:00:00" }),
      "{ not json — a torn line from a truncated write",
    ].join("\n");
    writeFileSync(join(dir, "hooks.jsonl"), lines + "\n", "utf8");
    const out = execFileSync("node", [TOOL, "--json", root], { encoding: "utf8" });
    const parsed = JSON.parse(out);
    ok("the torn line is skipped, not a crash, and the three good ones are read", parsed.spans === 3, out);
    const events = parsed.rows.find((r) => r.group === "events");
    ok("the JSON form carries the same median", events?.medianMs === 52.5, out);
    const text = execFileSync("node", [TOOL, root], { encoding: "utf8" });
    ok("the reading names each level and each column", /spn-devex/.test(text) && /events pretooluse/.test(text)
      && /Runs/.test(text) && /Total/.test(text) && /p95/.test(text) && /Slowest/.test(text) && /Failures/.test(text), text);
    ok("a log with no call that ran several programs says nothing about them", !/more than one program/.test(text), text);

    const command = { script: "git", group: null, subgroup: null, action: "add", args: "x", event: "command", tool: "Bash", ms: 900, exit: 1,
      at: "2026-10-01T00:00:00Z", repo: "spn-x", pid: 1, session: "s", agent: null, workstream: null, arc: null, order: null, programs: 3 };
    writeFileSync(join(dir, "hooks.jsonl"), lines + "\n" + JSON.stringify(command) + "\n", "utf8");
    const withCall = JSON.parse(execFileSync("node", [TOOL, "--json", root], { encoding: "utf8" }));
    const git = withCall.rows.find((r) => r.script === "git");
    ok("[MKT.SCRIPTS.97] the log's one line for a failed call of three programs reads as one run, one failure",
      git?.runs === 1 && git?.totalMs === 900 && git?.failures === 1 && git?.compound === 1, JSON.stringify(git));
    const printed = execFileSync("node", [TOOL, root], { encoding: "utf8" });
    ok("[MKT.SCRIPTS.97] and the reading says the call's whole time is under its first program",
      /1 Bash call\(s\) ran more than one program/.test(printed), printed);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin timings` : `\n  all ${total} passed — plugin timings`);
process.exit(failed ? 1 : 0);
