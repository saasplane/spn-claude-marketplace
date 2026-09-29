// `cli.ts` — the one entry, `<group> <action> [args] [--json]`, dispatching to `commands/<group>/<action>.ts`.
//
// THIS SUITE OWNS THE DISPATCHER ALONE. What a command does once reached is that command's own
// suite; this file only proves the door — discovery, help, `--json`, and an unknown name.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI = resolve(import.meta.dirname, "..", "..", "..", "src", "scripts", "cli.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

function run(...args) {
  try {
    return { out: execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

console.log("=== cli — discovery and help");

{
  const { out, code } = run("help");
  ok("exits clean", code === 0, out);
  ok("names the plugin in every line", out.includes("spn-apps coverage check") && out.includes("spn-apps library catalogue"), out);
  ok("never a bare command with no plugin named", !/^\s*coverage check/m.test(out), out);
}

{
  const { out, code } = run("help", "--json");
  ok("exits clean", code === 0, out);
  let parsed;
  try { parsed = JSON.parse(out); } catch { parsed = null; }
  ok("is a JSON array", Array.isArray(parsed), out);
  ok("lists every action as data, describe included", parsed?.some((e) => e.group === "coverage" && e.action === "check" && e.describe.length > 0), out);
  ok("carries exactly the commands folder holds — two", parsed?.length === 2, out);
}

{
  // A BARE INVOCATION IS NOT THE SAME AS ASKING FOR HELP. Both print the list; only `help` says so
  // on purpose, so only `help` exits clean.
  const { out, code } = run();
  ok("no group at all still prints the list", out.includes("spn-apps <group> <action>"), out);
  ok("but is not success — nothing was asked for", code === 1, out);
}

console.log("\n=== cli — unknown names, refused with the list");

{
  const { out, code } = run("nope", "nope");
  ok("an unknown group/action pair is non-zero", code === 2, out);
  ok('names what was asked for', out.includes('no command "nope nope"'), out);
  ok("and still prints the list, so the caller can read the real names", out.includes("spn-apps library catalogue"), out);
}

{
  const { out, code } = run("coverage");
  ok("a group with no action is non-zero", code === 2, out);
  ok("says an action is owed", out.includes('"coverage" needs an action'), out);
}

console.log("\n=== cli — a real dispatch reaches the command");

{
  const root = mkdtempSync(join(tmpdir(), "cli-dispatch-"));
  const { out, code } = run("library", "catalogue", root);
  ok("dispatch runs the command's own run(), not a copy of its logic",
     out.includes("no support checkout here"), out);
  ok("and its exit code is the command's own", code === 0, out);
  rmSync(root, { recursive: true, force: true });
}

{
  // --json PASSES THROUGH THE DISPATCHER, NEVER TO A COMMAND. None of this plugin's commands take
  // it, so a run naming it after a real group/action must behave exactly as the same call without it.
  const root = mkdtempSync(join(tmpdir(), "cli-dispatch-"));
  const plain = run("library", "catalogue", root);
  const withJson = run("library", "catalogue", root, "--json");
  ok("--json is stripped before a command ever sees argv", plain.out === withJson.out && plain.code === withJson.code,
     `plain: ${plain.out}\nwithJson: ${withJson.out}`);
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cli` : `\n  all ${total} passed — cli`);
process.exit(failed ? 1 : 0);
