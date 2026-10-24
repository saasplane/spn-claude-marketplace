// `arc-status` — an arc's status is one of eight (RD.DEVEX.WORKSPACE.058).
//
// BOTH DIRECTIONS ARE CASES, because a check that only ever speaks is the same defect as one that
// never does, wearing the other sign. The set is stated once, here, and what holds an arc to it is the
// schema the `workstream` commands run, and the owner check that refuses a hand write under `arcs/`.
import { join } from "node:path";
import { cli, dataWorkspace } from "../../../helpers/workstream-fixture.mjs";

const { STATUSES, statusOfData } = await import("../../../../src/scripts/checks/arc-status.ts");
const { arcFaults } = await import("../../../../src/scripts/lib/workstream-schema.ts");
const { ownedRefusal, levelRefusal } = await import("../../../../src/scripts/checks/workstream-owner.ts");

let n = 0, failed = 0;
const ok = (what, pass, detail = "") => {
  n += 1;
  if (!pass) failed += 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${what}${pass || !detail ? "" : `\n        ${String(detail).slice(0, 300)}`}`);
};

const arc = (status) => ({ schemaVersion: 1, arc: "N001", subject: "probe", title: "the probe", status, reason: status === "HELD" ? "q1" : null,
  preview: "preview.html", rows: [] });

console.log("\n=== every word of the set is the schema's, and the words the corpus drifted to are refused");
for (const word of STATUSES) ok(`${word} is a status the schema takes`, !arcFaults(arc(word)).some((fault) => /`status`/.test(fault)));
// MEASURED over workstream `008` on 2026-09-23: these are the real off-vocabulary statuses found.
for (const word of ["IMPLEMENTING", "PLANNING", "OPEN", "TAKEN", "DONE"])
  ok(`known-bad: ${word} is refused by the schema, which names the set`,
    arcFaults(arc(word)).some((fault) => fault.includes("`status`") && fault.includes(STATUSES.join(" · "))));

console.log("\n=== the commands hold it: row write refuses a word outside the set, and the data reads only the set");
{
  const { root, ws } = await dataWorkspace("arc-status-row-write");
  const refused = cli(root, ["workstream", "row", "write", "031/N001", "--status", "DONE"]);
  ok("known-bad: `row write --status DONE` is refused and writes nothing", refused.code !== 0 && statusOfData(join(ws, "arcs"), "N001") === "DECIDED", refused.out);
  const moved = cli(root, ["workstream", "row", "write", "031/N001", "--status", "HELD", "--reason", "waits on N002"]);
  ok("a word of the set is written", moved.code === 0 && statusOfData(join(ws, "arcs"), "N001") === "HELD", moved.out);
}

console.log("\n=== no hand write reaches an arc: the owner check refuses one into arcs/N<nnn>/, and a file loose in arcs/");
{
  const ws = "/w/.spndevex/workstreams/open/020-x";
  ok("known-bad: a hand write of an arc's state.json is refused", /is written only by/.test(ownedRefusal(`${ws}/arcs/N001/state.json`) ?? ""));
  ok("known-bad: a Markdown arc made directly under arcs/ is refused", /hold only arc folders/.test(levelRefusal(`${ws}/arcs/N001-book-change.md`) ?? ""));
  ok("an agent's note beside the arc is not refused", ownedRefusal(`${ws}/notes/N001/plan.md`) === null);
}

console.log("\n=== the data reads only the set");
{
  const { root, ws } = await dataWorkspace("arc-status-hyphen");
  cli(root, ["workstream", "row", "write", "031/N001", "--status", "PART-LANDED"]);
  ok("a hyphen is part of the word, so PART-LANDED is not PART", statusOfData(join(ws, "arcs"), "N001") === "PART-LANDED");
}

console.log("\n=== which statuses are past DECIDED, in the order of the set");
{
  const { pastDecided } = await import("../../../../src/scripts/checks/arc-status.ts");
  for (const [word, expected] of [["PROPOSED", false], ["DECIDED", false], ["RUNNING", true], ["HELD", true],
    ["PART-LANDED", true], ["LANDED", true], ["CARRIED", true], ["DROPPED", true], ["OPEN", false], [null, false]])
    ok(`[MKT.HOOKS.40] ${word ?? "an arc with no status"} is ${expected ? "" : "not "}past DECIDED`, pastDecided(word) === expected);
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
