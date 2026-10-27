import { CHECKS, EVENTS } from "../../../helpers/harness.mjs";
// `checks/output-size.ts` — a command whose output passed 10 KB is answered with the narrowed form to use
// next time. A note for the agent alone, since the call has run; silent under the line and on a failure.
import { join } from "node:path";

const { checkOutputSize, outputBytes } = await import(join(CHECKS, "output-size.ts"));
const { rebasedNote } = await import(join(EVENTS, "rebased.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 500)}` : ""}`);
};

const bash = (response, extra = {}) => ({ tool_name: "Bash", tool_input: { command: "git log" }, tool_response: response, hook_event_name: "PostToolUse", cwd: "/tmp", session_id: "w1", ...extra });

console.log("=== answered: output over 10 KB");
{
  const verdict = checkOutputSize(bash({ stdout: "x".repeat(11 * 1024), stderr: "" }));
  ok("a command that printed over 10 KB is answered", Boolean(verdict?.note) && !verdict?.deny, JSON.stringify(verdict));
  ok("the note names the narrowed form: a file, then the part needed", /written to a file/.test(verdict?.note ?? "") && /offset/.test(verdict?.note ?? ""), verdict?.note);
  ok("standard error counts with standard output", Boolean(checkOutputSize(bash({ stdout: "x".repeat(6 * 1024), stderr: "y".repeat(6 * 1024) }))?.note));
  ok("a response given as text is measured the same way", Boolean(checkOutputSize(bash("x".repeat(11 * 1024)))?.note));
  ok("the post-tool hook hands the note over", Boolean(rebasedNote(bash({ stdout: "x".repeat(11 * 1024) }))?.includes("10 KB")));
}

console.log("\n=== silent");
{
  ok("output of exactly 10 KB is left alone", checkOutputSize(bash({ stdout: "x".repeat(10 * 1024), stderr: "" })) === null);
  ok("a short output is left alone", checkOutputSize(bash({ stdout: "ok\n", stderr: "" })) === null);
  ok("a failed call is not answered", checkOutputSize(bash({ stdout: "x".repeat(11 * 1024) }, { hook_event_name: "PostToolUseFailure" })) === null);
  ok("a tool that is not Bash is left alone", checkOutputSize(bash({ stdout: "x".repeat(11 * 1024) }, { tool_name: "Read" })) === null);
  ok("a response of no known shape counts nothing", outputBytes(undefined) === 0 && checkOutputSize(bash(undefined)) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-output-size` : `\n  all ${total} passed — t-output-size`);
process.exit(failed ? 1 : 0);
