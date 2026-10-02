import { PLUGIN } from "../../../../helpers/harness.mjs";
// `behaviours coverage show` — the tests report's measurement. It writes nothing, so every case asserts
// what it measured, and the one byte-level promise: an unchanged tree measures to the same bytes.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "measure-"));
  kept.push(root);
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  return root;
};

const APPS = { "sprepo.json": '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}' };
const node = (dir, kind) => ({
  [`${dir}/package.json`]: `{"name":"${dir.split("/").pop()}"}`,
  [`${dir}/spkind.json`]: `{"kind":"${kind}","config":{"mtype":"${kind}"}}`,
});
const register = (...rows) => ({
  [`docs/${SEAT.behaviors}/iam.md`]: [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, tier, status, at = "—"]) => `| ${id} | a person | signs in | in | POSITIVE | ${tier} | ${status} | ${at} |`),
    "",
  ].join("\n"),
});
/** A run file, as the toolchain's runner writes one. The measurement must never open it. */
const runFile = (dir, tier, name, results, ranAt = "2026-09-28T02:00:00Z") => ({
  [`${dir}/tests/.output/${tier.toLowerCase()}/runs/${name}.json`]: JSON.stringify({
    run: name, tier, phase: null, ranAt, env: "local",
    results: results.map(([id, status]) => ({ id, tier, status, title: `[${id}] a case`, detail: null })),
  }),
});

// Pinned so the measured instant reads the same on any machine this suite runs on — the tool reports
// the newest Updated at in the LOCAL zone with its offset, and the local zone is otherwise whatever the host is.
const ENV = { ...process.env, TZ: "Asia/Kolkata", SPN_TELEMETRY: "off" };
const measure = (root, ...args) => execFileSync("node", [TOOL, "behaviours", "coverage", "show", ...args, root], { encoding: "utf8", stdio: "pipe", env: ENV });
/** `behaviours coverage` through the entry, with the words typed after it: what it printed, and its exit code. */
const typed = (...words) => {
  try { return { out: execFileSync("node", [TOOL, "behaviours", "coverage", ...words], { encoding: "utf8", stdio: "pipe", env: ENV }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
const json = (root) => JSON.parse(measure(root, "--json"));

console.log("=== behaviour-coverage — tier by tier, from the stamped rows");

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]) });
  const result = json(root);
  const unit = result.tiers.find((tier) => tier.tier === "UNIT");
  ok("[MKT.SCRIPTS.55] a tier whose rows cite no run lists no run", unit?.runs.length === 0 && unit.rows === 1, JSON.stringify(unit));
  ok("[MKT.SCRIPTS.55] and names the node whose kind owes it", (unit?.owedBy ?? []).includes("packages/iam"), JSON.stringify(unit));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"),
    ...register(["IAM.LOGIN.01", "UNIT", "SUCCESS", "2026-09-28T02:00:00Z · full-1"], ["IAM.LOGIN.02", "UNIT", "FAILED", "2026-09-27T02:00:00Z · full-0"],
      ["IAM.LOGIN.03", "UNIT", "PENDING", "2026-09-28T02:00:00Z · full-1"]) });
  const result = json(root);
  const row = result.rows.find((one) => one.id === "IAM.LOGIN.01");
  ok("[MKT.SCRIPTS.55] a row is read from its own Status and the run its Updated at cites",
    row?.status === "SUCCESS" && row.run === "full-1" && row.ranAt === "2026-09-28T02:00:00Z", JSON.stringify(row));
  const unit = result.tiers.find((tier) => tier.tier === "UNIT");
  ok("[MKT.SCRIPTS.55] a tier lists the runs its rows cite, newest first, with how many rows cite each",
    JSON.stringify(unit?.runs) === JSON.stringify([{ run: "full-1", ranAt: "2026-09-28T02:00:00Z", rows: 2 }, { run: "full-0", ranAt: "2026-09-27T02:00:00Z", rows: 1 }]),
    JSON.stringify(unit?.runs));
  ok("[MKT.SCRIPTS.55] and counts its rows by status, which sum to its rows",
    unit?.status?.SUCCESS === 1 && unit.status.FAILED === 1 && unit.status.PENDING === 1 && unit.status.PLANNED === 0, JSON.stringify(unit?.status));
  ok("the measurement is stamped by the newest Updated at it read, in the local zone with its offset",
    result.measuredAt === "2026-09-28T07:30+05:30", result.measuredAt);
}

