// `commands/workstream/go.ts` — the go commands: `write` refuses an unready scope and otherwise writes `go.json` and every
// part's brief, `show` prints the parts, `check` reads the plan against the sheets, `start` marks a baseline or full run
// running. Run as the agent types the commands, in a throwaway workspace.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { writeSwitch, telemetryFolder } from "../../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { arcData, cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

const rows = [
  { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: ["spn-x:docs"], state: "waiting", entries: ["E1"] },
  { id: "2", parent: "N001", title: "build it", kind: "change", repo: "spn-x", work: "CODE", blockedBy: ["1"], touches: ["spn-x:src"], state: "waiting", entries: ["E2"] },
];
const { root, ws } = await dataWorkspace("go", { rows });
const goFile = join(ws, "arcs", "N001", "go.json");
const orders = join(ws, "notes", "N001", "orders");
const entry = (id, file, over = {}) => ({
  id, op: "edit", file, what: `change ${id}`, decidedBy: ["q1"], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit: [`T.${id}.01`] }, docs: [], book: [], trace: `why ${id}`, judged: false, ...over,
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
  ok("[MKT.SCRIPTS.314] the plan carries the scope's release part after every other part but the proof, which is last", plan.parts.at(-1)?.id === "proof-spn-x" && plan.parts.at(-2)?.id === "release-spn-x-1" && plan.parts.at(-2)?.work === "RELEASE" && plan.parts.slice(0, -2).every((p) => p.work !== "RELEASE"), JSON.stringify(plan.parts.map((p) => p.id)));
  ok("[MKT.SCRIPTS.303] every part with entries has a brief", plan.parts.filter((p) => p.entries.length).every((p) => existsSync(join(orders, `${p.id}.md`))), wrote.out);
  const brief = existsSync(join(orders, "code-spn-x-q1-1.md")) ? readFileSync(join(orders, "code-spn-x-q1-1.md"), "utf8") : "";
  ok("[MKT.SCRIPTS.303] a brief opens with the go, the part and its entries", brief.startsWith("---\n") && brief.includes('go: "N001"') && brief.includes('part: "code-spn-x-q1-1"') && brief.includes("N001/E2"), brief.slice(0, 200));
  ok("[MKT.SCRIPTS.306] a brief gives the report's front matter that report write folds, and asks for no cost", brief.includes("## Report") && brief.includes("outcome: landed · stopped · needs-you") && !brief.includes("cost:"), brief.slice(-500));
  ok("[MKT.SCRIPTS.315] write ends with the next step", lastLine(wrote.out).startsWith("Next:"), wrote.out);
  ok("[MKT.SCRIPTS.446] a brief names `workstream sheet show <arc> --part <part>` for its entries, and no longer the whole sheet", brief.includes("`workstream sheet show N001 --part code-spn-x-q1-1` prints them") && !brief.includes("prints it whole"), brief);
  ok("[MKT.SCRIPTS.306] a brief no longer asks for a saved report on a part that lands: the helper hands back at most 8 lines and runs `workstream report write <workstream>/<arc> <part-id> --run <name>`",
    /workstream report write \S+\/N001 code-spn-x-q1-1 --run/.test(brief) && brief.includes("at most 8 lines") && !brief.includes("save the report, at most 15 lines, beside this brief"), brief);
  ok("[MKT.SCRIPTS.306] it asks for a saved report only to return `needs-you`, a follow-up or an `unnamed:` list, and the `## Report` block keeps the front matter shape",
    brief.includes("needs-you") && brief.includes("unnamed:") && brief.includes("## Report") && brief.includes("outcome: landed \u00b7 stopped \u00b7 needs-you"), brief.slice(-700));
  ok("[MKT.SCRIPTS.480] the Stop sentence comes from `sizedStop`, so it names the part's size of context and turns", /Stop at \d+k of context or \d+ turns/.test(brief), brief.slice(0, 900));
  ok("[MKT.SCRIPTS.480] the brief says to search with `grep` in Bash, since the helper has no Grep tool, and to read only the files below",
    brief.includes("Search with `grep` in Bash, since you have no Grep tool") && brief.includes("Read only the files below"), brief);
  ok("[MKT.SCRIPTS.481] the heading reads `# Order <part>` as the template does", brief.includes("# Order code-spn-x-q1-1") && !brief.includes("# Part code-spn-x-q1-1"), brief.slice(0, 400));
  const head = brief.split("\n---\n")[0];
  ok("[MKT.SCRIPTS.482] the front matter gains `touches` (repository:place), `decisions` (the cards `decidedBy` names) and `facts` (the fact ids)",
    /^touches:.*spn-x:src\/b\.ts/m.test(head) && /^decisions:.*q1/m.test(head) && /^facts:.*f1/m.test(head), head);
}

console.log("\n=== show");
{
  const shown = go("show", "N001");
  ok("[MKT.SCRIPTS.304] show lists each part", shown.code === 0 && ["docs-spn-x-q1-1", "baseline-spn-x", "code-spn-x-q1-1", "full-spn-x", "release-spn-x-1"].every((id) => shown.out.includes(id)), shown.out);
  const line = (id) => shown.out.split("\n").find((one) => one.includes(id)) ?? "";
  ok("[MKT.SCRIPTS.304] a part with nothing before it reads ready, one whose waits are open reads waiting", /ready/.test(line("docs-spn-x-q1-1")) && /waiting/.test(line("code-spn-x-q1-1")), shown.out);
  ok("[MKT.SCRIPTS.304] show prints the entry and what it waits on", line("code-spn-x-q1-1").includes("N001/E2") && line("code-spn-x-q1-1").includes("baseline-spn-x"), line("code-spn-x-q1-1"));
  const one = go("show", "N001", "--part", "code-spn-x-q1-1");
  ok("[MKT.SCRIPTS.304] --part prints that part alone", one.code === 0 && one.out.includes("code-spn-x-q1-1") && !one.out.split("\n").some((l) => l.startsWith("docs-spn-x-q1-1")), one.out);
  const asJson = go("show", "N001", "--json");
  ok("[MKT.SCRIPTS.304] --json prints the plan", asJson.code === 0 && JSON.parse(asJson.out).parts.length === 6, asJson.out);
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
  ok("[MKT.SCRIPTS.308] a part whose entry changed is named, exit 1", moved.code === 1 && moved.out.includes("code-spn-x-q1-1") && moved.out.includes("N001/E2"), moved.out);
  const states = Object.fromEntries(json(goFile).parts.map((p) => [p.id, p.state]));
  ok("[MKT.SCRIPTS.308] check marks that part held and no other", states["code-spn-x-q1-1"] === "held" && states["docs-spn-x-q1-1"] === "ready", JSON.stringify(states));
  ok("[MKT.SCRIPTS.315] check ends with the next step", lastLine(moved.out).startsWith("Next:"), moved.out);
}

