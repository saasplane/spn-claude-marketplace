// `workstream suggestion state … parked --changes-work` — parking takes the mark that the suggestion changes how the developer
// works (035 Q34), and the next window's start shows it (MKT.HOOKS.500).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const lines = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const { root, ws } = await dataWorkspace("suggestion");
const file = join(ws, "suggestions.jsonl");
put(root, ".spndevex/workstreams/open/031-probe/suggestions.jsonl",
  [{ id: "s1", title: "show parked work at the start" }, { id: "s2", title: "a thought" }, { id: "s3", title: "another thought" }]
    .map((one) => JSON.stringify({ v: 1, state: "raised", preview: null, words: null, ...one })).join("\n") + "\n");

console.log("=== parking takes the mark");
{
  const parked = cli(root, ["workstream", "suggestion", "state", "031", "S1", "parked", "--changes-work", "--words", "waits for the next window"]);
  const one = lines(file).find((line) => line.id === "s1");
  ok("[MKT.HOOKS.500] parking with --changes-work keeps the mark on the suggestion and parks it", parked.code === 0 && one.state === "parked" && one.changesWork === true, parked.out + JSON.stringify(one));
  const plain = cli(root, ["workstream", "suggestion", "state", "031", "S2", "parked"]);
  const two = lines(file).find((line) => line.id === "s2");
  ok("[MKT.HOOKS.500] parking without the flag leaves no mark, so the start does not show it", plain.code === 0 && two.state === "parked" && two.changesWork === undefined, plain.out + JSON.stringify(two));
}

console.log("\n=== the mark goes only with parking");
{
  const refused = cli(root, ["workstream", "suggestion", "state", "031", "S3", "dropped", "--changes-work"]);
  const three = lines(file).find((line) => line.id === "s3");
  ok("[MKT.HOOKS.500] red: --changes-work with any move but parked is refused and writes nothing",
    refused.code !== 0 && refused.out.includes("--changes-work") && refused.out.includes("parked") && three.state === "raised" && three.changesWork === undefined, refused.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream suggestion` : `\n  all ${total} passed — workstream suggestion`);
process.exit(failed ? 1 : 0);
