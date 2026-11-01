// An ideate arc (RULE.DEVEX.WORKSPACE.494): opened with `--kind ideate`, it has no steps and its status is worked out from the build arcs it proposes.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PREVIEW, cli, dataWorkspace } from "../../../../helpers/workstream-fixture.mjs";

const { arcStatus, readArc, statusOfData } = await import("../../../../../src/scripts/lib/workstream.ts");
const gate = await import("../../../../../src/scripts/checks/split-plan.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("ideate-arc");
const open = (arc, ...more) => cli(root, ["workstream", "arc", "edit", `031/${arc}`, "--title", `the ${arc}`, "--subject", "the-shape", "--goal", "the shape is settled", ...more]);
const stateOf = (arc) => JSON.parse(readFileSync(join(ws, "arcs", arc, "state.json"), "utf8"));

console.log("\n=== opening");
{
  const made = open("N002", "--kind", "ideate");
  ok("[MKT.SCRIPTS.429] `arc edit --kind ideate` opens an ideate arc, recorded on the arc", made.code === 0 && stateOf("N002").kind === "ideate" && stateOf("N002").rows.length === 0, made.out);
  const build = open("N003");
  ok("[MKT.SCRIPTS.429] an arc opened with no kind is a build arc and records none", build.code === 0 && stateOf("N003").kind === undefined, build.out);
  const odd = open("N004", "--kind", "plan");
  ok("[MKT.SCRIPTS.429] red: a kind that is neither build nor ideate is refused", odd.code !== 0 && odd.out.includes("ideate"), odd.out);
  const wrong = cli(root, ["workstream", "arc", "edit", "031/N003", "--proposes", "N005"]);
  ok("[MKT.SCRIPTS.429] red: a build arc proposes nothing", wrong.code !== 0 && wrong.out.includes("only on an ideate arc"), wrong.out);
  const set = cli(root, ["workstream", "arc", "edit", "031/N002", "--proposes", "N003,N004"]);
  ok("[MKT.SCRIPTS.429] the arcs an ideate arc proposes are recorded on it", set.code === 0 && JSON.stringify(stateOf("N002").proposes) === '["N003","N004"]', set.out);
}

console.log("\n=== its status is worked out, and it needs no rows");
{
  const moved = cli(root, ["workstream", "arc", "edit", "031/N002", "--status", "DECIDED", "--note", "the shape is settled"]);
  ok("[MKT.SCRIPTS.430] the preview decided, the arc reads DECIDED while an arc it proposes is not opened", moved.code === 0 && statusOfData(ws, "N002") === "DECIDED", moved.out);
  ok("[MKT.SCRIPTS.430] and the stored status stays the developer's words", stateOf("N002").status === "DECIDED");
  open("N004");
  ok("[MKT.SCRIPTS.430] once every arc it proposes is opened it reads LANDED, with no rows", statusOfData(ws, "N002") === "LANDED" && stateOf("N002").rows.length === 0, String(statusOfData(ws, "N002")));
  ok("[MKT.SCRIPTS.430] and what it reads is never written to its state.json", stateOf("N002").status === "DECIDED" && !("proposesOpened" in stateOf("N002")));
  ok("[MKT.SCRIPTS.430] an arc proposed but undecided reads PROPOSED, not LANDED", arcStatus({ ...readArc(ws, "N002"), status: "PROPOSED" }) === "PROPOSED");
}

console.log("\n=== where it is read");
{
  // The ideate arc's one preview is filled once it is decided.
  writeFileSync(join(ws, "notes", "N002", "preview.html"), PREVIEW);
  cli(root, ["docs", "cycles", "write", "031"]);
  ok("[MKT.SCRIPTS.431] the close gate reads it through the same owner: LANDED is terminal", gate.arcStatus(root, "031-probe", "N002") === "LANDED", String(gate.arcStatus(root, "031-probe", "N002")));
  const check = cli(root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.431] `state check` finds nothing of the ideate arc: its page row, badge and name file are current with what it reads", !/N002/.test(check.out), check.out.slice(0, 600));
  const cycles = cli(root, ["docs", "cycles", "write", "031"]);
  const page = readFileSync(join(ws, "approach.html"), "utf8");
  ok("[MKT.SCRIPTS.431] `docs cycles write` draws it LANDED on the approach page", cycles.code === 0 && /id="N002"[\s\S]{0,900}?sds-landed/.test(page), cycles.out.slice(0, 400));
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
