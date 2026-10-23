// `lib/migration.ts` — the migrations a release ships, the workspace's ledger, and where each one
// stands. Each case is a throwaway workspace: migration 001's own check over a workstream kept in the
// old shape and one kept as data, and made-up migrations for a script, steps and the id order.
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";
import { arcData, cli, dataWorkspace } from "../../../helpers/workstream-fixture.mjs";

const lib = await import("../../../../src/scripts/lib/migration.ts");
const { MIGRATIONS } = await import("../../../../src/scripts/lib/migrations/index.ts");
const { applyMigrations, ledgerOf, readLedger, record, standings, windowStartLines } = lib;

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const OLD = ".spndevex/workstreams/open/031-probe";
/** A workspace with no ledger, holding one open workstream whose arc is still Markdown and whose preview sits in `previews/`. */
const unmigrated = (name) => workspace(name, {
  [`${OLD}/approach.html`]: "<h1>031</h1>\n",
  [`${OLD}/arcs/N001-probe.md`]: "# N001 — the probe\n\nStatus: **RUNNING**\n",
  [`${OLD}/notes/N001/previews/probe-preview.html`]: "<p>the probe</p>\n",
}, [], { migrated: false });
/** A workspace with no ledger whose one workstream is kept as data already. */
const current = (name) => workspace(name, {
  [`${OLD}/approach.html`]: "<h1>031</h1>\n",
  [`${OLD}/arcs/N001/state.json`]: "{}\n",
  [`${OLD}/notes/N001/preview.html`]: "<p>the probe</p>\n",
}, [], { migrated: false });

const [m001, m002, m003] = MIGRATIONS;

console.log("=== the plugin's migrations");
{
  ok("the plugin ships 001 first, with a version, one sentence and steps", m001.id === "001" && /^\d+\.\d+\.\d+$/.test(m001.version) && m001.changed.endsWith(".") && m001.steps.length > 0);
  const ids = MIGRATIONS.map((one) => one.id);
  ok("every id is three digits, used once, in order", ids.every((id) => /^\d{3}$/.test(id)) && new Set(ids).size === ids.length && ids.join() === [...ids].sort().join());
}

console.log("\n=== an empty ledger, and 001's check finding old shapes → pending");
{
  const root = unmigrated("empty-ledger");
  const [one] = standings(root, MIGRATIONS);
  ok("001 is pending", one.state === "pending", JSON.stringify(one.state));
  ok("its check names the Markdown arc and the previews folder",
    one.found.some((place) => place === "open/031-probe: 1 arc(s) kept as Markdown under arcs/") && one.found.includes("open/031-probe/notes/N001/previews/"), one.found.join(" | "));
  const lines = windowStartLines(root, MIGRATIONS);
  ok("the window's start names it, what changed, and its steps", lines[0].startsWith("- **001**") && lines.some((line) => /^  1\. /.test(line)), lines.join("\n"));
  ok("an absent ledger is an empty one, and reading it writes nothing", readLedger(root).entries.length === 0 && !existsSync(ledgerOf(root)));
}

console.log("\n=== applied → recorded, and never pending again");
{
  const root = unmigrated("applied");
  const entry = record(root, m001, "agent", new Date(2026, 9, 18, 10, 20));
  const line = JSON.parse(readFileSync(ledgerOf(root), "utf8").trim());
  ok("the ledger gains one line: plugin, id, version, when, who and how",
    line.plugin === "spn-devex" && line.id === "001" && line.version === m001.version && line.at === "2026-10-18T10:20+05:30" && line.by && line.how === "agent", JSON.stringify(line));
  ok("recording hands back the same line", entry.id === line.id && entry.at === line.at);
  const [one] = standings(root, MIGRATIONS);
  ok("001 stands applied, though its old shapes are still on disk: a recorded migration is not checked again", one.state === "applied" && one.found.length === 0);
  ok("the window's start says nothing of it", windowStartLines(root, [m001]).length === 0 && !windowStartLines(root, MIGRATIONS).some((line) => line.includes("001")));
  let refused = "";
  try { record(root, m001, "agent"); } catch (thrown) { refused = thrown.message; }
  ok("red: recording it twice is refused", /recorded already/.test(refused), refused);
}

