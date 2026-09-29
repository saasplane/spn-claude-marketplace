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
    ...register(["IAM.LOGIN.01", "UNIT", "PLANNED"]), ...artifact("packages/iam", "UNIT", [["IAM.LOGIN.01", "SUCCESS"]]) });
  const unit = json(root).tiers.find((tier) => tier.tier === "UNIT");
  ok("a tier some owing nodes ran and some did not reads PARTIAL, naming the rest", unit?.state === "PARTIAL" && unit.unrunBy.includes("packages/org"), JSON.stringify(unit));
}

{
  const root = repo({ ...APPS, ...register(["IAM.LOGIN.01", "UNITT", "PLANNED"]) });
  const result = json(root);
  ok("a Tier no vocabulary declares is a named finding", result.findings.some((one) => one.message.includes('Tier "UNITT"')), JSON.stringify(result.findings));
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
