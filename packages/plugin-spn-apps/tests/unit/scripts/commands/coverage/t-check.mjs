// `commands/coverage/check.ts` — thin: it picks the target's stack and hands its paths to that
// stack's own `scan()`. The scan logic itself is `providers/ts/scripts/checks/_tests/coverage-excludes.ts`'s
// own suite (`tests/unit/providers/ts/checks/_tests/t-coverage-excludes.mjs`), unchanged and not repeated here.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// RUN THROUGH THE CLI, NOT THE COMMAND FILE DIRECTLY. A command exports `describe`, `usage` and `run`
// for the entry to call; it carries no invocation guard of its own, the same as any other module
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

/** `coverage check` through the entry, from the folder given, with the words typed after it. */
function typed(cwd, ...args) {
  try {
    return { out: execFileSync("node", [CLI, "coverage", "check", ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}
const run = (...args) => typed(process.cwd(), ...args);

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

console.log("\n=== coverage check command — its paths, and what it refuses");

{
  const EXCLUDE = "module.exports = {\n  displayName: 'x',\n  coverageDirectory: 'cov',\n  coveragePathIgnorePatterns: [\n    '/src/hard/',\n  ],\n};\n";
  const root = mkdtempSync(join(tmpdir(), "check-command-paths-"));
  kept.push(root);
  writeFileSync(join(root, "sprepo.json"), JSON.stringify({ type: "APPS", config: { mtype: "APPS", stack: "TS" } }));
  for (const folder of ["apps/api", "apps/web"]) mkdirSync(join(root, folder), { recursive: true });
  writeFileSync(join(root, "apps", "api", "jest.config.cjs"), EXCLUDE);
  writeFileSync(join(root, "apps", "web", "jest.config.cjs"), EXCLUDE.replace("'/src/hard/',", "'/src/ok/',  // a vendor round trip"));

  const whole = typed(root, ".");
  ok("known-bad: the repository, scanned, names the exclude with no reason and exits 1", whole.code === 1 && whole.out.includes("apps/api") && whole.out.includes("carries no comment giving its reason"), whole.out);
  const narrow = typed(root, join("apps", "web"));
  ok("[MKT.SCRIPTS.181] a path names what is scanned: the folder beside it is not read", narrow.code === 0 && narrow.out.includes("0 finding(s)") && !narrow.out.includes("apps/api"), narrow.out);
  const both = typed(root, join("apps", "web"), join("apps", "api"));
  ok("[MKT.SCRIPTS.181] several paths are one run, and each is scanned", both.code === 1 && both.out.includes("apps/api"), both.out);
  const inside = typed(join(root, "apps", "web"));
  ok("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it", inside.code === 1 && inside.out.includes("apps/api"), inside.out);
  const nowhere = mkdtempSync(join(tmpdir(), "check-command-nowhere-"));
  kept.push(nowhere);
  const lost = typed(nowhere);
  ok("[MKT.SCRIPTS.113] where the caller is in no repository, the run with no path says to name one, with exit 2",
    lost.code === 2 && lost.out === "usage: spn-apps coverage check [<path>…]\n`coverage check` needs a path here, because the folder it is run from is in no repository. Name a repository.\n", lost.out);
  const option = typed(root, ".", "--stdin");
  ok("[MKT.SCRIPTS.181] an option is refused with the usage line and exit 2, and never handed to the scan as a path",
    option.code === 2 && option.out === "usage: spn-apps coverage check [<path>…]\n`coverage check` does not take `--stdin`.\n", option.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — coverage check command` : `\n  all ${total} passed — coverage check command`);
process.exit(failed ? 1 : 0);
