// `checks/plugin-sync.ts` — plugins are installed and refreshed by `spnutils workspace agent-sync`, in this window.
// A raw `claude plugin install`, `update` or `marketplace update` is refused and names it.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { checkPluginSync } = await import(join(CHECKS, "plugin-sync.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });

console.log("=== each raw plugin command is refused");
for (const command of [
  "claude plugin install spn-devex@saasplane",
  "claude plugin update spn-devex",
  "claude plugin marketplace update saasplane",
  "git status && claude plugin install spn-apps@saasplane",
]) {
  const verdict = checkPluginSync(bash(command));
  ok(`[MKT.HOOKS.126] \`${command}\` is refused, naming agent-sync`, verdict?.deny?.includes("spnutils workspace agent-sync") === true, JSON.stringify(verdict));
}

console.log("\n=== what passes");
{
  ok("[MKT.HOOKS.126] agent-sync passes", checkPluginSync(bash("spnutils workspace agent-sync")) === null);
  ok("[MKT.HOOKS.126] listing plugins passes", checkPluginSync(bash("claude plugin list")) === null);
  ok("[MKT.HOOKS.126] a non-Bash call passes", checkPluginSync({ tool_name: "Read", tool_input: { command: "claude plugin install x" } }) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin sync` : `\n  all ${total} passed — plugin sync`);
process.exit(failed ? 1 : 0);
