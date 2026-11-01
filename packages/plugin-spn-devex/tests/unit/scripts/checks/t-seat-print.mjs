// `checks/seat-print.ts` — a command that would print a value from the seat file is refused.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkSeatPrint } = await import(join(CHECKS, "seat-print.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const bash = (command) => ({ tool_name: "Bash", cwd: "/w", tool_input: { command } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== commands that print the seat file");
for (const command of ["cat ~/.spnenv", "head -5 $HOME/.spnenv", "grep TOKEN ~/.spnenv", "sed -n '1,9p' ~/.spnenv", "echo $(<~/.spnenv)", "tail -n 3 /Users/x/.spnenv"]) {
  const verdict = checkSeatPrint(bash(command));
  ok(`[MKT.HOOKS.390] \`${command}\` is refused, naming the door`, kind(verdict) === "deny" && verdict.deny.includes("spnutils workspace env show"), JSON.stringify(verdict));
}

console.log("\n=== commands it leaves alone");
for (const command of ["sed -i '' 's/A=1/A=2/' ~/.spnenv", "grep -q TOKEN ~/.spnenv", "grep -c = ~/.spnenv", "cut -d= -f1 ~/.spnenv"])
  ok(`[MKT.HOOKS.390] \`${command}\` prints no value`, kind(checkSeatPrint(bash(command))) === "silent");
ok("[MKT.HOOKS.390] the door itself passes", kind(checkSeatPrint(bash("spnutils workspace env show"))) === "silent");
ok("[MKT.HOOKS.390] a call that does not name the file is not read", applies("cat README.md") === false);
ok("[MKT.HOOKS.390] a tool that is not Bash is not read", kind(checkSeatPrint({ tool_name: "Write", tool_input: { command: "cat ~/.spnenv" } })) === "silent");

console.log(failed ? `\n  ${failed} of ${total} FAILED — seat print` : `\n  all ${total} passed — seat print`);
process.exit(failed ? 1 : 0);
