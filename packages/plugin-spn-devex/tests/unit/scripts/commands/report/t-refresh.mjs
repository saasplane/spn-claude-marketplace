// `report refresh` — measures a `coverage` or a `tests` report again. `write` puts the numbers into
// its page, and `check` prints them beside the ones the page holds. Every case builds a repository
// and a page in a temporary folder, runs the real command through `cli.ts`, and reads the page back
// from disk: the numbers it must write, the sentences it must leave, and the pages it must refuse.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const kept = [];
process.on("exit", () => { for (const dir of kept) rmSync(dir, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 700)}` : ""}`);
};

const repo = (files) => {
  const root = join(mkdtempSync(join(tmpdir(), "refresh-")), "spn-sample-ts");
  kept.push(dirname(root));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  return root;
};

// Pinned, so a stamped instant reads the same on any machine: the page writes it in the local zone.
const ENV = { ...process.env, TZ: "Asia/Kolkata", SPN_TELEMETRY: "off" };
/** One run of a command through the entry, with its exit code and what it printed. */
const command = (...args) => {
  try { return { code: 0, out: execFileSync(process.execPath, [TOOL, ...args], { encoding: "utf8", env: ENV, stdio: "pipe" }) }; }
  catch (error) { return { code: error.status ?? 1, out: String(error.stdout ?? "") + String(error.stderr ?? "") }; }
};
const refresh = (page) => command("report", "refresh", "write", page);
const checked = (page) => command("report", "refresh", "check", page);

// ---------------------------------------------------------------------------- the repository

const APPS = { "sprepo.json": '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}' };
const node = (dir, kind) => ({
  [`${dir}/package.json`]: `{"name":"${dir.split("/").pop()}"}`,
  [`${dir}/spkind.json`]: `{"kind":"${kind}","config":{"mtype":"${kind}"}}`,
});
const HEAD = ["| Id | Who | Does | Sees | Type | Tier | Status | Updated at |", "| --- | --- | --- | --- | --- | --- | --- | --- |"];
const rowsAt = (path, ...rows) => ({
  [`docs/${SEAT.behaviors}/${path}`]: [...HEAD,
    ...rows.map(([id, tier, status, at = "—"]) => `| ${id} | a person | acts | a result | POSITIVE | ${tier} | ${status} | ${at} |`), ""].join("\n"),
});
const chapter = (domain, pkg, name, path) => ({
  [`docs/${SEAT.constructs}/${domain}/${name}.md`]: `# ${name}\n`,
  [`docs/${SEAT.capabilities}/${domain}/${pkg}/${name}.md`]: [
    `# ${name} in ${pkg}`, "", "## Where", "", "| Part | Lives in | What it is |", "| --- | --- | --- |", `| a part | \`${path}\` | what it is |`, ""].join("\n"),
});
/** A repository of one package and one app: three behaviours in the domain `01-core`, and one about the whole repository. */
const sample = (stamp = "2026-09-28T02:00:00Z · full-1") => ({
  ...APPS, ...node("packages/store", "MODULE_SERVER"), ...node("apps/web", "APP_WEB"),
  "packages/store/src/app/services/StoreService.ts": "export const value = 1;\n",
  [`docs/${SEAT.behaviors}/01-core/README.md`]: "# Behaviors — Core\n",
  ...rowsAt("01-core/01-store.md", ["COR.STORE.01", "UNIT", "SUCCESS", stamp], ["COR.STORE.02", "UNIT", "PLANNED"], ["COR.STORE.03", "JOURNEY", "FAILED", stamp]),
  ...chapter("01-core", "store", "01-store", "src/app/services/StoreService.ts"),
  ...rowsAt("README.md", ["COR.REPO.01", "UNIT", "PENDING", stamp]),
});

// ---------------------------------------------------------------------------- the page

const OLD_DIGEST = "sha256:0000000000000000";
const VERDICT = '<p class="sds-verdict">Tests prove 9 of 9 behaviours. Nothing needs your decision.</p>';
const tile = (label, count, of, bar = "") => of === null
  ? `    <div class="sds-side"><span class="sds-label">${label}</span><span class="sds-big">${count}</span></div>`
  : `    <div class="sds-side"><span class="sds-label">${label}</span><div class="sds-side-numbers"><span class="sds-big">${count}<span class="sds-total"> / ${of}</span></span><span class="sds-percent">100%</span></div><div class="sds-bar"><i${bar} style="width:100%"></i></div></div>`;