console.log("\n=== write again keeps the work done");
{
  const plan = json(goFile);
  writeFileSync(goFile, JSON.stringify({ ...plan, parts: plan.parts.map((p) => (p.id === "docs-spn-x-q1-1" ? { ...p, state: "landed" } : p)) }, null, 2));
  const again = go("write", "N001");
  const parts = json(goFile).parts;
  ok("[MKT.SCRIPTS.307] a landed part stays landed", again.code === 0 && parts.find((p) => p.id === "docs-spn-x-q1-1")?.state === "landed", again.out);
  ok("[MKT.SCRIPTS.307] a held part is derived again, ready", parts.find((p) => p.id === "code-spn-x-q1-1")?.state === "ready", JSON.stringify(parts.map((p) => [p.id, p.state])));
  ok("[MKT.SCRIPTS.305] the plan read again is whole", go("check", "N001").code === 0);
}

console.log("\n=== start");
{
  const code = go("start", "N001", "code-spn-x-q1-1");
  ok("[MKT.SCRIPTS.315] a code part is refused: only a baseline or a full run starts", code.code === 1 && code.out.includes("baseline"), code.out);
  const waiting = go("start", "N001", "full-spn-x");
  ok("[MKT.SCRIPTS.315] a full run whose code has not landed is refused", waiting.code === 1 && waiting.out.includes("code-spn-x-q1-1"), waiting.out);
  const baseline = go("start", "N001", "baseline-spn-x");
  ok("[MKT.SCRIPTS.315] a ready baseline is marked running", baseline.code === 0 && json(goFile).parts.find((p) => p.id === "baseline-spn-x")?.state === "running", baseline.out);
  ok("[MKT.SCRIPTS.315] start ends with the next step", lastLine(baseline.out).startsWith("Next:"), baseline.out);
}

console.log("\n=== write: a proof still owed after the code landed");
{
  const done = (over) => ({ parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "landed", ...over });
  const owed = await dataWorkspace("go-proof", { rows: [
    done({ id: "1", title: "write the book", work: "DOCS", entries: ["E1"] }),
    done({ id: "2", title: "build it", work: "CODE", entries: ["E2"] }),
    done({ id: "3", title: "release spn-x", work: "RELEASE" }),
    done({ id: "4", title: "prove spn-x", work: "PROOF", state: "ready" }),
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
  const waited = go("wait", "N001", "code-spn-x-q1-1", "--on", "the release of spn-support-ts");
  const part = json(goFile).parts.find((p) => p.id === "code-spn-x-q1-1");
  ok("[MKT.HOOKS.322] go wait marks the part waiting and keeps the reason", waited.code === 0 && part?.state === "waiting" && part?.waitingOn === "the release of spn-support-ts", waited.out);
  ok("[MKT.HOOKS.322] go wait ends with the next step", lastLine(waited.out).startsWith("Next:"), waited.out);
  ok("[MKT.HOOKS.322] show reads that part as waiting", go("show", "N001", "--part", "code-spn-x-q1-1").out.includes("waiting on the release of spn-support-ts"), "");
  const landed = go("wait", "N001", "docs-spn-x-q1-1", "--on", "a sign-in");
  ok("[MKT.HOOKS.322] a landed part cannot wait, and the plan is unchanged", landed.code !== 0 && json(goFile).parts.find((p) => p.id === "docs-spn-x-q1-1")?.state === "landed", landed.out);
  const bare = go("wait", "N001", "code-spn-x-q1-1");
  ok("[MKT.HOOKS.322] go wait without --on is refused", bare.code !== 0 && bare.out.includes("--on"), bare.out);
}

console.log("\n=== wait --clear: a hand-marked wait comes off (E67)");
{
  const snapshot = readFileSync(goFile, "utf8");
  const stateOf = (id) => json(goFile).parts.find((p) => p.id === id);
  const opened = go("wait", "N001", "code-spn-x-q1-1", "--clear");
  ok("[MKT.HOOKS.322] E67 clear reads a part waiting again, on the part not landed, when what it waits on has not landed", opened.code === 0 && stateOf("code-spn-x-q1-1")?.state === "waiting" && String(stateOf("code-spn-x-q1-1")?.waitingOn).includes("baseline-spn-x"), opened.out);
  go("wait", "N001", "code-spn-x-q1-1", "--on", "a sign-in");
  const plan = json(goFile);
  writeFileSync(goFile, JSON.stringify({ ...plan, parts: plan.parts.map((p) => (p.id === "baseline-spn-x" ? { ...p, state: "landed" } : p)) }, null, 2));
  const cleared = go("wait", "N001", "code-spn-x-q1-1", "--clear");
  ok("[MKT.HOOKS.322] E67 clear reads the part ready again when what it waits on has landed, and drops the reason", cleared.code === 0 && stateOf("code-spn-x-q1-1")?.state === "ready" && !stateOf("code-spn-x-q1-1")?.waitingOn, cleared.out);
  ok("[MKT.HOOKS.322] E67 clear ends with the next step", lastLine(cleared.out).startsWith("Next:"), cleared.out);
  const again = go("wait", "N001", "code-spn-x-q1-1", "--clear");
  ok("[MKT.HOOKS.322] E67 clearing a part that is not waiting is refused, the plan unchanged", again.code !== 0 && again.out.includes("Refused") && stateOf("code-spn-x-q1-1")?.state === "ready", again.out);
  go("wait", "N001", "code-spn-x-q1-1", "--on", "a sign-in");
  go("wait", "N001", "full-spn-x", "--on", "another window's hold");
  const stays = go("wait", "N001", "full-spn-x", "--clear");
  ok("[MKT.HOOKS.322] E67 clear reads the part waiting again when what it waits on in the plan has not landed, and says on what (full run waits on the code)", stays.code === 0 && stateOf("full-spn-x")?.state === "waiting" && String(stateOf("full-spn-x")?.waitingOn).includes("code-spn-x-q1-1"), stays.out + JSON.stringify(stateOf("full-spn-x")));
  const both = go("wait", "N001", "full-spn-x", "--clear", "--on", "x");
  ok("[MKT.HOOKS.322] E67 --clear with --on is refused", both.code !== 0, both.out);
  writeFileSync(goFile, snapshot);
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
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "landed", title: `row ${id}`, work, ...over });
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

console.log("\n=== start: a ready proof part, after the releases, is taken, and refused on a tree that holds uncommitted changes");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "landed", title: `row ${id}`, work, ...over });
  const proving = await dataWorkspace("go-proof", { rows: [
    row("1", "DOCS", { entries: ["E1"] }), row("2", "CODE", { entries: ["E2"] }), row("3", "RELEASE"), row("4", "PROOF", { state: "ready" }),
  ] });
  cli(proving.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(proving.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]), null, 2));
  cli(proving.root, ["workstream", "go", "write", "N001"]);
  // The plan as it stands once the code and the releases have landed: every part landed but the proof, which is ready.
  const file = join(proving.ws, "arcs", "N001", "go.json");
  const plan = json(file);
  const held = plan.parts.filter((p) => !p.id.startsWith("proof-")).map((p) => ({ ...p, state: "landed" }));
  const proof = plan.parts.find((p) => p.id === "proof-spn-x")
    ?? { id: "proof-spn-x", repo: "spn-x", work: "TEST", entries: [], tests: [], minutes: null, measuredFrom: null, waitsOn: [], model: "none", signature: "" };
  writeFileSync(file, JSON.stringify({ ...plan, parts: [...held, { ...proof, waitsOn: [], state: "ready" }] }, null, 2));
  const stateOfProof = () => json(file).parts.find((p) => p.id === "proof-spn-x")?.state;
  writeFileSync(join(proving.repo, "pending.ts"), "export const b = 2;\n");
  const refused = cli(proving.root, ["workstream", "go", "start", "N001", "proof-spn-x"]);
  ok("[MKT.SCRIPTS.384] a proof part start is refused on a dirty tree, naming the file, and the part stays ready", refused.code === 1 && refused.out.includes("pending.ts") && stateOfProof() === "ready", `${stateOfProof()} ${refused.out}`);
  proving.git(["add", "-A"]);
  proving.git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "third"]);
  const taken = cli(proving.root, ["workstream", "go", "start", "N001", "proof-spn-x"]);
  ok("[MKT.SCRIPTS.384] go start takes a ready proof part once the tree is committed", taken.code === 0 && stateOfProof() === "running", taken.out);
}

