// `commands/workstream/sheet.ts` — the change sheet as the arc's data: written whole from a file, one entry
// edited or dropped, shown for a row, and checked against the rows and the cards. Run as the agent types
// the commands, in a throwaway workspace.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARD, cli, dataWorkspace } from "../../../../helpers/workstream-fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const lines = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const { root, ws } = await dataWorkspace("sheet");
const sheetFile = join(ws, "arcs", "N001", "sheet.json");
const log = join(ws, "arcs", "N001", "log.jsonl");
const stateFile = join(ws, "arcs", "N001", "state.json");

const entry = (id, over = {}) => ({
  id, op: "edit", file: `spn-x:packages/mod/src/app/services/Thing${id}.ts`, what: `change ${id}`, decidedBy: ["q1"], facts: ["f1"],
  then: [], rules: [], callers: [], tiers: { unit: [`T.${id}.01`] }, docs: [], book: [], ...over,
});
const sheetOf = (entries, over = {}) => ({
  schemaVersion: 1, releaseChain: ["merges with the pull request"], dependsOn: [],
  stack: { folder: "the spn-x checkout at the branch tip, never a worktree folder", dmo: "none", reset: "from empty, before the contract tier" },
  entries, ...over,
});
const put = (name, value) => { const path = join(root, name); writeFileSync(path, JSON.stringify(value, null, 2)); return path; };
const sheet = (...args) => cli(root, ["workstream", "sheet", ...args]);

// the arc has one fact, f1
console.log("=== help lists the five commands");
{
  const help = cli(root, ["help"]);
  for (const words of ["workstream sheet write", "workstream sheet edit", "workstream sheet drop", "workstream sheet show", "workstream sheet check"])
    ok(`help lists \`${words}\``, help.out.includes(words), words);
}

console.log("\n=== an arc with no sheet.json is judged as before");
{
  const shown = sheet("show", "N001");
  ok("show says so in one line and exits 0", shown.code === 0 && shown.out.trim().split("\n").length === 1 && shown.out.includes("no sheet"), shown.out);
  const checked = sheet("check", "N001");
  ok("check says so in one line and exits 0", checked.code === 0 && checked.out.trim().split("\n").length === 1 && checked.out.includes("no sheet"), checked.out);
  const edited = sheet("edit", "N001", "E1", "--what", "x");
  ok("edit is refused and names `sheet write`", edited.code !== 0 && edited.out.includes("sheet write"), edited.out);
}

