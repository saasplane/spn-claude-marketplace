// `checks/process-list.ts` — `pgrep -f` and `ps` with `-f` or `-ww` print every process's command line, and are
// refused, naming `pgrep -l` and `lsof`. [MKT.HOOKS.388]
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkProcessList } = await import(join(CHECKS, "process-list.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const bash = (command) => ({ tool_name: "Bash", cwd: "/tmp", tool_input: { command } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== listings that print the command line");
for (const command of ["pgrep -f vite", "pgrep -fl node", "pgrep -af server", "ps -ef", "ps -f -p 123", "ps -ww -p 123", "ps auxww", "ps aux | grep node && pgrep -f x", "sudo ps -ef"]) {
  const verdict = checkProcessList(bash(command));
  ok(`[MKT.HOOKS.388] \`${command}\` is refused, naming pgrep -l and lsof`,
    kind(verdict) === "deny" && verdict.deny.includes("pgrep -l") && verdict.deny.includes("lsof"), JSON.stringify(verdict));
}

console.log("\n=== listings it lets through");
for (const command of ["pgrep -l vite", "pgrep vite", "ps -p 123", "ps aux", "ps -o pid,comm", "lsof -i :3000", "echo \"pgrep -f is refused\"", "grep -f patterns.txt file"])
  ok(`[MKT.HOOKS.388] \`${command}\` passes`, kind(checkProcessList(bash(command))) === "silent");
ok("[MKT.HOOKS.388] a tool that is not Bash is not read", kind(checkProcessList({ tool_name: "Write", tool_input: { command: "pgrep -f x" } })) === "silent");

console.log("\n=== the fast path");
ok("a command naming pgrep or ps applies", applies("", "pgrep -f x") && applies("", "cd a && ps -ef"));
ok("a command that names neither does not", !applies("", "git status") && !applies("", "echo jobs") && !applies("", "cat maps.txt"));

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
