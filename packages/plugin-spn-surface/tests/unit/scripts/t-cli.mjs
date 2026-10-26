// `cli.ts` — the one entry: `<group> [<subject>] <action> [<path>…] [options]`.
//
// THIS SUITE OWNS THE ENTRY ALONE. The plugin ships no command today, so the door is proven by what it
// says when it holds none: `help` prints the grammar under the plugin's own name and lists nothing, and
// an unknown group is refused by name. The entry is the same text spn-devex and spn-apps ship.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

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

console.log("=== cli — help holds no command");
{
  const { out, code } = run("help");
  ok("exits clean", code === 0, out);
  ok("states the grammar with the plugin's own name", out.includes("`spn-surface <group> [<subject>] <action> [<path>…] [options]`"), out);
  ok("with no word at all the entry prints the same reading", run().out === out && run().code === 0, run().out);
}
{
  const { out, code } = run("help", "--json");
  let parsed;
  try { parsed = JSON.parse(out); } catch { parsed = null; }
  ok("--json exits clean and names the plugin", code === 0 && parsed?.plugin === "spn-surface", out);
  ok("--json lists no command", Array.isArray(parsed?.commands) && parsed.commands.length === 0, out);
}

console.log("\n=== cli — unknown names, refused by name");
{
  const { out, code } = run("nope", "nope");
  ok("an unknown group exits 2", code === 2, out);
  ok("names what was asked for, and that none is shipped", out.includes("unknown group `nope`") && out.includes("(none shipped)"), out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — cli` : `\n  all ${total} passed — cli`);
process.exit(failed ? 1 : 0);
