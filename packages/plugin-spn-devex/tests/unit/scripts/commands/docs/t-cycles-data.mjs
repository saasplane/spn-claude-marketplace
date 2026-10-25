// `commands/docs/cycles.ts` over arcs kept as data: each row read from `arcs/N<nnn>/state.json`, the
// preview by its fixed name and the samples beside it, the badge, the arc's number as the row's id with
// `data-arc` beside it, the stamp a rewrite of the table keeps, since only `workstream arc stamp write`
// writes it, and the arc's name file, which `write` writes too.
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";

const cycles = await import("../../../../../src/scripts/commands/docs/cycles.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const { root, ws } = await dataWorkspace("cycles-data");
put(ws, "notes/N001/samples/badge-dark.png", "png");

console.log("=== an arc kept as data, read into its row");
{
  const [cycle] = cycles.cyclesOf(ws);
  ok("the arc is read from its data", cycle?.file.endsWith("arcs/N001/state.json") && cycle.id === "N001" && cycle.name === "the probe arc" && cycle.status === "DECIDED", JSON.stringify(cycle));
  ok("its line is what it decides", cycle.does === "what it decides");
  ok("its preview by its fixed name comes first, then each sample", cycle.previews.map((one) => `${one.kind}:${one.href}`).join() ===
    "preview:notes/N001/preview.html,sample:notes/N001/samples/badge-dark.png", JSON.stringify(cycle.previews));
  const facts = cycles.factsCell(cycle);
  ok("its facts: Preview then Sample, no state beside them, and no link to its data",
    facts === 'Preview: <a href="notes/N001/preview.html">preview.html</a> &middot; Sample: <a href="notes/N001/samples/badge-dark.png">badge-dark.png</a>', facts);
  ok("its status is the badge coloured by its word", cycles.statusCell(cycle) === '<span class="sds-badge sds-status sds-decided">DECIDED</span>');
  const held = { ...cycle, status: "HELD", detail: "waits on q3" };
  ok("a HELD reason is a fact on the arc's line", cycles.factsCell(held).endsWith("&middot; waits on q3"));
  ok("a HELD reason is shown once: in the facts, and not under the badge, which stands alone",
    cycles.statusCell(held) === '<span class="sds-badge sds-status sds-held">HELD</span>' && cycles.rowCells(held).join("").split("waits on q3").length === 2);
  const row = cycles.tableOf([cycle], new Map([["N001", { stamp: "abc123abc123" }]]));
  ok("the row carries the arc's number as its id, its data's path and the stamp it was given",
    row.includes('<tr id="N001" data-arc="arcs/N001/state.json" data-arc-stamp="abc123abc123">'), row);
  ok("the Status column is the template's", row.includes('<th class="sds-status-col">Status</th>'));
}

console.log("\n=== docs cycles write keeps the stamp, and the page is then current");
{
  const page = join(ws, "approach.html");
  const before = readFileSync(page, "utf8");
  const stamp = /data-arc-stamp="([^"]*)"/.exec(before)[1];
  const red = cycles.tableDifferences(before.slice(cycles.cyclesTableAt(before).from, cycles.cyclesTableAt(before).to), cycles.cyclesOf(ws));
  ok("red: a sample added and not on the row is a stale row", red.stale.some((line) => /links are not/.test(line)), JSON.stringify(red));
  const wrote = cli(root, ["docs", "cycles", "write", "031"]);
  ok("write rewrites the table, and writes the places of How beside it", wrote.code === 0 && /wrote the places of How, the Cycles table/.test(wrote.out), wrote.out);
  const after = readFileSync(page, "utf8");
  ok("the stamp the page held is kept", new RegExp(`data-arc-stamp="${stamp}"`).test(after));
  ok("the open block is left to its commands", after.includes("Open &mdash; no card is open"));
  const table = after.slice(cycles.cyclesTableAt(after).from, cycles.cyclesTableAt(after).to);
  const green = cycles.tableDifferences(table, cycles.cyclesOf(ws));
  ok("green: the table now matches the arcs", !green.missing.length && !green.unknown.length && !green.stale.length, JSON.stringify(green));
  writeFileSync(page, after.replace(' data-arc="arcs/N001/state.json"', ""));
  const lost = readFileSync(page, "utf8");
  const noData = cycles.tableDifferences(lost.slice(cycles.cyclesTableAt(lost).from, cycles.cyclesTableAt(lost).to), cycles.cyclesOf(ws));
  ok("red: a row that lost its data-arc is stale", noData.stale.some((line) => /does not carry `data-arc="arcs\/N001\/state.json"`/.test(line)), JSON.stringify(noData));
  writeFileSync(page, after.replace('<tr id="N001" ', "<tr "));
  const unaddressed = readFileSync(page, "utf8");
  const noId = cycles.tableDifferences(unaddressed.slice(cycles.cyclesTableAt(unaddressed).from, cycles.cyclesTableAt(unaddressed).to), cycles.cyclesOf(ws));
  ok("red: a row with no id is stale, its address empty", noId.stale.some((line) => /carries no `id="N001"`/.test(line)), JSON.stringify(noId));
  rmSync(join(ws, "arcs", "N001", "probe.md"));
  const again = cli(root, ["docs", "cycles", "write", "031"]);
  ok("green: write gives the row its id back and writes the arc's name file",
    again.code === 0 && readFileSync(page, "utf8").includes('<tr id="N001" data-arc=') && /wrote the name file of N001\/probe.md/.test(again.out)
      && existsSync(join(ws, "arcs", "N001", "probe.md")), again.out);
  const json = JSON.parse(cli(root, ["docs", "cycles", "show", "031", "--json"]).out);
  ok("show --json names the arc's data file", json[0].file === "state.json" && json[0].status === "DECIDED", JSON.stringify(json));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs cycles over data` : `\n  all ${total} passed — docs cycles over data`);
process.exit(failed ? 1 : 0);
