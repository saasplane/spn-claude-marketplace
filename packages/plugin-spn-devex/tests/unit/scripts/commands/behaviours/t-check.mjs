import { PLUGIN } from "../../../../helpers/harness.mjs";
// `behaviours check` — the CLI door onto `checks/behaviour-proof.ts`'s own judgment. The judging
// logic's cases live at `tests/unit/scripts/checks/t-behaviour-proof.mjs`, unmoved, because that
// check still runs directly from a PostToolUse hook; this proves the wiring — the command reaches
// the same judge, prints the same summary shape and exits the same way — not the judgment itself.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { SEAT } from "../../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
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
  write(`docs/${SEAT.behaviors}/login.md`, [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at | Realizes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(([id, tier, status, type = "POSITIVE"]) => `| ${id} | a person | signs in | in | ${type} | ${tier} | ${status} | 2026-09-28T09:00:00Z · r1 | account |`),
    "",
  ].join("\n"));
  for (const { node = "apps/api", tier, results } of runs) {
    write(`${node}/tests/.output/${tier.toLowerCase()}/runs/r1.json`,
      JSON.stringify({ run: "r1", tier, phase: null, ranAt: "2026-09-28T09:00:00Z", env: "local", results }));
  }
  return root;
};

/** `behaviours check` through the entry, from the folder given, with the words typed after it. */
const typed = (cwd, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "behaviours", "check", ...words], { cwd, encoding: "utf8", stdio: "pipe", env: ENV }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
const run = (root) => typed(root, ".");

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
  // A repository's one root journey run writes its file at the root or under the node that invoked it; both are read.
  const { out, code } = run(repo([["IAM.LOGIN.01", "JOURNEY", "SUCCESS"]],
    [{ node: ".", tier: "JOURNEY", results: [result("IAM.LOGIN.01", "JOURNEY", "FAILED")] }]));
  ok("[MKT.SCRIPTS.76] a root journey run's file is read and judged like any node's", code === 1 && out.includes("IAM.LOGIN.01") && out.includes("1 run file(s) read"), out);
}

{
  const { out, code } = run(repo([], []));
  ok("a tree with no rows and no runs says it read nothing", code === 0 && out.includes("0 row(s)") && out.includes("0 run file(s) read"), out);
}

console.log("\n=== behaviours check — the path, and what the command refuses");

{
  const upheld = { tier: "CONTRACT", results: [result("IAM.LOGIN.01", "CONTRACT", "FAILED"), result("PAY.CARD.01", "CONTRACT", "SUCCESS")] };
  const root = repo([["IAM.LOGIN.01", "CONTRACT", "SUCCESS"]], [upheld]);
  const pay = join(root, "docs", SEAT.behaviors, "pay");
  mkdirSync(pay, { recursive: true });
  writeFileSync(join(pay, "card.md"), [
    "| Id | Who | Does | Sees | Type | Tier | Status | Updated at | Realizes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| PAY.CARD.01 | a person | pays | a receipt | POSITIVE | CONTRACT | SUCCESS | 2026-09-28T09:00:00Z · r1 | card |",
    "",
  ].join("\n"), "utf8");

  const whole = typed(root, ".");
  ok("known-bad: the repository, checked, refuses the row the run found FAILED", whole.code === 1 && whole.out.includes("IAM.LOGIN.01") && whole.out.includes("2 SUCCESS row(s)"), whole.out);
  const narrow = typed(root, join("docs", SEAT.behaviors, "pay"));
  ok("[MKT.SCRIPTS.165] a run narrowed to a folder judges the rows of the registers under it, and none beside it",
    narrow.code === 0 && narrow.out.includes("1 SUCCESS row(s) · 1 upheld") && !narrow.out.includes("IAM.LOGIN.01"), narrow.out);
  ok("[MKT.SCRIPTS.165] and it reads the cited run from the repository, not from the folder", narrow.out.includes("1 run file(s) read"), narrow.out);
  const inside = typed(pay);
  ok("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it too",
    inside.code === 1 && inside.out.includes("IAM.LOGIN.01") && inside.out.includes("2 SUCCESS row(s)"), inside.out);

  const nowhere = mkdtempSync(join(tmpdir(), "behaviours-check-nowhere-"));
  kept.push(nowhere);
  const lost = typed(nowhere);
  ok("[MKT.SCRIPTS.113] where the caller is in no repository, the run with no path says to name one, with exit 2",
    lost.code === 2 && lost.out === "usage: spn-devex behaviours check [<path>]\n`behaviours check` needs a path here, because the folder it is run from is in no repository. Name a repository.\n", lost.out);
  const option = typed(root, ".", "--json");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2", option.code === 2 && option.out.includes("`behaviours check` does not take `--json`."), option.out);
  const two = typed(root, ".", "docs");
  ok("a second path is refused with exit 2", two.code === 2 && two.out.includes("takes one path."), two.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviours check` : `\n  all ${total} passed — behaviours check`);
process.exit(failed ? 1 : 0);
