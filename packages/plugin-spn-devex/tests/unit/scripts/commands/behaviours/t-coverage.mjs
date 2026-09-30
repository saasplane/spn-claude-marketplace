import { PLUGIN } from "../../../../helpers/harness.mjs";
// `behaviour-coverage` — the tests report's measurement. It writes nothing, so every case asserts
// what it measured, and the one byte-level promise: an unchanged tree measures to the same bytes.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { POCKET, SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "commands", "behaviours", "coverage.ts");
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
const artifact = (dir, tier, results, ranAt = "2026-09-28T02:00:00Z") => ({
  [`${dir}/tests/.output/${tier.toLowerCase()}/spn-tests.json`]: JSON.stringify({
    env: "local", tiers: [tier], ranAt,
    results: results.map(([id, status]) => ({ id, tier, status, title: `[${id}] a case`, detail: null })),
  }),
});

// Pinned so the measured instant reads the same on any machine this suite runs on — the tool reports
// the newest run in the LOCAL zone with its offset, and the local zone is otherwise whatever the host is.
const measure = (root, ...args) => execFileSync("node", [TOOL, ...args, root],
  { encoding: "utf8", env: { ...process.env, TZ: "Asia/Kolkata" } });
const json = (root) => JSON.parse(measure(root, "--json"));

console.log("=== behaviour-coverage — tier by tier");

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]) });
  const result = json(root);
  const unit = result.tiers.find((tier) => tier.tier === "UNIT");
  ok("[MKT.SCRIPTS.55] a tier with no run artifact reads NOT_RUN", unit?.state === "NOT_RUN", JSON.stringify(unit));
  ok("[MKT.SCRIPTS.55] and says why, naming the node that owes it", (unit?.reason ?? "").includes("packages/iam"), unit?.reason);
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"),
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]), ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const result = json(root);
  const row = result.rows.find((one) => one.id === "IAM.LOGIN.01");
  ok("[MKT.SCRIPTS.55] a row is joined to the last run of its tier", row?.found === "SUCCESS" && row?.tierRan === true, JSON.stringify(row));
  ok("a run the row does not carry yet reads as unstamped", row?.unstamped === true);
  ok("the tier reads RAN when every node that owes it ran it", result.tiers.find((tier) => tier.tier === "UNIT")?.state === "RAN");
  ok("the measurement is stamped by the newest run, not by the clock, in the local zone with its offset",
    result.measuredAt === "2026-09-28T07:30+05:30", result.measuredAt);
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...node("packages/org", "MODULE_SERVER"),
    "packages/org/tests/unit/org.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]), ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("a tier some owing nodes ran and some did not reads PARTIAL, naming the rest", unit?.state === "PARTIAL" && unit.unrunBy.includes("packages/org"), JSON.stringify(unit));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...node("packages/org", "MODULE_SERVER"),
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]), ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("a node that owes the tier and carries no case for it is named as no case, not as unrun",
    unit?.state === "PARTIAL" && unit.noCase.includes("packages/org") && !unit.unrunBy.includes("packages/org")
      && (unit.reason ?? "").includes("carry no case"), JSON.stringify(unit));
}

