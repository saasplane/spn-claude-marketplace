// `docs cycles` — a workstream's Cycles table, printed from its arcs (05-artifacts.md § `How` ends in
// Cycles, and the arcs are the state). Each case builds a workstream in a temporary folder, because
// what the command reads is arcs, and the arcs of a real workstream move every day.
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { arcCell, arcId, arcLabel, cycleOf, cyclesOf, previewsCell, previewsOf, statusLabel, statusWord, tableOf, workstreamFolder }
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
const arcs = join(folder, "arcs");
mkdirSync(arcs, { recursive: true });
const put = (name, text) => writeFileSync(join(arcs, name), text);

// The arc template's first line: the bold status, when it opened, then one sentence on what it changes.
put("N2-the-check.md", "# N2 — the check\n\nStatus: **DECIDED — waits on N1.** Opened 2026-09-29.   <!-- a comment the template keeps --> A check reads the new shape. It runs after N1.\n");
put("N1-the-chapter.md", "# `N1` — the chapter\n\nStatus: **RUNNING — 2026-09-29.** The chapter says where the model sits.\n");
put("N10-the-release.md", "# N10 — the release\n\nStatus: **HELD — waits on Q7.** Opened\n2026-09-29. The plugins ship once.\n");
put("N1a-a-brief.md", "# Arc 1a — a brief\n\nStatus: **CARRIED → `N98` steps 1-2** — 2026-09-27.\n\n| Field | This arc |\n| --- | --- |\n| **Decides** | **The brief moves on.** Nothing else. |\n");
put("N3-part.md", "# N3 — part of it\n\nStatus: **PART-LANDED — 2026-09-29.** Half the rows landed.\n");
// An arc's Previews section: a table of previews and samples, or the one line `None.`.
const PREVIEWS = "## Previews\n\n| File | Kind | Shows | State |\n| --- | --- | --- | --- |\n" +
  "| [`layout-preview.html`](../notes/N010/previews/layout-preview.html) | preview | how the page is laid out | proposed |\n" +
  "| [`close_message.md`](../notes/N010/samples/close_message.md) | sample | what the agent says at a close | decided 2026-10-01 |\n" +
  "| [`first-preview.html`](../notes/N010/previews/first-preview.html) | preview | the first layout | decided — 2026-09-30, with the second |\n\n" +
  "## What done means\n\n| File | Kind | State |\n| --- | --- | --- |\n| not-a-preview.md | sample | decided |\n";
put("arc-legacy.md", "# Arc — a legacy arc with no number\n\nStatus: **OPEN** · Prepared: 2026-08-31\n");

