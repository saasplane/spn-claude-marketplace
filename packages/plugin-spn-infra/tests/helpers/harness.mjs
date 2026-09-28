// The harness the `spn-infra` port is tested through.
//
// EVERY CASE RUNS BOTH IMPLEMENTATIONS ON THE SAME EVENT. The bash script is the incumbent and it
// is still on disk, so the test is parity: a case states what it expects AND requires the two to
// agree. A divergence is allowed only where the case names it and says why.
//
// This file is this plugin's own. A plugin carries its libraries; the other two have a harness of
// their own shape and neither is imported here.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// THE PLUGIN ROOT IS FOUND, NEVER COUNTED — the suites sit at many depths under `unit/`.
export const PLUGIN = resolve(import.meta.dirname, "..", "..");
const HOOKS = PLUGIN;
const TS = resolve(HOOKS, "src", "scripts", "events", "pretooluse.ts");
const SH = resolve(HOOKS, "src", "scripts", "events", "deny-estate-violations.sh");

/** Whether the incumbent is still here to compare against. It goes at the next plugin reinstall. */
export const hasBash = existsSync(SH);

function once(cmd, args, payload) {
  try {
    return execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (error) {
    return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim();
  }
}

/** What a run decided: "deny", or "" for silence. */
function decision(out) {
  if (!out) return "";
  let parsed;
  try { parsed = JSON.parse(out); } catch { return `UNPARSEABLE: ${out.slice(0, 200)}`; }
  return parsed.hookSpecificOutput?.permissionDecision === "deny" ? "deny" : "";
}

function reason(out) {
  try { return JSON.parse(out).hookSpecificOutput?.permissionDecisionReason ?? ""; }
  catch { return ""; }
}

let passed = 0;
const failures = [];

/**
 * One case. `expect` is "deny" or "" — `says` is a fragment the refusal must carry.
 * `diverges` names a reason the two implementations are allowed to disagree.
 */
export function one(title, { input, expect, says, diverges }) {
  const event = { session_id: "t", cwd: process.cwd(), tool_name: "Write", tool_input: input };
  const tsOut = once(process.execPath, [TS], event);
  const got = decision(tsOut);

  const problems = [];
  if (got !== expect) problems.push(`expected ${expect || "silence"}, got ${got || "silence"}`);
  if (expect === "deny" && says && !reason(tsOut).includes(says))
    problems.push(`refusal does not say "${says}" — it says "${reason(tsOut).slice(0, 120)}"`);

  // THE PARITY ARM. A port that changes what is refused is a different gate wearing the same name.
  if (hasBash && !diverges) {
    const shGot = decision(once("bash", [SH], event));
    if (shGot !== got) problems.push(`bash says ${shGot || "silence"} and the port says ${got || "silence"}`);
  }

  if (problems.length) failures.push(`${title}: ${problems.join("; ")}`);
  else passed += 1;
}

/**
 * The summary line, named for the suite that called it.
 *
 * **THE NAME IS THE CALLER'S, NEVER THIS FILE'S.** A hardcoded name meant every suite's summary
 * claimed to be the first one written — so a second suite's result read as the first suite's, and
 * a reader scanning the run could not tell which had actually passed.
 */
export function done(suite = "estate") {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  console.log(failures.length ? `${failures.length} failed, ${passed} passed` : `all ${passed} passed — ${suite}`);
  process.exit(failures.length ? 1 : 0);
}
