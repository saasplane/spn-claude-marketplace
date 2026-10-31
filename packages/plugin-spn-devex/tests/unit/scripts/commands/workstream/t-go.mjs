// `commands/workstream/go.ts` — the go commands: `write` refuses an unready scope and otherwise writes `go.json` and every
// part's brief, `show` prints the parts, `check` reads the plan against the sheets, `start` marks a baseline or full run
// running. Run as the agent types the commands, in a throwaway workspace.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const rows = [
  { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", altitude: "DOCS", blockedBy: [], touches: ["spn-x:docs"], state: "waiting", entries: ["E1"] },
  { id: "2", parent: "N001", title: "build it", kind: "change", repo: "spn-x", altitude: "CODE", blockedBy: ["1"], touches: ["spn-x:src"], state: "waiting", entries: ["E2"] },
];
const { root, ws } = await dataWorkspace("go", { rows });
const goFile = join(ws, "arcs", "N001", "go.json");
const orders = join(ws, "notes", "N001", "orders");
const entry = (id, file, over = {}) => ({
  id, op: "edit", file, what: `change ${id}`, decidedBy: ["q1"], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit: [`T.${id}.01`] }, docs: [], book: [], ...over,
});
const sheetOf = (entries) => ({
  schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [],
  stack: { folder: "the spn-x checkout", dmo: "none", reset: "from empty" }, entries,
});
const sheetIn = join(root, "sheet-in.json");
const putSheet = (entries) => writeFileSync(sheetIn, JSON.stringify(sheetOf(entries)));
const go = (...args) => cli(root, ["workstream", "go", ...args]);
const lastLine = (out) => out.trim().split("\n").at(-1);

console.log("=== write: an arc with no sheet is refused");
{
  const refused = go("write", "N001");
  ok("[MKT.SCRIPTS.303] refused, exits 1, nothing written", refused.code === 1 && refused.out.includes("Refused") && refused.out.includes("Nothing was written") && !existsSync(goFile), refused.out);
}