console.log("\n=== write: a whole sheet in one call");
{
  const fact = cli(root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  ok("a fact f1 is pinned", fact.code === 0 && fact.out.includes("f1"), fact.out);
  const file = put("sheet-in.json", sheetOf([entry("E1"), entry("E2", { facts: ["f1"], tiers: { unit: ["T.2.01", "T.2.02"], contract: ["T.2.03"] }, callers: ["a.ts", "b.ts"], then: ["spnutils apps gen-barrel mod"] })]));
  const wrote = sheet("write", "N001", "--file", file);
  ok("writes and says how many entries", wrote.code === 0 && wrote.out.includes("2 entries"), wrote.out);
  ok("sheet.json holds both entries, whole", existsSync(sheetFile) && json(sheetFile).entries.length === 2 && json(sheetFile).entries[1].tiers.contract[0] === "T.2.03");
  const last = lines(log).at(-1);
  ok("one log line", last.kind === "sheet" && last.note.includes("2 entries"), JSON.stringify(last));
}

console.log("\n=== write: a fault is refused with nothing written");
{
  const before = readFileSync(sheetFile, "utf8");
  const logged = lines(log).length;
  const refuse = (label, value, words) => {
    const run = sheet("write", "N001", "--file", put("bad.json", value));
    ok(label, run.code === 1 && run.out.startsWith("Refused: ") && run.out.includes("Nothing was written.") && words.every((word) => run.out.includes(word)), run.out);
  };
  refuse("an empty field is refused", sheetOf([entry("E1", { what: "" })]), ["E1", "what"]);
  refuse("an absent list is refused", sheetOf([(() => { const one = entry("E1"); delete one.callers; return one; })()]), ["E1", "callers"]);
  refuse("an unknown op is refused", sheetOf([entry("E1", { op: "mangle" })]), ["E1", "mangle"]);
  refuse("an entry with no fact is refused", sheetOf([entry("E1", { facts: [] })]), ["E1 names no fact"]);
  refuse("a fact the arc does not hold is refused", sheetOf([entry("E1", { facts: ["f9"] })]), ["E1", "f9"]);
  refuse("an entry with no tiers is refused", sheetOf([(() => { const one = entry("E1"); delete one.tiers; return one; })()]), ["E1 has no"]);
  refuse("an unknown tier is refused", sheetOf([entry("E1", { tiers: { smoke: ["X"] } })]), ["E1", "smoke"]);
  refuse("a repeated id is refused", sheetOf([entry("E1"), entry("E1")]), ["E1 is written twice"]);
  refuse("a null stack is refused", sheetOf([entry("E1")], { stack: null }), ["stack"]);
  refuse("two faults are joined with a dot between", sheetOf([entry("E1", { facts: [] }), entry("E2", { what: "" })]), [" · "]);
  const missing = sheet("write", "N001", "--file", join(root, "nope.json"));
  ok("a file that is not there is refused", missing.code !== 0, missing.out);
  ok("sheet.json is as it was, and no line was logged", readFileSync(sheetFile, "utf8") === before && lines(log).length === logged);
}

console.log("\n=== edit: one entry");
{
  const run = sheet("edit", "N001", "E1", "--what", "a new line", "--then", "spnutils a b,spnutils c d", "--tiers", "unit=T.1.01,T.1.02;contract=T.1.03", "--decided-by", "q1,s2", "--facts", "f1");
  const one = json(sheetFile).entries[0];
  ok("the entry changes and nothing else does", run.code === 0 && one.what === "a new line" && one.then.length === 2 && one.tiers.unit.length === 2 && one.tiers.contract[0] === "T.1.03" && one.decidedBy[1] === "s2" && json(sheetFile).entries[1].what === "change E2", run.out + JSON.stringify(one));
  ok("one log line", lines(log).at(-1).kind === "sheet" && lines(log).at(-1).note.includes("E1"));
  const none = sheet("edit", "N001", "E1", "--tiers", "none");
  ok("`--tiers none` empties the tiers", none.code === 0 && Object.keys(json(sheetFile).entries[0].tiers).length === 0, none.out);
  const bad = sheet("edit", "N001", "E1", "--op", "mangle");
  ok("an invalid edit is refused with nothing written", bad.code !== 0 && json(sheetFile).entries[0].op === "edit", bad.out);
  const fact = sheet("edit", "N001", "E1", "--facts", "f9");
  ok("a fact the arc lacks is refused", fact.code === 1 && fact.out.includes("f9") && fact.out.includes("Nothing was written"), fact.out);
  const gone = sheet("edit", "N001", "E9", "--what", "x");
  ok("a missing entry is refused, naming `sheet write`", gone.code !== 0 && gone.out.includes("E9") && gone.out.includes("sheet write"), gone.out);
  const same = sheet("edit", "N001", "E1");
  ok("an edit naming no field changes nothing", same.code !== 0, same.out);
}

console.log("\n=== show");
{
  const rows = json(stateFile);
  rows.rows[1].entries = ["E2"];
  writeFileSync(stateFile, JSON.stringify(rows, null, 2));
  const all = sheet("show", "N001");
  ok("the head line names the arc, the count, the stack's folder and the reset", all.code === 0 && /^N001 · 2 entries · stack: the spn-x checkout at the branch tip · reset from empty/.test(all.out), all.out);
  ok("a line for each entry", /\nE1 edit /.test(all.out) && /\nE2 edit /.test(all.out), all.out);
  ok("E2's line carries its then, callers and tier counts", /E2 edit .*then gen-barrel.*callers 2.*unit 2.*contract 1/.test(all.out), all.out);
  ok("it ends on the --json hint", all.out.trim().endsWith("--json for every field"), all.out);
  const row = sheet("show", "N001", "--row", "2");
  ok("`--row` prints only that row's entries", row.code === 0 && row.out.includes("row 2 · 1 entries") && row.out.includes("E2 edit") && !row.out.includes("E1 edit"), row.out);
  const asJson = sheet("show", "N001", "--row", "2", "--json");
  ok("`--json` prints the entries whole", asJson.code === 0 && JSON.parse(asJson.out).entries.length === 1 && JSON.parse(asJson.out).entries[0].id === "E2", asJson.out);
  const nope = sheet("show", "N001", "--row", "9");
  ok("a row the arc lacks is refused", nope.code !== 0, nope.out);
}

console.log("\n=== check");
{
  // E1 is named by no row; row 2 (CODE) names E2, which names a test; the arc has a CODE row.
  const first = sheet("check", "N001");
  ok("an entry no row names is found", first.out.includes("E1 is named by no row"), first.out);
  ok("a DOCS row that names no entry is found, in the preview's words", first.out.includes("row 1 names no entry"), first.out);
  ok("it ends on the count and exits 1", first.code === 1 && /\n2 findings · exit 1\n?$/.test(first.out), first.out);
  {
    const kinds = json(stateFile);
    const was = kinds.rows[0].altitude;
    const lone = (altitude) => { kinds.rows[0].altitude = altitude; writeFileSync(stateFile, JSON.stringify(kinds, null, 2)); return sheet("check", "N001").out; };
    ok("a CODE row that names no entry is found as that, not as a missing test", lone("CODE").includes("row 1 names no entry") && !lone("CODE").includes("row 1 is a CODE row"));
    ok("a GENERATED row that names no entry is found", lone("GENERATED").includes("row 1 names no entry"));
    ok("a RELEASE row names its files through no entry and is never this finding", !lone("RELEASE").includes("row 1 names no entry"));
    ok("a PROOF row is never this finding", !lone("PROOF").includes("row 1 names no entry"));
    kinds.rows[0].altitude = was; writeFileSync(stateFile, JSON.stringify(kinds, null, 2));
  }

  const rows = json(stateFile);
  rows.rows[0].entries = ["E1"]; rows.rows[1].entries = ["E2", "E7"];
  writeFileSync(stateFile, JSON.stringify(rows, null, 2));
  const second = sheet("check", "N001");
  ok("a row naming an entry the sheet does not hold is found", second.out.includes("row 2 names E7, which the sheet does not hold"), second.out);

  sheet("edit", "N001", "E2", "--tiers", "none");
  rows.rows[1].entries = ["E2"];
  writeFileSync(stateFile, JSON.stringify(rows, null, 2));
  const third = sheet("check", "N001");
  ok("a CODE row whose entries name no test is found", third.out.includes("row 2 is a CODE row and its entries name no test"), third.out);
  sheet("edit", "N001", "E2", "--tiers", "unit=T.2.01");

  for (const one of ["E1", "E2"]) sheet("edit", "N001", one, "--decided-by", "s2");
  const raised = cli(root, ["workstream", "question", "raise", "N001", "--file", put("card.json", CARD)]);
  const id = /q\d+/.exec(raised.out)?.[0];
  const answered = id ? cli(root, ["workstream", "question", "answer", id, "--key", "A", "--words", "A it is"]) : raised;
  const fourth = sheet("check", "N001");
  ok("an answered card no entry cites is found", id && fourth.out.includes(`${id} is answered and no entry cites it`) || false, `${raised.out} ${answered.out} ${fourth.out}`);

  const sheetData = json(sheetFile);
  sheetData.stack = null;
  writeFileSync(sheetFile, JSON.stringify(sheetData, null, 2));
  const fifth = sheet("check", "N001");
  ok("a null stack while the arc has a CODE row is found", fifth.out.includes("stack is null"), fifth.out);
}

console.log("\n=== check: a whole sheet exits 0");
{
  const rows = json(stateFile);
  rows.rows[0].entries = ["E1"]; rows.rows[1].entries = ["E2"];
  writeFileSync(stateFile, JSON.stringify(rows, null, 2));
  const data = json(sheetFile);
  data.stack = sheetOf([]).stack;
  const id = /q\d+/.exec(readFileSync(join(ws, "questions.jsonl"), "utf8"))?.[0] ?? "q1";
  data.entries[0].decidedBy = [id];
  writeFileSync(sheetFile, JSON.stringify(data, null, 2));
  const run = sheet("check", "N001");
  ok("no finding, exit 0", run.code === 0 && !run.out.includes("finding"), run.out);
}

console.log("\n=== check: the budgets a sheet can move, before and projected after");
{
  const budgets = sheet("check", "N001");
  ok("[MKT.HOOKS.324] check prints the session start's size against its ceiling, as measured now", /session start +[\d,]+ of 9,500 characters now/.test(budgets.out), budgets.out);
  ok("[MKT.HOOKS.324] and the tool-call hook's added time, as measured now", /tool-call hook +[\d.]+ ms added now/.test(budgets.out), budgets.out);
  ok("[MKT.HOOKS.324] with no figure on the sheet the projection says it is unchanged", (budgets.out.match(/unchanged/g) ?? []).length === 2, budgets.out);
  const data = json(sheetFile);
  data.budgets = { sessionStart: 7000, toolHook: 90 };
  writeFileSync(sheetFile, JSON.stringify(data, null, 2));
  const projected = sheet("check", "N001");
  ok("[MKT.HOOKS.324] a figure on the sheet is the projected after", /7,000 projected/.test(projected.out) && /90 ms projected/.test(projected.out) && projected.code === 0, projected.out);
  data.budgets = { sessionStart: 12000 };
  writeFileSync(sheetFile, JSON.stringify(data, null, 2));
  const over = sheet("check", "N001");
  ok("[MKT.HOOKS.324] a projection past the ceiling is a finding and exits 1", over.code === 1 && over.out.includes("12,000") && /past the 9,500 ceiling/.test(over.out), over.out);
  delete data.budgets;
  writeFileSync(sheetFile, JSON.stringify(data, null, 2));
}

console.log("\n=== drop");
{
  const noNote = sheet("drop", "N001", "E1");
  ok("drop needs a note", noNote.code !== 0 && json(sheetFile).entries.length === 2, noNote.out);
  const run = sheet("drop", "N001", "E1", "--note", "no longer needed");
  ok("the entry is taken out", run.code === 0 && json(sheetFile).entries.length === 1 && json(sheetFile).entries[0].id === "E2", run.out);
  ok("the note goes to its log line", lines(log).at(-1).note.includes("no longer needed") && lines(log).at(-1).kind === "sheet");
  const again = sheet("drop", "N001", "E1", "--note", "x");
  ok("a missing entry is refused", again.code !== 0, again.out);
}

console.log("\n=== a decided arc's sheet is rewritten only on the developer's words");
{
  const file = put("again.json", sheetOf([entry("E1"), entry("E2")]));
  const before = readFileSync(sheetFile, "utf8");
  const logged = lines(log).length;
  const faulty = sheet("write", "N001", "--file", put("faulty.json", sheetOf([entry("E1", { what: "" }), entry("E2", { facts: ["f9"] })], { stack: null })));
  ok("[MKT.HOOKS.324] a sheet with several faults, rewritten on a decided arc without --because, is refused once and names every one",
    faulty.code === 1 && ["E1", "what", "f9", "stack", "--because"].every((word) => faulty.out.includes(word)) && faulty.out.trim().split("\n").length === 1, faulty.out);
  const bare = sheet("write", "N001", "--file", file);
  ok("[MKT.SCRIPTS.236] a rewrite of a decided arc's sheet without --because is refused, nothing written",
    bare.code === 1 && bare.out.includes("--because") && bare.out.includes("Nothing was written") && readFileSync(sheetFile, "utf8") === before && lines(log).length === logged, bare.out);
  const said = sheet("write", "N001", "--file", file, "--because", "the developer: add E1 back");
  ok("[MKT.SCRIPTS.237] with --because it is written and the words are logged", said.code === 0 && json(sheetFile).entries.length === 2 && lines(log).at(-1).note.includes("add E1 back"), said.out);
  const opened = cli(root, ["workstream", "arc", "edit", "031-probe/N005", "--title", "empty sheet", "--subject", "empty-sheet", "--goal", "an empty sheet is written once"]);
  const flip = cli(root, ["workstream", "arc", "edit", "031-probe/N005", "--status", "DECIDED", "--note", "go"]);
  const empty = sheet("write", "N005", "--file", put("empty.json", sheetOf([])));
  ok("[MKT.SCRIPTS.237] an empty sheet on a decided arc is written once, with no --because", opened.code === 0 && flip.code === 0 && empty.code === 0, `${opened.out}${flip.out}${empty.out}`);
}

console.log("\n=== an arc title is a short topic name");
{
  const open = (title) => cli(root, ["workstream", "arc", "edit", "031-probe/N006", "--title", title, "--subject", "short-title", "--goal", "a short title"]);
  const long = open("one two three four five six");
  ok("[MKT.SCRIPTS.230] a title past five words is refused", long.code !== 0 && long.out.includes("five words") && !existsSync(join(ws, "arcs", "N006", "state.json")), long.out);
  const comma = open("a title, with a comma");
  ok("[MKT.SCRIPTS.230] a title with a comma is refused", comma.code !== 0 && comma.out.includes("comma") && !existsSync(join(ws, "arcs", "N006", "state.json")), comma.out);
  const fine = open("a five word title now");
  ok("[MKT.SCRIPTS.230] a title of five words opens", fine.code === 0 && existsSync(join(ws, "arcs", "N006", "state.json")), fine.out);
  const retitle = cli(root, ["workstream", "arc", "edit", "031-probe/N006", "--title", "one two three four five six"]);
  ok("[MKT.SCRIPTS.230] a long title on an existing arc is refused", retitle.code !== 0 && json(join(ws, "arcs", "N006", "state.json")).title === "a five word title now", retitle.out);
}

console.log("\n=== the go is refused while the sheet has a finding");
{
  const stateOf = (arc) => join(ws, "arcs", arc, "state.json");
  cli(root, ["workstream", "arc", "edit", "031-probe/N007", "--title", "go with finding", "--subject", "go-finding", "--goal", "the go waits for the sheet"]);
  cli(root, ["workstream", "fact", "write", "N007", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const written = sheet("write", "N007", "--file", put("n7.json", sheetOf([entry("E1")])));
  const derivedRows = json(stateOf("N007"));
  writeFileSync(stateOf("N007"), JSON.stringify({ ...derivedRows, rows: [] }, null, 2));
  const go = cli(root, ["workstream", "arc", "edit", "031-probe/N007", "--status", "DECIDED", "--note", "go"]);
  ok("[MKT.SCRIPTS.235] the go is refused with the findings and nothing written", written.code === 0 && go.code !== 0 && go.out.includes("E1") && json(stateOf("N007")).status === "PROPOSED", `${written.out}${go.out}`);
  const rows = json(stateOf("N007"));
  rows.rows = [{ id: "1", parent: "N007", title: "build it", kind: "change", repo: "spn-x", altitude: "CODE", entries: ["E1"], state: "waiting" }];
  writeFileSync(stateOf("N007"), JSON.stringify(rows, null, 2));
  const clean = cli(root, ["workstream", "arc", "edit", "031-probe/N007", "--status", "DECIDED", "--note", "go"]);
  ok("[MKT.SCRIPTS.235] a sheet with no finding lets the go through", clean.code === 0 && json(stateOf("N007")).status === "DECIDED", clean.out);
  ok("[MKT.SCRIPTS.315] the go ends by naming go write as the next step", /Next: .*go write/.test(clean.out), clean.out);
}

console.log("\n=== carried suggestions, precedent, steps from the sheet");
{
  const stateOf = (arc) => join(ws, "arcs", arc, "state.json");
  const sugg = join(ws, "suggestions.jsonl");
  writeFileSync(sugg, `${JSON.stringify({ id: "s1", title: "first", state: "raised", preview: null, words: null })}\n${JSON.stringify({ id: "s2", title: "second", state: "raised", preview: null, words: null })}\n`);
  const registers = join(root, "spn-x", "docs", "registers");
  cli(root, ["help"]);
  mkdirSync(registers, { recursive: true });
  writeFileSync(join(registers, "decisions.md"), "### D7 — turnstile ledger rotation happens nightly\n");
  const opened = cli(root, ["workstream", "arc", "edit", "031-probe/N008", "--title", "turnstile ledger", "--subject", "ledger", "--goal", "rotation of the turnstile ledger", "--carries", "s1,s2"]);
  ok("[MKT.SCRIPTS.316] opening an arc prints the decisions that speak to its title and goal", opened.code === 0 && opened.out.includes("D7"), opened.out);
  // E28: the five earlier decisions an arc opens with are ranked by the title's words, not left in register order.
  writeFileSync(join(registers, "decisions.md"), `### D7 — turnstile ledger rotation happens nightly\n${Array.from({ length: 8 }, (_, at) => `### D${11 + at} — nightly rotation of ledgers number ${at}\n`).join("")}### D30 — quartz clock sync is monitored\n`);
  const ranked = cli(root, ["workstream", "arc", "edit", "031-probe/N010", "--title", "quartz clock sync", "--subject", "quartz", "--goal", "nightly rotation of ledgers"]);
  const listed = ranked.out.split("\n").filter((line) => /^  D\d+ · /.test(line));
  ok("[MKT.HOOKS.326] the earlier decisions are capped at five, and the count of the rest is said", ranked.code === 0 && listed.length === 5 && /and \d+ more/.test(ranked.out), ranked.out);
  ok("[MKT.HOOKS.326] the one that shares the title's words leads, though the register puts it last", listed[0]?.startsWith("  D30 · "), ranked.out);
  const states = () => Object.fromEntries(lines(sugg).map((one) => [one.id, one.state]));
  ok("[MKT.SCRIPTS.317] a carried suggestion reads shaped", json(stateOf("N008")).carries?.join() === "s1,s2" && states().s1 === "shaped" && states().s2 === "shaped", JSON.stringify(states()));
  cli(root, ["workstream", "arc", "edit", "031-probe/N008", "--status", "DECIDED", "--note", "go"]);
  ok("[MKT.SCRIPTS.317] it reads decided at the arc's go", states().s1 === "decided" && states().s2 === "decided", JSON.stringify(states()));
  cli(root, ["workstream", "arc", "edit", "031-probe/N008", "--status", "DROPPED", "--reason", "no longer", "--note", "drop it"]);
  ok("[MKT.SCRIPTS.317] it reads dropped when the arc is dropped", states().s1 === "dropped", JSON.stringify(states()));

  // steps from the sheet
  cli(root, ["workstream", "arc", "edit", "031-probe/N009", "--title", "derived steps", "--subject", "derived-steps", "--goal", "steps come from entries"]);
  cli(root, ["workstream", "fact", "write", "N009", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  const data = sheetOf([entry("E1"), entry("E2", { file: "spn-x:docs/guide.md" })], { releaseChain: ["spn-x releases"] });
  const derived = sheet("write", "N009", "--file", put("n9.json", data));
  const rows = json(stateOf("N009")).rows;
  const code = rows.find((one) => one.altitude === "CODE" && one.repo === "spn-x");
  const docs = rows.find((one) => one.altitude === "DOCS" && one.repo === "spn-x");
  ok("[MKT.SCRIPTS.311] the sheet write derives a step for each repository and kind of change", derived.code === 0 && code?.entries?.join() === "E1" && docs?.entries?.join() === "E2", derived.out + JSON.stringify(rows));
  ok("[MKT.SCRIPTS.311] it derives the release and proof steps from the release order", rows.some((one) => one.altitude === "RELEASE") && rows.some((one) => one.altitude === "PROOF"), JSON.stringify(rows));
  const again = sheet("write", "N009", "--file", put("n9.json", data));
  ok("[MKT.SCRIPTS.311] writing the same sheet again adds no step", again.code === 0 && json(stateOf("N009")).rows.length === rows.length, again.out);
  const added = cli(root, ["workstream", "row", "add", "031-probe/N009", "by hand", "--repo", "spn-x", "--altitude", "CODE"]);
  ok("[MKT.SCRIPTS.311] a step added by hand to an arc that keeps a sheet is refused", added.code !== 0 && added.out.includes("sheet") && json(stateOf("N009")).rows.length === rows.length, added.out);

  // a follow-up written after every step landed
  const held = json(stateOf("N009"));
  for (const row of held.rows) row.state = "landed";
  writeFileSync(stateOf("N009"), JSON.stringify(held, null, 2));
  const follow = sheet("write", "N009", "--file", put("n9.json", sheetOf([...data.entries, entry("E3")], { releaseChain: ["spn-x releases"] })));
  const after = json(stateOf("N009")).rows;
  const of = (altitude) => after.filter((one) => one.altitude === altitude);
  ok("[MKT.SCRIPTS.324] a landed step keeps the entries it landed", follow.code === 0 && of("CODE")[0]?.entries?.join() === "E1" && of("CODE")[0]?.state === "landed", follow.out + JSON.stringify(after));
  ok("[MKT.SCRIPTS.324] an entry written after its step landed gets a step of its own", of("CODE").length === 2 && of("CODE")[1]?.entries?.join() === "E3" && of("CODE")[1]?.state !== "landed", JSON.stringify(after));
  ok("[MKT.SCRIPTS.324] the follow-up gets its own release and proof steps", of("RELEASE").filter((one) => one.state !== "landed").length === 1 && of("PROOF").filter((one) => one.state !== "landed").length === 1, JSON.stringify(after));
  ok("[MKT.SCRIPTS.324] the docs repository with nothing new gets no step", of("DOCS").length === 1, JSON.stringify(after));
  const twice = sheet("write", "N009", "--file", put("n9.json", sheetOf([...data.entries, entry("E3")], { releaseChain: ["spn-x releases"] })));
  ok("[MKT.SCRIPTS.324] writing the follow-up again adds no step", twice.code === 0 && json(stateOf("N009")).rows.length === after.length, twice.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — sheet` : `\n  all ${total} passed — sheet`);
process.exit(failed ? 1 : 0);
