// `workstream suggestion state … parked --changes-work` — parking takes the mark that the suggestion changes how the developer
// works (035 Q34), and the next window's start shows it (MKT.HOOKS.500).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CARD, cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const { suggestionFaults, namesCitedFaults } = await import("../../../../../src/scripts/lib/workstream-schema.ts");
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

console.log("\n=== a code suggestion that shows names cites the chapter it read");
{
  // A CODE card whose options carry `code`: its nearest construct is a .ts file that exists, and its preview says why the options differ.
  put(root, "spn-x/packages/job/src/contract/states/job.ts", "export {};\n");
  const card = (answered) => ({
    ...CARD, nearest: "spn-x/packages/job/src/contract/states/job.ts", preview: { reason: "The options differ in one line." },
    options: CARD.options.map((option) => ({ ...option, code: "isActive: CDTBoolean;" })),
    settled: { ...CARD.settled, answered },
  });
  const raise = (answered, title) => { put(root, "c.json", JSON.stringify(card(answered))); return cli(root, ["workstream", "suggestion", "add", "031/N001", title, "--file", "c.json"]); };
  const before = lines(file).length;
  const refused = raise("The lookup found nothing that settles it.", "a code card citing nothing");
  ok("[MKT.SCRIPTS.578] red: a CODE suggestion whose option carries `code` and whose `settled.answered` cites no `docs/...md` path or `RULE.` id is refused, saying to cite the chapter",
    refused.code !== 0 && refused.out.includes("cites no chapter or rule") && refused.out.includes("refuses"), refused.out);
  ok("[MKT.SCRIPTS.578] and the refusal writes no record", lines(file).length === before);
  const byChapter = raise("docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md names the field and does not settle it.", "a code card citing a chapter");
  ok("[MKT.SCRIPTS.578] green: the same raise with `answered` naming a `docs/...md` chapter is accepted", byChapter.code === 0 && lines(file).length === before + 1, byChapter.out);
  const byRule = raise("RULE.DEVEX.WORKSPACE.491 names the field and does not settle it.", "a code card citing a rule");
  ok("[MKT.SCRIPTS.578] and so is one naming a `RULE.` id", byRule.code === 0 && lines(file).length === before + 2, byRule.out);

  // A record already on file is never held to the citation: the check runs on a raise only.
  const old = { v: 1, id: "s9", title: "an old code card", state: "raised", preview: "a: b", words: null, arc: "N001", about: "CODE", settled: card("nothing cited").settled, card: card("nothing cited") };
  ok("[MKT.SCRIPTS.578] the cited-names check does refuse the card when it is raised now", namesCitedFaults(old.card).length === 1, JSON.stringify(namesCitedFaults(old.card)));
  ok("[MKT.SCRIPTS.578] but an existing record read with no citation has no fault", suggestionFaults(old, "S9").length === 0, suggestionFaults(old, "S9").join("; "));
  put(root, ".spndevex/workstreams/open/031-probe/suggestions.jsonl", `${lines(file).concat([old]).map((one) => JSON.stringify(one)).join("\n")}\n`);
  const moved = cli(root, ["workstream", "suggestion", "state", "031", "S9", "parked"]);
  ok("[MKT.SCRIPTS.578] and moving it on is never refused for the missing citation", moved.code === 0 && lines(file).find((one) => one.id === "s9")?.state === "parked", moved.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream suggestion` : `\n  all ${total} passed — workstream suggestion`);
process.exit(failed ? 1 : 0);
