import { PLUGIN } from "../../../../helpers/harness.mjs";
// The floor script — raises each floor in a project's own configuration to what a run measured,
// rounded down and dated, and never lowers one. It rewrites files, so every case asserts what
// changed and that nothing else did.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const TOOL = resolve(PLUGIN, "src", "providers", "ts", "scripts", "tools", "coverage-floor.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const MEASURED_ON = new Date("2026-09-28T06:00:00Z");

/** A project with its configurations and, per coverage directory, a summary dated MEASURED_ON. */
const project = (files, summaries) => {
  const root = mkdtempSync(join(tmpdir(), "floor-"));
  kept.push(root);
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body, "utf8");
  }
  for (const [dir, [s, b, f, l]] of Object.entries(summaries)) {
    const at = join(root, dir, "coverage-summary.json");
    mkdirSync(dirname(at), { recursive: true });
    writeFileSync(at, JSON.stringify({ total: { statements: { pct: s }, branches: { pct: b }, functions: { pct: f }, lines: { pct: l } } }), "utf8");
    utimesSync(at, MEASURED_ON, MEASURED_ON);
  }
  return root;
};

const run = (root, ...args) => {
  try { return execFileSync("node", [TOOL, ...args, root], { encoding: "utf8", cwd: root }); }
  catch (error) { return `${error.stdout ?? ""}${error.stderr ?? ""}`; }
};

const JEST_WITH = (s, b, f, l) =>
  `module.exports = {\n  displayName: 'x',\n  coverageDirectory: 'cov',\n  coverageThreshold: {\n    global: {\n      branches: ${b},\n      functions: ${f},\n      lines: ${l},\n      statements: ${s},\n    },\n  },\n};\n`;

console.log("=== coverage-floor — raising");

{
  const root = project({ "jest.config.cjs": JEST_WITH(10, 10, 10, 10) }, { cov: [43.77, 36.48, 42.4, 42.54] });
  run(root, "--write");
  const text = readFileSync(join(root, "jest.config.cjs"), "utf8");
  ok("[MKT.PROVIDERS.28] each number rises to the measured value, rounded down",
     /statements: 43,/.test(text) && /branches: 36,/.test(text) && /functions: 42,/.test(text) && /lines: 42,/.test(text), text);
  ok("[MKT.PROVIDERS.28] with the date of the measurement in a comment above the floor",
     text.includes("// Coverage floor measured 2026-09-28 by the spn-apps floor script") &&
     text.indexOf("Coverage floor measured") < text.indexOf("coverageThreshold"), text);
  ok("and the rest of the configuration is as it was", text.includes("displayName: 'x'") && text.includes("coverageDirectory: 'cov'"));
  const again = run(root, "--write");
  ok("a second run over the same measurement changes nothing", again.includes("0 floor(s) raised") && readFileSync(join(root, "jest.config.cjs"), "utf8") === text, again);
  ok("and the dated comment is not written twice", text.split("Coverage floor measured").length === 2);
}

{
  const root = project({ "jest.config.cjs": "module.exports = {\n  displayName: 'x',\n  coverageDirectory: 'cov',\n};\n" }, { cov: [55.5, 40.1, 50.9, 54.2] });
  run(root, "--write");
  const text = readFileSync(join(root, "jest.config.cjs"), "utf8");
  ok("[MKT.PROVIDERS.28] a Jest configuration with no floor gains one", /coverageThreshold:\s*\{\s*global:\s*\{\s*statements: 55,\s*branches: 40,\s*functions: 50,\s*lines: 54,/.test(text), text);
}

{
  const root = project({ "vitest.config.ts": "export default defineWebVitestConfig('x', {\n  coverageDirectory: 'cov',\n  test: {\n    coverage: {\n      provider: 'v8',\n    },\n  },\n});\n" }, { cov: [61.2, 50, 58.7, 60.9] });
  run(root, "--write");
  const text = readFileSync(join(root, "vitest.config.ts"), "utf8");
  ok("[MKT.PROVIDERS.28] a Vitest coverage block gains thresholds", /thresholds:\s*\{\s*statements: 61,\s*branches: 50,\s*functions: 58,\s*lines: 60,/.test(text), text);
}

console.log("\n=== coverage-floor — never lowering");

{
  const before = JEST_WITH(80, 80, 80, 80);
  const root = project({ "jest.config.cjs": before }, { cov: [43.77, 36.48, 42.4, 42.54] });
  const out = run(root, "--write");
  ok("[MKT.PROVIDERS.29] a measurement under the floor leaves it as it was", readFileSync(join(root, "jest.config.cjs"), "utf8") === before);
  ok("[MKT.PROVIDERS.29] and says the run falls below it", out.includes("falls below the floor") && out.includes("statements 43.77 under 80"), out);
}

{
  const root = project({ "jest.config.cjs": JEST_WITH(40, 50, 40, 40) }, { cov: [43.77, 36.48, 42.4, 42.54] });
  run(root, "--write");
  const text = readFileSync(join(root, "jest.config.cjs"), "utf8");
  ok("[MKT.PROVIDERS.29] a measure under its floor stays while the others rise", /branches: 50,/.test(text) && /statements: 43,/.test(text), text);
}

console.log("\n=== coverage-floor — what it refuses to guess");

{
  const root = project({ "jest.config.cjs": JEST_WITH(1, 1, 1, 1), "jest.config.integration.cjs": JEST_WITH(1, 1, 1, 1) }, { cov: [50, 50, 50, 50] });
  const out = run(root, "--write");
  ok("two configurations sharing a coverage directory are left alone, and it says why", out.includes("cannot be told apart") && readFileSync(join(root, "jest.config.cjs"), "utf8") === JEST_WITH(1, 1, 1, 1), out);
}

{
  const root = project({ "jest.config.cjs": JEST_WITH(1, 1, 1, 1), "playwright.config.ts": "export default {};\n" }, {});
  const out = run(root);
  ok("a configuration with no measurement says to run the tier with coverage", out.includes("no coverage-summary.json"), out);
  ok("and a Playwright configuration is never named", !out.includes("playwright.config.ts"), out);
}

{
  const root = project({ "jest.config.cjs": JEST_WITH(10, 10, 10, 10) }, { cov: [43.77, 36.48, 42.4, 42.54] });
  const out = run(root);
  ok("without --write it says what it would raise and writes nothing", out.includes("would raise") && readFileSync(join(root, "jest.config.cjs"), "utf8") === JEST_WITH(10, 10, 10, 10), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — coverage-floor script` : `\n  all ${total} passed — coverage-floor script`);
process.exit(failed ? 1 : 0);
