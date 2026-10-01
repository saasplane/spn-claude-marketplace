// `report refresh` — measures a `coverage` or a `tests` report again and writes the numbers into its
// page. Every case builds a repository and a page in a temporary folder, runs the real command
// through `cli.ts`, and reads the page back from disk: the numbers it must write, the sentences it
// must leave, and the pages it must refuse.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

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
const refresh = (page) => command("report", "refresh", page);

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
const VERDICT = '<p class="verdict">Tests prove 9 of 9 behaviours. Nothing needs your decision.</p>';
const tile = (label, count, of, bar = "") => of === null
  ? `    <div class="side"><span class="lbl">${label}</span><span class="big">${count}</span></div>`
  : `    <div class="side"><span class="lbl">${label}</span><div class="side-num"><span class="big">${count}<span class="tot"> / ${of}</span></span><span class="pct">100%</span></div><div class="bar"><i${bar} style="width:100%"></i></div></div>`;
const cells = (values, marks = {}) => values.map((value, at) => `<td class="num-cell${marks[at] ? ` ${marks[at]}` : ""}">${value}</td>`).join("");
const table = (id, heading, columns, rows) => [
  `  <h3 id="${id}">${heading}</h3>`,
  `  <div class="scroll"><table class="grid" style="min-width:34rem"><colgroup><col>${columns.map(() => '<col style="width:5.5rem">').join("")}</colgroup>`,
  `    <thead><tr><th>Name</th>${columns.map((column) => `<th class="num-cell">${column}</th>`).join("")}</tr></thead>`,
  "    <tbody>",
  ...rows.map(([name, second, values, kind = "", marks = {}]) =>
    `      <tr${kind}><td>${kind ? name : `<strong>${name}</strong>`}${second ? `<span class="sl">${second}</span>` : ""}</td>${cells(values, marks)}</tr>`),
  "    </tbody>",
  "  </table></div>",
].join("\n");
const TOTAL = ' class="total"';

/** A report page in the template's own markup, every number on it stale. */
const page = (block, { tiles, legend, tables, measured = `<p>The digest was <code>${OLD_DIGEST}</code>. A different digest means this page is out of date.</p>` }) => [
  "<!doctype html>", '<meta charset="utf-8">', `<!-- spn:doc`, JSON.stringify(block), "-->", "<title>report</title>",
  '<header class="masthead">',
  `  <div class="eyebrow"><span class="line1">SaaS Plane &nbsp;|&nbsp; Sample &nbsp;|&nbsp; ${block.title}</span><span class="line"><span class="lbl">Repo:</span> <span class="badge when">spn-sample-ts</span><span class="sep">|</span><span class="lbl">Commit:</span> <span class="badge when">abc1234</span><span class="sep">|</span><span class="lbl">Generated:</span> <span class="badge when"><time class="local" datetime="${block.generatedAt}">${block.generatedAt}</time></span></span></div>`,
  `  <h1>${block.title}</h1>`, "</header>",
  '<section id="s0" data-block="reasons">', '  <div class="sec-head"><h2>Summary</h2></div>', `  ${VERDICT}`,
  '  <div class="sides">', ...tiles, "  </div>",
  '  <div class="breakdown">', '    <p class="bd-title">The 9 behaviours, by state</p>',
  `    <div class="bd-bar" role="img" aria-label="${legend.map(([, label]) => `${label} 9`).join(", ")}">`,
  ...legend.map(([key, label]) => `      <span class="bd-seg ${key}" style="flex-grow:9" title="${label}: 9 behaviours"></span>`),
  "    </div>", '    <ul class="bd-legend">',
  ...legend.map(([key, label]) => `      <li><i class="bd-key ${key}"></i>${label} <b>9</b></li>`),
  "    </ul>", "  </div>",
  '  <h3 id="top-gaps">Top gaps</h3>', '  <ol class="top-gaps"><li><strong>9 behaviours are PLANNED.</strong></li></ol>', "</section>",
  '<section id="s1" data-block="must">', '  <div class="sec-head"><h2>Findings</h2></div>', ...tables, "</section>",
  '<section id="s3" data-block="reasons">', '  <div class="sec-head"><h2>Measured</h2></div>', '  <h3 id="measure-again">Measure again</h3>', `  ${measured}`, "</section>",
  `<footer>Written at digest <code>${OLD_DIGEST}</code></footer>`, "",
].join("\n");

