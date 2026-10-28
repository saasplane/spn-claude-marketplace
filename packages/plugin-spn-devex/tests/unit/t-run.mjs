// The plugin test runner (tests/run.mjs) counts the cases a suite skips. It runs a folder of fixture
// suites through SPN_RUN_SUITES, since the runner cannot run itself.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const RUN = resolve(import.meta.dirname, "..", "run.mjs");
let n = 0, failed = 0;
function one(label, ok, detail = "") {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`); }
  else console.log(`  PASS  ${label}`);
}
function runner(files) {
  const dir = mkdtempSync(join(tmpdir(), "spn-run-"));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  try {
    return { out: execFileSync(process.execPath, [RUN], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, SPN_RUN_SUITES: dir } }), code: 0 };
  } catch (e) { return { out: String(e.stdout ?? ""), code: e.status ?? 1 }; }
}

console.log("\n=== the runner counts skipped cases, wherever the line falls");
{
  const skips = runner({
    "t-skips.mjs": 'console.log("  SKIP 20 no browser here");\nconsole.log("  PASS  a");\nconsole.log("\\n  all 5 passed");\n',
    "t-plain.mjs": 'console.log("\\n  all 3 passed");\n',
  });
  one("a SKIP line before the last line is counted in the suite's row", /ok\s+t-skips\.mjs\s+5 passed · 20 skipped: no browser here/.test(skips.out), skips.out);
  one("a suite that skips nothing keeps its own last line", /ok\s+t-plain\.mjs\s+all 3 passed/.test(skips.out), skips.out);
  one("the totals name the skipped cases and the suites that skipped", /2 suite\(s\) · 8 case\(s\) passed · 20 skipped in 1 suite\(s\)/.test(skips.out) && !skips.out.includes("all passing"), skips.out);
  one("a run with a skip still exits 0", skips.code === 0);

  const plain = runner({ "t-plain.mjs": 'console.log("\\n  all 3 passed");\n' });
  one("with no skip the totals read as before", /1 suite\(s\) · 3 case\(s\) · all passing/.test(plain.out), plain.out);

  const red = runner({ "t-bad.mjs": 'console.log("  SKIP 2 nothing");\nconsole.log("\\n  1 of 4 FAILED");\nprocess.exit(1);\n' });
  one("red: a failing suite that also skipped still fails the run", red.code === 1 && /FAIL\s+t-bad\.mjs/.test(red.out), red.out);
}
console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