console.log("\n=== report write: a part's report lands its row on a green run, in one command");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "waiting", title: `row ${id}`, work, ...over });
  const rep = await dataWorkspace("go-report", { rows: [row("1", "CODE", { entries: ["E1"] })] });
  cli(rep.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const sheetFile = join(rep.ws, "arcs", "N001", "sheet.json");
  writeFileSync(sheetFile, JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  cli(rep.root, ["workstream", "go", "write", "N001"]);
  const arcFile = join(rep.ws, "arcs", "N001", "state.json");
  const rowState = () => json(arcFile).rows[0].state;
  const part = json(join(rep.ws, "arcs", "N001", "go.json")).parts.find((p) => p.work === "CODE");
  const sha = rep.git(["rev-parse", "HEAD"]);
  const runIn = (results) => put(rep.root, "spn-x/pkg/tests/.output/unit/runs/r1.json", JSON.stringify({ run: "r1", tier: "unit", ranAt: new Date(Date.now() + 3600e3).toISOString(), env: "local", results: results.map((id) => ({ id, tier: "unit", status: "SUCCESS", title: id })) }));
  const report = (id, ...extra) => { put(rep.ws, `notes/N001/orders/${id}.report.md`, ["---", 'row: "1"', "outcome: landed", ...extra, "---", "Body.", ""].join("\n")); return cli(rep.root, ["workstream", "report", "write", "031", `notes/N001/orders/${id}.report.md`]); };

  // A HELPER THAT MET AN UNNAMED CONSTRUCT STOPPED (RULE.DEVEX.WORKSPACE.495)
  const brief0 = readFileSync(join(rep.ws, "notes", "N001", "orders", `${part.id}.md`), "utf8");
  ok("[MKT.SCRIPTS.428] a brief carries the stop line and the report's `unnamed:` field", brief0.includes("RULE.DEVEX.WORKSPACE.495") && brief0.includes("unnamed: []"), brief0.slice(-600));
  const named = report(part.id, "run: r1", "unnamed: [\"IamRemoteRoute\"]", `commits: { spn-x: [${sha}] }`);
  ok("[MKT.SCRIPTS.428] red: a report that lands and lists an unnamed construct is refused, naming it and the rule, and nothing is written",
    named.code === 1 && named.out.includes("IamRemoteRoute") && named.out.includes("RULE.DEVEX.WORKSPACE.495") && rowState() !== "landed", named.out);
  put(rep.ws, `notes/N001/orders/${part.id}.report.md`, ["---", 'row: "1"', "outcome: needs-you", 'unnamed: ["IamRemoteRoute"]', "---", "Met a name no entry holds.", ""].join("\n"));
  const stopped = cli(rep.root, ["workstream", "report", "write", "031", `notes/N001/orders/${part.id}.report.md`]);
  ok("[MKT.SCRIPTS.428] green: the same list on a needs-you report is accepted, and the row does not land", stopped.code === 0 && rowState() !== "landed", stopped.out);

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

console.log("\n=== a panel's verdict on record gates a go's first plan and a release part (RULE.DEVEX.WORKSPACE.485)");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "landed", title: `row ${id}`, work, ...over });
  const gated = await dataWorkspace("go-panel", { rows: [row("1", "DOCS", { entries: ["E1"] }), row("2", "CODE", { entries: ["E2"] }), row("3", "RELEASE"), row("4", "PROOF", { state: "ready" })] });
  cli(gated.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(gated.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")]), null, 2));
  const name = basename(gated.ws);
  const plan = join(gated.ws, "arcs", "N001", "go.json");
  const on = { SPN_TELEMETRY: "on" };
  const run = (...args) => cli(gated.root, ["workstream", "go", ...args], on);
  const folder = telemetryFolder(gated.root);
  const panel = (over = {}) => { mkdirSync(folder, { recursive: true });
    appendFileSync(join(folder, "hooks.jsonl"), `${JSON.stringify({ v: 1, mtype: "PANEL", id: Math.random().toString(16).slice(2), at: new Date().toISOString().slice(0, 19) + "Z", ms: 0, event: "SubagentStop",
      session: "s", agent: "a", workstream: name, arc: "N001", part: null, skill: null, work: null, retryOf: null, lens: "LEAD", verdict: "PASS", ...over })}\n`); };
  const note = "telemetry recording is off";

  const off = cli(gated.root, ["workstream", "go", "write", "N001"]);
  ok("[MKT.SCRIPTS.389] with recording off the first plan is written, and one note says the panel can't be seen", off.code === 0 && existsSync(plan) && off.out.split(note).length === 2, off.out);
  rmSync(plan);
  writeSwitch(gated.root, "telemetry", true);
  const none = run("write", "N001");
  ok("[MKT.SCRIPTS.389] go write of a first plan with no panel on record is refused, naming the panel, the arc and the rule, and writes nothing",
    none.code === 1 && none.out.includes("spn-devex:spn-panel") && none.out.includes(`${name}/N001`) && none.out.includes("RULE.DEVEX.WORKSPACE.485") && !existsSync(plan), none.out);
  panel({ verdict: "BLOCKED" });
  panel({ arc: "N002" });
  panel({ workstream: "999-other" });
  ok("[MKT.SCRIPTS.389] a blocked verdict, another arc's and another workstream's do not open the gate", run("write", "N001").code === 1 && !existsSync(plan));
  panel({ verdict: "PASS_WITH_ADVICE" });
  const wrote = run("write", "N001");
  ok("[MKT.SCRIPTS.389] a verdict that is not blocked, on the same workstream and arc, opens it", wrote.code === 0 && existsSync(plan), wrote.out);
  writeFileSync(join(folder, "hooks.jsonl"), "");
  ok("[MKT.SCRIPTS.389] deriving an existing plan again is never refused", run("write", "N001").code === 0);

  const parts = json(plan).parts;
  writeFileSync(plan, JSON.stringify({ ...json(plan), parts: parts.map((p) => ({ ...p, state: p.id === "release-spn-x-1" ? "ready" : "landed" })) }, null, 2));
  const refusal = run("start", "N001", "release-spn-x-1");
  ok("[MKT.SCRIPTS.390] go start of a release part with no panel on record is refused, naming the part, the arc and the rule",
    refusal.code === 1 && refusal.out.includes("spn-devex:spn-panel") && refusal.out.includes("release-spn-x-1") && refusal.out.includes(`${name}/N001`) && refusal.out.includes("RULE.DEVEX.WORKSPACE.485")
      && json(plan).parts.find((p) => p.id === "release-spn-x-1").state === "ready", refusal.out);
  const stamp = (ms) => new Date(Date.now() + ms).toISOString().slice(0, 19) + "Z";
  appendFileSync(join(gated.ws, "arcs", "N001", "log.jsonl"), `${JSON.stringify({ at: stamp(0), kind: "go", row: null, note: `${parts.find((p) => p.work !== "RELEASE").id} landed` })}\n`);
  panel({ at: stamp(-3600_000) });
  ok("[MKT.SCRIPTS.390] a panel's verdict from before the repository's last part landed does not open it", run("start", "N001", "release-spn-x-1").code === 1);
  panel({ at: stamp(3600_000), part: "release-spn-x-2" });
  ok("[MKT.SCRIPTS.390] nor does a verdict naming another part", run("start", "N001", "release-spn-x-1").code === 1);
  panel({ at: stamp(3600_000), part: "release-spn-x-1" });
  const started = run("start", "N001", "release-spn-x-1");
  ok("[MKT.SCRIPTS.390] a verdict after it, naming the part, opens it", started.code === 0 && json(plan).parts.find((p) => p.id === "release-spn-x-1").state === "running", started.out);

  writeFileSync(plan, JSON.stringify({ ...json(plan), parts: json(plan).parts.map((p) => ({ ...p, state: p.id === "release-spn-x-1" ? "ready" : p.state })) }, null, 2));
  writeFileSync(join(folder, "hooks.jsonl"), "");
  const blind = cli(gated.root, ["workstream", "go", "start", "N001", "release-spn-x-1"]);
  ok("[MKT.SCRIPTS.390] with recording off the release starts, and one note says the panel can't be seen", blind.code === 0 && blind.out.split(note).length === 2, blind.out);
}

console.log("\n=== a decided suggestion against an arc is cited by its sheet, or the go is refused (RULE.DEVEX.WORKSPACE.488)");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "ready", title: `row ${id}`, work, ...over });
  const cited = await dataWorkspace("go-cites", { rows: [row("1", "DOCS", { entries: ["E1"] })] });
  cli(cited.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const sheetPath = join(cited.ws, "arcs", "N001", "sheet.json");
  const withCite = (decidedBy) => writeFileSync(sheetPath, JSON.stringify(sheetOf([entry("E1", "spn-x:docs/a.md", { decidedBy })]), null, 2));
  const suggestions = (list) => writeFileSync(join(cited.ws, "suggestions.jsonl"), list.map((one) => JSON.stringify({ preview: null, words: null, ...one })).join("\n") + "\n");
  const planFile = join(cited.ws, "arcs", "N001", "go.json");
  suggestions([{ id: "s65", title: "move the footbar under Plan", state: "decided", arc: "N001" }, { id: "s66", title: "raised only", state: "raised", arc: "N001" }, { id: "s67", title: "another arc's", state: "decided", arc: "N002" }, { id: "s68", title: "no arc", state: "decided" }]);
  withCite(["q1"]);
  const refused = cli(cited.root, ["workstream", "go", "write", "N001"]);
  ok("[MKT.SCRIPTS.405] go write refuses a decided suggestion of an arc in the go's scope that no entry cites, naming it with a capital and writing nothing",
    refused.code === 1 && refused.out.includes("S65") && !refused.out.includes("S66") && !refused.out.includes("S67") && !refused.out.includes("S68") && refused.out.includes("Nothing was written") && !existsSync(planFile), refused.out);
  const check = cli(cited.root, ["workstream", "sheet", "check", "N001"]);
  ok("[MKT.SCRIPTS.405] sheet check names the same suggestion", check.code === 1 && check.out.includes("S65 is decided against N001"), check.out);
  withCite(["q1", "S65"]);
  const wrote = cli(cited.root, ["workstream", "go", "write", "N001"]);
  ok("[MKT.SCRIPTS.405] cited as S65 in an entry's decidedBy, the go is written", wrote.code === 0 && existsSync(planFile), wrote.out);
  rmSync(planFile);
  withCite(["s65"]);
  ok("[MKT.SCRIPTS.405] cited as s65, the lowercase form, it counts too", cli(cited.root, ["workstream", "go", "write", "N001"]).code === 0);
}