const TESTS_COLUMNS = ["Written", "Built", "SUCCESS", "FAILED", "PENDING", "PLANNED"];
const nine = (count) => Array.from({ length: count }, () => 9);
const testsPage = (overrides = {}, tables = null) => page(
  { id: "spn-sample-ts-tests-report", variant: "report", repository: "spn-sample-ts", reportType: "TESTS", title: "Tests report", lenses: ["QA"],
    generatedAt: "2026-09-01T09:00+05:30", measuredAt: "2026-08-31T08:00+05:30", summary: "What the tests prove.", keywords: ["report"], ...overrides },
  { tiles: [tile("SUCCESS", 9, 9, ' class="ok"'), tile("FAILED", 9, 9, ' class="fail"'), tile("PENDING", 9, 9, ' class="gap"'), tile("PLANNED", 9, 9, ' class="gap"')],
    legend: [["st-ok", "SUCCESS"], ["st-fail", "FAILED"], ["st-warn", "PENDING"], ["st-none", "PLANNED"]],
    measured: `<p>The rows were stamped at 2026-08-31T08:00+05:30. The digest was <code>${OLD_DIGEST}</code>.</p>`,
    tables: tables ?? [
      table("by-tier", "By tier", ["Runs", ...TESTS_COLUMNS], [
        ["Journey", "a whole journey", nine(7)], ["Unit", "one piece of code", nine(7), "", { 2: "done" }], ["Component", "one screen part", nine(7)],
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
  { tiles: [tile("Written", 9, null), tile("Built", 9, 9, ' class="ok"'), tile("Proved", 9, 9, ' class="ok"'), tile("Not written", 9, null)],
    legend: [["st-ok", "Proved"], ["st-warn", "Not proved"]],
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
  return [...row.matchAll(/<td class="(num-cell[^"]*)">([^<]*)<\/td>/g)].map((cell) => (cell[1] === "num-cell" ? cell[2] : `${cell[2]}:${cell[1].slice(9)}`)).join(" ");
};
const tileOf = (text, label) => (text.split("\n").find((line) => line.includes(`<span class="lbl">${label}</span>`)) ?? "")
  .replace(/<[^>]+>/g, (tag) => (/width|class="(ok|gap|fail)"/.test(tag) ? tag : " ")).replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------- a tests report

console.log("=== report refresh — a tests report");
{
  const root = repo(sample());
  const path = placed(root, "tests-report.html", testsPage());
  const measured = JSON.parse(command("behaviours", "coverage", root, "--json").out);
  const ran = refresh(path);
  const text = readFileSync(path, "utf8");
  ok("[MKT.SCRIPTS.81] the command exits 0 and says what it wrote", ran.code === 0 && /wrote/.test(ran.out) && ran.out.includes(measured.digest), ran.out);
  ok("[MKT.SCRIPTS.81] each tile carries its measured count, its total, its share and its bar",
    tileOf(text, "SUCCESS") === "SUCCESS 1 / 4 25% <i style=\"width:25.0%\">" && tileOf(text, "FAILED") === "FAILED 1 / 4 25% <i class=\"fail\" style=\"width:25.0%\">"
      && tileOf(text, "PLANNED") === "PLANNED 1 / 4 25% <i class=\"gap\" style=\"width:25.0%\">", [tileOf(text, "SUCCESS"), tileOf(text, "FAILED"), tileOf(text, "PLANNED")].join(" · "));
  ok("[MKT.SCRIPTS.81] the legend carries each state's count",
    ["SUCCESS", "FAILED", "PENDING", "PLANNED"].every((label) => new RegExp(`</i>${label} <b>1</b>`).test(text)), text.match(/<ul class="bd-legend">[\s\S]*?<\/ul>/)?.[0]);
  ok("[MKT.SCRIPTS.81] the bar holds one segment for each state above 0, as wide as its count, and its label says each count",
    (text.match(/<span class="bd-seg /g) ?? []).length === 4 && text.includes('<span class="bd-seg st-fail" style="flex-grow:1" title="FAILED: 1 behaviour"></span>')
      && text.includes('aria-label="SUCCESS 1, FAILED 1, PENDING 1, PLANNED 1"'), text.match(/<div class="bd-bar"[\s\S]*?<\/div>/)?.[0]);
  ok("[MKT.SCRIPTS.81] By tier: each tier's row holds its runs and its counts, a gap cell is marked, and a tier nobody names reads 0",
    rowOf(text, "By tier", "Unit") === "1 3 2 1 0 1:gap 1:gap" && rowOf(text, "By tier", "Journey") === "1 1 1 0 1:fail 0 0"
      && rowOf(text, "By tier", "Component") === "0 0 0 0 0 0 0" && rowOf(text, "By tier", "All tiers") === "1 4 3 1 1:fail 1:gap 1:gap",
    ["Unit", "Journey", "Component", "All tiers"].map((name) => rowOf(text, "By tier", name)).join(" | "));
  ok("[MKT.SCRIPTS.81] Repository: a domain is found by its folder, and the whole-repository row by its file",
    rowOf(text, "Repository", "Core") === "3 3 1 1:fail 0 1:gap" && rowOf(text, "Repository", "Behaviours about the whole repository") === "1 0 0 0 1:gap 0"
      && rowOf(text, "Repository", "spn-sample-ts") === "4 3 1 1:fail 1:gap 1:gap",
    ["Core", "Behaviours about the whole repository", "spn-sample-ts"].map((name) => rowOf(text, "Repository", name)).join(" | "));
  ok("[MKT.SCRIPTS.81] Apps and Packages: a project counts the behaviours of the design topics it has a chapter for",
    rowOf(text, "Packages", "store") === "3 3 1 1:fail 0 1:gap" && rowOf(text, "Packages", "All 1 packages") === "3 3 1 1:fail 0 1:gap"
      && rowOf(text, "Apps", "web") === "0 0 0 0 0 0", [rowOf(text, "Packages", "store"), rowOf(text, "Packages", "All 1 packages"), rowOf(text, "Apps", "web")].join(" | "));
  ok("[MKT.SCRIPTS.81] the digest is written wherever the page named the old one",
    !text.includes(OLD_DIGEST) && (text.split(measured.digest).length - 1) === 2, `${text.split(measured.digest).length - 1} occurrence(s)`);
  const block = blockOf(text);
  ok("[MKT.SCRIPTS.81] the block's `generatedAt` is stamped, and the header's Generated time carries the same moment",
    block.generatedAt !== "2026-09-01T09:00+05:30" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\+05:30$/.test(block.generatedAt)
      && text.includes(`<time class="local" datetime="${block.generatedAt}">${block.generatedAt}</time>`), block.generatedAt);
  ok("[MKT.SCRIPTS.81] a tests report's `measuredAt` is the newest `Updated at` the rows carry, in the block and in Measured",
    block.measuredAt === "2026-09-28T07:30+05:30" && text.includes("The rows were stamped at 2026-09-28T07:30+05:30."), block.measuredAt);
  ok("[MKT.SCRIPTS.81] the command writes numbers and never a sentence: the verdict and Top gaps are as they were",
    text.includes(VERDICT) && text.includes("<strong>9 behaviours are PLANNED.</strong>") && text.includes('<p class="bd-title">The 9 behaviours, by state</p>'));
  ok("[MKT.SCRIPTS.81] and it names what it left to the agent", /verdict/i.test(ran.out) && /Commit/.test(ran.out), ran.out);

  const before = statSync(path).mtimeMs;
  const again = refresh(path);
  ok("[MKT.SCRIPTS.81] a page whose digest already matches is left as it is, and the command says so",
    again.code === 0 && /current/.test(again.out) && readFileSync(path, "utf8") === text && statSync(path).mtimeMs === before, again.out);
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
  const audit = command("docs", "audit", path).out;
  ok("[MKT.SCRIPTS.82] `docs audit` draws no `measuredAt` finding on that page", !/measuredAt/.test(audit), audit);
}

// ---------------------------------------------------------------------------- a coverage report

console.log("\n=== report refresh — a coverage report");
{
  const root = repo(sample());
  const path = placed(root, "coverage-report.html", coveragePage());
  const measured = JSON.parse(command("coverage", "measure", root, "--json").out);
  const ran = refresh(path);
  const text = readFileSync(path, "utf8");
  ok("[MKT.SCRIPTS.81] a coverage report is refreshed from `coverage measure`", ran.code === 0 && text.includes(measured.digest) && !text.includes(OLD_DIGEST), ran.out);
  ok("[MKT.SCRIPTS.81] a count tile holds its number alone, and a share tile is green only at the whole",
    tileOf(text, "Written") === "Written 4" && tileOf(text, "Built") === "Built 3 / 4 75% <i style=\"width:75.0%\">"
      && tileOf(text, "Proved") === "Proved 1 / 4 25% <i style=\"width:25.0%\">" && tileOf(text, "Not written") === "Not written 0",
    ["Written", "Built", "Proved", "Not written"].map((label) => tileOf(text, label)).join(" · "));
  ok("[MKT.SCRIPTS.81] the breakdown is proved and not proved", text.includes("</i>Proved <b>1</b>") && text.includes("</i>Not proved <b>3</b>")
    && text.includes('aria-label="Proved 1, Not proved 3"'), text.match(/<ul class="bd-legend">[\s\S]*?<\/ul>/)?.[0]);
  ok("[MKT.SCRIPTS.81] Repository: a cell that holds a dash stays a dash, and the gaps are Written less Built and less Proved",
    rowOf(text, "Repository", "Core") === "3 3 1 &mdash; 0 2:gap" && rowOf(text, "Repository", "Behaviours about the whole repository") === "1 0 0 &mdash; 1:gap 1:gap"
      && rowOf(text, "Repository", "spn-sample-ts") === "4 3 1 0 1:gap 3:gap",
    ["Core", "Behaviours about the whole repository", "spn-sample-ts"].map((name) => rowOf(text, "Repository", name)).join(" | "));
  ok("[MKT.SCRIPTS.81] Packages and Apps hold each project's counts", rowOf(text, "Packages", "store") === "3 3 1 0 0 2:gap" && rowOf(text, "Apps", "web") === "0 0 0 0 0 0",
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
  ok("[MKT.SCRIPTS.81] the rows it could place are still written", rowOf(text, "Packages", "store") === "3 3 1 1:fail 0 1:gap" && ran.code === 0, rowOf(text, "Packages", "store"));

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
  ok("[MKT.SCRIPTS.81] with no page the command prints its usage line and exits 2",
    command("report", "refresh").code === 2 && command("report", "refresh").out.includes("usage: spn-devex report refresh <page>"), command("report", "refresh").out);
  const foundation = repo({ "sprepo.json": '{"type":"FOUNDATION","config":{"mtype":"FOUNDATION"}}' });
  const none = placed(foundation, "tests-report.html", testsPage());
  ok("[MKT.SCRIPTS.81] known-bad: a foundation repository owes no report, so there is nothing to refresh", refresh(none).code === 1 && /FOUNDATION/.test(refresh(none).out), refresh(none).out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — report refresh` : `\n  all ${total} passed — report refresh`);
process.exit(failed ? 1 : 0);