const cells = (values, marks = {}) => values.map((value, at) => `<td class="sds-number-cell${marks[at] ? ` ${marks[at]}` : ""}">${value}</td>`).join("");
const table = (id, heading, columns, rows) => [
  `  <h3 id="${id}">${heading}</h3>`,
  `  <div class="sds-scroll"><table class="sds-grid" style="min-width:34rem"><colgroup><col>${columns.map(() => '<col style="width:5.5rem">').join("")}</colgroup>`,
  `    <thead><tr><th>Name</th>${columns.map((column) => `<th class="sds-number-cell">${column}</th>`).join("")}</tr></thead>`,
  "    <tbody>",
  ...rows.map(([name, second, values, kind = "", marks = {}]) =>
    `      <tr${kind}><td>${kind ? name : `<strong>${name}</strong>`}${second ? `<span class="sds-sub-line">${second}</span>` : ""}</td>${cells(values, marks)}</tr>`),
  "    </tbody>",
  "  </table></div>",
].join("\n");
const TOTAL = ' class="sds-total"';
const STYLES = linesFor("1.0.0");

/** A report page in the template's own markup, which links the shared stylesheet, every number on it stale. */
const page = (block, { tiles, legend, tables, measured = `<p>The digest was <code>${OLD_DIGEST}</code>. A different digest means this page is out of date.</p>` }) => [
  "<!doctype html>", '<meta charset="utf-8">', `<!-- spn:doc`, JSON.stringify(block), "-->", "<title>report</title>", STYLES.stylesheet,
  '<header class="sds-masthead">',
  `  <div class="sds-eyebrow"><span class="sds-line1">SaaS Plane &nbsp;|&nbsp; Sample &nbsp;|&nbsp; ${block.title}</span><span class="sds-line"><span class="sds-label">Repo:</span> <span class="sds-badge sds-when">spn-sample-ts</span><span class="sds-separator">|</span><span class="sds-label">Commit:</span> <span class="sds-badge sds-when">abc1234</span><span class="sds-separator">|</span><span class="sds-label">Generated:</span> <span class="sds-badge sds-when"><time class="sds-local" datetime="${block.generatedAt}">${block.generatedAt}</time></span></span></div>`,
  `  <h1>${block.title}</h1>`, "</header>",
  '<section id="s0" data-block="reasons">', '  <div class="sds-section-head"><h2>Summary</h2></div>', `  ${VERDICT}`,
  '  <div class="sds-sides">', ...tiles, "  </div>",
  '  <div class="sds-breakdown">', '    <p class="sds-breakdown-title">The 9 behaviours, by state</p>',
  `    <div class="sds-breakdown-bar" role="img" aria-label="${legend.map(([, label]) => `${label} 9`).join(", ")}">`,
  ...legend.map(([key, label]) => `      <span class="sds-breakdown-segment ${key}" style="flex-grow:9" title="${label}: 9 behaviours"></span>`),
  "    </div>", '    <ul class="sds-breakdown-legend">',
  ...legend.map(([key, label]) => `      <li><i class="sds-breakdown-key ${key}"></i>${label} <b>9</b></li>`),
  "    </ul>", "  </div>",
  '  <h3 id="top-gaps">Top gaps</h3>', '  <ol class="sds-top-gaps"><li><strong>9 behaviours are PLANNED.</strong></li></ol>', "</section>",
  '<section id="s1" data-block="must">', '  <div class="sds-section-head"><h2>Findings</h2></div>', ...tables, "</section>",
  '<section id="s3" data-block="reasons">', '  <div class="sds-section-head"><h2>Measured</h2></div>', '  <h3 id="measure-again">Measure again</h3>', `  ${measured}`, "</section>",
  `<footer>Written at digest <code>${OLD_DIGEST}</code></footer>`, STYLES.script, "",
].join("\n");

