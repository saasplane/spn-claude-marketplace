import { CHECKS } from "../../../helpers/harness.mjs";
// `checks/long-run.ts` — a `pnpm test`, `pnpm run build`, `pnpm run build:plugins`,
// `spnutils workspace agent-sync`, `spnutils apps check`, `spnutils apps test` or `spnutils apps
// release` typed in the foreground gets a note: run it in the background and carry on. It never
// refuses — only a `note`, never a `deny` — and a leading `cd <dir> &&` is stripped before the
// command is read against the list.
import { join } from "node:path";

const { LONG_COMMANDS, afterCd, applies, checkLongRun, longCommand } = await import(join(CHECKS, "long-run.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const bash = (command, run_in_background) => ({ tool_name: "Bash", tool_input: { command, run_in_background } });
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== a long command in the foreground gets a note, and carries on");
for (const command of LONG_COMMANDS) {
  const verdict = checkLongRun(bash(command));
  ok(`[MKT.HOOKS.53] \`${command}\` in the foreground gets a note`, verdictOf(verdict) === "note", JSON.stringify(verdict));
  ok(`[MKT.HOOKS.53] the note says to run it in the background`, (verdict?.note ?? "").includes("background shell"), verdict?.note);
}

console.log("\n=== what the note leaves alone");
{
  ok("[MKT.HOOKS.54] the same command run_in_background:true gets no verdict",
    checkLongRun(bash("pnpm test", true)) === null);
  ok("[MKT.HOOKS.54] a command that only contains the words gets no verdict",
    checkLongRun(bash("echo pnpm test")) === null);
  ok("[MKT.HOOKS.54] a longer target with the same prefix gets no verdict",
    checkLongRun(bash("pnpm test:unit")) === null);
  ok("[MKT.HOOKS.54] a longer group with the same prefix gets no verdict",
    checkLongRun(bash("spnutils apps testing")) === null);
  ok("[MKT.HOOKS.54] an unrelated command gets no verdict", checkLongRun(bash("ls -la")) === null);
  ok("[MKT.HOOKS.54] a non-Bash call gets no verdict",
    checkLongRun({ tool_name: "Edit", tool_input: { command: "pnpm test" } }) === null);
  ok("[MKT.HOOKS.54] a payload with no command gets no verdict", checkLongRun({ tool_name: "Bash", tool_input: {} }) === null);
}

console.log("\n=== a leading `cd <dir> &&` is stripped before the command is read");
{
  ok("[MKT.HOOKS.53] `cd spn-x && pnpm run build` is read as `pnpm run build`",
    longCommand("cd spn-x && pnpm run build") === "pnpm run build");
  ok("[MKT.HOOKS.53] a quoted directory is read the same way",
    longCommand("cd 'spn x' && spnutils apps test unit api") === "spnutils apps test");
  ok("[MKT.HOOKS.53] `afterCd` strips only the `cd … &&` prefix",
    afterCd("cd spn-x && pnpm test") === "pnpm test");
  ok("[MKT.HOOKS.54] a command with no leading `cd` is read as it stands",
    afterCd("pnpm test") === "pnpm test");
  ok("[MKT.HOOKS.54] a `cd` joined by `;` rather than `&&` is not stripped",
    longCommand("cd spn-x; pnpm test") === null);
}

console.log("\n=== the dispatcher's fast path");
{
  ok("[MKT.HOOKS.53] `applies` is true for a long command", applies("", "pnpm run build:plugins") === true);
  ok("[MKT.HOOKS.54] `applies` is false for anything else", applies("", "git status") === false);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — long-run` : `\n  all ${total} passed — long-run`);
process.exit(failed ? 1 : 0);
