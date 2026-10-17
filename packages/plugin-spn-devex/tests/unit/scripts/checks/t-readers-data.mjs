// The readers that read an arc kept as data (01-workstream.md § The formats): `arc-status` and
// `split-plan` read its status and its rows from `state.json`, `plan stale` its pinned facts, `workspace
// tokens` its titles, the telemetry tags its folders, and the Stop hook refuses a turn while `state
// check` fails for this window's workstream.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { arcData, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";

const { statusOfData } = await import("../../../../src/scripts/checks/arc-status.ts");
const split = await import("../../../../src/scripts/checks/split-plan.ts");
const { factPinsOf } = await import("../../../../src/scripts/commands/plan/stale.ts");
const { titlesOf, withTitles } = await import("../../../../src/scripts/commands/workspace/tokens.ts");
const { checkWorkstreamState, workRuns } = await import("../../../../src/scripts/events/stop.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws, git } = await dataWorkspace("readers");
const arcs = join(ws, "arcs");

console.log("=== arc-status and split-plan read state.json");
{
  ok("the status is read from the arc's data", statusOfData(arcs, "N001") === "DECIDED");
  ok("an arc with no data has none", statusOfData(arcs, "N009") === null);
  ok("the close gate's lookup reads it too", split.arcStatus(root, "031-probe", "N001") === "DECIDED");
  const rows = split.dataRowsOf(ws);
  ok("each row is a split-plan row, by its repository", rows.map((row) => `${row.label}|${row.scope}|${split.stateOf(row)}`).join() ===
    "N001 1|spn-x|pending,N001 2|spn-x|pending", JSON.stringify(rows));
  const data = arcData();
  data.rows[0].state = "landed";
  data.rows[1].state = "carried";
  data.rows[1].proof = "to 032-next";
  writeFileSync(join(arcs, "N001", "state.json"), JSON.stringify(data));
  const moved = split.dataRowsOf(ws).map((row) => split.stateOf(row));
  ok("a landed row is landed and a carried one carried", moved.join() === "landed,carried", moved.join());
  ok("the whole plan holds the data rows", split.workstreamPlan([ws], []).length === 2);
  writeFileSync(join(arcs, "N001", "state.json"), JSON.stringify(arcData()));
}

console.log("\n=== plan stale reads the arc's pinned facts");
{
  const head = git(["rev-parse", "--short=8", "HEAD"]);
  cli(root, ["workstream", "fact", "write", "031/N001", "--source", "spn-x/a.ts:1", "--fact", "a is one"]);
  const plan = join(ws, "notes", "N001", "plan.md");
  const pins = factPinsOf(plan);
  ok("each fact is a pin of one path at its commit", pins.length === 1 && pins[0].repo === "spn-x" && pins[0].paths[0] === "a.ts" && pins[0].commit === head, JSON.stringify(pins));
  const quiet = cli(root, ["plan", "stale", plan]);
  ok("green: nothing moved since the pin", quiet.out.includes("f1 spn-x/a.ts: nothing moved"), quiet.out);
  writeFileSync(join(root, "spn-x", "a.ts"), "export const a = 2;\n");
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qam", "a moves"]);
  const loud = cli(root, ["plan", "stale", plan]);
  ok("red: the source moved, and the fact is named", loud.out.includes(`f1 spn-x/a.ts: moved since ${head}`), loud.out);
  const check = cli(root, ["workstream", "state", "check", "031", "--facts"]);
  ok("state check --facts names it as a note, never a failure", /note 031-probe N001 f1: `spn-x\/a.ts:1` moved since/.test(check.out) && check.code === 0, check.out);
}

console.log("\n=== workspace tokens labels arcs and orders from the data");
{
  const titles = titlesOf(root, "031-probe");
  ok("the arc's title and each row's, by id", titles.get("N001")?.title === "the probe arc" && titles.get("N001")?.rows.get("2") === "build it");
  const [row] = withTitles(root, [{ workstream: "031-probe", arc: "N001", order: "2" }]);
  ok("an order named for its row takes the row's title", row.arcTitle === "the probe arc" && row.rowTitle === "build it", JSON.stringify(row));
}

console.log("\n=== telemetry tags read the data's folders");
{
  const timing = await import("../../../../../plugin-support-lib/src/lib/timing.ts");
  const tag = (path) => timing.tagsOf({ tool_input: { file_path: path } });
  const tags = tag(join(ws, "arcs", "N001", "state.json"));
  ok("arcs/N001/state.json names the arc", tags.arc === "N001" && tags.workstream === "031-probe", JSON.stringify(tags));
  const report = tag(join(ws, "notes", "N001", "orders", "57.report.md"));
  ok("a report names its order, not a second one", report.order === "57", JSON.stringify(report));
  ok("so does a ledger", tag(join(ws, "notes", "N001", "orders", "57.ledger.md")).order === "57");
}

console.log("\n=== the Stop hook refuses a turn while state check fails for this window");
{
  const data = arcData();
  data.rows.push({ id: "3", parent: "N001", title: "a row the page has not taken in", kind: "fix", state: "waiting" });
  writeFileSync(join(arcs, "N001", "state.json"), JSON.stringify(data));
  const red = checkWorkstreamState(root, new Set(["031-probe"]));
  ok("red: this window's workstream behind its rows is said", red.length === 1 && red[0].check === "state" && /N001's part on the approach page is behind its rows/.test(red[0].message), JSON.stringify(red));
  ok("another window's workstream is not this window's to hear", checkWorkstreamState(root, new Set(["099-other"])).length === 0);
  cli(root, ["workstream", "arc", "stamp", "write", "031/N001"]);
  ok("green: restamped, the turn may end", checkWorkstreamState(root, new Set(["031-probe"])).length === 0, JSON.stringify(checkWorkstreamState(root, new Set(["031-probe"]))));
  ok("no row running, so work does not run in this window", workRuns(root, new Set(["031-probe"])) === false);
  cli(root, ["workstream", "row", "write", "031/N001", "--status", "RUNNING"]);
  cli(root, ["workstream", "row", "write", "031/N001", "2", "--state", "running"]);
  ok("a row of an arc kept as data set running is work that runs", workRuns(root, new Set(["031-probe"])) === true);
  ok("and only for this window's workstream", workRuns(root, new Set(["099-other"])) === false);
  put(root, ".spndevex/workstreams/open/026-old/arcs/N001-old.md", "# N001 — old\n\nStatus: **RUNNING**\n");
  ok("a workstream not moved yet waits for the move and is not refused on", checkWorkstreamState(root, new Set(["026-old"])).length === 0);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — readers of the data` : `\n  all ${total} passed — readers of the data`);
process.exit(failed ? 1 : 0);
