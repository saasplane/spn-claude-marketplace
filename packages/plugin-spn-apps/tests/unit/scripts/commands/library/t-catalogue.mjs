// `commands/library/catalogue.ts` — the one implementation of the published-library table. This
// suite proves the command: `check` and `write`, each typed with the workspace.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// RUN THROUGH THE CLI, NOT THE COMMAND FILE DIRECTLY — see `commands/coverage/t-check.mjs` for why.
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
    return { out: execFileSync("node", [bin, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

console.log("=== library catalogue command — no support checkout");

{
  const root = mkdtempSync(join(tmpdir(), "catalogue-command-"));
  kept.push(root);
  for (const action of ["check", "write"]) {
    const { out, code } = run(CLI, "library", "catalogue", action, root);
    ok(`\`${action}\` says so and exits clean, rather than writing an empty table`, code === 0 && out.includes("no support checkout here"), out);
  }
}

console.log("\n=== library catalogue command — the action is a word, and both actions need the workspace");

{
  const USAGE = "usage: spn-apps library catalogue check <workspace>\n       spn-apps library catalogue write <workspace>\n";
  const root = mkdtempSync(join(tmpdir(), "catalogue-command-"));
  kept.push(root);
  const none = run(CLI, "library", "catalogue");
  ok("[MKT.SCRIPTS.111] with no action the entry prints each usage line and says an action is owed", none.code === 2 && none.out === USAGE + "`library catalogue` needs an action.\n", none.out);
  const flag = run(CLI, "library", "catalogue", root, "--check");
  ok("[MKT.SCRIPTS.111] a workspace where the action belongs is refused, and `--check` is named as the action `check`",
    flag.code === 2 && flag.out === USAGE + "`library catalogue` needs an action. `--check` is the action `check`.\n", flag.out);
  for (const action of ["check", "write"]) {
    const bare = run(CLI, "library", "catalogue", action);
    ok(`[MKT.SCRIPTS.112] \`${action}\` with no workspace prints its usage line and says a path is owed, with exit 2`,
      bare.code === 2 && bare.out === `usage: spn-apps library catalogue ${action} <workspace>\n\`library catalogue ${action}\` needs a path.\n`, bare.out);
    const option = run(CLI, "library", "catalogue", action, root, "--json");
    ok(`[MKT.SCRIPTS.174] \`${action}\` refuses an option it does not take, with exit 2`, option.code === 2 && option.out.includes("does not take `--json`."), option.out);
    ok(`\`${action}\` refuses a second workspace with exit 2`, run(CLI, "library", "catalogue", action, root, root).code === 2);
  }
}

console.log("\n=== library catalogue command — a workspace of its own: `check` reports, and `write` writes");

{
  // A workspace with a support checkout that publishes one package and holds one private one, and
  // the folder of the marketplace checkout the table is written into.
  const workspace = mkdtempSync(join(tmpdir(), "catalogue-workspace-"));
  kept.push(workspace);
  const put = (path, body) => { mkdirSync(join(workspace, path, ".."), { recursive: true }); writeFileSync(join(workspace, path), body, "utf8"); };
  put("spn-support-ts/packages/utility/package.json", JSON.stringify({ name: "@spn/utility-ts", version: "1.2.3", description: "Shared helpers" }));
  put("spn-support-ts/packages/secret/package.json", JSON.stringify({ name: "@spn/secret", private: true }));
  const table = join(workspace, "spn-claude-marketplace", "packages", "plugin-spn-apps", "src", "refs", "support", "apps", "providers", "ts", "14-libraries.md");
  mkdirSync(join(table, ".."), { recursive: true });

  const looked = run(CLI, "library", "catalogue", "check", workspace);
  ok("[MKT.SCRIPTS.180] `check` says the table would be written, counts the published package alone, and exits 1",
    looked.code === 1 && looked.out.includes("would write") && looked.out.includes("1 package(s)"), looked.out);
  ok("[MKT.SCRIPTS.180] and `check` writes nothing", !existsSync(table));
  const wrote = run(CLI, "library", "catalogue", "write", workspace);
  ok("[MKT.SCRIPTS.180] known-bad: the same words with `write` write the table, and exit 0", wrote.code === 0 && wrote.out.includes("wrote") && existsSync(table), wrote.out);
  const text = readFileSync(table, "utf8");
  ok("[MKT.SCRIPTS.180] the table names the published package with its version, and leaves the private one out",
    text.includes("| `@spn/utility-ts` | `1.2.3` | Shared helpers |") && !text.includes("@spn/secret"), text);
  ok("[MKT.SCRIPTS.180] the marker names the command that writes the table, with its action",
    text.includes("do not edit inside these markers; `spn-apps library catalogue write` writes it -->"), text.slice(0, 400));
  const again = run(CLI, "library", "catalogue", "check", workspace);
  ok("[MKT.SCRIPTS.180] after the write a `check` reads the table as current and exits 0", again.code === 0 && again.out.includes("current"), again.out);
}

console.log("\n=== library catalogue command — against the real workspace, `check` only");

{
  const workspace = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "..", "..", "..");
  const { out, code } = run(CLI, "library", "catalogue", "check", workspace);
  ok("finds the sibling support checkout and reports current or would-write, never a crash",
     code === 0 || code === 1, out);
  ok("names the count of packages, one way or the other", /\d+ package\(s\)/.test(out), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — library catalogue command` : `\n  all ${total} passed — library catalogue command`);
process.exit(failed ? 1 : 0);
