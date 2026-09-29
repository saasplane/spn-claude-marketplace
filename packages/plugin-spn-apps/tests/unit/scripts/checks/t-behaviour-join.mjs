import { PLUGIN } from "../../../helpers/harness.mjs";
// `behaviour-join` — both directions of the join: a SUCCESS row a case cites, and a case citing a
// row that exists. It changes nothing, so every case asserts its exit code and what it named.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const TOOL = resolve(PLUGIN, "src", "scripts", "checks", "behaviour-join.ts");
// The behaviours seat of a repository's docs tree, as spn-foundation
// docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § The five seats names it. This
// plugin does not import spn-devex's `lib/docs-tree.ts`, so the seat is stated once here instead.
const BEHAVIORS_SEAT = join("docs", "03-behaviors");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const repo = (rows, files = {}, stack = "TS") => {
  const root = mkdtempSync(join(tmpdir(), "join-"));
  kept.push(root);
  const all = {
    "sprepo.json": JSON.stringify({ type: "APPS", config: { mtype: "APPS", ...(stack ? { stack } : {}) } }),
    "apps/api/spkind.json": '{"kind":"APP_SERVER","config":{"mtype":"APP_SERVER","code":"api"}}',
    [join(BEHAVIORS_SEAT, "login.md")]: [
      "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...rows.map(([id, status]) => `| ${id} | a person | signs in | in | POSITIVE | CONTRACT | ${status} | — |`),
      "",
    ].join("\n"),
    ...files,
  };
  for (const [path, body] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  return root;
};

const run = (root, ...args) => {
  try { return { out: execFileSync("node", [TOOL, ...args, "."], { cwd: root, encoding: "utf8" }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};

const spec = (title) => `describe('login', () => {\n  it('${title}', async () => {});\n});\n`;
const CASE = "apps/api/tests/integration/login.int.spec.ts";

console.log("=== behaviour-join — known-bad, both directions");

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "SUCCESS"]]));
  ok("[MKT.SCRIPTS.52] a SUCCESS row no case cites is a finding", code === 1 && out.includes("IAM.LOGIN.01 reads SUCCESS and no case cites it"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "PLANNED"]], { [CASE]: spec("[IAM.GHOST.09] a case citing nothing") }));
  ok("[MKT.SCRIPTS.52] a case citing an id no row declares is a finding", code === 1 && out.includes("IAM.GHOST.09") && out.includes(CASE), out);
}

{
  const { code } = run(repo([["IAM.LOGIN.01", "SUCCESS"]]), "--report");
  ok("--report prints the finding and exits 0", code === 0, `exit ${code}`);
}

console.log("\n=== behaviour-join — what it passes");

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "SUCCESS"]], { [CASE]: spec("[IAM.LOGIN.01] a person signs in") }));
  ok("a SUCCESS row a case cites, and a case citing a declared row, pass", code === 0 && out.includes("1 id(s) cited"), out);
}

{
  const { code } = run(repo([["IAM.LOGIN.01", "SUCCESS"]], {
    [CASE]: "it.skip('[IAM.LOGIN.01] a person signs in', () => {});\n",
  }));
  ok("a skipped case does not cite the row it names", code === 1, `exit ${code}`);
}

{
  const { code } = run(repo([["IAM.LOGIN.01", "PLANNED"]], {
    [join(BEHAVIORS_SEAT, "other.md")]: "| Id | Behaviour | Status |\n| --- | --- | --- |\n| STK.CLI.01 | scaffold | ✅ |\n",
    [CASE]: spec("[STK.CLI.01] a scaffolded module validates"),
  }));
  ok("an id declared in a table of another shape still counts as declared", code === 0, `exit ${code}`);
}

{
  const { out } = run(repo([["IAM.LOGIN.01", "PLANNED"]], { [CASE]: spec("[IAM.GHOST.09] x") }, "PY"));
  ok("a stack with no case reader says only the rows were read", out.includes("no case reader for the py stack"), out);
}

{
  const { out, code } = run(repo([["IAM.LOGIN.01", "PLANNED"]], {
    "packages/toolchain-ts/spkind.json": '{"kind":"TOOLCHAIN"}',
    "packages/toolchain-ts/tests/unit/bin/spn-test.spec.mjs": spec("IAM.GHOST.09 a sample title proving the runner, not a behaviour"),
  }));
  ok("[MKT.SCRIPTS.52] a case under a TOOLCHAIN-kind node is not join evidence — it proves the toolchain, not a behaviour",
     code === 0 && !out.includes("IAM.GHOST.09"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviour-join` : `\n  all ${total} passed — behaviour-join`);
process.exit(failed ? 1 : 0);