console.log("\n=== write --after-close: one part the lead carries out, with one report");
{
  const fu = await dataWorkspace("go-follow", { rows });
  const cliFu = (...args) => cli(fu.root, ["workstream", ...args]);
  cliFu("fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1");
  writeFileSync(join(fu.root, "sheet-in.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")])));
  cliFu("sheet", "write", "N001", "--file", join(fu.root, "sheet-in.json"), "--because", "the developer added E2");
  const wrote = cliFu("go", "write", "N001", "--after-close");
  const plan = json(join(fu.ws, "arcs", "N001", "go.json"));
  ok("[MKT.SCRIPTS.416] --after-close plans the entries as one lead part, then the full run because code changed",
    wrote.code === 0 && JSON.stringify(plan.parts.filter((p) => !p.id.startsWith("release") && !p.id.startsWith("proof")).map((p) => [p.id, p.entries.length, p.model])) === '[["code-spn-x-1",2,"lead"],["full-spn-x",0,"none"]]', wrote.out + JSON.stringify(plan.parts.map((p) => p.id)));
  const briefText = readFileSync(join(fu.ws, "notes", "N001", "orders", "code-spn-x-1.md"), "utf8");
  ok("[MKT.SCRIPTS.416] its brief opens as an after-close batch, says the lead window carries it out itself, and the next step says so", briefText.includes("An after-close batch: the lead window carries this out itself") && !briefText.includes("Launch no agent") && wrote.out.includes("carry out code-spn-x-1 yourself"), wrote.out);
}

