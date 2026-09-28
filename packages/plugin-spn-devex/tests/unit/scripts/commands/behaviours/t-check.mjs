import { PLUGIN } from "../../../../helpers/harness.mjs";
// `behaviours check` — the CLI door onto `checks/behaviour-proof.ts`'s own judgment. The judging
// logic's cases live at `tests/unit/scripts/checks/t-behaviour-proof.mjs`, unmoved, because that
// check still runs directly from a PostToolUse hook; this proves the wiring — the command reaches
// the same judge, prints the same summary shape and exits the same way — not the judgment itself.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const TOOL = resolve(PLUGIN, "src", "scripts", "commands", "behaviours", "check.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const repo = (rows, runs = []) => {
  const root = mkdtempSync(join(tmpdir(), "behaviours-check-"));
  kept.push(root);
  const write = (path, body) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body, "utf8"); };
  write("sprepo.json", '{"type":"APPS","config":{"mtype":"APPS","stack":"TS"}}\n');
  write("docs/03-behaviors/login.md", [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at | Realizes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, tier, status, type = "POSITIVE"]) => `| ${id} | a person | signs in | in | ${type} | ${tier} | ${status} | — | account |`),
    "",
  ].join("\n"));
  for (const { node = "apps/api", tier, results } of runs) {
    write(`${node}/tests/.output/${tier.toLowerCase()}/spn-tests.json`,
      JSON.stringify({ env: "local", tiers: [tier], ranAt: "2026-09-28T09:00:00Z", results }));
  }
  return root;
};

const run = (root) => {
  try { return { out: execFileSync("node", [TOOL, "."], { cwd: root, encoding: "utf8" }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};

const result = (id, tier, status) => ({ id, tier, status, title: `${id} a person signs in`, detail: null });

console.log("=== behaviours check — reaches the same judge as checks/behaviour-proof.ts");

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED")] }]));
  ok("a SUCCESS row the run found FAILED is refused, same as the check alone", code === 1 && out.includes("IAM.LOGIN.01") && out.includes("FAILED"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]],
    [{ tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "SUCCESS")] }]));
  ok("a SUCCESS row the run upholds passes", code === 0 && out.includes("1 upheld"), out);
}

{
  const { out, code } = run(repo([], []));
  ok("a tree with no rows and no runs says it read nothing", code === 0 && out.includes("0 row(s)") && out.includes("0 run(s) read"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviours check` : `\n  all ${total} passed — behaviours check`);
process.exit(failed ? 1 : 0);