cli(root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
putSheet([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]);
cli(root, ["workstream", "sheet", "write", "N001", "--file", sheetIn, "--because", "the developer added E3"]);

console.log("\n=== write: a sheet with a finding is refused");
{
  putSheet([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts"), entry("E3", "spn-x:src/c.ts")]);
  cli(root, ["workstream", "sheet", "write", "N001", "--file", sheetIn, "--because", "the developer added E3"]);
  cli(root, ["workstream", "sheet", "drop", "N001", "E3", "--note", "not needed"]);
  const refused = go("write", "N001");
  ok("[MKT.SCRIPTS.303] a sheet finding refuses the go and names the finding", refused.code === 1 && refused.out.includes("E3") && !existsSync(goFile), refused.out);
  putSheet([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]);
  cli(root, ["workstream", "sheet", "write", "N001", "--file", sheetIn, "--because", "E3 is not needed"]);
}

console.log("\n=== write: a scope arc not decided is refused");
{
  const file = join(ws, "arcs", "N001", "state.json");
  const data = json(file);
  writeFileSync(file, JSON.stringify({ ...data, status: "PROPOSED" }, null, 2));
  const refused = go("write", "N001");
  ok("[MKT.SCRIPTS.303] an arc not DECIDED is refused", refused.code === 1 && refused.out.includes("N001") && refused.out.includes("DECIDED") && !existsSync(goFile), refused.out);
  writeFileSync(file, JSON.stringify(data, null, 2));
}

console.log("\n=== write: the plan and the briefs");
{
  const wrote = go("write", "N001", "--scope", "N001");
  ok("[MKT.SCRIPTS.303] a ready scope writes go.json", wrote.code === 0 && existsSync(goFile), wrote.out);
  const plan = existsSync(goFile) ? json(goFile) : { parts: [], scope: [] };
  ok("[MKT.SCRIPTS.314] the plan records the go's scope and its lead", JSON.stringify(plan.scope) === '["N001"]' && plan.lead === "N001");
  ok("[MKT.SCRIPTS.314] the plan carries the scope's release part, last", plan.parts.at(-1)?.id === "release-spn-x-1" && plan.parts.at(-1)?.pass === "RELEASE", JSON.stringify(plan.parts.map((p) => p.id)));
  ok("[MKT.SCRIPTS.303] every part with entries has a brief", plan.parts.filter((p) => p.entries.length).every((p) => existsSync(join(orders, `${p.id}.md`))), wrote.out);
  const brief = existsSync(join(orders, "code-spn-x-1.md")) ? readFileSync(join(orders, "code-spn-x-1.md"), "utf8") : "";
  ok("[MKT.SCRIPTS.303] a brief opens with the go, the part and its entries", brief.startsWith("---\n") && brief.includes('go: "N001"') && brief.includes('part: "code-spn-x-1"') && brief.includes("N001/E2"), brief.slice(0, 200));
  ok("[MKT.SCRIPTS.315] write ends with the next step", lastLine(wrote.out).startsWith("Next:"), wrote.out);
}

console.log("\n=== show");
{
  const shown = go("show", "N001");
  ok("[MKT.SCRIPTS.304] show lists each part", shown.code === 0 && ["docs-spn-x-1", "baseline-spn-x", "code-spn-x-1", "full-spn-x", "release-spn-x-1"].every((id) => shown.out.includes(id)), shown.out);
  const line = (id) => shown.out.split("\n").find((one) => one.includes(id)) ?? "";
  ok("[MKT.SCRIPTS.304] a part with nothing before it reads ready, one whose waits are open reads waiting", /ready/.test(line("docs-spn-x-1")) && /waiting/.test(line("code-spn-x-1")), shown.out);
  ok("[MKT.SCRIPTS.304] show prints the entry and what it waits on", line("code-spn-x-1").includes("N001/E2") && line("code-spn-x-1").includes("baseline-spn-x"), line("code-spn-x-1"));
  const one = go("show", "N001", "--part", "code-spn-x-1");
  ok("[MKT.SCRIPTS.304] --part prints that part alone", one.code === 0 && one.out.includes("code-spn-x-1") && !one.out.split("\n").some((l) => l.startsWith("docs-spn-x-1")), one.out);
  const asJson = go("show", "N001", "--json");
  ok("[MKT.SCRIPTS.304] --json prints the plan", asJson.code === 0 && JSON.parse(asJson.out).parts.length === 5, asJson.out);
  ok("[MKT.SCRIPTS.315] show ends with the next step", lastLine(shown.out).startsWith("Next:"), shown.out);
}

console.log("\n=== check");
{
  const clean = go("check", "N001");
  ok("[MKT.SCRIPTS.305] a plan that reads whole exits 0", clean.code === 0 && clean.out.includes("whole"), clean.out);
  putSheet([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts"), entry("E3", "spn-x:src/c.ts")]);
  cli(root, ["workstream", "sheet", "write", "N001", "--file", sheetIn, "--because", "the developer added E3"]);
  const lost = go("check", "N001");
  ok("[MKT.SCRIPTS.305] an entry no part holds is named, exit 1", lost.code === 1 && lost.out.includes("N001/E3"), lost.out);
  putSheet([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]);
  cli(root, ["workstream", "sheet", "write", "N001", "--file", sheetIn, "--because", "E3 is not needed"]);
  cli(root, ["workstream", "sheet", "edit", "N001", "E2", "--what", "changed after the plan"]);
  const moved = go("check", "N001");
  ok("[MKT.SCRIPTS.308] a part whose entry changed is named, exit 1", moved.code === 1 && moved.out.includes("code-spn-x-1") && moved.out.includes("N001/E2"), moved.out);
  const states = Object.fromEntries(json(goFile).parts.map((p) => [p.id, p.state]));
  ok("[MKT.SCRIPTS.308] check marks that part held and no other", states["code-spn-x-1"] === "held" && states["docs-spn-x-1"] === "ready", JSON.stringify(states));
  ok("[MKT.SCRIPTS.315] check ends with the next step", lastLine(moved.out).startsWith("Next:"), moved.out);
}

console.log("\n=== write again keeps the work done");
{
  const plan = json(goFile);
  writeFileSync(goFile, JSON.stringify({ ...plan, parts: plan.parts.map((p) => (p.id === "docs-spn-x-1" ? { ...p, state: "landed" } : p)) }, null, 2));
  const again = go("write", "N001");
  const parts = json(goFile).parts;
  ok("[MKT.SCRIPTS.307] a landed part stays landed", again.code === 0 && parts.find((p) => p.id === "docs-spn-x-1")?.state === "landed", again.out);
  ok("[MKT.SCRIPTS.307] a held part is derived again, ready", parts.find((p) => p.id === "code-spn-x-1")?.state === "ready", JSON.stringify(parts.map((p) => [p.id, p.state])));
  ok("[MKT.SCRIPTS.305] the plan read again is whole", go("check", "N001").code === 0);
}

console.log("\n=== start");
{
  const code = go("start", "N001", "code-spn-x-1");
  ok("[MKT.SCRIPTS.315] a code part is refused: only a baseline or a full run starts", code.code === 1 && code.out.includes("baseline"), code.out);
  const waiting = go("start", "N001", "full-spn-x");
  ok("[MKT.SCRIPTS.315] a full run whose code has not landed is refused", waiting.code === 1 && waiting.out.includes("code-spn-x-1"), waiting.out);
  const baseline = go("start", "N001", "baseline-spn-x");
  ok("[MKT.SCRIPTS.315] a ready baseline is marked running", baseline.code === 0 && json(goFile).parts.find((p) => p.id === "baseline-spn-x")?.state === "running", baseline.out);
  ok("[MKT.SCRIPTS.315] start ends with the next step", lastLine(baseline.out).startsWith("Next:"), baseline.out);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