console.log("\n=== another arc of the workstream outside the scope, and a circle between two inside it");
{
  const entryRow = (arc, id, work, entries, over = {}) => ({ id, parent: arc, title: `row ${id}`, kind: "change", repo: "spn-x", work, blockedBy: [], touches: [], state: "waiting", entries, ...over });
  // N001 is the arc in the scope; N002 is the second arc of the workstream, its sheet and data written as the commands leave them.
  const twoArcs = async (name, { rows1, rows2, status2 = "DECIDED", depends1 = [], depends2 = [], entries2 }) => {
    const world = await dataWorkspace(name, { rows: rows1 });
    const second = { ...arcData(rows2), arc: "N002", subject: "second", title: "the second arc", status: status2 };
    mkdirSync(join(world.ws, "arcs", "N002"), { recursive: true });
    writeFileSync(join(world.ws, "arcs", "N002", "state.json"), JSON.stringify(second, null, 2));
    const first = json(join(world.ws, "arcs", "N001", "state.json"));
    writeFileSync(join(world.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ ...sheetOf(first.rows.flatMap((row) => row.entries ?? []).map((id) => entry(id, id === "E1" && first.rows[0].work === "DOCS" ? "spn-x:docs/a.md" : `spn-x:src/${id}.ts`))), dependsOn: depends1 }, null, 2));
    writeFileSync(join(world.ws, "arcs", "N002", "sheet.json"), JSON.stringify({ ...sheetOf(entries2), dependsOn: depends2 }, null, 2));
    cli(world.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
    return { ...world, run: (...args) => cli(world.root, ["workstream", "go", ...args]), plan: () => json(join(world.ws, "arcs", "N001", "go.json")) };
  };
  const rows1 = [entryRow("N001", "1", "DOCS", ["E1"]), entryRow("N001", "2", "CODE", ["E2"], { blockedBy: ["1"] })];
  const docs2 = [entryRow("N002", "1", "DOCS", ["E1"]), entryRow("N002", "2", "CODE", ["E2"], { blockedBy: ["1"] })];
  const entries2 = [entry("E1", "spn-x:docs/z.md"), entry("E2", "spn-x:src/z.ts")];

  const sibling = await twoArcs("go-sibling", { rows1, rows2: docs2, depends1: ["N002 ships first"], entries2 });
  const wrote = sibling.run("write", "N001");
  ok("[MKT.SCRIPTS.442] a go whose sheet depends on a sibling arc outside the scope is written", wrote.code === 0, wrote.out);
  const shown = sibling.run("show", "N001", "--part", "code-spn-x-q1-1");
  ok("[MKT.SCRIPTS.442] show prints the code part waiting on that arc's release of the repository",
    sibling.plan().parts.find((p) => p.id === "code-spn-x-q1-1")?.state === "waiting" && shown.out.includes("waiting on N002's release of spn-x"), shown.out);
  const baseline = sibling.run("show", "N001", "--part", "baseline-spn-x");
  ok("[MKT.SCRIPTS.445] the plan reads the decided arc's DOCS row outside the scope: the baseline waits on that arc's docs of the repository", baseline.out.includes("waiting on N002's docs of spn-x"), baseline.out);

  const undecided = await twoArcs("go-undecided", { rows1, rows2: docs2, status2: "PROPOSED", entries2 });
  undecided.run("write", "N001");
  const held = undecided.plan().parts.find((p) => p.id === "baseline-spn-x");
  ok("[MKT.SCRIPTS.445] an undecided arc's DOCS row does not hold the baseline", held?.state === "ready" && !held?.waitingOn, JSON.stringify(held));

  const circle = await twoArcs("go-circle", { rows1: [entryRow("N001", "1", "CODE", ["E1", "E2"])], rows2: [entryRow("N002", "1", "CODE", ["E1"])], depends1: ["N002 ships first"], depends2: ["N001 ships first"], entries2: [entry("E1", "spn-x:src/z.ts")] });
  const refused = circle.run("write", "N001", "--scope", "N001,N002");
  ok("[MKT.SCRIPTS.443] go write refuses a plan whose waits close a circle through a release, names its parts and writes no go.json",
    refused.code === 1 && refused.out.includes("circle") && refused.out.includes("release-spn-x") && refused.out.includes("code-spn-x") && refused.out.includes("Nothing was written") && !existsSync(join(circle.ws, "arcs", "N001", "go.json")), refused.out);
}

