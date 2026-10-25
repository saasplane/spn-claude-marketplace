// `docs cycles` — a workstream's Cycles table, printed from its arcs' data (05-artifacts.md § `How` ends
// in Cycles, and the arcs are the state). Each case builds a workstream in a temporary folder, because
// what the command reads is arcs, and the arcs of a real workstream move every day.
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { arcCell, arcLabel, cyclesOf, statusLabel, statusWord, tableOf, workstreamFolder }
  from "../../../../../src/scripts/commands/docs/cycles.ts";
import * as cyclesModule from "../../../../../src/scripts/commands/docs/cycles.ts";
import { main } from "../../../../../src/scripts/cli.ts";
import { WORKSTREAMS } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** What `main` prints, since the command writes to stdout and stderr rather than returning text. */
async function capture(argv, env = {}) {
  const lines = [], errors = [];
  const realLog = console.log, realErr = console.error;
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  console.log = (...args) => lines.push(args.join(" "));
  console.error = (...args) => errors.push(args.join(" "));
  let code;
  try { code = await main(argv); }
  finally {
    console.log = realLog; console.error = realErr;
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  return { code, out: lines.join("\n"), err: errors.join("\n") };
}

const TMP = realpathSync(mkdtempSync(join(tmpdir(), "docs-cycles-")));
const folder = join(TMP, ".spndevex", WORKSTREAMS, "backlog", "042-probe");

/**
 * An arc kept as data in a workstream folder: its `state.json`, and the preview and samples its notes hold.
 * `fields` are the arc's header: its title, what it decides, its status and its reason.
 */
function putArc(home, id, fields, { preview = false, samples = [] } = {}) {
  const data = { schemaVersion: 1, arc: id, subject: "the-arc", title: "an arc", goal: "it lands", status: "DECIDED", reason: null,
    preview: "preview.html", rows: [], ...fields };
  mkdirSync(join(home, "arcs", id), { recursive: true });
  writeFileSync(join(home, "arcs", id, "state.json"), `${JSON.stringify(data, null, 2)}\n`);
  if (preview || samples.length) mkdirSync(join(home, "notes", id, "samples"), { recursive: true });
  if (preview) writeFileSync(join(home, "notes", id, "preview.html"), "<h1>the preview</h1>\n");
  for (const sample of samples) writeFileSync(join(home, "notes", id, "samples", sample), "a sample\n");
}

putArc(folder, "N2", { title: "the check", decides: "A check reads the new shape.", status: "DECIDED" });
putArc(folder, "N1", { title: "the chapter", decides: "The chapter says where the model sits.", status: "RUNNING" });
putArc(folder, "N10", { title: "the release", decides: "The plugins ship once.", status: "HELD", reason: "waits on Q7" }, { preview: true, samples: ["close_message.md"] });
putArc(folder, "N1a", { title: "a brief", decides: "The brief moves on.", status: "CARRIED", reason: "→ N98 rows 1-2" });
putArc(folder, "N3", { title: "part of it", decides: "Half the rows landed.", status: "PART-LANDED" });
putArc(folder, "N7", { title: "a status nobody knows", decides: "", status: "OPEN" });
// THE RETIRED FORM COUNTS FOR NOTHING: an arc written as a Markdown file under `arcs/` is no row.
writeFileSync(join(folder, "arcs", "N9-the-old-form.md"), "# N9 — the old form\n\nStatus: **RUNNING**\n");

try {
  console.log("=== docs cycles — reading the status word");
  {
    ok("the status word is read from the set", statusWord("HELD · no cloud account") === "HELD");
    ok("PART-LANDED is never read as LANDED", statusWord("PART-LANDED — today") === "PART-LANDED");
    ok("a word outside the set reads as none", statusWord("OPEN") === null);
  }

  console.log("\n=== docs cycles — every arc of a workstream, from its data, in run order");
  {
    const cycles = cyclesOf(folder);
    const order = cycles.map((c) => c.id).join(",");
    ok("one row per arc kept as data, numbers in order, a letter after its number", order === "N1,N1a,N2,N3,N7,N10", order);
    ok("the retired form counts for nothing: a Markdown arc file is no row", !cycles.some((c) => /N9/.test(c.id)), order);
    const byId = Object.fromEntries(cycles.map((c) => [c.id, c]));
    ok("the label is the number and the title", arcLabel(byId.N1) === "N1 — the chapter", arcLabel(byId.N1));
    ok("the line is what the arc decides", byId.N10.does === "The plugins ship once.", byId.N10.does);
    ok("HELD carries its reason", statusLabel(byId.N10) === "HELD · waits on Q7", statusLabel(byId.N10));
    ok("CARRIED carries where it went", statusLabel(byId.N1a) === "CARRIED · → N98 rows 1-2", statusLabel(byId.N1a));
    ok("an arc whose status the set does not know is still a row, marked", statusLabel(byId.N7) === "(no status)");
    ok("a folder with no arcs/ has no Cycles", cyclesOf(TMP).length === 0);
    const link = (href, text) => `<a href="${href}">${text}</a>`;
    ok("the Arc cell is three levels: the title in bold, the line, then the preview, each sample and the reason as facts",
      arcCell(byId.N10) === `<p><strong>N10 &mdash; the release</strong></p><p>The plugins ship once.</p><span class="sds-small">` +
        ["Preview: " + link("notes/N10/preview.html", "preview.html"), "Sample: " + link("notes/N10/samples/close_message.md", "close_message.md"),
          "waits on Q7"].join(" &middot; ") + "</span>", arcCell(byId.N10));
  }

  console.log("\n=== docs cycles — the table the approach template carries");
  {
    const cycles = cyclesOf(folder);
    const table = tableOf(cycles);
    ok("the header is Arc · Status, two columns",
      table.includes('<thead><tr><th>Arc</th><th class="sds-status-col">Status</th></tr></thead>') && !table.includes("What it does") && !table.includes("<th>Previews</th>"));
    ok("a row carries the arc's address and its data, and a HELD arc's Status cell is its badge alone",
      table.includes('<tr id="N10" data-arc="arcs/N10/state.json">') && table.includes(`<td><span class="sds-badge sds-status sds-held">HELD</span></td></tr>`), table);
    ok("a RUNNING arc's Status cell is its badge", table.includes('<td><span class="sds-badge sds-status sds-running">RUNNING</span></td></tr>'), table);

    const { tableDifferences } = cyclesModule;
    ok("a two-column table written from the arcs has no difference", JSON.stringify(tableDifferences(table, cycles)) === JSON.stringify({ missing: [], unknown: [], stale: [] }), JSON.stringify(tableDifferences(table, cycles)));
    const plainWord = table.replace('<span class="sds-badge sds-status sds-running">RUNNING</span>', "RUNNING");
    ok("a Status written as its plain word is named stale: every status is its badge",
      plainWord !== table && tableDifferences(plainWord, cycles).stale.some((line) => /Status is not its badge/.test(line)), JSON.stringify(tableDifferences(plainWord, cycles)));
    const reasonless = table.replace(" &middot; waits on Q7", "");
    ok("a HELD arc's reason missing from its facts is named",
      tableDifferences(reasonless, cycles).stale.some((line) => /N10's links are not the arc's preview and samples/.test(line)), JSON.stringify(tableDifferences(reasonless, cycles)));
    const extra = table.replace("</tbody>", `<tr><td><p><strong>N9 &mdash; the old form</strong></p></td><td>RUNNING</td></tr>\n    </tbody>`);
    ok("a row for the Markdown arc names no arc the data holds", tableDifferences(extra, cycles).unknown.join() === "N9", JSON.stringify(tableDifferences(extra, cycles)));
  }

  console.log("\n=== docs cycles — naming the workstream");
  {
    ok("by folder", workstreamFolder(folder, null) === folder);
    ok("by its approach page", (writeFileSync(join(folder, "probe-approach.html"), "<h1>x</h1>"),
      workstreamFolder(join(folder, "probe-approach.html"), null) === folder));
    ok("by a page named approach.html", (writeFileSync(join(folder, "approach.html"), "<h1>x</h1>"),
      workstreamFolder(join(folder, "approach.html"), null) === folder));
    ok("by number, in any state", workstreamFolder("042", TMP) === folder);
    ok("by folder name", workstreamFolder("042-probe", TMP) === folder);
    ok("an unknown name finds nothing", workstreamFolder("999", TMP) === null);
  }

  console.log("\n=== docs cycles — through the CLI");
  {
    const printed = await capture(["docs", "cycles", "show", "042"], { SPN_WORKSPACE: TMP });
    ok("prints the table and exits 0", printed.code === 0 && printed.out.includes("<th>Arc</th>"), `code ${printed.code}`);
    ok("names the arc whose status the set does not know, on stderr", printed.err.includes("! N7 holds no status the set knows"), printed.err);

    const json = await capture(["docs", "cycles", "show", folder, "--json"]);
    let rows = [];
    try { rows = JSON.parse(json.out); } catch { /* reported below */ }
    ok("--json prints one object per arc", json.code === 0 && rows.length === 6 && rows[0].arc === "N1 — the chapter", json.out.slice(0, 200));
    ok("--json names each arc's data file and lists its previews", rows[0]?.file === "state.json" && Array.isArray(rows[0]?.previews), json.out.slice(0, 200));

    const SHOW_USAGE = "usage: spn-devex docs cycles show <workstream> [--json]";
    const WRITE_USAGE = "usage: spn-devex docs cycles write <workstream>";
    const USAGE = `${SHOW_USAGE}\n${WRITE_USAGE.replace("usage: ", "       ")}`;
    const missing = await capture(["docs", "cycles", "show", "999"], { SPN_WORKSPACE: TMP });
    ok("an unknown workstream exits 2 and says how to name one",
      missing.code === 2 && missing.err === `${SHOW_USAGE}\n\`docs cycles show\` finds no workstream \`999\`. Name its folder, its approach page, or its number, as \`spnutils workspace status\` lists it.`, missing.err);

    const bare = await capture(["docs", "cycles"]);
    ok("[MKT.SCRIPTS.111] with no action the entry prints each usage line, says an action is owed and exits 2",
      bare.code === 2 && bare.err === `${USAGE}\n\`docs cycles\` needs an action.`, bare.err);
    const asOption = await capture(["docs", "cycles", "042", "--write"], { SPN_WORKSPACE: TMP });
    ok("[MKT.SCRIPTS.111] a workstream where the action belongs is refused the same way, and `--write` is named as the action `write`",
      asOption.code === 2 && asOption.err === `${USAGE}\n\`docs cycles\` needs an action. \`--write\` is the action \`write\`.`, asOption.err);
    const alone = await capture(["docs", "cycles", "042"], { SPN_WORKSPACE: TMP });
    ok("[MKT.SCRIPTS.111] a workstream alone, with no action before it, is refused with exit 2 and prints no table", alone.code === 2 && alone.out === "", alone.out);
    const noShow = await capture(["docs", "cycles", "show"], { SPN_WORKSPACE: TMP });
    ok("`show` with no workstream says one is owed, and exits 2", noShow.code === 2 && noShow.err === `${SHOW_USAGE}\n\`docs cycles show\` needs a workstream.`, noShow.err);
    const noWrite = await capture(["docs", "cycles", "write"], { SPN_WORKSPACE: TMP });
    ok("[MKT.SCRIPTS.112] `write` with no workstream prints its usage line, says one is owed and exits 2",
      noWrite.code === 2 && noWrite.err === `${WRITE_USAGE}\n\`docs cycles write\` needs a workstream.`, noWrite.err);
    const two = await capture(["docs", "cycles", "show", "042", "043"], { SPN_WORKSPACE: TMP });
    ok("a second workstream is refused with exit 2", two.code === 2 && two.err.includes("`docs cycles show` takes one workstream."), two.err);
    const jsonOnWrite = await capture(["docs", "cycles", "write", "042", "--json"], { SPN_WORKSPACE: TMP });
    ok("`write` does not take `--json`, and an option neither action takes is refused the same way",
      jsonOnWrite.code === 2 && jsonOnWrite.err === `${WRITE_USAGE}\n\`docs cycles write\` does not take \`--json\`.`
        && (await capture(["docs", "cycles", "show", "042", "--write"], { SPN_WORKSPACE: TMP })).code === 2, jsonOnWrite.err);

    const empty = join(TMP, ".spndevex", WORKSTREAMS, "open", "043-empty");
    mkdirSync(join(empty, "arcs"), { recursive: true });
    const none = await capture(["docs", "cycles", "show", empty]);
    ok("a workstream with no arcs exits 1", none.code === 1 && none.err.includes("has no arcs"), none.err);
  }

  console.log("\n=== docs cycles — the header's status follows the arcs");
  {
    const header = (word, glyph) => `<div class="sds-eyebrow"><span class="sds-line1">Workstream</span><span class="sds-state"><span class="sds-label">Status:</span> ` +
      `<span class="sds-badge sds-status sds-${word.toLowerCase()}">${glyph} ${word}</span></span></div>`;
    const arcAt = (status) => ({ id: "N1", name: "x", does: "", status, detail: "", file: "arcs/N1/state.json", previews: [] });
    const open = join(TMP, ".spndevex", WORKSTREAMS, "open", "045-status");
    const closed = join(TMP, ".spndevex", WORKSTREAMS, "closed", "046-status");
    ok("the word a header shows is read from its labelled status field",
      cyclesModule.headerStatusOf(header("IMPLEMENTING", "&#x1F6A7;")) === "IMPLEMENTING" && cyclesModule.headerStatusOf(`<div class="sds-eyebrow">Workstream 001 &middot; running</div>`) === null);
    for (const [what, statuses, expected] of [
      ["PLANNING while no arc is past DECIDED", ["PROPOSED", "DECIDED", null], "PLANNING"],
      ["IMPLEMENTING once an arc runs", ["DECIDED", "RUNNING"], "IMPLEMENTING"],
      ["IMPLEMENTING once an arc has landed", ["PROPOSED", "LANDED"], "IMPLEMENTING"],
      ["IMPLEMENTING while an arc is part-landed", ["PART-LANDED"], "IMPLEMENTING"],
      ["PLANNING for a workstream with no arc yet", [], "PLANNING"],
    ]) ok(`[MKT.HOOKS.40] the arcs give ${what}`, cyclesModule.headerStatusFor(open, statuses.map(arcAt)) === expected, cyclesModule.headerStatusFor(open, statuses.map(arcAt)));
    ok("[MKT.HOOKS.40] a closed workstream gives DONE, whatever its arcs read", cyclesModule.headerStatusFor(closed, [arcAt("RUNNING")]) === "DONE");

    const stale = cyclesModule.headerStatusRule(open, header("PLANNING", "&#x1F52E;"), [arcAt("RUNNING")]);
    ok("[MKT.HOOKS.40] known-bad: PLANNING over a running arc names the word shown and the word the arcs give",
      stale?.shows === "PLANNING" && stale?.gives === "IMPLEMENTING", JSON.stringify(stale));
    ok("[MKT.HOOKS.40] IMPLEMENTING over a running arc agrees", cyclesModule.headerStatusRule(open, header("IMPLEMENTING", "&#x1F6A7;"), [arcAt("RUNNING")]) === null);
    ok("[MKT.HOOKS.40] a closed page reading DONE agrees", cyclesModule.headerStatusRule(closed, header("DONE", "&#x2705;"), [arcAt("LANDED")]) === null);
    ok("[MKT.HOOKS.40] a header that labels no status is not judged",
      cyclesModule.headerStatusRule(open, `<div class="sds-eyebrow">Workstream 001 &middot; running</div>`, [arcAt("RUNNING")]) === null);
    ok("[MKT.HOOKS.40] DONE in open/ agrees once every arc is terminal, which is the stamp the close asks for first",
      cyclesModule.headerStatusRule(open, header("DONE", "&#x2705;"), [arcAt("LANDED"), arcAt("DROPPED")]) === null);
    ok("[MKT.HOOKS.40] known-bad: DONE in open/ while an arc still runs",
      cyclesModule.headerStatusRule(open, header("DONE", "&#x2705;"), [arcAt("LANDED"), arcAt("RUNNING")])?.gives === "IMPLEMENTING");
  }

  console.log("\n=== docs cycles write — the parts of a page that the arcs decide");
  {
    const { cyclesRule, headerRule, openHeadingRule } = await import("../../../../../src/scripts/checks/doc-check.ts");
    const count = (text, piece) => text.split(piece).length - 1;
    const CARD = (number) => `  <div class="sds-open">\n    <h4 id="q${number}">Q${number} &middot; a question</h4>\n    <div class="sds-recommended"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div>\n  </div>`;
    // A page in the shared form: it links one version of the shared stylesheet, and every class opens with `sds-`.
    const PAGE = ({ status = "PLANNING", glyph = "&#x1F52E;", cyclesBody, open = "Open &mdash; no card is open", cards = "" }) => `<!doctype html>
${linesFor("1.0.0").stylesheet}
<header class="sds-masthead">
  <div class="sds-eyebrow"><span class="sds-line1">SaaS Plane &nbsp;|&nbsp; Workstream &nbsp;|&nbsp; 050 - Write</span><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Approach</span><span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-${status.toLowerCase()}">${glyph} ${status}</span></span></span></div>
  <h1>A subject</h1>
</header>
<section id="s2"><div class="sds-section-head"><h2>What &mdash; the shape</h2></div>
  <div class="sds-scroll"><table><thead><tr><th>Part</th><th>Says</th></tr></thead><tbody><tr><td>one</td><td>a table that is not Cycles</td></tr></tbody></table></div>
</section>
<section id="s3"><div class="sds-section-head"><h2>How &mdash; the order</h2></div>
  <h3 id="h1">spn-foundation &mdash; the chapter</h3>
  <p>The chapter first.</p>
${cyclesBody}
</section>
<section id="s4"><div class="sds-section-head"><h2>${open}</h2></div>
${cards}
</section>
<section id="s5"><div class="sds-section-head"><h2>Deferred &mdash; parked</h2></div></section>
${linesFor("1.0.0").script}
`;
    const CYCLES_H3 = `  <h3 id="h9">Cycles &mdash; the arcs, in the order they run</h3>\n`;
    const OLD_TABLE = `  <div class="sds-scroll"><table><thead><tr><th>Arc</th><th>What it does</th><th>Status</th><th>Previews</th></tr></thead>\n` +
      `  <tbody><tr><td><strong>N1 &mdash; the chapter</strong><br><a class="sds-small" href="arcs/N1-the-chapter.md">arcs/N1-the-chapter.md</a></td><td>The chapter says where the model sits.</td><td>PROPOSED</td><td>&mdash;</td></tr></tbody></table></div>`;
    const build = (state, name, page) => {
      const home = join(TMP, ".spndevex", WORKSTREAMS, state, name);
      putArc(home, "N1", { title: "the chapter", decides: "The chapter says where the model sits.", status: "RUNNING" });
      putArc(home, "N2", { title: "the check", decides: "A check reads the new shape.", status: "DECIDED" });
      if (page !== null) writeFileSync(join(home, "approach.html"), page);
      return home;
    };
    const stamp = (file) => { const past = (Date.now() - 3_600_000) / 1000; utimesSync(file, past, past); return statSync(file).mtimeMs; };

    // KNOWN-BAD: an old table, the wrong status and the wrong heading of Open, with one card open.
    const home = build("open", "050-write", PAGE({ cyclesBody: CYCLES_H3 + OLD_TABLE, cards: CARD(3) }));
    const page = join(home, "approach.html");
    const before = readFileSync(page, "utf8");
    ok("known-bad: the page is stale by all three rules before the command runs",
      cyclesRule(page, before).length > 0 && headerRule(page, before).length > 0 && openHeadingRule(page, before).length > 0);
    const wrote = await capture(["docs", "cycles", "write", "050-write"], { SPN_WORKSPACE: TMP });
    const after = readFileSync(page, "utf8");
    ok("[MKT.SCRIPTS.79] `write` exits 0 and says which parts it wrote",
      wrote.code === 0 && /the header's status/.test(wrote.out) && /the Cycles table/.test(wrote.out) && /the heading of Open/.test(wrote.out), `${wrote.code} ${wrote.out} ${wrote.err}`);
    ok("[MKT.SCRIPTS.79] after it, the Cycles table is the arcs'", cyclesRule(page, after).length === 0, JSON.stringify(cyclesRule(page, after)));
    ok("[MKT.SCRIPTS.79] the header's status is written with its class, its glyph and its word",
      after.includes(`<span class="sds-badge sds-status sds-implementing">&#x1F6A7; IMPLEMENTING</span>`) && headerRule(page, after).length === 0);
    ok("[MKT.SCRIPTS.79] the heading of Open names each open card by its number",
      after.includes("<h2>Open &mdash; Q3</h2>") && openHeadingRule(page, after).length === 0);
    ok("[MKT.SCRIPTS.79] one table, one badge and one heading are replaced, each exactly once",
      count(after, "<table") === count(before, "<table") && count(after, "sds-badge sds-status") === 1 + count(after, '<td><span class="sds-badge sds-status') && count(after, "<h2") === count(before, "<h2") &&
      count(after, "<th>Arc</th>") === 1 && !after.includes("<th>Previews</th>") && after.includes("a table that is not Cycles") && after.includes("<h2>Deferred &mdash; parked</h2>"));
    ok("[MKT.SCRIPTS.79] it adds no generated marker to the page", !after.includes("spn:generated"));
    const writtenAt = stamp(page);
    const again = await capture(["docs", "cycles", "write", "050-write"], { SPN_WORKSPACE: TMP });
    ok("[MKT.SCRIPTS.79] a second `write` changes no byte, and the file's time does not move",
      again.code === 0 && readFileSync(page, "utf8") === after && statSync(page).mtimeMs === writtenAt && /current/.test(again.out), again.out);

    // UNTOUCHED: a page that is already current, with its rows in the order a person chose.
    const current = after.replace(/(<tbody>\n)(\s*<tr\b[^\n]*\n)(\s*<tr\b[^\n]*\n)/, "$1$3$2");
    ok("the fixture really holds the same rows in another order", current !== after && cyclesRule(page, current).length === 0);
    writeFileSync(page, current);
    const currentAt = stamp(page);
    const untouched = await capture(["docs", "cycles", "write", page]);
    ok("[MKT.SCRIPTS.79] a page that is already current is not written",
      untouched.code === 0 && readFileSync(page, "utf8") === current && statSync(page).mtimeMs === currentAt, untouched.out);

    // With no card open the heading has one form.
    const quiet = build("open", "051-quiet", PAGE({ status: "IMPLEMENTING", glyph: "&#x1F6A7;", cyclesBody: CYCLES_H3 + OLD_TABLE, open: "Open &mdash; Q9 &middot; Q10" }));
    await capture(["docs", "cycles", "write", quiet]);
    ok("[MKT.SCRIPTS.79] with no card open the heading reads `Open — no card is open`",
      readFileSync(join(quiet, "approach.html"), "utf8").includes("<h2>Open &mdash; no card is open</h2>"));

    // The rows keep the order the page lists them in: N2 first here, and its stale status is what is written.
    const N2_FIRST = OLD_TABLE.replace("<tbody><tr>", `<tbody><tr><td><strong>N2 &mdash; the check</strong><br><a class="sds-small" href="arcs/N2-the-check.md">arcs/N2-the-check.md</a></td>` +
      `<td>A check reads the new shape.</td><td>PROPOSED</td><td>&mdash;</td></tr>\n  <tr>`);
    const ordered = build("open", "056-ordered", PAGE({ status: "IMPLEMENTING", glyph: "&#x1F6A7;", cyclesBody: CYCLES_H3 + N2_FIRST }));
    await capture(["docs", "cycles", "write", ordered]);
    const orderedText = readFileSync(join(ordered, "approach.html"), "utf8");
    ok("[MKT.SCRIPTS.79] the rows keep the order the page lists them in",
      cyclesRule(join(ordered, "approach.html"), orderedText).length === 0 && orderedText.indexOf("<strong>N2 &mdash;") < orderedText.indexOf("<strong>N1 &mdash;") &&
      orderedText.indexOf("<strong>N2 &mdash;") > 0, orderedText.slice(orderedText.indexOf("<tbody>"), orderedText.indexOf("</tbody>")));

    // UNTOUCHED: a page in closed/ keeps the table it closed with.
    const closed = build("closed", "052-closed", PAGE({ cyclesBody: CYCLES_H3 + OLD_TABLE }));
    const closedText = readFileSync(join(closed, "approach.html"), "utf8");
    const closedAt = stamp(join(closed, "approach.html"));
    const kept = await capture(["docs", "cycles", "write", closed]);
    ok("[MKT.SCRIPTS.79] a page in closed/ is not written",
      kept.code === 0 && readFileSync(join(closed, "approach.html"), "utf8") === closedText && statSync(join(closed, "approach.html")).mtimeMs === closedAt, `${kept.code} ${kept.out}`);

    // UNTOUCHED: a page with no h3 named Cycles is refused, and nothing is written.
    const shapeless = build("open", "053-shapeless", PAGE({ cyclesBody: `  <h3 id="h9">What re-aligns</h3>\n` + OLD_TABLE }));
    const shapelessText = readFileSync(join(shapeless, "approach.html"), "utf8");
    const refused = await capture(["docs", "cycles", "write", shapeless]);
    ok("[MKT.SCRIPTS.79] a page with no h3 named Cycles exits 1 with a message and no write",
      refused.code === 1 && /Cycles/.test(refused.err) && readFileSync(join(shapeless, "approach.html"), "utf8") === shapelessText, `${refused.code} ${refused.err}`);

    const pageless = build("open", "054-pageless", null);
    const noPage = await capture(["docs", "cycles", "write", pageless]);
    ok("[MKT.SCRIPTS.79] a workstream with no page exits 1", noPage.code === 1 && /no approach page/.test(noPage.err), `${noPage.code} ${noPage.err}`);

    // Without the option nothing is written, as before.
    const printed = build("open", "055-printed", PAGE({ cyclesBody: CYCLES_H3 + OLD_TABLE }));
    const printedText = readFileSync(join(printed, "approach.html"), "utf8");
    const plain = await capture(["docs", "cycles", "show", printed]);
    ok("[MKT.SCRIPTS.79] with no option the command prints the table and writes no file",
      plain.code === 0 && plain.out.includes("<th>Arc</th>") && readFileSync(join(printed, "approach.html"), "utf8") === printedText);
  }

  console.log("\n=== docs cycles write — a page that holds its own copy of the styles is refused");
  {
    // KNOWN-BAD: the page links no shared stylesheet. Its header, its table and its card use the class
    // names of its own copy, and all three parts are stale against the arcs.
    const OWN_PAGE = `<!doctype html>
<style>.eyebrow{font-size:.8rem} .badge{border-radius:3px} .scroll{overflow-x:auto} .open{border-left:2px solid orange}</style>
<header class="masthead">
  <div class="eyebrow"><span class="line1">SaaS Plane &nbsp;|&nbsp; Workstream &nbsp;|&nbsp; 057 - Own copy</span><span class="st"><span class="lbl">Status:</span> <span class="badge status planning">&#x1F52E; PLANNING</span></span></div>
  <h1>A subject</h1>
</header>
<section id="s3"><div class="sec-head"><h2>How &mdash; the order</h2></div>
  <h3 id="h9">Cycles &mdash; the arcs, in the order they run</h3>
  <div class="scroll"><table><thead><tr><th>Arc</th><th>What it does</th><th>Status</th><th>Previews</th></tr></thead>
  <tbody><tr><td><strong>N1 &mdash; the chapter</strong><br><a class="s" href="arcs/N1-the-chapter.md">arcs/N1-the-chapter.md</a></td><td>The chapter says where the model sits.</td><td>PROPOSED</td><td>&mdash;</td></tr></tbody></table></div>
</section>
<section id="s4"><div class="sec-head"><h2>Open &mdash; no card is open</h2></div>
  <div class="open">\n    <h4 id="q3">Q3 &middot; a question</h4>\n    <div class="rec"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div>\n  </div>
</section>
`;
    const place = (state, name) => {
      const home = join(TMP, ".spndevex", WORKSTREAMS, state, name);
      putArc(home, "N1", { title: "the chapter", decides: "The chapter says where the model sits.", status: "RUNNING" });
      writeFileSync(join(home, "approach.html"), OWN_PAGE);
      return home;
    };
    const own = place("open", "057-own-copy");
    const refused = await capture(["docs", "cycles", "write", own]);
    ok("[MKT.SCRIPTS.108] `write` refuses a page that holds its own copy: exit 1, and the message says how to move it",
      refused.code === 1 && refused.err.includes(`approach.html: ${OWN_COPY}`) && refused.err.split(OWN_COPY).length - 1 === 1, `${refused.code} ${refused.err}`);
    ok("[MKT.SCRIPTS.108] and it writes nothing: the page keeps every byte", readFileSync(join(own, "approach.html"), "utf8") === OWN_PAGE);
    ok("[MKT.SCRIPTS.108] it names no part of the page, because it read no class of it",
      !/status badge|Cycles table to write|wrote the (?:header|Cycles|heading)/.test(refused.err + refused.out), refused.err + refused.out);
    const printed = await capture(["docs", "cycles", "show", own]);
    ok("[MKT.SCRIPTS.108] with no option the table is still printed from the arcs, in the shared names",
      printed.code === 0 && printed.out.includes(`<div class="sds-scroll"><table>`) && printed.out.includes(`<tr id="N1" data-arc="arcs/N1/state.json">`), printed.out);
    // A page under `closed/` is never read, so it is neither refused nor written.
    const shut = place("closed", "058-own-copy-closed");
    const kept = await capture(["docs", "cycles", "write", shut]);
    ok("[MKT.SCRIPTS.108] a page under closed/ is not read: exit 0, no word about its styles, and no write",
      kept.code === 0 && !kept.err.includes(OWN_COPY) && readFileSync(join(shut, "approach.html"), "utf8") === OWN_PAGE, `${kept.code} ${kept.out} ${kept.err}`);
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

console.log("\n=== the places of How, produced from the rows' repo (RD.DEVEX.WORKSPACE.251)");
{
  const { placedPage, placesOf } = cyclesModule;
  const { approachPage, arcData, cli: runCli, dataWorkspace } = await import("../../../../helpers/workstream-fixture.mjs");
  const page = approachPage("x");
  const cyclesAt = (text) => text.indexOf(`<h3 id="h9">Cycles</h3>`);
  const placed = placedPage(page, [{ repo: "spn-x", arcs: ["N001"] }]);
  const heading = placed.indexOf(`<h3 id="how-spn-x">spn-x</h3>`);
  ok("red: a repository the rows name with no h3 in How gains one, before Cycles", heading > 0 && heading < cyclesAt(placed), placed.slice(placed.indexOf("<h2>How"), cyclesAt(placed) + 40));
  ok("and its facts line names the arcs that reach it", placed.includes(`<p><span class="sds-small">Arcs: N001</span></p>`));
  ok("written twice, the page does not move", placedPage(placed, [{ repo: "spn-x", arcs: ["N001"] }]) === placed);
  const withPlace = (facts) => page.replace(`<h3 id="h9">Cycles</h3>`,
    `<h3 id="h1">spn-x &mdash; the book</h3>\n  <p>The chapter changes. Ships: the book.</p>\n  ${facts}\n  <h3 id="h2">spn-xy &mdash; another</h3>\n  <p>Not this one.</p>\n  <h3 id="h9">Cycles</h3>`);
  const sized = placedPage(withPlace(`<p><span class="sds-small">Size: large</span></p>`), [{ repo: "spn-x", arcs: ["N001", "N002"] }]);
  ok("a place's h3 is found by the name it starts with, and its facts line takes Arcs first",
    sized.includes(`<span class="sds-small">Arcs: N001 &middot; N002 &middot; Size: large</span>`) && !sized.includes(`how-spn-x`), sized);
  ok("the line under the heading stays as the agent wrote it", sized.includes("<p>The chapter changes. Ships: the book.</p>"));
  ok("a heading whose name only starts the same, spn-xy, is not the place", (sized.match(/Arcs:/g) ?? []).length === 1, sized);
  const stale = placedPage(withPlace(`<p><span class="sds-small">Arcs: N009 &middot; Size: large</span></p>`), [{ repo: "spn-x", arcs: ["N001"] }]);
  ok("an Arcs line that names other arcs is rewritten, and the facts after it kept", stale.includes(`<span class="sds-small">Arcs: N001 &middot; Size: large</span>`), stale);
  const bare = placedPage(withPlace(""), [{ repo: "spn-x", arcs: ["N001"] }]);
  ok("a place with no facts line gains one under its line", /Ships: the book\.<\/p>\n {2}<p><span class="sds-small">Arcs: N001<\/span><\/p>/.test(bare), bare);

  const { root, ws } = await dataWorkspace("cycles-places", { rows: [
    ...arcData().rows,
    { id: "3", parent: "N001", title: "prove it", kind: "change", repo: "—", altitude: "PROOF", state: "waiting" },
    { id: "4", parent: "N001", title: "the second repository", kind: "change", repo: "spn-y", altitude: "CODE", state: "waiting" },
  ] });
  ok("placesOf reads the header's repos and each row's repo, and a row that names none reaches no place",
    JSON.stringify(placesOf(ws)) === JSON.stringify([{ repo: "spn-x", arcs: ["N001"] }, { repo: "spn-y", arcs: ["N001"] }]), JSON.stringify(placesOf(ws)));
  const wrote = runCli(root, ["docs", "cycles", "write", "031"]);
  const text = readFileSync(join(ws, "approach.html"), "utf8");
  ok("`docs cycles write` writes the places of How", wrote.code === 0 && /the places of How/.test(wrote.out)
    && text.includes(`<h3 id="how-spn-x">spn-x</h3>`) && text.includes(`<h3 id="how-spn-y">spn-y</h3>`), `${wrote.out}\n${text}`);
  const again = runCli(root, ["docs", "cycles", "write", "031"]);
  ok("and a second write finds the page current", again.code === 0 && /is current/.test(again.out), again.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs cycles` : `\n  all ${total} passed — docs cycles`);
process.exit(failed ? 1 : 0);
