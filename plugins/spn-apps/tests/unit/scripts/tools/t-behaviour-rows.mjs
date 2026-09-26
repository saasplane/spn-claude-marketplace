import { PLUGIN } from "../../../helpers/harness.mjs";
// `behaviour-rows` — writing what a run found into the rows, and nothing else.
//
// The other suites here test CHECKS, which read and give a verdict. This one tests a tool that
// REWRITES documents, so the bar is higher: every case asserts what changed AND that nothing else
// did, because the failure worth fearing is a cell quietly moved in a file nobody was looking at.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const TOOL = resolve(PLUGIN, "src", "scripts", "tools", "behaviour-rows.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const REGISTER = [
  "# Signing in",
  "",
  "| Id | Who | Does | Sees | Type | Tier | Status | Updated at |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  "| `IAM.LOGIN.01` | a person | signs in | the home page | POSITIVE | CONTRACT | SUCCESS | 2026-09-19T04:12:08Z |",
  "| `IAM.LOGIN.02` | a person | asks for a code | the home page | POSITIVE | CONTRACT | PLANNED |  |",
  "| `IAM.LOGIN.03` | a person | uses a passkey | the home page | POSITIVE | JOURNEY | SUCCESS | 2026-09-19T04:31:22Z |",
  "| `IAM.LOGIN.04` | a person | checks by hand | a page | POSITIVE | CONTRACT | MANUAL | 2026-09-14T10:00:00Z |",
  "",
].join("\n");

const stand = (results, tiers = ["CONTRACT"], ranAt = "2026-09-20T09:00:00Z") => {
  const root = mkdtempSync(join(tmpdir(), "rows-"));
  kept.push(root);
  const doc = join(root, "docs", "03-behaviors", "login.md");
  mkdirSync(dirname(doc), { recursive: true });
  writeFileSync(doc, REGISTER, "utf8");
  const artifact = join(root, "apps", "api", "tests", ".output", "contract", "spn-tests.json");
  mkdirSync(dirname(artifact), { recursive: true });
  writeFileSync(artifact, JSON.stringify({ env: "local", tiers, ranAt, results }), "utf8");
  return { root, doc };
};

const run = (root, ...args) => {
  try { return execFileSync("node", [TOOL, ...args, "."], { cwd: root, encoding: "utf8" }); }
  catch (e) { return `${e.stdout ?? ""}${e.stderr ?? ""}`; }
};

/** One row's Tier, Status and Updated at, so a case asserts cells rather than substrings. */
const cells = (doc, id) => {
  const line = readFileSync(doc, "utf8").split("\n").find((l) => l.includes(`\`${id}\``));
  const c = line.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
  return { tier: c[5], status: c[6], at: c[7], width: c.length };
};

const PASSED = [{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "SUCCESS", title: "t", detail: null }];

console.log("=== behaviour-rows — what it writes");

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" }]);
  run(root, "--write");
  ok("a run's finding reaches the row", cells(doc, "IAM.LOGIN.01").status === "FAILED");
  ok("and stamps the run's own instant", cells(doc, "IAM.LOGIN.01").at === "2026-09-20T09:00:00Z");
  ok("a row of another tier is untouched", cells(doc, "IAM.LOGIN.03").at === "2026-09-19T04:31:22Z");
  ok("the row keeps its eight cells", cells(doc, "IAM.LOGIN.01").width === 8);
}

{
  // Two cases citing one id: the row takes the worst, because a behaviour with a failing proof is
  // not proven — and which one wins may not depend on the order they were written in.
  const { root, doc } = stand([
    { id: "IAM.LOGIN.01", tier: "CONTRACT", status: "SUCCESS", title: "a", detail: null },
    { id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "b", detail: "x" },
  ]);
  run(root, "--write");
  ok("two cases on one id take the worst", cells(doc, "IAM.LOGIN.01").status === "FAILED");
}

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.04", tier: "CONTRACT", status: "SUCCESS", title: "t", detail: null }]);
  run(root, "--write", "--reach", "repository");
  // The one intent no evidence can recover, so the one value the agent never writes.
  ok("MANUAL is never written over", cells(doc, "IAM.LOGIN.04").status === "MANUAL");
}

console.log("=== behaviour-rows — what it refuses to assume");

{
  const { root, doc } = stand(PASSED);
  run(root, "--write");
  // Silence is not evidence of absence: this artifact is one node's, and the register is the
  // repository's, so a row it did not name may be proven by a node that has not run.
  ok("without a stated reach, an unnamed row is left alone", cells(doc, "IAM.LOGIN.02").status === "PLANNED");
}

{
  const { root, doc } = stand(PASSED);
  run(root, "--write", "--reach", "repository");
  ok("with the reach stated, an unnamed row goes back to PLANNED", cells(doc, "IAM.LOGIN.02").status === "PLANNED");
  // The other half of the same sweep: a row the run DID name keeps what the run found, rather than
  // being swept back with the ones nothing cited.
  ok("a row the run named keeps what the run found", cells(doc, "IAM.LOGIN.01").status === "SUCCESS");
  ok("a JOURNEY row survives a CONTRACT run of the whole repository",
     cells(doc, "IAM.LOGIN.03").status === "SUCCESS");
}

{
  const { root, doc } = stand([], ["CONTRACT"]);
  run(root, "--write", "--reach", "repository");
  ok("a tier that ran and matched nothing resets its rows", cells(doc, "IAM.LOGIN.01").status === "PLANNED");
  ok("and clears the instant with it", cells(doc, "IAM.LOGIN.01").at === "");
}

console.log("=== behaviour-rows — what it reports");

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "SUCESS", title: "t", detail: null }]);
  const out = run(root);
  ok("a malformed status is a named finding", out.includes("SUCESS") && out.includes("IAM.LOGIN.01"));
  ok("and nothing is applied from it", cells(doc, "IAM.LOGIN.01").status === "SUCCESS");
}

{
  const { root, doc } = stand([{ id: "IAM.LOGIN.01", tier: "CONTRACT", status: "FAILED", title: "t", detail: "x" }]);
  const out = run(root);
  ok("a dry run says what it would change", out.includes("would change") && out.includes("SUCCESS → FAILED"));
  ok("and changes nothing", cells(doc, "IAM.LOGIN.01").status === "SUCCESS");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — behaviour-rows` : `\n  all ${total} passed — behaviour-rows`);
process.exit(failed ? 1 : 0);