console.log("\n=== apply-<repo>: the patches applied in order, one commit, the part landed (MKT.SCRIPTS.451)");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "waiting", title: `row ${id}`, work, ...over });
  const world = await dataWorkspace("go-apply", { rows: [row("1", "CODE", { entries: ["E1", "E2"] })] });
  const inRepo = (args) => execFileSync("git", args, { cwd: world.repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  put(world.root, "spn-x/src/a1.ts", "export const a1 = 1;\n");
  put(world.root, "spn-x/src/a2.ts", "export const a2 = 1;\n");
  inRepo(["add", "-A"]);
  inRepo(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "files"]);
  const base = inRepo(["rev-parse", "HEAD"]).trim();
  // each entry's change is kept as a diff beside the sheet, and the file is reset
  for (const [id, file] of [["E1", "src/a1.ts"], ["E2", "src/a2.ts"]]) {
    writeFileSync(join(world.repo, file), `export const ${file.slice(4, 6)} = 2;\n`);
    put(world.ws, `arcs/N001/patches/${id}.diff`, inRepo(["diff", "--", file]));
    inRepo(["checkout", "HEAD", "--", file]);
  }
  cli(world.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const patched = (id, file) => entry(id, `spn-x:${file}`, { patch: { file: `patches/${id}.diff`, base } });
  writeFileSync(join(world.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([patched("E1", "src/a1.ts"), patched("E2", "src/a2.ts")]), null, 2));
  const wrote = cli(world.root, ["workstream", "go", "write", "N001"]);
  const planFile = join(world.ws, "arcs", "N001", "go.json");
  const applyPart = () => json(planFile).parts.find((p) => p.id === "apply-spn-x");
  ok("[MKT.SCRIPTS.450] go write puts the two patched entries in one apply-spn-x part the lead carries, with no brief",
    wrote.code === 0 && JSON.stringify(applyPart()?.entries) === '["N001/E1","N001/E2"]' && applyPart()?.model === "lead" && !existsSync(join(world.ws, "notes", "N001", "orders", "apply-spn-x.md")), wrote.out);
  const commits = Number(inRepo(["rev-list", "--count", "HEAD"]).trim());
  // the apply part waits on the repository's baseline (E19: ordered by the same waits), so the parts before it have landed
  const planned = json(planFile);
  writeFileSync(planFile, JSON.stringify({ ...planned, parts: planned.parts.map((p) => (/^(docs|baseline)-/.test(p.id) ? { ...p, state: "landed" } : p)) }, null, 2));
  const identity = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  const started = cli(world.root, ["workstream", "go", "start", "N001", "apply-spn-x"], identity);
  ok("[MKT.SCRIPTS.451] go start apply-spn-x applies both patches in the repository", started.code === 0 && readFileSync(join(world.repo, "src/a1.ts"), "utf8") === "export const a1 = 2;\n"
    && readFileSync(join(world.repo, "src/a2.ts"), "utf8") === "export const a2 = 2;\n", started.out);
  ok("[MKT.SCRIPTS.451] and makes one commit holding both files", Number(inRepo(["rev-list", "--count", "HEAD"]).trim()) === commits + 1
    && inRepo(["show", "--name-only", "--format=", "HEAD"]).split("\n").filter(Boolean).sort().join(",") === "src/a1.ts,src/a2.ts", inRepo(["log", "--oneline"]));
  ok("[MKT.SCRIPTS.451] and lands the part, with no report", applyPart()?.state === "landed" && started.out.includes("landed"), started.out);
}

console.log("\n=== a brief's acceptance lists each test id beside its file (MKT.SCRIPTS.453)");
{
  const world = await dataWorkspace("go-acceptance", { rows: [{ id: "1", parent: "N001", title: "build it", kind: "change", repo: "spn-x", work: "CODE", blockedBy: [], touches: [], state: "waiting", entries: ["E1"] }] });
  put(world.root, "spn-x/tests/t-thing.mjs", "// proves [T.E1.01]\n");
  cli(world.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(world.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  cli(world.root, ["workstream", "go", "write", "N001"]);
  const brief = readFileSync(join(world.ws, "notes", "N001", "orders", "code-spn-x-q1-1.md"), "utf8");
  ok("[MKT.SCRIPTS.453] the acceptance reads `<ID> · node <file>`", brief.includes("`T.E1.01 · node tests/t-thing.mjs`"), brief.slice(brief.indexOf("## Acceptance"), brief.indexOf("## Report")));
}

console.log("\n=== report write records a part's cost from the usage rows (MKT.SCRIPTS.454)");
{
  const world = await dataWorkspace("go-cost", { rows: [{ id: "1", parent: "N001", title: "build it", kind: "change", repo: "spn-x", work: "CODE", blockedBy: [], touches: [], state: "waiting", entries: ["E1"] }] });
  cli(world.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(world.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  cli(world.root, ["workstream", "go", "write", "N001"]);
  const folder = telemetryFolder(world.root);
  mkdirSync(folder, { recursive: true });
  const turn = (id, ms) => JSON.stringify({ v: 1, mtype: "TURN", id, at: "2026-11-02T10:00:00Z", ms, event: "Stop", session: "s", agent: null, workstream: basename(world.ws), arc: "N001", part: "code-spn-x-q1-1", skill: null, work: "CODE", retryOf: null, model: "m", tokens: { in: 10, out: 20, cacheRead: 30, cacheWrite: 40 } });
  appendFileSync(join(folder, "usage.jsonl"), `${turn("m1", 60000)}\n${turn("m2", 60000)}\n${turn("m1", 60000)}\n`);
  put(world.ws, "notes/N001/orders/code-spn-x-q1-1.report.md", ["---", 'go: "N001"', 'part: "code-spn-x-q1-1"', "outcome: landed", "---", "Body.", ""].join("\n"));
  cli(world.root, ["workstream", "report", "write", "031", "notes/N001/orders/code-spn-x-q1-1.report.md"]);
  const landed = json(join(world.ws, "arcs", "N001", "go.json")).parts.find((p) => p.id === "code-spn-x-q1-1");
  ok("[MKT.SCRIPTS.454] the landed part carries its measured cost: each reply once by its id, tokens summed and minutes from model time", landed?.state === "landed" && JSON.stringify(landed.cost) === JSON.stringify({ tokens: 200, minutes: 2 }), JSON.stringify(landed));
}

console.log("\n=== show: a landed part prints the cost its row recorded (MKT.SCRIPTS.477)");
{
  const plan = json(goFile);
  const measured = plan.parts.find((p) => p.id === "code-spn-x-q1-1");
  writeFileSync(goFile, JSON.stringify({ ...plan, parts: plan.parts.map((p) => (p.id === "code-spn-x-q1-1" ? { ...p, state: "landed", minutes: null, measuredFrom: null, cost: { tokens: 5000, minutes: 3 } } : p.id === "docs-spn-x-q1-1" ? { ...p, state: "ready", minutes: null, measuredFrom: null } : p)) }, null, 2));
  const line = go("show", "N001", "--part", "code-spn-x-q1-1").out.split("\n").find((l) => l.startsWith("code-spn-x-q1-1")) ?? "";
  ok("[MKT.SCRIPTS.477] a part landed with cost { tokens: 5000, minutes: 3 } prints '3 min' and its tokens, never 'not measured'", measured !== undefined && line.includes("3 min") && line.includes("5000") && !line.includes("not measured"), line);
  const open = go("show", "N001", "--part", "docs-spn-x-q1-1").out.split("\n").find((l) => l.startsWith("docs-spn-x-q1-1")) ?? "";
  ok("[MKT.SCRIPTS.477] an unlanded part with no estimate still prints 'not measured'", open.includes("not measured"), open);
}

console.log("\n=== report write <ws>/<arc> <part-id> --run <name>: no file, the part lands on what the command derives (MKT.HOOKS.321)");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "waiting", title: `row ${id}`, work, ...over });
  const rep = await dataWorkspace("go-report-run", { rows: [row("1", "CODE", { entries: ["E1"] })] });
  cli(rep.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  writeFileSync(join(rep.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  // the brief names the arc's worktree of the repository (`.worktrees/<workstream>/<repo>`), where the part's commits and run are read
  const worktree = join(rep.root, ".worktrees", basename(rep.ws), "spn-x");
  mkdirSync(join(worktree, ".."), { recursive: true });
  rep.git(["worktree", "add", "-q", "-b", "the-arc", worktree]);
  const inWorktree = (args) => execFileSync("git", args, { cwd: worktree, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  cli(rep.root, ["workstream", "go", "write", "N001"]);
  const arcFile = join(rep.ws, "arcs", "N001", "state.json");
  const planned = json(join(rep.ws, "arcs", "N001", "go.json")).parts.find((p) => p.work === "CODE");
  // the helper's work: one commit in the repository after the brief was written, and a green run of the part's test
  put(worktree, "src/b.ts", "export const b = 1;\n");
  inWorktree(["add", "-A"]);
  // dated after the brief, so the commit falls inside the part's window whatever the clock's second
  const later = new Date(Date.now() + 60e3).toISOString();
  execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "the part's change"], { cwd: worktree, stdio: "ignore", env: { ...process.env, GIT_AUTHOR_DATE: later, GIT_COMMITTER_DATE: later } });
  const sha = inWorktree(["rev-parse", "HEAD"]);
  const runIn = (status) => put(worktree, "pkg/tests/.output/unit/runs/r1.json", JSON.stringify({ run: "r1", tier: "unit", ranAt: new Date(Date.now() + 3600e3).toISOString(), env: "local", results: [{ id: "T.E1.01", tier: "unit", status, title: "T.E1.01" }] }));
  runIn("SUCCESS");
  const landed = cli(rep.root, ["workstream", "report", "write", "031/N001", planned.id, "--run", "r1"]);
  const data = json(arcFile);
  ok("[MKT.HOOKS.321] `report write <ws>/<arc> <part-id> --run <name>` with no file lands the part's row", landed.code === 0 && data.rows[0].state === "landed", landed.out);
  ok("[MKT.HOOKS.321] with the commits it derives from the repository, and the run as the proof", Array.isArray(data.rows[0].commits?.["spn-x"]) && data.rows[0].commits["spn-x"].includes(sha) && data.rows[0].proof === "run r1", JSON.stringify(data.rows[0]));
  const written = join(rep.ws, "notes", "N001", "orders", `${planned.id}.report.md`);
  const text = existsSync(written) ? readFileSync(written, "utf8") : "";
  ok("[MKT.HOOKS.321] it writes the part's report itself, with the outcome landed and the go and part from the plan, and no follow-up or unnamed construct",
    text.includes("outcome: landed") && text.includes('go: "N001"') && text.includes(`part: "${planned.id}"`) && text.includes("unnamed: []") && text.includes("followUps: []"), text);
}

console.log("\n=== an arc is addressed as N<nnn>, ideate or follow-ups, and a scope may mix them (Q33)");
{
  const { writeRoleArcs } = await import("../../../../helpers/workstream-fixture.mjs");
  const row = (arc, id, work, entries, over = {}) => ({ id, parent: arc, title: `row ${id}`, kind: "change", repo: "spn-x", work, blockedBy: [], touches: [], state: "waiting", entries, ...over });
  const world = await dataWorkspace("go-roles", { rows: [row("N001", "1", "CODE", ["E1"])] });
  writeRoleArcs(world.ws, { followUps: { status: "DECIDED" } });
  const followFile = join(world.ws, "arcs", "follow-ups", "state.json");
  const follow = json(followFile);
  writeFileSync(followFile, JSON.stringify({ ...follow, repos: ["spn-x"], rows: [row("follow-ups", "1", "CODE", ["E1"])] }, null, 2));
  writeFileSync(join(world.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/b.ts")]), null, 2));
  writeFileSync(join(world.ws, "arcs", "follow-ups", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/z.ts")]), null, 2));
  cli(world.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  cli(world.root, ["workstream", "fact", "write", "follow-ups", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const run = (...args) => cli(world.root, ["workstream", "go", ...args]);
  const wrote = run("write", "031/N001", "--scope", "N001,follow-ups");
  const plan = existsSync(join(world.ws, "arcs", "N001", "go.json")) ? json(join(world.ws, "arcs", "N001", "go.json")) : { scope: [], parts: [] };
  ok("[MKT.SCRIPTS.442] a `<workstream>/N<nnn>` lead and a scope that mixes a numbered arc with `follow-ups` is written, and the plan keeps the scope as given",
    wrote.code === 0 && JSON.stringify(plan.scope) === '["N001","follow-ups"]' && plan.lead === "N001", wrote.out);
  ok("[MKT.SCRIPTS.442] the plan holds the entries of both arcs, the second as `follow-ups/E1`", plan.parts.some((p) => p.entries.includes("N001/E1")) && plan.parts.some((p) => p.entries.includes("follow-ups/E1")), JSON.stringify(plan.parts.map((p) => p.entries)));
  const lead = run("write", "031/follow-ups", "--scope", "follow-ups");
  ok("[MKT.SCRIPTS.442] `follow-ups` is an arc address the go reads as the lead", lead.code === 0 && existsSync(join(world.ws, "arcs", "follow-ups", "go.json")), lead.out);
  const ideate = run("write", "031/ideate");
  ok("[MKT.SCRIPTS.442] `ideate` is read as an arc too: it is refused for having no sheet, as any arc without one, and nothing is written",
    ideate.code === 1 && ideate.out.includes("Nothing was written") && !existsSync(join(world.ws, "arcs", "ideate", "go.json")) && !/usage|not an arc/i.test(ideate.out), ideate.out);
  // the help lists each command with its describe, which holds the `--after-close` sentence
  const help = cli(world.root, ["help"]);
  ok("[MKT.SCRIPTS.442] the `--after-close` help names the flag and no longer speaks of the follow-up arc", /--after-close/.test(help.out) && !/not the follow-up arc/i.test(help.out), help.out);
}

console.log("\n=== E35: a stale patch, the format line, go propose, write refusals (MKT.SCRIPTS.497, .503, .502, .504)");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", kind: "change", repo: "spn-x", blockedBy: [], touches: [], state: "waiting", title: `row ${id}`, work, ...over });
  const identity = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  const fact = (world) => cli(world.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);

  // .497: the file moved after the patch's base
  const world = await dataWorkspace("go-stale", { rows: [row("1", "CODE", { entries: ["E1"] })] });
  const inRepo = (args) => execFileSync("git", args, { cwd: world.repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const commit = (m) => { inRepo(["add", "-A"]); inRepo(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", m]); };
  put(world.root, "spn-x/src/s1.ts", "export const s1 = 1;\n");
  commit("file");
  const base = inRepo(["rev-parse", "HEAD"]).trim();
  writeFileSync(join(world.repo, "src/s1.ts"), "export const s1 = 2;\n");
  put(world.ws, "arcs/N001/patches/E1.diff", inRepo(["diff", "--", "src/s1.ts"]));
  inRepo(["checkout", "HEAD", "--", "src/s1.ts"]);
  fact(world);
  writeFileSync(join(world.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/s1.ts", { patch: { file: "patches/E1.diff", base } })]), null, 2));
  cli(world.root, ["workstream", "go", "write", "N001"]);
  const planFile = join(world.ws, "arcs", "N001", "go.json");
  const planned = json(planFile);
  writeFileSync(planFile, JSON.stringify({ ...planned, parts: planned.parts.map((p) => (/^(docs|baseline)-/.test(p.id) ? { ...p, state: "landed" } : p)) }, null, 2));
  writeFileSync(join(world.repo, "src/s1.ts"), "export const s1 = 9;\n");
  commit("moved");
  const stale = cli(world.root, ["workstream", "go", "start", "N001", "apply-spn-x"], identity);
  ok("[MKT.SCRIPTS.497] a patch whose file moved since its base is refused by entry, with the `workstream sheet patch` text",
    stale.code === 1 && stale.out.includes("N001/E1") && stale.out.includes("patch is stale") && stale.out.includes("src/s1.ts") && stale.out.includes("run `workstream sheet patch ") && stale.out.includes(" E1`"), stale.out);
  ok("[MKT.SCRIPTS.497] and the file is left as committed, the part not landed", readFileSync(join(world.repo, "src/s1.ts"), "utf8") === "export const s1 = 9;\n" && json(planFile).parts.find((p) => p.id === "apply-spn-x")?.state !== "landed");

  // .503: format line by repository type
  const briefOf = async (name, type) => {
    const w = await dataWorkspace(name, { rows: [row("1", "CODE", { entries: ["E1"] })] });
    put(w.root, "spn-x/sprepo.json", JSON.stringify({ type }));
    put(w.root, "spn-x/apps/billing/src/b.ts", "export const b = 1;\n");
    execFileSync("git", ["add", "-A"], { cwd: w.repo });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "x"], { cwd: w.repo });
    fact(w);
    writeFileSync(join(w.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:apps/billing/src/b.ts")]), null, 2));
    const wrote = cli(w.root, ["workstream", "go", "write", "N001"]);
    const code = json(join(w.ws, "arcs", "N001", "go.json")).parts.find((p) => p.work === "CODE");
    const file = join(w.ws, "notes", "N001", "orders", `${code?.id}.md`);
    return { wrote, text: existsSync(file) ? readFileSync(file, "utf8") : "" };
  };
  const apps = await briefOf("go-fmt-apps", "APPS");
  ok("[MKT.SCRIPTS.503] an APPS repository's code brief carries `spnutils apps format billing`", apps.wrote.code === 0 && apps.text.includes("`spnutils apps format billing`"), apps.wrote.out + apps.text.slice(0, 600));
  const general = await briefOf("go-fmt-general", "GENERAL");
  ok("[MKT.SCRIPTS.503] a repository of another type gets no format line", general.wrote.code === 0 && general.text.length > 0 && !general.text.includes("apps format"), general.wrote.out);

  // .502: go propose
  const two = await dataWorkspace("go-propose", { rows: [row("1", "CODE", { entries: ["E1"] })] });
  const second = { ...arcData([{ ...row("1", "CODE", { entries: ["E1"] }), parent: "N002" }]), arc: "N002", subject: "second", title: "the second arc", status: "DECIDED" };
  mkdirSync(join(two.ws, "arcs", "N002"), { recursive: true });
  writeFileSync(join(two.ws, "arcs", "N002", "state.json"), JSON.stringify(second, null, 2));
  writeFileSync(join(two.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/p1.ts")]), null, 2));
  writeFileSync(join(two.ws, "arcs", "N002", "sheet.json"), JSON.stringify(sheetOf([entry("E1", "spn-x:src/p2.ts")]), null, 2));
  const proposed = cli(two.root, ["workstream", "go", "propose", "031"]);
  ok("[MKT.SCRIPTS.502] go propose prints `scope 1 · N001, N002 · spn-x` for two arcs sharing a repository", proposed.code === 0 && /scope 1 · N001, N002 · spn-x/.test(proposed.out), proposed.out);
  ok("[MKT.SCRIPTS.502] and the line `one whole run and one release for each of the 1, in place of 2`", proposed.out.includes("one whole run and one release for each of the 1, in place of 2"), proposed.out);

  // .504: a write refusal ends with the command to run
  const bad = await dataWorkspace("go-refuse", { rows: [row("1", "CODE", { entries: ["E1"] })] });
  const badFile = join(bad.ws, "arcs", "N001", "state.json");
  writeFileSync(badFile, JSON.stringify({ ...json(badFile), status: "PROPOSED" }, null, 2));
  const refusedWrite = cli(bad.root, ["workstream", "go", "write", "N001"]);
  ok("[MKT.SCRIPTS.504] a write refusal ends with `: run `workstream …`", refusedWrite.code === 1 && /: run `workstream arc edit [^`]*DECIDED`/.test(refusedWrite.out), refusedWrite.out);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
