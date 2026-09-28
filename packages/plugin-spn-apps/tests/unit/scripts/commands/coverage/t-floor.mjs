// `commands/coverage/floor.ts` — thin: it picks the target's stack and forwards argv to that
// stack's own `cli()`. The floor logic itself is `providers/ts/scripts/lib/coverage-floor.ts`'s
// own suite (`tests/unit/providers/ts/lib/t-coverage-floor.mjs`), unchanged and not repeated here.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
    return { out: execFileSync("node", [CLI, "coverage", "floor", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

function tsProject() {
  const root = mkdtempSync(join(tmpdir(), "floor-command-"));
  kept.push(root);
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "TS" } }));
  writeFileSync(join(root, "jest.config.cjs"),
    "module.exports = {\n  displayName: 'x',\n  coverageDirectory: 'cov',\n  coverageThreshold: { global: { statements: 1, branches: 1, functions: 1, lines: 1 } },\n};\n");
  mkdirSync(join(root, "cov"), { recursive: true });
  writeFileSync(join(root, "cov", "coverage-summary.json"),
    JSON.stringify({ total: { statements: { pct: 50 }, branches: { pct: 50 }, functions: { pct: 50 }, lines: { pct: 50 } } }));
  return root;
}

console.log("=== coverage floor command — the stack pick");

{
  const root = tsProject();
  const { out, code } = run(root);
  ok("a TS project's own sprepo.json is found, and the TS tool answers", out.includes("would raise") && out.includes("jest.config.cjs"), out);
  ok("no --write leaves the file, same as the tool it forwards to", code === 0, out);
}

{
  const root = mkdtempSync(join(tmpdir(), "floor-command-nostack-"));
  kept.push(root);
  const { out, code } = run(root);
  ok("no sprepo.json at or above the project is refused, never guessed at", code === 1 && out.includes("no stack declared"), out);
}

{
  const root = mkdtempSync(join(tmpdir(), "floor-command-unknownstack-"));
  kept.push(root);
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "COBOL" } }));
  const { out, code } = run(root);
  ok("a declared stack this plugin ships no provider for is refused by name", code === 1 && out.includes("cobol"), out);
}

console.log("\n=== coverage floor command — the wiring, argv unchanged to the provider");

{
  const root = tsProject();
  const { out: before, code: beforeCode } = run(root);
  run(root, "--write");
  const { out: again, code: againCode } = run(root, "--write");
  ok("--write is forwarded, and a second run reports nothing left to raise",
     beforeCode === 0 && again.includes("0 floor(s) raised") && againCode === 0, `before: ${before}\nagain: ${again}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — coverage floor command` : `\n  all ${total} passed — coverage floor command`);
process.exit(failed ? 1 : 0);
