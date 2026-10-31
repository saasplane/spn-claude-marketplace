// `commands/workstream/open.ts` and `close.ts` — opening a workstream from the six-things block and closing it through the
// close gate. Run as the agent types the commands, in a throwaway workspace.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace } from "../../../../helpers/workstream-fixture.mjs";
import { workspace } from "../../../../helpers/fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const BLOCK = {
  subject: "probe-reach", goal: "The probe reaches every partner.", whyNow: "Partners ask for it every week.",
  reaches: "The partner sign-in and its pages.", seeFirst: "Sign-in page with probe", limits: "No change to billing.",
};
const WORDS = "I want the probe to reach every partner";

console.log("=== open: a block with one of the six things missing is refused");
{
  const root = workspace("lifecycle-open", {
    ".spndevex/state.json": `${JSON.stringify({ workspace: { name: "saasplane" }, workstreams: { lastNumber: 40 }, debug: { telemetry: false } }, null, 2)}\n`,
  }, [".spndevex/workstreams/closed/012-old-work", ".spndevex/workstreams/open", ".spndevex/workstreams/backlog"]);
  const put = (name, block) => { const file = join(root, name); writeFileSync(file, JSON.stringify(block)); return file; };
  const open = (...args) => cli(root, ["workstream", "open", ...args]);
  const opened = (state) => join(root, ".spndevex", "workstreams", state);

  const { limits, ...short } = BLOCK;
  const refused = open("--file", put("short.json", short), "--note", WORDS);
  ok("[MKT.SCRIPTS.309] a block missing the limits is refused, naming it, and nothing is written",
    refused.code === 1 && refused.out.includes("limits") && !existsSync(join(opened("open"), "041-probe-reach")) && json(join(root, ".spndevex", "state.json")).workstreams.lastNumber === 40, refused.out);

  const noWords = open("--file", put("whole.json", BLOCK));
  ok("[MKT.SCRIPTS.309] no words of the developer is refused", noWords.code !== 0 && !existsSync(join(opened("open"), "041-probe-reach")), noWords.out);

  const made = open("--file", put("whole.json", BLOCK), "--note", WORDS);
  const folder = join(opened("open"), "041-probe-reach");
  ok("[MKT.SCRIPTS.309] the next number is taken above the recorded one and the folder is made", made.code === 0 && existsSync(join(folder, "approach.html")), made.out);
  ok("[MKT.SCRIPTS.309] the number is recorded, and the other nodes of the state file are kept",
    json(join(root, ".spndevex", "state.json")).workstreams.lastNumber === 41 && json(join(root, ".spndevex", "state.json")).debug.telemetry === false);
  const page = existsSync(join(folder, "approach.html")) ? readFileSync(join(folder, "approach.html"), "utf8") : "";
  ok("[MKT.SCRIPTS.309] the approach page is written from the block", page.includes("041 - Probe Reach") && page.includes(BLOCK.whyNow) && page.includes(BLOCK.limits) && page.includes(BLOCK.reaches), page.slice(0, 200));
  const arc = join(folder, "arcs", "N001");
  ok("[MKT.SCRIPTS.309] the first arc is opened for what the developer wants to see first", existsSync(join(arc, "state.json")) && json(join(arc, "state.json")).title === BLOCK.seeFirst);
  ok("[MKT.SCRIPTS.309] the developer's words are in the arc's log", existsSync(join(arc, "log.jsonl")) && readFileSync(join(arc, "log.jsonl"), "utf8").includes(WORDS));

  const again = open("--file", put("again.json", { ...BLOCK, subject: "second-one" }), "--note", WORDS);
  ok("[MKT.SCRIPTS.309] the next workstream takes the next number", again.code === 0 && existsSync(join(opened("open"), "042-second-one")) && json(join(root, ".spndevex", "state.json")).workstreams.lastNumber === 42, again.out);

  const noBlocker = open("--file", put("third.json", { ...BLOCK, subject: "third-one" }), "--note", WORDS, "--backlog", " ");
  ok("[MKT.SCRIPTS.309] a backlog workstream without its blocker is refused", noBlocker.code === 1 && noBlocker.out.includes("blocker") && !existsSync(join(opened("backlog"), "043-third-one")), noBlocker.out);
  const parked = open("--file", put("third.json", { ...BLOCK, subject: "third-one" }), "--note", WORDS, "--backlog", "the partner contract is not signed");
  ok("[MKT.SCRIPTS.309] a backlog workstream with its blocker is opened in backlog", parked.code === 0 && existsSync(join(opened("backlog"), "043-third-one", "approach.html")), parked.out);
}

console.log("\n=== close: an unfinished plan refuses it");
{
  const rows = [
    { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", altitude: "DOCS", blockedBy: [], touches: ["spn-x:docs"], state: "landed", entries: ["E1"] },
  ];
  const { root, ws } = await dataWorkspace("lifecycle-close", { rows });
  const closed = join(root, ".spndevex", "workstreams", "closed", "031-probe");
  const entry = { id: "E1", op: "edit", file: "spn-x:docs/a.md", what: "change E1", decidedBy: ["q1"], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit: ["T.E1.01"] }, docs: [], book: [] };
  const sheetIn = join(root, "sheet-in.json");
  writeFileSync(sheetIn, JSON.stringify({ schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [], stack: { folder: "the spn-x checkout", dmo: "none", reset: "from empty" }, entries: [entry] }));
  cli(root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  cli(root, ["workstream", "sheet", "write", "N001", "--file", sheetIn]);
  const planned = cli(root, ["workstream", "go", "write", "N001"]);
  const before = readFileSync(join(ws, "approach.html"), "utf8");

  const refused = cli(root, ["workstream", "close", "031"]);
  ok("[MKT.SCRIPTS.310] a plan with a part not landed refuses the close, and the folder stays", planned.code === 0 && refused.code === 1 && /go|part/.test(refused.out) && !existsSync(closed) && existsSync(ws), `${planned.out}\n${refused.out}`);
  ok("[MKT.SCRIPTS.310] a refused close leaves the approach page as it was", readFileSync(join(ws, "approach.html"), "utf8") === before);

  const plan = join(ws, "arcs", "N001", "go.json");
  const data = json(plan);
  writeFileSync(plan, JSON.stringify({ ...data, parts: data.parts.map((part) => ({ ...part, state: "landed" })) }, null, 2));
  const arcFile = join(ws, "arcs", "N001", "state.json");
  const arcData = json(arcFile);
  writeFileSync(arcFile, JSON.stringify({ ...arcData, rows: arcData.rows.map((row) => ({ ...row, state: "landed" })) }, null, 2));
  const done = cli(root, ["workstream", "close", "031"]);
  const moved = join(closed, "approach.html");
  ok("[MKT.SCRIPTS.310] a whole, landed go closes: the folder moves into closed", done.code === 0 && existsSync(moved) && !existsSync(ws), done.out);
  const page = existsSync(moved) ? readFileSync(moved, "utf8") : "";
  ok("[MKT.SCRIPTS.310] the approach page is stamped DONE", /sds-done">[^<]*DONE</.test(page) && !page.includes("PLANNING</span>"), page.slice(0, 600));
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