{
  // The same rows, with and without a run file on disk that disagrees with them.
  const rows = register(["IAM.LOGIN.01", "UNIT", "PLANNED"], ["IAM.LOGIN.02", "UNIT", "SUCCESS", "2026-09-27T02:00:00Z · full-0"]);
  const bare = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...rows });
  const withRun = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...rows,
    ...runFile("packages/iam", "UNIT", "full-9", [["IAM.LOGIN.01", "SUCCESS"], ["IAM.LOGIN.02", "FAILED"]], "2026-09-29T02:00:00Z") });
  const one = json(bare);
  const two = json(withRun);
  ok("[MKT.SCRIPTS.77] a run file on disk changes nothing the tests measurement says",
    JSON.stringify({ ...one, repository: null, digest: null }) === JSON.stringify({ ...two, repository: null, digest: null }), `${JSON.stringify(one.tiers)}\n${JSON.stringify(two.tiers)}`);
  ok("[MKT.SCRIPTS.77] a row the run file names keeps the Status the stamp wrote",
    two.rows.find((row) => row.id === "IAM.LOGIN.01")?.status === "PLANNED" && two.rows.find((row) => row.id === "IAM.LOGIN.02")?.status === "SUCCESS",
    JSON.stringify(two.rows));
  ok("the tests measurement carries no run health: the report reads the stamped rows only", !("health" in two), Object.keys(two).join(","));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...node("packages/org", "MODULE_SERVER"),
    "packages/iam/tests/unit/iam.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("a node that owes the tier and carries no case for it is named as no case",
    unit?.noCase.includes("packages/org") && !unit.noCase.includes("packages/iam"), JSON.stringify(unit));
}

