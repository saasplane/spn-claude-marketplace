// `arc-status` — an arc's status is one of six (RD.DEVEX.WORKSPACE.058): the developer's words stored, and RUNNING
// and LANDED worked out from the steps by one owner (RD.DEVEX.WORKSPACE.307).
//
// BOTH DIRECTIONS ARE CASES, because a check that only ever speaks is the same defect as one that
// never does, wearing the other sign. The set is stated once, in `arc-status.ts`, and what holds an arc to it is the
// schema the `workstream` commands run, and the owner check that refuses a hand write under `arcs/`.
import { cli, dataWorkspace } from "../../../helpers/workstream-fixture.mjs";

const { STATUSES, STORED_STATUSES } = await import("../../../../src/scripts/checks/arc-status.ts");
const { arcFaults } = await import("../../../../src/scripts/lib/workstream-schema.ts");
const { arcStatus, statusOfData } = await import("../../../../src/scripts/lib/workstream.ts");
const { ownedRefusal, levelRefusal } = await import("../../../../src/scripts/checks/workstream-owner.ts");

let n = 0, failed = 0;
const ok = (what, pass, detail = "") => {
  n += 1;
  if (!pass) failed += 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${what}${pass || !detail ? "" : `\n        ${String(detail).slice(0, 300)}`}`);
};

const arc = (status, rows = []) => ({ schemaVersion: 2, arc: "N001", subject: "probe", title: "the probe", status,
  reason: ["CARRIED", "DROPPED"].includes(status) ? "why" : null, preview: "preview.html", rows });
const step = (id, state) => ({ id, parent: "N001", title: `step ${id}`, kind: "change", state });

console.log("\n=== the stored words are the schema's, and every other word is refused");
for (const word of STORED_STATUSES) ok(`${word} is a status the schema stores`, !arcFaults(arc(word)).some((fault) => /`status`/.test(fault)));
// MEASURED over workstream `008` on 2026-09-23: these are the real off-vocabulary statuses found; RUNNING, HELD and
// PART-LANDED are the version 1 words, which the steps now work out or a wait now holds.
for (const word of ["RUNNING", "HELD", "PART-LANDED", "IMPLEMENTING", "PLANNING", "OPEN", "TAKEN", "DONE"])
  ok(`known-bad: ${word} is refused by the schema, which names the stored set`,
    arcFaults(arc(word)).some((fault) => fault.includes("`status`") && fault.includes(STORED_STATUSES.join(" · "))));
ok("the six are the stored set and RUNNING", STATUSES.join() === "PROPOSED,DECIDED,RUNNING,LANDED,CARRIED,DROPPED");

console.log("\n=== the one owner works RUNNING and LANDED out from the steps (RD.DEVEX.WORKSPACE.307)");
{
  ok("a decided arc with no step started reads DECIDED", arcStatus(arc("DECIDED", [step("1", "waiting"), step("2", "ready")])) === "DECIDED");
  ok("red: a step started reads RUNNING", arcStatus(arc("DECIDED", [step("1", "running"), step("2", "waiting")])) === "RUNNING");
  ok("a step stopped is started too", arcStatus(arc("DECIDED", [step("1", "stopped")])) === "RUNNING");
  ok("red: every step landed reads LANDED", arcStatus(arc("DECIDED", [step("1", "landed"), step("2", "landed")])) === "LANDED");
  ok("deferred, carried and replaced steps are left out of LANDED",
    arcStatus(arc("DECIDED", [step("1", "landed"), step("2", "deferred"), step("3", "carried"), step("4", "replaced")])) === "LANDED");
  ok("a step still waiting keeps a started arc RUNNING", arcStatus(arc("DECIDED", [step("1", "landed"), step("2", "waiting")])) === "RUNNING");
  ok("a stored PROPOSED wins over the steps", arcStatus(arc("PROPOSED", [step("1", "landed")])) === "PROPOSED");
  ok("the review-fixes arc reads RUNNING with every step landed, until the close stores LANDED",
    arcStatus({ ...arc("DECIDED", [step("1", "landed")]), reviewFixes: true }) === "RUNNING" && arcStatus({ ...arc("LANDED", [step("1", "landed")]), reviewFixes: true }) === "LANDED");
  ok("CARRIED and DROPPED are the words stored", arcStatus(arc("CARRIED", [step("1", "running")])) === "CARRIED" && arcStatus(arc("DROPPED")) === "DROPPED");
}

console.log("\n=== the commands hold it: row write refuses a word outside the stored set, and the data reads through the owner");
{
  const { root, ws } = await dataWorkspace("arc-status-row-write");
  const refused = cli(root, ["workstream", "row", "write", "031/N001", "--status", "DONE"]);
  ok("known-bad: `row write --status DONE` is refused and writes nothing", refused.code !== 0 && statusOfData(ws, "N001") === "DECIDED", refused.out);
  cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "running"]);
  ok("a step started is read as RUNNING through the owner", statusOfData(ws, "N001") === "RUNNING");
  const moved = cli(root, ["workstream", "row", "write", "031/N001", "--status", "CARRIED", "--reason", "to 032", "--note", "the developer: move it"]);
  ok("a stored word of the set is written", moved.code === 0 && statusOfData(ws, "N001") === "CARRIED", moved.out);
}

console.log("\n=== no hand write reaches an arc: the owner check refuses one into arcs/N<nnn>/, and a file loose in arcs/");
{
  const ws = "/w/.spndevex/workstreams/open/020-x";
  ok("known-bad: a hand write of an arc's state.json is refused", /is written only by/.test(ownedRefusal(`${ws}/arcs/N001/state.json`) ?? ""));
  ok("known-bad: a Markdown arc made directly under arcs/ is refused", /hold only arc folders/.test(levelRefusal(`${ws}/arcs/N001-book-change.md`) ?? ""));
  ok("an agent's note beside the arc is not refused", ownedRefusal(`${ws}/notes/N001/plan.md`) === null);
}

console.log("\n=== which statuses are past DECIDED, in the order of the set");
{
  const { pastDecided } = await import("../../../../src/scripts/checks/arc-status.ts");
  for (const [word, expected] of [["PROPOSED", false], ["DECIDED", false], ["RUNNING", true], ["LANDED", true],
    ["CARRIED", true], ["DROPPED", true], ["OPEN", false], [null, false]])
    ok(`[MKT.HOOKS.40] ${word ?? "an arc with no status"} is ${expected ? "" : "not "}past DECIDED`, pastDecided(word) === expected);
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
