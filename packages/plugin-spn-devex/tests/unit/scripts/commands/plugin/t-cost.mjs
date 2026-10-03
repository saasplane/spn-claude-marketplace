// `plugin cost show` — the cost of a window and of each child, read back from the usage lines the
// `Stop` event writes beside the timing log, and the writer that turns a transcript into those lines.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { shown, summarize } from "../../../../../src/scripts/commands/plugin/cost.ts";
import { recordUsage, turnsIn } from "../../../../../src/scripts/lib/usage.ts";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
const typed = (...words) => {
  try { return { out: execFileSync("node", [TOOL, "plugin", "cost", ...words], { encoding: "utf8", stdio: "pipe", env: ENV }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const usageLine = (agent, order, input, cache_read, cache_write, output) =>
  JSON.stringify({ at: "2026-10-03T10:00:00Z", session: "s", agent, workstream: "021-x", arc: "N013", order, turn: "m", input, cache_read, cache_write, output });
const assistant = (id, usage) => JSON.stringify({ type: "assistant", message: { id, usage } });

console.log("=== plugin cost show — the window, each child, and the children together");
{
  const root = mkdtempSync(join(tmpdir(), "t-cost-"));
  try {
    const none = typed("show", root);
    ok("with no usage it says so in one line and exits 0", none.code === 0 && none.out.trim().split("\n").length === 1 && /no usage/.test(none.out), none.out);

    const dir = join(root, ".spndevex", ".debug", "telemetry");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "usage.jsonl"), [
      usageLine(null, null, 10, 400000, 20000, 2000),
      usageLine(null, null, 20, 600000, 10000, 3000),
      usageLine("aaaaaaaa1111", "02-standards", 5, 180000, 4000, 500),
      usageLine("bbbbbbbb2222", "03-names", 5, 200000, 6000, 700),
      usageLine("bbbbbbbb2222", "03-names", 5, 220000, 2000, 300),
      "{ torn",
    ].join("\n") + "\n");
    const rows = JSON.parse(typed("show", "--json", root).out).rows;
    ok("the window is one row, with its turns and its read per turn",
      rows[0].who === "The main window" && rows[0].turns === 2 && rows[0].cacheRead === 1000000 && rows[0].readPerTurn === 500000, JSON.stringify(rows[0]));
    ok("each child is its own row, with its order", rows[1].turns === 1 && /order 02-standards/.test(rows[1].who) && rows[2].turns === 2 && rows[2].cacheWrite === 8000, JSON.stringify(rows));
    ok("the children together close the table", rows[3].who === "The children together" && rows[3].turns === 3 && rows[3].cacheRead === 600000, JSON.stringify(rows[3]));
    const table = typed("show", root).out;
    ok("the table names each column", ["Who", "Turns", "Read from cache", "Written to cache", "Output", "Read per turn"].every((c) => table.includes(c)), table);
    ok("a count reads as 1.00M, 8k or 5", shown(1000000) === "1.00M" && shown(8000) === "8k" && shown(5) === "5");
    ok("summarize with no child has no `children together` row", summarize([{ session: "s", agent: null, order: null, input: 1, cache_read: 2, cache_write: 3, output: 4 }]).length === 1);
    const two = typed("show", root, root);
    ok("a second root is refused with exit 2", two.code === 2 && two.out.includes("takes one workspace root."), two.out);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

console.log("\n=== the Stop event's writer — one line per model turn, only while recording is on");
{
  const root = mkdtempSync(join(tmpdir(), "t-cost-w-"));
  const prior = process.env.SPN_TELEMETRY;
  delete process.env.SPN_TELEMETRY;
  try {
    const transcript = join(root, "t.jsonl");
    const u = (n) => ({ input_tokens: n, cache_read_input_tokens: n * 10, cache_creation_input_tokens: n * 2, output_tokens: n * 3 });
    writeFileSync(transcript, [assistant("m1", u(1)), assistant("m1", u(2)), JSON.stringify({ type: "user", message: {} }), assistant("m2", u(5))].join("\n") + "\n");
    ok("a turn streamed over two lines is one turn, with the counts of its last line",
      JSON.stringify(turnsIn(readFileSync(transcript, "utf8")).map((t) => [t.turn, t.input, t.cache_read])) === JSON.stringify([["m1", 2, 20], ["m2", 5, 50]]));
    const facts = { script: "spn-devex", event: "Stop", tool: null, session: "s" };
    const log = join(root, ".spndevex", ".debug", "telemetry", "usage.jsonl");
    recordUsage(root, facts, transcript);
    ok("with the switch absent nothing is written", !existsSync(log));
    mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
    writeFileSync(join(root, ".spndevex", ".debug", "telemetry.on"), "");
    recordUsage(root, facts, transcript);
    ok("with the switch present, two turns are two lines", readFileSync(log, "utf8").trim().split("\n").length === 2);
    recordUsage(root, facts, transcript);
    ok("a second call with nothing new adds nothing", readFileSync(log, "utf8").trim().split("\n").length === 2);
    appendFileSync(transcript, assistant("m3", u(7)) + "\n");
    recordUsage(root, { ...facts, agent: "child1" }, transcript);
    const lines = readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    ok("a later turn is added alone, tagged with its agent", lines.length === 3 && lines[2].turn === "m3" && lines[2].agent === "child1" && lines[2].cache_write === 14, JSON.stringify(lines[2]));
  } finally {
    if (prior !== undefined) process.env.SPN_TELEMETRY = prior;
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin cost` : `\n  all ${total} passed — plugin cost`);
process.exit(failed ? 1 : 0);