{
  // A module an application owns keeps its cases in the application's tree.
  const root = repo({ ...APPS, ...node("apps/service-ts", "APP_SERVER"), ...node("apps/service-ts/src/modules/order", "MODULE_SERVER"),
    "apps/service-ts/tests/unit/order/order.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("a module an application owns carries the cases its application's tree holds for it",
    !unit?.noCase.includes("apps/service-ts/src/modules/order"), JSON.stringify(unit));
}

{
  // A client's contract suite sits in tests/contract/, so a client with cases there carries the tier.
  const root = repo({ ...APPS, ...node("packages/client-api", "CLIENT_API"), ...node("apps/service-ts", "APP_SERVER"),
    "apps/service-ts/tests/integration/boot.int.spec.ts": "// an integration case\n",
    "packages/client-api/tests/contract/iam/login.contract.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "CONTRACT", "PLANNED"]) });
  const contract = json(root).tiers.find((tier) => tier.tier === "CONTRACT");
  ok("a CLIENT_API owes CONTRACT and its tests/contract/ cases count as carried",
    contract?.owedBy.includes("packages/client-api") && !contract.noCase.includes("packages/client-api"), JSON.stringify(contract));
  ok("known-bad: an APP_SERVER's tests/integration/ cases are not contract cases",
    contract?.noCase.includes("apps/service-ts"), JSON.stringify(contract));
}

{
  const root = repo({ ...APPS, ...register(["IAM.LOGIN.01", "UNITT", "PLANNED"]) });
  const result = json(root);
  ok("a Tier no vocabulary declares is a named finding", result.findings.some((one) => one.message.includes('Tier "UNITT"')), JSON.stringify(result.findings));
}

console.log("\n=== behaviour-coverage — what the test source says: an unknown id, another level, an id used twice");

{
  // A package proven by `.spec.mjs` cases carries its unit level.
  const root = repo({ ...APPS, ...node("packages/tooling", "SUPPORT_UNIVERSAL"), ...node("packages/bare", "SUPPORT_UNIVERSAL"),
    "packages/tooling/tests/unit/runner.spec.mjs": "test('[IAM.LOGIN.01] it runs', () => {});\n",
    "packages/bare/tests/unit/notes.mjs": "// a helper, and no case\n",
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("[MKT.SCRIPTS.85] a node whose unit cases are `.spec.mjs` files is not listed with no case",
    !unit?.noCase.includes("packages/tooling"), JSON.stringify(unit?.noCase));
  ok("[MKT.SCRIPTS.85] known-bad: a `.mjs` file that is not a case file does not count as one",
    unit?.noCase.includes("packages/bare"), JSON.stringify(unit?.noCase));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...node("apps/web", "APP_WEB"), ...node("packages/toolchain", "TOOLCHAIN"),
    "packages/iam/tests/unit/login.spec.ts": [
      "describe('sign-in', () => {",
      "  it('[IAM.LOGIN.01] accepts a password', () => {});",
      "  it('[IAM.LOGIN.09] cites a row nobody wrote', () => {});",
      "  it('[IAM.LOGIN.02] proves a journey row from a unit case', () => {});",
      "  it('[IAM.LOGIN.03] is one of two cases for this row', () => {});",
      "  it.skip('[IAM.LOGIN.08] a skipped case proves nothing', () => {});",
      "});", ""].join("\n"),
    "apps/web/tests/journeys/login.spec.ts": "test('[IAM.LOGIN.03] signs in through the screen', async () => {});\n",
    "packages/toolchain/tests/unit/titles.spec.ts": "it('[ZZ.SAMPLE.01] a sample title the runner reads', () => {});\n",
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"], ["IAM.LOGIN.02", "JOURNEY", "PLANNED"], ["IAM.LOGIN.03", "JOURNEY", "PLANNED"]) });
  const result = json(root);
  const ofType = (ftype) => result.findings.filter((one) => one.ftype === ftype);
  const unknown = ofType("CASE_UNKNOWN_ID");
  ok("[MKT.SCRIPTS.83] known-bad: a case that names an id no row declares is a finding, named by its file",
    unknown.length === 1 && unknown[0].message.includes("IAM.LOGIN.09") && unknown[0].project === "packages/iam/tests/unit/login.spec.ts",
    JSON.stringify(unknown));
  const level = ofType("CASE_OTHER_LEVEL");
  ok("[MKT.SCRIPTS.83] known-bad: a row whose cases all sit at another level is a finding that names both levels",
    level.length === 1 && level[0].message.includes("IAM.LOGIN.02 is a JOURNEY row") && level[0].message.includes("(UNIT)"), JSON.stringify(level));
  ok("[MKT.SCRIPTS.83] a row cited at its own level is no finding, with a second case at another level or without one",
    !result.findings.some((one) => /IAM\.LOGIN\.0[13]\b/.test(one.message)), JSON.stringify(result.findings));
  ok("[MKT.SCRIPTS.83] a skipped case and a TOOLCHAIN node's sample titles are not read",
    !result.findings.some((one) => /IAM\.LOGIN\.08|ZZ\.SAMPLE\.01/.test(one.message)), JSON.stringify(result.findings));
  let code = 0;
  try { measure(root); } catch (error) { code = error.status ?? 1; }
  ok("[MKT.SCRIPTS.83] the findings are a report: the command still exits 0", code === 0, `exit ${code}`);
  ok("[MKT.SCRIPTS.83] and the printed reading lists them", /CASE_UNKNOWN_ID[^\n]*IAM\.LOGIN\.09/.test(measure(root)), measure(root));
}

{
  const twice = {
    ...register(["IAM.LOGIN.01", "UNIT", "SUCCESS", "2026-09-28T02:00:00Z · full-1"], ["IAM.LOGIN.02", "UNIT", "PLANNED"]),
    [`docs/${SEAT.behaviors}/org.md`]: [
      "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      "| IAM.LOGIN.01 | a person | joins an organization | the organization | POSITIVE | UNIT | PLANNED | — |",
      ""].join("\n"),
  };
  const result = json(repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...twice }));
  const duplicate = result.findings.filter((one) => one.ftype === "DUPLICATE_ID");
  ok("[MKT.SCRIPTS.84] known-bad: an id that two rows declare is a finding that names each file and line",
    duplicate.length === 1 && duplicate[0].message.includes(`docs/${SEAT.behaviors}/iam.md:3`) && duplicate[0].message.includes(`docs/${SEAT.behaviors}/org.md:3`),
    JSON.stringify(duplicate));
  ok("[MKT.SCRIPTS.84] the id is still counted once, from its first row", result.rows.filter((row) => row.id === "IAM.LOGIN.01").length === 1
    && result.rows.find((row) => row.id === "IAM.LOGIN.01")?.status === "SUCCESS", JSON.stringify(result.rows.map((row) => row.id)));
  const clean = json(repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"], ["IAM.LOGIN.02", "UNIT", "PLANNED"]) }));
  ok("[MKT.SCRIPTS.84] a register whose ids are each declared once draws no such finding",
    !clean.findings.some((one) => one.ftype === "DUPLICATE_ID"), JSON.stringify(clean.findings));
}

console.log("\n=== behaviour-coverage — the domains, with Built in behaviours (N122 5.3d)");

/** Rows `[id, tier, status]` in one behaviours file, at a path under the seat. */
const rowsAt = (path, ...rows) => ({
  [`docs/${SEAT.behaviors}/${path}`]: [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, tier, status]) => `| ${id} | a person | acts | a result | POSITIVE | ${tier} | ${status} | — |`),
    "",
  ].join("\n"),
});
const whereChapter = (domain, pkg, name, path) => ({
  [`docs/${SEAT.constructs}/${domain}/${name}.md`]: `# ${name}\n`,
  [`docs/${SEAT.capabilities}/${domain}/${pkg}/${name}.md`]: [
    `# ${name} in ${pkg}`, "", "## Where", "", "| Part | Lives in | What it is |", "| --- | --- | --- |",
    `| a part | \`${path}\` | what it is |`, "",
  ].join("\n"),
});

{
  const root = repo({ ...APPS, ...node("packages/store", "MODULE_SERVER"), ...node("packages/web", "MODULE_SERVER"),
    "packages/store/src/app/services/StoreService.ts": "export const value = 1;\n",
    "packages/web/src/app/services/PageService.ts": "export const value = 1;\n",
    ...rowsAt("01-core/01-store.md", ["COR.STORE.01", "UNIT", "SUCCESS"], ["COR.STORE.02", "UNIT", "PLANNED"]),
    ...whereChapter("01-core", "store", "01-store", "src/app/services/StoreService.ts"),
    ...rowsAt("02-web/01-page.md", ["WEB.PAGE.01", "UNIT", "FAILED"]),
    ...whereChapter("02-web", "web", "01-page", "src/app/services/Missing.ts"),
    [`docs/${SEAT.behaviors}/02-web/README.md`]: "# Behaviors — Web\n",
    ...rowsAt("README.md", ["COR.REPO.01", "UNIT", "PENDING"]) });
  const result = json(root);
  const domains = Object.fromEntries((result.domains ?? []).map((one) => [one.domain, one]));
  ok("5.3d: the tests measurement groups behaviours by domain, in the docs tree's order, named by the README's title",
    JSON.stringify((result.domains ?? []).map((one) => [one.domain, one.name])) === '[["01-core","core"],["02-web","Web"]]', JSON.stringify(result.domains));
  const core = domains["01-core"];
  ok("5.3d: a domain carries Written, Built in behaviours, and the four statuses, which sum to Written",
    core?.written === 2 && core.built === 2 && core.status.SUCCESS === 1 && core.status.PLANNED === 1
      && core.status.FAILED === 0 && core.status.PENDING === 0, JSON.stringify(core));
  ok("5.3d: a behaviour whose design topic is not built is written and not built",
    domains["02-web"]?.written === 1 && domains["02-web"].built === 0 && domains["02-web"].status.FAILED === 1, JSON.stringify(domains["02-web"]));
  ok("5.3d: the whole-repository row holds the README's behaviours, never built",
    result.wholeRepository?.written === 1 && result.wholeRepository.built === 0 && result.wholeRepository.status.PENDING === 1
      && JSON.stringify(result.wholeRepository.files) === `["docs/${SEAT.behaviors}/README.md"]`, JSON.stringify(result.wholeRepository));
}

console.log("\n=== behaviour-coverage — a MANUAL row counts in none of the numbers (N122 5.3e)");

{
  const root = repo({ ...APPS, ...node("packages/store", "MODULE_SERVER"),
    "packages/store/src/app/services/StoreService.ts": "export const value = 1;\n",
    ...rowsAt("01-core/01-store.md", ["COR.STORE.01", "UNIT", "SUCCESS"], ["COR.STORE.02", "UNIT", "PLANNED"], ["COR.STORE.03", "JOURNEY", "MANUAL"]),
    ...whereChapter("01-core", "store", "01-store", "src/app/services/StoreService.ts"),
    ...rowsAt("README.md", ["COR.REPO.01", "UNIT", "PENDING"], ["COR.REPO.02", "JOURNEY", "MANUAL"]) });
  const result = json(root);
  const core = (result.domains ?? []).find((one) => one.domain === "01-core");
  const sum = (one) => ["SUCCESS", "FAILED", "PENDING", "PLANNED"].reduce((total, word) => total + (one?.status?.[word] ?? 0), 0);
  ok("5.3e: a domain's Written and Built leave the MANUAL row out", core?.written === 2 && core.built === 2, JSON.stringify(core));
  ok("5.3e: the four statuses sum to Written again", sum(core) === core?.written && sum(result.wholeRepository) === result.wholeRepository?.written,
    JSON.stringify([core?.status, result.wholeRepository?.status]));
  ok("5.3e: a domain lists its MANUAL rows as manual: [{ id, file }]",
    JSON.stringify(core?.manual) === JSON.stringify([{ id: "COR.STORE.03", file: `docs/${SEAT.behaviors}/01-core/01-store.md` }]), JSON.stringify(core?.manual));
  ok("5.3e: the whole-repository row leaves its MANUAL row out and lists it",
    result.wholeRepository?.written === 1 && JSON.stringify(result.wholeRepository?.manual) === JSON.stringify([{ id: "COR.REPO.02", file: `docs/${SEAT.behaviors}/README.md` }]),
    JSON.stringify(result.wholeRepository));
  const journey = (result.tiers ?? []).find((one) => one.tier === "JOURNEY");
  ok("5.3e: a tier's row count leaves MANUAL rows out", (journey?.rows ?? 0) === 0, JSON.stringify(journey));
  ok("5.3e: the measurement lists every MANUAL row once", (result.manual ?? []).map((one) => one.id).join(",") === "COR.STORE.03,COR.REPO.02", JSON.stringify(result.manual));
}

console.log("\n=== behaviour-coverage — an absence, and the same bytes twice");

{
  const root = repo({ "sprepo.json": '{"type":"FOUNDATION","config":{"mtype":"FOUNDATION"}}', ...register(["FDN.LOGIN.01", "UNIT", "PLANNED"]) });
  const result = json(root);
  ok("[MKT.SCRIPTS.56] a foundation repository gets an absence and no report", result.absence !== null && result.report === null && result.rows.length === 0, JSON.stringify(result).slice(0, 200));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"),
    ...register(["IAM.LOGIN.01", "UNIT", "SUCCESS", "2026-09-28T02:00:00Z · full-1"]) });
  const first = measure(root, "--json");
  const second = measure(root, "--json");
  ok("[MKT.SCRIPTS.57] an unchanged tree measures to the same bytes", first === second);
  const digest = JSON.parse(first).digest;
  ok("[MKT.SCRIPTS.57] and a missing page is reported as not written", JSON.parse(first).report.exists === false);
  mkdirSync(join(root, "docs", POCKET.artifacts, "reports"), { recursive: true });
  writeFileSync(join(root, "docs", POCKET.artifacts, "reports", "tests-report.html"), `<p>digest ${digest}</p>`, "utf8");
  ok("[MKT.SCRIPTS.57] a page carrying the digest reads as current", json(root).report.current === true);
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]) });
  const text = measure(root);
  ok("without --json it prints the tiers for a person", text.includes("UNIT") && text.includes("no run cited") && text.includes("rows 1"), text);
}

