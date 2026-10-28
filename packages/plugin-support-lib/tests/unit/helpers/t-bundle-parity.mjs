// Fixture proof for `../../helpers/bundle-parity.mjs`: a bundle that genuinely matches its source
// agrees on stdout, stderr and exit code, and a bundle whose output differs from its source — the
// defect `02-shape.md` § What it makes checkable names as "a bundler default that shifted" — is
// caught. B3c-2's per-plugin `tests/unit/dist/t-bundle-parity.mjs` calls the same helper against the
// real plugins; this proves the helper itself.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { compareRun } from "../../helpers/bundle-parity.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== bundle parity — a bundle built from its own source agrees, on a clean exit and a failing one");
{
  const root = mkdtempSync(join(tmpdir(), "parity-fixture-"));
  try {
    const source = join(root, "echo.ts");
    writeFileSync(source,
      'const [a] = process.argv.slice(2);\n' +
      'console.log(`stdout:${a}`);\n' +
      'console.error(`stderr:${a}`);\n' +
      'if (a === "fail") process.exit(3);\n', "utf8");
    const bundle = join(root, "echo.mjs");
    await esbuild.build({
      entryPoints: [source], outfile: bundle, bundle: true, platform: "node", format: "esm", target: "node22",
    });

    const clean = compareRun(source, bundle, { argv: ["hello"] });
    ok("a matching bundle agrees on stdout, stderr and a zero exit", clean.parity === true, JSON.stringify(clean));

    const failing = compareRun(source, bundle, { argv: ["fail"] });
    ok("a matching bundle also agrees on a non-zero exit", failing.parity === true, JSON.stringify(failing));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== bundle parity — a bundle whose output differs from its source is caught");
{
  const root = mkdtempSync(join(tmpdir(), "parity-drift-"));
  try {
    const source = join(root, "drift.ts");
    writeFileSync(source, 'console.log("source says A");\n', "utf8");
    // Stands in for the real defect — a stray transform or a bundler default that shifted during a
    // rebuild — by writing a bundle that plainly does not answer what its source does.
    const bundle = join(root, "drift.mjs");
    writeFileSync(bundle, 'console.log("bundle says B");\n', "utf8");

    const result = compareRun(source, bundle, {});
    ok("a drifted bundle's stdout does not match its source", result.source.stdout !== result.bundle.stdout);
    ok("parity is false", result.parity === false, JSON.stringify(result));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== bundle parity — a bundle that exits differently from its source is caught");
{
  const root = mkdtempSync(join(tmpdir(), "parity-exit-drift-"));
  try {
    const source = join(root, "exit.ts");
    writeFileSync(source, 'console.log("same text");\nprocess.exit(1);\n', "utf8");
    const bundle = join(root, "exit.mjs");
    writeFileSync(bundle, 'console.log("same text");\nprocess.exit(0);\n', "utf8");

    const result = compareRun(source, bundle, {});
    ok("identical stdout is not enough on its own", result.source.stdout === result.bundle.stdout);
    ok("a differing exit code is still caught", result.parity === false, JSON.stringify(result));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — bundle parity` : `\n  all ${total} passed — bundle parity`);
process.exit(failed ? 1 : 0);
