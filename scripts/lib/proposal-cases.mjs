// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A plugins release that changes the ideate skill, the panel or the card grammar runs the fixed proposal cases first (RULE.DEVEX.AGENT.169)
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The fixed proposal cases: a check can prove a card is whole, never that its options are good, so the agent's judgment is proved the way a
// model is, on fixed cases. Each case is run by a fresh, non-interactive agent session that sees only the problem and its nearest
// constructs, and passes when its final text matches every `expect` pattern and none of its `refuse` patterns. The session runner is
// handed in, so the matching can be proved without a model.

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The plugin sources whose change in a release makes the cases run (RULE.DEVEX.AGENT.169). */
export const TRIGGER_PATHS = [
  /^packages\/plugin-spn-devex\/src\/skills\/ideate\//,
  /^packages\/plugin-spn-devex\/src\/agents\/spn-panel\.md$/,
  /^packages\/plugin-spn-devex\/src\/refs\/devex\/workspace\/docs\/decision-cards\.md$/,
];

/** Whether any changed path is one the cases guard. */
export const touchesProposalSurface = (paths) => paths.some((path) => TRIGGER_PATHS.some((pattern) => pattern.test(path)));

/** Every case in a folder, by file name. A case that does not read is a fault of the folder, not a skipped case. */
export function loadCases(dir) {
  return readdirSync(dir).filter((name) => name.endsWith(".json")).sort().map((name) => {
    const one = JSON.parse(readFileSync(join(dir, name), "utf8"));
    for (const field of ["id", "problem"]) if (typeof one[field] !== "string" || !one[field].trim()) throw new Error(`${name} has no \`${field}\``);
    if (!Array.isArray(one.expect) || !one.expect.length) throw new Error(`${name} has no \`expect\` patterns`);
    return { refuse: [], nearest: [], ...one };
  });
}

/** The prompt a fresh session gets: the case's problem and its nearest constructs, and nothing of the agent's own working. */
export function promptOf(one) {
  return [
    "The problem", one.problem, "",
    ...(one.nearest.length ? ["The nearest constructs", ...one.nearest.map((line) => `- ${line}`), ""] : []),
    one.ask ?? "Say what you would build and where it would live. Do not write code.",
  ].join("\n");
}

/** Whether a final text passes a case: every `expect` pattern matches and no `refuse` pattern does. Returns the failures, empty when it passes. */
export function judge(one, text) {
  const failures = [];
  for (const pattern of one.expect) if (!new RegExp(pattern, "i").test(text)) failures.push(`the answer does not match \`${pattern}\``);
  for (const pattern of one.refuse) if (new RegExp(pattern, "i").test(text)) failures.push(`the answer matches \`${pattern}\`, which the case refuses`);
  return failures;
}

/** The final text of a `--output-format stream-json` run: the result event's text, else the last assistant message's text blocks. */
export function finalTextOf(stream) {
  let result = null;
  let last = "";
  for (const raw of stream.split("\n")) {
    if (!raw.trim()) continue;
    let event;
    try { event = JSON.parse(raw); } catch { continue; }
    if (event.type === "result" && typeof event.result === "string") result = event.result;
    if (event.type === "assistant") {
      const text = (event.message?.content ?? []).filter((part) => part.type === "text").map((part) => part.text).join("\n");
      if (text) last = text;
    }
  }
  return result ?? last;
}

/**
 * Every assistant message of a run, in order. A Stop hook can make the agent rewrite one line after its answer, which
 * leaves that line as the final text, so a case is judged on the whole answer: what it must say, and what it must not.
 */
export function answerOf(stream) {
  const texts = [];
  for (const raw of stream.split("\n")) {
    if (!raw.trim()) continue;
    let event;
    try { event = JSON.parse(raw); } catch { continue; }
    if (event.type !== "assistant") continue;
    const text = (event.message?.content ?? []).filter((part) => part.type === "text").map((part) => part.text).join("\n");
    if (text) texts.push(text);
  }
  return texts.length ? texts.join("\n\n") : finalTextOf(stream);
}

/**
 * The real session runner: one fresh `claude -p` per case, in plan mode with prompts denied and nothing kept, run from the workspace
 * root (the shape the fresh-window proof uses). Returns the stream it printed.
 */
export function claudeSession(prompt, cwd) {
  const out = spawnSync("claude", ["-p", prompt, "--permission-mode", "plan", "--permission-prompts", "none", "--output-format", "stream-json", "--verbose",
    "--no-session-persistence", "--model", "opus", "--effort", "high"], { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (out.error) throw out.error;
  return out.stdout;
}

/** Runs every case through `session(prompt)` and returns each one's verdict. A session that throws fails its case, naming why. */
export function runCases(cases, session) {
  return cases.map((one) => {
    let text = "";
    try { text = answerOf(session(promptOf(one))); } catch (error) { return { id: one.id, passed: false, failures: [`the session did not run: ${error.message}`], text }; }
    const failures = judge(one, text);
    return { id: one.id, passed: failures.length === 0, failures, text };
  });
}