{
  // A module an application owns keeps its cases in the application's tree, and the application's run executes them.
  const root = repo({ ...APPS, ...node("apps/service-ts", "APP_SERVER"), ...node("apps/service-ts/src/modules/order", "MODULE_SERVER"),
    "apps/service-ts/tests/unit/order/order.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]), ...artifact("apps/service-ts", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("a module an application owns is proved by the application's run, where its cases sit",
    !unit?.unrunBy.includes("apps/service-ts/src/modules/order") && !unit?.noCase.includes("apps/service-ts/src/modules/order"), JSON.stringify(unit));
}

{
  // Each journey phase keeps its own artifact, so a later phase never replaces what the sweep proved.
  const sweep = artifact("apps/web", "JOURNEY", [["IAM.LOGIN.01", "SUCCESS"]]);
  const serialized = { [`apps/web/tests/.output/journey/spn-tests.serialized.json`]: Object.values(artifact("apps/web", "JOURNEY", [["IAM.LOGIN.02", "SUCCESS"]]))[0] };
  const root = repo({ ...APPS, ...node("apps/web", "APP_WEB"),
    ...register(["IAM.LOGIN.01", "JOURNEY", "PLANNED"], ["IAM.LOGIN.02", "JOURNEY", "PLANNED"]), ...sweep, ...serialized });
  const result = json(root);
  const found = Object.fromEntries(result.rows.map((row) => [row.id, row.found]));
  ok("a phase's own artifact is read beside the sweep's, and neither replaces the other",
    found["IAM.LOGIN.01"] === "SUCCESS" && found["IAM.LOGIN.02"] === "SUCCESS", JSON.stringify(found));
}

{
  // A client's contract suite sits in tests/contract/, so a client with cases there and no run is unrun, not caseless.
  const root = repo({ ...APPS, ...node("packages/client-api", "CLIENT_API"),
    "packages/client-api/tests/contract/iam/login.contract.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "CONTRACT", "PLANNED"]) });
  const contract = json(root).tiers.find((tier) => tier.tier === "CONTRACT");
  ok("a CLIENT_API owes CONTRACT and its tests/contract/ cases count as carried",
    contract?.owedBy.includes("packages/client-api") && !contract.noCase.includes("packages/client-api"), JSON.stringify(contract));
}

console.log("\n=== behaviour-coverage — a client's contract run, credited to the service it mirrors (RD.SUPPORT.APPS.135)");

{
  // The client's suite against the running service IS the service's contract tier, so the client's
  // run meets it for the service; the service's own tests/integration/ cases are integration.
  const root = repo({ ...APPS, ...node("apps/service-ts", "APP_SERVER"), ...node("packages/client-api", "CLIENT_API"),
    "apps/service-ts/tests/integration/boot.int.spec.ts": "// an integration case\n",
    "packages/client-api/tests/contract/iam/login.contract.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "CONTRACT", "PLANNED"]),
    ...artifact("packages/client-api", "CONTRACT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const result = json(root);
  const contract = result.tiers.find((tier) => tier.tier === "CONTRACT");
  ok("a CLIENT_API's contract run is credited to the APP_SERVER, and the tier reads RAN",
    contract?.state === "RAN" && contract.creditedTo.includes("apps/service-ts") && !contract.unrunBy.includes("apps/service-ts"), JSON.stringify(contract));
  ok("the terminal line names the client run it credited", measure(root).includes("a client's contract run credited to apps/service-ts"), measure(root));
}

{
  const root = repo({ ...APPS, ...node("apps/service-ts", "APP_SERVER"), ...node("packages/client-api", "CLIENT_API"),
    "apps/service-ts/tests/integration/boot.int.spec.ts": "// an integration case\n",
    "packages/client-api/tests/contract/iam/login.contract.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "CONTRACT", "PLANNED"]) });
  const contract = json(root).tiers.find((tier) => tier.tier === "CONTRACT");
  ok("known-bad: a client that carries contract cases and left no run credits nothing",
    contract?.state === "NOT_RUN" && contract.creditedTo.length === 0, JSON.stringify(contract));
  ok("known-bad: an APP_SERVER's tests/integration/ cases are not contract cases",
    contract?.noCase.includes("apps/service-ts") && !contract.unrunBy.includes("apps/service-ts"), JSON.stringify(contract));
}

console.log("\n=== behaviour-coverage — one root journey run, credited to every application it drives");

{
  const root = repo({ ...APPS, "playwright.config.ts": "export default {};\n",
    ...node("apps/web-a", "APP_WEB"), ...node("apps/web-b", "APP_WEB"), ...node("apps/web-c", "APP_WEB"),
    "apps/web-a/tests/journeys/a.spec.ts": "test('[IAM.LOGIN.01] a person signs in', () => {});\n",
    "tests/journeys/b.spec.ts": "import { ids } from '../../apps/web-b/src/test-data';\ntest('[IAM.LOGIN.02] a person signs up', () => {});\n",
    "apps/web-c/tests/journeys/c.spec.ts": "test('[IAM.LOGIN.03] a person signs out', () => {});\n",
    ...register(["IAM.LOGIN.01", "JOURNEY", "PLANNED"], ["IAM.LOGIN.02", "JOURNEY", "PLANNED"], ["IAM.LOGIN.03", "JOURNEY", "PLANNED"]),
    ...artifact("apps/web-a", "JOURNEY", [["IAM.LOGIN.01", "SUCCESS"], ["IAM.LOGIN.02", "SUCCESS"]]) });
  const journey = json(root).tiers.find((tier) => tier.tier === "JOURNEY");
  ok("a root case reaching into an application's folder credits the root run to that application",
    journey?.creditedTo.includes("apps/web-b") && !journey.unrunBy.includes("apps/web-b") && !journey.noCase.includes("apps/web-b"), JSON.stringify(journey));
  ok("an application whose own journey ids the root run did not name stays unrun",
    journey?.unrunBy.includes("apps/web-c") && !journey.creditedTo.includes("apps/web-c"), JSON.stringify(journey));
}

{
  const root = repo({ ...APPS, ...node("apps/web-a", "APP_WEB"), ...node("apps/web-b", "APP_WEB"),
    "apps/web-b/tests/journeys/b.spec.ts": "test('[IAM.LOGIN.01] a person signs in', () => {});\n",
    ...register(["IAM.LOGIN.01", "JOURNEY", "PLANNED"]),
    ...artifact(".", "JOURNEY", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const journey = json(root).tiers.find((tier) => tier.tier === "JOURNEY");
  ok("an artifact at the repository root is a root run, credited to the application whose case it named",
    journey?.creditedTo.includes("apps/web-b") && journey.state === "PARTIAL" && journey.noCase.includes("apps/web-a"), JSON.stringify(journey));
}

{
  const root = repo({ ...APPS, ...node("apps/web-a", "APP_WEB"), ...node("apps/web-b", "APP_WEB"),
    "apps/web-b/tests/journeys/b.spec.ts": "test('[IAM.LOGIN.01] a person signs in', () => {});\n",
    ...register(["IAM.LOGIN.01", "JOURNEY", "PLANNED"]),
    ...artifact("apps/web-a", "JOURNEY", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const journey = json(root).tiers.find((tier) => tier.tier === "JOURNEY");
  ok("known-bad: with no root configuration, one application's run is never credited to another",
    journey?.creditedTo.length === 0 && journey.unrunBy.includes("apps/web-b"), JSON.stringify(journey));
}

{
  const root = repo({ ...APPS, ...register(["IAM.LOGIN.01", "UNITT", "PLANNED"]) });
  const result = json(root);
  ok("a Tier no vocabulary declares is a named finding", result.findings.some((one) => one.message.includes('Tier "UNITT"')), JSON.stringify(result.findings));
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

console.log("\n=== behaviour-coverage — Run health in the report's plain words (N122 5.3c)");

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"), ...node("packages/org", "MODULE_SERVER"),
    ...node("apps/web", "APP_WEB"), ...node("apps/web/src/modules/home", "MODULE_WEB"), ...node("apps/web/src/modules/list", "MODULE_WEB"),
    "packages/iam/tests/unit/iam.spec.ts": "// a case\n",
    "apps/web/tests/journeys/a.spec.ts": "// a case\n", "apps/web/tests/component/a.ct.spec.ts": "// a case\n",
    ...register(["IAM.LOGIN.01", "UNIT", "SUCCESS"], ["IAM.LOGIN.02", "INTEGRATION", "PLANNED"]),
    ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"], ["NOPE.GHOST.01", "SUCCESS"], ["IAM.LOGIN.02", "SUCCESS"]]) });
  const result = json(root);
  const health = Object.fromEntries((result.health ?? []).map((one) => [one.problem, one]));
  const owed = health["A project owes a test level and has no test there"];
  ok("5.3c: an owed level with no test is named in plain words, with a count, where and what fixes it",
    owed?.count === 3 && owed.where === "web: 2 modules · org. All at Unit."
      && owed.fix === "Write one test at the owed level in each project listed. Their project types, MODULE_SERVER and MODULE_WEB, owe that level.",
    JSON.stringify(owed));
  const unknown = health["A test names an id that no behaviour has"];
  ok("5.3c: a test naming an id no behaviour has is counted by id, with where and the fix",
    unknown?.count === 1 && unknown.where === "iam, Unit" && JSON.stringify(unknown.items) === '[{"node":"packages/iam","tier":"UNIT","ids":["NOPE.GHOST.01"]}]'
      && unknown.fix === "Rename each id to the behaviour it proves, or remove it from the test. Until then these tests prove nothing here.",
    JSON.stringify(unknown));
  const other = health["A test names a behaviour written for another level"];
  ok("5.3c: a test naming a behaviour written for another level names the level it was written for",
    other?.count === 1 && other.where === "iam, Unit"
      && JSON.stringify(other.items) === '[{"node":"packages/iam","tier":"UNIT","declaredAt":"INTEGRATION","ids":["IAM.LOGIN.02"]}]'
      && other.fix === "Move the id to a test at the level the behaviour names, or change the level in the behaviour. Until then these tests do not count.",
    JSON.stringify(other));
  ok("5.3c: the three problems are listed in the report's order", JSON.stringify((result.health ?? []).map((one) => one.problem)) === JSON.stringify([
    "A project owes a test level and has no test there", "A test names an id that no behaviour has", "A test names a behaviour written for another level"]));
  ok("5.3c: the plain reading prints each problem with its count", measure(root).includes("health: A test names an id that no behaviour has — 1 · iam, Unit"), measure(root));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"),
    ...register(["IAM.LOGIN.01", "UNIT", "SUCCESS"]), ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const counts = (json(root).health ?? []).map((one) => one.count);
  ok("5.3c: a healthy run lists each problem at 0, so none reads as unchecked", JSON.stringify(counts) === "[0,0,0]", JSON.stringify(json(root).health));
}

console.log("\n=== behaviour-coverage — an absence, and the same bytes twice");

{
  const root = repo({ "sprepo.json": '{"type":"FOUNDATION","config":{"mtype":"FOUNDATION"}}', ...register(["FDN.LOGIN.01", "UNIT", "PLANNED"]) });
  const result = json(root);
  ok("[MKT.SCRIPTS.56] a foundation repository gets an absence and no report", result.absence !== null && result.report === null && result.rows.length === 0, JSON.stringify(result).slice(0, 200));
}

{
  const root = repo({ ...APPS, ...node("packages/iam", "MODULE_SERVER"),
    ...register(["IAM.LOGIN.01", "UNIT", "SUCCESS", "2026-09-28T02:00:00Z"]), ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
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
  ok("without --json it prints the tiers for a person", text.includes("UNIT") && text.includes("NOT_RUN") && text.includes("rows 1"), text);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviour-coverage` : `\n  all ${total} passed — behaviour-coverage`);
process.exit(failed ? 1 : 0);