console.log("\n=== a check that finds nothing → recorded without work");
{
  const root = current("nothing-to-do");
  const [one] = standings(root, MIGRATIONS);
  ok("001 has nothing to do where the workstream is kept as data", one.state === "nothing to do", one.state);
  ok("the window's start says so in one line, naming the command that records it",
    windowStartLines(root, MIGRATIONS).join("\n") === "- 001, 002, 003, 004: the check finds nothing in the old shape — `spn-devex plugin migration write 001 002 003 004` records it, with nothing to do.",
    windowStartLines(root, MIGRATIONS).join("\n"));
  const applied = applyMigrations(root, MIGRATIONS, ["001"]);
  const line = JSON.parse(readFileSync(ledgerOf(root), "utf8").trim());
  ok("writing it records it with nothing to do", applied.code === 0 && line.how === "nothing to do" && applied.out.join() === "001 · recorded · nothing to do", applied.out.join(" | "));
  const again = applyMigrations(root, MIGRATIONS, ["001"]);
  ok("writing it again says it is applied, and adds no line",
    again.code === 0 && /^001 · applied already/.test(again.out[0]) && readFileSync(ledgerOf(root), "utf8").trim().split("\n").length === 1, again.out.join(" | "));
}

console.log("\n=== 002 — an arc's notes folder holds the five, and nothing else");
{
  ok("the plugin ships 002 second, with a version, one sentence and steps", m002.id === "002" && /^\d+\.\d+\.\d+$/.test(m002.version) && m002.changed.endsWith(".") && m002.steps.length > 0);
  const root = workspace("notes-tree", {
    [`${OLD}/arcs/N001/state.json`]: "{}\n",
    [`${OLD}/notes/N001/preview.html`]: "<p>the probe</p>\n",
    [`${OLD}/notes/N001/plan.md`]: "# plan\n",
    [`${OLD}/notes/N001/shots/rail.png`]: "png",
    [`${OLD}/notes/N001/parked-cards.md`]: "# parked\n",
    [`${OLD}/notes/N001/samples/looks/a.png`]: "png",
    ".spndevex/workstreams/closed/020-done/notes/N001/shots/a.png": "png",
  }, [], { migrated: false });
  const [, two] = standings(root, MIGRATIONS);
  ok("red: 002 is pending, and its check names each stray with where it belongs",
    two.state === "pending" && two.found.length === 2 && two.found.some((place) => place.startsWith("open/031-probe/notes/N001/shots/ → `samples/`"))
      && two.found.some((place) => /^open\/031-probe\/notes\/N001\/parked-cards\.md → .*questions\.jsonl/.test(place)), two.found.join(" | "));
  ok("a closed workstream is never read", !two.found.some((place) => place.includes("020-done")));
  ok("its steps fold card files into questions.jsonl after a check for duplicates, and rewrite links first",
    m002.steps.some((step) => /duplicate/.test(step) && /question raise/.test(step)) && m002.steps.some((step) => /move table/.test(step) && /links?/.test(step)));
  const owed = applyMigrations(root, MIGRATIONS, ["002"], true);
  ok("red: write 002 refuses while 001 is pending, and 001 has nothing to do here so it is recorded as it passes, and 002 is not",
    owed.code === 1 && owed.out[0] === "001 · recorded · nothing to do" && owed.out.some((line) => line.startsWith("002 · not recorded")), owed.out.join(" | "));
  renameSync(join(root, OLD, "notes/N001/shots"), join(root, OLD, "notes/N001/samples/shots"));
  rmSync(join(root, OLD, "notes/N001/parked-cards.md"));
  const done = applyMigrations(root, MIGRATIONS, ["002"], true);
  ok("green: once folded, write 002 --steps-done records it as the agent's work", done.code === 0 && done.out.join() === "002 · recorded · by the agent's steps", done.out.join(" | "));
}

