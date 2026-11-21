// `workstream layout` — a workstream written whole from bootstrap's layout data: every section Pending with what it needs and
// waits on, each answer kept once and cited, a changed answer reopening its sections, and the go refused while one is Pending
// or out of date (MKT.SCRIPTS.622 – MKT.SCRIPTS.626).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace, writeRoleArcs } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("layout");
writeRoleArcs(ws);
const layoutOf = () => JSON.parse(readFileSync(join(ws, "arcs", "ideate", "layout.json"), "utf8"));
const section = (id) => layoutOf().sections.find((one) => one.id === id);

console.log("=== the workstream is written whole, every section Pending");
{
  const wrote = cli(root, ["workstream", "layout", "write", "031", "--known", "1.1=customers outside the company (retail investors)"]);
  const layout = layoutOf();
  const pending = layout.sections.filter((one) => one.state === "PENDING");
  ok("[MKT.SCRIPTS.622] layout write writes every section of the layout data, Pending but for what the chat told", wrote.code === 0 && layout.sections.length > 20 && pending.length === layout.sections.length - 1, wrote.out);
  ok("[MKT.SCRIPTS.622] each Pending section carries what it needs and what it waits on", section("1.4").needed.length > 0 && section("1.4").waitsOn.includes("1.2") && section("1.6").waitsOn.length === 4);
  ok("[MKT.SCRIPTS.622] what the chat questions told is Known, as a decision the section cites", section("1.1").state === "PROPOSED" && section("1.1").known.includes("retail investors") && layout.decisions.length === 1 && "D001" in section("1.1").cites);
  ok("[MKT.SCRIPTS.622] and it prints the arc edit line for each arc the layout opens", (wrote.out.match(/workstream arc edit <workstream>\/N00\d/g) ?? []).length === 6 && wrote.out.includes("--subject vision-and-domains"), wrote.out);
  const again = cli(root, ["workstream", "layout", "write", "031"]);
  ok("[MKT.SCRIPTS.622] red: a second write is refused, because the sections hold answers", again.code !== 0 && again.out.includes("already written"), again.out);
}

console.log("\n=== the go waits while a section is Pending");
{
  const checked = cli(root, ["workstream", "layout", "check", "031"]);
  ok("[MKT.SCRIPTS.625] red: layout check refuses the go and names a Pending section with what it needs", checked.code === 1 && checked.out.includes("Refused") && checked.out.includes("1.2 The long-term vision is Pending"), checked.out);
  const go = cli(root, ["workstream", "go", "write", "031/N001"]);
  ok("[MKT.SCRIPTS.625] red: go write refuses while a layout section is Pending, and writes nothing", go.code === 1 && go.out.includes("waits on") && go.out.includes("Nothing was written"), go.out);
}

console.log("\n=== an answer is kept once and cited where it lands");
{
  const said = "advisors join in phase 3";
  const answered = cli(root, ["workstream", "layout", "answer", "031", "1.4,3.1", "--said", said]);
  ok("[MKT.SCRIPTS.623] layout answer records the founder's words once, as a decision both sections cite", answered.code === 0 && layoutOf().decisions.filter((one) => one.said === said).length === 1 && "D002" in section("1.4").cites && "D002" in section("3.1").cites, answered.out);
  ok("[MKT.SCRIPTS.623] each section it names reads Proposed with the words as Known", section("1.4").state === "PROPOSED" && section("3.1").known === said);
  const log = readFileSync(join(ws, "arcs", "ideate", "log.jsonl"), "utf8").trim().split("\n").map((one) => JSON.parse(one));
  ok("[MKT.SCRIPTS.623] and the ideate arc's log carries the answer with its decision and sections", log.some((one) => one.kind === "answered" && one.decision === "D002" && one.sections.join() === "1.4,3.1"));
  const none = cli(root, ["workstream", "layout", "answer", "031", "9.9", "--said", "x"]);
  ok("[MKT.SCRIPTS.623] red: a section the layout does not hold is refused by name", none.code !== 0 && none.out.includes("9.9"), none.out);
}

console.log("\n=== a part that does not apply is struck by the founder's words");
{
  const early = cli(root, ["workstream", "layout", "decide", "031", "1.2"]);
  ok("[MKT.SCRIPTS.626] red: layout decide refuses a section still Pending", early.code !== 0 && early.out.includes("still Pending"), early.out);
  const struck = cli(root, ["workstream", "layout", "strike", "031", "4.3", "--said", "no public site: it is an internal platform"]);
  ok("[MKT.SCRIPTS.626] layout strike marks the section Struck by a recorded decision", struck.code === 0 && section("4.3").state === "STRUCK" && Object.keys(section("4.3").cites).length === 1, struck.out);
}

console.log("\n=== every section decided, the go may run; a changed answer stops it again");
{
  const layout = layoutOf();
  const open = layout.sections.filter((one) => one.state === "PENDING").map((one) => one.id);
  cli(root, ["workstream", "layout", "answer", "031", open.join(","), "--said", "agreed in the founder's words"]);
  const ids = layoutOf().sections.filter((one) => one.state !== "STRUCK").map((one) => one.id);
  const decided = cli(root, ["workstream", "layout", "decide", "031", ids.join(",")]);
  const checked = cli(root, ["workstream", "layout", "check", "031"]);
  ok("[MKT.SCRIPTS.625] once every section is decided or struck, layout check lets the go run", decided.code === 0 && checked.code === 0 && checked.out.includes("the go may run") && !checked.out.includes("4.3"), `${decided.out}\n${checked.out}`);

  const changed = cli(root, ["workstream", "layout", "change", "031", "D002", "--said", "advisors join in phase 2"]);
  ok("[MKT.SCRIPTS.624] layout change moves the decision to a new revision and reopens every section citing it", changed.code === 0 && layoutOf().decisions.find((one) => one.id === "D002").rev === 2 && section("1.4").state === "PROPOSED" && section("3.1").state === "PROPOSED" && changed.out.includes("1.4, 3.1"), changed.out);
  ok("[MKT.SCRIPTS.624] each reopened section carries the new words, and a section citing another decision stays decided", section("1.4").known === "advisors join in phase 2" && section("1.2").state === "DECIDED");
  const stale = cli(root, ["workstream", "layout", "check", "031"]);
  ok("[MKT.SCRIPTS.625] red: a section citing a decision newer than itself refuses the go", stale.code === 1 && stale.out.includes("1.4 Phases cites D002, which changed since") && stale.out.includes("3.1"), stale.out);
  cli(root, ["workstream", "layout", "decide", "031", "1.4,3.1"]);
  const again = cli(root, ["workstream", "layout", "check", "031"]);
  ok("[MKT.SCRIPTS.625] decided again on the new words, the go may run", again.code === 0, again.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream layout` : `\n  all ${total} passed — workstream layout`);
process.exit(failed ? 1 : 0);
