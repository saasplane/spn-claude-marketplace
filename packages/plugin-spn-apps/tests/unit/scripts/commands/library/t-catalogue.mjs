// `commands/library/catalogue.ts` — the one implementation (the old `scripts/tools/library-
// catalogue.ts` forwarder is gone, `N101` step 1b's path sweep). This suite proves the command.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// RUN THROUGH THE CLI, NOT THE COMMAND FILE DIRECTLY — see `commands/coverage/t-floor.mjs` for why.
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

function run(bin, ...args) {
  try {
    return { out: execFileSync("node", [bin, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

console.log("=== library catalogue command — no support checkout");

{
  const root = mkdtempSync(join(tmpdir(), "catalogue-command-"));
  kept.push(root);
  const { out, code } = run(CLI, "library", "catalogue", root);
  ok("says so and exits clean, rather than writing an empty table", code === 0 && out.includes("no support checkout here"), out);
}

console.log("\n=== library catalogue command — against the real workspace, --check only");

{
  const workspace = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "..", "..", "..");
  const { out, code } = run(CLI, "library", "catalogue", workspace, "--check");
  ok("finds the sibling support checkout and reports current or would-write, never a crash",
     code === 0 || code === 1, out);
  ok("names the count of packages, one way or the other", /\d+ package\(s\)/.test(out), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — library catalogue command` : `\n  all ${total} passed — library catalogue command`);
process.exit(failed ? 1 : 0);
