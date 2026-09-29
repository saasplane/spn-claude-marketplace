// `commands/coverage/check.ts` — thin: it picks the target's stack and forwards argv to that
// stack's own `scan()`. The scan logic itself is `providers/ts/scripts/checks/_tests/coverage-excludes.ts`'s
// own suite (`tests/unit/providers/ts/checks/_tests/t-coverage-excludes.mjs`), unchanged and not repeated here.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// RUN THROUGH THE CLI, NOT THE COMMAND FILE DIRECTLY. A command exports `{ describe, run }` for
// the dispatcher to call; it carries no invocation guard of its own, the same as any other module
// `cli.ts` lazy-imports.
const CLI = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src", "scripts", "cli.ts");
const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

function run(...args) {
  try {
    return { out: execFileSync("node", [CLI, "coverage", "check", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

console.log("=== coverage check command — the stack pick");

{
  const root = mkdtempSync(join(tmpdir(), "check-command-"));
  kept.push(root);
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "TS" } }));
  writeFileSync(join(root, "jest.config.cjs"),
    "module.exports = {\n  displayName: 'x',\n  coverageDirectory: 'cov',\n  coveragePathIgnorePatterns: [\n    '/src/hard/',\n  ],\n};\n");
  const { out, code } = run(root);
  ok("a TS project's own sprepo.json is found, and the TS scan answers", out.includes("carries no comment giving its reason"), out);
  ok("a finding is a non-zero exit, same as the tool it forwards to", code === 1, out);
}

{
  const root = mkdtempSync(join(tmpdir(), "check-command-clean-"));
  kept.push(root);
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "TS" } }));
  writeFileSync(join(root, "jest.config.cjs"),
    "module.exports = {\n  displayName: 'x',\n  coverageDirectory: 'cov',\n  coveragePathIgnorePatterns: [\n    '/src/ok/',  // a vendor round trip\n  ],\n};\n");
  const { out, code } = run(root);
  ok("a reasoned exclude is silent, and exits clean", code === 0 && out.includes("0 finding(s)"), out);
}

{
  const root = mkdtempSync(join(tmpdir(), "check-command-nostack-"));
  kept.push(root);
  const { out, code } = run(root);
  ok("no sprepo.json at or above the target is refused, never guessed at", code === 1 && out.includes("no stack declared"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — coverage check command` : `\n  all ${total} passed — coverage check command`);
process.exit(failed ? 1 : 0);
