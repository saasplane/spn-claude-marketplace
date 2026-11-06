// `workstream finding` — a saved review's findings as records: written open, answered by entries that exist, a card that exists or a drop
// with a reason, and the state check naming the ones still open once the preview has no slot left (MKT.SCRIPTS.519, MKT.SCRIPTS.520).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("finding");
const findings = [{ view: "qa", number: 7, text: "no service contract is shown" }, { view: "architect", number: 2, text: "isActive is spelled active" }, { view: "qa", number: 9, text: "a duplicate" }];
put(root, "f.json", JSON.stringify(findings));
const file = join(ws, "arcs", "N001", "findings.jsonl");
const lines = () => readFileSync(file, "utf8").trim().split("\n").map((line) => JSON.parse(line));

console.log("=== write, decide and show");
{
  const wrote = cli(root, ["workstream", "finding", "write", "031/N001", "--file", "f.json"]);
  ok("[MKT.SCRIPTS.519] finding write saves each finding open, numbered F1 to F3", wrote.code === 0 && lines().map((one) => `${one.id}:${one.state}`).join(" ") === "F1:open F2:open F3:open", wrote.out);
  const carriedNone = cli(root, ["workstream", "finding", "decide", "031/N001", "F1", "--carried", "E9"]);
  ok("[MKT.SCRIPTS.519] red: a finding carried into an entry the sheet does not hold is refused", carriedNone.code !== 0 && carriedNone.out.includes("E9"), carriedNone.out);
  const cardNone = cli(root, ["workstream", "finding", "decide", "031/N001", "F1", "--decided", "Q12"]);
  ok("[MKT.SCRIPTS.519] red: a finding decided on a card that does not exist is refused", cardNone.code !== 0 && cardNone.out.includes("Q12"), cardNone.out);
  const bare = cli(root, ["workstream", "finding", "decide", "031/N001", "F1", "--dropped", " "]);
  ok("[MKT.SCRIPTS.519] red: a drop without a reason is refused", bare.code !== 0, bare.out);
  put(root, ".spndevex/workstreams/open/031-probe/arcs/N001/sheet.json", JSON.stringify({ schemaVersion: 1, entries: [{ id: "E1", op: "edit", file: "spn-x:a.ts", what: "w", decidedBy: [], facts: [], then: [], rules: [], callers: [], tiers: {}, docs: [], book: [], trace: "t" }] }));
  const carried = cli(root, ["workstream", "finding", "decide", "031/N001", "F1", "--carried", "E1"]);
  ok("[MKT.SCRIPTS.519] green: a finding carried into an entry that exists is answered", carried.code === 0 && lines()[0].state === "carried" && lines()[0].carried[0] === "E1", carried.out);
  const dropped = cli(root, ["workstream", "finding", "decide", "031/N001", "F3", "--dropped", "the same as F2"]);
  ok("[MKT.SCRIPTS.519] green: a finding dropped with a reason is answered", dropped.code === 0 && lines()[2].state === "dropped" && lines()[2].reason === "the same as F2", dropped.out);
  const open = cli(root, ["workstream", "finding", "show", "031/N001", "--open"]);
  ok("[MKT.SCRIPTS.519] finding show --open lists only F2", open.code === 0 && open.out.includes("F2") && !open.out.includes("F1 ") && !open.out.includes("F3"), open.out);
}

console.log("\n=== the state check names an open finding once the preview has no slot");
{
  const before = cli(root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.520] with a filled preview, an open finding is named with its id and the three ways to answer",
    before.out.includes("[findings]") && before.out.includes("1 review finding is open (F2)") && before.out.includes("carry each into a sheet entry") && before.out.includes("drop it with a reason"), before.out);
  const slotted = join(ws, "notes", "N001", "preview.html");
  const original = readFileSync(slotted, "utf8");
  writeFileSync(slotted, original.replace("the probe</p>", "{{the probe}}</p>"));
  const reading = cli(root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.520] a preview that still holds a slot is a review still being read: no finding line", !reading.out.includes("[findings]"), reading.out);
  writeFileSync(slotted, original);
  const decided = cli(root, ["workstream", "finding", "decide", "031/N001", "F2", "--dropped", "wrong view"]);
  const after = cli(root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.520] every finding answered: the check passes", decided.code === 0 && !after.out.includes("[findings]"), after.out);
}

console.log("\n=== an arc with no findings passes");
{
  const w = await dataWorkspace("finding-none");
  const check = cli(w.root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.520] an arc that has no findings file has no findings line", !check.out.includes("[findings]"), check.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream finding` : `\n  all ${total} passed — workstream finding`);
process.exit(failed ? 1 : 0);
