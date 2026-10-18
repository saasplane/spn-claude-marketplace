// `checks/workstream-state.ts` — `workstream state check` as a function. Each check is made to fail
// once on a fixture that breaks it, and to pass once the fixture is mended the way the agent would.
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arcData, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkWorkstream, checkWorkspace, sectionText } = await import("../../../../src/scripts/checks/workstream-state.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const said = (findings) => findings.map((one) => `[${one.check}] ${one.message}`).join(" | ");
const has = (findings, check, pattern) => findings.some((one) => one.check === check && pattern.test(one.message));

console.log("=== a whole workstream");
{
  const { ws } = await dataWorkspace("state-whole");
  const findings = checkWorkstream(ws);
  ok("green: a workstream kept as data and whole has no finding", findings.length === 0, said(findings));
}

console.log("\n=== S7 — the stamp on each arc's Cycles row");
{
  const { root, ws } = await dataWorkspace("state-stamp");
  const file = join(ws, "arcs", "N001", "state.json");
  const data = arcData();
  data.rows.push({ id: "3", parent: "N001", title: "a row the page has not taken in", kind: "change", state: "waiting" });
  writeFileSync(file, JSON.stringify(data, null, 2));
  const red = checkWorkstream(ws);
  ok("red: a row added with the page left behind fails", has(red, "stamp", /N001's part on the approach page is behind its rows/), said(red));
  ok("the finding names the command that restamps", has(red, "stamp", /workstream arc stamp write N001/));
  const stamped = cli(root, ["workstream", "arc", "stamp", "write", "031/N001"]);
  ok("`arc stamp write` restamps the row", stamped.code === 0 && /N001 · stamped [0-9a-f]{12}/.test(stamped.out), stamped.out);
  ok("green: after the restamp the check passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  data.rows[0].state = "landed";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("green: a row's state moving leaves the stamp current", !has(checkWorkstream(ws), "stamp", /behind/));
  const page = join(ws, "approach.html");
  const text = readFileSync(page, "utf8");
  writeFileSync(page, text.replace(/<tr data-arc="arcs\/N001\/state.json"[^>]*>/, "<tr>"));
  ok("red: an arc with no row in Cycles fails", has(checkWorkstream(ws), "stamp", /has no row in Cycles/), said(checkWorkstream(ws)));
  writeFileSync(page, text.replace('<a href="notes/N001/preview.html">the probe</a>', "the probe"));
  ok("red: an arc whose preview What does not link fails", has(checkWorkstream(ws), "stamp", /not linked from the page's What/), said(checkWorkstream(ws)));
  writeFileSync(page, text);
  ok("green: the page put back passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== Q99 — one preview per arc, by its fixed name");
{
  const { ws } = await dataWorkspace("state-preview");
  const notes = join(ws, "notes", "N001");
  mkdirSync(join(notes, "previews"), { recursive: true });
  ok("red: a previews/ folder fails", has(checkWorkstream(ws), "preview", /keeps a `previews\/` folder/), said(checkWorkstream(ws)));
  rmSync(join(notes, "previews"), { recursive: true });
  writeFileSync(join(notes, "layout-preview.html"), "<p>a second</p>");
  ok("red: a second preview by another name fails", has(checkWorkstream(ws), "preview", /layout-preview\.html` is a second preview/), said(checkWorkstream(ws)));
  rmSync(join(notes, "layout-preview.html"));
  renameSync(join(notes, "preview.html"), join(notes, "draft.html"));
  ok("red: an arc past PROPOSED with no preview fails", has(checkWorkstream(ws), "preview", /DECIDED and has no preview/), said(checkWorkstream(ws)));
  renameSync(join(notes, "draft.html"), join(notes, "preview.html"));
  mkdirSync(join(notes, "samples"), { recursive: true });
  writeFileSync(join(notes, "samples", "badge-dark.png"), "png");
  ok("green: samples stay beside the one preview", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RD.DEVEX.WORKSPACE.262 — an arc's notes folder holds the five, and nothing else");
{
  const { root, ws } = await dataWorkspace("state-notes-tree");
  const notes = join(ws, "notes", "N001");
  mkdirSync(join(notes, "shots"), { recursive: true });
  writeFileSync(join(notes, "shots", "rail-dark.png"), "png");
  writeFileSync(join(notes, "answered-cards.md"), "# answered\n");
  writeFileSync(join(notes, "inventory.md"), "# what exists\n");
  writeFileSync(join(notes, "orders"), "not a folder");
  const red = checkWorkstream(ws);
  ok("red: a folder of screenshots beside the five is named, and sent to samples/", has(red, "notes", /`notes\/N001\/shots\/` is not one of the five .* belongs in `samples\/`/), said(red));
  ok("red: a card file is sent to questions.jsonl, checked for duplicates", has(red, "notes", /answered-cards\.md` .* `questions\.jsonl`.*checked against the records/), said(red));
  ok("red: a note is sent to a section of plan.md", has(red, "notes", /inventory\.md` .* a section of `plan\.md`/), said(red));
  ok("red: one of the five made as the other kind is named", has(red, "notes", /`notes\/N001\/orders` .* `orders` itself, which is a folder and never a file/), said(red));
  const command = cli(root, ["workstream", "state", "check"]);
  ok("the command exits 1 and prints the [notes] finding", command.code === 1 && /031-probe N001 \[notes\]/.test(command.out), command.out);
  rmSync(join(notes, "orders"));
  mkdirSync(join(notes, "samples"), { recursive: true });
  renameSync(join(notes, "shots"), join(notes, "samples", "shots"));
  writeFileSync(join(notes, "plan.md"), "# N001 plan\n\n## What exists\n");
  rmSync(join(notes, "inventory.md"));
  rmSync(join(notes, "answered-cards.md"));
  writeFileSync(join(notes, ".DS_Store"), "");
  ok("green: folded into the five — a folder inside samples/ and a dot-file are no one's finding", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  mkdirSync(join(notes, "previews"), { recursive: true });
  const previews = checkWorkstream(ws);
  ok("a previews/ folder is named once, by the one-preview check", previews.length === 1 && previews[0].check === "preview", said(previews));
}

console.log("\n=== the life of an arc — the files of every step it has passed");
{
  const { ws } = await dataWorkspace("state-steps");
  rmSync(join(ws, "notes", "N001", "plan.md"));
  ok("red: a decided arc with no plan fails", has(checkWorkstream(ws), "steps", /DECIDED and has no `notes\/N001\/plan.md`/), said(checkWorkstream(ws)));
  writeFileSync(join(ws, "notes", "N001", "plan.md"), "# plan\n");
  const data = JSON.parse(readFileSync(join(ws, "arcs", "N001", "state.json"), "utf8"));
  data.rows[0].state = "landed";
  data.rows[0].order = "orders/1.md";
  writeFileSync(join(ws, "arcs", "N001", "state.json"), JSON.stringify(data));
  ok("red: a landed row with an order and no report fails", has(checkWorkstream(ws), "steps", /row 1 landed and its report/), said(checkWorkstream(ws)));
  put(ws, "notes/N001/orders/1.report.md", "---\nrow: \"1\"\noutcome: landed\n---\n");
  ok("green: the report there, the check passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  mkdirSync(join(ws, "notes", "N002"), { recursive: true });
  ok("red: a notes folder with no arc data fails", has(checkWorkstream(ws), "steps", /`notes\/N002\/` has no `arcs\/N002\/state.json`/), said(checkWorkstream(ws)));
  rmSync(join(ws, "notes", "N002"), { recursive: true });
}

console.log("\n=== the schema — data that does not hold");
{
  const { ws } = await dataWorkspace("state-schema");
  const file = join(ws, "arcs", "N001", "state.json");
  const good = readFileSync(file, "utf8");
  writeFileSync(file, good.replace('"DECIDED"', '"OPEN"'));
  ok("red: a status outside the eight fails", has(checkWorkstream(ws), "schema", /`status` is `OPEN`/), said(checkWorkstream(ws)));
  writeFileSync(file, "{ not json");
  ok("red: a state.json that is not JSON fails", has(checkWorkstream(ws), "schema", /is not JSON/), said(checkWorkstream(ws)));
  writeFileSync(file, good);
  writeFileSync(join(ws, "arcs", "N001", "log.jsonl"), '{"at":"t","kind":"added"}\nnot json\n');
  ok("red: a log line that is not JSON fails", has(checkWorkstream(ws), "schema", /log.jsonl line 2 is not JSON/), said(checkWorkstream(ws)));
  writeFileSync(join(ws, "arcs", "N001", "log.jsonl"), '{"at":"t","kind":"added"}\n');
  writeFileSync(join(ws, "suggestions.jsonl"), '{"id":"s1","title":"x","state":"maybe","preview":null,"words":null}\n');
  ok("red: a suggestion state outside the five fails", has(checkWorkstream(ws), "schema", /suggestions.jsonl line 1/), said(checkWorkstream(ws)));
  writeFileSync(join(ws, "suggestions.jsonl"), '{"id":"s1","title":"x","state":"raised","preview":null,"words":null}\n');
  ok("green: every file mended, the check passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== open and backlog follow the standard; closed stays as it closed");
{
  const root = workspace("state-layout", {
    ".spndevex/workstreams/open/026-old/arcs/N001-old.md": "# N001 — old\n\nStatus: **RUNNING**\n",
    ".spndevex/workstreams/closed/020-done/arcs/N001-done.md": "# N001 — done\n\nStatus: **LANDED**\n",
  });
  const findings = checkWorkspace(root);
  ok("red: an open workstream keeping its arcs as Markdown is named for the move", has(findings, "layout", /keeps 1 arc\(s\) as Markdown/), said(findings));
  ok("a closed workstream is never read", !findings.some((one) => one.workstream === "020-done"));
  const moved = cli(root, ["workstream", "state", "check"]);
  ok("the command exits 1 on a finding, and names it", moved.code === 1 && /026-old \[layout\]/.test(moved.out), moved.out);
}

console.log("\n=== a section of a page, by its heading");
{
  const text = "<h2>What</h2><p>in what</p><h2>How</h2><p>in how</p>";
  ok("the part under What stops at the next h2", sectionText(text, "What") === "<p>in what</p>");
  ok("a page with no such heading gives nothing", sectionText(text, "Why") === "");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream state check` : `\n  all ${total} passed — workstream state check`);
process.exit(failed ? 1 : 0);