const TESTS_COLUMNS = ["Written", "Built", "SUCCESS", "FAILED", "PENDING", "PLANNED"];
const nine = (count) => Array.from({ length: count }, () => 9);
const testsPage = (overrides = {}, tables = null) => page(
  { id: "spn-sample-ts-tests-report", variant: "report", repository: "spn-sample-ts", reportType: "TESTS", title: "Tests report", lenses: ["QA"],
    generatedAt: "2026-09-01T09:00+05:30", measuredAt: "2026-08-31T08:00+05:30", summary: "What the tests prove.", keywords: ["report"], ...overrides },
  { tiles: [tile("SUCCESS", 9, 9, ' class="sds-success"'), tile("FAILED", 9, 9, ' class="sds-error"'), tile("PENDING", 9, 9, ' class="sds-warning"'), tile("PLANNED", 9, 9, ' class="sds-warning"')],
    legend: [["sds-result-success", "SUCCESS"], ["sds-result-error", "FAILED"], ["sds-result-warning", "PENDING"], ["sds-result-none", "PLANNED"]],
    measured: `<p>The rows were stamped at 2026-08-31T08:00+05:30. The digest was <code>${OLD_DIGEST}</code>.</p>`,
    tables: tables ?? [
      table("by-tier", "By tier", ["Runs", ...TESTS_COLUMNS], [
        ["Journey", "a whole journey", nine(7)], ["Unit", "one piece of code", nine(7), "", { 2: "sds-success" }], ["Component", "one screen part", nine(7)],
        ["All tiers", "", nine(7), TOTAL]]),
      table("repo", "Repository", TESTS_COLUMNS, [
        ["Core", "<code>01-core/</code>", nine(6)], ["Behaviours about the whole repository", `<code>docs/${SEAT.behaviors}/README.md</code>`, nine(6)],
        ["spn-sample-ts", "", nine(6), TOTAL]]),
      table("apps", "Apps", TESTS_COLUMNS, [["web", "APP_WEB - journey", nine(6)], ["All 1 apps", "", nine(6), TOTAL]]),
      table("packages", "Packages", TESTS_COLUMNS, [["store", "MODULE_SERVER - unit", nine(6)], ["All 1 packages", "", nine(6), TOTAL]]),
    ] });

const COVERAGE_COLUMNS = ["Written", "Built", "Proved", "Not written", "Not built", "Not proved"];
const coveragePage = () => page(
  { id: "spn-sample-ts-coverage-report", variant: "report", repository: "spn-sample-ts", reportType: "COVERAGE", title: "Coverage report", lenses: ["LEAD"],
    generatedAt: "2026-09-01T09:00+05:30", summary: "What is written, built and proved.", keywords: ["report"] },
  { tiles: [tile("Written", 9, null), tile("Built", 9, 9, ' class="sds-success"'), tile("Proved", 9, 9, ' class="sds-success"'), tile("Not written", 9, null)],
    legend: [["sds-result-success", "Proved"], ["sds-result-warning", "Not proved"]],
    tables: [
      table("repo", "Repository", COVERAGE_COLUMNS, [
        ["Core", "<code>01-core/</code>", [9, 9, 9, "&mdash;", 9, 9]],
        ["Behaviours about the whole repository", `<code>docs/${SEAT.behaviors}/README.md</code>`, [9, 9, 9, "&mdash;", 9, 9]],
        ["spn-sample-ts", "", [9, 9, 9, 9, 9, 9], TOTAL]]),
      table("apps", "Apps", COVERAGE_COLUMNS, [["web", "APP_WEB", nine(6)], ["All 1 apps", "", nine(6), TOTAL]]),
      table("packages", "Packages", COVERAGE_COLUMNS, [["store", "MODULE_SERVER", nine(6)], ["All 1 packages", "", nine(6), TOTAL]]),
    ] });

