// `cli.ts` — the one entry: `<group> [<subject>] <action> [<path>…] [options]`.
//
// THIS SUITE OWNS THE ENTRY ALONE. What a command does once reached is that command's own suite;
// this file proves the door: the discovery, `help`, a refusal by name, and a real dispatch. The
// entry is the same text spn-devex ships, and that plugin's suite proves the refusals of a subject.
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
    return { out: execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

console.log("=== cli — discovery and help");

{
  const { out, code } = run("help");
  ok("exits clean", code === 0, out);
  ok("states the grammar with the plugin's own name", out.includes("`spn-apps <group> [<subject>] <action> [<path>…] [options]`"), out);
  ok("prints one line for each action, as its words", /^  coverage check /m.test(out) && /^  library catalogue /m.test(out), out);
  ok("with no word at all the entry prints the same reading, and exits clean", run().out === out && run().code === 0, run().out);
}

{
  const { out, code } = run("help", "--json");
  ok("exits clean", code === 0, out);
  let parsed;
  try { parsed = JSON.parse(out); } catch { parsed = null; }
  ok("is data that names the plugin", parsed?.plugin === "spn-apps" && Array.isArray(parsed?.commands), out);
  ok("lists every action with its describe", parsed?.commands.some((listed) => listed.group === "coverage" && listed.action === "check" && listed.describe.length > 0), out);
  ok("each as group, subject, action, command and describe",
    parsed?.commands.every((listed) => Object.keys(listed).join(",") === "group,subject,action,command,describe"), out);
  ok("a command of two words has a null subject",
    parsed?.commands.find((listed) => listed.command === "coverage check")?.subject === null, out);
  ok("names no command the `commands/` folder does not hold", parsed?.commands.every((listed) => ["coverage", "library"].includes(listed.group)), out);
}

console.log("\n=== cli — unknown names, refused by name");

{
  const { out, code } = run("nope", "nope");
  ok("an unknown group exits 2", code === 2, out);
  ok("names what was asked for, and the real groups", out.includes("unknown group `nope`") && out.includes("coverage") && out.includes("library"), out);
}

{
  const { out, code } = run("coverage", "nope");
  ok("an unknown command of a real group exits 2", code === 2, out);
  ok("names what was asked for, and what the group holds", out.includes("unknown command `coverage nope`") && out.includes("check"), out);
}

{
  const { out, code } = run("coverage");
  ok("a group with no further word exits 2", code === 2, out);
  ok("and names what the group holds", out.includes("`coverage` holds: check"), out);
}

console.log("\n=== cli — a real dispatch reaches the command");

{
  const root = mkdtempSync(join(tmpdir(), "cli-dispatch-"));
  const { out, code } = run("library", "catalogue", "check", root);
  ok("dispatch runs the command's own run(), not a copy of its logic",
     out.includes("no support checkout here"), out);
  ok("and its exit code is the command's own", code === 0, out);
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cli` : `\n  all ${total} passed — cli`);
process.exit(failed ? 1 : 0);
