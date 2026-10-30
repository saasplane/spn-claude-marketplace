// `refs/devex/agent/way.md` — the one index every window carries: the SaaS Plane way, one line for each
// principle, and the ask router, one line for each kind of ask (RULE.DEVEX.AGENT.102). Everything else is
// read on demand, so this index is what a window pays for at its start, and it must stay small.
//
// THE LIMIT IS A BUILD FAILURE, NOT A WARNING. Twenty-one lens files loaded at once would crowd the
// context and blur every answer, and an index that grows a line at a time becomes that load without
// anyone deciding it. Tokens are estimated as characters ÷ 3.5, rounded up: no tokenizer ships with the
// plugin, English markdown runs at about four characters a token, and the lower divisor errs high, so
// an index this test passes is under the limit by any count.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const WAY = join(PLUGIN, "src", "refs", "devex", "agent", "way.md");
const ORIENTATION = join(PLUGIN, "src", "scripts", "events", "orientation.ts");
const LIMIT = 2000;
const tokens = (text) => Math.ceil(text.length / 3.5);

let total = 0, failed = 0;
const check = (label, ok, detail = "") => {
  total += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
};

const text = readFileSync(WAY, "utf8");
const loaded = text.replace(/<!--[\s\S]*?-->\s*/g, "").trim();

console.log("=== the index every window carries stays small, and holds the way and the router whole");
check(`the index is under ${LIMIT} tokens (${tokens(loaded)}, estimated)`, tokens(loaded) < LIMIT);
const principles = [...loaded.matchAll(/^(\d+)\. \*\*.+\*\*/gm)].map((found) => Number(found[1]));
check("the way has its seventeen principles, numbered in order, one line each",
  principles.length === 17 && principles.every((n, index) => n === index + 1), `got ${principles.join(", ")}`);
const asks = [...loaded.matchAll(/^- (.+) → `([A-Z_]+)`$/gm)];
check("the router has one line for each of the book's twenty-four kinds of ask", asks.length === 24, `got ${asks.length}`);
check("no kind of ask appears twice, so each has exactly one owner",
  new Set(asks.map((found) => found[1])).size === asks.length);

console.log("\n=== the session-start hook carries the index, and nothing more of the lenses");
const base = mkdtempSync(join(tmpdir(), "t-way-"));
try {
  mkdirSync(join(base, ".spndevex"), { recursive: true });
  writeFileSync(join(base, ".spndevex", "README.md"), "state\n");
  const out = execFileSync("node", [ORIENTATION, "--stdin"], {
    input: JSON.stringify({ cwd: base, session_id: "t-way" }), encoding: "utf8", cwd: base,
    env: { ...process.env, SPN_TELEMETRY: "off" }, maxBuffer: 16 * 1024 * 1024 });
  const parsed = JSON.parse(out);
  const context = parsed.hookSpecificOutput.additionalContext;
  const at = context.indexOf("## The SaaS Plane way, and the ask router");
  check("the agent's context holds the index", at > 0);
  check("the index stands before the short rules, so their count is unchanged",
    at > 0 && at < context.indexOf("## The short rules"));
  check("the developer's pane does not show it", !parsed.systemMessage.includes("The SaaS Plane way, and the ask router"));
  check("no lens file is loaded at the start of a window",
    !/^## Asks it owns$/m.test(context) && !/^\*\*Consumer first:\*\*/m.test(context));
  check("the restates block is not carried into the window", !context.includes("spn:restates"));
} finally {
  rmSync(base, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — way` : `\n  all ${total} passed — way`);
process.exit(failed ? 1 : 0);