try {
  console.log("=== docs cycles — reading one arc");
  {
    ok("the status word is read from the set", statusWord("HELD · no cloud account") === "HELD");
    ok("PART-LANDED is never read as LANDED", statusWord("PART-LANDED — today") === "PART-LANDED");
    ok("a word outside the set reads as none", statusWord("OPEN") === null);
    ok("the arc number comes from the file name", arcId("N7-N8-flip-and-close.md") === "N7" && arcId("N1a-x.md") === "N1a");
    ok("a file with no number has none", arcId("arc-legacy.md") === null);
    ok("a three-digit number is read whole, and a one- or two-digit one still is",
      arcId("N001-book-change.md") === "N001" && arcId("N120-the-release.md") === "N120" && arcId("N15-x.md") === "N15" && arcId("N1.md") === "N1",
      [arcId("N001-book-change.md"), arcId("N120-the-release.md"), arcId("N15-x.md"), arcId("N1.md")].join(","));
    const numbered = cycleOf(join(arcs, "N001-book-change.md"), "# N001 — the book change\n\nStatus: **PROPOSED — 2026-10-01.** This arc writes the rule.\n");
    ok("a three-digit arc's label keeps its digits, and its heading's number is not repeated in the name",
      arcLabel(numbered) === "N001 — the book change" && numbered.name === "the book change", arcLabel(numbered));

    const two = cycleOf(join(arcs, "N2-the-check.md"), "# N2 — the check\n\nStatus: **DECIDED — waits on N1.** Opened 2026-09-29.   <!-- c --> A check reads the new shape. It runs after N1.\n");
    ok("the name is the heading without its number", two.name === "the check", two.name);
    ok("what it does is the first sentence after the status, past when it opened", two.does === "A check reads the new shape.", two.does);
    ok("a DECIDED arc's status cell is its word alone", statusLabel(two) === "DECIDED", statusLabel(two));
  }

  console.log("\n=== docs cycles — every arc of a workstream, in run order");
  {
    const cycles = cyclesOf(folder);
    const order = cycles.map((c) => c.id ?? c.name).join(",");
    ok("one row per arc file, numbers in order, a letter after its number, no number last",
      order === "N1,N1a,N2,N3,N10,a legacy arc with no number", order);
    const byId = Object.fromEntries(cycles.map((c) => [c.id ?? "legacy", c]));
    ok("a backticked heading reads plain", arcLabel(byId.N1) === "N1 — the chapter", arcLabel(byId.N1));
    ok("a status paragraph that wraps still yields its sentence", byId.N10.does === "The plugins ship once.", byId.N10.does);
    ok("HELD carries its blocker", statusLabel(byId.N10) === "HELD · waits on Q7", statusLabel(byId.N10));
    ok("CARRIED carries where it went", statusLabel(byId.N1a) === "CARRIED · → N98 steps 1-2", statusLabel(byId.N1a));
    ok("with no sentence after the status, Decides says what it does", byId.N1a.does === "The brief moves on.", byId.N1a.does);
    ok("an arc whose status the set does not know is still a row, marked", statusLabel(byId.legacy) === "(no status)");
    ok("a folder with no arcs/ has no Cycles", cyclesOf(TMP).length === 0);
  }

  console.log("\n=== docs cycles — an arc's Previews table");
  {
    const listed = previewsOf(PREVIEWS);
    ok("one entry per row of the Previews table, and no row of a later section's table", listed.length === 3, JSON.stringify(listed));
    ok("a link written from arcs/ is stated from the workstream folder",
      listed[0].href === "notes/N010/previews/layout-preview.html", listed[0].href);
    ok("the file name keeps every character of the link's target", listed[1].name === "close_message.md", listed[1].name);
    ok("the kind is the row's own", listed.map((preview) => preview.kind).join(",") === "preview,sample,preview");
    ok("the state is the words before any date",
      listed.map((preview) => preview.state).join(",") === "proposed,decided,decided", listed.map((preview) => preview.state).join(","));
    ok("a section reading None. has no entries", previewsOf("# N2\n\n## Previews\n\nNone.\n\n## Steps\n").length === 0);
    ok("an arc with no Previews section has no entries", previewsOf("# N2\n\n## Steps\n\n| File | Kind | State |\n| --- | --- | --- |\n| a.md | sample | decided |\n").length === 0);
    const unlinked = previewsOf("## Previews\n\n| File | Kind | Shows | State |\n| --- | --- | --- | --- |\n| `plan.md` | sample | the plan | proposed |\n");
    ok("a File cell with no link is named and links nothing", unlinked[0].name === "plan.md" && unlinked[0].href === null, JSON.stringify(unlinked));

    const none = cycleOf(join(arcs, "N2-the-check.md"), "# N2 — the check\n\nStatus: **DECIDED**\n\n## Previews\n\nNone.\n");
    ok("the Previews cell of an arc with none is a dash", previewsCell(none) === "&mdash;", previewsCell(none));
    const held = cycleOf(join(arcs, "N010-the-release.md"), `# N010 — the release\n\nStatus: **RUNNING**\n\n${PREVIEWS}`);
    ok("the Previews cell lists each file as a link, its kind and its state, one per line",
      previewsCell(held) === `<a href="notes/N010/previews/layout-preview.html">layout-preview.html</a> &middot; preview &middot; proposed<br>` +
        `<a href="notes/N010/samples/close_message.md">close_message.md</a> &middot; sample &middot; decided<br>` +
        `<a href="notes/N010/previews/first-preview.html">first-preview.html</a> &middot; preview &middot; decided`, previewsCell(held));
    ok("the Arc cell is the label in bold, then the arc's file as a link from the page",
      arcCell(held) === `<strong>N010 &mdash; the release</strong><br><a class="sds-small" href="arcs/N010-the-release.md">arcs/N010-the-release.md</a>`, arcCell(held));
  }

  console.log("\n=== docs cycles — the table the approach template carries");
  {
    const table = tableOf(cyclesOf(folder));
    ok("the header is Arc · What it does · Status · Previews",
      table.includes("<thead><tr><th>Arc</th><th>What it does</th><th>Status</th><th>Previews</th></tr></thead>"));
    ok("a row is escaped HTML in the template's shape",
      table.includes(`<tr><td><strong>N10 &mdash; the release</strong><br><a class="sds-small" href="arcs/N10-the-release.md">arcs/N10-the-release.md</a></td>` +
        "<td>The plugins ship once.</td><td>HELD &middot; waits on Q7</td><td>&mdash;</td></tr>"), table);
    ok("an arc with no number still links its file",
      table.includes(`<strong>a legacy arc with no number</strong><br><a class="sds-small" href="arcs/arc-legacy.md">arcs/arc-legacy.md</a>`), table);
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
    const printed = await capture(["docs", "cycles", "042"], { SPN_WORKSPACE: TMP });
    ok("prints the table and exits 0", printed.code === 0 && printed.out.includes("<th>Arc</th>"), `code ${printed.code}`);
    ok("names the arc whose status the set does not know, on stderr", printed.err.includes("arc-legacy.md"), printed.err);

    const json = await capture(["docs", "cycles", folder, "--json"]);
    let rows = [];
    try { rows = JSON.parse(json.out); } catch { /* reported below */ }
    ok("--json prints one object per arc", json.code === 0 && rows.length === 6 && rows[0].arc === "N1 — the chapter", json.out.slice(0, 200));
    ok("--json names each arc's file and lists its previews", rows[0]?.file === "N1-the-chapter.md" && Array.isArray(rows[0]?.previews), json.out.slice(0, 200));

    const missing = await capture(["docs", "cycles", "999"], { SPN_WORKSPACE: TMP });
    ok("an unknown workstream exits 2 and says how to name one", missing.code === 2 && missing.err.includes("no workstream"), missing.err);

    const usage = await capture(["docs", "cycles"]);
    ok("no workstream named is a usage error", usage.code === 2 && usage.err.includes("usage"), usage.err);

    const empty = join(TMP, ".spndevex", WORKSTREAMS, "open", "043-empty");
    mkdirSync(join(empty, "arcs"), { recursive: true });
    const none = await capture(["docs", "cycles", empty]);
    ok("a workstream with no arcs exits 1", none.code === 1 && none.err.includes("has no arcs"), none.err);
  }

  console.log("\n=== docs cycles — a Previews row that links nothing is printed as a `!` line");
  {
    const home = join(TMP, ".spndevex", WORKSTREAMS, "open", "044-unlinked");
    mkdirSync(join(home, "arcs"), { recursive: true });
    const head = "# N999 — the layout\n\nStatus: **RUNNING — 2026-10-01.** It lays the page out.\n\n## Previews\n\n| File | Kind | State |\n| --- | --- | --- |\n";
    // KNOWN-BAD: the File cell names its file in backticks and links nothing.
    writeFileSync(join(home, "arcs", "N999-the-layout.md"), head + "| `notes/N999/previews/a-preview.html` | preview | proposed 2026-10-01 |\n");
    const bad = await capture(["docs", "cycles", home]);
    ok("[MKT.SCRIPTS.80] the unlinked row is named on stderr, with the link form",
      bad.code === 0 && bad.err.includes("! N999-the-layout.md") && bad.err.includes("[`a-preview.html`](../notes/N999/previews/a-preview.html)"), bad.err);
    // UNTOUCHED: the same row written as a markdown link.
    writeFileSync(join(home, "arcs", "N999-the-layout.md"), head + "| [`a-preview.html`](../notes/N999/previews/a-preview.html) | preview | proposed 2026-10-01 |\n");
    const good = await capture(["docs", "cycles", home]);
    ok("[MKT.SCRIPTS.80] a row written as a link prints no `!` line", good.code === 0 && good.err === "", good.err);
    ok("[MKT.SCRIPTS.80] the link form of a bare file name is written from arcs/",
      cyclesModule.previewLinkForm(join(home, "arcs", "N999-the-layout.md"), "a-preview.html") === "[`a-preview.html`](../notes/N999/previews/a-preview.html)");
  }

  console.log("\n=== docs cycles — the header's status follows the arcs");
  {
    const header = (word, glyph) => `<div class="sds-eyebrow"><span class="sds-line1">Workstream</span><span class="sds-state"><span class="sds-label">Status:</span> ` +
      `<span class="sds-badge sds-status sds-${word.toLowerCase()}">${glyph} ${word}</span></span></div>`;
    const arcAt = (status) => ({ id: "N1", name: "x", does: "", status, detail: "", file: "N1-x.md", previews: [] });
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

  console.log("\n=== docs cycles --write — the parts of a page that the arcs decide");
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
      mkdirSync(join(home, "arcs"), { recursive: true });
      writeFileSync(join(home, "arcs", "N1-the-chapter.md"), "# N1 — the chapter\n\nStatus: **RUNNING — 2026-10-01.** The chapter says where the model sits.\n");
      writeFileSync(join(home, "arcs", "N2-the-check.md"), "# N2 — the check\n\nStatus: **DECIDED — 2026-10-01.** A check reads the new shape.\n");
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
    const wrote = await capture(["docs", "cycles", "050-write", "--write"], { SPN_WORKSPACE: TMP });
    const after = readFileSync(page, "utf8");
    ok("[MKT.SCRIPTS.79] --write exits 0 and says which parts it wrote",
      wrote.code === 0 && /the header's status/.test(wrote.out) && /the Cycles table/.test(wrote.out) && /the heading of Open/.test(wrote.out), `${wrote.code} ${wrote.out} ${wrote.err}`);
    ok("[MKT.SCRIPTS.79] after it, the Cycles table is the arcs'", cyclesRule(page, after).length === 0, JSON.stringify(cyclesRule(page, after)));
    ok("[MKT.SCRIPTS.79] the header's status is written with its class, its glyph and its word",
      after.includes(`<span class="sds-badge sds-status sds-implementing">&#x1F6A7; IMPLEMENTING</span>`) && headerRule(page, after).length === 0);
    ok("[MKT.SCRIPTS.79] the heading of Open names each open card by its number",
      after.includes("<h2>Open &mdash; Q3</h2>") && openHeadingRule(page, after).length === 0);
    ok("[MKT.SCRIPTS.79] one table, one badge and one heading are replaced, each exactly once",
      count(after, "<table") === count(before, "<table") && count(after, "sds-badge sds-status") === 1 && count(after, "<h2") === count(before, "<h2") &&
      count(after, "<th>Arc</th>") === 1 && after.includes("a table that is not Cycles") && after.includes("<h2>Deferred &mdash; parked</h2>"));
    ok("[MKT.SCRIPTS.79] it adds no generated marker to the page", !after.includes("spn:generated"));
    const writtenAt = stamp(page);
    const again = await capture(["docs", "cycles", "050-write", "--write"], { SPN_WORKSPACE: TMP });
    ok("[MKT.SCRIPTS.79] a second --write changes no byte, and the file's time does not move",
      again.code === 0 && readFileSync(page, "utf8") === after && statSync(page).mtimeMs === writtenAt && /current/.test(again.out), again.out);

    // UNTOUCHED: a page that is already current, with its rows in the order a person chose.
    const current = after.replace(/(<tbody>\n)(\s*<tr>[^\n]*\n)(\s*<tr>[^\n]*\n)/, "$1$3$2");
    ok("the fixture really holds the same rows in another order", current !== after && cyclesRule(page, current).length === 0);
    writeFileSync(page, current);
    const currentAt = stamp(page);
    const untouched = await capture(["docs", "cycles", page, "--write"]);
    ok("[MKT.SCRIPTS.79] a page that is already current is not written",
      untouched.code === 0 && readFileSync(page, "utf8") === current && statSync(page).mtimeMs === currentAt, untouched.out);

    // With no card open the heading has one form.
    const quiet = build("open", "051-quiet", PAGE({ status: "IMPLEMENTING", glyph: "&#x1F6A7;", cyclesBody: CYCLES_H3 + OLD_TABLE, open: "Open &mdash; Q9 &middot; Q10" }));
    await capture(["docs", "cycles", quiet, "--write"]);
    ok("[MKT.SCRIPTS.79] with no card open the heading reads `Open — no card is open`",
      readFileSync(join(quiet, "approach.html"), "utf8").includes("<h2>Open &mdash; no card is open</h2>"));

    // The rows keep the order the page lists them in: N2 first here, and its stale status is what is written.
    const N2_FIRST = OLD_TABLE.replace("<tbody><tr>", `<tbody><tr><td><strong>N2 &mdash; the check</strong><br><a class="sds-small" href="arcs/N2-the-check.md">arcs/N2-the-check.md</a></td>` +
      `<td>A check reads the new shape.</td><td>PROPOSED</td><td>&mdash;</td></tr>\n  <tr>`);
    const ordered = build("open", "056-ordered", PAGE({ status: "IMPLEMENTING", glyph: "&#x1F6A7;", cyclesBody: CYCLES_H3 + N2_FIRST }));
    await capture(["docs", "cycles", ordered, "--write"]);
    const orderedText = readFileSync(join(ordered, "approach.html"), "utf8");
    ok("[MKT.SCRIPTS.79] the rows keep the order the page lists them in",
      cyclesRule(join(ordered, "approach.html"), orderedText).length === 0 && orderedText.indexOf("<strong>N2 &mdash;") < orderedText.indexOf("<strong>N1 &mdash;") &&
      orderedText.indexOf("<strong>N2 &mdash;") > 0, orderedText.slice(orderedText.indexOf("<tbody>"), orderedText.indexOf("</tbody>")));

    // UNTOUCHED: a page in closed/ keeps the table it closed with.
    const closed = build("closed", "052-closed", PAGE({ cyclesBody: CYCLES_H3 + OLD_TABLE }));
    const closedText = readFileSync(join(closed, "approach.html"), "utf8");
    const closedAt = stamp(join(closed, "approach.html"));
    const kept = await capture(["docs", "cycles", closed, "--write"]);
    ok("[MKT.SCRIPTS.79] a page in closed/ is not written",
      kept.code === 0 && readFileSync(join(closed, "approach.html"), "utf8") === closedText && statSync(join(closed, "approach.html")).mtimeMs === closedAt, `${kept.code} ${kept.out}`);

    // UNTOUCHED: a page with no h3 named Cycles is refused, and nothing is written.
    const shapeless = build("open", "053-shapeless", PAGE({ cyclesBody: `  <h3 id="h9">What re-aligns</h3>\n` + OLD_TABLE }));
    const shapelessText = readFileSync(join(shapeless, "approach.html"), "utf8");
    const refused = await capture(["docs", "cycles", shapeless, "--write"]);
    ok("[MKT.SCRIPTS.79] a page with no h3 named Cycles exits 1 with a message and no write",
      refused.code === 1 && /Cycles/.test(refused.err) && readFileSync(join(shapeless, "approach.html"), "utf8") === shapelessText, `${refused.code} ${refused.err}`);

    const pageless = build("open", "054-pageless", null);
    const noPage = await capture(["docs", "cycles", pageless, "--write"]);
    ok("[MKT.SCRIPTS.79] a workstream with no page exits 1", noPage.code === 1 && /no approach page/.test(noPage.err), `${noPage.code} ${noPage.err}`);

    // Without the option nothing is written, as before.
    const printed = build("open", "055-printed", PAGE({ cyclesBody: CYCLES_H3 + OLD_TABLE }));
    const printedText = readFileSync(join(printed, "approach.html"), "utf8");
    const plain = await capture(["docs", "cycles", printed]);
    ok("[MKT.SCRIPTS.79] with no option the command prints the table and writes no file",
      plain.code === 0 && plain.out.includes("<th>Arc</th>") && readFileSync(join(printed, "approach.html"), "utf8") === printedText);
  }

  console.log("\n=== docs cycles --write — a page that holds its own copy of the styles is refused");
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
      mkdirSync(join(home, "arcs"), { recursive: true });
      writeFileSync(join(home, "arcs", "N1-the-chapter.md"), "# N1 — the chapter\n\nStatus: **RUNNING — 2026-10-01.** The chapter says where the model sits.\n");
      writeFileSync(join(home, "approach.html"), OWN_PAGE);
      return home;
    };
    const own = place("open", "057-own-copy");
    const refused = await capture(["docs", "cycles", own, "--write"]);
    ok("[MKT.SCRIPTS.108] --write refuses a page that holds its own copy: exit 1, and the message says how to move it",
      refused.code === 1 && refused.err.includes(`approach.html: ${OWN_COPY}`) && refused.err.split(OWN_COPY).length - 1 === 1, `${refused.code} ${refused.err}`);
    ok("[MKT.SCRIPTS.108] and it writes nothing: the page keeps every byte", readFileSync(join(own, "approach.html"), "utf8") === OWN_PAGE);
    ok("[MKT.SCRIPTS.108] it names no part of the page, because it read no class of it",
      !/status badge|Cycles table to write|wrote/.test(refused.err + refused.out), refused.err + refused.out);
    const printed = await capture(["docs", "cycles", own]);
    ok("[MKT.SCRIPTS.108] with no option the table is still printed from the arcs, in the shared names",
      printed.code === 0 && printed.out.includes(`<div class="sds-scroll"><table>`) && printed.out.includes(`<a class="sds-small" href="arcs/N1-the-chapter.md">`), printed.out);
    // A page under `closed/` is never read, so it is neither refused nor written.
    const shut = place("closed", "058-own-copy-closed");
    const kept = await capture(["docs", "cycles", shut, "--write"]);
    ok("[MKT.SCRIPTS.108] a page under closed/ is not read: exit 0, no word about its styles, and no write",
      kept.code === 0 && !kept.err.includes(OWN_COPY) && readFileSync(join(shut, "approach.html"), "utf8") === OWN_PAGE, `${kept.code} ${kept.out} ${kept.err}`);
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — docs cycles` : `\n  all ${total} passed — docs cycles`);
process.exit(failed ? 1 : 0);
