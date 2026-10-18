// `lib/migration.ts` — the migrations a release ships, the workspace's ledger, and where each one
// stands. Each case is a throwaway workspace: migration 001's own check over a workstream kept in the
// old shape and one kept as data, and made-up migrations for a script, steps and the id order.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";

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

const [m001] = MIGRATIONS;

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
  ok("the window's start says nothing", windowStartLines(root, MIGRATIONS).length === 0);
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
    windowStartLines(root, MIGRATIONS).join("\n") === "- 001: the check finds nothing in the old shape — `spn-devex plugin migration write 001` records it, with nothing to do.");
  const applied = applyMigrations(root, MIGRATIONS, ["001"]);
  const line = JSON.parse(readFileSync(ledgerOf(root), "utf8").trim());
  ok("writing it records it with nothing to do", applied.code === 0 && line.how === "nothing to do" && applied.out.join() === "001 · recorded · nothing to do", applied.out.join(" | "));
  const again = applyMigrations(root, MIGRATIONS, ["001"]);
  ok("writing it again says it is applied, and adds no line",
    again.code === 0 && /^001 · applied already/.test(again.out[0]) && readFileSync(ledgerOf(root), "utf8").trim().split("\n").length === 1, again.out.join(" | "));
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
