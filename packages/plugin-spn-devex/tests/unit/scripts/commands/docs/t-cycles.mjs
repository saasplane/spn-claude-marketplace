// `docs cycles` — a workstream's Cycles table, printed from its arcs (05-artifacts.md § `How` ends in
// Cycles, and the arcs are the state). Each case builds a workstream in a temporary folder, because
// what the command reads is arcs, and the arcs of a real workstream move every day.
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { arcId, arcLabel, cycleOf, cyclesOf, statusLabel, statusWord, tableOf, workstreamFolder }
  from "../../../../../src/scripts/commands/docs/cycles.ts";
import { main } from "../../../../../src/scripts/cli.ts";
import { WORKSTREAMS } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** What `main` prints, since the command writes to stdout and stderr rather than returning text. */
async function capture(argv, env = {}) {
  const lines = [], errors = [];
  const realLog = console.log, realErr = console.error;
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  console.log = (...args) => lines.push(args.join(" "));
  console.error = (...args) => errors.push(args.join(" "));
  let code;
  try { code = await main(argv); }
  finally {
    console.log = realLog; console.error = realErr;
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  return { code, out: lines.join("\n"), err: errors.join("\n") };
}

const TMP = realpathSync(mkdtempSync(join(tmpdir(), "docs-cycles-")));
const folder = join(TMP, ".spndevex", WORKSTREAMS, "backlog", "042-probe");
const arcs = join(folder, "arcs");
mkdirSync(arcs, { recursive: true });
const put = (name, text) => writeFileSync(join(arcs, name), text);

// The arc template's first line: the bold status, when it opened, then one sentence on what it changes.
put("N2-the-check.md", "# N2 — the check\n\nStatus: **DECIDED — waits on N1.** Opened 2026-09-29.   <!-- a comment the template keeps --> A check reads the new shape. It runs after N1.\n");
put("N1-the-chapter.md", "# `N1` — the chapter\n\nStatus: **RUNNING — 2026-09-29.** The chapter says where the model sits.\n");
put("N10-the-release.md", "# N10 — the release\n\nStatus: **HELD — waits on Q7.** Opened\n2026-09-29. The plugins ship once.\n");
put("N1a-a-brief.md", "# Arc 1a — a brief\n\nStatus: **CARRIED → `N98` steps 1-2** — 2026-09-27.\n\n| Field | This arc |\n| --- | --- |\n| **Decides** | **The brief moves on.** Nothing else. |\n");
put("N3-part.md", "# N3 — part of it\n\nStatus: **PART-LANDED — 2026-09-29.** Half the rows landed.\n");
put("arc-legacy.md", "# Arc — a legacy arc with no number\n\nStatus: **OPEN** · Prepared: 2026-08-31\n");

try {
  console.log("=== docs cycles — reading one arc");
  {
    ok("the status word is read from the set", statusWord("HELD · no cloud account") === "HELD");
    ok("PART-LANDED is never read as LANDED", statusWord("PART-LANDED — today") === "PART-LANDED");
    ok("a word outside the set reads as none", statusWord("OPEN") === null);
    ok("the arc number comes from the file name", arcId("N7-N8-flip-and-close.md") === "N7" && arcId("N1a-x.md") === "N1a");
    ok("a file with no number has none", arcId("arc-legacy.md") === null);

    const two = cycleOf(join(arcs, "N2-the-check.md"), "# N2 — the check\n\nStatus: **DECIDED — waits on N1.** Opened 2026-09-29.   <!-- c --> A check reads the new shape. It runs after N1.\n");
    ok("the name is the heading without its number", two.name === "the check", two.name);
    ok("what it does is the first sentence after the status, past when it opened", two.does === "A check reads the new shape.", two.does);
    ok("a DECIDED arc's status cell is its word alone", statusLabel(two) === "DECIDED", statusLabel(two));
  }

  console.log("\n=== docs cycles — every arc of a workstream, in run order");
  {
    const cycles = cyclesOf(folder);
    const order = cycles.map((c) => c.id ?? c.name).join(",");
    ok("one row per arc file, numbers in order, a letter after its number, no number last",
      order === "N1,N1a,N2,N3,N10,a legacy arc with no number", order);
    const byId = Object.fromEntries(cycles.map((c) => [c.id ?? "legacy", c]));
    ok("a backticked heading reads plain", arcLabel(byId.N1) === "N1 — the chapter", arcLabel(byId.N1));
    ok("a status paragraph that wraps still yields its sentence", byId.N10.does === "The plugins ship once.", byId.N10.does);
    ok("HELD carries its blocker", statusLabel(byId.N10) === "HELD · waits on Q7", statusLabel(byId.N10));
    ok("CARRIED carries where it went", statusLabel(byId.N1a) === "CARRIED · → N98 steps 1-2", statusLabel(byId.N1a));
    ok("with no sentence after the status, Decides says what it does", byId.N1a.does === "The brief moves on.", byId.N1a.does);
    ok("an arc whose status the set does not know is still a row, marked", statusLabel(byId.legacy) === "(no status)");
    ok("a folder with no arcs/ has no Cycles", cyclesOf(TMP).length === 0);
  }

  console.log("\n=== docs cycles — the table the approach template carries");
  {
    const table = tableOf(cyclesOf(folder));
    ok("the header is Arc · What it does · Status", table.includes("<thead><tr><th>Arc</th><th>What it does</th><th>Status</th></tr></thead>"));
    ok("a row is escaped HTML in the template's shape",
      table.includes("<tr><td><strong>N10 &mdash; the release</strong></td><td>The plugins ship once.</td><td>HELD &middot; waits on Q7</td></tr>"), table);
  }

  console.log("\n=== docs cycles — naming the workstream");
  {
    ok("by folder", workstreamFolder(folder, null) === folder);
    ok("by its approach page", (writeFileSync(join(folder, "probe-approach.html"), "<h1>x</h1>"),
      workstreamFolder(join(folder, "probe-approach.html"), null) === folder));
    ok("by number, in any state", workstreamFolder("042", TMP) === folder);
    ok("by folder name", workstreamFolder("042-probe", TMP) === folder);
    ok("an unknown name finds nothing", workstreamFolder("999", TMP) === null);
  }

  console.log("\n=== docs cycles — through the CLI");
  {
    const printed = await capture(["docs", "cycles", "042"], { SPN_WORKSPACE: TMP });
    ok("prints the table and exits 0", printed.code === 0 && printed.out.includes("<th>Arc</th>"), `code ${printed.code}`);
    ok("names the arc whose status the set does not know, on stderr", printed.err.includes("arc-legacy.md"), printed.err);

    const json = await capture(["docs", "cycles", folder, "--json"]);
    let rows = [];
    try { rows = JSON.parse(json.out); } catch { /* reported below */ }
    ok("--json prints one object per arc", json.code === 0 && rows.length === 6 && rows[0].arc === "N1 — the chapter", json.out.slice(0, 200));

    const missing = await capture(["docs", "cycles", "999"], { SPN_WORKSPACE: TMP });
    ok("an unknown workstream exits 2 and says how to name one", missing.code === 2 && missing.err.includes("no workstream"), missing.err);

    const usage = await capture(["docs", "cycles"]);
    ok("no workstream named is a usage error", usage.code === 2 && usage.err.includes("usage"), usage.err);

    const empty = join(TMP, ".spndevex", WORKSTREAMS, "open", "043-empty");
    mkdirSync(join(empty, "arcs"), { recursive: true });
    const none = await capture(["docs", "cycles", empty]);
    ok("a workstream with no arcs exits 1", none.code === 1 && none.err.includes("has no arcs"), none.err);
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs cycles` : `\n  all ${total} passed — docs cycles`);
process.exit(failed ? 1 : 0);