console.log("\n=== 002 — each arc's address, goal and name file, and the levels above the arc folders");
{
  const { root, ws } = await dataWorkspace("address-002");
  const page = join(ws, "approach.html");
  writeFileSync(page, readFileSync(page, "utf8").replace('<tr id="N001" ', "<tr ")
    .replace('<a href="notes/N001/preview.html">the probe</a>', '<a href="notes/N001/preview.html">the probe</a> &middot; <a href="arcs/N001/state.json">the arc</a>'));
  writeFileSync(join(ws, "notes", "N001", "preview.html"), '<p><a href="../../arcs/N001/state.json">arcs/N001/state.json</a></p>\n');
  writeFileSync(join(ws, "arcs", "N001", "state.json"), JSON.stringify({ ...arcData(), goal: null, subject: "the-probe-of-everything" }, null, 2));
  writeFileSync(join(ws, "notes", "ideation.md"), "# how it arrived\n");
  const found = m002.check(root);
  const says = (pattern) => found.some((place) => pattern.test(place));
  ok("red: 002 names the arc with no goal, from its plan's What done means", says(/^open\/031-probe\/arcs\/N001: no goal → `row write N001 --goal/), found.join(" | "));
  ok("red: a long subject is a finding for the workstream's own window, never renamed", says(/subject `the-probe-of-everything` is 4 words.* own window, never shortened by guessing/), found.join(" | "));
  ok("red: the name file not the commands'", says(/arcs\/N001\/the-probe-of-everything\.md: not as the commands write it/), found.join(" | "));
  ok("red: the Cycles row with no id", says(/N001's Cycles row carries no `id="N001"`/), found.join(" | "));
  ok("red: each page linking an arc's state.json, by its count", says(/^open\/031-probe\/approach\.html: 1 link\(s\)/) && says(/^open\/031-probe\/notes\/N001\/preview\.html: 1 link\(s\)/), found.join(" | "));
  ok("red: a note loose at notes/ goes to the first open arc's plan", says(/^open\/031-probe\/notes\/ideation\.md → a section of `notes\/N001\/plan\.md`/), found.join(" | "));
  ok("its steps rewrite the links to the address, fill the goal and run cycles write",
    m002.steps.some((step) => /approach\.html#N<nnn>/.test(step) && /state\.json/.test(step)) && m002.steps.some((step) => /--goal/.test(step)) && m002.steps.some((step) => /docs cycles write/.test(step)));
  writeFileSync(page, readFileSync(page, "utf8").replace(' &middot; <a href="arcs/N001/state.json">the arc</a>', ""));
  writeFileSync(join(ws, "notes", "N001", "preview.html"), '<p><a href="../../approach.html#N001">approach.html#N001</a></p>\n');
  rmSync(join(ws, "notes", "ideation.md"));
  cli(root, ["workstream", "row", "write", "031/N001", "--goal", "the probe is answered", "--subject", "probe"]);
  cli(root, ["docs", "cycles", "write", "031"]);
  ok("green: links rewritten, goal and short subject written, cycles write run — 002 finds nothing", m002.check(root).length === 0, m002.check(root).join(" | "));
}

console.log("\n=== 003 — a preview's header shows the arc's status");
{
  ok("the plugin ships 003 third, with a version, one sentence and a script", m003.id === "003" && /^\d+\.\d+\.\d+$/.test(m003.version) && m003.changed.endsWith(".") && typeof m003.script === "function");
  const { root, ws } = await dataWorkspace("statuses-003");
  const preview = join(ws, "notes", "N001", "preview.html");
  const old = `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-separator">|</span><span class="sds-label">Arc:</span> <span class="sds-badge">N001</span><span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-decided">DECIDED</span></span></span></div><h1>Probe</h1></header>\n`;
  writeFileSync(preview, old);
  mkdirSync(join(root, ".spndevex/workstreams/closed/020-done/notes/N001"), { recursive: true });
  writeFileSync(join(root, ".spndevex/workstreams/closed/020-done/notes/N001/preview.html"), old);
  const found = m003.check(root);
  ok("red: 003 names the preview whose header shows its own status, not the arc's", found.length === 1 && found[0] === "open/031-probe/notes/N001/preview.html: its header does not show the arc's status → the arc's commands write it", found.join(" | "));
  const lines = m003.script(root);
  ok("its script writes it, and names the preview", lines.join() === "open/031-probe/notes/N001/preview.html: wrote the arc's status", lines.join(" | "));
  ok("green: 003 then finds nothing", m003.check(root).length === 0, m003.check(root).join(" | "));
  ok("the preview reads Status DECIDED, the arc's own, linking its row, and its Arc fact is the linked badge after the type",
    readFileSync(preview, "utf8").includes(`<span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-separator">|</span><span class="sds-label">Arc:</span> <a class="sds-badge" href="../../approach.html#N001">N001</a><span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-decided" href="../../approach.html#N001">DECIDED</a></span></span>`), readFileSync(preview, "utf8"));
  ok("a closed workstream's preview stays as it closed", readFileSync(join(root, ".spndevex/workstreams/closed/020-done/notes/N001/preview.html"), "utf8") === old);
}

console.log("\n=== 004 — every row of an arc at PROPOSED, and every row landed before an arc's go, is a design row");
{
  const m004 = MIGRATIONS.find((one) => one.id === "004");
  ok("the plugin ships 004 fourth, with a version, one sentence and a script",
    MIGRATIONS[3]?.id === "004" && /^\d+\.\d+\.\d+$/.test(m004?.version ?? "") && m004.changed.endsWith(".") && typeof m004.script === "function");
  const { root, ws } = await dataWorkspace("design-rows-004");
  const proposed = { ...arcData([
    { id: "1", parent: "N002", title: "read the code", kind: "change", state: "landed" },
    { id: "2", parent: "N002", title: "draw the preview", kind: "fix", state: "running" },
    { id: "3", parent: "N002", title: "a design row already", kind: "design", state: "waiting" },
  ]), arc: "N002", subject: "second", status: "PROPOSED" };
  mkdirSync(join(ws, "arcs", "N002"), { recursive: true });
  writeFileSync(join(ws, "arcs", "N002", "state.json"), `${JSON.stringify(proposed, null, 2)}\n`);
  const backlog = join(root, ".spndevex/workstreams/backlog/032-later/arcs/N001");
  mkdirSync(backlog, { recursive: true });
  writeFileSync(join(backlog, "state.json"), `${JSON.stringify({ ...arcData(), status: "PROPOSED" }, null, 2)}\n`);
  const closed = join(root, ".spndevex/workstreams/closed/020-done/arcs/N001");
  mkdirSync(closed, { recursive: true });
  const closedText = `${JSON.stringify({ ...arcData(), status: "PROPOSED" }, null, 2)}\n`;
  writeFileSync(join(closed, "state.json"), closedText);
  // An arc past its go: rows 1 and 2 landed before it (2 was added landed), row 3 after it.
  const running = { ...arcData([
    { id: "1", parent: "N003", title: "the preview", kind: "change", state: "landed" },
    { id: "2", parent: "N003", title: "the record read", kind: "change", state: "landed" },
    { id: "3", parent: "N003", title: "the book", kind: "change", state: "landed" },
    { id: "4", parent: "N003", title: "the plugin", kind: "change", state: "waiting" },
  ]), arc: "N003", subject: "third", status: "RUNNING" };
  mkdirSync(join(ws, "arcs", "N003"), { recursive: true });
  writeFileSync(join(ws, "arcs", "N003", "state.json"), `${JSON.stringify(running, null, 2)}\n`);
  const line = (kind, note, row = null) => JSON.stringify({ at: "2026-10-23T19:00+05:30", kind, row, note });
  writeFileSync(join(ws, "arcs", "N003", "log.jsonl"), `${[line("opened", "opened as PROPOSED"), line("landed", "waiting → landed", "1"), line("added", "the record read", "2"),
    line("status", "the developer: good to go"), line("added", "the book", "3"), line("landed", "running → landed", "3"), line("status", "DECIDED → RUNNING · row 3 running")].join("\n")}\n`);
  // An arc opened at DECIDED: row 1 built then; reopened, row 2 landed while it read PROPOSED, and its go came after.
  const reopened = { ...arcData([
    { id: "1", parent: "N004", title: "built at first", kind: "change", state: "landed" },
    { id: "2", parent: "N004", title: "the next batch's preview", kind: "change", state: "landed" },
  ]), arc: "N004", subject: "fourth", status: "RUNNING" };
  mkdirSync(join(ws, "arcs", "N004"), { recursive: true });
  writeFileSync(join(ws, "arcs", "N004", "state.json"), `${JSON.stringify(reopened, null, 2)}\n`);
  writeFileSync(join(ws, "arcs", "N004", "log.jsonl"), `${[line("opened", "opened as DECIDED"), line("landed", "running → landed", "1"), line("status", "DECIDED → LANDED"),
    line("status", "LANDED → PROPOSED · the next batch"), line("landed", "running → landed", "2"), line("status", "PROPOSED → DECIDED · the developer: go")].join("\n")}\n`);
  const decidedBefore = readFileSync(join(ws, "arcs", "N001", "state.json"), "utf8");
  const found = m004.check(root);
  ok("red: 004 names each PROPOSED arc in open and backlog with rows not design, and each arc with rows landed before its go, by their count",
    found.length === 4 && found.includes("open/031-probe/arcs/N002: 2 row(s) at PROPOSED not design → design") && found.includes("backlog/032-later/arcs/N001: 2 row(s) at PROPOSED not design → design")
      && found.includes("open/031-probe/arcs/N003: 2 row(s) landed before the go not design → design")
      && found.includes("open/031-probe/arcs/N004: 1 row(s) landed before the go not design → design"), found.join(" | "));
  const lines = m004.script(root);
  const rows = JSON.parse(readFileSync(join(ws, "arcs", "N002", "state.json"), "utf8")).rows;
  ok("its script gives every row of those arcs the kind design, and nothing else changes",
    lines.length === 4 && rows.every((row) => row.kind === "design") && rows.map((row) => row.state).join() === "landed,running,waiting" && rows.map((row) => row.title).join() === "read the code,draw the preview,a design row already", lines.join(" | "));
  const third = JSON.parse(readFileSync(join(ws, "arcs", "N003", "state.json"), "utf8"));
  ok("a row landed before the arc's first move out of PROPOSED takes design, one added landed included; one landed after it and one not landed keep their kind",
    third.rows.map((row) => row.kind).join() === "design,design,change,change" && third.status === "RUNNING", JSON.stringify(third.rows));
  const fourth = JSON.parse(readFileSync(join(ws, "arcs", "N004", "state.json"), "utf8"));
  ok("only a row landed while the arc read PROPOSED takes design: one built while an arc opened at DECIDED ran keeps its kind",
    fourth.rows.map((row) => row.kind).join() === "change,design", JSON.stringify(fourth.rows));
  ok("an arc whose log shows no move out of PROPOSED, and a closed workstream, stay as they are",
    readFileSync(join(ws, "arcs", "N001", "state.json"), "utf8") === decidedBefore && readFileSync(join(closed, "state.json"), "utf8") === closedText);
  const second = readFileSync(join(ws, "arcs", "N002", "state.json"), "utf8");
  const thirdText = readFileSync(join(ws, "arcs", "N003", "state.json"), "utf8");
  const again = m004.script(root);
  ok("green: 004 then finds nothing, and a second run writes nothing",
    m004.check(root).length === 0 && again.length === 0 && readFileSync(join(ws, "arcs", "N002", "state.json"), "utf8") === second
      && readFileSync(join(ws, "arcs", "N003", "state.json"), "utf8") === thirdText, again.join(" | "));
}

console.log("\n=== a broken ledger → reported, never written over");
{
  const root = unmigrated("broken");
  const broken = `${JSON.stringify({ plugin: "spn-devex", id: "001", version: "0.40.0", at: "x", by: "y", how: "agent" })}\n{ not json\n`;
  writeFileSync(ledgerOf(root), broken, "utf8");
  const ledger = readLedger(root);
  ok("the bad line is a fault, by its line number", ledger.faults.length === 1 && /line 2 is not JSON/.test(ledger.faults[0]), ledger.faults.join(" | "));
  const applied = applyMigrations(root, MIGRATIONS, ["001"]);
  ok("red: write stops, exit 1, and says nothing was written", applied.code === 1 && applied.err.at(-1) === "Nothing was written.", applied.err.join(" | "));
  ok("the ledger's bytes are as they were", readFileSync(ledgerOf(root), "utf8") === broken);
  let refused = "";
  try { record(root, m001, "agent"); } catch (thrown) { refused = thrown.message; }
  ok("red: the library refuses to append to it too", /does not read/.test(refused) && readFileSync(ledgerOf(root), "utf8") === broken, refused);
  ok("the window's start reports it as a needs-you", /The ledger .* does not read.*needs-you/.test(windowStartLines(root, MIGRATIONS)[0]));
  writeFileSync(ledgerOf(root), `${JSON.stringify({ plugin: "spn-devex", id: "1", version: "0.40.0", at: "x", by: "y", how: "by hand" })}\n`, "utf8");
  const shape = readLedger(root).faults.join(" | ");
  ok("red: a line that parses and breaks the format is a fault too", /not three digits/.test(shape) && /`how` is `by hand`/.test(shape), shape);
}

console.log("\n=== a script, steps, and the id order");
{
  const root = workspace("made-up", {}, [], { migrated: false });
  const marker = join(root, "old.txt");
  writeFileSync(marker, "old\n", "utf8");
  const scripted = { id: "101", version: "9.0.0", changed: "The old file goes.",
    check: (at) => readFileSync(join(at, "old.txt"), "utf8") ? ["old.txt"] : [],
    script: (at) => { writeFileSync(join(at, "new.txt"), "new\n"); writeFileSync(join(at, "old.txt"), ""); return ["old.txt emptied into new.txt"]; } };
  const stepped = { id: "102", version: "9.0.0", changed: "The page is rewritten.", check: (at) => existsSync(join(at, "page-old.html")) ? ["page-old.html"] : [],
    steps: ["Rewrite the page.", "Remove page-old.html."] };
  writeFileSync(join(root, "page-old.html"), "<p>old</p>\n", "utf8");
  const set = [scripted, stepped];

  const early = applyMigrations(root, set, ["102"]);
  ok("red: a later migration named while an earlier one is pending is refused, and nothing is recorded",
    early.code === 1 && /101 is pending, and it applies before 102/.test(early.err.join()) && !existsSync(ledgerOf(root)), early.err.join(" | "));
  const run = applyMigrations(root, set, ["101"]);
  ok("a script migration runs its script, checks again, and is recorded by its script",
    run.code === 0 && run.out.includes("101 · old.txt emptied into new.txt") && readLedger(root).entries[0].how === "script", run.out.join(" | "));
  const owed = applyMigrations(root, set, ["102"]);
  ok("red: a steps migration whose check still finds the old shape is not recorded, and its steps are printed",
    owed.code === 1 && owed.out.some((line) => line === "    1. Rewrite the page.") && readLedger(root).entries.length === 1, owed.out.join(" | "));
  const window = windowStartLines(root, set).join("\n");
  ok("the window's start makes the steps the agent's first task", /\*\*102\*\*.*its steps are your first task/.test(window) && window.includes("  2. Remove page-old.html."), window);
  writeFileSync(join(root, "page-old.html"), "", "utf8");
  stepped.check = (at) => readFileSync(join(at, "page-old.html"), "utf8") ? ["page-old.html"] : [];
  const done = applyMigrations(root, set, ["102"], true);
  ok("once the steps are done, write --steps-done records it as the agent's work",
    done.code === 0 && readLedger(root).entries.length === 2 && readLedger(root).entries[1].how === "agent" && done.out.join() === "102 · recorded · by the agent's steps", done.out.join(" | "));
  const looked = { id: "104", version: "9.0.0", changed: "The preview is rewritten.", check: () => ["notes/N001/preview.html"], steps: ["Rewrite it."], needsYou: "every preview's Overview" };
  const needs = windowStartLines(root, [looked]).join("\n");
  ok("a rewrite that needs the developer's look is a needs-you, applied after the look",
    /\*\*104\*\*.*a needs-you: open your reply with it, naming what it rewrites \(every preview's Overview\)/.test(needs) && needs.includes("write 104 --steps-done"), needs);
  const throwing = { id: "103", version: "9.0.0", changed: "x.", check: () => { throw new Error("cannot read"); } };
  const [, , third] = standings(root, [...set, throwing]);
  ok("red: a check that throws is pending, never clean", third.state === "pending" && /could not run: cannot read/.test(third.found[0]), JSON.stringify(third));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — migration` : `\n  all ${total} passed — migration`);
process.exit(failed ? 1 : 0);
