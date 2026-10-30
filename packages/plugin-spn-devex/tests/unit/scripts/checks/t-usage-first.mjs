// `checks/usage-first.ts` — the first writing call of a `spnutils` or `spn-devex` command group in a window is refused
// until the group has been run bare, or with `--help`, and its usage read. The reading is recorded in the window's note
// (`lib/window.ts`), so it is asked for once for each group.
import { join } from "node:path";
import { CHECKS, LIB } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkUsageFirst } = await import(join(CHECKS, "usage-first.ts"));
const { readWindow } = await import(join(LIB, "window.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const call = (root, session, command) => ({ tool_name: "Bash", cwd: root, session_id: session, tool_input: { command } });

console.log("=== a first write with no usage read is refused");
{
  const root = workspace("usage-first-a");
  const refused = checkUsageFirst(call(root, "w1", "spn-devex workstream arc edit 036/N006 --status DECIDED"));
  ok("[MKT.HOOKS.128] the first write of a group is refused, naming the bare call", refused?.deny?.includes("spn-devex workstream") === true && refused.deny.includes("bare"), JSON.stringify(refused));
  const again = checkUsageFirst(call(root, "w1", "spn-devex workstream row note 036/N006/3 --note x"));
  ok("[MKT.HOOKS.128] a second write is refused too, since nothing was read", again?.deny !== undefined, JSON.stringify(again));
  const spnutils = checkUsageFirst(call(root, "w1", "spnutils workspace agent-sync"));
  ok("[MKT.HOOKS.128] a write of a spnutils group is refused the same way", spnutils?.deny?.includes("spnutils workspace") === true, JSON.stringify(spnutils));
}

console.log("\n=== after a bare or --help call it passes");
{
  const root = workspace("usage-first-b");
  ok("[MKT.HOOKS.129] a bare call of the group passes", checkUsageFirst(call(root, "w2", "spn-devex workstream")) === null);
  ok("[MKT.HOOKS.129] the reading is recorded in the window's note", readWindow(root, "w2").usage?.["spn-devex workstream"] !== undefined, JSON.stringify(readWindow(root, "w2")));
  ok("[MKT.HOOKS.129] a write of that group then passes", checkUsageFirst(call(root, "w2", "spn-devex workstream arc edit 036/N006 --status DECIDED")) === null);
  ok("[MKT.HOOKS.129] another group still asks for its own reading", checkUsageFirst(call(root, "w2", "spn-devex docs cycles write x"))?.deny !== undefined);
  ok("[MKT.HOOKS.129] a --help call of a group counts as the reading", checkUsageFirst(call(root, "w2", "spn-devex docs --help")) === null
    && checkUsageFirst(call(root, "w2", "spn-devex docs cycles write x")) === null);
  ok("[MKT.HOOKS.129] another window has read nothing", checkUsageFirst(call(root, "w3", "spn-devex workstream arc edit 036/N006 --status DECIDED"))?.deny !== undefined);
  ok("[MKT.HOOKS.129] a reading call such as `show` passes with no usage read", checkUsageFirst(call(root, "w4", "spn-devex workstream status")) === null);
  ok("[MKT.HOOKS.129] a command of another program passes", checkUsageFirst(call(root, "w4", "git commit -m x")) === null);
  ok("[MKT.HOOKS.129] a call with no session id passes", checkUsageFirst(call(root, undefined, "spn-devex workstream arc edit x")) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — usage first` : `\n  all ${total} passed — usage first`);
process.exit(failed ? 1 : 0);
