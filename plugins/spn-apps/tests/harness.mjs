// The harness the six `spn-apps` ports are tested through.
//
// EVERY CASE RUNS BOTH IMPLEMENTATIONS ON THE SAME EVENT. The Python is the incumbent and the test
// is parity, so a case states what it expects AND whether the two must agree — a divergence is only
// allowed where it is named, with its reason, the way F5 and F11 were in the core port.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
export const SCRIPTS = resolve(HOOKS, "scripts");
export const CHECKS = resolve(HOOKS, "src", "scripts", "checks");

// CHECKS ARE FILED BY SUBJECT — `contract/`, `src/`, `tests/` — because a rule belongs with the
// thing it rules on. A case names the check and not its folder, so the folder is FOUND rather than
// typed: a check that moves between subjects then breaks no test, and a case stays about the rule.
const SUBJECTS = ["contract", "src", "tests"];
export const checkPath = (script) => {
  for (const subject of SUBJECTS) {
    const candidate = resolve(CHECKS, subject, `${script}.ts`);
    if (existsSync(candidate)) return candidate;
  }
  // Reported as the path a reader would have expected, so the failure names the missing file
  // rather than an empty string.
  return resolve(CHECKS, `${script}.ts`);
};

// THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GOING AWAY. Until the plugin reinstall
// deletes `hooks/scripts/`, every case runs both implementations and requires them to agree. After
// that the Python is not there to run, and each case still asserts what the port itself must decide
// — which is the half that outlives the port.
export const hasPython = (script) => existsSync(resolve(SCRIPTS, `${script}.py`));

const kept = [];
process.on("exit", () => { for (const d of kept) rmSync(d, { recursive: true, force: true }); });

/** A throwaway tree. `files` is path → text, relative to its root. */
export function tree(files) {
  const root = mkdtempSync(join(tmpdir(), "apps-check-"));
  kept.push(root);
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, "utf8");
  }
  return root;
}

function once(cmd, args, payload, cwd) {
  try {
    return execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8", cwd,
      stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (error) {
    return `${String(error.stdout ?? "")}${String(error.stderr ?? "")}`.trim();
  }
}

/** What a run decided: "deny", "note", or "" for silence. */
function decision(out) {
  if (!out) return "";
  let parsed;
  try { parsed = JSON.parse(out); } catch { return `UNPARSEABLE: ${out.slice(0, 200)}`; }
  const specific = parsed.hookSpecificOutput ?? {};
  if (specific.permissionDecision === "deny") return "deny";
  if (parsed.systemMessage || specific.additionalContext) return "note";
  return "";
}

function reason(out) {
  try {
    const parsed = JSON.parse(out);
    return parsed.hookSpecificOutput?.permissionDecisionReason
        ?? parsed.systemMessage ?? parsed.hookSpecificOutput?.additionalContext ?? "";
  } catch { return out; }
}

let total = 0, failed = 0;

/**
 * One case.
 *
 * `script` is the basename without extension. `expect` is "deny" | "note" | "" (silent).
 * `parity: false` names a deliberate divergence and requires `why`.
 */
export function one(label, { script, args = [], root, input, expect, says, parity = true, why = "" }) {
  total += 1;
  const payload = { tool_name: input.content !== undefined ? "Write" : "Edit", tool_input: input, cwd: root };
  const parityRuns = parity && hasPython(script);
  const py = parityRuns ? once("python3", [`${SCRIPTS}/${script}.py`, ...args, "--stdin"], payload, root) : "";
  const ts = once("node", [checkPath(script), ...args, "--stdin"], payload, root);
  const tsSaid = decision(ts), pySaid = decision(py);
  const saysOk = !says || reason(ts).includes(says);
  const ok = tsSaid === expect && saysOk && (!parityRuns || tsSaid === pySaid);
  if (!ok) failed += 1;
  const show = (d) => d || "silent";
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  const against = parityRuns ? ` · py ${show(pySaid)}`
    : parity ? " · py not installed — the port stands alone" : ` (parity waived: ${why})`;
  console.log(`        expect ${show(expect)} · ts ${show(tsSaid)}${against}` +
    `${says ? ` · names "${says}" ${saysOk}` : ""}`);
  if (!ok) {
    console.log(`        ts: ${reason(ts).slice(0, 300)}`);
    console.log(`        py: ${reason(py).slice(0, 300)}`);
  }
}

export function done(name) {
  console.log(failed ? `\n  ${failed} of ${total} FAILED — ${name}` : `\n  all ${total} passed — ${name}`);
  process.exit(failed ? 1 : 0);
}
