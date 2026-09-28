// `plugin timings` — the per-script median read back from the telemetry log, which is the number
// `N101` measured to justify a pre-built bundle over a `.ts` source.
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

console.log("=== plugin timings — summarize() computes the median, not the mean");
{
  const spans = [
    { script: "docs-audit", ms: 10, at: "2026-09-28T00:00:00" },
    { script: "docs-audit", ms: 20, at: "2026-09-28T00:00:01" },
    { script: "docs-audit", ms: 300, at: "2026-09-28T00:00:02" }, // one outlier must not drag a mean up
    { script: "docs-face", ms: 5, at: "2026-09-28T00:00:00" },
  ];
  const rows = summarize(spans);
  const audit = rows.find((r) => r.script === "docs-audit");
  ok("the median of 10, 20, 300 is 20 — the outlier does not move it", audit.medianMs === 20, JSON.stringify(audit));
  ok("each script name is its own row", rows.length === 2, JSON.stringify(rows));
  ok("the costliest script sorts first", rows[0].script === "docs-audit");
  ok("a run count is carried per script", audit.runs === 3);
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
      JSON.stringify({ script: "pretooluse", ms: 77, at: "2026-09-28T00:00:00" }),
      JSON.stringify({ script: "pretooluse", ms: 28, at: "2026-09-28T00:00:01" }),
      "{ not json — a torn line from a truncated write",
    ].join("\n");
    writeFileSync(join(dir, "hooks.jsonl"), lines + "\n", "utf8");
    const out = execFileSync("node", [TOOL, "--json", root], { encoding: "utf8" });
    const parsed = JSON.parse(out);
    ok("the torn line is skipped, not a crash, and the two good ones are read", parsed.spans === 2, out);
    ok("the JSON form carries the same median", parsed.rows[0].medianMs === 52.5, out);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin timings` : `\n  all ${total} passed — plugin timings`);
process.exit(failed ? 1 : 0);
