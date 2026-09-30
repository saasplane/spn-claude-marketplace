import { PLUGIN } from "../../../helpers/harness.mjs";
// `behaviour-proof` — every SUCCESS row against the run its `Updated at` cites. It changes nothing,
// so every case asserts its exit code and what it named: the failure worth fearing is a gate that
// reports green having read nothing.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { SEAT } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

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

/** A repository: a nine-cell register under docs/, and run files by node, tier and name. */
const repo = (rows, runs = []) => {
  const root = mkdtempSync(join(tmpdir(), "proof-"));
  kept.push(root);
  const write = (path, body) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body, "utf8"); };
  write("sprepo.json", '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}\n');
  write(`docs/${SEAT.behaviors}/login.md`, [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at | Realizes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, tier, status, type = "POSITIVE", at = CITED]) => `| ${id} | a person | signs in | in | ${type} | ${tier} | ${status} | ${at} | account |`),
    "",
  ].join("\n"));
  for (const { node = "apps/api", tier, name = "r1", phase = null, results, raw, ranAt = "2026-09-28T09:00:00Z" } of runs) {
    write(`${node}/tests/.output/${tier.toLowerCase()}/runs/${phase === null ? name : `${name}.${phase.toLowerCase()}`}.json`,
      raw ?? JSON.stringify({ run: name, tier, phase, ranAt, env: "local", results }));
  }
  return root;
};

const run = (root) => {
  try { return { out: execFileSync("node", [TOOL, "."], { cwd: root, encoding: "utf8" }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};

/** What the stamp writes into `Updated at` after run r1. */
const CITED = "2026-09-28T09:00:00Z · r1";

const result = (id, tier, status) => ({ id, tier, status, title: `${id} a person signs in`, detail: null });

console.log("=== behaviour-proof — known-bad: a claim the run contradicts");

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED")] }]));
  ok("[MKT.SCRIPTS.53] a SUCCESS row the run found FAILED is refused", code === 1, `exit ${code}`);
  ok("[MKT.SCRIPTS.53] and the refusal names the row, the finding and the run file",
     out.includes("IAM.LOGIN.01") && out.includes("FAILED") && out.includes("apps/api/tests/.output/contract/runs/r1.json"), out);
}

{
  const { code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "PENDING")] }]));
  ok("[MKT.SCRIPTS.53] a SUCCESS row the run could not reach is refused", code === 1, `exit ${code}`);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.OTHER.01", "CONTRACT", "SUCCESS")] }]));
  ok("a SUCCESS row the run it cites did not name is refused as stale", code === 1 && out.includes("did not name it"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "UNIT", results: [result("IAM.LOGIN.01", "UNIT", "SUCCESS")] },
     { tier: "CONTRACT", results: [] }]));
  ok("a row proven at another tier than it declares is refused", code === 1 && out.includes("proven at UNIT"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", raw: "{ not json" }]));
  ok("a malformed file of a cited run is refused by name", code === 1 && out.includes("not parseable"), out);
}


console.log("\n=== behaviour-proof — the run a row cites, and no other");

{
  // The row cites r1, which passed it; a newer run r2 failed it. The row is judged by r1 alone.
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]], [
    { tier: "CONTRACT", name: "r1", results: [result("IAM.LOGIN.01", "CONTRACT", "SUCCESS")] },
    { tier: "CONTRACT", name: "r2", ranAt: "2026-09-29T09:00:00Z", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED")] },
  ]));
  ok("[MKT.SCRIPTS.76] a row is upheld by the run it cites, whatever a newer run found", code === 0 && out.includes("1 upheld"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS", "POSITIVE", "2026-09-29T09:00:00Z · r2"]], [
    { tier: "CONTRACT", name: "r1", results: [result("IAM.LOGIN.01", "CONTRACT", "SUCCESS")] },
    { tier: "CONTRACT", name: "r2", ranAt: "2026-09-29T09:00:00Z", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED")] },
  ]));
  ok("[MKT.SCRIPTS.76] a row citing the run that failed it is refused, whatever an older run found",
     code === 1 && out.includes("r2") && out.includes("FAILED"), out);
}

{
  // A phase file of the cited run speaks for the row too.
  const { out, code } = run(repo([["IAM.LOGIN.01", "JOURNEY", "SUCCESS"]], [
    { node: "apps/web", tier: "JOURNEY", name: "r1", phase: "SERIALIZED", results: [result("IAM.LOGIN.01", "JOURNEY", "SUCCESS")] },
  ]));
  ok("[MKT.SCRIPTS.76] the cited run's phase file is read beside its own", code === 0 && out.includes("1 upheld"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS", "POSITIVE", "2026-09-28T09:00:00Z"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED")] }]));
  ok("a row whose Updated at names no run is counted, never judged against a run it does not cite",
     code === 0 && out.includes("1 citing no run"), out);
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
  ok("[MKT.SCRIPTS.54] a row whose cited run left no file at its tier is counted, never judged",
     code === 0 && out.includes("1 citing a run not on disk"), out);
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
  ok("a tree with no rows and no runs says it read nothing", code === 0 && out.includes("0 row(s)") && out.includes("0 run file(s) read"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviour-proof` : `\n  all ${total} passed — behaviour-proof`);
process.exit(failed ? 1 : 0);