const reportAt = (root, name) => join(root, "docs", POCKET.artifacts, "reports", name);
const placed = (root, name, text) => {
  mkdirSync(dirname(reportAt(root, name)), { recursive: true });
  writeFileSync(reportAt(root, name), text, "utf8");
  return reportAt(root, name);
};
const blockOf = (text) => JSON.parse(text.match(/<!--\s*spn:doc\s*([\s\S]*?)-->/)[1]);
/** The count cells of one table row, found by the row's name. */
const rowOf = (text, heading, name) => {
  const from = text.indexOf(`>${heading}</h3>`);
  const tableText = text.slice(from, text.indexOf("</table>", from));
  const row = tableText.split("\n").find((line) => line.includes(`>${name}<`)) ?? "";
  return [...row.matchAll(/<td class="(sds-number-cell[^"]*)">([^<]*)<\/td>/g)].map((cell) => (cell[1] === "sds-number-cell" ? cell[2] : `${cell[2]}:${cell[1].slice("sds-number-cell ".length)}`)).join(" ");
};
const tileOf = (text, label) => (text.split("\n").find((line) => line.includes(`<span class="sds-label">${label}</span>`)) ?? "")
  .replace(/<[^>]+>/g, (tag) => (/width|class="sds-(success|warning|error)"/.test(tag) ? tag : " ")).replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------- a tests report

