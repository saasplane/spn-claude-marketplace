// `plugin timings` — the telemetry log read back, grouped by `script` › `group` › `subgroup` ›
// `action`: runs, total, median, p95, slowest and failures per row (RD.DEVEX.WORKSPACE.185, N8 row 2p).
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
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin timings` : `\n  all ${total} passed — plugin timings`);
process.exit(failed ? 1 : 0);
