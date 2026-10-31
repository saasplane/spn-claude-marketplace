// `commands/workstream/go.ts` — the go commands: `write` refuses an unready scope and otherwise writes `go.json` and every
// part's brief, `show` prints the parts, `check` reads the plan against the sheets, `start` marks a baseline or full run
// running. Run as the agent types the commands, in a throwaway workspace.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

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
  ok("[MKT.SCRIPTS.306] a brief gives the report's front matter that report write folds", brief.includes("## Report") && brief.includes("outcome: landed · stopped · needs-you") && brief.includes("cost: {"), brief.slice(-500));
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

console.log("\n=== write: a proof still owed after the code landed");
{
  const done = (over) => ({ parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "landed", ...over });
  const owed = await dataWorkspace("go-proof", { rows: [
    done({ id: "1", title: "write the book", altitude: "DOCS", entries: ["E1"] }),
    done({ id: "2", title: "build it", altitude: "CODE", entries: ["E2"] }),
    done({ id: "3", title: "release spn-x", altitude: "RELEASE" }),
    done({ id: "4", title: "prove spn-x", altitude: "PROOF", state: "ready" }),
  ] });
  cli(owed.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(owed.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]), null, 2));
  const wrote = cli(owed.root, ["workstream", "go", "write", "N001"]);
  const ids = existsSync(join(owed.ws, "arcs", "N001", "go.json")) ? json(join(owed.ws, "arcs", "N001", "go.json")).parts.map((p) => p.id) : [];
  ok("[MKT.SCRIPTS.322] go write gives a repository its full run while a proof step there has not landed", wrote.code === 0 && ids.includes("full-spn-x"), wrote.out + JSON.stringify(ids));
  ok("[MKT.SCRIPTS.322] and no baseline, with no code left to compare", !ids.includes("baseline-spn-x"), JSON.stringify(ids));
}

console.log("\n=== wait: a part waits on something outside the plan");
{
  const waited = go("wait", "N001", "code-spn-x-1", "--on", "the release of spn-support-ts");
  const part = json(goFile).parts.find((p) => p.id === "code-spn-x-1");
  ok("[MKT.HOOKS.322] go wait marks the part waiting and keeps the reason", waited.code === 0 && part?.state === "waiting" && part?.waitingOn === "the release of spn-support-ts", waited.out);
  ok("[MKT.HOOKS.322] go wait ends with the next step", lastLine(waited.out).startsWith("Next:"), waited.out);
  ok("[MKT.HOOKS.322] show reads that part as waiting", go("show", "N001", "--part", "code-spn-x-1").out.includes("waiting on the release of spn-support-ts"), "");
  const landed = go("wait", "N001", "docs-spn-x-1", "--on", "a sign-in");
  ok("[MKT.HOOKS.322] a landed part cannot wait, and the plan is unchanged", landed.code !== 0 && json(goFile).parts.find((p) => p.id === "docs-spn-x-1")?.state === "landed", landed.out);
  const bare = go("wait", "N001", "code-spn-x-1");
  ok("[MKT.HOOKS.322] go wait without --on is refused", bare.code !== 0 && bare.out.includes("--on"), bare.out);
}

console.log("\n=== write: one refusal names every fault");
{
  const wide = go("write", "N001", "--scope", "N002,N001");
  ok("[MKT.HOOKS.324] the lead mismatch and the other faults come in one refusal", wide.code === 1 && wide.out.includes("N002") && wide.out.includes("lead") && wide.out.includes("N002 has no data"), wide.out);
  const file = join(ws, "arcs", "N001", "state.json");
  const data = json(file);
  writeFileSync(file, JSON.stringify({ ...data, status: "PROPOSED" }, null, 2));
  const sheetFile = join(ws, "arcs", "N001", "sheet.json");
  const sheet = json(sheetFile);
  writeFileSync(sheetFile, JSON.stringify({ ...sheet, releaseChain: ["spn-x then spn-y"] }, null, 2));
  const both = go("write", "N001");
  ok("[MKT.HOOKS.324] an undecided arc and a bad release line are both named", both.code === 1 && both.out.includes("DECIDED") && both.out.includes("release order line"), both.out);
  writeFileSync(file, JSON.stringify(data, null, 2));
  writeFileSync(sheetFile, JSON.stringify(sheet, null, 2));
}