console.log("=== report refresh — a tests report");
{
  const root = repo(sample());
  const path = placed(root, "tests-report.html", testsPage());
  const measured = JSON.parse(command("behaviours", "coverage", "show", root, "--json").out);

  // `check` first, on the stale page: it prints what a write would put there, and leaves every byte.
  const stale = readFileSync(path, "utf8");
  const looked = checked(path);
  ok("[MKT.SCRIPTS.169] `check` exits 0 and says the page would be written, not that it was", looked.code === 0 && /^would write /.test(looked.out) && !/^wrote /m.test(looked.out), looked.out);
  ok("[MKT.SCRIPTS.169] `check` prints each number it would write, with the number the page holds",
    looked.out.includes("  tile SUCCESS: 1 / 4 — the page holds 9 / 9\n") && looked.out.includes("  breakdown FAILED: 1 — the page holds 9\n")
      && looked.out.includes("  By tier · Unit · Written: 3 — the page holds 9\n") && looked.out.includes("  Repository · spn-sample-ts · PLANNED: 1 — the page holds 9\n"), looked.out);
  ok("[MKT.SCRIPTS.169] and the digest and the measured moment it would write, each beside the page's own",
    looked.out.includes(`  digest: ${measured.digest} — the page holds ${OLD_DIGEST}\n`) && looked.out.includes("  measuredAt: 2026-09-28T07:30+05:30 — the page holds 2026-08-31T08:00+05:30\n"), looked.out);
  ok("[MKT.SCRIPTS.169] `check` writes nothing: the page keeps every byte", readFileSync(path, "utf8") === stale);

  const ran = refresh(path);
  const text = readFileSync(path, "utf8");
  ok("[MKT.SCRIPTS.81] the command exits 0 and says what it wrote", ran.code === 0 && /wrote/.test(ran.out) && ran.out.includes(measured.digest), ran.out);
  ok("[MKT.SCRIPTS.81] each tile carries its measured count, its total, its share and its bar",
    tileOf(text, "SUCCESS") === "SUCCESS 1 / 4 25% <i style=\"width:25.0%\">" && tileOf(text, "FAILED") === "FAILED 1 / 4 25% <i class=\"sds-error\" style=\"width:25.0%\">"
      && tileOf(text, "PLANNED") === "PLANNED 1 / 4 25% <i class=\"sds-warning\" style=\"width:25.0%\">", [tileOf(text, "SUCCESS"), tileOf(text, "FAILED"), tileOf(text, "PLANNED")].join(" · "));
  ok("[MKT.SCRIPTS.81] the legend carries each state's count",
    ["SUCCESS", "FAILED", "PENDING", "PLANNED"].every((label) => new RegExp(`</i>${label} <b>1</b>`).test(text)), text.match(/<ul class="sds-breakdown-legend">[\s\S]*?<\/ul>/)?.[0]);
  ok("[MKT.SCRIPTS.81] the bar holds one segment for each state above 0, as wide as its count, and its label says each count",
    (text.match(/<span class="sds-breakdown-segment /g) ?? []).length === 4 && text.includes('<span class="sds-breakdown-segment sds-result-error" style="flex-grow:1" title="FAILED: 1 behaviour"></span>')
      && text.includes('aria-label="SUCCESS 1, FAILED 1, PENDING 1, PLANNED 1"'), text.match(/<div class="sds-breakdown-bar"[\s\S]*?<\/div>/)?.[0]);
  ok("[MKT.SCRIPTS.81] By tier: each tier's row holds its runs and its counts, a gap cell is marked, and a tier nobody names reads 0",
    rowOf(text, "By tier", "Unit") === "1 3 2 1 0 1:sds-warning 1:sds-warning" && rowOf(text, "By tier", "Journey") === "1 1 1 0 1:sds-error 0 0"
      && rowOf(text, "By tier", "Component") === "0 0 0 0 0 0 0" && rowOf(text, "By tier", "All tiers") === "1 4 3 1 1:sds-error 1:sds-warning 1:sds-warning",
    ["Unit", "Journey", "Component", "All tiers"].map((name) => rowOf(text, "By tier", name)).join(" | "));
  ok("[MKT.SCRIPTS.81] Repository: a domain is found by its folder, and the whole-repository row by its file",
    rowOf(text, "Repository", "Core") === "3 3 1 1:sds-error 0 1:sds-warning" && rowOf(text, "Repository", "Behaviours about the whole repository") === "1 0 0 0 1:sds-warning 0"
      && rowOf(text, "Repository", "spn-sample-ts") === "4 3 1 1:sds-error 1:sds-warning 1:sds-warning",
    ["Core", "Behaviours about the whole repository", "spn-sample-ts"].map((name) => rowOf(text, "Repository", name)).join(" | "));
  ok("[MKT.SCRIPTS.81] Apps and Packages: a project counts the behaviours of the design topics it has a chapter for",
    rowOf(text, "Packages", "store") === "3 3 1 1:sds-error 0 1:sds-warning" && rowOf(text, "Packages", "All 1 packages") === "3 3 1 1:sds-error 0 1:sds-warning"
      && rowOf(text, "Apps", "web") === "0 0 0 0 0 0", [rowOf(text, "Packages", "store"), rowOf(text, "Packages", "All 1 packages"), rowOf(text, "Apps", "web")].join(" | "));
  ok("[MKT.SCRIPTS.81] the digest is written wherever the page named the old one",
    !text.includes(OLD_DIGEST) && (text.split(measured.digest).length - 1) === 2, `${text.split(measured.digest).length - 1} occurrence(s)`);
  const block = blockOf(text);
  ok("[MKT.SCRIPTS.81] the block's `generatedAt` is stamped, and the header's Generated time carries the same moment",
    block.generatedAt !== "2026-09-01T09:00+05:30" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\+05:30$/.test(block.generatedAt)
      && text.includes(`<time class="sds-local" datetime="${block.generatedAt}">${block.generatedAt}</time>`), block.generatedAt);
  ok("[MKT.SCRIPTS.81] a tests report's `measuredAt` is the newest `Updated at` the rows carry, in the block and in Measured",
    block.measuredAt === "2026-09-28T07:30+05:30" && text.includes("The rows were stamped at 2026-09-28T07:30+05:30."), block.measuredAt);
  ok("[MKT.SCRIPTS.81] the command writes numbers and never a sentence: the verdict and Top gaps are as they were",
    text.includes(VERDICT) && text.includes("<strong>9 behaviours are PLANNED.</strong>") && text.includes('<p class="sds-breakdown-title">The 9 behaviours, by state</p>'));
  ok("[MKT.SCRIPTS.81] and it names what it left to the agent", /verdict/i.test(ran.out) && /Commit/.test(ran.out), ran.out);

  const before = statSync(path).mtimeMs;
  const again = refresh(path);
  ok("[MKT.SCRIPTS.81] a page whose digest already matches is left as it is, and the command says so",
    again.code === 0 && /current/.test(again.out) && readFileSync(path, "utf8") === text && statSync(path).mtimeMs === before, again.out);
  const settled = checked(path);
  ok("[MKT.SCRIPTS.169] after the write a `check` reads the page as current, and prints no number", settled.code === 0 && /^current /.test(settled.out) && !settled.out.includes("the page holds"), settled.out);
}

console.log("\n=== report refresh — a tests report where no run is stamped");
{
  const root = repo({ ...APPS, ...node("packages/store", "MODULE_SERVER"), ...rowsAt("01-core/01-store.md", ["COR.STORE.01", "UNIT", "PLANNED"]) });
  const path = placed(root, "tests-report.html", testsPage());
  const ran = refresh(path);
  const block = blockOf(readFileSync(path, "utf8"));
  ok("[MKT.SCRIPTS.82] where no row cites a run the block leaves `measuredAt` out, and never writes `null`",
    ran.code === 0 && !("measuredAt" in block) && block.generatedAt !== "2026-09-01T09:00+05:30", JSON.stringify(block));
  ok("[MKT.SCRIPTS.82] and the command says that Measured still names a moment no run stamped", /no run is stamped/.test(ran.out), ran.out);
  const audit = command("docs", "audit", "check", path).out;
  ok("[MKT.SCRIPTS.82] `docs audit check` reads that page, and draws no `measuredAt` finding on it", /over 1 page|clean — 1 page/.test(audit) && !/measuredAt/.test(audit), audit);
  // KNOWN-BAD, so the audit is the reason no finding is drawn: the same page with the key written as `null` draws one.
  const nulled = placed(root, "tests-report-null.html", readFileSync(path, "utf8").replace(/("generatedAt":"[^"]*")/, '$1,"measuredAt":null'));
  const refusedKey = command("docs", "audit", "check", nulled).out;
  ok("[MKT.SCRIPTS.82] known-bad: the same page with `measuredAt` written as `null` draws the finding", /measuredAt/.test(refusedKey), refusedKey);
}

// ---------------------------------------------------------------------------- a coverage report

console.log("\n=== report refresh — a coverage report");
{
  const root = repo(sample());
  const path = placed(root, "coverage-report.html", coveragePage());
  const measured = JSON.parse(command("coverage", "measure", root, "--json").out);
  const looked = checked(path);
  ok("[MKT.SCRIPTS.169] `check` of a coverage report prints its numbers and no `measuredAt`, which that report does not carry",
    looked.code === 0 && looked.out.includes("  tile Written: 4 — the page holds 9\n") && looked.out.includes("  Packages · store · Not proved: 2 — the page holds 9\n")
      && !looked.out.includes("measuredAt") && readFileSync(path, "utf8").includes(OLD_DIGEST), looked.out);
  const ran = refresh(path);
  const text = readFileSync(path, "utf8");
  ok("[MKT.SCRIPTS.81] a coverage report is refreshed from `coverage measure`", ran.code === 0 && text.includes(measured.digest) && !text.includes(OLD_DIGEST), ran.out);
  ok("[MKT.SCRIPTS.81] a count tile holds its number alone, and a share tile is green only at the whole",
    tileOf(text, "Written") === "Written 4" && tileOf(text, "Built") === "Built 3 / 4 75% <i style=\"width:75.0%\">"
      && tileOf(text, "Proved") === "Proved 1 / 4 25% <i style=\"width:25.0%\">" && tileOf(text, "Not written") === "Not written 0",
    ["Written", "Built", "Proved", "Not written"].map((label) => tileOf(text, label)).join(" · "));
  ok("[MKT.SCRIPTS.81] the breakdown is proved and not proved", text.includes("</i>Proved <b>1</b>") && text.includes("</i>Not proved <b>3</b>")
    && text.includes('aria-label="Proved 1, Not proved 3"'), text.match(/<ul class="sds-breakdown-legend">[\s\S]*?<\/ul>/)?.[0]);
  ok("[MKT.SCRIPTS.81] Repository: a cell that holds a dash stays a dash, and the gaps are Written less Built and less Proved",
    rowOf(text, "Repository", "Core") === "3 3 1 &mdash; 0 2:sds-warning" && rowOf(text, "Repository", "Behaviours about the whole repository") === "1 0 0 &mdash; 1:sds-warning 1:sds-warning"
      && rowOf(text, "Repository", "spn-sample-ts") === "4 3 1 0 1:sds-warning 3:sds-warning",
    ["Core", "Behaviours about the whole repository", "spn-sample-ts"].map((name) => rowOf(text, "Repository", name)).join(" | "));
  ok("[MKT.SCRIPTS.81] Packages and Apps hold each project's counts", rowOf(text, "Packages", "store") === "3 3 1 0 0 2:sds-warning" && rowOf(text, "Apps", "web") === "0 0 0 0 0 0",
    [rowOf(text, "Packages", "store"), rowOf(text, "Apps", "web")].join(" | "));
  ok("[MKT.SCRIPTS.81] a coverage report's block carries no `measuredAt`", !("measuredAt" in blockOf(text)), JSON.stringify(blockOf(text)));
}

// ---------------------------------------------------------------------------- what it could not place

console.log("\n=== report refresh — a row it cannot place is printed, never guessed");
{
  const root = repo({ ...sample(), ...node("packages/shelf", "MODULE_SERVER") });
  const tables = [
    table("by-tier", "By tier", ["Runs", ...TESTS_COLUMNS], [["Unit", "one piece of code", nine(7)], ["All tiers", "", nine(7), TOTAL]]),
    table("repo", "Repository", TESTS_COLUMNS, [["Core", "<code>01-core/</code>", nine(6)], ["spn-sample-ts", "", nine(6), TOTAL]]),
    table("packages", "Packages", TESTS_COLUMNS, [["store", "MODULE_SERVER - unit", nine(6)], ["retired-ts", "MODULE_SERVER - unit", nine(6)], ["All 2 packages", "", nine(6), TOTAL]]),
  ];
  const path = placed(root, "tests-report.html", testsPage({}, tables));
  const ran = refresh(path);
  const text = readFileSync(path, "utf8");
  ok("[MKT.SCRIPTS.81] a project the page has no row for is printed with its counts", /! Packages: the page has no row for `shelf`/.test(ran.out), ran.out);
  ok("[MKT.SCRIPTS.81] a row the measurement does not return is printed, and its cells are left as they were",
    /! Packages: the row `retired-ts` is on the page, and the measurement returns no such row/.test(ran.out) && rowOf(text, "Packages", "retired-ts") === "9 9 9 9 9 9", ran.out);
  ok("[MKT.SCRIPTS.81] a table the page does not carry is printed by its heading", /! the page has no `Apps` table/.test(ran.out), ran.out);
  ok("[MKT.SCRIPTS.81] a tier and the whole-repository row the page leaves out are printed too",
    /! By tier: the page has no row for `Journey`/.test(ran.out) && /! Repository: the page has no row for the behaviours about the whole repository/.test(ran.out), ran.out);
  ok("[MKT.SCRIPTS.81] the rows it could place are still written", rowOf(text, "Packages", "store") === "3 3 1 1:sds-error 0 1:sds-warning" && ran.code === 0, rowOf(text, "Packages", "store"));

  // A repository with no app, and a page that carries no Apps table: nothing is missing.
  const noApps = repo({ ...APPS, ...node("packages/store", "MODULE_SERVER"), ...rowsAt("01-core/01-store.md", ["COR.STORE.01", "UNIT", "PLANNED"]) });
  const lean = refresh(placed(noApps, "tests-report.html", testsPage({}, tables.filter((one) => !one.includes('id="apps"')))));
  ok("[MKT.SCRIPTS.81] a table the page leaves out is not printed where the measurement has no row for it",
    lean.code === 0 && !/Apps/.test(lean.out), lean.out);
}

// ---------------------------------------------------------------------------- refused

console.log("\n=== report refresh — refused by name, and nothing written");
{
  const root = repo(sample());
  for (const [type, name] of [["AUDIT", "audit"], ["CODE", "code"], ["DOCS", "docs"]]) {
    const text = testsPage({ reportType: type, id: `spn-sample-ts-${name}-report` });
    const path = placed(root, `${name}-report.html`, text);
    const ran = refresh(path);
    ok(`[MKT.SCRIPTS.81] known-bad: ${name === "audit" ? "an" : "a"} \`${name}\` report is refused by name, and its page is left as it was`,
      ran.code === 1 && ran.out.includes(`\`${name}\` report`) && /several commands and a reading/.test(ran.out) && readFileSync(path, "utf8") === text, ran.out);
  }
  const other = testsPage({ repository: "spn-another-ts" });
  const elsewhere = placed(root, "tests-report.html", other);
  const wrong = refresh(elsewhere);
  ok("[MKT.SCRIPTS.81] known-bad: a page whose block names another repository is refused",
    wrong.code === 1 && /spn-another-ts/.test(wrong.out) && readFileSync(elsewhere, "utf8") === other, wrong.out);
  const noDigest = placed(root, "tests-report.html", testsPage().split(OLD_DIGEST).join("no digest here"));
  const undated = refresh(noDigest);
  ok("[MKT.SCRIPTS.81] known-bad: a page whose Measured section names no digest is refused, because the digest has nowhere to go",
    undated.code === 1 && /digest/.test(undated.out) && readFileSync(noDigest, "utf8").includes("no digest here"), undated.out);
  const plain = placed(root, "notes.html", "<h1>No block</h1>\n");
  ok("[MKT.SCRIPTS.81] known-bad: a file that is not a report page is refused", refresh(plain).code === 1, refresh(plain).out);
  const USAGE = "usage: spn-devex report refresh check <page>\n       spn-devex report refresh write <page>\n";
  ok("[MKT.SCRIPTS.111] with no action the entry prints each usage line, says an action is owed, and exits 2",
    command("report", "refresh").code === 2 && command("report", "refresh").out === USAGE + "`report refresh` needs an action.\n", command("report", "refresh").out);
  const stalePath = placed(root, "tests-report.html", testsPage());
  const before = readFileSync(stalePath, "utf8");
  const bare = command("report", "refresh", stalePath);
  ok("[MKT.SCRIPTS.111] a page where the action belongs is refused with exit 2, and the page keeps every byte",
    bare.code === 2 && bare.out === USAGE + "`report refresh` needs an action.\n" && readFileSync(stalePath, "utf8") === before, bare.out);
  for (const action of ["check", "write"]) {
    const none = command("report", "refresh", action);
    ok(`[MKT.SCRIPTS.112] \`${action}\` with no page prints its usage line and says a path is owed, with exit 2`,
      none.code === 2 && none.out === `usage: spn-devex report refresh ${action} <page>\n\`report refresh ${action}\` needs a path.\n`, none.out);
    const option = command("report", "refresh", action, stalePath, "--json");
    ok(`[MKT.SCRIPTS.174] \`${action}\` refuses an option it does not take, with exit 2`, option.code === 2 && option.out.includes("does not take `--json`."), option.out);
    ok(`\`${action}\` refuses a second page with exit 2`, command("report", "refresh", action, stalePath, stalePath).code === 2);
  }
  ok("and no refused run wrote", readFileSync(stalePath, "utf8") === before);
  const refusedCheck = checked(plain);
  ok("[MKT.SCRIPTS.169] known-bad: `check` refuses a file that is not a report page the way `write` does, with exit 1", refusedCheck.code === 1 && /not a report page/.test(refusedCheck.out), refusedCheck.out);
  // KNOWN-BAD: a report page that links no shared stylesheet. Its tiles, its bar and its cells use the
  // class names of its own copy, and the digest it names is stale, so a refresh would have work to do.
  const ownCopy = testsPage().split(STYLES.stylesheet).join("<style>.side{border:1px solid} .num-cell{text-align:right}</style>")
    .split(STYLES.script).join("").replace(/class="sds-/g, 'class="').replace(/ sds-/g, " ");
  const unmoved = placed(root, "tests-report.html", ownCopy);
  const kept = refresh(unmoved);
  ok("[MKT.SCRIPTS.108] known-bad: a page that holds its own copy of the styles is refused, and the message says how to move it",
    kept.code === 1 && kept.out.includes(OWN_COPY) && kept.out.split(OWN_COPY).length - 1 === 1 && !/wrote/.test(kept.out), kept.out);
  ok("[MKT.SCRIPTS.108] and nothing is written: the page keeps every byte, its stale digest included",
    readFileSync(unmoved, "utf8") === ownCopy && ownCopy.includes(OLD_DIGEST) && !ownCopy.includes("sds-"));
  const foundation = repo({ "sprepo.json": '{"type":"FOUNDATION","config":{"mtype":"FOUNDATION"}}' });
  const none = placed(foundation, "tests-report.html", testsPage());
  ok("[MKT.SCRIPTS.81] known-bad: a foundation repository owes no report, so there is nothing to refresh", refresh(none).code === 1 && /FOUNDATION/.test(refresh(none).out), refresh(none).out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — report refresh` : `\n  all ${total} passed — report refresh`);
process.exit(failed ? 1 : 0);
