import { PLUGIN } from "../../../helpers/harness.mjs";
// `behaviour-proof` — every SUCCESS row against the last run of its own tier. It changes nothing,
// so every case asserts its exit code and what it named: the failure worth fearing is a gate that
// reports green having read nothing.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const TOOL = resolve(PLUGIN, "src", "scripts", "checks", "behaviour-proof.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A repository: a nine-cell register under docs/, and run artifacts by node and tier. */
const repo = (rows, runs = []) => {
  const root = mkdtempSync(join(tmpdir(), "proof-"));
  kept.push(root);
  const write = (path, body) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body, "utf8"); };
  write("sprepo.json", '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}\n');
  write("docs/03-behaviors/login.md", [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at | Realizes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, tier, status, type = "POSITIVE"]) => `| ${id} | a person | signs in | in | ${type} | ${tier} | ${status} | — | account |`),
    "",
  ].join("\n"));
  for (const { node = "apps/api", tier, results, raw } of runs) {
    write(`${node}/tests/.output/${tier.toLowerCase()}/spn-tests.json`,
      raw ?? JSON.stringify({ env: "local", tiers: [tier], ranAt: "2026-09-28T09:00:00Z", results }));
  }
  return root;
};

const run = (root) => {
  try { return { out: execFileSync("node", [TOOL, "."], { cwd: root, encoding: "utf8" }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};

const result = (id, tier, status) => ({ id, tier, status, title: `${id} a person signs in`, detail: null });

console.log("=== behaviour-proof — known-bad: a claim the run contradicts");

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED")] }]));
  ok("[MKT.SCRIPTS.53] a SUCCESS row the run found FAILED is refused", code === 1, `exit ${code}`);
  ok("[MKT.SCRIPTS.53] and the refusal names the row, the finding and the artifact",
     out.includes("IAM.LOGIN.01") && out.includes("FAILED") && out.includes("apps/api/tests/.output/contract/spn-tests.json"), out);
}

{
  const { code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "PENDING")] }]));
  ok("[MKT.SCRIPTS.53] a SUCCESS row the run could not reach is refused", code === 1, `exit ${code}`);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.OTHER.01", "CONTRACT", "SUCCESS")] }]));
  ok("a SUCCESS row the run of its tier did not name is refused as stale", code === 1 && out.includes("did not name it"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "UNIT", results: [result("IAM.LOGIN.01", "UNIT", "SUCCESS")] },
     { tier: "CONTRACT", results: [] }]));
  ok("a row proven at another tier than it declares is refused", code === 1 && out.includes("proven at UNIT"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "PLANNED"]],
    [{ tier: "CONTRACT", raw: "{ not json" }]));
  ok("a malformed artifact is refused by name", code === 1 && out.includes("not parseable"), out);
}

console.log("\n=== behaviour-proof — what it leaves alone");

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "SUCCESS")] }]));
  ok("a SUCCESS row the run upholds passes", code === 0 && out.includes("1 upheld"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "JOURNEY", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [] }]));
  ok("[MKT.SCRIPTS.54] a row whose tier no run spoke for is counted, never judged", code === 0 && out.includes("1 at a tier no run spoke for"), out);
}

{
  const { code } = run(repo([
    ["IAM.LOGIN.01", "CONTRACT", "MANUAL"], ["IAM.LOGIN.02", "CONTRACT", "PLANNED"],
    ["IAM.LOGIN.03", "CONTRACT", "PENDING"], ["IAM.LOGIN.04", "CONTRACT", "FAILED"],
  ], [{ tier: "CONTRACT", results: [] }]));
  ok("MANUAL, PLANNED, PENDING and FAILED rows are each a row honest about itself", code === 0, `exit ${code}`);
}

{
  const { out, code } = run(repo([], []));
  ok("a tree with no rows and no runs says it read nothing", code === 0 && out.includes("0 row(s)") && out.includes("0 run(s) read"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviour-proof` : `\n  all ${total} passed — behaviour-proof`);
process.exit(failed ? 1 : 0);
