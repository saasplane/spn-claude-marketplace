// One harness for every hook port: run the SAME payload through the Python script and the
// TypeScript port, and report both the expected verdict and whether the two agree.
//
// Parity is checked as well as the expectation, because a port that refuses the right thing for a
// different reason is still a port that drifted. Where the Python is deliberately not matched, the
// case says so with `parity: false` and names why.

import { execFileSync } from "node:child_process";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..", "..");
export const SCRIPTS = resolve(HOOKS, "scripts");
export const DOCS = resolve(HOOKS, "docs");

// THESE SUITES ARE A BUILDER'S GATE, and they say so rather than pretending otherwise. Several cases
// name real files in the surrounding workspace — a chapter, an approach page, this workstream's own
// arcs — because what they prove is that the check agrees with the incumbent ON THE CORPUS, and a
// corpus cannot be invented. A partner holds the plugin without the workspace and runs
// `partner-shape.ts` instead, which needs nothing but the plugin itself.
export const WORKSPACE = resolve(HOOKS, "..", "..", "..", "..");

// THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GOING AWAY. Until the plugin reinstall
// deletes `hooks/scripts/`, every case runs both implementations and requires them to agree. After
// that the Python is not there to run, and each case still asserts what the port itself must decide
// — which is the half that outlives the port.
const hasPython = (name) => existsSync(resolve(SCRIPTS, name));


export function run(cmd, args, payload, cwd) {
  try {
    const out = execFileSync(cmd, args, {
      input: JSON.stringify(payload), encoding: "utf8", cwd: cwd ?? process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch (e) {
    return `ERROR ${e.status}: ${String(e.stderr ?? e.message).slice(0, 400)}`;
  }
}

/** The verdict a raw stdout carries: "deny" · "note" · "silent" · "error". */
export function verdictOf(text) {
  if (!text) return "silent";
  if (text.startsWith("ERROR")) return `error(${text.slice(0, 200)})`;
  let parsed;
  try { parsed = JSON.parse(text.split("\n").filter(Boolean).at(-1)); }
  catch { return `unparsable(${text.slice(0, 120)})`; }
  const specific = parsed.hookSpecificOutput ?? {};
  if (specific.permissionDecision === "deny") return "deny";
  if (specific.additionalContext || parsed.systemMessage) return "note";
  return "silent";
}

export function reason(text) {
  try {
    const parsed = JSON.parse(text.split("\n").filter(Boolean).at(-1));
    const specific = parsed.hookSpecificOutput ?? {};
    return specific.permissionDecisionReason ?? specific.additionalContext ?? parsed.systemMessage ?? "";
  } catch { return text; }
}

/**
 * @param name        what is being ported
 * @param pyArgs      argv for the Python script, or null when there is nothing to compare against
 * @param tsFile      the TypeScript file, run by node
 * @param cases       [{ label, payload, expect, cwd?, parity? }]
 */
export function compare(name, pyArgs, tsFile, cases) {
  let failed = 0;
  // The incumbent runs only while it is installed. After the reinstall deletes `hooks/scripts/`
  // there is nothing to compare against, and each case still asserts its own expectation.
  const against = pyArgs && hasPython(pyArgs[0].replace("@/", "").replace("@", ""))
    ? pyArgs : null;
  console.log(`\n=== ${name}${pyArgs && !against ? " — py not installed; the port stands alone" : ""}`);
  for (const c of cases) {
    const tsOut = run("node", [`${DOCS}/${tsFile}`], c.payload, c.cwd);
    const ts = verdictOf(tsOut);
    const py = against ? verdictOf(run("python3", against.map((a) => a.replace("@", SCRIPTS)), c.payload, c.cwd)) : "—";
    const expected = ts === c.expect;
    const agrees = !against || c.parity === false || ts === py;
    const ok = expected && agrees;
    if (!ok) failed += 1;
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${c.label}\n` +
      `        expect ${c.expect} · ts ${ts} · py ${py}${c.parity === false ? " (parity waived: " + c.why + ")" : ""}`,
    );
    if (!ok) console.log(`        ts said: ${reason(tsOut).slice(0, 300)}`);
  }
  console.log(failed ? `  ${failed} FAILED` : `  all ${cases.length} passed`);
  return failed;
}
