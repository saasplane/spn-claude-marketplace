// The ideate arc (RULE.DEVEX.WORKSPACE.494): opened by its address, `<ws>/ideate`, with no `--kind`, it has no steps and its status is worked out from the build arcs it proposes.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
  const made = open("ideate");
  ok("[MKT.SCRIPTS.484] `arc edit <ws>/ideate` opens the ideate arc with `--title`, `--subject` and `--goal`, with no rows and no stored kind", made.code === 0 && existsSync(join(ws, "arcs", "ideate", "state.json")) && stateOf("ideate").rows.length === 0 && stateOf("ideate").kind === undefined, made.out);
  const follow = open("follow-ups");
  ok("[MKT.SCRIPTS.484] `arc edit <ws>/follow-ups` opens the follow-up arc the same way", follow.code === 0 && existsSync(join(ws, "arcs", "follow-ups", "state.json")) && stateOf("follow-ups").kind === undefined, follow.out);
  const other = open("other");
  ok("[MKT.SCRIPTS.484] red: `<ws>/other` is refused naming the three forms", other.code !== 0 && other.out.includes("N<nnn>") && other.out.includes("ideate") && other.out.includes("follow-ups") && !existsSync(join(ws, "arcs", "other")), other.out);
  const skip = open("N004");
  ok("[MKT.SCRIPTS.486] red: `arc edit <ws>/N004` on a workstream whose highest folder is N001 is refused and names N002", skip.code !== 0 && skip.out.includes("N002") && !existsSync(join(ws, "arcs", "N004")), skip.out);
  const build = open("N002");
  ok("[MKT.SCRIPTS.486] `arc edit <ws>/N002` opens, a build arc that records no kind", build.code === 0 && stateOf("N002").kind === undefined, build.out);
  const third = open("N003");
  ok("[MKT.SCRIPTS.486] and the number after it opens in turn", third.code === 0 && existsSync(join(ws, "arcs", "N003", "state.json")), third.out);
  const kindOpen = open("N004", "--kind", "ideate");
  ok("[MKT.SCRIPTS.487] red: `--kind` is an option `arc edit` does not take, when an arc is opened", kindOpen.code !== 0 && kindOpen.out.includes("does not take `--kind`") && !existsSync(join(ws, "arcs", "N004")), kindOpen.out);
  const kindEdit = cli(root, ["workstream", "arc", "edit", "031/N002", "--kind", "ideate"]);
  ok("[MKT.SCRIPTS.487] red: nor on an arc already open: nothing is written to its header", kindEdit.code !== 0 && kindEdit.out.includes("does not take `--kind`") && stateOf("N002").kind === undefined, kindEdit.out);
  const wrong = cli(root, ["workstream", "arc", "edit", "031/N003", "--proposes", "N005"]);
  ok("[MKT.SCRIPTS.484] red: a numbered arc proposes nothing", wrong.code !== 0 && wrong.out.includes("only on the ideate arc"), wrong.out);
  const set = cli(root, ["workstream", "arc", "edit", "031/ideate", "--proposes", "N002,N003,follow-ups"]);
  ok("[MKT.SCRIPTS.484] `--proposes` on the ideate arc takes a mixed list of numbered arcs and follow-ups, recorded on it", set.code === 0 && JSON.stringify(stateOf("ideate").proposes) === '["N002","N003","follow-ups"]', set.out);
  const odd = cli(root, ["workstream", "arc", "edit", "031/ideate", "--proposes", "N002,later"]);
  ok("[MKT.SCRIPTS.484] red: an id of none of the forms is refused", odd.code !== 0 && odd.out.includes("`later`"), odd.out);
}

console.log("\n=== its status is worked out, and it needs no rows");
{
  cli(root, ["workstream", "arc", "edit", "031/ideate", "--proposes", "N002,N003,N004,follow-ups"]);
  const moved = cli(root, ["workstream", "arc", "edit", "031/ideate", "--status", "DECIDED", "--note", "the shape is settled"]);
  ok("[MKT.SCRIPTS.430] the preview decided, the arc reads DECIDED while an arc it proposes is not opened", moved.code === 0 && statusOfData(ws, "ideate") === "DECIDED", moved.out);
  ok("[MKT.SCRIPTS.430] and the stored status stays the developer's words", stateOf("ideate").status === "DECIDED");
  open("N004");
  ok("[MKT.SCRIPTS.430] once every arc it proposes is opened it reads LANDED, with no rows", statusOfData(ws, "ideate") === "LANDED" && stateOf("ideate").rows.length === 0, String(statusOfData(ws, "ideate")));
  ok("[MKT.SCRIPTS.430] and what it reads is never written to its state.json", stateOf("ideate").status === "DECIDED" && !("proposesOpened" in stateOf("ideate")));
  ok("[MKT.SCRIPTS.430] an arc proposed but undecided reads PROPOSED, not LANDED", arcStatus({ ...readArc(ws, "ideate"), status: "PROPOSED" }) === "PROPOSED");
}

console.log("\n=== where it is read");
{
  // The ideate arc's one preview is filled once it is decided.
  writeFileSync(join(ws, "notes", "ideate", "preview.html"), PREVIEW);
  cli(root, ["docs", "cycles", "write", "031"]);
  ok("[MKT.SCRIPTS.431] the close gate reads it through the same owner: LANDED is terminal", gate.arcStatus(root, "031-probe", "ideate") === "LANDED", String(gate.arcStatus(root, "031-probe", "ideate")));
  const check = cli(root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.431] `state check` finds nothing of the ideate arc: its page row, badge and name file are current with what it reads", !/ideate/.test(check.out), check.out.slice(0, 600));
  const cycles = cli(root, ["docs", "cycles", "write", "031"]);
  const page = readFileSync(join(ws, "approach.html"), "utf8");
  ok("[MKT.SCRIPTS.431] `docs cycles write` draws it LANDED on the approach page", cycles.code === 0 && /id="ideate"[\s\S]{0,900}?sds-landed/.test(page), cycles.out.slice(0, 400));
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