console.log("\n=== start: a full run is refused on a tree that holds uncommitted changes");
{
  const row = (id, altitude, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "landed", title: `row ${id}`, altitude, ...over });
  const dirty = await dataWorkspace("go-dirty", { rows: [
    row("1", "DOCS", { entries: ["E1"] }), row("2", "CODE", { entries: ["E2"] }), row("3", "RELEASE"), row("4", "PROOF", { state: "ready" }),
  ] });
  cli(dirty.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(dirty.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]), null, 2));
  cli(dirty.root, ["workstream", "go", "write", "N001"]);
  const file = join(dirty.ws, "arcs", "N001", "go.json");
  const stateOfFull = () => json(file).parts.find((p) => p.id === "full-spn-x")?.state;
  writeFileSync(join(dirty.repo, "pending.ts"), "export const b = 2;\n");
  writeFileSync(join(dirty.repo, "a.ts"), "export const a = 3;\n");
  const refused = cli(dirty.root, ["workstream", "go", "start", "N001", "full-spn-x"]);
  ok("[MKT.HOOKS.322] start is refused, naming each changed file, and the part stays", refused.code === 1 && refused.out.includes("pending.ts") && refused.out.includes("a.ts") && stateOfFull() === "ready", `${stateOfFull()} ${refused.out}`);
  dirty.git(["add", "-A"]);
  dirty.git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "second"]);
  const clean = cli(dirty.root, ["workstream", "go", "start", "N001", "full-spn-x"]);
  ok("[MKT.HOOKS.322] the same start runs once the tree is committed", clean.code === 0 && stateOfFull() === "running", clean.out);
}

console.log("\n=== report write: a part's report lands its row on a green run, in one command");
{
  const row = (id, altitude, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "waiting", title: `row ${id}`, altitude, ...over });
  const rep = await dataWorkspace("go-report", { rows: [row("1", "CODE", { entries: ["E1"] })] });
  cli(rep.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const sheetFile = join(rep.ws, "arcs", "N001", "sheet.json");
  writeFileSync(sheetFile, JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  cli(rep.root, ["workstream", "go", "write", "N001"]);
  const arcFile = join(rep.ws, "arcs", "N001", "state.json");
  const rowState = () => json(arcFile).rows[0].state;
  const part = json(join(rep.ws, "arcs", "N001", "go.json")).parts.find((p) => p.pass === "CODE");
  const sha = rep.git(["rev-parse", "HEAD"]);
  const runIn = (results) => put(rep.root, "spn-x/pkg/tests/.output/unit/runs/r1.json", JSON.stringify({ run: "r1", tier: "unit", ranAt: new Date(Date.now() + 3600e3).toISOString(), env: "local", results: results.map((id) => ({ id, tier: "unit", status: "SUCCESS", title: id })) }));
  const report = (id, ...extra) => { put(rep.ws, `notes/N001/orders/${id}.report.md`, ["---", 'row: "1"', "outcome: landed", ...extra, "---", "Body.", ""].join("\n")); return cli(rep.root, ["workstream", "report", "write", "031", `notes/N001/orders/${id}.report.md`]); };

  // two faults at once: the entry names no test, and the report records no commit
  writeFileSync(sheetFile, JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts", { tiers: {} })]), null, 2));
  runIn([]);
  const faulty = report(part.id, "run: r1");
  ok("[MKT.HOOKS.324] a report that cannot land its row names every fault at once, and the row stays", rowState() !== "landed" && faulty.out.includes("name no test") && faulty.out.includes("no commit"), faulty.out);

  writeFileSync(sheetFile, JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  runIn(["T.E1.01"]);
  const once = report(part.id, "run: r1", `commits: { spn-x: [${sha}] }`);
  ok("[MKT.HOOKS.321] one report write records the commits and the run, and lands the row", rowState() === "landed" && json(arcFile).rows[0].commits["spn-x"].includes(sha) && json(arcFile).rows[0].proof === "run r1", once.out);
  ok("[MKT.HOOKS.321] and prints the row's split of change, proof, managing and refusals", /row 1 split.*change.*proof.*managing.*refusals/.test(once.out), once.out);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