console.log("\n=== behaviours coverage — the action is a word, and a narrow path counts the rows under it");

{
  const rowsAt = (path, ...rows) => ({ [`docs/${SEAT.behaviors}/${path}`]: Object.values(register(...rows))[0] });
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"),
    ...rowsAt("01-iam/login.md", ["IAM.LOGIN.01", "UNIT", "SUCCESS", "2026-09-28T02:00:00Z · full-1"], ["IAM.LOGIN.02", "UNIT", "PLANNED"]),
    ...rowsAt("02-pay/card.md", ["PAY.CARD.01", "UNIT", "FAILED", "2026-09-28T02:00:00Z · full-1"]) });
  const USAGE = "usage: spn-devex behaviours coverage show [<path>] [--json]\n";
  const none = typed();
  ok("[MKT.SCRIPTS.111] with no action the entry prints the usage line and says an action is owed",
    none.code === 2 && none.out === USAGE + "`behaviours coverage` needs an action.\n", none.out);
  const flag = typed("--json", root);
  ok("[MKT.SCRIPTS.111] an option where the action belongs is refused with exit 2", flag.code === 2 && flag.out.startsWith(USAGE), flag.out);
  const option = typed("show", root, "--write");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2",
    option.code === 2 && option.out === USAGE + "`behaviours coverage show` does not take `--write`.\n", option.out);

  const whole = json(root);
  ok("untouched: the repository, measured, counts the rows of both registers and names the report page",
    whole.rows.length === 3 && whole.report?.exists === false, JSON.stringify([whole.rows.length, whole.report]));
  const narrow = JSON.parse(typed("show", join(root, "docs", SEAT.behaviors, "02-pay"), "--json").out);
  ok("[MKT.SCRIPTS.163] a run narrowed to a folder counts the rows of the registers under it, and none beside it",
    narrow.rows.length === 1 && narrow.rows[0].id === "PAY.CARD.01" && narrow.tiers.find((tier) => tier.tier === "UNIT")?.status.FAILED === 1
      && narrow.tiers.find((tier) => tier.tier === "UNIT")?.status.SUCCESS === 0, JSON.stringify(narrow.rows));
  ok("[MKT.SCRIPTS.163] a narrowed measurement says nothing about the report page, whose digest is the whole repository's",
    narrow.report === null && narrow.digest !== whole.digest && narrow.repository === whole.repository, JSON.stringify([narrow.report, narrow.digest]));
  const text = typed("show", join(root, "docs", SEAT.behaviors, "02-pay", "card.md")).out;
  ok("[MKT.SCRIPTS.163] the printed reading of one register counts its row alone, and names no page", text.includes("rows 1 — FAILED 1") && !text.includes("tests-report.html"), text);
  let inside;
  try { inside = JSON.parse(execFileSync("node", [TOOL, "behaviours", "coverage", "show", "--json"], { cwd: join(root, "packages", "iam"), encoding: "utf8", stdio: "pipe", env: ENV })); } catch { inside = null; }
  ok("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it", inside?.rows.length === 3 && inside.digest === whole.digest, JSON.stringify(inside?.rows?.length));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviours coverage` : `\n  all ${total} passed — behaviours coverage`);
process.exit(failed ? 1 : 0);
